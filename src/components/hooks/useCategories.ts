import { useQuery } from '@tanstack/react-query';
import type { CategoryDto, ListResponse } from '../../types';

async function fetchCategories(): Promise<CategoryDto[]> {
  const response = await fetch('/api/categories?sort=sort_order&order=asc');

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch categories' }));
    throw new Error(error.message || 'Failed to fetch categories');
  }

  const data: ListResponse<CategoryDto> = await response.json();
  return data.items;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - categories rarely change
  });
}
