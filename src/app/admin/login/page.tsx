'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';

const AdminLogin: React.FC = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createBrowserSupabaseClient();
  
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // If already logged in as admin, redirect directly
  useEffect(() => {
    const checkExistingAdmin = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile && profile.role === 'admin') {
          router.push('/admin');
        }
      }
    };
    if (!authLoading) {
      checkExistingAdmin();
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setFormLoading(false);
        return;
      }

      if (!data.user) {
        setError('Authentication returned empty session.');
        setFormLoading(false);
        return;
      }

      // 2. Fetch corresponding role from public profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        // Access Denied! Clear auth session state immediately
        await supabase.auth.signOut();
        setError('Access Denied: Administrative privileges required.');
        setFormLoading(false);
        return;
      }

      // 3. Admin authorized - redirect to console
      router.push('/admin');
    } catch (err: any) {
      console.error('Admin login exception:', err);
      setError(err.message || 'An unexpected authentication error occurred.');
      setFormLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-xs uppercase font-mono tracking-widest text-slate-500">Verifying security session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative top background gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none" />

      {/* Subtle radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[440px] bg-white border border-slate-200/80 p-8 sm:p-10 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.03)] relative z-10"
      >
        {/* Top bar back option */}
        <div className="flex justify-start mb-6">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-slate-800 text-xs font-semibold uppercase tracking-wider group transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Storefront</span>
          </Link>
        </div>

        {/* Console Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-[#D4AF37] mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-display font-black uppercase tracking-wider text-slate-900">
            Gorer Mart <span className="text-[#D4AF37]">Console</span>
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">
            System Administration Portal
          </p>
        </div>

        {/* Error Alert Box */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-rose-50 text-rose-600 text-xs px-4 py-3.5 border border-rose-100 rounded-xl flex items-start space-x-2.5">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[9px] font-mono tracking-widest uppercase text-slate-500 block ml-1">
              Admin E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gorermart.in"
                className="w-full pl-10 pr-4 py-3.5 bg-slate-50/50 border-slate-200 focus-visible:ring-0 focus-visible:border-[#D4AF37] focus-visible:bg-white text-xs rounded-xl text-slate-900 transition-all placeholder:text-slate-450 border border-slate-200"
                disabled={formLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono tracking-widest uppercase text-slate-500 block ml-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
              <Input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3.5 bg-slate-50/50 border-slate-200 focus-visible:ring-0 focus-visible:border-[#D4AF37] focus-visible:bg-white text-xs rounded-xl text-slate-900 transition-all placeholder:text-slate-450 border border-slate-200"
                disabled={formLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                disabled={formLoading}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={formLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 mt-2 rounded-xl transition-all shadow-[0_4px_15px_rgba(0,0,0,0.08)] flex items-center justify-center space-x-2 cursor-pointer border-0"
          >
            {formLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Authorizing...</span>
              </>
            ) : (
              <span>Access Console</span>
            )}
          </Button>
        </form>

        <div className="text-center mt-8 pt-6 border-t border-slate-100 text-[10px] font-mono text-slate-400 tracking-wider">
          SECURE ENCRYPTED GATEWAY
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
