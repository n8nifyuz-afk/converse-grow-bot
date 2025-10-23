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
import { useTranslation } from 'react-i18next';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Feature {
  name: string;
  included: boolean;
  description: string;
  proOnly?: boolean;
  ultraOnly?: boolean;
}

const getFeatures = (t: (key: string) => string, plan: 'pro' | 'ultra'): Feature[] => {
  const baseFeatures: Feature[] = [
    { 
      name: 'OpenAI – GPT-5 / GPT-4o', 
      included: true, 
      description: t('pricingModal.gptDesc'),
      proOnly: false
    },
    { 
      name: 'Google – Gemini', 
      included: true, 
      description: t('pricingModal.geminiDesc'),
      proOnly: false
    },
    { 
      name: 'Anthropic – Claude Haiku 4.5', 
      included: plan === 'ultra', 
      description: plan === 'ultra' ? t('pricingModal.claudeDesc') : t('pricingModal.availableOnlyInUltra'),
      ultraOnly: true
    },
    { 
      name: 'DeepSeek V3', 
      included: plan === 'ultra', 
      description: plan === 'ultra' ? t('pricingModal.deepseekDesc') : t('pricingModal.availableOnlyInUltra'),
      ultraOnly: true
    },
    { 
      name: 'Grok (X AI – Live Web)', 
      included: plan === 'ultra', 
      description: plan === 'ultra' ? t('pricingModal.grokDesc') : t('pricingModal.availableOnlyInUltra'),
      ultraOnly: true
    },
    { 
      name: 'Ask PDF / Docs AI', 
      included: true, 
      description: t('pricingModal.pdfDocsDesc'),
      proOnly: false
    },
    { 
      name: 'Voice Mode', 
      included: true, 
      description: t('pricingModal.voiceModeDesc'),
      proOnly: false
    },
    { 
      name: 'Priority Support', 
      included: true, 
      description: plan === 'ultra' ? t('pricingModal.prioritySupportDesc') : t('pricingModal.standardPrioritySupport'),
      proOnly: false
    },
    { 
      name: 'Chat on WhatsApp', 
      included: false, 
      description: t('pricingModal.whatsappDesc'),
      proOnly: false
    },
  ];

  return baseFeatures;
};

const pricingOptions = {
  pro: {
    monthly: { price: 19.99, perDay: 0.67 },     // €19.99/month
    '3month': { price: 39.99, perDay: 0.44 },    // €39.99 for 3 months
    yearly: { price: 59.99, perDay: 0.16, savings: 75 } // €59.99/year (save 75%)
  },
  ultra: {
    monthly: { price: 39.99, perDay: 1.33 },     // €39.99/month
    '3month': { price: 79.99, perDay: 0.89 },    // €79.99 for 3 months
    yearly: { price: 119.99, perDay: 0.33, savings: 75 } // €119.99/year (save 75%)
  }
};

