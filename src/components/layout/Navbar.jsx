import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faUser, faBars, faXmark, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import logoBlack from '../../assets/logo-black.webp';
import logoWhite from '../../assets/logo-white.webp';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { setIsCartOpen, cartCount } = useCart();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
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
          <button className="hidden md:block hover:text-accent transition-colors">
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
  );
};

export default Navbar;
