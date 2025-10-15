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
  
  // Track when the first subscription check completes
  useEffect(() => {
    if (!loadingSubscription && user) {
      setHasCompletedFirstCheck(true);
    }
    if (!user) {
      setHasCompletedFirstCheck(false);
    }
  }, [loadingSubscription, user]);
  
  // Only show modal after first check is complete
  useEffect(() => {
    // Don't do anything until first check is complete
    if (!hasCompletedFirstCheck) {
      return;
    }
    
    // If user has subscription, never show modal
    if (subscriptionStatus.subscribed) {
      setShowPricingModal(false);
      sessionStorage.removeItem('pricing_modal_shown');
      return;
    }
    
    // Only for free users: show modal once per session
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    
    if (user && !subscriptionStatus.subscribed && !hasShownModal) {
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    }
  }, [user, subscriptionStatus.subscribed, hasCompletedFirstCheck]);
  
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