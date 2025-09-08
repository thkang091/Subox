import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, Navigation, Truck, Check, X, AlertCircle } from 'lucide-react';

interface DeliveryZoneMapProps {
  deliveryZone?: {
    center: { lat: number; lng: number };
    radius: number;
    type: 'delivery';
  };
  pickupLocations?: Array<{
    lat: number;
    lng: number;
    address: string;
    placeName?: string;
  }>;
  mode: 'delivery' | 'pickup' | 'both';
  onLocationCheck?: (inZone: boolean, distance?: number) => void;
}

interface PlaceSuggestion {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

// Global state for Google Maps loading
let isGoogleMapsLoading = false;
let googleMapsLoadPromise: Promise<void> | null = null;

export default function DeliveryZoneMap({ 
  deliveryZone, 
  pickupLocations = [], 
  mode,
  onLocationCheck 
}: DeliveryZoneMapProps) {
  
  // Debug logging
  useEffect(() => {
    console.log('DeliveryZoneMap props:', {
      deliveryZone,
      pickupLocations,
      mode,
      hasDeliveryZone: !!deliveryZone,
      hasPickupLocations: pickupLocations.length > 0
    });
  }, [deliveryZone, pickupLocations, mode]);
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'delivery' | 'pickup'>(() => {
    // Initialize selectedMode based on available data and mode
    if (mode === 'both') {
      // For 'both' mode, prioritize delivery if available, otherwise pickup
      if (deliveryZone && deliveryZone.center) return 'delivery';
      if (pickupLocations && pickupLocations.length > 0) return 'pickup';
      return 'delivery'; // default
    } else if (mode === 'delivery') {
      return 'delivery';
    } else if (mode === 'pickup') {
      return 'pickup';
    }
    return mode; // fallback
  });

  const [checkResult, setCheckResult] = useState<{
    inZone: boolean;
    distance?: number;
    message: string;
  } | null>(null);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Refs
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const circleInstance = useRef<google.maps.Circle | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  
  // Load Google Maps
  useEffect(() => {
    loadGoogleMaps();
  }, []);
  
  const loadGoogleMaps = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setMapsError('Google Maps API key not configured');
      return;
    }

    if (isGoogleMapsLoaded()) {
      initializeServices();
      return;
    }

    if (isGoogleMapsLoading && googleMapsLoadPromise) {
      try {
        await googleMapsLoadPromise;
        initializeServices();
      } catch (error) {
        setMapsError('Failed to load Google Maps');
      }
      return;
    }

