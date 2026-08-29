import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/server/auth";
import { apiError } from "@/lib/server/http";
import { getProducts as getSanityProducts, getCategories as getSanityCategories } from "@/lib/sanity";

export const dynamic = "force-dynamic";

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Mirror the Sanity category list into the Supabase `categories` table and
 * return a name → id index.
 *
 * `products.category_id` is a UUID foreign key, but categories are authored in
 * Sanity where they are identified by name. Without a mirrored row there is no
 * id to point at, which is why every auto-synced product previously landed with
 * `category_id = NULL` and the admin category filter matched nothing.
 */
async function syncCategories(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  sanityCategories: { name?: string }[]
): Promise<Map<string, string>> {
  const byName = new Map<string, string>();

  const { data: existing } = await supabase.from("categories").select("id, name");
  for (const row of existing || []) {
    if (row?.name) byName.set(String(row.name).trim().toLowerCase(), row.id);
  }

  for (const sc of sanityCategories) {
    const name = String(sc?.name || "").trim();
    if (!name || byName.has(name.toLowerCase())) continue;

    const slug = slugify(name);
    if (!slug) continue;

    // Upsert on slug: the row may already exist under a different display name.
    const { data: saved, error } = await supabase
      .from("categories")
      .upsert({ name, slug }, { onConflict: "slug" })
      .select("id")
      .single();

    if (!error && saved) {
      byName.set(name.toLowerCase(), saved.id);
    }
  }

  return byName;
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const supabase = createAdminSupabaseClient();

    // 1. Retrieve database products and their respective variants from Supabase
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug
        ),
        product_variants (
          id,
          size,
          color,
          sku,
          stock,
          price_override
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch admin products list error:", error);
    }

    // 2. Retrieve live catalog from Sanity
    const [sanityProducts, sanityCategories] = await Promise.all([
      getSanityProducts().catch(() => []),
      getSanityCategories().catch(() => []),
    ]);

    const existingDbProducts = dbProducts || [];

    // 3. Mirror Sanity categories so products can be linked by foreign key.
    const categoryIdByName = await syncCategories(supabase, sanityCategories);
    const resolveCategoryId = (name?: string | null): string | null =>
      (name && categoryIdByName.get(String(name).trim().toLowerCase())) || null;

    // 4. Auto-sync any Sanity product that hasn't been created in Supabase yet
    for (const sp of sanityProducts) {
      const slug: string = (sp.slug && typeof sp.slug === 'string')
        ? sp.slug
        : (sp.name && typeof sp.name === 'string')
        ? sp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
        : `prod-${Date.now().toString(36)}`;
      const match = existingDbProducts.find(
        (p) => p.slug === slug || p.title?.toLowerCase() === sp.name?.toLowerCase()
      );

      if (!match) {
        try {
          const { data: newProd, error: insertErr } = await supabase
            .from("products")
            .insert({
              title: sp.name,
              slug,
              price: Number(sp.price) || 0,
              description: sp.tag || null,
              category_id: resolveCategoryId(sp.category),
              status: "active",
            })
            .select(`*, categories:category_id ( id, name, slug )`)
            .single();

          if (newProd && !insertErr) {
            const sizesToCreate = (sp.sizes && sp.sizes.length > 0)
              ? sp.sizes
              : ["S", "M", "L", "XL", "XXL"];

            const variantRows = sizesToCreate.map((size: string, idx: number) => ({
              product_id: newProd.id,
              size,
              sku: `${slug.toUpperCase()}-${size}-${Date.now().toString(36).slice(-3)}${idx}`,
              stock: 0,
            }));

            const { data: createdVars } = await supabase
              .from("product_variants")
              .insert(variantRows)
              .select();

            existingDbProducts.unshift({
              ...newProd,
              product_variants: createdVars || [],
            });
          }
        } catch (syncErr) {
          console.warn(`Failed to auto-sync Sanity product ${sp.name}:`, syncErr);
        }
      }
    }

    // 5. Backfill the category on rows created before categories were mirrored.
    // Without this, products already in the table stay uncategorised forever and
    // the admin category filter keeps returning nothing for them.
    for (const dbProduct of existingDbProducts) {
      if (dbProduct.category_id) continue;

      const match = sanityProducts.find(
        (sp: any) =>
          sp.slug === dbProduct.slug ||
          sp.name?.toLowerCase() === dbProduct.title?.toLowerCase()
      );
      const categoryId = resolveCategoryId(match?.category as string | undefined);
      if (!categoryId) continue;

      const { error: linkErr } = await supabase
        .from("products")
        .update({ category_id: categoryId })
        .eq("id", dbProduct.id);

      if (!linkErr) {
        dbProduct.category_id = categoryId;
        dbProduct.categories = {
          id: categoryId,
          name: match?.category,
          slug: slugify(String(match?.category || "")),
        };
      }
    }

    return NextResponse.json({
      success: true,
      products: existingDbProducts,
      sanityProducts: sanityProducts || [],
      sanityCategories: sanityCategories || [],
    });
  } catch (error: any) {
    console.error("GET admin products API error:", error);
    return NextResponse.json({ error: "Could not complete the product operation." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const body = await request.json();
    const {
      title,
      slug: customSlug,
      price,
      compare_at_price,
      category_id,
      description,
      status = "active",
      variants = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Product title is required." }, { status: 400 });
    }

    if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
      return NextResponse.json({ error: "A valid positive price is required." }, { status: 400 });
    }

    const baseSlug = (customSlug && typeof customSlug === "string" && customSlug.trim())
      ? customSlug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      : title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const slug = baseSlug;

    const supabase = createAdminSupabaseClient();

    // 1. Check if product exists by slug or title
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .or(`slug.eq.${slug},title.eq.${title.trim()}`)
      .limit(1)
      .maybeSingle();

    let productId = existing?.id;
    let savedProduct: any = null;

    if (productId) {
      // Update existing
      const { data: updated, error: updateErr } = await supabase
        .from("products")
        .update({
          title: title.trim(),
          price: Number(price),
          compare_at_price: compare_at_price ? Number(compare_at_price) : null,
          category_id: category_id || null,
          description: description?.trim() || null,
          status: status === "active" ? "active" : "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", productId)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      savedProduct = updated;
    } else {
      // Insert new
      const { data: newProd, error: insertErr } = await supabase
        .from("products")
        .insert({
          title: title.trim(),
          slug: `${slug}-${Date.now().toString(36).slice(-4)}`,
          price: Number(price),
          compare_at_price: compare_at_price ? Number(compare_at_price) : null,
          category_id: category_id || null,
          description: description?.trim() || null,
          status: status === "active" ? "active" : "draft",
        })
        .select()
        .single();

      if (insertErr || !newProd) {
        return NextResponse.json({ error: insertErr?.message || "Could not create product." }, { status: 500 });
      }
      savedProduct = newProd;
      productId = newProd.id;
    }

    // 2. Upsert/Update variants
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        if (v.id) {
          await supabase
            .from("product_variants")
            .update({
              size: v.size,
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
            })
            .eq("id", v.id);
        } else if (v.size) {
          // Check if variant for this size exists
          const { data: existVar } = await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", productId)
            .eq("size", v.size)
            .maybeSingle();

          if (existVar) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, parseInt(v.stock, 10) || 0) })
              .eq("id", existVar.id);
          } else {
            await supabase
              .from("product_variants")
              .insert({
                product_id: productId,
                size: v.size,
                sku: `${savedProduct.slug.toUpperCase()}-${v.size.toUpperCase()}-${Date.now().toString(36).slice(-3)}`,
                stock: Math.max(0, parseInt(v.stock, 10) || 0),
              });
          }
        }
      }
    }

    const { data: updatedVariants } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId);

    return NextResponse.json({
      success: true,
      message: "Product inventory saved successfully",
      product: {
        ...savedProduct,
        product_variants: updatedVariants || [],
      },
    });
  } catch (error: any) {
    console.error("POST admin product API error:", error);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return apiError(
      auth.status === 401 ? "Authentication required." : "Administrator access required.",
      auth.status
    );
  }

  try {
    const body = await request.json();
    const supabase = createAdminSupabaseClient();

    // Mode A: Single variant stock quick update
    if (body.variantId && body.stock !== undefined && !body.productId) {
      const { variantId, stock } = body;
      const { data: updatedVariant, error } = await supabase
        .from("product_variants")
        .update({ stock: Math.max(0, parseInt(stock, 10)) })
        .eq("id", variantId)
        .select()
        .single();

      if (error) {
        console.error("Error updating variant stock:", error);
        return NextResponse.json({ error: "Could not complete the product operation." }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Variant stock updated successfully",
        variant: updatedVariant,
      });
    }

    // Mode B: Full product & size-wise variants update
    const {
      productId,
      title,
      slug,
      price,
      compare_at_price,
      category_id,
      description,
      status,
      variants,
    } = body;

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    const productUpdatePayload: any = {
      updated_at: new Date().toISOString(),
    };
    if (title) productUpdatePayload.title = title.trim();
    if (slug) productUpdatePayload.slug = slug.trim();
    if (price !== undefined) productUpdatePayload.price = Number(price);
    if (compare_at_price !== undefined) {
      productUpdatePayload.compare_at_price = compare_at_price ? Number(compare_at_price) : null;
    }
    if (category_id !== undefined) productUpdatePayload.category_id = category_id || null;
    if (description !== undefined) productUpdatePayload.description = description?.trim() || null;
    if (status) productUpdatePayload.status = status;

    const { data: updatedProduct, error: prodUpdateErr } = await supabase
      .from("products")
      .update(productUpdatePayload)
      .eq("id", productId)
      .select(`
        *,
        categories:category_id (
          id,
          name,
          slug
        )
      `)
      .single();

    if (prodUpdateErr) {
      console.error("Error updating product:", prodUpdateErr);
      return NextResponse.json({ error: prodUpdateErr.message || "Could not update product." }, { status: 500 });
    }

    // Update / Upsert variants
    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (v.id) {
          await supabase
            .from("product_variants")
            .update({
              size: v.size,
              color: v.color || null,
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              price_override: v.price_override ? Number(v.price_override) : null,
            })
            .eq("id", v.id);
        } else if (v.size) {
          const sku = v.sku || `${(updatedProduct.slug || "PROD").toUpperCase()}-${v.size.toUpperCase()}-${Date.now().toString(36).slice(-3)}`;
          
          const { data: existVar } = await supabase
            .from("product_variants")
            .select("id")
            .eq("product_id", productId)
            .eq("size", v.size)
            .maybeSingle();

          if (existVar) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, parseInt(v.stock, 10) || 0) })
              .eq("id", existVar.id);
          } else {
            await supabase
              .from("product_variants")
              .insert({
                product_id: productId,
                size: v.size,
                color: v.color || null,
                sku,
                stock: Math.max(0, parseInt(v.stock, 10) || 0),
                price_override: v.price_override ? Number(v.price_override) : null,
              });
          }
        }
      }
    }

    // Fetch updated variants
    const { data: updatedVariants } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId);

    return NextResponse.json({
      success: true,
      message: "Product and inventory updated successfully",
      product: {
        ...updatedProduct,
        product_variants: updatedVariants || [],
      },
    });
  } catch (error: any) {
    console.error("PUT admin products API error:", error);
    return NextResponse.json({ error: "Could not complete the product operation." }, { status: 500 });
  }
}
