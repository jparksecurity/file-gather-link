
import { supabase } from "@/integrations/supabase/client";
import { Checklist } from "@/types/checklist";
import { v4 as uuidv4 } from "uuid";

interface ChecklistItemInput {
  title: string;
  description: string;
}

export async function createChecklist(items: ChecklistItemInput[]) {
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
