import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  color,
}) => {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="w-4 h-4 text-gray-500" />;
    }
    return change > 0 ? (
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) {
      return 'text-gray-500';
    }
    return change > 0 ? 'text-emerald-500' : 'text-red-500';
  };

  const getChangeText = () => {
    if (change === undefined || change === 0) {
      return 'No change';
    }
    return `${Math.abs(change)}% ${change > 0 ? 'increase' : 'decrease'}`;
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-20 border ${color.replace('text-', 'border-')} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">{getChangeText()}</span>
          </div>
        )}
      </div>
      {changeLabel && (
        <div className="text-xs text-gray-500">
          {changeLabel}
        </div>
      )}
    </div>
  );
};
