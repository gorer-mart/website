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
  IndianRupee,
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
  Star,
  Copy,
  Plus,
  Trash2,
  Pencil,
  PackagePlus,
  User as UserIcon,
  Layers,
  LogOut,
  Boxes,
  Inbox,
  Ticket,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../ui/dialog';
import {
  Action,
  Badge,
  BRAND,
  DetailRow,
  Drawer,
  DrawerSection,
  EmptyRow,
  EmptyState,
  Field,
  IconAction,
  Mono,
  Pagination,
  Panel,
  SearchField,
  SelectField,
  StatCard,
  StatusBadge,
  TableCard,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  dateTime,
  money,
  shortDate,
  stockLevel,
  usePagination,
} from './_components/ui';

interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

interface ProductVariant {
  id: string;
  size: string;
  color?: string;
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
  category_id?: string;
  categories?: {
    id: string;
    name: string;
    slug: string;
  };
  status: string;
  average_rating: number;
  review_count: number;
  description?: string;
  product_variants: ProductVariant[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
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
  /** Contact details captured at checkout; authoritative for this order. */
  customer_email?: string | null;
  customer_phone?: string | null;
  /** Promo code applied at checkout, if any. */
  discount_amount?: number | null;
  coupon_code?: string | null;
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

interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_discount_amount?: number | null;
  min_order_value: number;
  usage_limit?: number | null;
  per_user_limit?: number | null;
  usage_count: number;
  starts_at?: string | null;
  expires_at?: string | null;
  is_active: boolean;
  created_at: string;
  /** Derived server-side from coupon_redemptions. */
  redeemed_count?: number;
  total_discounted?: number;
}

interface SizeStockItem {
  id?: string;
  size: string;
  stock: number;
}

const DEFAULT_SIZES: SizeStockItem[] = [
  { size: 'S', stock: 10 },
  { size: 'M', stock: 15 },
  { size: 'L', stock: 20 },
  { size: 'XL', stock: 15 },
  { size: 'XXL', stock: 5 },
];

/** Stock level at or below which a variant is flagged in the console. */
const LOW_STOCK_THRESHOLD = 5;

/**
 * Page heading and one-line explanation per tab. Kept here so the top bar reads
 * as plain English instead of repeating the nav label back at the user.
 */
const TAB_META: Record<string, { title: string; description: string }> = {
  overview: { title: 'Overview', description: 'Sales, orders and stock at a glance' },
  orders: { title: 'Orders', description: 'Payment and delivery status for every order' },
  inventory: { title: 'Inventory', description: 'Products and size-wise stock levels' },
  customers: { title: 'Customers', description: 'Registered accounts and their order history' },
  reviews: { title: 'Reviews', description: 'Customer reviews across the catalogue' },
  messages: { title: 'Messages', description: 'Enquiries sent through the contact form' },
  subscribers: { title: 'Subscribers', description: 'Newsletter mailing list' },
  coupons: { title: 'Promo codes', description: 'Discount codes customers can apply at checkout' },
  settings: { title: 'Settings', description: 'Connection status for content and data services' },
};

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
const MESSAGE_STATUSES = ['not replied', 'replied'];

/** Windows the revenue chart can be viewed over. Keys match the stats API. */
const SALES_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '15d', label: 'Last 15 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '3m', label: 'Last 3 months' },
];

/**
 * Overrides for the shared `DialogDescription`, which is styled for the
 * storefront (uppercase, wide tracking). Every dialog gets a description so
 * Radix can wire up `aria-describedby` — without one it logs an accessibility
 * warning and screen readers announce only the title.
 */
