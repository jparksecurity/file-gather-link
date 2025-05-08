
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
import { ChecklistFile } from "@/types/checklist";
import StatusBadge from "@/components/StatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UnclassifiedFileListProps {
  files: ChecklistFile[];
  onDownload: (file: ChecklistFile) => void;
}

const UnclassifiedFileList: React.FC<UnclassifiedFileListProps> = ({ files, onDownload }) => {
  if (!files.length) {
    return null;
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Unclassified Files</h2>
      <div className="space-y-4">
        {files.map(file => (
          <Card key={file.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{file.filename}</CardTitle>
                  <CardDescription>
                    Uploaded {new Date(file.uploaded_at).toLocaleString()}
                  </CardDescription>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <StatusBadge status="unclassified" />
                        <HelpCircle className="ml-1 h-4 w-4 text-amber-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI couldn't match this document to any requirement</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    This file couldn't be automatically classified by our AI
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UnclassifiedFileList;
