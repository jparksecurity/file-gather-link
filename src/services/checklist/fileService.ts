import { supabase } from "@/integrations/supabase/client";
import { ChecklistFile, ChecklistItem } from "@/types/checklist";
import { v4 as uuidv4 } from "uuid";

export async function uploadFile(file: File, checklistSlug: string, itemId?: string) {
  try {
    // Get checklist ID and items from slug
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .select('id, items:checklist_items(id, title, description)')
      .eq('slug', checklistSlug)
      .single();
    
    if (checklistError) throw checklistError;
    
    // Generate unique ID for the file
    const fileId = uuidv4();
    
    // Upload file to storage with a unique path
    const filePath = `${checklistSlug}/${fileId}.pdf`;
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('doccollect')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });
    
    if (storageError) throw storageError;

    // Direct upload to a specific item if itemId is provided
    if (itemId) {
      return await handleItemSpecificUpload(checklistData.id, itemId, file.name, filePath);
    }
    
    // If no itemId provided, continue with AI classification flow
    return await handleAIClassificationUpload(checklistData, file, filePath);
    
  } catch (error) {
    console.error("Error uploading file:", error);
    
    // Check for common errors to provide better user feedback
    if (error.message && error.message.includes("duplicate key")) {
      throw new Error("This item already has a file uploaded");
    }
    
    throw error;
  }
}

async function handleItemSpecificUpload(checklistId: string, itemId: string, filename: string, filePath: string): Promise<ChecklistFile> {
  // Check if the item already has a file attached
  const { data: existingFile, error: existingFileError } = await supabase
    .from('checklist_files')
    .select('id')
    .eq('checklist_id', checklistId)
    .eq('item_id', itemId)
    .maybeSingle();
  
  if (existingFileError) throw existingFileError;
  
  // If there's already a file for this item, throw an error
  if (existingFile) {
    throw new Error("This item already has a file uploaded");
  }
  
  // Insert file record for the specific item
  const { data: fileData, error: fileError } = await supabase
    .from('checklist_files')
    .insert([{
      checklist_id: checklistId,
      item_id: itemId,
      filename: filename,
      file_path: filePath,
      status: 'uploaded'
    }])
    .select('id, item_id, filename, status, uploaded_at, file_path')
    .single();
  
  if (fileError) throw fileError;
  
  return {
    ...fileData,
    status: fileData.status as "uploaded" | "unclassified"
  } as ChecklistFile;
}

async function handleAIClassificationUpload(checklistData: any, file: File, filePath: string): Promise<ChecklistFile> {
  // Check if any items already have files attached
  const { data: existingFiles, error: existingFilesError } = await supabase
    .from('checklist_files')
    .select('item_id')
    .eq('checklist_id', checklistData.id)
    .not('item_id', 'is', null);
    
  if (existingFilesError) throw existingFilesError;
  
  // Filter out items that already have files
  const items = checklistData.items as ChecklistItem[];
  const availableItems = items.filter(item => 
    !existingFiles.some(file => file.item_id === item.id)
  );
  
  // If no items are available for classification, mark as unclassified
  if (availableItems.length === 0) {
    return await saveUnclassifiedFile(checklistData.id, file.name, filePath);
  }
  
  // Get the public URL for the file to send to the AI
  const { data: publicUrlData } = await supabase
    .storage
    .from('doccollect')
    .getPublicUrl(filePath);
  
  try {
    console.log("Calling classification API with URL:", publicUrlData.publicUrl);
    console.log("Available items:", availableItems);
    
    // Use supabase.functions.invoke instead of a direct fetch
    const { data: classificationResult, error: functionError } = await supabase.functions.invoke(
      'classify-document', 
      {
        body: JSON.stringify({
          fileUrl: publicUrlData.publicUrl,
          items: availableItems
        })
      }
    );
    
    if (functionError) {
      console.error("Function invocation error:", functionError);
      throw new Error(`Classification failed: ${functionError.message || 'Unknown error'}`);
    }
    
    if (!classificationResult) {
      console.error("Empty classification result");
      throw new Error("No classification result returned");
    }
    
    console.log("Classification result:", classificationResult);
    
    const { status, item_id } = classificationResult;
    
    // Insert file record with the classification result
    const { data: fileData, error: fileError } = await supabase
      .from('checklist_files')
      .insert([{
        checklist_id: checklistData.id,
        item_id: item_id, // This can be null for unclassified
        filename: file.name,
        file_path: filePath,
        status: status
      }])
      .select('id, item_id, filename, status, uploaded_at, file_path')
      .single();
    
    if (fileError) throw fileError;
    
    return {
      ...fileData,
      status: fileData.status as "uploaded" | "unclassified"
    } as ChecklistFile;
  } catch (classificationError) {
    console.error("Classification error:", classificationError);
    
    // Insert file as unclassified on any error during classification
    return await saveUnclassifiedFile(checklistData.id, file.name, filePath);
  }
}

