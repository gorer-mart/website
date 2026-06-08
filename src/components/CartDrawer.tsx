'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrashCan, faXmark, faBagShopping } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

const SPRING = {
  type: 'spring' as const,
  stiffness: 320,
  damping: 38,
  mass: 1,
};

const OVERLAY_TRANSITION = { duration: 0.35, ease: [0.32, 0.72, 0, 1] as const };

const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const router = useRouter();

  // Lock body scroll while cart is open
  useEffect(() => {
    document.body.style.overflow = isCartOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isCartOpen]);

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={OVERLAY_TRANSITION}
            className="fixed inset-0 z-[80] bg-black/40"
            onClick={() => setIsCartOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <motion.div
            key="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={SPRING}
            className="fixed inset-y-0 right-0 z-[90] w-full max-w-md bg-white shadow-[−24px_0_60px_-12px_rgba(0,0,0,0.15)] flex flex-col border-l border-neutral-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-display font-bold uppercase tracking-tight text-black">
                  Shopping Bag
                </h2>
                {cart.length > 0 && (
                  <span className="w-5 h-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="w-9 h-9 rounded-full border border-neutral-200 flex items-center justify-center text-neutral-500 hover:text-black hover:border-black transition-all duration-200 cursor-pointer"
                aria-label="Close cart"
              >
                <FontAwesomeIcon icon={faXmark} className="text-sm" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-5">
                  <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300">
                    <FontAwesomeIcon icon={faBagShopping} className="text-2xl" />
                  </div>
                  <div>
                    <p className="font-bold text-sm uppercase tracking-widest text-black mb-1">Your bag is empty</p>
                    <p className="text-neutral-500 text-xs">Add items to get started</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => { setIsCartOpen(false); router.push('/shop'); }}
                  >
                    Browse Shop
                  </Button>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {cart.map((item) => (
                    <div
                      key={`${item.id}-${item.selectedSize}`}
                      className="flex space-x-4 pb-6 border-b border-neutral-50 last:border-0"
                    >
                      <div className="w-24 h-32 bg-neutral-100 flex-shrink-0 overflow-hidden">
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex justify-between items-start mb-1 gap-2">
                          <h3 className="font-semibold text-sm uppercase leading-tight truncate">{item.name}</h3>
                          <button
                            onClick={() => removeFromCart(item.id, item.selectedSize)}
                            className="text-neutral-300 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer"
                            aria-label={`Remove ${item.name}`}
                          >
                            <FontAwesomeIcon icon={faTrashCan} size="xs" />
                          </button>
                        </div>
                        <p className="text-xs text-neutral-400 mb-3">Size: {item.selectedSize}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center border border-neutral-200">
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                              className="px-2.5 py-1.5 hover:bg-neutral-100 transition-colors cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <FontAwesomeIcon icon={faMinus} size="xs" />
                            </button>
                            <span className="px-3 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                              className="px-2.5 py-1.5 hover:bg-neutral-100 transition-colors cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <FontAwesomeIcon icon={faPlus} size="xs" />
                            </button>
                          </div>
                          <p className="font-bold text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="flex-shrink-0 p-6 border-t border-neutral-100 bg-neutral-50/80 backdrop-blur-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 uppercase tracking-widest text-xs font-bold">Subtotal</span>
                  <span className="text-xl font-display font-bold text-black">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider">
                  Taxes and shipping calculated at checkout
                </p>
                <Button
                  className="w-full"
                  onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}
                >
                  Checkout Now
                </Button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
