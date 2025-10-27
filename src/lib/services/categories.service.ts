import type { CategoryDto } from '../../types';
import type { SupabaseClient } from '../../db/supabase.client';
import { z } from 'zod';

export const ListCategoriesParamsSchema = z.object({
  search: z.string().min(1).optional(),
  sort: z.enum(['sort_order', 'name']).default('sort_order'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

export type ListCategoriesParams = z.infer<typeof ListCategoriesParamsSchema>;

/**
 * List all categories with optional search and sorting
 * @param params - Query parameters for filtering and sorting
 * @param supabase - Supabase client instance
 * @returns List of categories
 */
export async function listCategories(
  params: ListCategoriesParams,
  supabase: SupabaseClient
): Promise<{ items: CategoryDto[] }> {
  const { search, sort, order } = params;

  let query = supabase.from('categories').select('id, name, icon, color, sort_order');

  // Apply search filter if provided
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }

  // Apply sorting
  query = query.order(sort, { ascending: order === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  const items: CategoryDto[] = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    sort_order: c.sort_order,
  }));

  return { items };
}

/**
 * Get a single category by ID
 * @param id - Category UUID
 * @param supabase - Supabase client instance
 * @returns Category or null if not found
 */
export async function getCategoryById(id: string, supabase: SupabaseClient): Promise<CategoryDto | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, color, sort_order')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Not found
      return null;
    }
    throw error;
  }

  return data as CategoryDto;
}
