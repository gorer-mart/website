import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Home from '../src/pages/Home.jsx'
import Navbar from '../src/components/Navbar.jsx'
import Shop from '../src/pages/Shop.jsx'
import About from '../src/pages/About.jsx'
import Contact from '../src/pages/Contact.jsx'

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>

    </div>
  )
}

export default App