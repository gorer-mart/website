'use client';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types/product';
import { cn } from '../lib/utils';

const BRAND_RED = '#a6101b';

/**
 * Save/remove heart, shared by product cards and the product page.
 *
 * State comes from `WishlistContext`, so the same product shows the same heart
 * everywhere on the page and updates together.
 *
 * `overlay` is for hearts sitting on top of a product image; `inline` is for
 * hearts in a row of buttons.
 */
export const WishlistButton: React.FC<{
  product: Product;
  variant?: 'overlay' | 'inline';
  className?: string;
}> = ({ product, variant = 'overlay', className }) => {
  const { isSaved, isPending, toggle } = useWishlist();

  const productId = typeof product._id === 'string' && product._id
    ? product._id
    : String(product.id ?? '');

  const saved = isSaved(productId);
  const busy = isPending(productId);

  const handleClick = (e: React.MouseEvent) => {
    // Cards wrap their image in a link to the product; saving must not navigate.
    e.preventDefault();
    e.stopPropagation();
    toggle(product);
  };

  if (variant === 'inline') {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        className={cn(
          'inline-flex items-center justify-center gap-2 border-2 uppercase tracking-wider text-sm font-semibold transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:opacity-60',
          saved
            ? 'border-[#a6101b] bg-[#a6101b]/5 text-[#a6101b]'
            : 'border-black bg-transparent text-black hover:bg-black hover:text-white active:scale-95',
          className
        )}
      >
        <FontAwesomeIcon
          icon={busy ? faSpinner : saved ? faHeartSolid : faHeartOutline}
          className={busy ? 'animate-spin' : undefined}
        />
        <span>{saved ? 'Saved' : 'Wishlist'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      title={saved ? 'Remove from wishlist' : 'Save to wishlist'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-md backdrop-blur-sm',
        'transition-all duration-200 hover:bg-white active:scale-90 disabled:opacity-60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black',
        className
      )}
      style={{ color: saved ? BRAND_RED : '#171717' }}
    >
      <FontAwesomeIcon
        icon={busy ? faSpinner : saved ? faHeartSolid : faHeartOutline}
        className={cn('text-sm', busy && 'animate-spin')}
      />
    </button>
  );
};

export default WishlistButton;
