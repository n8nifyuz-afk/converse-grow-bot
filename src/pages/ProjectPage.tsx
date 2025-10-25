import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useMessageLimit } from '@/hooks/useMessageLimit';
import { supabase } from '@/integrations/supabase/client';
import { trackChatStart } from '@/utils/gtmTracking';
import { Plus, Paperclip, Mic, MicOff, Edit2, Trash2, FolderOpen, Lightbulb, Target, Briefcase, Rocket, Palette, FileText, Code, Zap, Trophy, Heart, Star, Flame, Gem, Sparkles, MoreHorizontal, FileImage, File as FileIcon, X, Image as ImageIcon2, ImageIcon as ImageIcon, Check, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import ProjectEditModal from '@/components/ProjectEditModal';
import AuthModal from '@/components/AuthModal';
import { PricingModal } from '@/components/PricingModal';
import { UpgradeBlockedDialog } from '@/components/UpgradeBlockedDialog';
import { MessageLimitWarning } from '@/components/MessageLimitWarning';

import { toast } from 'sonner';

import chatgptLogo from '@/assets/chatgpt-logo.png';
import chatgptLogoLight from '@/assets/chatgpt-logo-light.png';
import claudeLogo from '@/assets/claude-logo.png';
import geminiLogo from '@/assets/gemini-logo.png';
import deepseekLogo from '@/assets/deepseek-logo.png';
import grokLogo from '@/assets/grok-logo.png';
interface Chat {
  id: string;
  title: string;
  updated_at: string;
  project_id?: string;
  tool_id?: string;
  tool_name?: string;
}
interface Project {
  id: string;
  title: string;
  icon: string;
  color: string;
  description?: string;
}
const iconMap = {
  folder: FolderOpen,
  lightbulb: Lightbulb,
  target: Target,
  briefcase: Briefcase,
  rocket: Rocket,
  palette: Palette,
  filetext: FileText,
  code: Code,
  zap: Zap,
  trophy: Trophy,
  heart: Heart,
  star: Star,
  flame: Flame,
  gem: Gem,
  sparkles: Sparkles
};

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
const imageStyles = [{
  name: 'Cyberpunk',
  prompt: 'Create an image in a cyberpunk aesthetic: vivid neon accents, futuristic textures, glowing details, and high-contrast lighting.'
}, {
  name: 'Anime',
  prompt: 'Create an image in a detailed anime aesthetic: expressive eyes, smooth cel-shaded coloring, and clean linework. Emphasize emotion and character presence, with a sense of motion or atmosphere typical of anime scenes.'
}, {
  name: 'Dramatic Headshot',
  prompt: 'Create an ultra-realistic high-contrast black-and-white headshot, close up, black shadow background, 35mm lens, 4K quality, aspect ratio 4:3.'
}, {
  name: 'Coloring Book',
  prompt: 'Create an image in a children\'s coloring book style: bold, even black outlines on white, no shading or tone. Simplify textures into playful, easily recognizable shapes.'
}, {
  name: 'Photo Shoot',
  prompt: 'Create an ultra-realistic professional photo shoot with soft lighting.'
}, {
  name: 'Retro Cartoon',
  prompt: 'Create a retro 1950s cartoon style image, minimal vector art, Art Deco inspired, clean flat colors, geometric shapes, mid-century modern design, elegant silhouettes, UPA style animation, smooth lines, limited color palette (black, red, beige, brown, white), grainy paper texture background, vintage jazz club atmosphere, subtle lighting, slightly exaggerated character proportions, classy and stylish mood.'
}, {
  name: '80s Glam',
  prompt: 'Create a selfie styled like a cheesy 1980s mall glamour shot, foggy soft lighting, teal and magenta lasers in the background, feathered hair, shoulder pads, portrait studio vibes, ironic \'glam 4 life\' caption.'
}, {
  name: 'Art Nouveau',
  prompt: 'Create an image in an Art Nouveau style: flowing lines, organic shapes, floral motifs, and soft, decorative elegance.'
}, {
  name: 'Synthwave',
  prompt: 'Create an image in a synthwave aesthetic: retro-futuristic 1980s vibe with neon grids, glowing sunset, vibrant magenta-and-cyan gradients, chrome highlights, and a nostalgic outrun atmosphere.'
}];
export default function ProjectPage() {
  const {
    projectId
  } = useParams();
  const navigate = useNavigate();
  const {
    user,
    subscriptionStatus,
    loadingSubscription
  } = useAuth();
  const {
    actualTheme
  } = useTheme();
  const {
    canSendMessage,
    isAtLimit,
    sessionId,
    incrementMessageCount,
    messageCount,
    limit
  } = useMessageLimit();
  
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
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });
  const {
    state: sidebarState,
    isMobile
  } = useSidebar();
  const collapsed = sidebarState === 'collapsed';
  const [project, setProject] = useState<Project | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [audioLevels, setAudioLevels] = useState<number[]>(Array(100).fill(0));
  const [tempTranscript, setTempTranscript] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [hasSelectedModel, setHasSelectedModel] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  
  // Show all models - access control happens on selection
  const availableModelsList = models;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);
  useEffect(() => {
    if (project && user) {
      fetchProjectChats();
    }
  }, [project, user]);
  const fetchProject = async () => {
    if (!projectId || !user) return;
    try {
      const {
        data: projectData,
        error
      } = await supabase.from('projects').select('*').eq('user_id', user.id).eq('id', projectId) // Use project ID instead of name
      .single();
      if (error) {
        console.error('Error fetching project:', error);
        return;
      }
      setProject(projectData);
    } catch (error) {
      console.error('Error in fetchProject:', error);
    }
  };
  const fetchProjectChats = async () => {
    if (!project || !user) return;
    try {
      const {
        data: chatsData,
        error
      } = await supabase.from('chats').select('*').eq('user_id', user.id).eq('project_id', project.id).order('updated_at', {
        ascending: false
      });
      if (error) {
        console.error('Error fetching project chats:', error);
        return;
      }
      setChats(chatsData || []);
    } catch (error) {
      console.error('Error in fetchProjectChats:', error);
    }
  };
  const createNewChat = async () => {
    if (!user || !project) return;
    try {
      const {
        data: newChat,
        error
      } = await supabase.from('chats').insert({
        user_id: user.id,
        title: 'New Chat',
        project_id: project.id
      }).select().single();
      if (error) {
        console.error('Error creating chat:', error);
        console.error('Error creating chat:', error);
        return;
      }
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error in createNewChat:', error);
      console.error('Error in createNewChat:', error);
    }
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
    
    // If Pro user tries to select Ultra model, show upgrade dialog
    if (subscriptionStatus.subscribed && selectedModelInfo?.type === 'ultra') {
      const hasUltra = subscriptionStatus.plan === 'ultra_pro';
      
      if (!hasUltra) {
        // User has Pro subscription, trying to use Ultra model
        setShowUpgradeDialog(true);
        return;
      }
    }
    
    setSelectedModel(modelId);
    setHasSelectedModel(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  const sendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() && selectedFiles.length === 0 || !user || !project || loading) return;
    
    console.log('[PROJECT-MESSAGE-LIMIT] Checking message limit...', {
      canSendMessage,
      isAtLimit,
      hasSubscription: subscriptionStatus.subscribed
    });
    
    // Check limit BEFORE creating chat or saving message
    if (!subscriptionStatus.subscribed && isAtLimit) {
      console.log('[PROJECT-MESSAGE-LIMIT] ❌ User at limit - showing upgrade message');
      // Message limit warning is now displayed inline above the input
      setShowLimitWarning(true);
      return;
    }
    
    setLoading(true);
    const userMessage = input.trim();
    const files = [...selectedFiles];
    setInput('');
    setSelectedFiles([]);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    try {
      // Create new chat
      const {
        data: newChat,
        error
      } = await supabase.from('chats').insert({
        user_id: user.id,
        title: userMessage.length > 50 ? userMessage.substring(0, 50) + '...' : userMessage || 'New Chat',
        project_id: project.id,
        model_id: selectedModel
      }).select().single();
      if (error) throw error;
      
      // Track chat start event with deduplication
      trackChatStart(newChat.id);

      // Upload files for display in chat - use correct bucket based on file type
      const uploadedFiles = [];
      for (const file of files) {
        let finalFileUrl = '';
        let finalFileType = file.type;
        let finalFileName = file.name;
        
        if (file.type.startsWith('image/')) {
          // For images, convert to PNG and upload to chat-images bucket
          try {
            console.log('[PROJECT-IMAGE-UPLOAD] Converting image to PNG format...');
            
            const img = new Image();
            const imgUrl = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imgUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            URL.revokeObjectURL(imgUrl);

            // Convert to PNG base64 then blob
            const pngBase64 = canvas.toDataURL('image/png').split(',')[1];
            const pngBlob = await (await fetch(`data:image/png;base64,${pngBase64}`)).blob();
            
            // Upload to chat-images bucket
            const timestamp = Date.now();
            finalFileName = `${file.name.replace(/\.[^/.]+$/, '')}.png`;
            const filePath = `${user.id}/${newChat.id}/${timestamp}_${finalFileName}`;
            
            console.log('[PROJECT-IMAGE-UPLOAD] Uploading to chat-images:', filePath);
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('chat-images')
              .upload(filePath, pngBlob, {
                contentType: 'image/png',
                upsert: false
              });

            if (uploadError) {
              console.error('[PROJECT-IMAGE-UPLOAD] Upload error:', uploadError);
              throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('chat-images')
              .getPublicUrl(filePath);

            finalFileUrl = urlData.publicUrl;
            finalFileType = 'image/png';
            
            console.log('[PROJECT-IMAGE-UPLOAD] Upload successful, URL:', finalFileUrl);
          } catch (error) {
            console.error('[PROJECT-IMAGE-UPLOAD] Error:', error);
            continue; // Skip this file
          }
        } else {
          // For non-image files, upload to chat-files bucket
          try {
            const filePath = `${user.id}/${newChat.id}/${Date.now()}_${finalFileName}`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('chat-files')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
              });

            if (uploadError) {
              console.error('[PROJECT-FILE-UPLOAD] Upload error:', uploadError);
              throw uploadError;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('chat-files')
              .getPublicUrl(filePath);

            finalFileUrl = urlData.publicUrl;
          } catch (error) {
            console.error('[PROJECT-FILE-UPLOAD] Error:', error);
            continue; // Skip this file
          }
        }
        
        // Only add if we have a valid URL
        if (finalFileUrl) {
          uploadedFiles.push({
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            name: finalFileName,
            size: file.size,
            type: finalFileType,
            url: finalFileUrl
          });
        }
      }

      // Add initial message with files for display
      const { data: insertedMessage, error: insertError } = await supabase.from('messages').insert({
        chat_id: newChat.id,
        content: userMessage,
        role: 'user',
        file_attachments: uploadedFiles
      }).select().single();
      
      if (insertError) throw insertError;
      
      // Increment message count for free users (limit already checked above)
      if (!subscriptionStatus.subscribed) {
        incrementMessageCount();
        console.log('[PROJECT-MESSAGE-LIMIT] Message count incremented');
      }

      // IMMEDIATELY navigate to chat page so user sees their message and image
      console.log('[PROJECT-SEND] Navigating to chat page immediately');
      navigate(`/chat/${newChat.id}`);
      
      // Refresh chats list
      fetchProjectChats();
      
      // Force sidebar update
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('force-chat-refresh'));
      }, 100);

      // NOW send to webhook in background - realtime subscription will catch the AI response
      if (files.length > 0) {
        // Send files to webhook in background
        (async () => {
          try {
            const webhookUrl = 'https://adsgbt.app.n8n.cloud/webhook/adamGPT';

            // Convert first file to base64 for webhook
            const file = files[0];
            
            // Convert to PNG for images, otherwise use original format
            let base64Data = '';
            if (file.type.startsWith('image/')) {
              const img = new Image();
              const imgUrl = URL.createObjectURL(file);
              await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imgUrl;
              });
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx?.drawImage(img, 0, 0);
              URL.revokeObjectURL(imgUrl);
              base64Data = canvas.toDataURL('image/png').split(',')[1];
            } else {
              base64Data = await new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => {
                  const result = reader.result as string;
                  const base64 = result.split(',')[1];
                  resolve(base64);
                };
                reader.readAsDataURL(file);
              });
            }
            
            // Determine correct type based on file type
            const webhookType = file.type.startsWith('image/') ? 'analyse-image' : 'analyse-files';
            
            await fetch(webhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: webhookType,
                message: userMessage,
                chatId: newChat.id,
                userId: user.id,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type.startsWith('image/') ? 'image/png' : file.type,
                fileData: base64Data,
                model: selectedModel
              })
            });
            console.log('[PROJECT-WEBHOOK] File sent to webhook, AI response will arrive via realtime');
          } catch (webhookError) {
            console.error('[PROJECT-WEBHOOK] Error:', webhookError);
          }
        })();
      } else {
        // Send text-only message to OpenAI in background
        (async () => {
          try {
            await supabase.functions.invoke('chat-with-ai-optimized', {
              body: {
                message: userMessage,
                chat_id: newChat.id,
                user_id: user.id,
                model: selectedModel
              }
            });
            console.log('[PROJECT-AI] Text message sent to AI, response will arrive via realtime');
          } catch (aiError) {
            console.error('[PROJECT-AI] Error:', aiError);
          }
        })();
      }
    } catch (error: any) {
      console.error('Send message error:', error);
    } finally {
      setLoading(false);
    }
  };
  const updateChatTitle = async (chatId: string, messages: any[]) => {
    const {
      data: currentChat
    } = await supabase.from('chats').select('title').eq('id', chatId).single();

    // Only update if title is still basic/auto-generated
    if (currentChat && (currentChat.title === 'New Chat' || currentChat.title.length < 30 || !currentChat.title.includes(' '))) {
      const newTitle = generateChatTitle(messages);
      if (newTitle && newTitle !== currentChat.title) {
        const {
          error: updateError
        } = await supabase.from('chats').update({
          title: newTitle
        }).eq('id', chatId);
        if (!updateError) {
          fetchProjectChats();
          window.dispatchEvent(new CustomEvent('force-chat-refresh'));
        }
      }
    }
  };
  const generateChatTitle = (messages: any[]) => {
    const userMessages = messages.filter(msg => msg.role === 'user').slice(0, 2);
    if (userMessages.length === 0) return 'New Chat';
    const firstMessage = userMessages[0].content;
    const cleaned = firstMessage.trim().replace(/\s+/g, ' ');

    // Common words to filter out
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'please', 'help', 'tell', 'explain', 'show', 'give', 'get', 'make', 'take', 'go', 'come']);

    // Split into words and filter
    const words = cleaned.toLowerCase().split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word)).map(word => word.replace(/[^\w]/g, '')).filter(word => word.length > 2);
    let title = words.slice(0, 4).join(' ');
    if (!title) {
      title = cleaned.length > 40 ? cleaned.substring(0, 40) + '...' : cleaned;
    }

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  };
  const handleFileUpload = () => {
    if (selectedModel === 'generate-image') {
      toast.error("Cannot upload files in Generate Image mode", {
        description: "Image generation mode doesn't support file attachments"
      });
      setIsPopoverOpen(false);
      return;
    }
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setShowPricingModal(true);
      setIsPopoverOpen(false);
      return;
    }
    fileInputRef.current?.click();
    setIsPopoverOpen(false);
  };
  
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
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedModel === 'generate-image') {
      toast.error("Cannot upload files in Generate Image mode", {
        description: "Image generation mode doesn't support file attachments"
      });
      event.target.value = '';
      return;
    }
    if (!loadingSubscription && !subscriptionStatus.subscribed) {
      setShowPricingModal(true);
      event.target.value = '';
      return;
    }
    const files = event.target.files;
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      
      // Validate each file's size before adding
      for (const file of filesArray) {
        const maxSize = getMaxFileSize(file.type);
        if (file.size > maxSize) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024));
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          toast.error(`File size limit exceeded`, {
            description: `"${file.name}" (${fileSizeMB}MB) exceeds the ${maxSizeMB}MB limit for ${getFileTypeCategory(file.type)} files`
          });
          event.target.value = '';
          return; // Stop processing if any file exceeds limit
        }
      }
      
      setSelectedFiles(prev => [...prev, ...filesArray]);
      event.target.value = '';
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileImage className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return <FileText className="h-4 w-4 text-red-500" />;
    return <FileIcon className="h-4 w-4 text-gray-500" />;
  };
  const startRenameChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingChatTitle(chat.title);
  };
  const saveRename = async (chatId: string) => {
    if (!editingChatTitle.trim()) {
      setEditingChatId(null);
      setEditingChatTitle('');
      return;
    }
    try {
      const {
        error
      } = await supabase.from('chats').update({
        title: editingChatTitle.trim()
      }).eq('id', chatId);
      if (error) throw error;
      setChats(prev => prev.map(chat => chat.id === chatId ? {
        ...chat,
        title: editingChatTitle.trim()
      } : chat));
      setEditingChatId(null);
      setEditingChatTitle('');
    } catch (error: any) {
      console.error('Error renaming chat:', error);
      toast.error('Failed to rename chat');
    }
  };
  const deleteChat = async (chatId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Chat',
      description: 'Are you sure you want to delete this chat?',
      onConfirm: () => executeDeleteChat(chatId)
    });
  };
  const executeDeleteChat = async (chatId: string) => {
    try {
      // First delete associated images from storage
      if (user) {
        try {
          await supabase.functions.invoke('delete-chat-images', {
            body: {
              chatId,
              userId: user.id
            }
          });
        } catch (imageError) {
          console.error('Error deleting chat images:', imageError);
          // Continue with chat deletion even if image deletion fails
        }
      }

      // Then delete the chat from database
      const {
        error
      } = await supabase.from('chats').delete().eq('id', chatId);
      if (error) throw error;
      setChats(prev => prev.filter(chat => chat.id !== chatId));

      // Refresh sidebar
      window.dispatchEvent(new CustomEvent('force-chat-refresh'));
    } catch (error: any) {
      console.error('Error deleting chat:', error);
    }
  };
  const handleStyleSelect = (style: typeof imageStyles[0]) => {
    setInput(style.prompt);
    setSelectedStyle(style.name);
    setIsStylesOpen(false);

    // Focus the textarea after setting the style
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const handleCreateImageClick = () => {
    setIsImageMode(true);
    setIsPopoverOpen(false);
    setInput('');
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };
  const handleExitImageMode = () => {
    setIsImageMode(false);
    setSelectedStyle(null);
    setInput('');
  };
  const getStyleBackground = (styleName: string) => {
    switch (styleName) {
      case 'Cyberpunk':
        return 'bg-gradient-to-br from-cyan-500/30 to-purple-600/40 border border-cyan-400/20';
      case 'Anime':
        return 'bg-gradient-to-br from-pink-400/30 to-orange-400/30 border border-pink-300/20';
      case 'Dramatic Headshot':
        return 'bg-gradient-to-br from-gray-600/40 to-black/60 border border-gray-500/20';
      case 'Coloring Book':
        return 'bg-white border border-black/40';
      case 'Photo Shoot':
        return 'bg-gradient-to-br from-blue-400/20 to-purple-400/30 border border-blue-300/20';
      case 'Retro Cartoon':
        return 'bg-gradient-to-br from-red-400/30 to-yellow-400/30 border border-red-300/20';
      case '80s Glam':
        return 'bg-gradient-to-br from-magenta-500/30 to-cyan-400/30 border border-magenta-400/20';
      case 'Art Nouveau':
        return 'bg-gradient-to-br from-green-400/30 to-teal-400/30 border border-green-300/20';
      case 'Synthwave':
        return 'bg-gradient-to-br from-purple-600/40 to-pink-500/40 border border-purple-400/20';
      default:
        return 'bg-muted border border-border/40';
    }
  };
  const startRecording = async () => {
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
    
    // Now set the message from temporary transcript
    setInput(tempTranscript);
    setTempTranscript('');
    
    // Focus textarea after stopping to show the text
    setTimeout(() => {
      textareaRef.current?.focus();
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
  };
  if (!project) {
    return <div>Loading...</div>;
  }

  return <div className="flex h-screen bg-background overflow-hidden w-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header with Sidebar Trigger */}
        {isMobile && <div className="fixed top-0 left-0 right-0 flex items-center p-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
            <SidebarTrigger className="h-9 w-9 hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary" aria-label="Open sidebar menu" />
            
            {/* Mobile Project Info / Model Selector - Absolutely centered */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-accent/50 rounded-lg transition-all duration-200 p-2">
                    {(() => {
                      const IconComponent = iconMap[project.icon as keyof typeof iconMap] || FolderOpen;
                      return <IconComponent className="w-6 h-6" style={{ color: project.color }} />;
                    })()}
                    <h1 className="text-base font-semibold text-foreground truncate max-w-[120px]">{project.title}</h1>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  className="z-[100] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[320px]" 
                  align="center"
                  sideOffset={8}
                >
                  {/* Edit Project Option */}
                  <DropdownMenuItem 
                    className="rounded-xl px-2 py-2 md:px-3 md:py-3 hover:bg-accent/60 focus:bg-accent/60 transition-all duration-200 cursor-pointer"
                    onClick={() => setIsEditingProject(true)}
                  >
                    <div className="flex items-center w-full gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary/10 to-primary/20 backdrop-blur-sm rounded-xl flex items-center justify-center p-1.5">
                        <Settings2 className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-foreground">Edit Project</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Change name and icon</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="my-2 bg-border/50" />
                  
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Model
                  </div>
                  
                  {/* Model Options */}
                  {models.map(model => {
                    const modelData = availableModels.find(m => m.id === model.id);
                    const isSelected = selectedModel === model.id;
                    // Check if user has Ultra subscription
                    const hasUltra = subscriptionStatus.plan === 'ultra_pro';
                    
                    return (
                      <DropdownMenuItem 
                        key={model.id}
                        className={`rounded-xl px-2 py-2 md:px-3 md:py-3 hover:bg-accent/60 focus:bg-accent/60 cursor-pointer transition-all duration-200 ${isSelected ? 'bg-accent/40' : ''}`}
                        onClick={() => {
                          handleModelSelect(model.id);
                        }}
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
                            {model.type === 'pro' && !subscriptionStatus.subscribed && (
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
                            <div className={`font-semibold text-sm truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {model.name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">{model.description}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>}
        
        <div 
          className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'pt-[60px] pb-[180px]' : 'pb-[180px]'}`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedModel === 'generate-image') {
              return;
            }
            if (!subscriptionStatus.subscribed) {
              return;
            }
            setIsDragOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedModel === 'generate-image') {
              return;
            }
            if (!subscriptionStatus.subscribed) {
              return;
            }
            setIsDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setIsDragOver(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            
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
            if (files.length > 0) {
              setSelectedFiles(prev => [...prev, ...files]);
            }
          }}
        >
          {/* Drag and drop overlay */}
          {isDragOver && (
            <div className="fixed inset-0 bg-primary/10 flex items-center justify-center z-50 pointer-events-none">
              <div className="text-center">
                <Paperclip className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-base font-semibold text-primary">Drop files here</p>
              </div>
            </div>
          )}
          <div className="min-h-full flex flex-col justify-center px-3 sm:px-4 py-4 max-w-4xl mx-auto">
            {/* Desktop Header */}
            {!isMobile && <div className="flex flex-col items-center justify-center mb-8 text-center">
                <div className="flex items-center justify-center gap-3 mb-6 cursor-pointer hover:opacity-80 transition-opacity whitespace-nowrap" onClick={() => setIsEditingProject(true)}>
                  {(() => {
                    const IconComponent = iconMap[project.icon as keyof typeof iconMap] || FolderOpen;
                    return <IconComponent className="w-8 h-8" style={{ color: project.color }} />;
                  })()}
                  <h1 className="text-2xl font-semibold text-foreground">{project.title}</h1>
                </div>
              </div>}

            {/* Chat List */}
            {chats.length > 0 && <div className="space-y-3 mb-8 w-full">
                {chats.map(chat => <div key={chat.id} className="flex items-center justify-between p-3 sm:p-4 border-t border-b border-border hover:bg-muted/20 transition-colors group">
                  <div className="flex-1 cursor-pointer min-w-0" onClick={() => {
                    if (editingChatId === chat.id) return; // Don't navigate when editing
                    const targetPath = chat.tool_id ? `/${chat.tool_id}/${chat.id}` : `/chat/${chat.id}`;
                    navigate(targetPath);
                  }}>
                    <div className="flex flex-col gap-1">
                      {editingChatId === chat.id ? <input value={editingChatTitle} onChange={e => setEditingChatTitle(e.target.value)} onBlur={() => saveRename(chat.id)} onClick={e => e.stopPropagation()} onKeyDown={e => {
                        if (e.key === 'Enter') saveRename(chat.id);
                        if (e.key === 'Escape') {
                          setEditingChatId(null);
                          setEditingChatTitle('');
                        }
                      }} className="font-medium text-foreground bg-transparent border border-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring" autoFocus onFocus={e => {
                        const length = e.target.value.length;
                        e.target.setSelectionRange(length, length);
                      }} /> : <h4 className="font-medium text-foreground text-sm pr-4 truncate">{chat.title}</h4>}
                    </div>
                  </div>
                  
                  {/* Chat Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={e => {
                      e.stopPropagation();
                      if (editingChatId === chat.id) {
                        saveRename(chat.id);
                      } else {
                        startRenameChat(chat);
                      }
                    }}>
                      {editingChatId === chat.id ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Edit2 className="h-3 w-3" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={e => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>)}
            </div>}
          </div>
        </div>

        {/* Input area - fixed at bottom, responsive */}
        <div 
          className="fixed bottom-0 left-0 right-0 bg-background border-t border-border"
          style={{
            paddingLeft: !isMobile ? (collapsed ? '56px' : '280px') : '0'
          }}
        >
          <div className="flex justify-center px-3 sm:px-4 py-3 sm:py-4 w-full max-w-4xl mx-auto">
            <div className="w-full">
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
              
              {/* Message limit warning */}
              {!subscriptionStatus.subscribed && (
                <MessageLimitWarning 
                  messageCount={messageCount} 
                  limit={limit}
                  show={showLimitWarning}
                  onHide={() => setShowLimitWarning(false)}
                />
              )}
              
              <div className="relative bg-background border border-border rounded-xl sm:rounded-2xl p-3 sm:p-4">
                <Textarea 
                  ref={textareaRef} 
                  value={input} 
                  onChange={handleInputChange} 
                  onKeyDown={handleKeyDown} 
                  placeholder={isImageMode ? "Describe an image..." : "ask me anything..."} 
                  className="w-full min-h-[32px] max-h-[120px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 outline-none px-0 py-0 mb-3 text-sm sm:text-base" 
                  rows={1} 
                  disabled={loading}
                />
                
                {/* Recording UI - replaces buttons when recording */}
                {isRecording ? (
                  <div className="flex items-center gap-1 sm:gap-2 py-1 sm:py-3 px-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 sm:h-8 sm:w-8 rounded-full text-foreground hover:text-foreground hover:bg-accent flex-shrink-0 p-0"
                      onClick={cancelRecording}
                    >
                      <X className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    
                    <div className="flex-1 flex items-center justify-center gap-1 sm:gap-3 min-w-0 overflow-hidden">
                      {/* Waveform visualization */}
                      <div className="flex items-center justify-center gap-[0.5px] sm:gap-[2px] h-4 sm:h-8 flex-1 max-w-[320px] sm:max-w-[600px] min-w-0">
                        {audioLevels.map((level, i) => {
                          const minHeight = 2;
                          const maxHeight = isMobile ? 16 : 32;
                          const height = minHeight + (level * (maxHeight - minHeight));
                          
                          return (
                            <div
                              key={i}
                              className="w-[0.5px] sm:w-[2px] bg-foreground rounded-full transition-all duration-75 ease-out"
                              style={{ height: `${height}px` }}
                            />
                          );
                        })}
                      </div>
                      
                      {/* Timer */}
                      <span className="text-xs sm:text-sm font-medium tabular-nums text-foreground flex-shrink-0">
                        {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                    
                    <Button
                      size="sm"
                      className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-foreground text-background hover:bg-foreground/90 flex-shrink-0 p-0"
                      onClick={stopRecording}
                    >
                      <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </Button>
                  </div>
                ) : (
                  // Input controls
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {!isMobile && <>
                          <Button variant="ghost" size="sm" className="h-9 w-9 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary flex-shrink-0" onClick={handleFileUpload} aria-label="Upload file">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          
                          {isImageMode && !selectedStyle ? <div className="flex items-center gap-2">
                              {/* Image mode indicator */}
                              <div className="group flex items-center gap-1 bg-muted px-3 py-2 rounded-full text-xs">
                                <ImageIcon2 className="h-3 w-3" />
                                <span>Image</span>
                                <button onClick={handleExitImageMode} className="opacity-70 group-hover:opacity-100 transition-opacity ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Exit image mode">
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                              
                              {/* Styles dropdown */}
                              <Popover open={isStylesOpen} onOpenChange={setIsStylesOpen}>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-9 px-3 text-xs gap-1 bg-muted hover:bg-muted/80 rounded-full border border-border/50 focus-visible:ring-2 focus-visible:ring-primary" aria-label="Select image style" aria-expanded={isStylesOpen} aria-haspopup="true">
                                    <Palette className="h-3 w-3" />
                                    <span>Styles</span>
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
                            </div> : <Button variant="ghost" size="sm" className="h-9 px-3 rounded-full border border-border/50 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary text-xs" onClick={handleCreateImageClick} aria-label="Create an image">
                              <ImageIcon className="h-4 w-4 mr-2" />
                              <span>Generate an image</span>
                            </Button>}
                        </>}
                      </div>

                      {/* Voice controls */}
                      {!isMobile && <div className="flex items-center gap-2">
                        <Select value={selectedModel} onValueChange={handleModelSelect}>
                          <SelectTrigger className="w-[200px] h-10 bg-background/80 backdrop-blur-sm border border-border/50 rounded-xl focus-visible:ring-2 focus-visible:ring-primary text-sm shadow-sm hover:bg-accent/50 transition-all duration-200" aria-label="Select AI model">
                            <SelectValue>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center">
                                  <img 
                                    src={getModelIcon(availableModels.find(m => m.id === selectedModel)?.icon || 'openai')} 
                                    alt={`${models.find(m => m.id === selectedModel)?.name} icon`} 
                                    className="w-4 h-4 object-contain"
                                    style={getIconFilterStyle(availableModels.find(m => m.id === selectedModel)?.icon || 'openai')}
                                  />
                                </div>
                                <span className="font-medium truncate">{models.find(m => m.id === selectedModel)?.shortLabel}</span>
                              </div>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-[100] bg-background/95 backdrop-blur-xl border border-border/80 shadow-2xl rounded-2xl p-2 w-[calc(100vw-2rem)] max-w-[320px]">
                            {availableModelsList.map(model => {
                              const modelData = availableModels.find(m => m.id === model.id);
                              const isPro = model.type === 'pro';
                              const isUltra = model.type === 'ultra';
                              
                              // Check if user has Ultra subscription
                              const hasUltra = subscriptionStatus.plan === 'ultra_pro';
                              
                              return (
                                <SelectItem 
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
                                      {isPro && !subscriptionStatus.subscribed && (
                                        <span className="absolute -top-1 -right-1 text-[8px] leading-none bg-gradient-to-r from-blue-500 to-purple-500 text-white px-1 py-0.5 rounded-full font-bold shadow-md">
                                          PRO
                                        </span>
                                      )}
                                      {isUltra && !hasUltra && (
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
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        
                        <Button
                          size="sm" 
                          className={`h-9 w-9 rounded-full border border-border/50 ${
                            input.trim().length > 0 || selectedFiles.length > 0
                              ? 'bg-foreground hover:bg-foreground/90 text-background'
                              : isRecording 
                                ? 'bg-red-500 hover:bg-red-600 text-background' 
                                : 'bg-foreground hover:bg-foreground/90 text-background'
                          }`} 
                          onClick={input.trim().length > 0 || selectedFiles.length > 0 ? sendMessage : (isRecording ? stopRecording : startRecording)} 
                          disabled={loading}
                        >
                          {input.trim().length > 0 || selectedFiles.length > 0 ? (
                            <SendHorizontalIcon className="h-4 w-4" />
                          ) : (
                            isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />
                          )}
                        </Button>
                      </div>}
                    </div>

                    {/* Mobile controls */}
                    {isMobile && <div className="flex justify-between items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full border border-border/30 text-muted-foreground hover:bg-accent">
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2 bg-background border shadow-lg" align="start">
                          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleFileUpload}>
                            <Paperclip className="h-4 w-4" />
                            Add photos & files
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleCreateImageClick}>
                            <ImageIcon className="h-4 w-4" />
                            Create an image
                          </Button>
                        </PopoverContent>
                      </Popover>
                      
                      <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1">
                        <Button 
                          size="sm" 
                          className={`h-7 w-7 rounded-full ${
                            input.trim().length > 0 || selectedFiles.length > 0
                              ? 'bg-foreground hover:bg-foreground/90 text-background'
                              : isRecording 
                                ? 'bg-red-500 hover:bg-red-600 text-background' 
                                : 'bg-foreground hover:bg-foreground/90 text-background'
                          }`} 
                          onClick={input.trim().length > 0 || selectedFiles.length > 0 ? sendMessage : (isRecording ? stopRecording : startRecording)} 
                          disabled={loading}
                        >
                          {input.trim().length > 0 || selectedFiles.length > 0 ? (
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
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.csv,.json,.xml,.py,.js,.html,.css,.md" />
      </div>

      {/* Edit Project Modal */}
      <ProjectEditModal project={project} isOpen={isEditingProject} onClose={() => setIsEditingProject(false)} onProjectUpdated={() => {
        fetchProject();
        window.dispatchEvent(new CustomEvent('force-chat-refresh'));
      }} />

      {/* Confirmation Dialog */}
      <ConfirmationDialog 
        isOpen={confirmDialog.isOpen} 
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} 
        onConfirm={confirmDialog.onConfirm} 
        title={confirmDialog.title} 
        description={confirmDialog.description} 
        variant="destructive" 
        confirmText="Delete" 
      />
      
      <PricingModal 
        open={showPricingModal}
        onOpenChange={setShowPricingModal}
      />
      
      <UpgradeBlockedDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        currentPlan="Pro"
      />
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </div>;
}