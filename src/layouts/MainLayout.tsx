import React from 'react';
import { useLocation } from 'react-router-dom';
import { SidebarProvider } from "@/components/ui/sidebar";
import ChatSidebar from "@/components/ChatSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { PricingModal } from "@/components/PricingModal";
import { useAuth } from "@/contexts/AuthContext";

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
  const { showPricingModal, setShowPricingModal } = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin' || location.pathname === '/admin/';
  
  // For admin page, don't use sidebar at all
  if (isAdminPage) {
    return (
      <>
        <div className="flex min-h-screen w-full bg-background">
          <MainContent>{children}</MainContent>
        </div>
        
        <PricingModal 
          open={showPricingModal} 
          onOpenChange={setShowPricingModal} 
        />
      </>
    );
  }
  
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