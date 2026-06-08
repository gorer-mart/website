-- ============================================================
-- GORER MART — USER ROLES AND ADMIN POLICIES
-- ============================================================

-- 1. Create role enum and add to users table
CREATE TYPE user_role AS ENUM ('customer', 'admin');

ALTER TABLE public.users 
  ADD COLUMN role user_role NOT NULL DEFAULT 'customer';

-- 2. Create a helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add admin access policies to users table
CREATE POLICY "users_admin_all"
  ON public.users
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Add admin access policies to products
CREATE POLICY "products_admin_all"
  ON public.products
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Add admin access policies to categories
CREATE POLICY "categories_admin_all"
  ON public.categories
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Add admin access policies to product_variants
CREATE POLICY "product_variants_admin_all"
  ON public.product_variants
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Add admin access policies to product_images
CREATE POLICY "product_images_admin_all"
  ON public.product_images
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 8. Add admin access policies to reviews
CREATE POLICY "reviews_admin_all"
  ON public.reviews
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Add admin access policies to orders & order_items
CREATE POLICY "orders_admin_all"
  ON public.orders
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "order_items_admin_all"
  ON public.order_items
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 10. Add policies for newsletter_subscribers
-- Fix M11: Admin can SELECT/DELETE newsletter subscribers
CREATE POLICY "newsletter_subscribers_admin_all"
  ON public.newsletter_subscribers
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
