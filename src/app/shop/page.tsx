'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faXmark, faCheck, faSliders, faArrowRight, faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS, CATEGORIES } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import { Button } from '../../ui/button';

const ShopContent: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initialCategory = searchParams.get('collection') || 'All';
  
  const [activeCollection, setActiveCollection] = useState<string>(initialCategory);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [priceRange, setPriceRange] = useState<number>(5000);

  useEffect(() => {
    setActiveCollection(searchParams.get('collection') || 'All');
  }, [searchParams]);

  const filteredProducts = PRODUCTS.filter(product => {
    const collectionMatch = activeCollection === 'All' || 
                           product.category === activeCollection ||
                           (activeCollection === 'New Arrivals' && product.tag === 'New Arrival') ||
                           (activeCollection === 'Best Sellers' && product.tag === 'Best Seller');
    const priceMatch = product.price <= priceRange;
    return collectionMatch && priceMatch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const handleCollectionChange = (colName: string) => {
    setActiveCollection(colName);
    if (colName === 'All') {
      router.push(pathname);
    } else {
      router.push(`${pathname}?collection=${encodeURIComponent(colName)}`);
    }
  };

  const clearFilters = () => {
    setActiveCollection('All');
    setPriceRange(5000);
    setSortBy('featured');
    router.push(pathname);
  };

  return (
    <div className="pt-16 min-h-screen bg-white">
      <title>Shop All | Gorer Mart Premium Streetwear</title>
      <meta name="description" content="Browse our complete collection of premium Kolkata-inspired apparel." />

      {/* Header */}
      <section className="relative overflow-hidden text-black border-b border-neutral-100 flex items-center justify-center min-h-[20vh] bg-neutral-50">
        <div className="container mx-auto relative z-10 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4">
              {activeCollection === 'All' ? 'The Collection' : activeCollection}
            </h1>
            <nav className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">
              <Link href="/" className="hover:text-black">Home</Link>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-accent">Shop</span>
            </nav>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 py-12 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto pr-12 no-scrollbar border-r border-neutral-100">
          <div className="space-y-12">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Sort By</h3>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full appearance-none bg-neutral-50 border border-neutral-100 rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-black cursor-pointer transition-colors"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400" />
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Collections</h3>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => handleCollectionChange('All')}
                  className="group flex items-center space-x-3 text-left"
                >
                  <div className={`w-5 h-5 rounded border border-neutral-200 flex items-center justify-center transition-all ${activeCollection === 'All' ? 'bg-black border-black' : 'group-hover:border-black'}`}>
                    {activeCollection === 'All' && <FontAwesomeIcon icon={faCheck} className="text-[10px] text-white" />}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${activeCollection === 'All' ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                    All Collection
                  </span>
                </button>
                {CATEGORIES.map(col => (
                  <button
                    key={col.name}
                    onClick={() => handleCollectionChange(col.name)}
                    className="group flex items-center space-x-3 text-left"
                  >
                    <div className={`w-5 h-5 rounded border border-neutral-200 flex items-center justify-center transition-all ${activeCollection === col.name ? 'bg-black border-black' : 'group-hover:border-black'}`}>
                      {activeCollection === col.name && <FontAwesomeIcon icon={faCheck} className="text-[10px] text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${activeCollection === col.name ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                      {col.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Price Limit</h3>
                <span className="text-sm font-display font-bold">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="0" 
                max="5000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
              />
            </div>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full flex items-center justify-center space-x-3 py-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white transition-all group"
            >
              <FontAwesomeIcon icon={faArrowRotateLeft} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
              <span>Reset Filters</span>
            </Button>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-1 py-12 lg:pl-12">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-16">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center text-center">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tighter mb-4">No Matches</h2>
              <Button onClick={clearFilters} className="px-10">Clear All Filters</Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const Shop: React.FC = () => {
  return (
    <React.Suspense fallback={<div className="pt-32 text-center min-h-screen font-display font-bold uppercase tracking-widest text-xs">Loading collection...</div>}>
      <ShopContent />
    </React.Suspense>
  );
};

export default Shop;
