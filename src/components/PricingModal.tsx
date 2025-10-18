import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Crown, Sparkles, Zap, Mic, FileText, MessageSquare, Image as ImageIcon, Infinity, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';
import { useIsMobile } from '@/hooks/use-mobile';
import { UpgradeBlockedDialog } from '@/components/UpgradeBlockedDialog';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Feature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  ultra: boolean | string;
}

const allFeatures: Feature[] = [
  { name: 'All AI Models', free: false, pro: true, ultra: true },
  { name: 'Unlimited Chats', free: false, pro: true, ultra: true },
  { name: 'Voice Mode', free: false, pro: true, ultra: true },
  { name: 'File Uploads', free: false, pro: true, ultra: true },
  { name: 'Chat with Files', free: false, pro: true, ultra: true },
  { name: 'Image Generation (500/month)', free: false, pro: true, ultra: false },
  { name: 'Image Generation (2,000/month)', free: false, pro: false, ultra: true },
  { name: 'Priority Support', free: false, pro: true, ultra: false },
  { name: 'Team Collaboration', free: false, pro: false, ultra: true },
  { name: 'Early Access to Models', free: false, pro: false, ultra: true },
];

const pricingOptions = {
  pro: {
    daily: { price: 0.60, perDay: 0.60, period: 'day' },
    monthly: { price: 19.99, perDay: 0.67 },
    yearly: { price: 15.99, perDay: 0.53, savings: 20 }
  },
  ultra: {
    monthly: { price: 39.99, perDay: 1.33 },
    yearly: { price: 31.99, perDay: 1.07, savings: 20 }
  }
};

