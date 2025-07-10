import { useEffect, useRef, useState } from 'react';
import { 
  Search, MapPin, X, Navigation, Car, Bike, Users, 
  Clock, Route, AlertCircle, Calculator, Zap, Train, Bus
} from 'lucide-react';

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
  // GOOGLE MAPS INITIALIZATION (Fixed like LocationPicker)
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
        console.log('✅ Google Maps services initialized for commute search');
      } catch (error) {
        console.error('Error initializing Google Maps services:', error);
        setMapsError('Error initializing Google Maps. Some features may not work.');
        setIsGoogleMapsReady(true); // Still allow basic functionality
      }
    }
  };

  // =====================
  // FIXED SEARCH FUNCTIONS (Like LocationPicker)
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

    // Enhanced search request with broader types for commute destinations
    const request = {
      input: query,
      componentRestrictions: { country: 'us' },
      types: ['establishment', 'geocode'], // Include both places and addresses
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
      // Add location bias for Minneapolis area
      locationBias: {
        center: { lat: 44.9778, lng: -93.2358 },
        radius: 50000 // 50km radius around Minneapolis
      }
    };

    autocompleteService.current.getPlacePredictions(
      request,
      (predictions, status) => {
        setIsSearching(false);
        
        if (status === 'OK' && predictions) {
          // Sort predictions to prioritize workplaces, schools, and transit hubs
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
          console.log(`🔍 Found ${sortedPredictions.length} commute destination suggestions`);
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

        console.log('📍 Commute destination selected:', {
          name: placeName,
          address: locationData.address,
          coordinates: { lat: locationData.lat, lng: locationData.lng },
          types: place.types,
          isWorkplace: locationData.isWorkplace
        });

        setSearchQuery(place.formatted_address || suggestion.description);
        setSelectedLocation(locationData);
        setSuggestions([]);
        setShowSuggestions(false);
        onLocationSelect(locationData);
      } else {
        console.error('Place details request failed with status:', status);
        // Fallback handling
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
  // ENHANCED ROUTE CALCULATION
  // =====================

  const calculateRoutesToListings = async (fromLocation: any) => {
    if (!directionsService.current || !nearbyListings.length) {
      console.warn('⚠️ Cannot calculate routes: missing directions service or listings');
      return;
    }

    console.log('🚗 Starting enhanced route calculation for', nearbyListings.length, 'listings');
    setIsCalculatingRoutes(true);
    setCalculationProgress({ current: 0, total: nearbyListings.length });
    const results: RouteResult[] = [];

    try {
      for (let i = 0; i < nearbyListings.length; i++) {
        const listing = nearbyListings[i];
        setCalculationProgress({ current: i + 1, total: nearbyListings.length });
        
        let listingCoords;
        
        // Handle geocoding if needed
        if (listing.needsGeocoding && listing.neighborhood) {
          console.log(`🔍 Geocoding neighborhood for ${listing.id}: ${listing.neighborhood}`);
          
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
                    console.warn(`❌ Geocoding failed for ${listing.neighborhood}`);
                    resolve({
                      lat: 44.9778 + (Math.random() - 0.5) * 0.01,
                      lng: -93.2358 + (Math.random() - 0.5) * 0.01
                    });
                  }
                }
              );
            });
            
            listingCoords = geocodedCoords;
            console.log(`✅ Geocoded ${listing.neighborhood}:`, listingCoords);
          } catch (error) {
            console.error(`❌ Error geocoding ${listing.neighborhood}:`, error);
            listingCoords = {
              lat: 44.9778 + (Math.random() - 0.5) * 0.01,
              lng: -93.2358 + (Math.random() - 0.5) * 0.01
            };
          }
        }
        // Use existing coordinates
        else if (listing.lat && listing.lng) {
          listingCoords = {
            lat: listing.lat,
            lng: listing.lng
          };
          console.log(`📍 Using existing coordinates for ${listing.id}:`, listingCoords);
        }
        // Final fallback
        else {
          console.warn(`❌ No coordinates found for listing ${listing.id}, using fallback`);
          listingCoords = {
            lat: 44.9778 + (Math.random() - 0.5) * 0.01,
            lng: -93.2358 + (Math.random() - 0.5) * 0.01
          };
        }

        // Calculate enhanced route
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
          console.log(`✅ Enhanced route ${i + 1}/${nearbyListings.length} calculated for ${listing.id}`);
        } else {
          console.warn(`❌ Enhanced route ${i + 1}/${nearbyListings.length} failed for ${listing.id}`);
        }

        // Add delay to avoid API rate limits
        if (i < nearbyListings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      console.log('🎯 All enhanced route calculations completed:', {
        total: results.length,
        successful: results.filter(r => r).length,
        failed: nearbyListings.length - results.length
      });

      // Filter results based on preferences
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
      console.error('❌ Error in enhanced route calculation process:', error);
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

      // Enhanced request with mode-specific options
      const baseRequest: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(destination.lat, destination.lng),
        destination: new google.maps.LatLng(origin.lat, origin.lng),
        travelMode: getTravelMode(travelMode),
        unitSystem: google.maps.UnitSystem.IMPERIAL,
        provideRouteAlternatives: options.showAlternatives,
      };

      // Add mode-specific options
      if (travelMode === 'driving' || travelMode === 'scooter') {
        baseRequest.avoidHighways = options.avoidHighways;
        baseRequest.avoidTolls = options.avoidTolls;
        baseRequest.drivingOptions = {
          departureTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        };
      }

      if (travelMode === 'transit') {
        const now = new Date();
        const departureTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes from now
        
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

      console.log(`🛣️ Calculating ${travelMode} route for listing ${listingId}`);

      directionsService.current!.route(baseRequest, (result, status) => {
        if (status === 'OK' && result) {
          const primaryRoute = result.routes[0];
          const leg = primaryRoute.legs[0];

          // Process alternatives
          const alternatives = result.routes.slice(1).map((route, index) => ({
            route: route,
            distance: route.legs[0].distance?.text || 'Unknown',
            duration: route.legs[0].duration?.text || 'Unknown',
            description: generateRouteDescription(route, travelMode, index + 1)
          }));

          // Extract transit details for transit routes
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
            transitDetails
          };

          console.log(`✅ Enhanced ${travelMode} route calculated for ${listingId}:`, {
            duration: routeResult.duration,
            distance: routeResult.distance,
            alternatives: alternatives.length,
            hasTransitDetails: !!transitDetails
          });

          resolve(routeResult);
        } else {
          console.warn(`❌ Enhanced route calculation failed for listing ${listingId}:`, status);
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
  // CURRENT LOCATION (Fixed like LocationPicker)
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
                  commutePreferences: {
                    transportMode: selectedTransportMode,
                    maxCommuteTime,
                    maxDistance,
                    showAlternatives,
                    avoidTolls,
                    avoidHighways
                  },
                  ...addressComponents
                };

                setSearchQuery(result.formatted_address);
                setSelectedLocation(locationData);
                onLocationSelect(locationData);
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
            placeName: 'Current Location',
            commutePreferences: {
              transportMode: selectedTransportMode,
              maxCommuteTime,
              maxDistance,
              showAlternatives,
              avoidTolls,
              avoidHighways
            }
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
      case 'walking': return <Users size={18} className="text-green-500" />;
      case 'transit': return <Train size={18} className="text-blue-500" />;
      case 'bicycling': return <Bike size={18} className="text-orange-500" />;
      case 'driving': return <Car size={18} className="text-purple-500" />;
      case 'scooter': return <Zap size={18} className="text-yellow-500" />;
      default: return <Route size={18} className="text-gray-500" />;
    }
  };

  const getTransportLabel = (mode: TransportMode) => {
    switch (mode) {
      case 'walking': return 'Walking';
      case 'transit': return 'Public Transit';
      case 'bicycling': return 'Biking';
      case 'driving': return 'Driving';
      case 'scooter': return 'Scooter/E-bike';
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

  const handleCommutePreferencesChange = (
    timeMinutes: number, 
    distanceMiles: number, 
    alternatives: boolean = showAlternatives,
    tolls: boolean = avoidTolls,
    highways: boolean = avoidHighways
  ) => {
    setMaxCommuteTime(timeMinutes);
    setMaxDistance(distanceMiles);
    setShowAlternatives(alternatives);
    setAvoidTolls(tolls);
    setAvoidHighways(highways);
    
    if (selectedLocation) {
      const updatedLocation = {
        ...selectedLocation,
        commutePreferences: {
          transportMode: selectedTransportMode,
          maxCommuteTime: timeMinutes,
          maxDistance: distanceMiles,
          showAlternatives: alternatives,
          avoidTolls: tolls,
          avoidHighways: highways
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
    if (types.includes('university') || types.includes('school')) return <MapPin size={18} className="text-blue-500" />;
    if (types.includes('transit_station') || types.includes('subway_station')) return <Train size={18} className="text-green-500" />;
    if (types.includes('establishment')) return <MapPin size={18} className="text-purple-500" />;
    return <MapPin size={18} className="text-gray-400" />;
  };

  const handlePopularDestination = (destination: string) => {
    setSearchQuery(destination);
    if (isGoogleMapsReady && !mapsError) {
      searchPlaces(destination);
    }
  };

  // =====================
  // RENDER FUNCTIONS
  // =====================

  const renderErrorMessage = (message: string) => (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
      <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-red-700 text-sm">{message}</p>
    </div>
  );

  const renderTransportModeSelector = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
      {[
        { mode: 'walking' as TransportMode, label: 'Walk', icon: <Users size={16} /> },
        { mode: 'transit' as TransportMode, label: 'Transit', icon: <Train size={16} /> },
        { mode: 'bicycling' as TransportMode, label: 'Bike', icon: <Bike size={16} /> },
        { mode: 'scooter' as TransportMode, label: 'Scooter', icon: <Zap size={16} /> },
        { mode: 'driving' as TransportMode, label: 'Drive', icon: <Car size={16} /> }
      ].map(({ mode, label, icon }) => (
        <button
          key={mode}
          onClick={() => handleTransportModeChange(mode)}
          disabled={!!mapsError}
          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            selectedTransportMode === mode
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  );

  const renderAdvancedOptions = () => (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
      <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
        <Route size={16} />
        Advanced Route Options
      </h4>
      
      <div className="space-y-3">
        {/* Show Alternatives */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={showAlternatives}
            onChange={(e) => handleCommutePreferencesChange(
              maxCommuteTime, 
              maxDistance, 
              e.target.checked, 
              avoidTolls, 
              avoidHighways
            )}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
          <span className="text-sm text-gray-700">Show alternative routes</span>
        </label>

        {/* Driving-specific options */}
        {(selectedTransportMode === 'driving' || selectedTransportMode === 'scooter') && (
          <>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidTolls}
                onChange={(e) => handleCommutePreferencesChange(
                  maxCommuteTime, 
                  maxDistance, 
                  showAlternatives, 
                  e.target.checked, 
                  avoidHighways
                )}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Avoid tolls</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={avoidHighways}
                onChange={(e) => handleCommutePreferencesChange(
                  maxCommuteTime, 
                  maxDistance, 
                  showAlternatives, 
                  avoidTolls, 
                  e.target.checked
                )}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">Avoid highways</span>
            </label>
          </>
        )}

        {/* Transit-specific info */}
        {selectedTransportMode === 'transit' && (
          <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
            <Bus size={14} className="inline mr-1" />
            Routes will include buses, trains, and light rail with transfer information
          </div>
        )}

        {/* Biking-specific info */}
        {selectedTransportMode === 'bicycling' && (
          <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
            <Bike size={14} className="inline mr-1" />
            Routes will prefer bike lanes and bike-friendly streets
          </div>
        )}
      </div>
    </div>
  );

  const renderCommutePreferences = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Commute Time: {maxCommuteTime} minutes
        </label>
        <input
          type="range"
          min="5"
          max="60"
          step="5"
          value={maxCommuteTime}
          onChange={(e) => handleCommutePreferencesChange(
            parseInt(e.target.value), 
            maxDistance, 
            showAlternatives, 
            avoidTolls, 
            avoidHighways
          )}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5 min</span>
          <span>60 min</span>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Max Distance: {maxDistance} miles
        </label>
        <input
          type="range"
          min="1"
          max="25"
          step="1"
          value={maxDistance}
          onChange={(e) => handleCommutePreferencesChange(
            maxCommuteTime, 
            parseInt(e.target.value), 
            showAlternatives, 
            avoidTolls, 
            avoidHighways
          )}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-orange"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1 mi</span>
          <span>25 mi</span>
        </div>
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
          placeholder="Search for your work, school, or commute destination..."
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



      {/* Transport Mode & Preferences */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Route size={18} />
          Enhanced Commute Preferences
        </h3>
        
        {renderTransportModeSelector()}
        {renderCommutePreferences()}
        {renderAdvancedOptions()}
        
        <div className="text-sm text-gray-600 mb-4">
          <p className="flex items-center gap-1">
            <Clock size={14} />
            Selected: {getTransportLabel(selectedTransportMode)} • Max {maxCommuteTime} min • {maxDistance} miles
            {showAlternatives && ' • With alternatives'}
          </p>
        </div>

        {/* Enhanced Search Button with Progress */}
        <button
          onClick={handleSearchClick}
          disabled={!selectedLocation || isCalculatingRoutes || !nearbyListings.length}
          className="w-full py-3 px-6 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isCalculatingRoutes ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>
                Calculating Enhanced Routes... 
                {calculationProgress.total > 0 && 
                  ` (${calculationProgress.current}/${calculationProgress.total})`
                }
              </span>
            </>
          ) : (
            <>
              <Calculator size={18} />
              <span>Show Enhanced Commute Map & Results</span>
            </>
          )}
        </button>

        {/* Progress Bar */}
        {isCalculatingRoutes && calculationProgress.total > 0 && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${(calculationProgress.current / calculationProgress.total) * 100}%` 
                }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              Processing listing {calculationProgress.current} of {calculationProgress.total}
            </div>
          </div>
        )}
      </div>

      {/* Selected Location Display */}
      {selectedLocation && (
        <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
          <div className="flex items-start gap-3">
            <MapPin size={20} className="text-green-600 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-green-800">Enhanced Commute Destination</p>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              {selectedLocation.placeName && (
                <p className="font-medium text-gray-900 mb-1">{selectedLocation.placeName}</p>
              )}
              
              <p className="text-sm text-gray-700 mb-3">{selectedLocation.address}</p>
              
              {/* Enhanced Commute Summary */}
              <div className="bg-white p-3 rounded-lg border border-green-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="flex justify-center mb-1">
                      {getTransportIcon(selectedTransportMode)}
                    </div>
                    <p className="font-medium">{getTransportLabel(selectedTransportMode)}</p>
                  </div>
                  <div className="text-center">
                    <Clock size={16} className="mx-auto text-gray-600 mb-1" />
                    <p className="font-medium">≤ {maxCommuteTime} min</p>
                  </div>
                  <div className="text-center">
                    <Route size={16} className="mx-auto text-gray-600 mb-1" />
                    <p className="font-medium">≤ {maxDistance} mi</p>
                  </div>
                  <div className="text-center">
                    <Navigation size={16} className="mx-auto text-gray-600 mb-1" />
                    <p className="font-medium">{showAlternatives ? 'Multi-route' : 'Best route'}</p>
                  </div>
                </div>
                
                {/* Enhanced options summary */}
                {(avoidTolls || avoidHighways) && (
                  <div className="mt-2 pt-2 border-t border-green-200">
                    <div className="flex flex-wrap gap-1">
                      {avoidTolls && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          No tolls
                        </span>
                      )}
                      {avoidHighways && (
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                          Avoid highways
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
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

      {/* Popular Destinations */}
      {!searchQuery && !selectedLocation && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Popular commute destinations:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
            {[
              'University of Minnesota Twin Cities',
              'Downtown Minneapolis',
              'Mall of America',
              'Minneapolis-St. Paul Airport',
              'Target Corporation Headquarters',
              'Medtronic Corporate Headquarters'
            ].map((destination) => (
              <button
                key={destination}
                onClick={() => handlePopularDestination(destination)}
                disabled={!!mapsError}
                className="flex items-center gap-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <MapPin size={14} />
                {destination}
              </button>
            ))}
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-start gap-2">
              <Route size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800">Enhanced Route Features:</h4>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Mode-specific routes (transit shows bus/train lines, driving shows traffic-aware paths)</li>
                  <li>• Alternative route options with detailed comparisons</li>
                  <li>• Real-time transit schedules and transfer information</li>
                  <li>• Customizable preferences (avoid tolls, highways, etc.)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Status */}
      {!isGoogleMapsReady && !mapsError && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
            <span>Loading enhanced route calculation...</span>
          </div>
        </div>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .slider-orange::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider-orange::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #f97316;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider-orange:focus {
          outline: none;
        }
        
        .slider-orange:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
        }
      `}</style>
    </div>
  );
}