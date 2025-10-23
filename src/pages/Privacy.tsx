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
            <a href="#marketing-customer-match" className="text-primary hover:underline">{t('privacy.marketingCustomerMatch')}</a>
            <a href="#email-phone-consent" className="text-primary hover:underline">{t('privacy.emailPhoneConsent')}</a>
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
                {t('privacy.acknowledgement')}
              </p>
            </CardContent>
          </Card>

          {/* Definitions */}
          <Card id="definitions">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('privacy.definitionsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold">{t('privacy.defCookie')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defCookieDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defCompany')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defCompanyDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defCountry')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defCountryDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defCustomer')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defCustomerDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defDevice')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defDeviceDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defIPAddress')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defIPAddressDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defPersonalData')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defPersonalDataDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defService')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defServiceDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defThirdParty')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defThirdPartyDesc')}</p>
                </div>
                <div>
                  <p className="font-semibold">{t('privacy.defUser')}</p>
                  <p className="text-sm text-muted-foreground">{t('privacy.defUserDesc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Integrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('privacy.aiIntegrationsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('privacy.aiIntegrationsDesc')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>OpenAI (GPT-5, GPT-4o, GPT-4o mini, DALL·E 3)</li>
                <li>Anthropic (Claude Sonnet 4)</li>
                <li>Google DeepMind (Gemini 2.5 Flash)</li>
                <li>xAI (Grok 4)</li>
                <li>DeepSeek V2</li>
              </ul>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <p className="text-sm font-semibold mb-2">{t('privacy.aiDisclaimer')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('privacy.aiDisclaimerText')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Categories */}
          <Card id="data-categories">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {t('privacy.dataCategoriesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground">
                {t('privacy.dataCategoriesDesc')}
              </p>

              {/* 1. Personal & Contact Information */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">1. {t('privacy.dataCategory1')}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">{t('privacy.dataLabel')}</span> {t('privacy.dataCategory1Data')}</p>
                  <p><span className="font-medium">{t('privacy.purposeLabel')}</span> {t('privacy.dataCategory1Purpose')}</p>
                  <p><span className="font-medium">{t('privacy.legalBasisLabel')}</span> {t('privacy.dataCategory1Legal')}</p>
                </div>
              </div>

              {/* 2. Technical & Security Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">2. {t('privacy.dataCategory2')}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">{t('privacy.dataLabel')}</span> {t('privacy.dataCategory2Data')}</p>
                  <p><span className="font-medium">{t('privacy.purposeLabel')}</span> {t('privacy.dataCategory2Purpose')}</p>
                  <p><span className="font-medium">{t('privacy.legalBasisLabel')}</span> {t('privacy.dataCategory2Legal')}</p>
                </div>
              </div>

              {/* 3. Usage & Log Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">3. {t('privacy.dataCategory3')}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">{t('privacy.dataLabel')}</span> {t('privacy.dataCategory3Data')}</p>
                  <p><span className="font-medium">{t('privacy.purposeLabel')}</span> {t('privacy.dataCategory3Purpose')}</p>
                  <p><span className="font-medium">{t('privacy.legalBasisLabel')}</span> {t('privacy.dataCategory3Legal')}</p>
                </div>
              </div>

              {/* 4. Transaction & Subscription Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">4. {t('privacy.dataCategory4')}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">{t('privacy.dataLabel')}</span> {t('privacy.dataCategory4Data')}</p>
                  <p><span className="font-medium">{t('privacy.purposeLabel')}</span> {t('privacy.dataCategory4Purpose')}</p>
                  <p><span className="font-medium">{t('privacy.legalBasisLabel')}</span> {t('privacy.dataCategory4Legal')}</p>
                </div>
              </div>

              {/* 5. Marketing & Analytics Data */}
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">5. {t('privacy.dataCategory5')}</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">{t('privacy.dataLabel')}</span> {t('privacy.dataCategory5Data')}</p>
                  <p><span className="font-medium">{t('privacy.purposeLabel')}</span> {t('privacy.dataCategory5Purpose')}</p>
                  <p><span className="font-medium">{t('privacy.legalBasisLabel')}</span> {t('privacy.dataCategory5Legal')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Direct Marketing & Customer Match */}
          <Card id="marketing-customer-match">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('privacy.marketingCustomerMatchTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('privacy.marketingCustomerMatchDesc1')}
              </p>
              <p className="text-muted-foreground">
                {t('privacy.marketingCustomerMatchDesc2')}
              </p>
              <p className="text-muted-foreground">
                {t('privacy.marketingCustomerMatchDesc3')}
              </p>
            </CardContent>
          </Card>

          {/* Email & Phone Communications Consent */}
          <Card id="email-phone-consent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('privacy.emailPhoneConsentTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('privacy.emailPhoneConsentDesc1')}
              </p>
              <p className="text-muted-foreground">
                {t('privacy.emailPhoneConsentDesc2')}
              </p>
            </CardContent>
          </Card>

          {/* How We Use */}
          <Card id="how-we-use">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('privacy.howWeUseTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('privacy.howWeUseDesc')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-3">
                <li>{t('privacy.useItem1')}</li>
                <li>{t('privacy.useItem2')}</li>
                <li>{t('privacy.useItem3')}</li>
                <li>{t('privacy.useItem4')}</li>
                <li>{t('privacy.useItem5')}</li>
                <li>{t('privacy.useItem6')}</li>
                <li>{t('privacy.useItem7')}</li>
                <li>{t('privacy.useItem8')}</li>
              </ul>
            </CardContent>
          </Card>

          {/* How We Disclose */}
          <Card id="how-we-disclose">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('privacy.howWeDiscloseTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('privacy.howWeDiscloseDesc')}
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>{t('privacy.discloseAI')}</strong> {t('privacy.discloseAIDesc')}</li>
                <li><strong>{t('privacy.discloseInfra')}</strong> {t('privacy.discloseInfraDesc')}</li>
                <li><strong>{t('privacy.disclosePayments')}</strong> {t('privacy.disclosePaymentsDesc')}</li>
                <li><strong>{t('privacy.discloseAnalytics')}</strong> {t('privacy.discloseAnalyticsDesc')}</li>
                <li><strong>{t('privacy.discloseAdvisors')}</strong> {t('privacy.discloseAdvisorsDesc')}</li>
                <li><strong>{t('privacy.discloseAuthorities')}</strong> {t('privacy.discloseAuthoritiesDesc')}</li>
                <li><strong>{t('privacy.discloseTransfers')}</strong> {t('privacy.discloseTransfersDesc')}</li>
              </ul>
              <p className="text-sm text-muted-foreground pt-2">
                {t('privacy.howWeDiscloseNote')}
              </p>
            </CardContent>
          </Card>

          {/* International Transfers */}
          <Card id="international">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {t('privacy.internationalTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('privacy.internationalDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card id="retention">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('privacy.retentionTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('privacy.retentionDesc')}
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>{t('privacy.retentionAccount')}</strong> {t('privacy.retentionAccountDesc')}</li>
                <li><strong>{t('privacy.retentionLogs')}</strong> {t('privacy.retentionLogsDesc')}</li>
                <li><strong>{t('privacy.retentionBilling')}</strong> {t('privacy.retentionBillingDesc')}</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {t('privacy.retentionNote')}
              </p>
            </CardContent>
          </Card>

          {/* Security */}
          <Card id="security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                {t('privacy.securityTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('privacy.securityDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card id="cookies">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('privacy.cookiesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t('privacy.cookiesDesc')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li><strong>{t('privacy.cookiesNecessary')}</strong> {t('privacy.cookiesNecessaryDesc')}</li>
                <li><strong>{t('privacy.cookiesOptional')}</strong> {t('privacy.cookiesOptionalDesc')}</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {t('privacy.cookiesNote')}{' '}
                <a href="/cookie-policy" className="text-primary hover:underline">Cookie Policy</a>.
              </p>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card id="payment">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                {t('privacy.paymentTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('privacy.paymentDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card id="children">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t('privacy.childrenTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('privacy.childrenDesc')}
              </p>
            </CardContent>
          </Card>

          {/* GDPR Rights */}
          <Card id="gdpr-rights">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                {t('privacy.gdprRightsTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t('privacy.gdprRightsDesc')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('privacy.gdprRight1')}</li>
                <li>{t('privacy.gdprRight2')}</li>
                <li>{t('privacy.gdprRight3')}</li>
                <li>{t('privacy.gdprRight4')}</li>
                <li>{t('privacy.gdprRight5')}</li>
                <li>{t('privacy.gdprRight6')}</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {t('privacy.gdprRightsNote')}
              </p>
            </CardContent>
          </Card>

          {/* California Privacy */}
          <Card id="california">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                {t('privacy.californiaTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{t('privacy.californiaDesc')}</p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                <li>{t('privacy.californiaRight1')}</li>
                <li>{t('privacy.californiaRight2')}</li>
                <li>{t('privacy.californiaRight3')}</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {t('privacy.californiaNote')}
              </p>
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card id="delete">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-primary" />
                {t('privacy.deleteTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="font-semibold">{t('privacy.deleteSubtitle')}</p>
              <ol className="list-decimal pl-6 space-y-1 text-muted-foreground">
                <li>{t('privacy.deleteStep1')}</li>
                <li>{t('privacy.deleteStep2')}</li>
                <li>{t('privacy.deleteStep3')}</li>
              </ol>
              <p className="text-sm text-muted-foreground">
                {t('privacy.deleteNote')}
              </p>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card id="changes">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t('privacy.changesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('privacy.changesDesc')}
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card id="contact" className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('privacy.contactTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{t('privacy.contactEmailPrivacy')}</p>
                <a href="mailto:privacy@chatl.ai" className="text-primary hover:underline">privacy@chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">{t('privacy.contactSupport')}</p>
                <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">{t('privacy.contactWebsite')}</p>
                <a href="https://chatl.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">{t('privacy.contactAddress')}</p>
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
