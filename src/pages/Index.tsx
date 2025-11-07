import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { MessageLimitWarning } from '@/components/MessageLimitWarning';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { supabase } from '@/integrations/supabase/client';
import { trackChatStart } from '@/utils/gtmTracking';
import { Paperclip, Mic, MicOff, ImageIcon, Globe, Edit3, BookOpen, Search, FileText, Plus, ChevronLeft, ChevronRight, X, Palette, BarChart3, Lightbulb, Settings, Zap, Menu, ChevronDown, ChevronUp, Mail, Pen, Briefcase, Apple } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';

import GoogleOneTab from '@/components/GoogleOneTab';
import AuthModal from '@/components/AuthModal';
import { GoProButton } from '@/components/GoProButton';
import { PricingModal } from '@/components/PricingModal';
import { UpgradeBlockedDialog } from '@/components/UpgradeBlockedDialog';
import { ActiveSubscriptionDialog } from '@/components/ActiveSubscriptionDialog';
import { toast } from 'sonner';
import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';

import claudeLogo from '@/assets/claude-logo.png';
import geminiLogo from '@/assets/gemini-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';


const models = [{
  id: 'gpt-4o-mini',
  name: 'GPT-4o mini',
  shortLabel: 'GPT-4o mini',
  description: "Default model",
  type: 'free'
}, {
  id: 'gpt-4o',
  name: 'GPT-4o',
  shortLabel: 'GPT-4o',
  description: "High Quality option",
  type: 'pro'
}, {
  id: 'gpt-5',
  name: 'GPT-5',
  shortLabel: 'GPT-5',
  description: "Most advanced AI model",
  type: 'pro'
}, {
  id: 'claude-haiku-4.5',
  name: 'Claude Haiku 4.5',
  shortLabel: 'Haiku 4.5',
  description: "NEW: Small model with big capabilities",
  type: 'ultra'
}, {
  id: 'gemini-2.5-flash',
  name: 'Gemini 2.5 Flash',
  shortLabel: 'Gemini 2.5',
  description: "Fast Google AI model",
  type: 'pro'
}, {
  id: 'deepseek-v2',
  name: 'DeepSeek V2',
  shortLabel: 'DeepSeek V2',
  description: "Advanced reasoning model",
  type: 'ultra'
}, {
  id: 'grok-4',
  name: 'Grok 4',
  shortLabel: 'Grok 4',
  description: "Powerful AI from xAI",
  type: 'ultra'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: "Create images with AI",
  type: 'pro'
}];

const emojiCategories = {
  'general': ['😊', '👍', '🔥', '💯', '🎉', '✨', '🚀', '💪', '🎯', '⭐'],
  'emotions': ['😍', '🥰', '😂', '🤔', '😮', '🙄', '😎', '🤗', '😴', '🤯'],
  'objects': ['📱', '💻', '🎮', '📸', '🎵', '📚', '✏️', '🔧', '💡', '🏆'],
  'nature': ['🌟', '🌙', '☀️', '🌈', '🌸', '🌿', '🍀', '🦋', '🌊', '🔮'],
  'food': ['🍕', '🍔', '🍰', '🍪', '☕', '🍵', '🥤', '🍎', '🥑', '🌮'],
  'activities': ['🎨', '🎪', '🎭', '🎬', '🎤', '🎸', '🏃', '🚴', '🏊', '✈️']
};

// Suggestion prompts mapped by category - keys for translation
const suggestionPromptKeys = {
  'document-summary': ['prompts.documentSummary.1', 'prompts.documentSummary.2', 'prompts.documentSummary.3', 'prompts.documentSummary.4'],
  'email-response': ['prompts.emailResponse.1', 'prompts.emailResponse.2', 'prompts.emailResponse.3', 'prompts.emailResponse.4'],
  'improve-writing': ['prompts.improveWriting.1', 'prompts.improveWriting.2', 'prompts.improveWriting.3', 'prompts.improveWriting.4'],
  'learning-help': ['prompts.learningHelp.1', 'prompts.learningHelp.2', 'prompts.learningHelp.3', 'prompts.learningHelp.4'],
  'business-ideas': ['prompts.businessIdeas.1', 'prompts.businessIdeas.2', 'prompts.businessIdeas.3', 'prompts.businessIdeas.4'],
  'text-summary': ['prompts.textSummary.1', 'prompts.textSummary.2', 'prompts.textSummary.3', 'prompts.textSummary.4'],
  'calorie-check': ['prompts.calorieCheck.1', 'prompts.calorieCheck.2', 'prompts.calorieCheck.3', 'prompts.calorieCheck.4']
};
const availableModels = [{
  id: 'gpt-4o-mini',
  name: 'GPT-4o mini',
  shortLabel: 'GPT-4o mini',
  description: 'Fast and cost-efficient model, perfect for most tasks.',
  icon: 'openai'
}, {
  id: 'gpt-4o',
  name: 'GPT-4o',
  shortLabel: 'GPT-4o',
  description: 'High-quality model for complex reasoning and accurate responses.',
  icon: 'openai'
}, {
  id: 'gpt-5',
  name: 'GPT-5',
  shortLabel: 'GPT-5',
  description: 'Most advanced OpenAI model with superior capabilities and reasoning.',
  icon: 'openai'
}, {
  id: 'claude-haiku-4.5',
  name: 'Claude Haiku 4.5',
  shortLabel: 'Haiku 4.5',
  description: 'NEW: Small model with big capabilities - great value',
  icon: 'claude'
}, {
  id: 'gemini-2.5-flash',
  name: 'Gemini 2.5 Flash',
  shortLabel: 'Gemini 2.5',
  description: 'Fast Google AI model with multimodal capabilities.',
  icon: 'gemini',
  type: 'pro'
}, {
  id: 'deepseek-v2',
  name: 'DeepSeek V2',
  shortLabel: 'DeepSeek V2',
  description: 'Advanced reasoning model with strong performance.',
  icon: 'deepseek'
}, {
  id: 'grok-4',
  name: 'Grok 4',
  shortLabel: 'Grok 4',
  description: 'Powerful AI model from xAI with advanced capabilities.',
  icon: 'grok'
}, {
  id: 'generate-image',
  name: 'Generate Image',
  shortLabel: 'Generate Image',
  description: 'Create stunning AI-generated images from text descriptions.',
  icon: 'image'
}];

