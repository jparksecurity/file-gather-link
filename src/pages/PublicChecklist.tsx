import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checklist, ChecklistFile } from "@/types/checklist";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { getChecklist, uploadFile, deleteFile } from "@/services/checklistService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DeleteFileDialog from "@/components/DeleteFileDialog";

// Import new components
import Header from "@/components/public/Header";
import AIClassificationTab from "@/components/public/AIClassificationTab";
import ManualUploadTab from "@/components/public/ManualUploadTab";
import ImportantNotes from "@/components/public/ImportantNotes";

const PublicChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, string>>({});
  const [fileToDelete, setFileToDelete] = useState<ChecklistFile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: checklist, isLoading, error } = useQuery({
    queryKey: ['checklist', slug],
    queryFn: () => getChecklist(slug!),
    retry: 1,
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ file, itemId }: { file: File, itemId?: string }) => {
      // Add file to the uploading state with a status
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => ({ ...prev, [fileId]: itemId || 'global' }));
      
      return uploadFile(file, slug!, itemId)
        .finally(() => {
          // Remove from uploading state when done (regardless of success/failure)
          setUploadingFiles(prev => {
            const newState = { ...prev };
            delete newState[fileId];
            return newState;
          });
        });
    },
    onSuccess: (newFile: ChecklistFile) => {
      toast.success(newFile.status === 'unclassified' 
        ? "File uploaded but couldn't be classified automatically" 
        : "File uploaded successfully!");
      
      // Update the local cache with the new file
      queryClient.setQueryData<Checklist>(['checklist', slug], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          files: [...(old.files || []), newFile]
        };
      });
    },
    onError: (error: any) => {
      console.error("Error uploading file:", error);
      if (error.message === "This item already has a file uploaded") {
        toast.error("This requirement already has a file uploaded.");
      } else {
        toast.error(`Failed to upload file: ${error.message || "Please try again."}`);
      }
    }
  });

  const deleteFileMutation = useMutation({
    mutationFn: (file: ChecklistFile) => {
      return deleteFile(file.id, slug!);
    },
    onSuccess: () => {
      toast.success("File deleted successfully");
      
      // Close the dialog
      setIsDeleteDialogOpen(false);
      setFileToDelete(null);
      
      // Refetch the checklist data to update the UI
      queryClient.invalidateQueries({ queryKey: ['checklist', slug] });
    },
    onError: (error: any) => {
      console.error("Error deleting file:", error);
      toast.error(`Failed to delete file: ${error.message || "Please try again"}`);
      setIsDeleteDialogOpen(false);
    }
  });

  const handleFileUpload = async (file: File, itemId?: string) => {
    const message = itemId 
      ? "Uploading file for specific requirement..." 
      : "Uploading and classifying your file...";
    
    toast.info(message);
    uploadFileMutation.mutate({ file, itemId });
  };

  const handleDeleteFile = (file: ChecklistFile) => {
    setFileToDelete(file);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteFile = () => {
    if (fileToDelete) {
      deleteFileMutation.mutate(fileToDelete);
    }
  };

  const getItemStatus = (itemId: string) => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.item_id === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
  };

  const isItemHasFile = (itemId: string) => {
    if (!checklist?.files?.length) return false;
    return checklist.files.some(file => file.item_id === itemId);
  };

  // Function to get unclassified files
  const getUnclassifiedFiles = () => {
    if (!checklist?.files) return [];
    return checklist.files.filter(file => file.status === 'unclassified' && file.item_id === null);
  };

  // Check if a specific item is currently uploading
  const isItemUploading = (itemId: string) => {
    return Object.values(uploadingFiles).includes(itemId);
  };

  // Check if there's a global upload in progress
  const isGlobalUploading = () => {
    return Object.values(uploadingFiles).includes('global');
  };

  // Find the file associated with an item ID
  const getItemFile = (itemId: string): ChecklistFile | null => {
    if (!checklist?.files?.length) return null;
    return checklist.files.find(file => file.item_id === itemId) || null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !checklist) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Checklist not found or invalid link
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const unclassifiedFiles = getUnclassifiedFiles();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="container py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Document Checklist</h1>
          <p className="mb-6 text-muted-foreground">
            Please upload the requested PDFs. You can use AI to automatically classify your documents or upload directly to specific requirements.
          </p>

          <Tabs defaultValue="global">
            <TabsList className="mb-6">
              <TabsTrigger value="global">AI Classification</TabsTrigger>
              <TabsTrigger value="items">Manual Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="global">
              <AIClassificationTab 
                items={checklist.items}
                getItemStatus={getItemStatus}
                handleFileUpload={handleFileUpload}
                isGlobalUploading={isGlobalUploading()}
                unclassifiedFiles={unclassifiedFiles}
                onDeleteFile={handleDeleteFile}
              />
            </TabsContent>
            
            <TabsContent value="items">
              <ManualUploadTab 
                items={checklist.items}
                getItemStatus={getItemStatus}
                isItemHasFile={isItemHasFile}
                isItemUploading={isItemUploading}
                handleFileUpload={handleFileUpload}
                getItemFile={getItemFile}
                onDeleteFile={handleDeleteFile}
              />
            </TabsContent>
          </Tabs>
          
          <ImportantNotes />

          <DeleteFileDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            file={fileToDelete}
            onConfirm={confirmDeleteFile}
            isDeleting={deleteFileMutation.isPending}
          />
        </div>
      </main>
    </div>
  );
};

export default PublicChecklist;
