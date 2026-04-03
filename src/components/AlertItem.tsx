import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface AlertItemProps {
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp?: Date;
  read?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const AlertItem: React.FC<AlertItemProps> = ({
  type,
  title,
  message,
  timestamp,
  read = false,
  onDismiss,
  className,
}) => {
  const icons = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertCircle,
    success: CheckCircle,
  };

  const colors = {
    info: 'blue',
    warning: 'yellow',
    danger: 'red',
    success: 'green',
  };

  const Icon = icons[type];
  const color = colors[type];

  return (
    <div
      className={cn(
        `alert-item alert-${type}`,
        !read && `border-l-4 border-${color}-500`,
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 text-${color}-500`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
          {timestamp && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              {timestamp.toLocaleTimeString()} · {timestamp.toLocaleDateString()}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AlertItem;