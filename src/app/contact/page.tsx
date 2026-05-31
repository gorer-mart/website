'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPhone, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

const Contact: React.FC = () => {
  return (
    <div className="pt-20 bg-white min-h-screen">
      <title>Contact Us — Gorer Mart</title>
      <meta name="description" content="Get in touch with Gorer Mart customer support" />

      <section className="section-padding">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Contact Info */}
            <div>
              <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tighter mb-8">Get In Touch</h1>
              <p className="text-neutral-500 text-lg mb-12 leading-relaxed">
                Have a question about our collections, sizing, or an existing order? 
                Our team is here to help you. Reach out via the form or through our direct channels.
              </p>

              <div className="space-y-8">
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-black flex-shrink-0">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Email Us</h3>
                    <p className="text-neutral-600">contact@gorermart.com</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-black flex-shrink-0">
                    <FontAwesomeIcon icon={faPhone} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-1">Call Us</h3>
                    <p className="text-neutral-600">+91 7044667941</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center text-black flex-shrink-0">
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
            <div className="bg-neutral-50 p-6 sm:p-10 md:p-16">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input type="text" placeholder="First Name" required />
                  <Input type="text" placeholder="Last Name" required />
                </div>
                <Input type="email" placeholder="Email Address" required />
                <Input type="text" placeholder="Subject" required />
                <textarea placeholder="Message" rows={5} className="w-full p-4 border border-neutral-200 bg-white text-sm focus:outline-none focus:border-black resize-none" required></textarea>
                <Button type="submit" className="w-full py-5">Send Message</Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
