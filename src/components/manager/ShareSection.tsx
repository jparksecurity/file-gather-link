
import React from "react";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ShareSectionProps {
  publicUrl: string;
  managerUrl: string;
}

const ShareSection: React.FC<ShareSectionProps> = ({ publicUrl, managerUrl }) => {
  const copyPublicUrl = () => {
    const fullUrl = `${window.location.origin}${publicUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Public URL copied to clipboard");
  };

  const copyManagerUrl = () => {
    const fullUrl = `${window.location.origin}${managerUrl}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("Manager URL copied to clipboard");
  };

  return (
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
            {window.location.origin}{publicUrl}
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
  );
};

export default ShareSection;
