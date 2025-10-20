import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  X, 
  Zap, 
  Star, 
  Gem, 
  Bot,
  ImageIcon,
  FileText,
  Search,
  Mic,
  Upload,
  Palette,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import AuthModal from '@/components/AuthModal';
import { supabase } from '@/integrations/supabase/client';

interface PlanFeature {
  name: string;
  free: boolean | string;
  pro: boolean | string;
  ultraPro: boolean | string;
}

const features: PlanFeature[] = [
  {
    name: 'Access to OpenAI GPT-4.1 Mini',
    free: true,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Access to multiple AI models',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Unlimited chats with all models',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Custom bots built for specific use cases',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Unlimited file uploads',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Advanced web search capabilities',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Image Generation',
    free: '3,600/ month',
    pro: true,
    ultraPro: true
  },
  {
    name: 'Image Analysis',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Chat with Files',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'AI Search Engine',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Text-to-speech voice mode',
    free: false,
    pro: true,
    ultraPro: true
  },
  {
    name: 'Extended limits on messages, file uploads, advanced data analysis, and image generation',
    free: false,
    pro: true,
    ultraPro: true
  }
];

const faqData = [
  {
    question: 'What are the main features of Chatbot App?',
    answer: 'Chatbot App provides access to multiple AI models including OpenAI GPT-5, Anthropic Claude, Google Gemini, and DeepSeek. You can chat with AI, generate and analyze images, upload and analyze files, use advanced web search, and access custom AI tools for specific tasks.'
  },
  {
    question: 'How do I access the AI models?',
    answer: 'Once you have a subscription, you can access different AI models through the chat interface. Simply select your preferred model from the available options and start chatting. Each model has its own strengths and specializations.'
  },
  {
    question: 'Which AI models are available on Chatbot App?',
    answer: 'We offer access to the latest and most powerful AI models including OpenAI GPT-4o, GPT-4.1, Anthropic Claude, Google Gemini, DeepSeek, DeepSeek R1, Grok-3 Mini, and Grok-4. Free users get access to OpenAI GPT-4.1 Mini.'
  },
  {
    question: 'What file types can I upload and analyze?',
    answer: 'You can upload various file types including PDFs, images (JPG, PNG, WEBP), documents (DOCX, TXT), spreadsheets, and more. Our AI can analyze content, extract information, summarize documents, and answer questions about your files.'
  },
  {
    question: 'How does the image generation work?',
    answer: 'Our image generation feature uses advanced AI models to create stunning images from text descriptions. Pro users get unlimited access, while free users get 3,600 images per month. You can specify styles, dimensions, and detailed prompts.'
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time from your account settings. Your subscription will remain active until the end of your current billing period, after which you\'ll be moved to the free plan.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'We offer a free plan that includes access to OpenAI GPT-4.1 Mini with limited messages per month. This allows you to try our platform before upgrading to a paid plan for full access to all features.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. All payments are processed securely through our payment partners.'
  }
];

