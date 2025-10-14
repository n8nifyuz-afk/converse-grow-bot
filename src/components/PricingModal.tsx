import React, { useState } from 'react';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Check, X, Crown, Sparkles, Zap, Mic, FileText, MessageSquare, Image as ImageIcon, Infinity, CreditCard, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';

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
    monthly: { price: 19.99, perDay: 0.67 },
    yearly: { price: 15.99, perDay: 0.53, savings: 20 }
  },
  ultra: {
    monthly: { price: 39.99, perDay: 1.33 },
    yearly: { price: 31.99, perDay: 1.07, savings: 20 }
  }
};

// Stripe price IDs
const priceIds = {
  pro: {
    monthly: 'price_1SH1jRL8Zm4LqDn4M49yf60W',
    yearly: 'price_1SHinzL8Zm4LqDn4jE1jGyKi'
  },
  ultra: {
    monthly: 'price_1SH1jpL8Zm4LqDn4zN9CGBpC',
    yearly: 'price_1SHioTL8Zm4LqDn41Pd00GWM'
  }
};

export const PricingModal: React.FC<PricingModalProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>('pro');
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const priceId = priceIds[selectedPlan][selectedPeriod];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[98vw] sm:max-w-[92vw] md:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-full h-[95vh] sm:h-[90vh] md:h-[85vh] p-0 bg-gradient-to-br from-white via-zinc-50/50 to-white dark:from-zinc-950 dark:via-zinc-900/30 dark:to-zinc-950 border border-zinc-300 dark:border-zinc-700 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left Panel - Features Comparison */}
            <div className="w-full lg:w-7/12 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-8 border-b lg:border-b-0 lg:border-r border-zinc-700 dark:border-zinc-800 flex flex-col relative max-h-[45vh] lg:max-h-none">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 pointer-events-none"></div>
              
              {/* Comparison Table */}
              <div className="flex-1 flex flex-col min-h-0 relative z-10">
                {/* Header Row */}
                <div className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 pb-1.5 xs:pb-2 sm:pb-3 md:pb-4 border-b border-zinc-700/50 mb-1 xs:mb-1.5 sm:mb-2 flex-shrink-0">
                  <div className="text-[10px] xs:text-xs sm:text-sm md:text-base font-bold text-zinc-400 leading-tight">Feature</div>
                  <div className="text-[10px] xs:text-xs sm:text-sm md:text-base font-bold text-center text-zinc-400 leading-tight">Free</div>
                  <div className="text-[10px] xs:text-xs sm:text-sm md:text-base font-bold text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent leading-tight">
                    {selectedPlan === 'pro' ? '⭐ Pro' : '👑 Ultra'}
                  </div>
                </div>
                
                {/* Feature Rows - Scrollable */}
                <div className="flex-1 space-y-0.5 xs:space-y-1 overflow-y-auto custom-scrollbar pr-1">
                  {allFeatures
                    .filter((feature) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      return selectedValue !== false;
                    })
                    .map((feature, index) => {
                      const selectedValue = selectedPlan === 'pro' ? feature.pro : feature.ultra;
                      
                      return (
                        <div key={index} className="grid grid-cols-3 gap-1.5 xs:gap-2 sm:gap-3 md:gap-4 py-1 xs:py-1.5 sm:py-2 md:py-3 px-1 xs:px-1.5 sm:px-2 md:px-3 rounded-md sm:rounded-lg hover:bg-white/5 transition-all duration-200 backdrop-blur-sm border border-transparent hover:border-zinc-700/50">
                          <div className="text-[10px] xs:text-xs sm:text-sm md:text-base font-medium text-white flex items-center leading-tight">
                            {feature.name}
                          </div>
                          <div className="flex justify-center items-center">
                            {feature.free === false ? (
                              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <X className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-600" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Check className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-green-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex justify-center items-center">
                            {selectedValue === false ? (
                              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-zinc-800/50 flex items-center justify-center">
                                <X className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-zinc-600" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center border border-blue-400/30">
                                <Check className="w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
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
            <div className="w-full lg:w-5/12 p-2 xs:p-3 sm:p-4 md:p-5 lg:p-8 flex flex-col bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/30 overflow-y-auto">
              <div className="mb-2 xs:mb-3 sm:mb-4 md:mb-6 flex-shrink-0">
                <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 xs:mb-1.5 sm:mb-2 md:mb-3 bg-gradient-to-r from-zinc-900 to-zinc-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent leading-tight">
                  Choose Your Plan
                </h2>
                <p className="text-zinc-600 dark:text-zinc-400 text-[10px] xs:text-xs sm:text-sm md:text-base leading-tight">Unlock unlimited access to all AI models</p>
              </div>

              {/* Plan Tabs */}
              <Tabs value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as 'pro' | 'ultra')} className="mb-2 xs:mb-3 sm:mb-4 md:mb-5 flex-shrink-0">
                <TabsList className="grid w-full grid-cols-2 h-8 xs:h-9 sm:h-10 md:h-12 bg-zinc-100 dark:bg-zinc-900 p-0.5 xs:p-1 sm:p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-md sm:rounded-lg md:rounded-xl">
                  <TabsTrigger 
                    value="pro" 
                    className="text-[10px] xs:text-xs sm:text-sm font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-sm xs:rounded-md sm:rounded-lg transition-all py-1"
                  >
                    <Zap className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-0.5 xs:mr-1 sm:mr-2" />
                    <span className="hidden xs:inline">Pro</span>
                    <span className="xs:hidden">Pro</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra" 
                    className="text-[10px] xs:text-xs sm:text-sm font-bold data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-sm xs:rounded-md sm:rounded-lg transition-all py-1"
                  >
                    <Crown className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4 mr-0.5 xs:mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ultra Pro</span>
                    <span className="sm:hidden">Ultra</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Billing Period Options */}
              <div className="space-y-1.5 xs:space-y-2 sm:space-y-3 mb-2 xs:mb-3 sm:mb-4 md:mb-5 flex-1 min-h-0">
                <button
                  onClick={() => setSelectedPeriod('monthly')}
                  className={`w-full p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-md sm:rounded-lg md:rounded-xl border transition-all duration-300 text-left group relative overflow-hidden ${
                    selectedPeriod === 'monthly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-lg sm:shadow-xl scale-[1.01] sm:scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md sm:hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  {selectedPeriod === 'monthly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10 gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg mb-0 xs:mb-0.5 sm:mb-1 text-zinc-900 dark:text-white leading-tight">Monthly</div>
                      <div className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-tight">
                        Billed monthly
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-zinc-900 dark:text-white leading-tight">€{pricingOptions[selectedPlan].monthly.price}</div>
                      <div className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-0 xs:mt-0.5 sm:mt-1 leading-tight">/month</div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedPeriod('yearly')}
                  className={`w-full p-2 xs:p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-md sm:rounded-lg md:rounded-xl border transition-all duration-300 text-left relative group overflow-hidden ${
                    selectedPeriod === 'yearly'
                      ? 'border-blue-500 dark:border-blue-400 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 shadow-lg sm:shadow-xl scale-[1.01] sm:scale-[1.02]'
                      : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md sm:hover:shadow-lg bg-white dark:bg-zinc-950'
                  }`}
                >
                  <Badge className="absolute -top-1 xs:-top-1.5 sm:-top-2 right-1 xs:right-2 sm:right-3 md:right-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md sm:shadow-lg px-1.5 xs:px-2 sm:px-3 py-0.5 text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold border-0">
                    Save {pricingOptions[selectedPlan].yearly.savings}%
                  </Badge>
                  {selectedPeriod === 'yearly' && (
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 dark:from-blue-400/5 dark:to-purple-400/5"></div>
                  )}
                  <div className="flex justify-between items-center relative z-10 gap-2">
                    <div className="flex-1">
                      <div className="font-bold text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg mb-0 xs:mb-0.5 sm:mb-1 text-zinc-900 dark:text-white leading-tight">Yearly</div>
                      <div className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 leading-tight">
                        Best value
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-baseline gap-0.5 xs:gap-1 sm:gap-2 justify-end">
                        <div className="font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-zinc-900 dark:text-white leading-tight">€{pricingOptions[selectedPlan].yearly.price}</div>
                        <div className="text-[10px] xs:text-xs sm:text-sm md:text-base lg:text-lg text-zinc-400 dark:text-zinc-600 line-through leading-tight">€{pricingOptions[selectedPlan].monthly.price}</div>
                      </div>
                      <div className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-0 xs:mt-0.5 sm:mt-1 leading-tight">/month</div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Continue Button */}
              <Button 
                onClick={handleSubscribe}
                disabled={isLoading}
                className="w-full h-9 xs:h-10 sm:h-11 md:h-12 lg:h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-[11px] xs:text-xs sm:text-sm md:text-base shadow-xl sm:shadow-2xl hover:shadow-blue-500/50 transition-all rounded-md sm:rounded-lg md:rounded-xl border-0 flex-shrink-0 hover:scale-[1.01] sm:hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 xs:mr-2" />
                    <span className="text-[10px] xs:text-xs sm:text-sm">Processing...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden md:inline">Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra Pro'} Plan</span>
                    <span className="hidden sm:inline md:hidden">Subscribe to {selectedPlan === 'pro' ? 'Pro' : 'Ultra'}</span>
                    <span className="sm:hidden">Subscribe Now</span>
                    <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 ml-1 xs:ml-1.5 sm:ml-2" />
                  </>
                )}
              </Button>

              {/* Footer */}
              <div className="mt-2 xs:mt-2.5 sm:mt-3 md:mt-4 lg:mt-5 space-y-1.5 xs:space-y-2 sm:space-y-3 flex-shrink-0">
                {/* Payment Cards */}
                <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-3 py-0.5 xs:py-1 sm:py-2">
                  {/* Visa */}
                  <div className="w-8 h-6 xs:w-9 xs:h-6 sm:w-10 sm:h-7 md:w-12 md:h-8 bg-white dark:bg-zinc-900 rounded sm:rounded-md md:rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-2.5 xs:h-3 sm:h-3.5 md:h-4" viewBox="0 0 48 16" fill="none">
                      <path d="M20.8 14.4h-3.2L19.6 1.6h3.2l-2 12.8zm13.2-12.5c-.6-.2-1.6-.5-2.8-.5-3.1 0-5.3 1.7-5.3 4 0 1.8 1.5 2.7 2.7 3.3 1.2.6 1.6 1 1.6 1.5 0 .8-.9 1.2-1.8 1.2-1.2 0-1.8-.2-2.8-.6l-.4-.2-.4 2.5c.7.3 2.1.6 3.5.6 3.3 0 5.4-1.6 5.4-4.2 0-1.4-.8-2.4-2.6-3.3-1.1-.6-1.7-.9-1.7-1.5 0-.5.6-1 1.8-1 1 0 1.7.2 2.3.4l.3.1.4-2.3zm5.8-2.3h-2.5c-.8 0-1.3.2-1.7 1l-4.8 11.5h3.3l.7-1.9h4.1l.4 1.9h2.9l-2.4-12.5zm-3.7 8.1l1.7-4.7.9 4.7h-2.6zM15.5 1.6l-3.1 8.7-.3-1.7c-.6-1.9-2.3-4-4.3-5l2.9 10.7h3.3l4.9-12.7h-3.4z" fill="#1434CB"/>
                      <path d="M7.8 1.6H2.6L2.5 2c3.9.9 6.5 3.2 7.5 5.9l-1.1-5.2c-.2-.8-.7-1-.9-1.1z" fill="#F7A600"/>
                    </svg>
                  </div>
                  {/* Mastercard */}
                  <div className="w-8 h-6 xs:w-9 xs:h-6 sm:w-10 sm:h-7 md:w-12 md:h-8 bg-white dark:bg-zinc-900 rounded sm:rounded-md md:rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-3 xs:h-3.5 sm:h-4 md:h-5" viewBox="0 0 32 20" fill="none">
                      <circle cx="11" cy="10" r="9" fill="#EB001B"/>
                      <circle cx="21" cy="10" r="9" fill="#F79E1B"/>
                      <path d="M16 14.2c1.1-1.2 1.8-2.7 1.8-4.2 0-1.5-.7-3-1.8-4.2-1.1 1.2-1.8 2.7-1.8 4.2 0 1.5.7 3 1.8 4.2z" fill="#FF5F00"/>
                    </svg>
                  </div>
                  {/* American Express */}
                  <div className="w-8 h-6 xs:w-9 xs:h-6 sm:w-10 sm:h-7 md:w-12 md:h-8 bg-white dark:bg-zinc-900 rounded sm:rounded-md md:rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                    <svg className="h-2.5 xs:h-3 sm:h-3.5 md:h-4" viewBox="0 0 32 20" fill="none">
                      <rect width="32" height="20" rx="2" fill="#006FCF"/>
                      <path d="M8.5 7.5h2.7l-.7 1.8h-2l-.5 1.2h2l-.7 1.8h-2l-.5 1.2h2.7l-.7 1.8H5.5l2.4-6h.6v-1.8zm6.8 0l-1.8 4.8h-.1l-.9-4.8h-2.4l2.4 6h2.4l2.4-6h-2zm6.2 1.8h-2.4l.4-1.8h7.2l-.4 1.8h-2.4l-2 4.2h-2.4l2-4.2z" fill="white"/>
                    </svg>
                  </div>
                </div>

                <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-center text-zinc-500 dark:text-zinc-500 leading-relaxed px-1 xs:px-2 sm:px-0">
                  By subscribing, you agree to our{' '}
                  <a href="/terms" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Terms</a>,{' '}
                  <a href="/privacy" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Privacy</a>, and{' '}
                  <a href="/refund-policy" className="underline hover:text-zinc-900 dark:hover:text-white transition-colors">Refund Policy</a>
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};
