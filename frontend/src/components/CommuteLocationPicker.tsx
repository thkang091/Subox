import { useEffect, useRef, useState } from 'react';
import { 
  Search, MapPin, X, Navigation, Car, Bike, Users, 
  Clock, Route, Settings, Check, DollarSign, Info, AlertCircle, Calculator, Zap, Train, Bus, PersonStanding
} from 'lucide-react';

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

interface CommuteLocationPickerProps {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    placeName?: string;
    commutePreferences: {
      transportMode: TransportMode;
      maxCommuteTime: number;
      maxDistance: number;
      showAlternatives: boolean;
      avoidTolls: boolean;
      avoidHighways: boolean;
    };
  }) => void;
  onRouteCalculated?: (routes: RouteResult[]) => void;
  initialValue?: string;
  nearbyListings?: Array<{
    id: string;
    lat: number;
    lng: number;
    address: string;
    title: string;
    price: number;
    needsGeocoding?: boolean;
    neighborhood?: string;
  }>;
  onShowMap?: (shouldShow: boolean) => void;
}

type TransportMode = 'walking' | 'transit' | 'bicycling' | 'driving' | 'scooter';

interface RouteResult {
  listingId: string;
  distance: string;
  duration: string;
  transportMode: TransportMode;
  route?: google.maps.DirectionsRoute;
  alternatives?: Array<{
    route: google.maps.DirectionsRoute;
    distance: string;
    duration: string;
    description: string;
  }>;
  transitDetails?: {
    steps: Array<{
      travelMode: string;
      instructions: string;
      distance: string;
      duration: string;
      transitLine?: string;
      departureTime?: string;
      arrivalTime?: string;
    }>;
    totalFare?: string;
    departureTime?: string;
    arrivalTime?: string;
  };
  isAtDestination?: boolean;
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

export default function CommuteLocationPicker({ 
  onLocationSelect, 
  onRouteCalculated,
  initialValue,
  nearbyListings = [],
  onShowMap
}: CommuteLocationPickerProps) {
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
  
  // Enhanced transport preferences
  const [selectedTransportMode, setSelectedTransportMode] = useState<TransportMode>('transit');
  const [maxCommuteTime, setMaxCommuteTime] = useState(30);
  const [maxDistance, setMaxDistance] = useState(10);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // Route calculation state
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [routeResults, setRouteResults] = useState<RouteResult[]>([]);
  const [calculationProgress, setCalculationProgress] = useState({ current: 0, total: 0 });
  
  // Google Maps state
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // =====================
  // GOOGLE MAPS INITIALIZATION
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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=beta`;
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
        directionsService.current = new window.google.maps.DirectionsService();
        const div = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(div);
        setIsGoogleMapsReady(true);
        setMapsError(null);
        console.log('Google Maps services initialized for commute search');
      } catch (error) {
        console.error('Error initializing Google Maps services:', error);
        setMapsError('Error initializing Google Maps. Some features may not work.');
        setIsGoogleMapsReady(true);
      }
    }
  };

  // =====================
  // SEARCH FUNCTIONS
  // =====================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedLocation(null);
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
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
      locationBias: {
        center: { lat: 44.9778, lng: -93.2358 },
        radius: 50000
      }
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsSearching(false);
        
        if (status === 'OK' && predictions) {
          const sortedPredictions = predictions.sort((a, b) => {
            const aIsCommuteFriendly = a.types?.some(type => 
              ['university', 'school', 'establishment', 'point_of_interest', 'transit_station'].includes(type)
            );
            const bIsCommuteFriendly = b.types?.some(type => 
              ['university', 'school', 'establishment', 'point_of_interest', 'transit_station'].includes(type)
            );
            
            if (aIsCommuteFriendly && !bIsCommuteFriendly) return -1;
            if (!aIsCommuteFriendly && bIsCommuteFriendly) return 1;
            return 0;
          });
          
          setSuggestions(sortedPredictions);
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
          commutePreferences: {
            transportMode: selectedTransportMode,
            maxCommuteTime,
            maxDistance,
            showAlternatives,
            avoidTolls,
            avoidHighways
          },
          isWorkplace: place.types?.some(type => 
            ['establishment', 'university', 'school', 'point_of_interest'].includes(type)
          ),
          placeTypes: place.types || [],
          ...addressComponents
        };

        setSearchQuery(place.formatted_address || suggestion.description);
        setSelectedLocation(locationData);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationSelect(locationData);
      } else {
        console.error('Place details request failed with status:', status);
        const fallbackData = {
          lat: 0,
          lng: 0,
          address: suggestion.description,
          placeName: suggestion.structured_formatting.main_text,
          commutePreferences: {
            transportMode: selectedTransportMode,
            maxCommuteTime,
            maxDistance,
            showAlternatives,
            avoidTolls,
            avoidHighways
          }
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
  // ROUTE CALCULATION
  // =====================

  const calculateRoutesToListings = async (fromLocation: any) => {
    if (!directionsService.current || !nearbyListings.length) {
      console.warn('Cannot calculate routes: missing directions service or listings');
      return;
    }

    setIsCalculatingRoutes(true);
    setCalculationProgress({ current: 0, total: nearbyListings.length });
    const results: RouteResult[] = [];

    try {
      for (let i = 0; i < nearbyListings.length; i++) {
        const listing = nearbyListings[i];
        setCalculationProgress({ current: i + 1, total: nearbyListings.length });
        
        let listingCoords;
        
        if (listing.needsGeocoding && listing.neighborhood) {
          try {
            const geocodedCoords = await new Promise<{lat: number, lng: number}>((resolve) => {
              const geocoder = new window.google.maps.Geocoder();
              geocoder.geocode(
                { 
                  address: `${listing.neighborhood}, Minneapolis, MN`,
                  componentRestrictions: { country: 'US' }
                },
                (results, status) => {
                  if (status === 'OK' && results?.[0]) {
                    const result = results[0];
                    resolve({
                      lat: result.geometry.location.lat(),
                      lng: result.geometry.location.lng()
                    });
                  } else {
                    resolve({
                      lat: 44.9778 + (Math.random() - 0.5) * 0.01,
                      lng: -93.2358 + (Math.random() - 0.5) * 0.01
                    });
                  }
                }
              );
            });
            
            listingCoords = geocodedCoords;
          } catch (error) {
            console.error(`Error geocoding ${listing.neighborhood}:`, error);
            listingCoords = {
              lat: 44.9778 + (Math.random() - 0.5) * 0.01,
              lng: -93.2358 + (Math.random() - 0.5) * 0.01
            };
          }
        } else if (listing.lat && listing.lng) {
          listingCoords = {
            lat: listing.lat,
            lng: listing.lng
          };
        } else {
          listingCoords = {
            lat: 44.9778 + (Math.random() - 0.5) * 0.01,
            lng: -93.2358 + (Math.random() - 0.5) * 0.01
          };
        }

        const result = await calculateEnhancedRoute(
          fromLocation,
          listingCoords,
          selectedTransportMode,
          listing.id,
          {
            showAlternatives,
            avoidTolls,
            avoidHighways,
            maxCommuteTime,
            maxDistance
          }
        );
        
        if (result) {
          results.push(result);
        }

        if (i < nearbyListings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const filteredResults = results.filter(result => {
        const durationMinutes = parseCommuteTime(result.duration);
        const distanceMiles = parseDistance(result.distance);
        
        return durationMinutes <= maxCommuteTime && distanceMiles <= maxDistance;
      });

      setRouteResults(filteredResults);
      
      if (onRouteCalculated) {
        onRouteCalculated(filteredResults);
      }

      if (onShowMap) {
        onShowMap(true);
      }
    } catch (error) {
      console.error('Error in route calculation process:', error);
      setLocationError('Unable to calculate commute times. Please try again.');
    } finally {
      setIsCalculatingRoutes(false);
      setCalculationProgress({ current: 0, total: 0 });
    }
  };

  const calculateEnhancedRoute = (
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number },
    travelMode: TransportMode,
    listingId: string,
    options: {
      showAlternatives: boolean;
      avoidTolls: boolean;
      avoidHighways: boolean;
      maxCommuteTime: number;
      maxDistance: number;
    }
  ): Promise<RouteResult | null> => {
    return new Promise((resolve) => {
      if (!directionsService.current) {
        resolve(null);
        return;
      }

      const distanceKm = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const distanceMeters = distanceKm * 1000;
      
      if (distanceMeters < 100) {
        resolve({
          listingId,
          distance: 'At destination',
          duration: 'At destination',
          transportMode: travelMode,
          route: null,
          alternatives: undefined,
          transitDetails: undefined,
          isAtDestination: true
        });
        return;
      }

      const getTravelMode = (mode: TransportMode): google.maps.TravelMode => {
        switch (mode) {
          case 'driving':
            return google.maps.TravelMode.DRIVING;
          case 'walking':
            return google.maps.TravelMode.WALKING;
          case 'bicycling':
          case 'scooter':
            return google.maps.TravelMode.BICYCLING;
          case 'transit':
            return google.maps.TravelMode.TRANSIT;
          default:
            return google.maps.TravelMode.TRANSIT;
        }
      };

      const baseRequest: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(destination.lat, destination.lng),
        destination: new google.maps.LatLng(origin.lat, origin.lng),
        travelMode: getTravelMode(travelMode),
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        provideRouteAlternatives: options.showAlternatives,
      };

      if (travelMode === 'driving' || travelMode === 'scooter') {
        baseRequest.avoidHighways = options.avoidHighways;
        baseRequest.avoidTolls = options.avoidTolls;
        baseRequest.drivingOptions = {
          departureTime: new Date(Date.now() + 30 * 60 * 1000),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        };
      }

      if (travelMode === 'transit') {
        const now = new Date();
        const departureTime = new Date(now.getTime() + 30 * 60 * 1000);
        
        baseRequest.transitOptions = {
          departureTime: departureTime,
          modes: [
            google.maps.TransitMode.BUS,
            google.maps.TransitMode.SUBWAY,
            google.maps.TransitMode.TRAIN,
            google.maps.TransitMode.TRAM
          ],
          routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
        };
      }

      directionsService.current!.route(baseRequest, (result, status) => {
        if (status === 'OK' && result) {
          const primaryRoute = result.routes[0];
          const leg = primaryRoute.legs[0];

          const alternatives = result.routes.slice(1).map((route, index) => ({
            route: route,
            distance: route.legs[0].distance?.text || 'Unknown',
            duration: route.legs[0].duration?.text || 'Unknown',
            description: generateRouteDescription(route, travelMode, index + 1)
          }));

          let transitDetails = undefined;
          if (travelMode === 'transit') {
            transitDetails = extractTransitDetails(leg);
          }

          const routeResult: RouteResult = {
            listingId,
            distance: leg.distance?.text || 'Unknown',
            duration: leg.duration?.text || 'Unknown',
            transportMode: travelMode,
            route: primaryRoute,
            alternatives: alternatives.length > 0 ? alternatives : undefined,
            transitDetails,
            isAtDestination: false
          };

          resolve(routeResult);
        } else {
          console.warn(`Route calculation failed for listing ${listingId}:`, status);
          resolve(null);
        }
      });
    });
  };

  const generateRouteDescription = (route: google.maps.DirectionsRoute, travelMode: TransportMode, index: number): string => {
    const leg = route.legs[0];
    
    if (travelMode === 'transit') {
      const transitSteps = leg.steps?.filter(step => step.travel_mode === 'TRANSIT') || [];
      if (transitSteps.length > 0) {
        const lines = transitSteps.map(step => {
          const transitDetails = step.transit;
          if (transitDetails?.line?.name) {
            return transitDetails.line.name;
          }
          return transitDetails?.line?.short_name || 'Transit';
        }).join(' → ');
        return `Route ${index}: via ${lines}`;
      }
    }
    
    return `Route ${index}: ${leg.duration?.text || 'Unknown time'}`;
  };

  const extractTransitDetails = (leg: google.maps.DirectionsLeg) => {
    const steps = leg.steps?.map(step => {
      const transitDetails = step.transit;
      
      return {
        travelMode: step.travel_mode,
        instructions: step.instructions || '',
        distance: step.distance?.text || '',
        duration: step.duration?.text || '',
        transitLine: transitDetails?.line?.name || transitDetails?.line?.short_name,
        departureTime: transitDetails?.departure_time?.text,
        arrivalTime: transitDetails?.arrival_time?.text
      };
    }) || [];

    return {
      steps,
      totalFare: leg.fare?.text,
      departureTime: leg.departure_time?.text,
      arrivalTime: leg.arrival_time?.text
    };
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

  const parseCommuteTime = (timeString: string): number => {
    const hourMatch = timeString.match(/(\d+)\s*hour/);
    const minMatch = timeString.match(/(\d+)\s*min/);
    
    let totalMinutes = 0;
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minMatch) totalMinutes += parseInt(minMatch[1]);
    
    return totalMinutes;
  };

  const parseDistance = (distanceString: string): number => {
    const match = distanceString.match(/([0-9.]+)\s*mi/);
    return match ? parseFloat(match[1]) : 0;
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedLocation(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setLocationError(null);
    inputRef.current?.focus();
    
    if (onShowMap) {
      onShowMap(false);
    }
  };

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'walking': return <PersonStanding size={20} />;
      case 'transit': return <Train size={20} />;
      case 'bicycling': return <Bike size={20} />;
      case 'driving': return <Car size={20} />;
      case 'scooter': return <Zap size={20} />;
      default: return <Route size={20} />;
    }
  };

  const getTransportLabel = (mode: TransportMode) => {
    switch (mode) {
      case 'walking': return 'Walking';
      case 'transit': return 'Transit';
      case 'bicycling': return 'Biking';
      case 'driving': return 'Driving';
      case 'scooter': return 'Scooter';
      default: return 'Unknown';
    }
  };

  const handleTransportModeChange = (mode: TransportMode) => {
    setSelectedTransportMode(mode);
    
    if (selectedLocation) {
      const updatedLocation = {
        ...selectedLocation,
        commutePreferences: {
          transportMode: mode,
          maxCommuteTime,
          maxDistance,
          showAlternatives,
          avoidTolls,
          avoidHighways
        }
      };
      setSelectedLocation(updatedLocation);
      onLocationSelect(updatedLocation);
    }
  };

  const handleTimeChange = (minutes: number) => {
    setMaxCommuteTime(minutes);
    updateLocationPreferences({ maxCommuteTime: minutes });
  };

  const handleDistanceChange = (miles: number) => {
    setMaxDistance(miles);
    updateLocationPreferences({ maxDistance: miles });
  };

  const toggleOption = (option: 'showAlternatives' | 'avoidTolls' | 'avoidHighways') => {
    const newValue = {
      showAlternatives: option === 'showAlternatives' ? !showAlternatives : showAlternatives,
      avoidTolls: option === 'avoidTolls' ? !avoidTolls : avoidTolls,
      avoidHighways: option === 'avoidHighways' ? !avoidHighways : avoidHighways
    };

    setShowAlternatives(newValue.showAlternatives);
    setAvoidTolls(newValue.avoidTolls);
    setAvoidHighways(newValue.avoidHighways);

    updateLocationPreferences(newValue);
  };

  const updateLocationPreferences = (updates: any) => {
    if (selectedLocation) {
      const updatedLocation = {
        ...selectedLocation,
        commutePreferences: {
          transportMode: selectedTransportMode,
          maxCommuteTime,
          maxDistance,
          showAlternatives,
          avoidTolls,
          avoidHighways,
          ...updates
        }
      };
      setSelectedLocation(updatedLocation);
      onLocationSelect(updatedLocation);
    }
  };

  const handleSearchClick = () => {
    if (selectedLocation && nearbyListings.length > 0) {
      if (onShowMap) {
        onShowMap(true);
      }
      calculateRoutesToListings(selectedLocation);
    } else if (!selectedLocation) {
      setLocationError('Please select a commute destination first.');
    } else if (nearbyListings.length === 0) {
      setLocationError('No listings available to calculate routes.');
    }
  };

  const getPlaceIcon = (types: string[]) => {
    if (types.includes('university') || types.includes('school')) return <MapPin size={16} className="text-blue-600" />;
    if (types.includes('transit_station') || types.includes('subway_station')) return <Train size={16} className="text-green-600" />;
    if (types.includes('establishment')) return <MapPin size={16} className="text-orange-600" />;
    return <MapPin size={16} className="text-gray-500" />;
  };

  // =====================
  // RENDER FUNCTIONS
  // =====================

  const renderErrorMessage = (message: string) => (
    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
      <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-red-700 text-sm leading-relaxed">{message}</p>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search size={20} className="text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setShowSuggestions(suggestions.length > 0)}
          placeholder="Search for your work, school, or commute destination..."
          disabled={!!mapsError}
          className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-lg transition-colors"
          >
            <X size={20} className="text-gray-400 hover:text-gray-600" />
          </button>
        )}
        
        {isSearching && (
          <div className="absolute inset-y-0 right-12 flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-400 border-t-transparent"></div>
          </div>
        )}

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.place_id}-${index}`}
                onClick={() => selectPlace(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3 transition-colors"
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

      {/* Transport Mode Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transportation</h3>
        <div className="grid grid-cols-5 gap-3">
          {[
            { mode: 'walking' as TransportMode, label: 'Walk', icon: <PersonStanding size={20} /> },
            { mode: 'transit' as TransportMode, label: 'Transit', icon: <Train size={20} /> },
            { mode: 'bicycling' as TransportMode, label: 'Bike', icon: <Bike size={20} /> },
            { mode: 'scooter' as TransportMode, label: 'Scooter', icon: <Zap size={20} /> },
            { mode: 'driving' as TransportMode, label: 'Drive', icon: <Car size={20} /> }
          ].map(({ mode, label, icon }) => (
            <button
              key={mode}
              onClick={() => handleTransportModeChange(mode)}
              disabled={!!mapsError}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedTransportMode === mode
                  ? 'border-orange-400 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className={selectedTransportMode === mode ? 'text-orange-600' : 'text-gray-400'}>
                {icon}
              </div>
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Commute Preferences */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Commute Limits</h3>
        
        <div className="space-y-6">
          {/* Max Time */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock size={16} className="text-gray-400" />
                Maximum commute time
              </label>
              <span className="text-lg font-semibold text-orange-600">{maxCommuteTime} min</span>
            </div>
            <div className="flex gap-2">
              {[15, 30, 45, 60].map(time => (
                <button
                  key={time}
                  onClick={() => handleTimeChange(time)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    maxCommuteTime === time
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {time}m
                </button>
              ))}
            </div>
          </div>

          {/* Max Distance */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                Maximum distance
              </label>
              <span className="text-lg font-semibold text-orange-600">{maxDistance} mi</span>
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 25].map(distance => (
                <button
                  key={distance}
                  onClick={() => handleDistanceChange(distance)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    maxDistance === distance
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {distance}mi
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="w-full flex items-center justify-between text-lg font-semibold text-gray-900 mb-4"
        >
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-400" />
            Advanced Options
          </div>
          <div className={`transform transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
        
        {showAdvancedOptions && (
          <div className="space-y-4 pt-2">
            {/* Show Alternatives */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Route size={18} className="text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Alternative routes</div>
                  <div className="text-sm text-gray-600">Compare multiple route options</div>
                </div>
              </div>
              <button
                onClick={() => toggleOption('showAlternatives')}
                className={`w-11 h-6 rounded-full transition-colors ${
                  showAlternatives ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                  showAlternatives ? 'translate-x-5' : 'translate-x-0.5'
                } mt-0.5`} />
              </button>
            </div>

            {/* Driving-specific options */}
            {(selectedTransportMode === 'driving' || selectedTransportMode === 'scooter') && (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <DollarSign size={18} className="text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Avoid tolls</div>
                      <div className="text-sm text-gray-600">Skip toll roads and bridges</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleOption('avoidTolls')}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      avoidTolls ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      avoidTolls ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Navigation size={18} className="text-gray-600" />
                    <div>
                      <div className="font-medium text-gray-900">Avoid highways</div>
                      <div className="text-sm text-gray-600">Take local streets and surface roads</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleOption('avoidHighways')}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      avoidHighways ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                      avoidHighways ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`} />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-orange-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-orange-800 mb-1">Commute Destination</div>
              
              {selectedLocation.placeName && (
                <p className="font-medium text-gray-900 mb-1">{selectedLocation.placeName}</p>
              )}
              
              <p className="text-sm text-gray-700 mb-3">{selectedLocation.address}</p>
              
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                  {getTransportLabel(selectedTransportMode)}
                </span>
                <span className="bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                  ≤ {maxCommuteTime} min
                </span>
                <span className="bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                  ≤ {maxDistance} mi
                </span>
                {showAlternatives && (
                  <span className="bg-white px-2 py-1 rounded border border-orange-200 text-orange-700">
                    Multiple routes
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Button */}
      <button
        onClick={handleSearchClick}
        disabled={!selectedLocation || isCalculatingRoutes || !nearbyListings.length}
        className="w-full py-4 px-6 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
      >
        {isCalculatingRoutes ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            <span>
              Calculating Routes...
              {calculationProgress.total > 0 && 
                ` (${calculationProgress.current}/${calculationProgress.total})`
              }
            </span>
          </>
        ) : (
          <>
            <Calculator size={20} />
            <span>Calculate Commute Times</span>
          </>
        )}
      </button>

      {/* Progress Bar */}
      {isCalculatingRoutes && calculationProgress.total > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(calculationProgress.current / calculationProgress.total) * 100}%` 
              }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 text-center">
            Processing listing {calculationProgress.current} of {calculationProgress.total}
          </div>
        </div>
      )}

      {/* Loading Status */}
      {!isGoogleMapsReady && !mapsError && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            <span>Loading Maps...</span>
          </div>
        </div>
      )}
    </div>
  );
}