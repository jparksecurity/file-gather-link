
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { OpenAI } from "https://esm.sh/openai@4.26.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  return null
}

// Parse and validate request body
async function parseRequestBody(req: Request) {
  try {
    const requestBody = await req.json();
    console.log("Request body received:", JSON.stringify(requestBody));
    
    const { fileUrl, items } = requestBody;

    if (!fileUrl) {
      throw new Error('Missing fileUrl parameter');
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Missing or invalid items parameter');
    }
    
    return { fileUrl, items };
  } catch (error) {
    console.error("Error parsing request JSON:", error);
    throw error;
  }
}

// Download and process PDF
async function downloadPDF(fileUrl: string) {
  console.log("Downloading PDF from:", fileUrl);
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }
    
    // Get PDF as array buffer and convert to base64
    const pdfBytes = await response.arrayBuffer();
    
    // Convert PDF to base64 for OpenAI API
    const base64Pdf = btoa(
      new Uint8Array(pdfBytes)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    // Get filename for additional context
    const filePathParts = fileUrl.split('/');
    const filename = filePathParts[filePathParts.length - 1];
    console.log("PDF filename for classification:", filename);
    
    return { base64Pdf, filename };
  } catch (error) {
    console.error("Error fetching PDF:", error);
    throw error;
  }
}

// Initialize OpenAI client
function initializeOpenAI() {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    console.error("OpenAI API key is missing");
    throw new Error('OpenAI API key is not configured');
  }
  
  return new OpenAI({
    apiKey: openaiApiKey
  });
}

// Classify document using OpenAI
async function classifyDocument(openai: OpenAI, base64Pdf: string, filename: string, items: any[]) {
  try {
    // Create the text description of the categories
    const itemsText = items.map(item => 
      `ID: ${item.id}\nTitle: ${item.title}\nDescription: ${item.description}`
    ).join('\n\n');
    
    console.log("Using PDF content for classification");
    
    // Create the prompt for OpenAI
    const messages = [
      {
        role: "system",
        content: "You are an AI document classifier. You will receive a PDF document and a list of possible document categories. Your task is to determine which category the document belongs to based on its content. Return only the ID of the matching category, or 'unclassified' if you cannot determine a match with confidence."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Please classify this PDF document into one of these categories:\n\n${itemsText}\n\nWhich category does this document most likely belong to? Reply ONLY with the ID of the matching category, or "unclassified" if you cannot determine a match.`
          },
          {
            type: "file",
            file: {
              filename: filename,
              file_data: `data:application/pdf;base64,${base64Pdf}`
            }
          }
        ]
      }
    ];
    
    // Log the prompt structure for debugging (without the base64 data for brevity)
    const debugMessages = JSON.parse(JSON.stringify(messages));
    if (debugMessages[1]?.content?.[1]?.file?.file_data) {
      // Replace the base64 data with a placeholder to avoid huge logs
      debugMessages[1].content[1].file.file_data = '[BASE64_PDF_DATA]';
    }
    console.log("OpenAI prompt structure:", JSON.stringify(debugMessages, null, 2));
    
    // Call OpenAI with the PDF content and proper formatting
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: messages,
      temperature: 0,
    });
    
    console.log("OpenAI response:", JSON.stringify(chatCompletion));
    
    return chatCompletion.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

// Validate and format classification result
function processClassificationResult(matchedItemId: string, items: any[]) {
  console.log("Raw matched item ID:", matchedItemId);
  
  // Validate the response
  const isValidItemId = items.some(item => item.id === matchedItemId);
  
  if (!isValidItemId && matchedItemId !== 'unclassified') {
    console.log(`Invalid item ID returned: ${matchedItemId}, marking as unclassified`);
    return { status: 'unclassified', item_id: null };
  }
  
  const status = matchedItemId === 'unclassified' ? 'unclassified' : 'uploaded';
  const finalItemId = matchedItemId === 'unclassified' ? null : matchedItemId;
  
  console.log(`Classification complete. Status: ${status}, Item ID: ${finalItemId}`);
  
  return { status, item_id: finalItemId };
}

// Create error response
function createErrorResponse(message: string, status = 500) {
  return new Response(
    JSON.stringify({ 
      status: 'unclassified', 
      item_id: null,
      error: message 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status }
  );
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    console.log("classify-document function called");
    
    // Parse and validate request
    const { fileUrl, items } = await parseRequestBody(req);
    
    // Download and process PDF
    const { base64Pdf, filename } = await downloadPDF(fileUrl);
    
    // Initialize OpenAI
    const openai = initializeOpenAI();
    
    // Classify document
    const matchedItemId = await classifyDocument(openai, base64Pdf, filename, items);
    
    // Process and validate result
    const result = processClassificationResult(matchedItemId, items);
    
    // Return classification result
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error("Error in classify-document function:", error);
    return createErrorResponse(`Error during classification: ${error.message}`);
  }
})
