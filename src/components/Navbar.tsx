'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBagShopping, faUser, faBars, faXmark, faMagnifyingGlass, faRightFromBracket, faBox, faChevronRight, faHouse, faStore, faCircleInfo, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faInstagram, faFacebookF, faReddit } from '@fortawesome/free-brands-svg-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../ui/input';

import logoBlack from '../assets/logo/logo-blacknavbar.webp';
import logoRed from '../assets/logo/logo-rednavbar.webp';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMobileUserExpanded, setIsMobileUserExpanded] = useState<boolean>(false);
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
    setIsMobileUserExpanded(false);
    setSearchQuery('');
  }, [pathname]);

  const navLinks = [
    { name: 'Home', path: '/', icon: faHouse },
    { name: 'Shop', path: '/shop', icon: faStore },
    { name: 'About', path: '/about', icon: faCircleInfo },
    { name: 'Contact', path: '/contact', icon: faEnvelope },
  ];

  const isHomePage = pathname === '/';

  return (
    <>
      <nav
        className={`relative w-full h-16 transition-all duration-500 border-b shadow-premium lg:shadow-none px-6 md:px-12 lg:px-24
        ${isHomePage
          ? `bg-[#a6101b] border-[#b12026] lg:border-transparent ${
              isScrolled 
            ? 'lg:bg-[#a6101b] lg:backdrop-blur-xl lg:border-[#b12026] lg:shadow-premium' 
                : 'lg:bg-transparent lg:shadow-none lg:border-transparent'
            }`
          : 'bg-[#a6101b] border-[#b12026]'
        }`}
      >
        <div className="container mx-auto h-full flex items-center justify-between">
          <button
            className="lg:hidden text-xl text-white transition-colors duration-300 cursor-pointer w-8 h-8 flex items-center justify-center"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 90 : 0, scale: isMobileMenuOpen ? 0.9 : 1 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <FontAwesomeIcon icon={isMobileMenuOpen ? faXmark : faBars} />
            </motion.div>
          </button>

          <div className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path || (link.path === '/shop' && pathname.startsWith('/product'));
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative text-xs font-bold uppercase tracking-widest transition-all duration-300 py-1.5
                    after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px]
                    after:origin-left after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.16,1,0.3,1)] after:bg-current
                    text-white ${isActive ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100'}
                  `}
                >
                  {link.name}
                </Link>
              );
            })}
          </div>

          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2"
          >
            <span className="sr-only">Gorer Mart</span>
            {/* Desktop Transparent logo */}
            <img
              src={typeof logoBlack === 'object' ? logoBlack.src : logoBlack}
              alt="Gorer Mart"
              className={`h-5 md:h-10 w-auto object-contain transition-all duration-500 hidden lg:block ${
                isHomePage && !isScrolled ? 'lg:block' : 'lg:hidden'
              }`}
            />
            {/* Desktop Scrolled / Mobile logo (black) */}
            <img
              src={typeof logoRed === 'object' ? logoRed.src : logoRed}
              alt="Gorer Mart"
              className={`h-5 md:h-10 w-auto object-contain transition-all duration-500 ${
                isHomePage && !isScrolled ? 'block lg:hidden' : 'block'
              }`}
            />
          </Link>

          <div className="flex items-center h-full space-x-6 transition-colors duration-500 text-white">
            <button 
              onClick={() => setIsSearchOpen(true)}
              className="transition-transform duration-200 ease-in-out hover:scale-110 cursor-pointer"
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} />
            </button>
            <button
              className="relative transition-transform duration-200 ease-in-out hover:scale-110 cursor-pointer"
              onClick={() => setIsCartOpen(true)}
            >
              <FontAwesomeIcon icon={faBagShopping} className="text-lg" />
              {cartCount > 0 && (
                <span className={`absolute -top-2 -right-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-500 ${isHomePage && !isScrolled
                  ? 'bg-black text-white lg:bg-white lg:text-black'
                  : 'bg-black text-white'
                  }`}>
                  {cartCount}
                </span>
              )}
            </button>
            {isAuthenticated ? (
              <div
                className="relative h-full flex items-center"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <button 
                  className="transition-transform duration-200 ease-in-out hover:scale-110 cursor-pointer flex items-center"
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
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-[-48px] top-full w-60 z-50 text-neutral-800 before:content-[''] before:absolute before:-top-6 before:h-6 before:inset-x-0"
                    >
                      <div className="bg-white/95 backdrop-blur-md rounded-none shadow-xl border border-neutral-100 overflow-hidden py-2.5">
                        <div className="px-4 py-3 border-b border-neutral-100 mb-2">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            Hello {((profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || '').trim().split(' ')[0] || (profile?.email || user?.email || '').split('@')[0] || 'User')}
                          </p>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">{profile?.email || user?.email}</p>
                        </div>
                        <Link 
                          href="/account" 
                          className="group flex items-center space-x-3 px-4 py-2 text-sm font-normal text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faUser} className="w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                          <span>My Account</span>
                        </Link>
                        <Link 
                          href="/account" 
                          className="group flex items-center space-x-3 px-4 py-2 text-sm font-normal text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50/50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faBox} className="w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                          <span>My Orders</span>
                        </Link>
                        <div className="h-px bg-neutral-100 my-2" />
                        <button 
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            signOut();
                          }}
                          className="group w-full flex items-center space-x-3 px-4 py-2 text-sm font-normal text-red-500 hover:bg-red-50/50 transition-colors text-left cursor-pointer"
                        >
                          <FontAwesomeIcon icon={faRightFromBracket} className="w-4 text-red-400 group-hover:text-red-500 transition-colors" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="hidden lg:block transition-transform duration-200 ease-in-out hover:scale-110 cursor-pointer">
                <FontAwesomeIcon icon={faUser} />
              </Link>
            )}
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop — starts below navbar */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed top-16 inset-x-0 bottom-0 bg-black/40 z-[60] lg:hidden"
              />

              {/* Drawer — anchored below navbar */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 38, mass: 1 }}
                className="fixed top-16 bottom-0 left-0 w-[85vw] max-w-[320px] bg-white z-[70] flex flex-col lg:hidden shadow-2xl"
              >
                {/* Nav Links */}
                <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 space-y-1">
                  {navLinks.map((link, i) => {
                    const isActive = pathname === link.path || (link.path === '/shop' && pathname.startsWith('/product'));
                    return (
                      <motion.div
                        key={link.name}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.055, duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                      >
                        <Link
                          href={link.path}
                          className={`relative flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-200 overflow-hidden group ${
                            isActive
                              ? 'bg-black text-white shadow-lg shadow-black/20'
                              : 'text-neutral-500 hover:text-black hover:bg-neutral-50'
                          }`}
                        >
                          {isActive && (
                            <motion.span
                              layoutId="mobile-nav-indicator"
                              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-white/50 rounded-r-full"
                            />
                          )}
                          <div className="flex items-center space-x-3">
                            <FontAwesomeIcon
                              icon={link.icon}
                              className={`w-4 text-sm flex-shrink-0 ${
                                isActive ? 'text-white/70' : 'text-neutral-300'
                              }`}
                            />
                            <span className="text-sm font-bold uppercase tracking-widest">
                              {link.name}
                            </span>
                          </div>
                          <FontAwesomeIcon
                            icon={faChevronRight}
                            className={`text-[10px] flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                              isActive ? 'text-white/40' : 'text-neutral-200'
                            }`}
                          />
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Footer */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.32, duration: 0.3 }}
                  className="px-3 pt-3 pb-4"
                >
                  {/* Social Links */}
                  <div className="flex items-center justify-between px-1 pb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Follow us on</span>
                    <div className="flex items-center space-x-2">
                      <Link
                        href="https://www.instagram.com/gorermart?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faInstagram} className="text-xs" />
                      </Link>
                      <Link
                        href="https://www.facebook.com/share/1Ko4ojtZoS/?mibextid=wwXIfr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                        className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faFacebookF} className="text-xs" />
                      </Link>
                      <Link
                        href="https://www.reddit.com/r/gorermart"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Reddit"
                        className="w-8 h-8 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-black hover:text-white hover:border-black transition-all duration-200"
                      >
                        <FontAwesomeIcon icon={faReddit} className="text-xs" />
                      </Link>
                    </div>
                  </div>

                  {/* Divider separating social links and sign in/user section */}
                  <div className="h-px bg-neutral-100 my-3" />

                  {/* Auth Section */}
                  {isAuthenticated ? (
                    <div className="space-y-0.5">
                      {/* User tile — tap to expand */}
                      <button
                        onClick={() => setIsMobileUserExpanded(!isMobileUserExpanded)}
                        className="flex items-center justify-between w-full px-4 py-3.5 rounded-none hover:bg-neutral-50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-neutral-200 flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {(profile?.full_name || user?.email)?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div className="text-left min-w-0">
                            <p className="text-xs font-medium text-neutral-800 truncate">
                              {profile?.full_name || 'My Account'}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate">{profile?.email || user?.email}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isMobileUserExpanded ? 90 : 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="text-[10px] text-neutral-300" />
                        </motion.div>
                      </button>

                      {/* Expandable options */}
                      <AnimatePresence>
                        {isMobileUserExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="pl-3 pr-1 pt-0.5 pb-1 space-y-0.5">
                              <Link
                                href="/account"
                                className="flex items-center space-x-3 px-4 py-3 rounded-none text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200"
                              >
                                <FontAwesomeIcon icon={faUser} className="text-sm w-4 text-neutral-400" />
                                <span className="text-xs font-normal">My Account</span>
                              </Link>
                              <button
                                onClick={() => { setIsMobileMenuOpen(false); signOut(); }}
                                className="flex items-center space-x-3 w-full px-4 py-3 rounded-none text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer text-left"
                              >
                                <FontAwesomeIcon icon={faRightFromBracket} className="text-sm w-4 text-red-400" />
                                <span className="text-xs font-normal">Sign Out</span>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className="relative flex items-center justify-between w-full px-4 py-4 rounded-none bg-neutral-50 hover:bg-neutral-100 text-neutral-900 transition-all duration-300 group overflow-hidden"
                    >
                      <div className="flex items-center space-x-3">
                        <FontAwesomeIcon icon={faUser} className="text-sm w-4 text-neutral-500 group-hover:text-black transition-colors" />
                        <span className="text-sm font-bold uppercase tracking-widest text-neutral-800 group-hover:text-black">Sign In</span>
                      </div>
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className="text-[10px] text-neutral-400 group-hover:translate-x-1 transition-transform duration-300 group-hover:text-black"
                      />
                    </Link>
                  )}
                </motion.div>
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
