'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import contactBg from '../../assets/contact/contact-bg.webp';

const Contact: React.FC = () => {
  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] mt-16 bg-cover bg-center flex items-center justify-center py-16 px-4 sm:px-6 md:px-8 z-10"
      style={{
        backgroundImage: `url(${typeof contactBg === 'object' ? contactBg.src : contactBg})`
      }}
    >
      <title>Contact Us — Gorer Mart</title>
      <meta name="description" content="Get in touch with Gorer Mart customer support" />



      <div className="relative z-10 w-[80vw] bg-black/20 backdrop-blur-lg  p-8 md:p-10 shadow-3xl rounded-none text-white rounded-xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-tighter mb-8 text-white">Get In Touch</h1>
            <p className="text-white/70 text-base mb-12 leading-relaxed font-light">
              Have a question about our collections, sizing, or an existing order?
              Our team is here to help you. Reach out via the form or through our direct channels.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-[#a6101b] rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <FontAwesomeIcon icon={faEnvelope} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-1 text-white/90">Email Us</h3>
                  <p className="text-white/70">contact@gorermart.com</p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-[#a6101b] rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <FontAwesomeIcon icon={faPhone} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-1 text-white/90">Call Us</h3>
                  <p className="text-white/70">+91 7044667941</p>
                </div>
              </div>
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-[#a6101b] rounded-full flex items-center justify-center text-white flex-shrink-0">
                  <FontAwesomeIcon icon={faLocationDot} />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-1 text-white/90">Location</h3>
                  <p className="text-white/70">Barasat, Kolkata-700124<br />West Bengal, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 sm:p-10 md:p-12 rounded-xl">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Name</label>
                  <Input id="name" type="text" placeholder="Enter your full name" className="rounded-none border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:bg-white/10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Email Address</label>
                  <Input id="email" type="email" placeholder="you@example.com" className="rounded-none border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:bg-white/10 text-sm" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Phone Number</label>
                  <Input id="phone" type="tel" placeholder="e.g. +91 98765 43210" className="rounded-none border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:bg-white/10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Subject</label>
                  <Input id="subject" type="text" placeholder="How can we help?" className="rounded-none border-white/20 bg-white/5 text-white placeholder:text-white/40 focus-visible:border-white focus-visible:bg-white/10 text-sm" required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-wider text-white/70 block">Message</label>
                <textarea id="message" placeholder="Type your message here..." rows={5} className="w-full p-4 border border-white/20 bg-white/5 text-white placeholder:text-white/40 text-sm rounded-none focus:outline-none focus:border-white focus:ring-1 focus:ring-white resize-none transition-colors" required></textarea>
              </div>

              <Button type="submit" className="w-full py-3 h-11 bg-[#a6101b] hover:bg-[#a6101b]/80 text-white text-sm font-medium transition-all active:scale-[0.99] cursor-pointer">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
