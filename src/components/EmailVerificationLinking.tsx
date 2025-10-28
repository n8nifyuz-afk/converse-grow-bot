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
  const [step, setStep] = useState<'input' | 'verify'>('input');
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
        setVerificationId(data.verificationId);
        setStep('verify');
        toast.success('Verification code sent! Check your email.');
      } else {
        throw new Error(data?.error || 'Failed to send verification code');
      }
    } catch (error: any) {
      console.error('Send code error:', error);
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndLink = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          verificationId,
          code: verificationCode,
          email,
          password,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success('Email linked successfully! You can now login with your email.');
        // Refresh the page to update the UI
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(data?.error || 'Invalid verification code');
      }
    } catch (error: any) {
      console.error('Verify code error:', error);
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="space-y-4 pl-11">
        <div className="space-y-2">
          <Label htmlFor="code" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Verification Code
          </Label>
          <Input
            id="code"
            type="text"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            disabled={loading}
            className="font-mono text-lg tracking-widest"
          />
          <p className="text-xs text-muted-foreground">
            Check your email ({email}) for the verification code
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleVerifyAndLink}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify & Link'
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setStep('input');
              setVerificationCode('');
            }}
            disabled={loading}
          >
            Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pl-11">
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Choose a secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />
        <p className="text-xs text-muted-foreground">
          Minimum 6 characters
        </p>
      </div>

      <Button
        onClick={handleSendCode}
        disabled={loading || !email || !password}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          'Send Verification Code'
        )}
      </Button>
    </div>
  );
}
