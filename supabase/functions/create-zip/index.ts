
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import JSZip from 'https://esm.sh/jszip@3.10.1';
import { Buffer } from 'https://deno.land/std@0.170.0/node/buffer.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with the auth context of the user
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { slug, adminKey } = await req.json();

    if (!slug) {
      return new Response(
        JSON.stringify({ error: 'Missing slug parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get checklist data to verify access and obtain files
    console.log(`Getting checklist data for slug: ${slug}`);
    const { data: checklistData, error: checklistError } = await supabaseClient
      .from('checklists')
      .select(`
        id, 
        items:checklist_items(id, title, description),
        files:checklist_files(id, item_id, filename, file_path, status)
      `)
      .eq('slug', slug)
      .single();

    if (checklistError || !checklistData) {
      console.error('Error getting checklist data:', checklistError);
      return new Response(
        JSON.stringify({ error: 'Checklist not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify admin access if adminKey is provided
    if (adminKey) {
      const { data: adminCheck, error: adminError } = await supabaseClient
        .from('checklists')
        .select('id')
        .eq('slug', slug)
        .eq('admin_key', adminKey)
        .single();
      
      if (adminError || !adminCheck) {
        console.error('Admin access denied:', adminError);
        return new Response(
          JSON.stringify({ error: 'Invalid admin key' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!checklistData.files || checklistData.files.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No files to download' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a new ZIP file
    const zip = new JSZip();
    
    // Create a map of item IDs to titles for easier lookup
    const itemMap = new Map();
    checklistData.items.forEach(item => {
      itemMap.set(item.id, item.title);
    });

    console.log(`Creating ZIP with ${checklistData.files.length} files`);
    
    // Process all files in parallel
    const downloadPromises = checklistData.files.map(async (file) => {
      try {
        // Get the file data from storage
        const { data: fileData, error: fileError } = await supabaseClient
          .storage
          .from('doccollect')
          .download(file.file_path);
        
        if (fileError || !fileData) {
          console.error(`Error downloading file ${file.file_path}:`, fileError);
          return null;
        }

        // Format the filename: prefix with item title if available
        let filename = file.filename;
        if (file.item_id && itemMap.has(file.item_id)) {
          filename = `${itemMap.get(file.item_id)} - ${filename}`;
        } else if (!file.item_id) {
          filename = `Unclassified - ${filename}`;
        }
        
        // Add the file to the ZIP
        const arrayBuffer = await fileData.arrayBuffer();
        zip.file(filename, arrayBuffer);
        
        console.log(`Added file to ZIP: ${filename}`);
        return true;
      } catch (err) {
        console.error(`Error processing file ${file.file_path}:`, err);
        return null;
      }
    });
    
    // Wait for all files to be processed
    await Promise.all(downloadPromises);
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: "nodebuffer" });
    
    // Create a filename for the ZIP
    const zipFilename = `DocCollect-${slug}-${new Date().toISOString().split('T')[0]}.zip`;
    
    // Upload the ZIP to Supabase storage temporarily
    const zipPath = `temp-zips/${slug}-${Date.now()}.zip`;
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('doccollect')
      .upload(zipPath, zipBlob, {
        contentType: 'application/zip',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Error uploading ZIP:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to create ZIP file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get a signed URL for the ZIP file that expires in 1 hour
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from('doccollect')
      .createSignedUrl(zipPath, 60 * 60, {
        download: zipFilename
      });
    
    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Schedule the ZIP file for deletion after 1 hour
    EdgeRuntime.waitUntil(
      (async () => {
        await new Promise(resolve => setTimeout(resolve, 60 * 60 * 1000)); // 1 hour
        await supabaseClient
          .storage
          .from('doccollect')
          .remove([zipPath]);
        console.log(`Removed temporary ZIP file: ${zipPath}`);
      })()
    );
    
    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
