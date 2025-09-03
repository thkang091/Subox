"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Tv, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, CircleUser,
  Clock, TrendingUp, TrendingDown, Utensils, ArrowUp, Shield, BookOpen, Waves, Flame,
  Building, Route, Car, Layers
} from 'lucide-react';
import { collection, getDocs, query, orderBy, where, limit } from 'firebase/firestore';
import { Bed, Cigarette } from 'lucide-react';
import { db } from '@/lib/firebase';
import SearchLocationPicker from '../../../components/SearchLocationPicker';


const minneapolisCenter = { lat: 44.9778, lng: -93.2358 };
const neighborhoodCoords = {
  'Dinkytown': { lat: 44.9796, lng: -93.2354 },
  'East Bank': { lat: 44.9743, lng: -93.2277 },
  'Stadium Village': { lat: 44.9756, lng: -93.2189 },
  'Como': { lat: 44.9823, lng: -93.2077 },
  'Southeast Como': { lat: 44.9815, lng: -93.2065 },
  'St. Paul': { lat: 44.9537, lng: -93.0900 },
  'Other': { lat: 44.9778, lng: -93.2358 }
};




const calculateDistanceFromCenter = (coordinates, locationData) => {
  if (!coordinates || !locationData) return 0.5;
  
  const centerLat = locationData.expandedArea?.centerPoint?.lat || locationData.lat || 44.9778;
  const centerLng = locationData.expandedArea?.centerPoint?.lng || locationData.lng || -93.2358;
  
  const R = 3959; // Earth's radius in miles
  const dLat = (coordinates.lat - centerLat) * Math.PI / 180;
  const dLng = (coordinates.lng - centerLng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(centerLat * Math.PI / 180) * Math.cos(coordinates.lat * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};


const calculateAverageDistance = (listings, locationData) => {
  if (!listings.length) return 0;
  
  const totalDistance = listings.reduce((sum, listing) => {
    return sum + calculateDistanceFromCenter({ lat: listing.lat, lng: listing.lng }, locationData);
  }, 0);
  
  return Math.round((totalDistance / listings.length) * 10) / 10;
};


const convertPrice = (monthlyPrice, type) => {
  switch(type) {
    case 'weekly':
      return Math.round(monthlyPrice / 4);
    case 'daily':
      return Math.round(monthlyPrice / 30);
    case 'monthly':
    default:
      return monthlyPrice;
  }
};

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



const FirstSearchPage = ({ userData = null }) => { 
  // =========================
  // State Definitions - UNIFIED with SearchPage
  // =========================
  const [dateRange, setDateRange] = useState({ checkIn: null, checkOut: null });
  const [bathrooms, setBathrooms] = useState('any'); // Change from 1 to 'any'
  const [bedrooms, setBedrooms] = useState('any');   // Change from 1 to
  const [location, setLocation] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
const [hasLoadedUserLocation, setHasLoadedUserLocation] = useState(false);
const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [accommodationType, setAccommodationType] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 500, max: 2000 });
  const [priceType, setPriceType] = useState('monthly');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const [allListings, setAllListings] = useState([]);  
  const [showMap, setShowMap] = useState(false);
  const [mapListings, setMapListings] = useState([]);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const router = useRouter(); 
  const [preferredGender, setPreferredGender] = useState(null); 
  const [smokingPreference, setSmokingPreference] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  
 const [selectedLocationData, setSelectedLocationData] = useState(null);
const [expandedSearchActive, setExpandedSearchActive] = useState(false);
const [expandedAreaInfo, setExpandedAreaInfo] = useState(null);
const [searchStats, setSearchStats] = useState({ 
  totalListings: 0, 
  neighborhoodsSearched: 0,
  averageDistance: 0 
});



const detectCityFromCoordinates = async (lat, lng) => {
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
        
        // Return the detected info like NeighborhoodDetector does
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
  return minneapolisCenter; // <- This was missing!
};


const getNeighborhoodCount = (neighborhoodName) => {
  return allListings.filter(listing => {
    const listingLocation = listing.location || listing.neighborhood || '';
    return listingLocation.toLowerCase().includes(neighborhoodName.toLowerCase()) ||
           neighborhoodName.toLowerCase().includes(listingLocation.toLowerCase());
  }).length;
};

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



useEffect(() => {
  const checkGoogleMapsReady = () => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsReady(true);
      return true;
    }
    return false;
  };

  // Check immediately
  if (checkGoogleMapsReady()) return;

  // Check periodically if not ready
  const interval = setInterval(() => {
    if (checkGoogleMapsReady()) {
      clearInterval(interval);
    }
  }, 500);

  return () => clearInterval(interval);
}, []);

  


  useEffect(() => {
    const loadGoogleMaps = async () => {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      if (!apiKey) {
        console.warn('Google Maps API key not found');
        return;
      }

      // Check if already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        console.log('✅ Google Maps already loaded');
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('🔍 Google Maps script already exists, waiting for load...');
        return;
      }

      try {
        console.log('📦 Loading Google Maps API script...');
        
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geocoding&v=weekly`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          console.log('✅ Google Maps API loaded successfully for FirstSearchPage');
        };
        
        script.onerror = (error) => {
          console.error('❌ Failed to load Google Maps API:', error);
        };
        
        document.head.appendChild(script);
        
      } catch (err) {
        console.error('Error loading Google Maps:', err);
      }
    };

    loadGoogleMaps();
  }, []);

const generateCoordinatesForNeighborhood = (neighborhood) => {
  const baseCoords = neighborhoodCoords[neighborhood] || minneapolisCenter;
  return {
    lat: baseCoords.lat + (Math.random() - 0.5) * 0.005, // Smaller random spread
    lng: baseCoords.lng + (Math.random() - 0.5) * 0.005
  };
};


  // 🔥 UNIFIED: EXACTLY SAME fetchUserListings as SearchPage
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        console.log('🔄 FirstSearchPage: Starting to fetch listings from Firestore...');
        
        const q = query(collection(db, 'listings'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        console.log(`📦 FirstSearchPage: Firestore returned ${querySnapshot.docs.length} documents`);
        
        const listings = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          console.log(`📄 FirstSearchPage: Processing document ${doc.id}:`, data);
          
          // Enhanced coordinate validation
          const validateCoordinate = (coord) => {
            const num = Number(coord);
            return !isNaN(num) && isFinite(num) ? num : null;
          };
          
          let coordinates = null;
          let detectedLocationInfo = null;
          
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
              
              // 🔥 USE NEIGHBORHOODDETECTOR LOGIC
              detectedLocationInfo = await detectCityFromCoordinates(lat, lng);
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
              
              // 🔥 USE NEIGHBORHOODDETECTOR LOGIC
              detectedLocationInfo = await detectCityFromCoordinates(lat, lng);
            }
          }
          
          // Priority 3: generate from location/address/neighborhood
          if (!coordinates) {
            let locationName = data.location || data.address || data.neighborhood || 'Campus Area';
            
            if (!locationName || locationName.trim() === '') {
              locationName = 'Campus Area';
            }
            
            const generated = generateCoordinatesForNeighborhood(locationName);
            coordinates = {
              ...generated,
              source: 'generated',
              address: `${locationName}, Minneapolis, MN`
            };
            
            // 🔥 USE NEIGHBORHOODDETECTOR LOGIC FOR GENERATED COORDS TOO
            detectedLocationInfo = await detectCityFromCoordinates(generated.lat, generated.lng);
          }

          // Extract the city name for search matching
          const detectedCity = detectedLocationInfo ? detectedLocationInfo.city : null;
          const detectedNeighborhood = detectedLocationInfo ? detectedLocationInfo.neighborhood : null;
          
          console.log(`📍 FirstSearchPage ${doc.id}: Detected ${detectedNeighborhood}, ${detectedCity}`);

          const convertDate = (dateValue) => {
            if (!dateValue) return new Date();
            if (dateValue.toDate && typeof dateValue.toDate === 'function') {
              return dateValue.toDate();
            }
            if (typeof dateValue === 'string') {
              const parsed = new Date(dateValue);
              return isNaN(parsed.getTime()) ? new Date() : parsed;
            }
            return new Date();
          };

          // Determine location for display
          let displayLocation = data.location || data.address || data.neighborhood;
          
          if (!displayLocation && data.customLocation?.address) {
            displayLocation = data.customLocation.address;
          }
          
          if (!displayLocation || displayLocation.trim() === '') {
            displayLocation = detectedNeighborhood || 'Campus Area';
          }

          return {
            id: doc.id,
            title: data.title || `${data.listingType || 'Sublease'} in ${displayLocation}`,
            listingType: data.listingType || 'Sublease',
            
            // Keep original location
            location: displayLocation,
            
            // 🔥 STORE DETECTED CITY/NEIGHBORHOOD FOR SEARCH - SAME AS SEARCHPAGE
            detectedCity: detectedCity,
            detectedNeighborhood: detectedNeighborhood,
            detectedLocationInfo: detectedLocationInfo,
            
            // Handle dates properly
            availableFrom: convertDate(data.availableFrom || data.startDate),
            availableTo: convertDate(data.availableTo || data.endDate),
            dateRange: data.dateRange || `${new Date().toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
            
            // Ensure numbers are properly typed
            price: Number(data.price || data.rent || 800),
            rent: Number(data.rent || data.price || 800),
            bedrooms: Number(data.bedrooms || 1),
            bathrooms: Number(data.bathrooms || 1),
            distance: Number(data.distance || 0.5),
            rating: Number(data.rating || 4.5),
            reviews: Number(data.reviews || 10),
            
            // Handle booleans properly
            isPrivateRoom: Boolean(data.isPrivateRoom),
            utilitiesIncluded: Boolean(data.utilitiesIncluded),
            hasRoommates: Boolean(data.hasRoommates),

            // Coordinates
            lat: coordinates.lat,
            lng: coordinates.lng,
            address: coordinates.address,
            customLocation: data.customLocation || null,
            coordinateSource: coordinates.source,
            
            // Other fields
            accommodationType: data.accommodationType || (data.isPrivateRoom ? 'private' : 'entire'),
            description: data.description || data.additionalDetails || 'No description available',
            hostName: data.hostName || 'Anonymous',
            hostEmail: data.hostEmail || '',
            hostBio: data.hostBio || `Hello, I'm ${data.hostName || 'a student'} looking to sublease my place.`,
            
            amenities: Array.isArray(data.amenities) ? data.amenities : 
             (typeof data.amenities === 'object' && data.amenities !== null) ? Object.values(data.amenities) : [],
            includedItems: Array.isArray(data.includedItems) ? data.includedItems : [],
            
            image: data.image || data.additionalImages?.[0] || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop",
            hostImage: data.hostImage || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",

            contactInfo: data.contactInfo || { methods: [], note: '' },
            roommatePreferences: data.roommatePreferences || {},
            currentRoommateInfo: data.currentRoommateInfo || {},
            rentNegotiation: data.rentNegotiation || { isNegotiable: false, minPrice: 0, maxPrice: 0 }
          };
        }));
        
        console.log("✅ FirstSearchPage: Successfully processed listings with detected cities:", listings.length);
        
        setUserListings(listings);
        setAllListings(listings);
        setSearchResults(listings);
        
      } catch (error) {
        console.error('❌ FirstSearchPage: Error fetching user listings:', error);
        setUserListings([]);
        setAllListings([]);
        setSearchResults([]);
      }
    };

    fetchUserListings();
  }, []);

  useEffect(() => {
  if (allListings.length > 0) {
    console.log('🔍 DEBUG: All listings data:');
    allListings.forEach(listing => {
      console.log(`📄 ${listing.id}:`, {
        location: listing.location,
        detectedCity: listing.detectedCity,
        detectedNeighborhood: listing.detectedNeighborhood,
        address: listing.address
      });
    });
  }
}, [allListings]);



