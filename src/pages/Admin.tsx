import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Eye, ChevronLeft, ChevronRight, Search, Download, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare, Paperclip, Info, Calendar as CalendarIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { UserInformationModal } from '@/components/UserInformationModal';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay, endOfDay, isWithinInterval, subDays, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
import type { DateRange } from 'react-day-picker';
interface ModelUsageDetail {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost: number;
}
interface UserTokenUsage {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
  ip_address?: string | null;
  country?: string | null;
  model_usages: ModelUsageDetail[];
  subscription_status?: {
    subscribed: boolean;
    product_id: string | null;
    plan: string | null;
    subscription_end: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  };
}

interface UserChat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  model_id: string;
  message_count?: number;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  file_attachments?: any;
}
interface TokenUsageByModel {
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
}

// Token pricing per 1M tokens (in USD)
// For image generation models, output tokens are stored as (price * 100)
const MODEL_PRICING: Record<string, {
  input: number;
  output: number;
  inputTier2?: number; // For models with tiered pricing (e.g., Claude >200k tokens)
  tier2Threshold?: number; // Token threshold for tier 2 pricing
}> = {
  'gpt-4o-mini': {
    input: 0.075,
    output: 0.30
  },
  'gpt-4o': {
    input: 2.50,
    output: 10.00
  },
  'gpt-4o-latest': {
    input: 2.50,
    output: 10.00
  },
  'gpt-5': {
    input: 30.00,
    output: 60.00
  },
  'gpt-5-nano': {
    input: 0.05,
    output: 0.40
  },
  'claude-haiku-4.5': {
    input: 1.00,
    output: 5.00
  },
  'grok-4': {
    input: 3.00,
    output: 15.00
  },
  'deepseek-chat': {
    input: 0.56,
    output: 1.68
  },
  'deepseek-reasoner': {
    input: 0.14,
    output: 2.19
  },
  'deepseek-v2': { // Alias for deepseek-chat
    input: 0.56,
    output: 1.68
  },
  'google/gemini-2.5-pro': {
    input: 1.25,
    output: 5.00
  },
  'google/gemini-2.5-flash': {
    input: 0.30,
    output: 2.50
  },
  'google/gemini-2.5-flash-lite': {
    input: 0.15,
    output: 1.00
  },
  'gemini-2.5-pro': {
    input: 1.25,
    output: 5.00
  },
  'gemini-2.5-flash': {
    input: 0.30,
    output: 2.50
  },
  'gemini-2.5-flash-lite': {
    input: 0.15,
    output: 1.00
  },
  'google/gemini-flash': {
    input: 0.30,
    output: 2.50
  },
  'gemini-flash': {
    input: 0.30,
    output: 2.50
  },
  'google/gemini-2.0-flash-exp': {
    input: 0.30,
    output: 2.50
  },
  'generate-image': {
    input: 0,
    output: 0
  },
  // Image generation model (stored as price * 100)
  'dall-e-3': {
    input: 0,
    output: 0
  } // Image generation model (stored as price * 100)
};
// Country code to full name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States', 'GB': 'United Kingdom', 'CA': 'Canada', 'AU': 'Australia',
  'DE': 'Germany', 'FR': 'France', 'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands',
  'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway',
  'DK': 'Denmark', 'FI': 'Finland', 'PL': 'Poland', 'CZ': 'Czech Republic', 'IE': 'Ireland',
  'PT': 'Portugal', 'GR': 'Greece', 'RO': 'Romania', 'HU': 'Hungary', 'SK': 'Slovakia',
  'BG': 'Bulgaria', 'HR': 'Croatia', 'SI': 'Slovenia', 'LT': 'Lithuania', 'LV': 'Latvia',
  'EE': 'Estonia', 'LU': 'Luxembourg', 'MT': 'Malta', 'CY': 'Cyprus', 'IS': 'Iceland',
  'JP': 'Japan', 'CN': 'China', 'IN': 'India', 'KR': 'South Korea', 'SG': 'Singapore',
  'HK': 'Hong Kong', 'TW': 'Taiwan', 'TH': 'Thailand', 'MY': 'Malaysia', 'ID': 'Indonesia',
  'PH': 'Philippines', 'VN': 'Vietnam', 'NZ': 'New Zealand', 'BR': 'Brazil', 'MX': 'Mexico',
  'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela',
  'ZA': 'South Africa', 'EG': 'Egypt', 'NG': 'Nigeria', 'KE': 'Kenya', 'MA': 'Morocco',
  'RU': 'Russia', 'TR': 'Turkey', 'IL': 'Israel', 'SA': 'Saudi Arabia', 'AE': 'UAE',
  'QA': 'Qatar', 'KW': 'Kuwait', 'BH': 'Bahrain', 'OM': 'Oman', 'JO': 'Jordan',
  'LB': 'Lebanon', 'IQ': 'Iraq', 'PK': 'Pakistan', 'BD': 'Bangladesh', 'LK': 'Sri Lanka',
  'UA': 'Ukraine', 'BY': 'Belarus', 'KZ': 'Kazakhstan', 'UZ': 'Uzbekistan',
};

const getCountryName = (code: string | null | undefined): string => {
  if (!code) return 'N/A';
  return COUNTRY_NAMES[code.toUpperCase()] || code;
};

