import type { ObservationDto, CategoryRefDto } from '../../types';
import type { SupabaseClient } from '../../db/supabase.client';
import type { Database } from '../../db/database.types';
import { z } from 'zod';

export const ListParamsSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  q: z.string().min(1).optional(),
  favorite: z.boolean().optional(),
  category_id: z.string().uuid().optional(),
  sort: z.enum(['observation_date', 'name', 'created_at']),
  order: z.enum(['asc', 'desc']),
});

export type ListParams = z.infer<typeof ListParamsSchema>;

// Type for the DB view `public.observations_read`
type ObservationReadRow = Database['public']['Views']['observations_read']['Row'];

export async function listObservations(
  params: ListParams,
  supabase: SupabaseClient
): Promise<{ items: ObservationDto[]; total: number }> {
  const { page, limit, q, favorite, category_id, sort, order } = params;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from('observations_read')
    .select(
      [
        'id',
        'slug',
        'name',
        'description',
        'observation_date',
        'is_favorite',
        'location_accuracy',
        'location_source',
        'lat',
        'lng',
        'category_id',
        'created_at',
        'updated_at',
      ].join(', '),
      { count: 'exact' }
    );

  if (typeof favorite === 'boolean') {
    query = query.eq('is_favorite', favorite);
  }
  if (category_id) {
    query = query.eq('category_id', category_id);
  }
  if (q) {
    query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
  }

  query = query.order(sort, { ascending: order === 'asc' });
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []) as unknown as ObservationReadRow[];
  const categoryIds = Array.from(new Set(rows.map((r) => r.category_id)));

  let categoriesMap = new Map<string, CategoryRefDto>();
  if (categoryIds.length) {
    const { data: cats, error: catErr } = await supabase
      .from('categories')
      .select('id, name, icon, color')
      .in('id', categoryIds);
    if (catErr) throw catErr;
    categoriesMap = new Map((cats ?? []).map((c) => [c.id, c as CategoryRefDto]));
  }

  const items: ObservationDto[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    observation_date: r.observation_date,
    is_favorite: r.is_favorite,
    category: categoriesMap.get(r.category_id) as ObservationDto['category'],
    location: {
      lat: r.lat,
      lng: r.lng,
      accuracy: r.location_accuracy,
      source: r.location_source,
    },
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return { items, total: count ?? 0 };
}

/**
 * Get a single observation by ID
 * @param id - Observation UUID
 * @param supabase - Supabase client instance
 * @returns Observation or null if not found
 */
