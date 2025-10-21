import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import SEO from '@/components/SEO';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import geminiLogo from '@/assets/gemini-logo.png';
import claudeLogo from '@/assets/claude-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';

const AITools = () => {
  const navigate = useNavigate();
  const { actualTheme } = useTheme();
  const { t } = useTranslation();

  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO 
        title="AI Tools - Access Multiple AI Models" 
        description="Access powerful AI models including OpenAI GPT-4/5, Claude, Gemini, DeepSeek, and Grok. Try different AI models in one platform." 
        canonical="https://chatl.ai/ai-tools" 
      />

      {/* AI Models Section */}
      <section id="ai-models-section" className="pt-20 pb-8 px-4 sm:px-6 lg:px-8" aria-labelledby="models-heading">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 id="models-heading" className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              {t('models.heading')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('models.subtitle')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* OpenAI GPT-4/5 */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={chatgptLogoSrc} alt="OpenAI ChatGPT logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">OpenAI<br />GPT-4 / GPT-5</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('models.gptDescription')}</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'gpt-4o'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'gpt-4o'
                }
              });
            }} aria-label="Switch to GPT-4o and start a new chat">
                {t('models.tryWithModel')}
              </Button>
            </div>
            
            {/* Claude */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={claudeLogo} alt="Anthropic Claude logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">Anthropic<br />Claude</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('models.claudeDescription')}</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'claude-haiku-4.5'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'claude-haiku-4.5'
                }
              });
            }} aria-label="Switch to Claude and start a new chat">
                {t('models.tryWithModel')}
              </Button>
            </div>
            
            {/* Gemini */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img src={geminiLogo} alt="Google Gemini logo" className="w-12 h-12 object-contain" />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">Google<br />Gemini</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('models.geminiDescription')}</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'gemini-2.5-flash'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'gemini-2.5-flash'
                }
              });
            }} aria-label="Switch to Gemini and start a new chat">
                {t('models.tryWithModel')}
              </Button>
            </div>
            
            {/* DeepSeek */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img 
                    src={deepseekLogo} 
                    alt="DeepSeek logo" 
                    className="w-12 h-12 object-contain"
                    style={actualTheme === 'light' ? { filter: 'brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(2618%) hue-rotate(221deg) brightness(98%) contrast(101%)' } : {}}
                  />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">DeepSeek</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('models.deepseekDescription')}</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'deepseek-v2'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'deepseek-v2'
                }
              });
            }} aria-label="Switch to DeepSeek and start a new chat">
                {t('models.tryWithModel')}
              </Button>
            </div>
            
            {/* Grok */}
            <div className="group p-6 rounded-lg bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 flex flex-col">
              <div className="text-center flex-1">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4 p-2">
                  <img 
                    src={grokLogo} 
                    alt="Grok logo" 
                    className="w-12 h-12 object-contain"
                    style={actualTheme === 'light' ? { filter: 'brightness(0)' } : {}}
                  />
                </div>
                <h2 className="text-lg font-semibold mb-2 text-foreground">Grok</h2>
                <p className="text-sm text-muted-foreground mb-4">{t('models.grokDescription')}</p>
              </div>
              <Button variant="secondary" className="w-full mt-auto bg-black dark:bg-secondary text-white dark:text-secondary-foreground hover:bg-black/90 dark:hover:bg-secondary/90 whitespace-normal h-auto py-2" onClick={() => {
              if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'model_select', {
                  model: 'grok-4'
                });
              }
              navigate('/', {
                state: {
                  selectedModel: 'grok-4'
                }
              });
            }} aria-label="Switch to Grok and start a new chat">
                {t('models.tryWithModel')}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AITools;
