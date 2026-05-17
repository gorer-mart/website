-- ============================================================
-- GORER MART — INDEXES
-- ============================================================
-- Strategic indexes for ecommerce query patterns:
-- • Storefront browsing (category, featured, new arrivals)
-- • User dashboard (orders, addresses, reviews)
-- • Cart & checkout lookups
-- • Search-friendly slug lookups
-- ============================================================

-- USERS
CREATE INDEX idx_users_email ON users(email);

-- ADDRESSES
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- PRODUCTS — storefront browsing patterns
CREATE INDEX idx_products_slug        ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_featured    ON products(featured) WHERE featured = true;
CREATE INDEX idx_products_new_arrival ON products(new_arrival) WHERE new_arrival = true;
CREATE INDEX idx_products_status      ON products(status);

-- Composite index for common storefront query:
-- "Show me active featured products in this category"
CREATE INDEX idx_products_storefront ON products(status, category_id, featured);

-- PRODUCT VARIANTS
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku        ON product_variants(sku);

-- PRODUCT IMAGES — ordered gallery per product
CREATE INDEX idx_product_images_product_id ON product_images(product_id, position);

-- CARTS
CREATE INDEX idx_carts_user_id    ON carts(user_id);
CREATE INDEX idx_carts_session_id ON carts(session_id);

-- CART ITEMS
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);

-- WISHLISTS
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);

-- WISHLIST ITEMS
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);

-- REVIEWS — product pages & user dashboard
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id    ON reviews(user_id);
CREATE INDEX idx_reviews_rating     ON reviews(rating);
CREATE INDEX idx_reviews_status     ON reviews(status);

-- ORDERS — user order history & admin dashboard
CREATE INDEX idx_orders_user_id      ON orders(user_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_order_status ON orders(order_status);
CREATE INDEX idx_orders_created_at   ON orders(created_at DESC);

-- ORDER ITEMS
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
