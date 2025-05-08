
import React, { useState } from "react";
import { HelpCircle, Loader2, MoveIcon, Trash2 } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import { ChecklistItem, ChecklistFile } from "@/types/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface FileManagementTableProps {
  items: ChecklistItem[];
  files: ChecklistFile[];
  getItemStatus: (itemId: string) => 'missing' | 'uploaded' | 'unclassified';
  isGlobalUploading: boolean;
  onMoveFile: (fileId: string, newItemId: string) => void;
  onDeleteFiles: (fileIds: string[]) => void;
}

const FileManagementTable: React.FC<FileManagementTableProps> = ({
  items,
  files,
  getItemStatus,
  isGlobalUploading,
  onMoveFile,
  onDeleteFiles,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const allFiles = [...files.filter(f => f.item_id), ...files.filter(f => !f.item_id)];
  
  const handleSelectFile = (fileId: string, isChecked: boolean) => {
    if (isChecked) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };
  
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedFiles(allFiles.map(file => file.id));
    } else {
      setSelectedFiles([]);
    }
  };
  
  const handleMoveFile = (fileId: string, newItemId: string) => {
    onMoveFile(fileId, newItemId);
  };
  
  const handleDeleteSelected = () => {
    onDeleteFiles(selectedFiles);
    setSelectedFiles([]);
  };

  // Get file's current requirement title
  const getRequirementTitle = (fileItemId: string | null) => {
    if (!fileItemId) return "Unclassified";
    const item = items.find(i => i.id === fileItemId);
    return item ? item.title : "Unknown";
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Document Status</h2>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="sm" 
                disabled={selectedFiles.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete Selected
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Selected Files</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedFiles.length} file(s)? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <div className="border rounded-md overflow-hidden mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[5%]">
                <Checkbox 
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  checked={selectedFiles.length === allFiles.length && allFiles.length > 0}
                  indeterminate={selectedFiles.length > 0 && selectedFiles.length < allFiles.length}
                />
              </TableHead>
              <TableHead className="w-[30%]">Filename</TableHead>
              <TableHead className="w-[25%]">Current Requirement</TableHead>
              <TableHead className="w-[20%]">Status</TableHead>
              <TableHead className="w-[20%]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isGlobalUploading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                    <p>Processing your document...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : allFiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No documents uploaded yet.</p>
                </TableCell>
              </TableRow>
            ) : (
              allFiles.map((file) => {
                const status = file.item_id ? getItemStatus(file.item_id) : 'unclassified';
                const currentRequirement = getRequirementTitle(file.item_id);
                
                return (
                  <TableRow key={file.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedFiles.includes(file.id)} 
                        onCheckedChange={(checked) => handleSelectFile(file.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {file.filename}
                      <div className="text-xs text-muted-foreground">
                        Uploaded {new Date(file.uploaded_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {currentRequirement}
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
                      <div className="flex gap-2">
                        <Select 
                          onValueChange={(value) => handleMoveFile(file.id, value)}
                          defaultValue=""
                        >
                          <SelectTrigger className="w-[130px] h-8">
                            <SelectValue placeholder="Move to..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Move to...</SelectItem>
                            {items.map(item => (
                              <SelectItem key={item.id} value={item.id} disabled={item.id === file.item_id}>
                                {item.title}
                              </SelectItem>
                            ))}
                            <SelectItem value="unclassified" disabled={!file.item_id}>
                              Unclassified
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FileManagementTable;
