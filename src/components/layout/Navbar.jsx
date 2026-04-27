import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faUser, faBars, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import { PRODUCTS } from '../../data/products';
import logoBlack from '../../assets/logo-black.webp';
import logoWhite from '../../assets/logo-white.webp';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { setIsCartOpen, cartCount } = useCart();
  const location = useLocation();

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : PRODUCTS.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()) || (p.tag && p.tag.toLowerCase().includes(searchQuery.toLowerCase())));

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About', path: '/story' }, // Mapping About to Our Story for now
    { name: 'Contact', path: '/contact' },
  ];

  const isHomePage = location.pathname === '/';
  const isTransparent = isHomePage && !isScrolled;

  return (
    <>
      <nav
        className={`fixed top-0 left-0 w-full h-16 z-50 transition-all duration-500 ${isTransparent
        ? 'bg-transparent border-transparent'
        : 'bg-white/80 backdrop-blur-xl border-b border-neutral-100 shadow-premium'
        }`}
    >
      <div className="container mx-auto px-6 h-full flex items-center justify-between">
        {/* Mobile Menu Toggle */}
        <button
          className={`lg:hidden text-xl transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-black'}`}
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${isTransparent ? 'text-white/80 hover:text-white' : 'text-black hover:text-accent'}`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Brand Logo */}
        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2"
        >
          <img
            src={isTransparent ? logoWhite : logoBlack}
            alt="Gorer Mart"
            className="h-3 md:h-8 w-auto object-contain transition-all duration-500"
          />
        </Link>

        {/* Action Icons */}
        <div className={`flex items-center space-x-6 transition-colors duration-500 ${isTransparent ? 'text-white' : 'text-black'}`}>
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="hover:text-accent transition-colors"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} />
          </button>
          <Link to="/account" className="hover:text-accent transition-colors">
            <FontAwesomeIcon icon={faUser} />
          </Link>
          <button
            className="relative hover:text-accent transition-colors"
            onClick={() => setIsCartOpen(true)}
          >
            <FontAwesomeIcon icon={faBagShopping} className="text-lg" />
            {cartCount > 0 && (
              <span className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${isTransparent ? 'bg-white text-black' : 'bg-black text-white'}`}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 bg-white z-[60] flex flex-col p-8 lg:hidden"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-xl font-display font-bold uppercase tracking-tighter">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <FontAwesomeIcon icon={faXmark} className="text-2xl" />
              </button>
            </div>

            <div className="flex flex-col space-y-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="text-2xl font-display font-bold uppercase tracking-tight hover:text-accent"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            <div className="mt-auto pt-8 border-t border-neutral-100 flex flex-col space-y-4">
              <Link to="/account" className="flex items-center space-x-3 text-lg font-medium">
                <FontAwesomeIcon icon={faUser} />
                <span>Account</span>
              </Link>
              <p className="text-sm text-neutral-500">© 2026 Gorer Mart. All rights reserved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </nav>

      {/* Search Modal */}
      <AnimatePresence>
        {isSearchOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Search Header */}
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <input
                  autoFocus
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xl md:text-2xl font-display font-bold text-black focus:outline-none bg-transparent placeholder:text-neutral-300"
                />
                <button onClick={() => setIsSearchOpen(false)} className="text-2xl text-neutral-400 hover:text-black transition-colors ml-4 flex-shrink-0">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              
              {/* Results Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-white no-scrollbar">
                {searchQuery && searchResults.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-neutral-500">No results found for "{searchQuery}"</p>
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {searchResults.map(product => (
                      <Link 
                        key={product.id} 
                        to={`/product/${product.id}`}
                        className="group flex items-center space-x-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100"
                      >
                        <div className="w-16 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h4 className="font-display font-bold uppercase tracking-tight text-black group-hover:text-accent transition-colors line-clamp-1 mb-1 text-sm">{product.name}</h4>
                          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{product.category}</p>
                          <p className="text-xs font-black text-black mt-1">₹{product.price}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
                
                {!searchQuery && searchResults.length === 0 && (
                  <div className="py-12 text-center text-neutral-400">
                    <FontAwesomeIcon icon={faMagnifyingGlass} className="text-4xl mb-4 opacity-20" />
                    <p className="text-sm font-medium">Type to start searching...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
