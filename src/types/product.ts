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
  images: any[];
  sizes: string[];
  colors?: string[];
  description?: string;
  details?: string[];
  [key: string]: any;
}

export interface Category {
  name: string;
  image: any;
  itemCount?: string;
  [key: string]: any;
}
