
import React from "react";

const ManagerInstructions: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <h3 className="font-medium text-blue-800">Manager Instructions</h3>
      <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
        <li>Files are auto-classified by AI but may need review</li>
        <li>This manager URL gives full access to all documents</li>
        <li>Store your manager URL securely - it can't be recovered</li>
      </ul>
    </div>
  );
};

export default ManagerInstructions;
