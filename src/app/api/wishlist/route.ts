import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";
import { ensureProductRow, toProductUuid } from "@/lib/server/product-sync";
import { client as sanityClient, getProducts } from "@/lib/sanity";
import type { Product } from "@/types/product";

export const dynamic = "force-dynamic";

/**
 * Customer wishlist.
 *
 * Items are keyed on `public.products.id`, whose value is derived from the
 * Sanity document id by `toProductUuid`. Because that mapping is deterministic,
 * reads can match stored rows against the Sanity catalog by recomputing the
 * UUID — no join, and no dependence on `products.sanity_id` being backfilled on
 * rows created before it existed.
 *
 * Every query is scoped by the user id resolved from the session cookie. The
 * service-role client is used because adding an item may need to create the
 * `products` row it references, and RLS grants customers no INSERT there.
 */

const productRefSchema = z.object({
  /** Sanity document id — the identifier the storefront always has to hand. */
  productId: z.string().trim().min(1).max(200),
});

/** Resolve (or create) this customer's single wishlist row. */
async function getOrCreateWishlistId(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userId: string
): Promise<{ ok: true; id: string } | { ok: false; reason: unknown }> {
  const { data: existing, error } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return { ok: false, reason: error };
  if (existing) return { ok: true, id: existing.id };

  const { data: created, error: insertError } = await supabase
    .from("wishlists")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (created) return { ok: true, id: created.id };

  // `wishlists.user_id` is UNIQUE, so a concurrent request may have created it
  // between the read and the write. Re-read rather than fail.
  if (insertError?.code === "23505") {
    const { data: raced } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    if (raced) return { ok: true, id: raced.id };
  }

  return { ok: false, reason: insertError };
}

/* ------------------------------------------------------------------ */
/* GET — the customer's wishlist, enriched for display                 */
/* ------------------------------------------------------------------ */

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to view your wishlist.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wishlistError) {
      return apiError("Could not load your wishlist.", 500, {
        scope: "wishlist.GET.wishlist",
        cause: wishlistError,
      });
    }

    // No wishlist row yet simply means nothing has been saved.
    if (!wishlist) {
      return NextResponse.json({ success: true, items: [], productIds: [] });
    }

    const { data: rows, error: itemsError } = await supabase
      .from("wishlist_items")
      .select("id, product_id, created_at")
      .eq("wishlist_id", wishlist.id)
      .order("created_at", { ascending: false });

    if (itemsError) {
      return apiError("Could not load your wishlist.", 500, {
        scope: "wishlist.GET.items",
        cause: itemsError,
      });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, items: [], productIds: [] });
    }

    // Enrich from the catalog so the client gets ready-to-render products —
    // images, colours, sizes and category — in a single request.
    const catalog: Product[] = await getProducts().catch(() => []);
    const byUuid = new Map<string, Product>();
    for (const product of catalog) {
      const sanityId = typeof product._id === "string" ? product._id : "";
      if (sanityId) byUuid.set(toProductUuid(sanityId), product);
    }

    const items = rows
      .map((row) => {
        const product = byUuid.get(String(row.product_id));
        // A product removed from the catalog is skipped rather than rendered as
        // a broken card. The row stays, so it reappears if the item returns.
        if (!product) return null;
        return {
          wishlistItemId: row.id,
          addedAt: row.created_at,
          product,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      items,
      // Every saved id, including products missing from the catalog, so the
      // heart icon stays filled and a second tap removes rather than re-adds.
      productIds: rows
        .map((row) => byUuid.get(String(row.product_id))?._id)
        .filter((v): v is string => typeof v === "string"),
    });
  } catch (error) {
    return apiError("Could not load your wishlist.", 500, {
      scope: "wishlist.GET",
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------ */
/* POST — save a product                                               */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to save items to your wishlist.", 401);
  }

  const limit = hit(`wishlist-write:${user.id}`, 60, 5 * 60 * 1000);
  const limited = rateLimitResponse(limit, "Too many wishlist changes. Please wait a moment.");
  if (limited) return limited;

  const parsed = productRefSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("A product is required.", 400);
  }

  try {
    // Confirm the product really exists before writing anything, so a wishlist
    // can never hold an id the catalog does not recognise.
    const product = await sanityClient.fetch<{
      _id: string;
      name?: string | null;
      slug?: string | null;
      price?: number | null;
    } | null>(
      `*[_type == "product" && _id == $id][0]{ _id, name, "slug": slug.current, price }`,
      { id: parsed.data.productId }
    );

    if (!product?._id) {
      return apiError("That product is no longer available.", 404);
    }

    const supabase = createAdminSupabaseClient();

    const sync = await ensureProductRow(supabase, product);
    if (!sync.ok) {
      return apiError("We could not save that item right now. Please try again.", 503, {
        scope: "wishlist.POST.productSync",
        cause: sync.reason,
      });
    }

    const wishlist = await getOrCreateWishlistId(supabase, user.id);
    if (!wishlist.ok) {
      return apiError("We could not save that item right now. Please try again.", 500, {
        scope: "wishlist.POST.wishlist",
        cause: wishlist.reason,
      });
    }

    const { error: insertError } = await supabase.from("wishlist_items").insert({
      wishlist_id: wishlist.id,
      product_id: sync.productId,
      variant_id: null,
    });

    // 23505 is the partial unique index from `016_wishlist_integrity.sql`:
    // the item is already saved, which is exactly the state the caller wanted.
    if (insertError && insertError.code !== "23505") {
      return apiError("We could not save that item right now. Please try again.", 500, {
        scope: "wishlist.POST.insert",
        cause: insertError,
      });
    }

    return NextResponse.json({
      success: true,
      saved: true,
      productId: product._id,
      alreadySaved: insertError?.code === "23505",
    });
  } catch (error) {
    return apiError("We could not save that item right now. Please try again.", 500, {
      scope: "wishlist.POST",
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE — remove a product                                           */
/* ------------------------------------------------------------------ */

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to change your wishlist.", 401);
  }

  const limit = hit(`wishlist-write:${user.id}`, 60, 5 * 60 * 1000);
  const limited = rateLimitResponse(limit, "Too many wishlist changes. Please wait a moment.");
  if (limited) return limited;

  // Accept the id from the body or the query string, so this works from both
  // `fetch` with a payload and a plain link.
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("productId") || undefined;
  const body = await readJson<{ productId?: string }>(request).catch(() => null);

  const parsed = productRefSchema.safeParse({ productId: body?.productId ?? fromQuery });
  if (!parsed.success) {
    return apiError("A product is required.", 400);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: wishlist, error: wishlistError } = await supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (wishlistError) {
      return apiError("We could not update your wishlist. Please try again.", 500, {
        scope: "wishlist.DELETE.wishlist",
        cause: wishlistError,
      });
    }

    // Nothing saved: removal has already effectively happened.
    if (!wishlist) {
      return NextResponse.json({ success: true, removed: false });
    }

    const { error: deleteError } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("wishlist_id", wishlist.id)
      .eq("product_id", toProductUuid(parsed.data.productId));

    if (deleteError) {
      return apiError("We could not update your wishlist. Please try again.", 500, {
        scope: "wishlist.DELETE.item",
        cause: deleteError,
      });
    }

    return NextResponse.json({ success: true, removed: true, productId: parsed.data.productId });
  } catch (error) {
    return apiError("We could not update your wishlist. Please try again.", 500, {
      scope: "wishlist.DELETE",
      cause: error,
    });
  }
}
