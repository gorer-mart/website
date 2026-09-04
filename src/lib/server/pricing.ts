import { z } from "zod";
import { client as sanityClient } from "@/lib/sanity";

/**
 * Authoritative cart pricing.
 *
 * The browser sends what it *thinks* each line costs; this module ignores that
 * and re-derives every price from Sanity. It is shared by the coupon preview
 * endpoint and by order creation so both compute the same subtotal from the
 * same rules — a discount quoted at checkout must be the discount charged.
 *
 * Deliberately free of side effects: no rows are written here, so the preview
 * endpoint can price a cart without creating product records.
 */

export const MAX_QTY_PER_LINE = 10;
export const MAX_LINES = 20;
/** ₹5,00,000 sanity ceiling on a single online order. */
export const MAX_ORDER_VALUE = 500_000;

export const cartItemSchema = z.object({
  _id: z.string().trim().min(1).max(200).optional(),
  id: z.union([z.string().trim().min(1).max(200), z.number()]).optional(),
  name: z.string().trim().max(300).optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().positive().max(MAX_QTY_PER_LINE),
  size: z.string().trim().max(40).optional(),
  color: z.string().trim().max(60).optional(),
});

export type CartItemInput = z.infer<typeof cartItemSchema>;

export interface CatalogProduct {
  _id: string;
  id?: number | string | null;
  name?: string | null;
  slug?: string | null;
  price?: number | null;
  sizes?: string[] | null;
}

export interface PricedLine {
  product: CatalogProduct;
  quantity: number;
  unitPrice: number;
  size: string | null;
  color: string | null;
  name: string;
}

export type PricingResult =
  | { ok: true; subtotal: number; lines: PricedLine[] }
  | { ok: false; status: number; message: string };

/** Round to paise, so repeated arithmetic cannot drift. */
export function toMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Resolve every cart line against the live catalog and total it.
 *
 * Rejects the cart when an item has vanished, when the client's price no longer
 * matches the catalog, or when a size is not one the product offers — the same
 * checks the payment path has always made.
 */
export async function priceCart(cartItems: CartItemInput[]): Promise<PricingResult> {
  const sanityIds = cartItems
    .map((item) => item._id ?? (typeof item.id === "string" ? item.id : undefined))
    .filter((v): v is string => typeof v === "string");

  const numericIds = cartItems
    .map((item) => {
      const raw = item.id ?? item._id;
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : undefined;
    })
    .filter((v): v is number => typeof v === "number");

  const catalog: CatalogProduct[] = await sanityClient.fetch(
    `*[_type == "product" && (_id in $sanityIds || id in $numericIds)] {
      _id, id, name, "slug": slug.current, price, sizes
    }`,
    { sanityIds, numericIds }
  );

  // Index by every identifier a client could legitimately send.
  const byKey = new Map<string, CatalogProduct>();
  for (const product of catalog) {
    byKey.set(product._id, product);
    if (product.id !== undefined && product.id !== null) {
      byKey.set(String(product.id), product);
    }
  }

  const lines: PricedLine[] = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const lookupKeys = [item._id, item.id !== undefined ? String(item.id) : undefined].filter(
      (v): v is string => typeof v === "string"
    );

    const product = lookupKeys.map((k) => byKey.get(k)).find(Boolean);

    if (!product) {
      return {
        ok: false,
        status: 400,
        message: `"${item.name || "An item in your bag"}" is no longer available. Please remove it and try again.`,
      };
    }

    const serverPrice = Number(product.price);
    if (!Number.isFinite(serverPrice) || serverPrice < 0) {
      return {
        ok: false,
        status: 400,
        message: `Pricing is unavailable for "${product.name}". Please try again later.`,
      };
    }

    // The server price is authoritative. A mismatch means the price moved while
    // the item sat in the bag — tell the customer instead of silently charging a
    // different amount than the one they were shown.
    if (item.price !== undefined && Math.round(item.price) !== Math.round(serverPrice)) {
      return {
        ok: false,
        status: 409,
        message: `The price of "${product.name}" has changed. Please review your bag and try again.`,
      };
    }

    // Size must be one the catalog actually offers.
    const availableSizes = Array.isArray(product.sizes) ? product.sizes : [];
    const size: string | null = item.size ?? null;
    if (availableSizes.length > 0) {
      if (!size || !availableSizes.includes(size)) {
        return {
          ok: false,
          status: 400,
          message: `Please choose an available size for "${product.name}".`,
        };
      }
    }

    subtotal += serverPrice * item.quantity;
    lines.push({
      product,
      quantity: item.quantity,
      unitPrice: serverPrice,
      size,
      color: item.color ?? null,
      name: product.name || item.name || "Gorer Mart Product",
    });
  }

  subtotal = toMoney(subtotal);

  if (subtotal <= 0) {
    return { ok: false, status: 400, message: "Your order total is invalid. Please review your bag." };
  }
  if (subtotal > MAX_ORDER_VALUE) {
    return {
      ok: false,
      status: 400,
      message: "This order exceeds the maximum value we can process online.",
    };
  }

  return { ok: true, subtotal, lines };
}
