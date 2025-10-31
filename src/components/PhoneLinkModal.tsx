import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Phone, Check } from 'lucide-react';
import { CountryPhoneInput } from './CountryPhoneInput';

interface PhoneLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PhoneLinkModal({ open, onOpenChange }: PhoneLinkModalProps) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { linkPhoneNumber, verifyPhoneLink } = useAuth();
  const { toast } = useToast();

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: 'Invalid Phone',
        description: 'Please enter a valid phone number',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await linkPhoneNumber(phone);
      
      if (error) {
        throw error;
      }

      toast({
        title: 'OTP Sent',
        description: 'Check your phone for the verification code',
      });
      setStep('verify');
    } catch (error: any) {
      console.error('Send OTP error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter the 6-digit code',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await verifyPhoneLink(phone, otp);
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Phone Linked!',
        description: 'Your phone number has been successfully linked',
      });
      
      // Reset and close
      setStep('phone');
      setPhone('');
      setOtp('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Verify OTP error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Invalid verification code',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Link Phone Number
          </DialogTitle>
          <DialogDescription>
            {step === 'phone' 
              ? 'Add a phone number to your account for alternative sign-in' 
              : 'Enter the 6-digit code sent to your phone'}
          </DialogDescription>
        </DialogHeader>

        {step === 'phone' ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <CountryPhoneInput
                value={phone}
                onChange={setPhone}
              />
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                💡 After linking, you can sign in with either your current method or this phone number
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendOTP}
                disabled={loading || !phone}
                className="flex-1"
              >
                {loading ? 'Sending...' : 'Send Code'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-muted-foreground text-center">
                Code sent to {phone}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep('phone')}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="flex-1"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full"
            >
              Resend Code
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
