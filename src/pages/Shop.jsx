import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faChevronDown, faXmark } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS } from '../data/products';
import ProductCard from '../components/shop/ProductCard';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('featured');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState(200);

  useEffect(() => {
    setActiveCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  const categories = ['All', 'New Arrivals', 'Best Sellers', 'Top Picks'];
  
  const filteredProducts = PRODUCTS.filter(product => {
    const categoryMatch = activeCategory === 'All' || 
                         (activeCategory === 'New Arrivals' && product.tag === 'New Arrival') ||
                         (activeCategory === 'Best Sellers' && product.tag === 'Best Seller') ||
                         (activeCategory === 'Top Picks' && product.tag === 'Trending');
    const priceMatch = product.price <= priceRange;
    return categoryMatch && priceMatch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const handleCategoryChange = (cat) => {
    setSearchParams(cat === 'All' ? {} : { category: cat });
    setActiveCategory(cat);
  };

  return (
    <div className="pt-20 min-h-screen bg-white">
      {/* Header */}
      <section className="bg-neutral-50 py-16 px-6">
        <div className="container mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter mb-4 animate-fade-in">
            {activeCategory}
          </h1>
          <nav className="flex items-center text-xs font-bold uppercase tracking-widest text-neutral-400">
            <span>Home</span>
            <span className="mx-2">/</span>
            <span className="text-black">Shop</span>
            <span className="mx-2">/</span>
            <span className="text-black">{activeCategory}</span>
          </nav>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-[72px] z-30 bg-white border-b border-neutral-100 py-4 px-6">
        <div className="container mx-auto flex justify-between items-center">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest hover:text-accent transition-colors"
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Filters</span>
          </button>
          
          <div className="flex items-center space-x-6">
            <span className="hidden md:block text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
              Showing {filteredProducts.length} Products
            </span>
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-transparent text-xs font-bold uppercase tracking-widest pr-6 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <FontAwesomeIcon icon={faChevronDown} className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 flex flex-col lg:flex-row">
        {/* Sidebar Filters (Desktop) */}
        <aside className="hidden lg:block w-64 flex-shrink-0 pr-12 space-y-12">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Categories</h3>
            <div className="flex flex-col space-y-3">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`text-sm text-left transition-colors ${activeCategory === cat ? 'text-black font-bold' : 'text-neutral-400 hover:text-black'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold uppercase tracking-widest">Max Price</h3>
              <span className="text-sm font-display font-bold">${priceRange}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="200" 
              value={priceRange} 
              onChange={(e) => setPriceRange(parseInt(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-neutral-500 mb-6">No products found matching your criteria.</p>
              <button 
                onClick={() => { setActiveCategory('All'); setPriceRange(200); }}
                className="btn btn-outline"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {isFilterOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-[100] bg-white p-8 lg:hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-2xl font-display font-bold uppercase">Filters</h2>
              <button onClick={() => setIsFilterOpen(false)}>
                <FontAwesomeIcon icon={faXmark} className="text-2xl" />
              </button>
            </div>

            <div className="space-y-12 overflow-y-auto flex-1">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-6">Categories</h3>
                <div className="flex flex-wrap gap-3">
                  {categories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-6 py-3 border text-sm font-bold uppercase tracking-widest transition-all ${activeCategory === cat ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Max Price</h3>
                  <span className="text-xl font-display font-bold">${priceRange}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="200" 
                  value={priceRange} 
                  onChange={(e) => setPriceRange(parseInt(e.target.value))}
                  className="w-full accent-black h-2 rounded-lg bg-neutral-100"
                />
              </div>
            </div>

            <div className="pt-8 mt-auto">
              <button 
                onClick={() => setIsFilterOpen(false)}
                className="w-full btn btn-primary"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;