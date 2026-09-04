import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { toProductUuid } from "@/lib/server/product-sync";
import { sweepPendingOrders } from "@/lib/server/order-settlement";
import { getProducts } from "@/lib/sanity";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

/**
 * Pending orders reconciled inline before the history is read.
 *
 * Small and capped: this runs before the response, so it must stay a fraction
 * of a second even when the gateway is slow. A customer rarely has more than
 * one stranded checkout, and anything beyond the cap is picked up on the next
 * read or by the admin sweep.
 */
const SWEEP_LIMIT = 3;
const SWEEP_THROTTLE_MS = 60 * 1000;

/**
 * Pick the gallery image for the colour that was actually purchased.
 *
 * Falling back to the first image of the flattened gallery keeps a thumbnail on
 * screen for older orders, which recorded no colour at all.
 */
function imageForItem(product: Product, color?: string | null): string {
  const variants = product.colorVariants || [];

  if (color) {
    const match = variants.find(
      (variant) => (variant.color || "").toLowerCase() === color.toLowerCase()
    );
    if (match?.images?.length) return match.images[0];
  }

  return resolveImageUrl(product.images?.[0]);
}

/**
 * PostgREST returns a to-one embed as an object, but the generated types allow
 * an array. Normalise so the client only ever handles one shape.
 */
function firstOrSelf<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Order history for the signed-in customer.
 *
 * Every query is scoped by the user id resolved from the session cookie, never
 * from anything the client sends.
 *
 * Line items are enriched from the Sanity catalog — thumbnail, slug and
 * category — so the orders page can show a real product row and offer "buy
 * again" without a second round trip. Enrichment is best-effort: the stored
 * `product_name` and `price` snapshots are what the order actually was, so a
 * product that has since left the catalog still renders correctly, just
 * without an image.
 */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to view your orders.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();

    // Settle this customer's stranded checkouts before reading, so the page
    // never shows "payment pending" for an attempt the gateway has long since
    // resolved. Best-effort by design: order history must still load if
    // Razorpay is unreachable.
    try {
      await sweepPendingOrders(supabase, {
        userId: user.id,
        limit: SWEEP_LIMIT,
        throttleMs: SWEEP_THROTTLE_MS,
      });
    } catch (sweepError) {
      console.error("[account.orders] pending sweep failed", sweepError);
    }

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        subtotal,
        shipping_cost,
        discount_amount,
        coupon_code,
        total,
        payment_status,
        order_status,
        payment_provider,
        razorpay_payment_id,
        customer_email,
        customer_phone,
        tracking_number,
        estimated_delivery,
        created_at,
        updated_at,
        shipping_address:addresses!shipping_address_id (
          full_name,
          phone,
          address_line_1,
          address_line_2,
          city,
          state,
          postal_code,
          country
        ),
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          size,
          color,
          products ( title, slug )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return apiError("Could not load your orders.", 500, {
        scope: "account.orders",
        cause: error,
      });
    }

    const rows = orders ?? [];

    // One catalog read for the whole page. `products.id` is derived from the
    // Sanity document id by `toProductUuid`, so recomputing that mapping is
    // enough to match a stored line item back to its catalog entry.
    const catalog: Product[] = rows.length ? await getProducts().catch(() => []) : [];
    const byUuid = new Map<string, Product>();
    for (const product of catalog) {
      const sanityId = typeof product._id === "string" ? product._id : "";
      if (sanityId) byUuid.set(toProductUuid(sanityId), product);
    }

    const enriched = rows.map((order) => {
      const items = (order.order_items ?? []).map((item) => {
        const product = byUuid.get(String(item.product_id));
        const mirror = firstOrSelf(item.products as { title?: string | null; slug?: string | null });

        return {
          ...item,
          products: mirror,
          /** Display-only catalog snapshot; never the source of the amount charged. */
          product: product
            ? {
                sanityId: String(product._id),
                slug: product.slug ? String(product.slug) : mirror?.slug ?? null,
                name: product.name || item.product_name || mirror?.title || "Product",
                category: product.category ? String(product.category) : null,
                image: imageForItem(product, item.color),
                currentPrice: Number(product.price) || null,
                /** Still buyable, so the client can offer "buy again". */
                available: true,
              }
            : {
                sanityId: null,
                slug: mirror?.slug ?? null,
                name: item.product_name || mirror?.title || "Product",
                category: null,
                image: "",
                currentPrice: null,
                available: false,
              },
        };
      });

      return {
        ...order,
        shipping_address: firstOrSelf(order.shipping_address),
        order_items: items,
      };
    });

    return NextResponse.json({ success: true, orders: enriched });
  } catch (error) {
    return apiError("Could not load your orders.", 500, {
      scope: "account.orders",
      cause: error,
    });
  }
}
