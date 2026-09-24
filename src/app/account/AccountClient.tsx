'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faArrowRight,
  faBagShopping,
  faBox,
  faCheck,
  faCircleCheck,
  faChevronRight,
  faEnvelope,
  faGauge,
  faHeadset,
  faHeart,
  faLocationDot,
  faLock,
  faPen,
  faPhone,
  faPlus,
  faRightFromBracket,
  faShieldHalved,
  faSpinner,
  faTrash,
  faTruckFast,
  faUser,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { useToast } from '../../ui/use-toast';
import { sizedImageUrl } from '../../lib/image';
import { cn } from '../../lib/utils';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  quantity: number;
  product?: { name: string; image: string; slug: string | null } | null;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  payment_status: string;
  order_status: string;
  tracking_number?: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  postalCode: '',
  isDefault: false,
};

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

/** Orders shown on the dashboard; the full history lives at /account/orders. */
const RECENT_ORDER_COUNT = 3;

/**
 * The account's pages.
 *
 * One is rendered at a time against the left rail, so each is a destination in
 * its own right rather than a waypoint in a long scroll.
 */
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: faGauge },
  { id: 'orders', label: 'Orders', icon: faBox },
  { id: 'profile', label: 'Profile', icon: faUser },
  { id: 'addresses', label: 'Addresses', icon: faLocationDot },
  { id: 'security', label: 'Security', icon: faShieldHalved },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Awaiting Payment',
  confirmed: 'Confirmed',
  processing: 'Being Packed',
  shipped: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const ORDER_STATUS_PILLS: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  shipped: 'bg-violet-50 text-violet-700 border-violet-200',
  delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
};

/** Statuses that mean an order is still on its way somewhere. */
const OPEN_STATUSES = new Set(['pending', 'confirmed', 'processing', 'shipped']);

const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const formatCurrency = (value: unknown) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatMonthYear = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

/** Up to two initials, so the monogram stays legible at any size. */
const initialsOf = (name: string, email: string) => {
  const source = (name || '').trim() || (email || '').split('@')[0] || '';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part[0]);
  return (letters.join('') || 'GM').toUpperCase();
};

const addressLines = (address: Address) =>
  [
    address.address_line_1,
    address.address_line_2,
    address.landmark ? `Near ${address.landmark}` : '',
    `${address.city}, ${address.state} ${address.postal_code}`,
    address.country,
  ].filter(Boolean);

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const MetaLabel: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  // `cn` merges rather than appends, so a caller overriding the text colour
  // wins regardless of class order.
  <p className={cn('text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-400', className)}>
    {children}
  </p>
);

const SectionHeading: React.FC<{
  id: string;
  icon: IconDefinition;
  title: string;
  description?: string;
  action?: React.ReactNode;
}> = ({ id, icon, title, description, action }) => (
  <div
    id={id}
    className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b border-neutral-200"
  >
    <div className="flex items-start gap-3">
      <span className="w-9 h-9 border border-neutral-200 flex items-center justify-center text-neutral-400 flex-shrink-0 mt-0.5">
        <FontAwesomeIcon icon={icon} className="text-xs" />
      </span>
      <div>
        <h2 className="text-xl md:text-2xl font-display font-bold uppercase tracking-tighter leading-none">
          {title}
        </h2>
        {description && <p className="text-xs text-neutral-500 mt-1.5">{description}</p>}
      </div>
    </div>
    {action}
  </div>
);

/** One label/value row in a read-only detail list. */
const DetailRow: React.FC<{
  icon: IconDefinition;
  label: string;
  value?: string | null;
  fallback?: string;
  locked?: boolean;
}> = ({ icon, label, value, fallback = 'Not added yet', locked }) => (
  <div className="flex items-start gap-4 py-4">
    <span className="w-8 h-8 bg-neutral-50 flex items-center justify-center text-neutral-400 flex-shrink-0">
      <FontAwesomeIcon icon={icon} className="text-[11px]" />
    </span>
    <div className="min-w-0 flex-1">
      <MetaLabel>{label}</MetaLabel>
      <p
        className={`text-sm mt-1 break-words ${value ? 'text-neutral-900 font-medium' : 'text-neutral-400 italic'}`}
      >
        {value || fallback}
      </p>
    </div>
    {locked && (
      <span
        title="This cannot be changed here"
        className="text-neutral-300 flex-shrink-0 mt-1"
        aria-label="Locked"
      >
        <FontAwesomeIcon icon={faLock} className="text-[10px]" />
      </span>
    )}
  </div>
);

/** Labelled form field with inline validation text. */
const Field: React.FC<{
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ label, error, hint, children, className = '' }) => (
  <div className={className}>
    <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-neutral-500 mb-2">
      {label}
    </label>
    {children}
    {error ? (
      <p className="text-[10px] text-rose-600 mt-1.5">{error}</p>
    ) : hint ? (
      <p className="text-[10px] text-neutral-400 mt-1.5">{hint}</p>
    ) : null}
  </div>
);

