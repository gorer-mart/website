import { Metadata } from 'next';
import WishlistClient from './WishlistClient';
import { SITE_URL } from '../../lib/site';

/**
 * The wishlist is per-customer and read entirely client-side from
 * `/api/wishlist`, so there is nothing here for a crawler to index.
 */
export const metadata: Metadata = {
  title: { absolute: 'Your Wishlist | Gorer Mart' },
  description: 'Items you have saved at Gorer Mart.',
  alternates: { canonical: `${SITE_URL}/wishlist` },
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return <WishlistClient />;
}
