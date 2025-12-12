# Gorer Mart - Kolkata T-Shirt Store

A modern, dark-aesthetic e-commerce website for Kolkata-inspired t-shirts built with React, Vite, and Tailwind CSS. Features rich SEO, animations, shopping cart, and order tracking via Google Forms.

## Features

✨ **Modern UI**
- Dark theme with glass-morphism design
- Responsive layout (mobile-first)
- Smooth animations with Motion library
- Product cards with hover effects

🛒 **E-Commerce**
- Shopping cart with localStorage persistence
- Cart badge showing item count
- Checkout form with customer details
- Order tracking via Google Forms

🔍 **SEO**
- Rich meta tags and Open Graph
- JSON-LD structured data
- XML sitemap & robots.txt
- Helmet for dynamic page titles

💳 **Payment (Ready to Integrate)**
- Stripe test mode ready (free, instant)
- Razorpay integration ready
- Order data submission to Google Forms

📦 **Deployment**
- Optimized for Vercel
- Environment variables support
- Fast build & preview

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4
- **State**: Context API (Cart)
- **Routing**: React Router v7
- **SEO**: React Helmet Async
- **Icons**: FontAwesome
- **Animations**: Motion (native CSS alternatives)

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/gorer-mart/website.git
cd website

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

### Preview

```bash
npm run preview
```

## Configuration

### Google Forms Integration

1. Create a Google Form for orders
2. Get the form ID from the URL: `forms/d/e/{FORM_ID}/viewform`
3. Add form fields (Name, Email, Phone, Address, City, Pincode, Items, Total)
4. Get entry IDs by inspecting the form (right-click → Inspect → search for `entry.`)
5. Update `src/pages/Checkout.jsx` with your form entry IDs

Example:
```javascript
formBody.append('entry.1234567890', orderData.orderId)
formBody.append('entry.9876543210', orderData.customerName)
// ... add all fields
```

### Payment Gateway (Optional)

#### Stripe (Recommended)
1. Sign up at [stripe.com](https://stripe.com)
2. Get test keys from Dashboard → Developers
3. Add to `.env.local`:
   ```
   VITE_STRIPE_PUBLIC_KEY=pk_test_...
   ```
4. Integrate Stripe Elements in Checkout page

#### Razorpay
1. Sign up at [razorpay.com](https://razorpay.com)
2. Get test keys from Settings
3. Add to `.env.local`:
   ```
   VITE_RAZORPAY_KEY=rzp_test_...
   ```

## Deployment on Vercel

### Option 1: Using Vercel CLI

```bash
npm i -g vercel
vercel login
vercel
```

### Option 2: GitHub Integration

1. Push code to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select your repository
5. Vercel auto-detects Vite settings
6. Add environment variables in Settings
7. Deploy

### Environment Variables on Vercel

In Vercel Dashboard → Settings → Environment Variables:
- `VITE_GOOGLE_FORM_URL`
- `VITE_STRIPE_PUBLIC_KEY` (if using Stripe)
- `VITE_SITE_URL`

## File Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Navigation with cart badge
│   ├── Hero.jsx            # Hero section with CTA
│   ├── ProductCard.jsx     # Product card with add-to-cart
│   ├── Footer.jsx          # Footer with newsletter
│   └── SEO.jsx             # Reusable SEO component
├── pages/
│   ├── Home.jsx            # Homepage with featured products
│   ├── Shop.jsx            # Product listing grid
│   ├── Cart.jsx            # Shopping cart
│   ├── Checkout.jsx        # Order form + Google Form submission
│   ├── About.jsx           # Brand story
│   └── Contact.jsx         # Contact form
├── context/
│   └── CartContext.jsx     # Cart state management
├── data/
│   └── products.js         # Product data
├── App.jsx                 # Main app with routes
├── main.jsx                # Helmet setup
└── index.css               # Tailwind + custom styles

public/
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Search engine directives
└── [images]

index.html                   # Enhanced meta tags
.env.example                # Environment template
vercel.json                 # Vercel config
```

## SEO Checklist

- [x] Meta tags (title, description, OG)
- [x] JSON-LD structured data
- [x] XML sitemap
- [x] robots.txt
- [x] Mobile responsive
- [x] Fast loading (Vite)
- [ ] Google Search Console setup
- [ ] Google Analytics integration
- [ ] Schema.org markup for products

## Performance Tips

1. **Images**: Replace placeholder images with optimized WebP files
2. **Code Splitting**: React Router handles this automatically
3. **Caching**: Vercel handles cache headers
4. **Lighthouse**: Run audit with `npm run build` and test in production

```bash
# Test locally
npm run build
npm run preview

# Then open Chrome DevTools → Lighthouse
```

## Troubleshooting

### Google Form CORS Error
Use a backend proxy or alternative: Formspree, Basin, etc.

```javascript
// Alternative: Use Formspree
const formUrl = 'https://formspree.io/f/YOUR_FORM_ID'
await fetch(formUrl, { method: 'POST', body: JSON.stringify(orderData) })
```

### Cart not persisting
Check browser localStorage is enabled.

### Styles not applying
Rebuild Tailwind:
```bash
npm run build
```

## Future Enhancements

- [ ] Product filtering & search
- [ ] User authentication
- [ ] Order history
- [ ] Email confirmations
- [ ] Image gallery on product detail
- [ ] Wishlist feature
- [ ] Coupon/promo codes
- [ ] Analytics dashboard

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

- Email: hello@gorermart.com
- Instagram: @gorermart
- Issues: [GitHub Issues](https://github.com/gorer-mart/website/issues)

---

Built with ❤️ for Kolkata. **Buy, Wear, and Flex.** 🎨
