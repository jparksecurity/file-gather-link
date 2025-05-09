
import React from "react";
import { HelpCircle, Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import StatusBadge from "@/components/StatusBadge";
import FileDropzone from "@/components/FileDropzone";
import { ChecklistItem } from "@/types/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ManualUploadTabProps {
  items: ChecklistItem[];
  getItemStatus: (itemId: string) => 'missing' | 'uploaded' | 'unclassified';
  isItemHasFile: (itemId: string) => boolean;
  isItemUploading: (itemId: string) => boolean;
  handleFileUpload: (file: File, itemId?: string) => void;
}

const ManualUploadTab: React.FC<ManualUploadTabProps> = ({
  items,
  getItemStatus,
  isItemHasFile,
  isItemUploading,
  handleFileUpload,
}) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manual Upload to Specific Requirements</h2>
      <div className="space-y-4 mb-8">
        {items.map((item) => {
          const status = getItemStatus(item.id);
          const hasFile = isItemHasFile(item.id);
          const isUploading = isItemUploading(item.id);
          
          return (
            <Card key={item.id} className={status === 'uploaded' ? 'border-green-200' : ''}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  {isUploading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-1 animate-spin text-amber-500" />
                      <span className="text-sm text-amber-500">Uploading...</span>
                    </div>
                  ) : (
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
                  )}
                </div>
                {item.description && (
                  <CardDescription>{item.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isUploading ? (
                  <div className="border border-dashed rounded-md p-4 h-24">
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="flex items-center mb-2">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="text-sm font-medium">Processing...</span>
                      </div>
                      <Progress value={undefined} className="h-1 w-2/3" />
                    </div>
                  </div>
                ) : (
                  <FileDropzone 
                    onFileAccepted={(file) => handleFileUpload(file, item.id)} 
                    itemId={item.id}
                    disabled={hasFile}
                    className="border border-dashed rounded-md p-4 h-24"
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Added extra spacing with mb-12 class */}
    </div>
  );
};

export default ManualUploadTab;
