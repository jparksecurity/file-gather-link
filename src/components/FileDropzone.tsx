
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileDropzoneProps {
  onFileAccepted: (file: File) => void;
  disabled?: boolean;
  itemId: string;
  className?: string;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({ 
  onFileAccepted, 
  disabled = false,
  itemId,
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
    <div
      className={cn(
        "dropzone",
        isDragging && "active",
        disabled && "disabled",
        className
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        type="file"
        id={`file-input-${itemId}`}
        onChange={handleFileInputChange}
        className="hidden"
        accept="application/pdf"
        disabled={disabled}
      />
      <label
        htmlFor={`file-input-${itemId}`}
        className={cn(
          "cursor-pointer flex flex-col items-center",
          disabled && "cursor-not-allowed"
        )}
      >
        <Upload className="h-8 w-8 mb-3 text-gray-400" />
        <span className="text-sm font-medium">
          {disabled ? "Already uploaded" : "Drag & drop your PDF here"}
        </span>
        <span className="text-xs text-gray-500 mt-1">
          {disabled ? "Contact administrator to replace" : "or click to browse"}
        </span>
      </label>
    </div>
  );
};

export default FileDropzone;
