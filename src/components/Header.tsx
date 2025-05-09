
import React from "react";
import { FileCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className = "" }) => {
  return (
    <header className={`bg-white shadow-sm py-4 ${className}`}>
      <div className="container flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <FileCheck className="size-6 text-primary" />
          <h1 className="text-xl font-bold">DocCollect</h1>
        </Link>
      </div>
    </header>
  );
};

export default Header;