const fetchListingsWithExpandedArea = async (locationData) => {
  try {
    setIsSearching(true);
    let listings = [];

    // Better location matching logic
    if (locationData) {
      const searchTerm = (locationData.city || locationData.placeName || locationData.address || '').toLowerCase();
      console.log('Looking for location term:', searchTerm);
      
      listings = allListings.filter(listing => {
        // Try multiple matching strategies
        const listingLocation = (listing.location || '').toLowerCase();
        const detectedCity = (listing.detectedCity || '').toLowerCase();
        const detectedNeighborhood = (listing.detectedNeighborhood || '').toLowerCase();
        
        // Strategy 1: Direct location match
        if (listingLocation.includes(searchTerm) || searchTerm.includes(listingLocation)) {
          console.log(`LOCATION MATCH: ${listing.id} (${listing.location}) matches ${searchTerm}`);
          return true;
        }
        
        // Strategy 2: Detected city match
        if (detectedCity && (detectedCity.includes(searchTerm) || searchTerm.includes(detectedCity))) {
          console.log(`DETECTED CITY MATCH: ${listing.id} (${detectedCity}) matches ${searchTerm}`);
          return true;
        }
        
        // Strategy 3: Detected neighborhood match
        if (detectedNeighborhood && (detectedNeighborhood.includes(searchTerm) || searchTerm.includes(detectedNeighborhood))) {
          console.log(`NEIGHBORHOOD MATCH: ${listing.id} (${detectedNeighborhood}) matches ${searchTerm}`);
          return true;
        }
        
        console.log(`NO MATCH: ${listing.id} - location:"${listingLocation}" detectedCity:"${detectedCity}" detectedNeighborhood:"${detectedNeighborhood}" != "${searchTerm}"`);
        return false;
      });
      
      console.log(`Found ${listings.length} listings for ${searchTerm}`);
    } else {
      listings = [...allListings];
    }

    // Apply additional filters
    if (bedrooms !== 'any' && bedrooms > 0) {
      listings = listings.filter(listing => listing.bedrooms >= bedrooms);
    }
    
    if (bathrooms !== 'any' && bathrooms > 1) {
      listings = listings.filter(listing => listing.bathrooms >= bathrooms);
    }
    
    listings = listings.filter(listing => 
      listing.price >= priceRange.min && listing.price <= priceRange.max
    );
    
    if (accommodationType) {
      listings = listings.filter(listing => 
        listing.accommodationType === accommodationType
      );
    }
    
    if (selectedAmenities.length > 0) {
      listings = listings.filter(listing =>
        selectedAmenities.every(amenity => 
          listing.amenities.includes(amenity)
        )
      );
    }

    setSearchResults(listings);
    setMapListings(listings);
    
    // Update search stats for expanded searches
    if (locationData?.areaType === 'expanded_region') {
      setSearchStats({
        totalListings: listings.length,
        neighborhoodsSearched: locationData.expandedArea?.neighborhoods.length || 0,
        averageDistance: calculateAverageDistance(listings, locationData)
      });
    }
    
  } catch (error) {
    console.error('Error in search:', error);
    setSearchResults([]);
  } finally {
    setIsSearching(false);
  }
};
      
  // Helper functions from SearchPage
  const calculateDistanceFromCenter = (coordinates, locationData) => {
    if (!coordinates || !locationData) return 0.5;
    
    const centerLat = locationData.expandedArea?.centerPoint?.lat || locationData.lat || minneapolisCenter.lat;
    const centerLng = locationData.expandedArea?.centerPoint?.lng || locationData.lng || minneapolisCenter.lng;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (coordinates.lat - centerLat) * Math.PI / 180;
    const dLng = (coordinates.lng - centerLng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(centerLat * Math.PI / 180) * Math.cos(coordinates.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  };

  const calculateAverageDistance = (listings, locationData) => {
    if (!listings.length) return 0;
    
    const totalDistance = listings.reduce((sum, listing) => {
      return sum + calculateDistanceFromCenter({ lat: listing.lat, lng: listing.lng }, locationData);
    }, 0);
    
    return Math.round((totalDistance / listings.length) * 10) / 10;
  };

  // =========================
  // 🔥 UNIFIED: Enhanced Location Handling - SAME AS SEARCHPAGE
  // =========================

const handleLocationSelect = (selectedLocation) => {
  console.log('Location Selected - Full Data:', selectedLocation);
  
  setSelectedLocationData({
    ...selectedLocation,
    // Ensure we have the right search term
    searchTerm: selectedLocation.placeName || selectedLocation.city || selectedLocation.address,
    originalSelection: selectedLocation
  });
  
  let displayName = selectedLocation.placeName || selectedLocation.address;
  if (selectedLocation.areaType === 'expanded_region') {
    displayName = selectedLocation.expandedArea?.regionName || selectedLocation.placeName;
    setExpandedSearchActive(true);
    setExpandedAreaInfo(selectedLocation.expandedArea);
  } else if (selectedLocation.areaType === 'city') {
    displayName = `${selectedLocation.city || selectedLocation.placeName} Area`;
  }
  
  setLocation([displayName]);
};

const handleSearch = () => {
  setIsSearching(true);
  
  const searchParams = new URLSearchParams();
  
  // Enhanced location parameters with expansion data
  if (selectedLocationData) {
    searchParams.append('areaType', selectedLocationData.areaType || 'specific');
    searchParams.append('placeName', selectedLocationData.placeName || '');
    
    if (selectedLocationData.areaType === 'expanded_region') {
      searchParams.append('expandedRegion', selectedLocationData.expandedArea?.regionName || '');
      searchParams.append('neighborhoods', selectedLocationData.expandedArea?.neighborhoods.join(',') || '');
      searchParams.append('searchRadius', selectedLocationData.expandedArea?.searchRadius.toString() || '');
    } else if (selectedLocationData.areaType === 'city') {
      searchParams.append('city', selectedLocationData.city || '');
    } else if (selectedLocationData.areaType === 'neighborhood') {
      searchParams.append('neighborhood', selectedLocationData.placeName || '');
    }
    
    if (selectedLocationData.lat && selectedLocationData.lng) {
      searchParams.append('lat', selectedLocationData.lat.toString());
      searchParams.append('lng', selectedLocationData.lng.toString());
    }
    
    if (selectedLocationData.boundingBox) {
      searchParams.append('bounds', JSON.stringify(selectedLocationData.boundingBox));
    }
    
    // CRITICAL: Pass the entire selectedLocationData object
    searchParams.append('selectedLocationData', JSON.stringify(selectedLocationData));
  } else if (location.length > 0) {
    location.forEach(loc => {
      searchParams.append('location', loc);
    });
  }
  
  // Date parameters
  if (dateRange.checkIn) {
    searchParams.append('checkIn', dateRange.checkIn.toISOString());
  }
  if (dateRange.checkOut) {
    searchParams.append('checkOut', dateRange.checkOut.toISOString());
  }
  
  // Room parameters - ALWAYS send both, even if 'any'
  searchParams.append('bedrooms', bedrooms.toString());
  searchParams.append('bathrooms', bathrooms.toString());
  
  // Price parameters
  searchParams.append('minPrice', priceRange.min.toString());
  searchParams.append('maxPrice', priceRange.max.toString());
  searchParams.append('priceType', priceType);
  
  // Filter parameters
  if (accommodationType) {
    searchParams.append('accommodationType', accommodationType);
  }
  
  if (selectedAmenities.length > 0) {
    searchParams.append('amenities', selectedAmenities.join(','));
  }
  
  if (preferredGender) {
    searchParams.append('preferredGender', preferredGender);
  }
  
  if (smokingPreference) {
    searchParams.append('smokingPreference', smokingPreference);
  }

  setTimeout(() => {
    const searchUrl = `/sublease/search?${searchParams.toString()}`;
    console.log('🔄 FirstSearchPage: Navigating with URL:', searchUrl);
    window.location.href = searchUrl;
    setIsSearching(false);
  }, 1500);
};


  useEffect(() => {
    setIsMounted(true);
    
    try {
      const savedFavorites = localStorage.getItem('favoriteListings');
      if (savedFavorites) {
        setFavoriteListings(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    if (isMounted && favoriteListings.length > 0) {
      try {
        localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favoriteListings, isMounted]);

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

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

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

  const handleDateClick = (day) => {
    if (!day) return;

    const newDate = new Date(currentYear, currentMonth, day);
    
    if (!dateRange.checkIn) {
      setDateRange({ ...dateRange, checkIn: newDate });
      setSelectedDates([day]);
    } else if (!dateRange.checkOut) {
      if (newDate > dateRange.checkIn) {
        setDateRange({ ...dateRange, checkOut: newDate });
        
        const startDay = dateRange.checkIn.getDate();
        const range = [];
        for (let i = startDay; i <= day; i++) {
          range.push(i);
        }
        setSelectedDates(range);
      } else {
        setDateRange({ checkIn: newDate, checkOut: null });
        setSelectedDates([day]);
      }
    } else {
      setDateRange({ checkIn: newDate, checkOut: null });
      setSelectedDates([day]);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

const toggleSection = (section) => {
  if (activeSection === section) {
    setActiveSection(null);
  } else {
    setActiveSection(section);
    
    // Generate neighborhoods when location section opens
    if (section === 'location' && neighborhoods.length === 0) {
      // Use any available user location data
      const userLocationData = userData?.userLocation || selectedLocationData;
      if (userLocationData && isGoogleMapsReady) {
        generateNearbyNeighborhoods(userLocationData);
      } else if (isGoogleMapsReady) {
        // Fallback to default location if no user location
        const defaultLocation = {
          lat: 44.9778,
          lng: -93.2358,
          city: 'Minneapolis',
          placeName: 'Minneapolis',
          areaType: 'city'
        };
        generateNearbyNeighborhoods(defaultLocation);
      }
    }
  }
};

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

  const handlePriceChange = (type, value) => {
    const numValue = parseInt(value);

    if (type === 'min') {
      if (numValue < 500) {
        setPriceRange({ ...priceRange, min: 500 });
      } else if (numValue >= priceRange.max) {
        setPriceRange({ ...priceRange, min: priceRange.max - 50 });
      } else {
        setPriceRange({ ...priceRange, min: numValue });
      }
    } else {
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
        return Math.round(monthlyPrice / 4);
      case 'daily':
        return Math.round(monthlyPrice / 30);
      case 'monthly':
      default:
        return monthlyPrice;
    }
  };

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

  const handleSkip = () => {
    window.location.href = '/sublease/search';
  };

const hasSearchCriteria = () => {
  return (
    dateRange.checkIn !== null || 
    dateRange.checkOut !== null || 
    bathrooms !== 'any' || 
    bedrooms !== 'any' || 
    location.length > 0 || 
    accommodationType !== null ||
    priceRange.min !== 500 ||
    priceRange.max !== 2000 ||
    selectedAmenities.length > 0 ||
    preferredGender !== null ||
    smokingPreference !== null
  );
};

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

  const toggleFavorite = (listing) => {
    const isFavorited = favoriteListings.some(item => item.id === listing.id);
    
    if (isFavorited) {
      setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
    } else {
      const favoriteItem = {
        id: listing.id,
        title: listing.title || 'Untitled Listing',
        location: listing.location || 'Unknown Location',
        price: listing.price || 0,
        bedrooms: listing.bedrooms || 1,
        ...(listing.bathrooms !== undefined && { bathrooms: listing.bathrooms }),
        image: listing.image || '/api/placeholder/800/500',
        ...(listing.dateRange && { dateRange: listing.dateRange })
      };
      
      setFavoriteListings([favoriteItem, ...favoriteListings]);
    }
  };

const resetSearch = () => {
  setDateRange({ checkIn: null, checkOut: null });
  setBathrooms('any'); // Change from 1 to 'any'
  setBedrooms('any');  // Change from 1 to 'any'
  setLocation([]);
  setSelectedLocationData(null);
  setSelectedDates([]);
  setAccommodationType(null);
  setPriceRange({ min: 500, max: 2000 });
  setSelectedAmenities([]);
  setPreferredGender(null);
  setSmokingPreference(null);
  
  // Reset expansion-related states
  setExpandedSearchActive(false);
  setExpandedAreaInfo(null);
  setSearchStats({ totalListings: 0, neighborhoodsSearched: 0, averageDistance: 0 });
  
  // Reset to show all listings
  setSearchResults([...allListings]);
};

  const handleListingClick = (listing) => {
    console.log('🔍 Navigating to listing:', listing.id);
    try {
      router.replace(`/sublease/search/${listing.id}`);
    } catch (error) {
      console.error('❌ Router.replace failed:', error);
    }
  };



const renderLocationSection = () => {
  return (
    <div className="p-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Search by Location - Left Side */}
        <div>
          <h3 className="font-bold mb-3 text-gray-800 flex items-center gap-2">
            <MapPin size={18} className="text-orange-500" />
            Search by Location
            {expandedSearchActive && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Layers size={12} />
                Smart Expansion Active
              </span>
            )}
          </h3>
          
          {/* Location Search Input */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full border-2 border-orange-400 flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              </div>
              <span className="font-medium text-gray-700">Choose Location</span>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Search for any place. Specific addresses will expand to show the entire city area.
            </p>
            
            {/* SearchLocationPicker Integration */}
            <SearchLocationPicker 
              initialValue={location[0] || ""}
              onLocationSelect={handleLocationSelect}
              showDeliveryOptions={false}
              placeholder="Enter any city, address, or landmark..."
            />
            
            {/* Use Current Location Button */}
            <button 
              className="w-full mt-3 bg-orange-500 text-white py-2.5 px-4 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 font-medium"
              onClick={() => {
                // Handle current location functionality
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const { latitude, longitude } = position.coords;
                    console.log('Current location:', latitude, longitude);
                  });
                }
              }}
            >
              <MapPin size={16} />
              Use my current location
            </button>
          </div>
        </div>
        
        {/* Popular Areas Near You - Right Side */}
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
      
      {/* Enhanced area info display when expanded search is active */}
      {expandedSearchActive && expandedAreaInfo && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <Layers size={20} className="text-purple-600" />
            <div>
              <h4 className="font-semibold text-purple-800">Smart Area Expansion Active</h4>
              <p className="text-sm text-purple-600">Automatically expanded your search to find the best options</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-purple-800">{expandedAreaInfo.neighborhoods?.length || 0}</div>
              <div className="text-xs text-purple-600">Neighborhoods</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-purple-800">{(expandedAreaInfo.searchRadius / 1000).toFixed(1)}km</div>
              <div className="text-xs text-purple-600">Search Radius</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-purple-800">{expandedAreaInfo.regionName}</div>
              <div className="text-xs text-purple-600">Region Name</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="mt-6 flex justify-between items-center">
        <button 
          className="text-orange-500 hover:underline"
          onClick={() => setActiveSection(null)}
        >
          Cancel
        </button>
        <button 
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 font-medium transition-colors"
          onClick={() => {
            setActiveSection(null);
            if (selectedLocationData) {
              fetchListingsWithExpandedArea(selectedLocationData);
            }
          }}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

  // =========================
  // Enhanced Calendar, Rooms, and Filters sections (keeping existing code)
  // =========================

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
            onClick={() => {
              const startDate = new Date();
              const endDate = new Date();
              endDate.setDate(endDate.getDate() + 14);
              setDateRange({ checkIn: startDate, checkOut: endDate });
              setCurrentMonth(startDate.getMonth());
              setCurrentYear(startDate.getFullYear());
            }}
            className="w-full p-3 border border-orange-200 text-gray-700 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="font-medium">Available Now</div>
            <div className="text-sm text-gray-500">Next 2 weeks</div>
          </button>
          
          <button 
            onClick={() => {
              const startDate = new Date(currentYear, 4, 1);
              const endDate = new Date(currentYear, 7, 31);
              setDateRange({ checkIn: startDate, checkOut: endDate });
              setCurrentMonth(4);
            }}
            className="w-full p-3 border border-orange-200 text-gray-700 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <div className="font-medium">Summer Semester</div>
            <div className="text-sm text-gray-500">May - August</div>
          </button>
          
          <button 
            onClick={() => {
              const startDate = new Date(currentYear, 7, 30);
              const endDate = new Date(currentYear, 11, 15);
              setDateRange({ checkIn: startDate, checkOut: endDate });
              setCurrentMonth(7);
            }}
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
            { key: 'entire', label: 'Entire Place', desc: 'Have the entire place to yourself', icon: <Home size={18} className="text-gray-700"/> },
            { key: 'private', label: 'Private Room', desc: 'Your own bedroom, shared spaces', icon: <Bed size={18} className="text-gray-700"/> },
            { key: 'shared', label: 'Shared Room', desc: 'Share a bedroom with others', icon: <Users size={18} className="text-gray-700"/> }
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

            {/* Visual Price Bar with Selected Range */}
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
                onClick={() => setPreferredGender(gender.key)}
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

  // =========================
  // 🔥 UNIFIED: Enhanced Listings Display with Expansion Info - SAME AS SEARCHPAGE
  // =========================

  const renderFeaturedListings = () => {
    const displayListings = searchResults;
    
    let sectionTitle = 'All Subleases';
    if (selectedLocationData) {
      if (selectedLocationData.areaType === 'expanded_region') {
        sectionTitle = `${selectedLocationData.expandedArea?.regionName || 'Expanded Area'} (${displayListings.length} found)`;
      } else {
        sectionTitle = `Listings in ${selectedLocationData.placeName || selectedLocationData.address} (${displayListings.length} found)`;
      }
    } else if (hasSearchCriteria()) {
      sectionTitle = `Search Results (${displayListings.length} found)`;
    }

    return (
      <div className="w-full md:pl-16 px-4 mt-12 mb-16 md:pr-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
              {expandedSearchActive && <Layers size={24} className="text-purple-500" />}
              {sectionTitle}
            </h2>
            <button 
              onClick={resetSearch} 
              className="text-gray-700 hover:underline font-medium cursor-pointer"
            >
              {selectedLocationData ? 'Clear location filter' : 'View all'}
            </button>
          </div>

          {/* Enhanced Area Info for Expanded Searches - SAME AS SEARCHPAGE */}
          {expandedSearchActive && expandedAreaInfo && (
            <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <Layers size={24} className="text-purple-600" />
                <div>
                  <h3 className="font-bold text-purple-800 text-lg">Smart Area Expansion Active</h3>
                  <p className="text-purple-600 text-sm">Automatically expanded your search to find the best options</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-800">{searchStats.neighborhoodsSearched}</div>
                  <div className="text-sm text-purple-600">Neighborhoods Searched</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {expandedAreaInfo.neighborhoods.slice(0, 3).join(', ')}{expandedAreaInfo.neighborhoods.length > 3 && ` +${expandedAreaInfo.neighborhoods.length - 3} more`}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-800">{searchStats.totalListings}</div>
                  <div className="text-sm text-purple-600">Total Listings Found</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Across {(expandedAreaInfo.searchRadius / 1000).toFixed(1)}km radius
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-800">{searchStats.averageDistance}</div>
                  <div className="text-sm text-purple-600">Avg Distance (miles)</div>
                  <div className="text-xs text-gray-500 mt-1">
                    From search center
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                <div className="text-sm text-purple-800">
                  <strong>Search Strategy:</strong> Instead of just searching "{selectedLocationData?.placeName}", we automatically expanded to include {expandedAreaInfo.neighborhoods.length} relevant neighborhoods to give you more housing options.
                </div>
              </div>
            </div>
          )}

          {/* Standard Area Info for Non-Expanded Searches - SAME AS SEARCHPAGE */}
          {selectedLocationData && !expandedSearchActive && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                {selectedLocationData.areaType === 'city' && <Building size={20} className="text-blue-500" />}
                {selectedLocationData.areaType === 'neighborhood' && <Home size={20} className="text-green-500" />}
                {selectedLocationData.areaType === 'university' && <Building size={20} className="text-purple-500" />}
                <div>
                  <div className="font-medium text-blue-800">
                    Searching in: {selectedLocationData.placeName || selectedLocationData.address}
                  </div>
                  <div className="text-sm text-blue-600">
                    {selectedLocationData.areaType === 'city' && 'Covering the entire city area including all neighborhoods'}
                    {selectedLocationData.areaType === 'neighborhood' && 'Focused on this specific neighborhood'}
                    {selectedLocationData.areaType === 'university' && 'Campus area and nearby student housing'}
                  </div>
                </div>
              </div>
            </div>
          )}
        
          {/* Listings Grid - SAME AS SEARCHPAGE */}
          {displayListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <Home size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-lg">
                  {selectedLocationData 
                    ? `No listings found in ${selectedLocationData.placeName || 'this area'}` 
                    : 'No listings found matching your criteria'}
                </p>
                <p className="text-sm mt-2">
                  Try expanding your search area or adjusting your filters
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
                    
                    {/* Enhanced badges for expanded search results - SAME AS SEARCHPAGE */}
                    {expandedSearchActive && listing.searchMetadata?.foundViaExpansion && (
                      <div className="absolute bottom-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Layers size={12} />
                        <span>Smart Match</span>
                      </div>
                    )}
                    
                    {/* Distance badge */}
                    {listing.distance > 0 && (
                      <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded-lg text-xs font-bold">
                        {listing.distance} mi
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-800">{listing.title}</div>
                        <div className="text-gray-500 text-sm flex items-center gap-1">
                          <MapPin size={12} />
                          {listing.location}
                          {expandedSearchActive && listing.searchMetadata?.foundViaExpansion && (
                            <span className="text-purple-600 text-xs">• via expansion</span>
                          )}
                        </div>
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
                    
                    {/* Enhanced metadata display for expanded searches - SAME AS SEARCHPAGE */}
                    {expandedSearchActive && listing.searchMetadata?.foundViaExpansion && (
                      <div className="mt-2 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-md">
                        Found in {listing.searchMetadata.matchingLocationTag} • {listing.searchMetadata.distanceFromCenter} mi from center
                      </div>
                    )}
                    
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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-white overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-200/30 rounded-full animate-float"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-orange-300/30 rounded-full animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-orange-400/30 rounded-full animate-float-slow"></div>
        <div className="absolute bottom-40 right-1/4 w-16 h-16 bg-blue-200/30 rounded-full animate-float"></div>
        {expandedSearchActive && (
          <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-purple-200/20 rounded-full animate-float-slow transform -translate-x-1/2 -translate-y-1/2"></div>
        )}
      </div>
      
      <div className="pt-16 md:pt-0">
        {/* Enhanced Hero Section */}
        <div className="relative bg-gradient-to-br from-orange-50 to-white overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-20 text-center">
            <div className="animate-fadeIn delay-500">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Find Your Perfect <span className="text-orange-500">Campus Home</span>!
                {expandedSearchActive && (
                  <span className="block text-lg text-purple-600 mt-2 flex items-center justify-center gap-2">
                    <Layers size={20} />
                    Smart Area Search Active
                  </span>
                )}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {expandedSearchActive 
                  ? `Searching ${expandedAreaInfo?.neighborhoods.length} neighborhoods in ${expandedAreaInfo?.regionName} for the best options`
                  : 'Discover amazing sublease opportunities near your campus. Search by location, dates, or specific preferences with our enhanced area search.'
                }
              </p>
              
              {/* Enhanced search tips */}
              {selectedLocationData && (
                <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                  {selectedLocationData.areaType === 'expanded_region' ? (
                    <>
                      <Layers size={16} className="text-purple-500" />
                      <span>
                        Smart expansion active: <strong>{selectedLocationData.expandedArea?.regionName}</strong>
                      </span>
                    </>
                  ) : (
                    <>
                      {selectedLocationData.areaType === 'city' && <Building size={16} />}
                      {selectedLocationData.areaType === 'neighborhood' && <Home size={16} />}
                      {selectedLocationData.areaType === 'university' && <Building size={16} />}
                      <span>
                        Currently searching in: <strong>{selectedLocationData.placeName}</strong>
                        {selectedLocationData.areaType === 'city' && ' (entire area)'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
          
        {/* Enhanced Search Container */}
        <div className="w-full max-w-5xl mx-auto px-8 -mt-10 relative z-10 animate-slideUp mb-20">
          <div className="bg-white rounded-xl shadow-xl transition-all duration-500 overflow-hidden hover:shadow-xl transform hover:-translate-y-1">
            {/* Search Controls */}
            <div className="flex flex-col md:flex-row md:items-center p-3 gap-2">
              {/* Enhanced Location Display */}
              <div 
                className={`flex-1 p-3 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${activeSection === 'location' ? 'bg-blue-50 border border-blue-200 shadow-inner' : 'hover:bg-gray-50 border border-transparent hover:shadow-md'}`}
                onClick={() => toggleSection('location')}
              >
                <div className="flex items-center">
                  {expandedSearchActive ? (
                    <Layers className="mr-2 text-purple-500 flex-shrink-0" size={18} />
                  ) : selectedLocationData?.areaType === 'city' ? (
                    <Building className="mr-2 text-blue-500 flex-shrink-0" size={18} />
                  ) : selectedLocationData?.areaType === 'neighborhood' ? (
                    <Home className="mr-2 text-green-500 flex-shrink-0" size={18} />
                  ) : (
                    <MapPin className="mr-2 text-orange-500 flex-shrink-0" size={18} />
                  )}
                  <div className="ml-2">
                    <div className="font-medium text-sm text-gray-500 flex items-center gap-2">
                      Location
                      {expandedSearchActive && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                          Smart
                        </span>
                      )}
                    </div>
                    <div className={`font-semibold transition-all duration-300 ${location.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                      {location.length > 0 
                        ? location.length === 1 
                          ? location[0] 
                          : `${location[0]} + ${location.length - 1} more`
                        : 'Where are you looking?'}
                    </div>
                    {expandedSearchActive && expandedAreaInfo && (
                      <div className="text-xs text-purple-600 mt-1">
                        {expandedAreaInfo.neighborhoods.length} neighborhoods • {(expandedAreaInfo.searchRadius / 1000).toFixed(1)}km radius
                      </div>
                    )}
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
              
              {/* Rooms */}
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
              
              {/* Enhanced Search Buttons */}
              <div className="p-4 flex flex-col sm:flex-row gap-3">
                <button 
                  className="flex-1 p-4 rounded-xl text-white flex items-center justify-center bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 hover:shadow-lg"
                  onClick={handleSearch} // 🔥 UNIFIED: Use the unified handleSearch
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3" />
                  ) : expandedSearchActive ? (
                    <Layers size={24} className="mr-3 animate-pulse" />
                  ) : (
                    <Search size={24} className="mr-3 animate-pulse" />
                  )}
                  <span className="font-semibold text-lg">
                    {isSearching ? 'Searching...' : expandedSearchActive ? 'Smart Search' : 'Search'}
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
        </div>
        
    
      </div>

      {/* Enhanced Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
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
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-slideUp {
          animation: slideUp 0.8s ease-out forwards;
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
        
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>
    </div>
  );
};

export default FirstSearchPage;