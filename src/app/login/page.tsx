'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash, faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../ui/button';

import hero from '../../assets/login/login_page_display.webp';
import logoWhite from '../../assets/logo-white.webp';

interface SolidInputProps {
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  setShowPassword?: (show: boolean) => void;
}

const SolidInput: React.FC<SolidInputProps> = ({
  placeholder,
  type = "text",
  value,
  onChange,
  required,
  showPasswordToggle,
  showPassword,
  setShowPassword
}) => (
  <div className="relative w-full">
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3.5 text-sm text-white bg-[#27273A] border border-white/10 rounded-none focus:outline-none focus:border-yellow placeholder:text-neutral-500 transition-colors"
      placeholder={placeholder}
      required={required}
    />
    {showPasswordToggle && setShowPassword && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors z-10 cursor-pointer"
      >
        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
      </button>
    )}
  </div>
);

const LoginContent: React.FC = () => {
  const { loading, signUp, signIn, signInWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/account';
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Form fields
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [loading, isAuthenticated, redirectTo, router]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    if (isSignUp) {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      if (!fullName) {
        setError('Please enter your name.');
        setFormLoading(false);
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        setFormLoading(false);
        return;
      }

      const { error: signUpError } = await signUp(email, password, fullName);

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setSuccess('Account created! Please check your email to verify your account.');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
      }
    }
    setFormLoading(false);
  };

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1C1C28] text-white">
        <div className="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <title>{isSignUp ? 'Create Account — Gorer Mart' : 'Sign In — Gorer Mart'}</title>
      <meta name="description" content="Sign in or create your Gorer Mart account" />

      {/* Outer Page Wrapper with very thin padding */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-h-screen w-full flex items-stretch justify-center bg-[#1C1C28] p-2 md:p-4 select-none gap-2 md:gap-4"
      >
        {/* Left section */}
        <div className="w-full min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-2rem)] hidden lg:flex items-center justify-center">
          <div className="w-full h-full rounded-2xl relative overflow-hidden bg-black flex flex-col justify-between shadow-2xl border border-white/5">
            <div className="absolute inset-0 z-0">
              <img
                src={typeof hero === 'object' ? hero.src : hero}
                alt="Gorer Mart Streetwear"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Right section */}
        <div className="w-full min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-2rem)] flex items-center justify-center">
          <div className="w-full flex flex-col justify-center px-4 sm:px-12 lg:px-16 py-8 max-w-[540px] mx-auto relative">
            {/* Top Back Header */}
            <div className="flex justify-start items-center mb-8 w-full">
              <Link
                href="/"
                className="text-neutral-400 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors group cursor-pointer"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-[10px] group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to website</span>
              </Link>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="w-full"
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-display font-semibold text-white tracking-tight mb-2">
                  {isSignUp ? 'Create an account' : 'Log in'}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-neutral-400">
                  <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      resetForm();
                    }}
                    className="text-yellow hover:text-white font-semibold underline transition-colors cursor-pointer"
                  >
                    {isSignUp ? 'Log in' : 'Create account'}
                  </button>
                </div>
              </div>

              {/* Messages */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-red-500/10 text-red-400 text-sm px-4 py-3 border border-red-500/20 rounded-none font-light">
                      {error}
                    </div>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-green-500/10 text-green-400 text-sm px-4 py-3 border border-green-500/20 rounded-none font-light">
                      {success}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence>
                  {isSignUp && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      <SolidInput
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required={isSignUp}
                      />
                      <SolidInput
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required={isSignUp}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <SolidInput
                  placeholder="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <SolidInput
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  showPasswordToggle
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                />

                {isSignUp ? (
                  <label className="flex items-center space-x-3 text-xs text-neutral-400 pt-2 pb-1 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      className="w-4 h-4 rounded-none border-white/20 bg-[#27273A] text-yellow focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>I agree to the <Link href="/terms-and-conditions" className="text-yellow hover:underline">Terms & Conditions</Link></span>
                  </label>
                ) : (
                  <div className="flex justify-end pt-1 pb-2">
                    <button type="button" className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer">
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={formLoading}
                  variant="premium"
                  className="w-full py-6 mt-2 cursor-pointer rounded-none font-bold"
                >
                  {formLoading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Log in')}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="px-4 text-xs text-neutral-500 font-medium">Or</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-1 gap-4">
                <Button
                  type="button"
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center space-x-3 border border-white/20 hover:border-white bg-transparent hover:bg-white hover:text-black py-6 text-sm text-white transition-all cursor-pointer rounded-none font-medium"
                >
                  <FontAwesomeIcon icon={faGoogle} className="text-base" />
                  <span>Continue with Google</span>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

const Login: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1C1C28] text-white">
        <div className="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
};

export default Login;
