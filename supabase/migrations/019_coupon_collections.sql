-- ============================================================
-- GORER MART — COLLECTION-SCOPED PROMO CODES
-- ============================================================
-- Lets a promotion run against one or more Sanity collections ("Top Picks",
-- "Winter Specials") instead of the whole catalogue.
--
-- Two arrays rather than one, for the same reason `orders.coupon_code` exists
-- alongside `orders.coupon_id`:
--
--   collection_ids    what the discount is actually matched against. Sanity
--                     document ids, which never change when a collection is
--                     renamed.
--   collection_names  a display snapshot, so the admin list and the customer's
--                     "this code only applies to X" message stay readable
--                     without a Sanity round trip — and stay readable even if
--                     the collection is later deleted.
--
-- NULL means "entire catalogue", which is how every pre-existing coupon
-- behaves. An empty array would be ambiguous between that and "applies to
-- nothing", so it is rejected outright.
-- ============================================================

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS collection_ids   TEXT[],
  ADD COLUMN IF NOT EXISTS collection_names TEXT[];

COMMENT ON COLUMN public.coupons.collection_ids IS
  'Sanity collection _ids the code is limited to. NULL means the entire catalogue.';
COMMENT ON COLUMN public.coupons.collection_names IS
  'Display snapshot of the scoped collection names, parallel to collection_ids.';

ALTER TABLE public.coupons
  DROP CONSTRAINT IF EXISTS coupon_collection_scope_valid;

ALTER TABLE public.coupons
  ADD CONSTRAINT coupon_collection_scope_valid
  CHECK (
    -- Unscoped: both null.
    (collection_ids IS NULL AND collection_names IS NULL)
    OR (
      -- Scoped: at least one collection, with one name per id.
      collection_ids IS NOT NULL
      AND array_length(collection_ids, 1) > 0
      AND collection_names IS NOT NULL
      AND array_length(collection_names, 1) = array_length(collection_ids, 1)
    )
  );

-- Scoped codes are the minority, so only they need to be findable by
-- collection when auditing which promotions touch a collection.
CREATE INDEX IF NOT EXISTS idx_coupons_collection_ids
  ON public.coupons USING GIN (collection_ids)
  WHERE collection_ids IS NOT NULL;
