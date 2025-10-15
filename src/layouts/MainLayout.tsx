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
  
  // Only show modal after subscription check is complete
  useEffect(() => {
    console.log('[MAIN-LAYOUT] Modal decision:', {
      loadingSubscription,
      subscribed: subscriptionStatus.subscribed,
      hasUser: !!user,
      currentModalState: showPricingModal
    });
    
    // CRITICAL: Never show modal while loading
    if (loadingSubscription) {
      console.log('[MAIN-LAYOUT] Still loading subscription, hiding modal');
      setShowPricingModal(false);
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
    
    if (user && !subscriptionStatus.subscribed && !hasShownModal) {
      console.log('[MAIN-LAYOUT] Showing pricing modal for free user');
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    } else {
      console.log('[MAIN-LAYOUT] Not showing modal:', {
        hasUser: !!user,
        subscribed: subscriptionStatus.subscribed,
        hasShownModal
      });
    }
  }, [user, subscriptionStatus.subscribed, loadingSubscription, showPricingModal]);
  
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