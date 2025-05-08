import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChecklistItem } from "@/types/checklist";
import { Trash, Plus, FileCheck } from "lucide-react";
import { createChecklist } from "@/services/checklistService";

const ChecklistBuilder = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Omit<ChecklistItem, 'id' | 'position'>[]>([
    { title: "", description: "" }
  ]);
  const [isPublishing, setIsPublishing] = useState(false);

  const addItem = () => {
    if (items.length >= 10) {
      toast.error("You can add a maximum of 10 items");
      return;
    }
    setItems([...items, { title: "", description: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("You must have at least one item");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: "title" | "description", value: string) => {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const validateChecklist = () => {
    // Check if any title is empty
    const emptyTitles = items.some(item => !item.title.trim());
    if (emptyTitles) {
      toast.error("All items must have a title");
      return false;
    }
    
    // Check title length
    const longTitle = items.some(item => item.title.length > 100);
    if (longTitle) {
      toast.error("Titles must be 100 characters or less");
      return false;
    }
    
    // Check description length
    const longDesc = items.some(item => item.description.length > 300);
    if (longDesc) {
      toast.error("Descriptions must be 300 characters or less");
      return false;
    }
    
    return true;
  };

  const publishChecklist = async () => {
    if (!validateChecklist()) return;
    
    setIsPublishing(true);
    
    try {
      const checklist = await createChecklist(items);
      toast.success("Checklist published successfully!");
      
      // Navigate to the manager checklist view with admin key
      navigate(`/${checklist.slug}/manage?key=${checklist.admin_key}`);
    } catch (error) {
      console.error("Error publishing checklist:", error);
      toast.error("Failed to publish checklist. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  };

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
          <h1 className="text-3xl font-bold mb-6">Create Your Document Checklist</h1>
          <p className="mb-8 text-muted-foreground">
            Add up to 10 document items you want to collect. Once published, you'll receive unique links to share.
          </p>
          
          <div className="space-y-4 mb-8">
            {items.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Item {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor={`title-${index}`}>Document Title*</Label>
                    <div className="mt-1">
                      <Input
                        id={`title-${index}`}
                        placeholder="e.g., Resume, ID Card, Proof of Address"
                        value={item.title}
                        onChange={(e) => updateItem(index, "title", e.target.value)}
                        maxLength={100}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.title.length}/100 characters
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor={`description-${index}`}>Description (Optional)</Label>
                    <div className="mt-1">
                      <Textarea
                        id={`description-${index}`}
                        placeholder="Add details about the document requirements"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                        maxLength={300}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.description.length}/300 characters
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-between mb-8">
            <Button
              variant="outline"
              onClick={addItem}
              disabled={items.length >= 10}
            >
              <Plus className="size-4 mr-2" /> Add Item
            </Button>
            <p className="text-sm text-muted-foreground self-center">
              {items.length}/10 items
            </p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
            <h3 className="font-medium text-yellow-800">Important Notes</h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 mt-2">
              <li>After publishing, the checklist cannot be modified</li>
              <li>Save your manager URL — it's only shown once</li>
              <li>Files are automatically classified using AI</li>
              <li>Maximum file size is 100 MB per document</li>
            </ul>
          </div>
          
          <div className="flex justify-end">
            <Button 
              className="mr-4" 
              variant="outline" 
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>
            <Button 
              onClick={publishChecklist} 
              disabled={isPublishing}
            >
              {isPublishing ? "Publishing..." : "Publish Checklist"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChecklistBuilder;
