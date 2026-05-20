import '../index.css';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import Header from '../components/Header';
import CartDrawer from '../components/CartDrawer';
import ConditionalFooter from '../components/ConditionalFooter';
import { Toaster } from '../ui/toaster';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://gorermart.in'),
  title: {
    default: 'Gorer Mart',
    template: '%s | Gorer Mart',
  },
  description: 'Curating premium apparel that blends cultural heritage with contemporary streetwear. Join our journey in redefining modern style.',
  keywords: ['streetwear', 'Kolkata fashion', 'premium t-shirts', 'oversized tees', 'Gorer Mart', 'Indian streetwear'],
  authors: [{ name: 'Gorer Mart' }],
  creator: 'Gorer Mart',
  publisher: 'Gorer Mart',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://gorermart.com',
    title: 'Gorer Mart — Premium Kolkata-Inspired Streetwear',
    description: 'Curating premium apparel that blends cultural heritage with contemporary streetwear. Join our journey in redefining modern style.',
    siteName: 'Gorer Mart',
    images: [
      {
        url: '/og-image.webp',
        width: 1200,
        height: 630,
        alt: 'Gorer Mart Premium Streetwear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gorer Mart — Premium Kolkata-Inspired Streetwear',
    description: 'Curating premium apparel that blends cultural heritage with contemporary streetwear.',
    images: ['/og-image.webp'],
    creator: '@gorermart',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
  icon: '/favicon1.svg',
  //icon: '/favicon2.svg'
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen relative antialiased bg-white text-black">
        <AuthProvider>
          <CartProvider>
            <Header />
            <CartDrawer />
            <main className="flex-grow">{children}</main>
            <ConditionalFooter />
            <Toaster />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
