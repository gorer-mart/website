-- ============================================================
-- GORER MART — CUSTOMER CONTACT BACKFILL
-- ============================================================
-- Checkout captured the customer's phone number into `addresses.phone` and
-- `orders.customer_phone`, but never into `users.phone` — the field the admin
-- console reads. Every customer therefore showed as having no phone number,
-- even when they had supplied one while ordering.
--
-- The application now writes `users.phone` at checkout (see
-- src/app/api/checkout/create-order/route.ts). This migration repairs the rows
-- that already exist.
--
-- It also promotes one address per customer to `is_default`. Checkout used to
-- insert every address with `is_default = false`, so a returning customer had
-- no address the checkout form could pre-fill from.
--
-- Safe to re-run: every statement only touches rows that are still missing the
-- value, and nothing is deleted or overwritten.
-- ============================================================

-- ----------------------------------------------------------
-- 1. Backfill users.phone from the customer's own records
-- ----------------------------------------------------------
-- Preference: the default address, then the most recent address, then the most
-- recent order. Only rows with no usable phone are touched.
-- ----------------------------------------------------------
WITH best_phone AS (
  SELECT
    u.id AS user_id,
    COALESCE(
      (
        SELECT a.phone
        FROM public.addresses a
        WHERE a.user_id = u.id
          AND COALESCE(TRIM(a.phone), '') <> ''
        ORDER BY a.is_default DESC, a.created_at DESC
        LIMIT 1
      ),
      (
        SELECT o.customer_phone
        FROM public.orders o
        WHERE o.user_id = u.id
          AND COALESCE(TRIM(o.customer_phone), '') <> ''
        ORDER BY o.created_at DESC
        LIMIT 1
      )
    ) AS phone
  FROM public.users u
  WHERE COALESCE(TRIM(u.phone), '') = ''
)
UPDATE public.users u
SET phone = bp.phone,
    updated_at = now()
FROM best_phone bp
WHERE u.id = bp.user_id
  AND COALESCE(TRIM(bp.phone), '') <> '';

-- ----------------------------------------------------------
-- 2. Give every customer exactly one default address
-- ----------------------------------------------------------
-- Promotes the most recently created address for any user who has addresses
-- but none marked default. Users who already have a default are left alone.
-- ----------------------------------------------------------
WITH candidate AS (
  SELECT DISTINCT ON (a.user_id) a.id, a.user_id
  FROM public.addresses a
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.addresses d
    WHERE d.user_id = a.user_id
      AND d.is_default
  )
  ORDER BY a.user_id, a.created_at DESC
)
UPDATE public.addresses a
SET is_default = true
FROM candidate c
WHERE a.id = c.id;

-- ----------------------------------------------------------
-- 3. Index the lookups the checkout pre-fill performs
-- ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_addresses_user_default
  ON public.addresses (user_id, is_default DESC, created_at DESC);
