'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login';

  if (isAuthPage) return null;
  return <Footer />;
};

export default ConditionalFooter;
