import React, { useContext, useState } from 'react'
import { CartContext } from '../context/CartContext'

const ProductCard = ({ product, onClick }) => {
    const { addToCart } = useContext(CartContext)
    const [added, setAdded] = useState(false)

    const handleAddToCart = (e) => {
        e.stopPropagation()
        addToCart(product, 1)
        setAdded(true)
        setTimeout(() => setAdded(false), 1500)
    }

    return (
      <div
          onClick={onClick}
          className="bg-white/3 rounded-2xl p-4 hover:shadow-2xl transition-all duration-300 group cursor-pointer hover:bg-white/5 transform hover:scale-105"
      >
          <div className="w-full h-64 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center relative">
              <img
                  src={product.image}
                  alt={product.title}
                  className="object-contain w-full h-full p-6 group-hover:scale-110 transition duration-300"
              />
          </div>

          <div className="mt-4">
              <h3 className="font-semibold text-lg group-hover:text-yellow-300 transition">{product.title}</h3>
              <p className="text-sm text-white/70 mt-1">{product.description}</p>
              <div className="mt-4 flex items-center justify-between">
                  <div className="font-bold text-lg">₹{product.price}</div>
                  <button
                      onClick={handleAddToCart}
                      className={`px-4 py-2 rounded-md font-semibold transition ${added ? 'bg-green-500 text-white' : 'bg-yellow-300 text-black hover:bg-yellow-400'
                          }`}
                  >
                      {added ? '✓ Added' : 'Add'}
                  </button>
              </div>
          </div>
      </div>
  )
}

export default ProductCard