
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
import { FileCheck, AlertCircle, HelpCircle } from "lucide-react";
import { getChecklist, uploadFile } from "@/services/checklistService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import GlobalFileDropzone from "@/components/GlobalFileDropzone";
import FileDropzone from "@/components/FileDropzone";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PublicChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: checklist, isLoading, error } = useQuery({
    queryKey: ['checklist', slug],
    queryFn: () => getChecklist(slug!),
    retry: 1,
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ file, itemId }: { file: File, itemId?: string }) => uploadFile(file, slug!, itemId),
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

  const handleFileUpload = async (file: File, itemId?: string) => {
    const message = itemId 
      ? "Uploading file for specific requirement..." 
      : "Uploading and classifying your file...";
    
    toast.info(message);
    uploadFileMutation.mutate({ file, itemId });
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
            Please upload the requested PDFs. You can use AI to automatically classify your documents or upload directly to specific requirements.
          </p>

          <Tabs defaultValue="global">
            <TabsList className="mb-6">
              <TabsTrigger value="global">AI Classification</TabsTrigger>
              <TabsTrigger value="items">Manual Upload</TabsTrigger>
            </TabsList>
            
            <TabsContent value="global">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">AI-Powered Document Classification</h2>
                <p className="mb-4 text-muted-foreground">
                  Drop any document here and our AI will analyze and classify it to the correct requirement.
                </p>
                <GlobalFileDropzone onFileAccepted={(file) => handleFileUpload(file)} />
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-3">Required Documents</h3>
                <div className="space-y-3">
                  {checklist.items.map((item) => {
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
            </TabsContent>
            
            <TabsContent value="items">
              <h2 className="text-xl font-semibold mb-4">Manual Upload to Specific Requirements</h2>
              <div className="space-y-4 mb-8">
                {checklist.items.map((item) => {
                  const status = getItemStatus(item.id);
                  const hasFile = isItemHasFile(item.id);
                  
                  return (
                    <Card key={item.id} className={status === 'uploaded' ? 'border-green-200' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{item.title}</CardTitle>
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
                        {item.description && (
                          <CardDescription>{item.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <FileDropzone 
                          onFileAccepted={(file) => handleFileUpload(file, item.id)} 
                          itemId={item.id}
                          disabled={hasFile}
                          className="border border-dashed rounded-md p-4 h-24"
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800">Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
              <li>Maximum file size is 100 MB per document</li>
              <li>Only PDF files are accepted</li>
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
