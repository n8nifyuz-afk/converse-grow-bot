import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingModal } from './PricingModal';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface MessageLimitWarningProps {
  messageCount: number;
  limit: number;
  show: boolean;
  onHide: () => void;
}

export const MessageLimitWarning: React.FC<MessageLimitWarningProps> = ({ messageCount, limit, show, onHide }) => {
  const navigate = useNavigate();
  const { subscriptionStatus, loadingSubscription } = useAuth();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const { t } = useTranslation();
  const warningRef = useRef<HTMLDivElement>(null);

  // Scroll to warning when it appears
  useEffect(() => {
    if (show && warningRef.current) {
      warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [show]);

  const handleUpgradeClick = () => {
    // Only show pricing modal for free users
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setIsPricingModalOpen(true);
    }
  };

  if (!show) return null;

  return (
    <>
      <div ref={warningRef} className="w-full max-w-3xl mx-auto px-4 py-3">
        <div className="bg-destructive/10 dark:bg-destructive/10 border border-destructive/30 dark:border-destructive/20 rounded-lg p-4 space-y-2">
          <p className="text-destructive dark:text-destructive-foreground text-sm font-medium">
            {t('messageLimitWarning.limitReached')}
          </p>
          <Button 
            onClick={handleUpgradeClick}
            className="bg-foreground hover:bg-foreground/90 text-background rounded-md px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5"
          >
            <Gem className="w-3.5 h-3.5" />
            {t('messageLimitWarning.upgrade')}
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
