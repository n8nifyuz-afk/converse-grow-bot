import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CookieBanner } from '@/components/CookieBanner';
import MainLayout from '@/layouts/MainLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ResetPassword from '@/pages/ResetPassword';
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import ProjectPage from '@/pages/ProjectPage';
import Help from '@/pages/Help';
import Home from '@/pages/Home';
import Pricing from '@/pages/Pricing';
import Privacy from '@/pages/Privacy';
import Terms from '@/pages/Terms';
import Cookies from '@/pages/Cookies';
import NotFound from '@/pages/NotFound';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import RefundPolicy from '@/pages/RefundPolicy';
import CancelSubscription from '@/pages/CancelSubscription';
import Admin from '@/pages/Admin';
import Features from '@/pages/Features';
import AITools from '@/pages/AITools';
import { SubscriptionCheckingOverlay } from '@/components/SubscriptionCheckingOverlay';

const queryClient = new QueryClient();

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <SubscriptionCheckingOverlay />
      <Router>
        <Routes>
          {/* Root route - shows Chat */}
          <Route path="/" element={
            <MainLayout>
              <Index />
            </MainLayout>
          } />
          
          {/* Chat routes */}
          <Route path="/chat" element={<Navigate to="/" replace />} />
          <Route path="/chat/:chatId" element={
            <ProtectedRoute>
              <MainLayout>
                <Chat />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Marketing homepage */}
          <Route path="/home" element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          } />
          
          {/* Public pages with header/footer */}
          <Route path="/features" element={
            <PublicLayout>
              <Features />
            </PublicLayout>
          } />
          <Route path="/ai-tools" element={
            <PublicLayout>
              <AITools />
            </PublicLayout>
          } />
          <Route path="/pricing" element={
            <PublicLayout>
              <Pricing />
            </PublicLayout>
          } />
          <Route path="/about" element={
            <PublicLayout>
              <About />
            </PublicLayout>
          } />
          <Route path="/contact" element={
            <PublicLayout>
              <Contact />
            </PublicLayout>
          } />
          <Route path="/terms" element={
            <PublicLayout>
              <Terms />
            </PublicLayout>
          } />
          <Route path="/privacy" element={
            <PublicLayout>
              <Privacy />
            </PublicLayout>
          } />
          <Route path="/refund-policy" element={
            <PublicLayout>
              <RefundPolicy />
            </PublicLayout>
          } />
          <Route path="/cookie-policy" element={
            <PublicLayout>
              <Cookies />
            </PublicLayout>
          } />
          <Route path="/cancel-subscription" element={
            <PublicLayout>
              <CancelSubscription />
            </PublicLayout>
          } />
          
          {/* Existing protected routes */}
          <Route path="/project/:projectId" element={
            <ProtectedRoute>
              <MainLayout>
                <ProjectPage />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/help" element={<Help />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <MainLayout>
                <Admin />
              </MainLayout>
            </ProtectedRoute>
          } />
          
          {/* Auth pages */}
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <CookieBanner />
      <Toaster />
      <Sonner />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;