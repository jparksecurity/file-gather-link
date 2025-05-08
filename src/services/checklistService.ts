import { supabase } from "@/integrations/supabase/client";
import { Checklist, ChecklistItem, ChecklistFile } from "@/types/checklist";
import { v4 as uuidv4 } from "uuid";

export async function createChecklist(items: Omit<ChecklistItem, 'id' | 'position'>[]) {
  try {
    // Generate unique slug and admin key
    const slug = uuidv4().replace(/-/g, "").substring(0, 16);
    const admin_key = uuidv4().replace(/-/g, "").substring(0, 16);
    
    // Create the public and manager URLs
    const public_url = `/${slug}`;
    const manager_url = `/${slug}/manage?key=${admin_key}`;
    
    // Insert the checklist
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .insert([{ slug, admin_key, public_url, manager_url }])
      .select('id, slug, admin_key, public_url, manager_url, created_at')
      .single();
    
    if (checklistError) throw checklistError;
    
    // Insert items with positions
    const checklistItems = items.map((item, index) => ({
      checklist_id: checklistData.id,
      title: item.title,
      description: item.description,
      position: index + 1
    }));
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('checklist_items')
      .insert(checklistItems)
      .select('id, title, description, position');
    
    if (itemsError) throw itemsError;
    
    // Return complete checklist object
    return {
      ...checklistData,
      items: itemsData,
      files: []
    } as Checklist;
  } catch (error) {
    console.error("Error creating checklist:", error);
    throw error;
  }
}

export async function getChecklist(slug: string, adminKey?: string) {
  try {
    // Get the checklist by slug
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .select('id, slug, admin_key, public_url, manager_url, created_at')
      .eq('slug', slug)
      .single();
    
    if (checklistError) throw checklistError;
    
    // Verify admin key if provided
    if (adminKey && checklistData.admin_key !== adminKey) {
      throw new Error("Invalid admin key");
    }
    
    // Get all items for this checklist
    const { data: itemsData, error: itemsError } = await supabase
      .from('checklist_items')
      .select('id, title, description, position')
      .eq('checklist_id', checklistData.id)
      .order('position', { ascending: true });
    
    if (itemsError) throw itemsError;
    
    // Get all files for this checklist
    const { data: filesData, error: filesError } = await supabase
      .from('checklist_files')
      .select('id, item_id, filename, status, uploaded_at, file_path')
      .eq('checklist_id', checklistData.id);
    
    if (filesError) throw filesError;
    
    // Ensure filesData has the correct status type
    const typedFilesData: ChecklistFile[] = filesData.map(file => ({
      ...file,
      status: file.status as "uploaded" | "unclassified"
    }));
    
    // Construct complete checklist
    const checklist: Checklist = {
      id: checklistData.id,
      slug: checklistData.slug,
      public_url: checklistData.public_url,
      manager_url: checklistData.manager_url,
      created_at: checklistData.created_at,
      items: itemsData,
      files: typedFilesData,
    };
    
    // Only include admin key if it was provided and valid
    if (adminKey) {
      checklist.admin_key = adminKey;
    }
    
    return checklist;
  } catch (error) {
    console.error("Error fetching checklist:", error);
    throw error;
  }
}

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
      // Check if the item already has a file attached
      const { data: existingFile, error: existingFileError } = await supabase
        .from('checklist_files')
        .select('id')
        .eq('checklist_id', checklistData.id)
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
          checklist_id: checklistData.id,
          item_id: itemId,
          filename: file.name,
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
    
    // If no itemId provided, continue with AI classification flow
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
      // Insert file record marked as unclassified
      const { data: fileData, error: fileError } = await supabase
        .from('checklist_files')
        .insert([{
          checklist_id: checklistData.id,
          item_id: null, // No item assigned
          filename: file.name,
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
    
    // Get the public URL for the file to send to the AI
    const { data: publicUrlData } = await supabase
      .storage
      .from('doccollect')
      .getPublicUrl(filePath);
    
    // Call the classify-document function using Supabase's function invocation
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
      const { data: fileData, error: fileError } = await supabase
        .from('checklist_files')
        .insert([{
          checklist_id: checklistData.id,
          item_id: null,
          filename: file.name,
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
    
  } catch (error) {
    console.error("Error uploading file:", error);
    
    // Check for common errors to provide better user feedback
    if (error.message && error.message.includes("duplicate key")) {
      throw new Error("This item already has a file uploaded");
    }
    
    throw error;
  }
}

export async function getDownloadUrl(filePath: string) {
  try {
    const { data, error } = await supabase
      .storage
      .from('doccollect')
      .createSignedUrl(filePath, 60 * 60, {
        download: true, // This forces a download instead of display in browser
        transform: {
          quality: 100 // Maintain original quality
        }
      }); 
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}
