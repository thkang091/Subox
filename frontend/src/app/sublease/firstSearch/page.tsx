"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Tv, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, CircleUser,
  Clock, TrendingUp, TrendingDown, Utensils, ArrowUp, Shield, BookOpen, Waves, Flame  // Add these new ones
} from 'lucide-react';
import { Route, Car, Users as TransitIcon } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust path to your firebase config

import CommuteLocationPicker from '../../../components/CommuteLocationPicker'
import CommuteResultsMap from '../../../components/CommuteMap' // Adjust path as needed
import EnhancedCommuteResultsMap from '../../../components/CommuteMap' // Update path as needed
import { address } from 'framer-motion/client';
// Component imports - This should use the actual LocationPicker component
import SearchLocationPicker from '../../../components/SearchLocationPicker';

// Component for the sublease search interface
const FirstSearchPage = () => {
  // =========================
  // State Definitions
  // =========================
  const [dateRange, setDateRange] = useState({ checkIn: null, checkOut: null });
  const [bathrooms, setBathrooms] = useState(1);
  const [bedrooms, setBedrooms] = useState(1);
  const [location, setLocation] = useState([]);
  const [commuteLocation, setCommuteLocation] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [accommodationType, setAccommodationType] = useState(null);
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
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const router = useRouter(); 
  const [commuteDestination, setCommuteDestination] = useState(null);
const [commuteRoutes, setCommuteRoutes] = useState([]);
const [showCommuteResults, setShowCommuteResults] = useState(false);
const [isCommuteMode, setIsCommuteMode] = useState(false);
const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
const [preferredGender, setPreferredGender] = useState(null); 
const [showLocationDropdown, setShowLocationDropdown] = useState(false);
const [smokingPreference, setSmokingPreference] = useState(null);
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
  
// Fetch user listings from Firestore
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
        
        // Priority 1: customLocation
        if (data.customLocation && data.customLocation.lat && data.customLocation.lng) {
          const lat = validateCoordinate(data.customLocation.lat);
          const lng = validateCoordinate(data.customLocation.lng);
          if (lat && lng) {
            coordinates = {
              lat,
              lng,
              source: 'customLocation',
              address: data.customLocation.address || data.address
            };
          }
        }
        
        // Priority 2: direct lat/lng
        if (!coordinates && data.lat && data.lng) {
          const lat = validateCoordinate(data.lat);
          const lng = validateCoordinate(data.lng);
          if (lat && lng) {
            coordinates = {
              lat,
              lng,
              source: 'direct',
              address: data.address
            };
          }
        }
        
        // Priority 3: generate from neighborhood
        if (!coordinates) {
          const generated = generateCoordinatesForNeighborhood(data.location || 'Other');
          coordinates = {
            ...generated,
            source: 'generated',
            address: `${data.location || 'Campus Area'}, Minneapolis, MN`
          };
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
          id: doc.id, // This is crucial - the Firestore document ID
          // Basic info with fallbacks
          title: data.title || `${data.listingType || 'Sublease'} in ${data.location || 'Campus Area'}`,
          listingType: data.listingType || 'Sublease',
          location: data.location || `${data.location || 'Campus Area'}, Minneapolis, MN`,
          
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

          lat: coordinates.lat,
          lng: coordinates.lng,
          address: coordinates.location,
          customLocation: data.customLocation || null,
          coordinateSource: coordinates.source,
          
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
          address: data.address || data.customLocation?.address || `${data.location || 'Campus Area'}, Minneapolis, MN`,

          // Handle complex objects
          customLocation: data.customLocation || null,
          contactInfo: data.contactInfo || { methods: [], note: '' },
          roommatePreferences: data.roommatePreferences || {},
          currentRoommateInfo: data.currentRoommateInfo || {},
          rentNegotiation: data.rentNegotiation || { isNegotiable: false, minPrice: 0, maxPrice: 0 }
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Section toggle


  const toggleMapView = () => {
    setShowMap(!showMap);
    if (!showMap) {
      setMapListings(searchResults);
    }
  };

  const handleCommuteFilter = (filteredListings) => {
    setSearchResults(filteredListings);
    setMapListings(filteredListings);
  };
  
 // Add these state variables with your other state
const [isGoogleMapsLoading, setIsGoogleMapsLoading] = useState(false);
const [googleMapsError, setGoogleMapsError] = useState(null);
const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
const [locationError, setLocationError] = useState(null);

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

  // Handle amenity selection
  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

    const toggleGender = (gender) => {
    if (preferredGender === gender) {
        setPreferredGender(null); 
    } else {
        setPreferredGender(gender); 
    }
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
  setBathrooms(1);
  setBedrooms(1);
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
     // URL parameter update
    const searchParams = new URLSearchParams();
    
    // add location info
    if (location.length > 0) {
    location.forEach(loc => {
    searchParams.append('location', loc);
    });
    }
    // add date
    if (dateRange.checkIn) {
    searchParams.append('checkIn', dateRange.checkIn.toISOString());
    }
    if (dateRange.checkOut) {
    searchParams.append('checkOut', dateRange.checkOut.toISOString());
    }
    // add rooms
    searchParams.append('bedrooms', bedrooms.toString());
    searchParams.append('bathrooms', bathrooms.toString());
    // add price range
    searchParams.append('minPrice', priceRange.min.toString());
    searchParams.append('maxPrice', priceRange.max.toString());
    // add amenities
    if (selectedAmenities.length > 0) {
      searchParams.append('amenities', selectedAmenities.join(',')); 
    }
    // add commute
    if (commuteDestination) {
    searchParams.append('commuteDestination', JSON.stringify({
    placeName: commuteDestination.placeName,
    address: commuteDestination.address,
    lat: commuteDestination.lat,
    lng: commuteDestination.lng
    }));
    if (commuteDestination.commutePreferences) {
    searchParams.append('transportMode', commuteDestination.commutePreferences.transportMode);
    searchParams.append('maxCommuteTime', commuteDestination.commutePreferences.maxCommuteTime.toString());
    }
    }

    setTimeout(() => {
       const searchUrl = `/sublease/search?${searchParams.toString()}`;
      console.log('Moving to:', searchUrl);
      window.location.href = searchUrl;
      setIsSearching(false);
    }, 1500);
  };

  const handleSkip = () => {
    window.location.href = '/sublease/search';
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
      bedrooms > 1 || 
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

  //favorites list
  const toggleFavorite = (listing) => {
  // check if it is already there
  const isFavorited = favoriteListings.some(item => item.id === listing.id);
  
  if (isFavorited) {
    // if already added, cancel it
    setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
  } else {
    // add new favorites
    const favoriteItem = {
      id: listing.id,
      title: listing.title || 'Untitled Listing',
      location: listing.location || 'Unknown Location',
      price: listing.price || 0,
      bedrooms: listing.bedrooms || 1,
      // if there is a bathrooms, use it.
      ...(listing.bathrooms !== undefined && { bathrooms: listing.bathrooms }),
      image: listing.image || '/api/placeholder/800/500',
      // if there is a dataRange, use it.
      ...(listing.dateRange && { dateRange: listing.dateRange })
    };
    
    setFavoriteListings([favoriteItem, ...favoriteListings]);
    // open sidebar
    setIsSidebarOpen(true);
    // change the tap into favorites
    setActiveTab('favorites');
    }
  };

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

// Call this when the location section opens
const toggleSection = (section) => {
  if (activeSection === section) {
    setActiveSection(null);
  } else {
    setActiveSection(section);
  }
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

  // Location Section with Google Maps search for neighborhoods
// Location Section with Enhanced Google Maps search for neighborhoods
const renderLocationSection = () => {
  // Function to handle popular destination clicks with Google Maps geocoding
  const handlePopularDestinationClick = (destination) => {
    // Instead of setting searchQuery, directly trigger the CommuteLocationPicker
    // by setting the commute destination
    
    // Immediately search for this destination using Google Maps
    if (isGoogleMapsReady && !googleMapsError) {
      console.log('🔍 Searching for popular destination:', destination);
      
      // Use geocoding for popular destinations to get exact coordinates
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { 
          address: `${destination}, Minneapolis, MN`,
          componentRestrictions: { country: 'US' }
        },
        (results, status) => {
          if (status === 'OK' && results?.[0]) {
            const result = results[0];
            const addressComponents = parseAddressComponents(result.address_components || []);
            
            const locationData = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
              address: result.formatted_address,
              placeName: destination,
              commutePreferences: {
                transportMode: 'transit', // Default transport mode
                maxCommuteTime: 30,      // Default max commute time
                maxDistance: 10,         // Default max distance
                showAlternatives: true,  // Enhanced feature
                avoidTolls: false,      // Enhanced feature
                avoidHighways: false    // Enhanced feature
              },
              isNeighborhood: result.types?.includes('neighborhood') || result.types?.includes('sublocality'),
              placeTypes: result.types || [],
              ...addressComponents
            };

            console.log('📍 Popular destination found:', locationData);
            
            // Set the commute destination directly
            setCommuteDestination(locationData);
            setCommuteLocation(locationData.address);
          } else {
            console.warn('Geocoding failed for:', destination, status);
            // Set a basic location without geocoding
            const fallbackLocation = {
              lat: 44.9778, lng: -93.2358, // Minneapolis center
              address: `${destination}, Minneapolis, MN`,
              placeName: destination,
              commutePreferences: {
                transportMode: 'transit',
                maxCommuteTime: 30,
                maxDistance: 10,
                showAlternatives: true,
                avoidTolls: false,
                avoidHighways: false
              }
            };
            setCommuteDestination(fallbackLocation);
            setCommuteLocation(fallbackLocation.address);
          }
        }
      );
    } else {
      // If Google Maps not ready, set a basic destination
      const basicLocation = {
        lat: 44.9778, lng: -93.2358,
        address: `${destination}, Minneapolis, MN`,
        placeName: destination,
        commutePreferences: {
          transportMode: 'transit',
          maxCommuteTime: 30,
          maxDistance: 10,
          showAlternatives: true,
          avoidTolls: false,
          avoidHighways: false
        }
      };
      setCommuteDestination(basicLocation);
      setCommuteLocation(basicLocation.address);
    }
  };

  return (
    <div className="p-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid grid-cols-2 gap-6">
        <div className="max-w-sm"> 
          <h3 className="font-bold mb-3 text-gray-800">Choose Your Location</h3>
          <div className="w-full">
            <SearchLocationPicker 
                initialValue={location[0] || "University of Minnesota"}
                onLocationSelect={(selectedLocation) => {
                  console.log('Selected Location:', selectedLocation);
                   const locationName = selectedLocation.placeName || selectedLocation.address || selectedLocation;
                   setLocation([locationName]);
                // if location is String
                // setLocation(selectedLocation.address || selectedLocation);
                }}
            />
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Campus Neighborhoods</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Dinkytown', 'East Bank', 'Stadium Village', 'Como', 'Southeast Como', 'St. Paul'].map((loc) => (
              <div 
                key={loc}
                className={`p-3 rounded-lg border cursor-pointer transition ${location.includes(loc) ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'}`}
                onClick={() => {
                  // First add to location filter
                  toggleLocation(loc);
                  
                  // Also search for this neighborhood on Google Maps for commute
                  handlePopularDestinationClick(loc);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-600">{loc}</div>
                  {location.includes(loc) && (
                    <div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {getNeighborhoodCount(loc)} listings
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
            if (!isCommuteMode) {
              handleSearch();
            }
          }}
        >
          Apply
        </button>
      </div>

   
    </div>
  );
};

const renderCalendarSection = () => (
  <div className="p-5 border-t border-gray-200 animate-fadeIn">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Quick Date Presets - More Prominent */}
      <div className="lg:order-2">
        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={18} className="text-orange-500" />
          Quick Options
        </h3>
        <div className="space-y-3">
          <button 
            onClick={setAvailableNow}
            className="w-full p-4 border-2 border-green-200 text-green-700 rounded-xl flex items-center justify-between hover:bg-green-50 transition-all group hover:border-green-300"
          >
            <div className="text-left">
              <div className="font-semibold flex items-center gap-2">
                <Clock size={16} />
                Available Now
              </div>
              <div className="text-sm text-green-600">Next 2 weeks</div>
            </div>
            <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <ChevronRight size={20} className="text-green-600" />
            </div>
          </button>
          
          <button 
            onClick={setSummerSemester}
            className="w-full p-4 border-2 border-yellow-200 text-yellow-700 rounded-xl flex items-center justify-between hover:bg-yellow-50 transition-all group hover:border-yellow-300"
          >
            <div className="text-left">
              <div className="font-semibold flex items-center gap-2">
                <Sparkles size={16} />
                Summer Semester
              </div>
              <div className="text-sm text-yellow-600">May - August</div>
            </div>
            <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
              <ChevronRight size={20} className="text-yellow-600" />
            </div>
          </button>
          
          <button 
            onClick={setFallSemester}
            className="w-full p-4 border-2 border-orange-200 text-orange-700 rounded-xl flex items-center justify-between hover:bg-orange-50 transition-all group hover:border-orange-300"
          >
            <div className="text-left">
              <div className="font-semibold flex items-center gap-2">
                <Calendar size={16} />
                Fall Semester
              </div>
              <div className="text-sm text-orange-600">August - December</div>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <ChevronRight size={20} className="text-orange-600" />
            </div>
          </button>
          
          {/* Custom Range Info */}
          <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin size={16} className="text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-medium text-blue-800 mb-1">Custom Date Range</div>
                <div className="text-xs text-blue-600">Click start date, then end date on the calendar</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Calendar - Improved */}
      <div className="lg:col-span-2 lg:order-1">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Calendar Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
            <div className="flex justify-between items-center">
              <button 
                onClick={goToPreviousMonth} 
                className="p-2 rounded-full hover:bg-white/20 transition-colors flex items-center gap-1"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-xl font-bold flex items-center gap-2">
                <Calendar size={20} />
                {monthNames[currentMonth]} {currentYear}
              </div>
              <button 
                onClick={goToNextMonth} 
                className="p-2 rounded-full hover:bg-white/20 transition-colors flex items-center gap-1"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div key={i} className="text-center text-sm font-semibold text-gray-600 py-2">
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
                
                return (
                  <div 
                    key={i} 
                    className={`
                      h-12 flex items-center justify-center rounded-lg cursor-pointer relative transition-all duration-200 font-medium
                      ${!day ? 'text-gray-300 cursor-default' : 'hover:bg-orange-100 hover:scale-105'}
                      ${isToday ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                      ${isSelected && !isCheckIn && !isCheckOut ? 'bg-orange-100 text-orange-800' : ''}
                      ${isCheckIn ? 'bg-orange-500 text-white shadow-lg scale-110' : ''}
                      ${isCheckOut ? 'bg-orange-500 text-white shadow-lg scale-110' : ''}
                    `}
                    onClick={() => day && handleDateClick(day)}
                  >
                    {day}
                    {isToday && (
                      <div className="absolute -bottom-1 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    {isCheckIn && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                    {isCheckOut && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-400 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Selection Summary - More Visual */}
    <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-xl border border-orange-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Check-in:</span>
            <span className="font-bold text-gray-800 flex items-center gap-1">
              <Calendar size={14} />
              {dateRange.checkIn ? formatDate(dateRange.checkIn) : 'Select date'}
            </span>
          </div>
          <div className="text-gray-400">
            <ChevronRight size={16} />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Check-out:</span>
            <span className="font-bold text-gray-800 flex items-center gap-1">
              <Calendar size={14} />
              {dateRange.checkOut ? formatDate(dateRange.checkOut) : 'Select date'}
            </span>
          </div>
          {dateRange.checkIn && dateRange.checkOut && (
            <div className="ml-4 px-3 py-1.5 bg-orange-500 text-white rounded-full text-sm font-medium flex items-center gap-1">
              <Clock size={12} />
              {Math.ceil((dateRange.checkOut - dateRange.checkIn) / (1000 * 60 * 60 * 24))} nights
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {(dateRange.checkIn || dateRange.checkOut) && (
            <button 
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => {
                setDateRange({ checkIn: null, checkOut: null });
                setSelectedDates([]);
              }}
            >
              <X size={14} />
              Clear dates
            </button>
          )}
          <button 
            className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 font-medium transition-colors flex items-center gap-2"
            onClick={() => {
              setActiveSection(null);
              handleSearch();
            }}
          >
            <Search size={16} />
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
          
          <div className="p-4 border rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-600">Bedrooms</div>
                <div className="text-sm text-gray-500">Number of bedrooms</div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  className={`w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center cursor-pointer ${bedrooms > 1 ? 'text-orange-500' : 'text-gray-300'}`}
                  onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                  disabled={bedrooms <= 1}
                >
                  -
                </button>
                <span className="text-lg font-medium w-6 text-center text-gray-700">{bedrooms}</span>
                <button 
                  className="w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center text-orange-500 cursor-pointer"
                  onClick={() => setBedrooms(bedrooms + 1)}
                >
                  +
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-600">Bathrooms</div>
                <div className="text-sm text-gray-500">Number of bathrooms</div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  className={`w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center cursor-pointer ${bathrooms > 1 ? 'text-orange-500' : 'text-gray-300'}`}
                  onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}
                  disabled={bathrooms <= 1}
                >
                  -
                </button>
                <span className="text-lg font-medium w-6 text-center text-gray-700">{bathrooms}</span>
                <button 
                  className="w-8 h-8 rounded-full border border-orange-500 flex items-center justify-center text-orange-500 cursor-pointer"
                  onClick={() => setBathrooms(bathrooms + 1)}
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
      { key: 'entire', label: 'Entire Place', desc: 'Have the entire place to yourself', icon: '🏠' },
      { key: 'private', label: 'Private Room', desc: 'Your own bedroom, shared spaces', icon: '🚪' },
      { key: 'shared', label: 'Shared Room', desc: 'Share a bedroom with others', icon: '👥' }
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

        {/* Map View */}



    </div>
  );

  // Filters Section
  const renderFiltersSection = () => (
    <div className="p-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
  <h3 className="font-bold mb-3 text-gray-800">Price Range</h3>
  <div className="p-4 border rounded-lg">
    {/* Price Type Toggle - More Visual */}
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-700 mb-3">Payment Frequency</div>
      <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'monthly', label: 'Monthly', icon: <Calendar size={16} /> },
          { key: 'weekly', label: 'Weekly', icon: <Clock size={16} /> },
          { key: 'daily', label: 'Daily', icon: <MapPin size={16} /> }
        ].map(type => (
          <button 
            key={type.key}
            className={`px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              priceType === type.key 
                ? 'bg-orange-500 text-white shadow-md transform scale-105' 
                : 'text-gray-600 hover:bg-white hover:shadow-sm'
            }`}
            onClick={() => setPriceType(type.key)}
          >
            <div className={`${priceType === type.key ? 'text-white' : 'text-orange-500'}`}>
              {type.icon}
            </div>
            <span>{type.label}</span>
          </button>
        ))}
      </div>
    </div>
    
    {/* Price Range with Better Visual Feedback */}
    <div className="mb-4">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <DollarSign size={16} className="text-orange-500" />
          Budget Range
        </span>
        <div className="bg-gradient-to-r from-orange-50 to-orange-100 px-4 py-2 rounded-full border border-orange-200">
          <span className="text-orange-700 font-bold text-sm flex items-center gap-1">
            <DollarSign size={14} />
            {convertPrice(priceRange.min, priceType)} - {convertPrice(priceRange.max, priceType)} {getPriceUnit(priceType)}
          </span>
        </div>
      </div>
      
      {/* Custom Range Slider with Better Styling */}
      <div className="relative mt-6 mb-8">
        <div className="h-3 bg-gray-200 rounded-full relative overflow-hidden shadow-inner">
          {/* Active range indicator */}
          <div 
            className="absolute h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full transition-all duration-300 shadow-sm"
            style={{
              left: `${((priceRange.min - 500) / (2000 - 500)) * 100}%`,
              width: `${((priceRange.max - priceRange.min) / (2000 - 500)) * 100}%`
            }}
          ></div>
        </div>
        
        {/* Min slider */}
        <input 
          type="range" 
          min="500" 
          max="2000" 
          step="25"
          value={priceRange.min}
          onChange={(e) => handlePriceChange('min', e.target.value)}
          className="absolute top-0 h-3 w-full appearance-none bg-transparent cursor-pointer range-slider"
          style={{ zIndex: priceRange.min > priceRange.max - 100 ? 2 : 1 }}
        />
        
        {/* Max slider */}
        <input 
          type="range" 
          min="500" 
          max="2000" 
          step="25"
          value={priceRange.max}
          onChange={(e) => handlePriceChange('max', e.target.value)}
          className="absolute top-0 h-3 w-full appearance-none bg-transparent cursor-pointer range-slider"
          style={{ zIndex: priceRange.max < priceRange.min + 100 ? 2 : 1 }}
        />
        
        {/* Price markers with icons */}
        <div className="flex justify-between text-xs text-gray-500 mt-3">
          <div className="flex flex-col items-center">
            <span className="font-medium">$500</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-medium">$1,000</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-medium">$1,500</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1"></div>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-medium">$2,000</span>
            <div className="w-1 h-1 bg-gray-400 rounded-full mt-1"></div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Quick Price Presets with Icons */}
    <div className="mb-4">
      <div className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <Star size={16} className="text-orange-500" />
        Quick Budget Presets:
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: 'Budget', min: 500, max: 800, icon: <Home size={16} />, color: 'green' },
          { label: 'Mid-range', min: 800, max: 1200, icon: <BedDouble size={16} />, color: 'blue' },
          { label: 'Premium', min: 1200, max: 1600, icon: <Star size={16} />, color: 'purple' },
          { label: 'Luxury', min: 1600, max: 2000, icon: <Sparkles size={16} />, color: 'orange' }
        ].map(preset => (
          <button
            key={preset.label}
            onClick={() => setPriceRange({ min: preset.min, max: preset.max })}
            className={`p-3 bg-gray-50 hover:bg-${preset.color}-50 hover:text-${preset.color}-700 hover:border-${preset.color}-200 rounded-lg transition-all border border-gray-200 group`}
          >
            <div className="flex items-center justify-center mb-2">
              <div className={`p-2 bg-${preset.color}-100 rounded-lg group-hover:bg-${preset.color}-200 transition-colors`}>
                {preset.icon}
              </div>
            </div>
            <div className="font-medium text-sm">{preset.label}</div>
            <div className="text-xs text-gray-500 mt-1">
              ${convertPrice(preset.min, priceType)}-${convertPrice(preset.max, priceType)}
            </div>
          </button>
        ))}
      </div>
    </div>
    
    {/* Manual Input - Simplified with Icons */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
          <TrendingDown size={12} className="text-green-500" />
          Minimum Budget
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm transition-all"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
          <TrendingUp size={12} className="text-red-500" />
          Maximum Budget
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
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
            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 text-sm transition-all"
          />
        </div>
      </div>
    </div>
  </div>
</div>
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
                { key: 'any', label: 'Any Gender', icon: '👫' },
                { key: 'female', label: 'Female Only', icon: '👩' },
                { key: 'male', label: 'Male Only', icon: '👨' }
                ].map(gender => (
                <button
                    key={gender.key}
                    className={`flex items-center p-3 border rounded-lg transition-all ${
                    preferredGender === gender.key 
                        ? 'bg-purple-50 border-purple-500 text-purple-700' 
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

            {/* Smoking Policy */}
            <div>
            <h3 className="font-bold mb-3 text-gray-800">Smoking Policy</h3>
            <div className="grid grid-cols-1 gap-3">
                {[
                { key: null, label: 'No Preference', icon: '🤷' },
                { key: 'no-smoking', label: 'No Smoking', icon: '🚭' },
                { key: 'smoking-ok', label: 'Smoking OK', icon: '🚬' }
                ].map(smoking => (
                <button
                    key={smoking.key || 'any'}
                    className={`flex items-center p-3 border rounded-lg transition-all ${
                    smokingPreference === smoking.key 
                        ? 'bg-green-50 border-green-500 text-green-700' 
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                    onClick={() => toggleSmoking(smoking.key)}
                >
                    <span className="text-lg mr-2">{smoking.icon}</span>
                    <span className="text-sm font-medium">{smoking.label}</span>
                </button>
                ))}
            </div>
            </div>
      </div>

      


      
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
            className="px-4 py-2 rounded-lg bg-orange-700 text-white hover:bg-orange-700 font-medium"
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


  // Favorites Sidebar
const renderFavoritesSidebar = () => (
  <div className={`fixed md:left-16 left-0 top-0 md:top-0 top-16 h-full md:h-full h-[calc(100%-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>
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
                  onClick={() => toggleFavorite(listing)}
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
      <div className="w-full md:pl-16 px-4 mt-12 mb-16 md:pr-0">
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
                        favoriteListings.some(item => item.id === listing.id) 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white text-gray-500 hover:text-red-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(listing);
                      }}
                    >
                      <Heart 
                        size={18} 
                        className={favoriteListings.some(item => item.id === listing.id) ? 'fill-current' : ''} 
                      />
                    </button>
                    
                    {/* Show commute badge if in commute mode */}
                    {isCommuteMode && renderCommuteBadge(listing)}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800">{listing.title}</div>
                        <div className="text-gray-500 text-sm">{listing.location} · {listing.distance} miles from campus</div>
                      </div>
                      <div className="flex items-center text-amber-500">
                        <Star size={16} className="fill-current" />
                        <span className="ml-1 text-sm font-medium">{listing.rating}</span>
                      </div>
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
 
  // =========================
  // Main Render
  // =========================
  return (

    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20 animate-fadeIn">
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full hover:bg-white hover:text-orange-600 transition-all transform hover:scale-105 hover:shadow-lg"
        >
          <span className="font-medium">Skip</span>
        </button>
      </div>

        {/* Animated background elements */}
      <div className="absolute inset-0  bg-gradient-to-br from-orange-50 to-white overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-orange-400/30 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-40 right-1/4 w-16 h-16 bg-blue-200/30 rounded-full animate-float"></div>
      </div>
      
      <div className="min-h-screen bg-gray-50 flex flex-col">

        <div className="pt-16 md:pt-0">
          {/* Simple Hero Section with Better Branding */}
          <div className="relative bg-gradient from-orange-70 to-orange-50 overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200 rounded-full animate-float"></div>
              <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300 rounded-full animate-float-delayed"></div>
              <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-orange-400 rounded-full animate-float-slow"></div>
            </div>
            
            <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
              
                <div className="animate-fadeIn delay-500">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                    Find Your Perfect <span className="text-orange-500">Campus Home </span>
                    <span className="text-gray-800">!</span>
                    </h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    Discover amazing sublease opportunities near your campus. 
                    Search by location, dates, or specific preferences.
                    </p>
                </div>
            </div>
          </div>
            
          {/* Main Search Container */}
          <div className="w-full max-w-5xl mx-auto px-8 -mt-10 relative z-10 animate-slideUp mb-20">
            <div className="bg-white rounded-xl shadow-xl transition-all duration-500 overflow-hidden hover:shadow-xl transform hover:-translate-y-1">
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
                        {bedrooms} bedroom{bedrooms !== 1 ? 's' : ''}, {bathrooms} bathroom{bathrooms !== 1 ? 's' : ''}
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
                
                 {/* Search Buttons */}
                <div className="p-4 flex flex-col sm:flex-row gap-3">
                <button 
                    className="flex-1 p-4 rounded-xl text-white flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg"
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? (
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3" />
                    ) : (
                    <Search size={24} className="mr-3 animate-pulse" />
                    )}
                    <span className="font-semibold text-lg">
                    {isSearching ? 'Searching...' : 'Search'}
                    </span>
                </button>
                
                {/* Reset Button */}
                {hasSearchCriteria() && (
                    <button 
                    className="px-6 py-4 rounded-xl text-gray-500 hover:bg-gray-200 transition-all transform hover:scale-105 hover:text-gray-700"
                    onClick={resetSearch}
                    title="Reset all filters"
                    >
                    <X size={24} />
                    </button>
                )}
                </div>
              </div>

              {/* Expandable sections */}
              {activeSection === 'location' && renderLocationSection()}
              {activeSection === 'dates' && renderCalendarSection()}
              {activeSection === 'rooms' && renderRoomsSection()}
              {activeSection === 'filters' && renderFiltersSection()}
            </div>

            {/* Add this after your main search container
            {showCommuteResults && commuteDestination && (
              <div className="mt-6 max-w-5xl mx-auto px-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200 animate-slideUp transform hover:scale-105 transition-all duration-300">
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

            )}

            {renderCommuteResultsSection()} */}

    
          </div>
        </div>

                  
        {/* Global Styles */}
        <style jsx global>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
          }
          
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(50px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes float-delayed {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(-90deg); }
          }
          
          @keyframes float-slow {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(45deg); }
          }
          
          @keyframes bounce-subtle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          
          @keyframes counter {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          
          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out forwards;
          }
          
          .animate-fadeInLeft {
            animation: fadeInLeft 0.8s ease-out forwards;
          }
          
          .animate-fadeInRight {
            animation: fadeInRight 0.8s ease-out forwards;
          }
          
          .animate-fadeInUp {
            animation: fadeInUp 1s ease-out forwards;
          }
          
          .animate-slideUp {
            animation: slideUp 0.8s ease-out forwards;
          }
          
          .animate-slideDown {
            animation: slideDown 0.6s ease-out forwards;
          }
          
          .animate-float {
            animation: float 6s ease-in-out infinite;
          }
          
          .animate-float-delayed {
            animation: float-delayed 8s ease-in-out infinite;
            animation-delay: 2s;
          }
          
          .animate-float-slow {
            animation: float-slow 10s ease-in-out infinite;
            animation-delay: 4s;
          }
          
          .animate-bounce-subtle {
            animation: bounce-subtle 2s ease-in-out infinite;
          }
          
          .animate-counter {
            animation: counter 0.5s ease-out forwards;
          }
          
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
          .delay-300 { animation-delay: 300ms; }

          /* Price slider styles */
          .slider-thumb::-webkit-slider-thumb {
            appearance: none;
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #D35400;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          
          .slider-thumb::-webkit-slider-thumb:hover {
            transform: scale(1.2);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          }
          
          .slider-thumb::-moz-range-thumb {
            height: 20px;
            width: 20px;
            border-radius: 50%;
            background: #D35400;
            cursor: pointer;
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
          }
          
          .slider-thumb:focus {
            outline: none;
          }
          
          .slider-thumb:focus::-webkit-slider-thumb {
            box-shadow: 0 0 0 3px rgba(211, 84, 0, 0.3);
          }
        `}</style>
      </div>
    </div>
  );
}
export default FirstSearchPage;