
import React, { useState } from "react";
import { HelpCircle, Loader2, Trash2 } from "lucide-react";
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
  getFilesByItemId: (itemId: string) => ChecklistFile[];
  unclassifiedFiles: ChecklistFile[];
  isGlobalUploading: boolean;
  onMoveFile: (fileId: string, newItemId: string) => void;
  onDeleteFiles: (fileIds: string[]) => void;
}

const FileManagementTable: React.FC<FileManagementTableProps> = ({
  items,
  files,
  getItemStatus,
  getFilesByItemId,
  unclassifiedFiles,
  isGlobalUploading,
  onMoveFile,
  onDeleteFiles,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const allFiles = [...files];
  
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

  // Determine if all files are selected
  const allSelected = allFiles.length > 0 && selectedFiles.length === allFiles.length;
  
  // Determine if some but not all files are selected
  const someSelected = selectedFiles.length > 0 && selectedFiles.length < allFiles.length;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Document Requirements</h2>
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
                  checked={allSelected}
                  className={someSelected ? "opacity-60" : ""}
                />
              </TableHead>
              <TableHead className="w-[30%]">Requirement</TableHead>
              <TableHead className="w-[15%]">Status</TableHead>
              <TableHead className="w-[35%]">Uploaded File</TableHead>
              <TableHead className="w-[15%]">Actions</TableHead>
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
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">No requirements in this checklist.</p>
                </TableCell>
              </TableRow>
            ) : (
              <>
                {/* Render each requirement as a row */}
                {items.map((item) => {
                  const status = getItemStatus(item.id);
                  const itemFiles = getFilesByItemId(item.id);
                  
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        {itemFiles.length > 0 && (
                          <Checkbox 
                            checked={itemFiles.every(file => selectedFiles.includes(file.id))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedFiles(prev => [...prev, ...itemFiles.map(f => f.id)]);
                              } else {
                                setSelectedFiles(prev => prev.filter(id => !itemFiles.some(f => f.id === id)));
                              }
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                        )}
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
                        {itemFiles.length > 0 ? (
                          <div className="space-y-2">
                            {itemFiles.map(file => (
                              <div key={file.id} className="text-sm border-l-2 border-primary/30 pl-2">
                                {file.filename}
                                <div className="text-xs text-muted-foreground">
                                  Uploaded {new Date(file.uploaded_at).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No file uploaded</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {itemFiles.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            {itemFiles.map(file => (
                              <Select 
                                key={file.id}
                                onValueChange={(value) => handleMoveFile(file.id, value)}
                                defaultValue=""
                              >
                                <SelectTrigger className="w-[130px] h-8">
                                  <SelectValue placeholder="Move..." />
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
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })}
                
                {/* Render unclassified files section if any exist */}
                {unclassifiedFiles.length > 0 && (
                  <>
                    <TableRow className="bg-amber-50">
                      <TableCell colSpan={5} className="py-2">
                        <div className="font-medium">Unclassified Documents</div>
                      </TableCell>
                    </TableRow>
                    {unclassifiedFiles.map(file => (
                      <TableRow key={file.id} className="bg-amber-50/50">
                        <TableCell>
                          <Checkbox 
                            checked={selectedFiles.includes(file.id)} 
                            onCheckedChange={(checked) => handleSelectFile(file.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-amber-700">Unclassified</div>
                          <div className="text-xs text-muted-foreground">
                            AI couldn't determine which requirement this satisfies
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status="unclassified" />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {file.filename}
                            <div className="text-xs text-muted-foreground">
                              Uploaded {new Date(file.uploaded_at).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select 
                            onValueChange={(value) => handleMoveFile(file.id, value)}
                            defaultValue=""
                          >
                            <SelectTrigger className="w-[130px] h-8">
                              <SelectValue placeholder="Classify..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Assign to...</SelectItem>
                              {items.map(item => (
                                <SelectItem key={item.id} value={item.id}>
                                  {item.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                )}
                
                {/* Empty state when no files are uploaded */}
                {files.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No documents have been uploaded yet. Use the upload area above to add files.
                    </TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FileManagementTable;
