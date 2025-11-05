import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import { trackRegistrationComplete } from '@/utils/gtmTracking';
import { CountryPhoneInput } from '@/components/CountryPhoneInput';
import PhoneAuthModal from '@/components/PhoneAuthModal';
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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset' | 'phone' | 'verify' | 'verify-email' | 'complete-profile'>('signin');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profileStep, setProfileStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [lastSignupAttempt, setLastSignupAttempt] = useState<number>(0);
  const [signupCooldown, setSignupCooldown] = useState<number>(0);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPhoneValidation, setShowPhoneValidation] = useState(false);
  const [isPhoneInputFocused, setIsPhoneInputFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [showEmailPasswordModal, setShowEmailPasswordModal] = useState(false);
  const [showEmailPasswordInline, setShowEmailPasswordInline] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showVerificationInModal, setShowVerificationInModal] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const {
    user,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signInWithMicrosoft,
    signInWithPhone,
    verifyOtp,
    resetPassword,
    refreshUserProfile
  } = useAuth();
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Close modal and call onSuccess when user is authenticated
  // BUT NOT if we're in complete-profile mode OR if phone modal is open (phone auth may need profile completion)
  useEffect(() => {
    if (user && isOpen && mode !== 'complete-profile' && !showPhoneModal) {
      onClose();
      onSuccess?.();
    }
  }, [user, isOpen, mode, showPhoneModal, onClose, onSuccess]);

  // Countdown timer for signup cooldown
  useEffect(() => {
    if (signupCooldown > 0) {
      const timer = setTimeout(() => {
        setSignupCooldown(signupCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [signupCooldown]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => {
        setOtpTimer(otpTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setPassword('');
      setPhone('');
      setOtp('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setMode('signin');
      setProfileStep(1);
      setSignupCooldown(0);
      setOtpTimer(0);
      setError('');
      setShowPassword(false);
      setShowPhoneValidation(false);
      setShowEmailPasswordModal(false);
      setShowEmailPasswordInline(false);
      setShowPhoneModal(false);
    }
  }, [isOpen]);

  // Reset phone validation when changing modes
  useEffect(() => {
    if (mode !== 'phone') {
      setShowPhoneValidation(false);
      setIsPhoneInputFocused(false);
    }
  }, [mode]);
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
          if (isMobile) {
            sonnerToast.error("OAuth Account", { description: signInError.message, duration: 3000 });
          } else {
            setError(signInError.message);
          }
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
          if (isMobile) {
            sonnerToast.error("Sign In Failed", { description: "Email or password is incorrect", duration: 3000 });
          } else {
            setError("Email or password is incorrect");
          }
        }
      }
      // If sign in succeeds, the useEffect will handle closing the modal and redirecting
    } catch (error) {
      if (isMobile) {
        sonnerToast.error("Error", { description: "An error occurred. Please try again later.", duration: 3000 });
      } else {
        setError("An error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Check cooldown
    const now = Date.now();
    const timeSinceLastAttempt = now - lastSignupAttempt;
    if (timeSinceLastAttempt < 60000) {
      const remainingSeconds = Math.ceil((60000 - timeSinceLastAttempt) / 1000);
      setSignupCooldown(remainingSeconds);
      toast({
        title: "Please wait",
        description: `You can request a new verification code in ${remainingSeconds} seconds`,
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Capture tracking data from localStorage
      const gclid = localStorage.getItem('gclid');
      const urlParams = localStorage.getItem('url_params');
      const initialReferer = localStorage.getItem('initial_referer');
      
      // Fetch IP and country
      const { fetchIPAndCountry } = await import('@/utils/webhookMetadata');
      const { ip, country } = await fetchIPAndCountry();
      
      // Use Supabase client to invoke edge function
      const { data, error: invokeError } = await supabase.functions.invoke('send-verification-code', {
        body: { 
          email, 
          password,
          gclid,
          urlParams: urlParams ? JSON.parse(urlParams) : {},
          initialReferer,
          ipAddress: ip,
          country
        }
      });

      // Handle errors from edge function (including 409 status codes)
      if (invokeError) {
        console.error('Edge function invocation error:', invokeError);
        
        // Try to parse the error message from the response
        let errorMessage = invokeError.message || "Failed to send verification code. Please try again.";
        
        // Check if this is an "already registered" error
        const isAlreadyRegistered = 
          errorMessage.toLowerCase().includes('already registered') ||
          errorMessage.toLowerCase().includes('already exists') ||
          errorMessage.toLowerCase().includes('user already');
        
        if (isAlreadyRegistered) {
          const friendlyMessage = "This email is already registered. Please sign in or use the Forgot Password option.";
          
          if (isMobile) {
            // Show toast popup for mobile
            sonnerToast.error("Account Exists", { 
              description: friendlyMessage, 
              duration: 5000 
            });
          } else {
            // Show inline error for desktop
            setError(friendlyMessage);
          }
        } else {
          // Handle other errors
          if (isMobile) {
            sonnerToast.error("Sign Up Failed", { description: errorMessage, duration: 3000 });
          } else {
            setError(errorMessage);
          }
        }
        return;
      }

      // Handle error responses from the function (when status is 2xx but contains error)
      if (data?.error) {
        const isAlreadyRegistered = 
          data.error.toLowerCase().includes('already registered') ||
          data.error.toLowerCase().includes('already exists') ||
          data.error.toLowerCase().includes('user already');
        
        if (isAlreadyRegistered) {
          const errorMessage = "This email is already registered. Please sign in or use the Forgot Password option.";
          
          if (isMobile) {
            sonnerToast.error("Account Exists", { 
              description: errorMessage, 
              duration: 5000 
            });
          } else {
            setError(errorMessage);
          }
        } else {
          if (isMobile) {
            sonnerToast.error("Sign Up Failed", { description: data.error, duration: 3000 });
          } else {
            setError(data.error);
          }
        }
        return;
      }

      // Success - verification code sent
      if (data?.success) {
        setLastSignupAttempt(now);
        setSignupCooldown(60);
        setPendingEmail(email);
        
        toast({
          title: "Check your email",
          description: "We've sent a 6-digit verification code to your email. Please enter it below.",
          duration: 3000
        });
        
        // Switch to verification code mode
        // For mobile with email/password modal open, show verification in the same modal
        if (isMobile && showEmailPasswordModal) {
          setShowVerificationInModal(true);
        } else {
          setMode('verify-email');
        }
      } else {
        setError("Unexpected response from server. Please try again.");
      }
    } catch (error) {
      console.error('Unexpected error during signup:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingEmail || !verificationCode) return;

    if (verificationCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Capture tracking data from localStorage
      const gclid = localStorage.getItem('gclid');
      const urlParams = localStorage.getItem('url_params');
      const initialReferer = localStorage.getItem('initial_referer');
      
      const { data, error: invokeError } = await supabase.functions.invoke('verify-email-code', {
        body: { 
          email: pendingEmail, 
          code: verificationCode,
          gclid,
          urlParams: urlParams ? JSON.parse(urlParams) : {},
          initialReferer
        }
      });

      // Handle invocation errors
      if (invokeError) {
        console.error('Verification invocation error:', invokeError);
        setError("An unexpected error occurred. Please try again.");
        return;
      }

      // Handle error responses from the function (including success: false)
      if (data?.error || data?.success === false) {
        setError(data.error || "Verification failed. Please try again.");
        return;
      }

      // Success - handle different scenarios
      if (data?.success) {
        // Case 1: User already exists (tried to verify twice or account exists)
        if (data.alreadyExists) {
          // Close email/password modal if open (mobile view)
          if (showEmailPasswordModal) {
            setShowEmailPasswordModal(false);
            setShowVerificationInModal(false);
          }
          
          if (data.provider) {
            // OAuth account exists
            toast({
              title: "Account Found",
              description: data.message,
              duration: 8000,
            });
            setMode('signin');
          } else {
            // Email/password account exists
            toast({
              title: "Account Already Exists",
              description: data.message,
              duration: 6000,
            });
            setMode('signin');
            // Pre-fill email for convenience
            setEmail(pendingEmail);
          }
        }
        // Case 2: New user created successfully - automatically sign in
        else if (data.newUser) {
          toast({
            title: "Success!",
            description: "Your account has been created. Signing you in...",
            duration: 3000
          });
          
          // Close email/password modal if open (mobile view)
          if (showEmailPasswordModal) {
            setShowEmailPasswordModal(false);
            setShowVerificationInModal(false);
          }
          
          // Automatically sign in the user
          const { error: signInError } = await signIn(pendingEmail, password);
          
          if (signInError) {
            // If auto sign-in fails, switch to signin mode
            setMode('signin');
            setEmail(pendingEmail);
            toast({
              title: "Please sign in",
              description: "Your account was created. Please sign in to continue.",
              duration: 5000
            });
          }
          // If sign-in succeeds, the useEffect will handle closing the modal
        }
        
        // Clean up verification state
        setVerificationCode('');
        setPendingEmail('');
        setPassword('');
      }
    } catch (error) {
      console.error('Unexpected verification error:', error);
      setError("An unexpected error occurred. Please try again.");
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
          duration: 3000
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

  const handleMicrosoftSignIn = async () => {
    setMicrosoftLoading(true);
    try {
      const {
        error
      } = await signInWithMicrosoft();
      if (error) {
        toast({
          title: "Microsoft sign-in failed",
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
      setMicrosoftLoading(false);
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPhoneValidation(true); // Show validation when form is submitted
    
    if (!phone) return;
    
    setPhoneLoading(true);
    setError('');
    
    try {
      const { error } = await signInWithPhone(phone);
      
      if (error) {
        toast({
          title: "Failed to send code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setMode('verify');
        setOtpTimer(60); // 60 seconds countdown
        setShowPhoneValidation(false); // Reset validation state
        sonnerToast.success("Code sent!", {
          description: "Please check your phone for the verification code.",
          duration: 3000
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return;
    
    setLoading(true);
    setError('');
    
    try {
      // CRITICAL: Set mode to 'complete-profile' BEFORE verifyOtp to prevent race condition
      // The useEffect that auto-closes on authentication checks for mode !== 'complete-profile'
      // We need to set this mode first, then we'll revert if profile is already complete
      const tempMode = mode;
      setMode('complete-profile');
      
      const { error } = await verifyOtp(phone, otp);
      
      if (error) {
        setError("Invalid verification code. Please try again.");
        setMode(tempMode); // Revert mode on error
        setLoading(false);
      } else {
        // Check if user already has complete profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, date_of_birth')
            .eq('user_id', user.id)
            .single();
          
          // If profile is complete, allow modal to close
          if (profile?.display_name && profile?.date_of_birth) {
            setLoading(false);
            setMode(tempMode); // Revert mode to allow auto-close
            onClose();
            onSuccess?.();
          } else {
            // Profile incomplete - stay in complete-profile mode and show form
            setProfileStep(1);
            setLoading(false);
          }
        } else {
          // New user - show profile completion form
          setProfileStep(1);
          setLoading(false);
        }
      }
    } catch (error) {
      setError("An error occurred. Please try again later.");
      setMode('verify'); // Revert to verify mode on error
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Step 1: First name
    if (profileStep === 1) {
      if (!firstName.trim()) {
        setError("Please enter your first name.");
        return;
      }
      setProfileStep(2);
      return;
    }
    
    // Step 2: Last name
    if (profileStep === 2) {
      if (!lastName.trim()) {
        setError("Please enter your last name.");
        return;
      }
      setProfileStep(3);
      return;
    }
    
    // Step 3: Date of birth - save to profile
    if (profileStep === 3) {
      if (!dateOfBirth) {
        setError("Please enter your date of birth.");
        return;
      }
      
      // Validate date format DD/MM/YYYY
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = dateOfBirth.match(dateRegex);
      
      if (!match) {
        setError("Please enter date in DD/MM/YYYY format.");
        return;
      }
      
      const [, day, month, year] = match;
      const dayNum = parseInt(day);
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      // Basic validation
      if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > new Date().getFullYear()) {
        setError("Please enter a valid date.");
        return;
      }
      
      // Convert to YYYY-MM-DD format for database
      const dbDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Unable to get user information. Please try again.");
          setLoading(false);
          return;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: `${firstName} ${lastName}`,
            date_of_birth: dbDate,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (updateError) {
          setError("Failed to save profile. Please try again.");
          setLoading(false);
        } else {
          // Send webhook after profile completion (for phone signups)
          try {
            console.log('📤 Sending profile completion webhook for user:', user.id);
            await supabase.functions.invoke('send-profile-complete-webhook', {
              body: { userId: user.id }
            });
            console.log('✅ Profile completion webhook sent successfully');
          } catch (webhookError) {
            // Don't block user flow if webhook fails
            console.error('❌ Failed to send profile completion webhook:', webhookError);
          }
          
          // Refresh user profile in context to update UI everywhere
          await refreshUserProfile();
          
          // Close modal and trigger success
          onClose();
          onSuccess?.();
        }
      } catch (error) {
        setError("An error occurred. Please try again later.");
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setPhoneLoading(true);
    try {
      const { error } = await signInWithPhone(phone);
      
      if (error) {
        toast({
          title: "Failed to resend code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setOtpTimer(60);
        sonnerToast.success("Code sent!", {
          description: "A new verification code has been sent.",
          duration: 3000
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setPhoneLoading(false);
    }
  };

  const authContent = <div className="flex flex-col h-full">
           {/* Auth Form */}
           <div className="w-full px-4 md:px-6 py-8 md:py-12 flex flex-col pb-safe relative">
             {/* Main Heading - Hide during profile completion */}
             {mode !== 'complete-profile' && (
               <div className="mb-6 md:mb-7 text-center">
                 <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                   {t('authModal.title')}
                 </h2>
               </div>
             )}

            {/* Auth Buttons */}
            <div className="flex-1 flex flex-col">
              {mode === 'reset' ? <form onSubmit={handlePasswordReset} className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    {t('authModal.resetDescription')}
                  </div>
                  <Input type="email" placeholder={t('authModal.enterEmail')} value={email} onChange={e => setEmail(e.target.value)} required className="h-11 md:h-12 text-base" />
                  <Button type="submit" disabled={loading || !email} className="w-full h-11 md:h-12 text-base">
                    {loading ? <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        {t('authModal.sending')}
                      </> : t('authModal.sendResetLink')}
                  </Button>
                  <button type="button" onClick={() => {
            setMode('signin');
            setEmail('');
          }} className="text-sm text-primary hover:underline">
                    {t('authModal.backToSignIn')}
                  </button>
                 </form> : mode === 'phone' ? <form onSubmit={handlePhoneSignIn} className="space-y-3">
                  <div className="text-sm md:text-base text-muted-foreground">
                    {t('authModal.enterPhoneNumber')}
                  </div>
                  <CountryPhoneInput
                    value={phone}
                    onChange={setPhone}
                    className="w-full"
                    disabled={phoneLoading}
                    showValidation={showPhoneValidation}
                  />
                  {error && <div className="text-sm md:text-base text-destructive bg-destructive/10 px-3 md:px-4 py-2 md:py-3 rounded-md">
                     {error}
                   </div>}
                  <Button type="submit" disabled={phoneLoading || !phone} className="w-full h-12 md:h-13 text-base md:text-lg font-medium bg-black hover:bg-black/90 text-white dark:bg-primary dark:hover:bg-primary/90">
                    {phoneLoading ? <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        {t('authModal.sendingCode')}
                      </> : t('authModal.sendVerificationCode')}
                  </Button>
                  <button type="button" onClick={() => {
            setMode('signin');
            setPhone('');
            setError('');
            setShowPhoneValidation(false);
            // Reset to default modal state on mobile
            if (isMobile) {
              setEmail('');
              setPassword('');
              setShowPassword(false);
              setIsEmailFocused(false);
              // Scroll to top
              setTimeout(() => {
                if (drawerContentRef.current) {
                  drawerContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }, 100);
            }
          }} className="text-sm text-primary hover:underline">
                    ← Back to sign in
                  </button>
                </form> : mode === 'verify' ? <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Enter the 6-digit code sent to {phone}
                  </div>
                  <Input 
                    type="text" 
                    placeholder="000000" 
                    value={otp} 
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                    required 
                    className="h-11 md:h-12 text-base text-center text-xl tracking-widest"
                    maxLength={6}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                  />
                  {error && <div className="text-base text-destructive bg-destructive/10 px-4 py-3 rounded-md">
                     {error}
                   </div>}
                  <Button type="submit" disabled={loading || otp.length !== 6} className="w-full h-11 md:h-12 text-base">
                    {loading ? <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Verifying...
                      </> : 'Verify Code'}
                  </Button>
                  <div className="flex justify-between items-center text-sm">
                    <button 
                      type="button" 
                      onClick={handleResendOtp} 
                      disabled={otpTimer > 0 || phoneLoading}
                      className="text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {phoneLoading ? 'Sending...' : otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend code'}
                    </button>
                    <button type="button" onClick={() => {
              setMode('phone');
              setOtp('');
              setError('');
            }} className="text-primary hover:underline">
                      Change number
                    </button>
                  </div>
                 </form> : mode === 'complete-profile' ? <form onSubmit={handleCompleteProfile} className="space-y-5 pb-safe">
                  <div className="text-center mb-2">
                    <h3 className="text-xl font-bold mb-1">
                      {profileStep === 1 && "What's your first name?"}
                      {profileStep === 2 && "What's your last name?"}
                      {profileStep === 3 && "When's your birthday?"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Step {profileStep} of 3
                    </p>
                  </div>
                  
                  {profileStep === 1 && (
                    <Input 
                      type="text" 
                      placeholder="Enter your first name" 
                      value={firstName} 
                      onChange={e => setFirstName(e.target.value)} 
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                      required 
                      autoFocus
                      className="h-12 md:h-13 text-base"
                    />
                  )}
                  
                  {profileStep === 2 && (
                    <Input 
                      type="text" 
                      placeholder="Enter your last name" 
                      value={lastName} 
                      onChange={e => setLastName(e.target.value)} 
                      onFocus={(e) => {
                        setTimeout(() => {
                          e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }, 300);
                      }}
                      required 
                      autoFocus
                      className="h-12 md:h-13 text-base"
                    />
                  )}
                  
                  {profileStep === 3 && (
                    <div className="space-y-2">
                      <Input 
                        type="text" 
                        placeholder="DD/MM/YYYY" 
                        value={dateOfBirth} 
                        onChange={e => {
                          // Allow only numbers and slashes
                          let input = e.target.value.replace(/[^\d/]/g, '');
                          
                          // Auto-format as user types
                          if (input.length === 2 && !input.includes('/')) {
                            input = input + '/';
                          } else if (input.length === 5 && input.split('/').length === 2) {
                            input = input + '/';
                          }
                          
                          // Limit to DD/MM/YYYY format (10 characters)
                          if (input.length <= 10) {
                            setDateOfBirth(input);
                          }
                        }} 
                        onFocus={(e) => {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 300);
                        }}
                        required 
                        autoFocus
                        maxLength={10}
                        className="h-12 md:h-13 text-base tracking-wider"
                      />
                      <p className="text-xs text-muted-foreground">
                        Format: DD/MM/YYYY (e.g., 09/02/2005)
                      </p>
                    </div>
                  )}
                  
                  {error && <div className="text-base text-destructive bg-destructive/10 px-4 py-3 rounded-md">
                     {error}
                   </div>}
                  
                  <div className="flex gap-3">
                    {profileStep > 1 && (
                      <Button 
                        type="button" 
                        onClick={() => {
                          setProfileStep((profileStep - 1) as 1 | 2 | 3);
                          setError('');
                        }}
                        onPointerDown={(e) => e.preventDefault()}
                        variant="outline"
                        className="flex-1 h-12 md:h-13 text-base"
                      >
                        Back
                      </Button>
                    )}
                    <Button 
                      type="submit" 
                      disabled={loading}
                      onPointerDown={(e) => e.preventDefault()}
                      className={`h-12 md:h-13 text-base ${profileStep === 1 ? 'w-full' : 'flex-1'}`}
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                          Creating account...
                        </>
                      ) : profileStep === 3 ? (
                        'Complete'
                      ) : (
                        'Next'
                      )}
                    </Button>
                  </div>
                 </form> : mode === 'verify-email' ? <form onSubmit={handleVerifyEmailCode} className="space-y-6">
                  {/* Header */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-center">
                      <h3 className="text-xl font-bold mb-1">Verify Your Email</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter the 6-digit code sent to<br/>
                        <span className="font-medium text-foreground">{pendingEmail}</span>
                      </p>
                    </div>
                  </div>

                  {/* 6-digit code input with individual boxes */}
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-center gap-2">
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={verificationCode[index] || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            const newCode = verificationCode.split('');
                            newCode[index] = value;
                            setVerificationCode(newCode.join(''));
                            
                            // Auto-focus next input if value was entered
                            if (value && index < 5) {
                              document.getElementById(`code-${index + 1}`)?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              if (verificationCode[index]) {
                                // Clear current input
                                const newCode = verificationCode.split('');
                                newCode[index] = '';
                                setVerificationCode(newCode.join(''));
                              } else if (index > 0) {
                                // Move to previous input if current is empty
                                document.getElementById(`code-${index - 1}`)?.focus();
                              }
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                            setVerificationCode(pastedData);
                            if (pastedData.length === 6) {
                              document.getElementById('code-5')?.focus();
                            }
                          }}
                          className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                          required
                        />
                      ))}
                    </div>
                    
                    {/* Resend code option */}
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (signupCooldown === 0) {
                            handleSignUp(new Event('submit') as any);
                          }
                        }}
                        disabled={signupCooldown > 0}
                        className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
                      >
                        {signupCooldown > 0 
                          ? `Resend code in ${signupCooldown}s` 
                          : "Didn't receive the code? Resend"}
                      </button>
                    </div>
                  </div>

                  {error && <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20">
                     {error}
                   </div>}
                  
                  <Button 
                    type="submit" 
                    disabled={loading || verificationCode.length !== 6} 
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? <>
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Verifying...
                      </> : 'Verify Email'}
                  </Button>
                  
                  <button type="button" onClick={() => {
            setMode('signup');
            setVerificationCode('');
            setPendingEmail('');
            setError('');
          }} className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors">
                    ← Back to sign up
                   </button>
                  </form> : <>
                   {!showPassword && !(isMobile && isEmailFocused) && !showEmailPasswordInline && <>
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

                      <Button onClick={handleAppleSignIn} disabled={googleLoading || appleLoading || microsoftLoading || loading} variant="outline" className="w-full h-11 md:h-12 mb-3 border-2 border-gray-400 dark:border-gray-600 text-base">
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

                      <Button 
                        onClick={handleMicrosoftSignIn} 
                        disabled={googleLoading || appleLoading || microsoftLoading || loading} 
                        variant="outline" 
                        className="w-full h-11 md:h-12 mb-3 border-2 border-gray-400 dark:border-gray-600 text-base"
                      >
                        {microsoftLoading ? <>
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-3" />
                            {t('authModal.continueWithMicrosoft')}
                          </> : <>
                            <svg className="w-6 h-6 mr-3" viewBox="0 0 23 23" fill="none">
                              <path d="M0 0h11v11H0V0z" fill="#f25022"/>
                              <path d="M12 0h11v11H12V0z" fill="#00a4ef"/>
                              <path d="M0 12h11v11H0V12z" fill="#7fba00"/>
                              <path d="M12 12h11v11H12V12z" fill="#ffb900"/>
                            </svg>
                            {t('authModal.continueWithMicrosoft')}
                          </>}
                      </Button>

                      <Button 
                        onClick={() => {
                          if (isMobile) {
                            setShowPhoneModal(true);
                          } else {
                            setMode('phone');
                          }
                        }} 
                        disabled={googleLoading || appleLoading || microsoftLoading || loading} 
                        variant="outline" 
                        className="w-full h-11 md:h-12 mb-3 border-2 border-gray-400 dark:border-gray-600 text-base"
                      >
                        <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        {t('authModal.continueWithPhone')}
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

                   {/* Email/Password inline for desktop, modal trigger for mobile */}
                   {!showEmailPasswordInline ? (
                     <div className="space-y-3">
                       <Input 
                         ref={emailInputRef}
                         type="email" 
                         placeholder={t('authModal.enterEmail')} 
                         value=""
                         readOnly
                         onClick={() => {
                           if (isMobile) {
                             setShowEmailPasswordModal(true);
                           } else {
                             setShowEmailPasswordInline(true);
                           }
                         }}
                         className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base cursor-pointer" 
                       />
                     </div>
                   ) : (
                     <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
                       <Input 
                         type="email" 
                         placeholder={t('authModal.enterEmail')} 
                         value={email} 
                         onChange={e => {
                           setEmail(e.target.value);
                           setError('');
                         }}
                         required
                         autoFocus
                         className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base" 
                       />
                       
                       <Input 
                         type="password" 
                         placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'} 
                         value={password} 
                         onChange={e => {
                           setPassword(e.target.value);
                           setError('');
                         }} 
                         required 
                         minLength={6} 
                         className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base" 
                       />
                       
                       {error && (
                         <div className="text-base text-destructive bg-destructive/10 px-4 py-3 rounded-md">
                           {error}
                         </div>
                       )}
                       
                       <Button 
                         type="submit" 
                         disabled={loading || !email || !password || (mode === 'signup' && signupCooldown > 0)} 
                         className="w-full h-11 md:h-12 text-base"
                       >
                         {loading ? (
                           <>
                             <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                             {mode === 'signin' ? t('authModal.signingIn') : t('authModal.sendingVerification')}
                           </>
                         ) : mode === 'signup' && signupCooldown > 0 ? (
                           `${t('authModal.wait')} ${signupCooldown}s`
                         ) : (
                           t('authModal.continueWithEmail')
                         )}
                       </Button>

                       <button 
                         type="button" 
                         onClick={() => {
                           setShowEmailPasswordInline(false);
                           setEmail('');
                           setPassword('');
                           setError('');
                         }} 
                         className="text-sm text-muted-foreground hover:text-foreground"
                       >
                         ← Back to other options
                       </button>
                     </form>
                   )}

                  <div className="mt-4 text-center space-x-2 text-sm">
                    {mode === 'signin' ? <>
                        <span className="text-muted-foreground">{t('authModal.dontHaveAccount')}</span>
                        <button onClick={() => {
                          setMode('signup');
                          setError('');
                        }} className="text-primary hover:underline font-medium">
                          {t('authModal.signUp')}
                        </button>
                        <span className="text-muted-foreground">|</span>
                        <button onClick={() => {
                          setMode('reset');
                          setError('');
                        }} className="text-primary hover:underline">
                          {t('authModal.forgotPassword')}
                        </button>
                      </> : <>
                        <span className="text-muted-foreground">{t('authModal.alreadyHaveAccount')}</span>
                        <button onClick={() => {
                          setMode('signin');
                          setError('');
                        }} className="text-primary hover:underline font-medium">
                          {t('authModal.signIn')}
                        </button>
                      </>}
                  </div>
                 </>}
             </div>

             {/* Footer */}
             <div className="mt-5 md:mt-6 pt-5 border-t border-border">
               <div className="text-sm text-muted-foreground text-center">
                 {t('authModal.termsAgreement')}{' '}
                 <button onClick={() => {
             onClose();
             navigate('/terms');
           }} className="text-primary hover:underline">
                   {t('authModal.termsOfService')}
                 </button>
                 {' '}{t('authModal.and')}{' '}
                 <button onClick={() => {
             onClose();
             navigate('/privacy');
           }} className="text-primary hover:underline">
                   {t('authModal.privacyPolicy')}
                 </button>
                 .
               </div>
             </div>
           </div>
         </div>;
  // Email/Password Modal Content
  const emailPasswordContent = (
    <div className="w-full px-4 md:px-6 py-8 md:py-12">
      {!showVerificationInModal ? (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-2xl md:text-3xl font-bold">
              {mode === 'signin' ? 'Sign In' : 'Sign Up'}
            </h2>
          </div>
          
          <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
        <Input 
          type="email" 
          placeholder={t('authModal.enterEmail')} 
          value={email} 
          onChange={e => {
            setEmail(e.target.value);
            setError('');
          }}
          required
          autoFocus
          className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base" 
        />
        
        <Input 
          type="password" 
          placeholder={mode === 'signup' ? 'Password (min 6 characters)' : 'Password'} 
          value={password} 
          onChange={e => {
            setPassword(e.target.value);
            setError('');
          }} 
          required 
          minLength={6} 
          className="h-11 md:h-12 border-2 border-gray-400 dark:border-gray-600 text-base" 
        />
        
        {error && (
          <div className="text-base text-destructive bg-destructive/10 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <Button 
          type="submit" 
          disabled={loading || !email || !password || (mode === 'signup' && signupCooldown > 0)} 
          className="w-full h-11 md:h-12 text-base"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
              {mode === 'signin' ? t('authModal.signingIn') : t('authModal.sendingVerification')}
            </>
          ) : mode === 'signup' && signupCooldown > 0 ? (
            `${t('authModal.wait')} ${signupCooldown}s`
          ) : (
            t('authModal.continueWithEmail')
          )}
        </Button>
      </form>
      
      <div className="mt-4 text-center space-x-2 text-sm">
        {mode === 'signin' ? (
          <>
            <span className="text-muted-foreground">{t('authModal.dontHaveAccount')}</span>
            <button 
              onClick={() => {
                setMode('signup');
                setError('');
              }} 
              className="text-primary hover:underline font-medium"
            >
              {t('authModal.signUp')}
            </button>
            <span className="text-muted-foreground">|</span>
            <button 
              onClick={() => {
                setMode('reset');
                setShowEmailPasswordModal(false);
              }} 
              className="text-primary hover:underline"
            >
              {t('authModal.forgotPassword')}
            </button>
          </>
        ) : (
          <>
            <span className="text-muted-foreground">{t('authModal.alreadyHaveAccount')}</span>
            <button 
              onClick={() => {
                setMode('signin');
                setError('');
              }} 
              className="text-primary hover:underline font-medium"
            >
              {t('authModal.signIn')}
            </button>
          </>
        )}
      </div>
        </>
      ) : (
        // Verification code UI in the same modal
        <form onSubmit={handleVerifyEmailCode} className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-1">Verify Your Email</h3>
              <p className="text-sm text-muted-foreground">
                We sent a code to <span className="font-semibold">{pendingEmail}</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Enter 6-digit code</label>
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setVerificationCode(value);
                  setError('');
                }}
                placeholder="000000"
                className="text-center text-2xl tracking-widest font-mono h-14"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full h-12"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  if (signupCooldown === 0) {
                    handleSignUp(new Event('submit') as any);
                  }
                }}
                disabled={signupCooldown > 0}
                className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {signupCooldown > 0 
                  ? `Resend code in ${signupCooldown}s` 
                  : "Didn't receive the code? Resend"}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowVerificationInModal(false);
              setVerificationCode('');
              setPendingEmail('');
              setError('');
            }}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to sign up
          </button>
        </form>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Drawer 
          open={isOpen} 
          onOpenChange={() => {}}
          dismissible={false}
          modal={true}
          noBodyStyles={true}
        >
          <DrawerContent 
            ref={drawerContentRef}
            className="h-auto p-0" 
            style={{ 
              maxHeight: mode === 'verify-email' ? '60dvh' : mode === 'complete-profile' ? '70dvh' : '80dvh',
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              paddingBottom: 'env(safe-area-inset-bottom)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'visible'
            }}
          >
            <DrawerHeader className="sr-only">
              <DrawerTitle>ChatLearn Authentication</DrawerTitle>
              <DrawerDescription>
                {mode === 'reset' ? 'Reset your password' : 'Sign in or sign up to ChatLearn'}
              </DrawerDescription>
            </DrawerHeader>
            {authContent}
          </DrawerContent>
        </Drawer>

        {/* Separate Email/Password Modal */}
        <Drawer 
          open={showEmailPasswordModal} 
          onOpenChange={(open) => {
            setShowEmailPasswordModal(open);
            if (!open) {
              // Reset all states when closing modal
              setEmail('');
              setPassword('');
              setError('');
              setMode('signin');
              setShowVerificationInModal(false);
              setVerificationCode('');
              setPendingEmail('');
            }
          }}
          dismissible={true}
          modal={true}
        >
          <DrawerContent className="h-auto p-0">
            <DrawerHeader className="sr-only">
              <DrawerTitle>Email Sign In</DrawerTitle>
              <DrawerDescription>Sign in with email and password</DrawerDescription>
            </DrawerHeader>
            {emailPasswordContent}
          </DrawerContent>
        </Drawer>

        {/* Separate Phone Auth Modal Component */}
        <PhoneAuthModal 
          isOpen={showPhoneModal}
          onClose={() => setShowPhoneModal(false)}
          onSuccess={onSuccess}
        />
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-[90vw] sm:max-w-md md:max-w-xl w-full p-0 bg-background border border-border shadow-2xl rounded-3xl overflow-hidden mx-auto my-auto max-h-[85vh]" hideCloseButton={true}>
        <DialogHeader className="sr-only">
          <DialogTitle>ChatLearn Authentication</DialogTitle>
          <DialogDescription>
            {mode === 'reset' ? 'Reset your password' : 'Sign in or sign up to ChatLearn'}
          </DialogDescription>
        </DialogHeader>
        {authContent}
      </DialogContent>
    </Dialog>
  );
}
