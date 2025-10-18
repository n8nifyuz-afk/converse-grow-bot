import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chatId, userId } = await req.json();

    if (!chatId || !userId) {
      throw new Error('Chat ID and User ID are required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[DELETE-CHAT-IMAGES] Deleting all storage files for chat:', chatId, 'user:', userId);

    let totalDeletedCount = 0;

    // Define all buckets to clean up
    const bucketsToClean = [
      { name: 'chat-images', path: `${userId}/${chatId}` },
      { name: 'generated-images', path: `${userId}/${chatId}` },
      { name: 'chat-files', path: `${userId}/${chatId}` }
    ];

    // Delete from each bucket
    for (const bucket of bucketsToClean) {
      console.log(`[DELETE-CHAT-IMAGES] Checking bucket: ${bucket.name}, path: ${bucket.path}`);
      
      const { data: files, error: listError } = await supabase.storage
        .from(bucket.name)
        .list(bucket.path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (listError) {
        console.error(`[DELETE-CHAT-IMAGES] Error listing files in ${bucket.name}:`, listError);
        continue; // Continue with next bucket even if one fails
      }

      if (files && files.length > 0) {
        console.log(`[DELETE-CHAT-IMAGES] Found ${files.length} files in ${bucket.name}`);
        
        // Build file paths
        const filePaths = files.map(file => `${bucket.path}/${file.name}`);
        
        // Delete in batches (Supabase limit is 1000 per request, but we'll use 50 for safety)
        const batchSize = 50;
        for (let i = 0; i < filePaths.length; i += batchSize) {
          const batch = filePaths.slice(i, i + batchSize);
          
          const { error: deleteError } = await supabase.storage
            .from(bucket.name)
            .remove(batch);

          if (deleteError) {
            console.error(`[DELETE-CHAT-IMAGES] Error deleting batch from ${bucket.name}:`, deleteError);
          } else {
            totalDeletedCount += batch.length;
            console.log(`[DELETE-CHAT-IMAGES] Deleted ${batch.length} files from ${bucket.name}`);
          }
        }
      } else {
        console.log(`[DELETE-CHAT-IMAGES] No files found in ${bucket.name}`);
      }
    }

    // Also clean up any loose generated images at user root level (legacy format)
    console.log('[DELETE-CHAT-IMAGES] Checking for legacy generated images at user root...');
    const { data: rootFiles, error: rootListError } = await supabase.storage
      .from('chat-images')
      .list(`${userId}`, {
        limit: 1000,
        sortBy: { column: 'name', order: 'asc' }
      });

    if (!rootListError && rootFiles) {
      const generatedFiles = rootFiles.filter(file => 
        file.name.startsWith('generated_') && file.name.includes('.png')
      );

      if (generatedFiles.length > 0) {
        console.log(`[DELETE-CHAT-IMAGES] Found ${generatedFiles.length} legacy generated images`);
        const generatedFilePaths = generatedFiles.map(file => `${userId}/${file.name}`);
        
        const { error: deleteGeneratedError } = await supabase.storage
          .from('chat-images')
          .remove(generatedFilePaths);

        if (!deleteGeneratedError) {
          totalDeletedCount += generatedFilePaths.length;
          console.log(`[DELETE-CHAT-IMAGES] Deleted ${generatedFilePaths.length} legacy generated images`);
        } else {
          console.error('[DELETE-CHAT-IMAGES] Error deleting legacy generated images:', deleteGeneratedError);
        }
      }
    }

    console.log(`[DELETE-CHAT-IMAGES] ✅ COMPLETED: Deleted total of ${totalDeletedCount} files`);

    return new Response(
      JSON.stringify({ 
        success: true,
        deletedCount: totalDeletedCount,
        message: `Successfully deleted ${totalDeletedCount} files`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DELETE-CHAT-IMAGES] ❌ ERROR:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});