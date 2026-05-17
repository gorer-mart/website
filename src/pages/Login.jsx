import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const FloatingInput = ({ label, type = "text", value, onChange, required, showPasswordToggle, showPassword, setShowPassword }) => (
  <div className="relative z-0 w-full mb-5 group">
    <input
      type={type}
      value={value}
      onChange={onChange}
      className="block py-3 px-0 w-full text-sm text-black bg-transparent border-0 border-b border-neutral-300 appearance-none focus:outline-none focus:ring-0 focus:border-black peer transition-colors"
      placeholder=" "
      required={required}
    />
    <label className="peer-focus:font-medium absolute text-sm text-neutral-500 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-black peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
      {label}
    </label>
    {showPasswordToggle && (
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-0 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black transition-colors z-10"
      >
        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
      </button>
    )}
  </div>
);

const Login = () => {
  const { loading, signUp, signIn, signInWithGoogle, isAuthenticated } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

    if (isSignUp) {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
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
        resetForm();
      }
    } else {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message);
      }
    }
    setFormLoading(false);
  };

  // If already authenticated, redirect to account dashboard
  if (!loading && isAuthenticated) {
    return <Navigate to="/account" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isSignUp ? 'Create Account' : 'Sign In'} — Gorer Mart</title>
        <meta name="description" content="Sign in or create your Gorer Mart account" />
      </Helmet>

      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] pt-24 pb-12 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[500px] bg-white px-8 py-8 sm:px-12 sm:py-10 shadow-[0_4px_40px_-10px_rgba(0,0,0,0.05)] border border-neutral-100"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-medium text-black tracking-wide uppercase mb-2">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-neutral-500 text-sm font-light">
              {isSignUp
                ? 'Join Gorer Mart to manage your orders.'
                : 'Access your Gorer Mart account.'}
            </p>
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
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 border border-red-100 font-light">
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
                <div className="bg-green-50 text-green-700 text-sm px-4 py-3 border border-green-100 font-light">
                  {success}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <AnimatePresence>
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <FloatingInput
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <FloatingInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FloatingInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              showPasswordToggle
              showPassword={showPassword}
              setShowPassword={setShowPassword}
            />

            {!isSignUp && (
              <div className="flex justify-end pb-4">
                <button type="button" className="text-xs text-neutral-400 hover:text-black transition-colors">
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-colors disabled:opacity-50 mt-2"
            >
              {formLoading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-neutral-100" />
            <span className="px-4 text-xs text-neutral-400 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-neutral-100" />
          </div>

          {/* Google Sign-In */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center space-x-3 border border-neutral-200 py-3 text-sm text-black hover:border-black transition-colors bg-transparent"
          >
            <FontAwesomeIcon icon={faGoogle} />
            <span className="font-medium">Continue with Google</span>
          </button>

          {/* Toggle */}
          <div className="text-center mt-6 text-sm text-neutral-500">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    resetForm();
                  }}
                  className="text-black font-medium hover:underline transition-all"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    resetForm();
                  }}
                  className="text-black font-medium hover:underline transition-all"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
