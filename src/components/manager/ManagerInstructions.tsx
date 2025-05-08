
import React from "react";

const ManagerInstructions = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-8">
      <h3 className="font-medium text-blue-800 mb-2">Manager Instructions</h3>
      <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
        <li>This page is <strong>private</strong> — only accessible with your Admin URL</li>
        <li>Your public link is safe to share with anyone who needs to upload documents</li>
        <li>Files are automatically organized based on AI classification</li>
        <li>You can download individual files or all files at once</li>
        <li>Bookmark this page or save the URL somewhere safe</li>
        <li>Each list can support up to 100 active documents</li>
      </ul>
    </div>
  );
};

export default ManagerInstructions;
