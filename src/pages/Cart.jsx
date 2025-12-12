import React, { useContext } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTrash, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import { CartContext } from '../context/CartContext'
import { Link } from 'react-router-dom'

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, clearCart, total } = useContext(CartContext)

    if (cart.length === 0) {
        return (
            <main className="min-h-screen container-max mx-auto px-6 py-12">
                <h1 className="text-3xl font-semibold">Shopping Cart</h1>
                <p className="text-white/70 mt-4">Your cart is empty.</p>
                <Link to="/shop" className="mt-6 inline-block px-6 py-3 bg-yellow-300 text-black font-semibold rounded-md">
                    Continue Shopping
                </Link>
            </main>
        )
    }

    return (
        <main className="min-h-screen container-max mx-auto px-6 py-12">
            <h1 className="text-3xl font-semibold">Shopping Cart</h1>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="glass p-4 rounded-lg flex gap-4">
                            <div className="w-24 h-24 bg-white/5 rounded-md overflow-hidden">
                                <img src={item.image} alt={item.title} className="w-full h-full object-contain p-2" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg">{item.title}</h3>
                                <p className="text-white/70 text-sm">₹{item.price}</p>
                                <div className="mt-3 flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-white/70">
                                        <FontAwesomeIcon icon={faMinus} />
                                    </button>
                                    <span className="px-3">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-white/70">
                                        <FontAwesomeIcon icon={faPlus} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                                <button onClick={() => removeFromCart(item.id)} className="mt-2 text-red-400 text-sm">
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="glass p-6 rounded-lg h-fit sticky top-24">
                    <h2 className="text-xl font-semibold">Order Summary</h2>
                    <div className="mt-4 space-y-2 border-b border-white/10 pb-4">
                        <div className="flex justify-between text-white/70">
                            <span>Subtotal</span>
                            <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-white/70">
                            <span>Shipping</span>
                            <span>Free</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-between text-xl font-semibold">
                        <span>Total</span>
                        <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                    <Link
                        to="/checkout"
                        className="mt-6 w-full block text-center px-6 py-3 bg-yellow-300 text-black font-semibold rounded-md"
                    >
                        Proceed to Checkout
                    </Link>
                    <button onClick={clearCart} className="mt-2 w-full text-white/70 text-sm py-2">
                        Clear Cart
                    </button>
                </div>
            </div>
        </main>
    )
}

export default Cart
