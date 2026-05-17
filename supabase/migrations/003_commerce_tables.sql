-- ============================================================
-- GORER MART — COMMERCE TABLES
-- ============================================================
-- Tables: carts, cart_items, wishlists, wishlist_items,
--         reviews, orders, order_items
-- ============================================================

-- ----------------------------------------------------------
-- 7. CARTS
-- ----------------------------------------------------------
-- Supports both guest (session_id) and authenticated
-- (user_id) carts. On login, guest cart can be merged
-- into the user's cart via application logic.
-- ----------------------------------------------------------
CREATE TABLE carts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- At least one identifier must be present
  CONSTRAINT cart_owner_check CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

COMMENT ON TABLE carts IS 'Shopping carts for guests (session) and authenticated users';

-- ----------------------------------------------------------
-- 8. CART ITEMS
-- ----------------------------------------------------------
CREATE TABLE cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id    UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE cart_items IS 'Individual line items within a cart';

-- ----------------------------------------------------------
-- 9. WISHLISTS
-- ----------------------------------------------------------
-- One wishlist per user. Created on first wishlist action.
-- ----------------------------------------------------------
CREATE TABLE wishlists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE wishlists IS 'User wishlists (one per user)';

-- ----------------------------------------------------------
-- 10. WISHLIST ITEMS
-- ----------------------------------------------------------
-- Unique constraint prevents duplicate product+variant
-- entries in the same wishlist.
-- ----------------------------------------------------------
CREATE TABLE wishlist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id  UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT unique_wishlist_entry UNIQUE (wishlist_id, product_id, variant_id)
);

COMMENT ON TABLE wishlist_items IS 'Products saved to a wishlist (no duplicates)';

-- ----------------------------------------------------------
-- 11. REVIEWS
-- ----------------------------------------------------------
-- User-generated product reviews with moderation workflow.
-- is_verified_purchase is set by backend after cross-
-- referencing the user's order history.
-- ----------------------------------------------------------
CREATE TABLE reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating               INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title                TEXT,
  comment              TEXT,
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  status               review_status NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE reviews IS 'Product reviews with rating (1-5) and moderation';

-- ----------------------------------------------------------
-- 12. ORDERS
-- ----------------------------------------------------------
-- Immutable order records. Address IDs reference the
-- addresses table for shipping/billing. Monetary values
-- are snapshots at time of purchase.
-- payment_provider stores the gateway name (e.g. 'razorpay').
-- ----------------------------------------------------------
CREATE TABLE orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  order_number        TEXT NOT NULL UNIQUE,
  subtotal            NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost       NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  total               NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  order_status        order_status NOT NULL DEFAULT 'pending',
  payment_provider    TEXT,
  shipping_address_id UUID REFERENCES addresses(id) ON DELETE SET NULL,
  billing_address_id  UUID REFERENCES addresses(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE orders IS 'Immutable order records with payment and fulfillment status';
COMMENT ON COLUMN orders.user_id IS 'RESTRICT delete — orders must never be orphaned';

-- ----------------------------------------------------------
-- 13. ORDER ITEMS
-- ----------------------------------------------------------
-- Price snapshot captures the exact amount charged,
-- even if the product price changes later.
-- ----------------------------------------------------------
CREATE TABLE order_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL,
  quantity   INTEGER NOT NULL CHECK (quantity >= 1),
  price      NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE order_items IS 'Order line items with price snapshot at purchase time';
COMMENT ON COLUMN order_items.price IS 'Snapshot of price at time of purchase — never changes';
