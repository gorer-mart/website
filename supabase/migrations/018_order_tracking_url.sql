-- ============================================================
-- GORER MART — COURIER TRACKING LINK
-- ============================================================
-- `tracking_number` alone makes the customer find the courier's site and paste
-- the number in themselves. This column holds the deep link the admin copies
-- out of the courier dashboard, so the order card can offer a one-tap
-- "Track Shipment" button instead.
--
-- The value is rendered as an `href` on a customer-facing page, so the scheme
-- is constrained here as well as in the API: a stored `javascript:` or `data:`
-- URL would be an XSS vector on click, and this constraint holds even if a row
-- is ever written outside the admin route (SQL console, backfill script).
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tracking_url TEXT;

COMMENT ON COLUMN public.orders.tracking_url IS
  'Courier tracking deep link shown to the customer as a button. http/https only — rendered as an href.';

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_tracking_url_is_web_link;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_tracking_url_is_web_link
  CHECK (
    tracking_url IS NULL
    OR (
      tracking_url ~* '^https?://[^[:space:]]+$'
      AND length(tracking_url) <= 2048
    )
  );
