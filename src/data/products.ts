import { Product, Category } from '../types/product';
import apuDurga from '../assets/apu-durga.png';
import netaji from '../assets/netaji.png';
import lifeRant from '../assets/life-rant.png';
import lyadhkhor from '../assets/friendly-neighborhood-lyadhkhor.png';

export const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Apu Durga x Starry Night",
    price: 499,
    category: "Unisex",
    tag: "Best Seller",
    images: [apuDurga],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 2,
    name: "Netaji: The Man, The Myth",
    price: 499,
    category: "Unisex",
    tag: "Best Seller",
    images: [netaji],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 3,
    name: "Life Rant",
    price: 499,
    category: "Unisex",
    tag: "New Arrival",
    images: [lifeRant],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 4,
    name: "Friendly Neighbourhood Lyadkhor",
    price: 499,
    category: "Unisex",
    tag: "New Arrival",
    images: [lyadhkhor],
    sizes: ["S", "M", "L", "XL", "XXL"]
  }
];

export const CATEGORIES: Category[] = [
  { name: "Top Picks", image: netaji.src || netaji },
  { name: "New Arrivals", image: lifeRant.src || lifeRant },
  { name: "Best Sellers", image: apuDurga.src || apuDurga }
];
