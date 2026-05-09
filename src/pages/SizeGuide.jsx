import React from 'react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { 
  Ruler, 
  Info, 
  CheckCircle2, 
  ArrowRight, 
  Maximize2, 
  ArrowUpDown, 
  RotateCw, 
  HelpCircle,
  MessageCircle,
  Mail,
  Shirt,
  Scissors,
  ChevronRight,
  Plus
} from 'lucide-react';

const SizeGuide = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const sizes = [
    { size: 'S', chest: '38"', length: '26"', shoulder: '17"', sleeve: '7.5"' },
    { size: 'M', chest: '40"', length: '27"', shoulder: '18"', sleeve: '8"' },
    { size: 'L', chest: '42"', length: '28"', shoulder: '19"', sleeve: '8.5"' },
    { size: 'XL', chest: '44"', length: '29"', shoulder: '20"', sleeve: '9"' },
    { size: 'XXL', chest: '46"', length: '30"', shoulder: '21"', sleeve: '9.5"' },
  ];

  return (
    <div className="bg-white text-neutral-900 selection:bg-black selection:text-white pt-24 pb-32">
      <Helmet>
        <title>Size Guide | Gorer Mart India</title>
        <meta name="description" content="Official size guide for Gorer Mart India. Find your perfect fit with our detailed measurement charts." />
      </Helmet>

      {/* Hero Section - Simple & Sober */}
      <section className="py-20 border-b border-neutral-100 mb-20">
        <div className="container max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-accent font-bold uppercase tracking-[0.3em] text-[10px] mb-4 block">Measurement Guide</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight mb-6">Find Your Perfect Fit</h1>
            <p className="text-neutral-500 max-w-xl mx-auto leading-relaxed">
              Our t-shirts are designed for a comfortable regular fit. Use the guide below to ensure you select the size that best matches your preference.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container max-w-5xl mx-auto px-6">
        
        {/* Quick Info Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-24"
        >
          {[
            { icon: <Ruler className="w-5 h-5" />, text: "All measurements are in inches" },
            { icon: <Plus className="w-5 h-5" />, text: "Slight variations (±0.5\") possible" },
            { icon: <Shirt className="w-5 h-5" />, text: "Standard Regular Fit" },
            { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, text: "Choose your normal size" }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              variants={itemVariants}
              className="p-6 bg-neutral-50 rounded-2xl border border-neutral-100 flex items-center gap-4"
            >
              <div className="text-neutral-400">{item.icon}</div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Size Table */}
        <section className="mb-32">
          <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-2">T-Shirt Size Chart</h2>
              <p className="text-sm text-neutral-500 uppercase tracking-widest">Regular Fit Collection</p>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 py-2 px-4 bg-neutral-50 rounded-full border border-neutral-100">
              Units: Inches (in)
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="overflow-x-auto no-scrollbar border border-neutral-100 rounded-3xl"
          >
            <table className="w-full text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-100">
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Size</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Chest</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Length</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Shoulder</th>
                  <th className="px-8 py-6 text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-400">Sleeve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {sizes.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-8 py-6 font-bold text-lg">{row.size}</td>
                    <td className="px-8 py-6 text-neutral-600">{row.chest}</td>
                    <td className="px-8 py-6 text-neutral-600">{row.length}</td>
                    <td className="px-8 py-6 text-neutral-600">{row.shoulder}</td>
                    <td className="px-8 py-6 text-neutral-600">{row.sleeve}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </section>

        {/* How to Measure */}
        <section className="mb-32 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-6">How to Measure</h2>
            <p className="text-neutral-500 mb-10 leading-relaxed">
              We recommend measuring a t-shirt you already own that fits you well. Lay it flat on a hard surface and use a measuring tape for best results.
            </p>
            <div className="space-y-6">
              {[
                { title: "Chest", desc: "Measure across the chest from one armhole to the other.", icon: <Maximize2 /> },
                { title: "Shoulder", desc: "Measure from one shoulder seam to the other.", icon: <ArrowUpDown className="rotate-90" /> },
                { title: "Length", desc: "Measure from the collar seam to the bottom hem.", icon: <ArrowUpDown /> },
                { title: "Sleeve", desc: "Measure from the shoulder seam to the end of the sleeve.", icon: <RotateCw /> }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-6 items-start">
                  <div className="w-10 h-10 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 text-neutral-400">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest mb-1">{item.title}</h4>
                    <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="aspect-[4/5] bg-neutral-50 rounded-[40px] border border-neutral-100 flex items-center justify-center p-12 relative overflow-hidden">
             <div className="absolute top-8 left-8 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-300">Reference Diagram</div>
             <svg viewBox="0 0 400 500" className="w-full h-full text-neutral-200 fill-none stroke-current stroke-2">
                <path d="M100,50 L300,50 L350,150 L300,180 L300,450 L100,450 L100,180 L50,150 L100,50 Z" />
                <line x1="100" y1="200" x2="300" y2="200" className="stroke-neutral-300 dash-array-4" />
                <line x1="200" y1="50" x2="200" y2="450" className="stroke-neutral-300 dash-array-4" />
                <text x="200" y="190" textAnchor="middle" className="fill-neutral-400 text-[10px] font-bold tracking-[0.2em] uppercase">Chest</text>
                <text x="215" y="250" transform="rotate(90, 215, 250)" className="fill-neutral-400 text-[10px] font-bold tracking-[0.2em] uppercase">Length</text>
             </svg>
          </div>
        </section>

        {/* Fit Information */}
        <section className="mb-32 p-12 bg-neutral-900 text-white rounded-[40px]">
           <div className="max-w-2xl">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-6">Regular Fit Philosophy</h2>
              <p className="text-neutral-400 leading-relaxed mb-8">
                Our Regular Fit is designed to provide a timeless silhouette. It offers a comfortable amount of room through the body and sleeves, ensuring ease of movement while maintaining a clean, modern look.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Style Tip</h4>
                   <p className="text-sm text-neutral-400">Works best for a relaxed everyday look. If you prefer an oversized feel, consider sizing up.</p>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-accent mb-2">Comfort</h4>
                   <p className="text-sm text-neutral-400">Crafted from 100% premium cotton for maximum breathability and soft feel.</p>
                </div>
              </div>
           </div>
        </section>

        {/* Recommendations */}
        <section className="mb-32">
           <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-12 text-center">Sizing Recommendations</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Relaxed Feel", desc: "Prefer more room? Go one size up from your normal measurement." },
                { title: "Standard Fit", desc: "Like it classic? Stick to your regular size based on the chart." },
                { title: "Between Sizes", desc: "Fall in between? We recommend choosing the larger size for comfort." }
              ].map((card, idx) => (
                <div key={idx} className="p-8 border border-neutral-100 rounded-3xl hover:bg-neutral-50 transition-colors">
                   <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-black" />
                     {card.title}
                   </h3>
                   <p className="text-sm text-neutral-500 leading-relaxed">{card.desc}</p>
                </div>
              ))}
           </div>
        </section>

        {/* Important Notes */}
        <section className="mb-32 border-t border-neutral-100 pt-20">
           <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-1/3">
                 <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-3">
                   <Info className="w-5 h-5 text-neutral-400" />
                   Important Notes
                 </h2>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Variations</h4>
                    <p className="text-sm text-neutral-500 leading-relaxed italic">
                      "Manual measurements may have a variation of ±0.5 inches. Colors may vary slightly due to screen settings."
                    </p>
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mb-3">Fabric</h4>
                    <p className="text-sm text-neutral-500 leading-relaxed">
                      "Minor shrinkage (1-2%) may occur after first wash. Wash cold for best results."
                    </p>
                 </div>
              </div>
           </div>
        </section>

        {/* Support Section */}
        <section className="text-center bg-neutral-50 py-20 rounded-[40px] border border-neutral-100 px-6">
           <h2 className="text-2xl font-display font-bold uppercase tracking-tight mb-4">Need Help Choosing?</h2>
           <p className="text-neutral-500 mb-10 text-sm">Our team is here to help you find your ideal size.</p>
           <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="mailto:gorermart.india@gmail.com" className="btn btn-primary rounded-full flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Support
              </a>
              <a href="#" className="btn btn-outline rounded-full flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                WhatsApp Us
              </a>
           </div>
        </section>

      </div>

      {/* Back to Shop */}
      <div className="mt-32 pt-10 border-t border-neutral-100 container max-w-5xl mx-auto px-6 flex justify-center">
        <a href="/shop" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors">
          <ArrowRight className="w-3 h-3 rotate-180" />
          <span>Return to Collection</span>
        </a>
      </div>
    </div>
  );
};

export default SizeGuide;
