
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

const PublicChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would be an API call to fetch the checklist
    const fetchChecklist = () => {
      setLoading(true);
      try {
        const storedChecklist = localStorage.getItem(`checklist-${slug}`);
        
        if (!storedChecklist) {
          setError("Checklist not found");
          return;
        }
        
        setChecklist(JSON.parse(storedChecklist));
      } catch (err) {
        console.error("Error fetching checklist:", err);
        setError("Failed to load checklist");
      } finally {
        setLoading(false);
      }
    };
    
    fetchChecklist();
  }, [slug]);

  const handleFileUpload = async (file: File, itemId: string) => {
    if (!checklist) return;
    
    // In a real app, this would be an API call to upload the file to Supabase
    try {
      toast.info("Processing your file...");
      
      // Simulate API delay and classification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock classification result - randomly classify as correct or unclassified
      const status = Math.random() > 0.3 ? 'uploaded' : 'unclassified';
      
      const newFile: ChecklistFile = {
        id: Math.random().toString(36).substring(7),
        itemId: itemId,
        filename: file.name,
        status: status,
        uploadDate: new Date().toISOString()
      };
      
      const updatedChecklist = {
        ...checklist,
        files: [...(checklist.files || []), newFile]
      };
      
      // Save to local storage
      localStorage.setItem(`checklist-${slug}`, JSON.stringify(updatedChecklist));
      
      // Update state
      setChecklist(updatedChecklist);
      
      if (status === 'uploaded') {
        toast.success("File uploaded successfully!");
      } else {
        toast.warning("File uploaded but couldn't be automatically classified");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file. Please try again.");
    }
  };

  const getItemStatus = (itemId: string) => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.itemId === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
  };

  if (loading) {
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
              {error || "Checklist not found or invalid link"}
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
            {checklist.items.map((item, index) => {
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
