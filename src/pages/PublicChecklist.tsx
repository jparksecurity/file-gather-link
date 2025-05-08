
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checklist, ChecklistFile } from "@/types/checklist";
import { toast } from "sonner";
import FileDropzone from "@/components/FileDropzone";
import StatusBadge from "@/components/StatusBadge";
import { FileCheck, AlertCircle } from "lucide-react";
import { getChecklist, uploadFile } from "@/services/checklistService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PublicChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: checklist, isLoading, error } = useQuery({
    queryKey: ['checklist', slug],
    queryFn: () => getChecklist(slug!),
    retry: 1,
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ file, itemId }: { file: File, itemId: string }) => 
      uploadFile(file, slug!, itemId),
    onSuccess: (newFile) => {
      toast.success("File uploaded successfully!");
      
      // Update the local cache with the new file
      queryClient.setQueryData<Checklist>(['checklist', slug], (old) => {
        if (!old) return old;
        
        return {
          ...old,
          files: [...(old.files || []), newFile]
        };
      });
    },
    onError: (error) => {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    }
  });

  const handleFileUpload = async (file: File, itemId: string) => {
    toast.info("Processing your file...");
    uploadFileMutation.mutate({ file, itemId });
  };

  const getItemStatus = (itemId: string) => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.item_id === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
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
      <header className="bg-white shadow-sm py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="size-6 text-primary" />
            <h1 className="text-xl font-bold">DocCollect</h1>
          </div>
        </div>
      </header>

      <main className="container py-8 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Document Checklist</h1>
          <p className="mb-8 text-muted-foreground">
            Please upload the requested PDFs. The system will automatically classify your documents.
          </p>

          <div className="space-y-6 mb-8">
            {checklist.items.map((item) => {
              const status = getItemStatus(item.id);
              const isUploaded = status === 'uploaded';
              
              return (
                <Card key={item.id} className="relative">
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={status} />
                  </div>
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                    {item.description && (
                      <CardDescription>{item.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <FileDropzone
                      itemId={item.id}
                      onFileAccepted={(file) => handleFileUpload(file, item.id)}
                      disabled={isUploaded}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800">Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
              <li>Maximum file size is 100 MB per document</li>
              <li>Only PDF files are accepted</li>
              <li>You may need to refresh the page to see updated status</li>
              <li>Contact the document requester if you have any questions</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicChecklist;
