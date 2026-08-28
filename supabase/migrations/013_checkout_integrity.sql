-- ============================================================
-- GORER MART — CHECKOUT INTEGRITY
-- ============================================================
-- Closes three gaps that made the payment flow unsafe/unfulfillable:
--
--  1. Nothing linked a local order to its Razorpay order. A valid signature
--     from a cheap order could therefore be replayed against an expensive
--     pending order. `razorpay_order_id` makes that binding explicit and
--     unique, so a signature only ever settles the order it belongs to.
--  2. Order items recorded no size/colour, so a paid order could not actually
--     be picked and packed.
--  3. Contact details captured at checkout were not stored on the order.
-- ============================================================

-- ---------- ORDERS ----------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id   TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS customer_email      TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone      TEXT;

COMMENT ON COLUMN public.orders.razorpay_order_id IS
  'Razorpay order id. Payment verification requires this to match the signed order_id.';
COMMENT ON COLUMN public.orders.razorpay_payment_id IS
  'Razorpay payment id recorded once the payment is verified/captured.';

-- One Razorpay order settles exactly one local order.
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_razorpay_order_id
  ON public.orders (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

-- ---------- ORDER ITEMS ----------
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS size         TEXT,
  ADD COLUMN IF NOT EXISTS color        TEXT,
  ADD COLUMN IF NOT EXISTS product_name TEXT;

COMMENT ON COLUMN public.order_items.size IS
  'Size chosen at purchase time — required for fulfilment.';
COMMENT ON COLUMN public.order_items.product_name IS
  'Product name snapshot, so an order stays readable if the catalog changes.';

-- ---------- PRODUCTS ----------
-- Products originate in Sanity. Recording the source id makes the mapping
-- traceable and lets a non-UUID Sanity id be represented by a derived UUID.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sanity_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sanity_id
  ON public.products (sanity_id)
  WHERE sanity_id IS NOT NULL;

-- ---------- CONTACT MESSAGES ----------
-- Public INSERT policy exists on this table; the app writes through a
-- rate-limited server route. Reads stay admin-only (see 009_user_roles.sql).
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
  ON public.contact_messages (created_at DESC);
