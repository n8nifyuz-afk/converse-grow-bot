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
  { name: 'File Uploads (100MB)', free: false, pro: true, ultra: true },
  { name: 'Image Generation (500/month)', free: false, pro: true, ultra: false },
  { name: 'Image Generation (2,000/month)', free: false, pro: false, ultra: true },
  { name: 'Priority Support', free: false, pro: true, ultra: false },
  { name: 'Premium 24/7 Support', free: false, pro: false, ultra: true },
  { name: 'Team Collaboration', free: false, pro: false, ultra: true },
  { name: 'Early Access to Models', free: false, pro: false, ultra: true },
];

const pricingOptions = {
  pro: {
    daily: { price: 1, perDay: 1 },
    monthly: { price: 19.99, perDay: 0.67 },
    yearly: { price: 15.99, perDay: 0.53, savings: 20 }
  },
  ultra: {
    monthly: { price: 39.99, perDay: 1.33 },
    yearly: { price: 31.99, perDay: 1.07, savings: 20 }
  }
};

// IMPORTANT: You must add your LIVE Stripe price IDs here
// Step 1: Go to https://dashboard.stripe.com/products (make sure you're in LIVE mode, not test mode)
// Step 2: Find or create these 4 products with these exact prices:
//         - Pro Monthly: €19.99/month
//         - Pro Yearly: €191.88/year (€15.99/month)
//         - Ultra Pro Monthly: €39.99/month  
//         - Ultra Pro Yearly: €383.88/year (€31.99/month)
// Step 3: Click on each product, copy the Price ID (starts with price_), and paste below

const priceIds = {
  pro: {
    daily: 'price_1SIrJEL8Zm4LqDn4JqqrksNA',
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
    'prod_TFLbRE1wL9Miha': 'Pro',
    'prod_TEx5Xda5BPBuHv': 'Pro',
    'prod_TDSbGJB9U4Xt7b': 'Ultra Pro',
    'prod_TDSHzExQNjyvJD': 'Ultra Pro',
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
      toast.error(error.message || 'Failed to start subscription process');
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
                    <Badge className="absolute -top-1.5 sm:-top-2 right-2 sm:right-4 bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold border-0">
                      TEST ONLY
                    </Badge>
                    {selectedPeriod === 'daily' && (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                    )}
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <div className="font-bold text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 text-zinc-900 dark:text-white">Monthly Cheap</div>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                          Billed monthly • For testing
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xl sm:text-2xl md:text-3xl text-zinc-900 dark:text-white">${pricingOptions[selectedPlan].daily.price}</div>
                        <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 sm:mt-1">per month</div>
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
                  <div className="w-10 h-7 sm:w-12 sm:h-8 bg-white dark:bg-zinc-900 rounded-md sm:rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-3 sm:h-4" viewBox="0 0 48 16" fill="none">
                      <path d="M20.8 14.4h-3.2L19.6 1.6h3.2l-2 12.8zm13.2-12.5c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.3 1.7-5.3 4 0 1.8 1.5 2.7 2.7 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-.9 1.2-1.8 1.2-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.4-4.2 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.7.2 2.3.4l.3.1.4-2.3zm5.8-2.3h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11.5h3.3l.7-1.9h4.1l.4 1.9h2.9l-2.4-12.5zm-3.7 8.1l1.7-4.7.9 4.7h-2.6zM15.5 1.6l-3.1 8.7-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.9 10.7h3.3l4.9-12.7h-3.4z" fill="#1434CB"/>
                      <path d="M7.8 1.6H2.6L2.5 2c3.9.9 6.5 3.2 7.5 5.9l-1.1-5.2c-.2-.8-.7-1-.9-1.1z" fill="#F7A600"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 bg-white dark:bg-zinc-900 rounded-md sm:rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-4 sm:h-5" viewBox="0 0 32 20" fill="none">
                      <circle cx="11" cy="10" r="9" fill="#EB001B"/>
                      <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
                      <path d="M16 14.2c1.1-1.2 1.8-2.7 1.8-4.2 0-1.5-.7-3-1.8-4.2-1.1 1.2-1.8 2.7-1.8 4.2 0 1.5.7 3 1.8 4.2z" fill="#FF5F00"/>
                    </svg>
                  </div>
                  {/* American Express */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 bg-white dark:bg-zinc-900 rounded-md sm:rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-3 sm:h-4" viewBox="0 0 32 20" fill="none">
                      <rect width="32" height="20" rx="2" fill="#006FCF"/>
                      <path d="M8.5 7.5h2.7l-.7 1.8h-2l-.5 1.2h2l-.7 1.8h-2l-.5 1.2h2.7l-.7 1.8H5.5l2.4-6h.6v-1.8zm6.8 0l-1.8 4.8h-.1l-.9-4.8h-2.4l2.4 6h2.4l2.4-6h-2zm6.2 1.8h-2.4l.4-1.8h7.2l-.4 1.8h-2.4l-2 4.2h-2.4l2-4.2z" fill="white"/>
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
