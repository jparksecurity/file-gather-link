
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { PDFDocument } from "https://cdn.skypack.dev/pdf-lib@1.17.1"
import { OpenAI } from "https://esm.sh/openai@4.26.0"

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
    
    // Get filename for additional context
    const filePathParts = fileUrl.split('/');
    const filename = filePathParts[filePathParts.length - 1];
    console.log("PDF filename for classification:", filename);
    
    // Initialize OpenAI client
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
    
    const openai = new OpenAI({
      apiKey: openaiApiKey
    });
    
    // Prepare the items for classification
    const itemDescriptions = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || ''
    }));
    
    console.log("Items for classification:", JSON.stringify(itemDescriptions));
    
    try {
      // Convert PDF to base64 for OpenAI API
      const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));
      
      // Call OpenAI with the PDF content for classification
      console.log("Sending to OpenAI for classification with PDF content");
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using gpt-4o-mini as a replacement for gpt-4.1-nano
        messages: [
          {
            role: "system",
            content: "You are an AI document classifier. You will receive a PDF document and a list of possible document categories. Your task is to determine which category the document belongs to based on its content. Return only the ID of the matching category, or 'unclassified' if you cannot determine a match with confidence."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `I'm sending a PDF document. Please classify it into one of these categories:\n\n${itemDescriptions.map(item => `ID: ${item.id}\nTitle: ${item.title}\nDescription: ${item.description}`).join('\n\n')}\n\nWhich category does this document belong to? Reply ONLY with the ID of the matching category, or "unclassified" if you cannot determine a match.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 50
      });
      
      console.log("OpenAI response:", JSON.stringify(chatCompletion));
      
      const matchedItemId = chatCompletion.choices[0].message.content.trim();
      console.log("Raw matched item ID:", matchedItemId);
      
      // Validate the response
      const isValidItemId = itemDescriptions.some(item => item.id === matchedItemId);
      
      if (!isValidItemId && matchedItemId !== 'unclassified') {
        console.log(`Invalid item ID returned: ${matchedItemId}, marking as unclassified`);
        return new Response(
          JSON.stringify({ 
            status: 'unclassified', 
            item_id: null 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
