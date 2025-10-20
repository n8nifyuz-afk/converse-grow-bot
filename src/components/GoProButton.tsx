import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from './PricingModal';
import { useTranslation } from 'react-i18next';
import rocketIcon from '@/assets/rocket-icon.png';

export const GoProButton = () => {
  const { subscriptionStatus, loadingSubscription } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { t } = useTranslation();

  console.log('[GO-PRO-BUTTON] Render state:', {
    loadingSubscription,
    subscribed: subscriptionStatus.subscribed,
    willShow: !loadingSubscription && !subscriptionStatus.subscribed
  });

  // Hide button while loading or if user has any subscription
  if (loadingSubscription || subscriptionStatus.subscribed) {
    console.log('[GO-PRO-BUTTON] Hiding button:', {
      loadingSubscription,
      subscribed: subscriptionStatus.subscribed
    });
    return null;
  }

  const handleClick = () => {
    console.log('[GO-PRO-BUTTON] Button clicked, showing modal');
    setShowPricingModal(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        data-pricing-trigger="true"
        aria-label={t('upgradeButton.upgradeNow')}
        className="flex items-center gap-1 px-1.5 py-1 sm:gap-2 sm:px-4 sm:py-2 rounded-[20px] bg-transparent border-2 hover:-translate-y-0.5 transition-transform duration-150"
        style={{ borderColor: '#b0851e' }}
      >
        {/* Rocket Icon */}
        <img 
          src={rocketIcon} 
          alt="Rocket" 
          className="w-3.5 h-3.5 sm:w-5 sm:h-5"
          style={{
            filter: "brightness(0) saturate(100%) invert(49%) sepia(56%) saturate(475%) hue-rotate(7deg) brightness(95%) contrast(89%)"
          }}
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