export async function getObservationById(id: string, supabase: SupabaseClient): Promise<ObservationDto | null> {
  const { data, error } = await supabase
    .from('observations_read')
    .select(
      [
        'id',
        'slug',
        'name',
        'description',
        'observation_date',
        'is_favorite',
        'location_accuracy',
        'location_source',
        'lat',
        'lng',
        'category_id',
        'created_at',
        'updated_at',
      ].join(', ')
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }

  const row = data as unknown as ObservationReadRow;

  // Fetch category
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('id, name, icon, color')
    .eq('id', row.category_id)
    .single();

  if (catErr) throw catErr;

  const observation: ObservationDto = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    observation_date: row.observation_date,
    is_favorite: row.is_favorite,
    category: category as CategoryRefDto,
    location: {
      lat: row.lat,
      lng: row.lng,
      accuracy: row.location_accuracy,
      source: row.location_source,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return observation;
}

/**
 * Create a new observation
 * @param userId - User UUID from auth context
 * @param command - Observation creation data
 * @param supabase - Supabase client instance
 * @returns Created observation
 */
export async function createObservation(
  userId: string,
  command: {
    name: string;
    description?: string | null;
    category_id: string;
    observation_date: string;
    location: { lat: number; lng: number };
    location_source?: string | null;
    location_accuracy?: number | null;
    is_favorite?: boolean;
  },
  supabase: SupabaseClient
): Promise<ObservationDto> {
  // Ensure the user has a profile record (foreign key requirement)
  const { data: existingProfile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  if (!existingProfile) {
    const { error: insertProfileError } = await supabase.from('profiles').insert({ id: userId });

    if (insertProfileError && insertProfileError.code !== '23505') {
      throw insertProfileError;
    }
  }

  // Insert observation with PostGIS geometry
  // Note: We use a raw SQL query to handle ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  // The slug will be auto-generated by the DB trigger
  const { data, error } = await supabase
    .from('observations')
    .insert({
      user_id: userId,
      name: command.name,
      slug: '', // Will be auto-generated by DB trigger
      description: command.description ?? null,
      category_id: command.category_id,
      observation_date: command.observation_date,
      // PostGIS expects WKT format: SRID=4326;POINT(lng lat)
      location: `SRID=4326;POINT(${command.location.lng} ${command.location.lat})` as any,
      location_source: command.location_source ?? null,
      location_accuracy: command.location_accuracy ?? null,
      is_favorite: command.is_favorite ?? false,
    } as any)
    .select('id')
    .single();

  if (error) throw error;

  // Fetch the created observation with full details
  const createdId = data.id;
  const observation = await getObservationById(createdId, supabase);

  if (!observation) {
    throw new Error('Failed to fetch created observation');
  }

  return observation;
}

/**
 * Update an existing observation
 * @param id - Observation UUID
 * @param userId - User UUID from auth context (for RLS)
 * @param command - Partial observation update data
 * @param supabase - Supabase client instance
 * @returns Updated observation
 */
export async function updateObservation(
  id: string,
  userId: string,
  command: {
    name?: string;
    description?: string | null;
    category_id?: string;
    observation_date?: string;
    location?: { lat: number; lng: number };
    location_source?: string | null;
    location_accuracy?: number | null;
    is_favorite?: boolean;
  },
  supabase: SupabaseClient
): Promise<ObservationDto | null> {
  // Build update object
  const updateData: any = {};

  if (command.name !== undefined) updateData.name = command.name;
  if (command.description !== undefined) updateData.description = command.description;
  if (command.category_id !== undefined) updateData.category_id = command.category_id;
  if (command.observation_date !== undefined) updateData.observation_date = command.observation_date;
  if (command.location_source !== undefined) updateData.location_source = command.location_source;
  if (command.location_accuracy !== undefined) updateData.location_accuracy = command.location_accuracy;
  if (command.is_favorite !== undefined) updateData.is_favorite = command.is_favorite;

  // Handle location conversion if provided
  if (command.location) {
    updateData.location = `SRID=4326;POINT(${command.location.lng} ${command.location.lat})`;
  }

  // Update observation
  const { error } = await supabase.from('observations').update(updateData).eq('id', id).eq('user_id', userId); // RLS ensures user can only update their own

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found or no permission
      return null;
    }
    throw error;
  }

  // Fetch updated observation
  const observation = await getObservationById(id, supabase);
  return observation;
}

/**
 * Delete an observation
 * @param id - Observation UUID
 * @param userId - User UUID from auth context (for RLS)
 * @param supabase - Supabase client instance
 * @returns true if deleted, false if not found
 */
export async function deleteObservation(id: string, userId: string, supabase: SupabaseClient): Promise<boolean> {
  const { error } = await supabase.from('observations').delete().eq('id', id).eq('user_id', userId); // RLS ensures user can only delete their own

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found or no permission
      return false;
    }
    throw error;
  }

  return true;
}

/**
 * Get observation markers for map display (lightweight)
 * @param params - Optional filters (bbox, category_id, favorite)
 * @param supabase - Supabase client instance
 * @returns Array of lightweight markers
 */
export async function getObservationMarkers(
  params: {
    min_lat?: number;
    min_lng?: number;
    max_lat?: number;
    max_lng?: number;
    category_id?: string;
    favorite?: boolean;
  },
  supabase: SupabaseClient
): Promise<{
  markers: {
    id: string;
    name: string;
    observation_date: string;
    lat: number;
    lng: number;
    category_name: string;
    category_color: string;
  }[];
}> {
  let query = supabase
    .from('observations_read')
    .select('id, name, observation_date, lat, lng, category_name, category_color');

  // Apply filters
  if (params.category_id) {
    query = query.eq('category_id', params.category_id);
  }
  if (typeof params.favorite === 'boolean') {
    query = query.eq('is_favorite', params.favorite);
  }

  // Apply bounding box filter if provided
  if (
    params.min_lat !== undefined &&
    params.min_lng !== undefined &&
    params.max_lat !== undefined &&
    params.max_lng !== undefined
  ) {
    query = query
      .gte('lat', params.min_lat)
      .lte('lat', params.max_lat)
      .gte('lng', params.min_lng)
      .lte('lng', params.max_lng);
  }

  const { data, error } = await query;
  if (error) throw error;

  const markers = (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    observation_date: row.observation_date,
    lat: row.lat,
    lng: row.lng,
    category_name: row.category_name,
    category_color: row.category_color,
  }));

  return { markers };
}
