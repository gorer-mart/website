-- ============================================================
-- GORER MART — ADDRESS ARCHIVING
-- ============================================================
-- The account page lets a customer remove a saved address. A plain DELETE
-- cannot be used for that: `orders.shipping_address_id` and
-- `orders.billing_address_id` both reference this table with
-- ON DELETE SET NULL, so deleting a row would silently blank the delivery
-- address on every past order that used it — the customer's own order history,
-- and the address the warehouse shipped to.
--
-- Archiving keeps the row (and therefore the order record) intact while
-- hiding it from the address book and from checkout's saved-address list.
-- ============================================================

ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN public.addresses.archived_at IS
  'Set when the customer removes the address. Non-null rows stay for order history but are hidden from the customer.';

-- Every customer-facing read filters on this, scoped by user.
CREATE INDEX IF NOT EXISTS idx_addresses_user_active
  ON public.addresses (user_id)
  WHERE archived_at IS NULL;
