import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useMarkers } from '../hooks/useMarkers';
import { useDebounce } from '../hooks/useDebounce';
import { mapMarkerToVM } from './types';
import type { ObservationListFilters, MapBbox } from './types';

interface ObservationMapProps {
  filters: ObservationListFilters;
  selectedObservationId: string | null;
  onMarkerSelect: (id: string | null) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

// Fix Leaflet default icon issue with webpack (only on client side)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

// Default center on Poland
const DEFAULT_CENTER: [number, number] = [52.0693, 19.4803];
const DEFAULT_ZOOM = 6;

export function ObservationMap({ filters, selectedObservationId, onMarkerSelect, onMapClick }: ObservationMapProps) {
  const [bbox, setBbox] = useState<MapBbox | undefined>(undefined);
  const debouncedBbox = useDebounce(bbox, 300);

  const { data: markersData, isLoading } = useMarkers({
    bbox: debouncedBbox,
    category_id: filters.category_id,
    favorite: filters.favorite,
  });

  const markers = markersData?.markers.map(mapMarkerToVM) || [];

  return (
    <div className="relative h-full w-full">
      <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} className="h-full w-full" zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsTracker onBoundsChange={setBbox} />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            position={[marker.lat, marker.lng]}
            eventHandlers={{
              click: () => onMarkerSelect(marker.id),
            }}
          >
            <Popup>
              <div className="min-w-[150px]">
                <p className="font-semibold text-gray-900 mb-1">{marker.title}</p>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="inline-block px-2 py-0.5 text-xs font-medium rounded-full lowercase"
                    style={{
                      backgroundColor: `${marker.categoryColor}20`,
                      color: marker.categoryColor,
                    }}
                  >
                    {marker.categoryName}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{marker.subtitle}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {selectedObservationId && <MapCenterOnSelected markers={markers} selectedId={selectedObservationId} />}
      </MapContainer>

      {isLoading && (
        <div className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2 text-sm shadow-lg">
          Ładowanie markerów...
        </div>
      )}
    </div>
  );
}

// Component to track map bounds and update bbox
function MapBoundsTracker({ onBoundsChange }: { onBoundsChange: (bbox: MapBbox) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        min_lat: bounds.getSouth(),
        min_lng: bounds.getWest(),
        max_lat: bounds.getNorth(),
        max_lng: bounds.getEast(),
      });
    },
    zoomend: () => {
      const bounds = map.getBounds();
      onBoundsChange({
        min_lat: bounds.getSouth(),
        min_lng: bounds.getWest(),
        max_lat: bounds.getNorth(),
        max_lng: bounds.getEast(),
      });
    },
  });

  // Set initial bbox
  useEffect(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      min_lat: bounds.getSouth(),
      min_lng: bounds.getWest(),
      max_lat: bounds.getNorth(),
      max_lng: bounds.getEast(),
    });
  }, []);

  return null;
}

// Component to handle map clicks for adding observations
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

// Component to center map on selected marker
function MapCenterOnSelected({
  markers,
  selectedId,
}: {
  markers: { id: string; lat: number; lng: number }[];
  selectedId: string;
}) {
  const map = useMap();
  const prevSelectedId = useRef<string | null>(null);

  useEffect(() => {
    if (selectedId && selectedId !== prevSelectedId.current) {
      const marker = markers.find((m) => m.id === selectedId);
      if (marker) {
        map.setView([marker.lat, marker.lng], map.getZoom(), { animate: true });
      }
      prevSelectedId.current = selectedId;
    }
  }, [selectedId, markers, map]);

  return null;
}
