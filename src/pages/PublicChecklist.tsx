
import React from "react";
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
import StatusBadge from "@/components/StatusBadge";
import { FileCheck, AlertCircle } from "lucide-react";
import { getChecklist, uploadFile } from "@/services/checklistService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import GlobalFileDropzone from "@/components/GlobalFileDropzone";

const PublicChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: checklist, isLoading, error } = useQuery({
    queryKey: ['checklist', slug],
    queryFn: () => getChecklist(slug!),
    retry: 1,
  });

  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file, slug!),
    onSuccess: (newFile: ChecklistFile) => {
      toast.success("File uploaded and classified successfully!");
      
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
        toast.error("Failed to upload file. Please try again.");
      }
    }
  });

  const handleFileUpload = async (file: File) => {
    toast.info("Uploading and classifying your file...");
    uploadFileMutation.mutate(file);
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
          <p className="mb-6 text-muted-foreground">
            Please upload the requested PDFs. The system will automatically classify your documents.
          </p>

          <div className="mb-8">
            <GlobalFileDropzone onFileAccepted={handleFileUpload} />
          </div>

          <h2 className="text-xl font-semibold mb-4">Required Documents</h2>
          <div className="space-y-4 mb-8">
            {checklist.items.map((item) => {
              const status = getItemStatus(item.id);
              
              return (
                <Card key={item.id} className={status === 'uploaded' ? 'border-green-200' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <StatusBadge status={status} />
                    </div>
                    {item.description && (
                      <CardDescription>{item.description}</CardDescription>
                    )}
                  </CardHeader>
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
              <li>Each requirement can only have one file</li>
              <li>The AI will try to match your document to the correct requirement</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicChecklist;
