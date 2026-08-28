/** @type {import('next').NextConfig} */

/**
 * Baseline security headers.
 *
 * A blocking Content-Security-Policy is deliberately NOT enabled here: this app
 * loads the Razorpay checkout script, embeds Sanity Studio (which needs
 * `unsafe-eval`), and relies on Next's inline bootstrap scripts. Shipping a
 * strict policy untested days before launch risks breaking payment. The policy
 * below is sent in Report-Only mode so violations can be reviewed in the
 * browser console first; switch the header name to `Content-Security-Policy`
 * once the report is clean.
 */
const cspReportOnly = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://cdn.sanity.io https://*.supabase.co https://lh3.googleusercontent.com https://*.razorpay.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.sanity.io https://*.apicdn.sanity.io https://api.razorpay.com https://lumberjack.razorpay.com",
  "frame-src 'self' https://api.razorpay.com https://*.razorpay.com",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
];

const nextConfig = {
  // Do not advertise the framework version to attackers.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // API responses are per-user and often privileged. Never let a CDN or
        // shared proxy hold on to them.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, private' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/studio/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ];
  },
};

export default nextConfig;
