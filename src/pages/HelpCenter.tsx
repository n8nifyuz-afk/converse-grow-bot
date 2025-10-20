import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Search, MessageSquare, Star, Wrench, CreditCard } from 'lucide-react';
import SEO from '@/components/SEO';

const HelpCenter = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title={t('helpCenter.title')}
        description={t('helpCenter.seoDescription')}
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">{t('helpCenter.title')}</h1>
          <p className="text-xl text-muted-foreground mb-8">
            {t('helpCenter.subtitle')}
          </p>
          
          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder={t('helpCenter.searchPlaceholder')}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Categories - Updated */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div 
            onClick={() => navigate('/chat')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <MessageSquare className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">{t('helpCenter.aiChat')}</h3>
          </div>
          <div 
            onClick={() => navigate('/features')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <Star className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">{t('helpCenter.features')}</h3>
          </div>
          <div 
            onClick={() => navigate('/explore-tools')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <Wrench className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">{t('helpCenter.aiTools')}</h3>
          </div>
          <div 
            onClick={() => navigate('/pricing')}
            className="p-6 bg-card border border-border rounded-lg text-center cursor-pointer hover:bg-accent transition-colors"
          >
            <CreditCard className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium text-foreground">{t('helpCenter.pricingPlans')}</h3>
          </div>
        </div>
        
        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-6">{t('helpCenter.faqTitle')}</h2>
          
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="what-can-i-do" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question1')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer1')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="easy-to-use" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question2')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer2')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="study-learn" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question3')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer3')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="create-images" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question4')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer4')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="languages" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question5')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer5')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="writing-help" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question6')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer6')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="voice-commands" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question7')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer7')}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="for-fun" className="border border-border rounded-lg px-6">
              <AccordionTrigger>{t('faq.question8')}</AccordionTrigger>
              <AccordionContent>
                {t('faq.answer8')}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;