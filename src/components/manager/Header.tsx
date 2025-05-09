
import React from "react";
import { FileCheck } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-white shadow-sm py-4 mb-8">
      <div className="container flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="size-6 text-primary" />
          <h1 className="text-xl font-bold">DocCollect</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
