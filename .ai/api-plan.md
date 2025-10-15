# REST API Plan

## 1. Resources

- **profiles** → table `public.profiles`
- **categories** → table `public.categories`
- **location_sources** → table `public.location_sources`
- **observations** → table `public.observations`
- **app_settings** (admin) → table `internal.app_settings`

Notes:

- Auth via Supabase Auth (JWT). RLS enforces row ownership and read policies.
- Auto-generated slug for `observations` handled by DB trigger; API does not accept `slug` on create.
- Spatial type `location` uses WGS84 (EPSG:4326). Expose as `{ lat, lng }` in API and convert to PostGIS point.

## 2. Endpoints

Conventions

- Base URL: `/api` (Astro server routes or Supabase Edge Functions). All endpoints require Authorization: Bearer <JWT> unless explicitly public.
- Pagination: `page` (default 1), `limit` (default 20, max 100). Returns `X-Total-Count`, `X-Page`, `X-Limit` headers.
- Sorting: `sort` field name, `order` in (`asc`,`desc`). Defaults noted per endpoint.
- Errors: JSON `{ error: { code, message, details? } }`.

### 2.1 Profiles

- Method: GET
  Path: `/api/profile/me`
  Description: Get current user profile.
  Query: none
  Response: `200 OK`
  JSON:
  {
  "id": "uuid",
  "display_name": "string",
  "avatar_url": "string|null",
  "created_at": "ISO-8601",
  "updated_at": "ISO-8601"
  }
  Errors: `401 Unauthorized`, `404 Not Found` (no profile row yet)

- Method: PATCH
  Path: `/api/profile/me`
  Description: Update current user profile.
  Body JSON:
  {
  "display_name": "string (<=60)",
  "avatar_url": "string|null"
  }
  Response: `200 OK` → profile JSON (same as GET)
  Errors: `400 ValidationError`, `401 Unauthorized`

### 2.2 Categories (read-only for authenticated users)

- Method: GET
  Path: `/api/categories`
  Description: List categories.
  Query:
  - `search`: string (searches `name` case-insensitive)
  - `sort`: one of (`sort_order`,`name`), default `sort_order`
  - `order`: `asc|desc`, default `asc`
    Response: `200 OK`
    JSON:
    {
    "items": [
    { "id":"uuid", "name":"string", "icon":"string", "color":"#RRGGBB", "sort_order":number }
    ]
    }
    Errors: `401 Unauthorized`

- Method: GET
  Path: `/api/categories/:id`
  Description: Get category by id.
  Response: `200 OK` → category JSON; `404 Not Found`

(Admin-only management of categories is out of MVP scope; can be added with service role.)

### 2.3 Location Sources (read-only)

- Method: GET
  Path: `/api/location-sources`
  Description: List allowed location sources.
  Response: `200 OK`
  JSON: { "items": [ { "source":"manual|gps|..." } ] }
  Errors: `401 Unauthorized`

### 2.4 Observations

- Method: GET
  Path: `/api/observations`
  Description: List current user observations with pagination, text search, and sorting.
  Query:
  - `page`: number (default 1)
  - `limit`: number (default 20, max 100)
  - `q`: string (case-insensitive search in `name`, `description`; uses trigram index)
  - `favorite`: `true|false` (filter)
  - `category_id`: `uuid` (filter)
  - `sort`: one of (`observation_date`,`name`,`created_at`), default `observation_date`
  - `order`: `asc|desc`, default `desc` for `observation_date`, else `asc`
    Response: `200 OK`
    Headers: `X-Total-Count`, `X-Page`, `X-Limit`
    JSON:
    {
    "items": [
    {
    "id":"uuid",
    "slug":"string",
    "name":"string",
    "description":"string|null",
    "observation_date":"ISO-8601",
    "is_favorite":true,
    "category": { "id":"uuid", "name":"string", "icon":"string", "color":"#RRGGBB" },
    "location": { "lat": number, "lng": number, "accuracy": number|null, "source":"manual|gps|null" },
    "created_at":"ISO-8601",
    "updated_at":"ISO-8601"
    }
    ]
    }
    Errors: `401 Unauthorized`

