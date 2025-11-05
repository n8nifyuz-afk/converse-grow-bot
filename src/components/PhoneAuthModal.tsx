import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { CountryPhoneInput } from '@/components/CountryPhoneInput';

interface PhoneAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PhoneAuthModal({
  isOpen,
  onClose,
  onSuccess
}: PhoneAuthModalProps) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'phone' | 'verify' | 'complete-profile'>('phone');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [profileStep, setProfileStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [showPhoneValidation, setShowPhoneValidation] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false); // Prevent modal close during verification

  const {
    user,
    signInWithPhone,
    verifyOtp,
    refreshUserProfile
  } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Close modal when user is authenticated (except during OTP verification or profile completion)
  useEffect(() => {
    console.log('[PHONE-AUTH-EFFECT] State check:', { 
      hasUser: !!user, 
      isOpen, 
      mode,
      isVerifyingOtp,
      shouldClose: user && isOpen && mode !== 'complete-profile' && !isVerifyingOtp
    });
    
    // Don't close during OTP verification or profile completion
    if (user && isOpen && mode !== 'complete-profile' && !isVerifyingOtp) {
      console.log('[PHONE-AUTH-EFFECT] 🚪 Closing modal - user authenticated and not in profile completion');
      onClose();
      onSuccess?.();
    }
  }, [user, isOpen, mode, isVerifyingOtp, onClose, onSuccess]);

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
      setPhone('');
      setOtp('');
      setFirstName('');
      setLastName('');
      setDateOfBirth('');
      setMode('phone');
      setProfileStep(1);
      setOtpTimer(0);
      setError('');
      setShowPhoneValidation(false);
      setIsVerifyingOtp(false); // Reset verification flag
    }
  }, [isOpen]);

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowPhoneValidation(true);
    
    if (!phone || phoneLoading) return; // Prevent multiple submissions
    
    setPhoneLoading(true);
    setError('');
    
    try {
      console.log('[PHONE-AUTH-MODAL] Sending OTP to:', phone);
      
      const { error } = await signInWithPhone(phone);
      
      if (error) {
        console.error('[PHONE-AUTH-MODAL] OTP send failed:', error);
        toast({
          title: "Failed to send code",
          description: error.message,
          variant: "destructive"
        });
        setPhoneLoading(false);
      } else {
        console.log('[PHONE-AUTH-MODAL] OTP sent successfully');
        setMode('verify');
        setOtpTimer(60);
        setShowPhoneValidation(false);
        setPhoneLoading(false);
        sonnerToast.success("Code sent!", {
          description: "Please check your phone for the verification code.",
          duration: 3000
        });
      }
    } catch (error: any) {
      console.error('[PHONE-AUTH-MODAL] Exception during OTP send:', error);
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
      setError("An error occurred");
      setPhoneLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !otp) return;
    
    setLoading(true);
    setError('');
    setIsVerifyingOtp(true); // CRITICAL: Prevent modal from closing during verification
    
    try {
      console.log('[PHONE-AUTH] 🔐 Verifying OTP...');
      
      const { error } = await verifyOtp(phone, otp);
      
      if (error) {
        console.error('[PHONE-AUTH] ❌ OTP verification failed:', error);
        setError("Invalid verification code. Please try again.");
        setMode('verify');
        setIsVerifyingOtp(false);
        return;
      }

      console.log('[PHONE-AUTH] ✅ OTP verified successfully');
      
      // Wait for auth state to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if profile is complete
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      console.log('[PHONE-AUTH] 📊 Current user metadata:', {
        has_first_name: !!currentUser?.user_metadata?.first_name,
        has_last_name: !!currentUser?.user_metadata?.last_name,
        has_date_of_birth: !!currentUser?.user_metadata?.date_of_birth,
        full_metadata: currentUser?.user_metadata
      });
      
      // If profile is already complete (returning user), close modal
      if (currentUser?.user_metadata?.first_name && currentUser?.user_metadata?.date_of_birth) {
        console.log('[PHONE-AUTH] ✅ Profile already complete - closing modal');
        setIsVerifyingOtp(false);
        await refreshUserProfile();
        onClose();
        onSuccess?.();
      } else {
        // New user - show profile form FIRST, BEFORE setting isVerifyingOtp to false
        console.log('[PHONE-AUTH] 📝 Profile incomplete - showing profile completion form');
        setMode('complete-profile');
        setProfileStep(1);
        // Keep isVerifyingOtp true until profile is complete to prevent parent modal from closing us
      }
    } catch (error) {
      console.error('[PHONE-AUTH] ❌ Verification error:', error);
      setError("An error occurred during verification.");
      setMode('verify');
      setIsVerifyingOtp(false);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!phone || otpTimer > 0) return;
    
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
        sonnerToast.success("Code resent!", {
          description: "Please check your phone for the new verification code.",
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

  const isDateValid = (date: string): boolean => {
    const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!dobRegex.test(date)) return false;
    
    const [day, month, year] = date.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    return age >= 13 && !(age === 13 && (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)));
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profileStep === 1 && firstName) {
      setProfileStep(2);
      setError('');
      return;
    }
    
    if (profileStep === 2 && lastName) {
      setProfileStep(3);
      setError('');
      return;
    }
    
    if (profileStep === 3 && dateOfBirth) {
      
      setLoading(true);
      setError('');
      
      try {
        const fullName = `${firstName} ${lastName}`.trim();
        
        // Update user metadata with profile information
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dateOfBirth,
            display_name: fullName
          }
        });
        
        if (updateError) {
          throw updateError;
        }
        
        // Convert DD/MM/YYYY to YYYY-MM-DD for database
        const [day, month, year] = dateOfBirth.split('/');
        const dbDateFormat = `${year}-${month}-${day}`;
        
        // Update profiles table directly to ensure immediate reflection
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            display_name: fullName,
            date_of_birth: dbDateFormat
          })
          .eq('user_id', user?.id);
        
        if (profileError) {
          console.error('Profile update error:', profileError);
        }
        
        // Refresh profile to get latest data
        await refreshUserProfile();
        
        // Send webhook for phone signup after profile completion
        try {
          // Fetch complete profile data for webhook
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user?.id)
            .single();
          
          await supabase.functions.invoke('send-subscriber-webhook', {
            body: {
              userId: user?.id,
              email: user?.email || phone,
              username: fullName,
              signupMethod: 'phone',
              phoneNumber: phone,
              country: profileData?.country || null,
              ipAddress: profileData?.ip_address || null,
              gclid: profileData?.gclid || null,
              urlParams: profileData?.url_params || {},
              initialReferer: profileData?.initial_referer || null
            }
          });
        } catch (webhookError) {
          console.error('Webhook error (non-critical):', webhookError);
        }
        
        setIsVerifyingOtp(false);
        onClose();
        onSuccess?.();
      } catch (error) {
        setError('Failed to save profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Drawer 
      open={isOpen} 
      onOpenChange={(open) => {
        // Prevent closing during profile completion
        if (!open && mode !== 'complete-profile') onClose();
      }}
      dismissible={mode !== 'complete-profile'}
      modal={true}
    >
      <DrawerContent className="h-auto p-0">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Phone Sign In</DrawerTitle>
          <DrawerDescription>Sign in with phone number</DrawerDescription>
        </DrawerHeader>
        
        <div className={`w-full px-4 md:px-6 ${mode === 'complete-profile' ? 'py-3 md:py-12' : 'py-8 md:py-12'}`}>
          {mode === 'phone' ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl md:text-3xl font-bold">Sign In with Phone</h2>
              </div>
              <form onSubmit={handlePhoneSignIn} className="space-y-3">
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
              </form>
            </>
          ) : mode === 'verify' ? (
            <>
              <div className="mb-6 text-center">
                <h2 className="text-2xl md:text-3xl font-bold">Verify Code</h2>
              </div>
              <form onSubmit={handleVerifyOtp} className="space-y-4">
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
              </form>
            </>
          ) : mode === 'complete-profile' ? (
            <>
              {/* Profile completion header removed per user request */}
              <form onSubmit={handleCompleteProfile} className="space-y-5 pb-safe">
                <div className="text-center mb-4">
                  <h3 className="text-xl md:text-2xl font-bold mb-2">
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
                        let input = e.target.value.replace(/[^\d/]/g, '');
                        if (input.length === 2 && !input.includes('/')) {
                          input = input + '/';
                        } else if (input.length === 5 && input.split('/').length === 2) {
                          input = input + '/';
                        }
                        if (input.length <= 10) {
                          setDateOfBirth(input);
                        }
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
                      variant="outline"
                      className="flex-1 h-12 md:h-13 text-base"
                    >
                      Back
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={loading || (profileStep === 3 && !isDateValid(dateOfBirth))}
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
              </form>
            </>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
