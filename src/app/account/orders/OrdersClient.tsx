'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faBagShopping,
  faCalendarDays,
  faCheck,
  faChevronDown,
  faCircleCheck,
  faCircleExclamation,
  faClipboardCheck,
  faCopy,
  faBoxesPacking,
  faHeadset,
  faHouse,
  faLocationDot,
  faMagnifyingGlass,
  faCreditCard,
  faRotateRight,
  faSpinner,
  faTag,
  faTruckFast,
  faBan,
  faArrowRight,
  faArrowUpRightFromSquare,
  faStar,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { useToast } from '../../../ui/use-toast';
import { imageProps } from '../../../lib/image';
import { normalizeTrackingUrl } from '../../../lib/tracking';
import type { Product } from '../../../types/product';

/* ------------------------------------------------------------------ */
/* Types — mirror of `/api/account/orders`                             */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  products?: { title?: string | null; slug?: string | null } | null;
  /** Display-only catalog snapshot added by the API. */
  product?: {
    sanityId: string | null;
    slug: string | null;
    name: string;
    category: string | null;
    image: string;
    currentPrice: number | null;
    available: boolean;
  } | null;
}

interface ShippingAddress {
  full_name?: string | null;
  phone?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
}

interface Order {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount?: number | null;
  coupon_code?: string | null;
  total: number;
  payment_status: string;
  order_status: string;
  payment_provider?: string | null;
  razorpay_payment_id?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  updated_at?: string | null;
  shipping_address?: ShippingAddress | null;
  order_items?: OrderItem[];
}

/* ------------------------------------------------------------------ */
/* Status vocabulary                                                   */
/* ------------------------------------------------------------------ */

/**
 * Customer-facing wording for the `order_status` enum.
 *
 * The database words are operational ("processing"); these are what a customer
 * actually wants to read about their own parcel.
 */
