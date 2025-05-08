
import React, { useEffect, useState } from "react";
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
import { Checklist } from "@/types/checklist";
import StatusBadge from "@/components/StatusBadge";
import { toast } from "sonner";
import { Check, FileCheck, AlertCircle, Download, Copy } from "lucide-react";

const ManagerChecklist = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const adminKey = searchParams.get('key');
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string>("");

  useEffect(() => {
    // Set the public URL
    setPublicUrl(`${window.location.origin}/${slug}`);
    
    // In a real app, this would be an API call to fetch the checklist with admin key validation
    const fetchChecklist = () => {
      setLoading(true);
      
      try {
        if (!adminKey) {
          setError("Admin key required to access this page");
          return;
        }
        
        const storedChecklist = localStorage.getItem(`checklist-${slug}`);
        
        if (!storedChecklist) {
          setError("Checklist not found");
          return;
        }
        
        const parsedChecklist = JSON.parse(storedChecklist);
        
        // Verify admin key (in a real app this would be done server-side)
        if (parsedChecklist.adminKey !== adminKey) {
          setError("Invalid admin key");
          return;
        }
        
        setChecklist(parsedChecklist);
      } catch (err) {
        console.error("Error fetching checklist:", err);
        setError("Failed to load checklist");
      } finally {
        setLoading(false);
      }
    };
    
    fetchChecklist();
    
    // Set an interval to refresh the checklist data every 30 seconds
    const interval = setInterval(() => {
      if (!adminKey) return;
      
      try {
        const storedChecklist = localStorage.getItem(`checklist-${slug}`);
        if (storedChecklist) {
          const parsedChecklist = JSON.parse(storedChecklist);
          setChecklist(parsedChecklist);
        }
      } catch (err) {
        console.error("Error refreshing checklist:", err);
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [slug, adminKey]);

  const getItemStatus = (itemId: string) => {
    if (!checklist?.files?.length) return 'missing';
    
    const itemFiles = checklist.files.filter(file => file.itemId === itemId);
    
    if (!itemFiles.length) return 'missing';
    
    if (itemFiles.some(file => file.status === 'uploaded')) return 'uploaded';
    
    return 'unclassified';
  };

  const getItemFile = (itemId: string) => {
    if (!checklist?.files?.length) return null;
    
    // Find uploaded file first, then unclassified if no uploaded file exists
    const uploadedFile = checklist.files.find(file => file.itemId === itemId && file.status === 'uploaded');
    if (uploadedFile) return uploadedFile;
    
    const unclassifiedFile = checklist.files.find(file => file.itemId === itemId && file.status === 'unclassified');
    return unclassifiedFile;
  };

  const handleDownload = (fileId: string, filename: string) => {
    // In a real app, this would be an API call to get a pre-signed URL
    toast.success(`Downloading ${filename}`);
    
    // For this MVP, we'll just show a toast since we don't actually have files stored
    toast.info("This is a demo - in a real app, the file would download now");
  };

  const copyPublicUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public URL copied to clipboard");
  };

  const copyManagerUrl = () => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}/manage?key=${adminKey}`);
    toast.success("Manager URL copied to clipboard");
  };

  const refreshPage = () => {
    window.location.reload();
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
            <AlertTitle>Access Error</AlertTitle>
            <AlertDescription>
              {error || "Checklist not found or you don't have permission to view it"}
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white shadow-sm py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="size-6 text-primary" />
            <h1 className="text-xl font-bold">DocCollect</h1>
          </div>
          <Button variant="outline" size="sm" onClick={refreshPage}>
            Refresh
          </Button>
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
                  {publicUrl}
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
          
          <h2 className="text-xl font-semibold mb-4">Document Checklist Status</h2>
          
          <div className="space-y-6 mb-8">
            {checklist.items.map((item, index) => {
              const status = getItemStatus(item.id);
              const file = getItemFile(item.id);
              
              return (
                <Card key={item.id} className={`relative ${status === 'uploaded' ? 'border-green-200' : ''}`}>
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
                    {file ? (
                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-md">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {new Date(file.uploadDate).toLocaleString()}
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownload(file.id, file.filename)}
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
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-800">Manager Instructions</h3>
            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
              <li>You may need to refresh the page to see the latest uploads</li>
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
