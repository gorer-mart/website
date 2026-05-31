import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { env } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { client as sanityClient } from "@/lib/sanity";

// Utility to check if a string is a valid UUID
const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper function to sync product from Sanity to Supabase database if missing
async function ensureProductExists(supabase: any, sanityProduct: any) {
  const productId = sanityProduct._id;
  if (!isUUID(productId)) {
    console.error(`Sanity product ID is not a valid UUID: ${productId}`);
    return false;
  }

  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();

  if (existing) return true;

  const { error } = await supabase.from("products").insert({
    id: productId,
    title: sanityProduct.name || "Gorer Mart Product",
    slug: sanityProduct.slug || `product-${productId}`,
    price: Number(sanityProduct.price),
    status: "active",
  });

  if (error) {
    console.error("Failed to sync product to database:", error);
    return false;
  }

  return true;
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // 1. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cartItems, shippingAddress } = body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: "Invalid cart items" }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: "Shipping address is required" }, { status: 400 });
    }

    // 2. Fetch fresh product details from Sanity for price validation
    const productIds = cartItems.map((item: any) => item._id || item.id);
    const sanityProducts = await sanityClient.fetch(
      `*[_type == "product" && (_id in $productIds || id in $productIds)] {
        _id,
        name,
        "slug": slug.current,
        price
      }`,
      { productIds }
    );

    const priceMap = new Map();
    const productMap = new Map();
    sanityProducts.forEach((p: any) => {
      priceMap.set(p._id, Number(p.price));
      productMap.set(p._id, p);
    });

    // 3. Verify prices and ensure products exist in Supabase DB
    let calculatedSubtotal = 0;
    for (const item of cartItems) {
      const itemId = item._id || item.id;
      const sanityPrice = priceMap.get(itemId);
      const sanityProduct = productMap.get(itemId);

      if (sanityPrice === undefined || !sanityProduct) {
        return NextResponse.json(
          { error: `Product not found: ${item.name}` },
          { status: 400 }
        );
      }

      // Verify that client-provided price matches the server/CMS price
      if (Math.round(Number(item.price)) !== Math.round(sanityPrice)) {
        return NextResponse.json(
          { error: `Price mismatch for product: ${item.name}` },
          { status: 400 }
        );
      }

      calculatedSubtotal += sanityPrice * item.quantity;

      // Sync product to public.products table to prevent foreign key errors
      const synced = await ensureProductExists(supabase, sanityProduct);
      if (!synced) {
        return NextResponse.json(
          { error: `Database sync failed for product: ${item.name}` },
          { status: 500 }
        );
      }
    }

    // 4. Save/Insert shipping address to Supabase
    const { data: addressData, error: addressError } = await supabase
      .from("addresses")
      .insert({
        user_id: user.id,
        full_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        phone: shippingAddress.phone || "9999999999",
        address_line_1: shippingAddress.address,
        city: shippingAddress.city,
        state: shippingAddress.state || shippingAddress.city,
        postal_code: shippingAddress.zipCode,
        country: shippingAddress.country || "India",
        is_default: false,
      })
      .select()
      .single();

    if (addressError) {
      console.error("Address creation error:", addressError);
      return NextResponse.json({ error: "Failed to save shipping address" }, { status: 500 });
    }

    // 5. Create Pending Order in local Supabase DB
    const orderNumber = `GM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal: calculatedSubtotal,
        shipping_cost: 0,
        total: calculatedSubtotal,
        payment_status: "pending",
        order_status: "pending",
        payment_provider: "razorpay",
        shipping_address_id: addressData.id,
        billing_address_id: addressData.id,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      return NextResponse.json({ error: "Failed to create order record" }, { status: 500 });
    }

    // 6. Insert Order Items
    const orderItems = cartItems.map((item: any) => ({
      order_id: orderData.id,
      product_id: item._id || item.id,
      quantity: item.quantity,
      price: priceMap.get(item._id || item.id),
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);

    if (itemsError) {
      console.error("Order items insert error:", itemsError);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    // 7. Create Razorpay order
    const razorpay = new Razorpay({
      key_id: env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(calculatedSubtotal * 100), // amount in paise
      currency: "INR",
      receipt: orderNumber,
      notes: {
        orderNumber,
      },
    });

    // Update order with razorpay order ID (using metadata or we can track it)
    // We can store razorpay order id in orders.order_number or keep it as is.
    // Let's store razorpay_order_id inside a custom metadata field if it exists,
    // or just return it to the client. The client will pass it back on verification.
    
    return NextResponse.json({
      success: true,
      razorpayOrder: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      },
      orderNumber,
    });
  } catch (error: any) {
    console.error("Create order API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your order" },
      { status: 500 }
    );
  }
}
