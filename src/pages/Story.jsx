import React from 'react';
import { motion } from 'motion/react';

const Story = () => {
  return (
    <div className="pt-20 bg-white">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1441984969175-8c76ca376a9d?q=80&w=2000&auto=format&fit=crop" 
          alt="Brand Story Hero" 
          className="absolute inset-0 w-full h-full object-cover grayscale opacity-40"
        />
        <div className="relative z-10 text-center">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-6 block"
          >
            Since 2026
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-display font-bold uppercase tracking-tighter"
          >
            Our Story
          </motion.h1>
        </div>
      </section>

      {/* Content */}
      <section className="section-padding">
        <div className="container mx-auto max-w-4xl">
          <div className="space-y-16">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-6">Born in the Heart of Bengal</h2>
                <p className="text-neutral-500 leading-relaxed mb-6">
                  Gorer Mart was founded with a singular vision: to bridge the gap between traditional cultural motifs and the fast-paced world of modern streetwear. Inspired by the chaotic beauty of Kolkata's streets, our designs capture the spirit of nostalgia while pushing the boundaries of contemporary fashion.
                </p>
                <p className="text-neutral-500 leading-relaxed">
                  We don't just sell clothes; we tell stories. Each stitch is a tribute to the craftsmen, the dreamers, and the urban nomads who call Bengal home.
                </p>
              </div>
              <div className="flex-1 aspect-[4/5] bg-neutral-100 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?q=80&w=1000&auto=format&fit=crop" alt="Founder Story" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1">
                <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-6">Sustainable & Ethical</h2>
                <p className="text-neutral-500 leading-relaxed mb-6">
                  In an era of fast fashion, Gorer Mart stands for longevity. We partner with local ethical workshops that prioritize fair wages and safe working conditions. Our materials are meticulously sourced to ensure minimal environmental impact without compromising on the premium quality our customers expect.
                </p>
                <p className="text-neutral-500 leading-relaxed">
                  From 100% organic cotton to recycled packaging, every decision we make is a step towards a more responsible future for fashion.
                </p>
              </div>
              <div className="flex-1 aspect-[4/5] bg-neutral-100 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=80&w=1000&auto=format&fit=crop" alt="Craftsmanship" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-black text-white py-24">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div>
              <span className="text-4xl md:text-5xl font-display font-bold block mb-2">10k+</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Happy Customers</span>
            </div>
            <div>
              <span className="text-4xl md:text-5xl font-display font-bold block mb-2">50+</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Unique Designs</span>
            </div>
            <div>
              <span className="text-4xl md:text-5xl font-display font-bold block mb-2">100%</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Ethical Sourcing</span>
            </div>
            <div>
              <span className="text-4xl md:text-5xl font-display font-bold block mb-2">24h</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">Dispatch Time</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Story;
