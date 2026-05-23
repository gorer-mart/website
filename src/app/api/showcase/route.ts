import { NextResponse } from 'next/server';
import { getHomePageShowcase } from '../../../lib/sanity';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const showcase = await getHomePageShowcase();
    return NextResponse.json(showcase);
  } catch (error: any) {
    console.error("API showcase error:", error);
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
