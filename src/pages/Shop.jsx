import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faXmark, faCheck, faSliders, faArrowRight, faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS } from '../data/products';
import ProductCard from '../components/shop/ProductCard';
import { Helmet } from 'react-helmet-async';
import hero from '../assets/shop-hero-2.png';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState(3000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  const categories = ['All', 'New Arrivals', 'Best Sellers', 'Top Picks'];
  
  const filteredProducts = PRODUCTS.filter(product => {
    const categoryMatch = activeCategory === 'All' || 
                         (activeCategory === 'New Arrivals' && product.tag === 'New Arrival') ||
                         (activeCategory === 'Best Sellers' && product.tag === 'Best Seller') ||
      (activeCategory === 'Top Picks' && (product.tag === 'Trending' || product.tag === 'Top Pick'));
    const priceMatch = product.price <= priceRange;
    return categoryMatch && priceMatch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'newest') return b.id - a.id;
    return 0;
  });

  const handleCategoryChange = (cat) => {
    setSearchParams(cat === 'All' ? {} : { category: cat });
    setActiveCategory(cat);
  };

  const clearFilters = () => {
    setSearchParams({});
    setActiveCategory('All');
    setPriceRange(3000);
    setSortBy('featured');
  };

  return (
    <div className="pt-16 min-h-screen bg-white">
      <Helmet>
        <title>Shop All | Gorer Mart Premium Streetwear</title>
        <meta name="description" content="Browse our complete collection of premium Kolkata-inspired apparel." />
      </Helmet>

      {/* Hero Header */}
      <section className="relative overflow-hidden text-white border-b border-neutral-100 flex items-center justify-center min-h-[30vh]">
        <div className="absolute inset-0 z-0">
          <img
            src={hero}
            alt="Shop Banner"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4">
              {activeCategory === 'All' ? 'The Collection' : activeCategory}
            </h1>
            <nav className="flex items-center text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-500">
              <span>Home</span>
              <span className="mx-3 opacity-30">/</span>
              <span className="text-accent">Shop</span>
            </nav>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-6 flex flex-col lg:flex-row">
        {/* Fixed Sidebar for Desktop */}
        <aside className="hidden lg:block w-72 flex-shrink-0 py-12 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto pr-12 no-scrollbar border-r border-neutral-100">
          <div className="space-y-12">
            {/* Sort Section */}
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

            {/* Categories Section */}
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Collections</h3>
              <div className="flex flex-col space-y-4">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className="group flex items-center space-x-3 text-left"
                  >
                    <div className={`w-5 h-5 rounded border border-neutral-200 flex items-center justify-center transition-all ${activeCategory === cat ? 'bg-black border-black' : 'group-hover:border-black'}`}>
                      {activeCategory === cat && <FontAwesomeIcon icon={faCheck} className="text-[10px] text-white" />}
                    </div>
                    <span className={`text-sm font-medium transition-colors ${activeCategory === cat ? 'text-black' : 'text-neutral-500 hover:text-black'}`}>
                      {cat}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range Section */}
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Price Limit</h3>
                <span className="text-sm font-display font-bold">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="0" 
                max="3000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
              />
              <div className="flex justify-between mt-4 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                <span>₹0</span>
                <span>₹3000</span>
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center space-x-3 py-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white hover:border-black transition-all group"
            >
              <FontAwesomeIcon icon={faArrowRotateLeft} className="group-hover:rotate-[-180deg] transition-transform duration-500" />
              <span>Reset Filters</span>
            </button>
          </div>
        </aside>

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden py-6 border-b border-neutral-100 flex justify-between items-center sticky top-16 bg-white z-30 px-2">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest"
          >
            <FontAwesomeIcon icon={faSliders} />
            <span>Filter & Sort</span>
          </button>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
            {filteredProducts.length} Products
          </span>
        </div>

        {/* Main Product Area */}
        <main className="flex-1 py-12 lg:pl-12">
          {/* Header Info */}
          <div className="hidden lg:flex justify-between items-center mb-12">
            <span className="text-[10px] text-neutral-400 uppercase tracking-[0.3em] font-bold">
              Showing <span className="text-black">{filteredProducts.length}</span> results in {activeCategory}
            </span>
          </div>

          {/* Product Grid */}
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
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-32 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-neutral-50 flex items-center justify-center mb-8">
                  <FontAwesomeIcon icon={faFilter} className="text-2xl text-neutral-200" />
                </div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-tighter mb-4">No Matches</h2>
                <p className="text-neutral-500 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
                  We couldn't find any items matching your current filters.
                </p>
              <button 
                  onClick={clearFilters}
                  className="btn btn-primary px-10"
              >
                Clear All Filters
              </button>
              </motion.div>
          )}
        </main>
      </div>

      {/* Mobile Filter Overlay */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col lg:hidden"
          >
            <div className="flex justify-between items-center p-8 border-b border-neutral-100">
              <h2 className="text-xl font-display font-bold uppercase tracking-tight">Filters</h2>
              <button onClick={() => setIsMobileFilterOpen(false)}>
                <FontAwesomeIcon icon={faXmark} className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-12">
              {/* Mobile Sort */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Sort</h3>
                <div className="grid grid-cols-2 gap-4">
                  {['featured', 'newest', 'price-low', 'price-high'].map(sort => (
                    <button
                      key={sort}
                      onClick={() => setSortBy(sort)}
                      className={`py-4 text-[10px] font-bold uppercase tracking-widest border transition-all ${sortBy === sort ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500'}`}
                    >
                      {sort.replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Categories */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400 mb-6">Collections</h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-6 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Price */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Max Price</h3>
                  <span className="text-xl font-display font-bold">₹{priceRange}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3000"
                  step="50"
                  value={priceRange} 
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-black"
                />
              </div>
            </div>

            <div className="p-8 border-t border-neutral-100 flex gap-4">
              <button 
                onClick={clearFilters}
                className="flex-1 py-5 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-[2] btn btn-primary py-5"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEO Footer Section */}
      <section className="bg-neutral-50 py-20 border-t border-neutral-100">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center lg:text-left">
            <h2 className="text-2xl font-display font-bold uppercase tracking-tighter mb-6">Authentic Kolkata Drip</h2>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-2xl">
              Gorer Mart is redefining premium streetwear by fusing Bengal's rich heritage with contemporary urban fashion.
              Our collection is curated for those who carry the soul of the city in every step.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;