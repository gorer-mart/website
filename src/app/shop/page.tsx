'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faXmark, faCheck, faSliders, faArrowRight, faArrowRotateLeft, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS, CATEGORIES } from '../../data/products';
import { getProducts, getCategories, isSanityConfigured } from '../../lib/sanity';
import { Product, Category } from '../../types/product';
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

  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>(CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState<boolean>(false);

  useEffect(() => {
    setActiveCollection(searchParams.get('collection') || 'All');
  }, [searchParams]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const fetchProds = await getProducts();
        const fetchCats = await getCategories();
        setProductsList(fetchProds);
        setCategoriesList(fetchCats);
      } catch (err) {
        console.error("Error loading products/categories:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Dynamically extract all unique, non-empty tags/collections from fetched products list
  const allUniqueTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    productsList.forEach(p => {
      if (p.tags && Array.isArray(p.tags)) {
        p.tags.forEach(t => {
          if (t && t.trim() !== '') {
            tagsSet.add(t.trim());
          }
        });
      } else if (p.tag && p.tag.trim() !== '') {
        tagsSet.add(p.tag.trim());
      }
    });
    return Array.from(tagsSet).sort();
  }, [productsList]);

  const filteredProducts = productsList.filter(product => {
    // Normalization helper: lowercase, trim, and strip trailing 's' to easily match singular and plural collections
    const normalize = (str: string) => str.toLowerCase().trim().replace(/s$/, '');
    const normalizedActive = normalize(activeCollection);
    
    const isCategoryMatch = product.category && normalize(product.category) === normalizedActive;
    const isTagMatch = (product.tags && product.tags.some(t => normalize(t) === normalizedActive)) ||
                       (product.tag && normalize(product.tag) === normalizedActive);

    const collectionMatch = activeCollection === 'All' || isCategoryMatch || isTagMatch;
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


      <section className="px-6 md:px-12 lg:px-24">
        <div className="container mx-auto flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 py-12 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto pr-12 no-scrollbar border-r border-neutral-100">
          <div className="space-y-12">
            <div>
                <h3 className="text-xs font-medium text-neutral-500 mb-4">Sort By</h3>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-normal text-neutral-800 focus:outline-none focus:border-neutral-400 cursor-pointer transition-colors"
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
                <h3 className="text-xs font-medium text-neutral-500 mb-4">Categories</h3>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={() => handleCollectionChange('All')}
                    className="group flex items-center space-x-3 text-left w-full cursor-pointer py-1"
                >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${activeCollection === 'All' ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-200 group-hover:border-neutral-400 bg-transparent'}`}>
                      {activeCollection === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                    <span className={`text-sm font-normal transition-colors duration-300 ${activeCollection === 'All' ? 'text-neutral-950 font-medium' : 'text-neutral-500 hover:text-neutral-950'}`}>
                    All Products ({productsList.length})
                  </span>
                </button>
                {categoriesList.map(col => {
                  const count = productsList.filter(p => p.category === col.name).length;
                  const isActive = activeCollection === col.name;
                  return (
                    <button
                      key={col.name}
                      onClick={() => handleCollectionChange(col.name)}
                      className="group flex items-center space-x-3 text-left w-full cursor-pointer py-1"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-200 group-hover:border-neutral-400 bg-transparent'}`}>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-normal transition-colors duration-300 ${isActive ? 'text-neutral-950 font-medium' : 'text-neutral-500 hover:text-neutral-950'}`}>
                        {col.name} ({count})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {allUniqueTags.length > 0 && (
              <div>
                  <h3 className="text-xs font-medium text-neutral-500 mb-4">Curated Collections</h3>
                <div className="flex flex-col space-y-4">
                  {allUniqueTags.map(tag => {
                    const isSelected = activeCollection === tag || 
                                       (activeCollection === 'New Arrivals' && tag === 'New Arrival') ||
                                       (activeCollection === 'Best Sellers' && tag === 'Best Seller');
                    return (
                      <button
                        key={tag}
                        onClick={() => handleCollectionChange(tag)}
                        className="group flex items-center space-x-3 text-left w-full cursor-pointer py-1"
                      >
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-200 group-hover:border-neutral-400 bg-transparent'}`}>
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-normal transition-colors duration-300 ${isSelected ? 'text-neutral-950 font-medium' : 'text-neutral-500 hover:text-neutral-950'}`}>
                          {tag}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-medium text-neutral-500">Price Limit</h3>
                  <span className="text-sm font-normal text-neutral-800">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="0" 
                max="5000"
                step="100"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900 transition-all focus:outline-none focus:accent-black"
              />
            </div>

            <Button
              variant="outline"
              onClick={clearFilters}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-neutral-200 bg-white text-sm font-normal text-black hover:bg-neutral-100 hover:text-black hover:border-neutral-300 transition-all cursor-pointer group"
            >
                <FontAwesomeIcon icon={faArrowRotateLeft} className="text-xs text-neutral-500 group-hover:rotate-[-180deg] transition-transform duration-500" />
                <span>Reset</span>
            </Button>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="flex-grow py-12 lg:pl-12">
          {/* Mobile Filter Trigger & Counter */}
          {!loading && productsList.length > 0 && (
            <div className="lg:hidden flex items-center justify-between border-b border-neutral-100 pb-6 mb-6">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white hover:bg-neutral-50 text-sm font-medium text-neutral-800 border border-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                  <FontAwesomeIcon icon={faFilter} className="text-xs text-neutral-500" />
                <span>Filter & Sort</span>
              </button>
                <span className="text-sm text-neutral-500 font-normal">
                {filteredProducts.length} Products
              </span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4">
              <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Loading collection...</p>
            </div>
          ) : productsList.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-16 px-8 rounded-3xl border border-neutral-100 bg-neutral-50/50 text-center max-w-2xl mx-auto shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-6 text-amber-600">
                <FontAwesomeIcon icon={faSliders} className="text-xl" />
              </div>
              
              <h2 className="text-2xl font-display font-bold uppercase tracking-tighter mb-3">
                Connected to Sanity CMS
              </h2>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/50 text-amber-800 text-[10px] font-bold uppercase tracking-widest mb-6 border border-amber-200/50">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Empty Cloud Database
              </div>
              
              <p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-md mx-auto">
                Your frontend is successfully connected to Sanity project <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-xs font-bold text-black">{process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk'}</code>. However, no published products were found in your <code className="bg-neutral-100 px-1.5 py-0.5 rounded font-mono text-xs font-bold text-black">{process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}</code> dataset.
              </p>

              <div className="border-t border-neutral-100 pt-8 mb-8 text-left space-y-4 max-w-md mx-auto">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Quick Troubleshoot Guide:</h3>
                <div className="flex gap-3 text-xs text-neutral-600">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-neutral-900 flex-shrink-0">1</div>
                  <p>Ensure you have whitelisted <code className="bg-neutral-100 px-1 rounded font-mono">http://localhost:3000</code> in your Sanity Manage settings under the <strong>API</strong> tab with <strong>credentials enabled</strong> to avoid CORS/network errors.</p>
                </div>
                <div className="flex gap-3 text-xs text-neutral-600">
                  <div className="w-5 h-5 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-neutral-900 flex-shrink-0">2</div>
                  <p>Make sure you have created and <strong>Published</strong> Categories first, and then created and <strong>Published</strong> Products referencing those categories inside your <Link href="/studio" target="_blank" className="underline hover:text-black font-bold">Sanity Studio (/studio)</Link>.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="px-8 py-4 bg-black text-white hover:bg-neutral-800 rounded-none text-xs font-bold uppercase tracking-widest">
                  <Link href="/studio" target="_blank">
                    Open Sanity Studio
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setProductsList(PRODUCTS)} 
                  className="px-8 py-4 border border-neutral-200 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                >
                  Load Demo Products
                </Button>
              </div>
            </motion.div>
          ) : filteredProducts.length > 0 ? (
            <div className="flex flex-col space-y-6">
              {/* Active Filters Pills */}
              {(activeCollection !== 'All' || priceRange < 5000 || sortBy !== 'featured') && (
                <div className="flex flex-wrap gap-2 items-center bg-neutral-50/50 p-3 border border-neutral-100 rounded-xl">
                        <span className="text-xs text-neutral-500 font-normal mr-2">Active Filters:</span>
                  
                  {activeCollection !== 'All' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-100 text-neutral-800 text-xs font-normal rounded-full shadow-sm">
                      Collection: {activeCollection}
                      <button 
                        onClick={() => handleCollectionChange('All')} 
                        className="hover:text-red-500 font-black text-neutral-400 ml-1 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-[8px]" />
                      </button>
                    </span>
                  )}
                  
                  {priceRange < 5000 && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-100 text-neutral-800 text-xs font-normal rounded-full shadow-sm">
                      Under ₹{priceRange}
                      <button 
                        onClick={() => setPriceRange(5000)} 
                        className="hover:text-red-500 font-black text-neutral-400 ml-1 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-[8px]" />
                      </button>
                    </span>
                  )}
                  
                  {sortBy !== 'featured' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-100 text-neutral-800 text-xs font-normal rounded-full shadow-sm">
                      Sort: {sortBy}
                      <button 
                        onClick={() => setSortBy('featured')} 
                        className="hover:text-red-500 font-black text-neutral-400 ml-1 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faXmark} className="text-[8px]" />
                      </button>
                    </span>
                  )}
                  
                  <button
                    onClick={clearFilters}
                          className="text-xs font-normal text-neutral-500 hover:text-black underline ml-auto transition-colors cursor-pointer"
                  >
                          Reset
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-x-4 lg:gap-x-8 gap-y-8 lg:gap-y-16">
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
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center text-center">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tighter mb-4">No Matches</h2>
              <Button onClick={clearFilters} className="px-10">Clear All Filters</Button>
            </div>
          )}
        </main>
      </div>
      </section>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isMobileFiltersOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFiltersOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 lg:hidden backdrop-blur-sm"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl z-50 lg:hidden flex flex-col overflow-hidden text-neutral-800"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100 flex-shrink-0">
                <h2 className="text-base font-medium text-neutral-900 flex items-center gap-2">
                  <FontAwesomeIcon icon={faSliders} className="text-neutral-500 text-sm" />
                  <span>Filter & Sort</span>
                </h2>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500 hover:text-black transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Scrollable Filters Content */}
              <div className="flex-grow overflow-y-auto px-6 py-8 space-y-10 no-scrollbar">
                {/* 1. Sort By */}
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 mb-4">Sort By</h3>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2.5 text-sm font-normal text-neutral-800 focus:outline-none focus:border-neutral-400 cursor-pointer text-black"
                    >
                      <option value="featured">Featured</option>
                      <option value="newest">New Arrivals</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                    <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400" />
                  </div>
                </div>

                {/* 2. Categories */}
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 mb-4">Categories</h3>
                  <div className="flex flex-col space-y-3">
                    <button
                      onClick={() => handleCollectionChange('All')}
                      className="flex items-center space-x-3 text-left w-full py-1 cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${activeCollection === 'All' ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-200 bg-transparent'}`}>
                        {activeCollection === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-normal ${activeCollection === 'All' ? 'text-neutral-950 font-medium' : 'text-neutral-500'}`}>
                        All Products ({productsList.length})
                      </span>
                    </button>
                    {categoriesList.map(col => {
                      const count = productsList.filter(p => p.category === col.name).length;
                      const isActive = activeCollection === col.name;
                      return (
                        <button
                          key={col.name}
                          onClick={() => handleCollectionChange(col.name)}
                          className="flex items-center space-x-3 text-left w-full py-1 cursor-pointer"
                        >
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-200 bg-transparent'}`}>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className={`text-sm font-normal ${isActive ? 'text-neutral-950 font-medium' : 'text-neutral-500'}`}>
                            {col.name} ({count})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Curated Collections */}
                {allUniqueTags.length > 0 && (
                  <div>
                    <h3 className="text-xs font-medium text-neutral-500 mb-4">Curated Collections</h3>
                    <div className="flex flex-col space-y-3">
                      {allUniqueTags.map(tag => {
                        const isSelected = activeCollection === tag;
                        return (
                          <button
                            key={tag}
                            onClick={() => handleCollectionChange(tag)}
                            className="flex items-center space-x-3 text-left w-full py-1 cursor-pointer"
                          >
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-neutral-900 border-neutral-900' : 'border-neutral-200 bg-transparent'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className={`text-sm font-normal ${isSelected ? 'text-neutral-950 font-medium' : 'text-neutral-500'}`}>
                              {tag}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. Price Limit */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-medium text-neutral-500">Price Limit</h3>
                    <span className="text-sm font-normal text-neutral-800">₹{priceRange}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseInt(e.target.value))}
                    className="w-full h-1 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-neutral-900 transition-all focus:outline-none focus:accent-black"
                  />
                </div>
              </div>

              {/* Action Buttons at bottom of Drawer */}
              <div className="p-4 border-t border-neutral-100 flex gap-4 bg-neutral-50 flex-shrink-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    clearFilters();
                    setIsMobileFiltersOpen(false);
                  }}
                  className="flex-1 py-2.5 border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-sm font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Reset
                </Button>
                <Button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="flex-[2] py-2.5 bg-black hover:bg-neutral-900 text-white rounded-lg text-sm font-medium cursor-pointer transition-colors"
                >
                  Apply Filters ({filteredProducts.length})
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
