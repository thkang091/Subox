import { useEffect, useRef, useState } from 'react';
import { MapPin, AlertCircle, Home, Maximize2 } from 'lucide-react';

interface NeighborhoodDetectorProps {
  latitude: number;
  longitude: number;
  onNeighborhoodDetected: (neighborhood: string) => void;
  showMap?: boolean;
  locationType?: 'specific' | 'neighborhood';
  locationName?: string;
}

interface NeighborhoodInfo {
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'google_places' | 'google_geocoding' | 'fallback';
}

export default function NeighborhoodDetector({ 
  latitude, 
  longitude, 
  onNeighborhoodDetected,
  showMap = false,
  locationType = 'specific',
  locationName = ''
}: NeighborhoodDetectorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [neighborhood, setNeighborhood] = useState<NeighborhoodInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Optimized Google Maps API loading
  useEffect(() => {
    const loadGoogleMaps = async () => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps already loaded');
        setGoogleMapsLoaded(true);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        setError('Google Maps API key not configured');
        return;
      }

      try {
        // Check if script already exists
        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          console.log('🔍 Google Maps script already exists, waiting for load...');
          
          // If script exists but Maps isn't loaded yet, wait for it
          const waitForMaps = () => {
            if (window.google?.maps?.places) {
              console.log('✅ Google Maps loaded from existing script');
              setGoogleMapsLoaded(true);
            } else {
              setTimeout(waitForMaps, 100);
            }
          };
          waitForMaps();
          return;
        }

        console.log('📦 Loading Google Maps API script...');
        
        // Load the script with proper async/defer attributes
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&v=weekly`;
        script.async = true;  // ✅ Prevents blocking page parsing
        script.defer = true;  // ✅ Waits for HTML parsing to complete
        script.loading = 'async'; // ✅ Additional performance hint
        
        script.onload = () => {
          console.log('✅ Google Maps API loaded successfully');
          setGoogleMapsLoaded(true);
        };
        
        script.onerror = (error) => {
          console.error('❌ Failed to load Google Maps API:', error);
          setError('Failed to load Google Maps API');
        };
        
        // Add script to document head
        document.head.appendChild(script);
        
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Error loading Google Maps API');
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current || !googleMapsLoaded || !window.google?.maps) {
        return;
      }

      try {
        console.log('🗺️ Initializing Google Maps...');
        
        // Create the map with standard Google Maps styling (like Airbnb)
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: { lat: latitude, lng: longitude },
          zoom: locationType === 'neighborhood' ? 14 : 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          
          // Keep standard Google Maps controls (like Airbnb)
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: false,
          
          // Standard Google Maps styling - no custom styles for authentic look
          styles: [],
        });

        setMap(mapInstance);

        // Add a simple marker (like Airbnb's black circle with location icon)
        const marker = new google.maps.Marker({
          position: { lat: latitude, lng: longitude },
          map: mapInstance,
          title: locationName || 'Property Location',
          icon: {
            // Custom icon similar to Airbnb's style
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#000000"/>
                <path d="M16 8C12.7 8 10 10.7 10 14C10 18.5 16 24 16 24S22 18.5 22 14C22 10.7 19.3 8 16 8ZM16 17C14.3 17 13 15.7 13 14C13 12.3 14.3 11 16 11C17.7 11 19 12.3 19 14C19 15.7 17.7 17 16 17Z" fill="white"/>
              </svg>
            `),
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 16),
          },
        });

        // Detect neighborhood
        await detectNeighborhood(latitude, longitude);
        
        console.log('✅ Map initialized successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to load map');
        setIsLoading(false);
      }
    };

    if (latitude && longitude && googleMapsLoaded && showMap) {
      initializeMap();
    } else if (latitude && longitude && googleMapsLoaded && !showMap) {
      // Just detect neighborhood without showing map
      detectNeighborhood(latitude, longitude);
      setIsLoading(false);
    }
  }, [latitude, longitude, googleMapsLoaded, showMap, locationType, locationName]);

  // Enhanced neighborhood detection using Google Places Nearby Search
  const detectNeighborhoodWithPlaces = async (lat: number, lng: number): Promise<NeighborhoodInfo | null> => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      return null;
    }

    return new Promise((resolve) => {
      // Create a temporary map for the PlacesService
      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);
      
      const request = {
        location: new window.google.maps.LatLng(lat, lng),
        radius: 500, // 500 meters radius
        type: 'neighborhood' as google.maps.places.PlaceType
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // Get the first neighborhood result
          const place = results[0];
          
          if (place.name && place.vicinity) {
            // Parse the vicinity for city/state info
            const viciniteParts = place.vicinity.split(',').map(part => part.trim());
            
            resolve({
              neighborhood: place.name,
              city: viciniteParts[0] || 'Unknown City',
              state: viciniteParts[1] || 'Unknown State',
              country: viciniteParts[2] || 'Unknown Country',
              confidence: 'high',
              source: 'google_places'
            });
            return;
          }
        }
        resolve(null);
      });
    });
  };

  // Fallback: Use reverse geocoding to detect neighborhood
  const detectNeighborhoodWithGeocoding = async (lat: number, lng: number): Promise<NeighborhoodInfo | null> => {
    if (!window.google || !window.google.maps) {
      return null;
    }

    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results.length > 0) {
          let neighborhood = '';
          let sublocality = '';
          let city = '';
          let state = '';
          let country = '';
          
          // Look through all results for the most specific neighborhood info
          for (const result of results) {
            for (const component of result.address_components) {
              const types = component.types;
              
              // Priority order: neighborhood > sublocality > sublocality_level_1
              if (types.includes('neighborhood') && !neighborhood) {
                neighborhood = component.long_name;
              } else if (types.includes('sublocality') && !sublocality) {
                sublocality = component.long_name;
              } else if (types.includes('sublocality_level_1') && !sublocality) {
                sublocality = component.long_name;
              } else if (types.includes('locality') && !city) {
                city = component.long_name;
              } else if (types.includes('administrative_area_level_1') && !state) {
                state = component.short_name;
              } else if (types.includes('country') && !country) {
                country = component.long_name;
              }
            }
          }
          
          // Use neighborhood first, then sublocality as fallback
          const detectedArea = neighborhood || sublocality;
          
          if (detectedArea) {
            resolve({
              neighborhood: detectedArea,
              city: city || 'Unknown City',
              state: state || 'Unknown State',
              country: country || 'Unknown Country',
              confidence: neighborhood ? 'high' : 'medium',
              source: 'google_geocoding'
            });
          } else {
            // If no neighborhood found, use city as fallback
            if (city) {
              resolve({
                neighborhood: city,
                city: city,
                state: state || 'Unknown State',
                country: country || 'Unknown Country',
                confidence: 'low',
                source: 'fallback'
              });
            } else {
              resolve(null);
            }
          }
        } else {
          resolve(null);
        }
      });
    });
  };

  // Main detection function
  const detectNeighborhood = async (lat: number, lng: number) => {
    if (!lat || !lng) {
      setError('Invalid coordinates provided');
      return;
    }
    
    if (!googleMapsLoaded) {
      setError('Google Maps not loaded yet');
      return;
    }

    try {
      console.log('🔍 Detecting neighborhood for:', { lat, lng });
      
      // First try Places API for neighborhood detection
      let detectedNeighborhood = await detectNeighborhoodWithPlaces(lat, lng);
      
      // If Places API doesn't work, try geocoding
      if (!detectedNeighborhood) {
        console.log('📍 Places API failed, trying geocoding...');
        detectedNeighborhood = await detectNeighborhoodWithGeocoding(lat, lng);
      }
      
      if (detectedNeighborhood) {
        console.log('✅ Neighborhood detected:', detectedNeighborhood);
        setNeighborhood(detectedNeighborhood);
        onNeighborhoodDetected(detectedNeighborhood.neighborhood);
      } else {
        console.log('❌ Could not detect neighborhood');
        setError('Could not determine neighborhood for this location');
      }
    } catch (err) {
      console.error('Error detecting neighborhood:', err);
      setError('Error detecting neighborhood. Please try again.');
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // If not showing map, just return neighborhood info
  if (!showMap) {
    if (!googleMapsLoaded) {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          <span className="text-blue-700 text-sm font-medium">Loading Google Maps...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-red-700 text-sm font-medium">Neighborhood Detection Failed</p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
          </div>
        </div>
      );
    }

    if (neighborhood) {
      return (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Home size={16} className="text-blue-500" />
          <div>
            <p className="text-blue-800 font-medium">📍 {neighborhood.neighborhood}</p>
            <p className="text-blue-600 text-xs">
              {neighborhood.city}, {neighborhood.state}, {neighborhood.country}
            </p>
          </div>
        </div>
      );
    }

    return null;
  }

  // Show map interface (like Airbnb)


  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Where you'll be</h3>
        </div>
        <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center border border-red-200">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Failed to load map</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Location Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">Where you'll be</h3>
        <button
          onClick={toggleFullscreen}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="View fullscreen"
        >
          <Maximize2 size={20} />
        </button>
      </div>

      {/* Location Info */}
      <div className="mb-4">
        <p className="text-gray-700 font-medium">
          {neighborhood?.neighborhood || locationName}, Minneapolis, Minnesota, United States
        </p>
      </div>

      {/* Map Container */}
      <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
        {isFullscreen && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Where you'll be</h2>
            <button
              onClick={toggleFullscreen}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        )}
        
        <div className={`${isFullscreen ? 'h-full' : 'h-96'} w-full rounded-lg overflow-hidden border border-gray-200`}>
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {isFullscreen && (
          <div className="mt-4">
            <p className="text-gray-700">
              <span className="font-medium">{neighborhood?.neighborhood || locationName}</span>, Minneapolis, Minnesota, United States
            </p>
          </div>
        )}
      </div>

      {/* Location Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start gap-3">
          {locationType === 'specific' ? (
            <MapPin size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          ) : (
            <Home size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
          )}
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {locationType === 'specific' ? 'Exact location' : 'Neighborhood area'}
            </h4>
            <p className="text-sm text-gray-600">
              {locationType === 'specific' 
                ? 'The exact address will be provided after booking confirmation.'
                : 'This is an approximate location of the neighborhood area.'
              }
            </p>
            {neighborhood && (
              <p className="text-sm text-gray-500 mt-2">
                Located in {neighborhood.neighborhood}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}