import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { messageId, userId, model, userMessage, fileAttachments } = await req.json();

    console.log('[REGENERATE-FUNCTION] Starting regeneration for message:', messageId);
    console.log('[REGENERATE-FUNCTION] Model:', model);

    // Fetch the message to regenerate
    const { data: existingMessage, error: fetchError } = await supabaseClient
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (fetchError || !existingMessage) {
      console.error('[REGENERATE-FUNCTION] Message not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete old images from storage if any
    if (existingMessage.file_attachments && Array.isArray(existingMessage.file_attachments)) {
      for (const attachment of existingMessage.file_attachments) {
        if (attachment.url && attachment.url.includes('generated-images')) {
          try {
            const urlObj = new URL(attachment.url);
            const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)/);
            
            if (pathMatch) {
              const bucketName = pathMatch[1];
              const filePath = pathMatch[2];
              console.log('[REGENERATE-FUNCTION] Deleting old image:', filePath);
              
              await supabaseClient.storage
                .from(bucketName)
                .remove([filePath]);
            }
          } catch (e) {
            console.error('[REGENERATE-FUNCTION] Error deleting old image:', e);
          }
        }
      }
    }

    // Prepare the AI request
    const n8nPayload: any = {
      type: model === 'generate-image' ? 'generate_image' : (fileAttachments && fileAttachments.length > 0 ? (fileAttachments[0].isImage ? 'analyse-image' : 'analyse-files') : 'text'),
      message: userMessage,
      userId: userId,
      chatId: existingMessage.chat_id,
      model: model
    };

    if (fileAttachments && fileAttachments.length > 0) {
      const firstAttachment = fileAttachments[0];
      n8nPayload.fileName = firstAttachment.fileName;
      n8nPayload.fileSize = firstAttachment.fileSize;
      n8nPayload.fileType = firstAttachment.fileType;
      n8nPayload.fileData = firstAttachment.fileData;
    }

    console.log('[REGENERATE-FUNCTION] Calling N8n webhook...');

    // Call N8n to get the AI response
    const n8nResponse = await fetch('https://adsgbt.app.n8n.cloud/webhook/adamGPT', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload)
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8n webhook failed: ${n8nResponse.status}`);
    }

    const aiResponse = await n8nResponse.json();
    console.log('[REGENERATE-FUNCTION] AI response received');

    // Extract content and image from AI response
    let newContent = '';
    let newFileAttachments = null;

    if (model === 'generate-image' && aiResponse.image_base64) {
      // Handle image generation
      console.log('[REGENERATE-FUNCTION] Processing image generation...');
      
      try {
        const imageBytes = Uint8Array.from(atob(aiResponse.image_base64), c => c.charCodeAt(0));
        const timestamp = Date.now();
        const imageName = aiResponse.image_name || 'generated_image.png';
        const uniqueFileName = `generated_${timestamp}_${imageName}`;
        const filePath = `${userId}/${existingMessage.chat_id}/${uniqueFileName}`;

        const { error: uploadError } = await supabaseClient.storage
          .from('generated-images')
          .upload(filePath, imageBytes, {
            contentType: aiResponse.image_type || 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error('[REGENERATE-FUNCTION] Upload error:', uploadError);
        } else {
          const { data: urlData } = supabaseClient.storage
            .from('generated-images')
            .getPublicUrl(filePath);
          
          newFileAttachments = [{
            id: crypto.randomUUID(),
            name: imageName,
            size: 0,
            type: aiResponse.image_type || 'image/png',
            url: urlData.publicUrl
          }];

          console.log('[REGENERATE-FUNCTION] Image uploaded:', urlData.publicUrl);

          // Increment usage
          await supabaseClient.rpc('increment_image_generation', { p_user_id: userId });
        }
      } catch (error) {
        console.error('[REGENERATE-FUNCTION] Image processing error:', error);
      }
    } else {
      // Handle text response
      const responseData = aiResponse.response_data || aiResponse.response || aiResponse.text || aiResponse.content;
      
      if (Array.isArray(responseData) && responseData.length > 0) {
        const analysisTexts = responseData.map((item: any) => item.text || item.content || '').filter((text: string) => text);
        newContent = analysisTexts.join('\n\n');
      } else if (typeof responseData === 'object' && responseData?.text) {
        newContent = responseData.text;
      } else if (typeof responseData === 'object' && (responseData?.analysis || responseData?.content)) {
        newContent = responseData.analysis || responseData.content;
      } else if (typeof responseData === 'string') {
        newContent = responseData;
      }
    }

    console.log('[REGENERATE-FUNCTION] Updating message in database...');

    // UPDATE the existing message with new content
    const { data: updatedMessage, error: updateError } = await supabaseClient
      .from('messages')
      .update({
        content: newContent,
        file_attachments: newFileAttachments,
        model: model
      })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('[REGENERATE-FUNCTION] Update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update message' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[REGENERATE-FUNCTION] Message updated successfully:', messageId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: updatedMessage 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[REGENERATE-FUNCTION] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