    isGoogleMapsLoading = true;
    googleMapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=beta`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        isGoogleMapsLoading = false;
        // Wait a bit for all libraries to be fully loaded
        setTimeout(() => {
          if (isGoogleMapsLoaded()) {
            initializeServices();
            resolve();
          } else {
            setMapsError('Google Maps geometry library failed to load');
            reject(new Error('Google Maps geometry library failed to load'));
          }
        }, 100);
      };
      
      script.onerror = () => {
        isGoogleMapsLoading = false;
        setMapsError('Failed to load Google Maps');
        reject(new Error('Failed to load Google Maps'));
      };
      
      document.head.appendChild(script);
    });

    try {
      await googleMapsLoadPromise;
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  // Helper function to check if Google Maps is fully loaded
  const isGoogleMapsLoaded = () => {
    return window.google && 
           window.google.maps && 
           window.google.maps.places && 
           window.google.maps.geometry &&
           window.google.maps.geometry.spherical;
  };

  const initializeServices = () => {
    if (isGoogleMapsLoaded()) {
      try {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        const div = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(div);
        setIsGoogleMapsReady(true);
        setMapsError(null);
      } catch (error) {
        setMapsError('Error initializing Google Maps services');
        setIsGoogleMapsReady(true);
      }
    } else {
      setMapsError('Google Maps libraries not fully loaded');
    }
  };

  // Initialize map when Google Maps is ready
  useEffect(() => {
    if (isGoogleMapsReady && mapRef.current && isGoogleMapsLoaded()) {
      initializeMap();
    }
  }, [isGoogleMapsReady, deliveryZone, pickupLocations, selectedMode]);

  // Update selectedMode when mode prop changes
  useEffect(() => {
    if (mode !== 'both') {
      setSelectedMode(mode);
    }
  }, [mode]);

  const initializeMap = () => {
    if (!mapRef.current || !isGoogleMapsLoaded()) return;

    // Determine map center
    let center = { lat: 44.9778, lng: -93.2650 }; // Minneapolis default
    if (selectedMode === 'delivery' && deliveryZone) {
      center = deliveryZone.center;
    } else if (selectedMode === 'pickup' && pickupLocations.length > 0) {
      center = pickupLocations[0];
    } else if (deliveryZone) {
      center = deliveryZone.center;
    } else if (pickupLocations.length > 0) {
      center = pickupLocations[0];
    }

    // Create map
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    });

    mapInstance.current = map;
    
    // Clear existing markers
    clearMarkers();
    
    // Add appropriate elements based on mode
    if (selectedMode === 'delivery' && deliveryZone) {
      createDeliveryZone();
    } else if (selectedMode === 'pickup' && pickupLocations.length > 0) {
      createPickupMarkers();
    }
  };

  const createDeliveryZone = () => {
    console.log('createDeliveryZone called:', { 
      hasMapInstance: !!mapInstance.current, 
      hasDeliveryZone: !!deliveryZone,
      hasGoogleMaps: isGoogleMapsLoaded(),
      deliveryZone 
    });
    
    if (!mapInstance.current || !deliveryZone || !isGoogleMapsLoaded()) {
      console.log('Missing requirements for delivery zone creation');
      return;
    }

    const map = mapInstance.current;
    
    // Create delivery circle
    const circle = new window.google.maps.Circle({
      strokeColor: '#10B981',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#10B981',
      fillOpacity: 0.2,
      map,
      center: deliveryZone.center,
      radius: deliveryZone.radius
    });

    circleInstance.current = circle;
    console.log('Delivery circle created:', circle);

    // Add center marker
    const centerMarker = new window.google.maps.Marker({
      position: deliveryZone.center,
      map,
      title: 'Delivery Center',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#EF4444',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      }
    });

    markersRef.current.push(centerMarker);
    console.log('Center marker created:', centerMarker);

    // Fit bounds to circle
    const bounds = circle.getBounds();
    if (bounds) {
      map.fitBounds(bounds);
      
      // Prevent excessive zoom
      const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
        if (map.getZoom() && map.getZoom()! > 16) {
          map.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }
  };

  const createPickupMarkers = () => {
    if (!mapInstance.current || pickupLocations.length === 0 || !isGoogleMapsLoaded()) return;

    const map = mapInstance.current;
    
    pickupLocations.forEach((location, index) => {
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map,
        title: location.placeName || `Pickup Location ${index + 1}`,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 8,
          fillColor: '#F59E0B',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>Pickup Location ${index + 1}</strong><br>
            ${location.placeName ? `<em>${location.placeName}</em><br>` : ''}
            ${location.address}
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to all pickup locations
    if (pickupLocations.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      pickupLocations.forEach(location => {
        bounds.extend(new window.google.maps.LatLng(location.lat, location.lng));
      });
      map.fitBounds(bounds);
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    if (circleInstance.current) {
      circleInstance.current.setMap(null);
      circleInstance.current = null;
    }
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }
  };

  // Haversine formula fallback for distance calculation
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Search functions
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setCheckResult(null);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (isGoogleMapsReady && !mapsError && value.trim()) {
        searchPlaces(value);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const searchPlaces = (query: string) => {
    if (!query.trim() || !autocompleteService.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    autocompleteService.current.getPlacePredictions({
      input: query,
      componentRestrictions: { country: 'us' },
      types: ['establishment', 'geocode']
    }, (predictions, status) => {
      setIsSearching(false);
      
      if (status === 'OK' && predictions) {
        setSuggestions(predictions);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    });
  };

  const selectPlace = (suggestion: PlaceSuggestion) => {
    if (!placesService.current) return;

    placesService.current.getDetails({
      placeId: suggestion.place_id,
      fields: ['geometry.location', 'formatted_address', 'name']
    }, (place, status) => {
      if (status === 'OK' && place && place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setSearchQuery(place.formatted_address || suggestion.description);
        setUserLocation(location);
        setSuggestions([]);
        setShowSuggestions(false);
        
        checkLocationInZone(location);
        addUserMarker(location);
      }
    });
  };

  const checkLocationInZone = (location: { lat: number; lng: number }) => {
    if (selectedMode === 'delivery' && deliveryZone) {
      let distance: number;
      
      // Try to use Google Maps geometry library, fallback to Haversine formula
      if (isGoogleMapsLoaded() && window.google.maps.geometry?.spherical) {
        distance = window.google.maps.geometry.spherical.computeDistanceBetween(
          new window.google.maps.LatLng(location.lat, location.lng),
          new window.google.maps.LatLng(deliveryZone.center.lat, deliveryZone.center.lng)
        );
      } else {
        distance = calculateDistance(
          location.lat, 
          location.lng, 
          deliveryZone.center.lat, 
          deliveryZone.center.lng
        );
      }
      
      const inZone = distance <= deliveryZone.radius;
      const distanceKm = Math.round(distance / 1000 * 100) / 100;
      
      setCheckResult({
        inZone,
        distance: distanceKm,
        message: inZone 
          ? `Great! You're within the delivery zone (${distanceKm}km from center)`
          : `Sorry, you're outside the delivery zone (${distanceKm}km from center, max ${Math.round(deliveryZone.radius / 1000 * 100) / 100}km)`
      });
      
      onLocationCheck?.(inZone, distanceKm);
    } else if (selectedMode === 'pickup' && pickupLocations.length > 0) {
      // Check if user location is close to ANY pickup location
      const proximityThreshold = 100; // 100 meters threshold for "exact" location
      let nearestDistance = Infinity;
      let nearestLocationIndex = -1;
      
      pickupLocations.forEach((pickupLocation, index) => {
        let distance: number;
        
        // Try to use Google Maps geometry library, fallback to Haversine formula
        if (isGoogleMapsLoaded() && window.google.maps.geometry?.spherical) {
          distance = window.google.maps.geometry.spherical.computeDistanceBetween(
            new window.google.maps.LatLng(location.lat, location.lng),
            new window.google.maps.LatLng(pickupLocation.lat, pickupLocation.lng)
          );
        } else {
          distance = calculateDistance(
            location.lat,
            location.lng,
            pickupLocation.lat,
            pickupLocation.lng
          );
        }
        
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestLocationIndex = index;
        }
      });
      
      const isNearPickupLocation = nearestDistance <= proximityThreshold;
      const nearestDistanceKm = Math.round(nearestDistance / 1000 * 100) / 100;
      const nearestDistanceM = Math.round(nearestDistance);
      
      if (isNearPickupLocation) {
        const nearestLocation = pickupLocations[nearestLocationIndex];
        setCheckResult({
          inZone: true,
          distance: nearestDistanceKm,
          message: `Perfect! You're at pickup location: ${nearestLocation.placeName || nearestLocation.address} (${nearestDistanceM}m away)`
        });
        onLocationCheck?.(true, nearestDistanceKm);
      } else {
        const nearestLocation = pickupLocations[nearestLocationIndex];
        setCheckResult({
          inZone: false,
          distance: nearestDistanceKm,
          message: `You're not at a pickup location. Nearest pickup is ${nearestDistanceKm}km away at ${nearestLocation.placeName || nearestLocation.address}. Please go to one of the marked pickup locations.`
        });
        onLocationCheck?.(false, nearestDistanceKm);
      }
    } else if (selectedMode === 'pickup' && pickupLocations.length === 0) {
      setCheckResult({
        inZone: false,
        message: 'No pickup locations available for this item'
      });
      onLocationCheck?.(false);
    }
  };

  const addUserMarker = (location: { lat: number; lng: number }) => {
    if (!mapInstance.current || !isGoogleMapsLoaded()) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    const marker = new window.google.maps.Marker({
      position: location,
      map: mapInstance.current,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#3B82F6',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 3
      }
    });

    userMarkerRef.current = marker;
    
    // Center map on user location
    mapInstance.current.panTo(location);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(location);
        
        if (isGoogleMapsLoaded()) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              setSearchQuery(results[0].formatted_address);
            }
          });
        }
        
        checkLocationInZone(location);
        addUserMarker(location);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your current location');
      }
    );
  };

  if (mapsError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 text-red-700">
          <AlertCircle size={20} />
          <span>{mapsError}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle for 'both' mode */}
      {mode === 'both' && (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedMode('delivery');
              setCheckResult(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMode === 'delivery'
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Truck size={16} className="inline mr-2" />
            Delivery Zone
          </button>
          <button
            onClick={() => {
              setSelectedMode('pickup');
              setCheckResult(null);
            }}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMode === 'pickup'
                ? 'bg-orange-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin size={16} className="inline mr-2" />
            Pickup Locations
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder="Enter your address to check availability..."
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <button
          onClick={getCurrentLocation}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <Navigation size={20} />
        </button>
        {isSearching && (
          <div className="absolute inset-y-0 right-8 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.place_id}-${index}`}
              onClick={() => selectPlace(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-gray-900">
                {suggestion.structured_formatting.main_text}
              </div>
              <div className="text-sm text-gray-600">
                {suggestion.structured_formatting.secondary_text}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Check Result */}
      {checkResult && (
        <div className={`p-4 rounded-lg border ${
          checkResult.inZone
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center space-x-2 ${
            checkResult.inZone ? 'text-green-700' : 'text-red-700'
          }`}>
            {checkResult.inZone ? <Check size={20} /> : <X size={20} />}
            <span className="font-medium">{checkResult.message}</span>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">
          {selectedMode === 'delivery' ? 'Delivery Information' : 'Pickup Information'}
        </h4>
        {selectedMode === 'delivery' ? (
          <div className="space-y-1 text-sm text-gray-600">
            {deliveryZone ? (
              <>
                <p>• Green circle shows the delivery zone</p>
                <p>• Red marker shows the delivery center</p>
                <p>• Search your address to check if delivery is available</p>
                <p>• Delivery radius: {Math.round(deliveryZone.radius / 1000 * 100) / 100}km</p>
              </>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-yellow-800">Delivery zone information not available</p>
                <p className="text-yellow-700">This item shows as delivery available but doesn't have zone data configured.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1 text-sm text-gray-600">
            {pickupLocations.length > 0 ? (
              <>
                <p>• Orange markers show exact pickup locations</p>
                <p>• Click on any marker for location details</p>
                <p>• <strong>You must be at one of these exact locations to pickup</strong></p>
                <p>• Search your address to check if you're at a pickup location</p>
                <p>• Total pickup locations: {pickupLocations.length}</p>
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                  <strong>Note:</strong> Pickup is only available at the marked locations. You must be within 100m of a pickup marker.
                </div>
              </>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="font-medium text-yellow-800">Pickup locations not configured</p>
                <p className="text-yellow-700">This item shows as pickup available but doesn't have specific pickup locations set up.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}