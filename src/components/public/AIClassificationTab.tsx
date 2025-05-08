
import React from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/StatusBadge";
import GlobalFileDropzone from "@/components/GlobalFileDropzone";
import { ChecklistItem, ChecklistFile } from "@/types/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIClassificationTabProps {
  items: ChecklistItem[];
  getItemStatus: (itemId: string) => 'missing' | 'uploaded' | 'unclassified';
  handleFileUpload: (file: File, itemId?: string) => void;
  isGlobalUploading: boolean;
  unclassifiedFiles: ChecklistFile[];
}

const AIClassificationTab: React.FC<AIClassificationTabProps> = ({
  items,
  getItemStatus,
  handleFileUpload,
  isGlobalUploading,
  unclassifiedFiles,
}) => {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">AI-Powered Document Classification</h2>
        <p className="mb-4 text-muted-foreground">
          Drop any document here and our AI will analyze and classify it to the correct requirement.
        </p>
        {isGlobalUploading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing your document...</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  AI is analyzing and classifying your file. This may take a few moments.
                </p>
                <div className="w-full max-w-md">
                  <Progress value={75} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <GlobalFileDropzone onFileAccepted={(file) => handleFileUpload(file)} />
        )}
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-3">Required Documents</h3>
        <div className="space-y-3">
          {items.map((item) => {
            const status = getItemStatus(item.id);
            
            return (
              <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-white">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
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
              </div>
            );
          })}
        </div>
      </div>
      
      {unclassifiedFiles.length > 0 && (
        <div className="mt-8 mb-12">
          <h3 className="text-lg font-medium mb-3 flex items-center">
            <span className="text-amber-600 mr-1">●</span> Unclassified Files
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <HelpCircle className="inline ml-1 h-4 w-4 text-amber-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI couldn't match these documents to any specific requirement</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </h3>
          <div className="space-y-3">
            {unclassifiedFiles.map((file) => (
              <div key={file.id} className="flex justify-between items-center p-3 border border-amber-200 rounded-lg bg-amber-50">
                <div>
                  <p className="font-medium">{file.filename}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded {new Date(file.uploaded_at).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status="unclassified" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIClassificationTab;
