'use client';

import React from 'react';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faLinkedinIn, faTwitter } from '@fortawesome/free-brands-svg-icons';

import OurHeritageImage from '../../assets/about-image-1.webp';
import OurCommitmentImage from '../../assets/about-image-2.webp';



const About: React.FC = () => {

  const team = [
    {
      name: "Anirban Biswas",
      role: "Guy with the Idea",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=600&auto=format&fit=crop",
      quote: "Fashion is the armor to survive the reality of everyday life.",
      socials: { ig: "#", in: "#", tw: "#" }
    },
    {
      name: "Arkadipta Basu",
      role: "Guy with the Cash",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&auto=format&fit=crop",
      quote: "We don't just design clothes; we engineer confidence.",
      socials: { ig: "#", in: "#" }
    },
    {
      name: "Moinak Sarkar",
      role: "Guy who reach out to people",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=600&auto=format&fit=crop",
      quote: "Every stitch tells a story of our heritage.",
      socials: { ig: "#", tw: "#" }
    },
    {
      name: "Arnab Ganguly",
      role: "The Man. The Myth. The Legend",
      image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=600&auto=format&fit=crop",
      quote: "Execution is the bridge between culture and commerce.",
      socials: { in: "#", tw: "#" }
    }
  ];

  return (
    <div className="bg-white selection:bg-black selection:text-white">
      <title>Our Story & Team | Gorer Mart - Kolkata Premium Streetwear</title>
      <meta name="description" content="Discover the origins of Gorer Mart. We blend Bengal's rich cultural heritage with modern, ethical streetwear. Meet the passionate team behind the brand." />
      <meta name="keywords" content="Gorer Mart story, Kolkata streetwear brand, ethical fashion India, premium apparel Bengal, our team, clothing brand founders" />

      {/* Thin Hero Banner */}
      <section className="relative pt-32 pb-20 px-6 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop"
            alt="Gorer Mart Philosophy"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
        </div>

        <div className="relative z-10 container mx-auto px-6 md:px-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-xl md:text-3xl font-display font-normal leading-relaxed text-white italic">
              "We didn't set out to create just another clothing brand. We wanted to build a movement that <span className="font-normal text-accent italic">respects our roots</span> while aggressively pursuing the future of urban fashion."
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Editorial Content Blocks */}
      <section className="pb-32">
        <div className="container mx-auto px-6 max-w-7xl space-y-32">

          {/* Block 1 */}
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
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
              <span className="block text-sm uppercase tracking-[0.4em] font-bold text-accent mb-4">Our Heritage</span>
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
              <span className="block text-sm uppercase tracking-[0.4em] font-bold text-accent mb-4">Our Commitment</span>
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

      {/* Team Section */}
      <section className="py-32 bg-neutral-50 border-t border-neutral-200">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-24">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm uppercase tracking-[0.4em] font-bold text-accent mb-4 block"
            >
              The Visionaries
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight"
            >
              Meet the Team
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, idx) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.15, duration: 0.8 }}
                className="group relative"
              >
                <div className="relative aspect-[3/4] overflow-hidden mb-6 bg-neutral-100">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                  />

                  {/* Premium Cinematic Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 flex flex-col justify-end p-8">
                    <p className="text-white font-light text-sm leading-relaxed mb-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-700 ease-out">
                      "{member.quote}"
                    </p>
                    <div className="flex space-x-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      {member.socials.ig && (
                        <a href={member.socials.ig} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                          <FontAwesomeIcon icon={faInstagram} />
                        </a>
                      )}
                      {member.socials.in && (
                        <a href={member.socials.in} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                          <FontAwesomeIcon icon={faLinkedinIn} />
                        </a>
                      )}
                      {member.socials.tw && (
                        <a href={member.socials.tw} className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors">
                          <FontAwesomeIcon icon={faTwitter} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-display font-bold uppercase tracking-tight mb-1">{member.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold">{member.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimal Stats */}
      <section className="bg-black text-white py-24 border-t border-white/10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center divide-x divide-white/10">
            {[
              { number: "10k+", label: "Community Members" },
              { number: "50+", label: "Unique Drops" },
              { number: "100%", label: "Ethically Crafted" },
              { number: "24/7", label: "Cultural Dedication" }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center justify-center">
                <span className="text-4xl md:text-6xl font-display font-black tracking-tighter mb-4">{stat.number}</span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-400 font-bold max-w-[120px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;
