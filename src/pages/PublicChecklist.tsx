import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checklist, ChecklistFile } from "@/types/checklist";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { getChecklist, uploadFile } from "@/services/checklistService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Import components
import Header from "@/components/Header";
import GlobalFileDropzone from "@/components/GlobalFileDropzone";
import ImportantNotes from "@/components/public/ImportantNotes";
import FileManagementTable from "@/components/public/FileManagementTable";

const PublicChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, string>>({});

  const { data: checklist, isLoading, error } = useQuery({
    queryKey: ['checklist', slug],
    queryFn: () => getChecklist(slug!),
    retry: 1,
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: ({ file }: { file: File }) => {
      // Add file to the uploading state with a status
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => ({ ...prev, [fileId]: 'global' }));
      
      return uploadFile(file, slug!)
        .finally(() => {
          // Remove from uploading state when done
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
      queryClient.setQueryData<Checklist>(['checklist', slug], (oldData) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          files: [...(oldData.files || []), newFile]
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

  // Move file mutation
  const moveFileMutation = useMutation({
    mutationFn: async ({ fileId, newItemId }: { fileId: string; newItemId: string }) => {
      // This would call a backend service to move the file to a different category
      // For now, we'll mock the API call and just return a successful response
      try {
        const response = await fetch(`/api/files/${fileId}/move`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            slug: slug!, 
            newItemId: newItemId === 'unclassified' ? null : newItemId 
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to move file');
        }
        
        // Return file ID and new item ID for optimistic update
        return { fileId, newItemId: newItemId === 'unclassified' ? null : newItemId };
      } catch (error) {
        console.error('Error moving file:', error);
        throw error;
      }
    },
    onMutate: async ({ fileId, newItemId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['checklist', slug] });
      const previousChecklist = queryClient.getQueryData<Checklist>(['checklist', slug]);
      
      if (previousChecklist) {
        const newFiles = previousChecklist.files?.map(file => {
          if (file.id === fileId) {
            return {
              ...file,
              item_id: newItemId === 'unclassified' ? null : newItemId,
              status: newItemId === 'unclassified' ? 'unclassified' as const : 'uploaded' as const
            };
          }
          return file;
        });
        
        queryClient.setQueryData<Checklist>(['checklist', slug], old => {
          if (!old) return old;
          return { ...old, files: newFiles };
        });
      }
      
      return { previousChecklist };
    },
    onError: (err, _, context) => {
      toast.error('Failed to move file');
      if (context?.previousChecklist) {
        queryClient.setQueryData(['checklist', slug], context.previousChecklist);
      }
    },
    onSuccess: (result) => {
      const targetName = result.newItemId 
        ? checklist?.items.find(item => item.id === result.newItemId)?.title 
        : 'Unclassified';
      toast.success(`File moved to ${targetName}`);
    },
  });

  // Delete files mutation
  const deleteFilesMutation = useMutation({
    mutationFn: async (fileIds: string[]) => {
      // This would call a backend service to delete the files
      // For now, we'll mock the API call
      try {
        const response = await fetch(`/api/files/delete-batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            slug: slug!,
            fileIds
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete files');
        }
        
        return fileIds;
      } catch (error) {
        console.error('Error deleting files:', error);
        throw error;
      }
    },
    onMutate: async (fileIds) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['checklist', slug] });
      const previousChecklist = queryClient.getQueryData<Checklist>(['checklist', slug]);
      
      if (previousChecklist) {
        const newFiles = previousChecklist.files?.filter(file => !fileIds.includes(file.id));
        
        queryClient.setQueryData<Checklist>(['checklist', slug], old => {
          if (!old) return old;
          return { ...old, files: newFiles };
        });
      }
      
      return { previousChecklist };
    },
    onError: (err, _, context) => {
      toast.error('Failed to delete files');
      if (context?.previousChecklist) {
        queryClient.setQueryData(['checklist', slug], context.previousChecklist);
      }
    },
    onSuccess: (fileIds) => {
      toast.success(`${fileIds.length} ${fileIds.length === 1 ? 'file' : 'files'} deleted successfully`);
    },
  });

  const handleFileUpload = async (file: File) => {
    toast.info("Uploading and classifying your file...");
    uploadFileMutation.mutate({ file });
  };

  const handleMoveFile = (fileId: string, newItemId: string) => {
    if (newItemId) {
      moveFileMutation.mutate({ fileId, newItemId });
    }
  };

  const handleDeleteFiles = (fileIds: string[]) => {
    if (fileIds.length > 0) {
      deleteFilesMutation.mutate(fileIds);
    }
  };

  const getItemStatus = (itemId: string) => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.item_id === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
  };

  // Check if there's a global upload in progress
  const isGlobalUploading = () => {
    return Object.values(uploadingFiles).includes('global');
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="container py-8 flex-1">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Document Checklist</h1>
          <p className="mb-6 text-muted-foreground">
            Please upload the requested PDFs. Our AI will automatically analyze and classify your documents.
          </p>

          <div className="mb-8">
            {isGlobalUploading() ? (
              <div className="border border-primary/20 bg-primary/5 rounded-lg p-8 text-center">
                <div className="animate-pulse text-primary">
                  Processing your document...
                </div>
              </div>
            ) : (
              <GlobalFileDropzone onFileAccepted={handleFileUpload} />
            )}
          </div>
          
          <FileManagementTable 
            items={checklist.items}
            files={checklist.files || []}
            getItemStatus={getItemStatus}
            isGlobalUploading={isGlobalUploading()}
            onMoveFile={handleMoveFile}
            onDeleteFiles={handleDeleteFiles}
          />
          
          <div className="mt-12">
            <ImportantNotes />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicChecklist;
