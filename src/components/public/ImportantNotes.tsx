
import React from "react";

const ImportantNotes: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-blue-800">Important Notes</h3>
      <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
        <li>Maximum file size is 100 MB per document</li>
        <li>Only PDF files are accepted</li>
        <li>Each requirement can only have one file</li>
        <li>The AI will try to match your document to the correct requirement</li>
        <li>If AI can't classify your document, it will appear in the "Unclassified Files" section</li>
      </ul>
    </div>
  );
};

export default ImportantNotes;
