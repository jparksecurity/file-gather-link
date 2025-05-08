
import React from "react";
import { ChecklistItem, ChecklistFile } from "@/types/checklist";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FileDropzone from "@/components/FileDropzone";
import StatusBadge from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ManualUploadTabProps {
  items: ChecklistItem[];
  getItemStatus: (itemId: string) => 'missing' | 'uploaded' | 'unclassified';
  isItemHasFile: (itemId: string) => boolean;
  isItemUploading: (itemId: string) => boolean;
  handleFileUpload: (file: File, itemId: string) => void;
  getItemFile?: (itemId: string) => ChecklistFile | null;
  onDeleteFile: (file: ChecklistFile) => void;
}

const ManualUploadTab: React.FC<ManualUploadTabProps> = ({
  items,
  getItemStatus,
  isItemHasFile,
  isItemUploading,
  handleFileUpload,
  getItemFile,
  onDeleteFile
}) => {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground mb-4">
        Drag and drop specific documents into each requirement box.
      </p>
      
      {items.map((item) => {
        const status = getItemStatus(item.id);
        const hasFile = isItemHasFile(item.id);
        const isUploading = isItemUploading(item.id);
        const file = getItemFile && getItemFile(item.id);
        
        return (
          <Card key={item.id} className={`${status === 'uploaded' ? 'border-green-200' : ''}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>{item.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={status} />
                  {hasFile && file && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => onDeleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              {item.description && (
                <CardDescription>{item.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {hasFile ? (
                <div className="bg-slate-50 p-4 rounded-md">
                  <p className="text-sm font-medium">
                    {file ? file.filename : "Document uploaded"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {file ? new Date(file.uploaded_at).toLocaleString() : ""}
                  </p>
                </div>
              ) : (
                <div className="h-32">
                  <FileDropzone
                    onFileAccepted={(file) => handleFileUpload(file, item.id)}
                    disabled={isUploading || hasFile}
                    itemId={item.id}
                    className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-md"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  );
};

export default ManualUploadTab;
