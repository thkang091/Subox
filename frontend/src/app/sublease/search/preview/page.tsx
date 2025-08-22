"use client"

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ListingDetailPage from '../[id]/page'; // Import your existing detail page component

export default function PreviewPage() {
  const [previewData, setPreviewData] = useState(null);
  const searchParams = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    if (isPreview) {
      const stored = localStorage.getItem('previewData');
      if (stored) {
        setPreviewData(JSON.parse(stored));
      }
    }
  }, [isPreview]);

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  // Add preview banner
  return (
    <div>
      <div className="bg-yellow-100 border-b border-yellow-300 p-3 text-center">
        <p className="text-yellow-800 font-medium">
          🔍 Preview Mode - This is how your listing will appear to guests
        </p>
      </div>
      <ListingDetailPage previewData={previewData} />
    </div>
  );
}