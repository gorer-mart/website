'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faStar, faTruckFast, faRotateLeft, faShieldHalved, faChevronDown, faShareNodes, faCopy, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons';
import { faWhatsapp, faFacebook, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { PRODUCTS } from '../../../data/products';
import { getProducts } from '../../../lib/sanity';
import { Product } from '../../../types/product';
import { useCart } from '../../../context/CartContext';
import ProductCard from '../../../components/ProductCard';
import { Button } from '../../../ui/button';
import { useAuth } from '../../../context/AuthContext';

const ProductDetail: React.FC = () => {
  const params = useParams();
  const id = params?.slug as string;
  const { addToCart } = useCart();
  const { user } = useAuth();
  
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [product, setProduct] = useState<Product | undefined>(PRODUCTS.find(p => p.id === parseInt(id)));
  
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImage, setActiveImage] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState<boolean>(true);
  const [reviewsAverage, setReviewsAverage] = useState<number>(0);
  const [reviewsCount, setReviewsCount] = useState<number>(0);

  // Review form state
  const [formRating, setFormRating] = useState<number>(5);
  const [formHoverRating, setFormHoverRating] = useState<number>(0);
  const [formComment, setFormComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [submitSuccess, setSubmitSuccess] = useState<string>('');

  // Share state
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = product ? `Check out ${product.name} at Gorer Mart!` : 'Check out Gorer Mart streetwear!';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPos = container.scrollLeft;
    const width = container.clientWidth;
    if (width > 0) {
      const index = Math.round(scrollPos / width);
      if (index !== activeImage && index >= 0 && index < displayImages.length) {
        setActiveImage(index);
      }
    }
  };

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const fetched = await getProducts();
        setProductsList(fetched);
        
        const found = fetched.find(p => String(p.id) === id || p._id === id);
        if (found) {
          setProduct(found);
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || 'M');
      setSelectedColor(product.colors?.[0] || 'Original');
      setActiveImage(0);
      window.scrollTo(0, 0);
    }
  }, [product]);

  useEffect(() => {
    if (product) {
      const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
          const productId = product._id || String(product.id);
          const res = await fetch(`/api/reviews?productId=${productId}`);
          if (res.ok) {
            const data = await res.json();
            setReviews(data);
            const count = data.length;
            const avg = count > 0 ? Math.round(data.reduce((acc: number, r: any) => acc + r.rating, 0) / count) : 0;
            setReviewsAverage(avg);
            setReviewsCount(count);
          }
        } catch (e) {
          console.error("Error fetching reviews:", e);
        } finally {
          setReviewsLoading(false);
        }
      };
      fetchReviews();

      // Reset form states when switching products
      setFormRating(5);
      setFormComment('');
      setSubmitError('');
      setSubmitSuccess('');
    }
  }, [product]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    if (formRating < 1 || formRating > 5) {
      setSubmitError("Please select a rating.");
      return;
    }

    setSubmittingReview(true);
    setSubmitError('');
    setSubmitSuccess('');

    try {
      const productId = product._id || String(product.id);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          rating: formRating,
          comment: formComment,
          name: product.name,
          price: product.price,
          slug: product.slug,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess('Thank you! Your review has been submitted.');
        setFormComment('');
        setFormRating(5);
        
        const updatedReviews = [data.review, ...reviews];
        setReviews(updatedReviews);
        const count = updatedReviews.length;
        const avg = count > 0 ? Math.round(updatedReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / count) : 0;
        setReviewsAverage(avg);
        setReviewsCount(count);
      } else {
        setSubmitError(data.error || 'Failed to submit review. Please try again.');
      }
    } catch (err) {
      console.error("Submit review error:", err);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={faStar}
          className={i <= rating ? 'text-accent' : 'text-neutral-200'}
        />
      );
    }
    return stars;
  };

  if (!product) {
    if (loading) {
      return <div className="pt-32 text-center min-h-[50vh] font-display uppercase tracking-widest text-xs">Loading product...</div>;
    }
    return <div className="pt-32 text-center min-h-[50vh]">Product not found</div>;
  }

  const relatedProducts = productsList.filter(p => p.category === product.category && String(p.id) !== id && p._id !== id).slice(0, 4);

  const STANDARD_DETAILS = [
    "100% Premium Organic Cotton",
    "240+ GSM Heavyweight Fabric",
    "Standard Oversized Drop-Shoulder Fit",
    "High-Density Cultural Graphic Print",
    "Pre-shrunk & Bio-washed"
  ];

  const displayDetails = product.details && product.details.length > 0 ? product.details : STANDARD_DETAILS;

  // Premium color swatches color mapping
  const COLOR_MAP: Record<string, string> = {
    'black': '#171717',
    'white': '#FFFFFF',
    'offwhite': '#FAF9F6',
    'cream': '#FFFDD0',
    'maroon': '#800000',
    'red': '#DC2626',
    'blue': '#2563EB',
    'navy': '#1E3A8A',
    'green': '#16A34A',
    'olive': '#556B2F',
    'gray': '#737373',
    'grey': '#737373',
    'yellow': '#EAB308',
    'beige': '#F5F5DC',
    'original': '#D4D4D8',
  };

  const getColorStyle = (color: string) => {
    const norm = color.toLowerCase().trim().replace(/[-\s]/g, '');
    if (norm.startsWith('#')) return norm;
    return COLOR_MAP[norm] || color;
  };

  const hasVariants = product.colorVariants && product.colorVariants.length > 0;
  const activeVariant = hasVariants ? product.colorVariants.find((v: any) => v.color === selectedColor) : null;
  const displayImages = (activeVariant && activeVariant.images.length > 0) ? activeVariant.images : product.images;

  return (
    <div className="pt-20 bg-white">
      <title>{`${product.name} | Gorer Mart Premium Streetwear`}</title>
      <meta name="description" content={`Shop ${product.name} at Gorer Mart. Premium Kolkata-inspired streetwear and apparel.`} />

      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Responsive Image Gallery */}
          <div className="space-y-4">
            {/* Desktop-only Main Image & Thumbnails */}
            <div className="hidden lg:block space-y-4">
              <div className="aspect-[3/4] overflow-hidden bg-neutral-100">
                <motion.img 
                  key={activeImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  src={displayImages[activeImage]?.src || displayImages[activeImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              {displayImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {displayImages.map((img: any, idx: number) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`aspect-square overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-black' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img?.src || img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile-only Swipeable Touch Gallery Carousel */}
            <div className="lg:hidden relative">
              <div 
                id="mobile-gallery-scroll"
                onScroll={handleMobileScroll}
                className="flex overflow-x-auto snap-x snap-mandatory gap-0 aspect-[3/4] no-scrollbar"
                style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {displayImages.map((img: any, idx: number) => (
                  <div key={idx} className="w-full h-full flex-shrink-0 snap-start snap-always relative">
                    <img src={img?.src || img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              {/* Dots Indicators */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                  {displayImages.map((_: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const container = document.getElementById('mobile-gallery-scroll');
                        if (container) {
                          container.scrollTo({ left: container.clientWidth * idx, behavior: 'smooth' });
                          setActiveImage(idx);
                        }
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${activeImage === idx ? 'bg-black w-4' : 'bg-black/30'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <h1 className="text-2xl md:text-3xl font-display font-normal mb-2 leading-tight">
              {product.name}
            </h1>
            
            <div className="flex items-center text-accent text-xs mb-3">
              {reviewsCount > 0 ? renderStars(reviewsAverage) : renderStars(0)}
              <span className="ml-2 text-neutral-400 font-bold uppercase tracking-widest">
                ({reviewsCount} {reviewsCount === 1 ? 'Review' : 'Reviews'})
              </span>
            </div>

            <div className="text-2xl font-display font-bold mb-8">
              ₹{product.price.toLocaleString('en-IN')}
            </div>

            {/* Selectors */}
            <div className="space-y-8 mb-10 pt-10 border-t border-neutral-100">
              <div>
                <div className="flex justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest">Select Size</h3>
                  <Link href="/size-guide" className="text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">Size Guide</Link>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <button 
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-w-[60px] h-12 flex items-center justify-center border text-xs font-bold uppercase tracking-widest transition-all ${selectedSize === size ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500 hover:border-black hover:text-black'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest mb-4">
                    Color: <span className="text-neutral-500 font-normal normal-case">{selectedColor}</span>
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map(color => {
                      const colorStyle = getColorStyle(color);
                      const isLight = ['white', '#ffffff', '#faf9f6', '#fffdd0', '#faf9f6', 'offwhite', 'cream', 'beige'].includes(color.toLowerCase().trim().replace(/[-\s]/g, '')) || colorStyle.toLowerCase() === '#ffffff';
                      return (
                        <button
                          key={color}
                          onClick={() => { setSelectedColor(color); setActiveImage(0); }}
                          className={`w-9 h-9 rounded-full relative transition-all ${
                            isLight ? 'border border-neutral-300' : ''
                          } ${
                            selectedColor === color ? 'ring-2 ring-black ring-offset-2 scale-110' : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: colorStyle }}
                          title={color}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest mb-4">Quantity</h3>
                <div className="flex items-center w-32 border border-neutral-200">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="flex-1 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faMinus} size="xs" />
                  </button>
                  <span className="flex-1 text-center font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="flex-1 py-3 hover:bg-neutral-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} size="xs" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Button 
                onClick={() => addToCart(product, quantity, selectedSize, selectedColor)}
                className="flex-[2] py-5"
              >
                Add to Bag
              </Button>
              <Button variant="outline" className="flex-1 py-5">
                Wishlist
              </Button>
            </div>

            {/* Share Section */}
            <div className="relative mb-12">
              <button 
                onClick={() => setShowShareModal(true)} 
                className="group flex items-center space-x-2.5 px-5 py-3 border border-neutral-100 hover:border-neutral-900 bg-neutral-50/50 hover:bg-neutral-50 rounded-full transition-all duration-300 text-[10px] font-bold uppercase tracking-widest text-neutral-600 hover:text-black cursor-pointer focus:outline-none"
              >
                <FontAwesomeIcon icon={faShareNodes} className="text-xs group-hover:scale-110 transition-transform duration-300" />
                <span>Share with others</span>
              </button>

              <AnimatePresence>
                {showShareModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowShareModal(false)}
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      className="relative w-full max-w-md bg-white border border-neutral-100 shadow-[0_24px_64px_rgba(0,0,0,0.15)] rounded-2xl p-6 md:p-8 z-10 flex flex-col text-neutral-900"
                    >
                      {/* Header */}
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-950">
                          Share this product
                        </h3>
                        <button
                          onClick={() => setShowShareModal(false)}
                          className="w-8 h-8 rounded-full bg-neutral-50 hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-black transition-colors cursor-pointer border-0 outline-none"
                        >
                          <FontAwesomeIcon icon={faXmark} className="text-xs" />
                        </button>
                      </div>

                      {/* Line 1: Copy Link Box */}
                      <div className="flex items-center bg-neutral-50 border border-neutral-200/80 px-4 py-3.5 rounded-xl focus-within:border-neutral-900 transition-all mb-6">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                          className="text-[11px] font-mono text-neutral-500 overflow-x-auto whitespace-nowrap scrollbar-none flex-grow mr-3 select-all bg-transparent border-0 outline-none cursor-text w-full"
                        />
                        <button
                          onClick={copyToClipboard}
                          className="focus:outline-none transition-colors text-neutral-500 hover:text-black cursor-pointer border-0 bg-transparent flex items-center justify-center flex-shrink-0"
                          title="Copy Link"
                        >
                          {copied ? (
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                              Copied
                            </span>
                          ) : (
                            <FontAwesomeIcon icon={faCopy} className="text-sm" />
                          )}
                        </button>
                      </div>

                      {/* Line 2: Social Media Share Row */}
                      <div className="flex items-center space-x-4">
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-all duration-300"
                          onClick={() => setShowShareModal(false)}
                        >
                          <FontAwesomeIcon icon={faWhatsapp} className="text-lg" />
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition-all duration-300"
                          onClick={() => setShowShareModal(false)}
                        >
                          <FontAwesomeIcon icon={faFacebook} className="text-lg" />
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-neutral-100 hover:bg-black text-neutral-800 hover:text-white flex items-center justify-center transition-all duration-300"
                          onClick={() => setShowShareModal(false)}
                        >
                          <FontAwesomeIcon icon={faTwitter} className="text-base" />
                        </a>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Details & Specs */}
      <section className="section-padding bg-neutral-50">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-8">Premium Quality</h2>
              <ul className="space-y-4">
                {displayDetails.map((detail, idx) => (
                  <li key={idx} className="flex items-start text-sm text-neutral-600">
                    <span className="w-1.5 h-1.5 bg-black rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
            {product.washCare && (
              <div>
                <h2 className="text-2xl font-display font-bold uppercase tracking-widest mb-8">Care Instructions</h2>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {product.washCare}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="section-padding bg-white border-t border-neutral-100">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-12 text-center">
            Customer Reviews
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            {/* Left Column: Overall Summary & Form */}
            <div className="lg:col-span-1 space-y-10">
              <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">
                  Rating Overview
                </h3>
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-display font-black">
                    {reviewsCount > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
                  </span>
                  <span className="text-neutral-400 text-sm">/ 5.0</span>
                </div>
                <div className="flex items-center text-accent text-sm mt-3 mb-2">
                  {reviewsCount > 0 ? renderStars(reviewsAverage) : renderStars(0)}
                </div>
                <p className="text-xs text-neutral-400 uppercase tracking-widest font-semibold">
                  Based on {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>

              {/* Review Submission Form */}
              <div className="bg-neutral-50 p-8 rounded-2xl border border-neutral-100/50">
                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-6">
                  Share Your Feedback
                </h3>

                {user ? (
                  <form onSubmit={handleSubmitReview} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                        Your Rating
                      </label>
                      <div className="flex space-x-2 text-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setFormRating(star)}
                            onMouseEnter={() => setFormHoverRating(star)}
                            onMouseLeave={() => setFormHoverRating(0)}
                            className="focus:outline-none transition-transform hover:scale-115 text-accent cursor-pointer"
                          >
                            <FontAwesomeIcon
                              icon={faStar}
                              className={
                                star <= (formHoverRating || formRating)
                                  ? 'text-accent'
                                  : 'text-neutral-200'
                              }
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 mb-2">
                        Review Comments
                      </label>
                      <textarea
                        value={formComment}
                        onChange={(e) => setFormComment(e.target.value)}
                        placeholder="Write your review here. What did you like or dislike about the product?"
                        rows={4}
                        required
                        className="w-full px-4 py-3 text-xs bg-white border border-neutral-200 rounded-none focus:outline-none focus:border-black placeholder:text-neutral-400 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {submitError && (
                      <div className="text-xs text-red-600 bg-red-50 p-3 border border-red-100 rounded-none font-medium">
                        {submitError}
                      </div>
                    )}

                    {submitSuccess && (
                      <div className="text-xs text-emerald-600 bg-emerald-50 p-3 border border-emerald-100 rounded-none font-medium">
                        {submitSuccess}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-4 text-xs font-bold tracking-widest uppercase cursor-pointer"
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </form>
                ) : (
                  <div className="text-center py-4 space-y-4">
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Only registered customers can leave a review. Please sign in to share your experience.
                    </p>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full py-4 text-[10px] font-bold tracking-widest uppercase cursor-pointer"
                    >
                      <Link href={`/login?redirect=/product/${product._id || product.id}`}>
                        Sign In to Review
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Reviews List */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400 mb-8 border-b border-neutral-100 pb-4">
                Reviews ({reviewsCount})
              </h3>

              {reviewsLoading ? (
                <div className="py-12 text-center text-xs text-neutral-400 uppercase tracking-widest">
                  Loading reviews...
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
                  <p className="text-sm text-neutral-500 leading-relaxed mb-1 font-medium">
                    No reviews yet
                  </p>
                  <p className="text-xs text-neutral-400">
                    Be the first to share your thoughts on this product!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {reviews.map((rev) => {
                    const dateStr = new Date(rev.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                    const initials = rev.users?.full_name
                      ? rev.users.full_name
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .toUpperCase()
                      : 'U';

                    return (
                      <div key={rev.id} className="py-6 first:pt-0 last:pb-0 flex items-start space-x-4">
                        {/* Avatar */}
                        {rev.users?.avatar_url ? (
                          <img
                            src={rev.users.avatar_url}
                            alt={rev.users.full_name || "User"}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0 bg-neutral-100 border border-neutral-200/50 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-neutral-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 shadow-sm">
                            {initials.slice(0, 2)}
                          </div>
                        )}

                        {/* Review Content */}
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-2">
                            <span className="font-semibold text-sm text-neutral-900 truncate">
                              {rev.users?.full_name || 'Anonymous User'}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                              {dateStr}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-accent text-xs mb-3">
                            {renderStars(rev.rating)}
                          </div>
                          
                          <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                            {rev.comment}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      {relatedProducts.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container mx-auto">
            <h2 className="text-3xl uppercase tracking-tighter mb-12">You May Also Like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      {/* Mobile Sticky Bottom Buy Bar */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 inset-x-0 bg-white border-t border-neutral-200 p-4 shadow-[0_-8px_30px_rgb(0,0,0,0.06)] z-50 flex items-center justify-between lg:hidden text-neutral-900"
          >
            <div className="flex items-center space-x-3 max-w-[50%]">
              <img 
                src={displayImages[0]?.src || displayImages[0]} 
                alt={product.name} 
                className="w-10 h-14 object-cover bg-neutral-100 flex-shrink-0" 
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-normal tracking-tight truncate">{product.name}</span>
                <span className="text-xs font-display font-black text-black mt-0.5">₹{product.price.toLocaleString('en-IN')}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select 
                  value={selectedSize} 
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 text-[10px] font-bold uppercase tracking-widest pl-2 pr-6 py-2.5 rounded-none h-10 focus:outline-none focus:border-black cursor-pointer appearance-none"
                >
                  {product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400" />
              </div>

              <Button 
                onClick={() => addToCart(product, quantity, selectedSize, selectedColor)}
                className="h-10 px-5 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-all rounded-none cursor-pointer"
              >
                Add to Bag
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
