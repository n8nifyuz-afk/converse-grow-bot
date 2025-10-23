import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertCircle, Globe, FileText, Mail, DollarSign, Clock, XCircle } from 'lucide-react';
import SEO from '@/components/SEO';
import { useTranslation } from 'react-i18next';

const RefundPolicy = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${t('refundPolicy.title')} - ChatLearn`}
        description={t('refundPolicy.seoDesc')}
        canonical="https://chatl.ai/refund-policy"
      />
      
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 border-b bg-gradient-to-b from-muted/30 to-background">
        <div className="container max-w-5xl mx-auto text-center">
          <Badge variant="outline" className="mb-4 sm:mb-6">
            <DollarSign className="h-3 w-3 mr-2" />
            {t('refundPolicy.legalDoc')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            {t('refundPolicy.title')}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-2">
            {t('refundPolicy.lastUpdated')}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            {t('refundPolicy.intro')}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12 px-4">
        <div className="container max-w-5xl mx-auto space-y-8">

          {/* Introduction */}
          <Card>
            <CardContent className="pt-6">
              <p className="leading-relaxed text-muted-foreground">
                By purchasing a plan or subscription, you agree to this Refund Policy and to our{' '}
                <a href="/terms" className="text-primary hover:underline">Terms of Service</a>.
              </p>
            </CardContent>
          </Card>

          {/* General Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                General Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                All payments made on ChatLearn provide access to online AI-based services.
              </p>
              <p className="text-muted-foreground">
                Because each request generates real-time computational and API usage costs, refunds are generally not available 
                once the service has been accessed or used, except where required by applicable law.
              </p>
              
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mt-4">
                <p className="font-semibold mb-3">Refunds may be considered only if:</p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Fewer than 20 AI messages or generations have been made, and</li>
                  <li>The request is submitted within 3 calendar days of the original purchase.</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-3">
                  After this period, or once usage exceeds 20 messages, the service is considered consumed and non-refundable.
                </p>
              </div>

              <div className="p-4 bg-muted/50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Important:</strong> Refund requests must be submitted while the subscription is active. 
                  Refunds cannot be granted once the billing period has ended or expired.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* EU/UK/Cyprus Consumers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                European Union, United Kingdom, and Cyprus Consumers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you are located in the EU, EEA, UK, or Cyprus, you are entitled to a <strong>14-day right of withdrawal</strong> for 
                digital services under the EU Consumer Rights Directive.
              </p>
              <p className="text-muted-foreground">
                By completing your purchase, you acknowledge that access to ChatLearn begins immediately and that you waive your 
                right of withdrawal once AI usage or digital access starts.
              </p>
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-muted-foreground">
                  If you exercise your withdrawal right within 14 days and have used fewer than 20 messages, a refund will be granted.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Requests must be sent by email before the withdrawal period expires.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Other Regions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Customers in Other Regions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                In the United States and other countries, refunds may be requested within <strong>3 days of purchase</strong> if 
                fewer than <strong>20 messages</strong> have been used.
              </p>
              <p className="text-muted-foreground">
                After that, or after 20 messages have been generated, the service is considered fully consumed and non-refundable.
              </p>
              <div className="p-4 bg-muted/50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  In countries with stronger consumer protection laws, we will comply with the applicable local standard. 
                  Where no specific local regulation applies, this global refund policy will be followed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Technical Issues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                If you experience persistent technical issues that clearly originate from ChatLearn's systems (and not your 
                internet connection, browser, or device), you may be eligible for a refund.
              </p>
              <div className="p-4 border rounded-lg">
                <p className="font-semibold mb-2">Requirements:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                  <li>You must provide supporting information, such as screenshots or error logs, that demonstrate the problem.</li>
                  <li>Refunds for technical reasons will be granted only when the issue is confirmed on our side and in compliance with applicable law.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Non-Refundable Situations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-primary" />
                Non-Refundable Situations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Refunds will not be issued in the following situations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>More than 20 messages or generations have been used</li>
                <li>The refund request is made more than 3 days after purchase</li>
                <li>The account has already been used to access paid services</li>
                <li>The subscription period has ended or expired</li>
              </ul>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <p className="text-sm font-semibold mb-2 text-amber-700 dark:text-amber-400">Important Notice</p>
                <p className="text-sm text-muted-foreground">
                  These limitations do not affect your statutory consumer rights. If local laws provide stronger protections, 
                  those rights will apply.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Chargebacks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Chargebacks and Disputes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Initiating a chargeback or payment reversal through your financial institution violates our payment terms.
              </p>
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm font-semibold mb-2 text-red-700 dark:text-red-400">Chargeback Policy</p>
                <p className="text-sm text-muted-foreground mb-2">
                  If a chargeback occurs, we may suspend or terminate your account immediately.
                </p>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to dispute any chargeback by providing relevant documentation (payment records, usage data, 
                  and access logs) confirming that the payment was authorized and the service accessed.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Requesting a Refund */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Requesting a Refund
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To request a refund, please contact us at{' '}
                <a href="mailto:billing@chatl.ai" className="text-primary hover:underline">billing@chatl.ai</a> and include:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Your full name and email address used for the purchase</li>
                <li>Proof of payment or transaction ID</li>
                <li>Date of purchase</li>
                <li>A short explanation of your refund request</li>
              </ul>
              <div className="p-4 bg-muted/50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Refunds will be evaluated on a case-by-case basis and processed only if the conditions described in this policy are met. 
                  Our internal usage and billing records will determine eligibility.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Cancellation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-primary" />
                Subscription Cancellation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Users may cancel their subscription at any time through their account settings or by contacting our support team at{' '}
                <a href="mailto:support@chatl.ai" className="text-primary hover:underline">support@chatl.ai</a>.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Cancellations take effect at the end of the current billing period, and users will retain access to the service until that date.</li>
                <li>Once canceled, no further charges will be applied, and renewal payments will stop automatically.</li>
              </ul>
              <div className="p-4 bg-muted/50 border rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Refunds for the remaining period are not provided, except as outlined in this Refund Policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Policy Updates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Policy Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                We may update this Refund Policy periodically to reflect changes in our services, new features, or updates in applicable law.
              </p>
              <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm">
                <li>Updates will apply only to future purchases or renewals.</li>
                <li>If you do not agree with an updated version, you may cancel your subscription before the next renewal.</li>
                <li>We recommend keeping a copy of this policy for your records.</li>
              </ul>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Governing Law
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                This Refund Policy is governed by the laws of the Republic of Cyprus and the applicable EU consumer protection regulations.
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                Where local regulations provide additional consumer rights, those rights will prevail.
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
                If you have any questions regarding this Refund Policy, please contact us at:
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
                  TASOLAR<br />
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
};

export default RefundPolicy;
