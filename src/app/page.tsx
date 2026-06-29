'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRightLong, faLeaf, faCity, faGem, faQuoteLeft, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PRODUCTS } from '../data/products';
import { getProducts, getHomePageShowcase } from '../lib/sanity';
import { Product } from '../types/product';
import ProductCard from '../components/ProductCard';
import { Button } from '../ui/button';

import hero from '../assets/home/hero_image.webp';
import heroMobile from '../assets/home/hero-mobile.webp';
import atoshi from '../assets/feedback/atoshi.webp';
import sourav from '../assets/feedback/sourav.webp';
import susan from '../assets/feedback/susan.webp';
import manish from '../assets/feedback/manish.webp';
import tiyasha from '../assets/feedback/tiyasha.webp';

const Home: React.FC = () => {
  const [topPicks, setTopPicks] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const showcase = await getHomePageShowcase();
        setTopPicks(showcase.mostPochhonder);
        setNewArrivals(showcase.taatkaDrop);
      } catch (err) {
        console.error("Error loading homepage products:", err);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    const container = document.getElementById('feedback-container');
    if (!container) return;

    const handleInitialScroll = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        container.scrollLeft = container.scrollWidth / 3;
      } else {
        container.scrollLeft = 0;
      }
    };
    handleInitialScroll();
    const timer = setTimeout(handleInitialScroll, 150);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col">
      <title>Gorer Mart</title>
      <meta name="application-name" content="Gorer Mart" />
      <meta name="description" content="Explore Gorer Mart, the premier Kolkata-inspired streetwear brand. Shop premium t-shirts and hoodies that blend Bengal heritage with modern urban style. Ethically sourced, sustainably made." />
      <meta name="keywords" content="Kolkata streetwear, premium t-shirts Kolkata, Bengal heritage fashion, sustainable streetwear India, Gorer Mart, authentic urban apparel, designer graphic tees" />
      <meta property="og:title" content="Gorer Mart | Authentic Kolkata Streetwear & Premium Apparel" />
      <meta property="og:description" content="Discover the intersection of Kolkata heritage and modern urban style. Ethically sourced, culturally inspired streetwear from the heart of Bengal." />

      <section className="relative h-[65vh] md:h-screen mt-16 lg:mt-0 w-full flex items-center overflow-hidden bg-neutral-900 px-6 md:px-12 lg:px-24">
        <div className="absolute inset-0 z-0">
          <picture>
            <source
              media="(max-width: 1023px)"
              srcSet={typeof heroMobile === 'object' ? heroMobile.src : heroMobile}
            />
            <img
              src={typeof hero === 'object' ? hero.src : hero}
              alt="Hero Background"
              className="w-full h-full object-cover opacity-80"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        </div>

        <div className="container mx-auto relative z-10">
          <h1 className="sr-only">Gorer Mart</h1>
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl text-white"
          >
            <span className="inline-block text-[#d8cd91] font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs mb-4">
              Bengal's Own Drip
            </span>
            <h1 className="text-2xl md:text-5xl font-bold leading-[1.2] mb-8 tracking-relaxed">
              Get Ready For Endless{" "}
              <br className="hidden md:inline" />
              <span className="text-[#d8cd91] italic font-normal drop-shadow-[0_0_20px_rgba(255,215,0,0.4)] block md:inline my-2 md:my-0">
                "Eta Kotha Theke Kinechish?"
              </span>
              <br className="hidden md:inline" />{" "}
              replies
            </h1>
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 mt-12">
              <Button
                asChild
                variant="premium"
              >
                <Link href="/shop">Explore Collection</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black"
              >
                <Link href="/about">Our Story</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Picks Section */}
      <section className="py-12 px-6 md:py-20 md:px-12 lg:px-24 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 text-center md:text-left">
            <div className="max-w-xl">

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl text-black font-display font-bold uppercase tracking-tighter mb-2 leading-tight">
                most pochhonder
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-sm md:text-base"
              >
                People said that they loved it.{" "}
                <span className="block md:inline">(They said, we didn't)</span>
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden md:block mt-8 md:mt-0"
            >
              <Button asChild>
                <Link href="/shop">View All</Link>
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {topPicks.slice(0, 4).map((product, idx) => (
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

          <div className="flex justify-center mt-12 md:hidden">
            <Button asChild>
              <Link href="/shop">View All</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 px-6 md:py-20 md:px-12 lg:px-24 bg-neutral-50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-16 text-center md:text-left">
            <div className="max-w-xl">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl text-black font-display font-bold uppercase tracking-tighter mb-2 leading-tight"
              >
                Taatka Drops
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-gray-400 text-sm md:text-base"
              >
                Every piece, exclusive.{" "}<span className="block md:inline">Every design, intentional.</span>
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="hidden md:block mt-8 md:mt-0"
            >
              <Button asChild>
                <Link href="/shop">View All</Link>
              </Button>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {newArrivals.slice(0, 4).map((product, idx) => (
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

          <div className="flex justify-center mt-12 md:hidden">
            <Button asChild>
              <Link href="/shop">View All</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Brand Ethos / Philosophy Section */}
      <section className="section-padding bg-[#fff8e9] text-white overflow-hidden relative border-t-6 border-b-6 border-[#a6101b]">


        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-[#a6101b] uppercase tracking-[0.4em] text-[10px] md:text-sm font-bold mb-6 block"
            >
              Our Philosophy
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-6xl text-black font-display font-bold uppercase tracking-tighter mb-8 leading-tight"
            >
              The Soul of Bengal, <br />
              <span className="text-[#a6101b]">Stitched for the World.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-600 text-[12px] md:text-lg font-light leading-relaxed max-w-3xl mx-auto"
            >
              At Gorer Mart, every design is a love letter to Bangla cinema, Moharothis, and unfiltered street spirit. Crafted for people who wear their culture proudly.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: faLeaf,
                title: "Jotno-fully Built",
                description: "Built with high-GSM organic cotton that breathes like a fresh December er Sokal and the print survives hundred washes like Bangali Oitijhyo. Expect no less than a Bhaat-Ghum comfort.",
                delay: 0.3
              },
              {
                icon: faCity,
                title: "Paara Certified",
                description: "Gorer Mart is the Howrah Bridge between Cultural Heritage and Modern Urban fashion. From Babai to Bablu Kaku, everyone loves it.",
                delay: 0.4
              },
              {
                icon: faGem,
                title: "Hok Kolorob",
                description: "They say Banglay naki rock aar bhalo tshirt hoynah. Show them Fossils and Gorer Mart.",
                delay: 0.5
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: item.delay, duration: 0.6 }}
                className="bg-[#a6101b] p-6 md:p-10 rounded-2xl group hover:shadow-black/30 hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="flex flex-row md:flex-col-reverse justify-between items-center md:items-start gap-4 md:gap-0 mb-6 md:mb-0">

                  <h3 className="text-2xl font-bold md:mb-4 text-[#fff8e9]">{item.title}</h3>

                  <div className="w-10 h-10 md:w-16 md:h-16 rounded-full bg-black/60 md:bg-black/50 flex items-center justify-center md:mb-8 shrink-0">
                    <FontAwesomeIcon icon={item.icon} className="text-lg md:text-2xl text-[#fff8e9]" />
                  </div>

                </div>

                <p className="text-[#d8cd91] leading-relaxed text-sm md:text-base">
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
            <Button asChild className="bg-white text-[#a6101b] border-2 hover:bg-white border-[#a6101b] hover:scale-105 transition-all shadow-premium px-12">
              <Link href="/about">Discover Our Story</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Premium Customer Feedback Carousel - White Theme */}
      <section className="py-24 bg-white relative px-6 md:px-12 lg:px-24">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 text-center md:text-left">
            <div className="max-w-2xl">
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-[#a6101b] uppercase tracking-[0.4em] text-xs font-bold mb-4 block"
              >
                The Community
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tighter mb-4 leading-tight"
              >
                Ke Ki Bole Gelo
              </motion.h2>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            {/* Mobile Left Arrow */}
            <button
              onClick={() => {
                const container = document.getElementById('feedback-container');
                if (container) {
                  const card = container.firstElementChild as HTMLElement;
                  const step = card ? card.offsetWidth + 32 : 372;

                  // If we are getting too close to the left edge, instantly jump to the middle copy
                  if (container.scrollLeft <= container.scrollWidth / 3 + 100) {
                    container.style.scrollBehavior = 'auto';
                    container.scrollLeft = container.scrollLeft + container.scrollWidth / 3;
                    container.offsetHeight; // force reflow
                  }

                  container.style.scrollBehavior = 'smooth';
                  container.scrollBy({ left: -step, behavior: 'smooth' });
                }
              }}
              className="md:hidden absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-neutral-200 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all shadow-md cursor-pointer text-black"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            </button>

            <div
              id="feedback-container"
              className="flex space-x-8 overflow-x-hidden no-scrollbar scroll-smooth py-12 snap-x snap-mandatory w-full"
            >
              {[...Array(3)].flatMap(() => [
                {
                  name: "Susan Majumder ",
                  text: "Premium quality. Very comfortable material. Have been using it for a while now, and even after washes the material and print still remains the same. Highly recommended!",
                  image: susan
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
                  image: tiyasha
                },
                {
                  name: "Manish Sarkar",
                  text: "Too good. Loved it. The quality of the cloth is absolutely stunning the print and design is awsome.",
                  image: manish
                }
              ]).map((feedback, idx) => (
                <motion.div
                  key={idx}
                  className="w-[calc(100vw-6rem)] min-w-[calc(100vw-6rem)] md:w-[340px] md:min-w-[340px] bg-white p-6 md:p-8 rounded-2xl border border-neutral-100 flex flex-col justify-between hover:border-[#d8cd91] hover:shadow-xl transition-all duration-500 group relative snap-center md:snap-start"
                >
                  <div className="relative z-10">
                    <div className="text-accent/20 mb-4 group-hover:text-[#d8cd91] transition-colors">
                      <FontAwesomeIcon icon={faQuoteLeft} className="text-2xl" />
                    </div>
                    <p className="text-base italic text-neutral-800 leading-relaxed mb-8">
                      {feedback.text}
                    </p>
                  </div>

                  <div className="flex items-center mt-auto relative z-10 pt-4 border-t border-neutral-50">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-100 mr-4 group-hover:border-border-accent/30 transition-colors">
                      <img src={typeof feedback.image === 'object' ? feedback.image.src : feedback.image} alt={feedback.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-widest text-black">{feedback.name}</h4>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile Right Arrow */}
            <button
              onClick={() => {
                const container = document.getElementById('feedback-container');
                if (container) {
                  const card = container.firstElementChild as HTMLElement;
                  const step = card ? card.offsetWidth + 32 : 372;

                  // If we are getting too close to the right edge of the middle section, instantly jump back
                  if (container.scrollLeft + container.clientWidth >= (container.scrollWidth * 2) / 3 - 100) {
                    container.style.scrollBehavior = 'auto';
                    container.scrollLeft = container.scrollLeft - container.scrollWidth / 3;
                    container.offsetHeight; // force reflow
                  }

                  container.style.scrollBehavior = 'smooth';
                  container.scrollBy({ left: step, behavior: 'smooth' });
                }
              }}
              className="md:hidden absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-neutral-200 bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-black hover:text-white hover:border-black active:scale-95 transition-all shadow-md cursor-pointer text-black"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
            </button>
          </div>
          <div className="hidden md:flex space-x-4 mt-8 md:mt-0 justify-end">
            <button
              onClick={() => {
                const container = document.getElementById('feedback-container');
                if (container) {
                  const card = container.firstElementChild as HTMLElement;
                  const step = card ? card.offsetWidth + 32 : 372;
                  
                  // If we are getting too close to the left edge, instantly jump to the middle copy
                  if (container.scrollLeft <= container.scrollWidth / 3 + 100) {
                     container.style.scrollBehavior = 'auto';
                     container.scrollLeft = container.scrollLeft + container.scrollWidth / 3;
                     container.offsetHeight; // force reflow
                  }
                  
                  container.style.scrollBehavior = 'smooth';
                  container.scrollBy({ left: -step, behavior: 'smooth' });
                }
              }}
              className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-[#a6101b] hover:text-white transition-all group cursor-pointer text-black"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-sm group-active:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => {
                const container = document.getElementById('feedback-container');
                if (container) {
                  const card = container.firstElementChild as HTMLElement;
                  const step = card ? card.offsetWidth + 32 : 372;
                  
                  // If we are getting too close to the right edge of the middle section, instantly jump back
                  if (container.scrollLeft + container.clientWidth >= (container.scrollWidth * 2) / 3 - 100) {
                     container.style.scrollBehavior = 'auto';
                     container.scrollLeft = container.scrollLeft - container.scrollWidth / 3;
                     container.offsetHeight; // force reflow
                  }
                  
                  container.style.scrollBehavior = 'smooth';
                  container.scrollBy({ left: step, behavior: 'smooth' });
                }
              }}
              className="w-12 h-12 rounded-full border border-neutral-200 flex items-center justify-center hover:bg-[#a6101b] hover:text-white transition-all group cursor-pointer text-black"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-sm group-active:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
