-- ============================================================
-- GORER MART — PROMO / COUPON CODES
-- ============================================================
-- Admin-managed discount codes applied at checkout.
--
-- Money rules enforced here rather than left to application code:
--   orders.total = subtotal + shipping_cost - discount_amount
--   discount_amount can never exceed the order subtotal
--
-- Coupons are never exposed to the browser. Every read and write goes through
-- a server route using the service-role client, so RLS is enabled with no
-- public policies: a customer can redeem a code they know, but cannot list or
-- enumerate codes.
-- ============================================================

-- ----------------------------------------------------------
-- 1. Discount type
-- ----------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'coupon_discount_type') THEN
    CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed');
  END IF;
END$$;

-- ----------------------------------------------------------
-- 2. COUPONS
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Always stored upper-case; the app upper-cases on write and on lookup so
  -- "save10" and "SAVE10" are the same coupon.
  code                TEXT NOT NULL UNIQUE,
  description         TEXT,

  discount_type       coupon_discount_type NOT NULL,
  discount_value      NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),

  -- Ceiling for percentage coupons, e.g. "20% off, up to ₹500". Ignored for
  -- fixed-amount coupons.
  max_discount_amount NUMERIC(10,2) CHECK (max_discount_amount IS NULL OR max_discount_amount > 0),

  -- Cart subtotal the customer must reach before the code applies.
  min_order_value     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),

  -- NULL means unlimited.
  usage_limit         INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  per_user_limit      INTEGER CHECK (per_user_limit IS NULL OR per_user_limit > 0),

  -- Maintained by redeem_coupon() when an order is actually paid for, never
  -- when a code is merely typed in.
  usage_count         INTEGER NOT NULL DEFAULT 0 CHECK (usage_count >= 0),

  starts_at           TIMESTAMPTZ,
  expires_at          TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- A percentage above 100 would hand money back to the customer.
  CONSTRAINT coupon_percentage_range
    CHECK (discount_type <> 'percentage' OR discount_value <= 100),

  CONSTRAINT coupon_window_valid
    CHECK (starts_at IS NULL OR expires_at IS NULL OR expires_at > starts_at)
);

COMMENT ON TABLE public.coupons IS 'Admin-managed promotional discount codes';
COMMENT ON COLUMN public.coupons.usage_count IS
  'Incremented by redeem_coupon() once payment is confirmed — not when applied at checkout';

CREATE INDEX IF NOT EXISTS idx_coupons_code_active
  ON public.coupons (code) WHERE is_active;

-- ----------------------------------------------------------
-- 3. COUPON REDEMPTIONS
-- ----------------------------------------------------------
-- One row per paid order that used a coupon. The unique constraint on
-- order_id is what makes redemption idempotent: payment verification and the
-- Razorpay webhook can both settle the same order, and only one may count.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id       UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  order_id        UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_amount NUMERIC(10,2) NOT NULL CHECK (discount_amount >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.coupon_redemptions IS
  'Confirmed coupon uses. UNIQUE(order_id) keeps settlement idempotent.';

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_user
  ON public.coupon_redemptions (coupon_id, user_id);

-- ----------------------------------------------------------
-- 4. ORDER DISCOUNT COLUMNS
-- ----------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0
    CHECK (discount_amount >= 0),
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.orders.discount_amount IS
  'Rupees taken off the subtotal. total = subtotal + shipping_cost - discount_amount';
COMMENT ON COLUMN public.orders.coupon_code IS
  'Code snapshot, so the order stays readable if the coupon is later renamed or deleted';

-- A discount must never exceed what was actually being bought.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_discount_within_subtotal'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_discount_within_subtotal
      CHECK (discount_amount <= subtotal);
  END IF;
END$$;

-- ----------------------------------------------------------
-- 5. REDEMPTION FUNCTION
-- ----------------------------------------------------------
-- Records the redemption and bumps usage_count in one atomic step.
--
-- Called after payment is confirmed, from both the verify-payment route and
-- the Razorpay webhook. Safe to call repeatedly for the same order and safe to
-- call for orders with no coupon.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon_id UUID;
  v_user_id   UUID;
  v_discount  NUMERIC(10,2);
  -- GET DIAGNOSTICS ... ROW_COUNT yields an integer, so this must not be a
  -- BOOLEAN: assigning the row count to a boolean variable is a type error and
  -- would make every call to this function fail.
  v_rows      INTEGER := 0;
BEGIN
  SELECT coupon_id, user_id, COALESCE(discount_amount, 0)
    INTO v_coupon_id, v_user_id, v_discount
  FROM public.orders
  WHERE id = p_order_id;

  -- No coupon on this order, or no such order: nothing to do.
  IF v_coupon_id IS NULL OR v_user_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, order_id, discount_amount)
  VALUES (v_coupon_id, v_user_id, p_order_id, v_discount)
  ON CONFLICT (order_id) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  -- Only the call that actually inserted may move the counter.
  IF v_rows > 0 THEN
    UPDATE public.coupons
       SET usage_count = usage_count + 1,
           updated_at  = now()
     WHERE id = v_coupon_id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

COMMENT ON FUNCTION public.redeem_coupon(UUID) IS
  'Idempotently records a coupon redemption for a paid order and increments usage_count';

-- Functions in `public` are exposed as RPC endpoints by PostgREST, and this one
-- is SECURITY DEFINER — so left open, a signed-in customer could call it
-- directly against their own unpaid order and burn a promotion's usage limit
-- without ever paying. Only the server's service-role client may run it.
REVOKE ALL ON FUNCTION public.redeem_coupon(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_coupon(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.redeem_coupon(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_coupon(UUID) TO service_role;

-- ----------------------------------------------------------
-- 6. ROW LEVEL SECURITY
-- ----------------------------------------------------------
-- No policies are defined on purpose. The service-role client used by the
-- server routes bypasses RLS; every other caller is denied, so browsers can
-- neither list coupons nor read redemption history.
-- ----------------------------------------------------------
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------
-- 7. updated_at maintenance
-- ----------------------------------------------------------
DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;

CREATE OR REPLACE FUNCTION public.touch_coupons_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.touch_coupons_updated_at();
