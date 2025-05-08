
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

export async function uploadFile(file: File, checklistSlug: string) {
  try {
    // Get checklist ID from slug
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
    
    // In a real implementation, we would extract text from the PDF here
    // and use OpenAI's API to classify it based on checklist items
    
    // For now, we'll simulate AI classification with a simple algorithm
    // In a complete implementation, this would be replaced with an Edge Function call
    const items = checklistData.items as ChecklistItem[];
    
    // Check if any items already have files attached
    const { data: existingFiles, error: existingFilesError } = await supabase
      .from('checklist_files')
      .select('item_id')
      .eq('checklist_id', checklistData.id);
      
    if (existingFilesError) throw existingFilesError;
    
    // Filter out items that already have files
    const availableItems = items.filter(item => 
      !existingFiles.some(file => file.item_id === item.id)
    );
    
    // If no items are available, mark as unclassified
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
    
    // Simulate AI classification by using a simple heuristic:
    // 1. If filename contains any keywords from item titles/descriptions, match to that item
    // 2. Otherwise, randomly select an item with 70% chance, or mark as unclassified
    
    const fileName = file.name.toLowerCase();
    
    // Try to find a keyword match
    const matchedItem = availableItems.find(item => {
      const titleWords = item.title.toLowerCase().split(/\s+/);
      const descWords = item.description ? item.description.toLowerCase().split(/\s+/) : [];
      const allWords = [...titleWords, ...descWords];
      
      return allWords.some(word => 
        word.length > 3 && fileName.includes(word)
      );
    });
    
    if (matchedItem) {
      // We found a match based on keywords
      const { data: fileData, error: fileError } = await supabase
        .from('checklist_files')
        .insert([{
          checklist_id: checklistData.id,
          item_id: matchedItem.id,
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
    
    // No keyword match, decide randomly with 70% chance of assignment
    if (Math.random() <= 0.7) {
      // Randomly select an item
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      const selectedItem = availableItems[randomIndex];
      
      const { data: fileData, error: fileError } = await supabase
        .from('checklist_files')
        .insert([{
          checklist_id: checklistData.id,
          item_id: selectedItem.id,
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
    } else {
      // Mark as unclassified
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
      .createSignedUrl(filePath, 60 * 60); // 1 hour expiry
    
    if (error) throw error;
    
    return data.signedUrl;
  } catch (error) {
    console.error("Error generating download URL:", error);
    throw error;
  }
}
