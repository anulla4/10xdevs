/* eslint-disable */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useObservations,
  useCreateObservation,
  useDeleteObservation,
} from '../../src/components/hooks/useObservations';
import React from 'react';

global.fetch = vi.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};

describe('useObservations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return observations on successful fetch', async () => {
    const mockObservations = { items: [{ id: '1', name: 'Observation 1' }], meta: { total: 1, page: 1, limit: 10 } };
    (fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockObservations),
      headers: new Headers({ 'X-Total-Count': '1' }),
    });

    const { result } = renderHook(() => useObservations({ page: 1, limit: 10, sort: 'name', order: 'asc' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toEqual(mockObservations.items);
    expect(result.current.data?.meta.total).toBe(1);
  });

  it('should return an empty array for no observations', async () => {
    const mockObservations = { items: [], meta: { total: 0, page: 1, limit: 10 } };
    (fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockObservations),
      headers: new Headers({ 'X-Total-Count': '0' }),
    });

    const { result } = renderHook(() => useObservations({ page: 1, limit: 10, sort: 'name', order: 'asc' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toEqual([]);
    expect(result.current.data?.meta.total).toBe(0);
  });

  it('should handle fetch error', async () => {
    (fetch as vi.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Failed to fetch' }),
    });

    const { result } = renderHook(() => useObservations({ page: 1, limit: 10, sort: 'name', order: 'asc' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error.message).toBe('Failed to fetch');
  });
});

describe('useCreateObservation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should create an observation on success', async () => {
    const newObservationData = {
      name: 'New Observation',
      category_id: 'cat1',
      observation_date: new Date().toISOString(),
      location: { lat: 10, lng: 20 },
    };
    const createdObservation = { id: '2', ...newObservationData };
    (fetch as vi.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(createdObservation),
    });

    const { result } = renderHook(() => useCreateObservation(), { wrapper: createWrapper() });

    result.current.mutate(newObservationData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetch).toHaveBeenCalledWith('/api/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newObservationData),
    });
  });
});

describe('useDeleteObservation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should delete an observation on success', async () => {
    (fetch as vi.Mock).mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useDeleteObservation(), { wrapper: createWrapper() });

    result.current.mutate('1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetch).toHaveBeenCalledWith('/api/observations/1', { method: 'DELETE' });
  });
});