const priceIds = {
  pro: {
    daily: 'price_1SJE8mL8Zm4LqDn4Qseyrms6',
    monthly: 'price_1SH1g3L8Zm4LqDn4WSyw1BzA',
    yearly: 'price_1SITBGL8Zm4LqDn4fd4JLVDA'
  },
  ultra: {
    monthly: 'price_1SH1gHL8Zm4LqDn4wDQIGntf',
    yearly: 'price_1SH1MjL8Zm4LqDn40swOy4Ar'
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { user, subscriptionStatus } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeBlockedDialog, setShowUpgradeBlockedDialog] = useState(false);
  const [blockedPlanName, setBlockedPlanName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TFjbArlYa9GMQr': 'Pro',        // Pro Daily
    'prod_TDSbUWLqR3bz7k': 'Pro',        // Pro Monthly
    'prod_TEx5Xda5BPBuHv': 'Pro',        // Pro Yearly
    'prod_TDSbGJB9U4Xt7b': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TDSHzExQNjyvJD': 'Ultra Pro',  // Ultra Pro Yearly
  };

  console.log('[PRICING-MODAL] Render state:', {
    open,
    hasUser: !!user,
    selectedPlan,
    selectedPeriod,
    isMobile,
    componentType: isMobile ? 'Drawer' : 'Dialog'
  });

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    // Check if user already has an active subscription
    if (subscriptionStatus.subscribed && subscriptionStatus.product_id) {
      const currentPlanName = productToPlanMap[subscriptionStatus.product_id] || 'Unknown';
      setBlockedPlanName(currentPlanName);
      setShowUpgradeBlockedDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      const priceId = priceIds[selectedPlan][selectedPeriod];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) {
        // Check if error is about active subscription
        const errorMessage = error.message || '';
        if (errorMessage.includes('active subscription')) {
          toast.dismiss();
          const currentPlanName = productToPlanMap[subscriptionStatus.product_id || ''] || 'Unknown';
          setBlockedPlanName(currentPlanName);
          setShowUpgradeBlockedDialog(true);
          return;
        }
        throw error;
      }

      if (data?.url) {
        // Redirect to Stripe checkout in the same window
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      const errorMessage = error?.message || 'Failed to start subscription process';
      
      if (errorMessage.includes('active subscription')) {
        toast.error('You already have an active subscription', {
          description: 'Please cancel your current plan first'
        });
      } else if (errorMessage.includes('authentication')) {
        toast.error('Please sign in to continue');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const currentPrice = pricingOptions[selectedPlan][selectedPeriod];
  const savings = selectedPeriod === 'yearly' ? pricingOptions[selectedPlan].yearly.savings : 0;

  const modalContent = (
    <div className="flex flex-col md:flex-row h-full">
            {/* Left Panel - Features Comparison */}
            <div className="w-full md:w-7/12 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-3 sm:p-4 md:p-4 lg:p-8 border-r border-zinc-700 dark:border-zinc-800 flex flex-col relative">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>
              
              {/* Comparison Table */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 pb-2 sm:pb-3 md:pb-4 border-b border-zinc-700/50 mb-1 sm:mb-2 flex-shrink-0">
                  <div className="text-xs sm:text-sm md:text-base font-bold text-zinc-400">Feature</div>
                  <div className="text-xs sm:text-sm md:text-base font-bold text-center text-zinc-400">Free</div>
                  <div className="text-xs sm:text-sm md:text-base font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {selectedPlan === 'pro' ? '⭐ Pro' : '👑 Ultra'}
                  </div>
                </div>
                
                {/* Feature Rows */}
                <div className="flex-1 space-y-0">
                  {allFeatures
                    .filter((feature) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      return selectedValue !== false;
                    })
                    .map((feature, index) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      
                      return (
                        <div key={index} className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4 py-1 sm:py-1.5 md:py-2 px-1.5 sm:px-2 md:px-3 rounded-lg md:hover:bg-white/5 md:transition-all md:duration-200 backdrop-blur-sm border border-transparent md:hover:border-zinc-700/50">
                          <div className="text-xs sm:text-sm md:text-base font-medium text-white flex items-center leading-tight">
                            {feature.name}
                          </div>
                          <div className="flex justify-center items-center">
                            {feature.free === false ? (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-600" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-center items-center">
                            {selectedValue === false ? (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-600" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-blue-400/30">
                                <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-5/12 p-3 sm:p-4 md:p-4 lg:p-8 flex flex-col bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/30">
              <div className="mb-3 sm:mb-4 md:mb-4 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-4xl font-bold mb-1.5 sm:mb-2 md:mb-2 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent leading-tight">
                  Choose Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm md:text-sm">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-3 sm:mb-4 md:mb-3 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10 md:h-12 bg-zinc-100 dark:bg-zinc-900 p-1 sm:p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg sm:rounded-xl">
                  <TabsTrigger 
                    value="pro" 
                    className="text-xs sm:text-sm font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all"
                  >
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Pro
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-xs sm:text-sm font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all"
                  >
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Ultra Pro
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 md:mb-3 flex-1 min-h-0">
                {selectedPlan === 'pro' && (
                  <button
                    onClick={() => setSelectedPeriod('daily')}
                    className={`w-full p-3 sm:p-4 md:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 text-left group relative overflow-hidden ${
                      selectedPeriod === 'daily'
                        ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg bg-white dark:bg-zinc-950'
                    }`}
                  >
                    {selectedPeriod === 'daily' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                    )}
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-zinc-900 dark:text-white">Daily</div>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                          Billed daily • Most flexible
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl sm:text-2xl md:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].daily.price}</div>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1">per day</div>
                      </div>
                    </div>
                  </button>
                )}
                
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-3 sm:p-4 md:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 text-left group relative overflow-hidden ${
                    selectedPeriod === 'monthly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  {selectedPeriod === 'monthly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-zinc-900 dark:text-white">Monthly</div>
                      <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Billed monthly • Flexible
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-xl sm:text-2xl md:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].monthly.price}</div>
                      <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1">per month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-3 sm:p-4 md:p-4 rounded-lg sm:rounded-xl border transition-all duration-300 text-left relative group overflow-hidden ${
                    selectedPeriod === 'yearly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-1.5 sm:-top-2 right-2 sm:right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold border-0">
                    Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  {selectedPeriod === 'yearly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-zinc-900 dark:text-white">Yearly</div>
                      <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                        Billed annually • Best value
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm sm:text-base md:text-lg text-zinc-400 dark:text-zinc-600 line-through mb-0.5">€{pricingOptions[selectedPlan].monthly.price}</div>
                      <div className="font-bold text-xl sm:text-2xl md:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].yearly.price}</div>
                      <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1">per month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-10 sm:h-12 md:h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm md:text-base shadow-2xl hover:shadow-blue-500/50 transition-all rounded-lg sm:rounded-xl border-0 flex-shrink-0 hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'} Plan</span>
                    <span className="sm:hidden">Subscribe</span>
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-3 sm:mt-4 md:mt-3 space-y-2 sm:space-y-3 flex-shrink-0">
                {/* Payment Cards */}
                <div className="flex items-center justify-center gap-2 sm:gap-3 py-1 sm:py-2">
                  {/* Visa */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 750 471" fill="none">
                      <rect fill="#0E4595" x="0" y="0" width="750" height="471" rx="40" />
                      <polygon fill="#FFFFFF" points="278.1975 334.2275 311.5585 138.4655 364.9175 138.4655 331.5335 334.2275" />
                      <path d="M524.3075,142.6875 C513.7355,138.7215 497.1715,134.4655 476.4845,134.4655 C423.7605,134.4655 386.6205,161.0165 386.3045,199.0695 C386.0075,227.1985 412.8185,242.8905 433.0585,252.2545 C453.8275,261.8495 460.8105,267.9695 460.7115,276.5375 C460.5795,289.6595 444.1255,295.6545 428.7885,295.6545 C407.4315,295.6545 396.0855,292.6875 378.5625,285.3785 L371.6865,282.2665 L364.1975,326.0905 C376.6605,331.5545 399.7065,336.2895 423.6355,336.5345 C479.7245,336.5345 516.1365,310.2875 516.5505,269.6525 C516.7515,247.3835 502.5355,230.4355 471.7515,216.4645 C453.1005,207.4085 441.6785,201.3655 441.7995,192.1955 C441.7995,184.0585 451.4675,175.3575 472.3565,175.3575 C489.8055,175.0865 502.4445,178.8915 512.2925,182.8575 L517.0745,185.1165 L524.3075,142.6875" fill="#FFFFFF" />
                      <path d="M661.6145,138.4655 L620.3835,138.4655 C607.6105,138.4655 598.0525,141.9515 592.4425,154.6995 L513.1975,334.1025 L569.2285,334.1025 C569.2285,334.1025 578.3905,309.9805 580.4625,304.6845 C586.5855,304.6845 641.0165,304.7685 648.7985,304.7685 C650.3945,311.6215 655.2905,334.1025 655.2905,334.1025 L704.8025,334.1025 L661.6145,138.4655 Z M596.1975,264.8725 C600.6105,253.5935 617.4565,210.1495 617.4565,210.1495 C617.1415,210.6705 621.8365,198.8155 624.5315,191.4655 L628.1385,208.3435 C628.1385,208.3435 638.3555,255.0725 640.4905,264.8715 L596.1975,264.8715 L596.1975,264.8725 Z" fill="#FFFFFF" />
                      <path d="M 45.878906 138.46484 L 45.197266 142.53906 C 66.288263 147.64458 85.126465 155.03257 101.61914 164.22461 L 148.96484 333.91602 L 205.41992 333.84961 L 289.42383 138.46484 L 232.90234 138.46484 L 180.66211 271.96094 L 175.0957 244.83203 C 174.83824 244.00408 174.55942 243.17304 174.27344 242.3418 L 156.10742 154.99219 C 152.87742 142.59619 143.50892 138.89684 131.91992 138.46484 L 45.878906 138.46484 z " fill="#ffffff" />
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -11 70 70" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3945 34.7619C33.0114 36.8184 29.92 38.0599 26.5421 38.0599C19.0047 38.0599 12.8945 31.8788 12.8945 24.254C12.8945 16.6291 19.0047 10.448 26.5421 10.448C29.92 10.448 33.0114 11.6895 35.3945 13.7461C37.7777 11.6895 40.869 10.448 44.247 10.448C51.7843 10.448 57.8945 16.6291 57.8945 24.254C57.8945 31.8788 51.7843 38.0599 44.247 38.0599C40.869 38.0599 37.7777 36.8184 35.3945 34.7619Z" fill="#ED0006"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3945 34.7619C38.3289 32.2296 40.1896 28.4616 40.1896 24.254C40.1896 20.0463 38.3289 16.2783 35.3945 13.7461C37.7777 11.6895 40.869 10.448 44.247 10.448C51.7843 10.448 57.8945 16.6291 57.8945 24.254C57.8945 31.8788 51.7843 38.0599 44.247 38.0599C40.869 38.0599 37.7777 36.8184 35.3945 34.7619Z" fill="#F9A000"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3946 13.7461C38.329 16.2784 40.1897 20.0463 40.1897 24.254C40.1897 28.4616 38.329 32.2295 35.3946 34.7618C32.4603 32.2295 30.5996 28.4616 30.5996 24.254C30.5996 20.0463 32.4603 16.2784 35.3946 13.7461Z" fill="#FF5E00"/>
                    </svg>
                  </div>
                  {/* Apple Pay */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -9 58 58" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.5771 14.9265C17.1553 15.4313 16.4803 15.8294 15.8053 15.7725C15.7209 15.09 16.0513 14.3649 16.4381 13.9171C16.8599 13.3981 17.5982 13.0284 18.1959 13C18.2662 13.7109 17.992 14.4076 17.5771 14.9265ZM18.1888 15.9076C17.5942 15.873 17.0516 16.0884 16.6133 16.2624C16.3313 16.3744 16.0924 16.4692 15.9107 16.4692C15.7068 16.4692 15.4581 16.3693 15.1789 16.2571C14.813 16.1102 14.3947 15.9422 13.956 15.9502C12.9506 15.9645 12.0154 16.5403 11.5021 17.4573C10.4474 19.2915 11.2279 22.0071 12.2474 23.5C12.7467 24.2393 13.3443 25.0498 14.1318 25.0213C14.4783 25.0081 14.7275 24.9012 14.9854 24.7905C15.2823 24.6631 15.5908 24.5308 16.0724 24.5308C16.5374 24.5308 16.8324 24.6597 17.1155 24.7834C17.3847 24.9011 17.6433 25.014 18.0271 25.0071C18.8428 24.9929 19.356 24.2678 19.8553 23.5284C20.394 22.7349 20.6307 21.9605 20.6667 21.843L20.6709 21.8294C20.67 21.8285 20.6634 21.8254 20.6516 21.82C20.4715 21.7366 19.095 21.0995 19.0818 19.391C19.0686 17.957 20.1736 17.2304 20.3476 17.116C20.3582 17.109 20.3653 17.1043 20.3685 17.1019C19.6654 16.0498 18.5685 15.936 18.1888 15.9076ZM23.8349 24.9289V13.846H27.9482C30.0717 13.846 31.5553 15.3246 31.5553 17.4858C31.5553 19.6469 30.0435 21.1398 27.892 21.1398H25.5365V24.9289H23.8349ZM25.5365 15.2962V19.6967H27.4912C28.9748 19.6967 29.8185 18.8934 29.8185 17.4929C29.8185 16.0924 28.9748 15.2962 27.4982 15.2962H25.5365ZM37.1732 23.5995C36.7232 24.4668 35.7318 25.0142 34.6631 25.0142C33.081 25.0142 31.9771 24.0616 31.9771 22.6256C31.9771 21.2038 33.0459 20.3863 35.0217 20.2654L37.1451 20.1374V19.5261C37.1451 18.6232 36.5615 18.1327 35.5209 18.1327C34.6631 18.1327 34.0373 18.5806 33.9107 19.263H32.3779C32.4271 17.827 33.7631 16.782 35.5701 16.782C37.5177 16.782 38.7834 17.8128 38.7834 19.4123V24.9289H37.2084V23.5995H37.1732ZM35.1201 23.6991C34.2131 23.6991 33.6365 23.2583 33.6365 22.5829C33.6365 21.8863 34.192 21.481 35.2537 21.4171L37.1451 21.2962V21.9218C37.1451 22.9597 36.2732 23.6991 35.1201 23.6991ZM44.0076 25.3626C43.3256 27.3033 42.5451 27.9431 40.8857 27.9431C40.7592 27.9431 40.3373 27.9289 40.2388 27.9005V26.5711C40.3443 26.5853 40.6045 26.5995 40.7381 26.5995C41.4904 26.5995 41.9123 26.2796 42.1724 25.4479L42.3271 24.9573L39.4443 16.8886H41.2232L43.2271 23.436H43.2623L45.2662 16.8886H46.9959L44.0076 25.3626Z" fill="#000000"/>
                    </svg>
                  </div>
                  {/* Amazon Pay */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -9 58 58" fill="none">
...
                      <path fillRule="evenodd" clipRule="evenodd" d="M23.732 24.7828C23.9529 24.2227 24.4444 22.9675 24.2107 22.6633H24.2124C23.9797 22.3585 22.6735 22.5185 22.086 22.5904L22.0847 22.5906C21.906 22.6125 21.8785 22.4539 22.0392 22.339C23.0824 21.5914 24.7916 21.8052 24.9901 22.0577C25.1886 22.3101 24.936 24.0579 23.9589 24.8923C23.8085 25.0203 23.665 24.9519 23.732 24.7828ZM16.7121 25.647C18.9842 25.647 21.6301 24.9151 23.4528 23.5434V23.546C23.7544 23.3146 23.4957 22.9745 23.1881 23.1077C21.1986 23.9637 19.063 24.4105 16.9038 24.4225C13.9081 24.4225 11.0105 23.5846 8.66619 22.1935C8.46081 22.0717 8.30784 22.2864 8.47971 22.4433C10.7366 24.5203 13.6725 25.6628 16.7121 25.647Z" fill="#FF9900"/>
                    </svg>
                  </div>
                </div>

                <p className="text-[10px] sm:text-xs text-center text-zinc-500 dark:text-zinc-500 leading-relaxed px-2 sm:px-0">
                  By subscribing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>,{' '}
                  <a href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy Policy</a>, and{' '}
                  <a href="/refund-policy" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Refund Policy</a>
                </p>
              </div>
            </div>
          </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="max-h-[95vh] bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 border-t border-zinc-300 dark:border-zinc-700">
            <div className="overflow-y-auto max-h-[95vh]">
              {modalContent}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-[85vw] md:max-w-2xl lg:max-w-4xl xl:max-w-5xl w-full h-[90vh] sm:h-[80vh] md:h-[75vh] lg:h-[85vh] p-0 bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 border border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col shadow-2xl [&>button]:hidden md:[&>button]:flex">
            {modalContent}
          </DialogContent>
        </Dialog>
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      <UpgradeBlockedDialog 
        isOpen={showUpgradeBlockedDialog}
        onClose={() => setShowUpgradeBlockedDialog(false)}
        currentPlan={blockedPlanName}
      />
    </>
  );
};
