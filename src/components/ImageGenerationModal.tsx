import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ImageIcon, Plus, Copy, Check, Download, Sparkles, X } from 'lucide-react';
import { SendHorizontalIcon } from '@/components/ui/send-horizontal-icon';
import { ImagePopupModal } from '@/components/ImagePopupModal';
import { useUsageLimits } from '@/hooks/useUsageLimits';
import { toast } from 'sonner';

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  created_at: string;
  chat_id: string;
}

interface ImageGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageGenerationModal({ isOpen, onClose }: ImageGenerationModalProps) {
  const [previousImages, setPreviousImages] = useState<GeneratedImage[]>([]);
  const [newPrompt, setNewPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImageId, setCopiedImageId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<{url: string, prompt: string} | null>(null);
  
  const { user } = useAuth();
  const { usageLimits, loading: limitsLoading } = useUsageLimits();
  const navigate = useNavigate();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && user) {
      fetchPreviousImages();
    }
  }, [isOpen, user]);

  const fetchPreviousImages = async () => {
    if (!user) return;

    try {
      // Fetch messages with image attachments from all user's chats
      const { data: chats } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', user.id);

      if (!chats) return;

      const chatIds = chats.map(chat => chat.id);
      
      const { data: messages } = await supabase
        .from('messages')
        .select('id, content, file_attachments, created_at, chat_id')
        .in('chat_id', chatIds)
        .eq('role', 'assistant')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!messages) return;

      // Extract images from messages
      const images: GeneratedImage[] = [];
      messages.forEach(message => {
        const attachments = message.file_attachments as any[] || [];
        attachments.forEach(attachment => {
          if (attachment.type?.startsWith('image/') && attachment.url) {
            images.push({
              id: `${message.id}-${attachment.id}`,
              image_url: attachment.url,
              prompt: message.content || 'Generated image',
              created_at: message.created_at,
              chat_id: message.chat_id
            });
          }
        });
      });

      setPreviousImages(images);
    } catch (error) {
      console.error('Error fetching previous images:', error);
    }
  };

  const handleGenerate = async () => {
    if (!newPrompt.trim() || !user || isGenerating) return;

    // Check usage limits before proceeding
    if (!limitsLoading && !usageLimits.canGenerate) {
      console.log('[IMAGE-GEN-MODAL] User has no image generation limit remaining');
      toast.error('Image generation limit reached', {
        description: `You've used all ${usageLimits.limit} image generations this month. Upgrade your plan for more!`
      });
      return;
    }

    setIsGenerating(true);
    const promptText = newPrompt.trim();
    setNewPrompt('');

    try {
      // Create a new chat
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          user_id: user.id,
          title: promptText.length > 50 ? promptText.substring(0, 50) + '...' : promptText
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add user message with a flag to indicate it came from image generation modal
      await supabase
        .from('messages')
        .insert({
          chat_id: newChat.id,
          content: promptText,
          role: 'user'
        });

      // Close modal first, then navigate
      onClose();
      
      // Small delay to ensure modal closes before navigation
      setTimeout(() => {
        navigate(`/chat/${newChat.id}`);
        
        // Trigger sidebar refresh
        window.dispatchEvent(new CustomEvent('force-chat-refresh'));
        
        // Set a flag to prevent auto-trigger for this specific chat
        window.dispatchEvent(new CustomEvent('image-generation-chat', { 
          detail: { chatId: newChat.id } 
        }));
        
        // Send image generation request after navigation
        setTimeout(() => {
          supabase.functions.invoke('chat-with-ai-optimized', {
            body: {
              message: promptText,
              chat_id: newChat.id,
              user_id: user.id
            }
          }).catch(error => {
            console.error('Error generating image:', error);
          });
        }, 500);
      }, 100);

    } catch (error) {
      console.error('Error creating chat:', error);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const copyImageUrl = async (imageUrl: string, imageId: string) => {
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopiedImageId(imageId);
      setTimeout(() => setCopiedImageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy image URL:', error);
    }
  };

  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      let response;
      
      // Check if it's a Supabase storage URL
      if (imageUrl.includes('supabase') || imageUrl.includes('storage')) {
        // Use Supabase client for authenticated requests
        const { data, error } = await supabase.storage
          .from('chat-files')
          .download(imageUrl.split('/').pop() || `image-${Date.now()}`);
          
        if (error) throw error;
        response = { blob: () => Promise.resolve(data) };
      } else {
        // For external URLs, try direct fetch
        response = await fetch(imageUrl, {
          method: 'GET',
          mode: 'cors',
          cache: 'no-cache',
        });
        
        if (!response.ok) throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prompt.slice(0, 30)}-${Date.now()}.png`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to opening in new tab
      try {
        const newWindow = window.open(imageUrl, '_blank');
        if (!newWindow) {
          console.error('Failed to open image in new tab - popups may be blocked');
        }
      } catch (fallbackError) {
        console.error('Failed to download or open image:', fallbackError);
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <ImageIcon className="h-5 w-5 text-white" />
              </div>
              Image Generation
            </DialogTitle>
            <DialogDescription className="sr-only">Generate AI images from text descriptions</DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col h-[70vh]">
            {/* Previous Images Section */}
            <div className="flex-1 overflow-y-auto p-6">
              {previousImages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-normal mb-4 text-foreground">
                      No images generated yet
                    </h3>
                    <p className="text-muted-foreground">
                      Start by describing an image you'd like to generate below.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previousImages.map((image) => (
                    <div key={image.id} className="group relative">
                      <img 
                        src={image.image_url} 
                        alt={image.prompt}
                        className="w-full aspect-square object-cover rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => setSelectedImage({url: image.image_url, prompt: image.prompt})}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyImageUrl(image.image_url, image.id);
                          }}
                        >
                          {copiedImageId === image.id ? (
                            <Check className="h-3 w-3" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadImage(image.image_url, image.prompt);
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-xs text-white bg-black/60 rounded px-2 py-1 truncate">
                          {image.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input Section */}
            <div className="border-t border-border/40 p-6 bg-background">
              <div className="relative">
                <div className="flex-1 flex items-center border rounded-3xl px-4 py-3 bg-white dark:bg-[hsl(var(--input))] border-gray-200 dark:border-border">
                  <Textarea
                    ref={textareaRef}
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the image you want to generate..."
                    className="flex-1 min-h-[24px] max-h-[200px] border-0 resize-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-0 text-foreground placeholder:text-muted-foreground break-words text-left"
                    style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
                    disabled={isGenerating}
                    rows={1}
                  />
                  
                  <div className="flex items-center gap-1 ml-2 pb-1">
                    <Button
                      type="button"
                      onClick={handleGenerate}
                      disabled={!newPrompt.trim() || isGenerating}
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full flex-shrink-0"
                      style={{ 
                        backgroundColor: newPrompt.trim() && !isGenerating
                          ? 'hsl(var(--primary))'
                          : 'hsl(var(--muted))',
                        color: newPrompt.trim() && !isGenerating
                          ? 'hsl(var(--primary-foreground))'
                          : 'hsl(var(--muted-foreground))'
                      }}
                    >
                      <SendHorizontalIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Popup Modal */}
      {selectedImage && (
        <ImagePopupModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.url}
          prompt={selectedImage.prompt}
        />
      )}
    </>
  );
}