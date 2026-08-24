'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { Product } from '../types/product';
import { Button } from '../ui/button';
import { CARD_WIDTHS, imageProps, resolveImageUrl } from '../lib/image';

interface ProductCardProps {
  product: Product;
  /**
   * Set on cards that are above the fold. Those load eagerly at high priority;
   * everything below stays lazy so a long grid doesn't contend for bandwidth
   * with the images the customer can actually see.
   */
  priority?: boolean;
}

const COLOR_SWATCHES: Record<string, string> = {
  'black': '#171717',
  'white': '#FFFFFF',
  'gray': '#737373',
  'grey': '#737373',
  'maroon': '#800000',
  'navy blue': '#1E3A8A',
  'navy': '#1E3A8A',
};

// A card is ~50vw on phones (2-up), ~33vw on tablets, and ~25vw of a
// container that stops growing past ~1600px on desktop.
const CARD_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 380px';

const ProductCard: React.FC<ProductCardProps> = ({ product, priority = false }) => {
  const { addToCart } = useCart();
  // Narrow once so the rest of the component can index safely.
  const variants = product.colorVariants ?? [];
  const firstVariant = variants.length > 0 ? variants[0] : undefined;

  // Initialize with first variant color or fallback
  const [selectedColor, setSelectedColor] = useState<string>(
    firstVariant?.color ?? (product.colors?.[0] || 'Black')
  );

  // Initialize image with first variant image or fallback
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    firstVariant?.images[0]
  );

  // Sanity ships a ~700 byte base64 preview per asset. Painting it behind the
  // real image means the card is never an empty grey box.
  const [placeholder, setPlaceholder] = useState<string>(
    (firstVariant ? firstVariant.lqip?.[0] : product.lqip?.[0]) || ''
  );

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    const variant = variants.find((v) => v.color === colorName);
    if (variant && variant.images.length > 0) {
      setSelectedImage(variant.images[0]);
      setPlaceholder(variant.lqip?.[0] || '');
    }
  };

  const activeDisplayImage = selectedImage || resolveImageUrl(product.images[0]);
  const img = imageProps(activeDisplayImage, {
    widths: CARD_WIDTHS,
    sizes: CARD_SIZES,
    fallbackWidth: 400,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      viewport={{ once: true }}
      className="group relative"
    >
      {/* Image Container — aspect ratio is fixed so the grid never reflows
          once images land. */}
      <div
        className="relative aspect-[4/5] overflow-hidden bg-neutral-50 mb-3 md:mb-6 group-hover:shadow-premium transition-all duration-500"
        style={placeholder ? {
          backgroundImage: `url(${placeholder})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >

        <Link href={`/product/${product.slug || product.id}`} className="block w-full h-full">
          <motion.img
            src={img.src}
            srcSet={img.srcSet}
            sizes={img.sizes}
            alt={product.name}
            width={1000}
            height={1250}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            className="w-full h-full object-cover transition-all duration-[1.5s] cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-110 group-hover:rotate-1"
          />
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* Quick Actions (Desktop only) */}
        <div className="hidden lg:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center space-x-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-30 w-full px-6">
          <Button
            onClick={() => addToCart(product, 1, product.sizes[0], selectedColor)}
            className="flex-1 h-12 bg-[#a6101b] text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-[#8e0c15] transition-colors shadow-2xl rounded-none cursor-pointer"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add to Cart</span>
          </Button>
        </div>

        {/* Mobile Quick Add Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product, 1, product.sizes[0], selectedColor);
          }}
          className="lg:hidden absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/90 text-white flex items-center justify-center shadow-lg active:scale-90 transition-all z-30 cursor-pointer"
          title="Add to Cart"
        >
          <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
        </button>
      </div>

      {/* Product Info */}
      <div className="flex flex-col text-left">
        <div className="mb-1">
          <Link
            href={`/product/${product.slug || product.id}`}
            className="text-xs sm:text-sm md:text-lg font-display font-normal leading-tight"
          >
            {product.name}
          </Link>
        </div>
        <div className="flex items-center justify-start">
          <span className="font-display font-normal text-base md:text-lg text-neutral-900">₹{product.price.toLocaleString('en-IN')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
