
import { supabase } from "@/integrations/supabase/client";
import { Checklist, ChecklistItem, ChecklistFile } from "@/types/checklist";
import { v4 as uuidv4 } from "uuid";

export async function createChecklist(items: Omit<ChecklistItem, 'id' | 'position'>[]) {
  try {
    // Generate unique slug and admin key
    const slug = uuidv4().replace(/-/g, "").substring(0, 16);
    const admin_key = uuidv4().replace(/-/g, "").substring(0, 16);
    
    // Insert the checklist
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .insert([{ slug, admin_key }])
      .select('id, slug, admin_key, created_at')
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
      .select('id, slug, admin_key, created_at')
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

export async function uploadFile(file: File, checklistSlug: string, itemId: string) {
  try {
    // Get checklist ID from slug
    const { data: checklistData, error: checklistError } = await supabase
      .from('checklists')
      .select('id')
      .eq('slug', checklistSlug)
      .single();
    
    if (checklistError) throw checklistError;
    
    // Upload file to storage
    const filePath = `${checklistSlug}/${itemId}/${uuidv4()}.pdf`;
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('doccollect')
      .upload(filePath, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
      });
    
    if (storageError) throw storageError;
    
    // TODO: In a real implementation, we would call an Edge Function here
    // to classify the file using AI, but for now we'll simulate it
    // with a simple random classification
    const status = Math.random() > 0.3 ? 'uploaded' as const : 'unclassified' as const;
    
    // Insert file record
    const { data: fileData, error: fileError } = await supabase
      .from('checklist_files')
      .insert([{
        checklist_id: checklistData.id,
        item_id: itemId,
        filename: file.name,
        file_path: filePath,
        status
      }])
      .select('id, item_id, filename, status, uploaded_at, file_path')
      .single();
    
    if (fileError) throw fileError;
    
    return {
      ...fileData,
      status: fileData.status as "uploaded" | "unclassified"
    } as ChecklistFile;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

export async function getDownloadUrl(filePath: string) {
  try {
    const { data, error } = await supabase
      .storage
      .from('doccollect')
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}
