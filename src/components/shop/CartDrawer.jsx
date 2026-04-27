import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus, faMinus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[80] shadow-2xl flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-neutral-100">
              <h2 className="text-xl font-display font-bold uppercase tracking-tight">Shopping Bag</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <p className="text-neutral-500 mb-6">Your bag is currently empty.</p>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/shop'); }}
                    className="btn btn-outline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex space-x-4 pb-6 border-b border-neutral-50 last:border-0">
                    <div className="w-24 h-32 bg-neutral-100 flex-shrink-0">
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-sm uppercase leading-tight">{item.name}</h3>
                        <button 
                          onClick={() => removeFromCart(item.id, item.selectedSize)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrashCan} size="xs" />
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 mb-3">
                        Size: {item.selectedSize}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-center border border-neutral-200">
                          <button 
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity - 1)}
                            className="px-2 py-1 hover:bg-neutral-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faMinus} size="xs" />
                          </button>
                          <span className="px-3 text-sm font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.selectedSize, item.quantity + 1)}
                            className="px-2 py-1 hover:bg-neutral-100 transition-colors"
                          >
                            <FontAwesomeIcon icon={faPlus} size="xs" />
                          </button>
                        </div>
                        <p className="font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-neutral-100 bg-neutral-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-neutral-500 uppercase tracking-widest text-sm font-bold">Subtotal</span>
                  <span className="text-xl font-display font-bold">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <p className="text-[10px] text-neutral-400 mb-6 uppercase tracking-wider">
                  Taxes and shipping calculated at checkout
                </p>
                <button 
                  onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}
                  className="w-full btn btn-primary"
                >
                  Checkout Now
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
