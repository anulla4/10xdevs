import type { ObservationDto, CategoryDto, ObservationMarkerDto } from "../../types";

// ViewModel types for UI
export type ObservationListItemVM = {
  id: string;
  name: string;
  dateLabel: string;
  locationLabel: string;
  isFavorite: boolean;
  categoryBadge: {
    name: string;
    color: string;
    icon: string;
  };
};

export type MarkerVM = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle: string;
  categoryName: string;
  categoryColor: string;
};

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
};

export type ObservationVM = {
  id: string;
  name: string;
  description: string | null;
  observation_date: string;
  category_id: string;
  is_favorite: boolean;
  location: {
    lat: number;
    lng: number;
  };
  location_source: string | null;
  location_accuracy: number | null;
};

export type ObservationListFilters = {
  page: number;
  limit: number;
  q?: string;
  sort: "observation_date" | "name" | "created_at";
  order: "asc" | "desc";
  category_id?: string;
  favorite?: boolean;
};

export type MapBbox = {
  min_lat: number;
  min_lng: number;
  max_lat: number;
  max_lng: number;
};

export type ViewportMode = "desktop" | "mobile";

export type PanelQueryParams = Omit<ObservationListFilters, "page" | "limit"> & {
  page?: string;
  limit?: string;
};

// Mappers
export function mapObservationToListItem(dto: ObservationDto): ObservationListItemVM {
  const date = new Date(dto.observation_date);
  const dateLabel = date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const locationLabel = dto.location
    ? `${dto.location.lat.toFixed(4)}, ${dto.location.lng.toFixed(4)}`
    : "Brak lokalizacji";

  return {
    id: dto.id,
    name: dto.name,
    dateLabel,
    locationLabel,
    isFavorite: dto.is_favorite,
    categoryBadge: {
      name: dto.category.name,
      color: dto.category.color,
      icon: dto.category.icon,
    },
  };
}

export function mapObservationToVM(dto: ObservationDto): ObservationVM {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    observation_date: dto.observation_date,
    category_id: dto.category.id,
    is_favorite: dto.is_favorite,
    location: {
      lat: dto.location.lat,
      lng: dto.location.lng,
    },
    location_source: dto.location.source,
    location_accuracy: dto.location.accuracy,
  };
}

export function mapMarkerToVM(dto: ObservationMarkerDto): MarkerVM {
  const date = new Date(dto.observation_date);
  const subtitle = date.toLocaleDateString("pl-PL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return {
    id: dto.id,
    lat: dto.lat,
    lng: dto.lng,
    title: dto.name,
    subtitle,
    categoryName: dto.category_name,
    categoryColor: dto.category_color,
  };
}
