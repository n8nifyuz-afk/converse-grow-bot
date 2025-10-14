import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cookie, Shield, Eye, Settings, Bell, ExternalLink, Mail } from 'lucide-react';
import SEO from '@/components/SEO';

export default function Cookies() {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Cookie Policy - ChatLearn" 
        description="Learn how ChatLearn uses cookies and similar technologies. Understand your choices and how to manage cookie preferences."
        canonical="https://chatl.ai/cookie-policy"
      />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 sm:mb-6">
            <Cookie className="h-3 w-3 mr-2" />
            Legal Document
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Cookie Policy
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-2">
            Last Updated: October 2025
          </p>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            This Cookie Policy explains how ChatLearn uses cookies and similar technologies on our website.
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
                By continuing to browse or use the Site, you consent to the use of cookies as described in this policy.
              </p>
              <p className="text-sm text-muted-foreground">
                If you do not agree, you can manage or disable cookies through your browser settings or via the cookie banner 
                displayed when you first visit our Site.
              </p>
            </CardContent>
          </Card>

          {/* What Are Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-primary" />
                What Are Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device when you visit a website. They are used to make websites 
                function properly, improve performance, remember preferences, and help us understand how visitors interact with the site.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="font-semibold mb-2">Session Cookies</p>
                  <p className="text-sm text-muted-foreground">
                    Deleted when you close your browser
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <p className="font-semibold mb-2">Persistent Cookies</p>
                  <p className="text-sm text-muted-foreground">
                    Remain stored for a defined period
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-2">
                Cookies set directly by ChatLearn are known as <strong>"first-party cookies,"</strong> while those set by 
                external tools like Google Analytics are <strong>"third-party cookies."</strong>
              </p>
            </CardContent>
          </Card>

          {/* How We Use Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                How We Use Cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                We use cookies to provide a secure, optimized, and personalized experience on our Site.
              </p>

              <div className="space-y-6">
                {/* Essential Cookies */}
                <div className="p-4 sm:p-6 border rounded-lg bg-red-500/5 border-red-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Essential Cookies</h3>
                      <Badge variant="destructive" className="text-xs mb-3">Required</Badge>
                      <p className="text-sm text-muted-foreground">
                        These are required for the basic operation of the website, such as security, login, and navigation. 
                        Without them, the site cannot function properly.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 sm:p-6 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Eye className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Analytics Cookies</h3>
                      <Badge variant="secondary" className="text-xs mb-3">Optional</Badge>
                      <p className="text-sm text-muted-foreground">
                        We use Google Analytics (GA4) to collect anonymous information about how visitors use the site — such as 
                        pages viewed, session duration, and user behavior. This helps us improve performance and user experience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="p-4 sm:p-6 border rounded-lg bg-green-500/5 border-green-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Settings className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Functional Cookies</h3>
                      <Badge variant="secondary" className="text-xs mb-3">Optional</Badge>
                      <p className="text-sm text-muted-foreground">
                        These cookies remember your preferences (like language or theme) to provide a smoother, customized 
                        browsing experience.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 sm:p-6 border rounded-lg bg-purple-500/5 border-purple-500/20">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bell className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-1">Marketing Cookies</h3>
                      <Badge variant="secondary" className="text-xs mb-3">Optional</Badge>
                      <p className="text-sm text-muted-foreground">
                        If Meta Pixel or similar tracking tools are active, these cookies help deliver relevant ads and measure 
                        campaign effectiveness. They track general interactions and conversions anonymously.
                      </p>
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
                Managing Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                When you first visit our Site, you may see a banner asking for your consent to use cookies.
              </p>
              <div className="p-4 bg-muted/50 rounded-lg border">
                <h3 className="font-semibold mb-3">Your Options:</h3>
                <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                  <li>Accept all cookies</li>
                  <li>Reject non-essential ones</li>
                  <li>Manage your preferences manually</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                You can also adjust your preferences anytime through your browser's cookie settings. Most browsers allow you to 
                delete existing cookies or block new ones.
              </p>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm font-semibold mb-2 text-amber-700 dark:text-amber-400">Important Note</p>
                <p className="text-sm text-muted-foreground">
                  Please note that disabling cookies may affect certain site features or reduce performance.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Cookies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-primary" />
                Third-Party Cookies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Some cookies are set by trusted third parties who help us analyze traffic and improve functionality.
              </p>
              <p className="font-semibold">These may include:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>Google Analytics (GA4)</strong> – for tracking and measuring website usage.</li>
                <li><strong>Google Tag Manager</strong> – for managing and deploying analytics scripts.</li>
                <li><strong>Meta Pixel (if enabled)</strong> – for advertising analytics and conversion tracking.</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                These providers may collect information like your IP address, browser type, or session details.
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
                Updates to This Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We may update this Cookie Policy from time to time to reflect new technologies, features, or legal requirements. 
                The "Last Updated" date at the top of this page indicates the latest revision.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                We recommend checking this page occasionally to stay informed about how we use cookies.
              </p>
            </CardContent>
          </Card>

          {/* Contact Us */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground mb-4">
                If you have any questions or concerns about this Cookie Policy or how we handle your data, please contact us:
              </p>
              <div>
                <p className="font-semibold">Email:</p>
                <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">Website:</p>
                <a href="https://chatl.ai" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">https://chatl.ai</a>
              </div>
              <div>
                <p className="font-semibold">Mailing Address:</p>
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
