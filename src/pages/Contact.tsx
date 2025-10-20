import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, MessageSquare, Phone, Sparkles, Shield, Users } from 'lucide-react';
import SEO from '@/components/SEO';

const Contact = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={t('contactPage.title')}
        description={t('contactPage.seoDescription')}
      />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/20 to-background">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
            {t('contactPage.letsConnect').split(' ')[0]} <span className="text-primary">{t('contactPage.letsConnect').split(' ')[1]}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('contactPage.teamHappy')}
          </p>
        </div>
      </section>
      
      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div className="group">
              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <MessageSquare className="h-6 w-6 text-primary" />
                  {t('contactPage.sendMessage')}
                </h2>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-foreground font-medium">{t('contactPage.name')}</Label>
                      <Input 
                        id="name" 
                        type="text" 
                        placeholder={t('contactPage.namePlaceholder')}
                        className="mt-2 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-foreground font-medium">{t('contactPage.email')}</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder={t('contactPage.emailPlaceholder')}
                        className="mt-2 border-muted-foreground/20 focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="subject" className="text-foreground font-medium">{t('contactPage.subject')}</Label>
                    <Input 
                      id="subject" 
                      type="text" 
                      placeholder={t('contactPage.subjectPlaceholder')}
                      className="mt-2 border-muted-foreground/20 focus:border-primary"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="message" className="text-foreground font-medium">{t('contactPage.message')}</Label>
                    <Textarea 
                      id="message" 
                      rows={6} 
                      placeholder={t('contactPage.messagePlaceholder')}
                      className="mt-2 border-muted-foreground/20 focus:border-primary resize-none"
                    />
                  </div>
                  
                  <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                    {t('contactPage.sendMessageButton')}
                  </Button>
                </form>
              </div>
            </div>
            
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="p-8 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md">
                <h2 className="text-2xl font-semibold text-foreground mb-6 flex items-center gap-3">
                  <Phone className="h-6 w-6 text-primary" />
                  {t('contactPage.contactInformation')}
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{t('contactPage.generalSupport')}</h3>
                      <p className="text-muted-foreground mb-2">{t('contactPage.generalSupportDesc')}</p>
                      <a href="mailto:support@chatl.ai" className="text-sm font-medium text-primary hover:underline">support@chatl.ai</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{t('contactPage.billingSupport')}</h3>
                      <p className="text-muted-foreground mb-2">{t('contactPage.billingSupportDesc')}</p>
                      <a href="mailto:billing@chatl.ai" className="text-sm font-medium text-primary hover:underline">billing@chatl.ai</a>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {t('contactPage.quickResponse')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('contactPage.quickResponseDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;