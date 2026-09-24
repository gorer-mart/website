import { Metadata } from 'next';
import AccountClient from './AccountClient';
import { SITE_URL } from '../../lib/site';

/**
 * The dashboard is per-customer and read entirely client-side from
 * `/api/account/*`, so there is nothing here for a crawler to index.
 */
export const metadata: Metadata = {
  title: { absolute: 'My Account | Gorer Mart' },
  description: 'Manage your Gorer Mart profile, delivery addresses and orders.',
  alternates: { canonical: `${SITE_URL}/account` },
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return <AccountClient />;
}
