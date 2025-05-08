
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log("classify-document function called");
    
    // Parse request body and validate input
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body received:", JSON.stringify(requestBody));
    } catch (jsonError) {
      console.error("Error parsing request JSON:", jsonError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { fileUrl, items } = requestBody;

    if (!fileUrl) {
      console.error("Missing fileUrl parameter");
      return new Response(
        JSON.stringify({ error: 'Missing fileUrl parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("Missing or invalid items parameter");
      return new Response(
        JSON.stringify({ error: 'Missing or invalid items parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Download the PDF
    console.log("Downloading PDF from:", fileUrl);
    let response;
    try {
      response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error("Error fetching PDF:", fetchError);
      return new Response(
        JSON.stringify({ 
          status: 'unclassified', 
          item_id: null,
          error: `Error fetching PDF: ${fetchError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const pdfBytes = await response.arrayBuffer();
    
    // Extract text content from the PDF
    console.log("Extracting text from PDF");
    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(pdfBytes);
    } catch (pdfError) {
      console.error("Error loading PDF:", pdfError);
      return new Response(
        JSON.stringify({ 
          status: 'unclassified', 
          item_id: null,
          error: `Error loading PDF: ${pdfError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    // We don't have direct text extraction in PDF-lib, so let's use the filename as a fallback
    const filePathParts = fileUrl.split('/');
    const filename = filePathParts[filePathParts.length - 1];
    console.log("Using filename for classification:", filename);
    
    // Prepare the titles and descriptions for classification
    const itemDescriptions = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || ''
    }));
    
    console.log("Items for classification:", JSON.stringify(itemDescriptions));
    console.log("Sending to OpenAI for classification");
    
    // Check if OPENAI_API_KEY is available
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error("OpenAI API key is missing");
      return new Response(
        JSON.stringify({ 
          status: 'unclassified', 
          item_id: null,
          error: 'OpenAI API key is not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    try {
      // Make the request to OpenAI
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using gpt-4o-mini as a replacement for gpt-4.1-nano
          messages: [
            {
              role: 'system',
              content: 'You are an AI that classifies documents. You will receive a filename and a list of possible document categories. Your task is to determine which category the document belongs to based on the filename. Return only the ID of the matching category, or "unclassified" if you cannot determine a match with confidence.'
            },
            {
              role: 'user',
              content: `Filename: ${filename}\n\nPossible categories:\n${itemDescriptions.map(item => `ID: ${item.id}\nTitle: ${item.title}\nDescription: ${item.description}`).join('\n\n')}\n\nWhich category does this document belong to? Reply ONLY with the ID of the matching category, or "unclassified" if you cannot determine a match.`
            }
          ],
          temperature: 0.3,
          max_tokens: 50
        })
      });
      
      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        console.error("OpenAI API error:", errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error("OpenAI API error details:", JSON.stringify(errorData));
        } catch (e) {
          // Ignore if can't parse as JSON
        }
        return new Response(
          JSON.stringify({ 
            status: 'unclassified', 
            item_id: null,
            error: 'AI classification failed, marking as unclassified' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const openaiData = await openaiResponse.json();
      console.log("OpenAI response:", JSON.stringify(openaiData));
      
      let matchedItemId = openaiData.choices[0].message.content.trim();
      console.log("Raw matched item ID:", matchedItemId);
      
      // Validate the response
      const isValidItemId = itemDescriptions.some(item => item.id === matchedItemId);
      
      if (!isValidItemId && matchedItemId !== 'unclassified') {
        console.log(`Invalid item ID returned: ${matchedItemId}, marking as unclassified`);
        matchedItemId = 'unclassified';
      }
      
      const status = matchedItemId === 'unclassified' ? 'unclassified' : 'uploaded';
      const finalItemId = matchedItemId === 'unclassified' ? null : matchedItemId;
      
      console.log(`Classification complete. Status: ${status}, Item ID: ${finalItemId}`);
      
      return new Response(
        JSON.stringify({ 
          status, 
          item_id: finalItemId 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (openaiError) {
      console.error("Error calling OpenAI API:", openaiError);
      return new Response(
        JSON.stringify({ 
          status: 'unclassified', 
          item_id: null,
          error: `Error calling OpenAI API: ${openaiError.message}` 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in classify-document function:", error);
    
    return new Response(
      JSON.stringify({ 
        status: 'unclassified', 
        item_id: null,
        error: `Error during classification: ${error.message}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})
