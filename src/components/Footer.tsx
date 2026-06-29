'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useToast } from '../ui/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faFacebookF, faTwitter, faReddit } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

import logo from '../assets/logo/logo-footer.webp';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: email.trim().toLowerCase() }]);

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Subscribed",
            description: "You are already subscribed to our newsletter! Stay tuned for updates.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Subscribed Successfully!",
          description: "Thank you for subscribing to the Gorer Mart newsletter.",
        });
        setEmail('');
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      toast({
        title: "Subscription Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-[#fff8e9] border-t-1 border-[#a6101b] pt-20 pb-10 px-6 md:px-12 lg:px-24">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-16 gap-x-8 lg:gap-x-12 mb-20">
          {/* Brand Info */}
          <div className="md:col-span-6 lg:col-span-4 flex flex-col space-y-6 pr-0 lg:pr-8">
            <Link href="/">
              <img src={typeof logo === 'object' ? logo.src : logo} alt="Gorer Mart" className="h-14 w-auto object-contain align-left self-start" />
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed max-w-sm">
              Curating premium apparel that blends cultural heritage with contemporary streetwear. Be a part of this Kolorob.
            </p>
            <div className="flex space-x-4 pt-2">
              <Link href="https://www.instagram.com/gorermart?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==" target="_blank" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#a6101b] hover:text-white transition-all">
                <FontAwesomeIcon icon={faInstagram} />
              </Link>
              <Link href="https://www.facebook.com/share/1Ko4ojtZoS/?mibextid=wwXIfr" target="_blank" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#a6101b] hover:text-white transition-all">
                <FontAwesomeIcon icon={faFacebookF} />
              </Link>
              <Link href="https://www.facebook.com/share/1Ko4ojtZoS/?mibextid=wwXIfr" target="_blank" className="w-10 h-10 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-600 hover:bg-[#a6101b] hover:text-white transition-all">
                <FontAwesomeIcon icon={faReddit} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 lg:col-span-2">
            <h3 className="font-display font-bold uppercase tracking-widest text-xs md:text-sm mb-8 text-[#a6101b]">Shop</h3>
            <ul className="flex flex-col space-y-4">
              <li><Link href="/shop" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">All Collections</Link></li>
              <li><Link href="/shop?collection=New+Arrivals" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">New Arrivals</Link></li>
              <li><Link href="/shop?collection=Best+Sellers" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Best Sellers</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="md:col-span-3 lg:col-span-2">
            <h3 className="font-display font-bold uppercase tracking-widest text-xs md:text-sm mb-8 text-[#a6101b]">Support</h3>
            <ul className="flex flex-col space-y-4">
              <li><Link href="/about" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Our Story</Link></li>
              <li><Link href="/refund-policy" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Refund Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Terms & Conditions</Link></li>
              <li><Link href="/privacy-policy" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Privacy Policy</Link></li>
              <li><Link href="/size-guide" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Size Guide</Link></li>
              <li><Link href="/contact" className="text-sm text-neutral-500 hover:text-black transition-colors uppercase font-medium tracking-wider">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col justify-start">
            <h3 className="font-display font-bold uppercase tracking-widest text-xs md:text-sm mb-8 text-[#a6101b] ">Newsletter</h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-md">
              Subscribe to receive updates, access to exclusive deals, and early drops.
            </p>
            <form onSubmit={handleSubscribe} className="w-full max-w-md">
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={loading}
                  className="flex-grow border border-neutral-300 focus:border-black bg-neutral-50/50 hover:bg-neutral-50 focus:bg-white rounded-none h-12 px-4 text-sm transition-all placeholder:text-neutral-400 focus-visible:ring-0 focus-visible:border-black"
                />
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  className="h-12 px-4 font-semibold text-xs uppercase tracking-widest bg-[#a6101b] text-white hover:bg-[#a6101b]/80 transition-all duration-300 shrink-0 rounded-none cursor-pointer active:scale-95"
                >
                  {loading ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-10 border-t border-neutral-100 flex justify-center items-center">
          <p className="text-[10px] md:text-xs text-neutral-400 uppercase tracking-widest font-medium">
            © 2026 Gorer Mart. Developed with Gorom Rokto.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
