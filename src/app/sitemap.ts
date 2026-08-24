import { MetadataRoute } from 'next';
import { getProducts } from '../lib/sanity';
import { SITE_URL } from '../lib/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // /checkout and /account are per-user and are excluded from robots.txt, so
  // they must not be advertised here either.
  const staticRoutes: MetadataRoute.Sitemap = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: '/shop', changeFrequency: 'daily' as const, priority: 0.9 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/login', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms-and-conditions', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/refund-policy', changeFrequency: 'yearly' as const, priority: 0.3 },
  ].map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  try {
    const products = await getProducts();
    const productRoutes: MetadataRoute.Sitemap = products
      .filter((product) => product.slug)
      .map((product) => ({
        url: `${SITE_URL}/product/${product.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error('Error generating dynamic product sitemap entries:', error);
    return staticRoutes;
  }
}
