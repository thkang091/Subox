import { useEffect, useRef, useState } from 'react';
import { Search, MapPin, X, Navigation, Home, Building, Coffee, ShoppingBag, Map, Truck, Users, AlertCircle } from 'lucide-react';

interface LocationPickerProps {
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
      type: 'delivery';
    };
    pickupLocations?: Array<{
      lat: number;
      lng: number;
      address: string;
      placeName?: string;
    }>;
  }) => void;
  initialValue?: string;
  mode: 'delivery' | 'pickup' | 'both';
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

export default function LocationPicker({ 
  onLocationSelect, 
  initialValue, 
  mode,
  showDeliveryOptions = true 
}: LocationPickerProps) {

  // =====================
  // STATE MANAGEMENT
  // =====================
  
  // Search state
  const [searchQuery, setSearchQuery] = useState(initialValue || '');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Pickup locations state
  const [pickupLocations, setPickupLocations] = useState([]);
  const [showAddPickupButton, setShowAddPickupButton] = useState(false);
  const [activeDeliveryCenter, setActiveDeliveryCenter] = useState({ lat: 0, lng: 0 });
  const pickupMarkersRef = useRef([]);
  
  // Pickup location search state
  const [isAddingPickupLocation, setIsAddingPickupLocation] = useState(false);
  const [pickupSearchQuery, setPickupSearchQuery] = useState('');
  const [pickupSuggestions, setPickupSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showPickupSuggestions, setShowPickupSuggestions] = useState(false);
  
  // Location state
  const [isGettingCurrentLocation, setIsGettingCurrentLocation] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Google Maps state
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  
  // Map display state (auto-show when location selected)
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

  // Clear existing pickup markers
  const clearPickupMarkers = () => {
    if (pickupMarkersRef.current) {
      pickupMarkersRef.current.forEach(marker => {
        marker.setMap(null);
      });
      pickupMarkersRef.current = [];
    }
  };

  // Add pickup location markers to map with click handlers for delivery center
  const addPickupLocationMarkers = (map) => {
    clearPickupMarkers();
    
    pickupLocations.forEach((location, index) => {
      const isActive = activeDeliveryCenter.lat === location.lat && 
                      activeDeliveryCenter.lng === location.lng;
      
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: `Pickup Location ${index + 1}: ${location.placeName || location.address}`,
        icon: {
          path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: isActive ? 10 : 8,
          fillColor: isActive ? '#10B981' : '#F59E0B', // Green if active delivery center
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2
        }
      });

      // Click handler for setting delivery center
      marker.addListener('click', () => {
        if ((mode === 'both' || mode === 'delivery') && deliveryType === 'delivery') {
          changeDeliveryCenter(location);
          
          // Show info
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <strong>Delivery Center</strong><br>
                ${location.placeName ? `<em>${location.placeName}</em><br>` : ''}
                ${location.address}<br>
                <small style="color: #10B981;">Delivery zone centered here</small>
              </div>
            `
          });
          infoWindow.open(map, marker);
        } else {
          // For pickup mode or regular location selection, center map and add red marker
          if (mapInstance.current) {
            mapInstance.current.setCenter({ lat: location.lat, lng: location.lng });
            mapInstance.current.setZoom(14);
            addMainLocationMarker(mapInstance.current, location.lat, location.lng, location);
          }
          
          // Regular pickup info window
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <strong>Pickup Location ${index + 1}</strong><br>
                ${location.placeName ? `<em>${location.placeName}</em><br>` : ''}
                ${location.address}<br>
                <button onclick="removePickupLocation(${index})" style="margin-top: 8px; padding: 4px 8px; background: #EF4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
                  Remove Location
                </button>
              </div>
            `
          });
          infoWindow.open(map, marker);
        }
      });

      pickupMarkersRef.current.push(marker);
    });

    // Make remove function globally accessible for info window
    window.removePickupLocation = (index) => {
      removePickupLocation(index);
    };
  };

  // Add current searched location as pickup location
  const addCurrentLocationAsPickup = () => {
    if (!selectedLocation) return;

    const newPickupLocation = {
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedLocation.address,
      placeName: selectedLocation.placeName
    };

    setPickupLocations(prev => [...prev, newPickupLocation]);
    setShowAddPickupButton(false);
    
    // Set as active delivery center if first pickup location
    if (pickupLocations.length === 0) {
      setActiveDeliveryCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
    }
    
    // Update map markers
    if (mapInstance.current) {
      addPickupLocationMarkers(mapInstance.current);
    }
    
    updateLocationData();
  };

  // Remove pickup location
  const removePickupLocation = (index) => {
    const removedLocation = pickupLocations[index];
    setPickupLocations(prev => prev.filter((_, i) => i !== index));
    
    // If removing active delivery center, set to first remaining or main location
    if (activeDeliveryCenter.lat === removedLocation.lat && 
        activeDeliveryCenter.lng === removedLocation.lng) {
      const remaining = pickupLocations.filter((_, i) => i !== index);
      if (remaining.length > 0) {
        changeDeliveryCenter(remaining[0]);
      } else if (selectedLocation) {
        changeDeliveryCenter(selectedLocation);
      }
    }
    
    // Update map markers
    if (mapInstance.current) {
      addPickupLocationMarkers(mapInstance.current);
    }
    
    updateLocationData();
  };

  // Update the location data sent to parent
  const updateLocationData = () => {
    if (!selectedLocation) return;

    const updatedLocation = {
      ...selectedLocation
    };

    // Add delivery zone if in delivery mode
    if ((mode === 'delivery' || mode === 'both') && deliveryType === 'delivery') {
      const center = pickupLocations.length > 0 && 
                    activeDeliveryCenter.lat && activeDeliveryCenter.lng
        ? activeDeliveryCenter
        : { lat: selectedLocation.lat, lng: selectedLocation.lng };
        
      updatedLocation.deliveryZone = {
        center: center,
        radius: deliveryRadius,
        type: 'delivery'
      };
    }

    // Add pickup locations if in pickup mode
    if ((mode === 'pickup' || mode === 'both') && pickupLocations.length > 0) {
      updatedLocation.pickupLocations = pickupLocations;
    }

    onLocationSelect(updatedLocation);
  };

  // Function to handle delivery center changes with map sync
  const changeDeliveryCenter = (location) => {
    setActiveDeliveryCenter({ lat: location.lat, lng: location.lng });
    
    // Move map to the new center first
    if (mapInstance.current) {
      mapInstance.current.setCenter({ lat: location.lat, lng: location.lng });
      mapInstance.current.setZoom(15);
      
      // Add red marker for the selected delivery center
      addMainLocationMarker(mapInstance.current, location.lat, location.lng, location);
    }
    
    // Update or create delivery circle
    if (deliveryType === 'delivery') {
      if (circleInstance.current) {
        // Update existing circle
        circleInstance.current.setCenter({ lat: location.lat, lng: location.lng });
      } else {
        // Create new circle if it doesn't exist
        createDeliveryCircle(location.lat, location.lng);
      }
      
      // Fit map bounds to show the delivery circle after a short delay
      setTimeout(() => {
        if (circleInstance.current && mapInstance.current) {
          const bounds = circleInstance.current.getBounds();
          if (bounds) {
            mapInstance.current.fitBounds(bounds);
            
            // Prevent excessive zoom
            const listener = window.google.maps.event.addListener(mapInstance.current, 'bounds_changed', () => {
              if (mapInstance.current.getZoom() && mapInstance.current.getZoom() > 16) {
                mapInstance.current.setZoom(16);
              }
              window.google.maps.event.removeListener(listener);
            });
          }
        }
      }, 200);
    }
    
    // Update parent component
    updateLocationWithZone(deliveryRadius, location.lat, location.lng);
    
    // Refresh pickup markers to show active state
    if (mapInstance.current) {
      addPickupLocationMarkers(mapInstance.current);
    }
  };

  // Create delivery circle
  const createDeliveryCircle = (lat: number, lng: number) => {
    if (!mapInstance.current || !window.google) return;

    // Remove existing circle
    if (circleInstance.current) {
      circleInstance.current.setMap(null);
    }

    const circle = new window.google.maps.Circle({
      strokeColor: '#10B981',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: '#10B981',
      fillOpacity: 0.2,
      map: mapInstance.current,
      center: { lat, lng },
      radius: deliveryRadius,
      editable: true,
      draggable: true,
      clickable: true
    });

    circleInstance.current = circle;
    addCircleEventListeners(circle, mapInstance.current, lat, lng);
  };

  // Add a separate function to create main location markers
  const addMainLocationMarker = (map, lat, lng, locationData = null) => {
    // Remove existing main marker
    if (markerInstance.current) {
      markerInstance.current.setMap(null);
      markerInstance.current = null;
    }

    const marker = new window.google.maps.Marker({
      position: { lat, lng },
      map: map,
      title: locationData?.placeName || selectedLocation?.placeName || 'Selected Location',
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
  };

  const addMapElements = (map, lat, lng) => {
    // Clear existing pickup markers
    clearPickupMarkers();

    // Add main location marker
    addMainLocationMarker(map, lat, lng);

    // Handle delivery mode - add delivery zone circle
    if ((mode === 'delivery' || mode === 'both') && (deliveryType === 'delivery' || mode === 'delivery')) {
      // Use active delivery center if available, otherwise use main location
      const centerLat = (activeDeliveryCenter.lat && activeDeliveryCenter.lng) ? activeDeliveryCenter.lat : lat;
      const centerLng = (activeDeliveryCenter.lat && activeDeliveryCenter.lng) ? activeDeliveryCenter.lng : lng;
      
      createDeliveryCircle(centerLat, centerLng);

      // Fit map bounds to include the circle after a delay
      setTimeout(() => {
        if (circleInstance.current) {
          const bounds = circleInstance.current.getBounds();
          if (bounds) {
            map.fitBounds(bounds);
            const listener = window.google.maps.event.addListener(map, 'bounds_changed', () => {
              if (map.getZoom() && map.getZoom() > 16) {
                map.setZoom(16);
              }
              window.google.maps.event.removeListener(listener);
            });
          }
        }
      }, 200);
    }

    // Handle pickup mode - add pickup location markers
    if (mode === 'pickup' || mode === 'both') {
      addPickupLocationMarkers(map);
      
      // If we have a selected location and it's not already in pickup locations, show the add button
      if (selectedLocation && !pickupLocations.some(loc => 
        Math.abs(loc.lat - selectedLocation.lat) < 0.0001 && 
        Math.abs(loc.lng - selectedLocation.lng) < 0.0001
      )) {
        setShowAddPickupButton(true);
      }
    }

    // Adjust map view if no circle bounds to fit
    if (!(mode === 'delivery' || mode === 'both') || deliveryType !== 'delivery') {
      map.setCenter({ lat, lng });
      map.setZoom(14);
    }
  };

  const addCircleEventListeners = (circle: google.maps.Circle, map: google.maps.Map, lat: number, lng: number) => {
    circle.addListener('radius_changed', () => {
      try {
        const newRadius = circle.getRadius();
        if (newRadius && newRadius > 0) {
          setDeliveryRadius(Math.round(newRadius));
          const center = circle.getCenter();
          if (center) {
            updateLocationWithZone(Math.round(newRadius), center.lat(), center.lng());
          }
        }
      } catch (error) {
        console.error('Error handling radius change:', error);
      }
    });

    circle.addListener('center_changed', () => {
      try {
        const center = circle.getCenter();
        if (center) {
          const newLat = center.lat();
          const newLng = center.lng();
          setActiveDeliveryCenter({ lat: newLat, lng: newLng });
          updateLocationWithZone(deliveryRadius, newLat, newLng);
        }
      } catch (error) {
        console.error('Error handling center change:', error);
      }
    });

    circle.addListener('click', () => {
      const center = circle.getCenter();
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <strong>Delivery Zone</strong><br>
            Radius: ${(deliveryRadius / 1000).toFixed(1)} km<br>
            <small>Drag the circle or edge to adjust the area</small>
          </div>
        `,
        position: center ? { lat: center.lat(), lng: center.lng() } : { lat, lng }
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

    const center = centerLat && centerLng 
      ? { lat: centerLat, lng: centerLng }
      : activeDeliveryCenter.lat && activeDeliveryCenter.lng
      ? activeDeliveryCenter
      : { lat: selectedLocation.lat, lng: selectedLocation.lng };

    const updatedLocation = {
      ...selectedLocation,
      deliveryZone: {
        center: center,
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
        setShowMap(true); // AUTO-SHOW MAP
        
        // Set active delivery center to new location
        setActiveDeliveryCenter({ lat: locationData.lat, lng: locationData.lng });
        
        onLocationSelect(locationData);

        // Initialize map immediately
        setTimeout(() => {
          initializeMap(locationData.lat, locationData.lng);
        }, 100);
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
        setShowMap(true); // AUTO-SHOW MAP
        onLocationSelect(fallbackData);
      }
    });
  };

  // =====================
  // PICKUP LOCATION SEARCH FUNCTIONS
  // =====================

  const handlePickupLocationSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPickupSearchQuery(value);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      if (isGoogleMapsReady && !mapsError && value.trim()) {
        searchPickupPlaces(value);
      } else {
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
      }
    }, 300);
  };

  const searchPickupPlaces = (query: string) => {
    if (!query.trim() || !autocompleteService.current || !isGoogleMapsReady) {
      setPickupSuggestions([]);
      setShowPickupSuggestions(false);
      return;
    }

    const request = {
      input: query,
      componentRestrictions: { country: 'us' },
      types: ['establishment', 'geocode'],
      fields: ['place_id', 'name', 'formatted_address', 'geometry']
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        if (status === 'OK' && predictions) {
          setPickupSuggestions(predictions);
          setShowPickupSuggestions(true);
        } else {
          setPickupSuggestions([]);
          setShowPickupSuggestions(false);
        }
      }
    );
  };

  const selectPickupPlace = (suggestion: PlaceSuggestion) => {
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
        
        const newPickupLocation = {
          lat: place.geometry?.location?.lat() || 0,
          lng: place.geometry?.location?.lng() || 0,
          address: place.formatted_address || suggestion.description,
          placeName: placeName || ''
        };

        // Add the new pickup location
        setPickupLocations(prev => [...prev, newPickupLocation]);
        
        // Set as active delivery center if first pickup location and in delivery mode
        if (pickupLocations.length === 0 && deliveryType === 'delivery') {
          changeDeliveryCenter(newPickupLocation);
        } else {
          // Move map to show the new pickup location
          if (mapInstance.current) {
            mapInstance.current.setCenter({ lat: newPickupLocation.lat, lng: newPickupLocation.lng });
            mapInstance.current.setZoom(14);
            
            // Add red marker for the new pickup location
            addMainLocationMarker(mapInstance.current, newPickupLocation.lat, newPickupLocation.lng, newPickupLocation);
          }
        }
        
        // Clear search
        setPickupSearchQuery('');
        setPickupSuggestions([]);
        setShowPickupSuggestions(false);
        setIsAddingPickupLocation(false);
        
        // Update map markers
        if (mapInstance.current) {
          addPickupLocationMarkers(mapInstance.current);
        }
        
        updateLocationData();
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
                setShowMap(true); // AUTO-SHOW MAP
                
                // Set active delivery center to current location
                setActiveDeliveryCenter({ lat: latitude, lng: longitude });
                
                onLocationSelect(locationData);

                // Initialize map immediately
                setTimeout(() => {
                  initializeMap(latitude, longitude);
                }, 100);
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
          setShowMap(true); // AUTO-SHOW MAP
          setActiveDeliveryCenter({ lat: latitude, lng: longitude });
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
    setPickupLocations([]);
    setActiveDeliveryCenter({ lat: 0, lng: 0 });
    
    // Clear pickup search states
    setIsAddingPickupLocation(false);
    setPickupSearchQuery('');
    setPickupSuggestions([]);
    setShowPickupSuggestions(false);
    setShowAddPickupButton(false);
    
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

  const handleDeliveryTypeChange = (type: 'delivery' | 'pickup') => {
    setDeliveryType(type);
    
    // Clear the showAddPickupButton when switching modes
    setShowAddPickupButton(false);
    
    if (type === 'delivery') {
      // Determine the best center for delivery zone
      let centerLocation = null;
      
      if (pickupLocations.length > 0) {
        // Use first pickup location if available
        centerLocation = pickupLocations[0];
      } else if (selectedLocation) {
        // Fall back to selected location
        centerLocation = selectedLocation;
      }
      
      if (centerLocation) {
        changeDeliveryCenter(centerLocation);
      }
    } else if (type === 'pickup') {
      // Hide delivery circle when in pickup mode
      if (circleInstance.current) {
        circleInstance.current.setMap(null);
      }
      
      // Center map on selected location if available
      if (mapInstance.current && selectedLocation) {
        mapInstance.current.setCenter({ lat: selectedLocation.lat, lng: selectedLocation.lng });
        mapInstance.current.setZoom(14);
      }
      
      // Show add button if current location isn't already a pickup location
      if (selectedLocation && !pickupLocations.some(loc => 
        Math.abs(loc.lat - selectedLocation.lat) < 0.0001 && 
        Math.abs(loc.lng - selectedLocation.lng) < 0.0001
      )) {
        setShowAddPickupButton(true);
      }
    }
    
    updateLocationData();
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
      </div>

      {/* Error Messages */}
      {mapsError && renderErrorMessage(mapsError)}
      {locationError && renderErrorMessage(locationError)}

      {/* Current Location Button */}
      <button
        type="button"
        onClick={getCurrentLocation}
        disabled={isGettingCurrentLocation || !!mapsError}
        className="w-full mt-4 px-4 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
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

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-green-800">Selected Location</p>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              {selectedLocation.placeName && (
                <p className="font-medium text-gray-900 mb-1">{selectedLocation.placeName}</p>
              )}
              
              <p className="text-sm text-gray-700 mb-2">{selectedLocation.address}</p>
              
              {/* Address Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                {selectedLocation.city && (
                  <div><span className="font-medium">City:</span> {selectedLocation.city}</div>
                )}
                {selectedLocation.state && (
                  <div><span className="font-medium">State:</span> {selectedLocation.state}</div>
                )}
                {selectedLocation.zipCode && (
                  <div><span className="font-medium">ZIP:</span> {selectedLocation.zipCode}</div>
                )}
                {selectedLocation.route && (
                  <div><span className="font-medium">Street:</span> {selectedLocation.streetNumber || ''} {selectedLocation.route}</div>
                )}
              </div>

              {/* Delivery/Pickup Zone Controls */}
              {showDeliveryOptions && !mapsError && (
                <div className="border-t border-green-200 pt-3 mt-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-medium text-green-800">
                      {mode === 'delivery' ? 'Delivery Zone' : 
                       mode === 'pickup' ? 'Pickup Locations' : 
                       'Delivery & Pickup Setup'}
                    </p>
                  </div>

                  {/* Mode-specific controls */}
                  {mode === 'delivery' && (
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600">
                        <p><span className="font-medium">Delivery Radius:</span> {(deliveryRadius / 1000).toFixed(1)} km</p>
                        <p className="text-gray-500 mt-1">Drag the green circle on the map to adjust your delivery area</p>
                        {pickupLocations.length > 0 && (
                          <p className="text-green-600 font-medium mt-1">
                            Click any pickup location to center delivery zone there
                          </p>
                        )}
                      </div>
                      
                      {pickupLocations.length > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-medium text-green-800 mb-2">
                            Available Delivery Centers:
                          </p>
                          {pickupLocations.map((location, index) => (
                            <div 
                              key={index}
                              className={`text-xs p-2 rounded mb-1 cursor-pointer transition-colors ${
                                activeDeliveryCenter.lat === location.lat && 
                                activeDeliveryCenter.lng === location.lng
                                  ? 'bg-green-200 text-green-800 font-medium'
                                  : 'text-gray-600 hover:bg-green-100'
                              }`}
                              onClick={() => changeDeliveryCenter(location)}
                            >
                              {location.placeName || `Location ${index + 1}`}
                              {activeDeliveryCenter.lat === location.lat && 
                               activeDeliveryCenter.lng === location.lng && (
                                <span className="ml-2">← Active</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {mode === 'pickup' && (
                    <div className="space-y-3">
                      {pickupLocations.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-gray-700">Pickup Locations ({pickupLocations.length}):</p>
                          {pickupLocations.map((location, index) => (
                            <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {location.placeName || `Location ${index + 1}`}
                                </p>
                                <p className="text-xs text-gray-600 truncate">{location.address}</p>
                              </div>
                              <button
                                onClick={() => removePickupLocation(index)}
                                className="ml-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {showAddPickupButton && (
                        <button
                          onClick={addCurrentLocationAsPickup}
                          className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <MapPin size={16} />
                          Keep this location as pickup point
                        </button>
                      )}

                      {pickupLocations.length === 0 && !showAddPickupButton && (
                        <p className="text-xs text-gray-500 italic">
                          Search for a location above to add your first pickup point
                        </p>
                      )}
                    </div>
                  )}

                  {mode === 'both' && (
                    <div className="space-y-3">
                      <div className="flex gap-2 mb-3">
                        <button
                          onClick={() => handleDeliveryTypeChange('delivery')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            deliveryType === 'delivery'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Truck size={16} className="inline mr-1" />
                          Setup Delivery
                        </button>
                        <button
                          onClick={() => handleDeliveryTypeChange('pickup')}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            deliveryType === 'pickup'
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Users size={16} className="inline mr-1" />
                          Setup Pickup
                        </button>
                      </div>

                      {deliveryType === 'delivery' && (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-600">
                            <p><span className="font-medium">Delivery Radius:</span> {(deliveryRadius / 1000).toFixed(1)} km</p>
                            {pickupLocations.length > 0 && (
                              <p className="text-green-600 font-medium mt-1">
                                Click any pickup location (yellow pins) to center delivery zone there
                              </p>
                            )}
                          </div>
                          
                          {pickupLocations.length > 0 && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-xs font-medium text-green-800 mb-2">
                                Active Delivery Center:
                              </p>
                              {pickupLocations.map((location, index) => (
                                <div 
                                  key={index}
                                  className={`text-xs p-2 rounded mb-1 cursor-pointer transition-colors ${
                                    activeDeliveryCenter.lat === location.lat && 
                                    activeDeliveryCenter.lng === location.lng
                                      ? 'bg-green-200 text-green-800 font-medium'
                                      : 'text-gray-600 hover:bg-green-100'
                                  }`}
                                  onClick={() => changeDeliveryCenter(location)}
                                >
                                  {location.placeName || `Location ${index + 1}`}
                                  {activeDeliveryCenter.lat === location.lat && 
                                   activeDeliveryCenter.lng === location.lng && (
                                    <span className="ml-2">← Active</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {deliveryType === 'pickup' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-gray-700">
                              Pickup Locations ({pickupLocations.length}):
                            </p>
                            <button
                              onClick={() => setIsAddingPickupLocation(!isAddingPickupLocation)}
                              className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-full transition-colors"
                            >
                              {isAddingPickupLocation ? 'Cancel' : '+ Add Location'}
                            </button>
                          </div>

                          {/* Pickup Location Search */}
                          {isAddingPickupLocation && (
                            <div className="relative mb-3">
                              <div className="relative">
                                <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                  type="text"
                                  value={pickupSearchQuery}
                                  onChange={handlePickupLocationSearch}
                                  onFocus={() => pickupSearchQuery && setShowPickupSuggestions(pickupSuggestions.length > 0)}
                                  placeholder="Search for pickup location..."
                                  className="w-full pl-8 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-1 focus:ring-yellow-500 focus:border-transparent"
                                />
                              </div>

                              {/* Pickup Suggestions Dropdown */}
                              {showPickupSuggestions && pickupSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
                                  {pickupSuggestions.map((suggestion, index) => (
                                    <button
                                      key={`pickup-${suggestion.place_id}-${index}`}
                                      onClick={() => selectPickupPlace(suggestion)}
                                      className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-xs"
                                    >
                                      <div className="font-medium text-gray-900 truncate">
                                        {suggestion.structured_formatting.main_text}
                                      </div>
                                      <div className="text-gray-600 truncate">
                                        {suggestion.structured_formatting.secondary_text}
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Current Pickup Locations */}
                          {pickupLocations.length > 0 && (
                            <div className="space-y-1">
                              {pickupLocations.map((location, index) => (
                                <div key={index} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-900 truncate">
                                      {location.placeName || `Location ${index + 1}`}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">{location.address}</p>
                                  </div>
                                  <button
                                    onClick={() => removePickupLocation(index)}
                                    className="ml-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add current location button */}
                          {showAddPickupButton && (
                            <button
                              onClick={addCurrentLocationAsPickup}
                              className="w-full px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                            >
                              <MapPin size={14} />
                              Add current location as pickup
                            </button>
                          )}

                          {pickupLocations.length === 0 && !isAddingPickupLocation && !showAddPickupButton && (
                            <p className="text-xs text-gray-500 italic text-center py-2">
                              Click "Add Location" to add your first pickup point
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Map Display - Auto-shows when location is selected */}
      {showMap && selectedLocation && !mapsError && (
        <div className="mt-4 h-64 rounded-xl overflow-hidden shadow-lg border border-gray-200">
          <div ref={mapRef} className="w-full h-full" />
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

      {/* Popular Categories and Areas */}
      {!searchQuery && !selectedLocation && renderPopularCategories()}

      {/* Loading Status */}
      {!isGoogleMapsReady && !mapsError && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
            {isGoogleMapsLoading && <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>}
            {isGoogleMapsLoading ? 'Loading enhanced search...' : 'Basic search mode'}
          </div>
        </div>
      )}
    </div>
  );
}