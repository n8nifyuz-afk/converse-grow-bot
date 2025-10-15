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
  const [isReady, setIsReady] = useState(false);
  
  // Wait for subscription check to complete before showing modal
  useEffect(() => {
    if (!user) {
      setIsReady(false);
      setShowPricingModal(false);
      return;
    }

    // Wait for loading to complete
    if (loadingSubscription) {
      setIsReady(false);
      return;
    }

    // Add a small delay to ensure Stripe check has completed
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [user, loadingSubscription]);

  // Show modal only after ready and if user is free tier
  useEffect(() => {
    if (!isReady || !user) return;

    // Never show for subscribed users
    if (subscriptionStatus.subscribed) {
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }

    // Show once per session for free users
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    if (!hasShownModal) {
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    }
  }, [isReady, user, subscriptionStatus.subscribed]);
  
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