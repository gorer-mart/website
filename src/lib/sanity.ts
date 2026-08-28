import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import { PRODUCTS, CATEGORIES } from '../data/products';
import { Product, Category, HeroData } from '../types/product';

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

/**
 * Cache tag applied to every catalog read.
 *
 * Publishing in Sanity Studio fires a webhook at /api/revalidate/sanity, which
 * calls `revalidateTag(SANITY_CACHE_TAG)` — so an edit appears on the storefront
 * on the very next request rather than waiting for a timer. Everything shares
 * one tag on purpose: products embed category fields (details, wash care, size
 * guides) and the home page embeds products, so a change to any of them can
 * affect the others.
 */
export const SANITY_CACHE_TAG = 'sanity';

/**
 * Time-based backstop, in case a webhook delivery is ever missed. Normal
 * freshness comes from the webhook above, not from this.
 */
export const CATALOG_REVALIDATE_SECONDS = 300;

/** Cache options shared by every catalog query. */
const catalogCache = {
  next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags: [SANITY_CACHE_TAG] },
};

// Initialize the client only if projectId is present and valid
export const client = createClient({
  projectId: isSanityConfigured() ? projectId! : 'your-sanity-project-id',
  dataset,
  apiVersion: '2024-01-01',
  // Next's data cache sits in front of every query (see `catalogCache`), so
  // Sanity is only contacted on a cache miss. The edge CDN would add nothing at
  // that point and can briefly serve a pre-publish document, which would then be
  // re-cached for the full backstop window. Read from the live API instead.
  useCdn: false,
  token: token || undefined,
});

const builder = createImageUrlBuilder(client);

export function urlFor(source: any) {
  return builder.image(source);
}

export async function getProducts(): Promise<Product[]> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/products');
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
        images[] {
          ...,
          "lqip": asset->metadata.lqip
        }
      },
      sizes,
      "details": category->details,
      "washCare": category->washCare,
      "sizeGuideDesktopImages": category->sizeGuideDesktopImages[].asset->url,
      "sizeGuideMobileImages": category->sizeGuideMobileImages[].asset->url,
      "sizeGuideImages": category->sizeGuideImages[].asset->url
    }`;
    const sanityProducts = await client.fetch(query, {}, catalogCache);

    if (sanityProducts && sanityProducts.length > 0) {
      return sanityProducts.map((p: any) => {
        const mappedVariants = p.images ? p.images.map((v: any) => {
          // Resolve url and preview together so a failed image drops both and
          // the two arrays stay index-aligned.
          const resolved = (v.images || []).map((img: any) => {
            try {
              return { url: urlFor(img).url(), lqip: img?.lqip || '' };
            } catch {
              return null;
            }
          }).filter((entry: any) => entry && entry.url);

          return {
            color: v.color,
            images: resolved.map((entry: any) => entry.url),
            // Base64 previews Sanity generates for every asset (~700 bytes).
            // They ride along in the JSON we already fetch, so a card can paint
            // its image immediately instead of holding an empty box.
            lqip: resolved.map((entry: any) => entry.lqip),
          };
        }).filter((v: any) => v.color && v.images.length > 0) : [];

        const allFlatImages = mappedVariants.flatMap((v: any) => v.images);
        const allFlatLqip = mappedVariants.flatMap((v: any) => v.lqip);

        return {
          ...p,
          // Ensure id is a number if it can be parsed, else use string _id as fallback
          id: typeof p.id === 'number' ? p.id : parseInt(p.id) || p._id,
          // Map images to a flat list of absolute URLs across all color variants
          images: allFlatImages,
          lqip: allFlatLqip,
          sizes: p.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
          colorVariants: mappedVariants,
          colors: (mappedVariants.length > 0)
            ? Array.from(new Set(mappedVariants.map((v: any) => v.color)))
            : ['Black'],
          tag: (p.collections && p.collections.length > 0) ? p.collections[0] : (p.tags?.[0] || p.tag || ''),
          tags: (p.collections && p.collections.length > 0) ? p.collections : (p.tags || (p.tag ? [p.tag] : [])),
          details: p.details || [],
          washCare: p.washCare || '',
          sizeGuideDesktopImages: (p.sizeGuideDesktopImages && p.sizeGuideDesktopImages.length > 0) ? p.sizeGuideDesktopImages.filter(Boolean) : [],
          sizeGuideMobileImages: (p.sizeGuideMobileImages && p.sizeGuideMobileImages.length > 0) ? p.sizeGuideMobileImages.filter(Boolean) : [],
          sizeGuideImages: (p.sizeGuideDesktopImages && p.sizeGuideDesktopImages.length > 0)
            ? p.sizeGuideDesktopImages.filter(Boolean)
            : ((p.sizeGuideMobileImages && p.sizeGuideMobileImages.length > 0)
                ? p.sizeGuideMobileImages.filter(Boolean)
                : (p.sizeGuideImages ? p.sizeGuideImages.filter(Boolean) : []))
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
      const res = await fetch('/api/categories');
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
      itemCount,
      "sizeGuideDesktopImages": sizeGuideDesktopImages[].asset->url,
      "sizeGuideMobileImages": sizeGuideMobileImages[].asset->url,
      "sizeGuideImages": sizeGuideImages[].asset->url
    }`;
    const sanityCategories = await client.fetch(query, {}, catalogCache);

    if (sanityCategories && sanityCategories.length > 0) {
      return sanityCategories.map((c: any) => ({
        ...c,
        image: c.image ? urlFor(c.image).url() : '',
        sizeGuideDesktopImages: (c.sizeGuideDesktopImages && c.sizeGuideDesktopImages.length > 0) ? c.sizeGuideDesktopImages.filter(Boolean) : [],
        sizeGuideMobileImages: (c.sizeGuideMobileImages && c.sizeGuideMobileImages.length > 0) ? c.sizeGuideMobileImages.filter(Boolean) : [],
        sizeGuideImages: (c.sizeGuideDesktopImages && c.sizeGuideDesktopImages.length > 0)
          ? c.sizeGuideDesktopImages.filter(Boolean)
          : ((c.sizeGuideMobileImages && c.sizeGuideMobileImages.length > 0)
              ? c.sizeGuideMobileImages.filter(Boolean)
              : (c.sizeGuideImages ? c.sizeGuideImages.filter(Boolean) : []))
      }));
    }

    return CATEGORIES;
  } catch (error) {
    console.error("Failed to fetch categories from Sanity. Falling back to local dataset.", error);
    return CATEGORIES;
  }
}

