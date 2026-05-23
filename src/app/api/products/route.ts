import { NextResponse } from 'next/server';
import { getProducts } from '../../../lib/sanity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Note: getProducts is called on the server, so it will directly query Sanity
    const products = await getProducts();
    return NextResponse.json(products);
  } catch (error: any) {
    console.error("API products error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
