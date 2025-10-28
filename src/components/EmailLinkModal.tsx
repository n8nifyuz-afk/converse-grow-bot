import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, CheckCircle2 } from 'lucide-react';

interface EmailLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export const EmailLinkModal: React.FC<EmailLinkModalProps> = ({ 
  open, 
  onOpenChange,
  userId,
  onSuccess
}) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'verify'>('email');

  const handleSendCode = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: { email, userId }
      });

      if (error) throw error;

      toast.success('Verification code sent to your email');
      setStep('verify');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: { email, code: verificationCode, userId }
      });

      if (error) throw error;

      // Update profile with verified email
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ email })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      toast.success('Email verified and linked successfully!');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to verify code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    await handleSendCode();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Link Your Email
          </DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? 'To complete your account setup, please provide your email address.'
              : 'Enter the 6-digit verification code sent to your email.'
            }
          </DialogDescription>
        </DialogHeader>

        {step === 'email' ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleSendCode}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Verification Code'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Code sent to {email}
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={handleVerifyCode}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify & Link Email'}
              </Button>
              <Button
                onClick={handleResendCode}
                variant="outline"
                disabled={isLoading}
                className="w-full"
              >
                Resend Code
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