const formatModelName = (model: string): string => {
  if (model === 'generate-image' || model === 'dall-e-3') return 'DALL-E-3';
  return model;
};
const isImageGenerationModel = (model: string): boolean => {
  return model === 'generate-image' || model === 'dall-e-3';
};
const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
  const pricing = MODEL_PRICING[model] || {
    input: 0,
    output: 0
  };

  // For image generation models, output tokens are stored as (price * 100)
  // So we divide by 100 to get the actual dollar cost
  if (isImageGenerationModel(model)) {
    return outputTokens / 100;
  }

  // Handle tiered pricing (e.g., Claude Haiku 4.5 with >200k tokens)
  let inputCost = 0;
  if (pricing.tier2Threshold && pricing.inputTier2 && inputTokens > pricing.tier2Threshold) {
    // Tokens up to threshold use tier 1 rate, tokens above use tier 2 rate
    const tier1Tokens = pricing.tier2Threshold;
    const tier2Tokens = inputTokens - pricing.tier2Threshold;
    inputCost = (tier1Tokens / 1_000_000 * pricing.input) + (tier2Tokens / 1_000_000 * pricing.inputTier2);
  } else {
    inputCost = inputTokens / 1_000_000 * pricing.input;
  }

  const outputCost = outputTokens / 1_000_000 * pricing.output;
  return inputCost + outputCost;
};
export default function Admin() {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUsages, setUserUsages] = useState<UserTokenUsage[]>([]);
  const [modelUsages, setModelUsages] = useState<TokenUsageByModel[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserTokenUsage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'ultra'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'email' | 'plan' | 'cost' | 'registered'>('registered');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [userChats, setUserChats] = useState<UserChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChatForMessages, setSelectedChatForMessages] = useState<UserChat | null>(null);
  const [chatMessages, setChatMessages] = useState<{[chatId: string]: ChatMessage[]}>({});
  const [loadingMessages, setLoadingMessages] = useState<{[chatId: string]: boolean}>({});
  const [showChatsModal, setShowChatsModal] = useState(false);
  const [viewingMessages, setViewingMessages] = useState(false);
  const [selectedUserForChats, setSelectedUserForChats] = useState<UserTokenUsage | null>(null);
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState<any>(null);
  const [userActivityLogs, setUserActivityLogs] = useState<any[]>([]);
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const usersPerPage = 15;

  // Preset date range filters
  const datePresets = [
    {
      label: 'Today',
      range: { from: startOfDay(new Date()), to: endOfDay(new Date()) }
    },
    {
      label: 'Yesterday',
      range: { from: startOfDay(subDays(new Date(), 1)), to: endOfDay(subDays(new Date(), 1)) }
    },
    {
      label: 'Last 7 days',
      range: { from: startOfDay(subDays(new Date(), 7)), to: endOfDay(new Date()) }
    },
    {
      label: 'Last 30 days',
      range: { from: startOfDay(subDays(new Date(), 30)), to: endOfDay(new Date()) }
    },
    {
      label: 'This week',
      range: { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }
    },
    {
      label: 'This month',
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }
    }
  ];
  useEffect(() => {
    checkAdminAccess();
  }, [user]);
  useEffect(() => {
    if (isAdmin) {
      fetchTokenUsageData();
    }
  }, [isAdmin]);
  const checkAdminAccess = async () => {
    if (!user) {
      toast.error('Please log in to access admin panel');
      navigate('/');
      return;
    }
    try {
      const {
        data,
        error
      } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error('Access denied: Admin privileges required');
        navigate('/');
        return;
      }
      setIsAdmin(true);
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error('Failed to verify admin access');
      navigate('/');
    }
  };

  const handleDownloadUserList = async () => {
    const toastId = toast.loading('Generating user export...');
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.dismiss(toastId);
        toast.error('Session expired. Please log in again.');
        return;
      }

      const supabaseUrl = 'https://lciaiunzacgvvbvcshdh.supabase.co';
      const response = await fetch(
        `${supabaseUrl}/functions/v1/export-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      // Download the Excel file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss(toastId);
      toast.success('User list downloaded successfully!');
    } catch (error) {
      console.error('Error downloading user list:', error);
      toast.dismiss(toastId);
      toast.error('Failed to download user list');
    }
  };
  const fetchTokenUsageData = async () => {
    try {
      setLoading(true);

      // Fetch ALL profiles (which represents ALL auth.users via trigger)
      // Order by created_at DESC to show newest users first
      const {
        data: allProfilesData,
        error: allProfilesError
      } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, signup_method, created_at, ip_address, country, avatar_url, oauth_provider, phone_number, gender, date_of_birth, locale, timezone, oauth_metadata')
        .order('created_at', { ascending: false });
      if (allProfilesError) throw allProfilesError;
      console.log('Total profiles (auth.users):', allProfilesData?.length);

      // Fetch ALL subscriptions (active and inactive)
      const {
        data: subscriptionsData,
        error: subscriptionsError
      } = await supabase.from('user_subscriptions').select('user_id, status, product_id, plan, plan_name, current_period_end, stripe_subscription_id, stripe_customer_id');
      if (subscriptionsError) console.error('Error fetching subscriptions:', subscriptionsError);
      console.log('Subscriptions data:', subscriptionsData);

      // Fetch all token usage data
      const {
        data: tokenData,
        error: tokenError
      } = await supabase.from('token_usage').select('*').order('created_at', {
        ascending: false
      });
      if (tokenError) throw tokenError;

      // Create maps for quick lookup
      const profilesMap = new Map(allProfilesData?.map(profile => [profile.user_id, profile]) || []);
      const subscriptionsMap = new Map(subscriptionsData?.map(sub => [sub.user_id, sub]) || []);

      // Initialize userMap with ALL users from profiles
      const userMap = new Map<string, UserTokenUsage>();
      allProfilesData?.forEach((profile: any) => {
        const subscription = subscriptionsMap.get(profile.user_id);
        userMap.set(profile.user_id, {
          user_id: profile.user_id,
          email: profile.email || 'Unknown',
          display_name: profile.display_name || profile.email?.split('@')[0] || 'Unknown User',
          created_at: profile.created_at,
          ip_address: profile.ip_address,
          country: profile.country,
          model_usages: [],
          subscription_status: subscription && subscription.status === 'active' ? {
            subscribed: true,
            product_id: subscription.product_id,
            plan: subscription.plan,
            subscription_end: subscription.current_period_end,
            stripe_subscription_id: subscription.stripe_subscription_id,
            stripe_customer_id: subscription.stripe_customer_id
          } : {
            subscribed: false,
            product_id: null,
            plan: null,
            subscription_end: null,
            stripe_subscription_id: null,
            stripe_customer_id: null
          }
        });
      });

      // Then add token usage data to the users
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCost = 0;
      const modelMap = new Map<string, TokenUsageByModel>();
      tokenData?.forEach((usage: any) => {
        const userId = usage.user_id;
        const inputTokens = usage.input_tokens || 0;
        const outputTokens = usage.output_tokens || 0;
        const model = usage.model;
        const cost = calculateCost(model, inputTokens, outputTokens);

        // Add to totals
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        totalCost += cost;

        // Get user from map (all users already initialized)
        const userUsage = userMap.get(userId);
        if (userUsage) {
          userUsage.model_usages.push({
            model,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost
          });
        }

        // Aggregate by model
        if (!modelMap.has(model)) {
          modelMap.set(model, {
            model,
            input_tokens: 0,
            output_tokens: 0,
            total_cost: 0
          });
        }
        const modelUsage = modelMap.get(model)!;
        modelUsage.input_tokens += inputTokens;
        modelUsage.output_tokens += outputTokens;
        modelUsage.total_cost += cost;
      });
      
      console.log('Total users loaded:', userMap.size);
      console.log('Active subscriptions:', subscriptionsData?.filter(s => s.status === 'active').length);
      console.log('Total usage - Input tokens:', totalInputTokens, 'Output tokens:', totalOutputTokens, 'Cost: $', totalCost.toFixed(2));
      
      setUserUsages(Array.from(userMap.values()));
      setModelUsages(Array.from(modelMap.values()).sort((a, b) => b.total_cost - a.total_cost));
    } catch (error) {
      console.error('Error fetching token usage:', error);
      toast.error('Failed to load token usage data');
    } finally {
      setLoading(false);
    }
  };

  // Product ID to plan name mapping
  const productToPlanMap: { [key: string]: string } = {
    'prod_TGsOnuDkIh9hVG': 'Pro',        // Pro Monthly
    'prod_TGqo8h59qNKZ4m': 'Pro',        // Pro 3-Month
    'prod_TGqqoPGWQJ0T4a': 'Pro',        // Pro Yearly
    'prod_TIHYThP5XmWyWy': 'Pro',        // Pro 3-Day Trial
    'prod_TGqs5r2udThT0t': 'Ultra Pro',  // Ultra Pro Monthly
    'prod_TGquGexHO44m4T': 'Ultra Pro',  // Ultra Pro 3-Month
    'prod_TGqwVIWObYLt6U': 'Ultra Pro',  // Ultra Pro Yearly
    'prod_TIHZLvUNMqIiCj': 'Ultra Pro',  // Ultra Pro 3-Day Trial
  };

  // Get subscription plan for a user
  const getUserPlan = (usage: UserTokenUsage): 'free' | 'pro' | 'ultra' => {
    // Check if user has an active subscription
    if (!usage.subscription_status?.subscribed) {
      return 'free';
    }
    
    // Use the plan directly from the subscription data
    const plan = (usage.subscription_status as any).plan;
    console.log('User plan from subscription:', plan, 'for user:', usage.user_id);
    
    if (plan === 'pro') return 'pro';
    if (plan === 'ultra_pro') return 'ultra';
    
    // Fallback to product_id matching if plan is not set
    const productId = usage.subscription_status.product_id;
    if (['prod_TGsOnuDkIh9hVG', 'prod_TGqo8h59qNKZ4m', 'prod_TGqqoPGWQJ0T4a', 'prod_TIHYThP5XmWyWy'].includes(productId)) return 'pro';
    if (['prod_TGqs5r2udThT0t', 'prod_TGquGexHO44m4T', 'prod_TGqwVIWObYLt6U', 'prod_TIHZLvUNMqIiCj'].includes(productId)) return 'ultra';
    
    console.log('Unknown plan/product_id:', plan, productId);
    return 'free';
  };

  // Toggle sort
  const handleSort = (field: 'name' | 'email' | 'plan' | 'cost' | 'registered') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: 'name' | 'email' | 'plan' | 'cost' | 'registered') => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 sm:h-4 sm:w-4" />
      : <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />;
  };

  // Filter users by plan, search, and date
  const filteredUsers = userUsages.filter(usage => {
    // Filter by plan
    if (planFilter !== 'all' && getUserPlan(usage) !== planFilter) {
      return false;
    }
    
    // Filter by search query (name or email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = usage.display_name?.toLowerCase().includes(query);
      const emailMatch = usage.email?.toLowerCase().includes(query);
      if (!nameMatch && !emailMatch) {
        return false;
      }
    }
    
    // Filter by date range
    if (dateRange?.from || dateRange?.to) {
      const userCreatedAt = new Date(usage.created_at);
      
      if (dateRange.from && dateRange.to) {
        // Both dates selected - check if within range
        const fromDate = startOfDay(dateRange.from);
        const toDate = endOfDay(dateRange.to);
        return isWithinInterval(userCreatedAt, { start: fromDate, end: toDate });
      } else if (dateRange.from) {
        // Only start date - show signups from this date onwards
        return userCreatedAt >= startOfDay(dateRange.from);
      } else if (dateRange.to) {
        // Only end date - show signups up to this date
        return userCreatedAt <= endOfDay(dateRange.to);
      }
    }
    
    return true;
  });

  // Sort filtered users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case 'name':
        aValue = a.display_name?.toLowerCase() || '';
        bValue = b.display_name?.toLowerCase() || '';
        break;
      case 'email':
        aValue = a.email?.toLowerCase() || '';
        bValue = b.email?.toLowerCase() || '';
        break;
      case 'plan':
        const planOrder = { free: 0, pro: 1, ultra: 2 };
        aValue = planOrder[getUserPlan(a)];
        bValue = planOrder[getUserPlan(b)];
        break;
      case 'cost':
        aValue = a.model_usages.reduce((sum, m) => sum + m.cost, 0);
        bValue = b.model_usages.reduce((sum, m) => sum + m.cost, 0);
        break;
      case 'registered':
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
        break;
      default:
        return 0;
    }

    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const paginatedUsers = sortedUsers.slice(startIndex, endIndex);

  // Reset to page 1 when filter, search, sort, or date changes
  useEffect(() => {
    setCurrentPage(1);
  }, [planFilter, searchQuery, sortField, sortDirection, dateRange]);

  // Fetch subscription status for a specific user
  const fetchUserSubscription = async (userId: string) => {
    // Subscription is already loaded from database, no need to fetch again
    setLoadingSubscription(false);
  };

  // Fetch chats for a specific user
  const fetchUserChats = async (userId: string) => {
    try {
      setLoadingChats(true);
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, created_at, updated_at, model_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get message counts for each chat
      const chatsWithCounts = await Promise.all(
        (data || []).map(async (chat) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id);
          return { ...chat, message_count: count || 0 };
        })
      );

      setUserChats(chatsWithCounts);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      toast.error('Failed to load user chats');
    } finally {
      setLoadingChats(false);
    }
  };

  // Fetch messages for a specific chat
  const fetchChatMessages = async (chatId: string) => {
    if (chatMessages[chatId]) {
      // Already loaded
      return;
    }

    try {
      setLoadingMessages(prev => ({ ...prev, [chatId]: true }));
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, role, created_at, file_attachments')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Cast the data to the correct type
      const messages: ChatMessage[] = (data || []).map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as 'user' | 'assistant',
        created_at: msg.created_at,
        file_attachments: msg.file_attachments
      }));

      setChatMessages(prev => ({ ...prev, [chatId]: messages }));
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(prev => ({ ...prev, [chatId]: false }));
    }
  };

  // Open chat messages in same modal
  const openChatMessages = async (chat: UserChat) => {
    setSelectedChatForMessages(chat);
    setViewingMessages(true);
    await fetchChatMessages(chat.id);
  };

  // Go back to chat list
  const backToChatList = () => {
    setViewingMessages(false);
    setSelectedChatForMessages(null);
  };

  // Fetch comprehensive user information
  const fetchUserDetailedInfo = async (userId: string) => {
    try {
      setLoadingUserInfo(true);
      
      // Fetch detailed profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError) throw profileError;
      
      // Fetch activity logs
      const { data: logs, error: logsError } = await supabase
        .from('user_activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (logsError) {
        console.warn('Error fetching activity logs:', logsError);
      }
      
      setSelectedUserInfo(profile);
      setUserActivityLogs(logs || []);
      setShowUserInfoModal(true);
    } catch (error) {
      console.error('Error fetching user info:', error);
      toast.error('Failed to load user information');
    } finally {
      setLoadingUserInfo(false);
    }
  };

  // Get plan display info
  const getPlanBadge = (usage: UserTokenUsage) => {
    const plan = getUserPlan(usage);
    if (plan === 'pro') {
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Pro</Badge>;
    }
    if (plan === 'ultra') {
      return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">Ultra Pro</Badge>;
    }
    return <Badge variant="secondary" className="bg-muted text-muted-foreground">Free</Badge>;
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>;
  }
  if (!isAdmin) {
    return null;
  }
  return <div className="min-h-full w-full bg-gradient-to-br from-background via-background to-muted/20 overflow-x-hidden">
      {/* Mobile & Tablet Navbar */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 max-w-full">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="h-9 w-9 p-0 bg-transparent hover:bg-sidebar-accent text-sidebar-foreground rounded-lg flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold truncate">Admin Dashboard</h2>
          </div>
          <Button 
            onClick={handleDownloadUserList}
            size="sm"
            variant="outline"
            className="h-9 gap-2 flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-4 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 md:space-y-8 animate-fade-in max-w-full overflow-x-hidden">
        {/* Header Section - Desktop Only */}
        <div className="hidden lg:flex flex-row justify-between items-center">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-2">Manage users and monitor system usage</p>
          </div>
          <Button 
            onClick={handleDownloadUserList}
            className="gap-2 h-10"
            variant="outline"
          >
            <Download className="w-4 h-4" />
            Download User List
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 lg:grid-cols-5 w-full">
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg col-span-2 lg:col-span-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Total Users</CardTitle>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-foreground">{userUsages.length}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Free Users</CardTitle>
              <Badge variant="secondary" className="text-xs sm:text-sm flex-shrink-0">{userUsages.filter(u => getUserPlan(u) === 'free').length}</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {userUsages.filter(u => getUserPlan(u) === 'free').length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">On free plan</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Pro Users</CardTitle>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs sm:text-sm flex-shrink-0">
                {userUsages.filter(u => getUserPlan(u) === 'pro').length}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {userUsages.filter(u => getUserPlan(u) === 'pro').length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Pro subscribers</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Ultra Pro</CardTitle>
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs sm:text-sm flex-shrink-0">
                {userUsages.filter(u => getUserPlan(u) === 'ultra').length}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {userUsages.filter(u => getUserPlan(u) === 'ultra').length}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Ultra subscribers</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg col-span-2 lg:col-span-1 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Total Usage</CardTitle>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs sm:text-sm flex-shrink-0">Cost</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                ${modelUsages.reduce((sum, m) => sum + m.total_cost, 0).toFixed(2)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {(modelUsages.reduce((sum, m) => sum + m.input_tokens + m.output_tokens, 0) / 1000000).toFixed(2)}M tokens
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Token Usage Table with Tabs */}
        <Card className="border-border/50 overflow-hidden w-full">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                    <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold truncate">Token Usage by User</CardTitle>
                  </div>
                  <CardDescription className="text-xs sm:text-sm mt-2 truncate">
                    Showing {paginatedUsers.length} of {sortedUsers.length} users
                  </CardDescription>
                </div>
              </div>
              
              {/* Search Input and Date Filter */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="relative flex-1 w-full sm:max-w-80 md:max-w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none flex-shrink-0 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 text-sm sm:text-base w-full transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                
                {/* Date Range Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`h-11 justify-start text-left font-normal w-full sm:w-auto min-w-[220px] transition-all duration-200 ${
                        dateRange?.from 
                          ? 'border-primary bg-primary/5 shadow-sm hover:bg-primary/10 hover:shadow-md' 
                          : 'hover:border-primary/50 hover:bg-accent/50'
                      }`}
                    >
                      <CalendarIcon className={`mr-2 h-4 w-4 flex-shrink-0 transition-colors ${
                        dateRange?.from ? 'text-primary' : ''
                      }`} />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <span className="truncate font-medium">
                            {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="truncate font-medium">{format(dateRange.from, 'MMM d, yyyy')}</span>
                        )
                      ) : (
                        <span className="text-muted-foreground">Filter by signup date</span>
                      )}
                      {dateRange?.from && (
                        <X 
                          className="ml-auto h-4 w-4 flex-shrink-0 transition-colors hover:text-destructive hover:scale-110" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDateRange(undefined);
                          }}
                        />
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 animate-in fade-in-0 zoom-in-95" align="start">
                    <div className="flex text-sm">
                      {/* Preset date ranges */}
                      <div className="border-r bg-muted/30 p-2 space-y-0.5 min-w-[130px]">
                        <div className="text-[10px] font-bold mb-2 text-muted-foreground uppercase tracking-wider px-2">Quick Select</div>
                        {datePresets.map((preset, index) => {
                          const isSelected = dateRange?.from && dateRange?.to && 
                            preset.range.from.getTime() === dateRange.from.getTime() && 
                            preset.range.to.getTime() === dateRange.to.getTime();
                          
                          return (
                            <Button
                              key={preset.label}
                              variant="ghost"
                              size="sm"
                              onClick={() => setDateRange(preset.range)}
                              className={`w-full justify-start text-left font-medium h-8 text-xs transition-all duration-200 ${
                                isSelected 
                                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                                  : 'hover:bg-primary/10 hover:translate-x-0.5'
                              }`}
                              style={{ animationDelay: `${index * 30}ms` }}
                            >
                              <span className="truncate">{preset.label}</span>
                            </Button>
                          );
                        })}
                        {dateRange?.from && (
                          <>
                            <div className="border-t border-border/50 my-2" />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDateRange(undefined)}
                              className="w-full justify-start text-left font-medium h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-200 hover:translate-x-0.5"
                            >
                              <X className="h-3 w-3 mr-1.5" />
                              Clear filter
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Calendar */}
                      <div className="p-3 bg-background">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={setDateRange}
                          numberOfMonths={1}
                          initialFocus
                          className="pointer-events-auto"
                        />
                        {dateRange?.from && dateRange.to && (
                          <div className="pt-3 border-t mt-2 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                              <Users className="h-3 w-3 text-primary" />
                              <span className="text-xs">
                                <span className="font-bold text-primary text-sm">
                                  {filteredUsers.length}
                                </span>
                                <span className="text-muted-foreground ml-1">sign-ups</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Active filter indicator */}
                {dateRange?.from && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/20">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="font-medium">
                        Showing {filteredUsers.length} of {userUsages.length} users
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 w-full overflow-hidden">
            {/* Filter Tabs */}
            <Tabs value={planFilter} onValueChange={(v) => setPlanFilter(v as any)} className="w-full">
              <div className="border-b border-border/50 px-4 sm:px-5 md:px-6 overflow-x-auto">
                <TabsList className="bg-transparent border-0 h-auto p-0 gap-1 sm:gap-2 w-full sm:w-auto justify-start">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap"
                  >
                    All ({userUsages.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="free"
                    className="data-[state=active]:bg-muted data-[state=active]:text-foreground border-b-2 border-transparent data-[state=active]:border-muted-foreground rounded-none px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Free ({userUsages.filter(u => getUserPlan(u) === 'free').length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pro"
                    className="data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-600 border-b-2 border-transparent data-[state=active]:border-blue-500 rounded-none px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Pro ({userUsages.filter(u => getUserPlan(u) === 'pro').length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ultra"
                    className="data-[state=active]:bg-purple-500/10 data-[state=active]:text-purple-600 border-b-2 border-transparent data-[state=active]:border-purple-500 rounded-none px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap"
                  >
                    Ultra ({userUsages.filter(u => getUserPlan(u) === 'ultra').length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={planFilter} className="m-0">
                {/* Mobile/Tablet Card Layout */}
                <div className="lg:hidden">
                  {/* Mobile Sort Controls */}
                  <div className="border-b border-border/50 p-4 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Sort by:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={sortField === 'name' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-9 text-xs gap-1.5"
                      >
                        Name
                        {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('email')}
                        className="h-9 text-xs gap-1.5"
                      >
                        Email
                        {sortField === 'email' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'plan' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('plan')}
                        className="h-9 text-xs gap-1.5"
                      >
                        Plan
                        {sortField === 'plan' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'cost' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('cost')}
                        className="h-9 text-xs gap-1.5"
                      >
                        Cost
                        {sortField === 'cost' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'registered' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('registered')}
                        className="h-9 text-xs gap-1.5"
                      >
                        Registered
                        {sortField === 'registered' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                    </div>
                  </div>

                  {paginatedUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <Users className="h-16 w-16 opacity-10 mb-4" />
                      <p className="text-sm">No users found in this category</p>
                    </div>
                  ) : (
                    <div className="space-y-3 p-4">
                      {paginatedUsers.map(usage => {
                        const totalCost = usage.model_usages.reduce((sum, m) => sum + m.cost, 0);
                        const plan = getUserPlan(usage);
                        return (
                          <Card key={usage.user_id} className="border-border/50 hover:border-primary/30 transition-all">
                            <CardContent className="p-4 space-y-3">
                              {/* User Info */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <div className="h-2 w-2 rounded-full bg-primary/60" />
                                    <h3 className="font-semibold text-sm truncate">{usage.display_name}</h3>
                                  </div>
                                  <p className="text-xs text-muted-foreground truncate">{usage.email}</p>
                                </div>
                                {getPlanBadge(usage)}
                              </div>

                              {/* Stats */}
                              <div className="pt-3 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-1">Registered</p>
                                <p className="text-sm font-medium">
                                  {usage.created_at ? new Date(usage.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'Unknown'}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2 pt-3 border-t border-border/50">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="flex-1 h-10"
                                  onClick={async () => {
                                    await fetchUserDetailedInfo(usage.user_id);
                                  }}
                                  disabled={loadingUserInfo}
                                >
                                  <Info className="h-4 w-4 mr-2" />
                                  Info
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="flex-1 h-10"
                                  onClick={async () => {
                                    setSelectedUser(usage);
                                    setIsModalOpen(true);
                                    await fetchUserSubscription(usage.user_id);
                                    await fetchUserChats(usage.user_id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="flex-1 h-10"
                                  onClick={async () => {
                                    setSelectedUserForChats(usage);
                                    setShowChatsModal(true);
                                    await fetchUserChats(usage.user_id);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  Chats
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden lg:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead 
                          className="font-semibold text-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center gap-1">
                            User
                            {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center gap-1">
                            Email
                            {getSortIcon('email')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="font-semibold text-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort('plan')}
                        >
                          <div className="flex items-center gap-1">
                            Plan
                            {getSortIcon('plan')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="text-right font-semibold text-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort('cost')}
                        >
                          <div className="flex items-center gap-1 justify-end">
                            Cost
                            {getSortIcon('cost')}
                          </div>
                        </TableHead>
                        <TableHead
                          className="font-semibold text-foreground text-sm cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => handleSort('registered')}
                        >
                          <div className="flex items-center gap-1">
                            Registered
                            {getSortIcon('registered')}
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground text-sm">Actions</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUsers.map(usage => {
                        const totalCost = usage.model_usages.reduce((sum, m) => sum + m.cost, 0);
                        return (
                          <TableRow 
                            key={usage.user_id} 
                            className="hover:bg-muted/50 transition-colors"
                          >
                            <TableCell className="font-semibold text-foreground text-sm">
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary/60" />
                                <span className="truncate max-w-[200px]">{usage.display_name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              <span className="truncate block max-w-[250px]">{usage.email}</span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {getPlanBadge(usage)}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-foreground text-sm whitespace-nowrap">
                              ${totalCost.toFixed(4)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {usage.created_at ? new Date(usage.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              }) : 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setSelectedUserForChats(usage);
                                    setShowChatsModal(true);
                                    await fetchUserChats(usage.user_id);
                                  }}
                                >
                                  Chats
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="h-8 px-3 text-xs"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    
                                    const plan = getUserPlan(usage);
                                    const planBadge = plan === 'ultra' ? 'Ultra Pro' : plan === 'pro' ? 'Pro' : 'Free';
                                    const totalTokens = usage.model_usages.reduce(
                                      (sum, m) => sum + m.input_tokens + m.output_tokens, 
                                      0
                                    );
                                    
                                    const confirmMessage = `⚠️ PERMANENTLY DELETE USER?\n\n` +
                                      `Email: ${usage.email}\n` +
                                      `Name: ${usage.display_name || 'N/A'}\n` +
                                      `Plan: ${planBadge}\n` +
                                      `Total tokens: ${totalTokens.toLocaleString()}\n\n` +
                                      `This will delete ALL:\n` +
                                      `• Profile & account data\n` +
                                      `• Chats & messages\n` +
                                      `• Projects & files\n` +
                                      `• Subscription data\n` +
                                      `• Usage statistics\n\n` +
                                      `THIS CANNOT BE UNDONE!`;
                                      
                                    if (!confirm(confirmMessage)) {
                                      return;
                                    }
                                    
                                    try {
                                      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
                                        body: { userId: usage.user_id }
                                      });

                                      if (error) throw error;

                                      const deletedInfo = data?.deletedUser;
                                      const successMsg = deletedInfo 
                                        ? `User deleted (${deletedInfo.plan} plan${deletedInfo.hadActiveSubscription ? ', had active subscription' : ''})`
                                        : 'User deleted successfully';
                                      
                                      toast.success(successMsg);
                                      await fetchTokenUsageData();
                                    } catch (error) {
                                      console.error('Error deleting user:', error);
                                      toast.error('Failed to delete user');
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-9 px-3"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    await fetchUserDetailedInfo(usage.user_id);
                                  }}
                                  disabled={loadingUserInfo}
                                >
                                  <Info className="h-4 w-4 mr-1" />
                                  Info
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-9 px-3"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setSelectedUser(usage);
                                    setIsModalOpen(true);
                                    await fetchUserSubscription(usage.user_id);
                                    await fetchUserChats(usage.user_id);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {paginatedUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground h-48">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="h-16 w-16 opacity-10" />
                              <p className="text-base">No users found in this category</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50 p-4 sm:p-5 w-full">
                    <div className="text-xs sm:text-sm text-muted-foreground order-2 sm:order-1 text-center sm:text-left">
                      Page {currentPage} of {totalPages} • {sortedUsers.length} total
                    </div>
                    <div className="flex gap-2 order-1 sm:order-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-10 px-3 sm:px-4 min-w-[90px] sm:min-w-[100px]"
                      >
                        <ChevronLeft className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Previous</span>
                        <span className="sm:hidden">Prev</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-10 px-3 sm:px-4 min-w-[90px] sm:min-w-[100px]"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4 sm:ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* User Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            // Reset state when modal closes
            setUserChats([]);
            setChatMessages({});
          }
        }}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-3">
              <DialogTitle className="text-lg sm:text-xl md:text-2xl flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                {selectedUser?.display_name}
              </DialogTitle>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm sm:text-base font-medium text-foreground break-all">
                  {selectedUser?.email}
                </p>
              </div>
              
              {/* Registration Date - Mobile/Tablet Only */}
              <div className="space-y-1 lg:hidden">
                <p className="text-xs text-muted-foreground">Registered</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Unknown'}
                </p>
              </div>
              
              {/* Subscription Status */}
              <div className="space-y-2 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Subscription Status</p>
                {loadingSubscription ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    {selectedUser && (() => {
                      const plan = getUserPlan(selectedUser);
                      const isSubscribed = selectedUser.subscription_status?.subscribed;
                      const productId = selectedUser.subscription_status?.product_id;
                      const subscriptionEnd = selectedUser.subscription_status?.subscription_end;
                      const stripeSubId = selectedUser.subscription_status?.stripe_subscription_id;
                      const stripeCustId = selectedUser.subscription_status?.stripe_customer_id;
                      
                      if (plan === 'pro') {
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                                Pro Plan
                              </Badge>
                              {subscriptionEnd && (
                                <span className="text-xs text-muted-foreground">
                                  Until {new Date(subscriptionEnd).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      } else if (plan === 'ultra') {
                        return (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                                Ultra Pro Plan
                              </Badge>
                              {subscriptionEnd && (
                                <span className="text-xs text-muted-foreground">
                                  Until {new Date(subscriptionEnd).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">
                            Free Plan
                          </Badge>
                        );
                      }
                    })()}
                  </>
                )}
              </div>

              {/* Admin Actions - Mobile/Tablet Only */}
              <div className="flex gap-2 pt-4 border-t border-border/50 lg:hidden">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    // Get user plan info
                    const plan = getUserPlan(selectedUser);
                    const planBadge = plan === 'ultra' ? 'Ultra Pro' : plan === 'pro' ? 'Pro' : 'Free';
                    
                    // Calculate total tokens
                    const totalTokens = selectedUser.model_usages.reduce(
                      (sum, m) => sum + m.input_tokens + m.output_tokens, 
                      0
                    );
                    
                    const confirmMessage = `⚠️ PERMANENTLY DELETE USER?\n\n` +
                      `Email: ${selectedUser.email}\n` +
                      `Name: ${selectedUser.display_name || 'N/A'}\n` +
                      `Plan: ${planBadge}\n` +
                      `Total tokens: ${totalTokens.toLocaleString()}\n\n` +
                      `This will delete ALL:\n` +
                      `• Profile & account data\n` +
                      `• Chats & messages\n` +
                      `• Projects & files\n` +
                      `• Subscription data\n` +
                      `• Usage statistics\n\n` +
                      `THIS CANNOT BE UNDONE!`;
                      
                    if (!confirm(confirmMessage)) {
                      return;
                    }
                    
                    try {
                      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
                        body: { userId: selectedUser.user_id }
                      });

                      if (error) throw error;

                      // Show detailed success message
                      const deletedInfo = data?.deletedUser;
                      const successMsg = deletedInfo 
                        ? `User deleted (${deletedInfo.plan} plan${deletedInfo.hadActiveSubscription ? ', had active subscription' : ''})`
                        : 'User deleted successfully';
                      
                      toast.success(successMsg);
                      setIsModalOpen(false);
                      await fetchTokenUsageData();
                    } catch (error) {
                      console.error('Error deleting user:', error);
                      toast.error('Failed to delete user');
                    }
                  }}
                >
                  Delete User
                </Button>
              </div>
            </DialogHeader>
            
            {selectedUser && <div className="space-y-4 mt-4">
                <div className="grid gap-3 sm:gap-4 grid-cols-2">
                  <Card className="border-border/50">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm text-muted-foreground">Models Used</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <div className="text-xl sm:text-2xl font-bold">{selectedUser.model_usages.length}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardHeader className="pb-2 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm text-muted-foreground">Total Cost</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
                      <div className="text-xl sm:text-2xl font-bold text-primary">
                        ${selectedUser.model_usages.reduce((sum, m) => sum + m.cost, 0).toFixed(4)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Mobile Card Layout */}
                <div className="space-y-3 md:hidden">
                  <h3 className="text-sm font-semibold text-foreground">Model Breakdown</h3>
                  {selectedUser.model_usages.map((modelUsage, idx) => <Card key={idx} className="border-border/50 bg-muted/20">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
                            {formatModelName(modelUsage.model)}
                          </Badge>
                          <span className="text-base font-bold text-primary">
                            {isImageGenerationModel(modelUsage.model) ? `$${(modelUsage.output_tokens / 100).toFixed(2)}` : `$${modelUsage.cost.toFixed(4)}`}
                          </span>
                        </div>
                        {!isImageGenerationModel(modelUsage.model) && <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
                            <div>
                              <p className="text-xs text-muted-foreground">Input</p>
                              <p className="text-sm font-mono font-medium">{modelUsage.input_tokens.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Output</p>
                              <p className="text-sm font-mono font-medium">{modelUsage.output_tokens.toLocaleString()}</p>
                            </div>
                          </div>}
                      </CardContent>
                    </Card>)}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-sm">Model</TableHead>
                        <TableHead className="text-right text-sm">Input Tokens</TableHead>
                        <TableHead className="text-right text-sm">Output Tokens</TableHead>
                        <TableHead className="text-right text-sm">Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUser.model_usages.map((modelUsage, idx) => <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell>
                            <Badge variant="secondary" className="text-xs font-mono bg-primary/10 text-primary border-primary/20">
                              {formatModelName(modelUsage.model)}
                            </Badge>
                          </TableCell>
                          {isImageGenerationModel(modelUsage.model) ? <>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">-</TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">-</TableCell>
                              <TableCell className="text-right font-mono font-semibold text-sm">
                                ${(modelUsage.output_tokens / 100).toFixed(2)}
                              </TableCell>
                            </> : <>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">
                                {modelUsage.input_tokens.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground text-sm">
                                {modelUsage.output_tokens.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold text-sm">
                                ${modelUsage.cost.toFixed(4)}
                              </TableCell>
                            </>}
                        </TableRow>)}
                    </TableBody>
                  </Table>
                </div>
              </div>}
          </DialogContent>
        </Dialog>

        {/* Model Usage Table */}
        <Card className="border-border/50 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-3 sm:p-4 md:p-6">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
              <CardTitle className="text-base sm:text-lg md:text-xl">Token Usage by Model</CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm md:text-base">Aggregated token consumption per AI model</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground text-xs sm:text-sm">Model</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Input Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Output Tokens</TableHead>
                    <TableHead className="text-right font-semibold text-foreground text-xs sm:text-sm">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelUsages.map(usage => <TableRow key={usage.model} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-semibold text-foreground text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary/60" />
                          <span className="font-mono text-xs sm:text-sm">{formatModelName(usage.model)}</span>
                        </div>
                      </TableCell>
                      {isImageGenerationModel(usage.model) ? <>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">-</TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">-</TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground text-sm sm:text-base md:text-lg">
                            ${(usage.output_tokens / 100).toFixed(2)}
                          </TableCell>
                        </> : <>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">
                            {usage.input_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground text-xs sm:text-sm">
                            {usage.output_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-foreground text-sm sm:text-base md:text-lg">
                            ${usage.total_cost.toFixed(4)}
                          </TableCell>
                        </>}
                    </TableRow>)}
                  {modelUsages.length === 0 && <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground h-32">
                        <div className="flex flex-col items-center gap-2">
                          <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 opacity-20">
                            <span className="text-xs">AI</span>
                          </Badge>
                          <p>No model usage data available</p>
                        </div>
                      </TableCell>
                    </TableRow>}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Chats Modal */}
        <Dialog open={showChatsModal} onOpenChange={(open) => {
          setShowChatsModal(open);
          if (!open) {
            setUserChats([]);
            setChatMessages({});
            setSelectedUserForChats(null);
            setViewingMessages(false);
            setSelectedChatForMessages(null);
          }
        }}>
          <DialogContent className="max-w-full sm:max-w-[95vw] lg:max-w-5xl h-[100dvh] sm:h-auto sm:max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
            {!viewingMessages ? (
              <>
                <DialogHeader className="border-b pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6 shrink-0">
                  <DialogTitle className="text-lg sm:text-xl font-semibold">
                    {selectedUserForChats?.display_name}'s Conversations
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm mt-1">
                    {selectedUserForChats?.email}
                    {loadingChats ? ' • Loading...' : ` • ${userChats.length} chat${userChats.length !== 1 ? 's' : ''}`}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {loadingChats ? (
                    <div className="flex items-center justify-center py-12 sm:py-16">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    </div>
                  ) : userChats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 opacity-10 mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base">No conversations found</p>
                    </div>
                  ) : (
                    <div className="grid gap-2 sm:gap-3">
                      {userChats.map((chat) => (
                        <Card 
                          key={chat.id} 
                          className="border overflow-hidden cursor-pointer hover:border-primary/50 active:scale-[0.98] hover:shadow-sm transition-all group"
                          onClick={() => openChatMessages(chat)}
                        >
                          <div className="flex items-center justify-between p-3 sm:p-5">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2 truncate group-hover:text-primary transition-colors">
                                {chat.title}
                              </h3>
                              <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground">
                                <span>{chat.message_count} message{chat.message_count !== 1 ? 's' : ''}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{new Date(chat.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                                <span className="sm:hidden">{new Date(chat.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2 sm:ml-4" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <DialogHeader className="border-b pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={backToChatList}
                      className="h-8 w-8 p-0 shrink-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <DialogTitle className="text-base sm:text-xl font-semibold truncate">
                        {selectedChatForMessages?.title}
                      </DialogTitle>
                      <DialogDescription className="text-[11px] sm:text-sm mt-0.5 sm:mt-1 truncate">
                        {selectedChatForMessages?.message_count} message{selectedChatForMessages?.message_count !== 1 ? 's' : ''} • {selectedChatForMessages && new Date(selectedChatForMessages.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
                  {selectedChatForMessages && loadingMessages[selectedChatForMessages.id] ? (
                    <div className="flex items-center justify-center py-12 sm:py-16">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
                    </div>
                  ) : selectedChatForMessages && chatMessages[selectedChatForMessages.id] && chatMessages[selectedChatForMessages.id].length > 0 ? (
                    <div className="space-y-4 sm:space-y-6">
                      {chatMessages[selectedChatForMessages.id].map((message) => (
                        <div
                          key={message.id}
                          className="space-y-1.5 sm:space-y-2"
                        >
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className={`text-[11px] sm:text-xs font-medium ${
                              message.role === 'user' ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {message.role === 'user' ? 'User' : 'Assistant'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(message.created_at).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 sm:p-4 ${
                            message.role === 'user'
                              ? 'bg-primary/5 border border-primary/20'
                              : 'bg-muted/50 border border-border'
                          }`}>
                            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {message.file_attachments && Array.isArray(message.file_attachments) && message.file_attachments.length > 0 && (
                              <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-current/10">
                                {message.file_attachments.map((file: any, idx: number) => {
                                  const isImage = file.type?.startsWith('image/') || 
                                                file.file_type?.startsWith('image/') ||
                                                /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name || file.file_name || '');
                                  
                                  const fileUrl = file.url || file.file_url || file.path || file.file_path;
                                  const fileName = file.name || file.file_name || `File ${idx + 1}`;
                                  
                                  if (isImage && fileUrl) {
                                    return (
                                      <div key={idx} className="rounded-lg overflow-hidden border border-border">
                                        <img 
                                          src={fileUrl} 
                                          alt={fileName}
                                          className="max-w-full max-h-[250px] sm:max-h-[400px] object-contain bg-background"
                                        />
                                      </div>
                                    );
                                  }
                                  
                                  return (
                                    <a
                                      key={idx}
                                      href={fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border border-border hover:bg-muted/50 active:bg-muted transition-colors group"
                                    >
                                      <Paperclip className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                                      <span className="text-xs sm:text-sm truncate">{fileName}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
                      <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 opacity-10 mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base">No messages in this conversation</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* User Information Modal */}
        <UserInformationModal 
          open={showUserInfoModal}
          onOpenChange={setShowUserInfoModal}
          userInfo={selectedUserInfo}
          activityLogs={userActivityLogs}
        />
      </div>
    </div>;
}