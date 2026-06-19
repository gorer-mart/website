'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../ui/use-toast';
import { publicEnv } from '../../lib/env';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronRight, 
  faLock, 
  faCreditCard, 
  faTruck, 
  faCheckCircle, 
  faChevronDown 
} from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<number>(1);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<string>('');
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    zipCode: '',
    phone: ''
  });

  // Pre-populate user email and name if logged in
  useEffect(() => {
    if (user) {
      const names = user.user_metadata?.full_name?.split(' ') || [];
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
        firstName: prev.firstName || firstName,
        lastName: prev.lastName || lastName,
      }));
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // 1. Load Razorpay script dynamically
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast({
          title: "Razorpay SDK missing",
          description: "Could not load payment gateway. Please check your network connection.",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      // 2. Map cart items for database sync and backend price verification
      const cartItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      // 3. Request order creation on the server
      const createRes = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems,
          shippingAddress: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country,
          }
        })
      });

      const createData = await createRes.json();
      if (!createRes.ok || createData.error) {
        throw new Error(createData.error || 'Failed to initiate order.');
      }

      const { razorpayOrder, orderNumber } = createData;

      // 4. Configure Razorpay checkout options
      const options = {
        key: publicEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Gorer Mart',
        description: `Order ${orderNumber}`,
        order_id: razorpayOrder.id,
        handler: async function (response: any) {
          setIsProcessing(true);
          try {
            // 5. Verify signature on the server
            const verifyRes = await fetch('/api/checkout/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderNumber: orderNumber,
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || verifyData.error) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            // Success! Complete flow
            clearCart();
            setConfirmedOrderNumber(orderNumber);
            setStep(3);
          } catch (err: any) {
            console.error('Razorpay verification error:', err);
            toast({
              title: "Payment Verification Failed",
              description: err.message || "We could not verify your payment. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: '#EAB308', // Brand yellow-500
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Razorpay payment error:', err);
      toast({
        title: "Checkout Error",
        description: err.message || "An unexpected error occurred during checkout.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Auth Loading Screen
  if (authLoading) {
    return (
      <div className="pt-40 pb-20 text-center min-h-[60vh] bg-neutral-50 flex flex-col items-center justify-center space-y-4">
        <title>Checkout — Gorer Mart</title>
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">Verifying session...</p>
      </div>
    );
  }

  // Unauthenticated Screen Prompt
  if (!isAuthenticated) {
    return (
      <div className="pt-40 pb-20 min-h-[80vh] bg-neutral-50 flex items-center justify-center">
        <title>Checkout — Gorer Mart</title>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-6 bg-white p-10 text-center shadow-premium rounded-none border border-neutral-100"
        >
          <div className="w-16 h-16 bg-neutral-50 text-neutral-900 border border-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FontAwesomeIcon icon={faLock} className="text-xl text-neutral-400" />
          </div>
          <h1 className="text-2xl font-display font-bold uppercase tracking-tight mb-3">Secure Checkout</h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-8">
            Please log in or create an account to secure your purchase and view your order history.
          </p>
          <Button asChild className="w-full py-6 font-bold tracking-widest uppercase text-xs rounded-none cursor-pointer">
            <Link href="/login?redirect=/checkout">Sign In to Checkout</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  // Empty Bag Screen (Only if not order confirmed)
  if (cart.length === 0 && step !== 3) {
    return (
      <div className="pt-40 pb-20 text-center min-h-[50vh] bg-neutral-50">
        <title>Checkout — Gorer Mart</title>
        <h2 className="text-2xl font-display font-bold uppercase mb-6">Your bag is empty</h2>
        <Button asChild className="rounded-none cursor-pointer">
          <Link href="/shop">Go to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-neutral-50 text-black">
      <title>Checkout — Gorer Mart</title>
      <meta name="description" content="Secure checkout for Gorer Mart streetwear" />

      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        {step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Checkout Form */}
            <div className="lg:col-span-7">
              {/* Collapsible Order Summary for Mobile */}
              <div className="lg:hidden w-full bg-white border border-neutral-200 mb-6 p-4 rounded-xl shadow-sm text-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOrderSummaryOpen(!isOrderSummaryOpen)}
                  className="w-full flex items-center justify-between font-bold text-xs uppercase tracking-widest focus:outline-none"
                >
                  <div className="flex items-center space-x-2 text-neutral-900">
                    <FontAwesomeIcon icon={faCreditCard} className="text-neutral-500 text-xs" />
                    <span>{isOrderSummaryOpen ? 'Hide Order Summary' : 'Show Order Summary'}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={`text-[8px] transition-transform duration-300 ${isOrderSummaryOpen ? 'rotate-180' : ''}`} />
                  </div>
                  <span className="font-display font-black text-black">₹{cartTotal.toLocaleString('en-IN')}</span>
                </button>

                <AnimatePresence>
                  {isOrderSummaryOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-neutral-100"
                    >
                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1 no-scrollbar">
                        {cart.map((item) => (
                          <div key={`${item.id}-${item.selectedSize}`} className="flex space-x-4">
                            <div className="w-12 h-16 bg-neutral-100 flex-shrink-0">
                              <img src={item.images[0]?.src || item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-normal truncate">{item.name}</p>
                              <p className="text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5">
                                Size: {item.selectedSize} • Qty: {item.quantity}
                              </p>
                              <p className="text-xs font-bold mt-1">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-4 mt-4 border-t border-neutral-100 text-[10px] text-neutral-500 uppercase tracking-widest">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Shipping</span>
                          <span className="text-green-600 font-bold">Free</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              <div className="flex items-center space-x-4 mb-12">
                <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-black' : 'text-neutral-400'}`}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step >= 1 ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>1</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Shipping</span>
                </div>
                <div className="h-[1px] w-12 bg-neutral-200" />
                <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-black' : 'text-neutral-400'}`}>
                  <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${step >= 2 ? 'bg-black text-white border-black' : 'border-neutral-300'}`}>2</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Payment</span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.form 
                    key="shipping"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleNextStep1}
                    className="space-y-8 animate-fade-in"
                  >
                    <div>
                      <h2 className="text-xl font-display font-bold uppercase mb-6">Contact Information</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Email Address (Account)</label>
                          <Input 
                            required
                            disabled
                            name="email"
                            type="email" 
                            placeholder="Email Address" 
                            value={formData.email}
                            onChange={handleInputChange}
                            className="bg-neutral-100 text-neutral-500 cursor-not-allowed border-neutral-200 rounded-none focus-visible:ring-0 focus-visible:border-neutral-200"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Mobile Phone</label>
                          <Input 
                            required
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="10-Digit Phone Number"
                            pattern="[6-9][0-9]{9}"
                            maxLength={10}
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="rounded-none border-neutral-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-xl font-display font-bold uppercase mb-6">Shipping Address</h2>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input 
                          required
                          name="firstName"
                          placeholder="First Name" 
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="rounded-none border-neutral-200"
                        />
                        <Input 
                          required
                          name="lastName"
                          placeholder="Last Name" 
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className="rounded-none border-neutral-200"
                        />
                      </div>
                      <Input 
                        required
                        name="address"
                        placeholder="Street Address, Apartment, Suite" 
                        className="mb-4 rounded-none border-neutral-200" 
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input 
                          required
                          name="city"
                          placeholder="City" 
                          value={formData.city}
                          onChange={handleInputChange}
                          className="rounded-none border-neutral-200"
                        />
                        <Input 
                          required
                          name="state"
                          placeholder="State" 
                          value={formData.state}
                          onChange={handleInputChange}
                          className="rounded-none border-neutral-200"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <Input 
                          required
                          name="zipCode"
                          placeholder="PIN / Postal Code" 
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          className="rounded-none border-neutral-200"
                        />
                        <select 
                          className="w-full h-12 border border-neutral-200 bg-neutral-50 px-4 text-sm focus:outline-none focus:border-black rounded-none" 
                          name="country" 
                          value={formData.country} 
                          onChange={handleInputChange}
                        >
                          <option value="India">India</option>
                          <option value="USA">USA</option>
                          <option value="UK">UK</option>
                        </select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full flex items-center justify-center space-x-3 py-5 rounded-none cursor-pointer">
                      <span>Continue to Payment</span>
                      <FontAwesomeIcon icon={faChevronRight} size="xs" />
                    </Button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8 animate-fade-in"
                  >
                    <div className="bg-white p-8 border border-neutral-100 shadow-premium rounded-none">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-display font-bold uppercase text-neutral-900">Payment Gateway</h2>
                        <FontAwesomeIcon icon={faLock} className="text-neutral-400" />
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center space-x-4 p-4 bg-neutral-50 border border-neutral-100">
                          <div className="w-12 h-12 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center flex-shrink-0 border border-yellow-100">
                            <FontAwesomeIcon icon={faCreditCard} className="text-base" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-widest text-neutral-900">Razorpay Secure Checkout</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider mt-1">UPI, Cards, Netbanking, & Wallets</p>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-500 leading-relaxed">
                          Clicking the payment button below will launch the secure Razorpay modal overlay. 
                          Your payment is encrypted and processed directly by Razorpay (PCI-DSS Compliant). 
                          Gorer Mart never stores your card credentials.
                        </p>
                      </div>

                      <div className="mt-8 pt-8 border-t border-neutral-100">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            <FontAwesomeIcon icon={faTruck} className="text-neutral-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-widest mb-1 text-neutral-900">Standard Delivery</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Free Shipping • 3-5 Business Days</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 py-5 rounded-none cursor-pointer"
                        disabled={isProcessing}
                      >
                        Back
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handlePayment}
                        className="flex-[2] py-5 rounded-none font-bold tracking-widest uppercase text-xs cursor-pointer bg-black text-white hover:bg-neutral-800"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Processing...</span>
                          </div>
                        ) : (
                          `Pay ₹${cartTotal.toLocaleString('en-IN')}`
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 border border-neutral-100 shadow-premium sticky top-32 rounded-none">
                <h2 className="text-xl font-display font-bold uppercase mb-8">Order Summary</h2>
                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex space-x-4">
                      <div className="w-16 h-20 bg-neutral-100 flex-shrink-0">
                        <img src={item.images[0]?.src || item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-normal tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">
                          Size: {item.selectedSize} • Qty: {item.quantity}
                        </p>
                        <p className="text-xs font-bold mt-2">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-8 border-t border-neutral-100">
                  <div className="flex justify-between text-sm text-neutral-500 uppercase tracking-widest">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-sm text-neutral-500 uppercase tracking-widest">
                    <span>Shipping</span>
                    <span className="text-green-600 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-display font-bold uppercase pt-4 border-t border-neutral-50">
                    <span>Total</span>
                    <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Order Confirmation screen
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white p-12 text-center shadow-premium rounded-none border border-neutral-100"
          >
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-100">
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl" />
            </div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4">Order Confirmed</h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              Thank you for your purchase, {formData.firstName}! <br />
              We've sent a confirmation email to <span className="text-black font-bold">{formData.email}</span>. <br />
              Your order number is <span className="text-black font-bold">#{confirmedOrderNumber}</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="py-4 rounded-none cursor-pointer">
                <Link href="/account">Track Order</Link>
              </Button>
              <Button asChild className="py-4 px-12 rounded-none cursor-pointer bg-black text-white hover:bg-neutral-800">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
