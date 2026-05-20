'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  Scale, 
  ShieldAlert, 
  FileText, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Info,
  Lock,
  UserCheck,
  Globe,
  ShoppingBag
} from 'lucide-react';

const TermsAndConditions: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  const termSections = [
    {
      title: "Acceptance of Terms",
      description: "By accessing Gorer Mart, creating an account, or purchasing products, you agree to be bound by these Terms and Conditions and all applicable laws and regulations.",
      icon: <FileText className="text-black w-5 h-5" />
    },
    {
      title: "Account Registration",
      description: "To make purchases, you may be required to register. You agree to provide accurate and complete details and to keep your credentials secure. You are fully responsible for account activity.",
      icon: <UserCheck className="text-black w-5 h-5" />
    },
    {
      title: "Product Accuracy & Pricing",
      description: "We display product colors and designs as accurately as possible. However, actual colors depend on your monitor display. Prices and availability are subject to change without prior notice.",
      icon: <ShoppingBag className="text-black w-5 h-5" />
    },
    {
      title: "Intellectual Property",
      description: "All content on this site, including designs, text, graphics, logos, and images, is the exclusive intellectual property of Gorer Mart. Any unauthorized reproduction is strictly prohibited.",
      icon: <ShieldCheck className="text-black w-5 h-5" />
    },
    {
      title: "Shipping & Delivery",
      description: "Delivery estimates are provided in good faith. As an early-stage startup, we partner with external logistics providers. Gorer Mart is not liable for delayed delivery due to shipping carrier issues.",
      icon: <Clock className="text-black w-5 h-5" />
    },
    {
      title: "Limitation of Liability",
      description: "Gorer Mart shall not be liable for any indirect, incidental, or consequential damages arising from your use of the website or purchase of any of our products.",
      icon: <Lock className="text-black w-5 h-5" />
    }
  ];

  return (
    <div className="bg-white text-neutral-900 selection:bg-black selection:text-white pt-24 pb-32">
      <title>Terms & Conditions | Gorer Mart India</title>
      <meta name="description" content="Official Terms and Conditions for Gorer Mart India." />

      {/* Header */}
      <section className="py-20 border-b border-neutral-100 mb-20">
        <div className="container max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Legal Agreement</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">Terms & Conditions</h1>
            <p className="text-neutral-500 max-w-xl mx-auto leading-relaxed">
              Please review our terms carefully before using our platform. As a growing startup, we appreciate your trust and cooperation.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-5xl mx-auto px-6">
        
        {/* Startup Note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 p-10 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col md:flex-row items-center gap-8 text-center md:text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <Globe className="text-white w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Early-Stage Startup Note</h2>
            <p className="text-neutral-600 leading-relaxed">
              Gorer Mart is currently in its initial rollout phase. We are committed to providing premium cultural streetwear. During this phase, operations, logistics, and digital services are continuously optimized. By using our website, you support our early journey and agree to these flexible growth conditions.
            </p>
          </div>
        </motion.div>

        {/* Terms Sections Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32"
        >
          {termSections.map((section, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="p-8 border border-neutral-100 rounded-3xl hover:border-neutral-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center mb-6">
                  {section.icon}
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight mb-3">{section.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{section.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Refund Policy Alignment Notice */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 p-10 bg-black text-white rounded-3xl flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-accent" />
                <span>Strict Policy Agreement</span>
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                All purchases are final. In alignment with our official Refund & Return Policy, Gorer Mart maintains a strict <span className="text-white font-bold underline">NO RETURN / NO REFUND</span> standard once an order is placed, unless items are delivered damaged, defective, or incorrect.
              </p>
            </div>
            <div>
              <Link 
                href="/refund-policy"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent hover:text-white transition-colors"
              >
                <span>Read Full Refund Policy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 border border-neutral-100 rounded-3xl flex flex-col justify-between"
          >
            <div>
              <h2 className="text-xl font-bold uppercase tracking-tight mb-4 flex items-center gap-2">
                <Scale className="w-5 h-5 text-neutral-400" />
                <span>Governing Law</span>
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                These Terms and Conditions are governed by and construed in accordance with the laws of India. Any legal proceedings or disputes shall be subject to the exclusive jurisdiction of the courts located in Kolkata, West Bengal.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Contact Info */}
        <div className="text-center py-10 border-t border-neutral-100">
          <h2 className="text-sm uppercase tracking-widest text-neutral-400 font-bold mb-6">Have Questions? Contact Us</h2>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-10">
            <a 
              href="mailto:gorermart.india@gmail.com" 
              className="text-lg md:text-xl font-display font-bold hover:text-accent transition-colors underline decoration-neutral-200 underline-offset-8"
            >
              gorermart.india@gmail.com
            </a>
            <a 
              href="mailto:contact@gorermart.in" 
              className="text-lg md:text-xl font-display font-bold hover:text-accent transition-colors underline decoration-neutral-200 underline-offset-8"
            >
              contact@gorermart.in
            </a>
          </div>
        </div>

      </div>

      {/* Back to Shop */}
      <div className="mt-32 pt-10 border-t border-neutral-100 container max-w-5xl mx-auto px-6 flex justify-center">
        <Link href="/shop" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
          <ArrowRight className="w-3 h-3 rotate-180" />
          <span>Return to Collection</span>
        </Link>
      </div>

    </div>
  );
};

export default TermsAndConditions;
