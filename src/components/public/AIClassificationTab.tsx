
import React from "react";
import GlobalFileDropzone from "@/components/GlobalFileDropzone";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistItem, ChecklistFile } from "@/types/checklist";

interface AIClassificationTabProps {
  items: ChecklistItem[];
  getItemStatus: (itemId: string) => 'missing' | 'uploaded' | 'unclassified';
  handleFileUpload: (file: File) => void;
  isGlobalUploading: boolean;
  unclassifiedFiles: ChecklistFile[];
  onDeleteFile: (file: ChecklistFile) => void;
}

const AIClassificationTab: React.FC<AIClassificationTabProps> = ({
  items,
  getItemStatus,
  handleFileUpload,
  isGlobalUploading,
  unclassifiedFiles,
  onDeleteFile
}) => {
  // Track status of all items
  const allItemsUploaded = items.every(item => getItemStatus(item.id) === 'uploaded');
  
  return (
    <div className="space-y-8">
      <GlobalFileDropzone 
        onFileAccepted={handleFileUpload}
        disabled={isGlobalUploading || allItemsUploaded}
        className={allItemsUploaded ? "opacity-50" : ""}
      />

      {items.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Requirements Status</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map(item => (
              <div key={item.id} className="flex items-center rounded-md border p-3">
                <div className="flex-1 mr-2">
                  <p className="font-medium truncate">{item.title}</p>
                </div>
                <StatusBadge status={getItemStatus(item.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {unclassifiedFiles.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Unclassified Files</h3>
          <div className="space-y-4">
            {unclassifiedFiles.map(file => (
              <Card key={file.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-md">{file.filename}</CardTitle>
                      <CardDescription>
                        Uploaded {new Date(file.uploaded_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status="unclassified" />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => onDeleteFile(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This file couldn't be automatically matched to any requirement.
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIClassificationTab;
