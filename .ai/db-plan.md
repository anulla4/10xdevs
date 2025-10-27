### 1. Tables

#### `public.profiles`

Stores public user data, extending the `auth.users` table.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(60) NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE public.profiles IS 'Public user data linked to authentication.';
```

#### `public.categories`

A predefined dictionary of observation categories.

```sql
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon VARCHAR(40) NOT NULL,
  color CHAR(7) NOT NULL,
  sort_order SMALLINT NOT NULL,

  CONSTRAINT categories_name_unique UNIQUE (name),
  CONSTRAINT categories_sort_order_unique UNIQUE (sort_order),
  CONSTRAINT categories_color_format CHECK (color ~ '^#[0-9a-fA-F]{6}$')
);
COMMENT ON TABLE public.categories IS 'Predefined observation categories (e.g., plant, animal).';
```

#### `public.location_sources`

A reference table for the source of location data, replacing a native `ENUM`.

```sql
CREATE TABLE public.location_sources (
  source TEXT PRIMARY KEY
);
COMMENT ON TABLE public.location_sources IS 'Reference table for location sources (e.g., gps, manual).';
```

#### `public.observations`

The central table for storing user observations.

```sql
CREATE TABLE public.observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  observation_date TIMESTAMPTZ NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  location_source TEXT REFERENCES public.location_sources(source),
  location_accuracy NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT observations_slug_unique UNIQUE (slug),
  CONSTRAINT observations_description_length CHECK (length(description) <= 500)
);
COMMENT ON TABLE public.observations IS 'User-submitted nature observations.';
```

#### `internal.app_settings`

A table for storing global application settings, protected in a separate schema.

```sql
CREATE SCHEMA IF NOT EXISTS internal;
CREATE TABLE internal.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE internal.app_settings IS 'Internal application settings, admin-only access.';
```

### 2. Relationships

- **`auth.users` ↔ `public.profiles`**: One-to-One. Each user in `auth.users` has one corresponding profile in `public.profiles`. The link is enforced by `profiles.id` being a Primary and Foreign Key.
- **`public.profiles` → `public.observations`**: One-to-Many. A user can have many observations.
- **`public.categories` → `public.observations`**: One-to-Many. A category can be assigned to many observations.
- **`public.location_sources` → `public.observations`**: One-to-Many. A location source can be assigned to many observations.

### 3. Indexes

```sql
-- Optimize fetching a user's observations, sorted by date (default view)
CREATE INDEX observations_user_id_observation_date_idx ON public.observations (user_id, observation_date DESC);

-- Optimize fetching a user's favorite observations
CREATE INDEX observations_is_favorite_idx ON public.observations (user_id, observation_date DESC) WHERE is_favorite;

-- Spatial index for map-based queries
CREATE INDEX observations_location_gist ON public.observations USING GIST (location);

-- Trigram index for fast, case-insensitive text search on observation names
CREATE INDEX observations_name_trgm_idx ON public.observations USING GIN (name gin_trgm_ops);

-- Index for settings lookup in JSONB
CREATE INDEX app_settings_value_gin ON internal.app_settings USING GIN (value);
```

### 4. PostgreSQL Policies (RLS)

```sql
-- Enable RLS for all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal.app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see and edit only their own profile.
CREATE POLICY "Allow individual read access on profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow individual update access on profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Observations: Users can manage (CRUD) only their own observations.
CREATE POLICY "Allow full access on own observations" ON public.observations FOR ALL USING (auth.uid() = user_id);

-- Categories: All authenticated users can read categories.
CREATE POLICY "Allow read access on categories to all authenticated users" ON public.categories FOR SELECT TO authenticated USING (true);

-- App Settings: Deny all access by default. Access should be granted only to a service_role.
CREATE POLICY "Deny all access to app_settings" ON internal.app_settings FOR ALL USING (false);
```

### 5. Additional Notes & Triggers

- **Extensions**: The schema requires the following PostgreSQL extensions to be enabled: `postgis`, `pgcrypto`, and `pg_trgm`.
- **Timestamp Automation**: A shared trigger function automatically updates the `updated_at` column on any row modification.

  ```sql
  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_profiles_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  CREATE TRIGGER on_observations_update BEFORE UPDATE ON public.observations FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  CREATE TRIGGER on_app_settings_update BEFORE UPDATE ON internal.app_settings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
  ```

- **Slug Generation**: A trigger automatically generates a unique, URL-friendly `slug` for each new observation.

  ```sql
  CREATE OR REPLACE FUNCTION public.generate_observation_slug()
  RETURNS TRIGGER AS $$
  DECLARE
    base_slug TEXT;
    unique_slug TEXT;
  BEGIN
    base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '[\s-]+', '-', 'g');
    unique_slug := base_slug || '-' || substr(NEW.id::text, 1, 8);
    NEW.slug = unique_slug;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_observation_insert_generate_slug BEFORE INSERT ON public.observations FOR EACH ROW EXECUTE PROCEDURE public.generate_observation_slug();
  ```

- **Seed Data**:
  - The `public.location_sources` table should be seeded with initial values: `('manual')`, `('gps')`.
  - The `public.categories` table should be seeded with the initial set: `('Roślina', 'leaf', '#4ade80', 1)`, `('Zwierzę', 'paw', '#fb923c', 2)`, `('Skała', 'mountain', '#a8a29e', 3)`.
