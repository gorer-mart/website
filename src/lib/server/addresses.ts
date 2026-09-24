import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

/**
 * Saved delivery addresses.
 *
 * Two things make this more than a table read.
 *
 * First, orders reference `addresses` with ON DELETE SET NULL, so removing a
 * row would blank the delivery address on every past order that used it.
 * Removal is therefore an archive (`017_address_archive.sql`), never a delete,
 * whenever an order still points at the row.
 *
 * Second, that column may not exist yet: a deploy can reach production before
 * the migration is run. Every read and write here detects the missing column
 * once, warns, and falls back to behaviour that is still correct — just
 * without archiving — so the storefront never 500s on deployment order.
 */

export const ADDRESS_COLUMNS =
  "id, full_name, phone, address_line_1, address_line_2, landmark, city, state, postal_code, country, is_default, created_at";

/** Most saved addresses one customer may keep. Abuse ceiling, not a UX limit. */
export const MAX_ADDRESSES = 10;

export interface AddressRow {
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

/** Set once per process when the archive column turns out to be absent. */
let archiveUnsupported = false;

/** Postgres 42703 — undefined_column. */
function isMissingArchiveColumn(error: PostgrestError | null): boolean {
  if (!error) return false;
  return error.code === "42703" || /archived_at/.test(error.message || "");
}

function warnOnce() {
  if (archiveUnsupported) return;
  archiveUnsupported = true;
  console.warn(
    "[addresses] `archived_at` is missing — run supabase/migrations/017_address_archive.sql. " +
      "Until then, removing an address that is not on any order deletes it, and one that is stays."
  );
}

/** True when the archive column is available in this database. */
export function archiveSupported(): boolean {
  return !archiveUnsupported;
}

/**
 * A customer's visible address book, default first then newest.
 */
export async function listAddresses(
  supabase: SupabaseClient,
  userId: string
): Promise<{ data: AddressRow[]; error: PostgrestError | null }> {
  if (!archiveUnsupported) {
    const { data, error } = await supabase
      .from("addresses")
      .select(ADDRESS_COLUMNS)
      .eq("user_id", userId)
      .is("archived_at", null)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error) return { data: (data ?? []) as AddressRow[], error: null };
    if (!isMissingArchiveColumn(error)) return { data: [], error };
    warnOnce();
  }

  const { data, error } = await supabase
    .from("addresses")
    .select(ADDRESS_COLUMNS)
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return { data: (data ?? []) as AddressRow[], error };
}

/**
 * Whether any order still points at this address.
 *
 * Decides between rewriting a row and preserving it: an address on a past
 * order is a record of where that parcel went, not just a convenience entry.
 */
export async function isAddressOnAnyOrder(
  supabase: SupabaseClient,
  addressId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .or(`shipping_address_id.eq.${addressId},billing_address_id.eq.${addressId}`)
    .limit(1);

  // Fail safe: if the check itself fails, treat the address as referenced so
  // the caller preserves it rather than risking an order losing its address.
  if (error) {
    console.error("[addresses] order reference check failed", error);
    return true;
  }

  return (data?.length ?? 0) > 0;
}

/**
 * Archive an address, or delete it where archiving is unavailable.
 *
 * Returns `kept: true` when an un-migrated database had to leave a referenced
 * row in place, so the caller can say so instead of claiming success.
 */
export async function removeAddress(
  supabase: SupabaseClient,
  userId: string,
  addressId: string
): Promise<{ ok: true; kept: boolean } | { ok: false; error: PostgrestError }> {
  if (!archiveUnsupported) {
    const { error } = await supabase
      .from("addresses")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", addressId)
      .eq("user_id", userId);

    if (!error) return { ok: true, kept: false };
    if (!isMissingArchiveColumn(error)) return { ok: false, error };
    warnOnce();
  }

  // No archive column. Deleting a referenced address would blank the address
  // on that order, so those are left alone and reported back honestly.
  if (await isAddressOnAnyOrder(supabase, addressId)) {
    return { ok: true, kept: true };
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);

  if (error) return { ok: false, error };
  return { ok: true, kept: false };
}

/**
 * Make one address the default and clear the flag on the rest.
 *
 * There is no partial unique index behind `is_default`, so exactly-one-default
 * is maintained here. Clearing first means a failure leaves the customer with
 * no default rather than two, which checkout handles (it falls back to the
 * most recent address) where two would be ambiguous.
 */
export async function setDefaultAddress(
  supabase: SupabaseClient,
  userId: string,
  addressId: string
): Promise<PostgrestError | null> {
  const { error: clearError } = await supabase
    .from("addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .neq("id", addressId);

  if (clearError) return clearError;

  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", userId);

  return error;
}
