
import React from "react";
import { Download, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChecklistFile } from "@/types/checklist";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UnclassifiedFileListProps {
  files: ChecklistFile[];
  onDownload: (file: ChecklistFile) => void;
}

const TableUnclassifiedFileList: React.FC<UnclassifiedFileListProps> = ({ files, onDownload }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center gap-2">
        <FileQuestion className="h-5 w-5 text-amber-500" />
        <h2 className="text-xl font-semibold">Unclassified Files</h2>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50%]">Filename</TableHead>
              <TableHead className="w-[35%]">Uploaded</TableHead>
              <TableHead className="w-[15%] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell className="font-medium">{file.filename}</TableCell>
                <TableCell>{new Date(file.uploaded_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onDownload(file)}
                  >
                    <Download className="h-4 w-4 mr-1" /> Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TableUnclassifiedFileList;
