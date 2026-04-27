import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-neutral-50 mb-6 group-hover:shadow-premium transition-all duration-500">
        {product.tag && (
          <div className="absolute top-4 left-4 z-20 flex flex-col space-y-2">
            <span className="bg-black text-white text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-sm shadow-lg">
              {product.tag}
            </span>
          </div>
        )}
        
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <motion.img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover transition-all duration-[1.5s] cubic-bezier(0.4, 0, 0.2, 1) group-hover:scale-110 group-hover:rotate-1"
          />
          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </Link>

        {/* Quick Actions */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 z-30 w-full px-6">
          <button 
            onClick={() => addToCart(product, 1, product.sizes[0], product.colors?.[0] || 'Black')}
            className="flex-1 h-12 bg-black text-white text-[10px] font-bold uppercase tracking-widest flex items-center justify-center space-x-2 hover:bg-neutral-800 transition-colors shadow-2xl"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add to Cart</span>
          </button>
          <Link 
            to={`/product/${product.id}`}
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
            to={`/product/${product.id}`} 
            className="text-xs font-bold uppercase tracking-[0.1em] text-neutral-400 hover:text-black transition-colors block mb-1"
          >
            {product.category}
          </Link>
          <Link 
            to={`/product/${product.id}`} 
            className="text-base md:text-lg font-display font-bold uppercase tracking-tighter hover:text-accent transition-colors leading-tight line-clamp-1"
          >
            {product.name}
          </Link>
        </div>
        <div className="flex items-center justify-center md:justify-start space-x-2">
          <span className="font-display font-black text-lg">₹{product.price.toLocaleString('en-IN')}</span>
          <span className="text-[10px] text-neutral-400 line-through opacity-50">₹{(product.price + 500).toLocaleString('en-IN')}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
