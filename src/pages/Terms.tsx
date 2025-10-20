import React from 'react';
import SEO from '@/components/SEO';
import { Card } from '@/components/ui/card';
import { Shield, FileText, AlertCircle, Scale, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <SEO 
        title={t('terms.title')}
        description={t('terms.seoDesc')}
      />
      
      {/* Hero Section */}
      <div className="bg-primary/5 border-b">
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('terms.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('terms.lastUpdated')}
          </p>
        </div>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-6">

          <Card className="p-8 mb-6 border-primary/20 bg-card/50 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <Shield className="w-6 h-6 text-primary mt-1" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Who We Are</h2>
                <p className="text-muted-foreground leading-relaxed">
                  ChatLearn ("we," "us," or "our") is an advanced AI platform that unifies access to multiple world-class Large Language Models (LLMs) and text-to-image systems under one secure interface and membership.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Our current integrations include (subject to change):</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Language Models
                </h3>
                <ul className="space-y-3 pl-4">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>GPT-5, GPT-4o, GPT-4o mini by OpenAI</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>Claude Sonnet 4 by Anthropic</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>Gemini 2.5 Flash by Google DeepMind</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>Grok 4 by xAI</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>DeepSeek V2 by DeepSeek</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Image Model
                </h3>
                <ul className="space-y-3 pl-4">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>DALL-E 3 by OpenAI</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Disclaimer</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    ChatLearn is an independent platform and is not affiliated with, sponsored by, or endorsed by any of the AI model providers integrated into the Service.
                  </p>
                  <p>
                    This includes, but is not limited to: OpenAI, Anthropic, Google DeepMind, xAI, DeepSeek, and Stability AI.
                  </p>
                  <p>
                    All trademarks, brand names, and model names such as GPT-5, Claude Sonnet 4, Gemini 2.5 Flash, Grok 4, DeepSeek V2, and DALL-E 3 are the property of their respective owners.
                  </p>
                  <p>
                    ChatLearn accesses these technologies exclusively through official APIs and legitimate service agreements, ensuring compliant and secure usage.
                  </p>
                  <p>
                    We do not claim ownership, partnership, or operational control over any third-party models or providers.
                  </p>
                  <p className="font-medium text-foreground">
                    Our mission is to provide users with a unified, reliable interface to access multiple AI systems efficiently and securely.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              General Terms
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                By using ChatLearn ("the App," "the Platform," or "the Service"), you agree to these Terms of Use ("Terms") and our Privacy Policy.
              </p>
              <p>
                If you do not agree, you must not use the Service.
              </p>
              <p>
                Continued use of ChatLearn constitutes acceptance of these Terms and any updates made to them.
              </p>
              <p>
                ChatLearn shall not be liable for any direct or indirect damages, including data loss, revenue loss, or service interruptions.
              </p>
              <p>
                We reserve the right to modify pricing, plans, or usage policies at any time.
              </p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">License</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ChatLearn grants you a revocable, non-exclusive, non-transferable, limited license to use the Service strictly in accordance with these Terms.
              </p>
              <p>
                All rights not expressly granted are reserved by ChatLearn and its licensors.
              </p>
            </div>
          </Card>

          <Card className="p-8 mb-6 border-red-500/20 bg-red-500/5">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Restrictions</h2>
            <p className="mb-4 text-muted-foreground">You agree not to, and will not permit others to:</p>
            <ul className="space-y-3 pl-4">
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>License, sell, rent, or distribute the Service;</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>Copy, modify, or create derivative works of the platform;</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>Reverse-engineer or attempt to extract model data or API code;</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>Remove copyright or trademark notices;</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>Circumvent security or usage controls;</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>Use ChatLearn to create competing AI services;</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>Use outputs for unlawful, harmful, or deceptive purposes.</span>
              </li>
            </ul>
            <p className="mt-6 text-red-600 dark:text-red-400 font-medium">
              Violation of these restrictions may result in immediate account termination.
            </p>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Your Suggestions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Any feedback, comments, or ideas ("Suggestions") you provide shall be the exclusive property of ChatLearn, which may use them freely without credit or compensation.
            </p>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Third-Party Services and Model Availability</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ChatLearn integrates external AI models and APIs, including OpenAI, Anthropic, Google DeepMind, xAI, DeepSeek, and Stability AI.
              </p>
              <p>
                While we strive to maintain consistent access to all integrations, their continued availability depends on third-party providers.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">Model Availability</h3>
              <p className="mb-4">You acknowledge and agree that:</p>
              <ul className="space-y-3 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>The list of supported models may change at any time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>ChatLearn may add, suspend, or remove any model, feature, or integration temporarily or permanently at its sole discretion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>These changes may result from API cost changes, provider limitations, compliance obligations, or technical considerations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Such changes do not entitle users to refunds, compensation, or claims, as long as the core Service remains functional.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>Replacement or updated models with equivalent or enhanced capabilities may be introduced without notice.</span>
                </li>
              </ul>
              <p className="mt-4">
                We will make reasonable efforts to inform users about significant model changes.
              </p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <div className="flex items-start gap-4">
              <Lock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">Cookies and Privacy</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    We use cookies and analytics tools to operate, secure, and improve our platform.
                  </p>
                  <p>
                    You can manage or disable cookies at any time through your browser or consent manager.
                  </p>
                  <p>
                    Please see our Privacy Policy for full details.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-primary/5 border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Subscription Terms</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Certain features of ChatLearn are available through a paid subscription plan.
              </p>
              <p>
                Subscriptions renew automatically unless canceled before the renewal date.
              </p>
              <p className="font-medium text-foreground">
                Payments are non-refundable except as required by law.
              </p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Free Trial</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ChatLearn may offer a limited free trial (e.g., up to 3 messages) per user for evaluation purposes.
              </p>
              <p>
                The free trial is subject to fair-use and anti-abuse measures (including device, IP, and account checks). We may modify, suspend, or end the free trial at any time. Once the free quota is exhausted, continued use requires an active paid plan.
              </p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Fair Use and Additional Charges</h2>
            <p className="mb-4 text-muted-foreground">
              ChatLearn operates under a fair use policy to maintain platform stability and ensure equitable access for all users.
            </p>
            <p className="mb-4 text-muted-foreground">Users acknowledge and agree that:</p>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Each subscription plan includes specific resource limits (such as message volume, token count, or image generations).</li>
              <li>ChatLearn continuously monitors system usage to detect excessive or disproportionate activity.</li>
              <li>If your usage significantly exceeds your plan's fair-use limits, ChatLearn may:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>(a) temporarily restrict or throttle your access;</li>
                  <li>(b) offer an upgrade to a higher-capacity plan; or</li>
                  <li>(c) apply additional charges based on excess usage.</li>
                </ul>
              </li>
              <li>Any additional charges will be communicated transparently via email, invoice, or within your account dashboard prior to billing.</li>
              <li>Continued or repeated overuse without resolution may result in suspension or termination of your account.</li>
              <li>Usage metrics and thresholds are determined internally by ChatLearn and may evolve over time as system capacity or model costs change.</li>
              <li>These measures are in place to maintain a stable and cost-efficient experience for all users.</li>
            </ol>
          </Card>

          <Card className="p-8 mb-6 bg-primary/5 border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Company Information</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The ChatLearn platform is operated by TASOLAR, a company registered in the Republic of Cyprus.
              </p>
              <p>
                <strong className="text-foreground">Registered Office:</strong> Dimostheni Severi & Katsoni 2, Avenue Court, 1082 Nicosia, Cyprus
              </p>
              <p>
                <strong className="text-foreground">Email:</strong> <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
              </p>
              <p>
                <strong className="text-foreground">Website:</strong> <a href="https://chatl.ai" className="text-primary hover:underline">https://chatl.ai</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
