import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !adminRole) {
      throw new Error('Admin access required');
    }

    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log(`Exporting chats for user: ${userId}`);

    // Fetch all chats for the user
    const { data: chats, error: chatsError } = await supabase
      .from('chats')
      .select('id, title, model_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (chatsError) {
      console.error('Error fetching chats:', chatsError);
      throw new Error('Failed to fetch chats');
    }

    console.log(`Found ${chats?.length || 0} chats`);

    // Fetch all messages for these chats
    const chatIds = chats?.map(chat => chat.id) || [];
    
    if (chatIds.length === 0) {
      // Return empty Excel wrapped in JSON
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet([{
        'Chat Title': 'No chats found',
        'Chat Created': '',
        'Model': '',
        'Role': '',
        'Message': '',
        'Sent At': '',
        'Attached Files/Images': ''
      }]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Messages');
      const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      
      return new Response(
        JSON.stringify({ 
          excel: excelBuffer,
          filename: `user_chats_${userId}_${new Date().toISOString().split('T')[0]}.xlsx`
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('chat_id, role, content, created_at, file_attachments')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      throw new Error('Failed to fetch messages');
    }

    console.log(`Found ${messages?.length || 0} messages`);

    // Build Excel data structure
    const excelData: any[] = [];
    
    // Create a map of chat IDs to chat details
    const chatMap = new Map(chats?.map(chat => [chat.id, chat]) || []);

    messages?.forEach(message => {
      const chat = chatMap.get(message.chat_id);
      if (!chat) return;

      // Extract image URLs from file_attachments
      let imageUrls = '';
      if (message.file_attachments && Array.isArray(message.file_attachments) && message.file_attachments.length > 0) {
        const urls = message.file_attachments
          .map((attachment: any) => {
            if (typeof attachment === 'string') {
              return attachment;
            } else if (attachment && attachment.url) {
              return attachment.url;
            } else if (attachment && attachment.path) {
              return `https://lciaiunzacgvvbvcshdh.supabase.co/storage/v1/object/public/chat-images/${attachment.path}`;
            }
            return null;
          })
          .filter((url: string | null) => url !== null)
          .join('\n');
        imageUrls = urls;
      }

      excelData.push({
        'Chat Title': chat.title,
        'Chat Created': new Date(chat.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        'Model': chat.model_id || 'N/A',
        'Role': message.role,
        'Message': message.content,
        'Sent At': new Date(message.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        'Attached Files/Images': imageUrls || 'None'
      });
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    worksheet['!cols'] = [
      { wch: 30 }, // Chat Title
      { wch: 18 }, // Chat Created
      { wch: 20 }, // Model
      { wch: 10 }, // Role
      { wch: 80 }, // Message (wider for content)
      { wch: 20 }, // Sent At
      { wch: 60 }  // Attached Files/Images
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Messages');

    // Generate Excel file as base64
    const excelBuffer = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

    console.log(`Exported ${messages?.length || 0} messages from ${chats?.length || 0} chats to Excel`);

    // Return Excel file as base64 wrapped in JSON
    return new Response(
      JSON.stringify({ 
        excel: excelBuffer,
        filename: `user_chats_${userId}_${new Date().toISOString().split('T')[0]}.xlsx`
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error exporting user chats:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
