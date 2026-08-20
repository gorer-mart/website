'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();
  const hideFooter = pathname === '/login' || pathname?.startsWith('/studio') || pathname?.startsWith('/admin');

  if (hideFooter) return null;
  return <Footer />;
};

export default ConditionalFooter;
