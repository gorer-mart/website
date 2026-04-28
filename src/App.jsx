import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/layout/Navbar';
import CartDrawer from './components/shop/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Story from './pages/About';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import Footer from './components/layout/Footer';

// Scroll restoration component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
};

// To be implemented: User Account
const Account = () => <div className="pt-32 min-h-screen container mx-auto px-6"><h1>User Account Coming Soon</h1></div>;

function App() {
  return (
    <CartProvider>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen relative">
        <Navbar />
        <CartDrawer />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/about" element={<Story />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;