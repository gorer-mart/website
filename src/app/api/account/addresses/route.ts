import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/server/auth";
import { apiError, readJson } from "@/lib/server/http";
import { hit, rateLimitResponse } from "@/lib/server/rate-limit";
import {
  ADDRESS_COLUMNS,
  MAX_ADDRESSES,
  isAddressOnAnyOrder,
  listAddresses,
  removeAddress,
  setDefaultAddress,
} from "@/lib/server/addresses";

export const dynamic = "force-dynamic";

/**
 * The customer's address book.
 *
 * Every query is scoped by the user id resolved from the session cookie, never
 * by anything the client sends — an id in the body only ever narrows a query
 * that is already restricted to the caller's own rows.
 *
 * The service-role client is used for consistency with the rest of the account
 * API; RLS would also allow these writes, but going through one client keeps
 * the scoping rule in one place: `.eq("user_id", user.id)` on every statement.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mirrors checkout's rules exactly, so an address saved here always passes there. */
const addressSchema = z.object({
  fullName: z
    .string({ error: "Please enter the recipient's name" })
    .trim()
    .min(1, "Please enter the recipient's name")
    .max(120, "That name is too long"),
  phone: z
    .string({ error: "Please enter a mobile number" })
    .trim()
    .regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  addressLine1: z
    .string({ error: "Please enter the street address" })
    .trim()
    .min(5, "Please enter a complete street address")
    .max(300, "That address is too long"),
  addressLine2: z.string().trim().max(300, "That address is too long").optional().default(""),
  landmark: z.string().trim().max(160, "That landmark is too long").optional().default(""),
  city: z
    .string({ error: "Please enter a city" })
    .trim()
    .min(1, "Please enter a city")
    .max(100, "That city name is too long"),
  state: z
    .string({ error: "Please enter a state" })
    .trim()
    .min(1, "Please enter a state")
    .max(100, "That state name is too long"),
  postalCode: z
    .string({ error: "Please enter a PIN code" })
    .trim()
    .regex(/^\d{6}$/, "Please enter a valid 6-digit PIN code"),
  country: z.string().trim().max(60).optional().default("India"),
  isDefault: z.boolean().optional().default(false),
});

const updateSchema = addressSchema.extend({
  id: z.string().trim().regex(UUID_RE, "Unknown address."),
});

/** Body shape for the two id-only operations. */
const idSchema = z.object({
  id: z.string().trim().regex(UUID_RE, "Unknown address."),
});

type AddressInput = z.infer<typeof addressSchema>;

/** Map the validated payload onto table columns. */
function toRow(input: AddressInput, userId: string) {
  return {
    user_id: userId,
    full_name: input.fullName,
    phone: input.phone,
    address_line_1: input.addressLine1,
    address_line_2: input.addressLine2 || null,
    landmark: input.landmark || null,
    city: input.city,
    state: input.state,
    postal_code: input.postalCode,
    country: input.country || "India",
  };
}

