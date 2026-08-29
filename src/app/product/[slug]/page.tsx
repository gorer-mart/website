import React from 'react';
import { Metadata } from 'next';
import ProductClient from './ProductClient';
import { getProducts } from '../../../lib/sanity';
import { SITE_URL } from '../../../lib/site';
import { sizedImageUrl } from '../../../lib/image';
import { Product } from '../../../types/product';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * The route segment is named [slug] but internal links have historically used
 * the numeric product id, and shared links may carry the Sanity `_id`. Resolve
 * all three to the same product so no existing link 404s.
 */
function findProduct(products: Product[], segment: string): Product | undefined {
  return products.find(
    (p) => p.slug === segment || String(p.id) === segment || p._id === segment
  );
}

/**
 * Rendered on demand for whichever slug is requested, but the catalog read
 * underneath is served from the tagged cache. `generateMetadata` and the page
 * body both call `getProducts()`; with the cache in play the second call is a
 * cache read rather than a second round trip to Sanity.
 */

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const products = await getProducts();
    const product = findProduct(products, slug);

    if (!product) {
      return {
        title: { absolute: 'Product Not Found | Gorer Mart' },
        robots: { index: false, follow: true },
      };
    }

    const canonical = `${SITE_URL}/product/${product.slug || product.id}`;
    const ogImage = sizedImageUrl(
      typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.src,
      1200,
      80
    );

    return {
      title: { absolute: `${product.name} | Gorer Mart Premium Streetwear` },
      description: `Shop ${product.name} at Gorer Mart — ₹${product.price}. Premium Kolkata-inspired streetwear, ethically sourced and built to last.`,
      alternates: { canonical },
      openGraph: {
        type: 'website',
        url: canonical,
        siteName: 'Gorer Mart',
        title: `${product.name} | Gorer Mart`,
        description: `Shop ${product.name} at Gorer Mart. Premium Kolkata-inspired streetwear.`,
        images: ogImage ? [{ url: ogImage, width: 1200, height: 1500, alt: product.name }] : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} | Gorer Mart`,
        images: ogImage ? [ogImage] : undefined,
      },
    };
  } catch {
    return { title: { absolute: 'Gorer Mart Premium Streetwear' } };
  }
}

/**
 * Resolves the product server-side. Previously this page shipped no product
 * data at all: the browser had to hydrate, fetch the entire catalog, find the
 * match, and only then begin loading the gallery images.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const products = await getProducts();
  const product = findProduct(products, slug);

  return <ProductClient initialProduct={product} initialProducts={products} />;
}
