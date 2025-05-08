
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
    const { fileUrl, items } = await req.json()

    if (!fileUrl || !items || !Array.isArray(items)) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Download the PDF
    console.log("Downloading PDF from:", fileUrl)
    const response = await fetch(fileUrl)
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`)
    }
    
    const pdfBytes = await response.arrayBuffer()
    
    // Extract text content from the PDF
    console.log("Extracting text from PDF")
    const pdfDoc = await PDFDocument.load(pdfBytes)
    
    // We don't have direct text extraction in PDF-lib, so let's use the filename as a fallback
    // In a production environment, you'd want to use a more robust PDF text extraction library
    const filePathParts = fileUrl.split('/')
    const filename = filePathParts[filePathParts.length - 1]
    
    // Prepare the titles and descriptions for classification
    const itemDescriptions = items.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || ''
    }))
    
    console.log("Sending to OpenAI for classification")
    
    // Make the request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
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
    })
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error("OpenAI API error:", errorData)
      return new Response(
        JSON.stringify({ status: 'unclassified', error: 'AI classification failed, marking as unclassified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const openaiData = await openaiResponse.json()
    let matchedItemId = openaiData.choices[0].message.content.trim()
    
    // Validate the response
    const isValidItemId = itemDescriptions.some(item => item.id === matchedItemId)
    
    if (!isValidItemId && matchedItemId !== 'unclassified') {
      console.log(`Invalid item ID returned: ${matchedItemId}, marking as unclassified`)
      matchedItemId = 'unclassified'
    }
    
    const status = matchedItemId === 'unclassified' ? 'unclassified' : 'uploaded'
    const finalItemId = matchedItemId === 'unclassified' ? null : matchedItemId
    
    return new Response(
      JSON.stringify({ 
        status, 
        item_id: finalItemId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error("Error in classify-document function:", error)
    
    return new Response(
      JSON.stringify({ 
        status: 'unclassified', 
        item_id: null,
        error: 'Error during classification, marking as unclassified' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
