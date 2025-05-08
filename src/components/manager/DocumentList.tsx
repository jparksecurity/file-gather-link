
import React from "react";
import { FilesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checklist, ChecklistFile, ChecklistItem } from "@/types/checklist";
import DocumentItem from "./DocumentItem";

interface DocumentListProps {
  checklist: Checklist;
  onDownload: (file: ChecklistFile) => void;
  onDownloadAll: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  checklist, 
  onDownload,
  onDownloadAll
}) => {
  
  const getItemStatus = (itemId: string): 'missing' | 'uploaded' | 'unclassified' => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.item_id === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
  };

  const getItemFile = (itemId: string): ChecklistFile | null => {
    if (!checklist?.files?.length) return null;
    
    // Find uploaded file first, then unclassified if no uploaded file exists
    const uploadedFile = checklist.files.find(file => file.item_id === itemId && file.status === 'uploaded');
    if (uploadedFile) return uploadedFile;
    
    const unclassifiedFile = checklist.files.find(file => file.item_id === itemId && file.status === 'unclassified');
    return unclassifiedFile || null;
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Document Checklist Status</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDownloadAll}
          disabled={!checklist.files?.length}
        >
          <FilesIcon className="h-4 w-4 mr-1" /> Download All Files
        </Button>
      </div>
      
      {checklist.items.map((item: ChecklistItem) => {
        const status = getItemStatus(item.id);
        const file = getItemFile(item.id);
        
        return (
          <DocumentItem 
            key={item.id}
            item={item}
            file={file}
            status={status}
            onDownload={onDownload}
          />
        );
      })}
    </div>
  );
};

export default DocumentList;