const ORDER_STATUS_META: Record<string, { label: string; pill: string }> = {
  pending: { label: 'Awaiting Payment', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmed', pill: 'bg-blue-50 text-blue-700 border-blue-200' },
  processing: { label: 'Being Packed', pill: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipped: { label: 'In Transit', pill: 'bg-violet-50 text-violet-700 border-violet-200' },
  delivered: { label: 'Delivered', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelled', pill: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const PAYMENT_STATUS_META: Record<string, { label: string; pill: string }> = {
  pending: { label: 'Payment Pending', pill: 'bg-amber-50 text-amber-700 border-amber-200' },
  paid: { label: 'Paid', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed: { label: 'Payment Failed', pill: 'bg-rose-50 text-rose-700 border-rose-200' },
  refunded: { label: 'Refunded', pill: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
};

/** The fulfilment pipeline, in the order a parcel actually moves through it. */
const FULFILMENT_STEPS = [
  { key: 'pending', label: 'Placed', icon: faClipboardCheck },
  { key: 'confirmed', label: 'Confirmed', icon: faCircleCheck },
  { key: 'processing', label: 'Packed', icon: faBoxesPacking },
  { key: 'shipped', label: 'Shipped', icon: faTruckFast },
  { key: 'delivered', label: 'Delivered', icon: faHouse },
] as const;

const STATUS_TABS = [
  { value: 'all', label: 'All Orders' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'amount-high', label: 'Amount: High to Low' },
  { value: 'amount-low', label: 'Amount: Low to High' },
] as const;

/** Orders rendered per "load more" step. */
const PAGE_SIZE = 5;

const THUMB_SIZES = '(max-width: 640px) 64px, 80px';

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const formatCurrency = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return `${formatDate(value)}, ${date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
};

const statusBucket = (order: Order) => {
  if (order.order_status === 'cancelled') return 'cancelled';
  if (order.order_status === 'delivered') return 'delivered';
  if (order.order_status === 'shipped') return 'shipped';
  return 'in-progress';
};

const itemLabel = (item: OrderItem) =>
  item.product_name || item.product?.name || item.products?.title || 'Product';

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const Pill: React.FC<{ label: string; className: string }> = ({ label, className }) => (
  <span
    className={`inline-flex items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] border ${className}`}
  >
    {label}
  </span>
);

const MetaLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">{children}</p>
);

/** A copy-to-clipboard control that confirms itself in place. */
const CopyButton: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  const [copied, setCopied] = useState(false);

  const copy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard is unavailable (insecure context or denied permission).
      // The value is on screen already, so there is nothing to recover from.
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
      className="text-neutral-300 hover:text-black transition-colors cursor-pointer"
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="text-[11px]" />
    </button>
  );
};

/**
 * Where the parcel is, as a five-stop track.
 *
 * Shown only for orders that are actually being fulfilled — an unpaid or
 * cancelled order gets an explicit notice instead, because a half-lit progress
 * bar reads as "on its way" when it is not.
 */
const FulfilmentTracker: React.FC<{ status: string }> = ({ status }) => {
  const activeIndex = FULFILMENT_STEPS.findIndex((step) => step.key === status);
  const current = Math.max(activeIndex, 0);

  // Centre of the first/last marker, so the track starts and ends on a dot
  // rather than at the edge of the row.
  const edge = 100 / (FULFILMENT_STEPS.length * 2);
  const span = 100 - edge * 2;

  return (
    <div className="pt-2 pb-1">
      <div className="relative">
        <div
          className="absolute top-4 h-[2px] bg-neutral-100"
          style={{ left: `${edge}%`, width: `${span}%` }}
        />
        <motion.div
          className="absolute top-4 h-[2px] bg-black"
          style={{ left: `${edge}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${(span * current) / (FULFILMENT_STEPS.length - 1)}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        <div className="relative flex items-start">
          {FULFILMENT_STEPS.map((step, index) => {
            const done = index <= current;
            return (
              <div
                key={step.key}
                className="flex flex-col items-center gap-2 text-center px-0.5"
                style={{ width: `${100 / FULFILMENT_STEPS.length}%` }}
              >
                <span
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-500 ${
                    done
                      ? 'bg-black border-black text-white'
                      : 'bg-white border-neutral-200 text-neutral-300'
                  }`}
                >
                  <FontAwesomeIcon icon={step.icon} className="text-[10px]" />
                </span>
                <span
                  className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.12em] leading-tight ${
                    done ? 'text-black' : 'text-neutral-300'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/** Placeholder card used while the first page of orders loads. */
const SkeletonCard: React.FC = () => (
  <div className="border border-neutral-200 bg-white p-4 sm:p-5 animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div className="flex items-center gap-4 flex-1">
      <div className="w-16 h-20 sm:w-20 sm:h-24 bg-neutral-100 flex-shrink-0" />
      <div className="flex-1 space-y-2.5">
        <div className="h-3 bg-neutral-100 w-1/4" />
        <div className="h-4 bg-neutral-100 w-3/5" />
        <div className="h-3 bg-neutral-100 w-1/3" />
      </div>
    </div>
    <div className="w-24 h-8 bg-neutral-100 flex-shrink-0 hidden sm:block" />
  </div>
);

/* ------------------------------------------------------------------ */
/* Order card                                                          */
/* ------------------------------------------------------------------ */
/* Review Data Type                                                    */
/* ------------------------------------------------------------------ */

interface UserReviewData {
  id?: string;
  rating: number;
  comment?: string;
}

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onReorder: (order: Order) => void;
  onBuyAgain: (item: OrderItem) => void;
  onOpenReview: (item: OrderItem, initialRating?: number, initialComment?: string) => void;
  reviewMap: Record<string, UserReviewData>;
  busy: boolean;
  busyItemId: string | null;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  expanded,
  onToggle,
  onReorder,
  onBuyAgain,
  onOpenReview,
  reviewMap,
  busy,
  busyItemId,
}) => {
  const [headerHoverRating, setHeaderHoverRating] = useState(0);
  const items = order.order_items ?? [];
  const unitCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_cost || 0);

  const cancelled = order.order_status === 'cancelled';
  const isPaid = order.payment_status === 'paid';
  const address = order.shipping_address;

  /**
   * Re-validated on the way into the `href`, not trusted from the API — see
   * `normalizeTrackingUrl`. Null means no button rather than a dead one.
   */
  const trackingUrl = normalizeTrackingUrl(order.tracking_url);

  const showExpectedDelivery =
    Boolean(order.estimated_delivery) && order.order_status !== 'delivered';
  /**
   * The meta strip is dropped entirely when the link is the only thing we have
   * to say, so the button does not sit under an empty ruled line.
   */
  const showTrackingMeta =
    Boolean(order.tracking_number) || showExpectedDelivery || !trackingUrl;

  const orderMeta = ORDER_STATUS_META[order.order_status] ?? {
    label: order.order_status,
    pill: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  };
  const paymentMeta = PAYMENT_STATUS_META[order.payment_status] ?? {
    label: order.payment_status,
    pill: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  };

  /** One honest sentence about anything that stops this being a normal order. */
  const notice = cancelled
    ? {
        tone: 'bg-rose-50/70 border-rose-200 text-rose-700',
        icon: faBan,
        text:
          order.payment_status === 'refunded'
            ? 'This order was cancelled and the amount has been refunded.'
            : 'This order was cancelled and will not be delivered.',
      }
    : order.payment_status === 'pending'
      ? {
          tone: 'bg-amber-50/70 border-amber-200 text-amber-800',
          icon: faCircleExclamation,
          text: 'We have not received your payment yet. This order is released automatically if the payment does not complete.',
        }
      : order.payment_status === 'failed'
        ? {
            tone: 'bg-rose-50/70 border-rose-200 text-rose-700',
            icon: faCircleExclamation,
            text: 'The payment for this order did not go through, so it was not processed. You can place it again below.',
          }
        : order.payment_status === 'refunded'
          ? {
              tone: 'bg-neutral-50 border-neutral-200 text-neutral-600',
              icon: faCircleCheck,
              text: 'This order has been refunded.',
            }
          : null;

  const firstItem = items[0];
  const primaryName = firstItem ? itemLabel(firstItem) : 'Order Item';
  const extraItemsCount = items.length > 1 ? items.length - 1 : 0;
  const primaryImage = firstItem?.product?.image;
  const primaryImgProps = imageProps(primaryImage, {
    widths: [96, 160, 240],
    sizes: THUMB_SIZES,
    fallbackWidth: 160,
  });

  const firstProductId = (firstItem?.product_id || '').toLowerCase();
  const firstSanityId = (firstItem?.product?.sanityId || '').toLowerCase();
  const reviewedItem = reviewMap[firstProductId] || (firstSanityId ? reviewMap[firstSanityId] : undefined);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`border bg-white transition-all duration-200 ${
        expanded ? 'border-black/50 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'
      }`}
    >
      {/* ---- Rectangular Header Row: Product Image + Status ("Delivered on {Date}") + Bigger Review Stars + Arrow ---- */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        aria-expanded={expanded}
        className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer select-none transition-colors hover:bg-neutral-50/60"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Primary Product Image Thumbnail */}
          <div className="relative w-16 h-20 sm:w-20 sm:h-24 bg-neutral-100 flex-shrink-0 overflow-hidden border border-neutral-200">
            {primaryImgProps.src ? (
              <img
                src={primaryImgProps.src}
                srcSet={primaryImgProps.srcSet}
                sizes={primaryImgProps.sizes}
                alt={primaryName}
                width={160}
                height={200}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                <FontAwesomeIcon icon={faBox} className="text-base" />
              </div>
            )}
            {extraItemsCount > 0 && (
              <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[9px] font-bold px-1.5 py-0.5 tracking-wider">
                +{extraItemsCount}
              </span>
            )}
          </div>

          {/* Beside product image: First status written like "Delivered on {Date}" (no uppercase), then product name */}
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm sm:text-base font-semibold text-neutral-900 leading-snug">
              {order.order_status === 'delivered' ? (
                <>Delivered on {formatDate(order.updated_at || order.created_at)}</>
              ) : order.order_status === 'shipped' ? (
                <>In Transit{order.estimated_delivery ? ` on ${formatDate(order.estimated_delivery)}` : ''}</>
              ) : order.order_status === 'processing' ? (
                <>Being Packed{order.estimated_delivery ? ` on ${formatDate(order.estimated_delivery)}` : ''}</>
              ) : order.order_status === 'confirmed' ? (
                <>Confirmed{order.estimated_delivery ? ` on ${formatDate(order.estimated_delivery)}` : ''}</>
              ) : order.order_status === 'cancelled' ? (
                <>Cancelled</>
              ) : (
                <>{orderMeta.label}</>
              )}
            </p>

            <h3 className="text-xs sm:text-sm font-medium text-neutral-500 truncate">
              {primaryName}
              {extraItemsCount > 0 && (
                <span className="text-neutral-400 ml-1">
                  (+{extraItemsCount} more)
                </span>
              )}
            </h3>
          </div>
        </div>

        {/* Right side of card: Bigger Rating Stars with dynamic hover effect & Arrow Button ONLY */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          {/* Rating / Review Prompt */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col items-end gap-1 select-none"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-neutral-500">
                {headerHoverRating
                  ? `${headerHoverRating} Star${headerHoverRating > 1 ? 's' : ''}`
                  : reviewedItem
                    ? 'Your Review'
                    : 'Rate Product'}
              </span>
              {reviewedItem && (
                <button
                  type="button"
                  onClick={() => onOpenReview(firstItem, reviewedItem.rating, reviewedItem.comment)}
                  className="text-[9px] font-bold text-neutral-400 hover:text-black underline cursor-pointer transition-colors"
                >
                  Change
                </button>
              )}
            </div>

            {/* Bigger stars with hover effect */}
            <div
              className="flex items-center gap-1 text-[#D4AF37]"
              onMouseLeave={() => setHeaderHoverRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = headerHoverRating
                  ? star <= headerHoverRating
                  : reviewedItem
                    ? star <= reviewedItem.rating
                    : false;

                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHeaderHoverRating(star)}
                    onClick={() => onOpenReview(firstItem, star, reviewedItem?.comment)}
                    className="p-0.5 text-base sm:text-xl transition-transform hover:scale-125 cursor-pointer focus:outline-none"
                    title={
                      reviewedItem
                        ? `Change rating to ${star} star${star > 1 ? 's' : ''}`
                        : `Rate ${star} star${star > 1 ? 's' : ''}`
                    }
                    aria-label={`Rate ${star} stars`}
                  >
                    <FontAwesomeIcon
                      icon={faStar}
                      className={`transition-colors duration-150 ${
                        isLit
                          ? 'text-[#D4AF37]'
                          : reviewedItem
                            ? 'text-neutral-200'
                            : 'text-neutral-300 hover:text-[#D4AF37]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arrow Button ONLY - No "view details" text */}
          <div
            aria-label={expanded ? 'Collapse order' : 'Expand order'}
            className={`w-8 h-8 border flex items-center justify-center transition-all duration-300 ${
              expanded
                ? 'rotate-180 bg-black text-white border-black'
                : 'bg-white text-neutral-600 border-neutral-200 hover:border-black'
            }`}
          >
            <FontAwesomeIcon icon={faChevronDown} className="text-[9px]" />
          </div>
        </div>
      </div>

      {/* ---- Expanded Details: Status Timeline, Order Details, Info & Actions ---- */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-neutral-200 bg-neutral-50/40"
          >
            <div className="p-5 sm:p-7 space-y-6">
              {/* Notice */}
              {notice && (
                <div className={`flex items-start gap-3 border px-4 py-3 ${notice.tone}`}>
                  <FontAwesomeIcon icon={notice.icon} className="text-xs mt-0.5 flex-shrink-0" />
                  <p className="text-xs leading-relaxed">{notice.text}</p>
                </div>
              )}

              {/* Status Timeline */}
              {!cancelled && isPaid && (
                <div className="bg-white border border-neutral-200 p-5">
                  <FulfilmentTracker status={order.order_status} />

                  {showTrackingMeta && (
                    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 pt-4 border-t border-neutral-100">
                      {order.tracking_number ? (
                        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                          <FontAwesomeIcon icon={faTruckFast} className="text-neutral-300" />
                          Tracking
                          <span className="font-bold text-black tracking-normal normal-case text-xs">
                            {order.tracking_number}
                          </span>
                          <CopyButton value={order.tracking_number} label="tracking number" />
                        </span>
                      ) : trackingUrl ? null : (
                        /* Only promised while there is nothing to show. With a
                           link in hand the button below says it better. */
                        <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                          Tracking appears here once your parcel ships
                        </span>
                      )}

                      {showExpectedDelivery && (
                        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                          <FontAwesomeIcon icon={faCalendarDays} className="text-neutral-300" />
                          Expected
                          <span className="font-bold text-black">
                            {formatDate(order.estimated_delivery)}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* The courier's own live status, one tap away. Only rendered
                      when the admin has actually supplied a link. */}
                  {trackingUrl && (
                    <div
                      className={`flex justify-center ${
                        showTrackingMeta ? 'mt-4' : 'mt-4 pt-4 border-t border-neutral-100'
                      }`}
                    >
                      <a
                        href={trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="group inline-flex items-center gap-2.5 border border-black bg-black px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white transition-colors hover:bg-neutral-800"
                      >
                        <FontAwesomeIcon icon={faTruckFast} className="text-[11px]" />
                        Track Shipment
                        <FontAwesomeIcon
                          icon={faArrowUpRightFromSquare}
                          className="text-[9px] text-white/60 transition-colors group-hover:text-white"
                        />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Order Details Section: details on left, button "View Product" on right, NO amount shown */}
              <div className="bg-white border border-neutral-200 p-5 sm:p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-800">
                    Order Details
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400">
                      Order ID:
                    </span>
                    <span className="font-mono text-xs font-bold text-neutral-900">{order.order_number}</span>
                    <CopyButton value={order.order_number} label="order ID" />
                  </div>
                </div>

                <div className="divide-y divide-neutral-100">
                  {items.map((item) => {
                    const name = itemLabel(item);
                    const slug = item.product?.slug || item.products?.slug;
                    const href = slug ? `/product/${slug}` : '/shop';
                    const quantity = Number(item.quantity || 1);
                    const itemProductId = (item.product_id || '').toLowerCase();
                    const itemSanityId = (item.product?.sanityId || '').toLowerCase();
                    const itemReview = reviewMap[itemProductId] || (itemSanityId ? reviewMap[itemSanityId] : undefined);

                    return (
                      <div
                        key={item.id}
                        className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        {/* Left side: Order Details */}
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <Link
                            href={href}
                            className="text-sm font-display font-bold text-neutral-900 hover:underline block truncate"
                          >
                            {name}
                          </Link>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-500 uppercase tracking-wider">
                            {item.size && (
                              <span>
                                Size: <strong className="text-neutral-900">{item.size}</strong>
                              </span>
                            )}
                            {item.color && (
                              <span>
                                Colour: <strong className="text-neutral-900">{item.color}</strong>
                              </span>
                            )}
                            <span>
                              Qty: <strong className="text-neutral-900">{quantity}</strong>
                            </span>
                          </div>

                          {/* Review status / change review for this specific item */}
                          <div className="pt-0.5 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenReview(item, itemReview?.rating, itemReview?.comment)}
                              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-600 hover:text-black transition-colors cursor-pointer"
                            >
                              <FontAwesomeIcon
                                icon={faStar}
                                className={`text-[9px] ${itemReview ? 'text-[#D4AF37]' : 'text-neutral-300'}`}
                              />
                              {itemReview ? `Your Review: ${itemReview.rating}★ (Change)` : 'Write a Review'}
                            </button>
                          </div>
                        </div>

                        {/* Right side: Button "View Product" (NO amount / price shown) */}
                        <div className="flex-shrink-0 self-start sm:self-center">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-9 px-4 text-[10px] font-bold uppercase tracking-[0.16em] border-neutral-300 hover:border-black hover:bg-black hover:text-white transition-all cursor-pointer"
                          >
                            <Link href={href} className="inline-flex items-center gap-2">
                              <span>View Product</span>
                              <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Details: Address, Payment, Delivery */}
              <div className="bg-white border border-neutral-200 p-5 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Delivery address */}
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-800 mb-4">
                    <FontAwesomeIcon icon={faLocationDot} className="text-neutral-300" />
                    Delivery Address
                  </h3>
                  {address ? (
                    <address className="not-italic text-xs leading-relaxed text-neutral-600 space-y-0.5">
                      {address.full_name && <p className="font-bold text-neutral-900">{address.full_name}</p>}
                      {address.address_line_1 && <p>{address.address_line_1}</p>}
                      {address.address_line_2 && <p>{address.address_line_2}</p>}
                      <p>
                        {[address.city, address.state].filter(Boolean).join(', ')}
                        {address.postal_code ? ` — ${address.postal_code}` : ''}
                      </p>
                      {address.country && <p>{address.country}</p>}
                      {address.phone && <p className="pt-1.5 text-neutral-500">{address.phone}</p>}
                    </address>
                  ) : (
                    <p className="text-xs text-neutral-400">No address recorded for this order.</p>
                  )}
                </section>

                {/* Payment summary */}
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-800 mb-4">
                    <FontAwesomeIcon icon={faCreditCard} className="text-neutral-300" />
                    Payment Summary
                  </h3>
                  <dl className="text-xs text-neutral-600 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <dt>Subtotal</dt>
                      <dd className="font-medium text-neutral-900">{formatCurrency(order.subtotal)}</dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-emerald-700">
                        <dt>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt>
                        <dd className="font-medium">−{formatCurrency(discount)}</dd>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4">
                      <dt>Shipping</dt>
                      <dd className="font-medium text-neutral-900">
                        {shipping > 0 ? formatCurrency(shipping) : 'Free'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 pt-2.5 mt-1 border-t border-neutral-200">
                      <dt className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-800">
                        {isPaid ? 'Total Paid' : 'Order Total'}
                      </dt>
                      <dd className="font-display font-bold text-base text-black">
                        {formatCurrency(order.total)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-4 pt-4 border-t border-neutral-200 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                      Method: <span className="text-neutral-700 font-bold">Razorpay</span>
                    </p>
                  </div>
                </section>

                {/* Delivery details */}
                <section>
                  <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-800 mb-4">
                    <FontAwesomeIcon icon={faTruckFast} className="text-neutral-300" />
                    Delivery Details
                  </h3>
                  <dl className="text-xs text-neutral-600 space-y-3">
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        Status
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">{orderMeta.label}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        Expected Delivery
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {order.estimated_delivery ? formatDate(order.estimated_delivery) : 'To be confirmed'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        Last Updated
                      </dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {formatDateTime(order.updated_at || order.created_at)}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>

              {/* Actions Footer */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors"
                >
                  <FontAwesomeIcon icon={faHeadset} className="text-[10px]" />
                  Need Help
                </Link>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggle}
                    className="text-[10px] tracking-[0.15em] cursor-pointer"
                  >
                    Hide Details
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onReorder(order)}
                    disabled={busy}
                    className="text-[10px] tracking-[0.15em] bg-black text-white hover:bg-neutral-800 cursor-pointer"
                  >
                    <FontAwesomeIcon
                      icon={busy ? faSpinner : faRotateRight}
                      className={busy ? 'animate-spin mr-2 text-[10px]' : 'mr-2 text-[10px]'}
                    />
                    Order Again
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/**
 * Order history for the signed-in customer.
 *
 * The whole history (capped at 50 by the API) arrives in one request, so
 * search, status filtering and sorting all happen in memory — filtering by
 * refetching would add latency for no benefit. Rendering is paged locally so a
 * long history does not paint fifty expandable cards up front.
 */
const OrdersClient: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const { toast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [query, setQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [buyingItemId, setBuyingItemId] = useState<string | null>(null);

  /* ---- Review Modal & Ratings State ---- */
  const [reviewMap, setReviewMap] = useState<Record<string, UserReviewData>>({});
  const [reviewModalItem, setReviewModalItem] = useState<OrderItem | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Load reviews from cache on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gm_user_reviews_v2');
      if (saved) {
        setReviewMap(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch reviews from database when signed in
  const loadUserReviews = useCallback(async () => {
    try {
      const res = await fetch('/api/reviews?mine=true', { cache: 'no-store' });
      if (res.ok) {
        const list: Array<{ id: string; product_id: string; rating: number; comment?: string }> =
          await res.json();
        const map: Record<string, UserReviewData> = {};
        for (const rev of list) {
          if (rev.product_id) {
            map[rev.product_id.toLowerCase()] = {
              id: rev.id,
              rating: rev.rating,
              comment: rev.comment,
            };
          }
        }
        setReviewMap((prev) => {
          const merged = { ...prev, ...map };
          try {
            localStorage.setItem('gm_user_reviews_v2', JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    } catch (err) {
      console.warn('Could not load user reviews from API', err);
    }
  }, []);

  const handleOpenReview = (item: OrderItem, initialRating?: number, initialComment?: string) => {
    const itemProductId = (item.product_id || '').toLowerCase();
    const itemSanityId = (item.product?.sanityId || '').toLowerCase();
    const existing = reviewMap[itemProductId] || (itemSanityId ? reviewMap[itemSanityId] : undefined);

    setSelectedRating(initialRating || existing?.rating || 5);
    setHoverRating(0);
    setReviewComment(initialComment !== undefined ? initialComment : existing?.comment || '');
    setReviewModalItem(item);
  };

  const handleCloseReview = () => {
    if (submittingReview) return;
    setReviewModalItem(null);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!reviewModalItem) return;
    const rawId = reviewModalItem.product_id || reviewModalItem.product?.sanityId;
    if (!rawId) {
      toast({ title: 'Error', description: 'Product identifier missing.', variant: 'destructive' });
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: String(rawId),
          rating: selectedRating,
          comment: reviewComment.trim(),
          name: itemLabel(reviewModalItem),
          price: reviewModalItem.price,
          slug: reviewModalItem.product?.slug || reviewModalItem.products?.slug || '',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: 'Review failed',
          description: data.error || 'Could not submit your review. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      const key = String(rawId).toLowerCase();
      const sanityKey = reviewModalItem.product?.sanityId?.toLowerCase();
      const existing = reviewMap[key] || (sanityKey ? reviewMap[sanityKey] : undefined);
      const isUpdate = Boolean(data.updated || existing);

      setReviewMap((prev) => {
        const updated = {
          ...prev,
          [key]: { rating: selectedRating, comment: reviewComment.trim(), id: data.id },
        };
        if (sanityKey) {
          updated[sanityKey] = { rating: selectedRating, comment: reviewComment.trim(), id: data.id };
        }
        try {
          localStorage.setItem('gm_user_reviews_v2', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      toast({
        title: isUpdate ? 'Review updated' : 'Review submitted',
        description: isUpdate
          ? 'Your rating and feedback have been updated.'
          : 'Thank you for your review! Your feedback helps other shoppers.',
      });
      setReviewModalItem(null);
    } catch (err) {
      console.error('Review submit failed:', err);
      toast({
        title: 'Network error',
        description: 'Could not connect to the server. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  /** Catalog for reorder, fetched once on first use rather than on page load. */
  const catalogRef = useRef<Product[] | null>(null);
  /** Whether a list is already on screen, read without re-creating `loadOrders`. */
  const hasOrdersRef = useRef(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/account/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  const loadOrders = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      setError('');

      /**
       * A failed refresh keeps the history already on screen and reports itself
       * as a toast. Replacing a readable list with an error panel would lose
       * the customer's place over a request that may just have timed out.
       */
      const fail = (message: string) => {
        if (isRefresh && hasOrdersRef.current) {
          toast({ title: 'Could not refresh', description: message, variant: 'destructive' });
        } else {
          setError(message);
        }
      };

      try {
        const res = await fetch('/api/account/orders', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          fail(data.error || 'Could not load your orders.');
          return;
        }
        const list: Order[] = Array.isArray(data.orders) ? data.orders : [];
        hasOrdersRef.current = list.length > 0;
        setOrders(list);
      } catch (err) {
        console.error('Failed to load orders:', err);
        fail('Could not reach our servers. Please check your connection and try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // `toast` is module-scoped and stable, so this callback never changes
    // identity. `hasOrdersRef` exists for the same reason: depending on
    // `orders` would re-run the effect that calls this on every load.
    [toast]
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      loadUserReviews();
    }
  }, [isAuthenticated, loadOrders, loadUserReviews]);

  /* ---- Derived data ---- */

  const stats = useMemo(() => {
    let inProgress = 0;
    let delivered = 0;
    let spent = 0;

    for (const order of orders) {
      const bucket = statusBucket(order);
      if (bucket === 'in-progress' || bucket === 'shipped') inProgress += 1;
      if (bucket === 'delivered') delivered += 1;
      // Only money that actually left the customer's account.
      if (order.payment_status === 'paid') spent += Number(order.total || 0);
    }

    return { total: orders.length, inProgress, delivered, spent };
  }, [orders]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      'in-progress': 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    for (const order of orders) counts[statusBucket(order)] += 1;
    return counts;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || statusBucket(order) === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;

      // Search where a customer would actually look: the order number, the
      // tracking number, or anything they bought.
      if (order.order_number.toLowerCase().includes(q)) return true;
      if ((order.tracking_number || '').toLowerCase().includes(q)) return true;
      if ((order.coupon_code || '').toLowerCase().includes(q)) return true;
      return (order.order_items ?? []).some((item) =>
        itemLabel(item).toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    switch (sortBy) {
      case 'oldest':
        sorted.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        break;
      case 'amount-high':
        sorted.sort((a, b) => Number(b.total || 0) - Number(a.total || 0));
        break;
      case 'amount-low':
        sorted.sort((a, b) => Number(a.total || 0) - Number(b.total || 0));
        break;
      default:
        sorted.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }
    return sorted;
  }, [orders, statusFilter, sortBy, query]);

  // A narrowed list must not stay scrolled past its own end.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [statusFilter, sortBy, query]);

  const hasFilters = statusFilter !== 'all' || query.trim() !== '' || sortBy !== 'recent';

  /* ---- Reorder ---- */

  /**
   * The live catalog, cached for the session.
   *
   * A reorder must be priced and sized against what is on sale *now*, not
   * against the snapshot stored on the order — checkout re-prices server-side
   * and rejects a stale price or a size the product no longer offers.
   */
  const fetchCatalog = useCallback(async (): Promise<Product[]> => {
    if (catalogRef.current) return catalogRef.current;
    const res = await fetch('/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Catalog unavailable');
    const data = await res.json();
    const list: Product[] = Array.isArray(data) ? data : [];
    catalogRef.current = list;
    return list;
  }, []);

  /** Resolve one order line against the live catalog. */
  const resolveLine = (
    item: OrderItem,
    catalog: Product[]
  ): { product: Product; size: string; color?: string } | null => {
    const sanityId = item.product?.sanityId;
    const product = catalog.find((candidate) =>
      sanityId
        ? String(candidate._id) === sanityId
        : item.product?.slug
          ? String(candidate.slug) === item.product.slug
          : false
    );
    if (!product) return null;

    const sizes = product.sizes || [];
    const size = item.size && sizes.includes(item.size) ? item.size : sizes[0];
    if (!size) return null;

    const colors = product.colors || [];
    const color = item.color
      ? colors.find((candidate) => candidate.toLowerCase() === item.color!.toLowerCase())
      : undefined;

    return { product, size, color };
  };

  const handleBuyAgain = async (item: OrderItem) => {
    setBuyingItemId(item.id);
    try {
      const catalog = await fetchCatalog();
      const line = resolveLine(item, catalog);

      if (!line) {
        toast({
          title: 'Unavailable',
          description: `“${itemLabel(item)}” is no longer on sale.`,
          variant: 'destructive',
        });
        return;
      }

      addToCart(line.product, Number(item.quantity || 1), line.size, line.color);
      toast({
        title: 'Added to bag',
        description: `${itemLabel(item)} — size ${line.size}.`,
      });
      setIsCartOpen(true);
    } catch (err) {
      console.error('Buy again failed:', err);
      toast({
        title: 'Could not add to bag',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setBuyingItemId(null);
    }
  };

  const handleReorder = async (order: Order) => {
    setReorderingId(order.id);
    try {
      const catalog = await fetchCatalog();
      const items = order.order_items ?? [];

      let added = 0;
      let skipped = 0;

      for (const item of items) {
        const line = resolveLine(item, catalog);
        if (!line) {
          skipped += 1;
          continue;
        }
        addToCart(line.product, Number(item.quantity || 1), line.size, line.color);
        added += 1;
      }

      if (added === 0) {
        toast({
          title: 'Nothing could be added',
          description: 'None of the items from this order are still on sale.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: added === items.length ? 'Order added to bag' : 'Partly added to bag',
        description:
          skipped > 0
            ? `${added} of ${items.length} items added. ${skipped} are no longer available.`
            : `${added} ${added === 1 ? 'item' : 'items'} from ${order.order_number} added.`,
      });
      setIsCartOpen(true);
    } catch (err) {
      console.error('Reorder failed:', err);
      toast({
        title: 'Could not reorder',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setReorderingId(null);
    }
  };

  /* ---- Gate ---- */

  if (authLoading || !isAuthenticated) {
    return (
      <div className="pt-32 pb-24 min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
          Verifying your session…
        </p>
      </div>
    );
  }

  return (
    <div className="pt-16 pb-24 min-h-screen bg-white px-4 sm:px-6 md:px-12 lg:px-24">
      <div className="container mx-auto">
        {/* ---- Header ---- */}
        <header className="pt-8 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tighter">
              My Orders
            </h1>
            <p className="text-neutral-500 text-sm mt-2">
              {loading
                ? 'Loading your order history…'
                : orders.length === 0
                  ? 'You have not placed an order yet.'
                  : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed · track status, shipments & invoices.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 h-10 px-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 hover:border-black hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={refreshing ? 'animate-spin text-[10px]' : 'text-[10px]'}
              />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>

            <Button asChild variant="outline" className="h-10 text-[10px] tracking-[0.18em]">
              <Link href="/shop">
                Continue Shopping
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-[10px]" />
              </Link>
            </Button>
          </div>
        </header>

        {/* ---- Main Two-Column Sectioning: Left and Right ---- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* ---- Left Section: Order Status Dropdown + Total Orders + Total Spent ---- */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-20">
            {/* Status Dropdown */}
            <div className="border border-neutral-200 bg-white p-4 sm:p-5 transition-all hover:border-neutral-300">
              <MetaLabel>Order Status</MetaLabel>
              <div className="relative mt-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by order status"
                  className="w-full appearance-none bg-white border border-neutral-200 pl-3.5 pr-8 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-800 focus:outline-none focus:border-black cursor-pointer transition-colors"
                >
                  {STATUS_TABS.map((tab) => (
                    <option key={tab.value} value={tab.value}>
                      {tab.label} ({tabCounts[tab.value] ?? 0})
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400"
                />
              </div>
            </div>

            {/* Stat cards: 2 columns on mobile, stacked on desktop */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="border border-neutral-200 bg-white p-4 sm:p-5 transition-all hover:border-neutral-300">
                <MetaLabel>Total Orders</MetaLabel>
                <p className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-black tracking-tight mt-1.5">
                  {loading ? '—' : stats.total}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1">
                  Lifetime placed
                </p>
              </div>

              <div className="border border-neutral-200 bg-white p-4 sm:p-5 transition-all hover:border-neutral-300">
                <MetaLabel>Total Spent</MetaLabel>
                <p className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-black tracking-tight mt-1.5">
                  {loading ? '—' : formatCurrency(stats.spent)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-neutral-400 mt-1">
                  Across paid orders
                </p>
              </div>
            </div>
          </aside>

          {/* ---- Right Section: Top Search & Sort + Rectangular Expandable Cards ---- */}
          <section className="lg:col-span-8 xl:col-span-9 min-w-0 space-y-6">
            {/* Right Top Toolbar: Search bar and Sort By dropdown */}
            {!loading && !error && orders.length > 0 && (
              <div className="border border-neutral-200 bg-white p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Search input */}
                <div className="relative flex-1 min-w-0">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by order no., product, tracking..."
                    aria-label="Search orders"
                    className="h-10 w-full pl-9 rounded-none border-neutral-200 text-xs"
                  />
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-400 pointer-events-none"
                  />
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center gap-2.5 flex-shrink-0 self-end sm:self-auto">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500 whitespace-nowrap">
                    Sort By
                  </span>
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      aria-label="Sort orders"
                      className="h-10 appearance-none bg-white border border-neutral-200 pl-3.5 pr-8 text-xs font-medium text-neutral-800 focus:outline-none focus:border-black cursor-pointer transition-colors"
                    >
                      {SORT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] pointer-events-none text-neutral-400"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Orders list / status states */}
            {loading ? (
              <div className="space-y-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : error ? (
              <div className="border border-rose-200 bg-rose-50/50 px-6 py-14 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-rose-100 flex items-center justify-center mx-auto mb-5 text-rose-500">
                  <FontAwesomeIcon icon={faCircleExclamation} className="text-xl" />
                </div>
                <h2 className="text-xl font-display font-bold uppercase tracking-tighter mb-2">
                  Something Went Wrong
                </h2>
                <p className="text-sm text-neutral-600 mb-6 max-w-sm mx-auto">{error}</p>
                <Button variant="outline" onClick={() => loadOrders(true)} className="cursor-pointer">
                  Try Again
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-20 px-6 text-center border border-neutral-200 bg-white">
                <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center mx-auto mb-6 text-neutral-300">
                  <FontAwesomeIcon icon={faBox} className="text-2xl" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold uppercase tracking-tighter mb-3">
                  No Orders Yet
                </h2>
                <p className="text-neutral-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                  Once you place your first order it will appear here, with tracking, invoices and a
                  one-tap reorder.
                </p>
                <Button asChild>
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="py-20 text-center border border-neutral-200 bg-white">
                <h2 className="text-xl font-display font-bold uppercase tracking-tighter mb-3">
                  No Matching Orders
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                  Nothing in your history matches these filters.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusFilter('all');
                    setQuery('');
                    setSortBy('recent');
                  }}
                  className="cursor-pointer"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {visibleOrders.slice(0, visibleCount).map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      expanded={expandedId === order.id}
                      onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                      onReorder={handleReorder}
                      onBuyAgain={handleBuyAgain}
                      onOpenReview={handleOpenReview}
                      reviewMap={reviewMap}
                      busy={reorderingId === order.id}
                      busyItemId={buyingItemId}
                    />
                  ))}
                </div>

                {visibleCount < visibleOrders.length && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                      className="cursor-pointer"
                    >
                      Load Older Orders
                    </Button>
                  </div>
                )}

                <p className="mt-6 text-xs text-neutral-400 text-center">
                  Showing {Math.min(visibleCount, visibleOrders.length)} of {visibleOrders.length}
                  {hasFilters ? ' matching' : ''} {visibleOrders.length === 1 ? 'order' : 'orders'}
                </p>
              </>
            )}

            {/* Support footer */}
            {!loading && !error && orders.length > 0 && (
              <div className="mt-10 border border-neutral-200 bg-neutral-50/60 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <h3 className="text-base font-display font-bold uppercase tracking-tight mb-1">
                    Need Help With An Order?
                  </h3>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Quote your order number and our team will pick it up from there.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="flex-shrink-0">
                  <Link href="/contact">
                    <FontAwesomeIcon icon={faHeadset} className="mr-2 text-[11px]" />
                    Contact Support
                  </Link>
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* ---- Interactive Review Modal ---- */}
      <AnimatePresence>
        {reviewModalItem && (() => {
          const itemKey = (reviewModalItem.product_id || '').toLowerCase();
          const sanityKey = (reviewModalItem.product?.sanityId || '').toLowerCase();
          const existingReview = reviewMap[itemKey] || (sanityKey ? reviewMap[sanityKey] : undefined);
          const isEdit = Boolean(existingReview);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseReview}
                className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              />

              {/* Modal Dialog */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-lg bg-white border border-neutral-200 shadow-2xl p-6 sm:p-7 z-10 space-y-5"
              >
                {/* Header with Close */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-display font-bold uppercase tracking-tight text-neutral-900">
                      {isEdit ? 'Update Your Review' : 'Rate & Review'}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {isEdit
                        ? 'Change your rating or update your feedback below'
                        : 'Share your experience to help other shoppers'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseReview}
                    disabled={submittingReview}
                    className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-black border border-neutral-200 hover:border-neutral-400 transition-colors cursor-pointer"
                    aria-label="Close review dialog"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-sm" />
                  </button>
                </div>

                {/* Product Info Preview */}
                <div className="flex items-center gap-3.5 p-3 bg-neutral-50 border border-neutral-200">
                  <div className="w-12 h-14 bg-white border border-neutral-200 overflow-hidden flex-shrink-0">
                    {reviewModalItem.product?.image ? (
                      <img
                        src={reviewModalItem.product.image}
                        alt={itemLabel(reviewModalItem)}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <FontAwesomeIcon icon={faBox} className="text-xs" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-neutral-900 truncate">
                      {itemLabel(reviewModalItem)}
                    </p>
                    <p className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">
                      {[
                        reviewModalItem.size ? `Size: ${reviewModalItem.size}` : null,
                        reviewModalItem.color ? `Color: ${reviewModalItem.color}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>

                {/* 5-Star Interactive Rating Picker */}
                <div className="text-center py-2 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-500">
                    {isEdit ? 'Your Updated Rating' : 'Overall Rating'}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isLit = hoverRating ? star <= hoverRating : star <= selectedRating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setSelectedRating(star)}
                          className="p-1.5 text-2xl sm:text-3xl transition-transform hover:scale-115 cursor-pointer focus:outline-none"
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        >
                          <FontAwesomeIcon
                            icon={faStar}
                            className={`transition-colors ${isLit ? 'text-[#D4AF37]' : 'text-neutral-200'}`}
                          />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                    {
                      {
                        1: '1 Star — Poor',
                        2: '2 Stars — Fair',
                        3: '3 Stars — Good',
                        4: '4 Stars — Very Good',
                        5: '5 Stars — Excellent',
                      }[hoverRating || selectedRating]
                    }
                  </p>
                </div>

                {/* Review Comment Textarea */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="review-comment-input"
                    className="block text-[10px] font-bold uppercase tracking-[0.16em] text-neutral-600"
                  >
                    Your Feedback (Optional)
                  </label>
                  <textarea
                    id="review-comment-input"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="What did you like or dislike about this product? How is the fit and quality?"
                    maxLength={2000}
                    rows={3}
                    className="w-full border border-neutral-200 p-3 text-xs text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-black resize-none"
                  />
                  <p className="text-[10px] text-neutral-400 text-right">
                    {reviewComment.length}/2000 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-neutral-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCloseReview}
                    disabled={submittingReview}
                    className="text-[10px] tracking-[0.15em] cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="text-[10px] tracking-[0.15em] bg-black text-white hover:bg-neutral-800 cursor-pointer"
                  >
                    {submittingReview ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-[10px]" />
                        Saving…
                      </>
                    ) : isEdit ? (
                      'Update Review'
                    ) : (
                      'Submit Review'
                    )}
                  </Button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};

export default OrdersClient;
