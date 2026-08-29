'use client';

/**
 * Shared presentation primitives for the admin console.
 *
 * The console previously styled every surface inline, which drifted: label text
 * appeared at seven different sizes, monospace was used for prose, and six
 * off-scale colours (`slate-450`, `slate-655`, …) silently rendered nothing.
 * Routing every panel, table and badge through these primitives keeps one
 * visual language across all eight tabs.
 *
 * Type scale — deliberately small and fixed:
 *   text-sm   body / table cells / form values
 *   text-xs   column headers, labels, secondary meta
 * Nothing below 12px. Monospace is reserved for identifiers a human may need to
 * read back character by character (order numbers, SKUs, tracking codes);
 * numbers use `tabular-nums` in the sans face so columns align without it.
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '../../../lib/utils';

/** Brand red, matching the storefront. Used for identity, never for chrome. */
export const BRAND = '#a6101b';

/* ------------------------------------------------------------------ */
/* Status                                                              */
/* ------------------------------------------------------------------ */

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

/**
 * Map a backend status string to a colour tone.
 *
 * Order and payment states share this map because they never collide:
 * `paid`/`delivered` both read as done, `failed`/`cancelled` both as broken.
 */
export function statusTone(status?: string | null): Tone {
  switch ((status || '').toLowerCase()) {
    case 'paid':
    case 'delivered':
    case 'active':
    case 'approved':
      return 'success';
    case 'shipped':
    case 'confirmed':
      return 'info';
    case 'pending':
    case 'processing':
    case 'draft':
      return 'warning';
    case 'failed':
    case 'cancelled':
    case 'refunded':
    case 'rejected':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize whitespace-nowrap',
        TONE_CLASS[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Retail stock state for a quantity.
 *
 * Wording follows the usual e-commerce convention — "In stock" / "Low stock" /
 * "Out of stock" — so it reads the same way as any other storefront back office.
 */
export function stockLevel(units: number, lowThreshold = 5): { label: string; tone: Tone } {
  if (!Number.isFinite(units) || units <= 0) return { label: 'Out of stock', tone: 'danger' };
  if (units <= lowThreshold) return { label: 'Low stock', tone: 'warning' };
  return { label: 'In stock', tone: 'success' };
}

/** Badge driven directly by a status string. */
export function StatusBadge({ status, className }: { status?: string | null; className?: string }) {
  return (
    <Badge tone={statusTone(status)} className={className}>
      {status || '—'}
    </Badge>
  );
}

/* ------------------------------------------------------------------ */
/* Surfaces                                                            */
/* ------------------------------------------------------------------ */

/** White card with an optional titled header and right-aligned action slot. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('rounded-lg border border-slate-200 bg-white', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
          </div>
          {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      <div className={cn(bodyClassName ?? 'p-5')}>{children}</div>
    </section>
  );
}

/** Metric tile for the overview grid. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

/**
 * Card wrapper for a table. Horizontal overflow is scoped here so a wide table
 * scrolls inside its own card instead of widening the whole page.
 */
export function TableCard({
  children,
  title,
  action,
  footer,
  className,
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200 bg-white', className)}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          {title && <h2 className="text-sm font-semibold text-slate-900">{title}</h2>}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </header>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">{children}</table>
      </div>
      {footer && (
        <footer className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-xs text-slate-500">
          {footer}
        </footer>
      )}
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="bg-slate-50 text-slate-500">
      <tr className="border-b border-slate-200">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = 'left',
  className,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        'px-5 py-3 text-xs font-medium whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors hover:bg-slate-50',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = 'left',
  className,
  colSpan,
  onClick,
}: {
  children?: React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
  colSpan?: number;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <td
      colSpan={colSpan}
      onClick={onClick}
      className={cn(
        'px-5 py-3.5 align-middle text-sm text-slate-700',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
    >
      {children}
    </td>
  );
}

/** Full-width message row for an empty or filtered-out table. */
export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-12 text-center text-sm text-slate-500">
        {children}
      </td>
    </tr>
  );
}

/** Empty state for non-table regions. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-50 text-slate-400">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagination                                                          */
/* ------------------------------------------------------------------ */

/** Rows shown per page in every console table. */
export const PAGE_SIZE = 10;

export interface PaginationState<T> {
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  pageItems: T[];
  /** 1-based index of the first row on this page (0 when the list is empty). */
  firstRow: number;
  /** 1-based index of the last row on this page. */
  lastRow: number;
  total: number;
}

/**
 * Client-side pagination over an already-filtered array.
 *
 * The console loads each collection in one request and filters in memory, so
 * paging here keeps the row count manageable without another round trip.
 * The page resets whenever the filtered list shrinks past the current page —
 * otherwise narrowing a search while on page 4 leaves an empty table.
 */
export function usePagination<T>(items: T[], pageSize: number = PAGE_SIZE): PaginationState<T> {
  const [page, setPage] = React.useState(1);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  React.useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // Guard the slice as well as the effect: the effect runs after render, so the
  // first render following a shrink would otherwise slice past the end.
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page: safePage,
    setPage,
    totalPages,
    pageItems,
    firstRow: total === 0 ? 0 : start + 1,
    lastRow: Math.min(start + pageSize, total),
    total,
  };
}

/**
 * Table footer showing the visible range and page controls.
 *
 * `noun` is used to build the summary, e.g. "Showing 1–10 of 47 orders".
 */
export function Pagination<T>({
  state,
  noun,
}: {
  state: PaginationState<T>;
  noun: string;
}) {
  const { page, setPage, totalPages, firstRow, lastRow, total } = state;

  // Compact window of page numbers around the current page.
  const pages: number[] = [];
  const from = Math.max(1, Math.min(page - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) pages.push(i);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        {total === 0 ? `No ${noun}` : `Showing ${firstRow}–${lastRow} of ${total} ${noun}`}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label={`${noun} pagination`}>
          <IconAction
            label="Previous page"
            variant="secondary"
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </IconAction>

          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'h-8 min-w-8 cursor-pointer rounded-md border px-2 text-xs tabular-nums transition-colors',
                p === page
                  ? 'border-slate-900 bg-slate-900 font-medium text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              {p}
            </button>
          ))}

          <IconAction
            label="Next page"
            variant="secondary"
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </IconAction>
        </nav>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const CONTROL =
  'w-full rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 ' +
  'transition-colors focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500';

export function TextField({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(CONTROL, 'h-10 px-3', className)} />;
}

export function SelectField({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(CONTROL, 'h-10 cursor-pointer px-3 pr-8', className)}>
      {children}
    </select>
  );
}

