import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Sparkles, ChevronDown, Users, X, Star, Zap, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { UpgradeBlockedDialog } from '@/components/UpgradeBlockedDialog';

const Pricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscriptionStatus, checkSubscription } = useAuth();
  const { t } = useTranslation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeBlockedDialog, setShowUpgradeBlockedDialog] = useState(false);
  const [blockedPlanName, setBlockedPlanName] = useState('');
  const [pendingPlan, setPendingPlan] = useState<typeof plans[0] | null>(null);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TGsOnuDkIh9hVG': 'Pro',        // Pro Monthly
    'prod_TGqo8h59qNKZ4m': 'Pro',        // Pro 3-Month
    'prod_TGqqoPGWQJ0T4a': 'Pro',        // Pro Yearly
    'prod_TGqs5r2udThT0t': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TGquGexHO44m4T': 'Ultra Pro',  // Ultra Pro 3-Month
    'prod_TGqwVIWObYLt6U': 'Ultra Pro',  // Ultra Pro Yearly
  };

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check subscription status after successful payment
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('success') === 'true' && user) {
      console.log('[PRICING] Success param detected, checking subscription...');
      checkSubscription();
      toast.success('Subscription activated successfully!');
    }
  }, [location.search, user, checkSubscription]);

  // Debug: Log subscription status changes
  useEffect(() => {
    console.log('[PRICING] Subscription status updated:', subscriptionStatus);
  }, [subscriptionStatus]);
  const plans = [{
    name: t('pricingPage.free'),
    emoji: "🆓",
    price: 0,
    icon: Zap,
    description: t('pricingPage.freeDesc'),
    popular: false,
    features: [{
      text: t('pricingPage.accessToMiniOnly'),
      included: true
    }, {
      text: t('pricingPage.advancedModelsNotIncluded'),
      included: false
    }, {
      text: t('pricingPage.claudeNotIncluded'),
      included: false
    }, {
      text: t('pricingPage.voiceModeNotIncluded'),
      included: false
    }, {
      text: t('pricingPage.fileUploadsNotIncluded'),
      included: false
    }],
    buttonText: t('pricingPage.getStarted'),
    buttonVariant: "outline" as const
  }, {
    name: t('pricingPage.pro'),
    emoji: "⭐",
    price: 19.99,
    icon: Star,
    description: t('pricingPage.proDesc'),
    popular: true,
    features: [{
      text: t('pricing.proFeatures.gpt'),
      included: true
    }, {
      text: t('pricing.proFeatures.gemini'),
      included: true
    }, {
      text: t('pricingPage.claudeUltraOnly'),
      included: false
    }, {
      text: t('pricingPage.deepseekUltraOnly'),
      included: false
    }, {
      text: t('pricingPage.grokUltraOnly'),
      included: false
    }, {
      text: t('pricing.proFeatures.voiceMode'),
      included: true
    }, {
      text: t('pricing.proFeatures.askPdf'),
      included: true
    }, {
      text: t('pricing.proFeatures.prioritySupport'),
      included: true
    }, {
      text: t('pricingPage.whatsappComingSoon'),
      included: true
    }],
    buttonText: t('pricingPage.subscribeNow'),
    buttonVariant: "default" as const
  }, {
    name: t('pricingPage.ultraPro'),
    emoji: "🚀",
    price: 39.99,
    icon: Crown,
    description: t('pricingPage.ultraProDesc'),
    popular: false,
    features: [{
      text: t('pricing.ultraFeatures.gpt'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.gemini'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.claude'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.deepseek'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.grok'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.voiceMode'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.askPdf'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.highPrioritySupport'),
      included: true
    }, {
      text: t('pricing.ultraFeatures.whatsapp'),
      included: false
    }],
    buttonText: t('pricingPage.subscribeNow'),
    buttonVariant: "outline" as const
  }];

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.price === 0) {
      navigate('/pricing');
      return;
    }
    
    if (!user) {
      setPendingPlan(plan);
      setShowAuthModal(true);
      return;
    }
    
    // Check if user already has an active subscription BEFORE showing any loading messages
    if (subscriptionStatus.subscribed && subscriptionStatus.product_id) {
      const currentPlanName = productToPlanMap[subscriptionStatus.product_id] || 'Unknown';
      setBlockedPlanName(currentPlanName);
      setShowUpgradeBlockedDialog(true);
      return;
    }
    
    try {
      // Map plan to price ID (monthly only)
      const priceIds = {
        'Pro': 'price_1SKKdNL8Zm4LqDn4gBXwrsAq',       // €19.99/month
        'Ultra Pro': 'price_1SKJAxL8Zm4LqDn43kl9BRd8'  // €39.99/month
      };
      
      const priceId = priceIds[plan.name as keyof typeof priceIds] || null;
      
      if (!priceId) {
        toast.error('Invalid plan selected');
        return;
      }
      
      // Show loading toast ONLY after subscription check passes
      toast.loading('Redirecting to checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      toast.dismiss(); // Dismiss loading toast
      
      if (error) {
        const errorMessage = error.message || '';
        
        // Provide user-friendly error messages
        if (errorMessage.includes('active subscription')) {
          toast.error('You already have an active subscription', {
            description: 'Please cancel your current plan first to switch plans',
            action: {
              label: 'Manage',
              onClick: () => navigate('/cancel-subscription')
            }
          });
        } else if (errorMessage.includes('authentication')) {
          toast.error('Authentication failed', {
            description: 'Please sign in and try again'
          });
        } else {
          toast.error('Failed to start checkout', {
            description: errorMessage
          });
        }
        console.error('Checkout error:', error);
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.dismiss(); // Dismiss loading toast on error
      console.error('Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      toast.error('Unable to process request', {
        description: errorMessage
      });
    }
  };

  const handleAuthSuccess = () => {
    if (pendingPlan) {
      // Retry the subscription after successful authentication
      setTimeout(() => {
        handleSubscribe(pendingPlan);
        setPendingPlan(null);
      }, 500);
    }
  };


  const NavBar = () => <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      
    </nav>;
  return <div className="min-h-screen bg-background">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 px-3 sm:px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/5 to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
        
        <div className="container max-w-6xl mx-auto text-center relative z-10">
          <Badge variant="secondary" className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20 text-primary animate-fade-in text-xs sm:text-sm">
            {t('pricingPage.flexiblePricing')}
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 animate-fade-in leading-tight">
            {t('pricingPage.chooseYourJourney').split(' ').slice(0, 2).join(' ')} <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">{t('pricingPage.chooseYourJourney').split(' ').slice(2).join(' ')}</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto animate-fade-in px-2 sm:px-0" style={{
          animationDelay: '0.1s'
        }}>
            {t('pricingPage.startFreeScale')}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 relative">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20">
            {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return <div key={plan.name} className={`group relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:scale-105 animate-fade-in ${plan.popular ? 'bg-gradient-to-b from-primary/5 to-primary/10 border-2 border-primary shadow-2xl shadow-primary/20' : 'bg-card border border-border hover:border-primary/30 hover:shadow-xl'}`} style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  {plan.popular && <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-3 sm:px-4 md:px-6 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold">
                        {t('pricingPage.mostPopular')}
                      </Badge>
                    </div>}
                  
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{plan.emoji} {plan.name}</h3>
                    <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold">
                        €{plan.price}
                      </span>
                      <span className="text-muted-foreground text-sm sm:text-base md:text-lg">
                        / {t('pricingPage.month')}
                      </span>
                    </div>
                    
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base">{plan.description}</p>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
                    {plan.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        {feature.included ? <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                          </div> : <div className="w-4 h-4 sm:w-5 sm:h-5 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <X className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
                          </div>}
                        <span className={`text-xs sm:text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {feature.text}
                        </span>
                      </div>)}
                  </div>
                  
                  <Button 
                    className={`w-full h-10 sm:h-11 md:h-12 text-sm sm:text-base md:text-lg font-semibold ${
                      plan.popular ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-lg' : ''
                    }`} 
                    variant={plan.buttonVariant} 
                    onClick={() => handleSubscribe(plan)}
                  >
                    {plan.buttonText + (plan.price > 0 ? ' →' : '')}
                  </Button>
                </div>;
          })}
          </div>

          {/* Comparison Table */}
          <div className="bg-gradient-to-br from-card to-muted/20 rounded-2xl sm:rounded-3xl border border-border p-4 sm:p-6 md:p-8 lg:p-10 mb-12 sm:mb-16 md:mb-20 animate-fade-in">
            <div className="text-center mb-6 sm:mb-8 md:mb-12">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">{t('pricingPage.comparePlans')}</h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">{t('pricingPage.compareSubtitle')}</p>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base md:text-lg">{t('pricingPage.features')}</th>
                    <th className="text-center py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                        <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-bold text-sm sm:text-base md:text-lg">{t('pricingPage.free')}</span>
                      </div>
                    </th>
                    <th className="text-center py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                        <span className="font-bold text-sm sm:text-base md:text-lg">{t('pricingPage.pro')}</span>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-[10px] sm:text-xs">
                          {t('pricingPage.popular')}
                        </Badge>
                      </div>
                    </th>
                    <th className="text-center py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                        <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="font-bold text-sm sm:text-base md:text-lg">{t('pricingPage.ultraPro')}</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 font-medium text-primary text-xs sm:text-sm md:text-base">{t('pricingPage.aiModels')}</td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">OpenAI GPT-4o</td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">{t('pricingPage.mini')}</Badge>
                    </td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">Anthropic Claude Haiku 4.5</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Google Gemini</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">DeepSeek V3</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Grok (X AI - Live Web)</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 font-medium text-primary text-xs sm:text-sm md:text-base">{t('pricingPage.features')}</td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">Ask PDF / Docs AI</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">{t('pricingPage.voiceMode')}</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">Priority Support</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/30">High</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">{t('pricingPage.whatsappComingSoon')}</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border-gray-500/30">Soon</Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-gray-500/10 text-gray-600 border-gray-500/30">Soon</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">{t('pricingPage.faqTitle')}</h3>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t('pricingPage.faqChangePlans')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">{t('pricingPage.faqChangePlansAnswer')}</p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t('pricingPage.faqFreeTrial')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">{t('pricingPage.faqFreeTrialAnswer')}</p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t('pricingPage.faqPaymentMethods')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">{t('pricingPage.faqPaymentMethodsAnswer')}</p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">{t('pricingPage.faqBilling')}</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">{t('pricingPage.faqBillingAnswer')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
        initialMode="signup"
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      <UpgradeBlockedDialog 
        isOpen={showUpgradeBlockedDialog}
        onClose={() => setShowUpgradeBlockedDialog(false)}
        currentPlan={blockedPlanName}
      />
    </div>;
};
export default Pricing;