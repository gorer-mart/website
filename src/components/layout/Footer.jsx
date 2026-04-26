import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebookF, faTwitter, faPinterestP } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-neutral-100 pt-20 pb-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand Info */}
          <div className="flex flex-col space-y-6">
            <h2 className="text-2xl font-display font-extrabold uppercase tracking-tighter">Gorer Mart</h2>
            <p className="text-neutral-500 text-sm leading-relaxed">
              Curating premium apparel that blends cultural heritage with contemporary streetwear. 
              Join our journey in redefining modern style.
            </p>
            <div className="flex space-x-5">
              <a href="#" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-black hover:text-white hover:border-black transition-all">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-black hover:text-white hover:border-black transition-all">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-black hover:text-white hover:border-black transition-all">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-xs mb-8">Shop</h3>
            <ul className="flex flex-col space-y-4">
              <li><Link to="/shop" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Shop All</Link></li>
              <li><Link to="/shop?category=Top Picks" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Top Picks</Link></li>
              <li><Link to="/shop?category=New Arrivals" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">New Arrivals</Link></li>
              <li><Link to="/shop?category=Best Sellers" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Best Sellers</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-xs mb-8">Support</h3>
            <ul className="flex flex-col space-y-4">
              <li><Link to="/story" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Our Story</Link></li>
              <li><a href="#" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Shipping & Returns</a></li>
              <li><a href="#" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Size Guide</a></li>
              <li><a href="#" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium">Contact Us</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-display font-bold uppercase tracking-widest text-xs mb-8">Newsletter</h3>
            <p className="text-sm text-neutral-500 mb-6">Subscribe to receive updates, access to exclusive deals, and more.</p>
            <form className="relative">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-neutral-50 border-b border-neutral-200 py-3 pr-10 focus:border-black outline-none transition-colors text-sm"
              />
              <button className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors">
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </form>
          </div>
        </div>

        <div className="pt-10 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
            © 2026 Gorer Mart. Developed with Passion for Kolkata.
          </p>
          <div className="flex space-x-8">
            <a href="#" className="text-[10px] text-neutral-400 uppercase tracking-widest hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] text-neutral-400 uppercase tracking-widest hover:text-black transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
