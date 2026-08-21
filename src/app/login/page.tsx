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

import { getLoginPageImage } from '../../lib/sanity';

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
      className="w-full px-4 py-3.5 text-sm font-medium text-[#a6101b] bg-white border-2 border-[#a6101b] rounded-none focus:outline-none focus:ring-2 focus:ring-[#a6101b]/20 placeholder:text-[#a6101b]/50 transition-colors"
      placeholder={placeholder}
      required={required}
    />
    {showPasswordToggle && setShowPassword && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a6101b]/70 hover:text-[#a6101b] transition-colors z-10 cursor-pointer"
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
  const [sanityHeroImage, setSanityHeroImage] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  useEffect(() => {
    async function fetchSanityImage() {
      try {
        const imageUrl = await getLoginPageImage();
        if (imageUrl) {
          setSanityHeroImage(imageUrl);
        }
      } catch (err) {
        console.error("Failed to load Sanity login image:", err);
      }
    }
    fetchSanityImage();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center bg-[#fff8e9] text-[#a6101b]">
        <div className="w-8 h-8 border-2 border-[#a6101b] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <title>{isSignUp ? 'Create Account — Gorer Mart' : 'Sign In — Gorer Mart'}</title>
      <meta name="description" content="Sign in or create your Gorer Mart account" />

      {/* Outer Page Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="min-h-screen w-full flex items-stretch justify-center bg-[#fff8e9] p-2 md:p-4 select-none gap-2 md:gap-4"
      >
        {/* Left section */}
        <div className="w-full min-h-[calc(100vh-1rem)] md:min-h-[calc(100vh-2rem)] hidden lg:flex items-center justify-center">
          <div className="w-full h-full rounded-2xl relative overflow-hidden bg-white flex flex-col justify-between shadow-xl border border-[#a6101b]/15">
            <div className="absolute inset-0 z-0">
              {sanityHeroImage ? (
                <img
                  src={sanityHeroImage}
                  alt="Gorer Mart Streetwear"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-[#fff8e9]/80 flex flex-col items-center justify-center p-8 text-center border border-[#a6101b]/10">
                  <span className="text-xs uppercase tracking-widest font-semibold text-[#a6101b]/60">Upload Image in Sanity CMS</span>
                </div>
              )}
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
                className="text-[#a6101b] hover:text-[#8e0c15] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors group cursor-pointer"
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
                <h1 className="text-3xl sm:text-4xl font-display font-semibold text-[#a6101b] tracking-tight mb-2">
                  {isSignUp ? 'Create an account' : 'Log in'}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-[#a6101b]/80">
                  <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
                  <button
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      resetForm();
                    }}
                    className="text-[#a6101b] hover:text-[#8e0c15] font-bold underline transition-colors cursor-pointer"
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
                    <div className="bg-red-50 text-[#a6101b] text-sm px-4 py-3 border border-[#a6101b]/30 rounded-none font-medium">
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
                    <div className="bg-emerald-50 text-emerald-800 text-sm px-4 py-3 border border-emerald-200 rounded-none font-medium">
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
                  <label className="flex items-center space-x-3 text-xs text-[#a6101b]/90 pt-2 pb-1 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      className="w-4 h-4 rounded-none border-[#a6101b] bg-white accent-[#a6101b] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                    <span>I agree to the <Link href="/terms-and-conditions" className="text-[#a6101b] font-bold hover:underline">Terms & Conditions</Link></span>
                  </label>
                ) : (
                  <div className="flex justify-end pt-1 pb-2">
                    <button type="button" className="text-xs text-[#a6101b] hover:text-[#8e0c15] hover:underline transition-colors cursor-pointer font-medium">
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 mt-2 cursor-pointer rounded-none font-bold bg-[#a6101b] hover:bg-[#8e0c15] text-white transition-all uppercase tracking-wider text-sm shadow-md disabled:opacity-50"
                >
                  {formLoading ? 'Please wait...' : (isSignUp ? 'Create account' : 'Log in')}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-[#a6101b]/20" />
                <span className="px-4 text-xs text-[#a6101b]/70 font-semibold uppercase tracking-wider">Or</span>
                <div className="flex-1 h-px bg-[#a6101b]/20" />
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="w-full flex items-center justify-center space-x-3 border-2 border-[#a6101b] text-[#a6101b] bg-white hover:bg-[#a6101b] hover:text-white py-4 text-sm transition-all cursor-pointer rounded-none font-bold shadow-sm"
                >
                  <FontAwesomeIcon icon={faGoogle} className="text-base" />
                  <span>Continue with Google</span>
                </button>
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
      <div className="min-h-screen flex items-center justify-center bg-[#fff8e9] text-[#a6101b]">
        <div className="w-8 h-8 border-2 border-[#a6101b] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
};

export default Login;
