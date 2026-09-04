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
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { useToast } from '../../../ui/use-toast';
import { imageProps } from '../../../lib/image';
import type { Product } from '../../../types/product';

/* ------------------------------------------------------------------ */
/* Types — mirror of `/api/account/orders`                             */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
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

  const copy = async () => {
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
  <div className="border border-neutral-200 animate-pulse">
    <div className="h-20 bg-neutral-50 border-b border-neutral-100" />
    <div className="p-6 space-y-5">
      <div className="h-2 bg-neutral-100 w-2/3" />
      <div className="flex gap-4">
        <div className="w-20 h-24 bg-neutral-100 flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-2 bg-neutral-100 w-1/3" />
          <div className="h-2 bg-neutral-100 w-3/5" />
          <div className="h-2 bg-neutral-100 w-1/4" />
        </div>
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Order card                                                          */
/* ------------------------------------------------------------------ */

interface OrderCardProps {
  order: Order;
  expanded: boolean;
  onToggle: () => void;
  onReorder: (order: Order) => void;
  onBuyAgain: (item: OrderItem) => void;
  busy: boolean;
  busyItemId: string | null;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  expanded,
  onToggle,
  onReorder,
  onBuyAgain,
  busy,
  busyItemId,
}) => {
  const items = order.order_items ?? [];
  const unitCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const discount = Number(order.discount_amount || 0);
  const shipping = Number(order.shipping_cost || 0);

  const cancelled = order.order_status === 'cancelled';
  const isPaid = order.payment_status === 'paid';
  const address = order.shipping_address;

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

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border border-neutral-200 bg-white hover:border-neutral-300 transition-colors"
    >
      {/* ---- Summary strip: the four facts a customer scans for ---- */}
      <header className="bg-neutral-50/80 border-b border-neutral-200 px-5 sm:px-7 py-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
          <div>
            <MetaLabel>Order Placed</MetaLabel>
            <p className="text-xs sm:text-sm font-medium text-neutral-800 mt-1.5">
              {formatDate(order.created_at)}
            </p>
          </div>

          <div className="min-w-0">
            <MetaLabel>Order Number</MetaLabel>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-xs sm:text-sm font-medium text-neutral-800 truncate">
                {order.order_number}
              </p>
              <CopyButton value={order.order_number} label="order number" />
            </div>
          </div>

          <div>
            <MetaLabel>{items.length === 1 ? 'Item' : 'Items'}</MetaLabel>
            <p className="text-xs sm:text-sm font-medium text-neutral-800 mt-1.5">
              {unitCount} {unitCount === 1 ? 'piece' : 'pieces'}
            </p>
          </div>

          <div className="lg:text-right">
            <MetaLabel>Order Total</MetaLabel>
            <p className="font-display font-bold text-base sm:text-lg text-black mt-1">
              {formatCurrency(order.total)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-5">
          <Pill label={orderMeta.label} className={orderMeta.pill} />
          <Pill label={paymentMeta.label} className={paymentMeta.pill} />
          {order.coupon_code && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] border border-neutral-200 bg-white text-neutral-500">
              <FontAwesomeIcon icon={faTag} className="text-[8px]" />
              {order.coupon_code}
            </span>
          )}
        </div>
      </header>

      <div className="px-5 sm:px-7 py-6">
        {notice && (
          <div className={`flex items-start gap-3 border px-4 py-3 mb-6 ${notice.tone}`}>
            <FontAwesomeIcon icon={notice.icon} className="text-xs mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">{notice.text}</p>
          </div>
        )}

        {/* ---- Where it is ---- */}
        {!cancelled && isPaid && (
          <div className="mb-6">
            <FulfilmentTracker status={order.order_status} />

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
              ) : (
                <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                  Tracking appears here once your parcel ships
                </span>
              )}

              {order.estimated_delivery && order.order_status !== 'delivered' && (
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-neutral-500">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-neutral-300" />
                  Expected
                  <span className="font-bold text-black">{formatDate(order.estimated_delivery)}</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ---- What was bought ---- */}
        <ul className="divide-y divide-neutral-100 border-t border-neutral-100">
          {items.map((item) => {
            const name = itemLabel(item);
            const slug = item.product?.slug;
            const href = slug ? `/product/${slug}` : null;
            const img = imageProps(item.product?.image, {
              widths: [96, 160, 240],
              sizes: THUMB_SIZES,
              fallbackWidth: 160,
            });
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.price || 0);

            const thumbnail = img.src ? (
              <img
                src={img.src}
                srcSet={img.srcSet}
                sizes={img.sizes}
                alt={name}
                width={160}
                height={200}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="w-full h-full flex items-center justify-center text-neutral-300">
                <FontAwesomeIcon icon={faBox} />
              </span>
            );

            return (
              <li key={item.id} className="flex gap-4 sm:gap-5 py-5">
                <div className="w-16 h-20 sm:w-20 sm:h-24 bg-neutral-50 flex-shrink-0 overflow-hidden">
                  {href ? (
                    <Link href={href} className="block w-full h-full">
                      {thumbnail}
                    </Link>
                  ) : (
                    thumbnail
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {item.product?.category && (
                    <p className="text-[9px] uppercase tracking-[0.18em] text-neutral-400 mb-1">
                      {item.product.category}
                    </p>
                  )}

                  {href ? (
                    <Link
                      href={href}
                      className="text-sm sm:text-base font-display leading-snug hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <p className="text-sm sm:text-base font-display leading-snug">{name}</p>
                  )}

                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-1.5">
                    {[item.size && `Size ${item.size}`, item.color, `Qty ${quantity}`]
                      .filter(Boolean)
                      .join('  •  ')}
                  </p>

                  {item.product?.available ? (
                    <button
                      type="button"
                      onClick={() => onBuyAgain(item)}
                      disabled={busyItemId === item.id}
                      className="mt-3 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <FontAwesomeIcon
                        icon={busyItemId === item.id ? faSpinner : faBagShopping}
                        className={busyItemId === item.id ? 'animate-spin text-[10px]' : 'text-[10px]'}
                      />
                      Buy Again
                    </button>
                  ) : (
                    <p className="mt-3 text-[10px] uppercase tracking-[0.15em] text-neutral-300">
                      No longer available
                    </p>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-display font-bold text-sm sm:text-base whitespace-nowrap">
                    {formatCurrency(unitPrice * quantity)}
                  </p>
                  {quantity > 1 && (
                    <p className="text-[10px] text-neutral-400 mt-1 whitespace-nowrap">
                      {formatCurrency(unitPrice)} each
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ---- Actions ---- */}
      <div className="px-5 sm:px-7 py-4 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors cursor-pointer"
        >
          {expanded ? 'Hide Details' : 'Order Details'}
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`text-[8px] transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors"
          >
            <FontAwesomeIcon icon={faHeadset} className="text-[10px]" />
            Need Help
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onReorder(order)}
            disabled={busy}
            className="text-[10px] tracking-[0.15em] cursor-pointer"
          >
            <FontAwesomeIcon
              icon={busy ? faSpinner : faRotateRight}
              className={busy ? 'animate-spin mr-2 text-[10px]' : 'mr-2 text-[10px]'}
            />
            Order Again
          </Button>
        </div>
      </div>

      {/* ---- Details: address, money, delivery ---- */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-neutral-100 bg-neutral-50/60"
          >
            <div className="px-5 sm:px-7 py-7 grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      {/* An unpaid or refunded order was never "paid" — say what is true. */}
                      {isPaid ? 'Total Paid' : 'Order Total'}
                    </dt>
                    <dd className="font-display font-bold text-base text-black">
                      {formatCurrency(order.total)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-4 pt-4 border-t border-neutral-200 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400">
                    Method:{' '}
                    <span className="text-neutral-700 font-bold">
                      {order.payment_provider === 'razorpay'
                        ? 'Razorpay (Card / UPI / Netbanking)'
                        : order.payment_provider || 'Online'}
                    </span>
                  </p>
                  {order.razorpay_payment_id && (
                    <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 break-all">
                      Payment ID:{' '}
                      <span className="text-neutral-700 normal-case tracking-normal">
                        {order.razorpay_payment_id}
                      </span>
                    </p>
                  )}
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
                      Tracking Number
                    </dt>
                    <dd className="mt-1 font-medium text-neutral-900 break-all">
                      {order.tracking_number || 'Not assigned yet'}
                    </dd>
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
                  {(order.customer_email || order.customer_phone) && (
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400">
                        Contact On Order
                      </dt>
                      <dd className="mt-1 text-neutral-700 break-all">
                        {[order.customer_email, order.customer_phone].filter(Boolean).join(' • ')}
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
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
    if (isAuthenticated) loadOrders();
  }, [isAuthenticated, loadOrders]);

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

  const statTiles = [
    { label: 'Total Orders', value: String(stats.total) },
    { label: 'In Progress', value: String(stats.inProgress) },
    { label: 'Delivered', value: String(stats.delivered) },
    { label: 'Total Spent', value: formatCurrency(stats.spent) },
  ];

  return (
    <div className="pt-24 pb-24 min-h-screen bg-white">
      <div className="container mx-auto px-6 md:px-12 lg:px-24">
        {/* ---- Breadcrumb ---- */}
        <nav aria-label="Breadcrumb" className="pt-8">
          <ol className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-400">
            <li>
              <Link href="/" className="hover:text-black transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/account" className="hover:text-black transition-colors">
                My Account
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-black">Orders</li>
          </ol>
        </nav>

        {/* ---- Header ---- */}
        <header className="mt-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tighter">
              My Orders
            </h1>
            <p className="text-neutral-500 text-sm mt-2">
              {loading
                ? 'Loading your order history…'
                : orders.length === 0
                  ? 'You have not placed an order yet.'
                  : `${orders.length} ${orders.length === 1 ? 'order' : 'orders'} placed · every purchase, shipment and payment in one place.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadOrders(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 h-11 px-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 hover:border-black hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
            >
              <FontAwesomeIcon
                icon={faRotateRight}
                className={refreshing ? 'animate-spin text-[10px]' : 'text-[10px]'}
              />
              {refreshing ? 'Refreshing' : 'Refresh'}
            </button>

            <Button asChild variant="outline" className="h-11 text-[10px] tracking-[0.18em]">
              <Link href="/shop">
                Continue Shopping
                <FontAwesomeIcon icon={faArrowRight} className="ml-2 text-[10px]" />
              </Link>
            </Button>
          </div>
        </header>

        {/* ---- At-a-glance ---- */}
        {!loading && !error && orders.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 border border-neutral-200 mb-10">
            {statTiles.map((tile, index) => (
              <div
                key={tile.label}
                className={`px-6 py-6 ${index % 2 === 1 ? 'border-l border-neutral-200' : ''} ${
                  index < 2 ? 'border-b border-neutral-200 lg:border-b-0' : ''
                } ${index === 2 ? 'lg:border-l lg:border-neutral-200' : ''}`}
              >
                <MetaLabel>{tile.label}</MetaLabel>
                <p className="font-display font-bold text-2xl md:text-3xl tracking-tighter mt-2">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ---- Filters ---- */}
        {!loading && !error && orders.length > 0 && (
          <div className="border-y border-neutral-100 py-4 mb-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {STATUS_TABS.map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`flex-shrink-0 px-4 py-2 text-[11px] font-bold uppercase tracking-widest border transition-colors cursor-pointer ${
                        statusFilter === tab.value
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                      }`}
                    >
                      {tab.label} ({tabCounts[tab.value] ?? 0})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative flex-1 lg:flex-none">
                  <Input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Order no., product, tracking"
                    aria-label="Search orders"
                    className="h-11 w-full lg:w-64 pl-9 rounded-none border-neutral-200 text-xs"
                  />
                  <FontAwesomeIcon
                    icon={faMagnifyingGlass}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-neutral-300 pointer-events-none"
                  />
                </div>

                <div className="relative flex-shrink-0">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort orders"
                    className="h-11 appearance-none bg-white border border-neutral-200 pl-4 pr-9 text-xs font-medium text-neutral-800 focus:outline-none focus:border-black cursor-pointer"
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
          </div>
        )}

        {/* ---- Body ---- */}
        {loading ? (
          <div className="space-y-8">
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
          <div className="py-20 px-6 text-center border border-neutral-200">
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
          <div className="py-24 text-center">
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
            <div className="space-y-8">
              {visibleOrders.slice(0, visibleCount).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  expanded={expandedId === order.id}
                  onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  onReorder={handleReorder}
                  onBuyAgain={handleBuyAgain}
                  busy={reorderingId === order.id}
                  busyItemId={buyingItemId}
                />
              ))}
            </div>

            {visibleCount < visibleOrders.length && (
              <div className="mt-10 text-center">
                <Button
                  variant="outline"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                  className="cursor-pointer"
                >
                  Load Older Orders
                </Button>
              </div>
            )}

            <p className="mt-10 text-xs text-neutral-400 text-center">
              Showing {Math.min(visibleCount, visibleOrders.length)} of {visibleOrders.length}
              {hasFilters ? ' matching' : ''} {visibleOrders.length === 1 ? 'order' : 'orders'}
            </p>
          </>
        )}

        {/* ---- Support footer ---- */}
        {!loading && !error && orders.length > 0 && (
          <div className="mt-16 border border-neutral-200 bg-neutral-50/60 px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h2 className="text-lg font-display font-bold uppercase tracking-tight mb-1.5">
                Need Help With An Order?
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed">
                Quote your order number and our team will pick it up from there.
              </p>
            </div>
            <Button asChild variant="outline" className="flex-shrink-0">
              <Link href="/contact">
                <FontAwesomeIcon icon={faHeadset} className="mr-2 text-[11px]" />
                Contact Support
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersClient;
