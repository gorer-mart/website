-- ============================================================
-- GORER MART — ROW LEVEL SECURITY (RLS) & POLICIES
-- ============================================================
-- Supabase RLS ensures data isolation at the database level.
--
-- Design Principles:
--   • Users can only read/write their OWN data
--   • Products & categories are publicly readable (storefront)
--   • Only approved reviews are publicly visible
--   • Orders use RESTRICT delete to protect financial records
--   • Guest carts use session_id matching (handled in app)
-- ============================================================


-- ==================== ENABLE RLS ====================

ALTER TABLE users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items     ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items    ENABLE ROW LEVEL SECURITY;


-- ==================== USERS ====================
-- Users can read and update only their own profile.

CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow insert on signup (triggered by auth hook)
CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ==================== ADDRESSES ====================
-- Full CRUD scoped to the authenticated user.

CREATE POLICY "addresses_select_own"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "addresses_insert_own"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_update_own"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "addresses_delete_own"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);


-- ==================== CATEGORIES ====================
-- Public read access for storefront browsing.

CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);


-- ==================== PRODUCTS ====================
-- Public can read active products only.

CREATE POLICY "products_public_read"
  ON products FOR SELECT
  USING (status = 'active');


-- ==================== PRODUCT VARIANTS ====================
-- Public read (needed for size/color selection on storefront).

CREATE POLICY "product_variants_public_read"
  ON product_variants FOR SELECT
  USING (true);


-- ==================== PRODUCT IMAGES ====================
-- Public read for product galleries.

CREATE POLICY "product_images_public_read"
  ON product_images FOR SELECT
  USING (true);


-- ==================== CARTS ====================
-- Authenticated users manage their own cart.
-- Guest carts are managed via service_role in application.

CREATE POLICY "carts_select_own"
  ON carts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "carts_insert_own"
  ON carts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carts_update_own"
  ON carts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carts_delete_own"
  ON carts FOR DELETE
  USING (auth.uid() = user_id);


-- ==================== CART ITEMS ====================
-- Users can manage items in their own cart.

CREATE POLICY "cart_items_select_own"
  ON cart_items FOR SELECT
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

CREATE POLICY "cart_items_insert_own"
  ON cart_items FOR INSERT
  WITH CHECK (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

CREATE POLICY "cart_items_update_own"
  ON cart_items FOR UPDATE
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  )
  WITH CHECK (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

CREATE POLICY "cart_items_delete_own"
  ON cart_items FOR DELETE
  USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );


-- ==================== WISHLISTS ====================

CREATE POLICY "wishlists_select_own"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "wishlists_insert_own"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "wishlists_delete_own"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);


-- ==================== WISHLIST ITEMS ====================

CREATE POLICY "wishlist_items_select_own"
  ON wishlist_items FOR SELECT
  USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

CREATE POLICY "wishlist_items_insert_own"
  ON wishlist_items FOR INSERT
  WITH CHECK (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

CREATE POLICY "wishlist_items_delete_own"
  ON wishlist_items FOR DELETE
  USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );


-- ==================== REVIEWS ====================
-- Public can read approved reviews.
-- Authenticated users can create reviews.
-- Users can update/delete only their own pending reviews.

CREATE POLICY "reviews_public_read_approved"
  ON reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "reviews_select_own"
  ON reviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "reviews_insert_own"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_update_own_pending"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews_delete_own_pending"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id AND status = 'pending');


-- ==================== ORDERS ====================
-- Users can only view their own orders. No client-side
-- mutations — orders are created via server/service_role.

CREATE POLICY "orders_select_own"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);


-- ==================== ORDER ITEMS ====================
-- Users can view items from their own orders.

CREATE POLICY "order_items_select_own"
  ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
