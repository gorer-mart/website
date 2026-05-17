-- ============================================================
-- GORER MART — CORE TABLES
-- ============================================================
-- Tables: users, addresses, categories, products,
--         product_variants, product_images
-- ============================================================

-- ----------------------------------------------------------
-- 1. USERS (public profile linked to auth.users)
-- ----------------------------------------------------------
-- This table mirrors essential profile data from Supabase Auth.
-- The id column references auth.users directly so every
-- authenticated user automatically has a profile row.
-- Google Sign-In populates full_name, email, and avatar_url.
-- ----------------------------------------------------------
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT UNIQUE NOT NULL,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE users IS 'Public user profiles linked 1:1 with Supabase Auth';

-- ----------------------------------------------------------
-- 2. ADDRESSES
-- ----------------------------------------------------------
-- Users can store multiple shipping/billing addresses.
-- is_default marks the preferred address for checkout.
-- ----------------------------------------------------------
CREATE TABLE addresses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  phone          TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city           TEXT NOT NULL,
  state          TEXT NOT NULL,
  postal_code    TEXT NOT NULL,
  country        TEXT NOT NULL DEFAULT 'India',
  landmark       TEXT,
  is_default     BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE addresses IS 'User shipping and billing addresses';

-- ----------------------------------------------------------
-- 3. CATEGORIES
-- ----------------------------------------------------------
-- Product categories with unique slugs for URL routing.
-- Designed for expansion: t-shirts → hoodies, jackets, etc.
-- ----------------------------------------------------------
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE categories IS 'Product categories with URL-friendly slugs';

-- ----------------------------------------------------------
-- 4. PRODUCTS
-- ----------------------------------------------------------
-- Core product catalog. Each product belongs to one category.
-- compare_at_price enables strike-through pricing.
-- average_rating and review_count are denormalized for
-- read performance (updated via triggers/functions later).
-- ----------------------------------------------------------
CREATE TABLE products (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT,
  short_description TEXT,
  category_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand             TEXT NOT NULL DEFAULT 'Gorer Mart',
  gender            product_gender NOT NULL DEFAULT 'unisex',
  price             NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  compare_at_price  NUMERIC(10,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
  featured          BOOLEAN NOT NULL DEFAULT false,
  new_arrival       BOOLEAN NOT NULL DEFAULT false,
  status            product_status NOT NULL DEFAULT 'draft',
  average_rating    NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  review_count      INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE products IS 'Core product catalog with pricing and status';

-- ----------------------------------------------------------
-- 5. PRODUCT VARIANTS
-- ----------------------------------------------------------
-- Size/color combinations per product. Each variant has
-- its own SKU and stock count. price_override allows
-- variant-specific pricing (e.g., XXL surcharge).
-- ----------------------------------------------------------
CREATE TABLE product_variants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size           TEXT NOT NULL,
  color          TEXT,
  sku            TEXT NOT NULL UNIQUE,
  stock          INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  price_override NUMERIC(10,2) CHECK (price_override IS NULL OR price_override >= 0),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_variants IS 'Size/color variants with individual SKU and stock';

-- ----------------------------------------------------------
-- 6. PRODUCT IMAGES
-- ----------------------------------------------------------
-- Multiple images per product, ordered by position.
-- Position enables drag-and-drop reordering in admin.
-- ----------------------------------------------------------
CREATE TABLE product_images (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  alt_text   TEXT,
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE product_images IS 'Ordered product gallery images';
