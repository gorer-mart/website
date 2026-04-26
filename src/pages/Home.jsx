import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS, CATEGORIES } from '../data/products';
import ProductCard from '../components/shop/ProductCard';

import hero from '../assets/hero_image.webp';

const Home = () => {
  const featuredProducts = PRODUCTS.slice(0, 4);

  return (
    <div className="flex flex-col pt-8">
      <Helmet>
        <title>Gorer Mart | Premium Apparel & Streetwear</title>
        <meta name="description" content="Discover the intersection of Kolkata heritage and modern urban style. Shop premium t-shirts, hoodies, and accessories at Gorer Mart." />
        <meta property="og:title" content="Gorer Mart | Premium Apparel & Streetwear" />
        <meta property="og:description" content="Ethically sourced, culturally inspired streetwear from the heart of Kolkata." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative h-screen w-full flex items-center overflow-hidden bg-neutral-900">
        <div className="absolute inset-0 z-0">
          <img
            src={hero}
            alt="Hero Background"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl text-white"
          >
            <span className="inline-block text-accent font-bold uppercase tracking-[0.3em] text-sm mb-4">
              Bengal's Own Drip
            </span>
            <h1 className="text-2xl md:text-6xl font-bold leading-[1.2] mb-8 tracking-relaxed">
              Get Ready For Endless{" "}
              <span className="text-yellow italic font-normal drop-shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                "Eta Kotha Theke Kinechish?"
              </span>{" "}
              replies
            </h1>
            <div className="flex flex-col sm:flex-row gap-4 mt-12">
              <Link 
                to="/shop" 
                className="btn bg-yellow text-black hover:bg-white hover:scale-105 transition-all shadow-premium"
              >
                Explore Collection
              </Link>
              <Link 
                to="/story" 
                className="btn border-2 border-white text-white hover:bg-white hover:text-black transition-all"
              >
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Picks Section */}
      <section className="section-padding bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 text-center md:text-left">
            <div className="max-w-xl">
              <span className="text-accent uppercase tracking-[0.3em] text-xs font-bold mb-4 block">Curated For You</span>
              <h2 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4 leading-tight">Top Picks</h2>
              <p className="text-neutral-500">The most loved pieces from our unisex collective. Designed for everyone, everywhere.</p>
            </div>
            <div className="hidden md:block">
              <Link to="/shop" className="underline underline-offset-8 uppercase tracking-[0.2em] text-xs font-bold hover:text-accent transition-colors">View All Picks</Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {CATEGORIES.map((cat, index) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                className="group relative h-[600px] overflow-hidden"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-12 text-white">
                  <h3 className="text-3xl font-display font-bold uppercase tracking-tight mb-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    {cat.name}
                  </h3>
                  <Link
                    to="/shop"
                    className="opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500 btn btn-primary bg-white text-black py-3 px-8 text-[10px]"
                  >
                    Shop Collection
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section-padding bg-neutral-50">
        <div className="container mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl uppercase tracking-tighter">The Edit</h2>
            <Link to="/shop" className="group flex items-center space-x-2 text-sm font-bold uppercase tracking-widest hover:text-accent transition-colors">
              <span>View All</span>
              <FontAwesomeIcon icon={faArrowRightLong} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Ethos */}
      <section className="section-padding bg-black text-white overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-display font-black opacity-[0.03] whitespace-nowrap select-none">
          GORER MART • GORER MART
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-8 block">Our Philosophy</span>
            <h2 className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-12 leading-tight">
              Ethically Sourced. <br />
              Culturally Inspired. <br />
              Universally Styled.
            </h2>
            <p className="text-neutral-400 text-lg md:text-xl font-light mb-12 leading-relaxed">
              We believe in more than just clothing. Gorer Mart is a celebration of identity,
              fusing the chaotic energy of Kolkata with the sleek precision of contemporary fashion.
              Each piece is a testament to our commitment to quality and the stories that shape us.
            </p>
            <Link to="/story" className="btn btn-primary bg-white text-black hover:bg-neutral-200">
              Read Our Story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;