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
  const [hasCheckedForModal, setHasCheckedForModal] = useState(false);
  
  // Show modal logic - run after subscription check completes
  useEffect(() => {
    console.log('[MAIN-LAYOUT] Modal decision:', {
      loadingSubscription,
      hasUser: !!user,
      subscribed: subscriptionStatus.subscribed,
      currentModalState: showPricingModal,
      hasCheckedForModal,
      sessionFlag: sessionStorage.getItem('pricing_modal_shown')
    });

    // Don't run until loading is complete
    if (loadingSubscription) {
      console.log('[MAIN-LAYOUT] Still loading subscription');
      return;
    }

    // Only run this logic once after loading completes
    if (hasCheckedForModal) {
      console.log('[MAIN-LAYOUT] Already checked, skipping');
      return;
    }

    // Mark that we've checked
    setHasCheckedForModal(true);

    // Don't show if no user
    if (!user) {
      console.log('[MAIN-LAYOUT] No user');
      return;
    }

    // NEVER show for subscribed users
    if (subscriptionStatus.subscribed) {
      console.log('[MAIN-LAYOUT] User is subscribed, not showing modal');
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // For free users only: show once per session
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    if (!hasShownModal) {
      console.log('[MAIN-LAYOUT] Free user, showing modal');
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    } else {
      console.log('[MAIN-LAYOUT] Modal already shown this session');
    }
  }, [loadingSubscription, hasCheckedForModal]);

  // Reset check flag when user changes
  useEffect(() => {
    setHasCheckedForModal(false);
    if (!user) {
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
    }
  }, [user?.id]);
  
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