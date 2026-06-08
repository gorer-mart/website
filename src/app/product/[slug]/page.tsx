'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faStar, faTruckFast, faRotateLeft, faShieldHalved, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS } from '../../../data/products';
import { getProducts } from '../../../lib/sanity';
import { Product } from '../../../types/product';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../../../components/ProductCard';
import { Button } from '../../../ui/button';

const ProductDetail: React.FC = () => {
  const params = useParams();
  const id = params?.slug as string;
  const { addToCart } = useCart();
  
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [product, setProduct] = useState<Product | undefined>(PRODUCTS.find(p => p.id === parseInt(id)));
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPos = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollPos / width);
      if (index !== activeImage && index >= 0 && index < displayImages.length) {
        setActiveImage(index);
      }
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const fetched = await getProducts();
        setProductsList(fetched);
        
        const found = fetched.find(p => String(p.id) === id || p._id === id);
        if (found) {
          setProduct(found);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || 'M');
      setSelectedColor(product.colors?.[0] || 'Original');
      setActiveImage(0);
      window.scrollTo(0, 0);
    }
  }, [product]);

  if (!product) {
    if (loading) {
      return <div className="pt-32 text-center min-h-[50vh] font-display uppercase tracking-widest text-xs">Loading product...</div>;
    }
    return <div className="pt-32 text-center min-h-[50vh]">Product not found</div>;
  }

  const relatedProducts = productsList.filter(p => p.category === product.category && String(p.id) !== id && p._id !== id).slice(0, 4);

  const STANDARD_DETAILS = [
    "100% Premium Organic Cotton",
    "240+ GSM Heavyweight Fabric",
    "Standard Oversized Drop-Shoulder Fit",
    "High-Density Cultural Graphic Print",
    "Pre-shrunk & Bio-washed"
  ];

  const displayDetails = product.details && product.details.length > 0 ? product.details : STANDARD_DETAILS;

  // Premium color swatches color mapping
  const COLOR_MAP: Record<string, string> = {
    'black': '#171717',
    'white': '#FFFFFF',
    'offwhite': '#FAF9F6',
    'cream': '#FFFDD0',
    'maroon': '#800000',
    'red': '#DC2626',
    'blue': '#2563EB',
    'navy': '#1E3A8A',
    'green': '#16A34A',
    'olive': '#556B2F',
    'gray': '#737373',
    'grey': '#737373',
    'yellow': '#EAB308',
    'beige': '#F5F5DC',
    'original': '#D4D4D8',
  };

  const getColorStyle = (color: string) => {
    const norm = color.toLowerCase().trim().replace(/[-\s]/g, '');
    if (norm.startsWith('#')) return norm;
    return COLOR_MAP[norm] || color;
  };

  const hasVariants = product.colorVariants && product.colorVariants.length > 0;
  const activeVariant = hasVariants ? product.colorVariants.find((v: any) => v.color === selectedColor) : null;
  const displayImages = (activeVariant && activeVariant.images.length > 0) ? activeVariant.images : product.images;

  return (
    <div className="pt-20 bg-white">
      <title>{`${product.name} | Gorer Mart Premium Streetwear`}</title>
      <meta name="description" content={`Shop ${product.name} at Gorer Mart. Premium Kolkata-inspired streetwear and apparel.`} />

      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Responsive Image Gallery */}
          <div className="space-y-4">
            {/* Desktop-only Main Image & Thumbnails */}
            <div className="hidden lg:block space-y-4">
              <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={displayImages[activeImage]?.src || displayImages[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {displayImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {displayImages.map((img: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`aspect-square overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img?.src || img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile-only Swipeable Touch Gallery Carousel */}
            <div className="lg:hidden relative">
              <div 
                id="mobile-gallery-scroll"
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-0 aspect-[3/4] no-scrollbar"
                style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {displayImages.map((img: any, idx: number) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-start snap-always relative">
                    <img src={img?.src || img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {/* Dots Indicators */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                  {displayImages.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const container = document.getElementById('mobile-gallery-scroll');
                        if (container) {
                          container.scrollTo({ left: container.clientWidth * idx, behavior: 'smooth' });
                          setActiveImage(idx);
                        }
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${activeImage === idx ? 'bg-black w-4' : 'bg-black/30'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <nav className="flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-6">
              <Link href="/" className="hover:text-black">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/shop" className="hover:text-black">Shop</Link>
              <span className="mx-2">/</span>
              <span className="text-black">{product.name}</span>
            </nav>

            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-4 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center space-x-4 mb-10">
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

            {/* Selectors */}
            <div className="space-y-8 mb-10 pt-10 border-t border-neutral-100">
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Select Size</h3>
                  <Link href="/size-guide" className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">Size Guide</Link>
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

              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4">
                    Color: <span className="text-neutral-500 font-normal normal-case">{selectedColor}</span>
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map(color => {
                      const colorStyle = getColorStyle(color);
                      const isLight = ['white', '#ffffff', '#faf9f6', '#fffdd0', '#faf9f6', 'offwhite', 'cream', 'beige'].includes(color.toLowerCase().trim().replace(/[-\s]/g, '')) || colorStyle.toLowerCase() === '#ffffff';
                      return (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setActiveImage(0); }}
                          className={`w-9 h-9 rounded-full relative transition-all ${
                            isLight ? 'border border-neutral-300' : ''
                          } ${
                            selectedColor === color ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: colorStyle }}
                          title={color}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

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
              <Button 
                onClick={() => addToCart(product, quantity, selectedSize, selectedColor)}
                className="flex-[2] py-5"
              >
                Add to Bag
              </Button>
              <Button variant="outline" className="flex-1 py-5">
                Wishlist
              </Button>
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
                {displayDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start text-sm text-neutral-600">
                    <span className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            {product.washCare && (
              <div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-8">Care Instructions</h2>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {product.washCare}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      {relatedProducts.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl uppercase tracking-tighter mb-12">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Mobile Sticky Bottom Buy Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-50 flex items-center justify-between lg:hidden text-neutral-900"
          >
            <div className="flex items-center space-x-3 max-w-[50%]">
              <img 
                src={displayImages[0]?.src || displayImages[0]} 
                alt={product.name} 
                className="w-10 h-14 object-cover bg-neutral-100 flex-shrink-0" 
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold uppercase tracking-tight truncate">{product.name}</span>
                <span className="text-xs font-display font-black text-black mt-0.5">₹{product.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select 
                  value={selectedSize} 
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest pl-2 pr-6 py-2.5 rounded-none h-10 focus:outline-none focus:border-black cursor-pointer appearance-none"
                >
                  {product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400" />
              </div>

              <Button 
                onClick={() => addToCart(product, quantity, selectedSize, selectedColor)}
                className="h-10 px-5 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-none cursor-pointer"
              >
                Add to Bag
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
