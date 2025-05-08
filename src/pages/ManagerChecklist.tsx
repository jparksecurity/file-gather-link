
import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checklist, ChecklistFile } from "@/types/checklist";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { FileCheck, AlertCircle, Download, Copy, HelpCircle, FilesIcon } from "lucide-react";
import { getChecklist, getDownloadUrl } from "@/services/checklistService";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const ManagerChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adminKey = searchParams.get('key');
  
  const { data: checklist, isLoading, error } = useQuery({
    queryKey: ['checklist', slug, adminKey],
    queryFn: () => getChecklist(slug!, adminKey || undefined),
    retry: 1,
    enabled: !!slug && !!adminKey,
  });

  const getItemStatus = (itemId: string) => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.item_id === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
  };

  const getItemFile = (itemId: string) => {
    if (!checklist?.files?.length) return null;
    
    // Find uploaded file first, then unclassified if no uploaded file exists
    const uploadedFile = checklist.files.find(file => file.item_id === itemId && file.status === 'uploaded');
    if (uploadedFile) return uploadedFile;
    
    const unclassifiedFile = checklist.files.find(file => file.item_id === itemId && file.status === 'unclassified');
    return unclassifiedFile;
  };

  const handleDownload = async (file: ChecklistFile) => {
    try {
      // Get the associated item title if this file is classified
      let itemTitle: string | undefined;
      
      if (file.item_id) {
        // Find the item associated with this file to get its title
        const associatedItem = checklist?.items.find(item => item.id === file.item_id);
        if (associatedItem) {
          itemTitle = associatedItem.title;
        }
      } else {
        // For unclassified files, use "Unclassified" as the prefix
        itemTitle = "Unclassified";
      }
      
      // Get the download URL and suggested filename
      const { signedUrl, downloadFilename } = await getDownloadUrl(
        file.file_path, 
        itemTitle, 
        file.filename
      );

      // Create a temporary link with the download attribute set
      const link = document.createElement('a');
      link.href = signedUrl;
      link.setAttribute('download', downloadFilename || file.filename);
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloading ${downloadFilename || file.filename}`);
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file. Please try again.");
    }
  };

  const downloadAllFiles = async () => {
    if (!checklist?.files?.length) {
      toast.info("No files to download");
      return;
    }

    toast.info("Preparing all files for download...");
    
    try {
      // Download each file with a small delay to prevent browser overload
      const files = [...(checklist.files || [])];
      
      // Create a counter for the download progress
      let downloadedCount = 0;
      const totalFiles = files.length;
      
      for (const file of files) {
        await handleDownload(file);
        downloadedCount++;
        
        // Add a small delay between downloads to prevent overwhelming the browser
        if (downloadedCount < totalFiles) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      toast.success(`Downloaded all ${files.length} files`);
    } catch (error) {
      console.error("Error downloading all files:", error);
      toast.error("Failed to download all files. Please try individually.");
    }
  };

  const copyPublicUrl = () => {
    // Use the stored public_url from the database
    const fullUrl = `${window.location.origin}${checklist?.public_url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Public URL copied to clipboard");
  };

  const copyManagerUrl = () => {
    // Use the stored manager_url from the database
    const fullUrl = `${window.location.origin}${checklist?.manager_url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Manager URL copied to clipboard");
  };

  // Function to get unclassified files
  const getUnclassifiedFiles = () => {
    if (!checklist?.files) return [];
    return checklist.files.filter(file => file.status === 'unclassified' && file.item_id === null);
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
            <AlertTitle>Access Error</AlertTitle>
            <AlertDescription>
              Checklist not found or you don't have permission to view it
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const unclassifiedFiles = getUnclassifiedFiles();

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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Document Manager</h1>
            <Badge variant="outline" className="text-sm">
              Admin View
            </Badge>
          </div>
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Share With Document Providers</CardTitle>
              <CardDescription>
                Send this public URL to people who need to upload documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-3 py-2 rounded-md flex-1 text-sm overflow-x-auto">
                  {window.location.origin}{checklist.public_url}
                </code>
                <Button size="icon" variant="outline" onClick={copyPublicUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 flex">
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">
                  <span className="text-amber-600">●</span> Important:
                </p>
                <p className="mt-1">
                  Save your manager URL (this page). It contains your secure admin key.
                </p>
              </div>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={copyManagerUrl}>
                Copy Manager URL
              </Button>
            </CardFooter>
          </Card>
          
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Document Checklist Status</h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadAllFiles}
              disabled={!checklist.files?.length}
            >
              <FilesIcon className="h-4 w-4 mr-1" /> Download All Files
            </Button>
          </div>
          
          <div className="space-y-6 mb-8">
            {checklist.items.map((item) => {
              const status = getItemStatus(item.id);
              const file = getItemFile(item.id);
              
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
                          onClick={() => handleDownload(file)}
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
            })}
          </div>
          
          {unclassifiedFiles.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Unclassified Files</h2>
              <div className="space-y-4">
                {unclassifiedFiles.map(file => (
                  <Card key={file.id}>
                    <CardHeader>
                      <div className="flex justify-between">
                        <CardTitle className="text-lg">{file.filename}</CardTitle>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <StatusBadge status="unclassified" />
                                <HelpCircle className="inline ml-1 h-4 w-4 text-amber-500" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>AI couldn't match this document to any requirement</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <CardDescription>
                        Uploaded {new Date(file.uploaded_at).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="bg-muted/50">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4 mr-1" /> Download
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800">Manager Instructions</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
              <li>Files are auto-classified by AI but may need review</li>
              <li>This manager URL gives full access to all documents</li>
              <li>Store your manager URL securely - it can't be recovered</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerChecklist;