export default function PricingPlans() {
  const { user, subscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TGsOnuDkIh9hVG': 'Pro',        // Pro Monthly
    'prod_TGqo8h59qNKZ4m': 'Pro',        // Pro 3-Month
    'prod_TGqqoPGWQJ0T4a': 'Pro',        // Pro Yearly
    'prod_TGqs5r2udThT0t': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TGquGexHO44m4T': 'Ultra Pro',  // Ultra Pro 3-Month
    'prod_TGqwVIWObYLt6U': 'Ultra Pro',  // Ultra Pro Yearly
  };

  const handleSubscribe = async (plan: 'pro' | 'ultra_pro') => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      // Price IDs based on billing period
      const priceIds = {
        'pro': {
          monthly: 'price_1SKKdNL8Zm4LqDn4gBXwrsAq',
          yearly: 'price_1SKJ8cL8Zm4LqDn4jPkxLxeF'
        },
        'ultra_pro': {
          monthly: 'price_1SKJAxL8Zm4LqDn43kl9BRd8',
          yearly: 'price_1SKJEwL8Zm4LqDn4qcEFPlgP'
        }
      };
      
      const priceId = priceIds[plan][billingPeriod];
      
      toast.loading('Redirecting to checkout...');
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });
      
      if (error) {
        const errorMessage = error.message || 'Failed to create checkout session';
        
        // Provide user-friendly error messages
        if (errorMessage.includes('active subscription')) {
          toast.error('You already have an active subscription', {
            description: 'Please cancel your current plan first to switch plans'
          });
        } else {
          toast.error(errorMessage);
        }
        console.error('Checkout error:', error);
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error?.message || 'An error occurred. Please try again.');
    }
  };


  const getPricing = (plan: 'pro' | 'ultra_pro') => {
    const prices = {
      pro: {
        daily: { price: 0.60, period: 'day', note: 'billed daily' },
        monthly: { price: 19.99, period: 'month' },
        yearly: { price: 15.99, period: 'month', note: 'billed annually', savings: 20 }
      },
      ultra_pro: {
        monthly: { price: 39.99, period: 'month' },
        yearly: { price: 31.99, period: 'month', note: 'billed annually', savings: 20 }
      }
    };
    
    const pricing = prices[plan][billingPeriod];
    return {
      ...pricing,
      note: 'note' in pricing ? pricing.note : undefined,
      savings: 'savings' in pricing ? pricing.savings : 0
    };
  };

  return (
    <div className="container mx-auto p-3 sm:p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Pricing Plan</h1>
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 px-2 sm:px-0">
          Unlock the full potential of Chatbot App with advanced plans.
        </p>

        {/* Billing Period Selector */}
        <div className="inline-flex bg-muted rounded-lg p-1 mb-6 sm:mb-8 w-full max-w-md sm:w-auto">
          <Button
            variant={billingPeriod === 'daily' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('daily')}
            className="rounded-md flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Daily
          </Button>
          <Button
            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('monthly')}
            className="rounded-md flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Monthly
          </Button>
          <Button
            variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setBillingPeriod('yearly')}
            className="rounded-md flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Yearly <Badge variant="secondary" className="ml-1 text-[10px]">Save 20%</Badge>
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
        {/* Free Plan */}
        <Card className="relative border border-border/40 bg-background/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Free</CardTitle>
            <div className="text-2xl sm:text-3xl font-bold mt-3 sm:mt-4">€0</div>
            <CardDescription className="mt-2 text-xs sm:text-sm">
              Start free, upgrade anytime.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full mb-4 sm:mb-6 h-9 sm:h-10 text-sm"
              disabled
            >
              Current Plan
            </Button>

            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">What's included:</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Access to OpenAI GPT-4.1 Mini</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Access to multiple top AI models</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Unlimited chats with all models</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Custom bots built for specific use cases</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Unlimited file uploads</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Advanced web search capabilities</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Image Generation</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Chat with PDF files</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Pro Plan */}
        <Card className="relative border border-primary/40 bg-background/50 backdrop-blur-sm">
          <Badge className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs">
            Most Popular
          </Badge>
          <CardHeader className="text-center pb-4 sm:pb-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Star className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Pro</CardTitle>
            <div className="mt-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                €{(getPricing('pro').price / 30 * 1).toFixed(2)} Per Day
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              €{getPricing('pro').price}
              {billingPeriod === 'yearly' && getPricing('pro').savings > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  Save {getPricing('pro').savings}%
                </Badge>
              )}
            </div>
            <CardDescription className="mt-2 text-xs sm:text-sm">
              per {getPricing('pro').period}{getPricing('pro').note ? `, ${getPricing('pro').note}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleSubscribe('pro')}
              className="w-full mb-4 sm:mb-6 bg-primary hover:bg-primary/90 h-9 sm:h-10 text-sm"
              disabled={subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Pro'}
            >
              {subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Pro' 
                ? '✓ Current Plan'
                : 'Subscribe'}
            </Button>

            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">What's included:</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Access to multiple AI models, including OpenAI GPT-5, Anthropic Claude, Google Gemini and DeepSeek</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited chats with all models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Extended limits on messages, file uploads, advanced data analysis, and image generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Text-to-speech voice mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Custom bots built for specific use cases</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited file uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Advanced web search capabilities</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Ultra Pro Plan */}
        <Card className="relative border border-border/40 bg-background/50 backdrop-blur-sm">
          <CardHeader className="text-center pb-4 sm:pb-6">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
              <Gem className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl sm:text-2xl">Ultra Pro</CardTitle>
            <div className="mt-2">
              <span className="text-xs sm:text-sm text-muted-foreground">
                €{(getPricing('ultra_pro').price / 30 * 1).toFixed(2)} Per Day
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold">
              €{getPricing('ultra_pro').price}
              {billingPeriod === 'yearly' && getPricing('ultra_pro').savings > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs bg-green-500/10 text-green-600 border-green-500/30">
                  Save {getPricing('ultra_pro').savings}%
                </Badge>
              )}
            </div>
            <CardDescription className="mt-2 text-xs sm:text-sm">
              per {getPricing('ultra_pro').period}{getPricing('ultra_pro').note ? `, ${getPricing('ultra_pro').note}` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => handleSubscribe('ultra_pro')}
              className="w-full mb-4 sm:mb-6 bg-primary hover:bg-primary/90 h-9 sm:h-10 text-sm"
              disabled={subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Ultra Pro'}
            >
              {subscriptionStatus.product_id && productToPlanMap[subscriptionStatus.product_id] === 'Ultra Pro'
                ? '✓ Current Plan'
                : 'Subscribe'}
            </Button>

            <div className="space-y-3 sm:space-y-4">
              <h4 className="font-semibold text-sm sm:text-base">What's included:</h4>
              <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Access to multiple AI models, including OpenAI GPT-5, Anthropic Claude, Google Gemini and DeepSeek</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited chats with all models</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Extended limits on messages, file uploads, advanced data analysis, and image generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Text-to-speech voice mode</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Custom bots built for specific use cases</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Unlimited file uploads</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                  <span>Advanced web search capabilities</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compare Plans Table */}
      <div className="mb-10 sm:mb-12 md:mb-16">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Compare Plans</h2>
        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full min-w-[600px] sm:min-w-0 border-collapse bg-background rounded-lg overflow-hidden shadow-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm md:text-base">Features</th>
                <th className="text-center p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm md:text-base">Free</th>
                <th className="text-center p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm md:text-base">Pro</th>
                <th className="text-center p-2 sm:p-3 md:p-4 font-semibold text-xs sm:text-sm md:text-base">Ultra Pro</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, index) => (
                <tr key={index} className="border-b border-border/20">
                  <td className="p-2 sm:p-3 md:p-4 font-medium text-xs sm:text-sm">{feature.name}</td>
                  <td className="text-center p-2 sm:p-3 md:p-4">
                    {typeof feature.free === 'boolean' ? (
                      feature.free ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-xs sm:text-sm text-muted-foreground">{feature.free}</span>
                    )}
                  </td>
                  <td className="text-center p-2 sm:p-3 md:p-4">
                    {typeof feature.pro === 'boolean' ? (
                      feature.pro ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-xs sm:text-sm">{feature.pro}</span>
                    )}
                  </td>
                  <td className="text-center p-2 sm:p-3 md:p-4">
                    {typeof feature.ultraPro === 'boolean' ? (
                      feature.ultraPro ? (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground mx-auto" />
                      )
                    ) : (
                      <span className="text-xs sm:text-sm">{feature.ultraPro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6 md:mb-8">Frequently Asked Questions</h2>
        <p className="text-center text-muted-foreground mb-6 sm:mb-8 text-sm sm:text-base px-2 sm:px-0">
          Find answers to your questions about plans, pricing, and features.
        </p>
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-sm sm:text-base">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          toast.success('Welcome! Please select your plan.');
        }}
      />
    </div>
  );
}