const priceIds = {
  pro: {
    monthly: 'price_1SKKdNL8Zm4LqDn4gBXwrsAq',   // €19.99/month
    '3month': 'price_1SKJ76L8Zm4LqDn4lboudMxL',  // €39.99 for 3 months
    yearly: 'price_1SKJ8cL8Zm4LqDn4jPkxLxeF'     // €59.99/year
  },
  ultra: {
    monthly: 'price_1SKJAxL8Zm4LqDn43kl9BRd8',   // €39.99/month
    '3month': 'price_1SKJD6L8Zm4LqDn4l1KXsNw1',  // €79.99 for 3 months
    yearly: 'price_1SKJEwL8Zm4LqDn4qcEFPlgP'     // €119.99/year
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { user, subscriptionStatus } = useAuth();
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | '3month' | 'yearly'>('yearly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeBlockedDialog, setShowUpgradeBlockedDialog] = useState(false);
  const [blockedPlanName, setBlockedPlanName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const allFeatures = getFeatures(t, selectedPlan);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TGsOnuDkIh9hVG': 'Pro',        // Pro Monthly
    'prod_TGqo8h59qNKZ4m': 'Pro',        // Pro 3-Month
    'prod_TGqqoPGWQJ0T4a': 'Pro',        // Pro Yearly
    'prod_TGqs5r2udThT0t': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TGquGexHO44m4T': 'Ultra Pro',  // Ultra Pro 3-Month
    'prod_TGqwVIWObYLt6U': 'Ultra Pro',  // Ultra Pro Yearly
  };

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
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start subscription process';
      
      if (errorMessage.includes('active subscription')) {
        toast.error('You already have an active subscription', {
          description: 'Please cancel your current plan first'
        });
      } else if (errorMessage.includes('authentication')) {
        toast.error('Please sign in to continue');
      } else {
        toast.error('Subscription Error', {
          description: errorMessage
        });
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
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none z-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            )}
            
            {/* Left Panel - Features Comparison */}
            <div className="hidden md:flex md:w-7/12 bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-3 sm:p-4 md:p-4 lg:p-8 border-r border-zinc-200 dark:border-zinc-700 flex-col relative">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-100/30 via-transparent to-zinc-50/20 dark:from-zinc-800/20 dark:via-transparent dark:to-zinc-900/10 pointer-events-none"></div>
              
              {/* Comparison Table */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {/* Header Row */}
                <div className="grid grid-cols-[2fr,0.8fr,2.5fr] gap-3 md:gap-4 pb-3 md:pb-4 border-b border-zinc-300 dark:border-zinc-700 mb-2 flex-shrink-0">
                  <div className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100">{t('pricingModal.modelFeature')}</div>
                  <div className="text-sm md:text-base font-bold text-center text-zinc-900 dark:text-zinc-100">{t('pricingModal.included')}</div>
                  <div className="text-sm md:text-base font-bold text-zinc-900 dark:text-zinc-100">{t('pricingModal.descriptionNotes')}</div>
                </div>
                
                {/* Feature Rows */}
                <div className="flex-1 space-y-0 overflow-y-auto">
                  {allFeatures.map((feature, index) => (
                    <div key={index} className="grid grid-cols-[2fr,0.8fr,2.5fr] gap-3 md:gap-4 py-2 md:py-2.5 px-2 md:px-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700">
                      <div className="text-xs md:text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center leading-tight">
                        {feature.name}
                      </div>
                      <div className="flex justify-center items-center">
                        {feature.name === 'Chat on WhatsApp' ? (
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">{t('pricingModal.comingSoon')}</span>
                        ) : feature.included ? (
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-50 dark:bg-red-500/20 flex items-center justify-center">
                            <X className="w-3 h-3 md:w-4 md:h-4 text-red-500 dark:text-red-400" />
                          </div>
                        )}
                      </div>
                      <div className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 flex items-center leading-tight">
                        {feature.name === 'Priority Support' && selectedPlan === 'ultra' ? (
                          <>
                            <Check className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400 mr-1" />
                            <span>{t('pricingModal.highPriority')}</span>
                            <span className="ml-1">{feature.description}</span>
                          </>
                        ) : (
                          feature.description
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Panel - Pricing */}
            <div className="w-full md:w-5/12 p-3 sm:p-4 md:p-5 pb-4 sm:pb-6 flex flex-col bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/30 justify-between">
              <div className="mb-2 sm:mb-2.5 flex-shrink-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-0.5 sm:mb-1 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent leading-tight">
                  {t('pricingModal.chooseYourPlan')}
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-xs">{t('pricingModal.unlimitedAccess')}</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-2 sm:mb-2.5 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2 h-8 sm:h-9 md:h-10 bg-zinc-200 dark:bg-zinc-800 p-0.5 sm:p-1 border border-zinc-300 dark:border-zinc-700 rounded-lg">
                  <TabsTrigger 
                    value="pro" 
                    className="text-xs sm:text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-foreground data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all"
                  >
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {t('pricingModal.pro')}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-xs sm:text-sm font-bold data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:text-foreground data-[state=active]:shadow-lg rounded-md sm:rounded-lg transition-all"
                  >
                    <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {t('pricingModal.ultraPro')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-2.5 flex-1 flex flex-col justify-center md:flex-initial md:block">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left group relative overflow-hidden ${
                    selectedPeriod === 'monthly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900/30 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-white">{t('pricingModal.oneMonth')}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        €{pricingOptions[selectedPlan].monthly.price}/{t('pricingModal.perMonth').toLowerCase()}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].monthly.perDay}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('pricingModal.perDay')}</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('3month')}
                  className={`w-full p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left relative group overflow-hidden ${
                    selectedPeriod === '3month'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900/30 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-white">{t('pricingModal.threeMonths')}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        €{pricingOptions[selectedPlan]['3month'].price} {t('pricingModal.total')}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan]['3month'].perDay}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('pricingModal.perDay')}</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-2.5 sm:p-3 pt-4 sm:pt-5 rounded-lg border-2 transition-all duration-200 text-left relative group overflow-visible ${
                    selectedPeriod === 'yearly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-zinc-900/30 shadow-lg'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-2 right-2 sm:right-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md px-2 py-0.5 text-[10px] font-bold border-0">
                    {t('pricingModal.save')} {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-zinc-900 dark:text-white">{t('pricingModal.yearly')}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        €{pricingOptions[selectedPlan].yearly.price} {t('pricingModal.total')}
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="font-bold text-lg sm:text-xl text-zinc-900 dark:text-white">€{pricingOptions[selectedPlan].yearly.perDay}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{t('pricingModal.perDay')}</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-10 sm:h-11 bg-black hover:bg-zinc-800 text-white font-bold text-sm shadow-lg hover:shadow-black/30 transition-all rounded-lg border-0 flex-shrink-0 mb-3 sm:mb-4"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {t('pricingModal.processing')}
                  </>
                ) : (
                  <>
                    {t('pricingModal.continue')}
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="space-y-1 flex-shrink-0">
                {/* Pay Safe & Secure */}
                <div className="flex items-center justify-center gap-1.5 py-1">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs sm:text-sm font-medium text-emerald-500">{t('pricingModal.paySafeSecure')}</span>
                </div>
                
                {/* Payment Cards */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 py-0.5">
                  {/* Visa */}
                  <div className="w-9 h-6 sm:w-10 sm:h-7 flex items-center justify-center">
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
                      <rect x="0.5" y="0.5" width="69" height="47" rx="5.5" fill="white" stroke="#D9D9D9"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3945 34.7619C33.0114 36.8184 29.92 38.0599 26.5421 38.0599C19.0047 38.0599 12.8945 31.8788 12.8945 24.254C12.8945 16.6291 19.0047 10.448 26.5421 10.448C29.92 10.448 33.0114 11.6895 35.3945 13.7461C37.7777 11.6895 40.869 10.448 44.247 10.448C51.7843 10.448 57.8945 16.6291 57.8945 24.254C57.8945 31.8788 51.7843 38.0599 44.247 38.0599C40.869 38.0599 37.7777 36.8184 35.3945 34.7619Z" fill="#ED0006"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3945 34.7619C38.3289 32.2296 40.1896 28.4616 40.1896 24.254C40.1896 20.0463 38.3289 16.2783 35.3945 13.7461C37.7777 11.6895 40.869 10.448 44.247 10.448C51.7843 10.448 57.8945 16.6291 57.8945 24.254C57.8945 31.8788 51.7843 38.0599 44.247 38.0599C40.869 38.0599 37.7777 36.8184 35.3945 34.7619Z" fill="#F9A000"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M35.3946 13.7461C38.329 16.2784 40.1897 20.0463 40.1897 24.254C40.1897 28.4616 38.329 32.2295 35.3946 34.7618C32.4603 32.2295 30.5996 28.4616 30.5996 24.254C30.5996 20.0463 32.4603 16.2784 35.3946 13.7461Z" fill="#FF5E00"/>
                    </svg>
                  </div>
                  {/* Apple Pay */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 -9 58 58" fill="none">
                      <rect x="0.5" y="0.5" width="57" height="39" rx="3.5" fill="white" stroke="#F3F3F3"/>
                      <path fillRule="evenodd" clipRule="evenodd" d="M17.5771 14.9265C17.1553 15.4313 16.4803 15.8294 15.8053 15.7725C15.7209 15.09 16.0513 14.3649 16.4381 13.9171C16.8599 13.3981 17.5982 13.0284 18.1959 13C18.2662 13.7109 17.992 14.4076 17.5771 14.9265ZM18.1888 15.9076C17.5942 15.873 17.0516 16.0884 16.6133 16.2624C16.3313 16.3744 16.0924 16.4692 15.9107 16.4692C15.7068 16.4692 15.4581 16.3693 15.1789 16.2571C14.813 16.1102 14.3947 15.9422 13.956 15.9502C12.9506 15.9645 12.0154 16.5403 11.5021 17.4573C10.4474 19.2915 11.2279 22.0071 12.2474 23.5C12.7467 24.2393 13.3443 25.0498 14.1318 25.0213C14.4783 25.0081 14.7275 24.9012 14.9854 24.7905C15.2823 24.6631 15.5908 24.5308 16.0724 24.5308C16.5374 24.5308 16.8324 24.6597 17.1155 24.7834C17.3847 24.9011 17.6433 25.014 18.0271 25.0071C18.8428 24.9929 19.356 24.2678 19.8553 23.5284C20.394 22.7349 20.6307 21.9605 20.6667 21.843L20.6709 21.8294C20.67 21.8285 20.6634 21.8254 20.6516 21.82C20.4715 21.7366 19.095 21.0995 19.0818 19.391C19.0686 17.957 20.1736 17.2304 20.3476 17.116C20.3582 17.109 20.3653 17.1043 20.3685 17.1019C19.6654 16.0498 18.5685 15.936 18.1888 15.9076ZM23.8349 24.9289V13.846H27.9482C30.0717 13.846 31.5553 15.3246 31.5553 17.4858C31.5553 19.6469 30.0435 21.1398 27.892 21.1398H25.5365V24.9289H23.8349ZM25.5365 15.2962V19.6967H27.4912C28.9748 19.6967 29.8185 18.8934 29.8185 17.4929C29.8185 16.0924 28.9748 15.2962 27.4982 15.2962H25.5365ZM37.1732 23.5995C36.7232 24.4668 35.7318 25.0142 34.6631 25.0142C33.081 25.0142 31.9771 24.0616 31.9771 22.6256C31.9771 21.2038 33.0459 20.3863 35.0217 20.2654L37.1451 20.1374V19.5261C37.1451 18.6232 36.5615 18.1327 35.5209 18.1327C34.6631 18.1327 34.0373 18.5806 33.9107 19.263H32.3779C32.4271 17.827 33.7631 16.782 35.5701 16.782C37.5177 16.782 38.7834 17.8128 38.7834 19.4123V24.9289H37.2084V23.5995H37.1732ZM35.1201 23.6991C34.2131 23.6991 33.6365 23.2583 33.6365 22.5829C33.6365 21.8863 34.192 21.481 35.2537 21.4171L37.1451 21.2962V21.9218C37.1451 22.9597 36.2732 23.6991 35.1201 23.6991ZM44.0076 25.3626C43.3256 27.3033 42.5451 27.9431 40.8857 27.9431C40.7592 27.9431 40.3373 27.9289 40.2388 27.9005V26.5711C40.3443 26.5853 40.6045 26.5995 40.7381 26.5995C41.4904 26.5995 41.9123 26.2796 42.1724 25.4479L42.3271 24.9573L39.4443 16.8886H41.2232L43.2271 23.436H43.2623L45.2662 16.8886H46.9959L44.0076 25.3626Z" fill="#000000"/>
                    </svg>
                  </div>
                  {/* Google Pay */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 356.44 141.39" fill="none">
                      <g fill="#5f6368"><path d="M168.58 20.77V56.5h22.04c5.25 0 9.59-1.76 13.02-5.29 3.53-3.52 5.29-7.72 5.29-12.58s-1.76-8.91-5.29-12.44c-3.44-3.62-7.78-5.43-13.02-5.43h-22.04zm0 48.32v41.45h-13.16V8.19h34.91c8.87 0 16.39 2.96 22.6 8.86 6.31 5.9 9.45 13.1 9.45 21.58s-3.14 15.92-9.45 21.72c-6.1 5.82-13.64 8.72-22.6 8.72h-21.75zM235.68 89.08c0 3.44 1.45 6.29 4.37 8.58 2.91 2.28 6.32 3.43 10.23 3.43 5.54 0 10.46-2.05 14.8-6.14 4.34-4.1 6.51-8.91 6.51-14.43-4.1-3.25-9.83-4.86-17.17-4.86-5.34 0-9.8 1.29-13.37 3.86s-5.37 5.75-5.37 9.56m17.03-50.88c9.73 0 17.41 2.59 23.04 7.79s8.43 12.31 8.43 21.36v43.17h-12.59v-9.72h-.57c-5.44 8-12.68 12-21.74 12-7.73 0-14.2-2.28-19.39-6.85-5.2-4.58-7.8-10.29-7.8-17.16 0-7.24 2.73-13 8.22-17.28 5.49-4.29 12.81-6.43 21.96-6.43 7.82 0 14.26 1.43 19.31 4.29v-3c0-4.57-1.81-8.45-5.43-11.64-3.63-3.2-7.86-4.79-12.73-4.79-7.35 0-13.16 3.09-17.45 9.29l-11.6-7.29c6.4-9.15 15.84-13.72 28.34-13.72M356.44 40.49l-43.93 100.9h-13.59l16.31-35.3-28.9-65.6h14.31l20.89 50.31h.28l20.32-50.31z"/></g><path d="M115.39 60.14c0-4.14-.35-8.14-1.01-11.96H58.86v22.65h31.79c-1.36 7.38-5.49 13.66-11.75 17.87v14.71h18.98c11.11-10.24 17.51-25.37 17.51-43.26" fill="#4285f4"/><path d="M58.86 117.61c15.89 0 29.26-5.21 39.02-14.2L78.9 88.7c-5.28 3.55-12.08 5.63-20.04 5.63-15.35 0-28.38-10.34-33.05-24.27H6.27v15.15c9.69 19.21 29.6 32.41 52.6 32.41" fill="#34a853"/><path d="M25.82 70.05c-1.19-3.55-1.85-7.34-1.85-11.25s.65-7.7 1.85-11.25V32.4H6.27C2.26 40.34 0 49.3 0 58.8s2.26 18.47 6.27 26.4z" fill="#fabb05"/><path d="M58.86 23.27c8.67 0 16.45 2.98 22.58 8.82s16.8-16.78 16.8-16.78C88.04 5.83 74.74 0 58.86 0 35.87 0 15.96 13.19 6.27 32.4l19.55 15.15c4.66-13.93 17.69-24.27 33.05-24.27" fill="#e94235"/>
                    </svg>
                  </div>
                  {/* Revolut */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 294.2 65" fill="none">
                      <path fillRule="evenodd" clipRule="evenodd" fill="currentColor" d="M200.7,0h11.6v64.5h-11.6V0z M294.2,27.2v-10h-11.9v-13h-11.6v47.5c0,4.4,1.1,7.7,3.3,9.9
                        c2.2,2.2,5.5,3.3,10,3.3h10.2v-10h-7.5c-1.6,0-2.8-0.4-3.5-1.1c-0.6-0.6-1-2.3-1-4.1V27.2L294.2,27.2z M122.2,51.9l11.9-34.8h12.1
                        l-17.2,47.3h-13.7L98.1,17.2h12.1L122.2,51.9z M251.9,40.8c0,3-0.5,5.6-1.3,7.7c-0.9,2.1-2.2,3.8-3.8,4.9c-1.6,1.1-3.6,1.6-5.9,1.6
                        c-3.3,0-5.8-1.1-7.4-3.2c-1.6-2.2-2.5-5.4-2.5-9.7v-25h-11.6v26.2c0,4.1,0.5,7.6,1.5,10.3c1,2.8,2.4,5,4.1,6.7
                        c1.7,1.7,3.7,2.9,6,3.6c2.2,0.7,4.6,1.1,7.1,1.1c3.6,0,6.6-0.7,8.9-1.9c2.1-1.2,3.8-2.6,5.2-4.1l1,5.5h10.1V17.2h-11.6V40.8z
                        M183,19.6c-3.6-2-8-3-12.8-3c-4.8,0-9.1,1-12.8,3c-3.7,2-6.6,4.9-8.6,8.5c-2,3.6-3,7.9-3,12.7c0,4.8,1,9,3,12.6
                        c2,3.6,4.9,6.5,8.6,8.5c3.7,2,8,3,12.8,3c4.9,0,9.2-1,12.8-3c3.6-2,6.5-4.9,8.5-8.5c2-3.6,3-7.9,3-12.6c0-4.8-1-9.1-3-12.7
                        C189.6,24.5,186.7,21.7,183,19.6z M176.9,53.4c-1.9,1.2-4.1,1.8-6.7,1.8c-2.6,0-4.8-0.6-6.7-1.8c-1.9-1.2-3.4-2.9-4.4-5.1
                        c-1-2.2-1.6-4.7-1.6-7.5c0-2.9,0.5-5.4,1.6-7.5c1-2.1,2.5-3.9,4.4-5.1c1.9-1.2,4.1-1.9,6.7-1.9c2.6,0,4.9,0.6,6.7,1.9
                        c1.9,1.2,3.3,3,4.4,5.1c1,2.1,1.6,4.7,1.6,7.5c0,2.8-0.5,5.3-1.6,7.5C180.3,50.5,178.8,52.2,176.9,53.4z M12,15.9H0v48.5h12V15.9z
                        M49.7,18.7C49.7,8.4,41.3,0,31,0H0v10.4h29.5c4.7,0,8.5,3.7,8.6,8.2c0,2.3-0.8,4.4-2.4,6C34.1,26.1,32,27,29.8,27H18.3
                        c-0.4,0-0.7,0.3-0.7,0.7V37c0,0.2,0,0.3,0.1,0.4l19.5,27h14.3L31.9,37.3C41.7,36.9,49.7,28.6,49.7,18.7z M86.6,19.4
                        c-3.5-1.8-7.6-2.8-12.2-2.8c-4.6,0-8.8,1-12.3,3c-3.6,2-6.3,4.9-8.3,8.5c-2,3.6-2.9,7.9-2.9,12.8c0,4.8,1,9,3,12.6
                        c2,3.6,4.9,6.5,8.5,8.4c3.7,2,8.1,3,13.1,3c4,0,7.5-0.7,10.6-2.2c3.1-1.5,5.6-3.5,7.4-6c1.8-2.4,3-5,3.6-7.9l0.1-0.3H85.5l-0.1,0.2
                        c-0.6,2.2-1.9,3.9-3.6,5.1c-1.9,1.3-4.3,2-7,2c-2.3,0-4.4-0.5-6.2-1.5c-1.8-1-3.2-2.4-4.2-4.1c-1-1.8-1.5-3.9-1.7-6.3v-0.4h34.7
                        l0-0.2c0.1-0.7,0.2-1.4,0.2-2c0-0.7,0-1.3,0-2c-0.1-4.6-1.1-8.6-3-12C92.8,23.8,90,21.2,86.6,19.4z M82.4,28.3c2,1.7,3.2,4,3.7,7
                        H63.2c0.3-1.9,0.9-3.6,1.9-5c1.1-1.5,2.4-2.6,4.1-3.4c1.6-0.8,3.4-1.2,5.3-1.2C77.7,25.7,80.3,26.6,82.4,28.3z" />
                    </svg>
                  </div>
                  {/* American Express */}
                  <div className="w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 1000 997.517" xmlns="http://www.w3.org/2000/svg">
                      <path d="m 106.12803,352.5839 -50.435161,117.2641 32.835892,0 9.305914,-23.4816 54.099665,0 9.2577,23.4816 33.55915,0 -50.38695,-117.2641 -38.23621,0 z m 18.66004,27.2909 16.49028,41.0329 -33.02877,0 16.53849,-41.0329 z" fill="#016fd0"/>
                      <path d="m 198.22282,469.8283 0,-117.2642 46.66163,0.1733 27.13999,75.6045 26.4901,-75.7778 46.28848,0 0,117.2642 -29.31604,0 0,-86.4052 -31.07562,86.4052 -25.71023,0 -31.16227,-86.4052 0,86.4052 z" fill="#016fd0"/>
                      <path d="m 364.86136,469.8283 0,-117.2642 95.66287,0 0,26.2302 -66.03824,0 0,20.0583 64.49529,0 0,24.6872 -64.49529,0 0,20.8298 66.03824,0 0,25.4587 z" fill="#016fd0"/>
                      <path d="m 477.49667,352.5839 0,117.2641 29.31604,0 0,-41.6596 12.34359,0 35.15032,41.6596 35.82536,0 -38.57374,-43.2025 c 15.8309,-1.3359 32.16085,-14.9233 32.16085,-36.0182 0,-24.6765 -19.36827,-38.0434 -40.98459,-38.0434 l -65.23783,0 z m 29.31604,26.2301 33.51093,0 c 8.03881,0 13.88655,6.2882 13.88655,12.3436 0,7.7905 -7.57673,12.3436 -13.45259,12.3436 l -33.94489,0 0,-24.6872 z" fill="#016fd0"/>
                      <path d="m 625.61982,469.8283 -29.93322,0 0,-117.2642 29.93322,0 z" fill="#016fd0"/>
                      <path d="m 696.59549,469.8283 -6.4611,0 c -31.26172,0 -50.24229,-24.6292 -50.24229,-58.1499 0,-34.3488 18.76806,-59.1143 58.24634,-59.1143 l 32.40194,0 0,27.7731 -33.58657,0 c -16.026,0 -27.35994,12.5067 -27.35994,31.6305 0,22.7096 12.95987,32.2476 31.63047,32.2476 l 7.71474,0 z" fill="#016fd0"/>
                      <path d="m 760.3868,352.5839 -50.43515,117.2641 32.83589,0 9.30591,-23.4816 54.09967,0 9.25769,23.4816 33.55915,0 -50.38694,-117.2641 -38.23622,0 z m 18.66005,27.2909 16.49027,41.0329 -33.02876,0 16.53849,-41.0329 z" fill="#016fd0"/>
                      <path d="m 852.43338,469.8283 0,-117.2642 37.27187,0 47.59035,73.6759 0,-73.6759 29.31604,0 0,117.2642 -36.06644,0 -48.79578,-75.6045 0,75.6045 z" fill="#016fd0"/>
                      <path d="m 269.1985,675.0406 0,-117.2642 95.66286,0 0,26.2302 -66.03823,0 0,20.0583 64.49528,0 0,24.6872 -64.49528,0 0,20.8298 66.03823,0 0,25.4587 z" fill="#016fd0"/>
                      <path d="m 737.94653,675.0406 0,-117.2642 95.66287,0 0,26.2302 -66.03824,0 0,20.0583 64.1867,0 0,24.6872 -64.1867,0 0,20.8298 66.03824,0 0,25.4587 z" fill="#016fd0"/>
                      <path d="m 368.57408,675.0406 46.57779,-57.9089 -47.68678,-59.3553 36.93435,0 28.39991,36.6932 28.49635,-36.6932 35.48784,0 -47.05996,58.6321 46.66353,58.6321 -36.92851,0 -27.57537,-36.1148 -26.90518,36.1148 z" fill="#016fd0"/>
                      <path d="m 499.86944,557.7962 0,117.2641 30.08751,0 0,-37.0308 30.85899,0 c 26.11107,0 45.90274,-13.8524 45.90274,-40.7917 0,-22.3164 -15.52271,-39.4416 -42.09358,-39.4416 l -64.75566,0 z m 30.08751,26.5194 32.49837,0 c 8.43546,0 14.46515,5.1701 14.46515,13.5008 0,7.8262 -5.99925,13.5008 -14.56158,13.5008 l -32.40194,0 0,-27.0016 z" fill="#016fd0"/>
                      <path d="m 619.44802,557.7764 0,117.2642 29.31604,0 0,-41.6597 12.34359,0 35.15032,41.6597 35.82536,0 -38.57374,-43.2026 c 15.83089,-1.3361 32.16085,-14.9233 32.16085,-36.0183 0,-24.6764 -19.36827,-38.0433 -40.98459,-38.0433 l -65.23783,0 z m 29.31604,26.2302 33.51093,0 c 8.03881,0 13.88654,6.2881 13.88654,12.3435 0,7.7906 -7.57673,12.3436 -13.45259,12.3436 l -33.94488,0 0,-24.6871 z" fill="#016fd0"/>
                      <path d="m 847.18735,675.0406 0,-25.4587 58.67066,0 c 8.68115,0 12.44003,-4.6912 12.44003,-9.8363 0,-4.9296 -3.74703,-9.9134 -12.44003,-9.9134 l -26.5126,0 c -23.04571,0 -35.88042,-14.0409 -35.88042,-35.1214 0,-18.8023 11.75348,-36.9344 45.99918,-36.9344 l 57.08913,0 -12.3436,26.3844 -49.37438,0 c -9.43821,0 -12.3436,4.9526 -12.3436,9.6821 0,4.8612 3.59036,10.222 10.80065,10.222 l 27.77309,0 c 25.69029,0 36.83792,14.5724 36.83792,33.6556 0,20.5163 -12.42212,37.3201 -38.23646,37.3201 z" fill="#016fd0"/>
                      <path d="m 954.78398,675.0406 0,-25.4587 58.67062,0 c 8.6812,0 12.4401,-4.6912 12.4401,-9.8363 0,-4.9296 -3.7471,-9.9134 -12.4401,-9.9134 l -26.51256,0 c -23.04571,0 -35.88043,-14.0409 -35.88043,-35.1214 0,-18.8023 11.75348,-36.9344 45.99918,-36.9344 l 57.08911,0 -12.3436,26.3844 -49.37436,0 c -9.4382,0 -12.34359,4.9526 -12.34359,9.6821 0,4.8612 3.59035,10.222 10.80064,10.222 l 27.77311,0 c 25.6903,0 36.8379,14.5724 36.8379,33.6556 0,20.5163 -12.4221,37.3201 -38.2365,37.3201 z" fill="#016fd0"/>
                    </svg>
                  </div>
                </div>

                <p className="text-[11px] sm:text-xs text-center text-zinc-400 dark:text-zinc-500 leading-relaxed px-2">
                  {t('pricingModal.byContinuing')}{' '}
                  <a href="https://www.chatl.ai/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">{t('pricingModal.termsConditions')}</a>,{' '}
                  <a href="https://www.chatl.ai/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">{t('pricingModal.privacyPolicy')}</a>,{' '}
                  <a href="https://www.chatl.ai/cookies" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">{t('pricingModal.cookiePolicy')}</a>,{' '}
                  {t('pricingModal.and')}{' '}
                  <a href="https://www.chatl.ai/refund-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">{t('pricingModal.refundCancellationPolicy')}</a>.
                </p>
              </div>
            </div>
          </div>
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={open} onOpenChange={onOpenChange} dismissible={false}>
          <DrawerContent className="max-h-[97vh] bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 border-t border-zinc-300 dark:border-zinc-700">
            <div className="overflow-y-auto max-h-[97vh]">
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
