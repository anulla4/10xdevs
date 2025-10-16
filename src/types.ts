import type { Tables, TablesInsert, TablesUpdate, Json } from './db/database.types'

// Basic scalar aliases used by the API schemas
export type UUID = string
export type Timestamp = string // ISO-8601

// Table row helpers (kept local for readability and stronger coupling to DB)
type ProfileRow = Tables<'profiles'>
type CategoryRow = Tables<'categories'>
type LocationSourceRow = Tables<'location_sources'>
type ObservationRow = Tables<'observations'>

// Common DTOs
export type ProfileDto = ProfileRow
export type CategoryDto = CategoryRow
export type LocationSourceDto = LocationSourceRow

// Narrow category shape used inside ObservationDto
export type CategoryRefDto = Pick<CategoryRow, 'id' | 'name' | 'icon' | 'color'>

// Geo DTOs as exposed by the API (conversion to/from PostGIS happens in the service layer)
export type GeoPointDto = {
  lat: number
  lng: number
}

export type ObservationLocationDto = GeoPointDto & {
  accuracy: ObservationRow['location_accuracy']
  // Uses allowed values from `public.location_sources` table (string values)
  source: ObservationRow['location_source']
}

// Observation (read) shape as returned by the API
export type ObservationDto = Pick<
  ObservationRow,
  'id' | 'slug' | 'name' | 'description' | 'observation_date' | 'is_favorite' | 'created_at' | 'updated_at'
> & {
  category: CategoryRefDto
  location: ObservationLocationDto
}

// Observation lightweight marker for map endpoint
export type ObservationMarkerDto = {
  id: ObservationRow['id']
  name: ObservationRow['name']
  observation_date: ObservationRow['observation_date']
  lat: number
  lng: number
  category_name: string
  category_color: string
}

// Commands (write models)
// PATCH /api/profile/me accepts any subset of these two fields
export type ProfileUpdateCommand = Partial<
  Pick<TablesUpdate<'profiles'>, 'display_name' | 'avatar_url'>
>

// POST /api/observations
// Derived from DB insert, but the API accepts GeoPointDto instead of PostGIS geometry and does not accept server-managed fields
export type ObservationCreateCommand = Omit<
  TablesInsert<'observations'>,
  'id' | 'user_id' | 'slug' | 'created_at' | 'updated_at' | 'location'
> & {
  location: GeoPointDto
}

// PATCH /api/observations/:id
// Any subset; `slug` and server-managed/ownership fields are excluded; `location` is exposed as GeoPointDto
export type ObservationUpdateCommand = Omit<
  TablesUpdate<'observations'>,
  'id' | 'user_id' | 'slug' | 'created_at' | 'updated_at' | 'location'
> & {
  location?: GeoPointDto
}

// Generic list response wrapper used by read-only listing endpoints
export type ListResponse<T> = { items: T[] }

// Admin App Settings (not present in current generated DB types; defined here to match API shape)
export type AppSettingDto = {
  key: string
  value: Json
  created_at: Timestamp
  updated_at: Timestamp
}