/* ------------------------------------------------------------------ */
/* GET — the address book                                              */
/* ------------------------------------------------------------------ */

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to view your addresses.", 401);
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data, error } = await listAddresses(supabase, user.id);

    if (error) {
      return apiError("Could not load your addresses.", 500, {
        scope: "account.addresses.GET",
        cause: error,
      });
    }

    return NextResponse.json({ success: true, addresses: data });
  } catch (error) {
    return apiError("Could not load your addresses.", 500, {
      scope: "account.addresses.GET",
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------ */
/* POST — save a new address                                           */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to save an address.", 401);
  }

  const limited = rateLimitResponse(
    hit(`address-write:${user.id}`, 30, 10 * 60 * 1000),
    "Too many address changes. Please wait a moment."
  );
  if (limited) return limited;

  const parsed = addressSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Those address details are incomplete.", 400);
  }

  try {
    const supabase = createAdminSupabaseClient();
    const { data: existing, error: listError } = await listAddresses(supabase, user.id);

    if (listError) {
      return apiError("Could not save that address.", 500, {
        scope: "account.addresses.POST.list",
        cause: listError,
      });
    }

    if (existing.length >= MAX_ADDRESSES) {
      return apiError(
        `You can save up to ${MAX_ADDRESSES} addresses. Please remove one first.`,
        409
      );
    }

    // The first address is always the default — otherwise checkout would have
    // nothing to pre-fill from on the next order.
    const shouldDefault = parsed.data.isDefault || existing.length === 0;

    const { data: created, error } = await supabase
      .from("addresses")
      .insert({ ...toRow(parsed.data, user.id), is_default: shouldDefault })
      .select(ADDRESS_COLUMNS)
      .single();

    if (error || !created) {
      return apiError("Could not save that address.", 500, {
        scope: "account.addresses.POST.insert",
        cause: error,
      });
    }

    if (shouldDefault) {
      const defaultError = await setDefaultAddress(supabase, user.id, created.id);
      if (defaultError) {
        console.error("[account.addresses.POST] default flag failed", defaultError);
      }
    }

    return NextResponse.json({ success: true, address: created });
  } catch (error) {
    return apiError("Could not save that address.", 500, {
      scope: "account.addresses.POST",
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------ */
/* PUT — edit an address                                               */
/* ------------------------------------------------------------------ */

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to edit an address.", 401);
  }

  const limited = rateLimitResponse(
    hit(`address-write:${user.id}`, 30, 10 * 60 * 1000),
    "Too many address changes. Please wait a moment."
  );
  if (limited) return limited;

  const parsed = updateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Those address details are incomplete.", 400);
  }
  const { id, ...input } = parsed.data;

  try {
    const supabase = createAdminSupabaseClient();

    // Scoped read first: this both confirms the row is the caller's and gives
    // us the current default flag to carry across a copy-on-write.
    const { data: current, error: readError } = await supabase
      .from("addresses")
      .select("id, is_default")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (readError) {
      return apiError("Could not update that address.", 500, {
        scope: "account.addresses.PUT.read",
        cause: readError,
      });
    }
    if (!current) {
      return apiError("That address no longer exists.", 404);
    }

    const wantsDefault = input.isDefault || current.is_default;

    /**
     * An address already on an order is a record of where that parcel went.
     * Editing it in place would rewrite history, so the edit becomes a new row
     * and the old one is archived: the order keeps pointing at what was true
     * at the time, and the customer sees only their corrected address.
     */
    if (await isAddressOnAnyOrder(supabase, id)) {
      const { data: replacement, error: insertError } = await supabase
        .from("addresses")
        .insert({ ...toRow(input, user.id), is_default: wantsDefault })
        .select(ADDRESS_COLUMNS)
        .single();

      if (insertError || !replacement) {
        return apiError("Could not update that address.", 500, {
          scope: "account.addresses.PUT.replace",
          cause: insertError,
        });
      }

      const removal = await removeAddress(supabase, user.id, id);
      if (!removal.ok) {
        console.error("[account.addresses.PUT] could not retire the old row", removal.error);
      }

      if (wantsDefault) {
        const defaultError = await setDefaultAddress(supabase, user.id, replacement.id);
        if (defaultError) {
          console.error("[account.addresses.PUT] default flag failed", defaultError);
        }
      }

      // `kept` means an un-migrated database could not archive the old row, so
      // it is still in the book. Say so rather than showing a silent duplicate.
      return NextResponse.json({
        success: true,
        address: replacement,
        replaced: true,
        staleCopyRemains: removal.ok ? removal.kept : true,
      });
    }

    const { data: updated, error } = await supabase
      .from("addresses")
      .update({ ...toRow(input, user.id), is_default: wantsDefault })
      .eq("id", id)
      .eq("user_id", user.id)
      .select(ADDRESS_COLUMNS)
      .single();

    if (error || !updated) {
      return apiError("Could not update that address.", 500, {
        scope: "account.addresses.PUT.update",
        cause: error,
      });
    }

    if (wantsDefault) {
      const defaultError = await setDefaultAddress(supabase, user.id, updated.id);
      if (defaultError) {
        console.error("[account.addresses.PUT] default flag failed", defaultError);
      }
    }

    return NextResponse.json({ success: true, address: updated });
  } catch (error) {
    return apiError("Could not update that address.", 500, {
      scope: "account.addresses.PUT",
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------ */
/* PATCH — make one address the default                                */
/* ------------------------------------------------------------------ */

export async function PATCH(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to change your default address.", 401);
  }

  const limited = rateLimitResponse(
    hit(`address-write:${user.id}`, 30, 10 * 60 * 1000),
    "Too many address changes. Please wait a moment."
  );
  if (limited) return limited;

  const parsed = idSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return apiError("Unknown address.", 400);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: target } = await supabase
      .from("addresses")
      .select("id")
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!target) {
      return apiError("That address no longer exists.", 404);
    }

    const error = await setDefaultAddress(supabase, user.id, parsed.data.id);
    if (error) {
      return apiError("Could not change your default address.", 500, {
        scope: "account.addresses.PATCH",
        cause: error,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError("Could not change your default address.", 500, {
      scope: "account.addresses.PATCH",
      cause: error,
    });
  }
}

/* ------------------------------------------------------------------ */
/* DELETE — remove an address                                          */
/* ------------------------------------------------------------------ */

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return apiError("Please sign in to remove an address.", 401);
  }

  const limited = rateLimitResponse(
    hit(`address-write:${user.id}`, 30, 10 * 60 * 1000),
    "Too many address changes. Please wait a moment."
  );
  if (limited) return limited;

  // Accept the id from the body or the query string, so this works from both
  // `fetch` with a payload and a plain link.
  const url = new URL(request.url);
  const body = await readJson<{ id?: string }>(request).catch(() => null);
  const parsed = idSchema.safeParse({ id: body?.id ?? url.searchParams.get("id") ?? undefined });

  if (!parsed.success) {
    return apiError("Unknown address.", 400);
  }

  try {
    const supabase = createAdminSupabaseClient();

    const { data: target } = await supabase
      .from("addresses")
      .select("id, is_default")
      .eq("id", parsed.data.id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Already gone is the state the caller wanted.
    if (!target) {
      return NextResponse.json({ success: true, removed: false });
    }

    const removal = await removeAddress(supabase, user.id, parsed.data.id);
    if (!removal.ok) {
      return apiError("Could not remove that address.", 500, {
        scope: "account.addresses.DELETE",
        cause: removal.error,
      });
    }

    // `removeAddress` has already logged the migration hint; the customer only
    // needs to know the address stayed and why.
    if (removal.kept) {
      return apiError("This address is saved on a past order, so it cannot be removed.", 409);
    }

    // Removing the default leaves the account with none; promote the newest
    // remaining address so checkout still has something to pre-fill.
    if (target.is_default) {
      const { data: remaining } = await listAddresses(supabase, user.id);
      const next = remaining[0];
      if (next) {
        const defaultError = await setDefaultAddress(supabase, user.id, next.id);
        if (defaultError) {
          console.error("[account.addresses.DELETE] could not promote a new default", defaultError);
        }
      }
    }

    return NextResponse.json({ success: true, removed: true });
  } catch (error) {
    return apiError("Could not remove that address.", 500, {
      scope: "account.addresses.DELETE",
      cause: error,
    });
  }
}
