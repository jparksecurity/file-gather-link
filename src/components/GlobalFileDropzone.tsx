
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload, FileType } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface GlobalFileDropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const GlobalFileDropzone: React.FC<GlobalFileDropzoneProps> = ({ 
  onFileAccepted, 
  disabled = false,
  className
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    
    if (files.length > 1) {
      toast.error('Please upload only one file at a time');
      return;
    }
    
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB
      toast.error('File size must be less than 100MB');
      return;
    }
    
    onFileAccepted(file);
  }, [disabled, onFileAccepted]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are accepted');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB
      toast.error('File size must be less than 100MB');
      return;
    }
    
    onFileAccepted(file);
  };

  return (
    <Card className={cn("border-dashed", isDragging && "border-primary bg-primary/5", className)}>
      <CardContent className="p-6">
        <div
          className={cn(
            "flex flex-col items-center justify-center gap-3 py-8",
            isDragging && "active",
            disabled && "opacity-50"
          )}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="rounded-full bg-primary/10 p-3">
            <FileType className="h-10 w-10 text-primary" />
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium">Drop any PDF document here</h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI will automatically classify and route your document to the correct requirement
            </p>
          </div>

          <input
            type="file"
            id="global-file-input"
            onChange={handleFileInputChange}
            className="hidden"
            accept="application/pdf"
            disabled={disabled}
          />
          
          <label
            htmlFor="global-file-input"
            className={cn(
              "mt-2 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Upload className="h-4 w-4 mr-2" />
            Browse Files
          </label>
          
          <p className="text-xs text-muted-foreground mt-2">
            Max file size: 100MB. PDF files only.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlobalFileDropzone;
