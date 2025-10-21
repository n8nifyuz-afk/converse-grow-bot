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
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.whoWeAre')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('terms.whoWeAreDesc')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">{t('terms.currentIntegrations')}</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {t('terms.languageModels')}
                </h3>
                <ul className="space-y-3 pl-4">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{t('terms.gpt5')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{t('terms.claude')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{t('terms.gemini')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{t('terms.grok')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{t('terms.deepseek')}</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  {t('terms.imageModel')}
                </h3>
                <ul className="space-y-3 pl-4">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary mt-1">•</span>
                    <span>{t('terms.dalle')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 border-yellow-500/20 bg-yellow-500/5">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.disclaimer')}</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{t('terms.disclaimerP1')}</p>
                  <p>{t('terms.disclaimerP2')}</p>
                  <p>{t('terms.disclaimerP3')}</p>
                  <p>{t('terms.disclaimerP4')}</p>
                  <p>{t('terms.disclaimerP5')}</p>
                  <p className="font-medium text-foreground">{t('terms.disclaimerP6')}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground flex items-center gap-2">
              <Scale className="w-6 h-6 text-primary" />
              {t('terms.general')}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('terms.generalP1')}</p>
              <p>{t('terms.generalP2')}</p>
              <p>{t('terms.generalP3')}</p>
              <p>{t('terms.generalP4')}</p>
              <p>{t('terms.generalP5')}</p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.license')}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('terms.licenseP1')}</p>
              <p>{t('terms.licenseP2')}</p>
            </div>
          </Card>

          <Card className="p-8 mb-6 border-red-500/20 bg-red-500/5">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.restrictions')}</h2>
            <p className="mb-4 text-muted-foreground">{t('terms.restrictionsIntro')}</p>
            <ul className="space-y-3 pl-4">
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction1')}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction2')}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction3')}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction4')}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction5')}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction6')}</span>
              </li>
              <li className="flex items-start gap-2 text-muted-foreground">
                <span className="text-red-500 mt-1">✕</span>
                <span>{t('terms.restriction7')}</span>
              </li>
            </ul>
            <p className="mt-6 text-red-600 dark:text-red-400 font-medium">
              {t('terms.restrictionsWarning')}
            </p>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.suggestions')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.suggestionsDesc')}
            </p>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.thirdParty')}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('terms.thirdPartyP1')}</p>
              <p>{t('terms.thirdPartyP2')}</p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">{t('terms.modelAvailability')}</h3>
              <p className="mb-4">{t('terms.modelAvailabilityIntro')}</p>
              <ul className="space-y-3 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.modelPoint1')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.modelPoint2')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.modelPoint3')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.modelPoint4')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{t('terms.modelPoint5')}</span>
                </li>
              </ul>
              <p className="mt-4">{t('terms.modelEfforts')}</p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <div className="flex items-start gap-4">
              <Lock className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.cookiesPrivacy')}</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>{t('terms.cookiesP1')}</p>
                  <p>{t('terms.cookiesP2')}</p>
                  <p>{t('terms.cookiesP3')}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-primary/5 border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.subscription')}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('terms.subscriptionP1')}</p>
              <p>{t('terms.subscriptionP2')}</p>
              <p className="font-medium text-foreground">{t('terms.subscriptionP3')}</p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.freeTrial')}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('terms.freeTrialP1')}</p>
              <p>{t('terms.freeTrialP2')}</p>
            </div>
          </Card>

          <Card className="p-8 mb-6 bg-card/50 backdrop-blur">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.fairUse')}</h2>
            <p className="mb-4 text-muted-foreground">{t('terms.fairUseIntro')}</p>
            <p className="mb-4 text-muted-foreground">{t('terms.fairUseAcknowledge')}</p>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>{t('terms.fairUse1')}</li>
              <li>{t('terms.fairUse2')}</li>
              <li>{t('terms.fairUse3')}
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>{t('terms.fairUse3a')}</li>
                  <li>{t('terms.fairUse3b')}</li>
                  <li>{t('terms.fairUse3c')}</li>
                </ul>
              </li>
              <li>{t('terms.fairUse4')}</li>
              <li>{t('terms.fairUse5')}</li>
              <li>{t('terms.fairUse6')}</li>
              <li>{t('terms.fairUse7')}</li>
            </ol>
          </Card>

          <Card className="p-8 mb-6 bg-primary/5 border-primary/20">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">{t('terms.companyInfo')}</h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>{t('terms.companyInfoP1')}</p>
              <p>
                <strong className="text-foreground">{t('terms.companyOffice')}</strong> {t('terms.companyAddress')}
              </p>
              <p>
                <strong className="text-foreground">{t('terms.companyEmail')}</strong> <a href={`mailto:${t('terms.companyEmailValue')}`} className="text-primary hover:underline">{t('terms.companyEmailValue')}</a>
              </p>
              <p>
                <strong className="text-foreground">{t('terms.companyWebsite')}</strong> <a href={t('terms.companyWebsiteValue')} className="text-primary hover:underline">{t('terms.companyWebsiteValue')}</a>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
