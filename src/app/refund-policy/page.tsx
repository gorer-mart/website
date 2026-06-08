'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Camera, 
  Package, 
  RefreshCcw, 
  CreditCard, 
  ArrowRight,
  ShieldCheck,
  Info
} from 'lucide-react';

const RefundPolicy: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  const eligibleItems = [
    { text: "Physically damaged product", icon: <CheckCircle2 className="text-green-500 w-5 h-5" /> },
    { text: "Manufacturing defective product", icon: <CheckCircle2 className="text-green-500 w-5 h-5" /> },
    { text: "Incorrect product delivered", icon: <CheckCircle2 className="text-green-500 w-5 h-5" /> }
  ];

  const nonReturnableItems = [
    { text: "If the product is correct and not damaged", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "If the size does not fit", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "If you don't like the product after delivery", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "If the color/design difference is due to screen display", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "Change of mind after purchase", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "Sale items / discounted items", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "Gift cards", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "Accessories, innerwear, perfumes, masks, sunglasses", icon: <XCircle className="text-red-400 w-4 h-4" /> },
    { text: "Special promotions (BOGO / offers / clearance sale)", icon: <XCircle className="text-red-400 w-4 h-4" /> }
  ];

  const processSteps = [
    { title: "Contact Us", description: "Within 24 hours of delivery", icon: <Clock /> },
    { title: "Share Proof", description: "Images/videos of the issue", icon: <Camera /> },
    { title: "Verification", description: "Internal quality audit", icon: <ShieldCheck /> },
    { title: "Approval", description: "Return instructions shared", icon: <CheckCircle2 /> },
    { title: "Inspection", description: "Physical check after return", icon: <Package /> },
    { title: "Resolution", description: "Replacement or refund", icon: <RefreshCcw /> }
  ];

  return (
    <div className="bg-white text-neutral-900 selection:bg-black selection:text-white pt-24 pb-32">
      <title>Refund & Return Policy | Gorer Mart India</title>
      <meta name="description" content="Official return and refund policy for Gorer Mart India." />

      {/* Header */}
      <section className="py-20 border-b border-neutral-100 mb-20 px-6 md:px-12 lg:px-24">
        <div className="container max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Official Policy</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">Return & Refund Policy</h1>
            <p className="text-neutral-500 max-w-xl mx-auto leading-relaxed">
              Please read our policies carefully before making a purchase. We prioritize quality and transparency in every transaction.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="container max-w-5xl mx-auto">
        
        {/* Strict Policy Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 p-10 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col md:flex-row items-center gap-8 text-center md:text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center shrink-0">
            <AlertTriangle className="text-white w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Strict Policy Notice</h2>
            <p className="text-neutral-600 leading-relaxed">
              Gorer Mart India follows a <span className="text-black font-bold underline decoration-neutral-300 underline-offset-4">NO RETURN / NO REFUND</span> policy once a product is purchased, unless the product is damaged, defective, or incorrect at the time of delivery.
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
          
          {/* Eligibility */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-8 pb-4 border-b border-neutral-100 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span>Eligible Cases</span>
            </h2>
            <div className="space-y-4">
              {eligibleItems.map((item, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="flex items-center gap-4 p-5 bg-white border border-neutral-100 rounded-2xl hover:border-neutral-300 transition-all"
                >
                  {item.icon}
                  <span className="font-medium text-neutral-800">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Damage Policy */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 bg-black text-white rounded-3xl"
          >
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-8 flex items-center gap-3">
              <Info className="w-6 h-6 text-accent" />
              <span>Damage Protocol</span>
            </h2>
            <ul className="space-y-6">
              {[
                "Report issue within 24 hours of delivery",
                "Share clear photos/videos of the product",
                "Original packaging and tags must be available",
                "Product must be unused and in original condition"
              ].map((text, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                  <span className="text-neutral-400 text-sm leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-10 pt-10 border-t border-white/10">
               <span className="text-[10px] uppercase tracking-widest text-neutral-500 block mb-4">Report At</span>
               <div className="space-y-2">
                 <a href="mailto:gorermart.india@gmail.com" className="text-accent hover:text-white transition-colors block font-medium">gorermart.india@gmail.com</a>
                 <a href="mailto:contact@gorermart.in" className="text-accent hover:text-white transition-colors block font-medium">contact@gorermart.in</a>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Non-Returnable */}
        <section className="mb-32">
          <div className="max-w-2xl mb-12">
            <h2 className="text-3xl font-display font-bold uppercase tracking-tight mb-4">Non-Returnable Conditions</h2>
            <p className="text-neutral-500">Returns are not accepted under the following circumstances:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nonReturnableItems.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-4 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-all group"
              >
                <div className="shrink-0">{item.icon}</div>
                <span className="text-sm font-medium text-neutral-700">{item.text}</span>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
            Once purchased, items without defects cannot be returned.
          </p>
        </section>

        {/* Return Process Timeline */}
        <section className="mb-32">
           <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-16 text-center">The Return Process</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 relative">
              {processSteps.map((step, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-12 h-12 rounded-full border border-neutral-100 flex items-center justify-center mx-auto mb-6 group-hover:bg-black group-hover:text-white transition-all text-neutral-400">
                    {idx + 1}
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-tight mb-2">{step.title}</h3>
                  <p className="text-[10px] text-neutral-500 leading-relaxed uppercase tracking-wider">{step.description}</p>
                </motion.div>
              ))}
           </div>
        </section>

        {/* Refund & Exchange Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32">
          <div className="p-10 border border-neutral-100 rounded-3xl">
            <CreditCard className="w-8 h-8 mb-6 text-neutral-300" />
            <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Refund Policy</h2>
            <ul className="space-y-4 text-sm text-neutral-600">
              <li>• Refunds only for approved damaged/defective cases.</li>
              <li>• Made to the original payment method.</li>
              <li>• Processing time: 7-10 business days.</li>
            </ul>
          </div>
          <div className="p-10 border border-neutral-100 rounded-3xl">
            <RefreshCcw className="w-8 h-8 mb-6 text-neutral-300" />
            <h2 className="text-xl font-bold uppercase tracking-tight mb-6">Exchange Policy</h2>
            <ul className="space-y-4 text-sm text-neutral-600">
              <li>• Allowed for damaged/defective items or size changes.</li>
              <li>• No exchange for normal, correct products.</li>
            </ul>
          </div>
        </div>

        {/* Final Statement */}
        <div className="max-w-3xl mx-auto text-center mb-32 py-20 border-y border-neutral-100">
           <p className="text-xl md:text-2xl font-display font-medium text-neutral-800 leading-relaxed italic">
             "Once a product is purchased from Gorer Mart India and delivered in proper condition without any damage or defect, no return, no exchange, and no refund will be accepted."
           </p>
        </div>

        {/* Contact Info */}
        <div className="text-center">
           <h2 className="text-sm uppercase tracking-widest text-neutral-400 font-bold mb-6">Contact Information</h2>
           <a 
             href="mailto:gorermart@gmail.com" 
             className="text-2xl md:text-3xl font-display font-bold hover:text-accent transition-colors underline decoration-neutral-200 underline-offset-8"
           >
             gorermart@gmail.com
           </a>
        </div>

       </div>
      </section>

      {/* Back to Shop */}
      <section className="px-6 md:px-12 lg:px-24">
        <div className="mt-32 pt-10 border-t border-neutral-100 container max-w-5xl mx-auto flex justify-center">
          <Link href="/shop" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
            <ArrowRight className="w-3 h-3 rotate-180" />
            <span>Return to Collection</span>
          </Link>
        </div>
      </section>

    </div>
  );
};

export default RefundPolicy;
