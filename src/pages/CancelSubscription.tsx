import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CancelSubscription = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const navigate = useNavigate();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) {
        toast.error(error.message || 'Failed to open customer portal');
        return;
      }
      
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error('Failed to open subscription management');
      console.error('Portal error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO 
        title="Cancel Subscription"
        description="Cancel your ChatLearn subscription easily. Learn about cancellation process, billing cycles, and alternative options."
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Manage Subscription</h1>
          <p className="text-xl text-muted-foreground">
            Update your subscription, payment method, or cancel anytime
          </p>
        </div>
        
        {/* Before you cancel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Before you cancel
            </CardTitle>
            <CardDescription>
              Consider these alternatives that might address your concerns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium text-foreground">Talk to support</h3>
                <p className="text-sm text-muted-foreground">
                  Our team can help resolve issues or find a plan that better fits your needs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Management options */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Subscription</CardTitle>
              <CardDescription>
                Cancel subscription, update payment method, or view invoice history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">What you can do:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Cancel your subscription (remains active until period ends)</li>
                  <li>• Update your payment method</li>
                  <li>• View and download invoice history</li>
                  <li>• Update billing information</li>
                </ul>
              </div>
              
              <Button 
                onClick={handleManageSubscription} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Opening...' : 'Open Subscription Management'}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
              <CardDescription>
                Let us help you find a solution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" onClick={handleContactSupport}>
                Chat with support
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help? Contact us at{' '}
            <a href="mailto:support@adamchat.app" className="text-primary hover:underline">
              support@adamchat.app
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CancelSubscription;