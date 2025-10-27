import { useQuery } from '@tanstack/react-query';
import type { ObservationMarkerDto } from '../../types';
import type { MapBbox } from '../panel/types';

interface MarkersParams {
  bbox?: MapBbox;
  category_id?: string;
  favorite?: boolean;
}

interface MarkersResponse {
  markers: ObservationMarkerDto[];
}

async function fetchMarkers(params: MarkersParams): Promise<MarkersResponse> {
  const searchParams = new URLSearchParams();

  if (params.bbox) {
    searchParams.set('min_lat', String(params.bbox.min_lat));
    searchParams.set('min_lng', String(params.bbox.min_lng));
    searchParams.set('max_lat', String(params.bbox.max_lat));
    searchParams.set('max_lng', String(params.bbox.max_lng));
  }

  if (params.category_id) {
    searchParams.set('category_id', params.category_id);
  }

  if (params.favorite !== undefined) {
    searchParams.set('favorite', String(params.favorite));
  }

  const response = await fetch(`/api/observations/map?${searchParams.toString()}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch markers' }));
    throw new Error(error.message || 'Failed to fetch markers');
  }

  return response.json();
}

export function useMarkers(params: MarkersParams) {
  return useQuery({
    queryKey: ['markers', params],
    queryFn: () => fetchMarkers(params),
    enabled: !!params.bbox, // Only fetch when bbox is available
  });
}
