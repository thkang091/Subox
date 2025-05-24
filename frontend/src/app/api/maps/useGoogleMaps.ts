import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setLoadError('Google Maps API key not found');
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set in environment variables');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geocoding']
    });

    loader.load()
      .then(() => {
        setIsLoaded(true);
        console.log('Google Maps loaded successfully');
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
        setLoadError(error.message || 'Failed to load Google Maps');
      });
  }, []);

  return { isLoaded, loadError };
};