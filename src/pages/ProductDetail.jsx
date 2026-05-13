import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faStar, faTruckFast, faRotateLeft, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const product = PRODUCTS.find(p => p.id === parseInt(id));
  
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0]);
      setActiveImage(0);
      window.scrollTo(0, 0);
    }
  }, [product, id]);

  if (!product) return <div className="pt-32 text-center">Product not found</div>;

  const relatedProducts = PRODUCTS.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const STANDARD_DESCRIPTION = "Our signature oversized tee, crafted from ultra-heavy 240+ GSM premium cotton. Featuring a perfect drop shoulder silhouette and built for maximum comfort and durability, it's the ultimate essential for the modern urban wardrobe.";
  const STANDARD_DETAILS = [
    "100% Premium Organic Cotton",
    "240+ GSM Heavyweight Fabric",
    "Standard Oversized Drop-Shoulder Fit",
    "High-Density Cultural Graphic Print",
    "Pre-shrunk & Bio-washed"
  ];

  return (
    <div className="pt-20 bg-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
              <motion.img 
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`aspect-square overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <nav className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              <Link to="/" className="hover:text-black">Home</Link>
              <span className="mx-2">/</span>
              <Link to="/shop" className="hover:text-black">Shop</Link>
              <span className="mx-2">/</span>
              <span className="text-black">{product.name}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-2xl font-display font-bold">₹{product.price.toLocaleString('en-IN')}</span>
              <div className="flex items-center text-accent text-xs">
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <FontAwesomeIcon icon={faStar} />
                <span className="ml-2 text-neutral-400 font-bold uppercase tracking-widest">(24 Reviews)</span>
              </div>
            </div>

            <p className="text-neutral-500 leading-relaxed mb-10 pb-10 border-b border-neutral-100">
              {STANDARD_DESCRIPTION}
            </p>

            {/* Selectors */}
            <div className="space-y-8 mb-10">
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Select Size</h3>
                  <button className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-12 flex items-center justify-center border text-xs font-bold uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500 hover:border-black hover:text-black'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Quantity</h3>
                <div className="flex items-center w-32 border border-neutral-200">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faMinus} size="xs" />
                  </button>
                  <span className="flex-1 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} size="xs" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button 
                onClick={() => addToCart(product, quantity, selectedSize, 'Original')}
                className="flex-[2] btn btn-primary py-5"
              >
                Add to Bag
              </button>
              <button className="flex-1 btn btn-outline py-5">
                Wishlist
              </button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-neutral-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-600">
                  <FontAwesomeIcon icon={faTruckFast} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Fast Delivery</span>
                  <span className="text-[10px] text-neutral-400 uppercase">2-4 Business Days</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-600">
                  <FontAwesomeIcon icon={faRotateLeft} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Free Returns</span>
                  <span className="text-[10px] text-neutral-400 uppercase">Within 30 Days</span>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-600">
                  <FontAwesomeIcon icon={faShieldHalved} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest">Secure Payment</span>
                  <span className="text-[10px] text-neutral-400 uppercase">100% Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Specs */}
      <section className="section-padding bg-neutral-50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-8">Premium Quality</h2>
              <ul className="space-y-4">
                {STANDARD_DETAILS.map((detail, idx) => (
                  <li key={idx} className="flex items-start text-sm text-neutral-600">
                    <span className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-8">Care Instructions</h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Machine wash cold with like colors. Tumble dry low. Do not bleach. Iron on low heat if necessary. 
                For best results and to maintain the longevity of the fabric, we recommend air drying.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      {relatedProducts.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl uppercase tracking-tighter mb-12">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
