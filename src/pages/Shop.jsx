import React from 'react'
import { products } from '../data/products'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'

const Shop = () => {
    return (
        <div className="min-h-screen container-max mx-auto px-6 py-12">
            <h1 className="text-3xl font-semibold">Shop</h1>
            <p className="text-sm text-white/70 mt-2">Browse our curated selection of tees.</p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>

            <Footer />
        </div>
    )
}

export default Shop