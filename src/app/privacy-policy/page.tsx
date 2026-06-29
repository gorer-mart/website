'use client';

import React from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Database, 
  Globe, 
  UserCheck, 
  ArrowRight,
  Cookie,
  Mail,
  Shield
} from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
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

  const policySections = [
    {
      title: "Information We Collect",
      description: "When you visit or make a purchase, we collect necessary personal details including your name, shipping/billing address, phone number, email address, and order selections to fulfill your purchases.",
      icon: <Database className="text-[#a6101b] w-5 h-5" />
    },
    {
      title: "How We Use Your Data",
      description: "We use your details to process payments, coordinate with delivery partners, send order confirmation and tracking details, and (if opted in) send occasional promotional updates about our cultural streetwear drops.",
      icon: <Eye className="text-[#a6101b] w-5 h-5" />
    },
    {
      title: "Payment Security Protocols",
      description: "All payments are processed securely through certified, industry-standard gateways (such as Razorpay or Stripe). Gorer Mart does not store or have direct access to your credit card number or bank credentials.",
      icon: <Lock className="text-[#a6101b] w-5 h-5" />
    },
    {
      title: "Third-Party Data Sharing",
      description: "We share essential data with trusted service providers to run our store. This includes shipping carriers for logistics, Supabase for secure database management, and Sanity CMS for product listings and media.",
      icon: <Globe className="text-[#a6101b] w-5 h-5" />
    },
    {
      title: "Cookies & Local Storage",
      description: "We utilize local storage and cookies to provide essential store features, such as retaining items in your shopping cart across sessions and analyzing site traffic to optimize navigation.",
      icon: <Cookie className="text-[#a6101b] w-5 h-5" />
    },
    {
      title: "Your Rights & Control",
      description: "You have complete ownership of your personal data. You can request access, corrections, or deletion of your information, or choose to opt out of promotional emails at any time by contacting our support team.",
      icon: <UserCheck className="text-[#a6101b] w-5 h-5" />
    }
  ];

  return (
    <div className="bg-white text-neutral-900 selection:bg-black selection:text-white pt-24 pb-32">
      <title>Privacy Policy | Gorer Mart India</title>
      <meta name="description" content="Official Privacy Policy for Gorer Mart India." />

      {/* Header */}
      <section className="py-20 border-b border-neutral-100 mb-20 px-6 md:px-12 lg:px-24">
        <div className="container max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-[#a6101b] font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Security & Trust</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">Privacy Policy</h1>
            <p className="text-neutral-500 max-w-xl mx-auto leading-relaxed">
              We value your privacy. Learn how Gorer Mart collects, uses, and safeguards your personal information when you visit or purchase from us.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-12 lg:px-24">
        <div className="container max-w-5xl mx-auto">
        
        {/* Trust Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24 p-10 bg-neutral-50 rounded-3xl border border-neutral-100 flex flex-col md:flex-row items-center gap-8 text-center md:text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-[#a6101b] flex items-center justify-center shrink-0">
            <ShieldCheck className="text-white w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase tracking-tight mb-2">Commitment to Data Privacy</h2>
            <p className="text-neutral-600 leading-relaxed">
              Gorer Mart India respects your privacy. We are committed to protecting your personal data and ensuring that your shopping experience is secure, private, and built on trust.
            </p>
          </div>
        </motion.div>

        {/* Policy Sections Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-32"
        >
          {policySections.map((section, idx) => (
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

        {/* Security & Data Retention Notice */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-32">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-2 p-10 bg-black text-white rounded-3xl flex flex-col justify-between"
          >
            <div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#a6101b]" />
                <span>Secure Data Management</span>
              </h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                All data collected on Gorer Mart is encrypted in transit and at rest. As an early-stage startup, we strictly enforce minimum privilege access rules. This means only essential operations personnel have access to shipping addresses and contact details for the sole purpose of delivery fulfillment.
              </p>
            </div>
            <div>
              <Link 
                href="/terms-and-conditions"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#a6101b] hover:text-[#a6101b]/80 transition-colors"
              >
                <span>Read Terms & Conditions</span>
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
                <Mail className="w-5 h-5 text-neutral-400" />
                <span>Contact Officer</span>
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed">
                If you have any questions or concerns regarding our privacy practices, or if you would like to request access or deletion of your customer information, please contact our designated privacy support officers.
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
              className="text-lg md:text-xl font-display font-bold hover:text-[#a6101b] transition-colors underline decoration-neutral-200 underline-offset-8"
            >
              gorermart.india@gmail.com
            </a>
            <a 
              href="mailto:contact@gorermart.in" 
              className="text-lg md:text-xl font-display font-bold hover:text-[#a6101b] transition-colors underline decoration-neutral-200 underline-offset-8"
            >
              contact@gorermart.in
            </a>
          </div>
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

export default PrivacyPolicy;
