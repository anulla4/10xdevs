import type { LocationSourceDto } from '../../types';
import type { SupabaseClient } from '../../db/supabase.client';

/**
 * List all allowed location sources
 * @param supabase - Supabase client instance
 * @returns List of location sources
 */
export async function listLocationSources(supabase: SupabaseClient): Promise<{ items: LocationSourceDto[] }> {
  const { data, error } = await supabase.from('location_sources').select('source').order('source', { ascending: true });

  if (error) throw error;

  const items: LocationSourceDto[] = (data ?? []).map((row) => ({
    source: row.source,
  }));

  return { items };
}
