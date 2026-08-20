-- ============================================================
-- GORER MART — ORDER SHIPMENT TRACKING COLUMNS
-- ============================================================

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS estimated_delivery TIMESTAMPTZ;

COMMENT ON COLUMN public.orders.tracking_number IS 'Shipment courier tracking number (e.g. BlueDart, Delhivery)';
COMMENT ON COLUMN public.orders.estimated_delivery IS 'Estimated date of delivery';
