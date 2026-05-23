'use client';

import { NextStudio } from 'next-sanity/studio';
import { motion } from 'motion/react';
import Link from 'next/link';
import config from '../../../../sanity.config';
import { isSanityConfigured } from '../../../lib/sanity';

export function Studio() {
  // If Sanity is not configured, show a beautiful, premium setup instructions page
  if (!isSanityConfigured()) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent/20 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-yellow/20 rounded-full blur-[150px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl w-full bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 md:p-12 rounded-3xl shadow-2xl relative z-10"
        >
          <div className="text-accent uppercase tracking-[0.3em] text-xs font-bold mb-4">
            Developer Setup Portal
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tighter mb-6 leading-tight">
            Connect <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow">Sanity CMS</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mb-8">
            You are viewing the embedded Sanity Studio route. To unlock the live Content Management System (CMS) and start managing products, please configure your Sanity project credentials.
          </p>

          {/* Steps */}
          <div className="space-y-6 mb-10">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center font-bold text-xs text-accent flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Create a Sanity Project</h3>
                <p className="text-xs text-neutral-400">
                  Run <code className="bg-neutral-900 px-2 py-1 rounded text-accent font-mono text-[10px]">npm create sanity@latest</code> in your terminal or log in to <a href="https://sanity.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">sanity.io</a> and create a new project.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-yellow/15 flex items-center justify-center font-bold text-xs text-yellow flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Configure Environment Keys</h3>
                <p className="text-xs text-neutral-400">
                  Add the following variables to your local <code className="bg-neutral-900 px-2 py-1 rounded text-white font-mono text-[10px]">.env</code> file:
                </p>
                <pre className="bg-neutral-950/80 p-4 border border-white/5 rounded-lg text-[10px] font-mono text-yellow mt-2 overflow-x-auto">
{`NEXT_PUBLIC_SANITY_PROJECT_ID="your_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"`}
                </pre>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center font-bold text-xs text-accent flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-1">Add CORS Origins</h3>
                <p className="text-xs text-neutral-400">
                  In your Sanity Management Dashboard under API settings, add <code className="bg-neutral-900 px-2 py-1 rounded text-white font-mono text-[10px]">http://localhost:3000</code> to CORS origins and check "Allow credentials".
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/admin" 
              className="flex-1 py-4 bg-white text-black text-center text-xs font-bold uppercase tracking-widest hover:bg-yellow hover:scale-[1.02] transition-all rounded-none flex items-center justify-center"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/" 
              className="flex-1 py-4 border border-white/10 text-center text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-white hover:border-white transition-all rounded-none flex items-center justify-center"
            >
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