/** Square checkbox that matches the sharp-edged form language. */
const CheckBox: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className="flex items-center gap-3 text-left group disabled:opacity-50 cursor-pointer"
  >
    <span
      className={`w-5 h-5 border flex items-center justify-center flex-shrink-0 transition-colors ${
        checked
          ? 'bg-black border-black text-white'
          : 'bg-white border-neutral-300 group-hover:border-black'
      }`}
    >
      {checked && <FontAwesomeIcon icon={faCheck} className="text-[9px]" />}
    </span>
    <span className="text-xs text-neutral-600">{label}</span>
  </button>
);

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-neutral-100 animate-pulse ${className}`} />
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/**
 * The customer dashboard.
 *
 * One scrolling page rather than tabbed panes: everything here is short, and a
 * customer arriving from "My Account" usually wants one specific thing — an
 * order, an address, a phone number — which a sticky section nav reaches in a
 * single click without hiding the rest.
 *
 * Orders are summarised, never listed in full; `/account/orders` owns that.
 */
const AccountClient: React.FC = () => {
  const { user, profile, loading: authLoading, isAuthenticated, signOut, refreshProfile } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const { toast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [details, setDetails] = useState<{
    fullName: string;
    email: string;
    phone: string;
    memberSince: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  /** Which page the right-hand column is showing. */
  const [activeSection, setActiveSection] = useState<SectionId>('overview');

  // ---- Profile editing ----
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [profileErrors, setProfileErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [savingProfile, setSavingProfile] = useState(false);

  // ---- Address editing ----
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Partial<Record<keyof AddressForm, string>>>({});
  const [savingAddress, setSavingAddress] = useState(false);
  const [pendingAddressId, setPendingAddressId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ---- Auth gate ---- */

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [authLoading, isAuthenticated, router]);

  /* ---- Data ---- */

  const loadAddresses = useCallback(async () => {
    try {
      const res = await fetch('/api/account/addresses', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.addresses)) setAddresses(data.addresses);
    } catch (err) {
      console.error('Failed to load addresses:', err);
    }
  }, []);

  const loadAccount = useCallback(async () => {
    setLoading(true);
    // The three reads are independent, so one slow or failing endpoint never
    // holds up the rest of the dashboard.
    const [profileRes, ordersRes] = await Promise.allSettled([
      fetch('/api/account/profile', { cache: 'no-store' }),
      fetch('/api/account/orders', { cache: 'no-store' }),
    ]);

    if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
      const data = await profileRes.value.json().catch(() => ({}));
      if (data?.profile) {
        setDetails({
          fullName: data.profile.fullName || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          memberSince: data.profile.memberSince || null,
        });
      }
      // The same payload carries the address book, so the first paint needs
      // no second request.
      if (Array.isArray(data?.addresses)) setAddresses(data.addresses);
    }

    if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
      const data = await ordersRes.value.json().catch(() => ({}));
      if (Array.isArray(data?.orders)) setOrders(data.orders);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadAccount();
  }, [isAuthenticated, loadAccount]);

  /* ---- Derived ---- */

  const displayName = details?.fullName || profile?.full_name || '';
  const email = details?.email || profile?.email || user?.email || '';
  const avatarUrl = typeof profile?.avatar_url === 'string' ? profile.avatar_url : '';
  const initials = initialsOf(displayName, email);
  const memberSince = formatMonthYear(details?.memberSince || user?.created_at);

  /** Which provider the session was issued against, for the security panel. */
  const signInProvider = useMemo(() => {
    const provider =
      (user?.app_metadata?.provider as string | undefined) ||
      (user?.identities?.[0]?.provider as string | undefined) ||
      'email';
    return provider === 'google' ? 'Google' : 'Email & Password';
  }, [user]);

  const stats = useMemo(() => {
    let open = 0;
    let spent = 0;
    for (const order of orders) {
      if (order.order_status !== 'cancelled' && OPEN_STATUSES.has(order.order_status)) open += 1;
      if (order.payment_status === 'paid') spent += Number(order.total || 0);
    }
    return { total: orders.length, open, spent };
  }, [orders]);

  const recentOrders = orders.slice(0, RECENT_ORDER_COUNT);
  const defaultAddress = addresses.find((a) => a.is_default) || null;

  /**
   * The default flag is not something this form can switch off.
   *
   * A first address is always the default, and un-defaulting the current one
   * would leave the account with none — the way to change it is to promote a
   * different address. Locking the box keeps the form honest rather than
   * letting a customer uncheck something the server will ignore.
   */
  const defaultLocked =
    addresses.length === 0 || (editingAddressId !== null && defaultAddress?.id === editingAddressId);

  /* ---- Profile actions ---- */

  /**
   * Switch the right-hand column to another page.
   *
   * Scrolls back to the top because these read as separate pages: landing
   * halfway down a short one because the previous one was long is the kind of
   * thing that makes a tabbed layout feel broken.
   */
  const goToSection = (id: SectionId) => {
    setActiveSection(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openProfileEditor = () => {
    setProfileForm({ fullName: displayName, phone: details?.phone || '' });
    setProfileErrors({});
    setEditingProfile(true);
  };

  const saveProfile = async () => {
    const errors: { fullName?: string; phone?: string } = {};
    if (!profileForm.fullName.trim()) errors.fullName = 'Please enter your name.';
    if (profileForm.phone.trim() && !PHONE_RE.test(profileForm.phone.trim())) {
      errors.phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingProfile(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: profileForm.fullName.trim(),
          phone: profileForm.phone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: 'Could not save',
          description: data.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      setDetails((current) =>
        current
          ? {
              ...current,
              fullName: data.profile?.fullName ?? profileForm.fullName.trim(),
              phone: data.profile?.phone ?? profileForm.phone.trim(),
            }
          : current
      );
      // Keeps the navbar greeting in step with what was just saved.
      await refreshProfile();
      setEditingProfile(false);
      toast({ title: 'Profile updated', description: 'Your details have been saved.' });
    } catch (err) {
      console.error('Profile save failed:', err);
      toast({
        title: 'Could not save',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  /* ---- Address actions ---- */

  const openAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        fullName: address.full_name || '',
        phone: address.phone || '',
        addressLine1: address.address_line_1 || '',
        addressLine2: address.address_line_2 || '',
        landmark: address.landmark || '',
        city: address.city || '',
        state: address.state || '',
        postalCode: address.postal_code || '',
        isDefault: address.is_default,
      });
    } else {
      setEditingAddressId(null);
      // Pre-fill the person, not the place: a new address is nearly always for
      // the same recipient.
      setAddressForm({
        ...EMPTY_ADDRESS,
        fullName: displayName,
        phone: details?.phone || '',
        isDefault: addresses.length === 0,
      });
    }
    setAddressErrors({});
    setAddressDialogOpen(true);
  };

  const validateAddress = (form: AddressForm) => {
    const errors: Partial<Record<keyof AddressForm, string>> = {};
    if (!form.fullName.trim()) errors.fullName = 'Please enter the recipient’s name.';
    if (!PHONE_RE.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit mobile number.';
    if (form.addressLine1.trim().length < 5) errors.addressLine1 = 'Enter a complete street address.';
    if (!form.city.trim()) errors.city = 'Please enter a city.';
    if (!form.state.trim()) errors.state = 'Please enter a state.';
    if (!PIN_RE.test(form.postalCode.trim())) errors.postalCode = 'Enter a valid 6-digit PIN code.';
    return errors;
  };

  const saveAddress = async () => {
    const errors = validateAddress(addressForm);
    setAddressErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSavingAddress(true);
    try {
      const payload = {
        ...(editingAddressId ? { id: editingAddressId } : {}),
        fullName: addressForm.fullName.trim(),
        phone: addressForm.phone.trim(),
        addressLine1: addressForm.addressLine1.trim(),
        addressLine2: addressForm.addressLine2.trim(),
        landmark: addressForm.landmark.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
        isDefault: addressForm.isDefault,
      };

      const res = await fetch('/api/account/addresses', {
        method: editingAddressId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: 'Could not save address',
          description: data.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      await loadAddresses();
      setAddressDialogOpen(false);
      toast({
        title: editingAddressId ? 'Address updated' : 'Address saved',
        description: data.staleCopyRemains
          ? 'Saved. The previous version is kept because it is on a past order.'
          : 'Your address book is up to date.',
      });
    } catch (err) {
      console.error('Address save failed:', err);
      toast({
        title: 'Could not save address',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingAddress(false);
    }
  };

  const makeDefault = async (id: string) => {
    setPendingAddressId(id);
    // Optimistic: the change is a single flag and the reload below is the
    // source of truth, so the card responds immediately.
    setAddresses((current) => current.map((a) => ({ ...a, is_default: a.id === id })));
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast({
          title: 'Could not update',
          description: data.error || 'Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Default address updated' });
      }
    } catch (err) {
      console.error('Set default failed:', err);
    } finally {
      await loadAddresses();
      setPendingAddressId(null);
    }
  };

  const deleteAddress = async (id: string) => {
    setPendingAddressId(id);
    try {
      const res = await fetch(`/api/account/addresses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast({
          title: 'Could not remove address',
          description: data.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      await loadAddresses();
      toast({ title: 'Address removed' });
    } catch (err) {
      console.error('Address delete failed:', err);
      toast({
        title: 'Could not remove address',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
      });
    } finally {
      setConfirmDeleteId(null);
      setPendingAddressId(null);
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
    { label: 'Total Orders', value: String(stats.total), icon: faBox },
    { label: 'In Progress', value: String(stats.open), icon: faTruckFast },
    { label: 'Saved Items', value: String(wishlistCount), icon: faHeart },
    { label: 'Lifetime Spend', value: formatCurrency(stats.spent), icon: faBagShopping },
  ];

  const quickActions = [
    {
      icon: faBox,
      title: 'Track Orders',
      description:
        stats.open > 0
          ? `${stats.open} ${stats.open === 1 ? 'order is' : 'orders are'} on the way`
          : 'Every order, invoice and shipment',
      href: '/account/orders',
    },
    {
      icon: faHeart,
      title: 'Wishlist',
      description:
        wishlistCount > 0
          ? `${wishlistCount} ${wishlistCount === 1 ? 'piece' : 'pieces'} saved for later`
          : 'Save the pieces you love',
      href: '/wishlist',
    },
    {
      icon: faHeadset,
      title: 'Get Support',
      description: 'Questions about an order or delivery',
      href: '/contact',
    },
  ];

  return (
    /* Gutters and container match the My Orders and Shop pages exactly, so the
       three sibling pages line up on the same x-axis at every breakpoint. */
    <div className="pt-16 pb-24 min-h-screen bg-white px-4 sm:px-6 md:px-12 lg:px-24">
      <div className="container mx-auto">
        {/* ---- Title row ----
             Page name and the two account-level actions, nothing else. */}
        <header className="pt-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tighter">
            My Account
          </h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                goToSection('profile');
                openProfileEditor();
              }}
              className="inline-flex items-center gap-2 h-10 px-4 bg-[#a6101b] text-white text-[10px] font-bold uppercase tracking-[0.18em] hover:bg-[#8c0d17] active:scale-95 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faPen} className="text-[10px]" />
              Edit Profile
            </button>

            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-2 h-10 px-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 hover:border-black hover:text-black transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faRightFromBracket} className="text-[10px]" />
              Sign Out
            </button>
          </div>
        </header>

        {/* ---- Identity ----
             Avatar and who is signed in, sitting under the page name so the
             title row stays a title row. */}
        <div className="mt-7 flex items-center gap-4 sm:gap-5 min-w-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              width={72}
              height={72}
              // Google avatar URLs 403 when a referrer is sent.
              referrerPolicy="no-referrer"
              className="h-16 w-16 sm:h-[72px] sm:w-[72px] flex-shrink-0 rounded-full border border-neutral-200 object-cover"
            />
          ) : (
            /* Decorative: the name it abbreviates is read out beside it. */
            <span
              aria-hidden="true"
              className="flex h-16 w-16 sm:h-[72px] sm:w-[72px] flex-shrink-0 items-center justify-center rounded-full bg-black font-display text-xl font-bold tracking-tighter text-white sm:text-2xl"
            >
              {initials}
            </span>
          )}

          <div className="min-w-0">
            {loading && !displayName ? (
              <>
                <SkeletonBlock className="h-6 w-48" />
                <SkeletonBlock className="h-3 w-64 mt-2.5" />
              </>
            ) : (
              <>
                <p className="text-lg sm:text-xl font-display font-bold uppercase tracking-tight truncate">
                  {displayName || 'Gorer Mart Member'}
                </p>
                <p className="text-xs sm:text-[13px] text-neutral-500 mt-1 truncate">
                  {[email, memberSince && `Member since ${memberSince}`]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </>
            )}
          </div>
        </div>

        {/* ---- Rail + page ----
             Left column selects, right column is the only section rendered.
             `items-start` keeps the rail from stretching to the tallest page,
             so `sticky` has somewhere to travel. */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <nav
            aria-label="Account sections"
            className="lg:col-span-3 lg:sticky lg:top-24"
          >
            {/* Below lg the rail lies down into a scrollable strip, so it
                never eats the top half of a phone screen. */}
            <ul className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar border-b lg:border-b-0 lg:border-l border-neutral-200 lg:pl-0">
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <li key={section.id} className="flex-shrink-0 lg:w-full">
                    <button
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      onClick={() => goToSection(section.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors cursor-pointer whitespace-nowrap',
                        // The active marker sits *on* the strip's rule rather
                        // than beside it: underline on mobile, left bar on
                        // desktop, each pulled onto the container's border.
                        'border-b-2 -mb-px lg:mb-0 lg:border-b-0 lg:border-l-2 lg:-ml-px',
                        isActive
                          ? 'border-black text-black bg-neutral-50 lg:bg-transparent'
                          : 'border-transparent text-neutral-400 hover:text-black'
                      )}
                    >
                      <FontAwesomeIcon
                        icon={section.icon}
                        className={cn('text-[11px]', isActive ? 'text-black' : 'text-neutral-300')}
                      />
                      {section.label}
                      <FontAwesomeIcon
                        icon={faChevronRight}
                        className={cn(
                          'hidden lg:inline ml-auto text-[8px]',
                          isActive ? 'text-neutral-400' : 'text-transparent'
                        )}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* The page itself. Keyed on the section so switching remounts
              rather than cross-fading one section's state into the next. */}
          <div key={activeSection} className="lg:col-span-9 min-w-0">

            {/* ---- Overview ---- */}
            {activeSection === 'overview' && (
              <>
                <SectionHeading
                  id="overview"
                  icon={faGauge}
                  title="Overview"
                  description="Your account at a glance"
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 border border-neutral-200">
                  {statTiles.map((tile, index) => (
                    <div
                      key={tile.label}
                      className={`px-5 sm:px-6 py-6 ${index % 2 === 1 ? 'border-l border-neutral-200' : ''} ${
                        index < 2 ? 'border-b border-neutral-200 lg:border-b-0' : ''
                      } ${index === 2 ? 'lg:border-l lg:border-neutral-200' : ''}`}
                    >
                      <div className="flex items-center gap-2 text-neutral-300 mb-3">
                        <FontAwesomeIcon icon={tile.icon} className="text-[11px]" />
                        <MetaLabel>{tile.label}</MetaLabel>
                      </div>
                      {loading ? (
                        <SkeletonBlock className="h-7 w-16" />
                      ) : (
                        <p className="font-display font-bold text-2xl md:text-3xl tracking-tighter">
                          {tile.value}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* ---- Quick actions ---- */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.title}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * index, duration: 0.3 }}
                    >
                      <Link
                        href={action.href}
                        className="group relative block h-full border border-neutral-200 p-6 hover:border-black transition-colors overflow-hidden"
                      >
                        <span className="w-11 h-11 bg-black text-white flex items-center justify-center mb-5 group-hover:bg-[#a6101b] transition-colors">
                          <FontAwesomeIcon icon={action.icon} />
                        </span>
                        <h3 className="font-display font-bold uppercase tracking-tight text-base mb-1.5">
                          {action.title}
                        </h3>
                        <p className="text-xs text-neutral-500 leading-relaxed pr-6">{action.description}</p>
                        <FontAwesomeIcon
                          icon={faArrowRight}
                          className="absolute bottom-6 right-6 text-neutral-200 text-xs group-hover:text-black group-hover:translate-x-1 transition-all"
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* ---- Recent orders ---- */}
            {activeSection === 'orders' && (
              <section>
                <SectionHeading
                  id="orders"
                  icon={faBox}
                  title="Recent Orders"
                  description="Your three most recent purchases"
                  action={
                    orders.length > 0 ? (
                      <Link
                        href="/account/orders"
                        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors"
                      >
                        View All Orders
                        <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                      </Link>
                    ) : null
                  }
                />

                {loading ? (
                  <div className="border border-neutral-200 divide-y divide-neutral-100">
                    {[0, 1, 2].map((row) => (
                      <div key={row} className="flex items-center gap-5 px-5 sm:px-6 py-5">
                        <SkeletonBlock className="w-12 h-14 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <SkeletonBlock className="h-3 w-40" />
                          <SkeletonBlock className="h-2 w-24" />
                        </div>
                        <SkeletonBlock className="h-4 w-16" />
                      </div>
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="border border-neutral-200 py-16 px-6 text-center">
                    <span className="w-14 h-14 bg-neutral-50 text-neutral-300 flex items-center justify-center mx-auto mb-5">
                      <FontAwesomeIcon icon={faBox} className="text-xl" />
                    </span>
                    <h3 className="font-display font-bold uppercase tracking-tight text-lg mb-2">
                      No Orders Yet
                    </h3>
                    <p className="text-neutral-500 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
                      When you place your first order it will show up here with live tracking.
                    </p>
                    <Button asChild>
                      <Link href="/shop">Start Shopping</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="border border-neutral-200 divide-y divide-neutral-100">
                    {recentOrders.map((order) => {
                      const items = order.order_items ?? [];
                      const units = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
                      const statusLabel = ORDER_STATUS_LABELS[order.order_status] || order.order_status;
                      const statusPill =
                        ORDER_STATUS_PILLS[order.order_status] ||
                        'bg-neutral-100 text-neutral-600 border-neutral-200';

                      return (
                        <Link
                          key={order.id}
                          href="/account/orders"
                          className="group flex items-center gap-4 sm:gap-5 px-5 sm:px-6 py-5 hover:bg-neutral-50/70 transition-colors"
                        >
                          {/* Overlapping thumbnails read as "one order" at a glance. */}
                          <div className="flex flex-shrink-0">
                            {items.slice(0, 3).map((item, index) => (
                              <div
                                key={item.id}
                                className="w-12 h-14 bg-neutral-100 border-2 border-white overflow-hidden"
                                style={{ marginLeft: index === 0 ? 0 : -14, zIndex: 3 - index }}
                              >
                                {item.product?.image ? (
                                  <img
                                    src={sizedImageUrl(item.product.image, 96)}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="w-full h-full flex items-center justify-center text-neutral-300 text-xs">
                                    <FontAwesomeIcon icon={faBox} />
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-display font-bold tracking-tight truncate">
                              {order.order_number}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-1">
                              {formatDate(order.created_at)} · {units} {units === 1 ? 'piece' : 'pieces'}
                            </p>
                          </div>

                          <span
                            className={`hidden sm:inline-flex items-center px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] border flex-shrink-0 ${statusPill}`}
                          >
                            {statusLabel}
                          </span>

                          <p className="font-display font-bold text-right flex-shrink-0">
                            {formatCurrency(order.total)}
                          </p>

                          <FontAwesomeIcon
                            icon={faArrowRight}
                            className="text-neutral-300 text-xs flex-shrink-0 group-hover:text-black group-hover:translate-x-1 transition-all"
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ---- Profile ---- */}
            {activeSection === 'profile' && (
              <section>
                <SectionHeading
                  id="profile"
                  icon={faPen}
                  title="Profile Details"
                  description="How we address you and reach you about an order"
                  action={
                    !editingProfile ? (
                      <button
                        type="button"
                        onClick={openProfileEditor}
                        disabled={loading}
                        className="inline-flex items-center gap-2 h-10 px-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 hover:border-black hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                        Edit
                      </button>
                    ) : null
                  }
                />

                <div className="border border-neutral-200 px-5 sm:px-7 py-2">
                  <AnimatePresence mode="wait" initial={false}>
                    {editingProfile ? (
                      <motion.div
                        key="edit"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="py-6"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <Field label="Full Name" error={profileErrors.fullName}>
                            <Input
                              value={profileForm.fullName}
                              onChange={(e) =>
                                setProfileForm((form) => ({ ...form, fullName: e.target.value }))
                              }
                              placeholder="Your name"
                              autoComplete="name"
                              className="rounded-none"
                            />
                          </Field>

                          <Field
                            label="Mobile Number"
                            error={profileErrors.phone}
                            hint="Used for delivery updates only"
                          >
                            <Input
                              value={profileForm.phone}
                              onChange={(e) =>
                                setProfileForm((form) => ({
                                  ...form,
                                  phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                                }))
                              }
                              placeholder="10-digit mobile number"
                              inputMode="numeric"
                              autoComplete="tel-national"
                              className="rounded-none"
                            />
                          </Field>

                          <Field
                            label="Email Address"
                            hint="This is your sign-in and cannot be changed here"
                            className="sm:col-span-2"
                          >
                            <Input
                              value={email}
                              readOnly
                              disabled
                              className="rounded-none bg-neutral-100 text-neutral-500 cursor-not-allowed"
                            />
                          </Field>
                        </div>

                        <div className="flex items-center gap-3 mt-7 pt-5 border-t border-neutral-100">
                          <Button
                            onClick={saveProfile}
                            disabled={savingProfile}
                            className="h-11 text-[10px] tracking-[0.18em] cursor-pointer"
                          >
                            {savingProfile && (
                              <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-[10px]" />
                            )}
                            Save Changes
                          </Button>
                          <button
                            type="button"
                            onClick={() => setEditingProfile(false)}
                            disabled={savingProfile}
                            className="h-11 px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="divide-y divide-neutral-100"
                      >
                        <DetailRow icon={faPen} label="Full Name" value={displayName} />
                        <DetailRow icon={faEnvelope} label="Email Address" value={email} locked />
                        <DetailRow
                          icon={faPhone}
                          label="Mobile Number"
                          value={details?.phone}
                          fallback="Add a number so we can reach you about a delivery"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {/* ---- Addresses ---- */}
            {activeSection === 'addresses' && (
              <section>
                <SectionHeading
                  id="addresses"
                  icon={faLocationDot}
                  title="Address Book"
                  description={
                    defaultAddress
                      ? 'Your default address is used to pre-fill checkout'
                      : 'Save an address to speed up checkout'
                  }
                  action={
                    addresses.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => openAddressDialog()}
                        className="inline-flex items-center gap-2 h-10 px-4 border border-neutral-200 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-600 hover:border-black hover:text-black transition-colors cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                        Add Address
                      </button>
                    ) : null
                  }
                />

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SkeletonBlock className="h-52" />
                    <SkeletonBlock className="h-52" />
                  </div>
                ) : addresses.length === 0 ? (
                  <div className="border border-neutral-200 py-16 px-6 text-center">
                    <span className="w-14 h-14 bg-neutral-50 text-neutral-300 flex items-center justify-center mx-auto mb-5">
                      <FontAwesomeIcon icon={faLocationDot} className="text-xl" />
                    </span>
                    <h3 className="font-display font-bold uppercase tracking-tight text-lg mb-2">
                      No Saved Addresses
                    </h3>
                    <p className="text-neutral-500 text-sm mb-7 max-w-xs mx-auto leading-relaxed">
                      Add a delivery address once and checkout will fill it in for every future order.
                    </p>
                    <Button onClick={() => openAddressDialog()} className="cursor-pointer">
                      <FontAwesomeIcon icon={faPlus} className="mr-2 text-[11px]" />
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AnimatePresence mode="popLayout">
                      {addresses.map((address) => {
                        const busy = pendingAddressId === address.id;
                        return (
                          <motion.article
                            key={address.id}
                            layout
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.97 }}
                            transition={{ duration: 0.2 }}
                            className={`relative border p-6 flex flex-col transition-colors ${
                              address.is_default
                                ? 'border-black'
                                : 'border-neutral-200 hover:border-neutral-400'
                            } ${busy ? 'opacity-60' : ''}`}
                          >
                            {address.is_default && (
                              <span className="absolute -top-px -right-px bg-black text-white text-[8px] font-bold uppercase tracking-[0.18em] px-3 py-1.5">
                                Default
                              </span>
                            )}

                            <p className="font-display font-bold uppercase tracking-tight text-base pr-20">
                              {address.full_name}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-1.5">
                              {address.phone}
                            </p>

                            <address className="not-italic text-sm text-neutral-600 leading-relaxed mt-4 space-y-0.5 flex-1">
                              {addressLines(address).map((line, index) => (
                                <p key={index}>{line}</p>
                              ))}
                            </address>

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-6 pt-4 border-t border-neutral-100">
                              {!address.is_default && (
                                <button
                                  type="button"
                                  onClick={() => makeDefault(address.id)}
                                  disabled={busy}
                                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
                                >
                                  <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />
                                  Set Default
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => openAddressDialog(address)}
                                disabled={busy}
                                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-500 hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faPen} className="text-[10px]" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(address.id)}
                                disabled={busy}
                                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-neutral-400 hover:text-[#a6101b] transition-colors disabled:opacity-40 cursor-pointer ml-auto"
                              >
                                <FontAwesomeIcon
                                  icon={busy ? faSpinner : faTrash}
                                  className={busy ? 'animate-spin text-[10px]' : 'text-[10px]'}
                                />
                                Remove
                              </button>
                            </div>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>

                    {/* Add card sits in the grid so the action is where the eye already is. */}
                    <button
                      type="button"
                      onClick={() => openAddressDialog()}
                      className="group border border-dashed border-neutral-300 p-6 min-h-[180px] flex flex-col items-center justify-center text-center hover:border-black hover:bg-neutral-50/60 transition-colors cursor-pointer"
                    >
                      <span className="w-11 h-11 border border-neutral-300 flex items-center justify-center text-neutral-400 mb-4 group-hover:border-black group-hover:bg-black group-hover:text-white transition-colors">
                        <FontAwesomeIcon icon={faPlus} />
                      </span>
                      <span className="font-display font-bold uppercase tracking-tight text-sm">
                        Add New Address
                      </span>
                      <span className="text-xs text-neutral-500 mt-1">
                        {addresses.length} of 10 saved
                      </span>
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* ---- Security ---- */}
            {activeSection === 'security' && (
              <section>
                <SectionHeading
                  id="security"
                  icon={faShieldHalved}
                  title="Security & Access"
                  description="How you sign in to Gorer Mart"
                />

                <div className="border border-neutral-200 px-5 sm:px-7 py-2 divide-y divide-neutral-100">
                  <DetailRow
                    icon={signInProvider === 'Google' ? faGoogle : faLock}
                    label="Sign-in Method"
                    value={
                      signInProvider === 'Google'
                        ? 'Google — signed in with your Google account'
                        : 'Email and password'
                    }
                  />
                  <DetailRow icon={faEnvelope} label="Account Email" value={email} locked />

                  <div className="flex flex-wrap items-center justify-between gap-4 py-5">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Sign out of this device</p>
                      <p className="text-xs text-neutral-500 mt-1">
                        You will need to sign in again to see your orders.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={signOut}
                      className="h-11 text-[10px] tracking-[0.18em] border-neutral-300 hover:border-[#a6101b] hover:bg-[#a6101b] hover:text-white cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} className="mr-2 text-[10px]" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* ---------------- Address dialog ---------------- */}
      <AnimatePresence>
        {addressDialogOpen && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !savingAddress && setAddressDialogOpen(false)}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={editingAddressId ? 'Edit address' : 'Add a new address'}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 16, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="relative bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto no-scrollbar shadow-premium"
            >
              <div className="sticky top-0 bg-white border-b border-neutral-100 px-6 sm:px-8 py-5 flex items-center justify-between z-10">
                <div>
                  <h2 className="text-xl font-display font-bold uppercase tracking-tight">
                    {editingAddressId ? 'Edit Address' : 'New Address'}
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-400 mt-1">
                    Where should we deliver?
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddressDialogOpen(false)}
                  disabled={savingAddress}
                  aria-label="Close"
                  className="w-9 h-9 border border-neutral-200 flex items-center justify-center text-neutral-500 hover:bg-black hover:text-white hover:border-black transition-colors disabled:opacity-40 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} className="text-xs" />
                </button>
              </div>

              <div className="px-6 sm:px-8 py-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Field label="Full Name" error={addressErrors.fullName}>
                  <Input
                    value={addressForm.fullName}
                    onChange={(e) =>
                      setAddressForm((form) => ({ ...form, fullName: e.target.value }))
                    }
                    placeholder="Recipient's name"
                    autoComplete="name"
                    className="rounded-none"
                  />
                </Field>

                <Field label="Mobile Number" error={addressErrors.phone}>
                  <Input
                    value={addressForm.phone}
                    onChange={(e) =>
                      setAddressForm((form) => ({
                        ...form,
                        phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                      }))
                    }
                    placeholder="10-digit mobile number"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="rounded-none"
                  />
                </Field>

                <Field
                  label="Address Line 1"
                  error={addressErrors.addressLine1}
                  className="sm:col-span-2"
                >
                  <Input
                    value={addressForm.addressLine1}
                    onChange={(e) =>
                      setAddressForm((form) => ({ ...form, addressLine1: e.target.value }))
                    }
                    placeholder="Flat / house no., building, street"
                    autoComplete="address-line1"
                    className="rounded-none"
                  />
                </Field>

                <Field label="Address Line 2" className="sm:col-span-2">
                  <Input
                    value={addressForm.addressLine2}
                    onChange={(e) =>
                      setAddressForm((form) => ({ ...form, addressLine2: e.target.value }))
                    }
                    placeholder="Area, colony (optional)"
                    autoComplete="address-line2"
                    className="rounded-none"
                  />
                </Field>

                <Field label="Landmark" className="sm:col-span-2">
                  <Input
                    value={addressForm.landmark}
                    onChange={(e) =>
                      setAddressForm((form) => ({ ...form, landmark: e.target.value }))
                    }
                    placeholder="A nearby landmark (optional)"
                    className="rounded-none"
                  />
                </Field>

                <Field label="City" error={addressErrors.city}>
                  <Input
                    value={addressForm.city}
                    onChange={(e) => setAddressForm((form) => ({ ...form, city: e.target.value }))}
                    placeholder="Kolkata"
                    autoComplete="address-level2"
                    className="rounded-none"
                  />
                </Field>

                <Field label="State" error={addressErrors.state}>
                  <Input
                    value={addressForm.state}
                    onChange={(e) => setAddressForm((form) => ({ ...form, state: e.target.value }))}
                    placeholder="West Bengal"
                    autoComplete="address-level1"
                    className="rounded-none"
                  />
                </Field>

                <Field label="PIN Code" error={addressErrors.postalCode}>
                  <Input
                    value={addressForm.postalCode}
                    onChange={(e) =>
                      setAddressForm((form) => ({
                        ...form,
                        postalCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                      }))
                    }
                    placeholder="700016"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    className="rounded-none"
                  />
                </Field>

                <Field label="Country">
                  <Input value="India" readOnly disabled className="rounded-none bg-neutral-100 text-neutral-500" />
                </Field>

                <div className="sm:col-span-2 pt-1">
                  <CheckBox
                    checked={addressForm.isDefault}
                    onChange={(next) => setAddressForm((form) => ({ ...form, isDefault: next }))}
                    disabled={defaultLocked}
                    label="Use this as my default delivery address"
                  />
                  {defaultLocked && (
                    <p className="text-[10px] text-neutral-400 mt-2 pl-8">
                      {addresses.length === 0
                        ? 'Your first address is always the default.'
                        : 'To change this, set another address as default instead.'}
                    </p>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white border-t border-neutral-100 px-6 sm:px-8 py-5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddressDialogOpen(false)}
                  disabled={savingAddress}
                  className="h-11 px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500 hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Cancel
                </button>
                <Button
                  onClick={saveAddress}
                  disabled={savingAddress}
                  className="h-11 text-[10px] tracking-[0.18em] cursor-pointer"
                >
                  {savingAddress && (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-[10px]" />
                  )}
                  {editingAddressId ? 'Save Address' : 'Add Address'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- Remove confirmation ---------------- */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            className="fixed inset-0 z-[70] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setConfirmDeleteId(null)}
            />
            <motion.div
              role="alertdialog"
              aria-modal="true"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="relative bg-white w-full max-w-md p-8 shadow-premium text-center"
            >
              <span className="w-14 h-14 bg-rose-50 text-[#a6101b] flex items-center justify-center mx-auto mb-5">
                <FontAwesomeIcon icon={faTrash} />
              </span>
              <h2 className="text-xl font-display font-bold uppercase tracking-tight mb-2">
                Remove This Address?
              </h2>
              <p className="text-sm text-neutral-500 leading-relaxed mb-7">
                It will disappear from your address book. Orders already delivered there keep their
                original address.
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDeleteId(null)}
                  className="h-11 text-[10px] tracking-[0.18em] cursor-pointer"
                >
                  Keep It
                </Button>
                <Button
                  onClick={() => deleteAddress(confirmDeleteId)}
                  disabled={pendingAddressId === confirmDeleteId}
                  className="h-11 text-[10px] tracking-[0.18em] cursor-pointer"
                >
                  {pendingAddressId === confirmDeleteId && (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2 text-[10px]" />
                  )}
                  Remove
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccountClient;
