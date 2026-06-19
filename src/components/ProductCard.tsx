'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { Product } from '../types/product';
import { Button } from '../ui/button';

interface ProductCardProps {
  product: Product;
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

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const hasVariants = product.colorVariants && product.colorVariants.length > 0;

  // Initialize with first variant color or fallback
  const [selectedColor, setSelectedColor] = useState<string>(
    hasVariants ? product.colorVariants[0].color : (product.colors?.[0] || 'Black')
  );

  // Initialize image with first variant image or fallback
  const [selectedImage, setSelectedImage] = useState<string | undefined>(
    hasVariants ? product.colorVariants[0].images[0] : undefined
  );

  const handleColorChange = (colorName: string) => {
    setSelectedColor(colorName);
    if (hasVariants) {
      const variant = product.colorVariants.find((v: any) => v.color === colorName);
      if (variant && variant.images.length > 0) {
        setSelectedImage(variant.images[0]);
      }
    }
  };

  const activeDisplayImage = selectedImage || (product.images[0]?.src || product.images[0]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 mb-3 md:mb-6 group-hover:shadow-premium transition-all duration-500">
        
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <motion.img 
            src={activeDisplayImage} 
            alt={product.name} 
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
            href={`/product/${product.id}`} 
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
