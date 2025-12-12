import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { CartProvider } from './context/CartContext'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Navbar from './components/Navbar.jsx'
import SEO from './components/SEO'

const App = () => {
  return (
    <HelmetProvider>
      <CartProvider>
        <SEO
          title=""
          description="Kolkata-inspired t-shirts with nostalgia and aesthetics. Shop modern, aesthetic tees online."
          url="/"
          keywords="t-shirt, kolkata, tees, streetwear, fashion, nostalgia"
          author="Gorer Mart"
        />
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </CartProvider>
    </HelmetProvider>
  )
}

export default App