-- ============================================================
-- GORER MART — WISHLIST INTEGRITY
-- ============================================================
-- `003_commerce_tables.sql` guards wishlist_items with
--
--   CONSTRAINT unique_wishlist_entry UNIQUE (wishlist_id, product_id, variant_id)
--
-- which does not do what it looks like it does. In Postgres a UNIQUE
-- constraint treats NULLs as distinct, so with `variant_id IS NULL` — which is
-- every row a product-level wishlist creates — the same product can be
-- inserted into the same wishlist without limit. Tapping the heart twice would
-- add two rows, and the wishlist page would show duplicates.
--
-- The partial unique index below closes that for variant-less entries while
-- leaving the original constraint in place for any future per-variant rows.
--
-- Safe to re-run. If duplicates already exist the index creation would fail,
-- so they are collapsed first, keeping the earliest row of each group.
-- ============================================================

-- ----------------------------------------------------------
-- 1. Collapse any existing duplicates
-- ----------------------------------------------------------
DELETE FROM public.wishlist_items w
WHERE w.variant_id IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.wishlist_items keep
    WHERE keep.wishlist_id = w.wishlist_id
      AND keep.product_id  = w.product_id
      AND keep.variant_id IS NULL
      AND (keep.created_at < w.created_at
           OR (keep.created_at = w.created_at AND keep.id < w.id))
  );

-- ----------------------------------------------------------
-- 2. One row per product per wishlist
-- ----------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS uniq_wishlist_product_no_variant
  ON public.wishlist_items (wishlist_id, product_id)
  WHERE variant_id IS NULL;

COMMENT ON INDEX public.uniq_wishlist_product_no_variant IS
  'Product-level wishlist uniqueness. The table constraint cannot enforce this because variant_id is NULL.';

-- ----------------------------------------------------------
-- 3. Read path index
-- ----------------------------------------------------------
-- The wishlist page lists a customer's items newest-first.
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_created
  ON public.wishlist_items (wishlist_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wishlists_user
  ON public.wishlists (user_id);
