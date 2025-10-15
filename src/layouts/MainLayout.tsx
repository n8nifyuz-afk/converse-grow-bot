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
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false);
  
  // Track subscription check completion
  useEffect(() => {
    // Only mark as checked when we have a user AND subscription loading is complete
    if (user && !loadingSubscription) {
      // Add a small delay to ensure state has fully settled
      const timer = setTimeout(() => {
        setHasCheckedSubscription(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!user) {
      // Reset when user signs out
      setHasCheckedSubscription(false);
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
    }
  }, [user, loadingSubscription]);

  // Show modal logic - ONLY after subscription check is complete
  useEffect(() => {
    // Don't run until subscription check is complete
    if (!hasCheckedSubscription) {
      return;
    }

    // Don't show modal if no user (shouldn't happen but safety check)
    if (!user) {
      setShowPricingModal(false);
      return;
    }

    // NEVER show for subscribed users - this is the critical check
    if (subscriptionStatus.subscribed) {
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // For free users: show once per session
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    if (!hasShownModal) {
      // Add small delay to ensure no flash
      const timer = setTimeout(() => {
        setShowPricingModal(true);
        sessionStorage.setItem('pricing_modal_shown', 'true');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [hasCheckedSubscription, user, subscriptionStatus.subscribed]);
  
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