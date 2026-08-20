'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  MessageSquare,
  Mail,
  Settings,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  Check,
  X,
  RefreshCw,
  Truck,
  AlertCircle,
  Database,
  ChevronRight,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  Copy
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  price_override?: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  compare_at_price?: number;
  status: string;
  average_rating: number;
  review_count: number;
  product_variants: ProductVariant[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products?: {
    title: string;
  };
}

interface ShippingAddress {
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  subtotal: number;
  shipping_cost: number;
  total: number;
  payment_status: string;
  order_status: string;
  payment_provider: string;
  tracking_number?: string;
  estimated_delivery?: string;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
    phone: string;
  };
  shipping_address?: ShippingAddress;
  order_items: OrderItem[];
}

interface Address {
  id: string;
  full_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  landmark?: string;
  is_default: boolean;
}

interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  role: string;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
  addresses?: Address[];
}

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  status: string;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
  products?: {
    title: string;
  };
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
}

interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Admin Data states
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');

  // Messages Sorting state
  const [messageSortOrder, setMessageSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Customers Sorting state
  const [customerSortOrder, setCustomerSortOrder] = useState<string>('newest');

  // Modals & Inlines
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [editingStockVariantId, setEditingStockVariantId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);
  const [isSavingStock, setIsSavingStock] = useState<string | null>(null);

  // Messages Detail Drawer
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);

  // Customers Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState<boolean>(false);

  // Modifiable order fields
  const [modOrderStatus, setModOrderStatus] = useState<string>('');
  const [modPaymentStatus, setModPaymentStatus] = useState<string>('');
  const [modTrackingNumber, setModTrackingNumber] = useState<string>('');
  const [modEstimatedDelivery, setModEstimatedDelivery] = useState<string>('');

  const fetchAllData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/admin/stats');
      const statsData = await statsRes.json();
      if (statsRes.ok && statsData.success) {
        setStats(statsData.stats);
      }

      // 2. Fetch Orders
      const ordersRes = await fetch(`/api/admin/orders?limit=100`);
      const ordersData = await ordersRes.json();
      if (ordersRes.ok && ordersData.success) {
        setOrders(ordersData.orders);
      }

      // 3. Fetch Products
      const productsRes = await fetch('/api/admin/products');
      const productsData = await productsRes.json();
      if (productsRes.ok && productsData.success) {
        setProducts(productsData.products);
      }

      // 4. Fetch Customers
      const customersRes = await fetch('/api/admin/customers');
      const customersData = await customersRes.json();
      if (customersRes.ok && customersData.success) {
        setCustomers(customersData.customers);
      }

      // 5. Fetch Reviews
      const reviewsRes = await fetch('/api/admin/reviews');
      const reviewsData = await reviewsRes.json();
      if (reviewsRes.ok && reviewsData.success) {
        setReviews(reviewsData.reviews);
      }

      // 6. Fetch Messages
      const messagesRes = await fetch('/api/admin/messages');
      const messagesData = await messagesRes.json();
      if (messagesRes.ok && messagesData.success) {
        setMessages(messagesData.messages);
      }

      // 7. Fetch Subscribers
      const subscribersRes = await fetch('/api/admin/subscribers');
      const subscribersData = await subscribersRes.json();
      if (subscribersRes.ok && subscribersData.success) {
        setSubscribers(subscribersData.subscribers);
      }
    } catch (error: any) {
      console.error('Error fetching admin data:', error);
      toast({
        title: 'Fetch Error',
        description: 'Failed to sync data from server API endpoints.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard successfully.`,
    });
  };

  const handleOpenOrderModal = (order: Order) => {
    setSelectedOrder(order);
    setModOrderStatus(order.order_status);
    setModPaymentStatus(order.payment_status);
    setModTrackingNumber(order.tracking_number || '');
    setModEstimatedDelivery(
      order.estimated_delivery ? new Date(order.estimated_delivery).toISOString().split('T')[0] : ''
    );
    setIsOrderModalOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setIsSavingOrder(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_status: modOrderStatus,
          payment_status: modPaymentStatus,
          tracking_number: modTrackingNumber,
          estimated_delivery: modEstimatedDelivery || null,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Success',
          description: `Order #${selectedOrder.order_number} details updated.`,
        });
        
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...data.order } : o));
        setIsOrderModalOpen(false);
        fetchAllData(true);
      } else {
        throw new Error(data.error || 'Failed to update order');
      }
    } catch (err: any) {
      toast({
        title: 'Update Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleUpdateStock = async (variantId: string, newStock: number) => {
    setIsSavingStock(variantId);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stock: newStock }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Stock Sync Successful',
          description: `Inventory level updated to ${newStock}.`,
        });
        setProducts(prev =>
          prev.map(p => ({
            ...p,
            product_variants: p.product_variants.map(v =>
              v.id === variantId ? { ...v, stock: newStock } : v
            ),
          }))
        );
        setEditingStockVariantId(null);
      } else {
        throw new Error(data.error || 'Failed to update stock');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingStock(null);
    }
  };

  const handleUpdateReviewStatus = async (reviewId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Review Moderated',
          description: `Review has been successfully marked as ${newStatus}.`,
        });
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
      } else {
        throw new Error(data.error || 'Failed to moderate review');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const handleUpdateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: 'Status Synchronized',
          description: `Message status updated to ${newStatus}.`,
        });
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, status: newStatus } : m));
        if (selectedMessage && selectedMessage.id === messageId) {
          setSelectedMessage(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        throw new Error(data.error || 'Failed to update message status');
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const getRelativeTimeString = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) {
      if (date.getDate() === now.getDate()) return 'Today';
      return 'Yesterday';
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffDays <= 30) {
      return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  };

  const renderSalesChart = () => {
    if (!stats || !stats.salesHistory || stats.salesHistory.length === 0) return null;

    const width = 600;
    const height = 180;
    const paddingLeft = 50;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxRevenue = Math.max(...stats.salesHistory.map((s: any) => s.revenue), 1000);
    const points = stats.salesHistory.map((s: any, i: number) => {
      const x = paddingLeft + (i / (stats.salesHistory.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - (s.revenue / maxRevenue) * chartHeight;
      return { x, y, label: s.date, revenue: s.revenue };
    });

    const pathD = points.reduce((acc: string, p: { x: number; y: number }, i: number) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-800">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#475569" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = paddingTop + ratio * chartHeight;
          const val = Math.round(maxRevenue * (1 - ratio));
          return (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="#F1F5F9"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                fill="#94A3B8"
                fontSize="9"
                textAnchor="end"
                className="font-mono font-medium"
              >
                ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {areaD && <path d={areaD} fill="url(#chartGradient)" />}

        {pathD && <path d={pathD} fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />}

        {points.map((p: any, idx: number) => (
          <g key={idx} className="group/point">
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#475569"
              stroke="#FFFFFF"
              strokeWidth="1.5"
              className="transition-all duration-200 hover:r-6 cursor-pointer"
            />
            <text
              x={p.x}
              y={p.y - 8}
              fill="#0F172A"
              fontSize="8"
              fontWeight="bold"
              textAnchor="middle"
              className="opacity-0 group-hover/point:opacity-100 transition-opacity fill-slate-900 pointer-events-none font-mono"
            >
              ₹{p.revenue}
            </text>
          </g>
        ))}

        {points.filter((_: any, i: number) => i % 2 === 0).map((p: any, idx: number) => (
          <text
            key={idx}
            x={p.x}
            y={height - 5}
            fill="#94A3B8"
            fontSize="9"
            textAnchor="middle"
            className="font-mono font-medium"
          >
            {p.label}
          </text>
        ))}
      </svg>
    );
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.users?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.users?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = orderFilter ? o.order_status === orderFilter : true;
    const matchesPayment = paymentFilter ? o.payment_status === paymentFilter : true;
    return matchesSearch && matchesStatus && matchesPayment;
  });

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (customerSortOrder === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (customerSortOrder === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (customerSortOrder === 'spent_high') {
      return b.totalSpent - a.totalSpent;
    }
    if (customerSortOrder === 'spent_low') {
      return a.totalSpent - b.totalSpent;
    }
    if (customerSortOrder === 'orders_high') {
      return b.ordersCount - a.ordersCount;
    }
    if (customerSortOrder === 'orders_low') {
      return a.ordersCount - b.ordersCount;
    }
    return 0;
  });

  const filteredReviews = reviews.filter(r =>
    (r.users?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.products?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sorting Contact Messages Chronologically
  const sortedMessages = [...filteredMessages].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return messageSortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
        <p className="text-xs uppercase font-mono tracking-widest text-slate-400">Verifying security state...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col lg:flex-row font-sans">
      <title>System Console | Gorer Mart</title>

      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200/80 p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
              <h1 className="text-base font-semibold tracking-wider text-slate-900 uppercase">Gorer Mart</h1>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-1">Console Panel</p>
          </div>

          <nav className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-x-visible gap-0.5 pb-2 lg:pb-0 no-scrollbar">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'inventory', label: 'Inventory', icon: Package },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'reviews', label: 'Reviews', icon: Star },
              { id: 'messages', label: 'Messages', icon: MessageSquare },
              { id: 'subscribers', label: 'Subscribers', icon: Mail },
              { id: 'settings', label: 'Diagnostics', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`flex items-center space-x-3 whitespace-nowrap px-3.5 py-3 text-xs font-semibold tracking-wider transition-all w-full border-l-2 ${
                    isActive
                      ? 'border-slate-950 bg-slate-50 text-slate-900 font-bold'
                      : 'border-transparent text-slate-500 hover:bg-slate-50/50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-slate-800' : 'text-slate-455'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="mt-6 lg:mt-0 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-7 h-7 rounded-full border border-slate-200" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                {profile?.full_name?.[0] || 'A'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-855 truncate max-w-[100px]">{profile?.full_name || 'Admin Admin'}</p>
              <p className="text-[9px] text-slate-400 uppercase font-mono tracking-wider">Level: System</p>
            </div>
          </div>
          <button
            onClick={() => signOut().then(() => window.location.href = '/')}
            className="text-[10px] font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 transition-colors p-1.5 hover:bg-rose-50 rounded cursor-pointer border-0 bg-transparent"
          >
            Exit
          </button>
        </div>
      </aside>

      {/* Main Console Content */}
      <main className="flex-grow p-6 lg:p-10 overflow-y-auto max-w-7xl">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              <span>Console</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className="text-slate-655 capitalize">{activeTab}</span>
            </h2>
            <p className="text-[10px] text-slate-455 uppercase font-mono tracking-widest mt-0.5">
              Synchronized DB connection
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => fetchAllData(true)}
              className="border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold py-2 px-3.5 rounded-lg flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'text-slate-700 bg-slate-50 border-slate-100' },
                { label: 'Avg Order Value', value: `₹${stats.averageOrderValue.toLocaleString('en-IN')}`, icon: Activity, color: 'text-blue-700 bg-blue-50 border-blue-100' },
                { label: 'Active Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'text-indigo-700 bg-indigo-50 border-indigo-100' },
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-white p-5 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-sm"
                  >
                    <div>
                      <p className="text-[9px] font-mono tracking-widest text-slate-400 uppercase mb-0.5">{card.label}</p>
                      <h3 className="text-xl font-bold text-slate-900">{card.value}</h3>
                    </div>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${card.color}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Sales Chart & Top Products */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950">Sales Performance</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Chronological revenue (Last 14 Days)</p>
                  </div>
                  <TrendingUp className="w-4.5 h-4.5 text-slate-550" />
                </div>
                <div className="h-44 w-full mt-2 flex items-end">
                  {renderSalesChart()}
                </div>
              </div>

              {/* Top Selling Products */}
              <div className="lg:col-span-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-950 mb-4">Top Performing Products</h3>
                  <div className="space-y-3.5">
                    {stats.topProducts && stats.topProducts.length > 0 ? (
                      stats.topProducts.map((p: any, idx: number) => (
                        <div key={p.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="w-4.5 h-4.5 rounded bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold font-mono flex items-center justify-center flex-shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-slate-700 truncate">{p.name}</span>
                          </div>
                          <div className="text-right flex-shrink-0 pl-2">
                            <p className="font-bold text-slate-900">₹{p.revenue.toLocaleString('en-IN')}</p>
                            <p className="text-[9px] text-slate-400 font-mono uppercase">{p.quantity} sold</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 py-6 text-center font-mono">No product sales compiled.</p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center text-[10px] font-mono text-slate-550">
                  <span>Avg Items per order</span>
                  <span className="font-bold text-slate-805 text-slate-800">
                    {stats.totalOrders > 0
                      ? (
                          orders.reduce((sum, o) => sum + o.order_items.reduce((s, i) => s + i.quantity, 0), 0) /
                          stats.totalOrders
                        ).toFixed(1)
                      : 0}{' '}
                    units
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Orders Overview */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-[9px] font-mono uppercase tracking-widest text-slate-400">Incoming Customer Transmissions</h3>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-[10px] uppercase font-bold tracking-wider text-slate-700 hover:text-slate-955 hover:underline cursor-pointer bg-transparent border-0"
                >
                  Show all
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-3 font-semibold">ID</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold">Fulfillment</th>
                      <th className="px-6 py-3 font-semibold">Charged</th>
                      <th className="px-6 py-3 text-right font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-950">#{o.order_number}</td>
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-slate-800">{o.users?.full_name || 'Guest Account'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{o.users?.email || '—'}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider border ${
                              o.order_status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : o.order_status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {o.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">₹{o.total.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenOrderModal(o)}
                            className="border border-slate-200 bg-white text-slate-600 hover:text-slate-950 font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-lg cursor-pointer transition-colors shadow-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-xs text-slate-400 font-mono">
                          No customer transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === 'orders' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="sm:col-span-6 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by ID, name, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 focus:outline-none rounded-lg text-xs placeholder:text-slate-400 text-slate-800 transition-all"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 focus:outline-none rounded-lg text-xs text-slate-700"
                >
                  <option value="">Fulfillment</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="w-full px-2 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 focus:outline-none rounded-lg text-xs text-slate-700"
                >
                  <option value="">Payment</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-3 font-semibold">Order</th>
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Customer</th>
                      <th className="px-6 py-3 font-semibold">Payment</th>
                      <th className="px-6 py-3 font-semibold">Fulfillment</th>
                      <th className="px-6 py-3 font-semibold">Total</th>
                      <th className="px-6 py-3 text-right font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((o) => (
                      <tr key={o.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-950">#{o.order_number}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-400 font-medium">
                          {new Date(o.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-slate-800">{o.users?.full_name || 'Guest User'}</p>
                          <p className="text-[10px] text-slate-455 font-mono">{o.users?.email || '—'}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider border ${
                              o.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : o.payment_status === 'failed'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {o.payment_status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider border ${
                              o.order_status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : o.order_status === 'cancelled'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-amber-50 text-amber-700 border-amber-100'
                            }`}
                          >
                            {o.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">₹{o.total.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenOrderModal(o)}
                            className="border border-slate-200 bg-white text-slate-600 hover:text-slate-955 font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-lg cursor-pointer transition-colors shadow-sm"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-xs text-slate-400 font-mono">
                          No matching transactions located.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search Box */}
            <div className="relative bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Filter catalog products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 focus:outline-none rounded-lg text-xs placeholder:text-slate-400 text-slate-805 transition-all"
              />
            </div>

            {/* Inventory Listing */}
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs text-slate-950 uppercase tracking-wider">{product.title}</h3>
                    <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">SLUG: {product.slug}</p>
                    <div className="flex gap-4 mt-1 text-[9px] text-slate-400 font-mono uppercase font-semibold">
                      <span>Rate: ₹{product.price}</span>
                      <span>Rating: {product.average_rating} ({product.review_count} votes)</span>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-wrap gap-3">
                    {product.product_variants && product.product_variants.length > 0 ? (
                      product.product_variants.map((v) => {
                        const isEditing = editingStockVariantId === v.id;
                        const lowStock = v.stock < 5;
                        const outOfStock = v.stock === 0;

                        return (
                          <div
                            key={v.id}
                            className="bg-slate-50 border border-slate-200/60 p-2.5 rounded-lg flex items-center space-x-3 text-xs text-slate-700 font-medium"
                          >
                            <div>
                              <p className="font-bold font-mono text-slate-850 text-[10px] uppercase">
                                {v.size} {v.color ? `/ ${v.color}` : ''}
                              </p>
                              <p className="text-[9px] font-mono text-slate-400 tracking-wider mt-0.5">{v.sku}</p>
                              <div className="flex items-center space-x-1.5 mt-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    outOfStock ? 'bg-red-500' : lowStock ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                />
                                <span className="text-[9px] font-mono text-slate-550 font-bold">{v.stock} units</span>
                              </div>
                            </div>

                            {/* In-Line Stock Level Editor */}
                            <div className="border-l border-slate-200 pl-2.5 flex items-center space-x-1.5">
                              {isEditing ? (
                                <>
                                  <input
                                    type="number"
                                    min="0"
                                    value={editingStockValue}
                                    onChange={(e) => setEditingStockValue(parseInt(e.target.value) || 0)}
                                    className="w-11 px-1 py-0.5 bg-white border border-slate-300 text-slate-900 rounded font-mono text-xs focus:outline-none focus:border-slate-900 text-center"
                                  />
                                  <button
                                    onClick={() => handleUpdateStock(v.id, editingStockValue)}
                                    className="p-1 bg-slate-900 text-white rounded cursor-pointer border-0 flex items-center justify-center hover:bg-slate-800"
                                    disabled={isSavingStock === v.id}
                                  >
                                    {isSavingStock === v.id ? (
                                      <Loader2 className="w-3.5 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => setEditingStockVariantId(null)}
                                    className="p-1 bg-slate-205 text-slate-650 rounded cursor-pointer border-0 flex items-center justify-center hover:bg-slate-350"
                                    disabled={isSavingStock === v.id}
                                  >
                                    <X className="w-3.5 h-3" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => {
                                    setEditingStockVariantId(v.id);
                                    setEditingStockValue(v.stock);
                                  }}
                                  className="text-[9px] uppercase font-bold text-slate-800 hover:text-slate-950 hover:underline cursor-pointer bg-transparent border-0"
                                >
                                  Stock
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">No variants configured.</span>
                    )}
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-mono">
                  No matching catalog items located.
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOMERS TAB */}
        {activeTab === 'customers' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Sort Box */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="sm:col-span-9 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search registered user accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 focus:outline-none rounded-lg text-xs placeholder:text-slate-400 text-slate-800 transition-all"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={customerSortOrder}
                  onChange={(e) => setCustomerSortOrder(e.target.value)}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 focus:outline-none rounded-lg text-xs text-slate-700 font-medium"
                >
                  <option value="newest">Registration: Newest</option>
                  <option value="oldest">Registration: Oldest</option>
                  <option value="spent_high">Expenditure: High to Low</option>
                  <option value="spent_low">Expenditure: Low to High</option>
                  <option value="orders_high">Orders: High to Low</option>
                  <option value="orders_low">Orders: Low to High</option>
                </select>
              </div>
            </div>

            {/* Customer list */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-6 py-3 font-semibold">Date Registered</th>
                      <th className="px-6 py-3 font-semibold">Contact Info</th>
                      <th className="px-6 py-3 font-semibold">Privileges</th>
                      <th className="px-6 py-3 font-semibold">Total orders</th>
                      <th className="px-6 py-3 font-semibold">Gross Expenditure</th>
                      <th className="px-6 py-3 text-right font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedCustomers.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsCustomerDrawerOpen(true);
                        }}
                        className="text-xs hover:bg-slate-50/30 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-3.5 flex items-center space-x-2.5">
                          {c.avatarUrl ? (
                            <img src={c.avatarUrl} alt="Avatar" className="w-7 h-7 rounded-full border border-slate-200" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center font-bold text-[9px] text-slate-655">
                              {c.fullName[0] || 'U'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{c.fullName}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{c.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-400 font-medium">
                          {new Date(c.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-550 font-semibold">{c.phone || '—'}</td>
                        <td className="px-6 py-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider border ${
                              c.role === 'admin'
                                ? 'bg-rose-50 text-rose-700 border-rose-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200/60'
                            }`}
                          >
                            {c.role}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-800">{c.ordersCount}</td>
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">₹{c.totalSpent.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCustomer(c);
                              setIsCustomerDrawerOpen(true);
                            }}
                            className="border border-slate-200 bg-white text-slate-655 hover:text-slate-955 font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-lg cursor-pointer transition-colors shadow-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedCustomers.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-10 text-xs text-slate-400 font-mono">
                          No matching profiles registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REVIEWS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search Box */}
            <div className="relative bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 focus:outline-none rounded-lg text-xs placeholder:text-slate-400 text-slate-805 transition-all"
              />
            </div>

            {/* Reviews Listing */}
            <div className="space-y-4">
              {filteredReviews.map((r) => (
                <div key={r.id} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-[9px] font-mono text-slate-655 font-bold uppercase bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
                        {r.products?.title || 'Unknown Product'}
                      </span>
                      <div className="flex text-amber-500 font-bold text-xs">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <span key={i}>★</span>
                        ))}
                        {Array.from({ length: 5 - r.rating }).map((_, i) => (
                          <span key={i} className="text-slate-200">★</span>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-semibold">"{r.comment || 'No comments left.'}"</p>
                    <p className="text-[9px] text-slate-400 font-mono">
                      By: <span className="text-slate-600 font-bold">{r.users?.full_name || 'Guest'}</span> ({r.users?.email || '—'}) •{' '}
                      {new Date(r.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 md:self-center flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider mr-2 border ${
                        r.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : r.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}
                    >
                      {r.status}
                    </span>
                    {r.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateReviewStatus(r.id, 'approved')}
                          className="p-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded cursor-pointer border-0 flex items-center justify-center"
                          title="Approve Review"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateReviewStatus(r.id, 'rejected')}
                          className="p-1.5 bg-slate-205 text-slate-650 hover:bg-slate-300 rounded cursor-pointer border-0 flex items-center justify-center"
                          title="Reject Review"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    {r.status !== 'pending' && (
                      <button
                        onClick={() => handleUpdateReviewStatus(r.id, 'pending')}
                        className="text-[9px] uppercase font-mono text-slate-400 hover:text-slate-800 hover:underline cursor-pointer bg-transparent border-0"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredReviews.length === 0 && (
                <div className="text-center py-10 text-xs text-slate-400 font-mono">
                  No matching reviews located.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search & Sort Box */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="sm:col-span-9 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search messages by name, email, subject, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 focus:outline-none rounded-lg text-xs placeholder:text-slate-400 text-slate-800 transition-all"
                />
              </div>
              <div className="sm:col-span-3">
                <select
                  value={messageSortOrder}
                  onChange={(e) => setMessageSortOrder(e.target.value as 'newest' | 'oldest')}
                  className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 focus:outline-none rounded-lg text-xs text-slate-700 font-medium"
                >
                  <option value="newest">Sort: Newest</option>
                  <option value="oldest">Sort: Oldest</option>
                </select>
              </div>
            </div>

            {/* Messages list */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-3 font-semibold">Sender</th>
                      <th className="px-6 py-3 font-semibold">Subject</th>
                      <th className="px-6 py-3 font-semibold">Sending Time</th>
                      <th className="px-6 py-3 font-semibold">Reply</th>
                      <th className="px-6 py-3 text-right font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedMessages.map((m) => (
                      <tr key={m.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-900">{m.name}</td>
                        <td className="px-6 py-3.5 font-medium text-slate-700 min-w-[200px] break-words leading-normal">
                          {m.subject}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600 font-medium whitespace-nowrap">
                          {new Date(m.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          <span className="text-[10px] text-slate-400 ml-1.5 font-sans font-medium">
                            ({getRelativeTimeString(m.created_at)})
                          </span>
                        </td>
                        <td className="px-6 py-3.5">
                          <select
                            value={m.status || 'not replied'}
                            onChange={(e) => handleUpdateMessageStatus(m.id, e.target.value)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider focus:outline-none border-0 text-white cursor-pointer transition-colors ${
                              m.status === 'replied' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                            }`}
                          >
                            <option value="not replied" className="bg-white text-slate-800">Not Replied</option>
                            <option value="replied" className="bg-white text-slate-800">Replied</option>
                          </select>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedMessage(m);
                              setIsMessageModalOpen(true);
                            }}
                            className="border border-slate-200 bg-white text-slate-655 hover:text-slate-955 font-bold text-[10px] uppercase tracking-wider py-1 px-3 rounded-lg cursor-pointer transition-colors shadow-sm"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {sortedMessages.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-xs text-slate-400 font-mono">
                          No messages located.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SUBSCRIBERS TAB */}
        {activeTab === 'subscribers' && (
          <div className="space-y-4 animate-fade-in">
            {/* Search Box */}
            <div className="relative bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search newsletter contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:ring-0 focus:outline-none rounded-lg text-xs placeholder:text-slate-400 text-slate-800 transition-all"
              />
            </div>

            {/* Subscribers list */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 text-[9px] font-mono uppercase tracking-widest text-slate-500 border-b border-slate-100">
                      <th className="px-6 py-3 font-semibold">Email</th>
                      <th className="px-6 py-3 font-semibold">Registration Date</th>
                      <th className="px-6 py-3 text-right font-semibold">Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSubscribers.map((s) => (
                      <tr key={s.id} className="text-xs hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-800 font-mono">{s.email}</td>
                        <td className="px-6 py-3.5 font-mono text-slate-400 font-medium">
                          {new Date(s.created_at).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-3.5 text-right font-mono text-slate-400 uppercase text-[9px] tracking-wider font-bold">
                          active_list
                        </td>
                      </tr>
                    ))}
                    {filteredSubscribers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-10 text-xs text-slate-400 font-mono">
                          No mailing list subscribers located.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS / DIAGNOSTICS TAB */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Database & Cloud Pipelines */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-700" />
                <span>Diagnostics Pipelines</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Testing logs for connected headless content providers and database servers.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase font-mono text-[10px]">Supabase Cloud DB</h4>
                    <p className="text-[9px] text-slate-400 font-mono truncate max-w-[180px] mt-0.5">
                      {process.env.NEXT_PUBLIC_SUPABASE_URL || 'production'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold uppercase border border-emerald-100">
                    Online
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700 uppercase font-mono text-[10px]">Sanity Headless CMS</h4>
                    <p className="text-[9px] text-slate-400 font-mono truncate max-w-[180px] mt-0.5">
                      Project ID: {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk'}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold uppercase border border-emerald-100">
                    Synced
                  </span>
                </div>
              </div>
            </div>

            {/* Operational Instructions */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-700" />
                <span>Privilege Security Protocols</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Admin elevations must be performed directly within Supabase console schemas.
              </p>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5">
                <h4 className="text-[10px] font-mono font-bold text-slate-655 uppercase">SQL Role Update:</h4>
                <pre className="bg-slate-950 p-2.5 rounded font-mono text-[9px] text-slate-350 overflow-x-auto border border-slate-900">
{`UPDATE public.users 
SET role = 'admin' 
WHERE email = 'target_email@gorermart.com';`}
                </pre>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Moderation Modal Dialog */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-800 max-w-xl rounded-xl shadow-2xl p-6">
          {selectedOrder && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle className="text-sm font-bold uppercase text-slate-955 font-mono flex items-center justify-between border-b border-slate-100 pb-3">
                  <span>Modify Order: #{selectedOrder.order_number}</span>
                  <span className="text-[9px] font-mono font-normal text-slate-400 uppercase tracking-widest">
                    Reference ID: {selectedOrder.id.slice(0, 8)}...
                  </span>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs py-1">
                {/* Left Side: Order Items */}
                <div className="space-y-3.5">
                  <h4 className="font-bold text-[9px] uppercase font-mono tracking-widest text-slate-400 flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Purchase Summary</span>
                  </h4>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1 no-scrollbar">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="bg-slate-50 p-2 border border-slate-100 rounded-lg flex justify-between items-center text-[11px] font-medium text-slate-700">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-slate-855 truncate">{item.products?.title || 'Unknown Product'}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">₹{item.price} x {item.quantity}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 flex-shrink-0">
                          ₹{item.price * item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 text-slate-500 space-y-1 font-mono text-[9px]">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="text-slate-800 font-semibold">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping charges:</span>
                      <span className="text-emerald-700 font-bold">Free</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-100">
                      <span className="text-slate-855 font-semibold">Grand Total:</span>
                      <span className="text-slate-955 font-black">₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Shipping & Fulfillment */}
                <div className="space-y-3.5">
                  <h4 className="font-bold text-[9px] uppercase font-mono tracking-widest text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Shipping Address</span>
                  </h4>
                  {selectedOrder.shipping_address ? (
                    <div className="bg-slate-50 p-2.5 border border-slate-100 rounded-lg space-y-0.5 text-slate-600 text-[11px] font-medium leading-relaxed">
                      <p className="font-bold text-slate-955">{selectedOrder.shipping_address.full_name}</p>
                      <p className="text-[9px] font-mono text-slate-400">Tel: {selectedOrder.shipping_address.phone}</p>
                      <p className="mt-1">
                        {selectedOrder.shipping_address.address_line_1}
                        {selectedOrder.shipping_address.address_line_2 && `, ${selectedOrder.shipping_address.address_line_2}`}
                        <br />
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} —{' '}
                        <span className="font-mono font-bold text-slate-850">{selectedOrder.shipping_address.postal_code}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-mono">No shipping info parsed.</p>
                  )}

                  {/* Shipment Tracking Inputs */}
                  <div className="space-y-2 pt-1">
                    <h4 className="font-bold text-[9px] uppercase font-mono tracking-widest text-slate-400 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Tracking details</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Tracking ID</label>
                        <input
                          value={modTrackingNumber}
                          onChange={(e) => setModTrackingNumber(e.target.value)}
                          placeholder="e.g. SF902143"
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Delivery Target</label>
                        <input
                          type="date"
                          value={modEstimatedDelivery}
                          onChange={(e) => setModEstimatedDelivery(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white text-xs rounded-lg text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Selectors */}
              <div className="grid grid-cols-2 gap-4 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Fulfillment state</label>
                  <select
                    value={modOrderStatus}
                    onChange={(e) => setModOrderStatus(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 focus:outline-none rounded-lg text-xs text-slate-700 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase font-mono block mb-1">Payment state</label>
                  <select
                    value={modPaymentStatus}
                    onChange={(e) => setModPaymentStatus(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:ring-0 focus:outline-none rounded-lg text-xs text-slate-700 font-medium"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <DialogFooter className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="border-slate-200 bg-transparent text-slate-500 hover:text-slate-800 text-xs font-bold py-2 h-auto rounded-lg cursor-pointer shadow-sm transition-colors"
                  disabled={isSavingOrder}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateOrder}
                  className="bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs uppercase tracking-wider py-2 px-5 h-auto rounded-lg cursor-pointer flex items-center gap-2 border-0 shadow-sm transition-colors"
                  disabled={isSavingOrder}
                >
                  {isSavingOrder ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save</span>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Message Details slide-out Drawer from the right */}
      <AnimatePresence>
        {isMessageModalOpen && selectedMessage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMessageModalOpen(false)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase text-slate-955 font-mono tracking-wide">
                    Message Viewer
                  </h3>
                  <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                    {new Date(selectedMessage.created_at).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setIsMessageModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center rounded-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-grow p-6 overflow-y-auto space-y-5 text-xs font-medium">
                {/* Sender Card - Email & Phone stacked vertically on separate lines */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3.5">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal">Sender Name</span>
                    <strong className="text-slate-900 text-xs font-bold">{selectedMessage.name}</strong>
                  </div>
                  
                  <div className="pt-3.5 border-t border-slate-200/60 space-y-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal mb-0.5">Email Address</span>
                      <div className="flex items-center space-x-1.5">
                        <a href={`mailto:${selectedMessage.email}`} className="text-slate-900 hover:underline font-bold break-all font-mono">
                          {selectedMessage.email}
                        </a>
                        <button
                          onClick={() => handleCopyToClipboard(selectedMessage.email, 'Email address')}
                          className="p-1 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center rounded hover:bg-slate-200"
                          title="Copy Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal mb-0.5">Phone Number</span>
                      {selectedMessage.phone ? (
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-slate-700 font-bold">{selectedMessage.phone}</span>
                          <button
                            onClick={() => handleCopyToClipboard(selectedMessage.phone, 'Phone number')}
                            className="p-1 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center rounded hover:bg-slate-200"
                            title="Copy Phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400">Not provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject Info */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-450 block mb-1 font-normal">Subject</span>
                  <div className="bg-slate-50 px-3.5 py-2.5 border border-slate-100 rounded-lg text-slate-900 font-bold">
                    {selectedMessage.subject}
                  </div>
                </div>

                {/* Message Body Text */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-450 block mb-1 font-normal">Message Body</span>
                  <div className="bg-slate-50 p-4 border border-slate-100 rounded-lg text-slate-700 leading-relaxed min-h-[140px] whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 text-center text-[9px] font-mono text-slate-400 tracking-wider">
                END OF MESSAGE LOG
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Customer Details slide-out Drawer from the right */}
      <AnimatePresence>
        {isCustomerDrawerOpen && selectedCustomer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCustomerDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900 z-50 cursor-pointer"
            />
            {/* Drawer container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white border-l border-slate-200/80 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3.5">
                  {selectedCustomer.avatarUrl ? (
                    <img src={selectedCustomer.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-250 flex items-center justify-center font-bold text-xs text-slate-655">
                      {selectedCustomer.fullName[0] || 'U'}
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-slate-955 truncate max-w-[200px]">
                      {selectedCustomer.fullName}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                      Registered: {new Date(selectedCustomer.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCustomerDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center rounded-lg hover:bg-slate-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-grow p-6 overflow-y-auto space-y-5 text-xs font-medium">
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-2 gap-3.5 bg-slate-50/50 p-4 border border-slate-150 rounded-xl">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal">Orders Placed</span>
                    <strong className="text-slate-900 text-sm font-bold font-mono">{selectedCustomer.ordersCount}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal">Total Spent</span>
                    <strong className="text-slate-900 text-sm font-bold font-mono">₹{selectedCustomer.totalSpent.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                {/* Contact Info Card */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3.5">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal mb-0.5">Account Role</span>
                    <span
                      className={`px-2.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider border ${
                        selectedCustomer.role === 'admin'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200/60'
                      }`}
                    >
                      {selectedCustomer.role}
                    </span>
                  </div>

                  <div className="pt-3.5 border-t border-slate-200/60 space-y-3">
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal mb-0.5">Email Address</span>
                      <div className="flex items-center space-x-1.5">
                        <a href={`mailto:${selectedCustomer.email}`} className="text-slate-900 hover:underline font-bold break-all font-mono">
                          {selectedCustomer.email}
                        </a>
                        <button
                          onClick={() => handleCopyToClipboard(selectedCustomer.email, 'Email address')}
                          className="p-1 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center rounded hover:bg-slate-200"
                          title="Copy Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono uppercase text-slate-400 block font-normal mb-0.5">Phone Number</span>
                      {selectedCustomer.phone && selectedCustomer.phone !== '—' ? (
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-slate-700 font-bold">{selectedCustomer.phone}</span>
                          <button
                            onClick={() => handleCopyToClipboard(selectedCustomer.phone, 'Phone number')}
                            className="p-1 text-slate-400 hover:text-slate-750 transition-colors cursor-pointer bg-transparent border-0 flex items-center justify-center rounded hover:bg-slate-200"
                            title="Copy Phone"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">No phone number registered</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Addresses Card */}
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-455 block mb-1.5 font-normal">Saved Shipping Addresses</span>
                  <div className="space-y-3">
                    {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                      selectedCustomer.addresses.map((address) => (
                        <div key={address.id} className="bg-slate-50/75 p-3.5 border border-slate-150 rounded-xl space-y-1 relative">
                          {address.is_default && (
                            <span className="absolute top-3 right-3 bg-slate-900 text-white text-[8px] font-bold font-mono tracking-widest px-1.5 py-0.5 rounded uppercase">
                              Default
                            </span>
                          )}
                          <p className="font-bold text-slate-900 text-xs">{address.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">Tel: {address.phone}</p>
                          <p className="text-slate-600 leading-normal pt-1">
                            {address.address_line_1}
                            {address.address_line_2 && `, ${address.address_line_2}`}
                            {address.landmark && <span className="block text-[10px] text-slate-400 mt-0.5 font-sans">Landmark: {address.landmark}</span>}
                            <span className="block font-mono text-[10px] font-semibold text-slate-700 mt-0.5">
                              {address.city}, {address.state} — {address.postal_code}
                            </span>
                            <span className="block text-[9px] uppercase tracking-wider font-mono text-slate-400 mt-0.5">{address.country}</span>
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl text-center text-slate-400 font-mono">
                        No saved addresses found.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-4 border-t border-slate-100 text-center text-[9px] font-mono text-slate-400 tracking-wider">
                END OF CUSTOMER RECORD
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
