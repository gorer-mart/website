import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong, faLeaf, faCity, faGem, faQuoteLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS, CATEGORIES } from '../data/products';
import ProductCard from '../components/ProductCard';

import hero from '../assets/hero_image.webp';
import atoshi from '../assets/feedback/atoshi.webp';
import sourav from '../assets/feedback/sourav.webp';

const Home = () => {
  const topPicks = PRODUCTS.filter(p => ["Best Seller", "Trending", "Top Pick", "Premium"].includes(p.tag)).slice(0, 4);
  const newArrivals = PRODUCTS.filter(p => p.tag === "New Arrival").slice(0, 4);

  return (
    <div className="flex flex-col">
      <Helmet>
        <title>Gorer Mart | Authentic Kolkata Streetwear & Premium Apparel</title>
        <meta name="description" content="Explore Gorer Mart, the premier Kolkata-inspired streetwear brand. Shop premium t-shirts and hoodies that blend Bengal heritage with modern urban style. Ethically sourced, sustainably made." />
        <meta name="keywords" content="Kolkata streetwear, premium t-shirts Kolkata, Bengal heritage fashion, sustainable streetwear India, Gorer Mart, authentic urban apparel, designer graphic tees" />
        <meta property="og:title" content="Gorer Mart | Authentic Kolkata Streetwear & Premium Apparel" />
        <meta property="og:description" content="Discover the intersection of Kolkata heritage and modern urban style. Ethically sourced, culturally inspired streetwear from the heart of Bengal." />
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
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-4 block"
              >
                Curated Excellence
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4 leading-tight"
              >
                Top Picks
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-neutral-500 text-lg"
              >
                The most loved pieces from our collective. Designed for the urban soul of Bengal.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-8 md:mt-0"
            >
              <Link to="/shop" className="group flex items-center space-x-2 text-sm font-bold uppercase tracking-[0.2em] hover:text-accent transition-colors">
                <span>View All Picks</span>
                <FontAwesomeIcon icon={faArrowRightLong} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {topPicks.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="section-padding bg-neutral-50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 text-center md:text-left">
            <div className="max-w-xl">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-4 block"
              >
                Fresh Drops
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter mb-4 leading-tight"
              >
                New Arrivals
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-neutral-500 text-lg"
              >
                Discover the latest iterations of Kolkata street style. Limited pieces available.
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="mt-8 md:mt-0"
            >
              <Link to="/shop" className="group flex items-center space-x-2 text-sm font-bold uppercase tracking-[0.2em] hover:text-accent transition-colors">
                <span>View All New</span>
                <FontAwesomeIcon icon={faArrowRightLong} className="group-hover:translate-x-2 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {newArrivals.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.6 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Ethos / Philosophy Section */}
      <section className="section-padding bg-black text-white overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[20vw] font-display font-black opacity-[0.03] whitespace-nowrap select-none pointer-events-none">
          GORER MART • GORER MART
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-6 block"
            >
              Our Philosophy
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-display font-bold uppercase tracking-tighter mb-8 leading-tight"
            >
              The Soul of Bengal, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow">Stitched for the World.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-neutral-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto"
            >
              Gorer Mart is a celebration of identity, fusing the chaotic energy of Kolkata
              with the sleek precision of contemporary premium streetwear.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: faLeaf,
                title: "Conscious Craftsmanship",
                description: "Ethically sourced and sustainably produced. We prioritize premium organic cotton and fair-trade practices in every thread of our Bengal-made apparel.",
                delay: 0.3
              },
              {
                icon: faCity,
                title: "Authentic Kolkata Soul",
                description: "Inspired by the vibrant streets and rich cultural heritage of Kolkata. We create authentic streetwear that bridges traditional stories with urban fashion.",
                delay: 0.4
              },
              {
                icon: faGem,
                title: "Uncompromising Quality",
                description: "High-GSM fabrics and state-of-the-art printing techniques. Our t-shirts are built to last, maintaining their premium feel wash after wash.",
                delay: 0.5
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, duration: 0.6 }}
                className="glass-dark p-10 rounded-2xl group hover:border-accent/50 transition-all duration-500 hover:-translate-y-2"
              >
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-8 group-hover:bg-accent/20 transition-colors">
                  <FontAwesomeIcon icon={item.icon} className="text-2xl text-accent" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-accent transition-colors">{item.title}</h3>
                <p className="text-neutral-400 leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="flex justify-center"
          >
            <Link to="/story" className="btn bg-white text-black hover:bg-yellow hover:scale-105 transition-all shadow-premium px-12">
              Discover Our Story
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Premium Customer Feedback Carousel - White Theme */}
      <section className="py-24 bg-white relative">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 px-4">
            <div className="max-w-2xl">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-accent uppercase tracking-[0.4em] text-xs font-bold mb-4 block"
              >
                The Community
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-6xl font-display font-bold uppercase tracking-tighter"
              >
                Voices of Gorer Mart
              </motion.h2>
            </div>

            <div className="flex space-x-4 mt-8 md:mt-0">
              <button
                onClick={() => {
                  const container = document.getElementById('feedback-container');
                  if (container.scrollLeft <= 100) {
                    container.scrollLeft = container.scrollWidth / 3;
                  }
                  container.scrollBy({ left: -372, behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all group"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-sm group-active:-translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const container = document.getElementById('feedback-container');
                  if (container.scrollLeft + container.clientWidth >= container.scrollWidth - 100) {
                    container.scrollLeft = container.scrollWidth / 3;
                  }
                  container.scrollBy({ left: 372, behavior: 'smooth' });
                }}
                className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-black hover:text-white hover:border-black transition-all group"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-sm group-active:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative">
            <div
              id="feedback-container"
              className="flex space-x-8 overflow-x-auto no-scrollbar scroll-smooth py-12 px-12 md:px-24 snap-x snap-mandatory"
            >
              {[...Array(3)].flatMap(() => [
                {
                  name: "Susan Majumder ",
                  text: "Premium quality. Very comfortable material. Have been using it for a while now, and even after washes the material and print still remains the same. Highly recommended!",
                  image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop"
                },
                {
                  name: "Atoshi Saha",
                  text: "Still as soft and comfortable as the first wear, even after countless washes and the crossover print of The Starry Night and Pather Panchali makes it my absolute favorite till date.",
                  image: atoshi
                },
                {
                  name: "Sourav Biswas",
                  text: "Really impressed with the quality. The fabric feels great, comfortable, and durable. The print quality is also very clear and attractive.",
                  image: sourav
                },
                {
                  name: "Tiyasha Bose",
                  text: "Got the coolest tshirt from the brand! Quality is top notch - perfect for summer. Perfect fit and budget friendly as well.",
                  image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop"
                },
                {
                  name: "Manish Sarkar",
                  text: "Too good. Loved it. The quality of the cloth is absolutely stunning the print and design is awsome.",
                  image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=200&auto=format&fit=crop"
                }
              ]).map((feedback, idx) => (
                <motion.div
                  key={idx}
                  className="min-w-[260px] md:min-w-[340px] bg-white p-6 md:p-8 rounded-2xl border border-neutral-100 flex flex-col justify-between hover:border-accent/40 transition-all duration-500 group relative snap-start"
                >
                  <div className="relative z-10">
                    <div className="text-accent/20 mb-4 group-hover:text-accent transition-colors">
                      <FontAwesomeIcon icon={faQuoteLeft} className="text-2xl" />
                    </div>
                    <p className="text-base italic text-neutral-800 leading-relaxed mb-8">
                      {feedback.text}
                    </p>
                  </div>

                  <div className="flex items-center mt-auto relative z-10 pt-4 border-t border-neutral-50">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-100 mr-4 group-hover:border-accent/30 transition-colors">
                      <img src={feedback.image} alt={feedback.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest text-black">{feedback.name}</h4>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;