'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Action, BRAND, Field } from '../_components/ui';

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
        setError('Access denied. This account does not have administrator access.');
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">Checking your session…</p>
      </div>
    );
  }

  const inputClass =
    'h-11 w-full rounded-md border border-slate-300 bg-white pl-10 text-sm text-slate-900 ' +
    'placeholder:text-slate-400 transition-colors focus:border-slate-900 focus:outline-none ' +
    'focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-[400px]"
      >
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to store
        </Link>

        <div className="rounded-lg border border-slate-200 bg-white p-8">
          <div className="mb-7">
            <span
              className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: BRAND }}
            >
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Admin console</h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your administrator account to continue.
            </p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email address" htmlFor="admin-email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gorermart.in"
                  className={`${inputClass} pr-3`}
                  disabled={formLoading}
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="admin-password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} pr-10`}
                  disabled={formLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 transition-colors hover:text-slate-700"
                  disabled={formLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <Action
              type="submit"
              variant="primary"
              disabled={formLoading}
              className="mt-2 h-11 w-full"
            >
              {formLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {formLoading ? 'Signing in…' : 'Sign in'}
            </Action>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Gorer Mart — staff access only
        </p>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
