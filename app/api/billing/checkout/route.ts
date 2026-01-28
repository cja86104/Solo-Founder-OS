import { NextResponse } from 'next/server';

// Billing is disabled in the open source version
export async function POST() {
  return NextResponse.json({ 
    error: 'Billing is disabled in the open source version. All features are free!' 
  }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Billing is disabled in the open source version. All features are free!' 
  }, { status: 400 });
}
