import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, X, Navigation, Home, Building, Coffee, ShoppingBag, Map, Truck, Users, AlertCircle } from 'lucide-react';

interface SearchLocationPickerProps {
  onLocationSelect: (location: { 
    lat: number; 
    lng: number; 
    address: string;
    placeName?: string;
    streetNumber?: string;
    route?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    deliveryZone?: {
      center: { lat: number; lng: number };
      radius: number;
      type: 'delivery' | 'pickup';
    };
  }) => void;
  initialValue?: string;
  showDeliveryOptions?: boolean;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  types: string[];
}

// Global state for Google Maps loading
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

export default function SearchLocationPicker({ 
  onLocationSelect, 
  initialValue, 
  showDeliveryOptions = true 
}: SearchLocationPickerProps) {
  // =====================
  // STATE MANAGEMENT
  // =====================
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialValue || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Location state
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Google Maps state
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  
  // Map display state
  const [showMap, setShowMap] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryRadius, setDeliveryRadius] = useState(1000);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const circleInstance = useRef<google.maps.Circle | null>(null);
  const markerInstance = useRef<google.maps.Marker | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // =====================
  // GOOGLE MAPS FUNCTIONS
  // =====================

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setMapsError('Google Maps API key not configured. Contact support.');
      console.warn('Google Maps API key not found');
      return;
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeServices();
      return;
    }

    // Check if script is already loading
    if (isGoogleMapsLoading && googleMapsLoadPromise) {
      try {
        await googleMapsLoadPromise;
        initializeServices();
      } catch (error) {
        console.error('Error waiting for Google Maps to load:', error);
        setMapsError('Failed to load Google Maps. Please refresh the page.');
      }
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', initializeServices);
      return;
    }

    // Load the script
    isGoogleMapsLoading = true;
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,drawing,marker&v=beta`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        isGoogleMapsLoading = false;
        initializeServices();
        resolve();
      };
      
      script.onerror = () => {
        isGoogleMapsLoading = false;
        const error = 'Failed to load Google Maps. Please check your internet connection and refresh the page.';
        setMapsError(error);
        reject(new Error(error));
      };
      
      document.head.appendChild(script);
    });

    try {
      await googleMapsLoadPromise;
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const initializeServices = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const div = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(div);
        setIsGoogleMapsReady(true);
        setMapsError(null);
        console.log('Google Maps services initialized');
      } catch (error) {
        console.error('Error initializing Google Maps services:', error);
        setMapsError('Error initializing Google Maps. Some features may not work.');
        setIsGoogleMapsReady(true); // Still allow basic functionality
      }
    }
  };

  // =====================
  // MAP FUNCTIONS
  // =====================

  const initializeMap = (lat: number, lng: number) => {
    if (!mapRef.current || !window.google) return;

    // Clear existing instances
    clearMapInstances();

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    mapInstance.current = map;

    // Wait for map to be fully loaded
    window.google.maps.event.addListenerOnce(map, 'idle', () => {
      addMapElements(map, lat, lng);
    });
  };

  const addMapElements = (map: google.maps.Map, lat: number, lng: number) => {
    // Add marker
    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: selectedLocation?.placeName || 'Selected Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });

    markerInstance.current = marker;

    // Add delivery/pickup zone circle
    const circleColor = deliveryType === 'delivery' ? '#10B981' : '#F59E0B';
    const circle = new window.google.maps.Circle({
      strokeColor: circleColor,
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: circleColor,
      fillOpacity: 0.2,
      map: map,
      center: { lat, lng },
      radius: deliveryRadius,
      editable: true,
      draggable: true,
      clickable: true
    });

    circleInstance.current = circle;

    // Fit map bounds to include the circle
    const bounds = circle.getBounds();
    if (bounds) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom() > 16) {
          map.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

    // Add circle event listeners
    addCircleEventListeners(circle, map, lat, lng);
  };

  const addCircleEventListeners = (circle: google.maps.Circle, map: google.maps.Map, lat: number, lng: number) => {
    circle.addListener('radius_changed', () => {
      try {
        const newRadius = circle.getRadius();
        if (newRadius && newRadius > 0) {
          setDeliveryRadius(Math.round(newRadius));
          updateLocationWithZone(Math.round(newRadius));
        }
      } catch (error) {
        console.error('Error handling radius change:', error);
      }
    });

    circle.addListener('center_changed', () => {
      try {
        const center = circle.getCenter();
        if (center) {
          updateLocationWithZone(deliveryRadius, center.lat(), center.lng());
        }
      } catch (error) {
        console.error('Error handling center change:', error);
      }
    });

    circle.addListener('click', () => {
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>${deliveryType === 'delivery' ? 'Delivery' : 'Pickup'} Zone</strong><br>
            Radius: ${(deliveryRadius / 1000).toFixed(1)} km<br>
            <small>Drag the circle to adjust the area</small>
          </div>
        `,
        position: { lat, lng }
      });
      infoWindow.open(map);
    });
  };

  const clearMapInstances = () => {
    if (circleInstance.current) {
      circleInstance.current.setMap(null);
      circleInstance.current = null;
    }
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
      markerInstance.current = null;
    }
  };

  const updateLocationWithZone = (radius?: number, centerLat?: number, centerLng?: number) => {
    if (!selectedLocation) return;

    const updatedLocation = {
      ...selectedLocation,
      deliveryZone: {
        center: { 
          lat: centerLat || selectedLocation.lat, 
          lng: centerLng || selectedLocation.lng 
        },
        radius: radius || deliveryRadius,
        type: deliveryType
      }
    };

    onLocationSelect(updatedLocation);
  };

  // =====================
  // SEARCH FUNCTIONS
  // =====================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedLocation(null);
    setShowMap(false);
    setLocationError(null);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (isGoogleMapsReady && !mapsError) {
        searchPlaces(value);
      }
    }, 300);
  };

  const searchPlaces = (query: string) => {
    if (!query.trim() || !autocompleteService.current || !isGoogleMapsReady) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    const request = {
      input: query,
      componentRestrictions: { country: 'us' },
      types: ['establishment', 'geocode'],
      fields: ['place_id', 'name', 'formatted_address', 'geometry']
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsSearching(false);
        
        if (status === 'OK' && predictions) {
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else if (status === 'ZERO_RESULTS') {
          setSuggestions([]);
          setShowSuggestions(false);
        } else {
          console.warn('Places API returned status:', status);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    );
  };

  const selectPlace = (suggestion: PlaceSuggestion) => {
    if (!placesService.current || !isGoogleMapsReady) return;

    const request = {
      placeId: suggestion.place_id,
      fields: [
        'formatted_address', 
        'geometry.location', 
        'name', 
        'address_components', 
        'types', 
        'place_id'
      ]
    };

    placesService.current.getDetails(request, (place, status) => {
      if (status === 'OK' && place) {
        const addressComponents = parseAddressComponents(place.address_components || []);
        const placeName = place.name !== place.formatted_address ? place.name : '';
        
        const locationData = {
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
          address: place.formatted_address || suggestion.description,
          placeName: placeName || '',
          ...addressComponents
        };

        setSearchQuery(place.formatted_address || suggestion.description);
        setSelectedLocation(locationData);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationSelect(locationData);

        if (showDeliveryOptions) {
          setTimeout(() => {
            initializeMap(locationData.lat, locationData.lng);
          }, 100);
        }
      } else {
        console.error('Place details request failed with status:', status);
        const fallbackData = {
          lat: 0,
          lng: 0,
          address: suggestion.description,
          placeName: suggestion.structured_formatting.main_text
        };
        
        setSearchQuery(suggestion.description);
        setSelectedLocation(fallbackData);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationSelect(fallbackData);
      }
    });
  };

  // =====================
  // LOCATION FUNCTIONS
  // =====================

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser. Please search for your location manually.');
      return;
    }

    setIsGettingCurrentLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (isGoogleMapsReady && window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results, status) => {
              setIsGettingCurrentLocation(false);
              if (status === 'OK' && results?.[0]) {
                const result = results[0];
                const addressComponents = parseAddressComponents(result.address_components || []);
                
                const locationData = {
                  lat: latitude,
                  lng: longitude,
                  address: result.formatted_address,
                  placeName: 'Current Location',
                  ...addressComponents
                };

                setSearchQuery(result.formatted_address);
                setSelectedLocation(locationData);
                onLocationSelect(locationData);

                if (showDeliveryOptions) {
                  setTimeout(() => {
                    initializeMap(latitude, longitude);
                  }, 100);
                }
              } else {
                setLocationError('Could not determine your address. Please search manually.');
              }
            }
          );
        } else {
          setIsGettingCurrentLocation(false);
          const fallbackAddress = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
          const locationData = {
            lat: latitude,
            lng: longitude,
            address: fallbackAddress,
            placeName: 'Current Location'
          };
          setSearchQuery(fallbackAddress);
          setSelectedLocation(locationData);
          onLocationSelect(locationData);
        }
      },
      (error) => {
        setIsGettingCurrentLocation(false);
        console.warn('Geolocation error:', error);
        
        let errorMessage = 'Could not get your current location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please enable location permissions in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'Please search for your location manually.';
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  // =====================
  // UTILITY FUNCTIONS
  // =====================

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]) => {
    const addressInfo: any = {};
    
    components.forEach(component => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        addressInfo.streetNumber = component.long_name;
      } else if (types.includes('route')) {
        addressInfo.route = component.long_name;
      } else if (types.includes('locality')) {
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

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setShowMap(false);
    setLocationError(null);
    inputRef.current?.focus();
  };

  const getPlaceIcon = (types: string[]) => {
    if (types.includes('restaurant') || types.includes('food')) return <Coffee size={18} className="text-orange-500" />;
    if (types.includes('store') || types.includes('shopping_mall')) return <ShoppingBag size={18} className="text-purple-500" />;
    if (types.includes('establishment')) return <Building size={18} className="text-blue-500" />;
    return <MapPin size={18} className="text-gray-400" />;
  };

  const handlePopularLocation = (area: string) => {
    setSearchQuery(area);
    if (isGoogleMapsReady && !mapsError) {
      searchPlaces(area);
    }
  };

  const toggleMap = () => {
    if (!selectedLocation) return;
    setShowMap(!showMap);
    if (!showMap && showDeliveryOptions) {
      setTimeout(() => {
        initializeMap(selectedLocation.lat, selectedLocation.lng);
      }, 100);
    }
  };

  const handleDeliveryTypeChange = (type: 'delivery' | 'pickup') => {
    setDeliveryType(type);
    
    if (circleInstance.current) {
      const color = type === 'delivery' ? '#10B981' : '#F59E0B';
      circleInstance.current.setOptions({
        strokeColor: color,
        fillColor: color,
        strokeOpacity: 0.9,
        fillOpacity: 0.2
      });
      
      circleInstance.current.setMap(mapInstance.current);
      updateLocationWithZone();
    }

    if (!circleInstance.current && selectedLocation) {
      setTimeout(() => {
        initializeMap(selectedLocation.lat, selectedLocation.lng);
      }, 100);
    }
  };

  // =====================
  // RENDER COMPONENTS
  // =====================

  const renderErrorMessage = (message: string) => (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
      <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );

  const renderPopularCategories = () => (
    <div className="mt-6">
      <p className="text-sm font-semibold text-gray-700 mb-3">Search by category:</p>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { name: 'Restaurants', icon: <Coffee size={16} />, query: 'restaurants near me' },
          { name: 'Coffee Shops', icon: <Coffee size={16} />, query: 'coffee shops near me' },
          { name: 'Shopping', icon: <ShoppingBag size={16} />, query: 'shopping centers near me' },
          { name: 'Universities', icon: <Building size={16} />, query: 'universities near me' }
        ].map((category) => (
          <button
            key={category.name}
            onClick={() => handlePopularLocation(category.query)}
            disabled={!!mapsError}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {category.icon}
            {category.name}
          </button>
        ))}
      </div>
      
      <p className="text-sm font-semibold text-gray-700 mb-3">Popular areas:</p>
      <div className="flex flex-wrap gap-2">
        {['Dinkytown, Minneapolis', 'University of Minnesota', 'Downtown Minneapolis', 'Stadium Village'].map((area) => (
          <button
            key={area}
            onClick={() => handlePopularLocation(area)}
            disabled={!!mapsError}
            className="px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-full hover:bg-orange-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {area}
          </button>
        ))}
      </div>
    </div>
  );

  // =====================
  // MAIN RENDER
  // =====================

  return (
    <div className="relative">
      {/* Search Input */}
      <div className="relative text-gray-700">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
          placeholder="Search restaurants, addresses, places..."
          disabled={!!mapsError}
          className="w-full pl-10 pr-10 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
        {isSearching && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent"></div>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
                <button
                key={`${suggestion.place_id}-${index}`}
                onClick={() => selectPlace(suggestion)}
                className={`w-full px-4 py-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3 transition-colors ${
                    index === 0 ? 'rounded-t-xl' : ''
                } ${index === suggestions.length - 1 ? 'rounded-b-xl' : ''}`}
                >
                <div className="mt-1 flex-shrink-0">
                    {getPlaceIcon(suggestion.types)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                    {suggestion.structured_formatting.main_text}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 truncate">
                    {suggestion.structured_formatting.secondary_text}
                    </p>
                </div>
                </button>
            ))}
            </div>
        )}

      </div>

      {/* Error Messages */}
      {mapsError && renderErrorMessage(mapsError)}
      {locationError && renderErrorMessage(locationError)}
      
      {/* Current Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isGettingCurrentLocation || !!mapsError}
        className="w-full mt-4 px-4 py-4 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-xl hover:from-orange-500 hover:to-orange-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
      >
        {isGettingCurrentLocation ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span className="font-medium">Getting your location...</span>
          </>
        ) : (
          <>
            <Navigation size={20} />
            <span className="font-medium">Use my current location</span>
          </>
        )}
      </button>
      
      {/* Popular Categories and Areas */}
      {/* {!searchQuery && !selectedLocation && renderPopularCategories()} */}

      {/* Loading Status */}
      {/* {!isGoogleMapsReady && !mapsError && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
            {isGoogleMapsLoading && <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>}
            {isGoogleMapsLoading ? 'Loading enhanced search...' : 'Basic search mode'}
          </div>
        </div>
      )} */}
    </div>
  );
}