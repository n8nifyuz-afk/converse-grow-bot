import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Check, Sparkles, ChevronDown, Users, X, Star, Zap, Crown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';
import { UpgradeBlockedDialog } from '@/components/UpgradeBlockedDialog';

const Pricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, subscriptionStatus, checkSubscription } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeBlockedDialog, setShowUpgradeBlockedDialog] = useState(false);
  const [blockedPlanName, setBlockedPlanName] = useState('');
  const [pendingPlan, setPendingPlan] = useState<typeof plans[0] | null>(null);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TFjbArlYa9GMQr': 'Pro',        // Pro Daily
    'prod_TDSbUWLqR3bz7k': 'Pro',        // Pro Monthly
    'prod_TEx5Xda5BPBuHv': 'Pro',        // Pro Yearly
    'prod_TDSbGJB9U4Xt7b': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TDSHzExQNjyvJD': 'Ultra Pro',  // Ultra Pro Yearly
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
    name: "Free",
    emoji: "🆓",
    price: 0,
    yearlyPrice: 0,
    icon: Zap,
    description: "Get started free, upgrade anytime.",
    popular: false,
    features: [{
      text: "Access to GPT-4o Mini only",
      included: true
    }, {
      text: "GPT-5, Claude, Gemini, DeepSeek, Grok",
      included: false
    }, {
      text: "Voice mode",
      included: false
    }, {
      text: "Advanced file uploads",
      included: false
    }, {
      text: "Advanced search",
      included: false
    }, {
      text: "Premium features",
      included: false
    }],
    buttonText: "Get Started",
    buttonVariant: "outline" as const
  }, {
    name: "Pro",
    emoji: "⭐",
    price: 19.99,
    yearlyPrice: 15.99,
    icon: Star,
    description: "For professionals",
    popular: true,
    features: [{
      text: "Access to all AI models: GPT-4, GPT-5, Claude, Gemini, DeepSeek, Grok",
      included: true
    }, {
      text: "Unlimited chats & model switching",
      included: true
    }, {
      text: "Voice mode (text-to-speech)",
      included: true
    }, {
      text: "File uploads (up to 100MB)",
      included: true
    }, {
      text: "Chat with PDFs (full access)",
      included: true
    }, {
      text: "Image generation (500 / month)",
      included: true
    }, {
      text: "Priority support",
      included: true
    }],
    buttonText: "Subscribe Now",
    buttonVariant: "default" as const
  }, {
    name: "Ultra Pro",
    emoji: "🚀",
    price: 39.99,
    yearlyPrice: 31.99,
    icon: Crown,
    description: "For teams & power users",
    popular: false,
    features: [{
      text: "Everything in Pro",
      included: true
    }, {
      text: "Extended file & message limits",
      included: true
    }, {
      text: "Premium 24/7 support",
      included: true
    }, {
      text: "Image generation (2,000 / month)",
      included: true
    }, {
      text: "Team collaboration features",
      included: true
    }, {
      text: "Early access to new models",
      included: true
    }],
    buttonText: "Subscribe Now",
    buttonVariant: "outline" as const
  }];
  const getPrice = (plan: typeof plans[0]) => {
    return isYearly ? plan.yearlyPrice : plan.price;
  };
  const getSavings = (plan: typeof plans[0]) => {
    if (plan.price === 0) return 0;
    return Math.round((plan.price - plan.yearlyPrice) / plan.price * 100);
  };

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.price === 0) {
      navigate('/chat');
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
      // Map plan to price ID based on billing period
      const priceIds = {
        'Pro': {
          daily: 'price_1SJE8mL8Zm4LqDn4Qseyrms6',
          monthly: 'price_1SH1g3L8Zm4LqDn4WSyw1BzA',
          yearly: 'price_1SITBGL8Zm4LqDn4fd4JLVDA'
        },
        'Ultra Pro': {
          monthly: 'price_1SH1gHL8Zm4LqDn4wDQIGntf',
          yearly: 'price_1SH1MjL8Zm4LqDn40swOy4Ar'
        }
      };
      
      const planPrices = priceIds[plan.name as keyof typeof priceIds];
      const priceId = planPrices ? (isYearly ? planPrices.yearly : planPrices.monthly) : null;
      
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
            Flexible Pricing
          </Badge>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 animate-fade-in leading-tight">
            Choose Your <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">AI Journey</span>
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto animate-fade-in px-2 sm:px-0" style={{
          animationDelay: '0.1s'
        }}>
            Start free and scale with powerful AI models that grow with your needs.
          </p>

          {/* Billing Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in" style={{
          animationDelay: '0.2s'
        }}>
            <span className={`text-xs sm:text-sm font-medium transition-colors ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button onClick={() => setIsYearly(!isYearly)} className={`relative w-14 h-7 sm:w-16 sm:h-8 rounded-full transition-colors duration-300 ${isYearly ? 'bg-primary' : 'bg-muted'}`}>
              <div className={`absolute top-1 left-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? 'translate-x-7 sm:translate-x-8' : 'translate-x-0'}`}></div>
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-xs sm:text-sm font-medium transition-colors ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              {isYearly && <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30 animate-scale-in text-xs">
                  Save up to 20%
                </Badge>}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 relative">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 md:mb-20">
            {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            const currentPrice = getPrice(plan);
            const savings = getSavings(plan);
            return <div key={plan.name} className={`group relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl transition-all duration-500 hover:scale-105 animate-fade-in ${plan.popular ? 'bg-gradient-to-b from-primary/5 to-primary/10 border-2 border-primary shadow-2xl shadow-primary/20' : 'bg-card border border-border hover:border-primary/30 hover:shadow-xl'}`} style={{
              animationDelay: `${index * 0.1}s`
            }}>
                  {plan.popular && <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-primary to-purple-600 text-white px-3 sm:px-4 md:px-6 py-0.5 sm:py-1 text-xs sm:text-sm font-semibold">
                        Most Popular
                      </Badge>
                    </div>}
                  
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{plan.emoji} {plan.name}</h3>
                    <div className="flex items-baseline gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-2xl sm:text-3xl md:text-4xl font-bold">
                        €{currentPrice}
                      </span>
                      <span className="text-muted-foreground text-sm sm:text-base md:text-lg">
                        / month
                      </span>
                    </div>
                    
                    {isYearly && savings > 0 && <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30 mb-1 sm:mb-2 text-xs">
                        Save {savings}%
                      </Badge>}
                    
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
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 md:mb-4">Compare Plans</h3>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Choose the perfect plan for your AI journey</p>
            </div>
            
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px] sm:min-w-0">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left py-3 sm:py-4 md:py-6 px-3 sm:px-4 md:px-6 font-semibold text-sm sm:text-base md:text-lg">Features</th>
                    <th className="text-center py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-6">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                          <Zap className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="font-bold text-sm sm:text-base md:text-lg">Free</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => navigate('/chat')} className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                          Get started
                        </Button>
                      </div>
                    </th>
                    <th className="text-center py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-6">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                          <Star className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          <span className="font-bold text-sm sm:text-base md:text-lg">Pro</span>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 text-[10px] sm:text-xs">
                            Popular
                          </Badge>
                        </div>
                        <Button size="sm" className="bg-gradient-to-r from-primary to-purple-600 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3" onClick={() => handleSubscribe(plans[1])}>
                          Subscribe
                        </Button>
                      </div>
                    </th>
                    <th className="text-center py-3 sm:py-4 md:py-6 px-2 sm:px-3 md:px-6">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                          <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
                          <span className="font-bold text-sm sm:text-base md:text-lg">Ultra Pro</span>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleSubscribe(plans[2])} className="text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3">
                          Subscribe
                        </Button>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 font-medium text-primary text-xs sm:text-sm md:text-base">AI Models</td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">OpenAI GPT-4o</td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">Mini</Badge>
                    </td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Anthropic Claude</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Google Gemini</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">DeepSeek</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-5 px-6 font-medium text-primary">Features</td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                    <td className="py-5 px-6"></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Image Generation</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">500/mo</Badge>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/30">2K/mo</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Voice Mode</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6">Chat with Files</td>
                    <td className="py-4 px-6 text-center"><X className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-4 px-6 text-center"><Check className="h-5 w-5 text-green-500 mx-auto" /></td>
                    <td className="py-4 px-6 text-center">
                      <Badge variant="secondary" className="bg-orange-500/10 text-orange-600 border-orange-500/30">Extended</Badge>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-xs sm:text-sm md:text-base">Web Search</td>
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-center"><X className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mx-auto" /></td>
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-center"><Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mx-auto" /></td>
                    <td className="py-3 sm:py-4 md:py-5 px-3 sm:px-4 md:px-6 text-center"><Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="text-center mb-10 sm:mb-12 md:mb-16 animate-fade-in">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 px-2 sm:px-0">Frequently Asked Questions</h3>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Can I change plans anytime?</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Is there a free trial?</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">Our Free plan gives you access to GPT-4.1 Mini with no time limit. Upgrade when ready for more features.</p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">What payment methods do you accept?</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">We accept all major credit cards, PayPal, and other secure payment methods.</p>
              </div>
              <div className="p-4 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">How does billing work?</h4>
                <p className="text-muted-foreground text-xs sm:text-sm">You'll be charged monthly or yearly based on your chosen plan. No hidden fees or surprises.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <AuthModal
        isOpen={showAuthModal}
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