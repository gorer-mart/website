import { Metadata } from 'next';
import OrdersClient from './OrdersClient';
import { SITE_URL } from '../../../lib/site';

/**
 * Order history is per-customer and read entirely client-side from
 * `/api/account/orders`, so there is nothing here for a crawler to index.
 */
export const metadata: Metadata = {
  title: { absolute: 'My Orders | Gorer Mart' },
  description: 'Track your Gorer Mart orders, shipments and payment details.',
  alternates: { canonical: `${SITE_URL}/account/orders` },
  robots: { index: false, follow: true },
};

export default function OrdersPage() {
  return <OrdersClient />;
}
