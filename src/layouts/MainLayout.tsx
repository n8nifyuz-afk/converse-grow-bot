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
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  
  // Clear pricing modal flag when user changes (only for free users)
  useEffect(() => {
    if (user) {
      // Wait a bit for subscription to load before clearing flag
      const timer = setTimeout(() => {
        if (!loadingSubscription && !subscriptionStatus.subscribed) {
          sessionStorage.removeItem('pricing_modal_shown');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user?.id, loadingSubscription, subscriptionStatus.subscribed]);
  
  useEffect(() => {
    // Mark subscription as checked when loading completes
    if (user && !loadingSubscription) {
      setSubscriptionChecked(true);
    } else if (!user) {
      setSubscriptionChecked(false);
    }
  }, [user, loadingSubscription]);
  
  useEffect(() => {
    // Close modal immediately if user has subscription
    if (subscriptionStatus.subscribed) {
      setShowPricingModal(false);
      return;
    }
    
    // Only show pricing modal for free users after subscription has been verified
    const hasShownModal = sessionStorage.getItem('pricing_modal_shown');
    
    if (user && subscriptionChecked && !subscriptionStatus.subscribed && !hasShownModal) {
      console.log('📊 Showing pricing modal for free user');
      setShowPricingModal(true);
      sessionStorage.setItem('pricing_modal_shown', 'true');
    }
  }, [user, subscriptionStatus.subscribed, subscriptionChecked]);
  
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