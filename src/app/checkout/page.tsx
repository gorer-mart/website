'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../../context/CartContext';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faLock, faCreditCard, faTruck, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState<number>(1);
  
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    country: 'India',
    zipCode: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else if (step === 2) {
      setTimeout(() => {
        setStep(3);
        clearCart();
      }, 1500);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="pt-40 pb-20 text-center min-h-[50vh]">
        <title>Checkout — Gorer Mart</title>
        <h2 className="text-2xl font-display font-bold uppercase mb-6">Your bag is empty</h2>
        <Button asChild>
          <Link href="/shop">Go to Shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-neutral-50">
      <title>Checkout — Gorer Mart</title>
      <meta name="description" content="Secure checkout for Gorer Mart streetwear" />

      <div className="container mx-auto px-6 py-12">
        {step < 3 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            {/* Checkout Form */}
            <div className="lg:col-span-7">
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
                    onSubmit={handleNext}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-xl font-display font-bold uppercase mb-6">Contact Information</h2>
                      <Input 
                        required
                        name="email"
                        type="email" 
                        placeholder="Email Address" 
                        value={formData.email}
                        onChange={handleInputChange}
                      />
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
                        />
                        <Input 
                          required
                          name="lastName"
                          placeholder="Last Name" 
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <Input 
                        required
                        name="address"
                        placeholder="Address" 
                        className="mb-4" 
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
                        />
                        <Input 
                          required
                          name="zipCode"
                          placeholder="ZIP / Postal Code" 
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <select className="w-full h-12 border border-neutral-200 bg-neutral-50 px-4 text-sm focus:outline-none focus:border-black" name="country" value={formData.country} onChange={handleInputChange}>
                        <option>India</option>
                        <option>USA</option>
                        <option>UK</option>
                      </select>
                    </div>

                    <Button type="submit" className="w-full flex items-center justify-center space-x-3 py-5">
                      <span>Continue to Payment</span>
                      <FontAwesomeIcon icon={faChevronRight} size="xs" />
                    </Button>
                  </motion.form>
                ) : (
                  <motion.form 
                    key="payment"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    onSubmit={handleNext}
                    className="space-y-8"
                  >
                    <div className="bg-white p-8 border border-neutral-100 shadow-premium">
                      <div className="flex justify-between items-center mb-8">
                        <h2 className="text-xl font-display font-bold uppercase">Payment Details</h2>
                        <FontAwesomeIcon icon={faLock} className="text-neutral-400" />
                      </div>

                      <div className="space-y-6">
                        <div className="relative">
                          <Input 
                            required
                            name="cardNumber"
                            placeholder="Card Number" 
                            className="pl-12" 
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                          />
                          <FontAwesomeIcon icon={faCreditCard} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Input 
                            required
                            name="expiry"
                            placeholder="MM / YY" 
                            value={formData.expiry}
                            onChange={handleInputChange}
                          />
                          <Input 
                            required
                            name="cvv"
                            placeholder="CVV" 
                            value={formData.cvv}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>

                      <div className="mt-8 pt-8 border-t border-neutral-100">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            <FontAwesomeIcon icon={faTruck} className="text-neutral-400" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-widest mb-1">Standard Shipping</p>
                            <p className="text-xs text-neutral-500 uppercase tracking-wider">Free • 3-5 Business Days</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4">
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="flex-1 py-5"
                      >
                        Back
                      </Button>
                      <Button type="submit" className="flex-[2] py-5">
                        Pay ₹{cartTotal.toLocaleString('en-IN')}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-5">
              <div className="bg-white p-8 border border-neutral-100 shadow-premium sticky top-32">
                <h2 className="text-xl font-display font-bold uppercase mb-8">Order Summary</h2>
                <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={`${item.id}-${item.selectedSize}`} className="flex space-x-4">
                      <div className="w-16 h-20 bg-neutral-100 flex-shrink-0">
                        <img src={item.images[0]?.src || item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-tight">{item.name}</p>
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
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto bg-white p-12 text-center shadow-premium"
          >
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <FontAwesomeIcon icon={faCheckCircle} className="text-4xl" />
            </div>
            <h1 className="text-4xl font-display font-bold uppercase tracking-tighter mb-4">Order Confirmed</h1>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              Thank you for your purchase, {formData.firstName}! <br />
              We've sent a confirmation email to <span className="text-black font-bold">{formData.email}</span>. 
              Your order number is <span className="text-black font-bold">#GM-12934</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="py-4">
                <Link href="/account">Track Order</Link>
              </Button>
              <Button asChild className="py-4 px-12">
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
