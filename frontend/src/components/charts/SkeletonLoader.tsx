import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-slate-800 rounded animate-pulse"></div>
                  <div className="w-16 h-6 bg-slate-800 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-20 h-6 bg-slate-800 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="w-32 h-6 bg-slate-800 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-64 bg-slate-800 rounded animate-pulse"></div>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <div className="w-32 h-6 bg-slate-800 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-64 bg-slate-800 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Activity Skeleton */}
      <div className="bg-slate-900/60 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="w-32 h-6 bg-slate-800 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse"></div>
                <div className="space-y-1">
                  <div className="w-24 h-4 bg-slate-700 rounded animate-pulse"></div>
                  <div className="w-32 h-3 bg-slate-700 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="w-20 h-4 bg-slate-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
