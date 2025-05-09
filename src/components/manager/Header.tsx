
import React from "react";
import { FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-card shadow-sm py-6 border-b border-border/40">
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <FileCheck className="size-6 text-primary" />
          <h1 className="text-xl font-medium">DocCollect</h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
