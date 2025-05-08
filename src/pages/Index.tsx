
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { FileCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

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

      <main className="container flex-1 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-4">
              Collect documents without the hassle
            </h1>
            <p className="text-xl text-muted-foreground">
              Create a checklist, share a link, and receive organized PDFs — no signup required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle>For Document Collectors</CardTitle>
                <CardDescription>
                  Recruiters, mortgage officers, freelancers, and more
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Create a checklist of up to 10 required PDFs</li>
                  <li>Share a simple link with document providers</li>
                  <li>Receive organized files automatically classified</li>
                  <li>Download submitted documents from a private URL</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={() => navigate("/build")}>
                  Create a Checklist
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>For Document Providers</CardTitle>
                <CardDescription>
                  Clients, applicants, candidates, and teammates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Receive a clear list of required documents</li>
                  <li>Drag and drop PDFs directly onto each item</li>
                  <li>Skip email threads and document naming conventions</li>
                  <li>See confirmation when documents are received</li>
                </ul>
              </CardContent>
              <CardFooter>
                <p className="text-sm text-muted-foreground text-center w-full">
                  No account needed — just upload when you receive a link
                </p>
              </CardFooter>
            </Card>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
            <h2 className="text-2xl font-semibold mb-4">Ready to streamline your document collection?</h2>
            <Button size="lg" onClick={() => navigate("/build")}>
              Get Started — It's Free
            </Button>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© 2025 DocCollect MVP — Built with Lovable</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
