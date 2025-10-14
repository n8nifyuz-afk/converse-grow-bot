import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PricingModal } from './PricingModal';

interface MessageLimitWarningProps {
  messageCount: number;
  limit: number;
}

export const MessageLimitWarning: React.FC<MessageLimitWarningProps> = ({ messageCount, limit }) => {
  const navigate = useNavigate();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  return (
    <>
      <div className="w-full max-w-3xl mx-auto px-4 py-3">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
          <p className="text-destructive-foreground text-sm">
            You've reached your free message limit. Upgrade to Pro for unlimited chats.
          </p>
          <Button 
            onClick={() => setIsPricingModalOpen(true)}
            className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-4 py-2 font-semibold flex items-center gap-2"
          >
            <Gem className="w-4 h-4" />
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
