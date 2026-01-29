import { NextResponse } from 'next/server';

// Feedback responses feature is not yet available
export async function POST() {
  return NextResponse.json(
    { error: 'Reply feature is not yet available' },
    { status: 501 }
  );
}