export interface HomePageShowcase {
  heroData?: HeroData;
  showNotificationBar?: boolean;
  notificationBar?: string[];
  mostPochhonder: Product[];
  taatkaDrop: Product[];
}

export async function getHomePageShowcase(): Promise<HomePageShowcase> {
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/showcase');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Client-side showcase proxy fetch failed. Falling back to direct query...", e);
    }
  }

  if (!isSanityConfigured()) {
    return { heroData: { desktopImage: undefined, mobileImages: [] }, showNotificationBar: true, notificationBar: [], mostPochhonder: [], taatkaDrop: [] };
  }

  try {
    const query = `*[_type == "homePage"] | order(_updatedAt desc)[0] {
      hero {
        desktopImage,
        mobileImages
      },
      showNotificationBar,
      notificationBar,
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
            images[] {
              ...,
              "lqip": asset->metadata.lqip
            }
          },
          sizes,
          "details": category->details,
          "washCare": category->washCare,
          "sizeGuideDesktopImages": category->sizeGuideDesktopImages[].asset->url,
          "sizeGuideMobileImages": category->sizeGuideMobileImages[].asset->url,
          "sizeGuideImages": category->sizeGuideImages[].asset->url
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
            images[] {
              ...,
              "lqip": asset->metadata.lqip
            }
          },
          sizes,
          "details": category->details,
          "washCare": category->washCare,
          "sizeGuideDesktopImages": category->sizeGuideDesktopImages[].asset->url,
          "sizeGuideMobileImages": category->sizeGuideMobileImages[].asset->url,
          "sizeGuideImages": category->sizeGuideImages[].asset->url
        }
      }
    }`;

    const showcaseData = await client.fetch(query, {}, catalogCache);

    const heroData: HeroData = {
      desktopImage: undefined,
      mobileImages: []
    };

    if (showcaseData?.hero) {
      if (showcaseData.hero.desktopImage) {
        try {
          heroData.desktopImage = urlFor(showcaseData.hero.desktopImage).url();
        } catch (e) {
          console.warn("Failed to resolve desktop hero image URL", e);
        }
      }
      if (showcaseData.hero.mobileImages && Array.isArray(showcaseData.hero.mobileImages)) {
        heroData.mobileImages = showcaseData.hero.mobileImages.map((img: any) => {
          try {
            return urlFor(img).url();
          } catch (e) {
            return '';
          }
        }).filter(Boolean);
      }
    }

    const mapProducts = (productsRaw: any[]) => {
      if (!productsRaw || !Array.isArray(productsRaw)) return [];
      return productsRaw.filter(Boolean).map((p: any) => {
        const mappedVariants = p.images ? p.images.map((v: any) => {
          // Resolve url and preview together so a failed image drops both and
          // the two arrays stay index-aligned.
          const resolved = (v.images || []).map((img: any) => {
            try {
              return { url: urlFor(img).url(), lqip: img?.lqip || '' };
            } catch {
              return null;
            }
          }).filter((entry: any) => entry && entry.url);

          return {
            color: v.color,
            images: resolved.map((entry: any) => entry.url),
            // Base64 previews Sanity generates for every asset (~700 bytes).
            // They ride along in the JSON we already fetch, so a card can paint
            // its image immediately instead of holding an empty box.
            lqip: resolved.map((entry: any) => entry.lqip),
          };
        }).filter((v: any) => v.color && v.images.length > 0) : [];

        const allFlatImages = mappedVariants.flatMap((v: any) => v.images);
        const allFlatLqip = mappedVariants.flatMap((v: any) => v.lqip);

        return {
          ...p,
          id: typeof p.id === 'number' ? p.id : parseInt(p.id) || p._id,
          images: allFlatImages,
          lqip: allFlatLqip,
          sizes: p.sizes || ['S', 'M', 'L', 'XL', 'XXL'],
          colorVariants: mappedVariants,
          colors: (mappedVariants.length > 0)
            ? Array.from(new Set(mappedVariants.map((v: any) => v.color)))
            : ['Black'],
          tag: (p.collections && p.collections.length > 0) ? p.collections[0] : (p.tags?.[0] || p.tag || ''),
          tags: (p.collections && p.collections.length > 0) ? p.collections : (p.tags || (p.tag ? [p.tag] : [])),
          details: p.details || [],
          washCare: p.washCare || '',
          sizeGuideDesktopImages: (p.sizeGuideDesktopImages && p.sizeGuideDesktopImages.length > 0) ? p.sizeGuideDesktopImages.filter(Boolean) : [],
          sizeGuideMobileImages: (p.sizeGuideMobileImages && p.sizeGuideMobileImages.length > 0) ? p.sizeGuideMobileImages.filter(Boolean) : [],
          sizeGuideImages: (p.sizeGuideDesktopImages && p.sizeGuideDesktopImages.length > 0)
            ? p.sizeGuideDesktopImages.filter(Boolean)
            : ((p.sizeGuideMobileImages && p.sizeGuideMobileImages.length > 0)
                ? p.sizeGuideMobileImages.filter(Boolean)
                : (p.sizeGuideImages ? p.sizeGuideImages.filter(Boolean) : []))
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
      heroData,
      showNotificationBar: showcaseData?.showNotificationBar !== false,
      notificationBar: (showcaseData?.notificationBar && Array.isArray(showcaseData.notificationBar)) ? showcaseData.notificationBar.filter(Boolean) : [],
      mostPochhonder,
      taatkaDrop
    };
  } catch (error) {
    console.error("Failed to fetch home page showcase from Sanity. Falling back to empty lists.", error);
    return { heroData: { desktopImage: undefined, mobileImages: [] }, showNotificationBar: true, notificationBar: [], mostPochhonder: [], taatkaDrop: [] };
  }
}

/**
 * Fetches the Login Page display image URL from Sanity CMS.
 */
export async function getLoginPageImage(): Promise<string | null> {
  if (!isSanityConfigured()) return null;
  try {
    const data = await client.fetch(`*[_type == "loginPage" && _id == "loginPage"][0]{
      "imageUrl": image.asset->url
    }`, {}, catalogCache);
    return data?.imageUrl || null;
  } catch (err) {
    console.error("Failed to fetch login page image from Sanity:", err);
    return null;
  }
}

/**
 * Fetches the About Page image URLs from Sanity CMS.
 */
export async function getAboutPageData(): Promise<{ heritageImage: string | null; commitmentImage: string | null }> {
  if (!isSanityConfigured()) return { heritageImage: null, commitmentImage: null };
  try {
    const data = await client.fetch(`*[_type == "aboutPage" && _id == "aboutPage"][0]{
      "heritageImage": ourHeritageImage.asset->url,
      "commitmentImage": ourCommitmentImage.asset->url
    }`, {}, catalogCache);
    return {
      heritageImage: data?.heritageImage || null,
      commitmentImage: data?.commitmentImage || null,
    };
  } catch (err) {
    console.error("Failed to fetch about page images from Sanity:", err);
    return { heritageImage: null, commitmentImage: null };
  }
}

/**
 * Fetches the Contact Page background image URL from Sanity CMS.
 */
export async function getContactPageImage(): Promise<string | null> {
  if (!isSanityConfigured()) return null;
  try {
    const data = await client.fetch(`*[_type == "contactPage" && _id == "contactPage"][0]{
      "imageUrl": backgroundImage.asset->url
    }`, {}, catalogCache);
    return data?.imageUrl || null;
  } catch (err) {
    console.error("Failed to fetch contact page image from Sanity:", err);
    return null;
  }
}

