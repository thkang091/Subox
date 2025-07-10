import { useEffect, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface UseGoogleMapsReturn {
  isLoaded: boolean;
  loadError: string | null;
  calculateRoute: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: google.maps.TravelMode
  ) => Promise<google.maps.DirectionsResult | null>;
  calculateDistance: (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ) => Promise<{ distance: string; duration: string } | null>;
  geocodeAddress: (address: string) => Promise<google.maps.GeocoderResult[] | null>;
  reverseGeocode: (lat: number, lng: number) => Promise<google.maps.GeocoderResult[] | null>;
}

export const useGoogleMaps = (): UseGoogleMapsReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Check if API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setLoadError('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.');
      console.warn('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set in environment variables');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'directions', 'geocoding']
    });

    loader.load()
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
        console.log('Google Maps loaded successfully with all libraries');
      })
      .catch((error) => {
        console.error('Error loading Google Maps:', error);
        setLoadError(error.message || 'Failed to load Google Maps. Please check your internet connection and API key.');
      });
  }, []);

  // Calculate route between two points
  const calculateRoute = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: google.maps.TravelMode
  ): Promise<google.maps.DirectionsResult | null> => {
    if (!isLoaded || !window.google) {
      console.warn('Google Maps not loaded yet');
      return null;
    }

    return new Promise((resolve) => {
      const directionsService = new google.maps.DirectionsService();
      
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: travelMode,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          resolve(result);
        } else {
          console.warn('Route calculation failed:', status);
          resolve(null);
        }
      });
    });
  };

  // Calculate distance and duration between two points using Distance Matrix
  const calculateDistance = async (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: string; duration: string } | null> => {
    if (!isLoaded || !window.google) {
      console.warn('Google Maps not loaded yet');
      return null;
    }

    return new Promise((resolve) => {
      const service = new google.maps.DistanceMatrixService();
      
      service.getDistanceMatrix({
        origins: [new google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        avoidHighways: false,
        avoidTolls: false
      }, (response, status) => {
        if (status === 'OK' && response) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            resolve({
              distance: element.distance?.text || 'Unknown',
              duration: element.duration?.text || 'Unknown'
            });
          } else {
            resolve(null);
          }
        } else {
          console.warn('Distance calculation failed:', status);
          resolve(null);
        }
      });
    });
  };

  // Geocode an address to get coordinates
  const geocodeAddress = async (address: string): Promise<google.maps.GeocoderResult[] | null> => {
    if (!isLoaded || !window.google) {
      console.warn('Google Maps not loaded yet');
      return null;
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          console.warn('Geocoding failed:', status);
          resolve(null);
        }
      });
    });
  };

  // Reverse geocode coordinates to get address
  const reverseGeocode = async (lat: number, lng: number): Promise<google.maps.GeocoderResult[] | null> => {
    if (!isLoaded || !window.google) {
      console.warn('Google Maps not loaded yet');
      return null;
    }

    return new Promise((resolve) => {
      const geocoder = new google.maps.Geocoder();
      
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results) {
          resolve(results);
        } else {
          console.warn('Reverse geocoding failed:', status);
          resolve(null);
        }
      });
    });
  };

  return {
    isLoaded,
    loadError,
    calculateRoute,
    calculateDistance,
    geocodeAddress,
    reverseGeocode
  };
};