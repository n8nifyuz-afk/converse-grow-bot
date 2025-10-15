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
  
  // Track when user first signs in to prevent modal from showing immediately
  useEffect(() => {
    if (user) {
      // Mark that user just signed in - prevent modal for this session
      const justSignedIn = sessionStorage.getItem('just_signed_in');
      if (!justSignedIn) {
        sessionStorage.setItem('just_signed_in', 'true');
      }
    } else {
      // Clear all modal-related flags on sign out
      sessionStorage.removeItem('just_signed_in');
      sessionStorage.removeItem('pricing_modal_shown');
      setShowPricingModal(false);
    }
  }, [user?.id]); // Only run when user ID changes (sign in/out)

  // Show modal logic - only after subscription check completes
  useEffect(() => {
    // Don't show modal if still checking subscription
    if (loadingSubscription) {
      return;
    }

    // Don't show modal if no user
    if (!user) {
      setShowPricingModal(false);
      return;
    }

    // Never show for subscribed users
    if (subscriptionStatus.subscribed) {
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // Don't show modal immediately after sign-in (wait for next visit)
    const justSignedIn = sessionStorage.getItem('just_signed_in');
    if (justSignedIn) {
      sessionStorage.removeItem('just_signed_in');
      return;
    }

    // Show once per session for free users (on subsequent visits)
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    if (!hasShownModal) {
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    }
  }, [user, loadingSubscription, subscriptionStatus.subscribed]);
  
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