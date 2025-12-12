# Payment Integration Guide

This guide covers integrating **Stripe** or **Razorpay** for payments while tracking orders via **Google Forms**.

## Architecture

```
Customer → Checkout Form → Payment Gateway → Order Confirmation → Google Form Entry
```

## Option A: Stripe (Recommended for Beginners)

### 1. Setup Stripe Account

1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Navigate to **Developers → API Keys**
4. Copy your **Publishable Key** (starts with `pk_test_`)

### 2. Add to Environment

Create/update `.env.local`:
```
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY_HERE
```

### 3. Install Stripe Packages

```bash
npm install @stripe/react-stripe-js @stripe/js
```

Already installed ✅

### 4. Update Checkout Page

Replace `src/pages/Checkout.jsx` with Stripe integration:

```jsx
import { loadStripe } from '@stripe/js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)

// In your checkout form:
const stripe = useStripe()
const elements = useElements()

const handlePayment = async () => {
  const { token } = await stripe.createToken(elements.getElement(CardElement))
  
  if (token) {
    // Call your backend to create payment intent
    // Backend receives token.id and creates Stripe charge
  }
}
```

**Note**: For production, create a **backend** (Node.js/Express or similar) to:
- Receive payment token from frontend
- Create Stripe PaymentIntent
- Return client_secret to frontend
- Confirm payment via Stripe API

### 5. Test Mode

Stripe provides test card numbers:
- **4242 4242 4242 4242** - Success
- **4000 0000 0000 0002** - Decline
- Any future expiry date, any 3-digit CVC

---

## Option B: Razorpay (India-Focused)

### 1. Setup Razorpay Account

1. Go to [razorpay.com](https://razorpay.com)
2. Sign up and verify email
3. Go to **Settings → API Keys**
4. Copy **Key ID** (starts with `rzp_test_`)

### 2. Add to Environment

```
VITE_RAZORPAY_KEY=rzp_test_YOUR_KEY_HERE
```

### 3. Install Razorpay

```bash
npm install razorpay
```

### 4. Integration Example

```jsx
const handlePayment = async (formData) => {
  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY,
    amount: total * 100, // Convert to paise
    currency: 'INR',
    name: 'Gorer Mart',
    description: 'Order from Gorer Mart',
    handler: function(response) {
      // Save order to Google Form
      submitToGoogleForm({...formData, paymentId: response.razorpay_payment_id})
    },
    prefill: {
      name: formData.name,
      email: formData.email,
      contact: formData.phone,
    },
  }
  
  const rzp = new window.Razorpay(options)
  rzp.open()
}
```

Add script to `index.html`:
```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

---

## Option C: Free Alternative - Google Forms Only (Current Setup)

No payment processing, just order tracking:

```jsx
const handleSubmit = async (e) => {
  e.preventDefault()
  
  const orderId = `GM-${Date.now()}`
  const orderData = {
    orderId,
    customerName: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    pincode: formData.pincode,
    items: cart.map(item => `${item.title} x${item.quantity}`).join(', '),
    total: total.toLocaleString('en-IN'),
    orderDate: new Date().toLocaleString('en-IN'),
  }
  
  // Submit to Google Form
  const formBody = new FormData()
  formBody.append('entry.1234567890', orderId)
  formBody.append('entry.0987654321', orderData.customerName)
  // ... add all entries
  
  // Use CORS proxy to avoid browser restrictions:
  const proxyUrl = 'https://cors-anywhere.herokuapp.com/'
  const formUrl = 'https://docs.google.com/forms/d/e/YOUR_FORM_ID/formResponse'
  
  fetch(proxyUrl + formUrl, { method: 'POST', body: formBody, mode: 'no-cors' })
}
```

### Setup Google Form

1. Create form at [forms.google.com](https://forms.google.com)
2. Add fields: Order ID, Name, Email, Phone, Address, City, Pincode, Items, Total, Date
3. Get form URL: Forms link contains the form ID
4. Inspect form to find entry IDs (F12 → Network → Submit → Look for `entry.xxxxx`)
5. Update `entry.xxxxx` numbers in Checkout.jsx

---

## Comparing Options

| Feature | Stripe | Razorpay | Google Forms |
|---------|--------|----------|--------------|
| Cost | Free (2.9% + 30¢) | Free (2% + ₹3) | Free |
| Payment Processing | ✅ | ✅ | ❌ |
| India Support | ✅ | ⭐ (Native) | ✅ |
| Setup Time | 10 min | 10 min | 5 min |
| Manual Review | No | No | Yes (via form) |
| Refunds | Automated | Automated | Manual |
| Recommended For | Global | India | Testing/MVP |

---

## Production Checklist

- [ ] Migrate from test keys to live keys
- [ ] Set up backend for payment processing
- [ ] Enable SSL/HTTPS (Vercel handles this)
- [ ] Add error handling & retry logic
- [ ] Test with real payments
- [ ] Setup order confirmations emails
- [ ] Add payment receipt to Google Forms
- [ ] Monitor Stripe/Razorpay dashboard
- [ ] Setup webhook handlers for payment events

---

## Webhook Setup (Advanced)

Listen to payment events:

```javascript
// Backend example (Node.js + Express)
app.post('/webhook/stripe', (req, res) => {
  const event = req.body
  
  if (event.type === 'payment_intent.succeeded') {
    // Mark order as paid
    // Send confirmation email
    // Update inventory
  }
  
  res.sendStatus(200)
})
```

Configure in Stripe Dashboard → Webhooks → Add Endpoint

---

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Razorpay Documentation](https://razorpay.com/docs)
- [Google Forms API](https://developers.google.com/forms)
- [Formspree (Email Alternative)](https://formspree.io)

---

**Next Steps**: Choose one payment method above and implement in `src/pages/Checkout.jsx`. Test with test mode first!
