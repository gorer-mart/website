import React, { useState } from 'react'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import SEO from '../components/SEO'

const Shop = () => {
    const [selectedProduct, setSelectedProduct] = useState(null)

    return (
        <div className="min-h-screen container-max mx-auto px-6 py-12">
            <SEO
                title="Shop"
                description="Browse our collection of Kolkata-inspired t-shirts. Modern designs, nostalgic vibes."
                url="/shop"
                keywords="t-shirt, kolkata, tees, streetwear"
            />
            <h1 className="text-3xl font-semibold">Shop</h1>
            <p className="text-sm text-white/70 mt-2">Browse our curated selection of tees.</p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(p => (
                    <ProductCard
                        key={p.id}
                        product={p}
                        onClick={() => setSelectedProduct(p)}
                    />
                ))}
            </div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedProduct(null)}
                >
                    <div
                        className="bg-gradient-to-br from-white/5 to-white/1 border border-white/10 rounded-2xl max-w-md w-full p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="w-full h-80 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center mb-4">
                            <img
                                src={selectedProduct.image}
                                alt={selectedProduct.title}
                                className="object-contain w-full h-full p-6"
                            />
                        </div>
                        <h2 className="text-2xl font-semibold">{selectedProduct.title}</h2>
                        <p className="text-white/70 mt-2">{selectedProduct.description}</p>
                        <p className="text-lg font-bold mt-4">₹{selectedProduct.price}</p>
                        <button
                            onClick={() => setSelectedProduct(null)}
                            className="mt-6 w-full px-6 py-3 bg-yellow-300 text-black font-semibold rounded-md"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    )
}

export default Shop