- Method: GET
  Path: `/api/observations/:id`
  Description: Get one observation by id (must belong to user via RLS).
  Response: `200 OK` → same shape as list item plus `description` full; `404 Not Found`

- Method: POST
  Path: `/api/observations`
  Description: Create observation. `slug` generated in DB.
  Body JSON:
  {
  "name": "string (1..100)",
  "description": "string (0..500)|null",
  "category_id": "uuid",
  "observation_date": "ISO-8601",
  "location": { "lat": number, "lng": number },
  "location_source": "manual|gps|null",
  "location_accuracy": number|null,
  "is_favorite": boolean
  }
  Response: `201 Created`
  JSON: created observation (same as GET)
  Errors: `400 ValidationError`, `401 Unauthorized`, `409 Conflict` (category missing, invalid location source)

- Method: PATCH
  Path: `/api/observations/:id`
  Description: Update observation (own rows only, RLS). `slug` is not mutable.
  Body JSON (any subset):
  {
  "name": "string (1..100)",
  "description": "string (0..500)|null",
  "category_id": "uuid",
  "observation_date": "ISO-8601",
  "location": { "lat": number, "lng": number },
  "location_source": "manual|gps|null",
  "location_accuracy": number|null,
  "is_favorite": boolean
  }
  Response: `200 OK` → updated observation
  Errors: `400 ValidationError`, `401 Unauthorized`, `404 Not Found`

- Method: DELETE
  Path: `/api/observations/:id`
  Description: Delete observation (hard delete). Cascades only within row; no other dependencies.
  Response: `204 No Content`
  Errors: `401 Unauthorized`, `404 Not Found`

- Method: GET
  Path: `/api/observations/map`
  Description: Return lightweight markers for current user (optimized for Leaflet).
  Query:
  - optional spatial bbox: `min_lat`, `min_lng`, `max_lat`, `max_lng` (to reduce payload)
  - optional `category_id`
  - optional `favorite`
    Response: `200 OK`
    JSON:
    {
    "markers": [
    { "id":"uuid", "lat":number, "lng":number, "name":"string", "observation_date":"ISO-8601" }
    ]
    }
    Errors: `401 Unauthorized`

### 2.5 App Settings (admin only via service role)

- Method: GET
  Path: `/api/admin/app-settings/:key`
  Description: Retrieve app setting by key.
  Auth: Service role JWT required.
  Response: `200 OK` { "key":"string", "value": any, "updated_at":"ISO-8601" } | `404 Not Found`

- Method: PUT
  Path: `/api/admin/app-settings/:key`
  Description: Upsert app setting value.
  Auth: Service role JWT required.
  Body JSON: { "value": any }
  Response: `200 OK` → setting JSON
  Errors: `401 Unauthorized`, `403 Forbidden`

## 3. Authentication and Authorization

- Mechanism: Supabase Auth with JWT (access token). Frontend obtains token after login/registration flows. API validates token and forwards user id to DB layer. For routes backed directly by PostgREST, pass JWT through; for server routes, verify JWT and use Supabase client with user context.
- RLS:
  - `public.profiles`: user can select/update only where `id = auth.uid()`.
  - `public.observations`: user FULL access only on own rows.
  - `public.categories`: SELECT for role `authenticated`.
  - `internal.app_settings`: no access; use service role only.
- Scopes:
  - Default token is user scope.
  - Admin endpoints require service role secret (kept server-side only).

## 4. Validation and Business Logic

Validation (enforced in API in addition to DB constraints):

- **profiles**
  - `display_name`: non-empty, length ≤ 60.
  - `avatar_url`: valid URL or null.
- **categories**
  - Read-only in MVP. DB constraints: unique `name`, unique `sort_order`, `color` matches `^#[0-9a-fA-F]{6}$`.
- **observations**
  - `name`: required, 1..100 chars.
  - `description`: optional, length ≤ 500 (DB check `observations_description_length`).
  - `category_id`: required, must exist in `public.categories`.
  - `observation_date`: required, valid ISO date-time.
  - `location`: required, must contain numeric `lat` [-90..90] and `lng` [-180..180]; converted to `ST_SetSRID(ST_MakePoint(lng,lat),4326)`.
  - `location_source`: must exist in `public.location_sources` (`manual`, `gps`, ...), or null.
  - `location_accuracy`: optional numeric (<= 999.99 with 2 decimals per NUMERIC(5,2)).
  - `is_favorite`: boolean, default false if omitted.
  - `slug`: ignored on input; generated by trigger.
