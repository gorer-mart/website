import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faLock, faCreditCard, faTruck, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const Checkout = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  
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

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) setStep(2);
    else if (step === 2) {
      // Simulate payment processing
      setTimeout(() => {
        setStep(3);
        clearCart();
      }, 1500);
    }
  };

  if (cart.length === 0 && step !== 3) {
    return (
      <div className="pt-40 pb-20 text-center">
        <h2 className="text-2xl font-display font-bold uppercase mb-6">Your bag is empty</h2>
        <Link to="/shop" className="btn btn-primary">Go to Shop</Link>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-neutral-50">
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
                      <input 
                        required
                        name="email"
                        type="email" 
                        placeholder="Email Address" 
                        className="input-field" 
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <h2 className="text-xl font-display font-bold uppercase mb-6">Shipping Address</h2>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input 
                          required
                          name="firstName"
                          placeholder="First Name" 
                          className="input-field" 
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                        <input 
                          required
                          name="lastName"
                          placeholder="Last Name" 
                          className="input-field" 
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <input 
                        required
                        name="address"
                        placeholder="Address" 
                        className="input-field mb-4" 
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <input 
                          required
                          name="city"
                          placeholder="City" 
                          className="input-field" 
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                        <input 
                          required
                          name="zipCode"
                          placeholder="ZIP / Postal Code" 
                          className="input-field" 
                          value={formData.zipCode}
                          onChange={handleInputChange}
                        />
                      </div>
                      <select className="input-field" name="country" value={formData.country} onChange={handleInputChange}>
                        <option>India</option>
                        <option>USA</option>
                        <option>UK</option>
                      </select>
                    </div>

                    <button type="submit" className="w-full btn btn-primary flex items-center justify-center space-x-3 py-5">
                      <span>Continue to Payment</span>
                      <FontAwesomeIcon icon={faChevronRight} size="xs" />
                    </button>
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
                          <input 
                            required
                            name="cardNumber"
                            placeholder="Card Number" 
                            className="input-field pl-12" 
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                          />
                          <FontAwesomeIcon icon={faCreditCard} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <input 
                            required
                            name="expiry"
                            placeholder="MM / YY" 
                            className="input-field" 
                            value={formData.expiry}
                            onChange={handleInputChange}
                          />
                          <input 
                            required
                            name="cvv"
                            placeholder="CVV" 
                            className="input-field" 
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
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="flex-1 btn btn-outline py-5"
                      >
                        Back
                      </button>
                      <button type="submit" className="flex-[2] btn btn-primary py-5">
                        Pay ₹{cartTotal.toLocaleString('en-IN')}
                      </button>
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
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
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
              <Link to="/account" className="btn btn-outline py-4">Track Order</Link>
              <Link to="/" className="btn btn-primary py-4 px-12">Continue Shopping</Link>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
