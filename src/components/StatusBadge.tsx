
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';

type StatusType = 'missing' | 'uploaded' | 'unclassified';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'missing':
        return {
          label: 'Missing',
          className: 'bg-gray-400 text-white'
        };
      case 'uploaded':
        return {
          label: 'Uploaded',
          className: 'bg-green-500 text-white'
        };
      case 'unclassified':
        return {
          label: 'Unclassified',
          className: 'bg-amber-500 text-white'
        };
      default:
        return {
          label: 'Unknown',
          className: 'bg-gray-400 text-white'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
};

export default StatusBadge;
