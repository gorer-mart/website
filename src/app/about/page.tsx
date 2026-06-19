'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import OurHeritageImage from '../../assets/about/about-image-1.webp';
import OurCommitmentImage from '../../assets/about/about-image-2.webp';



const About: React.FC = () => {


  return (
    <div className="bg-white selection:bg-black selection:text-white">
      <title>Our Story & Team | Gorer Mart - Kolkata Premium Streetwear</title>
      <meta name="description" content="Discover the origins of Gorer Mart. We blend Bengal's rich cultural heritage with modern, ethical streetwear. Meet the passionate team behind the brand." />
      <meta name="keywords" content="Gorer Mart story, Kolkata streetwear brand, ethical fashion India, premium apparel Bengal, our team, clothing brand founders" />



      {/* Editorial Content Blocks */}
      <section className="pb-32 px-6 md:px-12 lg:px-24 pt-12">
        <div className="container mx-auto max-w-7xl space-y-32">

          {/* Block 1 */}
          <div className="mt-6 md:mt-0 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 aspect-[4/5] relative group overflow-hidden"
            >
              <img
                src={OurHeritageImage.src}
                alt="Kolkata Street Culture"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="w-full lg:w-1/2 space-y-8">
              <span className="block text-sm uppercase tracking-[0.4em] font-bold text-[#a6101b] mb-4">Our Heritage</span>
              <h2 className="text-4xl md:text-5xl font-display font-extrabold uppercase tracking-tight leading-none">
                <span className='text-4xl font-extrabold'>Born in the{" "}</span><br /> Heart of Bengal
              </h2>
              <div className="space-y-6 text-neutral-500 leading-relaxed text-lg">
                <p>
                  Gorer Mart emerged from the vibrant, chaotic, and deeply poetic streets of Kolkata. We recognized a gap between the profound cultural motifs of Bengal and the sleek, fast-paced nature of global streetwear.
                </p>
                <p>
                  Our design philosophy is anchored in nostalgia but executed with uncompromising modern precision. Every garment is a canvas that tells a story of the craftsmen, the dreamers, and the urban nomads who navigate this city.
                </p>
              </div>
            </div>
          </div>

          {/* Block 2 */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="w-full lg:w-1/2 aspect-[4/5] relative group overflow-hidden"
            >
              <img
                src={OurCommitmentImage.src}
                alt="Ethical Fashion Craftsmanship"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="w-full lg:w-1/2 space-y-8">
              <span className="block text-sm uppercase tracking-[0.4em] font-bold text-[#a6101b] mb-4">Our Commitment</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight leading-none">
                <span className='text-4xl font-extrabold'>Sustainable</span> <br /> & Ethical
              </h2>
              <div className="space-y-6 text-neutral-500 leading-relaxed text-lg">
                <p>
                  In an era dominated by fast fashion and disposable trends, Gorer Mart stands defiantly for longevity. We refuse to compromise the planet or our people for profit.
                </p>
                <p>
                  We partner exclusively with ethical workshops that guarantee fair wages and safe environments. From utilizing 100% premium organic cotton to implementing biodegradable packaging, every decision is a deliberate step toward a responsible future in the apparel industry.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>


    </div>
  );
};

export default About;
