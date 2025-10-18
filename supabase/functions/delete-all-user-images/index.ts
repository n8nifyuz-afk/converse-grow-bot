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
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[DELETE-ALL-USER-IMAGES] Deleting ALL storage files for user:', userId);

    let totalDeletedCount = 0;

    // Define all storage buckets to clean
    const bucketsToClean = ['chat-images', 'generated-images', 'chat-files'];

    for (const bucketName of bucketsToClean) {
      console.log(`[DELETE-ALL-USER-IMAGES] Processing bucket: ${bucketName}`);

      // List all files and folders in user's root directory
      const { data: rootItems, error: rootListError } = await supabase.storage
        .from(bucketName)
        .list(userId, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (rootListError) {
        console.error(`[DELETE-ALL-USER-IMAGES] Error listing root items in ${bucketName}:`, rootListError);
        continue; // Continue with next bucket even if one fails
      }

      const filePaths: string[] = [];

      if (rootItems && rootItems.length > 0) {
        console.log(`[DELETE-ALL-USER-IMAGES] Found ${rootItems.length} items in ${bucketName} root`);

        // Process each item (could be file or folder)
        for (const item of rootItems) {
          if (item.name) {
            // Check if it's a file at root level
            if (item.id && !item.name.includes('/')) {
              filePaths.push(`${userId}/${item.name}`);
            }
            
            // Check if it's a folder (has id but might contain files)
            // Try to list contents of potential subfolder
            try {
              const { data: subFiles, error: subListError } = await supabase.storage
                .from(bucketName)
                .list(`${userId}/${item.name}`, {
                  limit: 1000
                });

              if (!subListError && subFiles && subFiles.length > 0) {
                console.log(`[DELETE-ALL-USER-IMAGES] Found ${subFiles.length} files in subfolder ${item.name}`);
                for (const subFile of subFiles) {
                  if (subFile.name) {
                    filePaths.push(`${userId}/${item.name}/${subFile.name}`);
                  }
                }
              }
            } catch (e) {
              // Not a folder, skip
              console.log(`[DELETE-ALL-USER-IMAGES] ${item.name} is not a folder, skipping subfolder check`);
            }
          }
        }
      }

      // Delete all collected files in batches
      if (filePaths.length > 0) {
        console.log(`[DELETE-ALL-USER-IMAGES] Total files to delete from ${bucketName}: ${filePaths.length}`);
        
        const batchSize = 50;
        for (let i = 0; i < filePaths.length; i += batchSize) {
          const batch = filePaths.slice(i, i + batchSize);
          
          const { error: deleteError } = await supabase.storage
            .from(bucketName)
            .remove(batch);

          if (deleteError) {
            console.error(`[DELETE-ALL-USER-IMAGES] Error deleting batch from ${bucketName}:`, deleteError);
          } else {
            totalDeletedCount += batch.length;
            console.log(`[DELETE-ALL-USER-IMAGES] Deleted batch of ${batch.length} files from ${bucketName}`);
          }
        }
      } else {
        console.log(`[DELETE-ALL-USER-IMAGES] No files found in ${bucketName}`);
      }
    }

    console.log(`[DELETE-ALL-USER-IMAGES] ✅ COMPLETED: Deleted total of ${totalDeletedCount} files for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        deletedCount: totalDeletedCount,
        message: `Successfully deleted ${totalDeletedCount} files`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[DELETE-ALL-USER-IMAGES] ❌ ERROR:', error);
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