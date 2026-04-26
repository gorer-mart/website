import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-4">
        {product.tag && (
          <span className="absolute top-4 left-4 z-10 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1">
            {product.tag}
          </span>
        )}
        
        <Link to={`/product/${product.id}`}>
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>

        {/* Quick Add Button */}
        <button 
          onClick={() => addToCart(product, 1, product.sizes[0], product.colors[0])}
          className="absolute bottom-4 right-4 w-12 h-12 bg-white text-black flex items-center justify-center opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-black hover:text-white shadow-lg"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-between items-start mb-1">
          <Link to={`/product/${product.id}`} className="text-sm font-bold uppercase tracking-tight hover:text-accent transition-colors leading-tight max-w-[80%]">
            {product.name}
          </Link>
          <span className="font-display font-bold text-sm">${product.price.toFixed(2)}</span>
        </div>
        <p className="text-xs text-neutral-500 uppercase tracking-widest">{product.category}</p>
      </div>
    </motion.div>
  );
};

export default ProductCard;
