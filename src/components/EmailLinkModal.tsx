import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail, Chrome } from 'lucide-react';

interface EmailLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EmailLinkModal({ open, onOpenChange }: EmailLinkModalProps) {
  const [method, setMethod] = useState<'email' | 'google' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { linkEmailPassword, linkGoogleAccount } = useAuth();
  const { toast } = useToast();

  const handleLinkEmail = async () => {
    if (!email || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password',
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Weak Password',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await linkEmailPassword(email, password);
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Email Linked!',
        description: 'Your email has been successfully linked',
      });
      
      handleClose();
    } catch (error: any) {
      console.error('Link email error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to link email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await linkGoogleAccount();
      
      if (error) {
        throw error;
      }

      // Google will redirect, so no need to close modal
      toast({
        title: 'Redirecting...',
        description: 'Linking your Google account',
      });
    } catch (error: any) {
      console.error('Link Google error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to link Google account',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMethod(null);
    setEmail('');
    setPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Link Sign-In Method</DialogTitle>
          <DialogDescription>
            Add another way to sign in to your account
          </DialogDescription>
        </DialogHeader>

        {!method ? (
          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setMethod('email')}
              className="w-full h-12 justify-start gap-3"
            >
              <Mail className="h-5 w-5" />
              Link Email & Password
            </Button>

            <Button
              variant="outline"
              onClick={handleLinkGoogle}
              disabled={loading}
              className="w-full h-12 justify-start gap-3"
            >
              <Chrome className="h-5 w-5" />
              {loading ? 'Redirecting...' : 'Link Google Account'}
            </Button>

            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 Your subscription will work with all linked sign-in methods
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMethod(null)}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleLinkEmail}
                disabled={loading || !email || !password}
                className="flex-1"
              >
                {loading ? 'Linking...' : 'Link Email'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
