export interface ProductImage {
  src?: string;
  [key: string]: any;
}

/** One colour option of a product, with its own gallery. */
export interface ColorVariant {
  color: string;
  /** Absolute Sanity CDN URLs. Add width/quality via `lib/image` before rendering. */
  images: string[];
  /**
   * Base64 preview per image, index-aligned with `images`. Sanity generates
   * these automatically (~700 bytes each) and they travel inside the product
   * JSON, so a card can paint immediately with no extra request.
   */
  lqip?: string[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  tag?: string;
  tags?: string[];
  /** Flattened gallery across every colour variant. */
  images: any[];
  /** Base64 previews, index-aligned with `images`. See `ColorVariant.lqip`. */
  lqip?: string[];
  sizes: string[];
  colors?: string[];
  colorVariants?: ColorVariant[];
  details?: string[];
  washCare?: string;
  sizeGuideDesktopImages?: string[];
  sizeGuideMobileImages?: string[];
  sizeGuideImages?: string[];
  [key: string]: any;
}

export interface Category {
  _id?: string;
  name: string;
  image: any;
  itemCount?: string;
  sizeGuideDesktopImages?: string[];
  sizeGuideMobileImages?: string[];
  sizeGuideImages?: string[];
  [key: string]: any;
}

export interface HeroData {
  desktopImage?: string;
  mobileImages?: string[];
}
