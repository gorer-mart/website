'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRightFromBracket,
  faBox,
  faHeart,
  faLocationDot,
  faArrowRight,
  faUser,
  faTruck,
  faReceipt,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../ui/button';

interface OrderItem {
  id: string;
  product_name?: string | null;
  quantity: number;
  price: number;
  size?: string | null;
  color?: string | null;
  products?: { title?: string | null; slug?: string | null } | null;
}

interface Order {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: string;
  order_status: string;
  tracking_number?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

const ORDER_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-100',
  processing: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  shipped: 'bg-violet-50 text-violet-700 border-violet-100',
  delivered: 'bg-green-50 text-green-700 border-green-100',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-100',
};

const PAYMENT_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  paid: 'bg-green-50 text-green-700 border-green-100',
  failed: 'bg-rose-50 text-rose-700 border-rose-100',
  refunded: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const formatCurrency = (value: number) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const StatusPill: React.FC<{ label: string; styles: Record<string, string> }> = ({ label, styles }) => (
  <span
    className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-full ${
      styles[label] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
    }`}
  >
    {label}
  </span>
);

const Account: React.FC = () => {
  const { user, profile, loading, signOut, isAuthenticated } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string>('');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login?redirect=/account');
    }
  }, [loading, isAuthenticated, router]);

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await fetch('/api/account/orders', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrdersError(data.error || 'Could not load your orders.');
        return;
      }
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setOrdersError('Could not load your orders. Please try again.');
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadOrders();
  }, [isAuthenticated, loadOrders]);

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const quickLinks = [
    {
      icon: faBox,
      title: 'Order History',
      description: 'Track and manage your recent purchases',
      onClick: () =>
        document.getElementById('order-history')?.scrollIntoView({ behavior: 'smooth' }),
    },
    {
      icon: faHeart,
      title: 'Saved Items',
      description: 'Browse the shop and add favourites to your bag',
      onClick: () => router.push('/shop'),
    },
    {
      icon: faLocationDot,
      title: 'Need Help?',
      description: 'Reach our team about an order or delivery',
      onClick: () => router.push('/contact'),
    },
  ];

  return (
    <>
      <title>My Account — Gorer Mart</title>
      <meta name="description" content="Manage your Gorer Mart account" />

      <div className="pt-24 pb-20 min-h-screen bg-neutral-50">
        <div className="container mx-auto px-6 md:px-12 lg:px-24 max-w-5xl">

          {/* Dashboard Header with Cover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-sm border border-neutral-100 overflow-hidden mb-8"
          >
            <div className="h-32 bg-gradient-to-r from-neutral-900 to-neutral-800 relative">
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            </div>

            <div className="px-8 pb-8 relative">
              <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between -mt-16 sm:-mt-12 space-y-6 sm:space-y-0">
                <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-white shadow-lg bg-white relative z-10"
                      />
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-4xl font-bold text-neutral-300 relative z-10">
                        <FontAwesomeIcon icon={faUser} />
                      </div>
                    )}
                  </div>

                  <div className="text-center sm:text-left pb-2">
                    <h1 className="text-3xl font-display font-bold uppercase tracking-tighter">
                      {profile?.full_name || 'Gorer Mart Member'}
                    </h1>
                    <p className="text-neutral-500 font-medium">{profile?.email || user?.email}</p>
                  </div>
                </div>

                <div className="pb-2">
                  <Button
                    variant="outline"
                    onClick={signOut}
                    className="flex items-center space-x-2 border-neutral-200 rounded-xl hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all duration-300 cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            {quickLinks.map((item, idx) => (
              <motion.button
                key={item.title}
                type="button"
                onClick={item.onClick}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                className="text-left bg-white rounded-3xl p-8 border border-neutral-100 hover:border-black hover:shadow-xl transition-all duration-500 cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-500">
                    <FontAwesomeIcon icon={item.icon} className="text-xl" />
                  </div>
                  <h3 className="font-display font-bold text-xl uppercase tracking-tight mb-2">{item.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{item.description}</p>
                </div>

                <div className="absolute bottom-8 right-8 text-neutral-300 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-black transition-all duration-500 z-10">
                  <FontAwesomeIcon icon={faArrowRight} className="text-xl" />
                </div>
              </motion.button>
            ))}
          </div>

          {/* Order History */}
          <section id="order-history" className="scroll-mt-28">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-bold uppercase tracking-tighter flex items-center gap-3">
                <FontAwesomeIcon icon={faReceipt} className="text-neutral-400 text-lg" />
                Order History
              </h2>
              <button
                type="button"
                onClick={loadOrders}
                disabled={ordersLoading}
                className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors disabled:opacity-40 cursor-pointer"
              >
                {ordersLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            {ordersLoading ? (
              <div className="bg-white rounded-3xl border border-neutral-100 p-16 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
              </div>
            ) : ordersError ? (
              <div className="bg-white rounded-3xl border border-rose-100 p-10 text-center">
                <p className="text-sm text-rose-600 mb-4">{ordersError}</p>
                <Button variant="outline" onClick={loadOrders} className="rounded-xl cursor-pointer">
                  Try Again
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-100 p-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-neutral-50 text-neutral-300 flex items-center justify-center mx-auto mb-5">
                  <FontAwesomeIcon icon={faBox} className="text-xl" />
                </div>
                <h3 className="font-display font-bold uppercase tracking-tight text-lg mb-2">No orders yet</h3>
                <p className="text-neutral-500 text-sm mb-6">When you place an order it will appear here.</p>
                <Button asChild className="rounded-xl cursor-pointer">
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl border border-neutral-100 overflow-hidden"
                  >
                    <div className="px-6 sm:px-8 py-5 border-b border-neutral-50 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-display font-bold tracking-tight">#{order.order_number}</p>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-1">
                          Placed {formatDate(order.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusPill label={order.order_status} styles={ORDER_STATUS_STYLES} />
                        <StatusPill label={order.payment_status} styles={PAYMENT_STATUS_STYLES} />
                      </div>
                    </div>

                    <div className="px-6 sm:px-8 py-5 space-y-3">
                      {(order.order_items ?? []).map((item) => (
                        <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                          <div className="min-w-0">
                            <p className="truncate">{item.product_name || item.products?.title || 'Product'}</p>
                            <p className="text-[10px] uppercase tracking-widest text-neutral-400 mt-0.5">
                              {[item.size && `Size ${item.size}`, item.color, `Qty ${item.quantity}`]
                                .filter(Boolean)
                                .join(' • ')}
                            </p>
                          </div>
                          <p className="font-bold whitespace-nowrap">
                            {formatCurrency(Number(item.price) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="px-6 sm:px-8 py-5 bg-neutral-50/70 border-t border-neutral-50 flex flex-wrap items-center justify-between gap-4">
                      {order.tracking_number ? (
                        <p className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                          <FontAwesomeIcon icon={faTruck} className="text-neutral-400" />
                          Tracking: <span className="text-black font-bold">{order.tracking_number}</span>
                          {order.estimated_delivery && (
                            <span className="text-neutral-400">
                              • Est. {formatDate(order.estimated_delivery)}
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                          Tracking details will appear once your order ships
                        </p>
                      )}
                      <p className="font-display font-bold text-lg">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default Account;
