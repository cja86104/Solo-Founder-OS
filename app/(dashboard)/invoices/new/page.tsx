// SERVER COMPONENT — wraps the client component in Suspense so that
// useSearchParams() inside NewInvoiceClient does not cause a build error.
// Do NOT add 'use client' here.
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { NewInvoiceClient } from './new-invoice-client';

function NewInvoiceSkeleton() {
  return (
    <div className="container py-6 max-w-4xl">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="space-y-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<NewInvoiceSkeleton />}>
      <NewInvoiceClient />
    </Suspense>
  );
}


