'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

const Contact: React.FC = () => {
  return (
    <div className="pt-12 bg-white min-h-screen">
      <title>Contact Us — Gorer Mart</title>
      <meta name="description" content="Get in touch with Gorer Mart customer support" />

      <section className="section-padding">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Contact Info */}
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-8">Get In Touch</h1>
              <p className="text-neutral-500 text-lg mb-12 leading-relaxed">
                Have a question about our collections, sizing, or an existing order? 
                Our team is here to help you. Reach out via the form or through our direct channels.
              </p>

              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-[#a6101b] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Email Us</h3>
                    <p className="text-neutral-600">contact@gorermart.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-[#a6101b] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Call Us</h3>
                    <p className="text-neutral-600">+91 7044667941</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-[#a6101b] rounded-full flex items-center justify-center text-white flex-shrink-0">
                    <FontAwesomeIcon icon={faLocationDot} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Location</h3>
                    <p className="text-neutral-600">Barasat, Kolkata-700124<br />West Bengal, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white border border-neutral-100 rounded-2xl shadow-xl shadow-neutral-100/50 p-6 sm:p-10 md:p-12">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="name" className="text-xs font-medium text-neutral-500 block">Name</label>
                    <Input id="name" type="text" placeholder="Enter your full name" className="rounded-lg border-neutral-200 bg-white focus-visible:border-black focus-visible:bg-white text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-neutral-500 block">Email Address</label>
                    <Input id="email" type="email" placeholder="you@example.com" className="rounded-lg border-neutral-200 bg-white focus-visible:border-black focus-visible:bg-white text-sm" required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-medium text-neutral-500 block">Phone Number</label>
                    <Input id="phone" type="tel" placeholder="e.g. +91 98765 43210" className="rounded-lg border-neutral-200 bg-white focus-visible:border-black focus-visible:bg-white text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="subject" className="text-xs font-medium text-neutral-500 block">Subject</label>
                    <Input id="subject" type="text" placeholder="How can we help?" className="rounded-lg border-neutral-200 bg-white focus-visible:border-black focus-visible:bg-white text-sm" required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className="text-xs font-medium text-neutral-500 block">Message</label>
                  <textarea id="message" placeholder="Type your message here..." rows={5} className="w-full p-4 border border-neutral-200 bg-white text-sm rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none transition-colors" required></textarea>
                </div>

                <Button type="submit" className="w-full py-3 h-11 bg-[#a6101b] hover:bg-[#a6101b]/80 text-white rounded-lg text-sm font-medium transition-all hover:shadow-md hover:shadow-neutral-950/10 active:scale-[0.99] cursor-pointer">
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
