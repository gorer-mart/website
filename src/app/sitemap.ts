import { MetadataRoute } from 'next';
import { getProducts } from '../lib/sanity';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://gorermart.in';
  
  const staticRoutes = [
    '',
    '/shop',
    '/about',
    '/login',
    '/account',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: (route === '' ? 'weekly' : 'monthly') as 'weekly' | 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    const products = await getProducts();
    const productRoutes = products.map((product) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as 'daily',
      priority: 0.7,
    }));

    return [...staticRoutes, ...productRoutes];
  } catch (error) {
    console.error("Error generating dynamic product sitemaps:", error);
    return staticRoutes;
  }
}
