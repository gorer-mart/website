'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
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
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 mb-6 group-hover:shadow-premium transition-all duration-500">
        
        <Link href={`/product/${product.id}`} className="block w-full h-full">
          <motion.img 
            src={activeDisplayImage} 
            alt={product.name} 
            className="w-full h-full object-cover transition-all duration-[1.5s] cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-110 group-hover:rotate-1"
          />
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* Quick Actions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-30 w-full px-6">
          <Button 
            onClick={() => addToCart(product, 1, product.sizes[0], selectedColor)}
            className="flex-1 h-12 bg-black text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-neutral-800 transition-colors shadow-2xl rounded-none"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add to Cart</span>
          </Button>
          <Link 
            href={`/product/${product.id}`}
            className="w-12 h-12 bg-white text-black border border-neutral-100 flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-2xl"
          >
            <FontAwesomeIcon icon={faEye} className="text-xs" />
          </Link>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col text-center md:text-left">
        <div className="mb-2">
          <Link 
            href={`/product/${product.id}`} 
            className="text-xs font-bold uppercase tracking-[0.1em] text-neutral-400 hover:text-black transition-colors block mb-1"
          >
            {product.category}
          </Link>
          <Link 
            href={`/product/${product.id}`} 
            className="text-base md:text-lg font-display font-bold uppercase tracking-tighter hover:text-accent transition-colors leading-tight line-clamp-1"
          >
            {product.name}
          </Link>
        </div>
        <div className="flex items-center justify-center md:justify-start space-x-2">
          <span className="font-display font-black text-lg">₹{product.price.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-neutral-400 line-through opacity-50">₹{(product.price + 500).toLocaleString('en-IN')}</span>
        </div>

        {/* Color swatches */}
        {hasVariants && (
          <div className="flex items-center justify-center md:justify-start gap-2 mt-3">
            {product.colorVariants.map((v: any) => {
              const swatchColor = COLOR_SWATCHES[v.color.toLowerCase().trim()] || v.color;
              const isSelected = selectedColor === v.color;
              const isWhite = ['white', '#ffffff', 'offwhite'].includes(v.color.toLowerCase().trim());
              return (
                <button
                  key={v.color}
                  onClick={(e) => {
                    e.preventDefault();
                    handleColorChange(v.color);
                  }}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    isWhite ? 'border border-neutral-300' : ''
                  } ${
                    isSelected ? 'ring-1 ring-black ring-offset-1 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: swatchColor }}
                  title={v.color}
                />
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ProductCard;
