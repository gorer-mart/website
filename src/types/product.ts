export interface ProductImage {
  src?: string;
  [key: string]: any;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  tag?: string;
  tags?: string[];
  images: any[];
  sizes: string[];
  colors?: string[];
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
