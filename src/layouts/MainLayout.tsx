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
  const [hasCompletedFirstCheck, setHasCompletedFirstCheck] = useState(false);
  
  console.log('[MAIN-LAYOUT] Component render:', {
    isMobile,
    hasUser: !!user,
    showPricingModal,
    hasCompletedFirstCheck
  });
  
  // Track when the first subscription check completes
  useEffect(() => {
    console.log('[MAIN-LAYOUT] Subscription state:', {
      loadingSubscription,
      subscribed: subscriptionStatus.subscribed,
      hasUser: !!user,
      hasCompletedFirstCheck
    });
    
    // Reset check flag when loading starts
    if (loadingSubscription) {
      console.log('[MAIN-LAYOUT] Subscription check started, resetting flag');
      setHasCompletedFirstCheck(false);
      return;
    }
    
    // Set check complete flag when loading finishes
    if (!loadingSubscription && user) {
      console.log('[MAIN-LAYOUT] First check completed');
      setHasCompletedFirstCheck(true);
    }
    if (!user) {
      console.log('[MAIN-LAYOUT] No user, resetting check');
      setHasCompletedFirstCheck(false);
    }
  }, [loadingSubscription, user, subscriptionStatus.subscribed, hasCompletedFirstCheck]);
  
  // Only show modal after first check is complete
  useEffect(() => {
    console.log('[MAIN-LAYOUT] Modal decision:', {
      hasCompletedFirstCheck,
      subscribed: subscriptionStatus.subscribed,
      hasUser: !!user,
      currentModalState: showPricingModal
    });
    
    // Don't do anything until first check is complete
    if (!hasCompletedFirstCheck) {
      console.log('[MAIN-LAYOUT] Waiting for first check to complete');
      return;
    }
    
    // If user has subscription, never show modal
    if (subscriptionStatus.subscribed) {
      console.log('[MAIN-LAYOUT] User is subscribed, hiding modal');
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }
    
  // Only for free users: show modal once per session
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    
    console.log('[MAIN-LAYOUT] Modal decision check:', {
      hasUser: !!user,
      subscribed: subscriptionStatus.subscribed,
      hasShownModal,
      isMobile,
      willShow: user && !subscriptionStatus.subscribed && !hasShownModal
    });
    
    if (user && !subscriptionStatus.subscribed && !hasShownModal) {
      console.log('[MAIN-LAYOUT] ✅ SHOWING pricing modal for free user');
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    } else {
      console.log('[MAIN-LAYOUT] ❌ NOT showing modal:', {
        hasUser: !!user,
        subscribed: subscriptionStatus.subscribed,
        hasShownModal
      });
    }
  }, [user, subscriptionStatus.subscribed, hasCompletedFirstCheck, showPricingModal]);
  
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