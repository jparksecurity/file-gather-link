
import React from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getChecklist, getDownloadUrl, getZipDownloadUrl } from "@/services/checklistService";
import { useQuery } from "@tanstack/react-query";
import { ChecklistFile } from "@/types/checklist";

// Import our components
import Header from "@/components/manager/Header";
import ShareSection from "@/components/manager/ShareSection";
import DocumentList from "@/components/manager/DocumentList";
import TableUnclassifiedFileList from "@/components/manager/TableUnclassifiedFileList";
import ManagerInstructions from "@/components/manager/ManagerInstructions";

const ManagerChecklist: React.FC = () => {
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

  // Function to get unclassified files
  const getUnclassifiedFiles = () => {
    if (!checklist?.files) return [];
    return checklist.files.filter(file => file.status === 'unclassified' && file.item_id === null);
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
    
    toast.info(`Preparing ZIP file with ${checklist.files.length} files...`);
    
    try {
      // Get the ZIP download URL
      const signedUrl = await getZipDownloadUrl(slug!, adminKey || undefined);
      
      // Trigger the download using the signed URL
      window.location.href = signedUrl;
      
      toast.success("ZIP download started");
    } catch (error) {
      console.error("Error downloading ZIP:", error);
      toast.error("Failed to create ZIP file. Please try again.");
    }
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
      <Header />

      <main className="container py-8 flex-1">
        <div className="max-w-5xl mx-auto"> {/* Increased max width for tables */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Document Manager</h1>
            <Badge variant="outline" className="text-sm">
              Admin View
            </Badge>
          </div>
          
          <ShareSection 
            publicUrl={checklist.public_url} 
            managerUrl={checklist.manager_url} 
          />
          
          <DocumentList
            checklist={checklist}
            onDownload={handleDownload}
            onDownloadAll={downloadAllFiles}
          />
          
          <TableUnclassifiedFileList
            files={unclassifiedFiles}
            onDownload={handleDownload}
          />
          
          <ManagerInstructions />
        </div>
      </main>
    </div>
  );
};

export default ManagerChecklist;
