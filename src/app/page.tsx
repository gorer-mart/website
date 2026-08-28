import React from 'react';
import { Metadata } from 'next';
import HomeClient from './HomeClient';
import { getHomePageShowcase } from '../lib/sanity';
import { HERO_WIDTHS, imageSrcSet } from '../lib/image';

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

  // The hero is the largest contentful paint on the home page. Preloading it
  // here — from the server render, before the JS bundle is even parsed — lets
  // the browser start the download immediately. `media` keeps each viewport to
  // a single hero: phones never fetch the desktop banner and vice versa.
  const desktopHero = showcase.heroData?.desktopImage;
  const mobileHero = showcase.heroData?.mobileImages?.[0];

  return (
    <>
      {desktopHero && (
        <link
          rel="preload"
          as="image"
          media="(min-width: 1024px)"
          imageSrcSet={imageSrcSet(desktopHero, HERO_WIDTHS, 80)}
          imageSizes="100vw"
          fetchPriority="high"
        />
      )}
      {mobileHero && (
        <link
          rel="preload"
          as="image"
          media="(max-width: 1023px)"
          imageSrcSet={imageSrcSet(mobileHero, [480, 640, 828, 1080, 1280], 80)}
          imageSizes="100vw"
          fetchPriority="high"
        />
      )}
      <HomeClient
        heroData={showcase.heroData}
        topPicks={showcase.mostPochhonder || []}
        newArrivals={showcase.taatkaDrop || []}
      />
    </>
  );
}