export function TextAreaField({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, 'px-3 py-2', className)} />;
}

/** Label + control pairing used throughout forms and filter bars. */
export function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-medium text-slate-600">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/** Search input with a leading icon. */
export function SearchField({
  icon: Icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input {...props} className={cn(CONTROL, 'h-10 pl-9 pr-3', className)} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

const ACTION_CLASS: Record<ActionVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-slate-300',
  danger: 'bg-white text-rose-600 hover:bg-rose-50 border border-rose-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
};

/**
 * Console button. Deliberately separate from the storefront `Button`, which is
 * uppercase, wide-tracked and 48px tall — correct for a shop, far too loud for
 * a data table.
 */
export function Action({
  variant = 'secondary',
  size = 'md',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ActionVariant;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-10 px-3.5 text-sm',
        ACTION_CLASS[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/** Square icon-only button, sized to sit inline with `Action size="sm"`. */
export function IconAction({
  label,
  variant = 'secondary',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: ActionVariant;
}) {
  return (
    <button
      {...props}
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        ACTION_CLASS[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Detail drawer                                                       */
/* ------------------------------------------------------------------ */

/**
 * Right-hand slide-over used for order, customer and message detail.
 *
 * Owns its own `AnimatePresence` so a caller only has to pass `open`.
 *
 * Layer order matters here and is deliberate:
 *   z-30  sticky page header
 *   z-40  drawer backdrop
 *   z-45  drawer panel
 *   z-50  Radix Dialog (see `ui/dialog`)
 *   z-100 toasts (see `ui/toast`)
 * The drawer must stay *below* the dialog: the delete confirmations are opened
 * from inside the order drawer, and a drawer above them would hide the very
 * prompt the admin has to answer.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  footer,
  children,
  width = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[40] bg-slate-900/40"
            aria-hidden="true"
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className={cn(
              'fixed inset-y-0 right-0 z-[45] flex w-full flex-col border-l border-slate-200 bg-white shadow-xl',
              width
            )}
          >
            <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{title}</h2>
                  {badge}
                </div>
                {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
              </div>
              <IconAction label="Close" variant="ghost" onClick={onClose}>
                <X className="h-4 w-4" />
              </IconAction>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">{children}</div>

            {footer && (
              <footer className="flex-shrink-0 border-t border-slate-200 bg-slate-50 px-6 py-3">
                {footer}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/** Titled group inside a drawer. */
export function DrawerSection({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          {Icon && <Icon className="h-3.5 w-3.5 text-slate-500" />}
          {title}
        </h3>
        {action}
      </header>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

/**
 * Label/value row for drawer detail. The value column is allowed to wrap so a
 * long address or email is never clipped.
 */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-1.5 text-sm', className)}>
      <dt className="flex-shrink-0 text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

/** Monospace treatment for identifiers meant to be read or copied literally. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[13px] tracking-tight', className)}>{children}</span>;
}

/** Consistent rupee formatting. */
export function money(amount: number | null | undefined): string {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

/** Consistent short date. */
export function shortDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Date with time, for records where the hour matters. */
export function dateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
