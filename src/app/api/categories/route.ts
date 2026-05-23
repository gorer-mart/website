import { NextResponse } from 'next/server';
import { getCategories } from '../../../lib/sanity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Note: getCategories is called on the server, so it will directly query Sanity
    const categories = await getCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("API categories error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
