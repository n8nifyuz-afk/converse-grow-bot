import React from 'react';
import { Brain, Image, FileText, Code, Mic, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';

const Features = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="Features - All AI Tools in One Platform" 
        description="Explore all features: Multi-model AI access, image generation, learning support, coding help, voice commands, and file analysis. Everything you need in one place." 
        canonical="https://chatl.ai/features" 
      />

      {/* Features Section */}
      <section id="features-section" className="pt-20 pb-8 px-4 sm:px-6 lg:px-8" aria-labelledby="features-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 id="features-heading" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              {t('features.heading')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>
          
          {/* 6 Feature Cards Grid - 3 per row on desktop, 2 on tablet, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Multi-Model Access */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">{t('features.multiModelAccess')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('features.multiModelAccessDesc')}</p>
            </div>
            
            {/* Feature 2: AI Image Generation */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Image className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">{t('features.aiImageGeneration')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('features.aiImageGenerationDesc')}</p>
            </div>
            
            {/* Feature 3: Learning & Study Support */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">{t('features.learningSupport')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('features.learningSupportDesc')}</p>
            </div>
            
            {/* Feature 4: Coding & Tech Help */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Code className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">{t('features.codingHelp')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('features.codingHelpDesc')}</p>
            </div>
            
            {/* Feature 5: Voice & Language Support */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mic className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">{t('features.voiceLanguageSupport')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('features.voiceLanguageSupportDesc')}</p>
            </div>
            
            {/* Feature 6: Ask Your Files */}
            <div className="group text-center p-6 rounded-lg bg-card border border-border hover:border-primary/50 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col h-full">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold mb-2 text-foreground">{t('features.askYourFiles')}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{t('features.askYourFilesDesc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
