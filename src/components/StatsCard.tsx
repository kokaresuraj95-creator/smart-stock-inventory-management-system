import React from 'react';
import { cn } from '../lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color = 'primary',
  className,
}) => {
  const colors = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600',
  };

  return (
    <div className={cn('stats-card group', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
          
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className={cn(
                'flex items-center text-sm',
                trend > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{Math.abs(trend)}%</span>
              </div>
              {trendLabel && (
                <span className="text-xs text-gray-500">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        
        <div className={cn(
          'p-3 rounded-xl bg-gradient-to-br text-white transform group-hover:scale-110 transition-transform duration-300',
          colors[color]
        )}>
          {icon}
        </div>
      </div>
      
      <div className={cn(
        'absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl',
        colors[color]
      )} />
    </div>
  );
};

export default StatsCard;