// Suggestion buttons for quick actions - labels will be translated dynamically
const suggestionButtons = [
  { labelKey: 'suggestions.documentSummary', action: 'document-summary', icon: FileText },
  { labelKey: 'suggestions.emailResponse', action: 'email-response', icon: Mail },
  { labelKey: 'suggestions.improveWriting', action: 'improve-writing', icon: Pen },
  { labelKey: 'suggestions.knowledgeBoost', action: 'learning-help', icon: BookOpen },
  { labelKey: 'suggestions.businessIdeas', action: 'business-ideas', icon: Briefcase },
  { labelKey: 'suggestions.textSummary', action: 'text-summary', icon: FileText },
  { labelKey: 'suggestions.calorieCheck', action: 'calorie-check', icon: Apple },
];

const additionalButtons: typeof suggestionButtons = [];

// Use the prompt keys for translation
const suggestionPrompts = suggestionPromptKeys;

export default function Index() {
  const location = useLocation();
  const { t } = useTranslation(); // Translation hook for i18n
  const {
    user,
    loading: authLoading,
    userProfile,
    subscriptionStatus,
    loadingSubscription
  } = useAuth();
  const {
    actualTheme
  } = useTheme();

  // Choose the appropriate ChatGPT logo based on theme
  const chatgptLogoSrc = actualTheme === 'dark' ? chatgptLogo : chatgptLogoLight;

  // Helper function to get model icon
  const getModelIcon = (iconType: string) => {
    switch (iconType) {
      case 'openai':
        return chatgptLogoSrc;
      case 'claude':
        return claudeLogo;
      case 'gemini':
        return geminiLogo;
      case 'deepseek':
        return deepseekLogo;
      case 'grok':
        return grokLogo;
      default:
        return chatgptLogoSrc;
    }
  };

  // Helper function to get icon filter style for light mode
  const getIconFilterStyle = (iconType: string) => {
    if (actualTheme !== 'light') return {};
    
    switch (iconType) {
      case 'deepseek':
        return { filter: 'brightness(0) saturate(100%) invert(38%) sepia(98%) saturate(2618%) hue-rotate(221deg) brightness(98%) contrast(101%)' };
      case 'grok':
        return { filter: 'brightness(0)' };
      default:
        return {};
    }
  };
  const {
    canSendMessage,
    isAtLimit,
    sessionId,
    incrementMessageCount,
    messageCount,
    limit: messageLimit
  } = useMessageLimit();

  // Helper function to get time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return t('chat.goodMorning');
    } else if (hour >= 12 && hour < 17) {
      return t('chat.goodAfternoon');
    } else if (hour >= 17 && hour < 22) {
      return t('chat.goodEvening');
    } else {
      return t('chat.goodNight');
    }
  };
  const getDisplayName = () => {
    if (userProfile?.display_name) {
      return userProfile.display_name;
    }
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return t('chat.there');
  };
  const timeGreeting = getTimeBasedGreeting();
  const displayName = getDisplayName();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActiveSubscriptionDialog, setShowActiveSubscriptionDialog] = useState(false);
  const [selectedUltraModel, setSelectedUltraModel] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState(() => {
    // Use model from navigation state if available, otherwise default to gpt-4o-mini
    return location.state?.selectedModel || 'gpt-4o-mini';
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const [modelsScrollPosition, setModelsScrollPosition] = useState(0);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<string | null>(null);
  const [showMoreButtons, setShowMoreButtons] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(100).fill(0));
  const [tempTranscript, setTempTranscript] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modelsContainerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const tempTranscriptRef = useRef<string>('');
  const {
    isMobile
  } = useSidebar();
  useEffect(() => {
    if (user && !pendingMessage) {
      const storedMessage = localStorage.getItem('pendingChatMessage');
      const storedModel = localStorage.getItem('pendingChatModel');
      if (storedMessage) {
        localStorage.removeItem('pendingChatMessage');
        localStorage.removeItem('pendingChatModel');
        
        // Create chat with the message
        // The flag will be cleared when navigation happens in createChatWithMessage
        createChatWithMessage(user.id, storedMessage, storedModel || 'gpt-4o-mini');
      }
    }
  }, [user]);

  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Prevent default browser drag and drop behavior globally
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    document.addEventListener('dragover', preventDefaults);
    document.addEventListener('drop', preventDefaults);
    
    return () => {
      document.removeEventListener('dragover', preventDefaults);
      document.removeEventListener('drop', preventDefaults);
    };
  }, []);
  if (authLoading) {
    return <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
          <span className="text-gray-600">{t('chat.loading')}</span>
        </div>
      </div>;
  }
  const handleFileUpload = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (selectedModel === 'generate-image') {
      toast.error("Cannot upload files in Generate Image mode", {
        description: "Image generation mode doesn't support file attachments"
      });
      return;
    }
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setShowPricingModal(true);
      return;
    }
    fileInputRef.current?.click();
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setShowPricingModal(true);
      return;
    }
    const files = Array.from(e.dataTransfer.files);
    
    // Validate file types - only allow specific document types and images (no videos)
    const allowedExtensions = ['.json', '.pdf', '.csv', '.txt', '.html', '.xml'];
    const invalidFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
      
      // Reject videos explicitly
      if (isVideo) return true;
      
      // Accept images and allowed document types
      return !isImage && !hasAllowedExtension;
    });
    
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ');
      toast.error('Invalid file type', {
        description: `Only JSON, PDF, CSV, TXT, HTML, XML and image files are allowed. Rejected: ${fileNames}`
      });
      return;
    }
    
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };
  const handleSearchWeb = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;

    // Hide suggestions and show available models when text is cleared
    if (e.target.value.trim() === '') {
      setShowSuggestions(null);
      setShowMoreButtons(false);
    }
  };
  const startRecording = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (selectedModel === 'generate-image') {
      toast.error("Voice input not available in Generate Image mode", {
        description: "Please use text to describe the image you want to generate"
      });
      return;
    }
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setShowPricingModal(true);
      return;
    }
    
    try {
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      // Set up audio context and analyzer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      // Start speech recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          tempTranscriptRef.current = transcript;
          setTempTranscript(transcript);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error === 'no-speech' || event.error === 'audio-capture') {
            return;
          }
        };
        
        recognition.onend = () => {
          if (recognitionRef.current) {
            setIsRecording(false);
          }
        };
        
        recognitionRef.current = recognition;
        recognition.start();
      }
      
      setIsRecording(true);
      
      // Animate waveform based on audio levels
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Map audio data to 100 bars
        const bars = 100;
        const step = Math.floor(bufferLength / bars);
        const newLevels = [];
        
        for (let i = 0; i < bars; i++) {
          const index = i * step;
          const value = dataArray[index] || 0;
          // Normalize to 0-1 range and apply smoothing
          newLevels.push(value / 255);
        }
        
        setAudioLevels(newLevels);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      
      updateWaveform();
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Unable to access microphone');
    }
  };
  
  const stopRecording = () => {
    // Stop speech recognition
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevels(Array(100).fill(0));
    
    // Now set the message from temporary transcript ref (not state to avoid stale closure)
    setMessage(tempTranscriptRef.current);
    setTempTranscript('');
    tempTranscriptRef.current = '';
    
    // Focus textarea and resize it to fit the content
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Trigger resize to show all text
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 150);
  };
  
  const cancelRecording = () => {
    // Stop speech recognition
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    
    // Stop audio analysis
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Clean up audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    analyserRef.current = null;
    setIsRecording(false);
    setAudioLevels(Array(100).fill(0));
    
    // Discard the transcript without saving
    setTempTranscript('');
    tempTranscriptRef.current = '';
  };
  const handleStartChat = async () => {
    console.log('[INDEX] ✅ handleStartChat CALLED', {
      hasMessage: !!message.trim(),
      messageLength: message.trim().length,
      hasFiles: selectedFiles.length > 0,
      filesCount: selectedFiles.length,
      loading,
      user: !!user,
      canSendMessage
    });
    
    // Allow sending if there's a message OR files
    if ((!message.trim() && selectedFiles.length === 0) || loading) {
      console.log('[INDEX] Validation failed:', {
        hasMessage: !!message.trim(),
        hasFiles: selectedFiles.length > 0,
        loading
      });
      return;
    }
    if (!user) {
      console.log('[INDEX] No user - showing auth modal');
      setPendingMessage(message);
      localStorage.setItem('pendingChatMessage', message);
      localStorage.setItem('pendingChatModel', selectedModel);
      setShowAuthModal(true);
      return;
    }
    if (!canSendMessage) {
      console.log('[INDEX] ❌ Free user at limit - showing warning');
      setShowLimitWarning(true);
      return;
    }
    
    // Check if user is trying to use a model they don't have access to
    const selectedModelData = models.find(m => m.id === selectedModel);
    
    if (!subscriptionStatus.subscribed && selectedModel !== 'gpt-4o-mini') {
      // Free users can only use gpt-4o-mini
      if (selectedModelData?.type === 'pro' || selectedModelData?.type === 'ultra') {
        toast.error("This model requires a subscription", {
          description: `${selectedModelData?.name} is available with Pro or Ultra Pro plans`,
          action: {
            label: "Upgrade",
            onClick: () => navigate('/pricing')
          }
        });
        return;
      }
    } else if (subscriptionStatus.subscribed && selectedModelData?.type === 'ultra') {
      // Check if Pro users are trying to use Ultra models
      const isPro = subscriptionStatus.plan === 'Pro';
      if (isPro) {
        setSelectedUltraModel(selectedModelData?.name || '');
        setShowActiveSubscriptionDialog(true);
        return;
      }
    }
    
    console.log('[INDEX] All validations passed, creating chat...');
    setLoading(true);
    try {
      const titleText = message.slice(0, 50) || (selectedFiles.length > 0 ? `File: ${selectedFiles[0].name}` : 'New Chat');
      
      console.log('[INDEX] Creating new chat:', {
        hasMessage: !!message,
        messageLength: message.length,
        filesCount: selectedFiles.length,
        title: titleText
      });
      
      // Create new chat
      const {
        data: chatData,
        error: chatError
      } = await supabase.from('chats').insert([{
        user_id: user.id,
        title: message.slice(0, 50) || (selectedFiles.length > 0 ? `File: ${selectedFiles[0].name}` : 'New Chat'),
        model_id: selectedModel
      }]).select().single();
      if (chatError) throw chatError;

      console.log('[INDEX] Chat created:', chatData.id);
      
      // Track chat start event with deduplication
      console.log('[INDEX] 🎯 About to call trackChatStart...');
      trackChatStart(chatData.id);
      console.log('[INDEX] 🎯 trackChatStart called');

      // Store the message and files for Chat page to process
      const messageText = message;
      const filesToSend = [...selectedFiles];
      
      // Clear message and files
      setMessage('');
      setSelectedFiles([]);
      
      console.log('[INDEX] Navigating to chat with state:', {
        chatId: chatData.id,
        hasMessage: !!messageText,
        filesCount: filesToSend.length
      });
      
      // Navigate to chat page with files and message to send
      // Chat page will handle creating the message and sending to webhook
      navigate(`/chat/${chatData.id}`, {
        replace: true,
        state: {
          selectedModel: selectedModel,
          initialFiles: filesToSend,
          initialMessage: messageText
        }
      });
    } catch (error) {
      console.error('[INDEX] Failed to create chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const createChatWithMessage = async (userId: string, messageToSend: string, modelToUse?: string) => {
    if (!canSendMessage) {
      console.log('[INDEX] Cannot send - at message limit');
      navigate('/pricing-plans');
      return;
    }
    setLoading(true);
    try {
      const {
        data: chatData,
        error: chatError
      } = await supabase.from('chats').insert([{
        user_id: userId,
        title: messageToSend.slice(0, 50) || 'New Chat',
        model_id: modelToUse || selectedModel
      }]).select().single();
      if (chatError) throw chatError;
      
      // Track chat start event with deduplication
      trackChatStart(chatData.id);
      
      const {
        data: insertedMessage,
        error: messageError
      } = await supabase.from('messages').insert({
        chat_id: chatData.id,
        content: messageToSend,
        role: 'user'
      }).select().single();
      
      if (messageError) throw messageError;
      
      // Track message for free users
      console.log('[INDEX] Message saved, tracking for free user...');
      
      // If anonymous user, save to anonymous_messages table
      if (!user && sessionId) {
        console.log('[INDEX] Saving anonymous message to tracking table');
        try {
          await supabase
            .from('anonymous_messages')
            .insert({
              session_id: sessionId,
              content: messageToSend,
              role: 'user',
              file_attachments: []
            });
          console.log('[INDEX] Anonymous message tracked successfully');
        } catch (anonError) {
          console.error('[INDEX] Error tracking anonymous message:', anonError);
        }
      }
      
      // Increment message count
      incrementMessageCount();
      console.log('[INDEX] Message count incremented');
      
      navigate(`/chat/${chatData.id}`, {
        state: {
          selectedModel: modelToUse || selectedModel
        }
      });
    } catch (error) {
      console.error('[INDEX] Error creating chat:', error);
      toast.error('Failed to start chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleSuggestionClick = (action: string) => {
    if (action === 'see-more') {
      setShowMoreButtons(true);
      return;
    }

    // Show specific suggestions for the clicked button
    setShowSuggestions(action);
    textareaRef.current?.focus();
  };
  const handlePromptClick = (promptKey: string) => {
    // Translate the prompt key to get the actual prompt text
    const promptText = t(promptKey);
    setMessage(promptText);
    setShowSuggestions(null);
    setShowMoreButtons(false);
    textareaRef.current?.focus();
  };
  const handleModelSelect = (modelId: string) => {
    const selectedModelInfo = models.find(m => m.id === modelId);
    
    // If not authenticated, show auth modal for any premium model
    if (!user && (selectedModelInfo?.type === 'pro' || selectedModelInfo?.type === 'ultra')) {
      setShowAuthModal(true);
      return;
    }
    
    // If not subscribed, show pricing modal for any premium model
    if (!loadingSubscription && !subscriptionStatus.subscribed && (selectedModelInfo?.type === 'pro' || selectedModelInfo?.type === 'ultra')) {
      setShowPricingModal(true);
      return;
    }
    
    // If Pro user tries to select Ultra model, show active subscription dialog
    if (subscriptionStatus.subscribed && selectedModelInfo?.type === 'ultra') {
      const hasUltra = subscriptionStatus.plan === 'ultra_pro';
      
      if (!hasUltra) {
        // User has Pro subscription, trying to use Ultra model
        setSelectedUltraModel(selectedModelInfo?.name || '');
        setShowActiveSubscriptionDialog(true);
        return;
      }
    }
    
    setSelectedModel(modelId);
  };
  const scrollModels = (direction: 'left' | 'right') => {
    if (modelsContainerRef.current) {
      const scrollAmount = 300;
      const currentScroll = modelsContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' ? currentScroll - scrollAmount : currentScroll + scrollAmount;
      modelsContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };
  const selectedModelData = models.find(m => m.id === selectedModel);
  
  // Show all models regardless of authentication/subscription
  // We'll handle access control on click
  const availableModelsList = models;
  const imageStyles = [{
    name: 'Cyberpunk',
    prompt: 'Create an image in a cyberpunk aesthetic: vivid neon accents, futuristic textures, glowing details, and high-contrast lighting.'
  }, {
    name: 'Anime',
    prompt: 'Create an image in an anime art style: clean lines, vibrant colors, expressive characters, and detailed backgrounds with a Japanese animation aesthetic.'
  }, {
    name: 'Minimalist',
    prompt: 'Create an image in a minimalist style: clean, simple composition with plenty of white space, limited color palette, and focus on essential elements only.'
  }, {
    name: 'Watercolor',
    prompt: 'Create an image in a watercolor painting style: soft, flowing colors that blend naturally, visible brush strokes, and delicate, artistic textures.'
  }, {
    name: 'Vintage',
    prompt: 'Create an image with a vintage aesthetic: sepia tones, aged textures, classic composition, and nostalgic mood reminiscent of old photographs.'
  }, {
    name: 'Photorealistic',
    prompt: 'Create a photorealistic image: highly detailed, accurate lighting, realistic textures, and lifelike appearance as if captured by a professional camera.'
  }, {
    name: 'Abstract',
    prompt: 'Create an abstract image: non-representational forms, bold colors, geometric or fluid shapes, and expressive artistic interpretation.'
  }, {
    name: 'Coloring Book',
    prompt: 'Create an image in a coloring book style: black line art on white background, clear outlines, simple shapes perfect for coloring.'
  }, {
    name: 'Synthwave',
    prompt: 'Create an image in a synthwave aesthetic: retro-futuristic 1980s vibe with neon grids, glowing sunset, vibrant magenta-and-cyan gradients, chrome highlights, and a nostalgic outrun atmosphere.'
  }];
  const handleStyleSelect = (style: typeof imageStyles[0]) => {
    setMessage(style.prompt);
    setIsStylesOpen(false);
    // Keep isImageMode true so user can edit and send the prompt
    setSelectedStyle(style.name);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Resize textarea to show full prompt
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 0);
  };
  const handleCreateImageClick = () => {
    // Check if user has Pro or Ultra Pro subscription
    if (!subscriptionStatus.subscribed) {
      setShowPricingModal(true);
      return;
    }
    
    // Change model to generate-image
    setSelectedModel('generate-image');
    setIsImageMode(true);
    setSelectedStyle(null); // Reset selected style to show the 2 buttons
    setMessage('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const handleExitImageMode = () => {
    setIsImageMode(false);
    setSelectedStyle(null);
    setMessage('');
  };
  const getStyleBackground = (styleName: string) => {
    switch (styleName) {
      case 'Cyberpunk':
        return 'bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/20';
      case 'Anime':
        return 'bg-gradient-to-br from-pink-400/30 to-orange-400/40 border border-pink-300/20';
      case 'Minimalist':
        return 'bg-gradient-to-br from-gray-100/50 to-gray-200/50 border border-gray-300/20';
      case 'Watercolor':
        return 'bg-gradient-to-br from-blue-300/30 to-green-300/40 border border-blue-200/20';
      case 'Vintage':
        return 'bg-gradient-to-br from-amber-400/30 to-orange-400/40 border border-amber-300/20';
      case 'Photorealistic':
        return 'bg-gradient-to-br from-slate-400/30 to-slate-600/40 border border-slate-300/20';
      case 'Abstract':
        return 'bg-gradient-to-br from-purple-400/30 to-red-400/40 border border-purple-300/20';
      case 'Coloring Book':
        return 'bg-gradient-to-br from-white to-gray-50 border border-gray-200';
      case 'Synthwave':
        return 'bg-gradient-to-br from-purple-500/30 to-pink-500/40 border border-purple-400/20';
      default:
        return 'bg-muted border border-border';
    }
  };
  return <div className="flex-1 flex flex-col min-h-screen">
      {/* Mobile Header with Sidebar Trigger */}
      {isMobile && <div className="fixed top-0 left-0 right-0 flex items-center justify-between p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <SidebarTrigger className="h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary" aria-label="Open sidebar menu" />
          
          {/* Mobile Model Selector triggered by ChatLearn - Absolutely centered */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <Select value={selectedModel} onValueChange={handleModelSelect} onOpenChange={setIsModelDropdownOpen}>
              <SelectTrigger className="bg-transparent border-0 hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-primary rounded-lg transition-all duration-200 h-auto p-2 [&>svg]:hidden touch-manipulation" aria-label="Select AI model">
                <div className="flex items-center justify-center gap-1 whitespace-nowrap">
                  <span className="text-lg font-semibold">{selectedModelData?.shortLabel || 'ChatLearn'}</span>
                  {isModelDropdownOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </SelectTrigger>
              <SelectContent className="z-[200] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[300px]" align="center" sideOffset={8}>
                {availableModelsList.map(model => {
              const modelData = availableModels.find(m => m.id === model.id);
              // Check if user has Ultra subscription
              const hasUltra = subscriptionStatus.plan === 'ultra_pro';
              
              // Check if model is locked (but don't disable - let click handlers show upgrade prompt)
              const isPro = model.type === 'pro';
              const isUltra = model.type === 'ultra';
              const isLocked = (isPro && !subscriptionStatus.subscribed) || (isUltra && !hasUltra);
              
              return <SelectItem 
                key={model.id} 
                value={model.id}
                className={`rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 cursor-pointer transition-all duration-200`}
              >
                      <div className="flex items-center w-full gap-3">
                        <div className="relative flex-shrink-0">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5">
                            <img 
                              src={getModelIcon(modelData?.icon || 'openai')} 
                              alt={`${model.name} icon`} 
                              className="w-5 h-5 object-contain"
                              style={getIconFilterStyle(modelData?.icon || 'openai')}
                            />
                          </div>
                          {model.type === 'pro' && (!user || !subscriptionStatus.subscribed) && (
                            <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-0.5 rounded-full font-bold shadow-md">
                              PRO
                            </span>
                          )}
                          {model.type === 'ultra' && !hasUltra && (
                            <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-gradient-to-r from-purple-600 to-pink-600 text-white px-1 py-0.5 rounded-full font-bold shadow-md">
                              ULTRA
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-foreground truncate">{model.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5 truncate">{model.description}</div>
                        </div>
                      </div>
                    </SelectItem>;
            })}
              </SelectContent>
            </Select>
          </div>
          
          {/* Right side buttons */}
          <div className="ml-auto flex items-center gap-2">
            {/* Login button for unauthenticated users on mobile */}
            {!user && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="text-sm h-8 px-3"
              >
                {t('chat.logIn')}
              </Button>
            )}
            
            {/* Go Pro button for authenticated users on mobile */}
            {user && (
              <GoProButton />
            )}
          </div>
        </div>}
      
      <div className={`flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-4xl mx-auto w-full transition-all duration-200 ${isMobile ? 'pt-[72px]' : ''} relative`} onDragOver={e => {
      e.preventDefault();
      e.stopPropagation();
      if (selectedModel === 'generate-image') {
        return;
      }
      if (!user || !subscriptionStatus.subscribed) {
        return;
      }
      setIsDragOver(true);
    }} onDragEnter={e => {
      e.preventDefault();
      e.stopPropagation();
      if (selectedModel === 'generate-image') {
        return;
      }
      if (!user || !subscriptionStatus.subscribed) {
        return;
      }
      setIsDragOver(true);
    }} onDragLeave={e => {
      e.preventDefault();
      e.stopPropagation();
      // Only hide overlay if leaving the entire page area
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    }} onDrop={e => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (!user) {
        setShowAuthModal(true);
        return;
      }
      if (selectedModel === 'generate-image') {
        toast.error("Cannot upload files in Generate Image mode", {
          description: "Image generation mode doesn't support file attachments"
        });
        return;
      }
      if (!loadingSubscription && !subscriptionStatus.subscribed) {
        setShowPricingModal(true);
        return;
      }
      const files = Array.from(e.dataTransfer.files);
      
      // Validate file types - only allow specific document types and images (no videos)
      const allowedExtensions = ['.json', '.pdf', '.csv', '.txt', '.html', '.xml'];
      const invalidFiles = files.filter(file => {
        const fileName = file.name.toLowerCase();
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        // Reject videos explicitly
        if (isVideo) return true;
        
        // Accept images and allowed document types
        return !isImage && !hasAllowedExtension;
      });
      
      if (invalidFiles.length > 0) {
        const fileNames = invalidFiles.map(f => f.name).join(', ');
        toast.error('Invalid file type', {
          description: `Only JSON, PDF, CSV, TXT, HTML, XML and image files are allowed. Rejected: ${fileNames}`
        });
        return;
      }
      
      if (files.length > 0) {
        setSelectedFiles(prev => [...prev, ...files]);
      }
    }}>

        {/* Auth buttons for unauthenticated users (tablet and desktop) */}
        {!user && (
          <div className="hidden sm:flex fixed top-2 right-6 items-center gap-3 z-50">
            <Button 
              variant="ghost" 
              onClick={() => setShowAuthModal(true)}
              className="font-medium"
            >
              {t('chat.logIn')}
            </Button>
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="font-medium bg-black text-white hover:bg-black/90"
            >
              {t('chat.signUp')}
            </Button>
          </div>
        )}

        {/* Go Pro button for authenticated users (tablet and desktop) */}
        {user && (
          <div className="hidden sm:flex fixed top-2 right-6 z-50">
            <GoProButton />
          </div>
        )}

        {/* Google One Tap for unauthenticated users */}
        <GoogleOneTab />
      
      <div className="text-center mb-6 sm:mb-8">
        {user ? <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{timeGreeting}, {displayName}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">{t('chat.helpYouToday')}</p>
          </> : <>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">{timeGreeting}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">{t('chat.helpYouToday')}</p>
          </>}
      </div>

      {/* Message Limit Warning */}
      {!subscriptionStatus.subscribed && (
        <MessageLimitWarning 
          messageCount={messageCount} 
          limit={messageLimit}
          show={showLimitWarning}
          onHide={() => setShowLimitWarning(false)}
        />
      )}

      <div className="w-full max-w-3xl mb-4 sm:mb-6">
        {/* File attachments preview */}
        {selectedFiles.length > 0 && <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => <div key={index} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2 text-sm">
                {getFileIcon(file.type)}
                <span className="truncate max-w-32">{file.name}</span>
                <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>)}
          </div>}
        
        <div className={`relative bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4 transition-all duration-200 ${isDragOver ? 'border-primary border-2 border-dashed bg-primary/5' : ''}`}>
          {/* Drag and drop overlay */}
          {isDragOver && <div className="absolute inset-0 bg-primary/10 flex items-center justify-center z-50 rounded-xl border-2 border-dashed border-primary">
              <div className="text-center">
                <Paperclip className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-base font-semibold text-primary">{t('chat.dropFilesHere')}</p>
              </div>
            </div>}
          
          <Textarea ref={textareaRef} value={message} onChange={handleInputChange} onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleStartChat();
            }
            }} onFocus={e => {
              // Prevent default scroll behavior on mobile
              if (window.innerWidth < 768) {
                e.target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center'
                });
              }
            }} placeholder={isImageMode ? t('chat.describeImage') : t('chat.askAnything')} className="w-full min-h-[24px] max-h-[120px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3 text-sm sm:text-base" rows={1} aria-label={isImageMode ? t('chat.describeImage') : t('chat.askAnything')} />
          
          {/* Recording UI - replaces buttons when recording */}
          {isRecording ? (
              <div className="flex items-center gap-0.5 sm:gap-2 py-1 sm:py-3 px-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 sm:h-8 sm:w-8 rounded-full text-foreground hover:text-foreground hover:bg-accent flex-shrink-0 p-0"
                onClick={cancelRecording}
                aria-label="Cancel recording"
              >
                <X className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
              </Button>
              
              <div className="flex-1 flex items-center justify-center gap-0.5 sm:gap-3 min-w-0 overflow-hidden">
                {/* Real-time audio waveform visualization - mobile optimized */}
                <div className="flex items-center justify-center gap-[0.5px] sm:gap-[2px] h-4 sm:h-8 flex-1 max-w-[320px] sm:max-w-[600px] min-w-0">
                  {audioLevels.map((level, i) => {
                    // Calculate height based on audio level
                    const minHeight = 2;
                    const maxHeight = isMobile ? 16 : 32;
                    const height = minHeight + (level * (maxHeight - minHeight));
                    
                    return (
                      <div
                        key={i}
                        className="w-[0.5px] sm:w-[2px] bg-foreground rounded-full transition-all duration-75 ease-out"
                        style={{
                          height: `${height}px`,
                        }}
                      />
                    );
                  })}
                </div>
                
                {/* Timer */}
                <span className="text-[9px] sm:text-sm font-medium tabular-nums text-foreground flex-shrink-0">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
              
              <Button
                size="sm"
                className="h-5 w-5 sm:h-8 sm:w-8 rounded-full bg-foreground text-background hover:bg-foreground/90 flex-shrink-0 p-0"
                onClick={stopRecording}
                aria-label="Send recording"
              >
                <svg className="h-2.5 w-2.5 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            </div>
          ) : (
            // Mobile-first redesigned input controls

            <div className="flex flex-col gap-3">
            {/* File upload controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 md:gap-2">
                {!isMobile && <>
                    <Button variant="ghost" size="sm" className="h-8 w-8 md:h-9 md:w-9 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" onClick={handleFileUpload} aria-label="Upload file">
                      <Paperclip className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Button>
                    
                    {isImageMode && !selectedStyle ? <div className="flex items-center gap-2">
                        {/* Image mode indicator */}
                       <div className="group flex items-center gap-1 bg-muted px-3 py-2 rounded-full text-xs">
                           <ImageIcon className="h-3 w-3" />
                           <span>{t('chat.image')}</span>
                          <button onClick={handleExitImageMode} className="opacity-70 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Exit image mode">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        
                        {/* Styles dropdown */}
                        <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                           <PopoverTrigger asChild>
                             <Button variant="ghost" size="sm" className="h-9 px-3 text-xs gap-1 bg-muted hover:bg-muted/80 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Select image style" aria-expanded={isStylesOpen} aria-haspopup="true">
                               <Palette className="h-3 w-3" />
                               <span>{t('chat.styles')}</span>
                              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-72 sm:w-80 p-3 sm:p-4 bg-background border shadow-lg z-50" align="start">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                              {imageStyles.map(style => <button key={style.name} onClick={() => handleStyleSelect(style)} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-muted" aria-label={`Select ${style.name} style`}>
                                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${getStyleBackground(style.name)}`}>
                                    <span className={`text-xs font-medium ${style.name === 'Coloring Book' ? 'text-black' : 'text-foreground'}`}>
                                      {style.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                    </span>
                                  </div>
                                  <span className="text-xs font-medium leading-tight">{style.name}</span>
                                </button>)}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div> : <Button variant="ghost" size="sm" className="h-8 md:h-9 px-2 md:px-3 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary text-xs" onClick={handleCreateImageClick} aria-label="Create an image">
                        <ImageIcon className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                        <span className="hidden md:inline">Generate an image</span>
                        <span className="md:hidden">Generate an image</span>
                      </Button>}
                  </>}
              </div>

              {/* Desktop model selector and voice controls */}
              {!isMobile && <div className="flex items-center gap-1.5 md:gap-2">
                  <Select value={selectedModel} onValueChange={handleModelSelect}>
                    <SelectTrigger className="w-[140px] md:w-[160px] lg:w-[200px] h-9 md:h-10 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl focus-visible:ring-2 focus-visible:ring-primary text-xs md:text-sm shadow-sm hover:bg-accent/50 transition-all duration-200" aria-label="Select AI model">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                            <img 
                              src={getModelIcon(availableModels.find(m => m.id === selectedModel)?.icon || 'openai')} 
                              alt={`${selectedModelData?.name} icon`} 
                              className="w-4 h-4 object-contain"
                              style={getIconFilterStyle(availableModels.find(m => m.id === selectedModel)?.icon || 'openai')}
                            />
                          </div>
                          <span className="font-medium truncate">{selectedModelData?.shortLabel}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[100] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[320px]">
                      {availableModelsList.map(model => {
                      const modelData = availableModels.find(m => m.id === model.id);
                      // Check if user has Ultra subscription
                      const hasUltra = subscriptionStatus.plan === 'ultra_pro';
                      
                      return <SelectItem 
                        key={model.id} 
                        value={model.id}
                        className="rounded-xl px-3 py-3 hover:bg-accent/60 focus-visible:bg-accent/60 cursor-pointer transition-all duration-200"
                      >
                            <div className="flex items-center w-full gap-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5">
                                  <img 
                                    src={getModelIcon(modelData?.icon || 'openai')} 
                                    alt={`${model.name} icon`} 
                                    className="w-5 h-5 object-contain"
                                    style={getIconFilterStyle(modelData?.icon || 'openai')}
                                  />
                                </div>
                                {model.type === 'pro' && (!user || !subscriptionStatus.subscribed) && (
                                  <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-0.5 rounded-full font-bold shadow-md">
                                    PRO
                                  </span>
                                )}
                                {model.type === 'ultra' && !hasUltra && (
                                  <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-gradient-to-r from-purple-600 to-pink-600 text-white px-1 py-0.5 rounded-full font-bold shadow-md">
                                    ULTRA
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm">{model.name}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{model.description}</div>
                              </div>
                            </div>
                          </SelectItem>;
                    })}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    size="sm" 
                    className={`h-8 w-8 md:h-9 md:w-9 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-offset-2 flex-shrink-0 ${
                      message.trim().length > 0 || selectedFiles.length > 0
                        ? 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                        : isRecording 
                          ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 text-background' 
                          : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                    }`}
                    onClick={message.trim().length > 0 || selectedFiles.length > 0 ? handleStartChat : (isRecording ? stopRecording : startRecording)} 
                    aria-label={message.trim().length > 0 || selectedFiles.length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")} 
                    aria-pressed={isRecording}
                  >
                    {message.trim().length > 0 || selectedFiles.length > 0 ? (
                      <SendHorizontalIcon className="h-4 w-4" />
                    ) : (
                      isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />
                    )}
                  </Button>
                  
                </div>}
            </div>


            {/* Mobile controls - upload, dictation and voice mode buttons */}
            {isMobile && <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full border border-border/30 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" aria-label="Upload or create content">
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 bg-background border shadow-lg z-50" align="start">
                      <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleFileUpload}>
                        <Paperclip className="h-4 w-4" />
                         {t('chat.addPhotosFiles')}
                       </Button>
                       <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleCreateImageClick}>
                         <ImageIcon className="h-4 w-4" />
                         {t('chat.generateImage')}
                      </Button>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Image mode controls inline */}
                  {!isRecording && isImageMode && (
                    <>
                       <div className="group flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs">
                         <ImageIcon className="h-3 w-3" />
                         <span>{t('chat.image')}</span>
                        <button onClick={handleExitImageMode} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      
                      <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                         <PopoverTrigger asChild>
                           <Button variant="ghost" size="sm" className="h-6 px-2 text-xs gap-1 bg-muted hover:bg-muted/80 rounded-full">
                             <Palette className="h-3 w-3" />
                             {t('chat.styles')}
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-4 bg-background border shadow-lg z-50" align="start">
                          <div className="grid grid-cols-3 gap-3">
                            {imageStyles.map(style => <button key={style.name} onClick={() => handleStyleSelect(style)} className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getStyleBackground(style.name)}`}>
                                  <span className={`text-xs font-medium ${style.name === 'Coloring Book' ? 'text-black' : 'text-foreground'}`}>
                                    {style.name.split(' ').map(word => word[0]).join('').slice(0, 2)}
                                  </span>
                                </div>
                                <span className="text-xs font-medium leading-tight">{style.name}</span>
                              </button>)}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1">
                  <Button 
                    size="sm" 
                    className={`h-7 w-7 rounded-full focus-visible:ring-2 focus-visible:ring-offset-1 flex-shrink-0 ${
                      message.trim().length > 0 || selectedFiles.length > 0
                        ? 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                        : isRecording 
                          ? 'bg-red-500 hover:bg-red-600 focus-visible:ring-red-300 text-background' 
                          : 'bg-foreground hover:bg-foreground/90 focus-visible:ring-primary text-background'
                    }`} 
                    onClick={message.trim().length > 0 || selectedFiles.length > 0 ? handleStartChat : (isRecording ? stopRecording : startRecording)} 
                    aria-label={message.trim().length > 0 || selectedFiles.length > 0 ? "Send message" : (isRecording ? "Stop recording" : "Start voice recording")} 
                    aria-pressed={isRecording}
                  >
                    {message.trim().length > 0 || selectedFiles.length > 0 ? (
                      <SendHorizontalIcon className="h-3 w-3" />
                    ) : (
                      isRecording ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />
                    )}
                  </Button>
                  
                  
                </div>
              </div>}
          </div>
          )}
        </div>
      </div>

      {/* Suggestion buttons - horizontal scroll on mobile */}
      {!showSuggestions && <div className="w-full max-w-3xl mb-4 sm:mb-6">
          {/* Mobile: Wrapped layout like desktop */}
          <div className="sm:hidden">
            <div className="flex flex-wrap gap-2 justify-center" role="group" aria-label="Quick suggestions">
              {suggestionButtons.map((suggestion, index) => <Button key={index} onClick={() => handleSuggestionClick(suggestion.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${t(suggestion.labelKey)} suggestion`}>
                  <suggestion.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{t(suggestion.labelKey)}</span>
                </Button>)}
              
              {/* Additional buttons - mobile */}
              {additionalButtons.map((button, index) => <Button key={`mobile-${index}`} onClick={() => handleSuggestionClick(button.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${t(button.labelKey)} suggestion`}>
                    <button.icon className="h-3.5 w-3.5 mr-1.5" />
                    <span className="text-sm font-medium">{t(button.labelKey)}</span>
                  </Button>)}
            </div>
          </div>

          {/* Desktop: Wrapped layout */}
          <div className="hidden sm:block">
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestionButtons.map((suggestion, index) => <Button key={index} onClick={() => handleSuggestionClick(suggestion.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${t(suggestion.labelKey)} suggestion`}>
                  <suggestion.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{t(suggestion.labelKey)}</span>
                </Button>)}
              
              {/* Additional buttons - desktop */}
              {additionalButtons.map((button, index) => <Button key={index} onClick={() => handleSuggestionClick(button.action)} variant="ghost" size="sm" className="h-9 px-4 rounded-full border border-border/30 hover:border-border/60 hover:bg-accent/50 transition-all focus-visible:ring-2 focus-visible:ring-primary" aria-label={`${t(button.labelKey)} suggestion`}>
                  <button.icon className="h-3.5 w-3.5 mr-1.5" />
                  <span className="text-sm font-medium">{t(button.labelKey)}</span>
                </Button>)}
            </div>
          </div>
        </div>}

      {/* Suggestion prompts */}
      {showSuggestions && suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts] && <div className="w-full max-w-3xl mb-4 sm:mb-6">
          <div className="space-y-4" role="list" aria-label={t('chat.suggestedPrompts')}>
            {suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts].map((promptKey, index) => <div key={index} role="listitem">
                <button onClick={() => handlePromptClick(promptKey)} className="w-full text-left p-3 rounded-lg hover:bg-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-accent/50 min-h-[44px] flex items-center" aria-label={t('chat.usePrompt')}>
                  <span className="text-sm sm:text-base text-muted-foreground hover:text-foreground transition-colors">{t(promptKey)}</span>
                </button>
                {index < suggestionPrompts[showSuggestions as keyof typeof suggestionPrompts].length - 1 && <hr className="mt-4 border-border/50" />}
              </div>)}
          </div>
        </div>}

      {/* Available Models Section - only show when no suggestions are active */}
      {!showSuggestions}

      

      

      <input ref={fileInputRef} type="file" multiple className="sr-only" accept="image/*,.json,.pdf,.csv,.txt,.html,.xml" aria-label="File upload input" onChange={e => {
        const files = Array.from(e.target.files || []);
        
        // Validate file types - only allow specific document types and images (no videos)
        const allowedExtensions = ['.json', '.pdf', '.csv', '.txt', '.html', '.xml'];
        const invalidFiles = files.filter(file => {
          const fileName = file.name.toLowerCase();
          const isImage = file.type.startsWith('image/');
          const isVideo = file.type.startsWith('video/');
          const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
          
          // Reject videos explicitly
          if (isVideo) return true;
          
          // Accept images and allowed document types
          return !isImage && !hasAllowedExtension;
        });
        
        if (invalidFiles.length > 0) {
          const fileNames = invalidFiles.map(f => f.name).join(', ');
          toast.error('Invalid file type', {
            description: `Only JSON, PDF, CSV, TXT, HTML, XML and image files are allowed. Rejected: ${fileNames}`
          });
          e.target.value = '';
          return;
        }
        
        // Helper functions for file validation
        const getMaxFileSize = (type: string) => {
          if (type.startsWith('image/')) return 10 * 1024 * 1024; // 10MB for images
          if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 25 * 1024 * 1024; // 25MB for documents
          return 20 * 1024 * 1024; // 20MB for other files
        };
        
        const getFileTypeCategory = (type: string) => {
          if (type.startsWith('image/')) return 'image';
          if (type.includes('pdf') || type.includes('document') || type.includes('text')) return 'document';
          return 'file';
        };
        
        // Validate file sizes
        for (const file of files) {
          const maxSize = getMaxFileSize(file.type);
          if (file.size > maxSize) {
            const maxSizeMB = Math.round(maxSize / (1024 * 1024));
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
            toast.error(`File size limit exceeded`, {
              description: `"${file.name}" (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit for ${getFileTypeCategory(file.type)} files`
            });
            e.target.value = '';
            return; // Stop processing if any file exceeds limit
          }
        }
        
        setSelectedFiles(prev => [...prev, ...files]);
        e.target.value = '';
      }} />
      
      <AuthModal isOpen={showAuthModal} onClose={() => {
        setShowAuthModal(false);
        setPendingMessage('');
        localStorage.removeItem('pendingChatMessage');
      }} onSuccess={async () => {
        setShowAuthModal(false);
        if (pendingMessage.trim()) {
          const messageToSend = pendingMessage;
          setMessage(pendingMessage);
          setPendingMessage('');
          setTimeout(async () => {
            const {
              data: {
                session: currentSession
              }
            } = await supabase.auth.getSession();
            const currentUser = currentSession?.user;
            if (!currentUser) {
              console.error('No user found after auth, retrying...');
              setTimeout(async () => {
                const {
                  data: {
                    session: retrySession
                  }
                } = await supabase.auth.getSession();
                if (retrySession?.user) {
                  await createChatWithMessage(retrySession.user.id, messageToSend);
                } else {
                  console.error('Still no user found after retry');
                }
              }, 500);
              return;
            }
            await createChatWithMessage(currentUser.id, messageToSend);
          }, 300);
        } else {
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 100);
        }
      }} />

      {/* Pricing Modal */}
      <PricingModal 
        open={showPricingModal} 
        onOpenChange={setShowPricingModal} 
      />
      
      {/* Upgrade Blocked Dialog */}
      <UpgradeBlockedDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        currentPlan="Pro"
      />
      
      {/* Active Subscription Dialog */}
      <ActiveSubscriptionDialog
        isOpen={showActiveSubscriptionDialog}
        onClose={() => setShowActiveSubscriptionDialog(false)}
        modelName={selectedUltraModel}
      />
      </div>
    </div>;
}