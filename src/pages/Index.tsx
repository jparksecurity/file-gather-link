
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, CheckCircle2, Upload, FileCheck, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm py-6 border-b border-border/40">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="size-6 text-primary" />
            <h1 className="text-xl font-medium">DocCollect</h1>
          </div>
        </div>
      </header>
      
      <main className="container py-16 flex flex-col gap-16">
        <section className="text-center max-w-3xl mx-auto animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-semibold mb-6 tracking-tight">
            Streamlined document collection for professionals
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Create a zero-signup document collection page and let AI automatically organize uploads for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg" className="hover-lift">
              <Link to="/build" className="group">
                <FileUp className="mr-2 h-5 w-5" />
                Create Checklist
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="card-shadow border-border/40 overflow-hidden">
            <CardHeader className="bg-accent/50 border-b border-border/30">
              <CardTitle className="text-xl">Create</CardTitle>
              <CardDescription className="text-muted-foreground">
                Build your document checklist with up to 10 requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-48 flex items-center justify-center rounded-md border border-border/60 p-4 bg-background">
                <div className="text-center space-y-3">
                  <CheckCircle2 className="h-10 w-10 text-primary/80 mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Define titles and descriptions<br />for each required document
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow border-border/40 overflow-hidden">
            <CardHeader className="bg-accent/50 border-b border-border/30">
              <CardTitle className="text-xl">Share</CardTitle>
              <CardDescription className="text-muted-foreground">
                Share the public link with document providers
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-48 flex items-center justify-center rounded-md border border-border/60 p-4 bg-background">
                <div className="text-center space-y-3">
                  <Upload className="h-10 w-10 text-primary/80 mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Drop PDFs directly or use<br />AI-powered classification
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow border-border/40 overflow-hidden">
            <CardHeader className="bg-accent/50 border-b border-border/30">
              <CardTitle className="text-xl">Manage</CardTitle>
              <CardDescription className="text-muted-foreground">
                Use the private manager link to download documents
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-48 flex items-center justify-center rounded-md border border-border/60 p-4 bg-background">
                <div className="text-center space-y-3">
                  <FileCheck className="h-10 w-10 text-primary/80 mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Track status and download<br />all submitted documents
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-3xl mx-auto bg-card rounded-lg shadow-subtle p-8 border border-border/40">
          <h2 className="text-2xl font-medium mb-6 text-center">How it works</h2>
          <ol className="space-y-6">
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">1</div>
              <div>
                <h3 className="text-lg font-medium mb-2">Create your document checklist</h3>
                <p className="text-muted-foreground">
                  Create a checklist with up to 10 required documents. Each item can have a title and description.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">2</div>
              <div>
                <h3 className="text-lg font-medium mb-2">Share the public link</h3>
                <p className="text-muted-foreground">
                  After publishing, you'll get two links: a public link for document providers to upload files, and a private link for you to manage submissions.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">3</div>
              <div>
                <h3 className="text-lg font-medium mb-2">Let AI organize uploads</h3>
                <p className="text-muted-foreground">
                  Document providers can either upload directly to specific requirements or use the AI classification that automatically routes documents to the correct requirement.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">4</div>
              <div>
                <h3 className="text-lg font-medium mb-2">Download and verify</h3>
                <p className="text-muted-foreground">
                  Use your private manager link to see submitted documents, download them with secure links, and track completion status.
                </p>
              </div>
            </li>
          </ol>
          <div className="mt-10 flex justify-center">
            <Button asChild size="lg" className="hover-lift">
              <Link to="/build" className="group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t py-10 mt-auto">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2025 DocCollect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
