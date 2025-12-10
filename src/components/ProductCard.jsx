import React from 'react'

const ProductCard = ({ product }) => {
    return (
        <div className="bg-white/3 rounded-2xl p-4 hover:shadow-2xl transition group">
            <div className="w-full h-64 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={product.image} alt={product.title} className="object-contain w-full h-full p-6" />
            </div>

            <div className="mt-4">
                <h3 className="font-semibold text-lg">{product.title}</h3>
                <p className="text-sm text-white/70 mt-1">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                    <div className="font-bold">₹{product.price}</div>
                    <button className="px-4 py-2 rounded-md bg-yellow-300 text-black font-semibold">Add</button>
                </div>
            </div>
        </div>
    )
}

export default ProductCard
