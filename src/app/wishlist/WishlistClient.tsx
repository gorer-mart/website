'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faXmark,
  faBagShopping,
  faChevronDown,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../ui/dialog';
import { CARD_WIDTHS, imageProps, resolveImageUrl, sizedImageUrl } from '../../lib/image';
import { WishlistEntry } from '../../context/WishlistContext';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' },
];

const CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px';

/**
 * Saved items for the signed-in customer.
 *
 * Kept deliberately plain: a filter row, a grid, and one clear action per card.
 * Filtering happens in memory — the whole wishlist arrives in a single request,
 * so paging or refetching per filter would add latency for no benefit.
 */
const WishlistClient: React.FC = () => {
  const { items, loading, toggle, isPending } = useWishlist();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToCart } = useCart();
  const router = useRouter();

  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [query, setQuery] = useState<string>('');

  // ---- Move-to-bag modal ----
  // The card stays clean; the size choice happens in a focused dialog.
  const [moveTarget, setMoveTarget] = useState<WishlistEntry | null>(null);
  const [chosenSize, setChosenSize] = useState<string>('');
  const [chosenColor, setChosenColor] = useState<string>('');
  const [isMoving, setIsMoving] = useState<boolean>(false);

  /** Categories actually present, so a filter can never yield an empty grid. */
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of items) {
      const name = entry.product.category?.trim();
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    return Array.from(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = items.filter((entry) => {
      const p = entry.product;
      const matchesCategory =
        categoryFilter === 'All' || (p.category || '').toLowerCase() === categoryFilter.toLowerCase();
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => a.product.price - b.product.price);
        break;
      case 'price-high':
        sorted.sort((a, b) => b.product.price - a.product.price);
        break;
      case 'name':
        sorted.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;
      default:
        // The API already returns newest-first; make it explicit so the option
        // still sorts correctly after any client-side change.
        sorted.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
    return sorted;
  }, [items, categoryFilter, sortBy, query]);

  /**
   * Open the size dialog for a saved item.
   *
   * Where there is only one option the choice is pre-selected, so a
   * single-size product is one confirm away rather than a pointless decision.
   */
  const openMoveDialog = (entry: WishlistEntry) => {
    const sizes = entry.product.sizes || [];
    const colors = entry.product.colors || [];
    setChosenSize(sizes.length === 1 ? sizes[0] : '');
    setChosenColor(colors.length === 1 ? colors[0] : '');
    setMoveTarget(entry);
  };

  const closeMoveDialog = () => {
    setMoveTarget(null);
    setChosenSize('');
    setChosenColor('');
  };

  /**
   * Move the item into the bag.
   *
   * "Move" is literal: the item is added to the bag and then dropped from the
   * wishlist, which is what the label promises and what shoppers expect from
   * this control. Removal only runs once the item is actually in the bag.
   */
  const handleConfirmMove = async () => {
    if (!moveTarget || !chosenSize) return;

    const { product } = moveTarget;
    const colors = product.colors || [];
    // Only meaningful when the product actually has colour variants.
    const color = colors.length > 0 ? chosenColor || colors[0] : undefined;

    setIsMoving(true);
    try {
      // Dismiss the dialog before adding to the bag. `addToCart` opens the cart
      // drawer, and letting that happen while Radix is still unwinding the
      // dialog's focus trap and body scroll lock leaves the page unclickable.
      closeMoveDialog();
      addToCart(product, 1, chosenSize, color);
      // Best-effort: the item is already in the bag, so a failed removal must
      // not read as a failed move. `toggle` surfaces its own error toast.
      await toggle(product);
    } finally {
      setIsMoving(false);
    }
  };

  const hasFilters = categoryFilter !== 'All' || query.trim() !== '' || sortBy !== 'recent';

  /* ---- Signed out ---- */
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
        <div className="container mx-auto max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-6 text-neutral-300">
            <FontAwesomeIcon icon={faHeart} className="text-2xl" />
          </div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tighter mb-3">
            Your Wishlist
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-8">
            Sign in to save the pieces you love and find them here on any device.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push('/login?redirect=/wishlist')}>Sign In</Button>
            <Button asChild variant="outline">
              <Link href="/shop">Browse Shop</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  /* ---- Loading ---- */
  if (authLoading || (loading && items.length === 0)) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          Loading your wishlist…
        </p>
      </div>
    );
  }

  /* ---- Empty ---- */
  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 px-6 min-h-screen bg-white">
        <div className="container mx-auto max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-6 text-neutral-300">
            <FontAwesomeIcon icon={faHeart} className="text-2xl" />
          </div>
          <h1 className="text-3xl font-display font-bold uppercase tracking-tighter mb-3">
            Nothing Saved Yet
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-8">
            Tap the heart on any product to keep it here for later.
          </p>
          <Button asChild>
            <Link href="/shop">Start Browsing</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-24 min-h-screen bg-white">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        {/* Header */}
        <header className="mb-10 pt-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tighter">
            Your Wishlist
          </h1>
          <p className="text-neutral-500 text-sm mt-2">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved
          </p>
        </header>

        {/* Filters */}
        <div className="border-y border-neutral-100 py-4 mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Category pills */}
            {categories.length > 0 && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setCategoryFilter('All')}
                    className={`flex-shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${
                      categoryFilter === 'All'
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                    }`}
                  >
                    All ({items.length})
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setCategoryFilter(c.name)}
                      className={`flex-shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${
                        categoryFilter === c.name
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                      }`}
                    >
                      {c.name} ({c.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 flex-shrink-0">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search saved items"
                className="h-11 w-full lg:w-56 rounded-none border-neutral-200 text-xs"
              />
              <div className="relative flex-shrink-0">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sort saved items"
                  className="h-11 appearance-none bg-white border border-neutral-200 pl-4 pr-9 text-xs font-medium text-neutral-800 focus:outline-none focus:border-black cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid */}
        {visible.length === 0 ? (
          <div className="py-24 text-center">
            <h2 className="text-xl font-display font-bold uppercase tracking-tighter mb-3">
              No Matches
            </h2>
            <p className="text-sm text-neutral-500 mb-6">
              Nothing in your wishlist matches these filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryFilter('All');
                setQuery('');
                setSortBy('recent');
              }}
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-x-8">
            <AnimatePresence mode="popLayout">
              {visible.map((entry) => {
                const product = entry.product;
                const productId =
                  typeof product._id === 'string' ? product._id : String(product.id ?? '');
                const busy = isPending(productId);
                const img = imageProps(resolveImageUrl(product.images?.[0]), {
                  widths: CARD_WIDTHS,
                  sizes: CARD_SIZES,
                  fallbackWidth: 400,
                });

                return (
                  <motion.div
                    key={entry.wishlistItemId}
                    layout
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25 }}
                    className="group relative flex flex-col"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 mb-3">
                      <Link
                        href={`/product/${product.slug || product.id}`}
                        className="block w-full h-full"
                      >
                        <img
                          src={img.src}
                          srcSet={img.srcSet}
                          sizes={img.sizes}
                          alt={product.name}
                          width={1000}
                          height={1250}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </Link>

                      {/* Remove — the primary action on this page, so it is an
                          explicit X rather than a heart to un-toggle. */}
                      <button
                        type="button"
                        onClick={() => toggle(product)}
                        disabled={busy}
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                        className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-neutral-700 hover:bg-white hover:text-[#a6101b] active:scale-90 transition-all disabled:opacity-60 cursor-pointer"
                      >
                        <FontAwesomeIcon
                          icon={busy ? faSpinner : faXmark}
                          className={busy ? 'animate-spin text-sm' : 'text-sm'}
                        />
                      </button>
                    </div>

                    <div className="flex flex-col flex-grow">
                      {product.category && (
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
                          {product.category}
                        </p>
                      )}
                      <Link
                        href={`/product/${product.slug || product.id}`}
                        className="text-xs sm:text-sm md:text-base font-display leading-tight hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="font-display text-base md:text-lg text-neutral-900 mt-1 mb-3">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>

                      {/* Size is chosen in the dialog, keeping the card to one
                          clear action. */}
                      <Button
                        onClick={() => openMoveDialog(entry)}
                        disabled={busy}
                        className="mt-auto w-full h-11 text-[10px]"
                      >
                        <FontAwesomeIcon icon={faBagShopping} className="mr-2" />
                        Move to Bag
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {hasFilters && visible.length > 0 && (
          <p className="mt-10 text-xs text-neutral-400 text-center">
            Showing {visible.length} of {items.length} saved items
          </p>
        )}
      </div>

      {/* ---------------- Move to bag: size selection ---------------- */}
      <Dialog open={!!moveTarget} onOpenChange={(open) => !open && closeMoveDialog()}>
        <DialogContent className="max-w-md p-6 sm:p-8 gap-5">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">Select a Size</DialogTitle>
            <DialogDescription className="normal-case tracking-normal text-neutral-500 text-xs">
              Choose a size to move this item into your bag.
            </DialogDescription>
          </DialogHeader>

          {moveTarget && (
            <>
              {/* Product being moved, so the dialog is unambiguous when several
                  saved items look alike. */}
              <div className="flex gap-4">
                <div className="w-20 h-24 bg-neutral-100 flex-shrink-0 overflow-hidden">
                  <img
                    src={sizedImageUrl(resolveImageUrl(moveTarget.product.images?.[0]), 200)}
                    alt={moveTarget.product.name}
                    width={80}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  {moveTarget.product.category && (
                    <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-1">
                      {moveTarget.product.category}
                    </p>
                  )}
                  <p className="font-display text-sm leading-tight">{moveTarget.product.name}</p>
                  <p className="font-display text-base mt-1">
                    ₹{moveTarget.product.price.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
                  Size
                </p>
                {(moveTarget.product.sizes?.length ?? 0) > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {moveTarget.product.sizes.map((size) => {
                      const active = chosenSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setChosenSize(size)}
                          aria-pressed={active}
                          className={`min-w-[48px] h-11 px-3 border text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                            active
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-neutral-500 border-neutral-200 hover:border-black hover:text-black'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-500">
                    This item has no sizes listed. Open the product page to add it.
                  </p>
                )}
              </div>

              {/* Colour — shown only when the product genuinely offers a choice. */}
              {(moveTarget.product.colors?.length ?? 0) > 1 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-3">
                    Colour
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {moveTarget.product.colors!.map((color) => {
                      const active = chosenColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setChosenColor(color)}
                          aria-pressed={active}
                          className={`h-11 px-4 border text-xs font-medium capitalize transition-all cursor-pointer ${
                            active
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-neutral-500 border-neutral-200 hover:border-black hover:text-black'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleConfirmMove}
                  disabled={!chosenSize || isMoving}
                  className="flex-[2] h-12"
                >
                  {isMoving ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faBagShopping} className="mr-2" />
                      {chosenSize ? 'Move to Bag' : 'Select a Size'}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={closeMoveDialog}
                  disabled={isMoving}
                  className="flex-1 h-12"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-[10px] text-neutral-400 leading-relaxed text-center">
                This item will be removed from your wishlist once it is in your bag.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WishlistClient;
