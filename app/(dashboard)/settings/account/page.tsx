'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  Mail,
  Lock,
  Upload,
  Loader2,
  Save,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
}

export default function AccountSettingsPage() {
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  useEffect(() => {
    async function loadUser() {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUser({ id: user.id, email: user.email || '' });

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single() as { data: Profile | null };

        if (profile) {
          setProfile(profile);
          setFullName(profile.full_name || '');
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [supabase]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: fullName.trim() || null,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/account/delete', { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete account. Please try again.');
        return;
      }

      // Sign out locally and redirect to login — the account no longer exists
      await supabase.auth.signOut();
      toast.success('Your account has been deleted.');
      window.location.href = '/login';
    } catch (err) {
      console.error('Delete account error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    }
  };

  const getInitials = () => {
    if (fullName) {
      return fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  if (isLoading) {
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

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          Account Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your personal account settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your personal information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} />
                ) : null}
                <AvatarFallback className="text-xl">{getInitials()}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Contact support to change your email address
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        {/* Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Password
            </CardTitle>
            <CardDescription>
              Change your account password
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be at least 8 characters long
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleChangePassword}
              disabled={isChangingPassword || !newPassword || !confirmPassword}
            >
              {isChangingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Change Password
            </Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible account actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4">
                    <Label>
                      Type <strong>DELETE</strong> to confirm
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                      className="mt-2"
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmation !== 'DELETE'}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
