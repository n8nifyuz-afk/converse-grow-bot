import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Zap, Shield, Users, CheckCircle, ArrowRight, Globe, Lock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';

const About = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('about.title')}
        description={t('about.seoDescription')}
        canonical="https://chatl.ai/about"
      />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 sm:mb-6">
            <Sparkles className="h-3 w-3 mr-2" />
            {t('about.badge')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            {t('about.heading')}
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('about.subtitle')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container max-w-6xl mx-auto space-y-12">

          {/* Who We Are */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                {t('about.whoWeAre.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('about.whoWeAre.p1')}
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('about.whoWeAre.p2')}
              </p>
              <div className="p-4 sm:p-6 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                <p className="text-base sm:text-lg font-semibold text-foreground">
                  {t('about.whoWeAre.belief')}
                </p>
                <p className="text-sm sm:text-base text-muted-foreground mt-2">
                  {t('about.whoWeAre.reason')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Our Mission */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                {t('about.mission.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('about.mission.p1')}
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('about.mission.p2')}
              </p>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('about.mission.p3')}
              </p>
            </CardContent>
          </Card>

          {/* Our Technology */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                {t('about.technology.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 sm:p-6 bg-muted/50 rounded-lg border">
                  <Globe className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{t('about.technology.integration.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t('about.technology.integration.desc')}
                  </p>
                </div>
                <div className="p-4 sm:p-6 bg-muted/50 rounded-lg border">
                  <Lock className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{t('about.technology.security.title')}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {t('about.technology.security.desc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why ChatLearn */}
          <Card className="bg-gradient-to-br from-muted/30 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                {t('about.why.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('about.why.allInOne.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('about.why.allInOne.desc')}</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('about.why.efficiency.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('about.why.efficiency.desc')}</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('about.why.creative.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('about.why.creative.desc')}</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('about.why.security.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('about.why.security.desc')}</p>
                </div>

                <div className="p-4 bg-background rounded-lg border hover:border-primary/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{t('about.why.innovation.title')}</h3>
                  <p className="text-sm text-muted-foreground">{t('about.why.innovation.desc')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Commitment */}
          <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-background">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl sm:text-3xl">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                {t('about.commitment.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                {t('about.commitment.p1')}
              </p>
              <p className="text-base sm:text-lg font-semibold text-foreground">
                {t('about.commitment.p2')}
              </p>
            </CardContent>
          </Card>

          {/* CTA Section */}
          <Card className="bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            <CardContent className="py-8 sm:py-12 text-center">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                {t('about.cta.title')}
              </h2>
              <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90">
                {t('about.cta.desc')}
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90 font-semibold text-base sm:text-lg px-6 sm:px-8"
                onClick={() => navigate('/')}
              >
                {t('about.cta.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>

        </div>
      </section>
    </div>
  );
};

export default About;
