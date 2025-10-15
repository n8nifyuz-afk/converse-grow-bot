import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingModal } from './PricingModal';
import { useAuth } from '@/contexts/AuthContext';

interface MessageLimitWarningProps {
  messageCount: number;
  limit: number;
}

export const MessageLimitWarning: React.FC<MessageLimitWarningProps> = ({ messageCount, limit }) => {
  const navigate = useNavigate();
  const { subscriptionStatus, loadingSubscription } = useAuth();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const handleUpgradeClick = () => {
    // Only show pricing modal for free users
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setIsPricingModalOpen(true);
    }
  };

  return (
    <>
      <div className="w-full max-w-3xl mx-auto px-4 py-3">
        <div className="bg-destructive/10 dark:bg-destructive/10 border border-destructive/30 dark:border-destructive/20 rounded-lg p-4 space-y-2">
          <p className="text-destructive dark:text-destructive-foreground text-sm font-medium">
            You've reached your free message limit. Upgrade to Pro or Ultra Pro for unlimited chats.
          </p>
          <Button 
            onClick={handleUpgradeClick}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"
          >
            <Gem className="w-3.5 h-3.5" />
            Upgrade
          </Button>
        </div>
      </div>
      
      <PricingModal 
        open={isPricingModalOpen}
        onOpenChange={setIsPricingModalOpen}
      />
    </>
  );
};
