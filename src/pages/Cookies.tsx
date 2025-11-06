import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, Shield, Eye, Settings, Bell, ExternalLink, Mail } from 'lucide-react';
import SEO from '@/components/SEO';
import { useTranslation } from 'react-i18next';

export default function Cookies() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${t('cookiePolicy.title')} - ChatLearn`}
        description={t('cookiePolicy.seoDesc')}
        canonical="https://chatl.ai/cookie-policy"
      />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 sm:mb-6">
            <Cookie className="h-3 w-3 mr-2" />
            {t('cookiePolicy.legalDoc')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            {t('cookiePolicy.title')}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-2">
            {t('cookiePolicy.lastUpdated')}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t('cookiePolicy.intro')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container max-w-5xl mx-auto space-y-8">

          {/* Introduction */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="leading-relaxed text-muted-foreground">
                {t('cookiePolicy.consentText')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('cookiePolicy.disagreeText')}
              </p>
            </CardContent>
          </Card>

          {/* What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                {t('cookiePolicy.whatAreCookies')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('cookiePolicy.whatAreCookiesDesc')}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="font-semibold mb-2">{t('cookiePolicy.sessionCookies')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('cookiePolicy.sessionCookiesDesc')}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="font-semibold mb-2">{t('cookiePolicy.persistentCookies')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('cookiePolicy.persistentCookiesDesc')}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                {t('cookiePolicy.cookieTypesNote')}
              </p>
            </CardContent>
          </Card>

          {/* How We Use Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                {t('cookiePolicy.howWeUse')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                {t('cookiePolicy.howWeUseDesc')}
              </p>

              <div className="space-y-6">
                <div className="p-4 sm:p-6 border rounded-lg bg-red-500/5 border-red-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{t('cookiePolicy.essentialCookies')}</h3>
                      <Badge variant="destructive" className="text-xs mb-3">{t('cookiePolicy.essentialRequired')}</Badge>
                      <p className="text-sm text-muted-foreground">{t('cookiePolicy.essentialDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{t('cookiePolicy.analyticsCookies')}</h3>
                      <Badge variant="secondary" className="text-xs mb-3">{t('cookiePolicy.analyticsOptional')}</Badge>
                      <p className="text-sm text-muted-foreground">{t('cookiePolicy.analyticsDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 border rounded-lg bg-green-500/5 border-green-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{t('cookiePolicy.functionalCookies')}</h3>
                      <Badge variant="secondary" className="text-xs mb-3">{t('cookiePolicy.functionalOptional')}</Badge>
                      <p className="text-sm text-muted-foreground">{t('cookiePolicy.functionalDesc')}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 sm:p-6 border rounded-lg bg-purple-500/5 border-purple-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{t('cookiePolicy.marketingCookies')}</h3>
                      <Badge variant="secondary" className="text-xs mb-3">{t('cookiePolicy.marketingOptional')}</Badge>
                      <p className="text-sm text-muted-foreground">{t('cookiePolicy.marketingDesc')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Managing Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                {t('cookiePolicy.managingCookies')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {t('cookiePolicy.managingDesc1')}
              </p>
              <p className="text-muted-foreground">
                {t('cookiePolicy.managingDesc2')}
              </p>
              <p className="text-muted-foreground">
                {t('cookiePolicy.managingDesc3')}
              </p>
              <p className="text-muted-foreground">
                {t('cookiePolicy.managingDesc4')}
              </p>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-3">{t('cookiePolicy.yourOptions')}</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                  <li>{t('cookiePolicy.option1')}</li>
                  <li>{t('cookiePolicy.option2')}</li>
                  <li>{t('cookiePolicy.option3')}</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                {t('cookiePolicy.managingDesc5')}
              </p>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm font-semibold mb-2 text-amber-700 dark:text-amber-400">{t('cookiePolicy.importantNote')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('cookiePolicy.importantNoteDesc')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                {t('cookiePolicy.thirdPartyCookies')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('cookiePolicy.thirdPartyDesc1')}
              </p>
              <p className="font-semibold">{t('cookiePolicy.thirdPartyInclude')}</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>{t('cookiePolicy.thirdPartyGA')}</li>
                <li>{t('cookiePolicy.thirdPartyGTM')}</li>
                <li>{t('cookiePolicy.thirdPartyMeta')}</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                {t('cookiePolicy.thirdPartyDesc2')}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('cookiePolicy.thirdPartyDesc3')}
              </p>
              <div className="p-4 bg-muted/50 rounded-lg border mt-4">
                <p className="font-semibold mb-3">Privacy Policies:</p>
                <div className="space-y-2">
                  <a 
                    href="https://policies.google.com/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 text-sm"
                  >
                    Google Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <a 
                    href="https://www.facebook.com/privacy/policy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2 text-sm"
                  >
                    Meta Privacy Policy
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates to This Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                {t('cookiePolicy.updatesTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t('cookiePolicy.updatesDesc1')}
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                {t('cookiePolicy.updatesDesc2')}
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                {t('cookiePolicy.contactTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground mb-4">
                {t('cookiePolicy.contactDesc')}
              </p>
              <div>
                <p className="font-semibold">{t('cookiePolicy.email')}</p>
                <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">{t('cookiePolicy.website')}</p>
                <a href="https://chatl.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">{t('cookiePolicy.mailingAddress')}</p>
                <address className="text-muted-foreground not-italic text-sm">
                  TASOLAR LTD<br />
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
