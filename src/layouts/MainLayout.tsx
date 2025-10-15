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
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);
  
  // Track when initial subscription check completes (not just loading state)
  useEffect(() => {
    if (!user) {
      setHasCompletedInitialCheck(false);
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // Only mark as complete when:
    // 1. We have a user
    // 2. Loading is complete
    // 3. We wait a bit to ensure Stripe API call has finished
    if (!loadingSubscription) {
      const timer = setTimeout(() => {
        setHasCompletedInitialCheck(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [user, loadingSubscription]);

  // Show modal logic - ONLY run after initial check completes
  useEffect(() => {
    // Critical: Don't run until we've completed the initial subscription check
    if (!hasCompletedInitialCheck) {
      return;
    }

    if (!user) {
      setShowPricingModal(false);
      return;
    }

    // NEVER show for subscribed users (this is the critical check)
    if (subscriptionStatus.subscribed) {
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // For free users only: show once per session
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    if (!hasShownModal) {
      // Small delay to ensure no flash
      const timer = setTimeout(() => {
        setShowPricingModal(true);
        sessionStorage.setItem('pricing_modal_shown', 'true');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedInitialCheck, user, subscriptionStatus.subscribed]);
  
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