
import React from "react";
import { FilesIcon, Download, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checklist, ChecklistFile, ChecklistItem } from "@/types/checklist";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import StatusBadge from "@/components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  // Count the total number of downloadable files
  const totalDownloadableFiles = checklist.files?.length || 0;

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
          <FilesIcon className="h-4 w-4 mr-1" /> Download All as ZIP ({totalDownloadableFiles} files)
        </Button>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Document Requirement</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[25%]">File</TableHead>
              <TableHead className="w-[15%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklist.items.map((item: ChecklistItem) => {
              const status = getItemStatus(item.id);
              const file = getItemFile(item.id);
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div>{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <StatusBadge status={status} />
                            {status === 'unclassified' && (
                              <HelpCircle className="inline ml-1 h-4 w-4 text-amber-500" />
                            )}
                          </span>
                        </TooltipTrigger>
                        {status === 'unclassified' && (
                          <TooltipContent>
                            <p>AI couldn't classify this document with confidence</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    {file ? (
                      <div className="flex flex-col">
                        <span className="font-medium text-sm truncate">{file.filename}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(file.uploaded_at).toLocaleString()}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No file uploaded</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {file && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDownload(file)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DocumentList;
