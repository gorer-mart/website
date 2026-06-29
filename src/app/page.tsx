import React from 'react';
import { Metadata } from 'next';
import HomeClient from './HomeClient';
import { getHomePageShowcase } from '../lib/sanity';

export const metadata: Metadata = {
  title: 'Gorer Mart | Authentic Kolkata Streetwear & Premium Apparel',
  description: 'Explore Gorer Mart, the premier Kolkata-inspired streetwear brand. Shop premium t-shirts and hoodies that blend Bengal heritage with modern urban style. Ethically sourced, sustainably made.',
  keywords: [
    'Kolkata streetwear',
    'premium t-shirts Kolkata',
    'Bengal heritage fashion',
    'sustainable streetwear India',
    'Gorer Mart',
    'authentic urban apparel',
    'designer graphic tees'
  ],
  applicationName: 'Gorer Mart',
  alternates: {
    canonical: 'https://gorermart.in',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://gorermart.in',
    title: 'Gorer Mart | Authentic Kolkata Streetwear & Premium Apparel',
    description: 'Explore Gorer Mart, the premier Kolkata-inspired streetwear brand. Shop premium t-shirts and hoodies that blend Bengal heritage with modern urban style. Ethically sourced, sustainably made.',
    siteName: 'Gorer Mart',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gorer Mart | Authentic Kolkata Streetwear & Premium Apparel',
    description: 'Explore Gorer Mart, the premier Kolkata-inspired streetwear brand. Shop premium t-shirts and hoodies that blend Bengal heritage with modern urban style. Ethically sourced, sustainably made.',
  },
  other: {
    'apple-mobile-web-app-title': 'Gorer Mart',
  }
};

export const viewport = {
  themeColor: '#a6101b',
};

export const dynamic = 'force-dynamic';

export default async function Page() {
  const showcase = await getHomePageShowcase();
  return (
    <HomeClient
      topPicks={showcase.mostPochhonder || []}
      newArrivals={showcase.taatkaDrop || []}
    />
  );
}
