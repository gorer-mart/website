'use client';

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

const CartDrawer = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal } = useCart();
  const router = useRouter();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col bg-white border-l border-neutral-200">
        <SheetHeader className="p-6 border-b border-neutral-100 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-xl font-display font-bold uppercase tracking-tight">Shopping Bag</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <p className="text-neutral-500 mb-6 text-sm">Your bag is currently empty.</p>
              <Button 
                variant="outline"
                onClick={() => { setIsCartOpen(false); router.push('/shop'); }}
              >
                Start Shopping
              </Button>
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
                    <p className="font-bold text-sm">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
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
            <Button 
              className="w-full"
              onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}
            >
              Checkout Now
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
