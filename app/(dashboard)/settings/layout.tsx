'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  User,
  Building2,
  CreditCard,
  Download,
  Bell,
  Shield,
  Key,
  Plug,
} from 'lucide-react';

const settingsNavItems = [
  {
    title: 'Account',
    href: '/settings/account',
    icon: User,
    description: 'Your personal settings',
  },
  {
    title: 'Workspace',
    href: '/settings/workspace',
    icon: Building2,
    description: 'Workspace configuration',
  },
  {
    title: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Subscription and payments',
  },
  {
    title: 'Data Export',
    href: '/settings/export',
    icon: Download,
    description: 'Export your data',
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    icon: Plug,
    description: 'Connected services',
  },
  {
    title: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
    description: 'Manage API access',
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0">
          <nav className="space-y-1">
            {settingsNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p
                      className={cn(
                        'text-xs',
                        isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      )}
                    >
                      {item.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
