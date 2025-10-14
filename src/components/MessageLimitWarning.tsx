import React from 'react';
import { Button } from '@/components/ui/button';
import { Gem } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MessageLimitWarningProps {
  messageCount: number;
  limit: number;
}

export const MessageLimitWarning: React.FC<MessageLimitWarningProps> = ({ messageCount, limit }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 space-y-4">
        <p className="text-destructive-foreground text-base leading-relaxed">
          I would love to answer this, but you have no more free chats left. Please upgrade to Pro to continue.
        </p>
        <Button 
          onClick={() => navigate('/pricing-plans')}
          className="bg-foreground text-background hover:bg-foreground/90 rounded-lg px-6 py-3 font-semibold flex items-center gap-2"
        >
          <Gem className="w-5 h-5" />
          Upgrade
        </Button>
      </div>
    </div>
  );
};
