import React from 'react';
import { Metadata } from 'next';
import ShopClient from './ShopClient';
import { getProducts, getCategories } from '../../lib/sanity';
import { SITE_URL } from '../../lib/site';

export const metadata: Metadata = {
  title: { absolute: 'Shop All | Gorer Mart Premium Streetwear' },
  description:
    'Browse the complete Gorer Mart collection — premium Kolkata-inspired t-shirts and streetwear, ethically sourced and built to last.',
  alternates: { canonical: `${SITE_URL}/shop` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/shop`,
    title: { absolute: 'Shop All | Gorer Mart Premium Streetwear' },
    description: 'Browse the complete Gorer Mart collection of premium Kolkata-inspired apparel.',
    siteName: 'Gorer Mart',
  },
};

/**
 * Reading `searchParams` already makes this route render per request; the
 * catalog fetches underneath it are served from the tagged cache and refreshed
 * by the Studio publish webhook.
 */

/**
 * The catalog is fetched here rather than in the client component so the
 * product grid — and every image URL in it — is present in the first HTML
 * response. The browser can then start downloading product images while it is
 * still parsing the page, instead of waiting for JS to hydrate and issue two
 * further round trips.
 */
export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  const [{ collection }, products, categories] = await Promise.all([
    searchParams,
    getProducts(),
    getCategories(),
  ]);

  return (
    <ShopClient
      initialProducts={products}
      initialCategories={categories}
      initialCollection={collection || 'All'}
    />
  );
}
