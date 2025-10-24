import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from './PricingModal';
import { useTranslation } from 'react-i18next';
import { Gem } from 'lucide-react';

export const GoProButton = () => {
  const { subscriptionStatus, loadingSubscription } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { t } = useTranslation();

  // Hide button while loading or if user has any subscription
  if (loadingSubscription || subscriptionStatus.subscribed) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowPricingModal(true)}
        data-pricing-trigger="true"
        aria-label={t('upgradeButton.upgradeNow')}
        className="flex items-center gap-1 px-1.5 py-1 sm:gap-2 sm:px-4 sm:py-2 rounded-[20px] bg-transparent border-2 hover:-translate-y-0.5 transition-transform duration-150"
        style={{ borderColor: '#b0851e' }}
      >
        {/* Diamond Icon */}
        <Gem 
          className="w-3.5 h-3.5 sm:w-5 sm:h-5"
          style={{ color: '#b0851e' }}
          strokeWidth={2.5}
        />

        {/* Text with gold gradient */}
        <span
          className="font-semibold leading-tight text-xs sm:text-base"
          style={{
            background: "linear-gradient(90deg,#b0851e,#d4aa3a)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            letterSpacing: "0.3px",
          }}
        >
          {t('upgradeButton.upgradeNow')}
        </span>
      </button>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </>
  );
};