async function saveUnclassifiedFile(checklistId: string, filename: string, filePath: string): Promise<ChecklistFile> {
  const { data: fileData, error: fileError } = await supabase
    .from('checklist_files')
    .insert([{
      checklist_id: checklistId,
      item_id: null,
      filename: filename,
      file_path: filePath,
      status: 'unclassified'
    }])
    .select('id, item_id, filename, status, uploaded_at, file_path')
    .single();
  
  if (fileError) throw fileError;
  
  return {
    ...fileData,
    status: fileData.status as "uploaded" | "unclassified"
  } as ChecklistFile;
}

export async function getDownloadUrl(filePath: string, itemTitle?: string, filename?: string) {
  try {
    // Create a signed URL with download flag set to true and filename parameter
    let downloadFilename = filename;
    
    // If we have both an item title and filename, combine them
    if (itemTitle && filename) {
      downloadFilename = `${itemTitle} - ${filename}`;
    }
    
    const { data, error } = await supabase
      .storage
      .from('doccollect')
      .createSignedUrl(filePath, 60 * 60, {
        download: downloadFilename, // Pass the formatted filename directly to the download parameter
      }); 
    
    if (error) throw error;
    
    return {
      signedUrl: data.signedUrl,
      downloadFilename
    };
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}

export async function moveFile(fileId: string, newItemId: string | null, slug: string) {
  try {
    console.log(`Moving file ${fileId} to item ${newItemId} in checklist ${slug}`);
    
    // Get checklist ID from slug
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (checklistError) {
      console.error("Checklist error:", checklistError);
      throw checklistError;
    }
    
    if (!checklistData) {
      console.error("No checklist found with slug:", slug);
      throw new Error("Checklist not found");
    }
    
    console.log("Found checklist:", checklistData.id);
    
    // Check if the target item exists when moving to a specific item
    if (newItemId) {
      const { data: itemExists, error: itemError } = await supabase
        .from('checklist_items')
        .select('id')
        .eq('id', newItemId)
        .eq('checklist_id', checklistData.id)
        .maybeSingle();
      
      if (itemError) {
        console.error("Item check error:", itemError);
        throw itemError;
      }
      
      if (!itemExists) {
        console.error("Target item not found:", newItemId);
        throw new Error("Target item not found");
      }
      
      console.log("Target item exists:", newItemId);
      
      // Check if the target item already has a file
      const { data: existingFile, error: existingFileError } = await supabase
        .from('checklist_files')
        .select('id')
        .eq('checklist_id', checklistData.id)
        .eq('item_id', newItemId)
        .maybeSingle();
      
      if (existingFileError) {
        console.error("Existing file check error:", existingFileError);
        throw existingFileError;
      }
      
      if (existingFile) {
        console.error("Item already has a file:", newItemId);
        throw new Error("This item already has a file uploaded");
      }
      
      console.log("Item does not have a file yet, can proceed with update");
    }
    
    // Check if the file exists and belongs to this checklist
    const { data: fileData, error: fileExistsError } = await supabase
      .from('checklist_files')
      .select('id')
      .eq('id', fileId)
      .eq('checklist_id', checklistData.id)
      .maybeSingle();
    
    if (fileExistsError) {
      console.error("File exists check error:", fileExistsError);
      throw fileExistsError;
    }
    
    if (!fileData) {
      console.error("File not found or does not belong to this checklist");
      throw new Error("File not found or does not belong to this checklist");
    }
    
    console.log("File exists and belongs to this checklist:", fileId);
    
    // Update the file record with the new item ID
    const { data: updatedFile, error: updateError } = await supabase
      .from('checklist_files')
      .update({
        item_id: newItemId,
        status: newItemId ? 'uploaded' : 'unclassified'
      })
      .eq('id', fileId)
      .eq('checklist_id', checklistData.id)
      .select()
      .single();
    
    if (updateError) {
      console.error("Update error details:", updateError);
      throw new Error(`Failed to update file: ${updateError.message}`);
    }
    
    if (!updatedFile) {
      console.error("No file was updated");
      throw new Error("No file was updated - it might not exist or belong to this checklist");
    }
    
    console.log("File successfully updated:", updatedFile);
    
    return {
      ...updatedFile,
      status: updatedFile.status as "uploaded" | "unclassified"
    } as ChecklistFile;
  } catch (error) {
    console.error("Error moving file:", error);
    throw error;
  }
}
