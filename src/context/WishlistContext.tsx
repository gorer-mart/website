'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { useToast } from '../ui/use-toast';
import { Product } from '../types/product';

export interface WishlistEntry {
  wishlistItemId: string;
  addedAt: string;
  product: Product;
}

interface WishlistContextType {
  /** Full saved items, populated after `refresh()`. */
  items: WishlistEntry[];
  /** Sanity ids of saved products — what the heart icons check against. */
  savedIds: Set<string>;
  count: number;
  loading: boolean;
  /** True while a specific product's save/remove is in flight. */
  isPending: (productId: string) => boolean;
  isSaved: (productId: string) => boolean;
  toggle: (product: Product) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

/** Sanity document id for a catalog product, whatever shape it arrived in. */
function sanityIdOf(product: Product): string {
  if (typeof product._id === 'string' && product._id) return product._id;
  // Older cart/catalog records fall back to the numeric id.
  return String(product.id ?? '');
}

/**
 * Wishlist state shared across the storefront.
 *
 * The heart appears on product cards, the product page and the navbar count,
 * so membership lives here rather than being fetched per component. Writes are
 * optimistic and reverted on failure — a heart that waits for a round trip
 * before filling feels broken.
 */
export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setSavedIds(new Set());
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wishlist', { cache: 'no-store' });
      if (!res.ok) return;

      const data = await res.json().catch(() => null);
      if (!data?.success) return;

      setItems(data.items || []);
      setSavedIds(new Set<string>(data.productIds || []));
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Load once the session is known, and clear on sign-out so a shared device
  // never shows the previous customer's saved items.
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      refresh();
    } else {
      setItems([]);
      setSavedIds(new Set());
    }
  }, [authLoading, isAuthenticated, refresh]);

  const isSaved = useCallback((productId: string) => savedIds.has(productId), [savedIds]);
  const isPending = useCallback((productId: string) => pending.has(productId), [pending]);

  const markPending = (productId: string, on: boolean) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (on) next.add(productId);
      else next.delete(productId);
      return next;
    });
  };

  const toggle = useCallback(
    async (product: Product) => {
      const productId = sanityIdOf(product);
      if (!productId) return;

      if (!isAuthenticated) {
        toast({
          title: 'Sign in to save items',
          description: 'Your wishlist is kept with your account.',
        });
        // The login page reads `redirect`, not `next`, and validates it is a
        // same-origin relative path.
        router.push('/login?redirect=/wishlist');
        return;
      }

      if (pending.has(productId)) return;

      const wasSaved = savedIds.has(productId);
      const previousItems = items;

      // Optimistic flip.
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(productId);
        else next.add(productId);
        return next;
      });
      if (wasSaved) {
        setItems((prev) => prev.filter((entry) => sanityIdOf(entry.product) !== productId));
      }
      markPending(productId, true);

      try {
        const res = await fetch('/api/wishlist', {
          method: wasSaved ? 'DELETE' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || 'Could not update your wishlist.');
        }

        if (!wasSaved) {
          // Pull the canonical list so the new entry carries its real id and
          // timestamp rather than a guess made here.
          refresh();
          toast({ title: 'Saved to wishlist', description: product.name });
        } else {
          toast({ title: 'Removed from wishlist', description: product.name });
        }
      } catch (error: any) {
        // Put the previous state back — the heart must never claim a save that
        // did not happen.
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(productId);
          else next.delete(productId);
          return next;
        });
        if (wasSaved) setItems(previousItems);

        toast({
          title: 'Wishlist not updated',
          description: error.message || 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        markPending(productId, false);
      }
    },
    [isAuthenticated, items, pending, refresh, router, savedIds, toast]
  );

  const remove = useCallback(
    async (productId: string) => {
      const entry = items.find((i) => sanityIdOf(i.product) === productId);
      if (entry) {
        await toggle(entry.product);
        return;
      }

      // Not in the loaded list (e.g. removed from another tab) — delete directly.
      try {
        await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
          method: 'DELETE',
        });
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      } catch (error) {
        console.error('Failed to remove wishlist item:', error);
      }
    },
    [items, toggle]
  );

  const value = useMemo(
    () => ({
      items,
      savedIds,
      count: savedIds.size,
      loading,
      isPending,
      isSaved,
      toggle,
      remove,
      refresh,
    }),
    [items, savedIds, loading, isPending, isSaved, toggle, remove, refresh]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
