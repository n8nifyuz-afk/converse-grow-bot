import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { trackRegistrationComplete } from '@/utils/gtmTracking';
interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
export default function AuthModal({
  isOpen,
  onClose,
  onSuccess
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0);
  const [signupCooldown, setSignupCooldown] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    resetPassword
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Close modal and call onSuccess when user is authenticated
  useEffect(() => {
    if (user && isOpen) {
      onClose();
      onSuccess?.();
    }
  }, [user, isOpen, onClose, onSuccess]);

  // Countdown timer for signup cooldown
  useEffect(() => {
    if (signupCooldown > 0) {
      const timer = setTimeout(() => {
        setSignupCooldown(signupCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [signupCooldown]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setMode('signin');
      setSignupCooldown(0);
      setError('');
      setShowPassword(false);
    }
  }, [isOpen]);
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');
    try {
      const {
        error: signInError
      } = await signIn(email, password);
      if (signInError) {
        // Check if this is an OAuth-only account
        if (signInError.code === 'oauth_only_account') {
          setError(signInError.message);
        } else if (signInError.code === 'password_reset_sent') {
          // Password reset email was sent
          toast({
            title: "Check your email",
            description: signInError.message,
            duration: 10000
          });
          setEmail('');
          setPassword('');
        } else {
          setError("Email or password is incorrect");
        }
      }
      // If sign in succeeds, the useEffect will handle closing the modal and redirecting
    } catch (error) {
      setError("An error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Check cooldown
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttempt;
    if (timeSinceLastAttempt < 60000) {
      // 60 seconds = 1 minute
      const remainingSeconds = Math.ceil((60000 - timeSinceLastAttempt) / 1000);
      setSignupCooldown(remainingSeconds);
      toast({
        title: "Please wait",
        description: `You can request a new sign up link in ${remainingSeconds} seconds`,
        variant: "destructive"
      });
      return;
    }
    setLoading(true);
    try {
      const {
        error
      } = await signUp(email, password, '');
      if (!error) {
        setLastSignupAttempt(now);
        setSignupCooldown(60);
        
        // Track registration complete in GTM
        trackRegistrationComplete();
        
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your sign up. Please check your inbox.",
          duration: 8000
        });
      } else {
        // Check if password setup email was sent for OAuth account
        if (error.code === 'password_setup_sent') {
          toast({
            title: "Check your email",
            description: error.message,
            duration: 10000
          });
          setEmail('');
          setPassword('');
          setMode('signin');
        } else if (error.code === 'oauth_account_exists') {
          toast({
            title: "Account exists with different sign-in method",
            description: error.message,
            variant: "destructive",
            duration: 10000
          });
          // Switch to sign in mode so they can see OAuth buttons
          setMode('signin');
        } else if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('user already registered')) {
          toast({
            title: "Account already exists",
            description: "This email is already registered. Please sign in instead.",
            variant: "destructive"
          });
          // Switch to sign in mode
          setMode('signin');
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      console.log('🔄 Requesting password reset for:', email);
      const {
        error
      } = await resetPassword(email);
      if (error) {
        console.error('❌ Password reset failed:', error);
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ Password reset email sent successfully');
        toast({
          title: "Check your email",
          description: "If an account exists with this email, you'll receive a password reset link. Please check your inbox and spam folder.",
          duration: 10000
        });
        setMode('signin');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('❌ Unexpected error during password reset:', error);
      toast({
        title: "An error occurred",
        description: "Please try again later or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const {
        error
      } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign-in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setGoogleLoading(false);
    }
  };
  const handleAppleSignIn = async () => {
    setAppleLoading(true);
    try {
      const {
        error
      } = await signInWithApple();
      if (error) {
        toast({
          title: "Apple sign-in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setAppleLoading(false);
    }
  };
  const authContent = <div className="flex flex-col min-h-[320px] md:min-h-[420px]">
          {/* Auth Form */}
          <div className="w-full p-4 md:p-6 flex flex-col">
            {/* Powered By */}
            

            {/* Main Heading */}
            <div className="mb-6 md:mb-7 text-center">
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                {t('authModal.title')}
              </h2>
            </div>

            {/* Auth Buttons */}
            <div className="flex-1 flex flex-col">
              {mode === 'reset' ? <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Enter your email and we'll send you a reset link.
                  </div>
                  <Input type="email" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} required className="h-11 md:h-12 text-base" />
                  <Button type="submit" disabled={loading || !email} className="w-full h-11 md:h-12 text-base">
                    {loading ? <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Sending...
                      </> : 'Send Reset Link'}
                  </Button>
                  <button type="button" onClick={() => {
            setMode('signin');
            setEmail('');
          }} className="text-sm text-primary hover:underline">
                    ← Back to sign in
                  </button>
                </form> : <>
                  {!showPassword && <>
                      <Button onClick={handleGoogleSignIn} disabled={googleLoading || appleLoading || loading} className="w-full h-11 md:h-12 mb-3 bg-gray-500 hover:bg-gray-600 text-white dark:bg-gray-600 dark:hover:bg-gray-700 text-base">
                        {googleLoading ? <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                            {t('authModal.continueWithGoogle')}
                          </> : <>
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {t('authModal.continueWithGoogle')}
                          </>}
                      </Button>

                      <Button onClick={handleAppleSignIn} disabled={googleLoading || appleLoading || loading} variant="outline" className="w-full h-11 md:h-12 mb-4 border-2 border-gray-400 dark:border-gray-600 text-base">
                        {appleLoading ? <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                            {t('authModal.continueWithApple')}
                          </> : <>
                            <svg className="w-7 h-7 mr-3" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                            </svg>
                            {t('authModal.continueWithApple')}
                          </>}
                      </Button>

                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-3 bg-background text-sm text-muted-foreground">{t('authModal.or')}</span>
                        </div>
                      </div>
                    </>}

                   <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-3">
                     <Input type="email" placeholder="Enter your email" value={email} onChange={e => {
              setEmail(e.target.value);
              setError('');
              // Show password field when email is entered, hide when cleared
              if (e.target.value.trim()) {
                setShowPassword(true);
              } else {
                setShowPassword(false);
              }
            }} required className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base" />
                     {showPassword && <Input type="password" placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'} value={password} onChange={e => {
              setPassword(e.target.value);
              setError('');
            }} required minLength={6} className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base" />}
                      {error && <div className="text-base text-destructive bg-destructive/10 px-4 py-3 rounded-md">
                         {error}
                       </div>}
                     {showPassword && <Button type="submit" disabled={loading || !email || !password || mode === 'signup' && signupCooldown > 0} className="w-full h-11 md:h-12 text-base">
                        {loading ? <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                            {mode === 'signin' ? t('authModal.signingIn') : t('authModal.sendingVerification')}
                          </> : mode === 'signup' && signupCooldown > 0 ? `${t('authModal.wait')} ${signupCooldown}s` : t('authModal.continueWithEmail')}
                      </Button>}
                   </form>

                  <div className="mt-4 text-center space-x-2 text-sm">
                    {mode === 'signin' ? <>
                        <span className="text-muted-foreground">{t('authModal.dontHaveAccount')}</span>
                        <button onClick={() => setMode('signup')} className="text-primary hover:underline font-medium">
                          {t('authModal.signUp')}
                        </button>
                        <span className="text-muted-foreground">|</span>
                        <button onClick={() => setMode('reset')} className="text-primary hover:underline">
                          {t('authModal.forgotPassword')}
                        </button>
                      </> : <>
                        <span className="text-muted-foreground">{t('authModal.alreadyHaveAccount')}</span>
                        <button onClick={() => setMode('signin')} className="text-primary hover:underline font-medium">
                          {t('authModal.signIn')}
                        </button>
                      </>}
                  </div>
                </>}
            </div>

            {/* Footer */}
            <div className="mt-5 md:mt-6 pt-5 border-t border-border">
              <div className="text-sm text-muted-foreground text-center">
                By proceeding, you agree to our{' '}
                <button onClick={() => {
            onClose();
            navigate('/terms');
          }} className="text-primary hover:underline">
                  Terms of Service
                </button>
                {' '}and read our{' '}
                <button onClick={() => {
            onClose();
            navigate('/privacy');
          }} className="text-primary hover:underline">
                  Privacy Policy
                </button>
                .
              </div>
            </div>
          </div>
        </div>;
  if (isMobile) {
    return <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[90vh] p-0">
          <DrawerHeader className="sr-only">
            <DrawerTitle>ChatLearn Authentication</DrawerTitle>
            <DrawerDescription>
              {mode === 'reset' ? 'Reset your password' : 'Sign in or sign up to ChatLearn'}
            </DrawerDescription>
          </DrawerHeader>
          {authContent}
        </DrawerContent>
      </Drawer>;
  }
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-md md:max-w-lg w-full p-0 bg-background border border-border shadow-2xl rounded-3xl overflow-hidden mx-auto my-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>ChatLearn Authentication</DialogTitle>
          <DialogDescription>
            {mode === 'reset' ? 'Reset your password' : 'Sign in or sign up to ChatLearn'}
          </DialogDescription>
        </DialogHeader>
        {authContent}
      </DialogContent>
    </Dialog>;
}