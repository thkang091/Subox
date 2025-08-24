import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, X, Navigation, Home, Building, Coffee, ShoppingBag, Map, Users, AlertCircle, ChevronRight } from 'lucide-react';

interface LocationDetectorProps {
  onLocationSelect: (location: { 
    lat: number; 
    lng: number; 
    address: string;
    placeName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    areaType?: 'neighborhood' | 'city' | 'specific';
    searchRadius?: number;
  }) => void;
  initialValue?: string;
  customLocationsData?: Array<{
    id: string;
    customLocation?: {
      address: string;
      lat: number;
      lng: number;
      placeName: string;
    };
    location: string;
    hostName: string;
    title: string;
    price: number;
  }>;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
  areaType?: 'neighborhood' | 'city' | 'specific';
}

// Helper function to extract city from address
const extractCityFromAddress = (address) => {
  if (!address) return null;
  
  const parts = address.split(',').map(part => part.trim());
  
  if (parts.length >= 4) {
    return parts[parts.length - 3];
  } else if (parts.length === 3) {
    return parts[0];
  } else if (parts.length === 2) {
    return parts[0];
  } else if (parts.length === 1) {
    return parts[0];
  }
  
  return null;
};

export default function LocationDetector({ 
  onLocationSelect, 
  initialValue,
  customLocationsData = []
}: LocationDetectorProps) {
  // State management
  const [searchQuery, setSearchQuery] = useState(initialValue || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const circleInstance = useRef<google.maps.Circle | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setMapsError('Google Maps API key not configured');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      initializeDetectionServices();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeDetectionServices);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = initializeDetectionServices;
    script.onerror = () => setMapsError('Failed to load Google Maps');
    
    document.head.appendChild(script);
  };

  const initializeDetectionServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        // Use newer AutocompleteSuggestion if available, fallback to AutocompleteService
        if (window.google.maps.places.AutocompleteSuggestion) {
          // Use the newer API when available
          setIsGoogleMapsReady(true);
          setMapsError(null);
        } else {
          // Fallback to legacy APIs
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
          const div = document.createElement('div');
          placesService.current = new window.google.maps.places.PlacesService(div);
          setIsGoogleMapsReady(true);
          setMapsError(null);
        }
      } catch (error) {
        console.error('Error initializing Google Maps services:', error);
        setMapsError('Error initializing Google Maps');
      }
    }
  };

  // Search functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setDetectedLocation(null);
    setShowMap(false);
    setLocationError(null);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (isGoogleMapsReady && !mapsError) {
        detectPlaces(value);
      }
    }, 300);
  };

  const detectPlaces = (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsDetecting(true);

    if (!autocompleteService.current || !isGoogleMapsReady) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsDetecting(false);
      return;
    }

    const request = {
      input: query,
      componentRestrictions: { country: 'us' },
      types: ['establishment', 'geocode'],
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsDetecting(false);
        
        if (status === 'OK' && predictions) {
          // Process predictions to determine area types
          const processedSuggestions = predictions.map(pred => ({
            ...pred,
            areaType: determineAreaType(pred.types, pred.description)
          }));
          
          setSuggestions(processedSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const determineAreaType = (types: string[], description: string): 'neighborhood' | 'city' | 'specific' => {
    // Check if it's a specific address (has street number)
    if (description.match(/^\d+/) || types.includes('establishment') || types.includes('premise')) {
      return 'specific';
    }
    
    // Check if it's a neighborhood
    if (types.includes('sublocality') || types.includes('neighborhood')) {
      return 'neighborhood';
    }
    
    // Check if it's a city
    if (types.includes('locality') || types.includes('administrative_area_level_3')) {
      return 'city';
    }
    
    // Default to specific
    return 'specific';
  };

  const detectPlace = (suggestion: PlaceSuggestion) => {
    if (!placesService.current || !isGoogleMapsReady) {
      const fallbackData = {
        lat: 0,
        lng: 0,
        address: suggestion.description,
        placeName: suggestion.structured_formatting.main_text,
        areaType: suggestion.areaType || 'specific' as const
      };
      
      handleLocationDetection(suggestion.structured_formatting.main_text, fallbackData);
      return;
    }

    const request = {
      placeId: suggestion.place_id,
      fields: ['formatted_address', 'geometry.location', 'name', 'address_components', 'types']
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === 'OK' && place) {
        const addressComponents = parseAddressComponents(place.address_components || []);
        
        // Extract city for area expansion
        const extractedCity = extractCityFromAddress(place.formatted_address || '');
        const shouldExpandToCity = isSpecificAddress(place.types || [], place.formatted_address || '');
        
        let locationData;
        let displayName;
        
        if (shouldExpandToCity && extractedCity) {
          // Expand to city level
          displayName = extractedCity;
          locationData = {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            address: place.formatted_address || suggestion.description,
            placeName: extractedCity,
            city: extractedCity,
            state: addressComponents.state,
            areaType: 'city' as const,
            searchRadius: 15000, // 15km default for city search
            originalAddress: place.formatted_address,
            ...addressComponents
          };
        } else {
          // Keep as specific location
          displayName = place.name || suggestion.structured_formatting.main_text;
          locationData = {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
            address: place.formatted_address || suggestion.description,
            placeName: place.name || suggestion.structured_formatting.main_text,
            areaType: suggestion.areaType || 'specific' as const,
            ...addressComponents
          };
        }

        handleLocationDetection(displayName, locationData);
      }
    });
  };

  const isSpecificAddress = (types: string[], formattedAddress: string): boolean => {
    // Check if it's a specific address
    const hasStreetNumber = formattedAddress.match(/^\d+/);
    const isEstablishment = types.includes('establishment');
    const isPremise = types.includes('premise');
    const isStreetAddress = types.includes('street_address');
    
    return hasStreetNumber || isEstablishment || isPremise || isStreetAddress;
  };

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
    const addressInfo: any = {};
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('locality')) {
        addressInfo.city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        addressInfo.state = component.short_name;
      } else if (types.includes('postal_code')) {
        addressInfo.zipCode = component.long_name;
      } else if (types.includes('country')) {
        addressInfo.country = component.long_name;
      }
    });
    
    return addressInfo;
  };

  const handleLocationDetection = (displayAddress: string, locationData: any) => {
    setSearchQuery(displayAddress);
    setDetectedLocation(locationData);
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Enhanced location data for search filtering
    const enhancedLocationData = {
      ...locationData,
      searchType: locationData.areaType === 'city' ? 'city' : 'specific',
      searchRadius: locationData.searchRadius || (locationData.areaType === 'city' ? 15000 : 5000),
      displayName: displayAddress
    };
    
    onLocationSelect(enhancedLocationData);

    if (locationData.lat && locationData.lng) {
      setTimeout(() => {
        initializeDetectionMap(locationData.lat, locationData.lng);
      }, 100);
    }
  };

  // Current location
  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLocatingUser(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (isGoogleMapsReady && window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsLocatingUser(false);
              if (status === 'OK' && results?.[0]) {
                const result = results[0];
                const addressComponents = parseAddressComponents(result.address_components || []);
                
                // Extract city and expand to city-wide search
                const extractedCity = extractCityFromAddress(result.formatted_address);
                const shouldExpand = isSpecificAddress(result.types || [], result.formatted_address);
                
                let locationData;
                if (shouldExpand && extractedCity) {
                  locationData = {
                    lat: latitude,
                    lng: longitude,
                    address: result.formatted_address,
                    placeName: extractedCity,
                    city: extractedCity,
                    areaType: 'city' as const,
                    searchRadius: 15000,
                    originalAddress: result.formatted_address,
                    ...addressComponents
                  };
                } else {
                  locationData = {
                    lat: latitude,
                    lng: longitude,
                    address: result.formatted_address,
                    placeName: 'Current Location',
                    areaType: 'specific' as const,
                    ...addressComponents
                  };
                }

                handleLocationDetection(locationData.address, locationData);
              } else {
                setLocationError('Could not determine your address');
              }
            }
          );
        } else {
          setIsLocatingUser(false);
          const fallbackAddress = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          const locationData = {
            lat: latitude,
            lng: longitude,
            address: fallbackAddress,
            placeName: 'Current Location',
            areaType: 'specific' as const
          };
          handleLocationDetection(fallbackAddress, locationData);
        }
      },
      (error) => {
        setIsLocatingUser(false);
        setLocationError('Could not get your current location');
      }
    );
  };

  // Map functions
  const initializeDetectionMap = (lat: number, lng: number) => {
    if (!mapRef.current || !window.google) return;

    clearDetectionMapInstances();

    const zoomLevel = detectedLocation?.areaType === 'city' ? 11 : 14;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: zoomLevel,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    mapInstance.current = map;

    // Add marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: detectedLocation?.placeName || 'Detected Location'
    });

    markerInstance.current = marker;

    // Add circle for area
    const radius = detectedLocation?.searchRadius || 5000;
    const circle = new window.google.maps.Circle({
      strokeColor: '#10B981',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#10B981',
      fillOpacity: 0.15,
      map: map,
      center: { lat, lng },
      radius: radius
    });

    circleInstance.current = circle;

    // Fit bounds to circle
    const bounds = circle.getBounds();
    if (bounds) {
      map.fitBounds(bounds);
    }
  };

  const clearDetectionMapInstances = () => {
    if (circleInstance.current) {
      circleInstance.current.setMap(null);
      circleInstance.current = null;
    }
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
      markerInstance.current = null;
    }
  };

  const clearDetection = () => {
    setSearchQuery('');
    setDetectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMap(false);
    setLocationError(null);
    inputRef.current?.focus();
  };

  const getPlaceIcon = (areaType?: string) => {
    switch (areaType) {
      case 'city': return <Building size={18} className="text-blue-500" />;
      case 'neighborhood': return <Home size={18} className="text-green-500" />;
      default: return <MapPin size={18} className="text-gray-400" />;
    }
  };

  const toggleDetectionMap = () => {
    setShowMap(!showMap);
  };

  return (
    <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Search size={20} className="text-orange-500" />
          Detect Location
        </h3>
        <p className="text-sm text-gray-600">
          Search for any place. Specific addresses will expand to show the entire city area.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
          placeholder="Enter any city, address, or landmark..."
          disabled={!!mapsError}
          className="w-full pl-10 pr-10 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-lg disabled:opacity-50"
        />
        {searchQuery && (
          <button
            onClick={clearDetection}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {isDetecting && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.place_id}-${index}`}
                onClick={() => detectPlace(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-center gap-3"
              >
                {getPlaceIcon(suggestion.areaType)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {suggestion.structured_formatting.main_text}
                  </p>
                  <p className="text-sm text-gray-600">
                    {suggestion.structured_formatting.secondary_text}
                  </p>
                  {suggestion.areaType && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full mt-1 inline-block">
                      {suggestion.areaType}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Messages */}
      {mapsError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-red-500 mt-0.5" />
          <p className="text-red-700 text-sm">{mapsError}</p>
        </div>
      )}
      
      {locationError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="text-red-500 mt-0.5" />
          <p className="text-red-700 text-sm">{locationError}</p>
        </div>
      )}
      
      {/* Current Location Button */}
      <button
        type="button"
        onClick={detectCurrentLocation}
        disabled={isLocatingUser || !!mapsError}
        className="w-full mt-4 px-4 py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
      >
        {isLocatingUser ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span className="font-medium">Detecting your location...</span>
          </>
        ) : (
          <>
            <Navigation size={20} />
            <span className="font-medium">Detect my current location</span>
          </>
        )}
      </button>

      {/* Detected Location Info */}
      {detectedLocation && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            {getPlaceIcon(detectedLocation.areaType)}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {detectedLocation.placeName || detectedLocation.city || 'Detected Location'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {detectedLocation.originalAddress || detectedLocation.address}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {detectedLocation.areaType === 'city' ? 'City Area' : 
                   detectedLocation.areaType === 'neighborhood' ? 'Neighborhood' : 'Specific Location'}
                </span>
                {detectedLocation.searchRadius && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {(detectedLocation.searchRadius / 1000).toFixed(1)}km radius
                  </span>
                )}
                {detectedLocation.state && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                    {detectedLocation.state}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={toggleDetectionMap}
            className="mt-3 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Map size={16} />
            {showMap ? 'Hide Map' : 'Show Detection Area'}
          </button>
        </div>
      )}

      {/* Map */}
      {showMap && detectedLocation && (
        <div className="mt-4">
          <div 
            ref={mapRef} 
            className="w-full h-64 rounded-lg border border-gray-200 bg-gray-100"
          />
          <div className="mt-2 text-center text-sm text-gray-600">
            {detectedLocation.areaType === 'city' 
              ? `Showing ${detectedLocation.placeName} city area` 
              : `Detection area: ${(detectedLocation.searchRadius || 5000) / 1000}km radius`}
          </div>
        </div>
      )}

      {/* Loading Status */}
      {!isGoogleMapsReady && !mapsError && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
            Loading Google Maps...
          </div>
        </div>
      )}
    </div>
  );
}