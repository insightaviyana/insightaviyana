import React from 'react';

// Loading skeletons — Medium-term item from ENGINEERING_ASSESSMENT.md
// ("No loading skeletons... a journalist skimming quickly on a slow
// connection notices a blank flash before content pops in"). These replace
// the bare spinning-circle loaders (both the app-level `contentLoading`
// gate in App.tsx and the per-tab `TabLoadingFallback`) with content-shaped
// placeholders, which read as "the page is already here, just filling in"
// rather than "nothing has happened yet" — the standard perceived-
// performance win skeleton screens give over a spinner.

export const SkeletonBox: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-800/70 rounded-lg ${className}`} />
);

export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({ width = 'w-full', className = '' }) => (
  <div className={`animate-pulse bg-slate-800/70 rounded h-3 ${width} ${className}`} />
);

/** A single card matching the shape used across PublicHubView / AnnouncementsView / InvestmentView grids. */
export const SkeletonCard: React.FC = () => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
    <SkeletonBox className="h-40 rounded-none" />
    <div className="p-4 space-y-2.5">
      <SkeletonText width="w-3/4" className="h-4" />
      <SkeletonText width="w-full" />
      <SkeletonText width="w-5/6" />
      <div className="flex items-center gap-2 pt-1">
        <SkeletonBox className="w-5 h-5 rounded-full" />
        <SkeletonText width="w-1/3" />
      </div>
    </div>
  </div>
);

/** A grid of card skeletons — the generic shape for most content-heavy tabs. */
export const SkeletonCardGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

/** Matches the Public Hub's hero + card-grid layout specifically, for the app's very first paint. */
export const PublicHubSkeleton: React.FC = () => (
  <div className="space-y-8">
    <div className="pt-8 pb-8 text-center space-y-3">
      <SkeletonBox className="w-11 h-11 rounded-xl mx-auto" />
      <SkeletonText width="w-64" className="h-6 mx-auto" />
      <SkeletonText width="w-48" className="mx-auto" />
    </div>
    <SkeletonCardGrid count={3} />
    <SkeletonCardGrid count={3} />
  </div>
);
