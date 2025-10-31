import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';
import { EmailVerificationLinking } from './EmailVerificationLinking';

interface EmailLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedIdentities?: any[];
}

export default function EmailLinkModal({ open, onOpenChange, linkedIdentities = [] }: EmailLinkModalProps) {
  const [method, setMethod] = useState<'email' | 'google' | 'apple' | 'microsoft' | null>(null);
  const [loading, setLoading] = useState(false);
  const { linkGoogleAccount, linkAppleAccount, linkMicrosoftAccount } = useAuth();
  const { toast } = useToast();

  // Check which methods are already linked
  const hasEmail = linkedIdentities.some(id => id.provider === 'email');
  const hasGoogle = linkedIdentities.some(id => id.provider === 'google');
  const hasApple = linkedIdentities.some(id => id.provider === 'apple');
  const hasMicrosoft = linkedIdentities.some(id => id.provider === 'azure');


  const handleLinkApple = async () => {
    setLoading(true);
    try {
      const { error } = await linkAppleAccount();
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('already linked')) {
          throw new Error('This Apple account is already linked to another user');
        }
        if (error.message?.includes('identity_already_exists')) {
          throw new Error('You have already linked an Apple account');
        }
        throw error;
      }

      toast({
        title: 'Redirecting...',
        description: 'Linking your Apple account',
      });
    } catch (error: any) {
      console.error('Link Apple error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to link Apple account',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleLinkMicrosoft = async () => {
    setLoading(true);
    try {
      const { error } = await linkMicrosoftAccount();
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('already linked')) {
          throw new Error('This Microsoft account is already linked to another user');
        }
        if (error.message?.includes('identity_already_exists')) {
          throw new Error('You have already linked a Microsoft account');
        }
        throw error;
      }

      toast({
        title: 'Redirecting...',
        description: 'Linking your Microsoft account',
      });
    } catch (error: any) {
      console.error('Link Microsoft error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to link Microsoft account',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await linkGoogleAccount();
      
      if (error) {
        // Handle specific error cases
        if (error.message?.includes('already linked')) {
          throw new Error('This Google account is already linked to another user');
        }
        if (error.message?.includes('identity_already_exists')) {
          throw new Error('You have already linked a Google account');
        }
        throw error;
      }

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

            {!hasGoogle && (
              <Button
                variant="outline"
                onClick={handleLinkGoogle}
                disabled={loading}
                className="w-full h-12 justify-start gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Link Google Account'}
              </Button>
            )}

            {!hasApple && (
              <Button
                variant="outline"
                onClick={handleLinkApple}
                disabled={loading}
                className="w-full h-12 justify-start gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Link Apple Account'}
              </Button>
            )}

            {!hasMicrosoft && (
              <Button
                variant="outline"
                onClick={handleLinkMicrosoft}
                disabled={loading}
                className="w-full h-12 justify-start gap-3"
              >
                <svg className="h-5 w-5" viewBox="0 0 23 23">
                  <path fill="#f35325" d="M0 0h11v11H0z"/>
                  <path fill="#81bc06" d="M12 0h11v11H12z"/>
                  <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                  <path fill="#ffba08" d="M12 12h11v11H12z"/>
                </svg>
                {loading ? 'Redirecting...' : 'Link Microsoft Account'}
              </Button>
            )}

            {hasEmail && hasGoogle && hasApple && hasMicrosoft && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                <p className="text-xs text-green-800 dark:text-green-300">
                  ✅ All sign-in methods are already linked to your account
                </p>
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
