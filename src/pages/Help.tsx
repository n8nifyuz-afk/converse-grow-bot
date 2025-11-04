import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard, User, MessageSquare, AlertCircle, Shield, Mail, Settings, HelpCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import PublicLayout from '@/layouts/PublicLayout';

const Help = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQ items based on search query
  const searchInContent = (text: string, query: string) => {
    return text.toLowerCase().includes(query.toLowerCase());
  };

  const shouldShowSection = (questions: Array<{question: string, answer: string}>) => {
    if (!searchQuery.trim()) return true;
    return questions.some(q => 
      searchInContent(q.question, searchQuery) || searchInContent(q.answer, searchQuery)
    );
  };

  const shouldShowQuestion = (question: string, answer: string) => {
    if (!searchQuery.trim()) return true;
    return searchInContent(question, searchQuery) || searchInContent(answer, searchQuery);
  };

  // Define all FAQ data for filtering using translations
  const faqSections = {
    billing: [
      { question: t('help.billing.q1'), answer: t('help.billing.a1') },
      { question: t('help.billing.q2'), answer: t('help.billing.a2') },
      { question: t('help.billing.q3'), answer: t('help.billing.a3') },
      { question: t('help.billing.q4'), answer: t('help.billing.a4') },
      { question: t('help.billing.q5'), answer: t('help.billing.a5') },
      { question: t('help.billing.q6'), answer: t('help.billing.a6') }
    ],
    account: [
      { question: t('help.account.q1'), answer: t('help.account.a1_p1') + ' ' + t('help.account.a1_p2') },
      { question: t('help.account.q2'), answer: t('help.account.a2_p1') + ' ' + t('help.account.a2_p2') },
      { question: t('help.account.q3'), answer: t('help.account.a3') },
      { question: t('help.account.q4'), answer: t('help.account.a4_p1') + ' ' + t('help.account.a4_li1') + ' ' + t('help.account.a4_li2') + ' ' + t('help.account.a4_warning') },
      { question: t('help.account.q5'), answer: t('help.account.a5') }
    ],
    ai: [
      { question: t('help.ai.q1'), answer: t('help.ai.a1_intro') + ' ' + t('help.ai.a1_note') },
      { question: t('help.ai.q2'), answer: t('help.ai.a2_p1') + ' ' + t('help.ai.a2_p2') + ' ' + t('help.ai.a2_note') },
      { question: t('help.ai.q3'), answer: t('help.ai.a3_p1') + ' ' + t('help.ai.a3_p2') + ' ' + t('help.ai.a3_note') },
      { question: t('help.ai.q4'), answer: t('help.ai.a4_p1') + ' ' + t('help.ai.a4_p2') + ' ' + t('help.ai.a4_note') },
      { question: t('help.ai.q5'), answer: t('help.ai.a5') }
    ],
    technical: [
      { question: t('help.technical.q1'), answer: t('help.technical.a1_p1') + ' ' + t('help.technical.a1_p2') + ' ' + t('help.technical.a1_p3') },
      { question: t('help.technical.q2'), answer: t('help.technical.a2_p1') + ' ' + t('help.technical.a2_p2') + ' ' + t('help.technical.a2_p3') },
      { question: t('help.technical.q3'), answer: t('help.technical.a3_p1') + ' ' + t('help.technical.a3_p2') + ' ' + t('help.technical.a3_p3') },
      { question: t('help.technical.q4'), answer: t('help.technical.a4_p1') + ' ' + t('help.technical.a4_p2') + ' ' + t('help.technical.a4_p3') },
      { question: t('help.technical.q5'), answer: t('help.technical.a5_p1') + ' ' + t('help.technical.a5_p2') }
    ],
    privacy: [
      { question: t('help.privacy.q1'), answer: t('help.privacy.a1_p1') + ' ' + t('help.privacy.a1_p2') + ' ' + t('help.privacy.a1_p3') },
      { question: t('help.privacy.q2'), answer: t('help.privacy.a2_p1') + ' ' + t('help.privacy.a2_p2') + ' ' + t('help.privacy.a2_warning') },
      { question: t('help.privacy.q3'), answer: t('help.privacy.a3') },
      { question: t('help.privacy.q4'), answer: t('help.privacy.a4_intro') },
      { question: t('help.privacy.q5'), answer: t('help.privacy.a5') }
    ]
  };

  const hasSearchResults = searchQuery.trim() && (
    shouldShowSection(faqSections.billing) ||
    shouldShowSection(faqSections.account) ||
    shouldShowSection(faqSections.ai) ||
    shouldShowSection(faqSections.technical) ||
    shouldShowSection(faqSections.privacy)
  );

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SEO 
          title={`${t('help.title')} - ChatLearn`}
          description={t('help.description')}
        />
        
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4">{t('help.title')}</h1>
            <p className="text-xl text-muted-foreground mb-8">
              {t('help.description')}
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('help.searchPlaceholder')}
                className="pl-12 h-14 text-base"
              />
            </div>
            
            {searchQuery.trim() && (
              <p className="text-sm text-muted-foreground mt-4">
                {hasSearchResults ? t('help.searchResultsFor', { query: searchQuery }) : t('help.noResults', { query: searchQuery })}
              </p>
            )}
            {!searchQuery.trim() && (
              <p className="text-sm text-muted-foreground mt-4">
                {t('help.searchHint')}
              </p>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t('help.quickLinks')}</h2>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate('/chat')}
              >
                {t('help.gettingStarted')}
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {t('help.billingInvoices')}
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {t('help.accountLogin')}
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate('/pricing')}
              >
                {t('help.upgradePlan')}
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate('/privacy')}
              >
                {t('help.dataPrivacy')}
              </Badge>
            </div>
          </div>
          
          {/* FAQ Sections */}
          <div className="space-y-12">
            
            {/* Billing & Payments */}
            {shouldShowSection(faqSections.billing) && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('help.sections.billing')}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {shouldShowQuestion(t('help.billing.q1'), t('help.billing.a1')) && (
                <AccordionItem value="billing-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.billing.q1')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.billing.a1')}
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.billing.q2'), t('help.billing.a2')) && (
                <AccordionItem value="billing-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.billing.q2')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.billing.a2')}
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.billing.q3'), t('help.billing.a3')) && (
                <AccordionItem value="billing-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.billing.q3')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.billing.a3')}
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.billing.q4'), t('help.billing.a4')) && (
                <AccordionItem value="billing-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.billing.q4')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.billing.a4')}
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.billing.q5'), t('help.billing.a5')) && (
                <AccordionItem value="billing-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.billing.q5')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.billing.a5')}
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.billing.q6'), t('help.billing.a6')) && (
                <AccordionItem value="billing-6" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.billing.q6')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.billing.a6')}
                  </AccordionContent>
                </AccordionItem>
                )}
              </Accordion>
            </div>
            )}

            {/* Account & Login */}
            {shouldShowSection(faqSections.account) && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('help.sections.account')}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {shouldShowQuestion(t('help.account.q1'), t('help.account.a1_p1') + ' ' + t('help.account.a1_p2')) && (
                <AccordionItem value="account-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.account.q1')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.account.a1_p1')}</p>
                    <p>{t('help.account.a1_p2')}</p>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.account.q2'), t('help.account.a2_p1') + ' ' + t('help.account.a2_p2')) && (
                <AccordionItem value="account-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.account.q2')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.account.a2_p1')}</p>
                    <p>{t('help.account.a2_p2')}</p>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.account.q3'), t('help.account.a3')) && (
                <AccordionItem value="account-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.account.q3')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.account.a3')}
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.account.q4'), t('help.account.a4_p1') + ' ' + t('help.account.a4_li1') + ' ' + t('help.account.a4_li2') + ' ' + t('help.account.a4_warning')) && (
                <AccordionItem value="account-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.account.q4')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.account.a4_p1')}</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>{t('help.account.a4_li1')}</li>
                      <li>{t('help.account.a4_li2')}</li>
                    </ul>
                    <p className="mt-2 text-destructive font-medium">{t('help.account.a4_warning')}</p>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion(t('help.account.q5'), t('help.account.a5')) && (
                <AccordionItem value="account-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.account.q5')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.account.a5')}
                  </AccordionContent>
                </AccordionItem>
                )}
              </Accordion>
            </div>
            )}

            {/* Using ChatLearn & AI Features */}
            {shouldShowSection(faqSections.ai) && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('help.sections.ai')}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="ai-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.ai.q1')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">{t('help.ai.a1_intro')}</p>
                    <p className="font-semibold mb-2">{t('help.ai.a1_title')}</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>{t('help.ai.a1_m1')}</strong></li>
                      <li><strong>{t('help.ai.a1_m2')}</strong></li>
                      <li><strong>{t('help.ai.a1_m3')}</strong></li>
                      <li><strong>{t('help.ai.a1_m4')}</strong></li>
                      <li><strong>{t('help.ai.a1_m5')}</strong></li>
                      <li><strong>{t('help.ai.a1_m6')}</strong></li>
                      <li><strong>{t('help.ai.a1_m7')}</strong></li>
                      <li><strong>{t('help.ai.a1_m8')}</strong></li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">{t('help.ai.a1_note')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.ai.q2')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.ai.a2_p1')}</p>
                    <p className="mb-2">{t('help.ai.a2_p2')}</p>
                    <p className="text-muted-foreground">{t('help.ai.a2_note')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.ai.q3')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.ai.a3_p1')}</p>
                    <p className="mb-2">{t('help.ai.a3_p2')}</p>
                    <ul className="list-disc pl-6 space-y-1 mb-2">
                      <li>{t('help.ai.a3_ex1')}</li>
                      <li>{t('help.ai.a3_ex2')}</li>
                      <li>{t('help.ai.a3_ex3')}</li>
                    </ul>
                    <p className="text-muted-foreground">{t('help.ai.a3_note')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.ai.q4')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.ai.a4_p1')}</p>
                    <p className="mb-2">{t('help.ai.a4_p2')}</p>
                    <p className="text-muted-foreground">{t('help.ai.a4_note')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.ai.q5')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.ai.a5')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            )}

            {/* Technical Issues */}
            {shouldShowSection(faqSections.technical) && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('help.sections.technical')}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="tech-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.technical.q1')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.technical.a1_p1')}</p>
                    <p className="mb-2">{t('help.technical.a1_p2')}</p>
                    <p>{t('help.technical.a1_p3')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.technical.q2')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.technical.a2_p1')}</p>
                    <p className="mb-2">{t('help.technical.a2_p2')}</p>
                    <p>{t('help.technical.a2_p3')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.technical.q3')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.technical.a3_p1')}</p>
                    <p className="mb-2">{t('help.technical.a3_p2')}</p>
                    <p>{t('help.technical.a3_p3')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.technical.q4')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.technical.a4_p1')}</p>
                    <p className="mb-2">{t('help.technical.a4_p2')}</p>
                    <p>{t('help.technical.a4_p3')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.technical.q5')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.technical.a5_p1')}</p>
                    <p>{t('help.technical.a5_p2')}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            )}

            {/* Legal & Privacy */}
            {shouldShowSection(faqSections.privacy) && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('help.sections.privacy')}</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="privacy-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.privacy.q1')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.privacy.a1_p1')}</p>
                    <p className="mb-2">{t('help.privacy.a1_p2')}</p>
                    <p>{t('help.privacy.a1_p3')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.privacy.q2')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.privacy.a2_p1')}</p>
                    <p className="mb-2">{t('help.privacy.a2_p2')}</p>
                    <p className="text-destructive font-medium">{t('help.privacy.a2_warning')}</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.privacy.q3')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.privacy.a3')}
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.privacy.q4')}</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">{t('help.privacy.a4_intro')}</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li 
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate('/terms')}
                      >
                        {t('help.privacy.a4_terms')}
                      </li>
                      <li 
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate('/privacy')}
                      >
                        {t('help.privacy.a4_privacy')}
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">{t('help.privacy.q5')}</AccordionTrigger>
                  <AccordionContent>
                    {t('help.privacy.a5')}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            )}

            {/* Contact & Support */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('help.sections.contact')}</h2>
              </div>
              
              <div className="border border-border rounded-lg p-8 bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-4">{t('help.contact.title')}</h3>
                <p className="text-muted-foreground mb-6">{t('help.contact.description')}</p>
                
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">{t('help.contact.email')}</p>
                    <a href="mailto:support@chatl.ai" className="text-primary hover:underline">{t('help.contact.emailAddress')}</a>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {t('help.contact.response')}
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">{t('help.contact.noteTitle')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('help.contact.noteDescription')}
                  </p>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/contact')}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    {t('help.contact.visitContact')}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default Help;
