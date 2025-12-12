import React, { useContext, useState } from 'react'
import { CartContext } from '../context/CartContext'
import SEO from '../components/SEO'
import Footer from '../components/Footer'

const Checkout = () => {
    const { cart, total, clearCart } = useContext(CartContext)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        pincode: '',
    })
    const [loading, setLoading] = useState(false)
    const [orderSuccess, setOrderSuccess] = useState(false)

    if (cart.length === 0) {
        return (
            <main className="min-h-screen container-max mx-auto px-6 py-12">
                <SEO title="Checkout" description="Complete your purchase" />
                <p>Cart is empty. Go back and add items.</p>
            </main>
        )
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        const orderId = `GM-${Date.now()}`
        const orderData = {
            orderId,
            customerName: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            pincode: formData.pincode,
            items: cart.map(item => `${item.title} (Qty: ${item.quantity})`).join(', '),
            total: `₹${total.toLocaleString('en-IN')}`,
            orderDate: new Date().toLocaleString('en-IN'),
        }

        // Submit to Google Form (replace with your form URL)
        const googleFormUrl = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse'
        const formBody = new FormData()
        formBody.append('entry.1234567890', orderData.orderId) // Replace with actual entry IDs
        formBody.append('entry.0987654321', orderData.customerName)
        // Add more entries as needed

        try {
            // In production, use a backend endpoint to avoid CORS issues
            // For now, show success message
            await new Promise(resolve => setTimeout(resolve, 1000))

            // Alternative: directly submit to Google Form (may face CORS)
            // await fetch(googleFormUrl, { method: 'POST', body: formBody, mode: 'no-cors' })

            setOrderSuccess(true)
            clearCart()
            setTimeout(() => window.location.href = '/', 3000)
        } catch (error) {
            console.error('Order submission failed:', error)
            alert('Failed to process order. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (orderSuccess) {
        return (
            <main className="min-h-screen container-max mx-auto px-6 py-12 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-4xl font-semibold text-yellow-300 mb-4">Order Confirmed! 🎉</h1>
                    <p className="text-white/70 mb-4">Thank you for your order. You will receive a confirmation email shortly.</p>
                    <p className="text-2xl font-semibold">Redirecting to home...</p>
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen container-max mx-auto px-6 py-12">
            <SEO title="Checkout" description="Complete your purchase at Gorer Mart" />
            <h1 className="text-3xl font-semibold">Checkout</h1>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-semibold mb-4">Shipping Details</h2>
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60"
                    />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60"
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60"
                    />
                    <textarea
                        name="address"
                        placeholder="Full Address"
                        value={formData.address}
                        onChange={handleChange}
                        required
                        rows="3"
                        className="w-full bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="city"
                            placeholder="City"
                            value={formData.city}
                            onChange={handleChange}
                            required
                            className="bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60"
                        />
                        <input
                            type="text"
                            name="pincode"
                            placeholder="Pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            required
                            className="bg-white/5 px-4 py-3 rounded-md text-white placeholder:text-white/60"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 px-6 py-3 bg-yellow-300 text-black font-semibold rounded-md disabled:opacity-50"
                    >
                        {loading ? 'Processing...' : 'Place Order'}
                    </button>
                </form>

                {/* Order Summary */}
                <div className="glass p-6 rounded-lg h-fit">
                    <h2 className="text-xl font-semibold">Order Summary</h2>
                    <div className="mt-4 space-y-3 border-b border-white/10 pb-4">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm text-white/70">
                                <span>{item.title} x {item.quantity}</span>
                                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-white/70">Subtotal</span>
                            <span>₹{total.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Shipping</span>
                            <span>Free</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xl font-semibold">
                        <span>Total</span>
                        <span>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    )
}

export default Checkout