const DIALOG_DESC = 'font-sans text-sm font-normal normal-case leading-relaxed tracking-normal text-slate-500';

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Admin Data states
  const [stats, setStats] = useState<any>(null);
  const [salesRange, setSalesRange] = useState<string>('15d');
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);

  // Sanity Catalog States
  const [sanityProducts, setSanityProducts] = useState<any[]>([]);
  const [sanityCategories, setSanityCategories] = useState<any[]>([]);
  const [isSyncingSanity, setIsSyncingSanity] = useState<boolean>(false);
  const [selectedSanityCategory, setSelectedSanityCategory] = useState<string>('');
  const [selectedSanityProductSlug, setSelectedSanityProductSlug] = useState<string>('');
  const [isCustomEntry, setIsCustomEntry] = useState<boolean>(false);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderFilter, setOrderFilter] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<string>('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState<string>('');

  /**
   * Abandoned checkouts are hidden by default.
   *
   * An order row is written before the customer pays, so every dismissed
   * payment leaves a record. Those are not orders — showing them alongside real
   * ones made the list impossible to work from.
   */
  const [showAbandoned, setShowAbandoned] = useState<boolean>(false);

  // Messages Sorting state
  const [messageSortOrder, setMessageSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Customers Sorting state
  const [customerSortOrder, setCustomerSortOrder] = useState<string>('newest');

  // Mobile navigation
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);

  // Order Details Drawer & Moderation
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState<boolean>(false);
  const [isSavingOrder, setIsSavingOrder] = useState<boolean>(false);
  const [isDeleteOrderDialogOpen, setIsDeleteOrderDialogOpen] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [isDeletingOrder, setIsDeletingOrder] = useState<boolean>(false);

  // Modifiable order fields
  const [modOrderStatus, setModOrderStatus] = useState<string>('');
  const [modPaymentStatus, setModPaymentStatus] = useState<string>('');
  const [modTrackingNumber, setModTrackingNumber] = useState<string>('');
  const [modEstimatedDelivery, setModEstimatedDelivery] = useState<string>('');

  // Inventory & Product Create/Edit States
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState<boolean>(false);
  const [isDeleteProductDialogOpen, setIsDeleteProductDialogOpen] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeletingProduct, setIsDeletingProduct] = useState<boolean>(false);

  // Inline Variant Quick-Stock edit
  const [editingStockVariantId, setEditingStockVariantId] = useState<string | null>(null);
  const [editingStockValue, setEditingStockValue] = useState<number>(0);
  const [isSavingStock, setIsSavingStock] = useState<string | null>(null);

  // Inventory row expansion — keeps the size matrix out of the way until asked for.
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Custom size input state
  const [customSizeInput, setCustomSizeInput] = useState<string>('');

  // Product Form
  const [productForm, setProductForm] = useState<{
    title: string;
    slug: string;
    price: string;
    compare_at_price: string;
    category_id: string;
    status: 'active' | 'draft';
    description: string;
    sizes: SizeStockItem[];
  }>({
    title: '',
    slug: '',
    price: '',
    compare_at_price: '',
    category_id: '',
    status: 'active',
    description: '',
    sizes: DEFAULT_SIZES,
  });

  // Promo code create/edit
  const [isCouponModalOpen, setIsCouponModalOpen] = useState<boolean>(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isSavingCoupon, setIsSavingCoupon] = useState<boolean>(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [isDeletingCoupon, setIsDeletingCoupon] = useState<boolean>(false);
  const [couponStatusFilter, setCouponStatusFilter] = useState<string>('');

  const [couponForm, setCouponForm] = useState<{
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: string;
    max_discount_amount: string;
    min_order_value: string;
    usage_limit: string;
    per_user_limit: string;
    starts_at: string;
    expires_at: string;
    is_active: boolean;
  }>({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_discount_amount: '',
    min_order_value: '',
    usage_limit: '',
    per_user_limit: '',
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  // Messages Detail Drawer
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState<boolean>(false);
  const [updatingMessageId, setUpdatingMessageId] = useState<string | null>(null);

  // Customers Detail Drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerDrawerOpen, setIsCustomerDrawerOpen] = useState<boolean>(false);

  const fetchAllData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    const endpoints = [
      { key: 'stats', url: `/api/admin/stats?range=${salesRange}`, field: 'stats', apply: setStats },
      { key: 'orders', url: '/api/admin/orders?limit=100', field: 'orders', apply: setOrders },
      { key: 'products', url: '/api/admin/products', field: 'products', apply: setProducts },
      {
        key: 'sanityCatalog',
        url: '/api/admin/sanity-catalog',
        field: 'products',
        apply: (prods: any[]) => setSanityProducts(prods || []),
      },
      { key: 'categories', url: '/api/admin/categories', field: 'categories', apply: setCategories },
      { key: 'customers', url: '/api/admin/customers', field: 'customers', apply: setCustomers },
      { key: 'reviews', url: '/api/admin/reviews', field: 'reviews', apply: setReviews },
      { key: 'messages', url: '/api/admin/messages', field: 'messages', apply: setMessages },
      { key: 'subscribers', url: '/api/admin/subscribers', field: 'subscribers', apply: setSubscribers },
      { key: 'coupons', url: '/api/admin/coupons', field: 'coupons', apply: setCoupons },
    ] as const;

    try {
      const results = await Promise.all(
        endpoints.map(async (endpoint) => {
          const res = await fetch(endpoint.url, { cache: 'no-store' });
          const data = await res.json().catch(() => ({}));
          return { endpoint, status: res.status, ok: res.ok, data };
        })
      );

      if (results.some((r) => r.status === 401 || r.status === 403)) {
        toast({
          title: 'Session Expired',
          description: 'Please sign in again to continue.',
          variant: 'destructive',
        });
        router.replace('/admin/login');
        return;
      }

      for (const result of results) {
        if (result.ok && (result.data as any)?.success) {
          const payload = (result.data as any)[result.endpoint.field];
          if (payload !== undefined) {
            (result.endpoint.apply as (value: any) => void)(payload);
          }
          if (result.endpoint.key === 'sanityCatalog' && (result.data as any)?.categories) {
            setSanityCategories((result.data as any).categories || []);
          }
          if (result.endpoint.key === 'products' && (result.data as any)?.sanityProducts) {
            setSanityProducts((result.data as any).sanityProducts || []);
            if ((result.data as any)?.sanityCategories) {
              setSanityCategories((result.data as any).sanityCategories || []);
            }
          }
        }
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

  /**
   * Reload only the stats payload for a new chart window.
   *
   * Changing the range must not re-pull orders, products, customers and the
   * Sanity catalogue — that is nine requests for a chart the admin is simply
   * scrubbing through.
   */
  const handleSalesRangeChange = async (range: string) => {
    setSalesRange(range);
    setIsLoadingChart(true);
    try {
      const res = await fetch(`/api/admin/stats?range=${range}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success && data.stats) {
        setStats(data.stats);
      } else {
        throw new Error(data?.error || 'Could not load the chart for that period.');
      }
    } catch (err: any) {
      toast({
        title: 'Chart Not Updated',
        description: err.message || 'Could not load the chart for that period.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingChart(false);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: `${label} copied to clipboard successfully.`,
    });
  };

  // ---- ORDER HANDLERS ----
  const handleOpenOrderDrawer = (order: Order) => {
    setSelectedOrder(order);
    setModOrderStatus(order.order_status);
    setModPaymentStatus(order.payment_status);
    setModTrackingNumber(order.tracking_number || '');
    setModEstimatedDelivery(
      order.estimated_delivery ? new Date(order.estimated_delivery).toISOString().split('T')[0] : ''
    );
    setIsOrderDrawerOpen(true);
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
          title: 'Order Updated',
          description: `Order #${selectedOrder.order_number} details saved successfully.`,
        });

        setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, ...data.order } : o));
        setSelectedOrder((prev) => prev ? { ...prev, ...data.order } : null);
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

  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;
    setIsDeletingOrder(true);

    try {
      const res = await fetch(`/api/admin/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete order');

      toast({
        title: 'Order Deleted',
        description: `Order #${orderToDelete.order_number} has been permanently deleted.`,
      });

      setOrders((prev) => prev.filter((o) => o.id !== orderToDelete.id));
      if (selectedOrder?.id === orderToDelete.id) {
        setIsOrderDrawerOpen(false);
        setSelectedOrder(null);
      }
      setIsDeleteOrderDialogOpen(false);
      setOrderToDelete(null);
      fetchAllData(true);
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete order.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingOrder(false);
    }
  };

  // ---- MESSAGE HANDLERS ----
  const handleUpdateMessageStatus = async (messageId: string, status: string) => {
    const previous = messages.find((m) => m.id === messageId)?.status;
    setUpdatingMessageId(messageId);

    // Apply optimistically — the dropdown feels instant, and the catch below
    // puts the old value back if the write fails.
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status } : m)));
    setSelectedMessage((prev) => (prev && prev.id === messageId ? { ...prev, status } : prev));

    try {
      const res = await fetch(`/api/admin/messages/${messageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not update the message status.');
      }

      toast({
        title: 'Status Updated',
        description: `Message marked as ${status}.`,
      });
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, status: previous ?? 'not replied' } : m))
      );
      setSelectedMessage((prev) =>
        prev && prev.id === messageId ? { ...prev, status: previous ?? 'not replied' } : prev
      );
      toast({
        title: 'Update Failed',
        description: err.message || 'Could not update the message status.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingMessageId(null);
    }
  };

  // ---- INVENTORY & SANITY HANDLERS ----
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
          title: 'Stock Updated',
          description: 'Inventory levels adjusted.',
        });
        setProducts((prev) =>
          prev.map((p) => ({
            ...p,
            product_variants: p.product_variants.map((v) =>
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

  /**
   * Resolve a category *name* to the Supabase category row id.
   *
   * `products.category_id` is a UUID foreign key. The form used to submit the
   * Sanity category name straight into it, which Postgres rejects as an invalid
   * UUID — so choosing a category silently never saved.
   */
  const categoryIdForName = (name?: string | null): string => {
    if (!name) return '';
    const target = String(name).trim().toLowerCase();
    return categories.find((c) => c.name?.trim().toLowerCase() === target)?.id || '';
  };

  const handleSelectSanityProduct = (slug: string) => {
    setSelectedSanityProductSlug(slug);
    const sp = sanityProducts.find(
      (p) => (p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')) === slug
    );
    if (!sp) return;

    // Check if this product already has variants in Supabase
    const existingDbProd = products.find(
      (p) => p.slug === slug || p.title?.toLowerCase() === sp.name?.toLowerCase()
    );

    const sizes = sp.sizes && sp.sizes.length > 0
      ? sp.sizes.map((s: string) => {
          const matchingVar = existingDbProd?.product_variants?.find((v) => v.size === s);
          return {
            id: matchingVar?.id,
            size: s,
            stock: matchingVar ? matchingVar.stock : 10,
          };
        })
      : DEFAULT_SIZES.map((s) => {
          const matchingVar = existingDbProd?.product_variants?.find((v) => v.size === s.size);
          return {
            id: matchingVar?.id,
            size: s.size,
            stock: matchingVar ? matchingVar.stock : s.stock,
          };
        });

    setProductForm({
      title: sp.name || '',
      slug: sp.slug || slug,
      price: String(sp.price || ''),
      compare_at_price: sp.compare_at_price ? String(sp.compare_at_price) : '',
      category_id: categoryIdForName(sp.category),
      status: 'active',
      description: sp.tag || sp.details?.[0] || '',
      sizes,
    });
  };

  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setIsCustomEntry(false);
    setSelectedSanityCategory('');

    if (sanityProducts.length > 0) {
      const first = sanityProducts[0];
      const slug = first.slug || first.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      handleSelectSanityProduct(slug);
    } else {
      setProductForm({
        title: '',
        slug: '',
        price: '',
        compare_at_price: '',
        category_id: '',
        status: 'active',
        description: '',
        sizes: DEFAULT_SIZES.map((s) => ({ ...s })),
      });
    }
    setCustomSizeInput('');
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsCustomEntry(true);

    const existingSizes = product.product_variants && product.product_variants.length > 0
      ? product.product_variants.map((v) => ({
          id: v.id,
          size: v.size,
          stock: v.stock,
        }))
      : DEFAULT_SIZES.map((s) => ({ ...s }));

    setProductForm({
      title: product.title,
      slug: product.slug,
      price: String(product.price),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
      category_id: product.category_id || product.categories?.id || categories[0]?.id || '',
      status: (product.status === 'active' || product.status === 'draft') ? product.status : 'active',
      description: product.description || '',
      sizes: existingSizes,
    });
    setCustomSizeInput('');
    setIsProductModalOpen(true);
  };

  const handleProductFormSizeChange = (index: number, newStock: number) => {
    setProductForm((prev) => {
      const updatedSizes = [...prev.sizes];
      updatedSizes[index] = {
        ...updatedSizes[index],
        stock: Math.max(0, newStock),
      };
      return { ...prev, sizes: updatedSizes };
    });
  };

  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    const sizeName = customSizeInput.trim().toUpperCase();
    if (productForm.sizes.some((s) => s.size === sizeName)) {
      toast({ title: 'Notice', description: `Size ${sizeName} already exists in the matrix.` });
      setCustomSizeInput('');
      return;
    }
    setProductForm((prev) => ({
      ...prev,
      sizes: [...prev.sizes, { size: sizeName, stock: 10 }],
    }));
    setCustomSizeInput('');
  };

  const handleRemoveSize = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };

  const handleSyncSanityCatalog = async () => {
    setIsSyncingSanity(true);
    try {
      await fetchAllData(true);
      toast({
        title: 'Sanity Synchronized',
        description: `Loaded ${sanityProducts.length} products directly from Sanity Studio.`,
      });
    } catch (err: any) {
      toast({
        title: 'Sync Error',
        description: err.message || 'Could not sync Sanity catalog.',
        variant: 'destructive',
      });
    } finally {
      setIsSyncingSanity(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title.trim()) {
      toast({ title: 'Validation Error', description: 'Product title is required.', variant: 'destructive' });
      return;
    }
    if (!productForm.price || isNaN(Number(productForm.price)) || Number(productForm.price) < 0) {
      toast({ title: 'Validation Error', description: 'Please enter a valid price.', variant: 'destructive' });
      return;
    }

    setIsSavingProduct(true);
    try {
      const isEdit = !!editingProduct;
      const url = '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';

      const payload: any = {
        title: productForm.title.trim(),
        slug: productForm.slug.trim(),
        price: Number(productForm.price),
        compare_at_price: productForm.compare_at_price ? Number(productForm.compare_at_price) : null,
        category_id: productForm.category_id || null,
        status: productForm.status,
        description: productForm.description.trim() || null,
        variants: productForm.sizes.map((s) => ({
          id: s.id,
          size: s.size,
          stock: Math.max(0, parseInt(String(s.stock), 10) || 0),
        })),
      };

      if (isEdit) {
        payload.productId = editingProduct.id;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product');

      toast({
        title: isEdit ? 'Inventory Updated' : 'Product Added to Inventory',
        description: `"${productForm.title}" size-wise inventory saved successfully.`,
      });

      setIsProductModalOpen(false);
      fetchAllData(true);
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message || 'Could not save product.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeletingProduct(true);

    try {
      const res = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');

      toast({
        title: 'Product Removed',
        description: `"${productToDelete.title}" removed from inventory tracking.`,
      });

      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
      setIsDeleteProductDialogOpen(false);
      setProductToDelete(null);
      fetchAllData(true);
    } catch (err: any) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete product.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingProduct(false);
    }
  };

  // ---- PROMO CODE HANDLERS ----

  /** `datetime-local` inputs need `YYYY-MM-DDTHH:mm` in local time. */
  const toLocalInput = (iso?: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleOpenCreateCoupon = () => {
    setEditingCoupon(null);
    setCouponForm({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      max_discount_amount: '',
      min_order_value: '',
      usage_limit: '',
      per_user_limit: '',
      starts_at: '',
      expires_at: '',
      is_active: true,
    });
    setIsCouponModalOpen(true);
  };

  const handleOpenEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value ?? ''),
      max_discount_amount: coupon.max_discount_amount != null ? String(coupon.max_discount_amount) : '',
      min_order_value: coupon.min_order_value ? String(coupon.min_order_value) : '',
      usage_limit: coupon.usage_limit != null ? String(coupon.usage_limit) : '',
      per_user_limit: coupon.per_user_limit != null ? String(coupon.per_user_limit) : '',
      starts_at: toLocalInput(coupon.starts_at),
      expires_at: toLocalInput(coupon.expires_at),
      is_active: coupon.is_active,
    });
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = couponForm.code.trim().toUpperCase();
    if (code.length < 3) {
      toast({ title: 'Check the code', description: 'Use at least 3 characters.', variant: 'destructive' });
      return;
    }
    const value = Number(couponForm.discount_value);
    if (!Number.isFinite(value) || value <= 0) {
      toast({ title: 'Check the discount', description: 'Enter a value greater than zero.', variant: 'destructive' });
      return;
    }
    if (couponForm.discount_type === 'percentage' && value > 100) {
      toast({ title: 'Check the discount', description: 'A percentage cannot exceed 100%.', variant: 'destructive' });
      return;
    }

    setIsSavingCoupon(true);
    try {
      // Empty text inputs become null rather than 0 — "no limit" and "limit of
      // zero" mean very different things to the validator.
      const optionalNumber = (v: string) => (v.trim() === '' ? null : Number(v));

      const payload: Record<string, unknown> = {
        code,
        description: couponForm.description.trim() || null,
        discount_type: couponForm.discount_type,
        discount_value: value,
        max_discount_amount:
          couponForm.discount_type === 'percentage'
            ? optionalNumber(couponForm.max_discount_amount)
            : null,
        min_order_value: couponForm.min_order_value.trim() === '' ? 0 : Number(couponForm.min_order_value),
        usage_limit: optionalNumber(couponForm.usage_limit),
        per_user_limit: optionalNumber(couponForm.per_user_limit),
        // `datetime-local` has no timezone; converting through Date gives the
        // admin's local intent as a correct UTC instant.
        starts_at: couponForm.starts_at ? new Date(couponForm.starts_at).toISOString() : null,
        expires_at: couponForm.expires_at ? new Date(couponForm.expires_at).toISOString() : null,
        is_active: couponForm.is_active,
      };

      if (editingCoupon) payload.id = editingCoupon.id;

      const res = await fetch('/api/admin/coupons', {
        method: editingCoupon ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not save the promo code.');

      toast({
        title: editingCoupon ? 'Promo code updated' : 'Promo code created',
        description: `${code} is ${couponForm.is_active ? 'live' : 'saved but inactive'}.`,
      });

      setIsCouponModalOpen(false);
      fetchAllData(true);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSavingCoupon(false);
    }
  };

  /** Flip a code live/paused straight from the table. */
  const handleToggleCoupon = async (coupon: Coupon) => {
    // Optimistic: the switch should feel instant, and it is reverted on failure.
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, is_active: !c.is_active } : c))
    );

    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discount_type: coupon.discount_type,
          discount_value: coupon.discount_value,
          max_discount_amount: coupon.max_discount_amount,
          min_order_value: coupon.min_order_value,
          usage_limit: coupon.usage_limit,
          per_user_limit: coupon.per_user_limit,
          starts_at: coupon.starts_at,
          expires_at: coupon.expires_at,
          is_active: !coupon.is_active,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not update the promo code.');

      toast({
        title: !coupon.is_active ? 'Promo code activated' : 'Promo code paused',
        description: `${coupon.code} is now ${!coupon.is_active ? 'live' : 'inactive'}.`,
      });
    } catch (err: any) {
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: coupon.is_active } : c))
      );
      toast({ title: 'Update failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDelete) return;
    setIsDeletingCoupon(true);

    try {
      const res = await fetch(`/api/admin/coupons/${couponToDelete.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not remove the promo code.');

      toast({
        title: data.deactivated ? 'Promo code deactivated' : 'Promo code deleted',
        description:
          data.message || `${couponToDelete.code} has been removed.`,
      });

      setCouponToDelete(null);
      fetchAllData(true);
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsDeletingCoupon(false);
    }
  };

  /**
   * Revenue sparkline for the overview.
   *
   * Drawn as a plain responsive SVG rather than pulling in a chart library.
   * Labels inherit the page font so the chart does not read as a separate
   * artefact pasted into the console.
   */
  const renderSalesChart = () => {
    if (!stats || !stats.salesHistory || stats.salesHistory.length === 0) {
      return (
        <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
          No sales recorded yet.
        </div>
      );
    }

    const width = 640;
    const height = 200;
    const paddingLeft = 52;
    const paddingRight = 16;
    const paddingTop = 16;
    const paddingBottom = 28;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxRevenue = Math.max(...stats.salesHistory.map((s: any) => s.revenue), 1000);
    const points = stats.salesHistory.map((s: any, i: number) => {
      const x = paddingLeft + (i / Math.max(1, stats.salesHistory.length - 1)) * chartWidth;
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
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" role="img" aria-label="Revenue over the last 14 days">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
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
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                fill="#94a3b8"
                fontSize="11"
                fontFamily="inherit"
                textAnchor="end"
              >
                ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          );
        })}

        {areaD && <path d={areaD} fill="url(#chartGradient)" />}
        {pathD && <path d={pathD} fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

        {points.map((p: any, idx: number) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
            <title>{`${p.label}: ₹${p.revenue.toLocaleString('en-IN')}`}</title>
          </g>
        ))}

        {points.filter((_: any, i: number) => i % 2 === 0).map((p: any, idx: number) => (
          <text
            key={idx}
            x={p.x}
            y={height - 6}
            fill="#94a3b8"
            fontSize="11"
            fontFamily="inherit"
            textAnchor="middle"
          >
            {p.label}
          </text>
        ))}
      </svg>
    );
  };

  // ---- FILTERED DATA SETS ----

  /**
   * A checkout the customer never completed.
   *
   * `failed` payment plus `cancelled` fulfilment is the signature written by
   * `lib/server/order-settlement` — either the customer dismissed the payment
   * modal, or the scheduled sweep confirmed with Razorpay that no payment ever
   * arrived. An order cancelled after being paid carries `refunded`, not
   * `failed`, so a real cancellation is never hidden by this.
   */
  const isAbandonedCheckout = (o: Order): boolean =>
    o.payment_status === 'failed' && o.order_status === 'cancelled';

  const abandonedCount = orders.filter(isAbandonedCheckout).length;

  const filteredOrders = orders.filter((o) => {
    if (!showAbandoned && isAbandonedCheckout(o)) return false;

    const matchesSearch =
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOrder = orderFilter ? o.order_status === orderFilter : true;
    const matchesPayment = paymentFilter ? o.payment_status === paymentFilter : true;
    return matchesSearch && matchesOrder && matchesPayment;
  });

  /**
   * Display category for a product.
   *
   * Prefers the Supabase join, and falls back to the matching Sanity product so
   * a row still shows its category on the very first load after this fix —
   * before the products endpoint has written the foreign key back.
   */
  const productCategoryName = (p: Product): string => {
    const linked = p.categories?.name;
    if (linked) return linked;

    const sanityMatch = sanityProducts.find(
      (s: any) => s.slug === p.slug || s.name?.toLowerCase() === p.title?.toLowerCase()
    );
    return (sanityMatch?.category as string) || 'Uncategorised';
  };

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    const category = productCategoryName(p);
    const matchesSearch =
      p.title.toLowerCase().includes(query) ||
      p.slug.toLowerCase().includes(query) ||
      category.toLowerCase().includes(query);
    const matchesCategory = inventoryCategoryFilter
      ? category.toLowerCase() === inventoryCategoryFilter.toLowerCase()
      : true;
    return matchesSearch && matchesCategory;
  });

  // Categories actually present on products, with counts, so the dropdown can
  // never offer a category that would return an empty table.
  const categoryOptions = Array.from(
    products.reduce((acc, p) => {
      const name = productCategoryName(p);
      acc.set(name, (acc.get(name) || 0) + 1);
      return acc;
    }, new Map<string, number>())
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Filtered Sanity Products in Modal based on Category selection
  const modalSanityProducts = selectedSanityCategory
    ? sanityProducts.filter(
        (p) => p.category?.toLowerCase() === selectedSanityCategory.toLowerCase()
      )
    : sanityProducts;

  const filteredCustomers = customers
    .filter(
      (c) =>
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (customerSortOrder === 'orders') return b.ordersCount - a.ordersCount;
      if (customerSortOrder === 'spent') return b.totalSpent - a.totalSpent;
      if (customerSortOrder === 'oldest')
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const filteredReviews = reviews.filter(
    (r) =>
      r.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.products?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.users?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMessages = messages
    .filter(
      (m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.message.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (messageSortOrder === 'oldest')
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /**
   * Whether a code would actually work right now.
   *
   * `is_active` alone is not the whole story — a code can be switched on but
   * scheduled for next week, expired, or fully claimed. The table shows this
   * rather than the raw flag, so the admin never wonders why a "live" code is
   * being rejected at checkout.
   */
  const couponState = (c: Coupon): { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' } => {
    if (!c.is_active) return { label: 'Paused', tone: 'neutral' };
    const now = Date.now();
    if (c.starts_at && new Date(c.starts_at).getTime() > now) {
      return { label: 'Scheduled', tone: 'warning' };
    }
    if (c.expires_at && new Date(c.expires_at).getTime() <= now) {
      return { label: 'Expired', tone: 'danger' };
    }
    if (c.usage_limit != null && Number(c.usage_count) >= Number(c.usage_limit)) {
      return { label: 'Fully claimed', tone: 'danger' };
    }
    return { label: 'Live', tone: 'success' };
  };

  const filteredCoupons = coupons.filter((c) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      c.code.toLowerCase().includes(query) ||
      (c.description || '').toLowerCase().includes(query);
    const matchesStatus = couponStatusFilter
      ? couponState(c).label.toLowerCase() === couponStatusFilter.toLowerCase()
      : true;
    return matchesSearch && matchesStatus;
  });

  // ---- PAGINATION ----
  // Ten rows per table. `usePagination` resets to page 1 whenever a filter
  // shrinks the list past the current page, so narrowing a search never leaves
  // the admin staring at an empty table.
  const orderPage = usePagination(filteredOrders);
  const productPage = usePagination(filteredProducts);
  const customerPage = usePagination(filteredCustomers);
  const reviewPage = usePagination(filteredReviews);
  const messagePage = usePagination(filteredMessages);
  const subscriberPage = usePagination(filteredSubscribers);
  const couponPage = usePagination(filteredCoupons);

  // ---- DERIVED SUMMARY VALUES ----
  // Each falls back to a client-side calculation so the overview still reads
  // correctly if the stats endpoint fails while the others succeed.
  const paidRevenue = orders
    .filter((o) => o.payment_status === 'paid')
    .reduce((sum, o) => sum + (o.total || 0), 0);
  const totalRevenue = stats?.totalRevenue ?? paidRevenue;
  // Fallbacks mirror the stats endpoint: abandoned checkouts are not orders.
  const realOrders = orders.filter((o) => !isAbandonedCheckout(o));
  const totalOrders = stats?.totalOrders ?? realOrders.length;
  const totalCustomers = stats?.totalCustomers ?? customers.length;
  const totalStockUnits = products.reduce(
    (acc, p) => acc + (p.product_variants?.reduce((s, v) => s + v.stock, 0) || 0),
    0
  );
  const pendingOrders =
    stats?.statusBreakdown?.pending ??
    realOrders.filter((o) => o.order_status === 'pending').length;
  const payingCustomers = customers.filter((c) => c.ordersCount > 0).length;
  const averageItemsPerOrder =
    totalOrders > 0
      ? (
          realOrders.reduce(
            (sum, o) => sum + (o.order_items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0),
            0
          ) / Math.max(1, totalOrders)
        ).toFixed(1)
      : '0';

  const lowStockVariants = products
    .flatMap((p) =>
      p.product_variants ? p.product_variants.map((v) => ({ ...v, productTitle: p.title })) : []
    )
    .filter((v) => v.stock < LOW_STOCK_THRESHOLD);

  const statusCounts: Record<string, number> = ORDER_STATUSES.reduce((acc, status) => {
    acc[status] =
      stats?.statusBreakdown?.[status] ??
      realOrders.filter((o) => o.order_status === status).length;
    return acc;
  }, {} as Record<string, number>);

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: realOrders.length },
    { id: 'inventory', label: 'Inventory', icon: Package, count: products.length },
    { id: 'customers', label: 'Customers', icon: Users, count: customers.length },
    { id: 'reviews', label: 'Reviews', icon: Star, count: reviews.length },
    { id: 'messages', label: 'Messages', icon: MessageSquare, count: messages.length },
    { id: 'subscribers', label: 'Subscribers', icon: Mail, count: subscribers.length },
    { id: 'coupons', label: 'Promo codes', icon: Ticket, count: coupons.length },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchQuery('');
    setIsMobileNavOpen(false);
  };

  const meta = TAB_META[activeTab] ?? TAB_META.overview;

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        <p className="text-sm text-slate-500">Loading console…</p>
      </div>
    );
  }

  /** Nav list, shared by the desktop sidebar and the mobile drawer. */
  const navList = (
    <nav className="space-y-0.5">
      {navTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-slate-900 font-medium text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {tab.label}
            </span>
            {tab.count !== undefined && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${
                  isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  const brandBlock = (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-sm font-semibold text-white"
        style={{ backgroundColor: BRAND }}
        aria-hidden="true"
      >
        G
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900">Gorer Mart</p>
        <p className="text-xs text-slate-500">Admin Console</p>
      </div>
    </div>
  );

  const userBlock = (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="h-8 w-8 flex-shrink-0 rounded-full border border-slate-200 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-medium text-slate-600">
            {profile?.full_name?.[0]?.toUpperCase() || 'A'}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{profile?.full_name || 'Admin'}</p>
          <p className="truncate text-xs text-slate-500">{profile?.email || 'Administrator'}</p>
        </div>
      </div>
      <IconAction
        label="Sign out"
        variant="ghost"
        onClick={() => signOut().then(() => { window.location.href = '/'; })}
        className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
      >
        <LogOut className="h-4 w-4" />
      </IconAction>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        {/* ---------------- Desktop sidebar ---------------- */}
        <aside className="sticky top-0 hidden h-screen w-60 flex-shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-100 px-5 py-4">{brandBlock}</div>
          <div className="flex-1 overflow-y-auto px-3 py-4">{navList}</div>
          <div className="border-t border-slate-100 px-4 py-3">{userBlock}</div>
        </aside>

        {/* ---------------- Main column ---------------- */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile bar */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            {brandBlock}
            <Action
              variant="secondary"
              size="sm"
              onClick={() => setIsMobileNavOpen(true)}
              aria-expanded={isMobileNavOpen}
            >
              <Layers className="h-4 w-4" />
              Menu
            </Action>
          </div>

          {/* Page header */}
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">{meta.title}</h1>
                <p className="mt-0.5 text-sm text-slate-500">{meta.description}</p>
              </div>
              <Action variant="secondary" onClick={() => fetchAllData(true)} disabled={refreshing}>
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Action>
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 lg:px-8">
            {/* ============================ OVERVIEW ============================ */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Total revenue"
                    value={money(totalRevenue)}
                    hint="From paid orders only"
                    icon={IndianRupee}
                  />
                  <StatCard
                    label="Orders"
                    value={totalOrders.toLocaleString('en-IN')}
                    hint={
                      <>
                        {pendingOrders} awaiting fulfilment
                        {(stats?.abandonedCheckouts ?? abandonedCount) > 0 && (
                          <>
                            {' · '}
                            {stats?.abandonedCheckouts ?? abandonedCount} abandoned
                          </>
                        )}
                      </>
                    }
                    icon={ShoppingBag}
                  />
                  <StatCard
                    label="Customers"
                    value={totalCustomers.toLocaleString('en-IN')}
                    hint={`${payingCustomers} have placed an order`}
                    icon={Users}
                  />
                  <StatCard
                    label="Stock units"
                    value={totalStockUnits.toLocaleString('en-IN')}
                    hint={`Across ${products.length} products`}
                    icon={Boxes}
                  />
                </div>

                {/* Order pipeline — one row, every status visible at once. */}
                <Panel title="Order status" bodyClassName="px-5 py-4">
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
                    {ORDER_STATUSES.map((status) => (
                      <div key={status}>
                        <dt className="text-xs capitalize text-slate-500">{status}</dt>
                        <dd className="mt-0.5 text-xl font-semibold tabular-nums text-slate-900">
                          {statusCounts[status]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Panel>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <Panel
                    title="Revenue"
                    description={
                      SALES_RANGES.find((r) => r.value === salesRange)?.label || 'Last 15 days'
                    }
                    className="lg:col-span-2"
                    bodyClassName="px-3 pb-4 pt-5"
                    action={
                      <SelectField
                        value={salesRange}
                        onChange={(e) => handleSalesRangeChange(e.target.value)}
                        disabled={isLoadingChart}
                        aria-label="Revenue period"
                        className="h-9 w-auto text-xs"
                      >
                        {SALES_RANGES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </SelectField>
                    }
                  >
                    <div className="relative h-56 w-full">
                      {isLoadingChart && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
                          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                        </div>
                      )}
                      {renderSalesChart()}
                    </div>
                  </Panel>

                  <Panel
                    title="Top products"
                    description="By revenue"
                    bodyClassName="p-0"
                  >
                    {stats?.topProducts && stats.topProducts.length > 0 ? (
                      <ol className="divide-y divide-slate-100">
                        {stats.topProducts.map((p: any, idx: number) => (
                          <li key={p.id || idx} className="flex items-center justify-between gap-3 px-5 py-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-medium tabular-nums text-slate-600">
                                {idx + 1}
                              </span>
                              <span className="truncate text-sm text-slate-900">{p.name}</span>
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <p className="text-sm font-medium tabular-nums text-slate-900">
                                {money(p.revenue)}
                              </p>
                              <p className="text-xs text-slate-500">{p.quantity} sold</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="px-5 py-10 text-center text-sm text-slate-500">
                        No products sold yet.
                      </p>
                    )}
                    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                      <span>Average items per order</span>
                      <span className="font-medium tabular-nums text-slate-900">{averageItemsPerOrder}</span>
                    </div>
                  </Panel>
                </div>

                {/* Both tables run the full width of the console so the extra
                    columns stay readable without horizontal scrolling. */}
                <div className="space-y-4">
                  <TableCard
                    title="Recent orders"
                    action={
                      <Action variant="ghost" size="sm" onClick={() => handleTabChange('orders')}>
                        View all
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Action>
                    }
                  >
                    <THead>
                      <Th>Order ID</Th>
                      <Th>Placed</Th>
                      <Th>Customer</Th>
                      <Th align="center">Items</Th>
                      <Th>Payment</Th>
                      <Th>Process</Th>
                      <Th align="right">Total</Th>
                    </THead>
                    <TBody>
                      {realOrders.slice(0, 5).map((o) => (
                        <Tr key={o.id} onClick={() => handleOpenOrderDrawer(o)}>
                          <Td>
                            <Mono className="font-medium text-slate-900">#{o.order_number}</Mono>
                          </Td>
                          <Td className="whitespace-nowrap text-slate-600">{shortDate(o.created_at)}</Td>
                          <Td>
                            <p className="font-medium text-slate-900">{o.users?.full_name || 'Guest'}</p>
                            <p className="text-xs text-slate-500">{o.users?.email || '—'}</p>
                          </Td>
                          <Td align="center" className="tabular-nums">
                            {o.order_items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0}
                          </Td>
                          <Td>
                            <StatusBadge status={o.payment_status} />
                          </Td>
                          <Td>
                            <StatusBadge status={o.order_status} />
                          </Td>
                          <Td align="right" className="font-medium tabular-nums text-slate-900">
                            {money(o.total)}
                          </Td>
                        </Tr>
                      ))}
                      {realOrders.length === 0 && <EmptyRow colSpan={7}>No orders yet.</EmptyRow>}
                    </TBody>
                  </TableCard>

                  <TableCard
                    title="Low stock"
                    action={
                      <Action variant="ghost" size="sm" onClick={() => handleTabChange('inventory')}>
                        Manage
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Action>
                    }
                  >
                    <THead>
                      <Th>Product</Th>
                      <Th>Size</Th>
                      <Th align="right">Units left</Th>
                      <Th align="right">Availability</Th>
                    </THead>
                    <TBody>
                      {lowStockVariants.slice(0, 5).map((item) => {
                        const level = stockLevel(item.stock, LOW_STOCK_THRESHOLD);
                        return (
                          <Tr key={item.id}>
                            <Td className="font-medium text-slate-900">{item.productTitle}</Td>
                            <Td className="uppercase">{item.size}</Td>
                            <Td align="right" className="tabular-nums">{item.stock}</Td>
                            <Td align="right">
                              <Badge tone={level.tone}>{level.label}</Badge>
                            </Td>
                          </Tr>
                        );
                      })}
                      {lowStockVariants.length === 0 && (
                        <EmptyRow colSpan={4}>All sizes are well stocked.</EmptyRow>
                      )}
                    </TBody>
                  </TableCard>
                </div>
              </div>
            )}

            {/* ============================ ORDERS ============================ */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Search" className="sm:col-span-2">
                      <SearchField
                        icon={Search}
                        type="text"
                        placeholder="Order number, name or email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Field>
                    <Field label="Process status">
                      <SelectField value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)}>
                        <option value="">All</option>
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                    <Field label="Payment status">
                      <SelectField value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                        <option value="">All</option>
                        {PAYMENT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                  </div>

                  {abandonedCount > 0 && (
                    <label className="mt-3 flex cursor-pointer items-center gap-2.5 border-t border-slate-100 pt-3">
                      <input
                        type="checkbox"
                        checked={showAbandoned}
                        onChange={(e) => setShowAbandoned(e.target.checked)}
                        className="h-4 w-4 cursor-pointer accent-slate-900"
                      />
                      <span className="text-sm text-slate-600">
                        Show {abandonedCount} abandoned{' '}
                        {abandonedCount === 1 ? 'checkout' : 'checkouts'}
                        <span className="ml-1 text-slate-400">
                          — payment was started but never completed
                        </span>
                      </span>
                    </label>
                  )}
                </Panel>

                {/* Rows open the detail panel on click; per-item names, sizes
                    and colours live there rather than crowding the table. */}
                <TableCard footer={<Pagination state={orderPage} noun="orders" />}>
                  <THead>
                    <Th>Order ID</Th>
                    <Th>Placed</Th>
                    <Th>Customer</Th>
                    <Th align="center">Items</Th>
                    <Th>Payment</Th>
                    <Th>Process</Th>
                    <Th align="right">Total</Th>
                  </THead>
                  <TBody>
                    {orderPage.pageItems.map((o) => (
                      <Tr key={o.id} onClick={() => handleOpenOrderDrawer(o)}>
                        <Td>
                          <Mono className="font-medium text-slate-900">#{o.order_number}</Mono>
                        </Td>
                        <Td className="whitespace-nowrap text-slate-600">{shortDate(o.created_at)}</Td>
                        <Td>
                          <p className="font-medium text-slate-900">{o.users?.full_name || 'Guest'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{o.users?.email || '—'}</p>
                        </Td>
                        <Td align="center" className="tabular-nums text-slate-700">
                          {o.order_items?.reduce((s, i) => s + (i.quantity || 1), 0) || 0}
                        </Td>
                        <Td>
                          <StatusBadge status={o.payment_status} />
                        </Td>
                        <Td>
                          <StatusBadge status={o.order_status} />
                        </Td>
                        <Td align="right" className="font-medium tabular-nums text-slate-900">
                          {money(o.total)}
                        </Td>
                      </Tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <EmptyRow colSpan={7}>
                        {realOrders.length === 0 ? 'No orders yet.' : 'No orders match these filters.'}
                      </EmptyRow>
                    )}
                  </TBody>
                </TableCard>
              </div>
            )}

            {/* ============================ INVENTORY ============================ */}
            {activeTab === 'inventory' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Search" className="sm:col-span-2">
                      <SearchField
                        icon={Search}
                        type="text"
                        placeholder="Product name"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Field>
                    {/* Options come from the Supabase category list, which the
                        products endpoint keeps mirrored from Sanity. Filtering
                        by name previously matched nothing, because auto-synced
                        products were saved with no category at all. */}
                    <Field label="Category">
                      <SelectField
                        value={inventoryCategoryFilter}
                        onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                      >
                        <option value="">All categories ({products.length})</option>
                        {categoryOptions.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.count})
                          </option>
                        ))}
                      </SelectField>
                    </Field>
                    <div className="flex items-end gap-2">
                      <Action
                        variant="secondary"
                        onClick={handleSyncSanityCatalog}
                        disabled={isSyncingSanity}
                        className="flex-1"
                      >
                        <RefreshCw className={`h-4 w-4 ${isSyncingSanity ? 'animate-spin' : ''}`} />
                        Sync
                      </Action>
                      <Action variant="primary" onClick={handleOpenCreateProduct} className="flex-1">
                        <Plus className="h-4 w-4" />
                        Add product
                      </Action>
                    </div>
                  </div>
                </Panel>

                {filteredProducts.length === 0 ? (
                  <Panel bodyClassName="p-0">
                    <EmptyState
                      icon={Package}
                      title={products.length === 0 ? 'No products tracked yet' : 'No products match this filter'}
                      description={
                        products.length === 0
                          ? 'Add a product from your Sanity catalogue to start tracking size-wise stock.'
                          : 'Try a different search term or category.'
                      }
                      action={
                        products.length === 0 ? (
                          <Action variant="primary" onClick={handleOpenCreateProduct}>
                            <Plus className="h-4 w-4" />
                            Add product
                          </Action>
                        ) : undefined
                      }
                    />
                  </Panel>
                ) : (
                  <TableCard footer={<Pagination state={productPage} noun="products" />}>
                    <THead>
                      <Th>Product</Th>
                      <Th>Category</Th>
                      <Th align="right">Price</Th>
                      <Th align="right">Total stock</Th>
                      <Th>Availability</Th>
                      <Th>Status</Th>
                      <Th align="right">Actions</Th>
                    </THead>
                    <TBody>
                      {productPage.pageItems.map((product) => {
                        const variants = product.product_variants || [];
                        const totalStock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
                        const isExpanded = expandedProductId === product.id;
                        // Availability reflects the worst size: a product with
                        // 40 units but nothing in M is not simply "in stock".
                        const hasVariants = variants.length > 0;
                        const worstVariantStock = hasVariants
                          ? Math.min(...variants.map((v) => v.stock || 0))
                          : 0;
                        const availability = hasVariants
                          ? totalStock === 0
                            ? stockLevel(0)
                            : stockLevel(worstVariantStock, LOW_STOCK_THRESHOLD)
                          : stockLevel(0);
                        const categoryName = productCategoryName(product);

                        return (
                          <React.Fragment key={product.id}>
                            <Tr
                              onClick={() => setExpandedProductId(isExpanded ? null : product.id)}
                              className={isExpanded ? 'bg-slate-50' : undefined}
                            >
                              <Td>
                                <div className="flex items-start gap-2">
                                  <ChevronRight
                                    className={`mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${
                                      isExpanded ? 'rotate-90' : ''
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <p className="min-w-0 font-medium text-slate-900">{product.title}</p>
                                </div>
                              </Td>
                              <Td className="text-slate-600">{categoryName}</Td>
                              <Td align="right" className="tabular-nums">
                                <span className="font-medium text-slate-900">{money(product.price)}</span>
                                {product.compare_at_price ? (
                                  <span className="ml-1.5 text-xs text-slate-400 line-through">
                                    {money(product.compare_at_price)}
                                  </span>
                                ) : null}
                              </Td>
                              <Td align="right" className="tabular-nums text-slate-700">
                                {totalStock}
                              </Td>
                              <Td>
                                <Badge tone={availability.tone}>{availability.label}</Badge>
                              </Td>
                              <Td>
                                <StatusBadge status={product.status} />
                              </Td>
                              <Td align="right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1.5">
                                  <Action
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleOpenEditProduct(product)}
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    Edit
                                  </Action>
                                  <IconAction
                                    label={`Delete ${product.title}`}
                                    variant="danger"
                                    onClick={() => {
                                      setProductToDelete(product);
                                      setIsDeleteProductDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </IconAction>
                                </div>
                              </Td>
                            </Tr>

                            {isExpanded && (
                              <tr className="bg-slate-50">
                                <td colSpan={7} className="border-t border-slate-100 px-5 py-4">
                                  <p className="mb-3 text-xs font-medium text-slate-600">
                                    Adjust stock — changes save immediately
                                  </p>
                                  {variants.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {variants.map((v) => {
                                        const isEditing = editingStockVariantId === v.id;
                                        const dotTone =
                                          v.stock === 0
                                            ? 'bg-rose-500'
                                            : v.stock < LOW_STOCK_THRESHOLD
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500';

                                        return (
                                          <div
                                            key={v.id}
                                            className="min-w-[168px] rounded-md border border-slate-200 bg-white px-3 py-2.5"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <span className="flex items-center gap-2">
                                                <span
                                                  className={`h-2 w-2 rounded-full ${dotTone}`}
                                                  aria-hidden="true"
                                                />
                                                <span className="text-sm font-medium uppercase text-slate-900">
                                                  {v.size}
                                                </span>
                                              </span>
                                              {!isEditing && (
                                                <button
                                                  onClick={() => {
                                                    setEditingStockVariantId(v.id);
                                                    setEditingStockValue(v.stock);
                                                  }}
                                                  className="cursor-pointer text-xs font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline"
                                                >
                                                  Edit
                                                </button>
                                              )}
                                            </div>

                                            {isEditing ? (
                                              <div className="mt-2 flex items-center gap-1.5">
                                                <input
                                                  type="number"
                                                  min="0"
                                                  autoFocus
                                                  value={editingStockValue}
                                                  onChange={(e) =>
                                                    setEditingStockValue(parseInt(e.target.value, 10) || 0)
                                                  }
                                                  className="h-8 w-full rounded-md border border-slate-300 px-2 text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                                                />
                                                <IconAction
                                                  label="Save stock"
                                                  variant="primary"
                                                  onClick={() => handleUpdateStock(v.id, editingStockValue)}
                                                  disabled={isSavingStock === v.id}
                                                >
                                                  {isSavingStock === v.id ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                  ) : (
                                                    <Check className="h-3.5 w-3.5" />
                                                  )}
                                                </IconAction>
                                                <IconAction
                                                  label="Cancel"
                                                  variant="secondary"
                                                  onClick={() => setEditingStockVariantId(null)}
                                                >
                                                  <X className="h-3.5 w-3.5" />
                                                </IconAction>
                                              </div>
                                            ) : (
                                              <p className="mt-1 text-sm tabular-nums text-slate-700">
                                                {v.stock} {v.stock === 1 ? 'unit' : 'units'}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-sm text-slate-500">
                                      No sizes configured yet. Use Edit to add them.
                                    </p>
                                  )}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TBody>
                  </TableCard>
                )}
              </div>
            )}

            {/* ============================ CUSTOMERS ============================ */}
            {activeTab === 'customers' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Search" className="sm:col-span-2">
                      <SearchField
                        icon={Search}
                        type="text"
                        placeholder="Name, email or phone"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Field>
                    <Field label="Sort by">
                      <SelectField
                        value={customerSortOrder}
                        onChange={(e) => setCustomerSortOrder(e.target.value)}
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                        <option value="orders">Most orders</option>
                        <option value="spent">Highest spend</option>
                      </SelectField>
                    </Field>
                  </div>
                </Panel>

                <TableCard footer={<Pagination state={customerPage} noun="customers" />}>
                  <THead>
                    <Th>Customer</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Joined</Th>
                    <Th align="right">Orders</Th>
                    <Th align="right">Total spent</Th>
                    <Th align="right">Actions</Th>
                  </THead>
                  <TBody>
                    {customerPage.pageItems.map((c) => (
                      <Tr
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setIsCustomerDrawerOpen(true);
                        }}
                      >
                        <Td>
                          <div className="flex items-center gap-3">
                            {c.avatarUrl ? (
                              <img
                                src={c.avatarUrl}
                                alt=""
                                className="h-8 w-8 flex-shrink-0 rounded-full border border-slate-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-medium text-slate-600">
                                {c.fullName?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900">{c.fullName}</p>
                              {c.role === 'admin' && (
                                <Badge tone="danger" className="mt-0.5">
                                  Admin
                                </Badge>
                              )}
                            </div>
                          </div>
                        </Td>
                        <Td className="text-slate-600">{c.email}</Td>
                        <Td className="tabular-nums text-slate-600">{c.phone || '—'}</Td>
                        <Td className="whitespace-nowrap text-slate-600">{shortDate(c.createdAt)}</Td>
                        <Td align="right" className="tabular-nums text-slate-900">{c.ordersCount}</Td>
                        <Td align="right" className="font-medium tabular-nums text-slate-900">
                          {money(c.totalSpent)}
                        </Td>
                        <Td align="right" onClick={(e) => e.stopPropagation()}>
                          <Action
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsCustomerDrawerOpen(true);
                            }}
                          >
                            View
                          </Action>
                        </Td>
                      </Tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <EmptyRow colSpan={7}>
                        {customers.length === 0 ? 'No customers yet.' : 'No customers match this search.'}
                      </EmptyRow>
                    )}
                  </TBody>
                </TableCard>
              </div>
            )}

            {/* ============================ REVIEWS ============================ */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <Field label="Search">
                    <SearchField
                      icon={Search}
                      type="text"
                      placeholder="Product, customer or review text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Field>
                </Panel>

                <TableCard footer={<Pagination state={reviewPage} noun="reviews" />}>
                  <THead>
                    <Th>Product</Th>
                    <Th>Customer</Th>
                    <Th>Rating</Th>
                    <Th>Review</Th>
                    <Th>Date</Th>
                    <Th align="right">Status</Th>
                  </THead>
                  <TBody>
                    {reviewPage.pageItems.map((r) => (
                      <Tr key={r.id}>
                        <Td className="font-medium text-slate-900">
                          {r.products?.title || 'General review'}
                        </Td>
                        <Td className="text-slate-600">{r.users?.full_name || 'Customer'}</Td>
                        <Td>
                          <span className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5`}>
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3.5 w-3.5 ${
                                  i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                                }`}
                                aria-hidden="true"
                              />
                            ))}
                          </span>
                        </Td>
                        <Td className="max-w-md whitespace-normal text-slate-700">{r.comment}</Td>
                        <Td className="whitespace-nowrap text-slate-600">{shortDate(r.created_at)}</Td>
                        <Td align="right">
                          <StatusBadge status={r.status || 'approved'} />
                        </Td>
                      </Tr>
                    ))}
                    {filteredReviews.length === 0 && (
                      <EmptyRow colSpan={6}>
                        {reviews.length === 0 ? 'No reviews yet.' : 'No reviews match this search.'}
                      </EmptyRow>
                    )}
                  </TBody>
                </TableCard>
              </div>
            )}

            {/* ============================ MESSAGES ============================ */}
            {activeTab === 'messages' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Search" className="sm:col-span-2">
                      <SearchField
                        icon={Search}
                        type="text"
                        placeholder="Name, email or subject"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Field>
                    <Field label="Sort by">
                      <SelectField
                        value={messageSortOrder}
                        onChange={(e) => setMessageSortOrder(e.target.value as 'newest' | 'oldest')}
                      >
                        <option value="newest">Newest first</option>
                        <option value="oldest">Oldest first</option>
                      </SelectField>
                    </Field>
                  </div>
                </Panel>

                <TableCard footer={<Pagination state={messagePage} noun="messages" />}>
                  <THead>
                    <Th>From</Th>
                    <Th>Subject</Th>
                    <Th>Received</Th>
                    <Th>Status</Th>
                    <Th align="right">Actions</Th>
                  </THead>
                  <TBody>
                    {messagePage.pageItems.map((m) => (
                      <Tr
                        key={m.id}
                        onClick={() => {
                          setSelectedMessage(m);
                          setIsMessageModalOpen(true);
                        }}
                      >
                        <Td>
                          <p className="font-medium text-slate-900">{m.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{m.email}</p>
                        </Td>
                        <Td className="font-medium text-slate-900">{m.subject}</Td>
                        <Td className="whitespace-nowrap text-slate-600">{shortDate(m.created_at)}</Td>
                        {/* Editable in place: marking an enquiry replied is the
                            single most common action here, so it should not
                            require opening the message first. */}
                        <Td onClick={(e) => e.stopPropagation()}>
                          <SelectField
                            value={m.status === 'replied' ? 'replied' : 'not replied'}
                            disabled={updatingMessageId === m.id}
                            aria-label={`Reply status for ${m.name}`}
                            onChange={(e) => handleUpdateMessageStatus(m.id, e.target.value)}
                            className="h-8 w-36 text-xs"
                          >
                            {MESSAGE_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s === 'replied' ? 'Replied' : 'Not replied'}
                              </option>
                            ))}
                          </SelectField>
                        </Td>
                        <Td align="right" onClick={(e) => e.stopPropagation()}>
                          <Action
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSelectedMessage(m);
                              setIsMessageModalOpen(true);
                            }}
                          >
                            Read
                          </Action>
                        </Td>
                      </Tr>
                    ))}
                    {filteredMessages.length === 0 && (
                      <EmptyRow colSpan={5}>
                        {messages.length === 0 ? 'No messages yet.' : 'No messages match this search.'}
                      </EmptyRow>
                    )}
                  </TBody>
                </TableCard>
              </div>
            )}

            {/* ============================ SUBSCRIBERS ============================ */}
            {activeTab === 'subscribers' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <Field label="Search">
                    <SearchField
                      icon={Search}
                      type="text"
                      placeholder="Email address"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </Field>
                </Panel>

                <TableCard
                  footer={<Pagination state={subscriberPage} noun="subscribers" />}
                >
                  <THead>
                    <Th className="w-16" align="right">#</Th>
                    <Th>Email address</Th>
                    <Th align="right">Subscribed</Th>
                  </THead>
                  <TBody>
                    {subscriberPage.pageItems.map((s, idx) => (
                      <Tr key={s.id}>
                        {/* Continues across pages rather than restarting at 1. */}
                        <Td align="right" className="tabular-nums text-slate-400">
                          {subscriberPage.firstRow + idx}
                        </Td>
                        <Td className="font-medium text-slate-900">{s.email}</Td>
                        <Td align="right" className="whitespace-nowrap text-slate-600">
                          {shortDate(s.created_at)}
                        </Td>
                      </Tr>
                    ))}
                    {filteredSubscribers.length === 0 && (
                      <EmptyRow colSpan={3}>
                        {subscribers.length === 0
                          ? 'No newsletter subscribers yet.'
                          : 'No subscribers match this search.'}
                      </EmptyRow>
                    )}
                  </TBody>
                </TableCard>
              </div>
            )}

            {/* ============================ PROMO CODES ============================ */}
            {activeTab === 'coupons' && (
              <div className="space-y-4">
                <Panel bodyClassName="p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Search" className="sm:col-span-2">
                      <SearchField
                        icon={Search}
                        type="text"
                        placeholder="Code or description"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </Field>
                    <Field label="Status">
                      <SelectField
                        value={couponStatusFilter}
                        onChange={(e) => setCouponStatusFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        <option value="Live">Live</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Paused">Paused</option>
                        <option value="Expired">Expired</option>
                        <option value="Fully claimed">Fully claimed</option>
                      </SelectField>
                    </Field>
                    <div className="flex items-end">
                      <Action variant="primary" onClick={handleOpenCreateCoupon} className="w-full">
                        <Plus className="h-4 w-4" />
                        New promo code
                      </Action>
                    </div>
                  </div>
                </Panel>

                {coupons.length === 0 ? (
                  <Panel bodyClassName="p-0">
                    <EmptyState
                      icon={Ticket}
                      title="No promo codes yet"
                      description="Create a code and customers can apply it at checkout for a discount."
                      action={
                        <Action variant="primary" onClick={handleOpenCreateCoupon}>
                          <Plus className="h-4 w-4" />
                          New promo code
                        </Action>
                      }
                    />
                  </Panel>
                ) : (
                  <TableCard footer={<Pagination state={couponPage} noun="promo codes" />}>
                    <THead>
                      <Th>Code</Th>
                      <Th>Discount</Th>
                      <Th align="right">Min order</Th>
                      <Th>Valid until</Th>
                      <Th align="right">Used</Th>
                      <Th align="right">Given away</Th>
                      <Th>Status</Th>
                      <Th align="right">Actions</Th>
                    </THead>
                    <TBody>
                      {couponPage.pageItems.map((c) => {
                        const state = couponState(c);
                        const discountLabel =
                          c.discount_type === 'percentage'
                            ? `${Number(c.discount_value)}% off${
                                c.max_discount_amount ? ` (max ${money(c.max_discount_amount)})` : ''
                              }`
                            : `${money(c.discount_value)} off`;

                        return (
                          <Tr key={c.id}>
                            <Td>
                              <Mono className="font-medium text-slate-900">{c.code}</Mono>
                              {c.description && (
                                <p className="mt-0.5 max-w-xs truncate text-xs text-slate-500">
                                  {c.description}
                                </p>
                              )}
                            </Td>
                            <Td className="text-slate-700">{discountLabel}</Td>
                            <Td align="right" className="tabular-nums text-slate-600">
                              {Number(c.min_order_value) > 0 ? money(c.min_order_value) : '—'}
                            </Td>
                            <Td className="whitespace-nowrap text-slate-600">
                              {c.expires_at ? shortDate(c.expires_at) : 'No end date'}
                            </Td>
                            <Td align="right" className="tabular-nums text-slate-700">
                              {c.usage_count}
                              {c.usage_limit != null && (
                                <span className="text-slate-400"> / {c.usage_limit}</span>
                              )}
                            </Td>
                            <Td align="right" className="tabular-nums text-slate-700">
                              {money(c.total_discounted ?? 0)}
                            </Td>
                            <Td>
                              <Badge tone={state.tone}>{state.label}</Badge>
                            </Td>
                            <Td align="right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Action
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleToggleCoupon(c)}
                                >
                                  {c.is_active ? 'Pause' : 'Activate'}
                                </Action>
                                <Action
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleOpenEditCoupon(c)}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  Edit
                                </Action>
                                <IconAction
                                  label={`Delete ${c.code}`}
                                  variant="danger"
                                  onClick={() => setCouponToDelete(c)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </IconAction>
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                      {filteredCoupons.length === 0 && (
                        <EmptyRow colSpan={8}>No promo codes match this filter.</EmptyRow>
                      )}
                    </TBody>
                  </TableCard>
                )}
              </div>
            )}

            {/* ============================ SETTINGS ============================ */}
            {activeTab === 'settings' && (
              <div className="max-w-2xl space-y-4">
                <Panel
                  title="Connected services"
                  description="Content and data sources powering the storefront"
                  bodyClassName="p-0"
                >
                  <dl className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <dt className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <Database className="h-4 w-4 text-slate-400" />
                          Supabase
                        </dt>
                        <dd className="mt-1 truncate text-xs text-slate-500">
                          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured'}
                        </dd>
                      </div>
                      <Badge tone="success">Connected</Badge>
                    </div>

                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <div className="min-w-0">
                        <dt className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          <Layers className="h-4 w-4 text-slate-400" />
                          Sanity CMS
                        </dt>
                        <dd className="mt-1 truncate text-xs text-slate-500">
                          Project {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'heqswlxk'} ·{' '}
                          {sanityProducts.length} products, {sanityCategories.length} categories
                        </dd>
                      </div>
                      <Badge tone={sanityProducts.length > 0 ? 'success' : 'warning'}>
                        {sanityProducts.length > 0 ? 'Synced' : 'Empty'}
                      </Badge>
                    </div>
                  </dl>
                </Panel>

                <Panel title="Data summary" bodyClassName="p-0">
                  <dl className="divide-y divide-slate-100">
                    {[
                      { label: 'Orders', value: orders.length },
                      { label: 'Products tracked', value: products.length },
                      { label: 'Customers', value: customers.length },
                      { label: 'Reviews', value: reviews.length },
                      { label: 'Messages', value: messages.length },
                      { label: 'Newsletter subscribers', value: subscribers.length },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center justify-between px-5 py-3">
                        <dt className="text-sm text-slate-600">{row.label}</dt>
                        <dd className="text-sm font-medium tabular-nums text-slate-900">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Panel>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ---------------- Mobile navigation drawer ---------------- */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 z-[40] bg-slate-900/40 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-[45] flex w-72 flex-col border-r border-slate-200 bg-white lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                {brandBlock}
                <IconAction label="Close menu" variant="ghost" onClick={() => setIsMobileNavOpen(false)}>
                  <X className="h-4 w-4" />
                </IconAction>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4">{navList}</div>
              <div className="border-t border-slate-100 px-4 py-3">{userBlock}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ---------------- Order detail drawer ---------------- */}
      <Drawer
        open={isOrderDrawerOpen && !!selectedOrder}
        onClose={() => setIsOrderDrawerOpen(false)}
        title={selectedOrder ? `Order #${selectedOrder.order_number}` : ''}
        badge={selectedOrder ? <StatusBadge status={selectedOrder.payment_status} /> : undefined}
        subtitle={selectedOrder ? `Placed ${dateTime(selectedOrder.created_at)}` : undefined}
        width="max-w-2xl"
        footer={
          selectedOrder ? (
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-xs text-slate-500">
                ID <Mono>{selectedOrder.id}</Mono>
              </span>
              <Action
                variant="danger"
                size="sm"
                onClick={() => {
                  setOrderToDelete(selectedOrder);
                  setIsDeleteOrderDialogOpen(true);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Action>
            </div>
          ) : undefined
        }
      >
        {selectedOrder && (
          <>
            <DrawerSection title="Status and dispatch" icon={Truck}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Process status">
                  <SelectField value={modOrderStatus} onChange={(e) => setModOrderStatus(e.target.value)}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </SelectField>
                </Field>
                <Field label="Payment status">
                  <SelectField value={modPaymentStatus} onChange={(e) => setModPaymentStatus(e.target.value)}>
                    {PAYMENT_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </SelectField>
                </Field>
                <Field label="Tracking number">
                  <input
                    type="text"
                    placeholder="e.g. DELHIVERY-12345"
                    value={modTrackingNumber}
                    onChange={(e) => setModTrackingNumber(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-300 px-3 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </Field>
                <Field label="Estimated delivery">
                  <input
                    type="date"
                    value={modEstimatedDelivery}
                    onChange={(e) => setModEstimatedDelivery(e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-md border border-slate-300 px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </Field>
              </div>
              <div className="mt-4 flex justify-end">
                <Action variant="primary" size="sm" onClick={handleUpdateOrder} disabled={isSavingOrder}>
                  {isSavingOrder ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save changes
                </Action>
              </div>
            </DrawerSection>

            {/* Contact details are read from the order first: they are what the
                customer actually typed at checkout, and stay correct even if
                they later edit their profile. */}
            <DrawerSection title="Customer" icon={UserIcon}>
              {(() => {
                const name =
                  selectedOrder.shipping_address?.full_name ||
                  selectedOrder.users?.full_name ||
                  'Guest';
                const email = selectedOrder.customer_email || selectedOrder.users?.email || '';
                const phone =
                  selectedOrder.customer_phone ||
                  selectedOrder.shipping_address?.phone ||
                  selectedOrder.users?.phone ||
                  '';

                return (
                  <dl className="divide-y divide-slate-100">
                    <DetailRow label="Name">{name}</DetailRow>
                    <DetailRow label="Email">
                      {email ? (
                        <span className="inline-flex items-center gap-1.5">
                          <a href={`mailto:${email}`} className="break-all hover:underline">
                            {email}
                          </a>
                          <IconAction
                            label="Copy email"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleCopyToClipboard(email, 'Email')}
                          >
                            <Copy className="h-3 w-3" />
                          </IconAction>
                        </span>
                      ) : (
                        <span className="text-slate-500">Not provided</span>
                      )}
                    </DetailRow>
                    <DetailRow label="Phone">
                      {phone ? (
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <a href={`tel:${phone}`} className="hover:underline">
                            {phone}
                          </a>
                          <IconAction
                            label="Copy phone"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleCopyToClipboard(phone, 'Phone')}
                          >
                            <Copy className="h-3 w-3" />
                          </IconAction>
                        </span>
                      ) : (
                        <span className="text-slate-500">Not provided</span>
                      )}
                    </DetailRow>
                  </dl>
                );
              })()}
            </DrawerSection>

            <DrawerSection
              title="Delivery address"
              icon={MapPin}
              action={
                selectedOrder.shipping_address ? (
                  <IconAction
                    label="Copy full address"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      const a = selectedOrder.shipping_address!;
                      handleCopyToClipboard(
                        [
                          a.full_name,
                          a.address_line_1,
                          a.address_line_2,
                          `${a.city}, ${a.state} ${a.postal_code}`,
                          a.country,
                          a.phone,
                        ]
                          .filter(Boolean)
                          .join('\n'),
                        'Address'
                      );
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </IconAction>
                ) : undefined
              }
            >
              {selectedOrder.shipping_address ? (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Recipient</dt>
                    <dd className="mt-1 text-sm font-medium text-slate-900">
                      {selectedOrder.shipping_address.full_name}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Street address</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-slate-900">
                      {selectedOrder.shipping_address.address_line_1}
                      {selectedOrder.shipping_address.address_line_2 && (
                        <>
                          <br />
                          {selectedOrder.shipping_address.address_line_2}
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">City</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {selectedOrder.shipping_address.city}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">State</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {selectedOrder.shipping_address.state}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">PIN code</dt>
                    <dd className="mt-1 text-sm tabular-nums text-slate-900">
                      {selectedOrder.shipping_address.postal_code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Country</dt>
                    <dd className="mt-1 text-sm text-slate-900">
                      {selectedOrder.shipping_address.country}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-500">Delivery phone</dt>
                    <dd className="mt-1 text-sm tabular-nums text-slate-900">
                      {selectedOrder.shipping_address.phone || selectedOrder.customer_phone || '—'}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-slate-500">No shipping address on this order.</p>
              )}
            </DrawerSection>

            {/* One card per item, each field on its own labelled line. A packing
                slip has to be readable at a glance, so nothing is abbreviated
                into badges or run together on one row. */}
            <DrawerSection
              title={`Items (${selectedOrder.order_items.length})`}
              icon={ShoppingBag}
            >
              <ul className="space-y-3">
                {selectedOrder.order_items.map((item, idx) => (
                  <li key={item.id} className="rounded-md border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Item {idx + 1}</p>
                        <p className="mt-1 text-sm font-medium leading-snug text-slate-900">
                          {item.product_name || item.products?.title || 'Product'}
                        </p>
                      </div>
                      <span className="flex-shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                        {money(item.price * item.quantity)}
                      </span>
                    </div>

                    <dl className="mt-3.5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-slate-100 pt-3.5 sm:grid-cols-4">
                      <div>
                        <dt className="text-xs text-slate-500">Size</dt>
                        <dd className="mt-1 text-sm font-medium uppercase text-slate-900">
                          {item.size || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Colour</dt>
                        <dd className="mt-1 text-sm font-medium text-slate-900">
                          {item.color || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Quantity</dt>
                        <dd className="mt-1 text-sm font-medium tabular-nums text-slate-900">
                          {item.quantity}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-slate-500">Unit price</dt>
                        <dd className="mt-1 text-sm font-medium tabular-nums text-slate-900">
                          {money(item.price)}
                        </dd>
                      </div>
                    </dl>
                  </li>
                ))}
                {selectedOrder.order_items.length === 0 && (
                  <li className="text-sm text-slate-500">No items recorded on this order.</li>
                )}
              </ul>
            </DrawerSection>

            <DrawerSection title="Payment summary" icon={IndianRupee}>
              <dl className="space-y-1">
                <DetailRow label="Subtotal">{money(selectedOrder.subtotal ?? selectedOrder.total)}</DetailRow>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <DetailRow
                    label={
                      selectedOrder.coupon_code
                        ? `Discount (${selectedOrder.coupon_code})`
                        : 'Discount'
                    }
                  >
                    <span className="text-emerald-700">
                      −{money(selectedOrder.discount_amount)}
                    </span>
                  </DetailRow>
                )}
                <DetailRow label="Shipping">{money(selectedOrder.shipping_cost)}</DetailRow>
                <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <dt className="text-sm font-medium text-slate-900">Total</dt>
                  <dd className="text-base font-semibold tabular-nums text-slate-900">
                    {money(selectedOrder.total)}
                  </dd>
                </div>
              </dl>
            </DrawerSection>
          </>
        )}
      </Drawer>

      {/* ---------------- Message detail drawer ---------------- */}
      <Drawer
        open={isMessageModalOpen && !!selectedMessage}
        onClose={() => setIsMessageModalOpen(false)}
        title={selectedMessage?.subject || 'Message'}
        badge={
          selectedMessage ? (
            <Badge tone={selectedMessage.status === 'replied' ? 'success' : 'warning'}>
              {selectedMessage.status === 'replied' ? 'Replied' : 'Not replied'}
            </Badge>
          ) : undefined
        }
        subtitle={selectedMessage ? `Received ${dateTime(selectedMessage.created_at)}` : undefined}
        width="max-w-lg"
      >
        {selectedMessage && (
          <>
            <DrawerSection title="Sender" icon={UserIcon}>
              <dl className="divide-y divide-slate-100">
                <DetailRow label="Name">{selectedMessage.name}</DetailRow>
                <DetailRow label="Email">
                  <span className="inline-flex items-center gap-1.5">
                    <a href={`mailto:${selectedMessage.email}`} className="hover:underline">
                      {selectedMessage.email}
                    </a>
                    <IconAction
                      label="Copy email"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleCopyToClipboard(selectedMessage.email, 'Email address')}
                    >
                      <Copy className="h-3 w-3" />
                    </IconAction>
                  </span>
                </DetailRow>
                <DetailRow label="Phone">
                  {selectedMessage.phone ? (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {selectedMessage.phone}
                      <IconAction
                        label="Copy phone"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(selectedMessage.phone, 'Phone number')}
                      >
                        <Copy className="h-3 w-3" />
                      </IconAction>
                    </span>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </DetailRow>
              </dl>
            </DrawerSection>

            <DrawerSection title="Message" icon={Inbox}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {selectedMessage.message}
              </p>
            </DrawerSection>

            <DrawerSection title="Reply status" icon={Check}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Field label="Status" className="flex-1">
                  <SelectField
                    value={selectedMessage.status === 'replied' ? 'replied' : 'not replied'}
                    disabled={updatingMessageId === selectedMessage.id}
                    onChange={(e) => handleUpdateMessageStatus(selectedMessage.id, e.target.value)}
                  >
                    {MESSAGE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s === 'replied' ? 'Replied' : 'Not replied'}
                      </option>
                    ))}
                  </SelectField>
                </Field>
                <Action
                  variant="secondary"
                  onClick={() => {
                    window.location.href = `mailto:${selectedMessage.email}?subject=${encodeURIComponent(
                      `Re: ${selectedMessage.subject}`
                    )}`;
                  }}
                >
                  <Mail className="h-4 w-4" />
                  Reply by email
                </Action>
              </div>
            </DrawerSection>
          </>
        )}
      </Drawer>

      {/* ---------------- Customer detail drawer ---------------- */}
      <Drawer
        open={isCustomerDrawerOpen && !!selectedCustomer}
        onClose={() => setIsCustomerDrawerOpen(false)}
        title={selectedCustomer?.fullName || 'Customer'}
        badge={
          selectedCustomer?.role === 'admin' ? <Badge tone="danger">Admin</Badge> : undefined
        }
        subtitle={selectedCustomer ? `Joined ${shortDate(selectedCustomer.createdAt)}` : undefined}
        width="max-w-lg"
      >
        {selectedCustomer && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500">Orders placed</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                  {selectedCustomer.ordersCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500">Total spent</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900">
                  {money(selectedCustomer.totalSpent)}
                </p>
              </div>
            </div>

            <DrawerSection title="Contact" icon={UserIcon}>
              <dl className="divide-y divide-slate-100">
                <DetailRow label="Email">
                  <span className="inline-flex items-center gap-1.5">
                    <a href={`mailto:${selectedCustomer.email}`} className="break-all hover:underline">
                      {selectedCustomer.email}
                    </a>
                    <IconAction
                      label="Copy email"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleCopyToClipboard(selectedCustomer.email, 'Email address')}
                    >
                      <Copy className="h-3 w-3" />
                    </IconAction>
                  </span>
                </DetailRow>
                <DetailRow label="Phone">
                  {selectedCustomer.phone && selectedCustomer.phone !== '—' ? (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      {selectedCustomer.phone}
                      <IconAction
                        label="Copy phone"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => handleCopyToClipboard(selectedCustomer.phone, 'Phone number')}
                      >
                        <Copy className="h-3 w-3" />
                      </IconAction>
                    </span>
                  ) : (
                    <span className="text-slate-500">Not provided</span>
                  )}
                </DetailRow>
                <DetailRow label="Role">
                  <span className="capitalize">{selectedCustomer.role}</span>
                </DetailRow>
              </dl>
            </DrawerSection>

            <DrawerSection title="Saved addresses" icon={MapPin}>
              {selectedCustomer.addresses && selectedCustomer.addresses.length > 0 ? (
                <ul className="space-y-3">
                  {selectedCustomer.addresses.map((address) => (
                    <li key={address.id} className="rounded-md border border-slate-200 px-3.5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">{address.full_name}</p>
                        {address.is_default && <Badge tone="neutral">Default</Badge>}
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-slate-500">{address.phone}</p>
                      <address className="mt-1.5 text-sm not-italic leading-relaxed text-slate-700">
                        {address.address_line_1}
                        {address.address_line_2 && `, ${address.address_line_2}`}
                        <span className="block">
                          {address.city}, {address.state} —{' '}
                          <span className="tabular-nums">{address.postal_code}</span>
                        </span>
                      </address>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No saved addresses.</p>
              )}
            </DrawerSection>
          </>
        )}
      </Drawer>

      {/* ---------------- Product create / edit dialog ---------------- */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl gap-4 overflow-y-auto rounded-lg border-slate-200 p-6">
          <DialogHeader className="border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 font-sans text-base font-semibold normal-case tracking-normal text-slate-900">
              <PackagePlus className="h-4 w-4 text-slate-400" />
              {editingProduct ? `Edit ${editingProduct.title}` : 'Add product'}
            </DialogTitle>
            <DialogDescription className={DIALOG_DESC}>
              {editingProduct
                ? 'Update the price, visibility and stock for each size.'
                : 'Pick a product from your Sanity catalogue or enter one manually, then set stock for each size.'}
            </DialogDescription>
          </DialogHeader>

          {!editingProduct && (
            <div className="flex gap-2">
              <Action
                type="button"
                size="sm"
                variant={!isCustomEntry ? 'primary' : 'secondary'}
                onClick={() => setIsCustomEntry(false)}
              >
                <Layers className="h-3.5 w-3.5" />
                From Sanity catalogue
              </Action>
              <Action
                type="button"
                size="sm"
                variant={isCustomEntry ? 'primary' : 'secondary'}
                onClick={() => setIsCustomEntry(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
                Enter manually
              </Action>
            </div>
          )}

          <form onSubmit={handleSaveProduct} className="space-y-4">
            {!isCustomEntry && !editingProduct ? (
              <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Category">
                    <SelectField
                      value={selectedSanityCategory}
                      onChange={(e) => {
                        setSelectedSanityCategory(e.target.value);
                        const categoryProducts = e.target.value
                          ? sanityProducts.filter(
                              (p) => p.category?.toLowerCase() === e.target.value.toLowerCase()
                            )
                          : sanityProducts;
                        if (categoryProducts.length > 0) {
                          const first = categoryProducts[0];
                          const slug = first.slug || first.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                          handleSelectSanityProduct(slug);
                        }
                      }}
                    >
                      <option value="">All categories</option>
                      {sanityCategories.map((c: any) => (
                        <option key={c._id || c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </SelectField>
                  </Field>

                  <Field label="Product">
                    <SelectField
                      value={selectedSanityProductSlug}
                      onChange={(e) => handleSelectSanityProduct(e.target.value)}
                    >
                      {modalSanityProducts.map((sp: any) => {
                        const slug = sp.slug || sp.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return (
                          <option key={sp._id || slug} value={slug}>
                            {sp.name} — ₹{sp.price}
                          </option>
                        );
                      })}
                    </SelectField>
                  </Field>
                </div>

                <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-900">
                    {productForm.title || 'No product selected'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {categories.find((c) => c.id === productForm.category_id)?.name ||
                      'Uncategorised'}{' '}
                    · ₹{productForm.price || '0'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Product title">
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kolkata Oversized Tee"
                      value={productForm.title}
                      onChange={(e) => {
                        const titleVal = e.target.value;
                        setProductForm((prev) => ({
                          ...prev,
                          title: titleVal,
                          slug: !editingProduct
                            ? titleVal
                                .toLowerCase()
                                .replace(/[^a-z0-9]+/g, '-')
                                .replace(/(^-|-$)/g, '')
                            : prev.slug,
                        }));
                      }}
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </Field>

                  {/* Values are Supabase category ids, matching the foreign key
                      on `products.category_id`. The list is kept in step with
                      Sanity by the products endpoint. */}
                  <Field
                    label="Category"
                    hint={categories.length === 0 ? 'Run Sync to load categories from Sanity.' : undefined}
                  >
                    <SelectField
                      value={productForm.category_id}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, category_id: e.target.value }))}
                    >
                      <option value="">Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </SelectField>
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Selling price (₹)">
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="899"
                      value={productForm.price}
                      onChange={(e) => setProductForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </Field>

                  <Field label="Visibility">
                    <SelectField
                      value={productForm.status}
                      onChange={(e) =>
                        setProductForm((prev) => ({
                          ...prev,
                          status: e.target.value as 'active' | 'draft',
                        }))
                      }
                    >
                      <option value="active">Active — visible in store</option>
                      <option value="draft">Draft — hidden</option>
                    </SelectField>
                  </Field>
                </div>
              </>
            )}

            {/* Size-wise stock */}
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Stock by size</h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {productForm.sizes.reduce((sum, s) => sum + (parseInt(String(s.stock), 10) || 0), 0)}{' '}
                    units in total
                  </p>
                </div>

                <div className="flex items-end gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 3XL"
                    value={customSizeInput}
                    onChange={(e) => setCustomSizeInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSize();
                      }
                    }}
                    aria-label="New size name"
                    className="h-9 w-28 rounded-md border border-slate-300 px-2.5 text-sm uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                  <Action type="button" size="sm" variant="secondary" onClick={handleAddCustomSize}>
                    <Plus className="h-3.5 w-3.5" />
                    Add size
                  </Action>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                {productForm.sizes.map((s, idx) => (
                  <div key={idx} className="group rounded-md border border-slate-200 px-2.5 py-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-sm font-medium uppercase text-slate-900">{s.size}</span>
                      {productForm.sizes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(idx)}
                          title={`Remove size ${s.size}`}
                          aria-label={`Remove size ${s.size}`}
                          className="cursor-pointer text-slate-300 transition-colors hover:text-rose-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={s.stock}
                      aria-label={`Stock for size ${s.size}`}
                      onChange={(e) => handleProductFormSizeChange(idx, parseInt(e.target.value, 10) || 0)}
                      className="h-9 w-full rounded-md border border-slate-300 px-2 text-center text-sm tabular-nums text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="border-slate-100 pt-4">
              <Action type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)}>
                Cancel
              </Action>
              <Action type="submit" variant="primary" disabled={isSavingProduct}>
                {isSavingProduct ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingProduct ? 'Save changes' : 'Add product'}
              </Action>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- Promo code create / edit ---------------- */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl gap-4 overflow-y-auto rounded-lg border-slate-200 p-6">
          <DialogHeader className="border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 font-sans text-base font-semibold normal-case tracking-normal text-slate-900">
              <Ticket className="h-4 w-4 text-slate-400" />
              {editingCoupon ? `Edit ${editingCoupon.code}` : 'New promo code'}
            </DialogTitle>
            <DialogDescription className={DIALOG_DESC}>
              Customers type this code at checkout. The discount is recalculated on the server when
              they pay, so limits and dates are always enforced.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCoupon} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Code" hint="Letters, numbers, hyphens and underscores.">
                <input
                  type="text"
                  required
                  placeholder="DURGA20"
                  value={couponForm.code}
                  onChange={(e) =>
                    setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                  }
                  autoComplete="off"
                  spellCheck={false}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 font-mono text-sm uppercase tracking-wide text-slate-900 placeholder:font-sans placeholder:normal-case placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>

              <Field label="Internal note" hint="Only shown here, never to customers.">
                <input
                  type="text"
                  placeholder="Puja campaign"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm((p) => ({ ...p, description: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Discount type">
                <SelectField
                  value={couponForm.discount_type}
                  onChange={(e) =>
                    setCouponForm((p) => ({
                      ...p,
                      discount_type: e.target.value as 'percentage' | 'fixed',
                      // A cap is meaningless on a fixed-amount coupon.
                      max_discount_amount: e.target.value === 'fixed' ? '' : p.max_discount_amount,
                    }))
                  }
                >
                  <option value="percentage">Percentage off</option>
                  <option value="fixed">Fixed amount off</option>
                </SelectField>
              </Field>

              <Field label={couponForm.discount_type === 'percentage' ? 'Percentage (%)' : 'Amount (₹)'}>
                <input
                  type="number"
                  required
                  min="0"
                  step={couponForm.discount_type === 'percentage' ? '0.01' : '1'}
                  max={couponForm.discount_type === 'percentage' ? '100' : undefined}
                  placeholder={couponForm.discount_type === 'percentage' ? '20' : '300'}
                  value={couponForm.discount_value}
                  onChange={(e) => setCouponForm((p) => ({ ...p, discount_value: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>

              <Field
                label="Maximum discount (₹)"
                hint={
                  couponForm.discount_type === 'percentage'
                    ? 'Optional cap. Leave blank for none.'
                    : 'Only applies to percentage codes.'
                }
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="500"
                  disabled={couponForm.discount_type !== 'percentage'}
                  value={couponForm.max_discount_amount}
                  onChange={(e) =>
                    setCouponForm((p) => ({ ...p, max_discount_amount: e.target.value }))
                  }
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Minimum order (₹)" hint="Leave blank for no minimum.">
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="999"
                  value={couponForm.min_order_value}
                  onChange={(e) => setCouponForm((p) => ({ ...p, min_order_value: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>

              <Field label="Total uses" hint="Blank means unlimited.">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="100"
                  value={couponForm.usage_limit}
                  onChange={(e) => setCouponForm((p) => ({ ...p, usage_limit: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>

              <Field label="Uses per customer" hint="Blank means unlimited.">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="1"
                  value={couponForm.per_user_limit}
                  onChange={(e) => setCouponForm((p) => ({ ...p, per_user_limit: e.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Starts" hint="Blank means it starts immediately.">
                <input
                  type="datetime-local"
                  value={couponForm.starts_at}
                  onChange={(e) => setCouponForm((p) => ({ ...p, starts_at: e.target.value }))}
                  className="h-10 w-full cursor-pointer rounded-md border border-slate-300 px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>

              <Field label="Ends" hint="Blank means it never expires.">
                <input
                  type="datetime-local"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm((p) => ({ ...p, expires_at: e.target.value }))}
                  className="h-10 w-full cursor-pointer rounded-md border border-slate-300 px-3 text-sm text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </Field>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={couponForm.is_active}
                onChange={(e) => setCouponForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="mt-0.5 h-4 w-4 cursor-pointer accent-slate-900"
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">Active</span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  Customers can only use the code while this is on.
                </span>
              </span>
            </label>

            <DialogFooter className="border-slate-100 pt-4">
              <Action type="button" variant="secondary" onClick={() => setIsCouponModalOpen(false)}>
                Cancel
              </Action>
              <Action type="submit" variant="primary" disabled={isSavingCoupon}>
                {isSavingCoupon ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingCoupon ? 'Save changes' : 'Create code'}
              </Action>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete promo code confirmation ---------------- */}
      <Dialog open={!!couponToDelete} onOpenChange={(open) => !open && setCouponToDelete(null)}>
        <DialogContent className="max-w-md gap-4 rounded-lg border-slate-200 p-6">
          <DialogHeader className="border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 font-sans text-base font-semibold normal-case tracking-normal text-slate-900">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              Delete this promo code?
            </DialogTitle>
            <DialogDescription className={DIALOG_DESC}>
              <Mono className="font-medium text-slate-900">{couponToDelete?.code}</Mono> will stop
              working immediately.
              {(couponToDelete?.redeemed_count ?? 0) > 0
                ? ' Because it has already been used, it will be deactivated rather than deleted, so past orders keep their record.'
                : ' It has never been used, so it will be deleted outright.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-slate-100 pt-4">
            <Action variant="secondary" onClick={() => setCouponToDelete(null)}>
              Cancel
            </Action>
            <Action
              variant="primary"
              onClick={handleDeleteCoupon}
              disabled={isDeletingCoupon}
              className="border-rose-600 bg-rose-600 hover:bg-rose-700"
            >
              {isDeletingCoupon ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {(couponToDelete?.redeemed_count ?? 0) > 0 ? 'Deactivate' : 'Delete'}
            </Action>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete order confirmation ---------------- */}
      <Dialog open={isDeleteOrderDialogOpen} onOpenChange={setIsDeleteOrderDialogOpen}>
        <DialogContent className="max-w-md gap-4 rounded-lg border-slate-200 p-6">
          <DialogHeader className="border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 font-sans text-base font-semibold normal-case tracking-normal text-slate-900">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              Delete this order?
            </DialogTitle>
            <DialogDescription className={DIALOG_DESC}>
              Order{' '}
              <Mono className="font-medium text-slate-900">#{orderToDelete?.order_number}</Mono> and all
              of its line items will be permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-slate-100 pt-4">
            <Action variant="secondary" onClick={() => setIsDeleteOrderDialogOpen(false)}>
              Cancel
            </Action>
            <Action
              variant="primary"
              onClick={handleDeleteOrder}
              disabled={isDeletingOrder}
              className="border-rose-600 bg-rose-600 hover:bg-rose-700"
            >
              {isDeletingOrder ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete order
            </Action>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------- Delete product confirmation ---------------- */}
      <Dialog open={isDeleteProductDialogOpen} onOpenChange={setIsDeleteProductDialogOpen}>
        <DialogContent className="max-w-md gap-4 rounded-lg border-slate-200 p-6">
          <DialogHeader className="border-slate-100 pb-3">
            <DialogTitle className="flex items-center gap-2 font-sans text-base font-semibold normal-case tracking-normal text-slate-900">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              Delete this product?
            </DialogTitle>
            <DialogDescription className={DIALOG_DESC}>
              <span className="font-medium text-slate-900">{productToDelete?.title}</span> will be removed
              from inventory tracking, along with its size-wise stock. This does not delete it from
              Sanity — it stays visible in the store.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-slate-100 pt-4">
            <Action variant="secondary" onClick={() => setIsDeleteProductDialogOpen(false)}>
              Cancel
            </Action>
            <Action
              variant="primary"
              onClick={handleDeleteProduct}
              disabled={isDeletingProduct}
              className="border-rose-600 bg-rose-600 hover:bg-rose-700"
            >
              {isDeletingProduct ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Delete product
            </Action>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
