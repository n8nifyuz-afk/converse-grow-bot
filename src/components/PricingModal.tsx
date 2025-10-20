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
    monthly: { price: 19.99, perDay: 0.67 },
    '3month': { price: 39.99, perDay: 0.44 },
    yearly: { price: 59.99, perDay: 0.16, savings: 75 }
  },
  ultra: {
    monthly: { price: 39.99, perDay: 1.33 },
    '3month': { price: 79.99, perDay: 0.89 },
    yearly: { price: 119.99, perDay: 0.33, savings: 75 }
  }
};

const priceIds = {
  pro: {
    monthly: 'price_1SKKdNL8Zm4LqDn4gBXwrsAq',
    '3month': 'price_1SKJ76L8Zm4LqDn4lboudMxL',
    yearly: 'price_1SKJ8cL8Zm4LqDn4jPkxLxeF'
  },
  ultra: {
    monthly: 'price_1SKJAxL8Zm4LqDn43kl9BRd8',
    '3month': 'price_1SKJD6L8Zm4LqDn4l1KXsNw1',
    yearly: 'price_1SKJEwL8Zm4LqDn4qcEFPlgP'
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { user, subscriptionStatus } = useAuth();
  const isMobile = useIsMobile();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | '3month' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeBlockedDialog, setShowUpgradeBlockedDialog] = useState(false);
  const [blockedPlanName, setBlockedPlanName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TGsOnuDkIh9hVG': 'Pro',        // Pro Monthly
    'prod_TGqo8h59qNKZ4m': 'Pro',        // Pro 3-Month
    'prod_TGqqoPGWQJ0T4a': 'Pro',        // Pro Yearly
    'prod_TGqs5r2udThT0t': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TGquGexHO44m4T': 'Ultra Pro',  // Ultra Pro 3-Month
    'prod_TGqwVIWObYLt6U': 'Ultra Pro',  // Ultra Pro Yearly
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
  const savings = selectedPeriod === 'yearly' && 'savings' in pricingOptions[selectedPlan][selectedPeriod]
    ? pricingOptions[selectedPlan][selectedPeriod].savings 
    : 0;

  const modalContent = (
    <div className="flex flex-col md:flex-row h-full">
            {/* Mobile/Tablet Close Button */}
            {isMobile && (
              <button
                onClick={() => onOpenChange(false)}
                className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
            
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
              <div className="space-y-3 mb-4 flex-1 min-h-0">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 text-left group relative overflow-hidden ${
                    selectedPeriod === 'monthly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  {selectedPeriod === 'monthly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex-1">
                      <div className="font-bold text-base sm:text-lg mb-1 text-zinc-900 dark:text-white">Monthly</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        €{pricingOptions[selectedPlan].monthly.price}/month
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].monthly.perDay}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">per day</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('3month')}
                  className={`w-full p-4 sm:p-5 rounded-xl border-2 transition-all duration-300 text-left relative group overflow-hidden ${
                    selectedPeriod === '3month'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  {selectedPeriod === '3month' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex-1">
                      <div className="font-bold text-base sm:text-lg mb-1 text-zinc-900 dark:text-white">3 Months</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        €{pricingOptions[selectedPlan]['3month'].price} total
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan]['3month'].perDay}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">per day</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-4 sm:p-5 pt-6 sm:pt-7 rounded-xl border-2 transition-all duration-300 text-left relative group overflow-visible ${
                    selectedPeriod === 'yearly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-xl scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-2.5 right-3 sm:right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg px-3 py-1 text-xs font-bold border-0 whitespace-nowrap">
                    Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  {selectedPeriod === 'yearly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex-1">
                      <div className="font-bold text-base sm:text-lg mb-1 text-zinc-900 dark:text-white">Yearly</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400">
                        €{pricingOptions[selectedPlan].yearly.price} total
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-2xl sm:text-3xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].yearly.perDay}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">per day</div>
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
                  <div className="w-12 h-8 sm:w-14 sm:h-10 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -11 70 70" fill="none">
                      <rect x="0.5" y="0.5" width="69" height="47" rx="5.5" fill="white" stroke="#D9D9D9"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3945 34.7619C33.0114 36.8184 29.92 38.0599 26.5421 38.0599C19.0047 38.0599 12.8945 31.8788 12.8945 24.254C12.8945 16.6291 19.0047 10.448 26.5421 10.448C29.92 10.448 33.0114 11.6895 35.3945 13.7461C37.7777 11.6895 40.869 10.448 44.247 10.448C51.7843 10.448 57.8945 16.6291 57.8945 24.254C57.8945 31.8788 51.7843 38.0599 44.247 38.0599C40.869 38.0599 37.7777 36.8184 35.3945 34.7619Z" fill="#ED0006"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3945 34.7619C38.3289 32.2296 40.1896 28.4616 40.1896 24.254C40.1896 20.0463 38.3289 16.2783 35.3945 13.7461C37.7777 11.6895 40.869 10.448 44.247 10.448C51.7843 10.448 57.8945 16.6291 57.8945 24.254C57.8945 31.8788 51.7843 38.0599 44.247 38.0599C40.869 38.0599 37.7777 36.8184 35.3945 34.7619Z" fill="#F9A000"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3946 13.7461C38.329 16.2784 40.1897 20.0463 40.1897 24.254C40.1897 28.4616 38.329 32.2295 35.3946 34.7618C32.4603 32.2295 30.5996 28.4616 30.5996 24.254C30.5996 20.0463 32.4603 16.2784 35.3946 13.7461Z" fill="#FF5E00"/>
                    </svg>
                  </div>
                  {/* Apple Pay */}
                  <div className="w-12 h-8 sm:w-14 sm:h-10 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -9 58 58" fill="none">
                      <rect x="0.5" y="0.5" width="57" height="39" rx="3.5" fill="white" stroke="#F3F3F3"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.5771 14.9265C17.1553 15.4313 16.4803 15.8294 15.8053 15.7725C15.7209 15.09 16.0513 14.3649 16.4381 13.9171C16.8599 13.3981 17.5982 13.0284 18.1959 13C18.2662 13.7109 17.992 14.4076 17.5771 14.9265ZM18.1888 15.9076C17.5942 15.873 17.0516 16.0884 16.6133 16.2624C16.3313 16.3744 16.0924 16.4692 15.9107 16.4692C15.7068 16.4692 15.4581 16.3693 15.1789 16.2571C14.813 16.1102 14.3947 15.9422 13.956 15.9502C12.9506 15.9645 12.0154 16.5403 11.5021 17.4573C10.4474 19.2915 11.2279 22.0071 12.2474 23.5C12.7467 24.2393 13.3443 25.0498 14.1318 25.0213C14.4783 25.0081 14.7275 24.9012 14.9854 24.7905C15.2823 24.6631 15.5908 24.5308 16.0724 24.5308C16.5374 24.5308 16.8324 24.6597 17.1155 24.7834C17.3847 24.9011 17.6433 25.014 18.0271 25.0071C18.8428 24.9929 19.356 24.2678 19.8553 23.5284C20.394 22.7349 20.6307 21.9605 20.6667 21.843L20.6709 21.8294C20.67 21.8285 20.6634 21.8254 20.6516 21.82C20.4715 21.7366 19.095 21.0995 19.0818 19.391C19.0686 17.957 20.1736 17.2304 20.3476 17.116C20.3582 17.109 20.3653 17.1043 20.3685 17.1019C19.6654 16.0498 18.5685 15.936 18.1888 15.9076ZM23.8349 24.9289V13.846H27.9482C30.0717 13.846 31.5553 15.3246 31.5553 17.4858C31.5553 19.6469 30.0435 21.1398 27.892 21.1398H25.5365V24.9289H23.8349ZM25.5365 15.2962V19.6967H27.4912C28.9748 19.6967 29.8185 18.8934 29.8185 17.4929C29.8185 16.0924 28.9748 15.2962 27.4982 15.2962H25.5365ZM37.1732 23.5995C36.7232 24.4668 35.7318 25.0142 34.6631 25.0142C33.081 25.0142 31.9771 24.0616 31.9771 22.6256C31.9771 21.2038 33.0459 20.3863 35.0217 20.2654L37.1451 20.1374V19.5261C37.1451 18.6232 36.5615 18.1327 35.5209 18.1327C34.6631 18.1327 34.0373 18.5806 33.9107 19.263H32.3779C32.4271 17.827 33.7631 16.782 35.5701 16.782C37.5177 16.782 38.7834 17.8128 38.7834 19.4123V24.9289H37.2084V23.5995H37.1732ZM35.1201 23.6991C34.2131 23.6991 33.6365 23.2583 33.6365 22.5829C33.6365 21.8863 34.192 21.481 35.2537 21.4171L37.1451 21.2962V21.9218C37.1451 22.9597 36.2732 23.6991 35.1201 23.6991ZM44.0076 25.3626C43.3256 27.3033 42.5451 27.9431 40.8857 27.9431C40.7592 27.9431 40.3373 27.9289 40.2388 27.9005V26.5711C40.3443 26.5853 40.6045 26.5995 40.7381 26.5995C41.4904 26.5995 41.9123 26.2796 42.1724 25.4479L42.3271 24.9573L39.4443 16.8886H41.2232L43.2271 23.436H43.2623L45.2662 16.8886H46.9959L44.0076 25.3626Z" fill="#000000"/>
                    </svg>
                  </div>
                  {/* Amazon Pay */}
                  <div className="w-12 h-8 sm:w-14 sm:h-10 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -9 58 58" fill="none">
                      <rect x="0.5" y="0.5" width="57" height="39" rx="3.5" fill="white" stroke="#F3F3F3"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M32.5368 21.5397H31.5692C31.4737 21.5345 31.3985 21.4548 31.3973 21.3573V16.2735C31.4076 16.1769 31.4886 16.1045 31.5838 16.1069H32.4844C32.5664 16.1096 32.6366 16.1677 32.6562 16.2489V17.0264H32.6751C32.9467 16.3313 33.3274 16 33.9977 16C34.4325 16 34.857 16.1604 35.1311 16.5987C35.3846 17.0054 35.3846 17.6899 35.3846 18.1817V21.3801C35.3704 21.4734 35.2907 21.5416 35.1982 21.5397H34.222C34.1344 21.5358 34.062 21.4686 34.0501 21.3801V18.6199C34.0501 18.5767 34.0505 18.5319 34.0509 18.4861C34.0555 17.9426 34.0615 17.2508 33.4425 17.2508C33.1933 17.2625 32.9737 17.4215 32.8805 17.6575C32.7448 17.9678 32.7267 18.2781 32.7267 18.6217V21.3573C32.723 21.4605 32.6389 21.5416 32.5377 21.5397H32.5368ZM28.4378 16.007C29.8789 16.007 30.6583 17.2692 30.6583 18.8732C30.6583 20.4238 29.799 21.6536 28.4378 21.6536C27.0242 21.6536 26.2542 20.3914 26.2542 18.8198C26.2542 17.2482 27.0336 16.007 28.4378 16.007ZM28.4472 17.0448C27.7314 17.0448 27.6858 18.0388 27.6858 18.6594L27.6858 18.6799C27.6857 19.3087 27.6856 20.6052 28.4378 20.6052C29.1983 20.6052 29.2266 19.5359 29.2266 18.8838C29.2266 18.456 29.2086 17.9424 29.0814 17.5365C28.9723 17.1859 28.7549 17.0448 28.4472 17.0448ZM10.4983 21.5502H9.5281C9.4381 21.5454 9.36504 21.4742 9.35624 21.3827V16.2989C9.3595 16.197 9.44193 16.1164 9.54185 16.1175H10.4467C10.5394 16.1227 10.6135 16.1982 10.6186 16.2928V16.9563H10.6366C10.8721 16.3138 11.3164 16.0149 11.9145 16.0149C12.5126 16.0149 12.9019 16.3138 13.1743 16.9563C13.3561 16.4618 13.7853 16.1059 14.2969 16.025C14.8085 15.9442 15.3231 16.1511 15.6431 16.5662C15.9071 16.9322 15.8986 17.442 15.8907 17.9208V17.9209C15.8894 18.0016 15.888 18.0816 15.888 18.1597V21.3669C15.8871 21.4166 15.8669 21.4639 15.8317 21.4983C15.7965 21.5326 15.7494 21.5513 15.7007 21.5502H14.7305C14.6351 21.5451 14.5599 21.4653 14.5586 21.3678V18.6734C14.5586 18.6326 14.5593 18.58 14.5601 18.5203V18.5203C14.5632 18.2674 14.568 17.886 14.5312 17.7215C14.459 17.3796 14.2416 17.2832 13.9606 17.2832C13.703 17.2913 13.4749 17.455 13.3805 17.6996C13.2879 17.9388 13.2887 18.324 13.2893 18.6094L13.2894 18.6734V21.3669C13.2885 21.4165 13.2684 21.4636 13.2334 21.4979C13.1984 21.5323 13.1515 21.5511 13.1029 21.5502H12.1302C12.0349 21.5446 11.9599 21.4651 11.9583 21.3678V18.6734C11.9583 18.6182 11.9591 18.5605 11.96 18.5012V18.5012V18.5012V18.5012V18.5012V18.5012V18.5011V18.5011C11.9677 17.9515 11.9773 17.271 11.3568 17.271C10.6855 17.271 10.6861 18.0456 10.6865 18.6312L10.6865 18.6734V21.3669C10.6856 21.4166 10.6653 21.4639 10.6301 21.4983C10.595 21.5326 10.5478 21.5513 10.4992 21.5502H10.4983ZM7.61007 21.6124C7.68377 21.6547 7.77561 21.6452 7.83951 21.5887L7.84724 21.5905C8.04059 21.4143 8.39292 21.1022 8.59143 20.9331C8.66705 20.8673 8.6533 20.7578 8.59143 20.6701C8.57255 20.6436 8.55355 20.6176 8.53467 20.5918L8.53463 20.5917C8.37553 20.3742 8.22449 20.1676 8.22449 19.7524V18.2106C8.22449 18.1611 8.22474 18.112 8.22498 18.0631V18.063V18.0629V18.0628V18.0626V18.0625V18.0624V18.0623V18.0621C8.22792 17.4667 8.23062 16.9219 7.79482 16.5058C7.42359 16.1411 6.80659 16.0131 6.33395 16.0131C5.41017 16.0131 4.37897 16.3646 4.16327 17.5287C4.15433 17.5758 4.16471 17.6246 4.19199 17.6636C4.21927 17.7027 4.26107 17.7287 4.30764 17.7355L5.24088 17.8398C5.33202 17.8257 5.40251 17.7509 5.41275 17.6575C5.49352 17.2569 5.82351 17.0632 6.19388 17.0632C6.39497 17.0632 6.62011 17.1377 6.7387 17.32C6.86041 17.5031 6.85852 17.746 6.85682 17.9643C6.85662 17.9895 6.85643 18.0144 6.85643 18.0388V18.1668C6.76818 18.1769 6.67569 18.1866 6.58042 18.1965C6.06804 18.2498 5.47538 18.3115 5.0312 18.5104C4.42967 18.7786 4 19.3246 4 20.1284C4 21.1575 4.63591 21.672 5.45314 21.672C6.14318 21.672 6.52043 21.5063 7.05408 20.9523C7.0798 20.9906 7.10301 21.0259 7.12491 21.0592L7.12492 21.0592C7.25222 21.2529 7.33511 21.379 7.61007 21.6124ZM6.86076 19.2228L6.86073 19.1748V18.9618C6.15865 18.9618 5.41704 19.1152 5.41704 19.9584C5.41704 20.3879 5.63446 20.6771 6.00655 20.6771C6.27982 20.6771 6.52473 20.5053 6.67941 20.2266C6.86139 19.8965 6.8611 19.5873 6.86076 19.2228ZM21.3147 20.6666C21.2958 20.64 21.2768 20.614 21.2579 20.5881C21.0988 20.3706 20.9478 20.1641 20.9478 19.7498V18.2071C20.9478 18.1544 20.9481 18.102 20.9484 18.05L20.9484 18.0492C20.9518 17.4569 20.9548 16.9163 20.5181 16.5022C20.146 16.1376 19.529 16.0096 19.0573 16.0096C18.1335 16.0096 17.1023 16.3603 16.8857 17.5251C16.8765 17.5725 16.8869 17.6217 16.9144 17.661C16.9419 17.7003 16.984 17.7263 17.031 17.7329L17.9719 17.8363C18.0629 17.8219 18.1333 17.7473 18.1438 17.654C18.2254 17.2534 18.5537 17.0597 18.9241 17.0597C19.1243 17.0597 19.3537 17.1351 19.4689 17.3174C19.5914 17.4998 19.5896 17.7428 19.5879 17.9611C19.5877 17.9862 19.5875 18.011 19.5875 18.0353V18.1606C19.501 18.1705 19.4105 18.1798 19.3173 18.1894C18.8034 18.2424 18.2074 18.3038 17.7622 18.5033C17.1538 18.7716 16.7268 19.3176 16.7268 20.1223C16.7268 21.1504 17.3627 21.665 18.1799 21.665C18.8674 21.665 19.2472 21.4993 19.78 20.9453C19.8052 20.9828 19.828 21.0174 19.8494 21.05L19.8495 21.0501L19.8497 21.0504L19.8498 21.0505C19.9789 21.2467 20.0607 21.371 20.3368 21.6054C20.4105 21.6474 20.502 21.6383 20.5663 21.5826C20.7596 21.4073 21.1119 21.0943 21.3104 20.9252C21.3938 20.8647 21.38 20.7578 21.3147 20.6666ZM19.407 20.2222C19.2532 20.5001 19.0074 20.6719 18.735 20.6719C18.3629 20.6719 18.1455 20.3826 18.1455 19.954C18.1455 19.1099 18.8871 18.9574 19.5892 18.9574V19.1713L19.5892 19.2106C19.5894 19.5797 19.5896 19.8903 19.407 20.2222ZM22.1363 17.0054V16.2814C22.134 16.2318 22.1524 16.1836 22.187 16.1487C22.2216 16.1137 22.269 16.0954 22.3176 16.0982H25.5083C25.5568 16.0965 25.6039 16.1151 25.6386 16.1497C25.6733 16.1843 25.6927 16.2319 25.6922 16.2814V16.9046C25.6922 17.0089 25.6063 17.1456 25.4524 17.3612L23.7991 19.7682C24.4126 19.7533 25.0614 19.8471 25.6191 20.167C25.7221 20.223 25.7878 20.3311 25.791 20.4501V21.2285C25.791 21.3354 25.6767 21.459 25.5556 21.395C24.4972 20.8401 23.2408 20.8424 22.1844 21.4011C22.0735 21.4616 21.9575 21.3398 21.9575 21.2328V20.4922C21.9474 20.3176 21.9887 20.1439 22.0761 19.9934L23.9916 17.1886H22.321C22.2724 17.1905 22.2251 17.172 22.1901 17.1374C22.1552 17.1027 22.1358 17.055 22.1363 17.0054ZM39.0007 16.7442C39.2446 16.5248 39.5233 16.3493 39.8248 16.2253C40.1097 16.1094 40.4136 16.05 40.7202 16.05C41.0251 16.0442 41.3274 16.1064 41.6062 16.2323C41.8689 16.3551 42.099 16.5403 42.2774 16.7722C42.4715 17.0292 42.6151 17.3221 42.7001 17.6347C42.8032 18.0052 42.853 18.3891 42.848 18.7742C42.8526 19.1675 42.7993 19.5593 42.6898 19.9365C42.5982 20.2565 42.448 20.556 42.2473 20.8191C42.0609 21.0584 41.8242 21.2519 41.5547 21.3853C41.2715 21.5194 40.9619 21.5857 40.6498 21.5791C40.0664 21.5889 39.5017 21.3692 39.0729 20.9655V23.3987C39.0811 23.456 39.0623 23.5138 39.0222 23.5547C38.9821 23.5956 38.9254 23.6148 38.8692 23.6065H38.2677C38.2116 23.6148 38.1549 23.5956 38.1148 23.5547C38.0746 23.5138 38.0558 23.456 38.064 23.3987V16.412C38.0562 16.3548 38.0751 16.2972 38.1152 16.2564C38.1552 16.2156 38.2117 16.1963 38.2677 16.2042H38.7154C38.7738 16.1987 38.832 16.2177 38.8763 16.2569C38.9206 16.2962 38.9472 16.3522 38.95 16.412L39.0007 16.7442ZM40.4358 16.8792C39.9424 16.8831 39.4637 17.0508 39.072 17.3569V20.2494C39.5063 20.5825 39.954 20.7487 40.4152 20.7481C41.3513 20.7481 41.8193 20.1053 41.8193 18.8198C41.8193 17.5342 41.3582 16.887 40.4358 16.8783V16.8792ZM44.1189 17.1351L44.1954 17.1088C44.6794 16.9567 45.1825 16.877 45.6889 16.8721C46.0962 16.8727 46.3813 16.949 46.544 17.1009C46.7067 17.2528 46.788 17.5158 46.788 17.8898V18.5717C46.3689 18.462 45.9385 18.4032 45.5059 18.3964C44.9089 18.3958 44.434 18.5463 44.0811 18.8478C43.7282 19.1493 43.5518 19.5525 43.5518 20.0574C43.5529 20.5278 43.6961 20.9033 43.9814 21.1837C44.2667 21.4642 44.6534 21.6045 45.1415 21.6045C45.4433 21.6032 45.7422 21.5437 46.0223 21.4292C46.3178 21.3115 46.5913 21.1431 46.831 20.9313L46.8825 21.274C46.8851 21.331 46.9105 21.3843 46.9527 21.4216C46.995 21.4589 47.0504 21.4768 47.106 21.4712H47.5442C47.6003 21.4792 47.6567 21.4599 47.6968 21.4191C47.7368 21.3783 47.7557 21.3207 47.7479 21.2635V17.7171C47.7473 17.1491 47.5943 16.7304 47.289 16.4611C46.9836 16.1917 46.5087 16.057 45.8642 16.057C45.5435 16.057 45.2234 16.0863 44.9078 16.1446C44.6323 16.1895 44.3627 16.2663 44.1043 16.3734C44.0418 16.395 43.9858 16.4327 43.9419 16.483C43.9085 16.5447 43.8941 16.6153 43.9006 16.6854V16.9633C43.9006 17.0886 43.947 17.1509 44.033 17.1509C44.0623 17.1504 44.0913 17.1451 44.1189 17.1351ZM46.0885 20.6929C45.8638 20.7785 45.6263 20.8239 45.3864 20.827C45.1218 20.8276 44.9181 20.7569 44.7754 20.6149C44.6328 20.4729 44.5615 20.2704 44.5615 20.0075C44.5609 19.405 44.9444 19.1038 45.7121 19.1038C45.894 19.1041 46.0757 19.1164 46.2561 19.1406C46.4358 19.1637 46.6142 19.1964 46.7906 19.2387V20.2985C46.5774 20.4653 46.3407 20.5983 46.0885 20.6929ZM50.423 23.4189C50.6636 23.2109 50.8759 22.8681 51.0598 22.3907L53.2992 16.5776C53.3362 16.4989 53.3603 16.4145 53.3705 16.3278C53.3705 16.2454 53.3232 16.2034 53.2279 16.2034H52.6581C52.5799 16.1957 52.5013 16.2138 52.4338 16.2551C52.3764 16.3205 52.3348 16.3989 52.3127 16.4838L50.9377 20.5115L49.5121 16.4838C49.4899 16.3989 49.4484 16.3205 49.3909 16.2551C49.3235 16.2138 49.2449 16.1957 49.1666 16.2034H48.5557C48.4611 16.2034 48.4139 16.2454 48.4139 16.3278C48.4237 16.4145 48.4475 16.4989 48.4843 16.5776L50.4453 21.5221L50.252 22.048C50.1368 22.3805 50.0079 22.609 49.8653 22.7334C49.6935 22.8677 49.4798 22.934 49.2638 22.9201C49.1719 22.9221 49.0801 22.9151 48.9896 22.8991C48.9393 22.8881 48.8881 22.8813 48.8367 22.8789C48.7344 22.8789 48.6837 22.9447 48.6837 23.0762V23.3461C48.678 23.4205 48.6958 23.4948 48.7344 23.5582C48.7767 23.6086 48.8341 23.6434 48.8977 23.6573C49.0869 23.7082 49.282 23.7327 49.4777 23.73C49.8673 23.7306 50.1824 23.6269 50.423 23.4189Z" fill="#232F3E"/>
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
        <Drawer open={open} onOpenChange={onOpenChange} dismissible={false}>
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
