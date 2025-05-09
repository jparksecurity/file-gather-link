
import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, HelpCircle } from "lucide-react";

type StatusType = "missing" | "uploaded" | "unclassified";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig = {
    missing: {
      icon: Clock,
      text: "Missing",
      bgClass: "bg-gray-100 text-gray-700 border-gray-200",
    },
    uploaded: {
      icon: CheckCircle2,
      text: "Uploaded",
      bgClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    unclassified: {
      icon: HelpCircle,
      text: "Unclassified",
      bgClass: "bg-amber-50 text-amber-700 border-amber-100",
    },
  };

  const { icon: Icon, text, bgClass } = statusConfig[status];

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        bgClass,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {text}
    </div>
  );
};

export default StatusBadge;
