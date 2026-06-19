import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { Product, Category } from '../types/product';

const rawProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk';
const projectId = rawProjectId.replace(/['"]/g, '');

const rawDataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
const dataset = rawDataset.replace(/['"]/g, '');
const token = process.env.SANITY_API_TOKEN;

/**
 * Checks if Sanity is correctly configured in environment variables.
 */
export function isSanityConfigured(): boolean {
  return !!projectId && 
         projectId !== 'your_sanity_project_id' &&
         projectId !== 'your-sanity-project-id';
}

// Initialize the client only if projectId is present and valid
export const client = createClient({
  projectId: isSanityConfigured() ? projectId! : 'your-sanity-project-id',
  dataset,
  apiVersion: '2024-01-01',
  useCdn: !token, // Disable CDN when using token for fresh data
  token: token || undefined,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

export async function getProducts(): Promise<Product[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Client-side product proxy fetch failed. Falling back to direct query...", e);
    }
  }

  if (!isSanityConfigured()) {
    console.info("Sanity Project ID is not configured. Using static products fallback.");
    return PRODUCTS;
  }

  try {
    const query = `*[_type == "product"] {
      _id,
      id,
      name,
      "slug": slug.current,
      price,
      "category": category->name,
      tag,
      tags,
      "collections": collections[]->name,
      images[] {
        color,
        images
      },
      sizes,
      "details": category->details,
      "washCare": category->washCare
    }`;
    const sanityProducts = await client.fetch(query, {}, { cache: 'no-store' });

    if (sanityProducts && sanityProducts.length > 0) {
      return sanityProducts.map((p: any) => {
        const mappedVariants = p.images ? p.images.map((v: any) => ({
          color: v.color,
          images: v.images ? v.images.map((img: any) => {
            try {
              return urlFor(img).url();
            } catch (e) {
              return '';
            }
          }).filter(Boolean) : [],
        })).filter((v: any) => v.color && v.images.length > 0) : [];

        const allFlatImages = mappedVariants.flatMap((v: any) => v.images);

        return {
          ...p,
          // Ensure id is a number if it can be parsed, else use string _id as fallback
          id: typeof p.id === 'number' ? p.id : parseInt(p.id) || p._id,
          // Map images to a flat list of absolute URLs across all color variants
          images: allFlatImages,
          sizes: p.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
          colorVariants: mappedVariants,
          colors: (mappedVariants.length > 0)
            ? Array.from(new Set(mappedVariants.map((v: any) => v.color)))
            : ['Black'],
          tag: (p.collections && p.collections.length > 0) ? p.collections[0] : (p.tags?.[0] || p.tag || ''),
          tags: (p.collections && p.collections.length > 0) ? p.collections : (p.tags || (p.tag ? [p.tag] : [])),
          details: p.details || [],
          washCare: p.washCare || ''
        };
      });
    }
    
    return PRODUCTS;
  } catch (error) {
    console.error("Failed to fetch products from Sanity. Falling back to local dataset.", error);
    return PRODUCTS;
  }
}

/**
 * Fetches all categories from Sanity.
 * Falls back to local static CATEGORIES dataset if Sanity is unconfigured or query fails.
 */
export async function getCategories(): Promise<Category[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Client-side category proxy fetch failed. Falling back to direct query...", e);
    }
  }

  if (!isSanityConfigured()) {
    return CATEGORIES;
  }

  try {
    const query = `*[_type == "category"] {
      _id,
      name,
      image,
      itemCount
    }`;
    const sanityCategories = await client.fetch(query, {}, { cache: 'no-store' });

    if (sanityCategories && sanityCategories.length > 0) {
      return sanityCategories.map((c: any) => ({
        ...c,
        image: c.image ? urlFor(c.image).url() : ''
      }));
    }

    return CATEGORIES;
  } catch (error) {
    console.error("Failed to fetch categories from Sanity. Falling back to local dataset.", error);
    return CATEGORIES;
  }
}

export interface HomePageShowcase {
  mostPochhonder: Product[];
  taatkaDrop: Product[];
}

export async function getHomePageShowcase(): Promise<HomePageShowcase> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/showcase', { cache: 'no-store' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Client-side showcase proxy fetch failed. Falling back to direct query...", e);
    }
  }

  if (!isSanityConfigured()) {
    return { mostPochhonder: [], taatkaDrop: [] };
  }

  try {
    const query = `*[_type == "homePage"] | order(_updatedAt desc)[0] {
      mostPochhonder[] {
        category-> { name },
        products[]-> {
          _id,
          id,
          name,
          "slug": slug.current,
          price,
          "category": category->name,
          tag,
          tags,
          "collections": collections[]->name,
          images[] {
            color,
            images
          },
          sizes,
          "details": category->details,
          "washCare": category->washCare
        }
      },
      taatkaDrop[] {
        category-> { name },
        products[]-> {
          _id,
          id,
          name,
          "slug": slug.current,
          price,
          "category": category->name,
          tag,
          tags,
          "collections": collections[]->name,
          images[] {
            color,
            images
          },
          sizes,
          "details": category->details,
          "washCare": category->washCare
        }
      }
    }`;

    const showcaseData = await client.fetch(query, {}, { cache: 'no-store' });

    const mapProducts = (productsRaw: any[]) => {
      if (!productsRaw || !Array.isArray(productsRaw)) return [];
      return productsRaw.filter(Boolean).map((p: any) => {
        const mappedVariants = p.images ? p.images.map((v: any) => ({
          color: v.color,
          images: v.images ? v.images.map((img: any) => {
            try {
              return urlFor(img).url();
            } catch (e) {
              return '';
            }
          }).filter(Boolean) : [],
        })).filter((v: any) => v.color && v.images.length > 0) : [];

        const allFlatImages = mappedVariants.flatMap((v: any) => v.images);

        return {
          ...p,
          id: typeof p.id === 'number' ? p.id : parseInt(p.id) || p._id,
          images: allFlatImages,
          sizes: p.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
          colorVariants: mappedVariants,
          colors: (mappedVariants.length > 0)
            ? Array.from(new Set(mappedVariants.map((v: any) => v.color)))
            : ['Black'],
          tag: (p.collections && p.collections.length > 0) ? p.collections[0] : (p.tags?.[0] || p.tag || ''),
          tags: (p.collections && p.collections.length > 0) ? p.collections : (p.tags || (p.tag ? [p.tag] : [])),
          details: p.details || [],
          washCare: p.washCare || ''
        };
      });
    };

    const mostPochhonder: Product[] = [];
    if (showcaseData?.mostPochhonder && Array.isArray(showcaseData.mostPochhonder)) {
      showcaseData.mostPochhonder.forEach((group: any) => {
        if (group.products) {
          mostPochhonder.push(...mapProducts(group.products));
        }
      });
    }

    const taatkaDrop: Product[] = [];
    if (showcaseData?.taatkaDrop && Array.isArray(showcaseData.taatkaDrop)) {
      showcaseData.taatkaDrop.forEach((group: any) => {
        if (group.products) {
          taatkaDrop.push(...mapProducts(group.products));
        }
      });
    }

    return {
      mostPochhonder,
      taatkaDrop
    };
  } catch (error) {
    console.error("Failed to fetch home page showcase from Sanity. Falling back to empty lists.", error);
    return { mostPochhonder: [], taatkaDrop: [] };
  }
}
