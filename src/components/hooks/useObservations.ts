import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ObservationDto, ObservationCreateCommand, ObservationUpdateCommand, ListResponse } from '../../types';
import type { ObservationListFilters, PaginationMeta } from '../panel/types';

interface ObservationsResponse {
  items: ObservationDto[];
  meta: PaginationMeta;
}

async function fetchObservations(filters: ObservationListFilters): Promise<ObservationsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  params.set('sort', filters.sort);
  params.set('order', filters.order);
  if (filters.q) params.set('q', filters.q);
  if (filters.category_id) params.set('category_id', filters.category_id);
  if (filters.favorite !== undefined) params.set('favorite', String(filters.favorite));

  const response = await fetch(`/api/observations?${params.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch observations' }));
    throw new Error(error.message || 'Failed to fetch observations');
  }

  const data: ListResponse<ObservationDto> = await response.json();
  const total = parseInt(response.headers.get('X-Total-Count') || '0', 10);

  return {
    items: data.items,
    meta: {
      total,
      page: filters.page,
      limit: filters.limit,
    },
  };
}

export function useObservations(filters: ObservationListFilters) {
  return useQuery({
    queryKey: ['observations', filters],
    queryFn: () => fetchObservations(filters),
  });
}

async function createObservation(data: ObservationCreateCommand): Promise<ObservationDto> {
  const response = await fetch('/api/observations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create observation' }));
    throw new Error(error.message || 'Failed to create observation');
  }

  return response.json();
}

export function useCreateObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createObservation,
    onSuccess: () => {
      // Invalidate all observations and markers queries
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      queryClient.invalidateQueries({ queryKey: ['markers'] });
    },
  });
}

async function updateObservation(id: string, data: ObservationUpdateCommand): Promise<ObservationDto> {
  const response = await fetch(`/api/observations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update observation' }));
    throw new Error(error.message || 'Failed to update observation');
  }

  return response.json();
}

export function useUpdateObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ObservationUpdateCommand }) => updateObservation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      queryClient.invalidateQueries({ queryKey: ['markers'] });
    },
  });
}

async function deleteObservation(id: string): Promise<void> {
  const response = await fetch(`/api/observations/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete observation' }));
    throw new Error(error.message || 'Failed to delete observation');
  }
}

export function useDeleteObservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteObservation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      queryClient.invalidateQueries({ queryKey: ['markers'] });
    },
  });
}
