import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import About from './pages/About';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Contact from './pages/Contact';
import RefundPolicy from './pages/RefundPolicy';
import SizeGuide from './pages/SizeGuide';
import Footer from './components/Footer';

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
        <Header />
        <CartDrawer />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/account" element={<Account />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/size-guide" element={<SizeGuide />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </CartProvider>
  );
}

export default App;