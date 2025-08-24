"use client"


import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Tv, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, CircleUser,
  Clock, TrendingUp, TrendingDown, ChevronDown, Package, Bell, MessagesSquare, AlertCircle, Menu,
  ArrowUp, Waves, Flame, Info, Thermoneter, Utensils, Dumbbell, Shield, Bookopen, Sofa, Trash2,
   Accessibility, ChefHat, BookOpen,Settings, Bed, Minus, CigaretteOff, Check, Cigarette
} from 'lucide-react';
import { Route, Car, Users as TransitIcon } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust path to your firebase config

import CommuteLocationPicker from '../../../components/CommuteLocationPicker'
import EnhancedCommuteResultsMap from '../../../components/CommuteMap' // Update path as needed
import SearchLocationPicker from '../../../components/SearchLocationPicker';


const NeighborhoodDetectorWrapper = ({ listing, onNeighborhoodDetected }: { 
  listing: any, 
  onNeighborhoodDetected: (neighborhood: string, coordinates?: {lat: number, lng: number}) => void 
}) => {
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [locationType, setLocationType] = useState<'specific' | 'neighborhood' | 'none'>('none');
  const [locationName, setLocationName] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [distanceFromSearch, setDistanceFromSearch] = useState<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      // Check if already loaded
      if (window.google?.maps?.places) {
        setGoogleMapsLoaded(true);
        return;
      }

      // Check if script is already added
      if (document.querySelector('script[src*="maps.googleapis.com"]')) {
        // Wait for it to load
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.places) {
            setGoogleMapsLoaded(true);
            clearInterval(checkInterval);
          }
        }, 500);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setLoadError('Google Maps API key not found');
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        setGoogleMapsLoaded(true);
        setLoadError(null);
      };
      
      script.onerror = () => {
        setLoadError('Failed to load Google Maps');
      };
      
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  useEffect(() => {
    const processListingLocation = () => {
      if (!listing) return;
      
      // ✅ CASE 1: Has specific coordinates in customLocation
      if (listing?.customLocation?.lat && listing?.customLocation?.lng) {
        const coords = {
          lat: Number(listing.customLocation.lat),
          lng: Number(listing.customLocation.lng)
        };
        setCoordinates(coords);
        setLocationType('specific');
        
        const locationDisplayName = listing.customLocation.placeName || 
                                   listing.customLocation.address || 
                                   'Specific Location';
        setLocationName(locationDisplayName);
        
        // Pass coordinates along with neighborhood detection
        if (listing.customLocation.placeName) {
          onNeighborhoodDetected(listing.customLocation.placeName, coords);
        } else {
          onNeighborhoodDetected(locationDisplayName, coords);
        }
        return;
      }
      
      // ✅ CASE 2: Has direct lat/lng coordinates
      if (listing?.lat && listing?.lng) {
        const coords = {
          lat: Number(listing.lat),
          lng: Number(listing.lng)
        };
        setCoordinates(coords);
        setLocationType('specific');
        
        const locationDisplayName = listing.address || listing.location || 'Specific Location';
        setLocationName(locationDisplayName);
        onNeighborhoodDetected(locationDisplayName, coords);
        return;
      }
      
      // ✅ CASE 3: Has neighborhood name (but not "Other")
      if (listing?.location && listing.location !== 'Other') {
        setLocationName(listing.location);
        setLocationType('neighborhood');
        
        // Default coordinates for Minneapolis
        const defaultCoords = { lat: 44.9778, lng: -93.2650 };
        setCoordinates(defaultCoords);
        onNeighborhoodDetected(listing.location, defaultCoords);

        // Search for the neighborhood if Google Maps is loaded
        if (googleMapsLoaded) {
          searchForNeighborhood(listing.location);
        }
        return;
      }
      
      // ✅ CASE 4: Location is "Other" but no customLocation
      if (listing?.location === 'Other' && !listing?.customLocation) {
        setLocationName('Location not specified');
        setLocationType('none');
        return;
      }
      
      // ✅ CASE 5: No location data at all
      setLocationName('No location');
      setLocationType('none');
    };

    processListingLocation();
  }, [listing, googleMapsLoaded]);

  // Enhanced geocoding for neighborhoods and addresses
  const searchForNeighborhood = async (neighborhood: string) => {
    if (!googleMapsLoaded || !window.google?.maps?.places?.PlacesService) {
      return;
    }

    setIsSearching(true);
    
    try {
      // Try multiple search strategies for better accuracy
      const searchQueries = [
        `${neighborhood}, Minneapolis, MN`,
        `${neighborhood} neighborhood, Minneapolis, Minnesota`,
        `${neighborhood}, University of Minnesota area`
      ];

      for (const query of searchQueries) {
        const result = await performPlacesSearch(query);
        if (result) {
          const coords = {
            lat: result.lat,
            lng: result.lng
          };
          setCoordinates(coords);
          // Update the parent with more accurate coordinates
          onNeighborhoodDetected(neighborhood, coords);
          setIsSearching(false);
          return;
        }
      }
      
      setIsSearching(false);
    } catch (error) {
      console.error('Error searching for neighborhood:', error);
      setIsSearching(false);
    }
  };

  const performPlacesSearch = (query: string): Promise<{lat: number, lng: number} | null> => {
    return new Promise((resolve) => {
      try {
        const mapDiv = document.createElement('div');
        const map = new window.google.maps.Map(mapDiv, {
          center: { lat: 44.9778, lng: -93.2650 },
          zoom: 13
        });

        const service = new window.google.maps.places.PlacesService(map);
        
        const request = {
          query: query,
          fields: ['name', 'geometry', 'place_id', 'formatted_address', 'types'],
          locationBias: {
            center: { lat: 44.9778, lng: -93.2650 },
            radius: 100000 // 50km radius around Minneapolis
          }
        };

        service.textSearch(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];
            const location = place.geometry?.location;
            
            if (location) {
              resolve({
                lat: location.lat(),
                lng: location.lng()
              });
              return;
            }
          }
          resolve(null);
        });
      } catch (error) {
        resolve(null);
      }
    });
  };

  // Calculate distance from current search location (if available)
  useEffect(() => {
    if (coordinates && window.searchLocationData?.lat && window.searchLocationData?.lng) {
      const distance = calculateDistance(
        window.searchLocationData.lat,
        window.searchLocationData.lng,
        coordinates.lat,
        coordinates.lng
      );
      setDistanceFromSearch(distance);
    }
  }, [coordinates]);

  // Create map when coordinates are available and Google Maps is loaded
  useEffect(() => {
    if (!mapRef.current || !googleMapsLoaded || !window.google?.maps || !coordinates || mapInstance) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: locationType === 'specific' ? 16 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          },
          {
            featureType: "transit",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      });

      // Add a marker with different colors based on type
      const markerColor = locationType === 'specific' ? '#f97316' : '#3b82f6';
      
      new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map,
        title: locationName,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="${markerColor}" stroke="#fff" stroke-width="2"/>
              <circle cx="16" cy="16" r="4" fill="#fff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      // Add a circle to show approximate area for neighborhoods
      if (locationType === 'neighborhood') {
        new window.google.maps.Circle({
          strokeColor: markerColor,
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: markerColor,
          fillOpacity: 0.15,
          map: map,
          center: { lat: coordinates.lat, lng: coordinates.lng },
          radius: 2000 // 2km radius for neighborhood
        });
      }

      setMapInstance(map);
    } catch (error) {
      console.error('Error creating map:', error);
    }
  }, [coordinates, locationName, mapInstance, googleMapsLoaded, locationType]);

  // Reset map instance when coordinates change
  useEffect(() => {
    setMapInstance(null);
  }, [coordinates]);

  // Show error if Google Maps failed to load
  if (loadError) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <MapPin size={20} className="text-red-500" />
        <div>
          <span className="text-red-700 font-medium">Maps unavailable</span>
          <p className="text-red-600 text-sm mt-1">Failed to load Google Maps</p>
        </div>
      </div>
    );
  }

  // Show loading if searching
  if (isSearching) {
    return (
      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-blue-700 font-medium">Finding {locationName} on map...</span>
      </div>
    );
  }

  // No location available
  if (locationType === 'none' || !coordinates) {
    return (
      <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <MapPin size={20} className="text-gray-400" />
        <div>
          <span className="text-gray-700 font-medium">Location not available</span>
          <p className="text-gray-500 text-sm mt-1">No location information provided for this listing</p>
        </div>
      </div>
    );
  }

  // Show location with map
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-orange-500" />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Location</h3>
            <p className="text-sm text-gray-600">{locationName}</p>
            {distanceFromSearch !== null && (
              <p className="text-xs text-blue-600 mt-1">
                📍 {distanceFromSearch.toFixed(1)}km from search location
              </p>
            )}
          </div>
          {/* Coordinate info for debugging */}
          <div className="text-xs text-gray-400">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </div>
        </div>
      </div>
      
      {/* Map */}
      <div className="relative">
        {googleMapsLoaded ? (
          <div 
            ref={mapRef}
            className="w-full h-64"
            style={{ minHeight: '256px' }}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent mx-auto mb-2"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        
        {/* Map overlay info */}
        {googleMapsLoaded && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm">
            <p className="text-sm font-medium text-gray-900">{locationName}</p>
            <p className="text-xs text-gray-600">
              {locationType === 'specific' ? 'Exact location' : 'Neighborhood area'}
            </p>
            {distanceFromSearch !== null && (
              <p className="text-xs text-blue-600 mt-1">
                {distanceFromSearch.toFixed(1)}km away
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function for distance calculation
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

// Helper function to get listing coordinates
const getListingCoordinates = (listing) => {
  // Priority 1: customLocation coordinates
  if (listing.customLocation?.lat && listing.customLocation?.lng) {
    return {
      lat: Number(listing.customLocation.lat),
      lng: Number(listing.customLocation.lng)
    };
  }
  
  // Priority 2: direct coordinates
  if (listing.lat && listing.lng) {
    return {
      lat: Number(listing.lat),
      lng: Number(listing.lng)
    };
  }
  
  // Priority 3: neighborhood coordinates
  if (listing.location && neighborhoodCoords[listing.location]) {
    return neighborhoodCoords[listing.location];
  }
  
  // Fallback to Minneapolis center
  return minneapolisCenter;
};




const SearchPage = ({ userData = null }) => { // Add default value for userData
  // =========================
  // State Definitions
  // =========================
  const [firebaseUserData, setFirebaseUserData] = useState(null);
  const [selectedLocationData, setSelectedLocationData] = useState(null);
  const [dateRange, setDateRange] = useState({ checkIn: null, checkOut: null });
  const [bathrooms, setBathrooms] = useState('any'); 
  const [bedrooms, setBedrooms] = useState('any');   
  const [location, setLocation] = useState([]);
  const [commuteLocation, setCommuteLocation] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [accommodationType, setAccommodationType] = useState(null);
  const [hasLoadedUserLocation, setHasLoadedUserLocation] = useState(false);

  const [priceRange, setPriceRange] = useState({ min: 500, max: 2000 });
  const [priceType, setPriceType] = useState('monthly'); // for monthly, weekly, daily price
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [enhancedRouteResults, setEnhancedRouteResults] = useState([]);
const [showEnhancedCommute, setShowEnhancedCommute] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [allListings, setAllListings] = useState([]);  
  const [savedSearches, setSavedSearches] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [mapListings, setMapListings] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [neighborhoods, setNeighborhoods] = useState([]);
const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const router = useRouter(); 
  const [commuteDestination, setCommuteDestination] = useState(null);
   // Add these state variables with your other state
const [isGoogleMapsLoading, setIsGoogleMapsLoading] = useState(false);
const [googleMapsError, setGoogleMapsError] = useState(null);
const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
const [locationError, setLocationError] = useState(null);
const [commuteRoutes, setCommuteRoutes] = useState([]);
const [showCommuteResults, setShowCommuteResults] = useState(false);
const [isCommuteMode, setIsCommuteMode] = useState(false);
const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
 // Add these state variables with your other st
const [isLoadingUser] = useState(null);
const [showSavedSearches, setShowSavedSearches] = useState(false);
const [preferredGender, setPreferredGender] = useState(null); 
const [smokingPreference, setSmokingPreference] = useState(null);
const [showProfile, setShowProfile] = useState(false);
const [showMenu, setShowMenu] = useState(false);
const [isLoggedIn, setIsLoggedIn] = useState(false);
const [showMapView, setShowMapView] = useState(false);
const [isMounted, setIsMounted] = useState(false);
  const minneapolisCenter = { lat: 44.9778, lng: -93.2358 };
  const neighborhoodCoords = {
    'Dinkytown': { lat: 44.9796, lng: -93.2354 },
    'East Bank': { lat: 44.9743, lng: -93.2277 },
    'Stadium Village': { lat: 44.9756, lng: -93.2189 },
    'Como': { lat: 44.9823, lng: -93.2077 },
    'Southeast Como': { lat: 44.9815, lng: -93.2065 }, // Add this line!
    'St. Paul': { lat: 44.9537, lng: -93.0900 },
    'Other': { lat: 44.9778, lng: -93.2358 }
  };

 
  // =========================
  // Helper Functions
  // =========================

 // Update the generateCoordinatesForNeighborhood function to be more precise:
const generateCoordinatesForNeighborhood = (neighborhood) => {
  const baseCoords = neighborhoodCoords[neighborhood] || minneapolisCenter;
  return {
    lat: baseCoords.lat + (Math.random() - 0.5) * 0.005, // Smaller random spread
    lng: baseCoords.lng + (Math.random() - 0.5) * 0.005
  };
};

// Add this helper function to SearchPage for consistent transport icons:
const getTransportIcon = (mode) => {
  switch (mode?.toLowerCase()) {
    case 'walking': 
      return <Users size={14} className="text-green-500" title="Walking" />;
    case 'transit': 
      return <Route size={14} className="text-blue-500" title="Public Transit" />;
    case 'bicycling': 
      return <Bike size={14} className="text-orange-500" title="Bicycle" />;
    case 'driving': 
      return <Car size={14} className="text-purple-500" title="Driving" />;
    case 'scooter': 
      return <Zap size={14} className="text-yellow-500" title="Scooter/E-bike" />;
    default: 
      return <Route size={14} className="text-gray-500" title="Transit" />;
  }
};
  
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Location parameter
  const locationParam = urlParams.get('location');
  if (locationParam) {
    setLocation(locationParam.split(','));
  }
  
  // Date parameters
  const checkInParam = urlParams.get('checkIn');
  const checkOutParam = urlParams.get('checkOut');
  if (checkInParam || checkOutParam) {
    setDateRange({
      checkIn: checkInParam ? new Date(checkInParam) : null,
      checkOut: checkOutParam ? new Date(checkOutParam) : null
    });
  }
  
  // Room parameters - properly handle 'any' values
  const bedroomsParam = urlParams.get('bedrooms');
  const bathroomsParam = urlParams.get('bathrooms');
  if (bedroomsParam !== null) {
    setBedrooms(bedroomsParam === 'any' ? 'any' : parseInt(bedroomsParam));
  }
  if (bathroomsParam !== null) {
    setBathrooms(bathroomsParam === 'any' ? 'any' : parseInt(bathroomsParam));
  }
  
  // Other parameters...
  const amenitiesParam = urlParams.get('amenities');
  if (amenitiesParam) {
    setSelectedAmenities(amenitiesParam.split(','));
  }
  
  const accommodationTypeParam = urlParams.get('accommodationType');
  if (accommodationTypeParam) {
    setAccommodationType(accommodationTypeParam);
  }
  
  const preferredGenderParam = urlParams.get('preferredGender');
  if (preferredGenderParam) {
    setPreferredGender(preferredGenderParam);
  }
  
  const smokingPreferenceParam = urlParams.get('smokingPreference');
  if (smokingPreferenceParam) {
    setSmokingPreference(smokingPreferenceParam);
  }
  
  // Price parameters
  const minPriceParam = urlParams.get('minPrice');
  const maxPriceParam = urlParams.get('maxPrice');
  const priceTypeParam = urlParams.get('priceType');
  if (minPriceParam || maxPriceParam) {
    setPriceRange({
      min: minPriceParam ? parseInt(minPriceParam) : 500,
      max: maxPriceParam ? parseInt(maxPriceParam) : 2000
    });
  }
  if (priceTypeParam) {
    setPriceType(priceTypeParam);
  }
  
  // Restore selectedLocationData if available
  const selectedLocationDataParam = urlParams.get('selectedLocationData');
  if (selectedLocationDataParam) {
    try {
      const locationData = JSON.parse(selectedLocationDataParam);
      setSelectedLocationData(locationData);
    } catch (error) {
      console.error('Error parsing selectedLocationData from URL:', error);
    }
  }
  
  // Auto-run search if URL has parameters
  if (urlParams.toString()) {
    setTimeout(() => {
      handleSearch();
    }, 500); 
  }
}, []);



  useEffect(() => {
    if (!isLoadingUser && !hasLoadedUserLocation && isGoogleMapsReady) {
      // Priority: firebaseUserData > userData prop
      const userLocationData = firebaseUserData?.userLocation || userData?.userLocation;
      
      if (userLocationData && userLocationData.lat && userLocationData.lng) {
        console.log('Auto-loading user saved location:', userLocationData);
        
        // Set the location display name
        const displayName = userLocationData.displayName || 
                           userLocationData.placeName || 
                           userLocationData.city || 
                           userLocationData.address;
        
        if (displayName) {
          setLocation([displayName]);
        }
        setHasLoadedUserLocation(true);
        
        // Generate neighborhoods around user's saved location
        generateNearbyNeighborhoods(userLocationData);
      } else {
        console.log('No saved user location found, using default setup');
        setHasLoadedUserLocation(true);
      }
    }
  }, [firebaseUserData, userData, isGoogleMapsReady, isLoadingUser, hasLoadedUserLocation]);



useEffect(() => {
  const fetchUserListings = async () => {
    try {
      const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const listings = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Validate and clean coordinate data
        const validateCoordinate = (coord) => {
          const num = Number(coord);
          return !isNaN(num) && isFinite(num) ? num : null;
        };
        
        let coordinates = null;
        let displayName = '';
        
        // Priority 1: customLocation from Firebase
        if (data.customLocation?.lat && data.customLocation?.lng) {
          const lat = validateCoordinate(data.customLocation.lat);
          const lng = validateCoordinate(data.customLocation.lng);
          if (lat && lng) {
            coordinates = {
              lat,
              lng,
              source: 'customLocation'
            };
            displayName = data.customLocation.placeName || data.customLocation.address || 'Specific Location';
          }
        }
        
        // Priority 2: direct lat/lng fields
        if (!coordinates && data.lat && data.lng) {
          const lat = validateCoordinate(data.lat);
          const lng = validateCoordinate(data.lng);
          if (lat && lng) {
            coordinates = {
              lat,
              lng,
              source: 'direct'
            };
            displayName = data.address || data.location || 'Specific Location';
          }
        }
        
        // Priority 3: generate from neighborhood
        if (!coordinates) {
          const generated = generateCoordinatesForNeighborhood(data.location || 'Other');
          coordinates = {
            ...generated,
            source: 'generated'
          };
          displayName = data.location || 'Campus Area';
        }

        const convertDate = (dateValue: any) => {
          if (!dateValue) return new Date();
          if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            return dateValue.toDate(); // Firestore Timestamp
          }
          if (typeof dateValue === 'string') {
            const parsed = new Date(dateValue);
            return isNaN(parsed.getTime()) ? new Date() : parsed;
          }
          return new Date();
        };

        return {
          id: doc.id,
          // Basic info with fallbacks
          title: data.title || `${data.listingType || 'Sublease'} in ${data.location || 'Campus Area'}`,
          listingType: data.listingType || 'Sublease',
          location: data.location || 'Campus Area',
          
          // Enhanced coordinate handling
          lat: coordinates.lat,
          lng: coordinates.lng,
          coordinateSource: coordinates.source,
          displayName: displayName,
          
          // Preserve original customLocation data
          customLocation: data.customLocation || null,
          address: data.address || data.customLocation?.address || displayName,
          
          // Properly handle dates
          availableFrom: convertDate(data.availableFrom || data.startDate),
          availableTo: convertDate(data.availableTo || data.endDate),
          dateRange: data.dateRange || `${new Date().toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
          
          // Ensure numbers are properly typed
          price: Number(data.price || data.rent || 0),
          rent: Number(data.rent || data.price || 0),
          bedrooms: Number(data.bedrooms || 1),
          bathrooms: Number(data.bathrooms || 1),
          distance: Number(data.distance || 0.5),
          rating: Number(data.rating || 0),
          reviews: Number(data.reviews || 0),
          
          // Handle booleans properly
          isPrivateRoom: Boolean(data.isPrivateRoom),
          utilitiesIncluded: Boolean(data.utilitiesIncluded),
          hasRoommates: Boolean(data.hasRoommates),
          
          // Ensure strings
          accommodationType: data.accommodationType || (data.isPrivateRoom ? 'private' : 'entire'),
          description: data.description || data.additionalDetails || 'No description available',
          hostName: data.hostName || 'Anonymous',
          hostEmail: data.hostEmail || '',
          hostBio: data.hostBio || `Hello, I'm ${data.hostName || 'a student'} looking to sublease my place.`,
          
          // Handle arrays properly
          amenities: Array.isArray(data.amenities) ? data.amenities : 
           (typeof data.amenities === 'object' && data.amenities !== null) ? Object.values(data.amenities) : [],
          includedItems: Array.isArray(data.includedItems) ? data.includedItems : [],
          
          // Default values for UI
          image: data.image || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop",
          hostImage: data.hostImage || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",

          // Handle complex objects
          contactInfo: data.contactInfo || { methods: [], note: '' },
          roommatePreferences: data.roommatePreferences || {},
          currentRoommateInfo: data.currentRoommateInfo || {},
          rentNegotiation: data.rentNegotiation || { isNegotiable: false, minPrice: 0, maxPrice: 0 },

          preferredGender: data.preferredGender || 'any'
        };
      });
      
      console.log("✅ Successfully fetched listings:", listings.length);
      setUserListings(listings);
      setAllListings(listings);
      setSearchResults(listings);
      
    } catch (error) {
      console.error('❌ Error fetching user listings:', error);
      // Don't leave empty arrays, use featured listings as fallback
      setUserListings(featuredListings || []);
      setAllListings(featuredListings || []);
      setSearchResults(featuredListings || []);
    }
  };

  fetchUserListings();
}, []);



useEffect(() => {
  setIsMounted(true);
  
  // get favorites from localStorage
  try {
    const savedFavorites = localStorage.getItem('favoriteListings');
    if (savedFavorites) {
      setFavoriteListings(JSON.parse(savedFavorites));
    }
  } catch (error) {
    console.error('Error loading favorites from localStorage:', error);
  }
}, []);

// update localStorage when favoriteListings is changed
useEffect(() => {
  if (isMounted && favoriteListings.length > 0) {
    try {
      localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }
}, [favoriteListings, isMounted]);

useEffect(() => {
  setSearchResults(allListings); // This will use the data from fetchUserListings
}, [allListings]);

  // location toggle function
  const toggleLocation = (loc) => {
    if (location.includes(loc)) {
      setLocation(location.filter(item => item !== loc));
    } else {
      setLocation([...location, loc]);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Calendar utilities
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = (month, year) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // Calendar navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Handle date selection
  const handleDateClick = (day) => {
    if (!day) return;

    const newDate = new Date(currentYear, currentMonth, day);
    
    if (!dateRange.checkIn) {
      setDateRange({ ...dateRange, checkIn: newDate });
      setSelectedDates([day]);
    } else if (!dateRange.checkOut) {
      // Ensure checkout is after checkin
      if (newDate > dateRange.checkIn) {
        setDateRange({ ...dateRange, checkOut: newDate });
        
        // Select all dates in the range
        const startDay = dateRange.checkIn.getDate();
        const range = [];
        for (let i = startDay; i <= day; i++) {
          range.push(i);
        }
        setSelectedDates(range);
      } else {
        // If user selects a date before current checkin, reset and set as new checkin
        setDateRange({ checkIn: newDate, checkOut: null });
        setSelectedDates([day]);
      }
    } else {
      // If both dates already selected, start over
      setDateRange({ checkIn: newDate, checkOut: null });
      setSelectedDates([day]);
    }
  };

  // Format date for display
const formatDate = (date) => {
  if (!date) return '';
  
  if (date instanceof Date) {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  // parse it when it is a string
  try {
    if (typeof date === 'string') {
      const [year, month, day] = date.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[parseInt(month) - 1]} ${parseInt(day)}`;
    }
    return '';
  } catch (error) {
    return '';
  }
};

  // Section toggle

  const toggleMapView = () => {
  setShowMapView(prev => !prev);
  };

  // const toggleMapView = () => {
  //   setShowMap(!showMap);
  //   if (!showMap) {
  //     setMapListings(searchResults);
  //   }
  // };

  const handleCommuteFilter = (filteredListings) => {
    setSearchResults(filteredListings);
    setMapListings(filteredListings);
  };
  



  useEffect(() => {
    if (!isLoadingUser && !hasLoadedUserLocation && isGoogleMapsReady) {
      // Priority: firebaseUserData > userData prop
      const userLocationData = firebaseUserData?.userLocation || userData?.userLocation;
      
      if (userLocationData && userLocationData.lat && userLocationData.lng) {
        console.log('Auto-loading user saved location:', userLocationData);
        
        // Set the location display name
        const displayName = userLocationData.displayName || 
                           userLocationData.placeName || 
                           userLocationData.city || 
                           userLocationData.address;
        
        if (displayName) {
          setLocation([displayName]);
        }
        setHasLoadedUserLocation(true);
        
        // Generate neighborhoods around user's saved location
        generateNearbyNeighborhoods(userLocationData);
      } else {
        console.log('No saved user location found, using default setup');
        setHasLoadedUserLocation(true);
      }
    }
  }, [firebaseUserData, userData, isGoogleMapsReady, isLoadingUser, hasLoadedUserLocation]);

// Add this useEffect after your existing useEffects
useEffect(() => {
  const loadGoogleMaps = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setGoogleMapsError('Google Maps API key not configured');
      return;
    }

    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsReady(true);
      return;
    }

    setIsGoogleMapsLoading(true);

    try {
      // Create script element
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait for Google Maps to be fully ready
        const checkReady = setInterval(() => {
          if (window.google && window.google.maps && window.google.maps.places) {
            clearInterval(checkReady);
            setIsGoogleMapsReady(true);
            setIsGoogleMapsLoading(false);
            console.log('✅ Google Maps loaded successfully');
          }
        }, 100);
        
        // Timeout after 5 seconds
 
      };
      
      script.onerror = () => {
        setGoogleMapsError('Failed to load Google Maps');
        setIsGoogleMapsLoading(false);
      };
      
      document.head.appendChild(script);
    } catch (error) {
      setGoogleMapsError('Error loading Google Maps');
      setIsGoogleMapsLoading(false);
    }
  };

  loadGoogleMaps();
}, []);

  // Notification data
  const notifications: Notification[] = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" }
  ];

// Notifications dropdown component
const NotificationsButton = ({ notifications }: { notifications: Notification[] }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => router.push(`browse/notificationDetail/${notif.id}`)}
                    className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notif.message}</p>
                      <p className="text-xs text-gray-500">{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => router.push(`/sale/browse/notification/`)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                See all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

  // Handle amenity selection
  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };
    const toggleGender = (genderKey) => {
  setPreferredGender(genderKey);
};

    const toggleSmoking = (smoking) => {
    if (smokingPreference === smoking) {
        setSmokingPreference(null); 
    } else {
        setSmokingPreference(smoking); 
    }
    };


  // Handle commute location selection
  const handleCommuteLocationSelect = (locationData) => {
    setCommuteDestination(locationData);
    setCommuteLocation(locationData.address);
    setIsCommuteMode(true);
    
    // Check if this has enhanced features
    if (locationData.commutePreferences.showAlternatives !== undefined) {
      setShowEnhancedCommute(true);
    }
    
    console.log('Enhanced commute destination selected:', locationData);
  };
  

// Handle route calculation results
const handleRouteCalculated = (routes) => {
  // Check if routes have enhanced features (alternatives, transit details, etc.)
  const hasEnhancedFeatures = routes.some(route => 
    route.alternatives || route.transitDetails || route.transportMode
  );
  
  if (hasEnhancedFeatures) {
    setEnhancedRouteResults(routes);
    setShowEnhancedCommute(true);
  } else {
    setCommuteRoutes(routes);
    setShowEnhancedCommute(false);
  }
  
  setShowCommuteResults(true);
  setShowMap(true);
  
  // Filter and sort listings by commute time
  const listingsWithRoutes = allListings.filter(listing => 
    routes.some(route => route.listingId === listing.id)
  );
  
  console.log('🎯 Enhanced route results processed:', listingsWithRoutes.length);
  
  const sortedListings = listingsWithRoutes.sort((a, b) => {
    const routeA = routes.find(r => r.listingId === a.id);
    const routeB = routes.find(r => r.listingId === b.id);
    
    if (!routeA || !routeB) return 0;
    
    const timeA = parseCommuteTime(routeA.duration);
    const timeB = parseCommuteTime(routeB.duration);
    
    return timeA - timeB;
  });
  
  setSearchResults(sortedListings);
  setLocationError(null);
  
  // Auto-scroll to results
  setTimeout(() => {
    const mapSection = document.querySelector('.commute-results-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 500);
};

const resetSearch = () => {
  setDateRange({ checkIn: null, checkOut: null });
  setBathrooms('any'); // Change from 1 to 'any'
  setBedrooms('any');  // Change from 1 to 'any'
  setLocation([]);
  setCommuteLocation('');
  setSelectedDates([]);
  setAccommodationType(null);
  setPriceRange({ min: 500, max: 2000 });
  setSelectedAmenities([]);
  setCommuteDestination(null);
  setCommuteRoutes([]);
  setShowCommuteResults(false);
  setIsCommuteMode(false);
  
  // Reset to show all listings
  setSearchResults([...allListings]);
};
// Parse commute time string to minutes for sorting
const parseCommuteTime = (timeString) => {
  const hourMatch = timeString.match(/(\d+)\s*hour/);
  const minMatch = timeString.match(/(\d+)\s*min/);
  
  let totalMinutes = 0;
  if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) totalMinutes += parseInt(minMatch[1]);
  
  return totalMinutes;
};

// Get route info for a specific listing
const getRouteInfo = (listingId) => {
  return commuteRoutes.find(route => route.listingId === listingId);
};

// Clear commute search
const clearCommuteSearch = () => {
  setCommuteDestination(null);
  setCommuteLocation('');
  setCommuteRoutes([]);
  setEnhancedRouteResults([]); // Add this line
  setShowCommuteResults(false);
  setShowEnhancedCommute(false); // Add this line
  setIsCommuteMode(false);
  setSearchResults(allListings);
};



  // Handle price range change
  const handlePriceChange = (type, value) => {
    const numValue = parseInt(value);

    if (type === 'min') {
      // check min value
      if (numValue < 500) {
        setPriceRange({ ...priceRange, min: 500 });
      } else if (numValue >= priceRange.max) {
        // min has not to over max
        setPriceRange({ ...priceRange, min: priceRange.max - 50 });
      } else {
        setPriceRange({ ...priceRange, min: numValue });
      }
    } else {
      // check max
      if (numValue > 2000) {
        setPriceRange({ ...priceRange, max: 2000 });
      } else if (numValue <= priceRange.min) {
        setPriceRange({ ...priceRange, max: priceRange.min + 50 });
      } else {
        setPriceRange({ ...priceRange, max: numValue });
      }
    }
  };

  const convertPrice = (monthlyPrice, type) => {
    switch(type) {
      case 'weekly':
        return Math.round(monthlyPrice / 4); // 1/4 of monthly price
      case 'daily':
        return Math.round(monthlyPrice / 30); // 1/30 of monthly price
      case 'monthly':
      default:
        return monthlyPrice;
    }
  };

  // price type
  const getPriceUnit = (type) => {
    switch(type) {
      case 'weekly':
        return '/week';
      case 'daily':
        return '/day';
      case 'monthly':
      default:
        return '/mo';
    }
  };

const handleSearch = () => {
  setIsSearching(true);
  
  // Store search location globally for distance calculations
  if (selectedLocationData?.lat && selectedLocationData?.lng) {
    window.searchLocationData = selectedLocationData;
  }
  
  // URL parameter update
  const searchParams = new URLSearchParams();
  
  if (location.length > 0) {
    searchParams.set('location', location.join(','));
  }
  if (dateRange.checkIn) {
    searchParams.set('checkIn', dateRange.checkIn);
  }
  if (dateRange.checkOut) {
    searchParams.set('checkOut', dateRange.checkOut);
  }
  if (bedrooms !== 'any') {
    searchParams.set('bedrooms', bedrooms);
  }
  if (bathrooms !== 'any') {
    searchParams.set('bathrooms', bathrooms);
  }
  if (selectedAmenities.length > 0) {
    searchParams.set('amenities', selectedAmenities.join(','));
  }
  if (priceRange.min !== 500 || priceRange.max !== 2000) {
    searchParams.set('priceMin', priceRange.min);
    searchParams.set('priceMax', priceRange.max);
  }
  if (selectedLocationData) {
    searchParams.set('locationData', JSON.stringify(selectedLocationData));
  }

  // URL update
  const newUrl = searchParams.toString() ? `${window.location.pathname}?${searchParams.toString()}` : window.location.pathname;
  window.history.pushState({}, '', newUrl);

  setTimeout(() => {
    let filtered = [...allListings];

    console.log('Starting with listings:', filtered.length); 
    
    // Enhanced Location filter with geographic distance
    if (location.length > 0 || selectedLocationData) {
      filtered = filtered.filter(listing => {
        // Get listing coordinates using helper function
        const listingCoords = getListingCoordinates(listing);
        
        // If we have selectedLocationData from SearchLocationPicker with coordinates
        if (selectedLocationData?.lat && selectedLocationData?.lng) {
          const distance = calculateDistance(
            selectedLocationData.lat,
            selectedLocationData.lng,
            listingCoords.lat,
            listingCoords.lng
          );
          
          // Use search radius from location data (convert meters to km)
          const maxDistance = (selectedLocationData.searchRadius || 10000) / 1000;
          
          console.log(`📍 Distance check: ${listing.title} is ${distance.toFixed(2)}km away (max: ${maxDistance}km)`);
          
          // Store distance on listing for sorting
          listing.distanceFromSearch = distance;
          
          return distance <= maxDistance;
        }
        
        // Fallback to text-based location matching for neighborhood searches
        if (location.length > 0) {
          return location.some(selectedLoc => {
            // Check customLocation placeName first
            if (listing.customLocation?.placeName) {
              const placeNameMatch = listing.customLocation.placeName.toLowerCase().includes(selectedLoc.toLowerCase());
              if (placeNameMatch) return true;
            }
            
            // Check customLocation address
            if (listing.customLocation?.address) {
              const addressMatch = listing.customLocation.address.toLowerCase().includes(selectedLoc.toLowerCase());
              if (addressMatch) return true;
            }
            
            // Check main location field
            const listingLocation = listing.location || '';
            return listingLocation.toLowerCase().includes(selectedLoc.toLowerCase()) ||
                   selectedLoc.toLowerCase().includes(listingLocation.toLowerCase());
          });
        }
        
        return true;
      });
      console.log('After location filter:', filtered.length);
      
      // Sort by distance if we have coordinates (closest to farthest)
      if (selectedLocationData?.lat && selectedLocationData?.lng) {
        filtered.sort((a, b) => {
          const distanceA = a.distanceFromSearch || 0;
          const distanceB = b.distanceFromSearch || 0;
          return distanceA - distanceB; // Closest first
        });
        console.log('🎯 Sorted listings by distance from search location');
      }
    }
    
    // Date filter - fix date comparison
    if (dateRange.checkIn && dateRange.checkOut) {
      filtered = filtered.filter(listing => {
        if (listing.availableFrom && listing.availableTo) {
          const listingStart = new Date(listing.availableFrom);
          const listingEnd = new Date(listing.availableTo);
          const searchStart = new Date(dateRange.checkIn);
          const searchEnd = new Date(dateRange.checkOut);
          
          // Check if the date ranges overlap
          return listingStart <= searchEnd && listingEnd >= searchStart;
        }
        return true; // Include listings without dates
      });
      console.log('After date filter:', filtered.length);
    }
      
    // Accommodation type filter
    if (accommodationType) {
      filtered = filtered.filter(listing => {
        const listingType = listing.accommodationType || 
          (listing.isPrivateRoom ? 'private' : 'entire');
        return listingType === accommodationType;
      });
      console.log('After accommodation type filter:', filtered.length);
    }
    
    // Bedrooms filter - only apply if not 'any'
    if (bedrooms !== 'any' && bedrooms >= 0) {
      filtered = filtered.filter(listing => 
        (listing.bedrooms || 1) >= bedrooms
      );
      console.log('After bedrooms filter:', filtered.length);
    }
    
    // Bathrooms filter - only apply if not 'any'
    if (bathrooms !== 'any' && bathrooms >= 1) {
      filtered = filtered.filter(listing => 
        (listing.bathrooms || 1) >= bathrooms
      );
      console.log('After bathrooms filter:', filtered.length);
    }
    
    // Price range filter
    filtered = filtered.filter(listing => {
      const price = listing.price || listing.rent || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });
    console.log('After price filter:', filtered.length);
    
    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter(listing => {
        if (!listing.amenities || !Array.isArray(listing.amenities)) return false;
        return selectedAmenities.some(amenity => 
          listing.amenities.some(listingAmenity => 
            listingAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        );
      });
      console.log('After amenities filter:', filtered.length);
    }

    // Smoking filter
    if (smokingPreference && smokingPreference !== 'any') {
      filtered = filtered.filter(listing => {
        const smokingAllowed = Boolean(listing.roommatePreferences?.smokingAllowed);
        
        if (smokingPreference === 'allowed') {
          return smokingAllowed === true;
        } else if (smokingPreference === 'not-allowed') {
          return smokingAllowed === false;
        }
        
        return true;
      });
      console.log('After smoking filter:', filtered.length);
    }

    // Gender filter
    if (preferredGender && preferredGender !== 'any') {
      filtered = filtered.filter(listing => {
        const listingGender = listing.preferredGender;

        if (!listingGender || listingGender === 'Any') {
          return true;
        }
        
        return listingGender === preferredGender;
      });
      console.log('After gender filter:', filtered.length);
    }
    
    // Final sorting: If no location-based sorting was applied, sort by creation date (newest first)
    if (!selectedLocationData?.lat || !selectedLocationData?.lng) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.availableFrom || 0);
        const dateB = new Date(b.createdAt || b.availableFrom || 0);
        return dateB.getTime() - dateA.getTime(); // Newest first
      });
      console.log('🕒 Sorted listings by date (newest first)');
    }
    
    console.log('Final filtered listings:', filtered.length);
    console.log('📊 Final results:', filtered.map(l => ({
      title: l.title,
      location: l.location || l.customLocation?.placeName,
      distance: l.distanceFromSearch ? `${l.distanceFromSearch.toFixed(1)}km` : 'N/A'
    })));
    
    setSearchResults(filtered);
    setIsSearching(false);
    setActiveSection(null);
  }, 1000);
};

  // Apply saved search
  const applySavedSearch = (search) => {
    // Apply all saved criteria
    setLocation(search.location || []);
    setDateRange(search.dateRange || { checkIn: null, checkOut: null });
    setBathrooms(search.bathrooms || 1);
    setBedrooms(search.bedrooms || 1);
    setAccommodationType(search.accommodationType || null);
    setPriceRange(search.priceRange || { min: 500, max: 2000 });
    setPriceType(search.priceType || 'monthly');
    setSelectedAmenities(search.selectedAmenities || []);
    setCommuteLocation(search.commuteLocation || '');
    
    // Update calendar if dates exist
    if (search.dateRange.checkIn) {
      const startDate = new Date(search.dateRange.checkIn);
      setCurrentMonth(startDate.getMonth());
      setCurrentYear(startDate.getFullYear());
      
      if (search.dateRange.checkOut) {
        updateSelectedDates(startDate, new Date(search.dateRange.checkOut));
      }
    }
    
    // Trigger search with the applied filters
    setTimeout(() => {
      handleSearch();
      
      // Scroll to top to see results
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  // Delete saved search
  const deleteSavedSearch = (id) => {
    setSavedSearches(savedSearches.filter(search => search.id !== id));
  };

  // Check if any search criteria is set
  const hasSearchCriteria = () => {
    return (
      dateRange.checkIn !== null || 
      dateRange.checkOut !== null || 
      bathrooms > 1 || 
      bedrooms >= 0 || 
      location.length > 0 || 
      commuteLocation !== '' ||
      accommodationType !== null ||
      priceRange.min !== 500 ||
      priceRange.max !== 2000 ||
      selectedAmenities.length > 0
    );
  };

  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'wifi': return <Wifi size={16} />;
      case 'parking': return <MapPin size={16} />;
      case 'laundry': return <Droplets size={16} />;
      case 'furnished': return <Home size={16} />;
      case 'utilities': return <DollarSign size={16} />;
      case 'ac': return <Sparkles size={16} />;
      default: return <Star size={16} />;
    }
  };

  // //favorites list
  // const toggleFavorite = (listing) => {
  // // check if it is already there
  // const isFavorited = favoriteListings.some(item => item.id === listing.id);
  
  // if (isFavorited) {
  //   // if already added, cancel it
  //   setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
  // } else {
  //   // add new favorites
  //   const favoriteItem = {
  //     id: listing.id,
  //     title: listing.title || 'Untitled Listing',
  //     location: listing.location || 'Unknown Location',
  //     price: listing.price || 0,
  //     bedrooms: listing.bedrooms || 1,
  //     // if there is a bathrooms, use it.
  //     ...(listing.bathrooms !== undefined && { bathrooms: listing.bathrooms }),
  //     image: listing.image || '/api/placeholder/800/500',
  //     // if there is a dataRange, use it.
  //     ...(listing.dateRange && { dateRange: listing.dateRange })
  //   };
    
  //   setFavoriteListings([favoriteItem, ...favoriteListings]);
  //   // open sidebar
  //   // setIsSidebarOpen(true);
  //   // change the tap into favorites
  //   setActiveTab('favorites');
  //   }
  // };

  const toggleFavorite = (listing, listingType = 'sublease') => {
  // Determine which localStorage key to use based on listing type
  const storageKey = listingType === 'sale' ? 'favoriteSaleItems' : 'favoriteSubleaseItems';
  
  try {
    // Get current favorites from localStorage
    const currentFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    // Check if listing is already favorited
    const isFavorited = currentFavorites.some(item => item.id === listing.id);
    
    let updatedFavorites;
    
    if (isFavorited) {
      // Remove from favorites
      updatedFavorites = currentFavorites.filter(item => item.id !== listing.id);
    } else {
      // Add to favorites
      const favoriteItem = listingType === 'sale' ? {
        id: listing.id,
        name: listing.name || listing.title || 'Untitled Item',
        price: listing.price || 0,
        location: listing.location || 'Unknown Location',
        image: listing.image || '/api/placeholder/400/300',
        category: listing.category || 'Other',
        condition: listing.condition || 'Good',
        postedDate: listing.postedDate || new Date().toISOString().split('T')[0]
      } : {
        id: listing.id,
        title: listing.title || 'Untitled Listing',
        price: listing.price || 0,
        location: listing.location || 'Unknown Location',
        image: listing.image || '/api/placeholder/800/500',
        bedrooms: listing.bedrooms || 1,
        bathrooms: listing.bathrooms || 1,
        startDate: listing.startDate || (listing.dateRange && listing.dateRange.split(' - ')[0]) || 'TBD',
        endDate: listing.endDate || (listing.dateRange && listing.dateRange.split(' - ')[1]) || 'TBD',
        amenities: listing.amenities || []
      };
      
      updatedFavorites = [favoriteItem, ...currentFavorites];
    }
    
    // Save updated favorites to localStorage
    localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
    
    // Update local state if you're tracking favorites in the search page
    if (listingType === 'sale') {
      setFavoriteSales && setFavoriteSales(updatedFavorites);
    } else {
      setFavoriteSubleases && setFavoriteSubleases(updatedFavorites);
    }
    
    return !isFavorited; // Return new favorite status
    
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return false;
  }
};

// Helper function to check if a listing is favorited
const isFavorited = (listingId, listingType = 'sublease') => {
  const storageKey = listingType === 'sale' ? 'favoriteSaleItems' : 'favoriteSubleaseItems';
  
  try {
    const currentFavorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return currentFavorites.some(item => item.id === listingId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

const [favoriteSales, setFavoriteSales] = useState([]);
const [favoriteSubleases, setFavoriteSubleases] = useState([]);

useEffect(() => {
  try {
    const savedSales = localStorage.getItem('favoriteSaleItems');
    if (savedSales) {
      setFavoriteSales(JSON.parse(savedSales));
    }
    
    const savedSubleases = localStorage.getItem('favoriteSubleaseItems');
    if (savedSubleases) {
      setFavoriteSubleases(JSON.parse(savedSubleases));
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}, []);

  // date range
  const updateSelectedDates = (start, end) => {
    if (!start || !end) return;
    
    if (start.getMonth() === currentMonth && start.getFullYear() === currentYear) {
      const startDay = start.getDate();
      const endDay = end.getMonth() === currentMonth ? end.getDate() : getDaysInMonth(currentMonth, currentYear);
      
      const range = [];
      for (let i = startDay; i <= endDay; i++) {
        range.push(i);
      }
      setSelectedDates(range);
    } else if (end.getMonth() === currentMonth && end.getFullYear() === currentYear) {
      const startDay = 1;
      const endDay = end.getDate();
      
      const range = [];
      for (let i = startDay; i <= endDay; i++) {
        range.push(i);
      }
      setSelectedDates(range);
    } else if (start.getMonth() < currentMonth && end.getMonth() > currentMonth && 
              start.getFullYear() <= currentYear && end.getFullYear() >= currentYear) {
      // if the month is in the middle of the range, select all the dates
      const daysInMonth = getDaysInMonth(currentMonth, currentYear);
      const range = [];
      for (let i = 1; i <= daysInMonth; i++) {
        range.push(i);
      }
      setSelectedDates(range);
    } else {
      setSelectedDates([]);
    }
  };
// Add this function after your other helper functions
const debugGoogleMaps = () => {
  console.log('🗺️ Window.google exists:', !!window.google);
  console.log('🗺️ Google.maps exists:', !!window.google?.maps);
  console.log('🗺️ Google.maps.places exists:', !!window.google?.maps?.places);
  console.log('🗺️ Google.maps.DirectionsService exists:', !!window.google?.maps?.DirectionsService);
  
  if (window.google?.maps) {
    console.log('✅ Google Maps API is loaded and ready');
  } else {
    console.error('❌ Google Maps API is not loaded');
  }
};

 const generateNearbyNeighborhoods = async (userLocation) => {
    if (!window.google || !userLocation.lat || !userLocation.lng) {
      console.log('Google Maps not ready or invalid location:', { userLocation });
      return;
    }
    
    setIsLoadingNeighborhoods(true);
    
    try {
      const neighborhoods = new Set();
      
      // Add user's current area as the first item
      const userAreaName = userLocation.displayName || 
                          userLocation.placeName || 
                          userLocation.city || 
                          'Your Area';
      neighborhoods.add(userAreaName);
      
      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      // Reduced radius for more accurate local neighborhoods (8km for cities, 5km for specific locations)
      const searchRadius = userLocation.areaType === 'city' ? 8000 : 5000;
      
      // Search for neighborhoods within reduced radius
      const request = {
        location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: searchRadius,
        type: 'sublocality_level_1'
      };

      await new Promise((resolve) => {
        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(place => {
              if (place.name && place.name.length > 2 && !place.name.includes('Unnamed')) {
                neighborhoods.add(place.name);
              }
            });
          }
          resolve();
        });
      });
      
      // Search for establishments and points of interest with smaller radius
      const poiRequest = {
        location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: 3000, // 3km for POIs
        type: 'establishment'
      };
      
      await new Promise((resolve) => {
        placesService.nearbySearch(poiRequest, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Only add well-known establishments that could serve as area identifiers
            results.slice(0, 5).forEach(place => {
              if (place.name && 
                  place.name.length > 3 && 
                  place.rating && place.rating > 4.0 &&
                  place.user_ratings_total && place.user_ratings_total > 100) {
                neighborhoods.add(`Near ${place.name}`);
              }
            });
          }
          resolve();
        });
      });
      
      // Add city-based areas if we have a city name
      const cityName = userLocation.city || userLocation.placeName;
      if (cityName && cityName !== userAreaName) {
        neighborhoods.add(cityName);
        neighborhoods.add(`Downtown ${cityName}`);
        
        // Only add university area if it's likely to have one
        if (cityName.toLowerCase().includes('college') || 
            cityName.toLowerCase().includes('university') ||
            neighborhoods.size < 4) {
          neighborhoods.add(`${cityName} - University Area`);
        }
      }
      
      // Convert Set to Array and clean up
      const cleanedNeighborhoods = Array.from(neighborhoods)
        .filter(name => name && name.length > 2)
        .filter(name => !name.toLowerCase().includes('unnamed'))
        .filter(name => !name.toLowerCase().includes('null'))
        .sort()
        .slice(0, 8); // Limit to 8 results for better UX
      
      console.log('Generated neighborhoods with user location:', cleanedNeighborhoods);
      setNeighborhoods(cleanedNeighborhoods);
      setIsLoadingNeighborhoods(false);
      
    } catch (error) {
      console.error('Error generating neighborhoods:', error);
      setIsLoadingNeighborhoods(false);
      
      // Fallback with basic city-based areas
      const cityName = userLocation.city || userLocation.placeName || "Your Area";
      const fallbackNeighborhoods = [
        userLocation.displayName || userLocation.placeName || cityName,
        cityName !== (userLocation.displayName || userLocation.placeName) ? cityName : null,
        `Downtown ${cityName}`,
      ].filter(Boolean);
      
      console.log('Using fallback neighborhoods:', fallbackNeighborhoods);
      setNeighborhoods(fallbackNeighborhoods);
    }
  };


// Call this when the location section opens
const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
      
      // Generate neighborhoods when location section opens
      if (section === 'location' && neighborhoods.length === 0) {
        const userLocationData = firebaseUserData?.userLocation || userData?.userLocation;
        if (userLocationData && isGoogleMapsReady) {
          generateNearbyNeighborhoods(userLocationData);
        }
      }
    }
  };

  // Add loading state UI like in your MoveOutSaleSearchPage
  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  // Add location status display in your header area (add this after the logo section)
  const renderLocationStatus = () => {
    if (location && location.length > 0 && location[0] !== "Select location") {
      return (
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            Searching in: <span className="font-semibold text-orange-600">{location[0]}</span>
            {location.length > 1 && <span> +{location.length - 1} more</span>}
          </p>
        </div>
      );
    }
    return null;
  };

const handleCommuteResults = (routes, destination) => {
  console.log('🎯 Handling commute results in SearchPage:', routes.length, 'routes');
  
  if (routes.length === 0) {
    console.warn('⚠️ No routes received!');
    setLocationError('No listings found within your commute preferences. Try increasing your max time or distance.');
    return;
  }
  
  setCommuteRoutes(routes);
  setCommuteDestination(destination);
  setIsCommuteMode(true);
  setShowCommuteResults(true);
  setShowMap(true); // ✅ Make sure this is set immediately
  
  // Filter and sort listings by commute time
  const listingsWithRoutes = allListings.filter(listing => 
    routes.some(route => route.listingId === listing.id)
  );
  
  console.log('🎯 Listings with routes:', listingsWithRoutes.length);
  
  const sortedListings = listingsWithRoutes.sort((a, b) => {
    const routeA = routes.find(r => r.listingId === a.id);
    const routeB = routes.find(r => r.listingId === b.id);
    
    if (!routeA || routeB) return 0;
    
    const timeA = parseCommuteTime(routeA.duration);
    const timeB = parseCommuteTime(routeB.duration);
    
    return timeA - timeB;
  });
  
  setSearchResults(sortedListings);
  
  // Clear any previous error
  setLocationError(null);
  
  // ✅ Add this: Force scroll to map after a brief delay
  setTimeout(() => {
    const mapSection = document.querySelector('.commute-results-section');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 500);
};

  // useEffect for calendar update
  useEffect(() => {
    if (dateRange.checkIn && dateRange.checkOut) {
      updateSelectedDates(dateRange.checkIn, dateRange.checkOut);
    }
  }, [currentMonth, currentYear, dateRange.checkIn, dateRange.checkOut]);

  // funtions for date change
  const setAvailableNow = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14); // 2 weeks
    
    setDateRange({ checkIn: startDate, checkOut: endDate });

    setCurrentMonth(startDate.getMonth());
    setCurrentYear(startDate.getFullYear());
    updateSelectedDates(startDate, endDate);
  };

  const setSummerSemester = () => {
    // 5/1 ~ 8/31
    const startDate = new Date(currentYear, 4, 1); // 5/1
    const endDate = new Date(currentYear, 7, 31); // 8/31
    
    setDateRange({ checkIn: startDate, checkOut: endDate });

    setCurrentMonth(4); // May
    setCurrentYear(currentYear);
    updateSelectedDates(startDate, endDate);
  };

  const setFallSemester = () => {
    // 8/30 ~ 12/15
    const startDate = new Date(currentYear, 7, 30); 
    const endDate = new Date(currentYear, 11, 15); 
    
    setDateRange({ checkIn: startDate, checkOut: endDate });

    setCurrentMonth(7); // August
    setCurrentYear(currentYear);
    updateSelectedDates(startDate, endDate);
  };

  // Update the handleListingClick function in your search page
  const handleListingClick = (listing) => {
    console.log('🔍 Navigating to listing:', listing.id);
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 Target URL:', `/sublease/search/${listing.id}`);
    
    try {
      // Try replace instead of push
      router.replace(`/sublease/search/${listing.id}`);
      console.log('✅ Router.replace called successfully');
    } catch (error) {
      console.error('❌ Router.replace failed:', error);
    }
  };
  
// Make sure your useEffect properly maps the Firestore data


  // neighborhood click handler
  const handleNeighborhoodClick = (neighborhoodName) => {
    setLocation([neighborhoodName]);
    
    setTimeout(() => {
      handleSearch();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

const getNeighborhoodCount = (neighborhoodName) => {
  return allListings.filter(listing => {
    const listingLocation = listing.location || listing.neighborhood || '';
    return listingLocation.toLowerCase().includes(neighborhoodName.toLowerCase()) ||
           neighborhoodName.toLowerCase().includes(listingLocation.toLowerCase());
  }).length;
};


  useEffect(() => {
    if (allListings.length > 0) {
      console.log('Sample listing structure:', allListings[0]);
      console.log('All listing locations:', allListings.map(l => l.location));
      console.log('All listing prices:', allListings.map(l => l.price || l.rent));
    }
  }, [allListings]);

// Add this helper function in your SearchPage component
const parseAddressComponents = (components) => {
  const addressInfo = {};
  
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


// Add this function in your SearchPage component
const geocodeNeighborhood = async (neighborhood, city = 'Minneapolis, MN') => {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      console.warn('Geocoder not available, using fallback coordinates');
      resolve(generateCoordinatesForNeighborhood(neighborhood));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const searchQuery = `${neighborhood}, ${city}`;
    
    console.log('🔍 Geocoding neighborhood:', searchQuery);
    
    geocoder.geocode(
      { 
        address: searchQuery,
        componentRestrictions: { country: 'US' }
      },
      (results, status) => {
        if (status === 'OK' && results?.[0]) {
          const result = results[0];
          const coords = {
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng()
          };
          
          console.log(`✅ Geocoded ${neighborhood}:`, coords);
          resolve(coords);
        } else {
          console.warn(`❌ Geocoding failed for ${neighborhood}, using fallback`);
          resolve(generateCoordinatesForNeighborhood(neighborhood));
        }
      }
    );
  });
};

// Enhanced function to process listings and get real coordinates
const processListingsWithRealCoordinates = async (listings) => {
  const processedListings = [];
  
  for (const listing of listings) {
    let coords;
    
    // If listing has customLocation with specific coordinates, use those
    if (listing.customLocation?.lat && listing.customLocation?.lng) {
      coords = {
        lat: listing.customLocation.lat,
        lng: listing.customLocation.lng
      };
      console.log(`📍 Using customLocation for ${listing.id}:`, coords);
    }
    // If listing has direct lat/lng coordinates, use those
    else if (listing.lat && listing.lng) {
      coords = {
        lat: listing.lat,
        lng: listing.lng
      };
      console.log(`📍 Using direct coordinates for ${listing.id}:`, coords);
    }
    // If listing only has neighborhood/location name, geocode it
    else if (listing.location) {
      console.log(`🔍 Need to geocode neighborhood for ${listing.id}: ${listing.location}`);
      coords = await geocodeNeighborhood(listing.location);
    }
    // Final fallback
    else {
      console.warn(`⚠️ No location info for ${listing.id}, using default coordinates`);
      coords = generateCoordinatesForNeighborhood('Minneapolis');
    }
    
    processedListings.push({
      id: listing.id,
      lat: coords.lat,
      lng: coords.lng,
      address: listing.customLocation?.address || listing.address || `${listing.location || 'Minneapolis'}, MN`,
      title: listing.title,
      price: listing.price,
      location: listing.location,
      customLocation: listing.customLocation
    });
  }
  
  return processedListings;
};


  // =========================
  // Render Components
  // =========================
 const renderLocationSection = () => {
    return (
      <div className="p-5 border-t border-gray-200 animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Enhanced Location Picker */}
          <div>
            <h3 className="font-bold mb-3 text-gray-800">Search by Location</h3>
            <SearchLocationPicker 
              initialValue={location[0] || ""}
              onLocationSelect={(selectedLocation) => {
                console.log('Location selected:', selectedLocation);
                
                // Handle different location types
                if (selectedLocation.areaType === 'city') {
                  // For city searches, set broader location filter
                  setLocation([selectedLocation.city || selectedLocation.placeName]);
                } else {
                  // For specific locations, use place name or address
                  setLocation([selectedLocation.placeName || selectedLocation.address]);
                }
                
                // Store full location data for filtering
                setSelectedLocationData(selectedLocation);
                
                // Generate new neighborhoods for the selected location
                if (selectedLocation.lat && selectedLocation.lng) {
                  generateNearbyNeighborhoods(selectedLocation);
                }
              }}
              customLocationsData={allListings}
            />
          </div>
          
          {/* Popular Neighborhoods */}
          <div>
            <h3 className="font-bold mb-3 text-gray-800">
              Popular Areas Near You
              {isLoadingNeighborhoods && (
                <span className="ml-2">
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></span>
                </span>
              )}
            </h3>
            
            <div className="overflow-y-auto max-h-80">
              {neighborhoods.length > 0 ? (
                <div className="space-y-2">
                  {neighborhoods.map((neighborhood, idx) => (
                    <button
                      key={idx}
                      className={`w-full p-3 rounded-lg text-left transition-all border ${
                        location.includes(neighborhood)
                          ? 'bg-orange-50 border-orange-300 text-orange-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                      }`}
                      onClick={() => {
                        if (location.includes(neighborhood)) {
                          // Remove if already selected
                          setLocation(location.filter(loc => loc !== neighborhood));
                        } else {
                          // Add to selection
                          setLocation([...location, neighborhood]);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MapPin size={16} className="text-orange-500 mr-3 flex-shrink-0" />
                          <span className="font-medium">{neighborhood}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {getNeighborhoodCount(neighborhood)} listings
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !isLoadingNeighborhoods ? (
                <div className="text-center py-8 text-gray-500">
                  <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-sm">No nearby areas found</p>
                  <p className="text-xs mt-1">Use the search on the left to find locations</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm">Loading nearby areas...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end items-center space-x-3">
          <button 
            className="px-3 py-1.5 text-orange-500 hover:underline"
            onClick={() => setActiveSection(null)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-700 font-medium"
            onClick={() => {
              setActiveSection(null);
              handleSearch();
            }}
          >
            Apply
          </button>
        </div>
      </div>
    );
  };


const renderCalendarSection = () => (
  <div className="p-5 border-t border-gray-200">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Options - Orange Theme */}
      <div className="lg:order-2">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock size={16} className="text-orange-500" />
          Quick Options
        </h3>
        <div className="space-y-2">
          <button 
            onClick={setAvailableNow}
            className="w-full p-3 border border-orange-200 text-gray-700 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="font-medium">Available Now</div>
            <div className="text-sm text-gray-500">Next 2 weeks</div>
          </button>
          
          <button 
            onClick={setSummerSemester}
            className="w-full p-3 border border-orange-200 text-gray-700 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="font-medium">Summer Semester</div>
            <div className="text-sm text-gray-500">May - August</div>
          </button>
          
          <button 
            onClick={setFallSemester}
            className="w-full p-3 border border-orange-200 text-gray-700 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="font-medium">Fall Semester</div>
            <div className="text-sm text-gray-500">August - December</div>
          </button>
        </div>
      </div>
      
      {/* Calendar - Orange Theme */}
      <div className="lg:col-span-2 lg:order-1">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Orange Header */}
          <div className="bg-orange-500 text-white p-3">
            <div className="flex justify-between items-center">
              <button 
                onClick={goToPreviousMonth} 
                className="p-2 hover:bg-orange-600 rounded transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="font-semibold">
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button 
                onClick={goToNextMonth} 
                className="p-2 hover:bg-orange-600 rounded transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="p-3">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays(currentMonth, currentYear).map((day, i) => {
                const isToday = day && new Date().getDate() === day && 
                              new Date().getMonth() === currentMonth && 
                              new Date().getFullYear() === currentYear;
                const isSelected = selectedDates.includes(day);
                const isCheckIn = dateRange.checkIn && 
                              dateRange.checkIn.getDate() === day && 
                              dateRange.checkIn.getMonth() === currentMonth && 
                              dateRange.checkIn.getFullYear() === currentYear;
                const isCheckOut = dateRange.checkOut && 
                              dateRange.checkOut.getDate() === day && 
                              dateRange.checkOut.getMonth() === currentMonth && 
                              dateRange.checkOut.getFullYear() === currentYear;
                
                let dayClass = "h-10 flex items-center justify-center rounded cursor-pointer transition-colors ";
                
                if (!day) {
                  dayClass += "text-gray-300 cursor-default";
                } else if (isCheckIn || isCheckOut) {
                  dayClass += "bg-orange-500 text-white font-medium";
                } else if (isSelected) {
                  dayClass += "bg-orange-100 text-orange-800";
                } else if (isToday) {
                  dayClass += "bg-gray-100 text-gray-900 font-medium ring-2 ring-orange-300";
                } else {
                  dayClass += "hover:bg-orange-50 text-gray-700";
                }
                
                return (
                  <div 
                    key={i} 
                    className={dayClass}
                    onClick={() => day && handleDateClick(day)}
                  >
                    {day}
                    {/* Today indicator */}
                    {isToday && !isCheckIn && !isCheckOut && (
                      <div className="absolute bottom-1 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Orange Selection Summary */}
    <div className="mt-4 bg-orange-50 p-4 rounded-lg border border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-600">Check-in: </span>
            <span className="font-medium">
              {dateRange.checkIn ? formatDate(dateRange.checkIn) : 'Select date'}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Check-out: </span>
            <span className="font-medium">
              {dateRange.checkOut ? formatDate(dateRange.checkOut) : 'Select date'}
            </span>
          </div>
          {dateRange.checkIn && dateRange.checkOut && (
            <div className="text-sm px-2 py-1 bg-orange-200 text-orange-800 rounded">
              {Math.ceil((dateRange.checkOut - dateRange.checkIn) / (1000 * 60 * 60 * 24))} nights
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {(dateRange.checkIn || dateRange.checkOut) && (
            <button 
              className="text-sm text-gray-500 hover:text-gray-700"
              onClick={() => {
                setDateRange({ checkIn: null, checkOut: null });
                setSelectedDates([]);
              }}
            >
              Clear
            </button>
          )}
          <button 
            className="px-4 py-2 rounded bg-orange-500 text-white hover:bg-orange-600 font-medium transition-colors"
            onClick={() => {
              setActiveSection(null);
              handleSearch();
            }}
          >
            Apply Dates
          </button>
        </div>
      </div>
    </div>
  </div>
);

  // Rooms Section
const renderRoomsSection = () => (
  <div className="p-5 border-t border-gray-200 animate-fadeIn">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="font-bold mb-3 text-gray-800">Room Configuration</h3>
        
        {/* Bedrooms Section */}
        <div className="p-4 border rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-600">Bedrooms</div>
              <div className="text-sm text-gray-500">Number of bedrooms</div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                  bedrooms === 'any' 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'border-gray-300 text-gray-600 hover:border-orange-500'
                }`}
                onClick={() => setBedrooms('any')}
              >
                Any+
              </button>
              <button 
                className={`w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center cursor-pointer ${
                  bedrooms !== 'any' && bedrooms > 0 ? 'text-orange-500' : 'text-gray-300'
                }`}
                onClick={() => setBedrooms(bedrooms === 'any' ? 1 : Math.max(0, bedrooms - 1))}
                disabled={bedrooms === 'any' || bedrooms <= 0}
              >
                -
              </button>
              <span className="text-lg font-medium w-6 text-center text-gray-700">
                {bedrooms === 'any' ? 'Any' : bedrooms}
              </span>
              <button 
                className="w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center text-orange-500 cursor-pointer"
                onClick={() => setBedrooms(bedrooms === 'any' ? 0 : bedrooms + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
        
        {/* Bathrooms Section */}
        <div className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-gray-600">Bathrooms</div>
              <div className="text-sm text-gray-500">Number of bathrooms</div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${
                  bathrooms === 'any' 
                    ? 'bg-orange-500 text-white border-orange-500' 
                    : 'border-gray-300 text-gray-600 hover:border-orange-500'
                }`}
                onClick={() => setBathrooms('any')}
              >
                Any+
              </button>
              <button 
                className={`w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center cursor-pointer ${
                  bathrooms !== 'any' && bathrooms > 1 ? 'text-orange-500' : 'text-gray-300'
                }`}
                onClick={() => setBathrooms(bathrooms === 'any' ? 2 : Math.max(1, bathrooms - 1))}
                disabled={bathrooms === 'any' || bathrooms <= 1}
              >
                -
              </button>
              <span className="text-lg font-medium w-6 text-center text-gray-700">
                {bathrooms === 'any' ? 'Any' : bathrooms}
              </span>
              <button 
                className="w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center text-orange-500 cursor-pointer"
                onClick={() => setBathrooms(bathrooms === 'any' ? 1 : bathrooms + 1)}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Accommodation Type */}
      <div className="mb-6">
        <h3 className="font-bold mb-3 text-gray-800">Accommodation Type</h3>
        <div className="grid grid-cols-1 gap-3">
          {[
            { key: 'entire', label: 'Entire Place', desc: 'Have the entire place to yourself', icon: <Home size={18} className = "text-gray-700"/> },
            { key: 'private', label: 'Private Room', desc: 'Your own bedroom, shared spaces', icon:  <Bed size={18} className = "text-gray-700"/> },
            { key: 'shared', label: 'Shared Room', desc: 'Share a bedroom with others', icon:  <Users size={18} className = "text-gray-700"/> }
          ].map((type) => (
            <div
              key={type.key}
              className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                accommodationType === type.key 
                  ? 'bg-orange-50 border-orange-200 shadow-md' 
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => setAccommodationType(accommodationType === type.key ? null : type.key)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{type.icon}</span>
                  <div className="font-semibold text-gray-700">{type.label}</div>
                </div>
                {accommodationType === type.key && (
                  <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {type.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    
    <div className="mt-6 flex justify-end items-center space-x-3">
      <button 
        className="px-3 py-1.5 text-orange-500 hover:underline"
        onClick={() => setActiveSection(null)}
      >
        Cancel
      </button>
      <button 
        className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-700 font-medium"
        onClick={() => {
          setActiveSection(null);
          handleSearch();
        }}
      >
        Apply
      </button>
    </div>
  </div>
);

  // Filters Section
const renderFiltersSection = () => {
  // Simple function to count listings in range
  const getListingsInRange = (min, max) => {
    return allListings.filter(listing => {
      const price = listing.price || listing.rent || 0;
      return price >= min && price <= max;
    }).length;
  };

  return (
    <div className="p-5 border-t border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clean Price Range Section */}
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Price Range</h3>
          <div className="p-4 border rounded-lg">
            {/* Payment Frequency Toggle */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Payment Frequency</div>
              <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
                {[
                  { key: 'monthly', label: 'Monthly' },
                  { key: 'weekly', label: 'Weekly' },
                  { key: 'daily', label: 'Daily' }
                ].map(type => (
                  <button 
                    key={type.key}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      priceType === type.key 
                        ? 'bg-orange-500 text-white' 
                        : 'text-gray-600 hover:bg-white'
                    }`}
                    onClick={() => setPriceType(type.key)}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Visual Bar with Selected Range */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
        
              </div>
              
              {/* Visual Price Bar */}
              <div className="relative h-8 bg-gray-200 rounded-lg overflow-hidden">
                {/* Background bars showing distribution */}
                <div className="absolute inset-0 flex">
                  {[500, 750, 1000, 1250, 1500, 1750, 2000].map((price, index) => {
                    const count = getListingsInRange(price - 125, price + 125);
                    const opacity = count > 0 ? Math.min(count / 10, 1) : 0.1;
                    
                    return (
                      <div 
                        key={index}
                        className="flex-1 bg-orange-200 mx-px"
                        style={{ opacity: opacity }}
                      />
                    );
                  })}
                </div>
                
                {/* Selected range overlay */}
                <div 
                  className="absolute h-full bg-orange-500 transition-all duration-300"
                  style={{
                    left: `${((priceRange.min - 500) / (2000 - 500)) * 100}%`,
                    width: `${((priceRange.max - priceRange.min) / (2000 - 500)) * 100}%`
                  }}
                />
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>${convertPrice(500, priceType)}</span>
                <span>${convertPrice(1250, priceType)}</span>
                <span>${convertPrice(2000, priceType)}</span>
              </div>
            </div>

            {/* Selected Range Display */}
            <div className="mb-4 text-center">
              <div className="text-lg font-semibold text-gray-800">
                ${convertPrice(priceRange.min, priceType)} - ${convertPrice(priceRange.max, priceType)} {getPriceUnit(priceType)}
              </div>
              <div className="text-sm text-gray-600">
                {getListingsInRange(priceRange.min, priceRange.max)} listings available
              </div>
            </div>

            
            
            {/* Manual Input */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Minimum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min={priceType === 'monthly' ? 500 : priceType === 'weekly' ? 125 : 17}
                    max={priceType === 'monthly' ? 1950 : priceType === 'weekly' ? 487 : 65}
                    step={priceType === 'monthly' ? 25 : priceType === 'weekly' ? 6 : 1}
                    value={convertPrice(priceRange.min, priceType)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      let monthlyValue;
                      switch(priceType) {
                        case 'weekly': monthlyValue = value * 4; break;
                        case 'daily': monthlyValue = value * 30; break;
                        default: monthlyValue = value;
                      }
                      handlePriceChange('min', monthlyValue);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-300 focus:border-orange-400 text-sm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Maximum
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min={priceType === 'monthly' ? 550 : priceType === 'weekly' ? 137 : 18}
                    max={priceType === 'monthly' ? 2000 : priceType === 'weekly' ? 500 : 67}
                    step={priceType === 'monthly' ? 25 : priceType === 'weekly' ? 6 : 1}
                    value={convertPrice(priceRange.max, priceType)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0;
                      let monthlyValue;
                      switch(priceType) {
                        case 'weekly': monthlyValue = value * 4; break;
                        case 'daily': monthlyValue = value * 30; break;
                        default: monthlyValue = value;
                      }
                      handlePriceChange('max', monthlyValue);
                    }}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-orange-300 focus:border-orange-400 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amenities Section */}
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Amenities</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'wifi', label: 'WiFi Included', icon: <Wifi size={16} /> },
              { id: 'parking', label: 'Parking', icon: <MapPin size={16} /> },
              { id: 'laundry', label: 'In-unit Laundry', icon: <Droplets size={16} /> },
              { id: 'pets', label: 'Pet Friendly', icon: <Sparkles size={16} /> },
              { id: 'furnished', label: 'Furnished', icon: <Home size={16} /> },
              { id: 'utilities', label: 'Utilities Included', icon: <DollarSign size={16} /> },
              { id: 'ac', label: 'Air Conditioning', icon: <Sparkles size={16} /> },
              { id: 'gym', label: 'Fitness Center', icon: <Users size={16} /> },
              { id: 'dishwasher', label: 'Dishwasher', icon: <Utensils size={16} /> },
              { id: 'elevator', label: 'Elevator access', icon: <ArrowUp size={16} /> },
              { id: 'security', label: '24/7 Security', icon: <Shield size={16} /> },
              { id: 'study', label: 'Study space', icon: <BookOpen size={16} /> },
              { id: 'swim', label: 'Swimming pool', icon: <Waves size={16} /> },
              { id: 'grill', label: 'BBQ Area', icon: <Flame size={16} /> }
            ].map(amenity => (
              <button
                key={amenity.id}
                className={`flex items-center p-3 border rounded-lg transition-all ${
                  selectedAmenities.includes(amenity.id) 
                    ? 'bg-orange-50 border-orange-500 text-orange-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => toggleAmenity(amenity.id)}
              >
                <div className={`p-1 rounded-md mr-2 ${
                  selectedAmenities.includes(amenity.id)
                    ? 'bg-orange-100'
                    : 'bg-gray-100'
                }`}>
                  {amenity.icon}
                </div>
                <span className="text-sm font-medium">{amenity.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Gender */}
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Preferred Gender</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { key: 'any', label: 'Any Gender', icon: <Users size={18} className="text-gray-700"/> },
              { key: 'Female', label: 'Female Only', icon: <User size={18} className="text-gray-700"/>},
              { key: 'Male', label: 'Male Only', icon: <User size={18} className="text-gray-700"/> }
            ].map(gender => (
              <button
                key={gender.key}
                className={`flex items-center p-3 border rounded-lg transition-all ${
                  preferredGender === gender.key 
                    ? 'bg-orange-50 border-orange-500 text-orange-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => toggleGender(gender.key)}
              >
                <span className="text-lg mr-2">{gender.icon}</span>
                <span className="text-sm font-medium">{gender.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Smoking Preference */}
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Smoking Preference</h3>
          <div className="grid grid-cols-1 gap-3">
            {[
              { key: 'any', label: 'Any', icon: <Users size={18} className="text-gray-700"/> },
              { key: 'allowed', label: 'Smoking Allowed', icon: <Cigarette size={18} className="text-gray-700"/>},
              { key: 'not-allowed', label: 'Non-Smoking Only', icon: <X size={18} className="text-gray-700"/> }
            ].map(option => (
              <button
                key={option.key}
                className={`flex items-center p-3 border rounded-lg transition-all ${
                  smokingPreference === option.key
                    ? 'bg-orange-50 border-orange-500 text-orange-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => setSmokingPreference(option.key)}
              >
                <span className="text-lg mr-2">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-between items-center">
        <button 
          className="text-orange-500 text-sm font-medium hover:underline flex items-center"
          onClick={() => {
            setPriceRange({ min: 500, max: 2000 });
            setSelectedAmenities([]);
            setPreferredGender(null);
            setSmokingPreference(null);
          }}
        >
          <X size={16} className="mr-1" />
          Clear all filters
        </button>
        
        <div className="flex items-center space-x-3">
          <button 
            className="px-3 py-1.5 text-orange-500 hover:underline"
            onClick={() => setActiveSection(null)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium"
            onClick={() => {
              setActiveSection(null);
              handleSearch();
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};


  // Favorites Sidebar
const renderFavoritesSidebar = () => (
  <div className={`fixed left-0 top-0 md:top-0 top-16 h-full md:h-full h-[calc(100%-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>
    <div className="p-4 border-b">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg text-orange-500">Favorites</h2>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
    </div>
    
    <div className="p-4">
      {/* favorites list */}
      {favoriteListings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Heart size={40} className="mx-auto mb-2 opacity-50" />
          <p>No favorite listings yet</p>
          <p className="text-sm mt-2">Click the heart icon on listings to save them here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {favoriteListings.map(listing => (
            <div key={listing.id} className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer">
              <div className="flex">
                <div 
                  className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                  style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                ></div>
                <div className="p-3 flex-1">
                  <div className="font-medium text-gray-700">{listing.title}</div>
                  <div className="text-sm text-gray-500">{listing.location}</div>
                  <div className="text-sm font-bold text-[#15361F] mt-1">
                    ${convertPrice(listing.price, priceType)}{getPriceUnit(priceType)}
                  </div>
                </div>
                <button 
                  className="p-2 text-gray-400 hover:text-red-500 self-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(listing);}}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
  );

  const saveSearch = () => {
    if (!hasSearchCriteria()) return;
    
    // Create a descriptive name for the search
    let searchName = '';
    if (location.length > 0) {
      searchName = location.length === 1 ? location[0] : `${location[0]} +${location.length - 1}`;
    } else {
      searchName = 'Campus Area';
    }
    
    if (dateRange.checkIn) {
      searchName += ` • ${formatDate(dateRange.checkIn)}`;
      if (dateRange.checkOut) {
        searchName += ` - ${formatDate(dateRange.checkOut)}`;
      }
    }
    
    const newSavedSearch = {
      id: Date.now(),
      name: searchName,
      location: [...location],
      dateRange: { ...dateRange },
      bathrooms: bathrooms,
      bedrooms: bedrooms,
      accommodationType: accommodationType,
      priceRange: { ...priceRange },
      priceType: priceType,
      selectedAmenities: [...selectedAmenities],
      commuteLocation: commuteLocation,
      savedAt: new Date().toISOString(),
      resultCount: searchResults.length
    };
    
    setSavedSearches([newSavedSearch, ...savedSearches]);
    
    // Show success feedback
    setTimeout(() => {
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'Search saved successfully!';
      document.body.appendChild(successMessage);
      
      setTimeout(() => {
        successMessage.remove();
      }, 3000);
    }, 100);
  };

  // Featured Listings Section
  const renderFeaturedListings = () => {
    const displayListings = searchResults;
    const sectionTitle = isCommuteMode 
      ? `Listings Sorted by Commute Time (${displayListings.length} found)` 
      : hasSearchCriteria() 
        ? `Search Results (${displayListings.length} found)` 
        : 'All Subleases';
  
    return (
      <div className="w-full md:pr-3 px-4 mt-12 mb-16 md:pr-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-orange-600">
              {sectionTitle}
            </h2>
            <button 
              onClick={resetSearch} 
              className="text-gray-700 hover:underline font-medium cursor-pointer"
            >
              {isCommuteMode ? 'Clear commute search' : 'View all'}
            </button>
          </div>
        
          {displayListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Home size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-lg">
                  {isCommuteMode 
                    ? 'No listings found within your commute preferences' 
                    : 'No listings found matching your criteria'}
                </p>
                <p className="text-sm mt-2">
                  {isCommuteMode 
                    ? 'Try increasing your max commute time or distance' 
                    : 'Try adjusting your filters or search in different areas'}
                </p>
              </div>
              <button 
                onClick={resetSearch}
                className="mt-4 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayListings.map((listing) => (
                <div 
                  key={listing.id} 
                  onClick={() => handleListingClick(listing)}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
                >
                  <div 
                    className="h-48 bg-gray-200 relative" 
                    style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                  >
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold text-gray-700">
                      ${convertPrice(listing.price, priceType)}{getPriceUnit(priceType)}
                    </div>
                    <button 
                      className={`absolute top-2 left-2 p-2 rounded-full transition-all cursor-pointer ${
                        isFavorited(listing.id, 'sublease') 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white text-gray-500 hover:text-red-500'
                      }`}
                      onClick={() => {
                        const newStatus = toggleFavorite(listing, 'sublease'); 
                        // Optional: Add visual feedback
                        if (newStatus) {
                          console.log('Added to favorites!');
                        } else {
                          console.log('Removed from favorites!');
                        }
                      }}
                    >
                      <Heart 
                        size={18} 
                        className={isFavorited(listing.id, 'sublease')  ? 'fill-current' : ''} 
                      />
                    </button>
 
                    
                    {/* Show commute badge if in commute mode */}
                    {isCommuteMode && renderCommuteBadge(listing)}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800">{listing.title}</div>
                        {/* <div className="text-gray-500 text-sm">{listing.location} · {listing.distance} miles from campus</div> */}
                      </div>
                      {/* <div className="flex items-center text-amber-500">
                        <Star size={16} className="fill-current" />
                        <span className="ml-1 text-sm font-medium">{listing.rating}</span>
                      </div> */}
                    </div>
                    
                    <div className="flex items-center mt-3 text-sm text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      <span>{listing.dateRange}</span>
                    </div>
                    
                    <div className="mt-3 flex items-center text-sm text-gray-700">
                      <BedDouble size={14} className="mr-1" />
                      <span>{listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} · </span>
                      <Droplets size={14} className="mx-1" />
                      <span>{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {/* Show commute info if in commute mode */}
                    {isCommuteMode && renderCommuteInfo(listing)}
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {listing.amenities && listing.amenities.slice(0, 3).map((amenity, index) => (
                        <div key={index} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-md flex items-center">
                          {getAmenityIcon(amenity)}
                          <span className="ml-1">{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
                        </div>
                      ))}
                      {listing.amenities && listing.amenities.length > 3 && (
                        <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                          +{listing.amenities.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };
  

  const renderCommuteBadge = (listing) => {
    const routeInfo = getRouteInfo(listing.id);
    if (!routeInfo) return null;
  
    return (
      <div className="absolute bottom-2 left-2 bg-blue-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
        <Clock size={12} />
        {routeInfo.duration}
      </div>
    );
  };

  const renderCommuteResultsSection = () => {
    if (!showMap || !commuteDestination) return null;
    
    // Check if we should show enhanced or basic commute results
    const hasRoutes = showEnhancedCommute ? enhancedRouteResults.length > 0 : commuteRoutes.length > 0;
    const currentRoutes = showEnhancedCommute ? enhancedRouteResults : commuteRoutes;
    
    if (!hasRoutes) return null;
  
    return (
      <div className="commute-results-section w-full max-w-7xl mx-auto px-4 mt-8 mb-8">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {showEnhancedCommute ? 'Enhanced Commute Results Map' : 'Commute Results Map'}
                </h2>
                <p className="text-orange-100">
                  Showing {currentRoutes.length} listings with {showEnhancedCommute ? 'detailed' : ''} commute times to {commuteDestination.placeName || 'your destination'}
                </p>
                {showEnhancedCommute && (
                  <div className="mt-2 text-sm text-orange-100">
                    ✨ Enhanced features: Alternative routes, transit details, mode-specific paths
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowMap(false);
                  clearCommuteSearch();
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>
  
          {/* Enhanced Commute Summary Stats */}
          <div className="bg-orange-50 p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{currentRoutes.length}</div>
                <div className="text-sm text-gray-600">Listings Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.min(...currentRoutes.map(r => parseCommuteTime(r.duration)))} min
                </div>
                <div className="text-sm text-gray-600">Shortest Commute</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 capitalize">
                  {commuteDestination.commutePreferences?.transportMode || 'Transit'}
                </div>
                <div className="text-sm text-gray-600">Transport Mode</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  ≤ {commuteDestination.commutePreferences?.maxCommuteTime || 30} min
                </div>
                <div className="text-sm text-gray-600">Max Commute</div>
              </div>
              {showEnhancedCommute && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {currentRoutes.filter(r => r.alternatives && r.alternatives.length > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">With Alternatives</div>
                </div>
              )}
            </div>
          </div>
  
          {/* Render appropriate map component */}
          {showEnhancedCommute ? (
            <EnhancedCommuteResultsMap
              routeResults={enhancedRouteResults}
              selectedDestination={commuteDestination}
              listings={allListings}
              onListingClick={handleListingClick}
              onFavoriteToggle={toggleFavorite}
              favoriteListings={favoriteListings}
              isVisible={true}
              onClose={() => setShowMap(false)}
            />
          ) : (
            <CommuteResultsMap
              routeResults={commuteRoutes}
              selectedDestination={commuteDestination}
              listings={allListings}
              onListingClick={handleListingClick}
              onFavoriteToggle={toggleFavorite}
              favoriteListings={favoriteListings}
              isVisible={true}
              onClose={() => setShowMap(false)}
            />
          )}
        </div>
      </div>
    );
  };


/// Add commute info to listing cards
const renderCommuteInfo = (listing) => {
  if (!isCommuteMode) return null;
  
  // Check both enhanced and basic route results
  const routeInfo = showEnhancedCommute 
    ? enhancedRouteResults.find(route => route.listingId === listing.id)
    : getRouteInfo(listing.id);
    
  if (!routeInfo) return null;

  const getTransportIcon = (mode) => {
    switch (mode) {
      case 'walking': return <Users size={14} className="text-green-500" />;
      case 'transit': return <Route size={14} className="text-blue-500" />;
      case 'bicycling': return <Car size={14} className="text-orange-500" />;
      case 'driving': return <Car size={14} className="text-purple-500" />;
      case 'scooter': return <Car size={14} className="text-yellow-500" />;
      default: return <Route size={14} className="text-gray-500" />;
    }
  };

  return (
    <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {getTransportIcon(routeInfo.transportMode)}
          <span className="font-medium text-blue-800">
            {routeInfo.duration} commute
          </span>
        </div>
        <span className="text-blue-600 text-xs">
          {routeInfo.distance}
        </span>
      </div>
      
      {/* Enhanced features indicator */}
      {showEnhancedCommute && routeInfo.alternatives && routeInfo.alternatives.length > 0 && (
        <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
          <Route size={10} />
          <span>{routeInfo.alternatives.length} alternative route{routeInfo.alternatives.length > 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* Transit details for enhanced results */}
      {showEnhancedCommute && routeInfo.transitDetails && routeInfo.transportMode === 'transit' && (
        <div className="text-xs text-blue-700 mt-1">
          {routeInfo.transitDetails.departureTime && (
            <div>🚌 Next: {routeInfo.transitDetails.departureTime}</div>
          )}
        </div>
      )}
    </div>
  );
};

  // Footer
  const renderFooter = () => (
    <footer className="bg-orange-200 text-white py-12 w-full md:pl-16 md:pl-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">CampusSublease</h3>
            <p className="text-gray-400 text-sm">Find the perfect short-term housing solution near your campus.</p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Home</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Search</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">List Your Space</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Sublease Guide</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Neighborhoods</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Campus Map</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Email Us</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-700 text-gray-400 text-sm text-center">
          <p>&copy; 2025 CampusSubleases. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );

  // =========================
  // Main Render
  // =========================
  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <ul className="space-y-2 ">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <li><a href="/sublease/search" className="text-2xl font-bold text-gray-900">Subox</a></li>
                <span className="text-sm text-gray-500 hidden sm:block">Subleases</span> 
              </div>
              </ul>
  
  
              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                

                {/* Notifications */}
                <NotificationsButton notifications={notifications} />
  
                {/* messages */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = '/sublease/search/list'}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <MessagesSquare size={20} className = "w-5 h-5 text-gray-600"/>
                </motion.button>
                
                {/* Favorites Sidebar */}
                {/* {renderFavoritesSidebar()} */}
  
                {/* Profile */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowProfile(!showProfile)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <User className="w-5 h-5 text-gray-600" />
                  </motion.button>
  
                  <AnimatePresence>
                    {showProfile && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      >
                        <div className="p-4 space-y-2">
                          <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Purchased</button>
                          <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Returned</button>
                          <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Cancelled</button>
                          <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Sold</button>
                          <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Sublease</button>
                          <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Reviews</button>
                          <hr className="my-2" />
                          <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">History</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
  
                {/* menu */}
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Menu className="w-5 h-5 text-gray-600" />
                  </motion.button>
  
                  <AnimatePresence>
                    {showMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                      >
                        <div className="p-4 space-y-2">
                          <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
                          Move Out Sale
                          </p>
                          <button 
                            onClick={() => {
                              router.push('/sale/browse');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            Browse Items
                          </button>                        
                          <button 
                            onClick={() => {
                              router.push('/sale/create/options/nonai');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            Sell Items
                          </button> 
                          <button 
                            onClick={() => {
                              router.push('/sale/browse');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            My Items
                          </button>   
                          
                          <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
                            Sublease
                          </p>
                          <button 
                            onClick={() => {
                              router.push('/sublease/search');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            Find Sublease
                          </button>   
                          <button 
                            onClick={() => {
                              router.push('/sublease/write/options/chat');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            Post Sublease
                          </button>   
                          <button 
                            onClick={() => {
                              router.push('../search');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            My Sublease Listing
                          </button>
                          <hr className="my-2" />
                          <button                              
                            onClick={() => {                               
                              router.push('/favorite');                               
                              setShowMenu(false);                             
                            }}                              
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                            >                             
                            <Heart className="w-4 h-4 text-gray-600" />                             
                            Favorites                           
                          </button>
                          <button 
                            onClick={() => {
                              router.push('/sublease/search/list');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                          >
                            <MessagesSquare className="w-4 h-4 text-gray-600" />                             
                            Messages
                          </button>   
                          <button 
                            onClick={() => {
                              router.push('../help');
                              setShowMenu(false);
                            }} 
                            className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                          >
                            Help & Support
                          </button>
  
                          {/* need change (when user didn't log in -> show log in button) */}
                          <hr className="my-2" />
                            {/* log in/ out */}
                            {isLoggedIn ? (
                              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                                Logout
                              </button>
                            ) : (
                              <button className="w-full text-left px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                                Login
                              </button>
                            )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
          </div>
          </div>
      </div>
      

      <div className="min-h-screen bg-gray-50 flex flex-col">

        <div className="pt-16 md:pt-0">
          {/* Simple Hero Section with Better Branding */}
          <div className="relative bg-gradient-to-br from-orange-50 to-white overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200 rounded-full animate-float"></div>
              <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300 rounded-full animate-float-delayed"></div>
              <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-orange-400 rounded-full animate-float-slow"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
              
              {/* Logo Section */}
              <div className="flex justify-center items-center  animate-fadeInUp">
                <div className="flex items-center gap-3">
                  {/* Logo Icon */}
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 hover:rotate-3 transition-all duration-300 animate-bounce-subtle">
                      <Home size={24} className="text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                      <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                  
                  {/* Logo Text */}
                  <div className="text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 hover:text-orange-600 transition-colors duration-300">
                      Su<span className="text-orange-500 animate-pulse">box</span>
                    </h1>
                    <p className="text-xs text-gray-500 font-medium tracking-wide animate-fadeIn delay-300">CAMPUS SUBLEASING</p>
                  </div>
                </div>
              </div>
              </div>
               </div>

{/* Buttons */}
<div className="w-full max-w-5xl mx-auto px-4 -mt-10 relative z-10 animate-slideUp">
      <div className="max-w-4xl mx-auto p-6 -mb-10 -ml-5">
      {/* Compact Button Bar */}
      <div className="flex items-center gap-3 mb-6 ">
        
        {/* Saved Searches Compact Button */}
        <div className="relative">
          <button 
            onClick={() => setShowSavedSearches(!showSavedSearches)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Bookmark size={18} className="text-orange-500" />
            <span className="font-medium text-gray-700">Saved Searches</span>
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform duration-200 ${showSavedSearches ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* Save Current Search Button */}
        <button 
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium shadow-sm hover:shadow-md ${
            hasSearchCriteria() 
              ? 'bg-orange-500 text-white hover:bg-orange-600' 
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          onClick={saveSearch}
          disabled={!hasSearchCriteria()}
        >
          <Star size={18} />
          <span>Save Current Search</span>
        </button>

        {/* Commute Map Button */}
        <button 
        onClick={toggleMapView}
        className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md">
          <MapPin size={18} />
          <span className="ml-4">
            {showMapView ? "Hide map view" : "Commute Map"}
          </span>
        </button>
      </div>

      
    </div>

 
          
  
          {/* Main Search Container */}
          
            <div className="bg-white rounded-xl shadow-xl transition-all duration-500 overflow-hidden hover:shadow-2xl transform hover:-translate-y-1">
              {/* Search Controls */}
              <div className="flex flex-col md:flex-row md:items-center p-3 gap-2">
                {/* Location */}
                <div 
                  className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${activeSection === 'location' ? 'bg-gray-100 border border-gray-200 shadow-inner' : 'hover:bg-gray-50 border border-transparent hover:shadow-md'}`}
                  onClick={() => toggleSection('location')}
                >
                  <div className="flex items-center">
                    <MapPin className={`mr-2 text-orange-500 flex-shrink-0 transition-all duration-300 ${activeSection === 'location' ? 'animate-bounce' : ''}`} size={18} />
                    <div>
                      <div className="font-medium text-sm text-gray-500">Location</div>
                      <div className={`font-semibold transition-all duration-300 ${location.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                        {location.length > 0 
                          ? location.length === 1 
                            ? location[0] 
                            : `${location[0]} + ${location.length - 1} more`
                          : 'Where are you looking?'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Dates */}
                <div 
                  className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${activeSection === 'dates' ? 'bg-orange-50 border border-orange-200 shadow-inner' : 'hover:bg-gray-50 border border-transparent hover:shadow-md'}`}
                  onClick={() => toggleSection('dates')}
                >
                  <div className="flex items-center">
                    <Calendar className={`mr-2 text-orange-500 flex-shrink-0 transition-all duration-300 ${activeSection === 'dates' ? 'animate-bounce' : ''}`} size={18} />
                    <div>
                      <div className="font-medium text-sm text-gray-500">Dates</div>
                      <div className={`font-semibold transition-all duration-300 ${dateRange.checkIn ? 'text-gray-800' : 'text-gray-400'}`}>
                        {dateRange.checkIn && dateRange.checkOut 
                          ? `${formatDate(dateRange.checkIn)} - ${formatDate(dateRange.checkOut)}` 
                          : dateRange.checkIn 
                            ? `${formatDate(dateRange.checkIn)} - ?` 
                            : 'When do you need it?'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Bathrooms & Bedrooms */}
                <div 
                  className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${activeSection === 'rooms' ? 'bg-orange-50 border border-orange-200 shadow-inner' : 'hover:bg-gray-50 border border-transparent hover:shadow-md'}`}
                  onClick={() => toggleSection('rooms')}
                >
                  <div className="flex items-center">
                    <BedDouble className={`mr-2 text-orange-500 flex-shrink-0 transition-all duration-300 ${activeSection === 'rooms' ? 'animate-bounce' : ''}`} size={18} />
                    <div>
                      <div className="font-medium text-sm text-gray-500">Rooms</div>
                     <div className="font-semibold text-gray-800">
  {bedrooms === 'any' ? 'Any' : bedrooms} bedroom{bedrooms !== 1 && bedrooms !== 'any' ? 's' : ''}, {bathrooms === 'any' ? 'Any' : bathrooms} bathroom{bathrooms !== 1 && bathrooms !== 'any' ? 's' : ''}
</div>
                    </div>
                  </div>
                </div>
                
                {/* Filters */}
                <div 
                  className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${activeSection === 'filters' ? 'bg-orange-50 border border-orange-200 shadow-inner' : 'hover:bg-gray-50 border border-transparent hover:shadow-md'}`}
                  onClick={() => toggleSection('filters')}
                >
                  <div className="flex items-center">
                    <Filter className={`mr-2 text-orange-500 flex-shrink-0 transition-all duration-300 ${activeSection === 'filters' ? 'animate-bounce' : ''}`} size={18} />
                    <div>
                      <div className="font-medium text-sm text-gray-500">Filters</div>
                      <div className={`font-semibold transition-all duration-300 ${selectedAmenities.length > 0 || priceRange.min !== 500 || priceRange.max !== 2000 ? 'text-gray-800' : 'text-gray-400'}`}>
                        {selectedAmenities.length > 0 
                          ? `${selectedAmenities.length} filter${selectedAmenities.length !== 1 ? 's' : ''} applied` 
                          : 'Add filters'}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Search Button */}
                <button 
                  className="p-4 rounded-lg text-white flex items-center justify-center bg-orange-600 hover:bg-orange-500 transition-all ml-2 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                  ) : (
                    <Search size={20} className="mr-2 animate-pulse" />
                  )}
                  <span className="font-medium">Search</span>
                </button>
                
                {/* Reset Button - Only show if search criteria exists */}
                {hasSearchCriteria() && (
                  <button 
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-all transform hover:scale-110 hover:rotate-90 duration-300"
                    onClick={resetSearch}
                    title="Reset search"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              
              {/* Expandable sections */}
              {activeSection === 'location' && renderLocationSection()}
              {activeSection === 'dates' && renderCalendarSection()}
              {activeSection === 'rooms' && renderRoomsSection()}
              {activeSection === 'filters' && renderFiltersSection()}
            </div>
          
        </div>
      </div>


{/* Dropdown Content */}
      {showSavedSearches && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden animate-fadeIn mb-4 mt-4 w-full max-w-4xl mx-auto p-6 -mb-10">
              <div className="p-6">
            {savedSearches.length === 0 ? (
              // Empty State
              <div className="text-center py-8">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved searches yet</h3>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Create a search with your preferred filters and save it for quick access later
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin size={14} className="text-orange-500" />
                    <span>Set location</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-orange-500" />
                    <span>Pick dates</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                  <div className="flex items-center gap-1">
                    <Filter size={14} className="text-orange-500" />
                    <span>Apply filters</span>
                  </div>
                </div>
              </div>
            ) : (
              // Saved Searches Grid
              <>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">Your Saved Searches</h3>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      {savedSearches.length}
                    </span>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-red-500 text-sm flex items-center gap-1 transition-colors"
                    onClick={() => setSavedSearches([])}
                  >
                    <X size={14} />
                    Clear all
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedSearches.map((search, index) => (
                    <div 
                      key={search.id}
                      className="group bg-gray-50 rounded-lg p-4 hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-orange-300 relative"
                    >
                      {/* Delete Button */}
                      <button 
                        className="absolute top-3 right-3 p-1 rounded-full bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSavedSearch(search.id);
                        }}
                      >
                        <X size={12} className="text-gray-500"/>
                      </button>
                      
                      {/* Search Content */}
                      <div className="pr-6">
                        {/* Location */}
                        <div className="mb-3">
                          <div className="flex items-center gap-1 mb-1">
                            <MapPin size={14} className="text-orange-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Location</span>
                          </div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {search.location && search.location.length > 0 
                              ? search.location.length === 1 
                                ? search.location[0]
                                : `${search.location[0]} +${search.location.length - 1} more`
                              : 'Any location'}
                          </div>
                        </div>
                        
                        {/* Dates */}
                        <div className="mb-3">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar size={14} className="text-orange-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Dates</span>
                          </div>
                          <div className="text-sm text-gray-700">
                            {search.dateRange.checkIn ? (
                              <div className="flex items-center gap-1">
                                <span>{formatDate(search.dateRange.checkIn)}</span>
                                {search.dateRange.checkOut && (
                                  <>
                                    <ChevronRight size={10} className="text-gray-400" />
                                    <span>{formatDate(search.dateRange.checkOut)}</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">Flexible dates</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Room Requirements */}
                        <div className="mb-4">
                          <div className="flex items-center gap-1 mb-1">
                            <BedDouble size={14} className="text-orange-500" />
                            <span className="text-xs font-medium text-gray-500 uppercase">Requirements</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="font-medium">{search.bedrooms} bed{search.bedrooms !== 1 ? 's' : ''}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-medium">{search.bathrooms} bath{search.bathrooms !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        
                        {/* Apply Button */}
                        <button 
                          onClick={() => {applySavedSearch(search);
                            setShowSavedSearches(false);}}
                          className="w-full py-2 bg-white border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all text-sm font-medium flex items-center justify-center gap-1"
                        >
                          <Search size={14} />
                          <span>Apply Search</span>
                        </button>
                      </div>
                      
                      {/* Saved Date */}
                      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                        <Clock size={10} className="inline mr-1" />
                        {new Date(search.id).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

  
 {showMapView && (
      <div className="w-full max-w-4xl mx-auto p-6 -mb-8">
      <div id="map-container">
      <div>
      <div className="flex items-center gap-2 mb-6">
                <Settings size={20} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Commute Preferences</h3>
              </div>
                  
            {/* Show loading/error states */}            
            {googleMapsError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-red-700 text-sm">{googleMapsError}</p>
              </div>
            )}
            
            {/* Enhanced CommuteLocationPicker when Google Maps is ready */}
            {isGoogleMapsReady && !googleMapsError && (
              <CommuteLocationPicker
                onLocationSelect={(locationData) => {
                  console.log('📍 Enhanced location selected:', locationData);
                  setCommuteDestination(locationData);
                  setCommuteLocation(locationData.address);
                  
                  // Check if this has enhanced features
                  if (locationData.commutePreferences.showAlternatives !== undefined) {
                    setShowEnhancedCommute(true);
                  }
                }}
                onRouteCalculated={async (routes) => {
                  console.log('🗺️ Enhanced routes received:', routes.length);
                  
                  // Check if routes have enhanced features
                  const hasEnhancedFeatures = routes.some(route => 
                    route.alternatives || route.transitDetails || route.transportMode
                  );
                  
                  if (hasEnhancedFeatures) {
                    setEnhancedRouteResults(routes);
                    setShowEnhancedCommute(true);
                  } else {
                    setCommuteRoutes(routes);
                    setShowEnhancedCommute(false);
                  }
                  
                  handleCommuteResults(routes, commuteDestination);
                }}
                onShowMap={(shouldShow) => {
                  setShowMap(shouldShow);
                }}
                nearbyListings={allListings.map(listing => {
                  // Enhanced coordinate handling for listings
                  let coords;
                  
                  // Priority 1: customLocation with specific coordinates
                  if (listing.customLocation?.lat && listing.customLocation?.lng) {
                    coords = {
                      lat: listing.customLocation.lat,
                      lng: listing.customLocation.lng
                    };
                    console.log(`📍 Using customLocation for ${listing.id}:`, coords);
                  } 
                  // Priority 2: direct lat/lng coordinates
                  else if (listing.lat && listing.lng) {
                    coords = {
                      lat: listing.lat,
                      lng: listing.lng
                    };
                    console.log(`📍 Using direct coordinates for ${listing.id}:`, coords);
                  } 
                  // Priority 3: neighborhood that needs geocoding
                  else {
                    coords = {
                      lat: null,
                      lng: null,
                      needsGeocoding: true,
                      neighborhood: listing.location
                    };
                    console.log(`🔍 Needs geocoding for ${listing.id}: ${listing.location}`);
                  }
                  
                  return {
                    id: listing.id,
                    lat: coords.lat,
                    lng: coords.lng,
                    needsGeocoding: coords.needsGeocoding,
                    neighborhood: coords.neighborhood,
                    address: listing.customLocation?.address || listing.address || `${listing.location || 'Minneapolis'}, MN`,
                    title: listing.title,
                    price: listing.price,
                    location: listing.location,
                    customLocation: listing.customLocation
                  };
                })}
              />
            )}
          </div>
  
          {/* Show selected neighborhoods */}
          {location.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-2">Selected Neighborhoods:</h4>
              <div className="flex flex-wrap gap-2">
                {location.map(loc => (
                  <div key={loc} className="bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-sm flex items-center">
                    <span className="text-orange-800">{loc}</span>
                    <button 
                      className="ml-2 text-orange-600 hover:text-orange-800" 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLocation(loc);
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    
)}

{/* 
  {showCommuteResults && commuteDestination && (
    <div className="mt-6 w-[60%] mx-auto px-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 animate-slideUp transform hover:scale-105 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-100 rounded-lg animate-bounce-subtle">
          <Route size={24} className="text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-green-800 text-lg mb-2 animate-fadeIn">
            Commute Results for {commuteDestination.placeName || 'Your Destination'}
          </h3>
          <p className="text-gray-700 mb-3 animate-fadeIn delay-100">{commuteDestination.address}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-green-200 transform hover:scale-105 transition-all animate-slideUp">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-green-600 animate-pulse" />
                <span className="font-medium text-green-800">Listings Found</span>
              </div>
              <p className="text-2xl font-bold text-green-600 animate-counter">{commuteRoutes.length}</p>
              <p className="text-xs text-gray-600">within your preferences</p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-green-200 transform hover:scale-105 transition-all animate-slideUp delay-100">
              <div className="flex items-center gap-2 mb-1">
                <Route size={16} className="text-green-600 animate-pulse" />
                <span className="font-medium text-green-800">Transport Mode</span>
              </div>
              <p className="text-lg font-bold text-green-600 capitalize">
                {commuteDestination.commutePreferences?.transportMode || 'Transit'}
              </p>
            </div>
            
            <div className="bg-white p-3 rounded-lg border border-green-200 transform hover:scale-105 transition-all animate-slideUp delay-200">
              <div className="flex items-center gap-2 mb-1">
                <Clock size={16} className="text-green-600 animate-pulse" />
                <span className="font-medium text-green-800">Max Commute</span>
              </div>
              <p className="text-lg font-bold text-green-600">
                {commuteDestination.commutePreferences?.maxCommuteTime || 30} min
              </p>
            </div>
          </div>
          
          <button
            onClick={clearCommuteSearch}
            className="mt-4 text-sm text-orange-600 hover:text-orange-800 underline transform hover:scale-105 transition-all"
          >
            Clear commute search
          </button>
        </div>
      </div>
    </div>
  )} */}

        {renderCommuteResultsSection()}

        {/* Content Sections */}
        {renderFeaturedListings()}

      </div>
    </div>
  );
}
export default SearchPage;