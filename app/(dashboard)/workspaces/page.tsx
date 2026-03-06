'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace-context';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  CreditCard,
  Settings,
  Globe,
  Calendar,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { WorkspaceWithRole, WorkspaceSettings, generateSlug, formatLimit } from '@/types/workspace';
import { createClient } from '@/lib/supabase/client';

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];

const DATE_FORMATS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const CURRENCIES = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD ($)' },
  { value: 'AUD', label: 'AUD ($)' },
];

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params.id as string;
  createClient();

  const {
    workspaces,
    updateWorkspace,
    deleteWorkspace,
    canManageSettings,
    canManageBilling,
    canDeleteWorkspace: canDelete,
    isLoading: contextLoading,
  } = useWorkspace();

  const [workspace, setWorkspace] = useState<WorkspaceWithRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [settings, setSettings] = useState<WorkspaceSettings>({
    theme: 'system',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    currency: 'USD',
  });

  // Load workspace data
  useEffect(() => {
    const ws = workspaces.find(w => w.id === workspaceId);
    if (ws) {
      setWorkspace(ws);
      setName(ws.name);
      setSlug(ws.slug);
      setSettings(ws.settings);
      setIsLoading(false);
    } else if (!contextLoading) {
      router.push('/workspaces');
    }
  }, [workspaces, workspaceId, contextLoading, router]);

  const handleSaveGeneral = async () => {
    if (!workspace) return;

    setIsSaving(true);
    try {
      const success = await updateWorkspace(workspaceId, {
        name: name.trim(),
        slug: slug.trim(),
      });

      if (success) {
        toast.success('Workspace updated successfully');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!workspace) return;

    setIsSaving(true);
    try {
      const success = await updateWorkspace(workspaceId, { settings });

      if (success) {
        toast.success('Settings saved successfully');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!workspace || deleteConfirmation !== workspace.name) return;

    setIsDeleting(true);
    try {
      await deleteWorkspace(workspaceId);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || contextLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-[600px] rounded-lg" />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  if (!canManageSettings) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground text-center max-w-md">
              You don&apos;t have permission to manage this workspace&apos;s settings.
              Contact the workspace owner for access.
            </p>
            <Button className="mt-6" asChild>
              <Link href="/workspaces">Back to Workspaces</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/workspaces">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            {workspace.name}
          </h1>
          <p className="text-muted-foreground">Workspace Settings</p>
        </div>
        <Badge variant="outline" className="capitalize">
          {workspace.plan} plan
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Globe className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          {canManageBilling && (
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          )}
          {canDelete && (
            <TabsTrigger value="danger" className="gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your workspace name and URL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">
                    foundershelm.com/
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(generateSlug(e.target.value))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Changing the URL may break existing links
                </p>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button
                onClick={handleSaveGeneral}
                disabled={isSaving || !name.trim() || !slug.trim()}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>
                Configure regional and display settings for this workspace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Timezone
                  </Label>
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
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date Format
                  </Label>
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Currency
                  </Label>
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
            <CardFooter className="border-t pt-6">
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        {canManageBilling && (
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Billing & Plan</CardTitle>
                <CardDescription>
                  Manage your subscription and view plan limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Current Plan */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
                  <div>
                    <p className="font-medium capitalize">{workspace.plan} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {workspace.plan === 'trial' || workspace.plan === 'expired'
                        ? 'Upgrade to unlock more features'
                        : 'Your current subscription'}
                    </p>
                  </div>
                  {workspace.plan === 'trial' || workspace.plan === 'expired' ? (
                    <Button asChild>
                      <Link href="/settings/billing">Upgrade</Link>
                    </Button>
                  ) : (
                    <Button variant="outline" asChild>
                      <Link href="/settings/billing">Manage</Link>
                    </Button>
                  )}
                </div>

                <Separator />

                {/* Plan Limits */}
                <div>
                  <h4 className="font-medium mb-4">Plan Limits</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(workspace.plan_limits).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between p-3 rounded border"
                      >
                        <span className="capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <Badge variant="secondary">
                          {formatLimit(value as number)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Danger Zone Tab */}
        {canDelete && (
          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">
                    Delete Workspace
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete a workspace, there is no going back. This will
                    permanently delete all landing pages, contacts, vault items,
                    and other data associated with this workspace.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Workspace
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                          <p>
                            This action cannot be undone. This will permanently
                            delete the <strong>{workspace.name}</strong> workspace
                            and all of its data.
                          </p>
                          <div className="space-y-2">
                            <Label htmlFor="confirm">
                              Type <strong>{workspace.name}</strong> to confirm:
                            </Label>
                            <Input
                              id="confirm"
                              value={deleteConfirmation}
                              onChange={(e) => setDeleteConfirmation(e.target.value)}
                              placeholder={workspace.name}
                            />
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={
                            deleteConfirmation !== workspace.name || isDeleting
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete Workspace
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
