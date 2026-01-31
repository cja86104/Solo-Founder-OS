'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RealTimeRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/analytics');
  }, [router]);
  return null;
}
