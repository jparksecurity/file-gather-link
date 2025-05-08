
export interface ChecklistItem {
  id: string;
  title: string;
  description: string;
}

export interface ChecklistFile {
  id: string;
  itemId: string;
  filename: string;
  status: 'uploaded' | 'unclassified';
  uploadDate: string;
}

export interface Checklist {
  id: string;
  slug: string;
  adminKey?: string;
  items: ChecklistItem[];
  files?: ChecklistFile[];
  createdAt: string;
}
