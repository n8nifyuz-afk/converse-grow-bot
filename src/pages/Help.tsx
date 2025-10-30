import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, CreditCard, User, MessageSquare, AlertCircle, Shield, Mail, Settings, HelpCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import PublicLayout from '@/layouts/PublicLayout';

const Help = () => {
  const navigate = useNavigate();
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

  // Define all FAQ data for filtering
  const faqSections = {
    billing: [
      { question: "How can I upgrade my plan?", answer: "Go to Settings → Subscription and click View Plans. Choose Pro or Ultra to unlock premium AI models and advanced features." },
      { question: "How can I update my payment method?", answer: "Open Settings → Subscription, then scroll down to Payment Details. There you can add or replace your credit or debit card anytime." },
      { question: "When will I be charged after my trial?", answer: "After your 3-day trial ends, your plan automatically converts to a monthly subscription unless canceled before the trial expires." },
      { question: "How do I cancel my subscription?", answer: "Go to Settings → Subscription and select Cancel Plan. Your account will remain active until the end of your billing period." },
      { question: "Can I download my invoices?", answer: "Yes. You can view and download invoices directly from Settings → Subscription → Billing History." },
      { question: "What happens if my payment fails?", answer: "We'll retry your payment automatically. If it still fails, your account may be paused until your payment method is updated." }
    ],
    account: [
      { question: "I can't log in — what should I do?", answer: "First, make sure you're using the same method you used when signing up (Email, Google, or Apple). If you used email and forgot your password, click Forgot Password on the login screen to reset it." },
      { question: "I didn't receive a verification or reset email.", answer: "Check your Spam or Promotions folder. If it's not there, wait a few minutes and try again. Still not receiving anything? Contact support@chatl.ai for help." },
      { question: "Can I use ChatLearn on multiple devices?", answer: "Yes. You can log in with the same account on any device — desktop, tablet, or mobile — and your chat history will stay synced." },
      { question: "How can I delete my account or data permanently?", answer: "Open Settings → Data Control. To delete all your chats, projects, and images, click Delete All Data. To completely remove your account and all associated data, click Delete Account. These actions are permanent and cannot be undone." },
      { question: "Can I export my data before deleting my account?", answer: "Yes. In Settings → Data Control, click Export to download all your conversations and account data before deletion." }
    ],
    ai: [
      { question: "What AI models are available on ChatLearn?", answer: "ChatLearn gives you access to GPT-4o mini, GPT-4o, GPT-5, Claude Haiku 4.5, Gemini 2.5 Flash, DeepSeek V2, Grok 4, and Generate Image. The models available depend on your subscription plan." },
      { question: "How can I generate images?", answer: "To create images, first select the Generate Image model from the model menu at the top of your chat window. Then, type your description and send it. Image generation is available for Pro and Ultra users only." },
      { question: "Can I upload or analyze images?", answer: "Yes. You can upload a photo or take one directly with your camera inside the chat. Once uploaded, you can ask ChatLearn questions about the image. Image understanding is supported on GPT-4o, GPT-5, and Ultra models." },
      { question: "Can I upload and analyze documents?", answer: "Yes. You can upload files such as PDFs, Word documents, or text files directly into the chat. ChatLearn can summarize them, extract key points, or answer specific questions based on the content. This feature works best with GPT-4o, GPT-5, and Ultra models." },
      { question: "Can I export or save my conversations?", answer: "Yes. Open Settings → Data Control, then click Export to download all your conversations and account data." }
    ],
    technical: [
      { question: "The chat isn't responding — what should I do?", answer: "Try refreshing the page or closing and reopening the chat window. If the issue continues, log out and log back in. Still stuck? Contact support@chatl.ai and describe the issue." },
      { question: "Image generation failed or didn't load.", answer: "Image creation works only when the Generate Image model is selected. Make sure you've switched to that model before sending your request. If you were already using it, wait a few seconds and try again." },
      { question: "The site looks broken or loads slowly.", answer: "Make sure you're using the latest version of Chrome, Safari, or Edge. Clear your browser cache and cookies, then reload the page. For best performance, allow cookies and enable JavaScript." },
      { question: "My chat history disappeared.", answer: "Don't worry — your data is stored safely. Sometimes it takes a few seconds to sync after login. If your chats still don't appear, refresh the page or check under Data Control → Export to confirm your data is available." },
      { question: "Something isn't working after an update.", answer: "Clear your cache and refresh the site to load the latest version. If the problem persists, email support@chatl.ai with a short description and a screenshot if possible." }
    ],
    privacy: [
      { question: "How does ChatLearn protect my data?", answer: "Your privacy and security are a top priority. ChatLearn follows strict GDPR standards and uses encrypted connections to protect your data. We never sell or share your personal information with third parties." },
      { question: "Can I request my data to be deleted?", answer: "Yes. Go to Settings → Data Control, then click Delete Account. This permanently removes all your chats, files, and personal information. Once confirmed, this action cannot be undone." },
      { question: "Can I export my data before deleting my account?", answer: "Absolutely. In Settings → Data Control, click Export to download all your stored conversations and files before deletion." },
      { question: "Where can I find your Terms of Service and Privacy Policy?", answer: "You can find both at the bottom of our website: Terms of Service and Privacy Policy" },
      { question: "Who can I contact for privacy-related questions?", answer: "For any questions about your data or privacy rights, contact us at support@chatl.ai." }
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
          title="Help Center - ChatLearn"
          description="Find answers to common questions about ChatLearn - billing, account management, AI features, and more."
        />
        
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-foreground mb-4">Welcome to ChatLearn Help Center</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Where you'll find everything you need to get started, solve issues, and learn new features.
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for topics, questions, or keywords…"
                className="pl-12 h-14 text-base"
              />
            </div>
            
            {searchQuery.trim() && (
              <p className="text-sm text-muted-foreground mt-4">
                {hasSearchResults ? `Found results for "${searchQuery}"` : `No results found for "${searchQuery}". Try different keywords or explore the categories below.`}
              </p>
            )}
            {!searchQuery.trim() && (
              <p className="text-sm text-muted-foreground mt-4">
                How can we help? Start by searching or browse popular topics below.
              </p>
            )}
          </div>
          
          {/* Quick Links */}
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Links</h2>
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate('/chat')}
              >
                Getting started
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Billing & invoices
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Account & login
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate('/pricing')}
              >
                Upgrade to Pro / Ultra
              </Badge>
              <Badge 
                variant="secondary" 
                className="text-sm py-2 px-4 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => navigate('/privacy')}
              >
                Data & privacy
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
                <h2 className="text-2xl font-bold text-foreground">Billing & Payments</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {shouldShowQuestion("How can I upgrade my plan?", "Go to Settings → Subscription and click View Plans. Choose Pro or Ultra to unlock premium AI models and advanced features.") && (
                <AccordionItem value="billing-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">How can I upgrade my plan?</AccordionTrigger>
                  <AccordionContent>
                    Go to Settings → Subscription and click View Plans. Choose Pro or Ultra to unlock premium AI models and advanced features.
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("How can I update my payment method?", "Open Settings → Subscription, then scroll down to Payment Details. There you can add or replace your credit or debit card anytime.") && (
                <AccordionItem value="billing-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">How can I update my payment method?</AccordionTrigger>
                  <AccordionContent>
                    Open Settings → Subscription, then scroll down to Payment Details. There you can add or replace your credit or debit card anytime.
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("When will I be charged after my trial?", "After your 3-day trial ends, your plan automatically converts to a monthly subscription unless canceled before the trial expires.") && (
                <AccordionItem value="billing-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">When will I be charged after my trial?</AccordionTrigger>
                  <AccordionContent>
                    After your 3-day trial ends, your plan automatically converts to a monthly subscription unless canceled before the trial expires.
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("How do I cancel my subscription?", "Go to Settings → Subscription and select Cancel Plan. Your account will remain active until the end of your billing period.") && (
                <AccordionItem value="billing-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">How do I cancel my subscription?</AccordionTrigger>
                  <AccordionContent>
                    Go to Settings → Subscription and select Cancel Plan. Your account will remain active until the end of your billing period.
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("Can I download my invoices?", "Yes. You can view and download invoices directly from Settings → Subscription → Billing History.") && (
                <AccordionItem value="billing-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I download my invoices?</AccordionTrigger>
                  <AccordionContent>
                    Yes. You can view and download invoices directly from Settings → Subscription → Billing History.
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("What happens if my payment fails?", "We'll retry your payment automatically. If it still fails, your account may be paused until your payment method is updated.") && (
                <AccordionItem value="billing-6" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">What happens if my payment fails?</AccordionTrigger>
                  <AccordionContent>
                    We'll retry your payment automatically. If it still fails, your account may be paused until your payment method is updated.
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
                <h2 className="text-2xl font-bold text-foreground">Account & Login</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                {shouldShowQuestion("I can't log in — what should I do?", "First, make sure you're using the same method you used when signing up (Email, Google, or Apple). If you used email and forgot your password, click Forgot Password on the login screen to reset it.") && (
                <AccordionItem value="account-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">I can't log in — what should I do?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">First, make sure you're using the same method you used when signing up (Email, Google, or Apple).</p>
                    <p>If you used email and forgot your password, click Forgot Password on the login screen to reset it.</p>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("I didn't receive a verification or reset email.", "Check your Spam or Promotions folder. If it's not there, wait a few minutes and try again. Still not receiving anything? Contact support@chatl.ai for help.") && (
                <AccordionItem value="account-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">I didn't receive a verification or reset email.</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Check your Spam or Promotions folder. If it's not there, wait a few minutes and try again.</p>
                    <p>Still not receiving anything? Contact support@chatl.ai for help.</p>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("Can I use ChatLearn on multiple devices?", "Yes. You can log in with the same account on any device — desktop, tablet, or mobile — and your chat history will stay synced.") && (
                <AccordionItem value="account-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I use ChatLearn on multiple devices?</AccordionTrigger>
                  <AccordionContent>
                    Yes. You can log in with the same account on any device — desktop, tablet, or mobile — and your chat history will stay synced.
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("How can I delete my account or data permanently?", "Open Settings → Data Control. To delete all your chats, projects, and images, click Delete All Data. To completely remove your account and all associated data, click Delete Account. These actions are permanent and cannot be undone.") && (
                <AccordionItem value="account-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">How can I delete my account or data permanently?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Open Settings → Data Control.</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li>To delete all your chats, projects, and images, click Delete All Data.</li>
                      <li>To completely remove your account and all associated data, click Delete Account.</li>
                    </ul>
                    <p className="mt-2 text-destructive font-medium">These actions are permanent and cannot be undone.</p>
                  </AccordionContent>
                </AccordionItem>
                )}
                
                {shouldShowQuestion("Can I export my data before deleting my account?", "Yes. In Settings → Data Control, click Export to download all your conversations and account data before deletion.") && (
                <AccordionItem value="account-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I export my data before deleting my account?</AccordionTrigger>
                  <AccordionContent>
                    Yes. In Settings → Data Control, click Export to download all your conversations and account data before deletion.
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
                <h2 className="text-2xl font-bold text-foreground">Using ChatLearn & AI Features</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="ai-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">What AI models are available on ChatLearn?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-3">ChatLearn gives you access to a range of leading AI models.</p>
                    <p className="font-semibold mb-2">Available models:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li><strong>GPT-4o mini</strong> – Default model (fast & efficient)</li>
                      <li><strong>GPT-4o</strong> – High-quality option</li>
                      <li><strong>GPT-5</strong> – Most advanced ChatLearn model</li>
                      <li><strong>Claude Haiku 4.5 (Ultra)</strong> – Smart and efficient model by Anthropic</li>
                      <li><strong>Gemini 2.5 Flash</strong> – Fast model by Google</li>
                      <li><strong>DeepSeek V2 (Ultra)</strong> – Advanced reasoning model</li>
                      <li><strong>Grok 4 (Ultra)</strong> – Powerful AI from xAI</li>
                      <li><strong>Generate Image</strong> – Create images with AI</li>
                    </ul>
                    <p className="mt-3 text-muted-foreground">The models available to you depend on your subscription plan (Free, Pro, or Ultra).</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">How can I generate images?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">To create images, first select the <strong>Generate Image</strong> model from the model menu at the top of your chat window.</p>
                    <p className="mb-2">Then, type your description (for example: "a futuristic city at sunset") and send it.</p>
                    <p className="text-muted-foreground">Image generation is available for Pro and Ultra users only.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I upload or analyze images?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Yes. You can upload a photo or take one directly with your camera inside the chat.</p>
                    <p className="mb-2">Once uploaded, you can ask ChatLearn questions about the image — for example:</p>
                    <ul className="list-disc pl-6 space-y-1 mb-2">
                      <li>"What does this mean?"</li>
                      <li>"Translate the text in this photo"</li>
                      <li>"Describe what you see here."</li>
                    </ul>
                    <p className="text-muted-foreground">Image understanding is supported on GPT-4o, GPT-5, and Ultra models.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I upload and analyze documents?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Yes. You can upload files such as PDFs, Word documents, or text files directly into the chat.</p>
                    <p className="mb-2">ChatLearn can summarize them, extract key points, or answer specific questions based on the content.</p>
                    <p className="text-muted-foreground">This feature works best with GPT-4o, GPT-5, and Ultra models.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="ai-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I export or save my conversations?</AccordionTrigger>
                  <AccordionContent>
                    Yes. Open Settings → Data Control, then click Export to download all your conversations and account data.
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
                <h2 className="text-2xl font-bold text-foreground">Technical Issues</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="tech-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">The chat isn't responding — what should I do?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Try refreshing the page or closing and reopening the chat window.</p>
                    <p className="mb-2">If the issue continues, log out and log back in.</p>
                    <p>Still stuck? Contact support@chatl.ai and describe the issue.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Image generation failed or didn't load.</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Image creation works only when the <strong>Generate Image</strong> model is selected.</p>
                    <p className="mb-2">Make sure you've switched to that model before sending your request.</p>
                    <p>If you were already using it, wait a few seconds and try again — the image service might be temporarily busy.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">The site looks broken or loads slowly.</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Make sure you're using the latest version of Chrome, Safari, or Edge.</p>
                    <p className="mb-2">Clear your browser cache and cookies, then reload the page.</p>
                    <p>For best performance, allow cookies and enable JavaScript.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">My chat history disappeared.</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Don't worry — your data is stored safely.</p>
                    <p className="mb-2">Sometimes it takes a few seconds to sync after login.</p>
                    <p>If your chats still don't appear, refresh the page or check under Data Control → Export to confirm your data is available.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="tech-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Something isn't working after an update.</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Clear your cache and refresh the site to load the latest version.</p>
                    <p>If the problem persists, email support@chatl.ai with a short description and a screenshot if possible.</p>
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
                <h2 className="text-2xl font-bold text-foreground">Legal & Privacy</h2>
              </div>
              
              <Accordion type="single" collapsible className="space-y-3">
                <AccordionItem value="privacy-1" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">How does ChatLearn protect my data?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Your privacy and security are a top priority.</p>
                    <p className="mb-2">ChatLearn follows strict GDPR standards and uses encrypted connections to protect your data.</p>
                    <p>We never sell or share your personal information with third parties.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-2" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I request my data to be deleted?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">Yes. Go to Settings → Data Control, then click Delete Account.</p>
                    <p className="mb-2">This permanently removes all your chats, files, and personal information.</p>
                    <p className="text-destructive font-medium">Once confirmed, this action cannot be undone.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-3" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Can I export my data before deleting my account?</AccordionTrigger>
                  <AccordionContent>
                    Absolutely. In Settings → Data Control, click Export to download all your stored conversations and files before deletion.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-4" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Where can I find your Terms of Service and Privacy Policy?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">You can find both at the bottom of our website:</p>
                    <ul className="list-disc pl-6 space-y-1">
                      <li 
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate('/terms')}
                      >
                        Terms of Service
                      </li>
                      <li 
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => navigate('/privacy')}
                      >
                        Privacy Policy
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="privacy-5" className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left">Who can I contact for privacy-related questions?</AccordionTrigger>
                  <AccordionContent>
                    For any questions about your data or privacy rights, contact us at <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>.
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
                <h2 className="text-2xl font-bold text-foreground">Contact & Support</h2>
              </div>
              
              <div className="border border-border rounded-lg p-8 bg-card">
                <h3 className="text-xl font-semibold text-foreground mb-4">Need more help?</h3>
                <p className="text-muted-foreground mb-6">Our team is always here to help you.</p>
                
                <div className="flex items-center gap-3 mb-6">
                  <Mail className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-semibold text-foreground">Email:</p>
                    <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">
                  We usually reply within 24 hours — faster during business hours.
                </p>
                
                <div className="bg-muted/50 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">Quick note:</p>
                  <p className="text-sm text-muted-foreground">
                    If your question is about billing, login, or technical issues, please include a short description or screenshot. 
                    This helps us resolve your request much faster.
                  </p>
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => navigate('/contact')}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                  >
                    Visit our Contact Page
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
