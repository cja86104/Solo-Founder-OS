'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/lib/workspace-context';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export default function ApiKeysPage() {
  const { currentWorkspace, isLoading: workspaceLoading } = useWorkspace();
  const { isOwner, isAdmin } = usePermissions();

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteKey, setDeleteKey] = useState<ApiKey | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchApiKeys = async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/api-keys?workspace_id=${currentWorkspace.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWorkspace]);

  const handleCreateKey = async () => {
    if (!currentWorkspace || !newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workspace_id: currentWorkspace.id,
          name: newKeyName.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create API key');

      const data = await response.json();
      setNewKeyValue(data.key);
      setShowNewKey(true);
      fetchApiKeys();
    } catch {
      toast.error('Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteKey) return;

    try {
      const response = await fetch(`/api/api-keys/${deleteKey.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete API key');

      toast.success('API key deleted');
      setDeleteKey(null);
      fetchApiKeys();
    } catch {
      toast.error('Failed to delete API key');
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setNewKeyName('');
    setNewKeyValue(null);
    setShowNewKey(false);
  };

  if (workspaceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">No workspace selected</p>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner && !isAdmin) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            Only workspace owners and admins can manage API keys.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Key className="h-8 w-8" />
            API Keys
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage API access to your workspace
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newKeyValue ? 'API Key Created' : 'Create API Key'}
              </DialogTitle>
              <DialogDescription>
                {newKeyValue
                  ? 'Make sure to copy your API key now. You won\'t be able to see it again!'
                  : 'Give your API key a descriptive name to identify its purpose.'}
              </DialogDescription>
            </DialogHeader>

            {newKeyValue ? (
              <div className="space-y-4 py-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This is the only time you&apos;ll see this key. Copy it now!
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      value={showNewKey ? newKeyValue : '•'.repeat(40)}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowNewKey(!showNewKey)}
                    >
                      {showNewKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(newKeyValue)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production API Key"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              {newKeyValue ? (
                <Button onClick={handleCloseCreateDialog}>Done</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={handleCloseCreateDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={isCreating || !newKeyName.trim()}
                  >
                    {isCreating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Key className="h-4 w-4 mr-2" />
                    )}
                    Create Key
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            API keys allow external applications to access your workspace data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No API Keys</h3>
              <p className="text-muted-foreground mb-4">
                Create an API key to integrate with external services
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      <Key className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{key.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {key.key_preview}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">
                        Created{' '}
                        {formatDistanceToNow(new Date(key.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      {key.last_used_at && (
                        <p className="text-muted-foreground">
                          Last used{' '}
                          {formatDistanceToNow(new Date(key.last_used_at), {
                            addSuffix: true,
                          })}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteKey(key)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteKey} onOpenChange={() => setDeleteKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteKey?.name}&quot;? Any
              applications using this key will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKey}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
