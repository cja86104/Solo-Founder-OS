'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
  Zap,
  Users,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { generateSlug, PLAN_LIMITS, formatLimit } from '@/types/workspace';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

export default function NewWorkspacePage() {
  const router = useRouter();
  const { createWorkspace, workspaces } = useWorkspace();
  
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const debouncedSlug = useDebounce(slug, 500);
  const supabase = createClient();

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugManuallyEdited && name) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  // Check slug availability
  useEffect(() => {
    async function checkSlug() {
      if (!debouncedSlug || debouncedSlug.length < 3) {
        setSlugAvailable(null);
        return;
      }

      setCheckingSlug(true);
      try {
        const { data } = await supabase
          .from('workspaces')
          .select('id')
          .eq('slug', debouncedSlug)
          .single();

        setSlugAvailable(!data);
      } catch {
        setSlugAvailable(true);
      } finally {
        setCheckingSlug(false);
      }
    }

    checkSlug();
  }, [debouncedSlug, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || slugAvailable === false) return;

    setIsSubmitting(true);
    try {
      const workspace = await createWorkspace({
        name: name.trim(),
        slug: slug.trim(),
      });

      if (workspace) {
        router.push('/dashboard');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSlugChange = (value: string) => {
    setSlugManuallyEdited(true);
    // Only allow lowercase letters, numbers, and hyphens
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 50);
    setSlug(sanitized);
  };

  const freeLimits = PLAN_LIMITS.free;
  const isFirstWorkspace = workspaces.length === 0;

  return (
    <div className="container max-w-3xl py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-6"
        asChild
      >
        <Link href="/workspaces">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Workspaces
        </Link>
      </Button>

      <div className="grid gap-6">
        {/* Main Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Create a New Workspace</CardTitle>
                <CardDescription>
                  Workspaces help you organize different businesses or projects
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Workspace Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  placeholder="My Awesome SaaS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  This is the display name for your workspace
                </p>
              </div>

              {/* Workspace Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Workspace URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground shrink-0">
                    solofounder.os/
                  </span>
                  <div className="relative flex-1">
                    <Input
                      id="slug"
                      placeholder="my-awesome-saas"
                      value={slug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className="pr-10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {checkingSlug ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : slugAvailable === true ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : slugAvailable === false ? (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      ) : null}
                    </div>
                  </div>
                </div>
                {slug && slugAvailable === false && (
                  <p className="text-sm text-destructive">
                    This URL is already taken. Please choose another.
                  </p>
                )}
                {slug && slugAvailable === true && (
                  <p className="text-sm text-green-600">
                    This URL is available!
                  </p>
                )}
                {!slug && (
                  <p className="text-sm text-muted-foreground">
                    This will be your unique workspace identifier
                  </p>
                )}
              </div>

              <Separator />

              {/* Free Plan Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Free Plan</Badge>
                  <span className="text-sm text-muted-foreground">
                    Your workspace will start on the free plan
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{formatLimit(freeLimits.landing_pages)} landing pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{formatLimit(freeLimits.contacts)} contacts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{formatLimit(freeLimits.vault_items)} vault items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{formatLimit(freeLimits.page_views)}/mo page views</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/workspaces')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !name.trim() ||
                  !slug.trim() ||
                  slugAvailable !== true ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Pro Plan Upsell */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Need more power?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upgrade to Pro for unlimited landing pages, 10,000 contacts, 
                  team members, and API access.
                </p>
                <div className="flex flex-wrap gap-4 text-sm mb-4">
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-primary" />
                    Unlimited pages
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-primary" />
                    5 team members
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    100K page views/mo
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/settings/billing">
                    View Plans
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold">$29</div>
                <div className="text-sm text-muted-foreground">/month</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* First Workspace Tips */}
        {isFirstWorkspace && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>Tip:</strong> You can create multiple workspaces to separate 
              different businesses or projects. Each workspace has its own landing 
              pages, contacts, and team members.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
