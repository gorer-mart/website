'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product } from '../types/product';

export const MAX_QUANTITY_PER_ITEM = 10;

export interface CartItem extends Product {
  quantity: number;
  selectedSize: string;
  selectedColor?: string;
}

type CartItemId = CartItem['id'];

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product, quantity?: number, size?: string, color?: string) => void;
  removeFromCart: (productId: CartItemId, size: string) => void;
  updateQuantity: (productId: CartItemId, size: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'gorer_mart_cart';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

/**
 * Cart state is persisted to localStorage, which the user can edit freely.
 * Everything read back is therefore treated as untrusted: shapes are checked
 * and quantities clamped. Prices here are for display only — the server
 * re-prices every line from the CMS at checkout.
 */
function sanitizeStoredCart(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];

  return raw.reduce<CartItem[]>((acc, entry) => {
    if (!entry || typeof entry !== 'object') return acc;
    const item = entry as Partial<CartItem>;

    if (item.id === undefined || item.id === null) return acc;
    if (typeof item.name !== 'string') return acc;
    if (!Array.isArray(item.images)) return acc;

    const price = Number(item.price);
    if (!Number.isFinite(price) || price < 0) return acc;

    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) return acc;

    acc.push({
      ...(item as CartItem),
      price,
      quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM),
      selectedSize: typeof item.selectedSize === 'string' ? item.selectedSize : '',
      selectedColor: typeof item.selectedColor === 'string' ? item.selectedColor : undefined,
    });
    return acc;
  }, []);
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [hydrated, setHydrated] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(STORAGE_KEY);
      if (savedCart) {
        setCart(sanitizeStoredCart(JSON.parse(savedCart)));
      }
    } catch (e) {
      console.error('Failed to restore cart:', e);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    // Skip the first pass so an empty initial state cannot overwrite a stored
    // cart before hydration has finished reading it.
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to persist cart:', e);
    }
  }, [cart, hydrated]);

  const addToCart = useCallback((product: Product, quantity = 1, size = 'M', color?: string) => {
    const requested = Math.max(1, Math.floor(Number(quantity) || 1));

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(
        item =>
          item.id === product.id &&
          item.selectedSize === size &&
          (item.selectedColor ?? undefined) === (color ?? undefined)
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        const existing = newCart[existingIndex];
        newCart[existingIndex] = {
          ...existing,
          quantity: Math.min(existing.quantity + requested, MAX_QUANTITY_PER_ITEM),
        };
        return newCart;
      }

      return [
        ...prevCart,
        {
          ...product,
          quantity: Math.min(requested, MAX_QUANTITY_PER_ITEM),
          selectedSize: size,
          selectedColor: color,
        },
      ];
    });
    setIsCartOpen(true);
  }, []);

  const removeFromCart = useCallback((productId: CartItemId, size: string) => {
    setCart(prevCart => prevCart.filter(
      item => !(item.id === productId && item.selectedSize === size)
    ));
  }, []);

  const updateQuantity = useCallback((productId: CartItemId, size: string, quantity: number) => {
    const next = Math.floor(Number(quantity));
    if (!Number.isFinite(next) || next < 1 || next > MAX_QUANTITY_PER_ITEM) return;

    setCart(prevCart => prevCart.map(item =>
      (item.id === productId && item.selectedSize === size)
        ? { ...item, quantity: next }
        : item
    ));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((total, item) => total + item.quantity, 0),
    [cart]
  );

  const value = useMemo(() => ({
    cart,
    isCartOpen,
    setIsCartOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    cartCount,
  }), [cart, isCartOpen, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
