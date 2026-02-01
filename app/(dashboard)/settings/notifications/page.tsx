'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, MessageSquare, CreditCard, Users, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  email_invoices: boolean;
  email_payments: boolean;
  email_team: boolean;
  email_projects: boolean;
  in_app_invoices: boolean;
  in_app_payments: boolean;
  in_app_team: boolean;
  in_app_projects: boolean;
}

const defaultPreferences: NotificationPreferences = {
  email_invoices: true,
  email_payments: true,
  email_team: true,
  email_projects: false,
  in_app_invoices: true,
  in_app_payments: true,
  in_app_team: true,
  in_app_projects: true,
};

export default function NotificationsSettingsPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from workspace settings
  useEffect(() => {
    if (currentWorkspace?.settings) {
      const saved = (currentWorkspace.settings as unknown as Record<string, unknown>).notification_preferences;
      if (saved && typeof saved === 'object') {
        setPreferences({ ...defaultPreferences, ...(saved as Partial<NotificationPreferences>) });
      }
    }
  }, [currentWorkspace]);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!currentWorkspace) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workspaces/${currentWorkspace.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            ...((currentWorkspace.settings as unknown as Record<string, unknown>) || {}),
            notification_preferences: preferences,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save preferences');
      }

      toast.success('Notification preferences saved');
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const categories = [
    {
      title: 'Invoices',
      description: 'Invoice creation, status changes, and reminders',
      icon: FileText,
      emailKey: 'email_invoices' as const,
      inAppKey: 'in_app_invoices' as const,
    },
    {
      title: 'Payments',
      description: 'Payment received, failed, or refunded',
      icon: CreditCard,
      emailKey: 'email_payments' as const,
      inAppKey: 'in_app_payments' as const,
    },
    {
      title: 'Team',
      description: 'Member invitations, role changes, and removals',
      icon: Users,
      emailKey: 'email_team' as const,
      inAppKey: 'in_app_team' as const,
    },
    {
      title: 'Projects',
      description: 'Project updates, task assignments, and deadlines',
      icon: MessageSquare,
      emailKey: 'email_projects' as const,
      inAppKey: 'in_app_projects' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <p className="text-muted-foreground">
          Configure how you receive notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose which notifications you want to receive via email and in-app.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header row */}
          <div className="grid grid-cols-[1fr_80px_80px] gap-4 items-center text-sm font-medium text-muted-foreground">
            <div>Category</div>
            <div className="flex items-center justify-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </div>
            <div className="flex items-center justify-center gap-1">
              <Bell className="h-4 w-4" />
              In-App
            </div>
          </div>

          {/* Category rows */}
          {categories.map((category) => (
            <div
              key={category.title}
              className="grid grid-cols-[1fr_80px_80px] gap-4 items-center py-3 border-t"
            >
              <div className="flex items-center gap-3">
                <category.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-sm font-medium">{category.title}</Label>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={preferences[category.emailKey]}
                  onCheckedChange={() => handleToggle(category.emailKey)}
                />
              </div>
              <div className="flex justify-center">
                <Switch
                  checked={preferences[category.inAppKey]}
                  onCheckedChange={() => handleToggle(category.inAppKey)}
                />
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
