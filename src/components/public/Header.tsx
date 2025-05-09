
import React from "react";
import { FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm py-4 border-b border-border/30">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <FileCheck className="size-6 text-primary" />
          <h1 className="text-xl font-bold">DocCollect</h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
