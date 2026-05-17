-- ============================================================
-- GORER MART — ENUM TYPES
-- ============================================================
-- All custom PostgreSQL enum types used across the schema.
-- Enums enforce data integrity at the database level and are
-- more performant than CHECK constraints for categorical data.
-- ============================================================

-- Product lifecycle status
CREATE TYPE product_status AS ENUM ('active', 'draft', 'sold_out');

-- Payment gateway transaction status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Order fulfillment pipeline
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled'
);

-- User-generated review moderation status
CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');

-- Gender targeting for products (expandable)
CREATE TYPE product_gender AS ENUM ('men', 'women', 'unisex');
