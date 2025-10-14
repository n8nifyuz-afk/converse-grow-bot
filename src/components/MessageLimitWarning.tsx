import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Diamond } from 'lucide-react';
import { PricingModal } from './PricingModal';

interface MessageLimitWarningProps {
  messageCount: number;
  limit: number;
}

export const MessageLimitWarning: React.FC<MessageLimitWarningProps> = ({ messageCount, limit }) => {
  const [showPricingModal, setShowPricingModal] = useState(false);

  return (
    <>
      <div className="w-full max-w-4xl mx-auto px-4 py-3">
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6">
          <p className="text-destructive text-base mb-4">
            I would love to answer this, but you have no more free chats left. Please upgrade to Pro to continue.
          </p>
          <Button
            onClick={() => setShowPricingModal(true)}
            className="bg-background text-foreground border-2 border-foreground hover:bg-muted rounded-full px-6 py-2 flex items-center gap-2"
          >
            <Diamond className="w-4 h-4" />
            Upgrade
          </Button>
        </div>
      </div>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </>
  );
};
