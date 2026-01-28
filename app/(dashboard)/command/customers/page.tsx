'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import type { Customer } from '@/types/command';
import {
  CustomerTable,
  CustomerStats,
  AtRiskCustomersCard,
} from '@/components/command';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Users,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

// =============================================================================
// Page Component
// =============================================================================

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { can } = usePermissions();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/command/metrics?workspace_id=${currentWorkspace.id}&include=customers`
      );
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Handle view customer
  const handleViewCustomer = (customer: Customer) => {
    router.push(`/command/customers/${customer.id}`);
  };

  // Handle email customer
  const handleEmailCustomer = (customer: Customer) => {
    window.location.href = `mailto:${customer.email}`;
  };

  // Handle view in Stripe
  const handleViewInStripe = (customer: Customer) => {
    if (customer.stripe_customer_id) {
      window.open(
        `https://dashboard.stripe.com/customers/${customer.stripe_customer_id}`,
        '_blank'
      );
    }
  };

  // Handle export
  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  // At-risk customers
  const atRiskCustomers = customers.filter(
    (c) => c.status === 'at_risk' || c.churn_risk_score >= 50
  );

  // Loading skeleton
  if (workspaceLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 lg:col-span-2" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  // Permission check
  if (!can('content.view')) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don&apos;t have permission to view customers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/command')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              Customers
            </h1>
            <p className="text-muted-foreground">
              {customers.length} total customers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchCustomers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CustomerStats customers={customers} className="lg:col-span-2" />
        <AtRiskCustomersCard
          customers={atRiskCustomers}
          maxDisplay={5}
          onViewCustomer={handleViewCustomer}
        />
      </div>

      {/* Customer Table */}
      <CustomerTable
        customers={customers}
        onViewCustomer={handleViewCustomer}
        onEmailCustomer={handleEmailCustomer}
        onViewInStripe={handleViewInStripe}
        onRefresh={fetchCustomers}
        onExport={handleExport}
        pageSize={20}
      />
    </div>
  );
}
