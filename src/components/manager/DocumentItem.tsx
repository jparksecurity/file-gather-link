
import React from "react";
import { Download, HelpCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { ChecklistFile, ChecklistItem } from "@/types/checklist";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DocumentItemProps {
  item: ChecklistItem;
  file: ChecklistFile | null;
  status: 'missing' | 'uploaded' | 'unclassified';
  onDownload: (file: ChecklistFile) => void;
}

const DocumentItem: React.FC<DocumentItemProps> = ({ item, file, status, onDownload }) => {
  return (
    <Card key={item.id} className={`relative ${status === 'uploaded' ? 'border-green-200' : ''}`}>
      <div className="absolute top-4 right-4">
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
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        {item.description && (
          <CardDescription>{item.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {file ? (
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
            <div className="flex-1">
              <p className="font-medium text-sm truncate">{file.filename}</p>
              <p className="text-xs text-muted-foreground">
                Uploaded {new Date(file.uploaded_at).toLocaleString()}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDownload(file)}
            >
              <Download className="h-4 w-4 mr-1" /> Download
            </Button>
          </div>
        ) : (
          <div className="text-center py-3 bg-slate-50 rounded-md">
            <p className="text-muted-foreground text-sm">No file uploaded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentItem;
