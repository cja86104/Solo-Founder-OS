'use client';

import { useState } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Settings,
  Building2,
  Globe,
  Bell,
  Palette,
  Upload,
  Loader2,
  Save,

} from 'lucide-react';
import { toast } from 'sonner';
import { WorkspaceSettings as WorkspaceSettingsType } from '@/types/workspace';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
];

export default function WorkspaceSettingsPage() {
  const { currentWorkspace, updateWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { canManageSettings } = usePermissions();

  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(currentWorkspace?.name || '');
  const [settings, setSettings] = useState<WorkspaceSettingsType>(
    currentWorkspace?.settings || {
      theme: 'system',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      currency: 'USD',
    }
  );

  // Notification preferences (stored in settings.notifications)
  const [notifications, setNotifications] = useState({
    emailDigest: true,
    newLeads: true,
    teamActivity: false,
    weeklyReport: true,
  });

  const handleSave = async () => {
    if (!currentWorkspace) return;

    setIsSaving(true);
    try {
      const success = await updateWorkspace(currentWorkspace.id, {
        name,
        settings: {
          ...settings,
          notifications,
        } as any,
      });

      if (success) {
        toast.success('Settings saved successfully');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">No workspace selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canManageSettings) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don&apos;t have permission to manage workspace settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Workspace Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace preferences and configuration
        </p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>
              Basic workspace information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20 rounded-lg">
                {currentWorkspace.logo_url ? (
                  <AvatarImage src={currentWorkspace.logo_url} />
                ) : null}
                <AvatarFallback className="rounded-lg text-xl">
                  {currentWorkspace.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 256x256px, PNG or JPG
                </p>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
              />
            </div>

            {/* Slug (read-only here) */}
            <div className="space-y-2">
              <Label>Workspace URL</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>foundershelm.com/</span>
                <code className="px-2 py-1 bg-muted rounded">
                  {currentWorkspace.slug}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Regional Settings
            </CardTitle>
            <CardDescription>
              Timezone, date format, and currency preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Timezone */}
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) =>
                    setSettings({ ...settings, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Format */}
              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value) =>
                    setSettings({ ...settings, dateFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) =>
                    setSettings({ ...settings, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure email notifications for this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Daily Email Digest</p>
                <p className="text-sm text-muted-foreground">
                  Receive a daily summary of workspace activity
                </p>
              </div>
              <Switch
                checked={notifications.emailDigest}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, emailDigest: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Lead Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Get notified when new leads are captured
                </p>
              </div>
              <Switch
                checked={notifications.newLeads}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, newLeads: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Team Activity</p>
                <p className="text-sm text-muted-foreground">
                  Notifications when team members make changes
                </p>
              </div>
              <Switch
                checked={notifications.teamActivity}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, teamActivity: checked })
                }
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Weekly Report</p>
                <p className="text-sm text-muted-foreground">
                  Receive weekly analytics and insights
                </p>
              </div>
              <Switch
                checked={notifications.weeklyReport}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, weeklyReport: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Customize the look and feel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') =>
                  setSettings({ ...settings, theme: value })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
