import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LinkEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');
      const email = searchParams.get('email');

      if (!token || !email) {
        setStatus('error');
        setMessage('Invalid verification link. Missing token or email.');
        return;
      }

      if (!user) {
        setStatus('error');
        setMessage('You must be logged in to link an email address.');
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setStatus('error');
          setMessage('Session expired. Please log in again.');
          return;
        }

        const { data, error } = await supabase.functions.invoke('verify-email-code', {
          body: {
            token,
            email,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

        if (data?.success) {
          setStatus('success');
          setMessage('Email successfully linked to your account!');
          toast.success('Email linked successfully! You can now login with your email.');
          
          // Redirect to home after 3 seconds
          setTimeout(() => {
            navigate('/');
            window.location.reload();
          }, 3000);
        } else {
          throw new Error(data?.error || 'Failed to verify email');
        }
      } catch (error: any) {
        console.error('Email verification error:', error);
        setStatus('error');
        setMessage(error.message || 'Failed to verify email. The link may have expired.');
        toast.error(error.message || 'Failed to verify email');
      }
    };

    verifyEmail();
  }, [searchParams, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
              <h2 className="text-2xl font-bold">Verifying Your Email</h2>
              <p className="text-muted-foreground">Please wait while we link your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h2 className="text-2xl font-bold text-green-600">Success!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">Redirecting you to the home page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <h2 className="text-2xl font-bold text-destructive">Verification Failed</h2>
              <p className="text-muted-foreground">{message}</p>
              <Button onClick={() => navigate('/')} className="mt-4">
                Go to Home
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