- **map endpoint**
  - If bbox provided, validate ranges and that `min` < `max`; apply spatial filter using `ST_MakeEnvelope` and GIST index `observations_location_gist`.

Business Logic

- Text search uses trigram index `observations_name_trgm_idx` on `name` and ILIKE on `description` (fall back), combined with simple ranking by `observation_date DESC`.
- Default sorting for lists: `observation_date DESC` (supported by `observations_user_id_observation_date_idx`).
- Favorites filter leverages partial index `observations_is_favorite_idx`.
- Slug generation handled by DB trigger `on_observation_insert_generate_slug`.
- Timestamps maintained by trigger `public.handle_updated_at`.

## 5. Security and Performance

// MVP note: keep simple; add hardening later as needed.

- Input hardening: JSON schema validation; reject additional properties; size limits (e.g., body ≤ 32KB for create/update).
- CORS: restrict origins to deployed frontend domains.
- Secrets: service role key stored server-side only (never in client). Admin endpoints are server-to-server only.
- Index usage: queries align with existing indexes for user/date, favorites, text search, and spatial lookups. Ensure WHERE clause starts with `user_id = auth.uid()` for list endpoints to hit `(user_id, observation_date)` composite index.
- Pagination strategy: offset/limit for simplicity; consider keyset pagination by `observation_date, id` if list grows large.
- Logging & auditing: log request id, user id, method, path, status, latency. Avoid logging PII beyond user id.

## 6. Request/Response Schemas (JSON)

Types

- ID: string (UUID v4)
- Timestamp: string (ISO-8601)
- Color: string `#RRGGBB`

Observation (read)
{
"id": "uuid",
"slug": "string",
"name": "string",
"description": "string|null",
"observation_date": "ISO-8601",
"is_favorite": true,
"category": { "id":"uuid", "name":"string", "icon":"string", "color":"#RRGGBB" },
"location": { "lat": number, "lng": number, "accuracy": number|null, "source": "manual|gps|null" },
"created_at": "ISO-8601",
"updated_at": "ISO-8601"
}

Observation (write)
{
"name": "string",
"description": "string|null",
"category_id": "uuid",
"observation_date": "ISO-8601",
"location": { "lat": number, "lng": number },
"location_source": "manual|gps|null",
"location_accuracy": number|null,
"is_favorite": boolean
}

Category
{
"id":"uuid",
"name":"string",
"icon":"string",
"color":"#RRGGBB",
"sort_order": number
}

Profile
{
"id":"uuid",
"display_name":"string",
"avatar_url":"string|null",
"created_at":"ISO-8601",
"updated_at":"ISO-8601"
}

AppSetting (admin)
{
"key":"string",
"value": any,
"created_at":"ISO-8601",
"updated_at":"ISO-8601"
}

## 7. Implementation Notes (Astro + Supabase)

- Use Astro server routes under `src/pages/api/*`. Initialize Supabase client per request with `createServerClient` and the incoming JWT. For admin routes, use service role key from server env without passing to client.
- Geometry conversion helpers:
  - To DB: `ST_SetSRID(ST_MakePoint(:lng,:lat),4326)`.
  - From DB: `ST_Y(location) as lat`, `ST_X(location) as lng`.
- Prefer PostgREST for simple CRUD where feasible by forwarding JWT and using RLS; wrap in API routes for consistent response shapes and validation.
- Tests: E2E flow to meet PRD metric: registration → add observation → list/map includes marker.

## 8. Error Codes

- 400 ValidationError: input invalid or violates DB constraints.
- 401 Unauthorized: missing/invalid JWT.
- 403 Forbidden: trying to access resource without privileges (e.g., admin routes without service role).
- 404 Not Found: resource not found (or filtered by RLS).
- 422 Unprocessable: semantic errors (e.g., bbox invalid ranges).
- 500 Internal Server Error: unexpected failures.
