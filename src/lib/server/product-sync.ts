import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

// Stable namespace for deriving product UUIDs from Sanity document ids.
const SANITY_NAMESPACE = "6f9619ff-8b86-d011-b42d-00cf4fc964ff";

/**
 * Map a Sanity document id onto the UUID primary key used by public.products.
 *
 * Sanity's auto-generated ids are already UUIDs, so the common case is an
 * identity mapping — which keeps existing rows (and the reviews table, which
 * has always keyed on the raw Sanity id) valid. Custom ids like
 * `homepage-tee` are not UUIDs and would otherwise fail the foreign key, so
 * those get a deterministic UUIDv5, computed the same way on every call.
 */
export function toProductUuid(sanityId: string): string {
  if (isUUID(sanityId)) return sanityId.toLowerCase();

  const namespaceBytes = Buffer.from(SANITY_NAMESPACE.replace(/-/g, ""), "hex");
  const hash = crypto
    .createHash("sha1")
    .update(Buffer.concat([namespaceBytes, Buffer.from(sanityId, "utf8")]))
    .digest();

  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

export interface SyncableProduct {
  _id: string;
  name?: string | null;
  slug?: string | null;
  price?: number | null;
}

/**
 * Ensure a Sanity product has a matching row in public.products.
 *
 * Orders and reviews both hold a foreign key into this table, so a product the
 * catalog knows about but the database does not would fail at insert time.
 * Must be called with a service-role client: RLS grants no INSERT on products
 * to ordinary users.
 */
export async function ensureProductRow(
  supabase: SupabaseClient,
  product: SyncableProduct
): Promise<{ ok: true; productId: string } | { ok: false; reason: string }> {
  const sanityId = product._id;
  if (!sanityId || typeof sanityId !== "string") {
    return { ok: false, reason: "Product is missing a Sanity id" };
  }

  const productId = toProductUuid(sanityId);

  const { data: existing, error: lookupError } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (lookupError) {
    console.error("[product-sync] lookup failed", lookupError);
    return { ok: false, reason: "Product lookup failed" };
  }

  if (existing) return { ok: true, productId };

  const price = Number(product.price);
  const baseSlug = product.slug || `product-${productId}`;

  const insertRow = (slug: string) =>
    supabase.from("products").insert({
      id: productId,
      sanity_id: sanityId,
      title: product.name || "Gorer Mart Product",
      slug,
      price: Number.isFinite(price) && price >= 0 ? price : 0,
      status: "active",
    });

  let { error: insertError } = await insertRow(baseSlug);

  if (insertError?.code === "23505") {
    // Unique violation — either another request inserted this same product
    // concurrently (fine), or a *different* product already owns this slug.
    // Distinguish the two, because assuming the former would leave the order's
    // foreign key pointing at a row that does not exist.
    const { data: nowExists } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();

    if (nowExists) return { ok: true, productId };

    // Slug collision: retry once with a slug derived from the product id,
    // which is unique by construction.
    ({ error: insertError } = await insertRow(`${baseSlug}-${productId.slice(0, 8)}`));

    if (insertError?.code === "23505") {
      const { data: retryExists } = await supabase
        .from("products")
        .select("id")
        .eq("id", productId)
        .maybeSingle();
      if (retryExists) return { ok: true, productId };
    }
  }

  if (insertError) {
    console.error("[product-sync] insert failed", insertError);
    return { ok: false, reason: "Product synchronisation failed" };
  }

  return { ok: true, productId };
}
