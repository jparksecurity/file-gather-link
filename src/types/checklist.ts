
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  position: number;
}

export interface ChecklistFile {
  id: string;
  item_id: string | null;
  filename: string;
  status: 'uploaded' | 'unclassified';
  uploaded_at: string;
  file_path: string;
}

export interface Checklist {
  id: string;
  slug: string;
  admin_key?: string;
  public_url: string;
  manager_url: string;
  items: ChecklistItem[];
  files?: ChecklistFile[];
  created_at: string;
}
