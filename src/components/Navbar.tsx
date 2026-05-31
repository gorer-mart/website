'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faUser, faBars, faXmark, faMagnifyingGlass, faRightFromBracket, faBox } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../ui/input';
import logoBlack from '../assets/logo-black.webp';
import logoWhite from '../assets/logo-white.webp';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const { setIsCartOpen, cartCount } = useCart();
  const { user, profile, signOut, isAuthenticated } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsSearchOpen(false);
    setIsUserMenuOpen(false);
    setSearchQuery('');
  }, [pathname]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  const isHomePage = pathname === '/';

  return (
    <>
      <nav
        className={`relative w-full h-16 transition-all duration-500 border-b shadow-premium lg:shadow-none
        ${isHomePage
          ? `bg-white border-neutral-100 lg:border-transparent ${
              isScrolled 
                ? 'lg:bg-white/80 lg:backdrop-blur-xl lg:border-neutral-100 lg:shadow-premium' 
                : 'lg:bg-transparent lg:shadow-none lg:border-transparent'
            }`
          : 'bg-white border-neutral-100'
        }`}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          <button
            className="lg:hidden text-xl text-black transition-colors duration-500"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <FontAwesomeIcon icon={faBars} />
          </button>

          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`text-xs font-bold uppercase tracking-widest transition-colors duration-500 ${
                  isHomePage && !isScrolled
                    ? 'text-black lg:text-white/80 lg:hover:text-white hover:text-accent'
                    : 'text-black hover:text-accent'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2"
          >
            {/* Desktop Transparent logo (white) */}
            <img
              src={typeof logoWhite === 'object' ? logoWhite.src : logoWhite}
              alt="Gorer Mart"
              className={`h-5 sm:h-6 md:h-8 w-auto object-contain transition-all duration-500 hidden lg:block ${
                isHomePage && !isScrolled ? 'lg:block' : 'lg:hidden'
              }`}
            />
            {/* Desktop Scrolled / Mobile logo (black) */}
            <img
              src={typeof logoBlack === 'object' ? logoBlack.src : logoBlack}
              alt="Gorer Mart"
              className={`h-5 sm:h-6 md:h-8 w-auto object-contain transition-all duration-500 ${
                isHomePage && !isScrolled ? 'block lg:hidden' : 'block'
              }`}
            />
          </Link>

          <div className={`flex items-center space-x-6 transition-colors duration-500 text-black ${
            isHomePage && !isScrolled ? 'lg:text-white' : 'text-black'
          }`}>
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hover:text-accent transition-colors"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            {isAuthenticated ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="hover:text-accent transition-colors flex items-center"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-7 h-7 rounded-full object-cover border-2 border-current"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-neutral-200 text-black flex items-center justify-center text-xs font-bold border-2 border-current">
                      {(profile?.full_name || user?.email)?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  )}
                </button>

                {/* Desktop User Dropdown */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-premium border border-neutral-100 overflow-hidden z-50 py-2 text-neutral-800"
                      >
                        <div className="px-4 py-3 border-b border-neutral-100 mb-2">
                          <p className="text-sm font-bold text-black truncate">{profile?.full_name || 'User'}</p>
                          <p className="text-xs text-neutral-500 truncate">{profile?.email || user?.email}</p>
                        </div>
                        <Link 
                          href="/account" 
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faUser} className="w-4" />
                          <span>My Account</span>
                        </Link>
                        <Link 
                          href="/account" 
                          className="flex items-center space-x-3 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-neutral-600 hover:text-black hover:bg-neutral-50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faBox} className="w-4" />
                          <span>My Orders</span>
                        </Link>
                        <div className="h-px bg-neutral-100 my-2" />
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 transition-colors text-left"
                        >
                          <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="hover:text-accent transition-colors">
                <FontAwesomeIcon icon={faUser} />
              </Link>
            )}
            <button
              className="relative hover:text-accent transition-colors"
              onClick={() => setIsCartOpen(true)}
            >
              <FontAwesomeIcon icon={faBagShopping} className="text-lg" />
              {cartCount > 0 && (
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${
                  isHomePage && !isScrolled
                    ? 'bg-black text-white lg:bg-white lg:text-black'
                    : 'bg-black text-white'
                }`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Tap-to-close Backdrop Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
              />
              {/* Native-style Slide-out Drawer */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[80vw] max-w-[300px] bg-white z-[70] flex flex-col p-6 shadow-2xl lg:hidden text-neutral-900"
              >
                <div className="flex justify-between items-center mb-8 border-b border-neutral-100 pb-4">
                  <span className="text-lg font-display font-bold uppercase tracking-tight">Menu</span>
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-500 hover:text-black transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-lg" />
                  </button>
                </div>

                <div className="flex flex-col space-y-5">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.path}
                      className="text-xl font-display font-bold uppercase tracking-tight hover:text-accent transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>

                <div className="mt-auto pt-6 border-t border-neutral-100 flex flex-col space-y-4">
                  {isAuthenticated ? (
                    <>
                      <Link href="/account" className="flex items-center space-x-3 text-base font-bold uppercase tracking-wider text-neutral-600 hover:text-black">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover border border-neutral-200" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-neutral-100 text-black flex items-center justify-center text-xs font-bold border">
                            {(profile?.full_name || user?.email)?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                        <span>{profile?.full_name || 'My Account'}</span>
                      </Link>
                      <button 
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          signOut();
                        }}
                        className="flex items-center space-x-3 text-base font-bold uppercase tracking-wider text-red-500 hover:text-red-600 text-left"
                      >
                        <FontAwesomeIcon icon={faRightFromBracket} />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <Link href="/login" className="flex items-center space-x-3 text-base font-bold uppercase tracking-wider text-neutral-600 hover:text-black">
                      <FontAwesomeIcon icon={faUser} />
                      <span>Sign In</span>
                    </Link>
                  )}
                  <p className="text-xs text-neutral-400">© 2026 Gorer Mart. All rights reserved.</p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>

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
              <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                <Input
                  autoFocus
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xl md:text-2xl font-display font-bold text-black focus-visible:outline-none bg-transparent placeholder:text-neutral-300 border-none h-auto px-0 py-2 focus-visible:bg-transparent"
                />
                <button onClick={() => setIsSearchOpen(false)} className="text-2xl text-neutral-400 hover:text-black transition-colors ml-4 flex-shrink-0">
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 bg-white no-scrollbar">
                {!searchQuery && (
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
