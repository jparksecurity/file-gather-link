import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, CheckCircle2, Upload, FileCheck } from "lucide-react";
import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container py-12 flex flex-col gap-12">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold mb-4">
            Collect, organize and verify documents with ease
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Create a zero-signup document collection page and let AI automatically organize uploads for you.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/build">
                <FileUp className="mr-2 h-5 w-5" />
                Create Checklist
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Create</CardTitle>
              <CardDescription>
                Create your document checklist with up to 100 requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center rounded-md border-2 border-dashed p-4">
                <div className="text-center space-y-2">
                  <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Define titles and descriptions<br />for each required document
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share</CardTitle>
              <CardDescription>
                Share the public link with document providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center rounded-md border-2 border-dashed p-4">
                <div className="text-center space-y-2">
                  <Upload className="h-10 w-10 text-primary mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Drag and drop PDFs directly onto each item<br />or use AI-powered classification
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Manage</CardTitle>
              <CardDescription>
                Use the private manager link to download documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-center justify-center rounded-md border-2 border-dashed p-4">
                <div className="text-center space-y-2">
                  <FileCheck className="h-10 w-10 text-primary mx-auto" />
                  <div className="text-sm text-muted-foreground">
                    Track status and download<br />all submitted documents
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="max-w-3xl mx-auto bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">How it works</h2>
          <ol className="space-y-6 list-decimal pl-5">
            <li className="pl-2">
              <h3 className="text-lg font-semibold">Create your document checklist</h3>
              <p className="text-muted-foreground">
                Create a checklist with up to 100 required documents. Each item can have a title and description.
              </p>
            </li>
            <li className="pl-2">
              <h3 className="text-lg font-semibold">Share the public link</h3>
              <p className="text-muted-foreground">
                After publishing, you'll get two links: a public link for document providers to upload files, and a private link for you to manage submissions.
              </p>
            </li>
            <li className="pl-2">
              <h3 className="text-lg font-semibold">Let AI organize uploads</h3>
              <p className="text-muted-foreground">
                Document providers can either upload directly to specific requirements or use the AI classification that automatically routes documents to the correct requirement.
              </p>
            </li>
            <li className="pl-2">
              <h3 className="text-lg font-semibold">Download and verify</h3>
              <p className="text-muted-foreground">
                Use your private manager link to see submitted documents, download them with secure links, and track completion status.
              </p>
            </li>
          </ol>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/build">
                Get Started
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-8">
        <div className="container text-center text-muted-foreground">
          <p>&copy; 2025 DocCollect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
