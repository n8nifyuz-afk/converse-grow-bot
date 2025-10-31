import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Mail, Lock, Key, Loader2 } from 'lucide-react';

export function EmailVerificationLinking() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [loading, setLoading] = useState(false);
  const [verificationId, setVerificationId] = useState('');

  const handleSendCode = async () => {
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('send-verification-code', {
        body: {
          email,
          password,
          userId: user?.id,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setStep('sent');
        toast.success('Verification link sent! Check your email.');
      } else {
        throw new Error(data?.error || 'Failed to send verification link');
      }
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'sent') {
    return (
      <div className="space-y-3">
        <div className="space-y-2 text-center py-4">
          <Mail className="h-12 w-12 mx-auto text-primary" />
          <h3 className="font-semibold text-sm">Check Your Email</h3>
          <p className="text-xs text-muted-foreground">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Click the link in the email to complete linking your email address.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setStep('input');
            setEmail('');
            setPassword('');
          }}
          className="w-full h-8 text-xs"
          size="sm"
        >
          Use Different Email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="flex items-center gap-1.5 text-xs">
          <Mail className="h-3 w-3" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="h-9 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="flex items-center gap-1.5 text-xs">
          <Lock className="h-3 w-3" />
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Choose a secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="h-9 text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          Minimum 6 characters
        </p>
      </div>

      <Button
        onClick={handleSendCode}
        disabled={loading || !email || !password}
        className="w-full h-8 text-xs"
        size="sm"
      >
        {loading ? (
          <>
            <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Verification Link'
        )}
      </Button>
    </div>
  );
}
