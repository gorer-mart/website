'use client';

import dynamicImport from 'next/dynamic';

const Studio = dynamicImport(() => import('./Studio').then((mod) => mod.Studio), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm text-neutral-400">Loading CMS Studio...</p>
      </div>
    </div>
  ),
});

export function StudioWrapper() {
  return <Studio />;
}
