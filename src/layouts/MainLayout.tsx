import React, { useEffect, useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatSidebar from "@/components/ChatSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { PricingModal } from "@/components/PricingModal";

function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col bg-background min-w-0">
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const isMobile = useIsMobile();
  const { user, subscriptionStatus, loadingSubscription } = useAuth();
  const [showPricingModal, setShowPricingModal] = useState(false);
  
  // Show/hide modal based on subscription status
  useEffect(() => {
    console.log('[MAIN-LAYOUT] Modal logic:', {
      loadingSubscription,
      hasUser: !!user,
      subscribed: subscriptionStatus.subscribed,
      product_id: subscriptionStatus.product_id,
      currentModalState: showPricingModal,
      sessionFlag: sessionStorage.getItem('pricing_modal_shown')
    });

    // While loading, don't make any changes
    if (loadingSubscription) {
      console.log('[MAIN-LAYOUT] Still loading subscription...');
      return;
    }

    // No user - clear everything
    if (!user) {
      console.log('[MAIN-LAYOUT] No user, clearing modal');
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // User is subscribed - NEVER show modal, always hide it
    if (subscriptionStatus.subscribed) {
      console.log('[MAIN-LAYOUT] Subscribed user - hiding modal');
      if (showPricingModal) {
        setShowPricingModal(false);
      }
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // Free user - show once per session
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    if (!hasShownModal) {
      console.log('[MAIN-LAYOUT] Free user - showing modal once');
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    } else {
      console.log('[MAIN-LAYOUT] Modal already shown to free user this session');
    }
  }, [loadingSubscription, user, subscriptionStatus.subscribed, subscriptionStatus.product_id, showPricingModal]);
  
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex min-h-screen w-full bg-background">
        <ChatSidebar isOpen={true} onClose={() => {}} />
        <MainContent>{children}</MainContent>
      </div>
      
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
    </SidebarProvider>
  );
}