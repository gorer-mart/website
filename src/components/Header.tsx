'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

const Header = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) return null;

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <Navbar />
    </header>
  );
};

export default Header;
