import React from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { 
  Settings, 
  User, 
  CreditCard,
  Monitor,
  Sun,
  Moon,
  Trash2,
  Mail,
  Shield,
  Check,
  Crown,
  ImageIcon,
  Languages
} from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const sidebarItems = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'subscription', label: 'Subscription', icon: Crown },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data Control', icon: CreditCard },
];

const themeOptions = [
  { value: 'light' as const, label: 'Light', icon: Sun },
  { value: 'dark' as const, label: 'Dark', icon: Moon },
  { value: 'system' as const, label: 'System', icon: Monitor },
];


export default function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [activeTab, setActiveTab] = React.useState('general');
  const [isExporting, setIsExporting] = React.useState(false);
  const [isLoadingPortal, setIsLoadingPortal] = React.useState(false);
  const [displayName, setDisplayName] = React.useState('');
  const [isUpdatingName, setIsUpdatingName] = React.useState(false);
  const { theme, accentColor, setTheme, setAccentColor } = useTheme();
  const { toast } = useToast();
  const { user, signOut, userProfile, subscriptionStatus, checkSubscription } = useAuth();
  const isMobile = useIsMobile();
  const { usageLimits, loading: limitsLoading } = useUsageLimits();
  const { i18n, t } = useTranslation();

  // Initialize display name from profile
  React.useEffect(() => {
    if (userProfile?.display_name) {
      setDisplayName(userProfile.display_name);
    }
  }, [userProfile]);

  const sidebarItems = [
    { id: 'general', label: t('settings.general'), icon: Settings },
    { id: 'profile', label: t('settings.profile'), icon: User },
    { id: 'subscription', label: t('settings.subscription'), icon: Crown },
    { id: 'security', label: t('settings.security'), icon: Shield },
    { id: 'data', label: t('settings.dataControl'), icon: CreditCard },
  ];

  const themeOptions = [
    { value: 'light' as const, label: t('settings.light'), icon: Sun },
    { value: 'dark' as const, label: t('settings.dark'), icon: Moon },
    { value: 'system' as const, label: t('settings.system'), icon: Monitor },
  ];

  const accentColors = [
    { value: 'blue' as const, label: t('accentColors.blue'), color: '#3B82F6' },
    { value: 'indigo' as const, label: t('accentColors.indigo'), color: '#6366F1' },
    { value: 'purple' as const, label: t('accentColors.purple'), color: '#8B5CF6' },
    { value: 'green' as const, label: t('accentColors.green'), color: '#10B981' },
    { value: 'orange' as const, label: t('accentColors.orange'), color: '#F97316' },
    { value: 'red' as const, label: t('accentColors.red'), color: '#EF4444' },
    { value: 'gray' as const, label: t('accentColors.gray'), color: '#6B7280' },
  ];

  const handleSetTheme = (newTheme: typeof theme) => {
    setTheme(newTheme);
  };

  const handleSetAccentColor = (color: typeof accentColor) => {
    setAccentColor(color);
  };

  const handleLanguageChange = async (newLanguage: string) => {
    await i18n.changeLanguage(newLanguage);
    
    // Save to localStorage for non-logged-in users
    localStorage.setItem('i18nextLng', newLanguage);
    
    // Save to database for logged-in users
    if (user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ language: newLanguage })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Failed to save language preference:', error);
        }
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
    
    toast({
      title: t('toast.languageUpdated'),
      description: `${t('toast.languageChangedTo')} ${newLanguage === 'en' ? 'English' : newLanguage === 'es' ? 'Español' : newLanguage === 'fr' ? 'Français' : newLanguage === 'de' ? 'Deutsch' : newLanguage === 'pt' ? 'Português' : newLanguage === 'it' ? 'Italiano' : newLanguage === 'zh' ? '中文' : newLanguage === 'ja' ? '日本語' : newLanguage === 'ar' ? 'العربية' : 'Русский'}`,
    });
  };

  const handleUpdateDisplayName = async () => {
    if (!user || !displayName.trim()) return;
    
    setIsUpdatingName(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Name Updated',
        description: 'Your display name has been updated successfully.',
      });
      
      // Refresh the page to update the display name everywhere
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Update name error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update display name. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleLogoutThisDevice = async () => {
    try {
      await signOut();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: t('toast.failedLogout'),
        variant: "destructive",
      });
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      // First revoke the refresh token which invalidates all sessions globally
      const { error: revokeError } = await supabase.auth.admin.signOut(user?.id || '');
      if (revokeError) {
        console.log('Admin signout not available, using regular global signout');
      }

      // Use global signout scope to sign out from all devices
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      await signOut();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t('toast.error'),
        description: t('toast.failedLogoutAllDevices'),
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    toast({
      title: t('toast.exportStarted'),
      description: t('toast.exportStartedDesc'),
    });

    try {
      // Fetch all chats and messages
      const { data: chats, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          messages (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (chatsError) throw chatsError;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Create ZIP file
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // 1. conversations.json
      const conversationsJson = {
        exportDate: new Date().toISOString(),
        totalChats: chats?.length || 0,
        conversations: chats?.map(chat => ({
          id: chat.id,
          title: chat.title,
          createdAt: chat.created_at,
          updatedAt: chat.updated_at,
          messages: chat.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.created_at,
            fileAttachments: msg.file_attachments
          }))
        })) || []
      };
      zip.file('conversations.json', JSON.stringify(conversationsJson, null, 2));

      // 2. conversations.html
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Export - ${profile?.display_name || 'User'}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
        .chat { margin-bottom: 40px; border: 1px solid #eee; border-radius: 8px; padding: 20px; }
        .chat-title { font-size: 1.2em; font-weight: bold; color: #333; margin-bottom: 10px; }
        .chat-meta { color: #666; font-size: 0.9em; margin-bottom: 20px; }
        .message { margin: 15px 0; padding: 12px; border-radius: 8px; }
        .user-message { background: #007bff; color: white; margin-left: 20px; }
        .assistant-message { background: #f8f9fa; border: 1px solid #dee2e6; margin-right: 20px; }
        .message-role { font-weight: bold; margin-bottom: 5px; text-transform: capitalize; }
        .message-content { white-space: pre-wrap; }
        .timestamp { font-size: 0.8em; opacity: 0.7; margin-top: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Chat Export</h1>
            <p><strong>User:</strong> ${profile?.display_name || 'Unknown'} (${profile?.email || 'No email'})</p>
            <p><strong>Export Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Total Conversations:</strong> ${chats?.length || 0}</p>
        </div>
        
        ${chats?.map(chat => `
            <div class="chat">
                <div class="chat-title">${chat.title}</div>
                <div class="chat-meta">
                    Created: ${new Date(chat.created_at).toLocaleString()} | 
                    Messages: ${chat.messages.length}
                </div>
                ${chat.messages.map((msg: any) => `
                    <div class="message ${msg.role}-message">
                        <div class="message-role">${msg.role}</div>
                        <div class="message-content">${msg.content}</div>
                        <div class="timestamp">${new Date(msg.created_at).toLocaleString()}</div>
                    </div>
                `).join('')}
            </div>
        `).join('') || '<p>No conversations found.</p>'}
    </div>
</body>
</html>`;
      zip.file('conversations.html', htmlContent);

      // 3. metadata.json
      const metadata = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          displayName: profile?.display_name,
          signupMethod: profile?.signup_method,
          accountCreated: profile?.created_at,
          theme: theme,
          accentColor: accentColor
        },
        statistics: {
          totalChats: chats?.length || 0,
          totalMessages: chats?.reduce((acc, chat) => acc + chat.messages.length, 0) || 0,
          firstChatDate: chats?.[0]?.created_at,
          lastChatDate: chats?.[chats.length - 1]?.created_at
        }
      };
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chatlearn-export-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: t('toast.exportCompleted'),
        description: t('toast.exportCompletedDesc'),
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: t('toast.exportFailed'),
        description: t('toast.exportFailedDesc'),
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllChats = async () => {
    if (!user) return;
    
    try {
      // First delete all user images from storage
      try {
        await supabase.functions.invoke('delete-all-user-images', {
          body: { userId: user.id }
        });
      } catch (imageError) {
        console.error('Error deleting user images:', imageError);
        // Continue with data deletion even if image deletion fails
      }

      // Delete all user data except profile (cascading will handle messages)
      const deleteOperations = [
        supabase.from('projects').delete().eq('user_id', user.id),
        supabase.from('chats').delete().eq('user_id', user.id),
      ];

      const results = await Promise.all(deleteOperations);
      
      // Check for any errors
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error('Failed to delete some data');
      }

      toast({
        title: t('toast.allDataDeleted'),
        description: t('toast.allDataDeletedDesc'),
      });

      // Close settings modal and redirect to home page
      onOpenChange(false);
      window.location.href = 'https://www.chatl.ai/';
    } catch (error: any) {
      console.error('Delete all chats error:', error);
      toast({
        title: t('toast.errorDeletingData'),
        description: t('toast.unableToDeleteData'),
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session found');
      }

      // Call the edge function to delete the account
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Failed to delete account');
      }
      
      toast({
        title: t('toast.accountDeleted'),
        description: t('toast.accountDeletedDesc'),
      });
      
      // Sign out and close modal
      await supabase.auth.signOut();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Delete account error:', error);
      toast({
        title: t('toast.errorDeletingAccount'),
        description: error.message || t('toast.unableToDeleteAccount'),
        variant: "destructive",
      });
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;
    
    setIsLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Customer portal error:', error);
      
      // Extract the error message from the response
      let errorMessage = t('toast.failedOpenPortal');
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error.error) {
        errorMessage = error.error;
      }
      
      toast({
        title: t('toast.stripeConfigRequired'),
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show longer for important configuration message
      });
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('settings.general')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('settings.customizeExperience')}</p>
            </div>
            
            <div className="space-y-5">
              {/* Theme Setting */}
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-card via-card to-card/80">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Monitor className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground">{t('settings.theme')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground ml-10">{t('settings.themeDescription')}</p>
                    </div>
                    <Select value={theme} onValueChange={handleSetTheme}>
                      <SelectTrigger className="w-full sm:w-40 h-11 bg-background border-2 border-border hover:border-primary/50 transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-2 border-border shadow-xl">
                        {themeOptions.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem 
                              key={option.value} 
                              value={option.value}
                              className="hover:bg-accent focus:bg-accent cursor-pointer py-3"
                            >
                              <div className="flex items-center gap-3">
                                <Icon className="h-4 w-4 text-primary" />
                                <span className="font-medium">{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Accent Color Setting */}
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-card via-card to-card/80">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <div className="h-4 w-4 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                        </div>
                        <p className="font-semibold text-foreground">{t('settings.accentColor')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground ml-10">{t('settings.accentColorDescription')}</p>
                    </div>
                    <Select value={accentColor} onValueChange={handleSetAccentColor}>
                      <SelectTrigger className="w-full sm:w-40 h-11 bg-background border-2 border-border hover:border-primary/50 transition-colors">
                        <SelectValue>
                          {(() => {
                            const currentColor = accentColors.find(color => color.value === accentColor);
                            return currentColor ? (
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full shadow-sm border border-background" 
                                  style={{ backgroundColor: currentColor.color }}
                                />
                                <span>{currentColor.label}</span>
                              </div>
                            ) : null;
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background border-2 border-border shadow-xl">
                        {accentColors.map((color) => (
                          <SelectItem 
                            key={color.value} 
                            value={color.value}
                            className="hover:bg-accent focus:bg-accent cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-5 h-5 rounded-full shadow-md border-2 border-background" 
                                style={{ backgroundColor: color.color }}
                              />
                              <span className="font-medium">{color.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Language Setting */}
              <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-card via-card to-card/80">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Languages className="h-4 w-4 text-primary" />
                        </div>
                        <p className="font-semibold text-foreground">{t('settings.language')}</p>
                      </div>
                      <p className="text-sm text-muted-foreground ml-10">
                        {user ? t('settings.languageSavedDescription') : t('settings.languageAutoDescription')}
                      </p>
                    </div>
                    <Select value={i18n.language.split('-')[0]} onValueChange={handleLanguageChange}>
                      <SelectTrigger className="w-full sm:w-40 h-11 bg-background border-2 border-border hover:border-primary/50 transition-colors">
                        <SelectValue>
                          {(() => {
                            const languages = [
                              { code: 'en', name: 'English', flag: '🇬🇧' },
                              { code: 'es', name: 'Español', flag: '🇪🇸' },
                              { code: 'fr', name: 'Français', flag: '🇫🇷' },
                              { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                              { code: 'pt', name: 'Português', flag: '🇵🇹' },
                              { code: 'it', name: 'Italiano', flag: '🇮🇹' },
                              { code: 'zh', name: '中文', flag: '🇨🇳' },
                              { code: 'ja', name: '日本語', flag: '🇯🇵' },
                              { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                              { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                            ];
                            const currentLang = languages.find(lang => lang.code === i18n.language.split('-')[0]);
                            return currentLang ? (
                              <div className="flex items-center gap-2">
                                <span>{currentLang.flag}</span>
                                <span>{currentLang.name}</span>
                              </div>
                            ) : t('settings.selectLanguage');
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background border-2 border-border shadow-xl max-h-[300px]">
                        {[
                          { code: 'en', name: 'English', flag: '🇬🇧' },
                          { code: 'es', name: 'Español', flag: '🇪🇸' },
                          { code: 'fr', name: 'Français', flag: '🇫🇷' },
                          { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
                          { code: 'pt', name: 'Português', flag: '🇵🇹' },
                          { code: 'it', name: 'Italiano', flag: '🇮🇹' },
                          { code: 'zh', name: '中文', flag: '🇨🇳' },
                          { code: 'ja', name: '日本語', flag: '🇯🇵' },
                          { code: 'ar', name: 'العربية', flag: '🇸🇦' },
                          { code: 'ru', name: 'Русский', flag: '🇷🇺' },
                        ].map((lang) => (
                          <SelectItem 
                            key={lang.code} 
                            value={lang.code}
                            className="hover:bg-accent focus:bg-accent cursor-pointer py-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{lang.flag}</span>
                              <span className="font-medium">{lang.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        );

      case 'profile':
        if (!user) {
        return (
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('profile.title')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('profile.signInToManage')}</p>
            </div>
            <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="space-y-4">
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center">
                    <User className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1.5 md:space-y-2">
                    <p className="font-medium text-foreground text-sm md:text-base">{t('profile.signInToAccess')}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{t('profile.manageAccountPreferences')}</p>
                  </div>
                  <Button 
                    onClick={() => window.location.href = '/'}
                    className="mt-2 md:mt-4 w-full sm:w-auto"
                  >
                    {t('profile.signIn')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
        }
        return (
          <div className="space-y-3 md:space-y-4">
            <div className="space-y-1 md:space-y-1.5">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">{t('profile.title')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('profile.manageAccount')}</p>
            </div>
            
            <div className="space-y-3 md:space-y-4">{/* Full Name Section - Only for Phone Users */}
              {userProfile?.signup_method === 'phone' && (
                <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-3 md:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 md:gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground text-sm">Full Name</p>
                          <p className="text-xs text-muted-foreground">Your display name</p>
                        </div>
                      </div>
                      <div className="ml-0 md:ml-9 space-y-2">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <Button 
                          onClick={handleUpdateDisplayName}
                          disabled={isUpdatingName || !displayName.trim() || displayName === userProfile?.display_name}
                          size="sm"
                          className="w-full sm:w-auto h-8 text-xs"
                        >
                          {isUpdatingName ? 'Updating...' : 'Update Name'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Email/Phone Section */}
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                        <Mail className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">
                          {user?.email ? t('profile.emailAddress') : 'Phone Number'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user?.email ? t('profile.yourAccountEmail') : 'Your registered phone number'}
                        </p>
                      </div>
                    </div>
                    <div className="ml-0 md:ml-9 mt-1.5">
                      <p className="font-medium text-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/30 break-all text-sm">
                        {user?.email || user?.phone || userProfile?.phone_number || 'Not available'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Login Methods Section */}
              <Card className="border border-border/40 bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm shadow-sm">
                <CardContent className="p-3 md:p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 md:gap-2.5">
                      <div className="p-1.5 bg-primary/10 rounded-lg flex-shrink-0">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{t('profile.loginMethods')}</p>
                        <p className="text-xs text-muted-foreground">{t('profile.connectedProviders')}</p>
                      </div>
                    </div>
                    
                    <div className="ml-0 md:ml-9 space-y-2.5">{/* Google Provider */}
                      {user?.app_metadata?.providers?.includes('google') && (
                        <div className="flex items-center justify-between gap-2.5 p-2.5 md:p-3 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm">
                          <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm flex-shrink-0">
                              <svg className="h-4 w-4" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm">Google</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{t('profile.signInWithGoogle')}</p>
                            </div>
                          </div>
                          <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Apple Provider */}
                      {user?.app_metadata?.providers?.includes('apple') && (
                        <div className="flex items-center justify-between gap-2.5 p-2.5 md:p-3 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm">
                          <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                            <div className="p-1.5 bg-black dark:bg-white rounded-lg shadow-sm flex-shrink-0">
                              <svg className="h-4 w-4 text-white dark:text-black" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm">Apple</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{t('profile.signInWithApple')}</p>
                            </div>
                          </div>
                          <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </div>
                        </div>
                      )}

                      {/* Microsoft Provider */}
                      {user?.app_metadata?.providers?.includes('azure') && (
                        <div className="flex items-center justify-between gap-2.5 p-2.5 md:p-3 bg-background/60 rounded-xl border border-border/30 backdrop-blur-sm">
                          <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                            <div className="p-1.5 bg-white rounded-lg shadow-sm flex-shrink-0">
                              <svg className="h-4 w-4" viewBox="0 0 23 23">
                                <path fill="#f35325" d="M0 0h11v11H0z"/>
                                <path fill="#81bc06" d="M12 0h11v11H12z"/>
                                <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                                <path fill="#ffba08" d="M12 12h11v11H12z"/>
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm">Microsoft</p>
                              <p className="text-xs text-muted-foreground hidden sm:block">{t('profile.signInWithMicrosoft')}</p>
                            </div>
                          </div>
                          <div className="p-1 bg-green-100 rounded-full flex-shrink-0">
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          </div>
                        </div>
                      )}
                      
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        );

      case 'subscription':
        if (!user) {
          return (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t('settings.subscription')}</h2>
                <p className="text-sm md:text-base text-muted-foreground">{t('subscription.signInToManageSubscription')}</p>
              </div>
              <div className="text-center py-6 md:py-8">
                <p className="text-sm md:text-base text-muted-foreground mb-4">{t('subscription.needSignIn')}</p>
                <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto">{t('subscription.signIn')}</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t('settings.subscription')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('settings.manageSubscriptionAndBilling')}</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Current Plan */}
              <Card className="shadow-sm border-primary/20">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Crown className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">{t('subscription.currentPlan')}</h3>
                      <p className="text-lg md:text-xl font-bold text-primary mb-2">
                        {subscriptionStatus.subscribed 
                          ? (['prod_TGsOnuDkIh9hVG', 'prod_TGqo8h59qNKZ4m', 'prod_TGqqoPGWQJ0T4a', 'prod_TIHYThP5XmWyWy'].includes(subscriptionStatus.product_id || '') 
                              ? t('subscription.proPlan')
                              : ['prod_TGqs5r2udThT0t', 'prod_TGquGexHO44m4T', 'prod_TGqwVIWObYLt6U', 'prod_TIHZLvUNMqIiCj'].includes(subscriptionStatus.product_id || '')
                              ? t('subscription.ultraProPlan')
                              : t('subscription.proPlan'))
                          : t('subscription.freePlan')}
                      </p>
                      {subscriptionStatus.subscription_end && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {t('subscription.renewsOn')} {new Date(subscriptionStatus.subscription_end).toLocaleDateString()}
                        </p>
                      )}
                      {!subscriptionStatus.subscribed && (
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {t('subscription.upgradeToUnlock')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Limits - Only show for paid plans */}
              {subscriptionStatus.subscribed && !limitsLoading && (
                <Card className="shadow-sm border-border/40">
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <ImageIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-base">{t('subscription.usageLimits')}</h3>
                          <p className="text-xs md:text-sm text-muted-foreground">{t('subscription.monthlyUsage')}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {/* Image Generations */}
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{t('subscription.imageGenerations')}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('subscription.resetsOn')} {usageLimits.resetDate ? new Date(usageLimits.resetDate).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              {usageLimits.remaining} / {usageLimits.limit}
                            </p>
                            <p className="text-xs text-muted-foreground">{t('subscription.remaining')}</p>
                          </div>
                        </div>
                        
                        {/* Upgrade suggestion for Pro users */}
                        {['prod_TGsOnuDkIh9hVG', 'prod_TGqo8h59qNKZ4m', 'prod_TGqqoPGWQJ0T4a', 'prod_TIHYThP5XmWyWy'].includes(subscriptionStatus.product_id || '') && usageLimits.remaining < 100 && (
                          <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-primary/20 rounded-lg">
                            <p className="text-sm font-medium text-foreground mb-1">{t('subscription.runningLow')}</p>
                            <p className="text-xs text-muted-foreground mb-2">{t('subscription.upgradeUltraProDesc')}</p>
                            <Button 
                              size="sm" 
                              className="w-full"
                              onClick={() => {
                                onOpenChange(false);
                                window.location.href = '/pricing';
                              }}
                            >
                              {t('subscription.upgradeToUltraPro')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Manage Subscription */}
              {subscriptionStatus.subscribed && (
                <Card className="shadow-sm">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold mb-1 text-sm md:text-base">{t('subscription.manageSubscription')}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {t('subscription.updatePayment')}
                        </p>
                      </div>
                      <Button 
                        onClick={handleManageSubscription}
                        disabled={isLoadingPortal}
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {isLoadingPortal ? t('subscription.loading') : t('subscription.manage')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upgrade CTA */}
              {!subscriptionStatus.subscribed && (
                <Card className="shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold mb-1 text-sm md:text-base">{t('subscription.upgradeToPro')}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {t('subscription.accessPremium')}
                        </p>
                      </div>
                      <Button 
                        onClick={() => {
                          onOpenChange(false);
                          // Trigger pricing modal to open
                          setTimeout(() => {
                            const pricingButton = document.querySelector('[data-pricing-trigger]') as HTMLElement;
                            if (pricingButton) {
                              pricingButton.click();
                            }
                          }, 100);
                        }}
                        size="sm"
                        className="w-full sm:w-auto"
                      >
                        {t('subscription.viewPlans')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case 'security':
        if (!user) {
          return (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t('security.title')}</h2>
                <p className="text-sm md:text-base text-muted-foreground">{t('security.signInToManage')}</p>
              </div>
              <div className="text-center py-6 md:py-8">
                <p className="text-sm md:text-base text-muted-foreground mb-4">{t('security.needSignIn')}</p>
                <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto">{t('security.signIn')}</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t('security.title')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('security.manageAccountSecurity')}</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Multi-Factor Authentication */}
              <div>
                <p className="font-medium mb-2 md:mb-3 text-sm md:text-base">{t('security.multiFactorAuth')}</p>
                <div className="p-3 md:p-4 bg-muted/30 rounded-lg border shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm md:text-base">{t('security.twoFactorAuth')}</p>
                      <p className="text-xs md:text-sm text-muted-foreground">{t('security.notAvailableYet')}</p>
                    </div>
                    <Button variant="outline" disabled size="sm" className="w-full sm:w-auto">
                      {t('security.enable')}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Session Management */}
              <div>
                <p className="font-medium mb-2 md:mb-3 text-sm md:text-base">{t('security.sessionManagement')}</p>
                <div className="space-y-3">
                  <div className="p-3 md:p-4 bg-muted/30 rounded-lg border shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">{t('security.currentDevice')}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{t('security.currentlySignedIn')}</p>
                      </div>
                      <Button variant="outline" onClick={handleLogoutThisDevice} size="sm" className="w-full sm:w-auto">
                        {t('security.signOut')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-3 md:p-4 bg-muted/30 rounded-lg border shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm md:text-base">{t('security.allDevices')}</p>
                        <p className="text-xs md:text-sm text-muted-foreground">{t('security.signOutAllDevices')}</p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full sm:w-auto">
                            {t('security.signOutEverywhere')}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base md:text-lg">{t('security.signOutAllDevicesQuestion')}</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              {t('security.signOutAllDevicesDesc')}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">{t('security.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleLogoutAllDevices} className="w-full sm:w-auto">
                              {t('security.signOutEverywhere')}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'data':
        if (!user) {
          return (
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t('dataControl.title')}</h2>
                <p className="text-sm md:text-base text-muted-foreground">{t('dataControl.signInToManage')}</p>
              </div>
              <div className="text-center py-6 md:py-8">
                <p className="text-sm md:text-base text-muted-foreground mb-4">{t('dataControl.needSignIn')}</p>
                <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto">{t('dataControl.signIn')}</Button>
              </div>
            </div>
          );
        }
        return (
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-1.5 md:space-y-2">
              <h2 className="text-xl md:text-2xl font-semibold text-foreground">{t('dataControl.title')}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{t('dataControl.manageData')}</p>
            </div>
            
            <div className="space-y-4 md:space-y-6">
              {/* Data Export */}
              <Card className="shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">{t('dataControl.exportData')}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t('dataControl.downloadAllData')}</p>
                    </div>
                    <Button 
                      onClick={handleExportData}
                      disabled={isExporting}
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {isExporting ? t('dataControl.exporting') : t('dataControl.export')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Delete All Chats */}
              <Card className="border-destructive/50 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">{t('dataControl.deleteAllData')}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t('dataControl.deleteAllDataDesc')}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('dataControl.deleteAll')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base md:text-lg">{t('dataControl.deleteAllDataQuestion')}</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            {t('dataControl.deleteAllDataWarning')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">{t('dataControl.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAllChats} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                            {t('dataControl.deleteAllDataConfirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              {/* Delete Account */}
              <Card className="border-destructive/50 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold mb-1 text-sm md:text-base">{t('dataControl.deleteAccount')}</h3>
                      <p className="text-xs md:text-sm text-muted-foreground">{t('dataControl.deleteAccountDesc')}</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="w-full sm:w-auto">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('dataControl.deleteAccountButton')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-base md:text-lg">{t('dataControl.deleteAccountQuestion')}</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            {t('dataControl.deleteAccountWarning')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="w-full sm:w-auto">{t('dataControl.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full sm:w-auto">
                            {t('dataControl.deleteAccountConfirm')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[92vh] md:h-[88vh] p-0 flex flex-col bg-background">
          <SheetHeader className="px-4 md:px-6 py-3 md:py-4 border-b border-border/40 flex-shrink-0 bg-gradient-to-r from-background to-background/95">
            <SheetTitle className="text-lg md:text-xl font-semibold text-left text-foreground">{t('settingsModal.title')}</SheetTitle>
          </SheetHeader>
          
          {/* Mobile Tab Navigation */}
          <div className="flex-shrink-0 border-b border-border/40 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
            <nav className="flex p-2 md:p-3 gap-1.5 md:gap-2 overflow-x-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isDisabled = !user && (item.id === 'profile' || item.id === 'data');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    disabled={isDisabled}
                    className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 md:gap-1.5 px-2 md:px-3 py-2.5 md:py-3 rounded-xl text-sm transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20'
                        : isDisabled
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:scale-105'
                    }`}
                  >
                    <div className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary/15' 
                        : 'bg-muted/40'
                    }`}>
                      <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </div>
                    <span className="text-[10px] md:text-xs font-medium leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/98">
            <div className="p-4 pb-8">
              {renderContent()}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-3xl lg:max-w-4xl h-[85vh] md:h-[80vh] p-0 bg-background border border-border/50 shadow-xl">
        <div className="flex h-full">
          {/* Desktop Sidebar */}
          <div className="w-48 md:w-56 lg:w-64 bg-gradient-to-b from-muted/30 to-muted/10 border-r border-border/40 backdrop-blur-sm">
            <div className="px-3 md:px-4 lg:px-6 py-3 md:py-4 border-b border-border/40 bg-gradient-to-r from-background/50 to-background/30">
              <DialogHeader className="text-left">
                <DialogTitle className="text-lg md:text-xl font-semibold text-foreground">{t('settingsModal.title')}</DialogTitle>
                <DialogDescription className="sr-only">{t('settingsModal.managePreferences')}</DialogDescription>
              </DialogHeader>
            </div>
            <nav className="p-2 md:p-3 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isDisabled = !user && (item.id === 'profile' || item.id === 'data');
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-xl text-sm text-left transition-all duration-200 group ${
                      activeTab === item.id
                        ? 'bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20'
                        : isDisabled
                        ? 'text-muted-foreground/40 cursor-not-allowed'
                        : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground hover:translate-x-1'
                    }`}
                  >
                    <div className={`p-1.5 md:p-2 rounded-lg transition-colors ${
                      activeTab === item.id 
                        ? 'bg-primary/15' 
                        : 'bg-muted/40 group-hover:bg-accent/80'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-xs md:text-sm">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Desktop Content */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background to-background/98">
            <div className="p-3 md:p-4 lg:p-5">
              {renderContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}