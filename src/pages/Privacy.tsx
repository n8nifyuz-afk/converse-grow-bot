import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, FileText, Globe, Scale, Trash2, Mail } from 'lucide-react';
import SEO from '@/components/SEO';
import { useTranslation } from 'react-i18next';

export default function Privacy() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${t('privacy.title')} - ChatLearn`}
        description={t('privacy.seoDesc')}
        canonical="https://chatl.ai/privacy"
      />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 sm:mb-6">
            <Shield className="h-3 w-3 mr-2" />
            {t('privacy.legalDoc')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            {t('privacy.title')}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-2">
            {t('privacy.lastUpdated')}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t('privacy.intro')}
          </p>
        </div>
      </section>

      {/* Quick Links Navigation */}
      <section className="py-8 px-4 bg-muted/20 border-b">
        <div className="container max-w-5xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">{t('privacy.quickLinks')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <a href="#definitions" className="text-primary hover:underline">{t('privacy.definitions')}</a>
            <a href="#data-categories" className="text-primary hover:underline">{t('privacy.dataCategories')}</a>
            <a href="#how-we-use" className="text-primary hover:underline">{t('privacy.howWeUse')}</a>
            <a href="#how-we-disclose" className="text-primary hover:underline">{t('privacy.howWeDisclose')}</a>
            <a href="#international" className="text-primary hover:underline">{t('privacy.international')}</a>
            <a href="#retention" className="text-primary hover:underline">{t('privacy.retention')}</a>
            <a href="#security" className="text-primary hover:underline">{t('privacy.security')}</a>
            <a href="#cookies" className="text-primary hover:underline">{t('privacy.cookies')}</a>
            <a href="#payment" className="text-primary hover:underline">{t('privacy.payment')}</a>
            <a href="#children" className="text-primary hover:underline">{t('privacy.children')}</a>
            <a href="#gdpr-rights" className="text-primary hover:underline">{t('privacy.gdprRights')}</a>
            <a href="#california" className="text-primary hover:underline">{t('privacy.california')}</a>
            <a href="#delete" className="text-primary hover:underline">{t('privacy.delete')}</a>
            <a href="#changes" className="text-primary hover:underline">{t('privacy.changes')}</a>
            <a href="#contact" className="text-primary hover:underline">{t('privacy.contact')}</a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container max-w-5xl mx-auto space-y-8">

          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <p className="leading-relaxed text-muted-foreground">
                By accessing or using the Service, you acknowledge that you have read and understood this Privacy Policy. 
                Where required by applicable law, we will obtain your explicit consent before collecting or processing your personal data.
              </p>
            </CardContent>
          </Card>

          {/* Definitions */}
          <Card id="definitions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Definitions and Key Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">Cookie</p>
                  <p className="text-sm text-muted-foreground">Small text file stored on your device by your browser. Used for essential operations, analytics, and preferences.</p>
                </div>
                <div>
                  <p className="font-semibold">Company / we / us / our</p>
                  <p className="text-sm text-muted-foreground">Refers to the ChatLearn platform operated by TASOLAR (Cyprus).</p>
                </div>
                <div>
                  <p className="font-semibold">Country / Jurisdiction</p>
                  <p className="text-sm text-muted-foreground">Republic of Cyprus (EU).</p>
                </div>
                <div>
                  <p className="font-semibold">Customer</p>
                  <p className="text-sm text-muted-foreground">An individual or organization subscribing to or using the Service.</p>
                </div>
                <div>
                  <p className="font-semibold">Device</p>
                  <p className="text-sm text-muted-foreground">Any internet-connected device (e.g., phone, tablet, computer).</p>
                </div>
                <div>
                  <p className="font-semibold">IP Address</p>
                  <p className="text-sm text-muted-foreground">Numeric label assigned to a device connected to the Internet (may approximate location).</p>
                </div>
                <div>
                  <p className="font-semibold">Personal Data</p>
                  <p className="text-sm text-muted-foreground">Any information relating to an identified or identifiable natural person.</p>
                </div>
                <div>
                  <p className="font-semibold">Service</p>
                  <p className="text-sm text-muted-foreground">The functionality and products provided by ChatLearn via https://chatl.ai.</p>
                </div>
                <div>
                  <p className="font-semibold">Third-Party Service Providers</p>
                  <p className="text-sm text-muted-foreground">External parties assisting us (e.g., hosting, analytics, payments, model API providers).</p>
                </div>
                <div>
                  <p className="font-semibold">You / User / Data Subject</p>
                  <p className="text-sm text-muted-foreground">The individual accessing or using the Service.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                About Our AI Integrations (Transparency)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                ChatLearn provides a unified interface to multiple AI models. Current integrations may include (subject to change):
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>OpenAI (GPT-5, GPT-4o, GPT-4o mini, DALL·E 3)</li>
                <li>Anthropic (Claude Sonnet 4)</li>
                <li>Google DeepMind (Gemini 2.5 Flash)</li>
                <li>xAI (Grok 4)</li>
                <li>DeepSeek V2</li>
              </ul>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-semibold mb-2">Disclaimer</p>
                <p className="text-sm text-muted-foreground">
                  ChatLearn is not affiliated with, sponsored, or endorsed by these providers. 
                  We access their technologies only via official APIs under lawful agreements. 
                  Prompts and inputs you submit may be sent to these providers only as needed to generate outputs, following this Policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Categories */}
          <Card id="data-categories">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Categories of Personal Data and Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                We process personal data under GDPR lawful bases (performance of contract, legal obligation, legitimate interests, consent).
              </p>

              {/* 1. Personal & Contact Information */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">1. Personal & Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Data:</span> Name, email, login identity (Google/Apple SSO), account identifiers.</p>
                  <p><span className="font-medium">Purpose:</span> Account management, authentication, support.</p>
                  <p><span className="font-medium">Legal basis:</span> Performance of a contract.</p>
                </div>
              </div>

              {/* 2. Technical & Security Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">2. Technical & Security Data</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Data:</span> IP address, device info, browser/OS, timestamps, referral URLs, diagnostic logs.</p>
                  <p><span className="font-medium">Purpose:</span> Security, fraud prevention, analytics.</p>
                  <p><span className="font-medium">Legal basis:</span> Legitimate interests.</p>
                </div>
              </div>

              {/* 3. Usage & Log Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">3. Usage & Log Data</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Data:</span> Session metadata, feature usage, crash/error data, model usage metrics.</p>
                  <p><span className="font-medium">Purpose:</span> Service improvement, abuse prevention.</p>
                  <p><span className="font-medium">Legal basis:</span> Legitimate interests.</p>
                </div>
              </div>

              {/* 4. Transaction & Subscription Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">4. Transaction & Subscription Data</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Data:</span> Plan tier, purchase history, invoice data, subscription status.</p>
                  <p><span className="font-medium">Purpose:</span> Billing, receipts, VAT compliance, customer support.</p>
                  <p><span className="font-medium">Legal basis:</span> Performance of a contract; legal obligation.</p>
                </div>
              </div>

              {/* 5. Marketing & Analytics Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">5. Marketing & Analytics Data</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Data:</span> Cookies, UTM parameters, engagement data, consent preferences.</p>
                  <p><span className="font-medium">Purpose:</span> Measure performance, personalize communications.</p>
                  <p><span className="font-medium">Legal basis:</span> Legitimate interests; consent (for non-essential cookies).</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use */}
          <Card id="how-we-use">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">We use your data to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-3">
                <li>Provide and maintain the Service</li>
                <li>Process your AI requests and generate outputs</li>
                <li>Manage your account and authentication</li>
                <li>Process payments and subscriptions</li>
                <li>Improve service quality and performance</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
                <li>Communicate with you about updates and support</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Disclose */}
          <Card id="how-we-disclose">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                How We Disclose Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We share data only as needed to operate the Service or comply with law:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>AI Model Providers:</strong> OpenAI, Anthropic, Google DeepMind, xAI, DeepSeek (for content generation).</li>
                <li><strong>Infrastructure & Security:</strong> Cloud hosting, CDN, DDoS protection, logging.</li>
                <li><strong>Payments:</strong> Stripe (billing, invoices, VAT). We do not store card data.</li>
                <li><strong>Analytics (optional):</strong> Privacy-aware tools such as GA4 or other consented cookies.</li>
                <li><strong>Professional Advisors:</strong> Legal, audit, compliance.</li>
                <li><strong>Authorities:</strong> If required by law or to protect rights and safety.</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or reorganization, subject to this Policy.</li>
              </ul>
              <p className="text-sm text-muted-foreground pt-2">
                All partners are bound by confidentiality and GDPR-compliant processing agreements.
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card id="international">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                International Transfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We are based in Cyprus (EU), but some providers may process data outside the EEA/UK. 
                When we transfer data, we rely on adequacy decisions or Standard Contractual Clauses (SCCs) with additional safeguards.
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card id="retention">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Data Retention
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We retain personal data only as long as necessary for the stated purposes or legal obligations.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Account data:</strong> retained while active.</li>
                <li><strong>Logs:</strong> short-term retention, then anonymized.</li>
                <li><strong>Billing:</strong> retained per tax laws.</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                When you delete your account, related data is deleted or anonymized within a reasonable timeframe, except where retention is required by law.
              </p>
            </CardContent>
          </Card>

          {/* Security */}
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Security Measures
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We use encryption (TLS), access controls, network monitoring, and backups to protect your data. 
                While no system is 100% secure, we continuously improve our safeguards to mitigate risks.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card id="cookies">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Cookies & Consent Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">We use:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>Strictly Necessary Cookies</strong> (login, security, performance).</li>
                <li><strong>Optional Cookies</strong> (analytics, marketing) only with your consent.</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                You can manage or withdraw cookie consent anytime via our on-site banner or your browser settings. 
                Disabling certain cookies may affect functionality. For more details, see our{' '}
                <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
              </p>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card id="payment">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Payment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                All payments are processed securely through Stripe. We do not collect or store full card data on our servers. 
                To manage or remove payment info, use your billing page or contact Stripe.
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card id="children">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Children's Privacy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                The Service is not directed to individuals under 16. We do not knowingly collect data from minors. 
                If you believe a child provided information, contact{' '}
                <a href="mailto:privacy@chatl.ai" className="text-primary hover:underline">privacy@chatl.ai</a> and we will delete it.
              </p>
            </CardContent>
          </Card>

          {/* GDPR Rights */}
          <Card id="gdpr-rights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                Rights of Data Subjects (GDPR/EEA & UK)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">You may have the right to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Access your data</li>
                <li>Rectify inaccuracies</li>
                <li>Request deletion ("right to be forgotten")</li>
                <li>Restrict or object to processing</li>
                <li>Receive your data (portability)</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                To exercise these rights, email{' '}
                <a href="mailto:privacy@chatl.ai" className="text-primary hover:underline">privacy@chatl.ai</a>. 
                You may also complain to the Office of the Commissioner for Personal Data Protection, Cyprus.
              </p>
            </CardContent>
          </Card>

          {/* California Privacy */}
          <Card id="california">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                California Privacy (CCPA/CPRA)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">California residents have rights to:</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>Know what data we collect and how it's used</li>
                <li>Request deletion or correction</li>
                <li>Opt-out of sale/sharing (we do not sell data)</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                To exercise these rights, contact{' '}
                <a href="mailto:privacy@chatl.ai" className="text-primary hover:underline">privacy@chatl.ai</a>. 
                We will not discriminate against you for doing so.
              </p>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card id="delete">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                Delete Account Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">How to delete your account:</p>
              <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
                <li>Log in → Account Settings → Delete Account</li>
                <li>Confirm the deletion request</li>
                <li>Upon confirmation, your account and related personal data will be deleted or anonymized, except where required by law</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                Backups may retain minimal encrypted data for a limited period for disaster-recovery only. 
                Deletion is permanent and ends all active subscriptions. Refunds follow our Refund Policy.
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card id="changes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Changes to This Privacy Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this Policy to reflect service or legal changes. We will notify users of significant updates where required by law. 
                Continued use after changes take effect means acceptance.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card id="contact" className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">Email (Privacy):</p>
                <a href="mailto:privacy@chatl.ai" className="text-primary hover:underline">privacy@chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">Support:</p>
                <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">Website:</p>
                <a href="https://chatl.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">Mailing Address:</p>
                <address className="text-muted-foreground not-italic text-sm">
                  TASOLAR<br />
                  Dimostheni Severi & Katsoni 2<br />
                  Avenue Court<br />
                  1082 Nicosia, Cyprus
                </address>
              </div>
            </CardContent>
          </Card>

        </div>
      </section>
    </div>
  );
}
