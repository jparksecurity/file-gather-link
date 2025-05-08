
import { supabase } from "@/integrations/supabase/client";
import { Checklist, ChecklistFile } from "@/types/checklist";

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
