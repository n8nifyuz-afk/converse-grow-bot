import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Eye, ChevronLeft, ChevronRight, Search, Download, ArrowUpDown, ArrowUp, ArrowDown, MessageSquare, Paperclip, Info, Calendar as CalendarIcon, X, Filter, MapPin, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { UserInformationModal } from '@/components/UserInformationModal';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, isWithinInterval, startOfToday, endOfToday } from 'date-fns';
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
  const [refreshing, setRefreshing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userUsages, setUserUsages] = useState<UserTokenUsage[]>([]);
  const [modelUsages, setModelUsages] = useState<TokenUsageByModel[]>([]);
  
  // Aggregate statistics state (fetched separately for performance)
  const [aggregateStats, setAggregateStats] = useState({
    totalUsers: 0,
    freeUsers: 0,
    proUsers: 0,
    ultraProUsers: 0,
    totalCost: 0,
    totalTokens: 0
  });
  
  const [selectedUser, setSelectedUser] = useState<UserTokenUsage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // For filter/search updates
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
  const [dateFilter, setDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [timeFilter, setTimeFilter] = useState<{ fromTime: string; toTime: string }>({ fromTime: '00:00', toTime: '23:59' });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePickerView, setShowDatePickerView] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<'all' | 'subscribed' | 'free'>('all');
  const [timezone, setTimezone] = useState<string>('Europe/Nicosia');
  
  // Pending filter states (not applied until user clicks Apply)
  const [pendingPlanFilter, setPendingPlanFilter] = useState<'all' | 'free' | 'pro' | 'ultra'>('all');
  const [pendingDateFilter, setPendingDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [pendingTimeFilter, setPendingTimeFilter] = useState<{ fromTime: string; toTime: string }>({ fromTime: '00:00', toTime: '23:59' });
  const [pendingCountryFilter, setPendingCountryFilter] = useState<string>('all');
  const [pendingSubscriptionStatusFilter, setPendingSubscriptionStatusFilter] = useState<'all' | 'subscribed' | 'free'>('all');
  const [pendingTimezone, setPendingTimezone] = useState<string>('Europe/Nicosia');
  
  // Temp state for date picker (before applying within the date picker popover)
  const [tempDateFilter, setTempDateFilter] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [tempTimeFilter, setTempTimeFilter] = useState<{ fromTime: string; toTime: string }>({ fromTime: '00:00', toTime: '23:59' });
  const usersPerPage = 20; // Load 20 users per page
  
  
  useEffect(() => {
    checkAdminAccess();
  }, [user]);
  
  // Initial load only - fetch data when admin access is confirmed
  useEffect(() => {
    if (isAdmin && userUsages.length === 0) {
      setLoading(true);
      Promise.all([
        fetchTokenUsageData(false, 'all', { from: undefined, to: undefined }, { fromTime: '00:00', toTime: '23:59' }, 'all', ''),
        fetchAggregateStats('all', { from: undefined, to: undefined }, { fromTime: '00:00', toTime: '23:59' }, 'all', '')
      ]).finally(() => {
        setLoading(false);
      });
    }
  }, [isAdmin]);
  
  // Fetch data when page changes (pagination)
  // Use a ref to track if this is from applying filters to avoid double fetch
  const isApplyingFilters = useRef(false);
  
  useEffect(() => {
    if (isAdmin && userUsages.length > 0 && !isApplyingFilters.current) {
      setIsRefreshing(true);
      fetchTokenUsageData(false, planFilter, dateFilter, timeFilter, countryFilter, searchQuery).finally(() => {
        setIsRefreshing(false);
      });
    }
    isApplyingFilters.current = false;
  }, [currentPage]);

  // Real-time search with debounce
  useEffect(() => {
    if (!isAdmin || userUsages.length === 0) return;

    const debounceTimer = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      setIsRefreshing(true);
      Promise.all([
        fetchTokenUsageData(false, planFilter, dateFilter, timeFilter, countryFilter, searchQuery),
        fetchAggregateStats(planFilter, dateFilter, timeFilter, countryFilter, searchQuery)
      ]).finally(() => {
        setIsRefreshing(false);
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  const checkAdminAccess = async () => {
    if (!user) {
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
        navigate('/');
        return;
      }
      setIsAdmin(true);
    } catch (error) {
      console.error('Admin access check error:', error);
      navigate('/');
    } finally {
      setLoading(false);
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
  
  // Fetch aggregate statistics (counts and totals) - now filter-aware
  const fetchAggregateStats = async (
    filterPlan: 'all' | 'free' | 'pro' | 'ultra' = 'all',
    filterDate: { from: Date | undefined; to: Date | undefined } = { from: undefined, to: undefined },
    filterTime: { fromTime: string; toTime: string } = { fromTime: '00:00', toTime: '23:59' },
    filterCountry: string = 'all',
    filterSearch: string = ''
  ) => {
    try {
      console.log('[ADMIN STATS] Fetching aggregate statistics with filters:', {
        plan: filterPlan,
        dateRange: filterDate,
        country: filterCountry,
        search: filterSearch
      });
      
      // STEP 1: If filtering by specific plan, get those user_ids first
      let planFilteredUserIds: string[] | null = null;
      
      if (filterPlan === 'pro' || filterPlan === 'ultra') {
        const planValue = filterPlan === 'ultra' ? 'ultra_pro' : filterPlan;
        console.log('[ADMIN STATS] Filtering by plan:', planValue);
        
        const { data: planSubs } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('status', 'active')
          .eq('plan', planValue);
        
        planFilteredUserIds = planSubs?.map(s => s.user_id) || [];
        console.log('[ADMIN STATS] Users with plan', planValue, ':', planFilteredUserIds.length);
        
        if (planFilteredUserIds.length === 0) {
          // No users with this plan
          setAggregateStats({
            totalUsers: 0,
            freeUsers: 0,
            proUsers: filterPlan === 'pro' ? 0 : 0,
            ultraProUsers: filterPlan === 'ultra' ? 0 : 0,
            totalCost: 0,
            totalTokens: 0
          });
          setUserUsages([]);
          setModelUsages([]);
          (window as any).__adminTotalUsers = 0;
          console.log('[ADMIN STATS] No users with plan - cleared all data');
          return;
        }
      } else if (filterPlan === 'free') {
        // Get all subscribed user_ids to exclude
        const { data: allSubs } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('status', 'active');
        
        const subscribedUserIds = allSubs?.map(s => s.user_id) || [];
        console.log('[ADMIN STATS] Filtering for free users, excluding:', subscribedUserIds.length);
        
        // We'll use this to exclude users later
        planFilteredUserIds = subscribedUserIds.length > 0 ? subscribedUserIds : null;
      }
      
      // STEP 2: Build profile query with all filters
      let profilesQuery = supabase
        .from('profiles')
        .select('user_id', { count: 'exact', head: true });
      
      // Apply plan filter to profiles
      if (filterPlan === 'pro' || filterPlan === 'ultra') {
        // Only count users with this plan
        if (planFilteredUserIds && planFilteredUserIds.length > 0) {
          profilesQuery = profilesQuery.in('user_id', planFilteredUserIds);
        } else {
          // No users with this plan, already handled above
          return;
        }
      } else if (filterPlan === 'free' && planFilteredUserIds && planFilteredUserIds.length > 0) {
        // Exclude subscribed users
        profilesQuery = profilesQuery.not('user_id', 'in', `(${planFilteredUserIds.join(',')})`);
      }
      
      // Apply date filter
      if (filterDate.from || filterDate.to) {
        const fromDateTime = getDateTimeFromFilter(filterDate.from, filterTime.fromTime);
        const toDateTime = getDateTimeFromFilter(filterDate.to, filterTime.toTime);
        
        if (fromDateTime && toDateTime) {
          profilesQuery = profilesQuery.gte('created_at', fromDateTime.toISOString()).lte('created_at', toDateTime.toISOString());
        } else if (fromDateTime) {
          profilesQuery = profilesQuery.gte('created_at', fromDateTime.toISOString());
        } else if (toDateTime) {
          profilesQuery = profilesQuery.lte('created_at', toDateTime.toISOString());
        }
      }
      
      // Apply country filter
      if (filterCountry !== 'all') {
        profilesQuery = profilesQuery.eq('country', filterCountry);
      }
      
      // Apply search filter
      if (filterSearch.trim()) {
        const search = filterSearch.trim();
        profilesQuery = profilesQuery.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
      }
      
      // Get total count (now properly filtered by plan)
      const { count: totalCount, error: countError } = await profilesQuery;
      
      if (countError) throw countError;
      
      console.log('[ADMIN STATS] Total users matching ALL filters (including plan):', totalCount);
      
      if (!totalCount || totalCount === 0) {
        // No users match the filters - clear everything
        setAggregateStats({
          totalUsers: 0,
          freeUsers: 0,
          proUsers: 0,
          ultraProUsers: 0,
          totalCost: 0,
          totalTokens: 0
        });
        
        // CRITICAL: Also clear the user list
        setUserUsages([]);
        setModelUsages([]);
        (window as any).__adminTotalUsers = 0;
        
        console.log('[ADMIN STATS] No users match filters - cleared all data');
        return;
      }
      
      // STEP 3: Calculate plan breakdown
      // Since we already filtered by plan in the query, this is simpler
      let proCount = 0;
      let ultraProCount = 0;
      let freeCount = 0;
      
      if (filterPlan === 'pro') {
        // All counted users are Pro
        proCount = totalCount;
        ultraProCount = 0;
        freeCount = 0;
      } else if (filterPlan === 'ultra') {
        // All counted users are Ultra Pro
        proCount = 0;
        ultraProCount = totalCount;
        freeCount = 0;
      } else if (filterPlan === 'free') {
        // All counted users are free
        proCount = 0;
        ultraProCount = 0;
        freeCount = totalCount;
      } else {
        // filterPlan === 'all' - optimize plan breakdown
        // CRITICAL OPTIMIZATION: Use efficient counting approach instead of fetching all user_ids
        
        // Strategy: Count subscriptions directly with filters applied at database level
        let subsQuery = supabase
          .from('user_subscriptions')
          .select('user_id, plan', { count: 'exact' })
          .eq('status', 'active');
        
        // If we have filters, we need to join with profiles to filter subscriptions
        // But to avoid fetching all data, we'll use a more efficient approach
        if (filterDate.from || filterDate.to || filterCountry !== 'all' || filterSearch.trim()) {
          // Build user_ids query with pagination to handle large datasets
          let filteredUserIdsQuery = supabase
            .from('profiles')
            .select('user_id');
          
          // Apply filters
          if (filterDate.from || filterDate.to) {
            const fromDateTime = getDateTimeFromFilter(filterDate.from, filterTime.fromTime);
            const toDateTime = getDateTimeFromFilter(filterDate.to, filterTime.toTime);
            
            if (fromDateTime && toDateTime) {
              filteredUserIdsQuery = filteredUserIdsQuery.gte('created_at', fromDateTime.toISOString()).lte('created_at', toDateTime.toISOString());
            } else if (fromDateTime) {
              filteredUserIdsQuery = filteredUserIdsQuery.gte('created_at', fromDateTime.toISOString());
            } else if (toDateTime) {
              filteredUserIdsQuery = filteredUserIdsQuery.lte('created_at', toDateTime.toISOString());
            }
          }
          
          if (filterCountry !== 'all') {
            filteredUserIdsQuery = filteredUserIdsQuery.eq('country', filterCountry);
          }
          
          if (filterSearch.trim()) {
            const search = filterSearch.trim();
            filteredUserIdsQuery = filteredUserIdsQuery.or(`display_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`);
          }
          
          // Fetch in batches to avoid hitting limits
          const batchSize = 1000;
          let allFilteredUserIds: string[] = [];
          let offset = 0;
          let hasMore = true;
          
          while (hasMore && offset < 10000) { // Safety limit of 10k users for performance
            const { data: batch } = await filteredUserIdsQuery
              .range(offset, offset + batchSize - 1);
            
            if (batch && batch.length > 0) {
              allFilteredUserIds.push(...batch.map(u => u.user_id));
              offset += batchSize;
              hasMore = batch.length === batchSize;
            } else {
              hasMore = false;
            }
          }
          
          console.log('[ADMIN STATS] Filtered user IDs for plan breakdown:', allFilteredUserIds.length);
          
          if (allFilteredUserIds.length > 0) {
            // Now count subscriptions only for filtered users
            const { data: filteredSubs } = await supabase
              .from('user_subscriptions')
              .select('plan')
              .eq('status', 'active')
              .in('user_id', allFilteredUserIds);
            
            proCount = filteredSubs?.filter(s => s.plan === 'pro').length || 0;
            ultraProCount = filteredSubs?.filter(s => s.plan === 'ultra_pro').length || 0;
            const subscribedCount = proCount + ultraProCount;
            freeCount = totalCount - subscribedCount;
            
            console.log('[ADMIN STATS] Plan breakdown with filters:', {
              proCount,
              ultraProCount,
              subscribedCount,
              freeCount,
              totalCount
            });
          } else {
            proCount = 0;
            ultraProCount = 0;
            freeCount = totalCount;
          }
        } else {
          // No filters - use simple global count (fast!)
          const { data: allSubs } = await supabase
            .from('user_subscriptions')
            .select('plan')
            .eq('status', 'active');
          
          proCount = allSubs?.filter(s => s.plan === 'pro').length || 0;
          ultraProCount = allSubs?.filter(s => s.plan === 'ultra_pro').length || 0;
          const subscribedCount = proCount + ultraProCount;
          freeCount = totalCount - subscribedCount;
          
          console.log('[ADMIN STATS] Plan breakdown (no filters):', {
            proCount,
            ultraProCount,
            subscribedCount,
            freeCount,
            totalCount
          });
        }
      }
      
      // For cost calculation, we'll use a simplified approach
      // Only calculate costs if filters are applied, otherwise show 0
      let totalCost = 0;
      let totalTokens = 0;
      
      console.log('[ADMIN STATS] Cost calculation skipped for unfiltered view - too many users');
      
      // Update aggregate stats
      const stats = {
        totalUsers: totalCount || 0,
        freeUsers: freeCount,
        proUsers: proCount,
        ultraProUsers: ultraProCount,
        totalCost,
        totalTokens
      };
      
      setAggregateStats(stats);
      
      console.log('[ADMIN STATS] Aggregate stats loaded:', {
        totalUsers: stats.totalUsers,
        freeUsers: stats.freeUsers,
        proUsers: stats.proUsers,
        ultraProUsers: stats.ultraProUsers,
        totalCost: stats.totalCost.toFixed(2),
        totalTokens: stats.totalTokens
      });
    } catch (error) {
      console.error('[ADMIN STATS] Error fetching aggregate stats:', error);
      toast.error('Failed to load statistics');
    }
  };
  
  const fetchTokenUsageData = async (
    isRefresh = false, 
    overridePlanFilter?: 'all' | 'free' | 'pro' | 'ultra',
    overrideDateFilter?: { from: Date | undefined; to: Date | undefined },
    overrideTimeFilter?: { fromTime: string; toTime: string },
    overrideCountryFilter?: string,
    overrideSearchQuery?: string
  ) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Use override filters if provided, otherwise use state
      const activePlanFilter = overridePlanFilter ?? planFilter;
      const activeDateFilter = overrideDateFilter ?? dateFilter;
      const activeTimeFilter = overrideTimeFilter ?? timeFilter;
      const activeCountryFilter = overrideCountryFilter ?? countryFilter;
      const activeSearchQuery = overrideSearchQuery ?? searchQuery;

      console.log('[ADMIN] Starting to fetch page data with filters...');
      console.log('[ADMIN] Active planFilter:', activePlanFilter);
      console.log('[ADMIN] Current page:', currentPage);
      console.log('[ADMIN] Sort field:', sortField, 'direction:', sortDirection);
      console.log('[ADMIN] Search query:', searchQuery);

      // Calculate offset based on current page
      const offset = (currentPage - 1) * usersPerPage;
      
      // Step 1: Build base query
      let query = supabase
        .from('profiles')
        .select('user_id, email, display_name, created_at, ip_address, country, phone_number', { count: 'exact' });
      
      let needsClientSideFiltering = false;
      let filteredUserIdsForPaidPlans: string[] | null = null;
      
      // For paid plans (pro/ultra), filter by user_id
      if (activePlanFilter === 'pro' || activePlanFilter === 'ultra') {
        const planValue = activePlanFilter === 'ultra' ? 'ultra_pro' : activePlanFilter;
        console.log('[ADMIN] Querying for plan:', planValue);
        
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('status', 'active')
          .eq('plan', planValue);
        
        filteredUserIdsForPaidPlans = subscriptions?.map(s => s.user_id) || [];
        console.log('[ADMIN] Filtered user_ids for plan', planValue, ':', filteredUserIdsForPaidPlans.length);
        
        // If no users match the plan filter, return empty
        if (filteredUserIdsForPaidPlans.length === 0) {
          setUserUsages([]);
          setModelUsages([]);
          (window as any).__adminTotalUsers = 0;
          setLoading(false);
          setRefreshing(false);
          return;
        }
        
        query = query.in('user_id', filteredUserIdsForPaidPlans);
      } else if (activePlanFilter === 'free') {
        // For free users, get all active subscription user_ids and exclude them
        const { data: subscriptions } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('status', 'active');
        
        const subscribedUserIds = subscriptions?.map(s => s.user_id) || [];
        console.log('[ADMIN] Excluding subscribed users:', subscribedUserIds.length);
        
        // If there are subscribed users, exclude them
        if (subscribedUserIds.length > 0) {
          query = query.not('user_id', 'in', `(${subscribedUserIds.join(',')})`);
        }
      }
      
      // Step 2: Apply additional filters
      
      // Apply search filter (name or email)
      if (activeSearchQuery.trim()) {
        const search = activeSearchQuery.trim();
        query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      // Apply date filter
      if (activeDateFilter.from || activeDateFilter.to) {
        const fromDateTime = getDateTimeFromFilter(activeDateFilter.from, activeTimeFilter.fromTime);
        const toDateTime = getDateTimeFromFilter(activeDateFilter.to, activeTimeFilter.toTime);
        
        if (fromDateTime && toDateTime) {
          query = query.gte('created_at', fromDateTime.toISOString()).lte('created_at', toDateTime.toISOString());
        } else if (fromDateTime) {
          query = query.gte('created_at', fromDateTime.toISOString());
        } else if (toDateTime) {
          query = query.lte('created_at', toDateTime.toISOString());
        }
      }
      
      // Apply country filter
      if (activeCountryFilter !== 'all') {
        console.log('[ADMIN] Applying country filter:', activeCountryFilter);
        query = query.eq('country', activeCountryFilter);
      }
      
      // Step 3: Handle plan sorting specially - it requires sorting ALL filtered users
      // then paginating, not the other way around
      let resultCount: number | null = null;
      let resultProfiles: any[] | null = null;
      
      if (sortField === 'plan') {
        console.log('[ADMIN] Applying plan-based sorting across ALL filtered users...');
        
        // First, get ALL user_ids that match current filters (lightweight query)
        let allUsersQuery = supabase
          .from('profiles')
          .select('user_id');
        
        // Re-apply all the same filters
        if (activePlanFilter === 'pro' || activePlanFilter === 'ultra') {
          allUsersQuery = allUsersQuery.in('user_id', filteredUserIdsForPaidPlans || []);
        } else if (activePlanFilter === 'free') {
          const { data: subs } = await supabase
            .from('user_subscriptions')
            .select('user_id')
            .eq('status', 'active');
          const subscribedIds = subs?.map(s => s.user_id) || [];
          if (subscribedIds.length > 0) {
            allUsersQuery = allUsersQuery.not('user_id', 'in', `(${subscribedIds.join(',')})`);
          }
        }
        
        if (activeSearchQuery.trim()) {
          const search = activeSearchQuery.trim();
          allUsersQuery = allUsersQuery.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
        }
        
        if (activeDateFilter.from || activeDateFilter.to) {
          const fromDateTime = activeDateFilter.from ? getDateTimeFromFilter(activeDateFilter.from, activeTimeFilter.fromTime) : null;
          const toDateTime = activeDateFilter.to ? getDateTimeFromFilter(activeDateFilter.to, activeTimeFilter.toTime) : null;
          
          if (fromDateTime && toDateTime) {
            allUsersQuery = allUsersQuery.gte('created_at', fromDateTime.toISOString()).lte('created_at', toDateTime.toISOString());
          } else if (fromDateTime) {
            allUsersQuery = allUsersQuery.gte('created_at', fromDateTime.toISOString());
          } else if (toDateTime) {
            allUsersQuery = allUsersQuery.lte('created_at', toDateTime.toISOString());
          }
        }
        
        if (activeCountryFilter !== 'all') {
          allUsersQuery = allUsersQuery.eq('country', activeCountryFilter);
        }
        
        // Fetch all matching user IDs
        const { data: allMatchingUsers, count: totalFiltered } = await allUsersQuery;
        resultCount = totalFiltered || 0;
        
        if (allMatchingUsers && allMatchingUsers.length > 0) {
          const allUserIds = allMatchingUsers.map(u => u.user_id);
          
          // Get subscriptions for ALL these users
          const { data: allSubscriptions } = await supabase
            .from('user_subscriptions')
            .select('user_id, plan')
            .eq('status', 'active')
            .in('user_id', allUserIds);
          
          // Create plan map
          const userPlanMap = new Map(allSubscriptions?.map(s => [s.user_id, s.plan]) || []);
          
          // Sort all user IDs by plan
          const sortedUserIds = [...allUserIds].sort((a, b) => {
            const planA = userPlanMap.get(a) || 'free';
            const planB = userPlanMap.get(b) || 'free';
            const planOrder: Record<string, number> = { free: 0, pro: 1, ultra_pro: 2 };
            const valueA = planOrder[planA] || 0;
            const valueB = planOrder[planB] || 0;
            
            if (sortDirection === 'asc') {
              return valueA - valueB;
            } else {
              return valueB - valueA;
            }
          });
          
          // Take only the user IDs for current page
          const paginatedUserIds = sortedUserIds.slice(offset, offset + usersPerPage);
          
          // Now fetch full profile data for just these users
          // Note: We need to preserve the sort order, so we'll sort client-side after fetch
          const { data: paginatedProfiles } = await supabase
            .from('profiles')
            .select('user_id, email, display_name, created_at, ip_address, country, phone_number')
            .in('user_id', paginatedUserIds);
          
          // Restore the sort order
          const profilesData = paginatedUserIds
            .map(id => paginatedProfiles?.find(p => p.user_id === id))
            .filter(Boolean);
          
          console.log('[ADMIN] Plan sorting: sorted', allUserIds.length, 'users, showing', profilesData.length);
          
          // Continue with these sorted profiles (skip the normal query)
          if (profilesData && profilesData.length > 0) {
            // Jump to subscription fetching (reuse existing code path)
            const userIds = profilesData.map(p => p.user_id);
            
            const { data: subscriptionsData } = await supabase
              .from('user_subscriptions')
              .select('user_id, status, product_id, plan, current_period_end, stripe_subscription_id, stripe_customer_id')
              .in('user_id', userIds)
              .eq('status', 'active');
            
            const subscriptionsMap = new Map(subscriptionsData?.map(sub => [sub.user_id, sub]) || []);
            
            let users: UserTokenUsage[] = profilesData.map((profile: any) => {
              const subscription = subscriptionsMap.get(profile.user_id);
              const emailDisplay = profile.email || (profile.phone_number ? profile.phone_number : 'Unknown');
              const displayName = profile.display_name || 
                                 (profile.email ? profile.email.split('@')[0] : null) || 
                                 (profile.phone_number ? profile.phone_number : 'Unknown User');
              
              return {
                user_id: profile.user_id,
                email: emailDisplay,
                display_name: displayName,
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
              };
            });
            
            setUserUsages(users);
            setModelUsages([]);
            (window as any).__adminTotalUsers = resultCount;
            setLoading(false);
            setRefreshing(false);
            return; // Exit early, we're done
          }
        }
        
        // If we got here, no users matched - clear and return
        setUserUsages([]);
        setModelUsages([]);
        (window as any).__adminTotalUsers = 0;
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Step 3b: Apply normal sorting at database level (for non-plan fields)
      if (sortField === 'name') {
        query = query.order('display_name', { ascending: sortDirection === 'asc', nullsFirst: false });
      } else if (sortField === 'email') {
        query = query.order('email', { ascending: sortDirection === 'asc', nullsFirst: false });
      } else if (sortField === 'registered') {
        query = query.order('created_at', { ascending: sortDirection === 'asc' });
      } else {
        // Default ordering for cost (cost sorting still client-side due to complexity)
        query = query.order('created_at', { ascending: false });
      }
      
      // Step 4: Apply pagination and execute query
      const { data: profilesData, error: profilesError, count } = await query
        .range(offset, offset + usersPerPage - 1);
      
      resultCount = count || 0;
      
      if (profilesError) throw profilesError;
      
      console.log('[ADMIN] Loaded profiles for page:', profilesData?.length, 'Total filtered:', count);

      // CRITICAL: If no users match the filters, clear everything
      if (count === 0 || !profilesData || profilesData.length === 0) {
        console.log('[ADMIN] No users found matching filters - clearing user list');
        setUserUsages([]);
        setModelUsages([]);
        (window as any).__adminTotalUsers = 0;
        setLoading(false);
        setRefreshing(false);
        return;
      }

      // Fetch subscriptions only for these users
      const userIds = profilesData?.map(p => p.user_id) || [];
      
      if (userIds.length === 0) {
        setUserUsages([]);
        setModelUsages([]);
        (window as any).__adminTotalUsers = count || 0;
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      // Fetch subscriptions only for these users - CRITICAL: Only fetch ACTIVE subscriptions
      const { data: subscriptionsData } = await supabase
        .from('user_subscriptions')
        .select('user_id, status, product_id, plan, current_period_end, stripe_subscription_id, stripe_customer_id')
        .in('user_id', userIds)
        .eq('status', 'active'); // CRITICAL: Only active subscriptions

      console.log('[ADMIN] Fetched active subscriptions:', subscriptionsData?.length, 'for', userIds.length, 'users');
      
      // Log plan distribution in fetched subscriptions
      const planCounts = subscriptionsData?.reduce((acc, sub) => {
        acc[sub.plan || 'unknown'] = (acc[sub.plan || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('[ADMIN] Active subscription plan distribution:', planCounts);

      const subscriptionsMap = new Map(subscriptionsData?.map(sub => [sub.user_id, sub]) || []);

      // Build user data without token usage (load on demand)
      let users: UserTokenUsage[] = profilesData?.map((profile: any) => {
        const subscription = subscriptionsMap.get(profile.user_id);
        
        // Determine display values with phone number fallback
        const emailDisplay = profile.email || (profile.phone_number ? profile.phone_number : 'Unknown');
        const displayName = profile.display_name || 
                           (profile.email ? profile.email.split('@')[0] : null) || 
                           (profile.phone_number ? profile.phone_number : 'Unknown User');
        
        return {
          user_id: profile.user_id,
          email: emailDisplay,
          display_name: displayName,
          created_at: profile.created_at,
          ip_address: profile.ip_address,
          country: profile.country,
          model_usages: [], // Load on demand when "Cost View" is clicked
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
        };
      }) || [];
      
      console.log('[ADMIN] Final user list after all filters:', users.length);
      console.log('[ADMIN] Sample users (first 3):', users.slice(0, 3).map(u => ({
        email: u.email,
        plan: u.subscription_status?.plan,
        subscribed: u.subscription_status?.subscribed
      })));
      
      setUserUsages(users);
      setModelUsages([]);
      
      // Store total count for pagination
      (window as any).__adminTotalUsers = count || 0;
      
    } catch (error) {
      console.error('[ADMIN] Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
    
    // Map plan names to return values
    if (plan === 'pro') return 'pro';
    if (plan === 'ultra_pro') return 'ultra';
    
    // Fallback to product_id matching if plan is not set (should not happen with proper data)
    const productId = usage.subscription_status.product_id;
    if (productId) {
      if (['prod_TGsOnuDkIh9hVG', 'prod_TGqo8h59qNKZ4m', 'prod_TGqqoPGWQJ0T4a', 'prod_TIHYThP5XmWyWy'].includes(productId)) {
        console.warn('[ADMIN] Using product_id fallback for Pro plan, user:', usage.user_id);
        return 'pro';
      }
      if (['prod_TGqs5r2udThT0t', 'prod_TGquGexHO44m4T', 'prod_TGqwVIWObYLt6U', 'prod_TIHZLvUNMqIiCj'].includes(productId)) {
        console.warn('[ADMIN] Using product_id fallback for Ultra plan, user:', usage.user_id);
        return 'ultra';
      }
    }
    
    console.error('[ADMIN] Unknown plan/product_id:', { plan, productId, userId: usage.user_id });
    return 'free'; // Fallback to free if we can't determine the plan
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

  // Get unique countries - fetch from all profiles for filter dropdown
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchCountries = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('country')
        .not('country', 'is', null);
      
      const countries = Array.from(new Set(data?.map(p => p.country).filter(Boolean))).sort() as string[];
      setUniqueCountries(countries);
    };
    
    if (isAdmin) {
      fetchCountries();
    }
  }, [isAdmin]);

  // Combine date and time into a single Date object
  const getDateTimeFromFilter = (date: Date | undefined, time: string): Date | undefined => {
    if (!date) return undefined;
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = new Date(date);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  // Users are already filtered and sorted server-side
  const filteredUsers = userUsages;

  // Apply client-side sorting only for complex fields (plan, cost) that couldn't be sorted at DB level
  // Simple fields (name, email, registered) are already sorted by the database query
  const sortedUsers = (sortField === 'plan' || sortField === 'cost') 
    ? [...filteredUsers].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === 'plan') {
          const planOrder = { free: 0, pro: 1, ultra: 2 };
          aValue = planOrder[getUserPlan(a)];
          bValue = planOrder[getUserPlan(b)];
        } else if (sortField === 'cost') {
          aValue = a.model_usages.reduce((sum, m) => sum + m.cost, 0);
          bValue = b.model_usages.reduce((sum, m) => sum + m.cost, 0);
        }

        if (sortDirection === 'asc') {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      })
    : filteredUsers; // For name, email, registered - already sorted by database

  // Pagination - use sorted data
  const totalUsers = (window as any).__adminTotalUsers || userUsages.length;
  const totalPages = Math.ceil(totalUsers / usersPerPage);
  const paginatedUsers = sortedUsers;

  // Quick date presets
  const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    const today = startOfToday();
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    switch (preset) {
      case 'today':
        setTempDateFilter({ from: today, to: today });
        setTempTimeFilter({ fromTime: '00:00', toTime: currentTime });
        break;
      case 'yesterday':
        const yesterday = subDays(today, 1);
        setTempDateFilter({ from: yesterday, to: yesterday });
        setTempTimeFilter({ fromTime: '00:00', toTime: '23:59' });
        break;
      case 'week':
        setTempDateFilter({ from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) });
        setTempTimeFilter({ fromTime: '00:00', toTime: '23:59' });
        break;
      case 'month':
        setTempDateFilter({ from: startOfMonth(today), to: endOfMonth(today) });
        setTempTimeFilter({ fromTime: '00:00', toTime: '23:59' });
        break;
      case 'all':
        setTempDateFilter({ from: undefined, to: undefined });
        setTempTimeFilter({ fromTime: '00:00', toTime: '23:59' });
        break;
    }
  };
  
  // Apply date picker selection
  const applyDatePicker = () => {
    setPendingDateFilter(tempDateFilter);
    setPendingTimeFilter(tempTimeFilter);
    setShowDatePickerView(false);
  };
  
  // Initialize temp values when date picker opens
  useEffect(() => {
    if (showDatePicker) {
      setTempDateFilter(pendingDateFilter);
      setTempTimeFilter(pendingTimeFilter);
    }
  }, [showDatePicker]);
  
  // Apply filters function
  const applyFilters = async () => {
    console.log('[ADMIN FILTER] Applying filters - pendingPlanFilter:', pendingPlanFilter);
    
    // Reset to page 1 when applying new filters
    isApplyingFilters.current = true;
    setCurrentPage(1);
    
    // Apply all pending filters (search is now real-time, so not included here)
    setPlanFilter(pendingPlanFilter);
    setDateFilter(pendingDateFilter);
    setTimeFilter(pendingTimeFilter);
    setCountryFilter(pendingCountryFilter);
    setSubscriptionStatusFilter(pendingSubscriptionStatusFilter);
    setTimezone(pendingTimezone);
    setShowFilters(false);
    
    console.log('[ADMIN FILTER] Applied planFilter:', pendingPlanFilter);
    
    // Fetch data with new filters - CRITICAL: Pass ALL pending filter values directly to avoid race condition
    setIsRefreshing(true);
    await Promise.all([
      fetchTokenUsageData(false, pendingPlanFilter, pendingDateFilter, pendingTimeFilter, pendingCountryFilter, searchQuery),
      fetchAggregateStats(
        pendingPlanFilter,
        pendingDateFilter,
        pendingTimeFilter,
        pendingCountryFilter,
        searchQuery
      )
    ]);
    setIsRefreshing(false);
  };
  
  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTokenUsageData(false, planFilter, dateFilter, timeFilter, countryFilter, searchQuery),
      fetchAggregateStats(planFilter, dateFilter, timeFilter, countryFilter, searchQuery)
    ]);
    setRefreshing(false);
  };
  
  // Sync pending filters when opening the filter panel
  useEffect(() => {
    if (showFilters) {
      setPendingPlanFilter(planFilter);
      setPendingDateFilter(dateFilter);
      setPendingTimeFilter(timeFilter);
      setPendingCountryFilter(countryFilter);
      setPendingSubscriptionStatusFilter(subscriptionStatusFilter);
      setPendingTimezone(timezone);
      setShowDatePickerView(false);
    }
  }, [showFilters]);

  // Count active filters
  const activeFiltersCount = [
    planFilter !== 'all',
    searchQuery.trim() !== '',
    dateFilter.from || dateFilter.to,
    countryFilter !== 'all',
    subscriptionStatusFilter !== 'all'
  ].filter(Boolean).length;

  // Clear all filters
  const clearAllFilters = async () => {
    // Reset all filter states
    setPlanFilter('all');
    setSearchQuery('');
    setDateFilter({ from: undefined, to: undefined });
    setTimeFilter({ fromTime: '00:00', toTime: '23:59' });
    setCountryFilter('all');
    setSubscriptionStatusFilter('all');
    setPendingPlanFilter('all');
    setPendingDateFilter({ from: undefined, to: undefined });
    setPendingTimeFilter({ fromTime: '00:00', toTime: '23:59' });
    setPendingCountryFilter('all');
    setPendingSubscriptionStatusFilter('all');
    setShowFilters(false);
    
    // Reset to page 1 and refresh data with default filters
    isApplyingFilters.current = true;
    setCurrentPage(1);
    setIsRefreshing(true);
    
    await Promise.all([
      fetchTokenUsageData(false, 'all', { from: undefined, to: undefined }, { fromTime: '00:00', toTime: '23:59' }, 'all', ''),
      fetchAggregateStats('all', { from: undefined, to: undefined }, { fromTime: '00:00', toTime: '23:59' }, 'all', '')
    ]);
    
    setIsRefreshing(false);
  };

  // Reset to page 1 and refetch when filter, search, or sort changes
  useEffect(() => {
    if (isAdmin) {
      setCurrentPage(1);
      // Trigger data fetch when sort changes
      setIsRefreshing(true);
      Promise.all([
        fetchTokenUsageData(false, planFilter, dateFilter, timeFilter, countryFilter, searchQuery),
        fetchAggregateStats(planFilter, dateFilter, timeFilter, countryFilter, searchQuery)
      ]).finally(() => {
        setIsRefreshing(false);
      });
    }
  }, [sortField, sortDirection]);

  // Fetch cost/token usage data for a specific user when "Cost View" is clicked
  const fetchUserCostData = async (userId: string) => {
    try {
      console.log('Fetching cost data for user:', userId);
      
      // Fetch token usage for this specific user only
      const { data: tokenData, error: tokenError } = await supabase
        .from('token_usage')
        .select('model, input_tokens, output_tokens, cost')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1000); // Last 1000 records for this user
      
      if (tokenError) throw tokenError;
      
      // Use pre-calculated costs from database
      const modelUsages = tokenData?.map(usage => ({
        model: usage.model,
        input_tokens: usage.input_tokens || 0,
        output_tokens: usage.output_tokens || 0,
        cost: Number(usage.cost) || 0
      })) || [];
      
      // Update the user's model_usages in state
      setUserUsages(prev => prev.map(u => 
        u.user_id === userId 
          ? { ...u, model_usages: modelUsages }
          : u
      ));
      
      console.log('Loaded cost data:', modelUsages.length, 'records');
    } catch (error) {
      console.error('Error fetching user cost data:', error);
      toast.error('Failed to load cost data');
    }
  };

  // Fetch subscription status for a specific user
  const fetchUserSubscription = async (userId: string) => {
    // Subscription is already loaded from database, no need to fetch again
    setLoadingSubscription(false);
  };

  // Fetch chats for a specific user
  const fetchUserChats = async (userId: string) => {
    console.log('[ADMIN] Fetching chats for user:', userId);
    try {
      setLoadingChats(true);
      console.log('[ADMIN] Loading chats set to true');
      
      const { data, error } = await supabase
        .from('chats')
        .select('id, title, created_at, updated_at, model_id')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      console.log('[ADMIN] Chats query result:', { dataCount: data?.length, error });

      if (error) {
        console.error('[ADMIN] Error from chats query:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('[ADMIN] No chats found for user');
        setUserChats([]);
        return;
      }

      console.log('[ADMIN] Fetching message counts for', data.length, 'chats');
      
      // Get message counts for each chat
      const chatsWithCounts = await Promise.all(
        data.map(async (chat) => {
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('chat_id', chat.id);
          
          if (countError) {
            console.warn('[ADMIN] Error counting messages for chat:', chat.id, countError);
          }
          
          return { ...chat, message_count: count || 0 };
        })
      );

      console.log('[ADMIN] Chats with counts:', chatsWithCounts.length);
      setUserChats(chatsWithCounts);
    } catch (error) {
      console.error('[ADMIN] Error in fetchUserChats:', error);
      toast.error('Failed to load user chats');
      setUserChats([]);
    } finally {
      console.log('[ADMIN] Setting loadingChats to false');
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
          <div className="flex gap-2">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRefresh();
              }}
              type="button"
              className="gap-2 h-10"
              variant="outline"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={handleDownloadUserList}
              className="gap-2 h-10"
              variant="outline"
            >
              <Download className="w-4 h-4" />
              Download User List
            </Button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col gap-3">
          {/* Filter Button */}
          <div className="flex justify-end gap-2">
            <Button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRefresh();
              }}
              type="button"
              variant="outline"
              className="lg:hidden h-11 gap-2 transition-all duration-300 flex-shrink-0"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">Refresh</span>
            </Button>
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-11 gap-2.5 transition-all duration-300 flex-shrink-0 ${
                    activeFiltersCount > 0 
                      ? 'border-primary/50 bg-primary/5 hover:bg-primary/10 shadow-sm' 
                      : 'hover:border-primary/30'
                  }`}
                >
                  <Filter className={`h-4 w-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} />
                  <span className="hidden sm:inline font-medium">Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-5 w-5 p-0 flex items-center justify-center rounded-full animate-scale-in font-semibold">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[95vw] sm:w-[500px] md:w-[540px] max-w-[540px] p-0 animate-scale-in shadow-xl border-border/50" align="end">
                <div className="space-y-0">
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 bg-gradient-to-r from-background to-muted/20">
                    <div className="flex items-center gap-2.5">
                      {showDatePickerView && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowDatePickerView(false)}
                          className="h-7 px-2 mr-1 hover:bg-muted/50"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <Filter className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <h4 className="font-semibold text-sm">{showDatePickerView ? 'Select Date & Time' : 'Advanced Filters'}</h4>
                    </div>
                    {activeFiltersCount > 0 && !showDatePickerView && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllFilters}
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200 hover:bg-muted/50"
                      >
                        Clear all
                      </Button>
                    )}
                  </div>

                  {!showDatePickerView ? (
                    <>
                    <div className="px-5 py-4 space-y-5">
                    {/* Plan Filter */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        Plan Type
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={pendingPlanFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPendingPlanFilter('all')}
                          className="h-9 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                          All
                        </Button>
                        <Button
                          variant={pendingPlanFilter === 'free' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPendingPlanFilter('free')}
                          className="h-9 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                          Free
                        </Button>
                        <Button
                          variant={pendingPlanFilter === 'pro' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPendingPlanFilter('pro')}
                          className="h-9 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                          Pro
                        </Button>
                        <Button
                          variant={pendingPlanFilter === 'ultra' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setPendingPlanFilter('ultra')}
                          className="h-9 text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
                        >
                          Ultra
                        </Button>
                      </div>
                    </div>

                      {/* Date Range Filter */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <div className="w-1 h-3 bg-primary rounded-full" />
                          Date & Time
                        </label>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setTempDateFilter(pendingDateFilter);
                            setTempTimeFilter(pendingTimeFilter);
                            setShowDatePickerView(true);
                          }}
                          className="w-full h-10 justify-start text-left font-normal text-xs transition-all duration-200 hover:bg-muted/50 hover:border-primary/30"
                        >
                          <CalendarIcon className="h-3.5 w-3.5 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {pendingDateFilter.from ? (
                              pendingDateFilter.to ? (
                                pendingDateFilter.from.getTime() === pendingDateFilter.to.getTime() ? (
                                  // Single day selected
                                  <>
                                    {format(pendingDateFilter.from, 'MMM dd, yyyy')} {pendingTimeFilter.fromTime}
                                    {pendingTimeFilter.fromTime !== pendingTimeFilter.toTime && ` - ${pendingTimeFilter.toTime}`}
                                  </>
                                ) : (
                                  // Date range selected
                                  <>
                                    {format(pendingDateFilter.from, 'MMM dd')} {pendingTimeFilter.fromTime} - {format(pendingDateFilter.to, 'MMM dd, yyyy')} {pendingTimeFilter.toTime}
                                  </>
                                )
                              ) : (
                                `${format(pendingDateFilter.from, 'MMM dd, yyyy')} ${pendingTimeFilter.fromTime}`
                              )
                            ) : (
                              'Select date & time range'
                            )}
                          </span>
                        </Button>
                    </div>

                    {/* Timezone Filter */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        Timezone
                      </label>
                      <select
                        value={pendingTimezone}
                        onChange={(e) => setPendingTimezone(e.target.value)}
                        className="w-full h-10 px-3 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/30 cursor-pointer"
                      >
                        <option value="UTC">UTC</option>
                        <option value="Europe/Nicosia">Europe/Nicosia (Cyprus)</option>
                        <option value="America/New_York">America/New York</option>
                        <option value="America/Los_Angeles">America/Los Angeles</option>
                        <option value="America/Chicago">America/Chicago</option>
                        <option value="Europe/London">Europe/London</option>
                        <option value="Europe/Paris">Europe/Paris</option>
                        <option value="Europe/Berlin">Europe/Berlin</option>
                        <option value="Europe/Moscow">Europe/Moscow</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                        <option value="Asia/Kolkata">Asia/Kolkata</option>
                        <option value="Asia/Shanghai">Asia/Shanghai</option>
                        <option value="Asia/Tokyo">Asia/Tokyo</option>
                        <option value="Australia/Sydney">Australia/Sydney</option>
                      </select>
                    </div>
                    
                    {/* Country Filter */}
                    <div className="space-y-2.5">
                      <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <div className="w-1 h-3 bg-primary rounded-full" />
                        <MapPin className="h-3.5 w-3.5" />
                        Country
                      </label>
                      <select
                        value={pendingCountryFilter}
                        onChange={(e) => setPendingCountryFilter(e.target.value)}
                        className="w-full h-10 px-3 text-xs border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 hover:border-primary/30 cursor-pointer"
                      >
                        <option value="all">All Countries</option>
                        {uniqueCountries.map((country) => (
                          <option key={country} value={country}>
                            {getCountryName(country)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <div className="px-5 py-3 border-t border-border/50 bg-gradient-to-r from-muted/20 to-background">
                    <Button 
                      type="button"
                      onClick={applyFilters} 
                      className="w-full h-10 font-semibold"
                    >
                      Apply Filters
                    </Button>
                  </div>
                  </>
                  ) : (
                    <>
                    {/* Date Picker View */}
                    <div className="flex flex-col bg-background">
                      <div className="flex flex-col sm:flex-row">
                        <div className="border-b sm:border-b-0 sm:border-r border-border p-2.5 space-y-1.5 bg-gradient-to-br from-primary/5 to-transparent w-full sm:w-[160px] sm:ml-3">
                          <div className="px-1">
                            <h3 className="text-xs font-bold text-foreground">Quick Select</h3>
                          </div>
                          <div className="flex flex-row sm:flex-col gap-1 flex-wrap sm:flex-nowrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 sm:w-full justify-start h-8 text-base font-medium px-2.5 transition-all duration-200 hover:bg-primary/15 hover:text-primary"
                              onClick={() => setDatePreset('today')}
                            >
                              Today
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 sm:w-full justify-start h-8 text-base font-medium px-2.5 transition-all duration-200 hover:bg-primary/15 hover:text-primary"
                              onClick={() => setDatePreset('yesterday')}
                            >
                              Yesterday
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 sm:w-full justify-start h-8 text-base font-medium px-2.5 transition-all duration-200 hover:bg-primary/15 hover:text-primary"
                              onClick={() => setDatePreset('week')}
                            >
                              Last 7 Days
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 sm:w-full justify-start h-8 text-base font-medium px-2.5 transition-all duration-200 hover:bg-primary/15 hover:text-primary"
                              onClick={() => setDatePreset('month')}
                            >
                              Last 30 Days
                            </Button>
                            <div className="hidden sm:block border-t border-border my-1 w-full" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 sm:w-full justify-start h-8 text-base font-medium px-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                              onClick={() => setDatePreset('all')}
                            >
                              Clear
                            </Button>
                          </div>
                        </div>
                        <div className="p-2 flex justify-center items-center flex-1">
                          <Calendar
                            mode="range"
                            selected={{ from: tempDateFilter.from, to: tempDateFilter.to }}
                            onSelect={(range) => {
                              setTempDateFilter({ from: range?.from, to: range?.to });
                            }}
                            numberOfMonths={1}
                            className="pointer-events-auto"
                          />
                        </div>
                      </div>
                      {/* Time Selection */}
                      {tempDateFilter.from && (
                        <div className="border-t border-border p-3 space-y-2.5 bg-muted/10 animate-fade-in">
                          <h4 className="text-xs font-semibold text-foreground">Time Range</h4>
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-foreground">Start</label>
                              <Input
                                type="time"
                                value={tempTimeFilter.fromTime}
                                onChange={(e) => setTempTimeFilter(prev => ({ ...prev, fromTime: e.target.value }))}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-medium text-foreground">End</label>
                              <Input
                                type="time"
                                value={tempTimeFilter.toTime}
                                onChange={(e) => setTempTimeFilter(prev => ({ ...prev, toTime: e.target.value }))}
                                className="h-9 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Apply Button */}
                      <div className="px-3 py-2.5 border-t border-border bg-muted/5">
                        <Button 
                          type="button"
                          onClick={applyDatePicker} 
                          className="w-full h-9 font-semibold text-sm"
                        >
                          Apply Filter
                        </Button>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {planFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Plan: {planFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-foreground" 
                    onClick={() => setPlanFilter('all')}
                  />
                </Badge>
              )}
              {(dateFilter.from || dateFilter.to) && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Date: {dateFilter.from && dateFilter.to && dateFilter.from.getTime() === dateFilter.to.getTime() 
                    ? (
                      <>
                        {format(dateFilter.from, 'MMM dd, yyyy')} {timeFilter.fromTime}
                        {timeFilter.fromTime !== timeFilter.toTime && ` - ${timeFilter.toTime}`}
                      </>
                    )
                    : (
                      <>
                        {dateFilter.from && `${format(dateFilter.from, 'MMM dd')} ${timeFilter.fromTime}`}
                        {dateFilter.to && dateFilter.from?.getTime() !== dateFilter.to?.getTime() && ` - ${format(dateFilter.to, 'MMM dd')} ${timeFilter.toTime}`}
                      </>
                    )
                  }
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-foreground" 
                    onClick={() => {
                      setDateFilter({ from: undefined, to: undefined });
                      setTimeFilter({ fromTime: '00:00', toTime: '23:59' });
                    }}
                  />
                </Badge>
              )}
              {countryFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Country: {getCountryName(countryFilter)}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-foreground" 
                    onClick={() => setCountryFilter('all')}
                  />
                </Badge>
              )}
              {subscriptionStatusFilter !== 'all' && (
                <Badge variant="secondary" className="gap-1 text-xs">
                  Status: {subscriptionStatusFilter}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-foreground" 
                    onClick={() => setSubscriptionStatusFilter('all')}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className={`grid gap-3 sm:gap-4 md:gap-5 lg:gap-6 grid-cols-2 lg:grid-cols-5 w-full transition-opacity duration-200 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg col-span-2 lg:col-span-1 overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Total Users</CardTitle>
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-foreground">{aggregateStats.totalUsers}</div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Registered users</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Free Users</CardTitle>
              <Badge variant="secondary" className="text-xs sm:text-sm flex-shrink-0 group-hover:scale-105 transition-transform">{aggregateStats.freeUsers}</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {aggregateStats.freeUsers}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">On free plan</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Pro Users</CardTitle>
              <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-xs sm:text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                {aggregateStats.proUsers}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {aggregateStats.proUsers}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Pro subscribers</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Ultra Pro</CardTitle>
              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs sm:text-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                {aggregateStats.ultraProUsers}
              </Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-foreground">
                {aggregateStats.ultraProUsers}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">Ultra subscribers</p>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg col-span-2 lg:col-span-1 overflow-hidden group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 p-4 sm:p-5 md:p-6">
              <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground truncate">Total Usage</CardTitle>
              <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-xs sm:text-sm flex-shrink-0 group-hover:scale-105 transition-transform">Cost</Badge>
            </CardHeader>
            <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0 md:p-6 md:pt-0">
              <div className="text-3xl sm:text-4xl font-bold text-foreground">
                ${aggregateStats.totalCost.toFixed(2)}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                {(aggregateStats.totalTokens / 1000000).toFixed(2)}M tokens
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
                    {isRefreshing && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                    )}
                  </div>
                  <CardDescription className="text-xs sm:text-sm mt-2 truncate">
                    Showing {userUsages.length} users (Page {currentPage} of {totalPages})
                  </CardDescription>
                </div>
              </div>
              
              {/* Search */}
              <div className="flex flex-col gap-3 w-full">
                <div className="relative flex-1 max-w-full sm:max-w-md md:max-w-lg">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-9 h-11 text-sm sm:text-base w-full"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 w-full overflow-hidden">
            {/* Mobile/Tablet Card Layout */}
            <div className="lg:hidden">
                  {/* Mobile Sort Controls */}
                  <div className="border-b border-border/50 p-4 bg-muted/20">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Sort by:</p>
                    <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4">
                      <Button
                        variant={sortField === 'name' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('name')}
                        className="h-9 text-xs gap-1.5 flex-shrink-0"
                      >
                        Name
                        {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'email' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('email')}
                        className="h-9 text-xs gap-1.5 flex-shrink-0"
                      >
                        Email
                        {sortField === 'email' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'plan' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('plan')}
                        className="h-9 text-xs gap-1.5 flex-shrink-0"
                      >
                        Plan
                        {sortField === 'plan' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'cost' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('cost')}
                        className="h-9 text-xs gap-1.5 flex-shrink-0"
                      >
                        Cost
                        {sortField === 'cost' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                      </Button>
                      <Button
                        variant={sortField === 'registered' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleSort('registered')}
                        className="h-9 text-xs gap-1.5 flex-shrink-0"
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
                        const totalCost = usage.model_usages.length > 0 
                          ? usage.model_usages.reduce((sum, m) => sum + m.cost, 0)
                          : null; // null means not loaded yet
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
                                  {usage.created_at ? new Date(usage.created_at).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: timezone
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
                                    // Load cost data and chats in parallel
                                    await Promise.all([
                                      fetchUserCostData(usage.user_id),
                                      fetchUserChats(usage.user_id)
                                    ]);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Cost View
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
                            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                              {usage.created_at ? new Date(usage.created_at).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                timeZone: timezone
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
                                      await fetchTokenUsageData(true);
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
                                    // Load cost data and chats in parallel
                                    await Promise.all([
                                      fetchUserCostData(usage.user_id),
                                      fetchUserChats(usage.user_id)
                                    ]);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Cost View
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
                      await fetchTokenUsageData(true);
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