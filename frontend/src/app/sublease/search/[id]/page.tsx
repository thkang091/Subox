"use client"

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import Script from "next/script"; // Add this import
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, Plus,
  ArrowLeft, ArrowRight,Video, MessageCircle, Package, Bell, AlertCircle, Menu, MessagesSquare, Info,
  Expand, Eye, EyeOff, Navigation, Check, Volume2,CalendarCheck,Zap,Cigarette, BookOpen, Thermometer, Utensils, Dumbbell, Trees,
  Building, Flame, ArrowUp, Shield, Accessibility, Sofa, Gamepad2, Play, Trash2
} from 'lucide-react';
import { doc, getDoc, addDoc, deleteDoc, updateDoc, collection, query, where, getDocs, serverTimestamp, increment, orderBy } from 'firebase/firestore';import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import { featuredListings } from '../../../../data/listings';
import Badges from '@/data/badge';



// gender information icon
const getGenderInfo = (preferredGender) => {
  switch(preferredGender) {
    case 'Male':
      return { icon: <User className="w-4 h-4 mr-2 text-orange-500" />, text: "Male Only" };
    case 'Female':
      return { icon: <User className="w-4 h-4 mr-2 text-pink-500" />, text: "Female Only" };
    case 'any':
    default:
      return { icon: <Users className="w-4 h-4 mr-2 text-green-500" />, text: "Any" };
  }
};
// Updated NeighborhoodDetectorWrapper with better error handling
const NeighborhoodDetectorWrapper = ({ listing, onNeighborhoodDetected }: { 
  listing: any, 
  onNeighborhoodDetected: (neighborhood: string) => void 
}) => {
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [locationType, setLocationType] = useState<'specific' | 'neighborhood' | 'none'>('none');
  const [locationName, setLocationName] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);

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
        setCoordinates({
          lat: listing.customLocation.lat,
          lng: listing.customLocation.lng
        });
        setLocationType('specific');
        
        const locationDisplayName = listing.customLocation.placeName || 
                                   listing.customLocation.address || 
                                   'Specific Location';
        setLocationName(locationDisplayName);
        
        if (listing.customLocation.placeName) {
          onNeighborhoodDetected(listing.customLocation.placeName);
        }
        return;
      }
      
      // ✅ CASE 2: Has neighborhood name (but not "Other")
      if (listing?.location && listing.location !== 'Other') {
        setLocationName(listing.location);
        setLocationType('neighborhood');
        onNeighborhoodDetected(listing.location);
        
        // Set default coordinates immediately
        setCoordinates({
          lat: 44.9778,
          lng: -93.2650
        });

        // Search for the neighborhood if Google Maps is loaded
        if (googleMapsLoaded) {
          searchForNeighborhood(listing.location);
        }
        return;
      }
      
      // ✅ CASE 3: Location is "Other" but no customLocation
      if (listing?.location === 'Other' && !listing?.customLocation) {
        setLocationName('Location not specified');
        setLocationType('none');
        return;
      }
      
      // ✅ CASE 4: No location data at all
      setLocationName('No location');
      setLocationType('none');
    };

    processListingLocation();
  }, [listing, googleMapsLoaded]);

  const searchForNeighborhood = (neighborhood: string) => {
    if (!googleMapsLoaded || !window.google?.maps?.places?.PlacesService) {
      return;
    }

    setIsSearching(true);
    performPlacesSearch(neighborhood);
  };

  const performPlacesSearch = (neighborhood: string) => {
    try {
      const mapDiv = document.createElement('div');
      const map = new window.google.maps.Map(mapDiv, {
        center: { lat: 44.9778, lng: -93.2650 },
        zoom: 13
      });

      const service = new window.google.maps.places.PlacesService(map);
      
      const request = {
        query: `${neighborhood}, Minneapolis, MN`,
        fields: ['name', 'geometry', 'place_id', 'formatted_address']
      };

      service.textSearch(request, (results, status) => {
        setIsSearching(false);
        
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
          const place = results[0];
          const location = place.geometry?.location;
          
          if (location) {
            const coords = {
              lat: location.lat(),
              lng: location.lng()
            };
            
            setCoordinates(coords);
          }
        }
      });
    } catch (error) {
      setIsSearching(false);
    }
  };

  // Create map when coordinates are available and Google Maps is loaded
  useEffect(() => {
    if (!mapRef.current || !googleMapsLoaded || !window.google?.maps || !coordinates || mapInstance) return;

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: coordinates.lat, lng: coordinates.lng },
        zoom: 14,
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

      // Add a marker
      new window.google.maps.Marker({
        position: { lat: coordinates.lat, lng: coordinates.lng },
        map: map,
        title: locationName,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#f97316" stroke="#fff" stroke-width="2"/>
              <circle cx="16" cy="16" r="4" fill="#fff"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      });

      setMapInstance(map);
    } catch (error) {
      // Silent error handling
    }
  }, [coordinates, locationName, mapInstance, googleMapsLoaded]);

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
          <div>
            <h3 className="font-semibold text-gray-900">Location</h3>
            <p className="text-sm text-gray-600">{locationName}</p>
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
          </div>
        )}
      </div>
    </div>
  );
};

const ListingDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
const [hostData, setHostData] = useState({
  totalReviews: 0,
  averageRating: 0,
  reviewsGivenCount: 0
});  
  // ALL useState hooks first
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [detectedNeighborhood, setDetectedNeighborhood] = useState<string>('');
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [listing, setListing] = useState(null);
  const [listingLoading, setListingLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [hostReviews, setHostReviews] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Calendar-related state variables
  const [showAvailabilityCalendar, setShowAvailabilityCalendar] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [selectedDateRanges, setSelectedDateRanges] = useState([]);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(null); // Add this line

  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editReviewRating, setEditReviewRating] = useState(5);
  const [editReviewComment, setEditReviewComment] = useState('');

  const { user } = useAuth();

  // Debug useEffect
  useEffect(() => {
    if (listing) {
      console.log('🔍 DEBUG: Listing data:', listing);
      console.log('🔍 DEBUG: Location string:', listing.location);
      console.log('🔍 DEBUG: Available listing fields:', Object.keys(listing));
      
      // Check for different coordinate formats
      console.log('🔍 DEBUG: Coordinates check:', {
        coordinates: listing.coordinates,
        lat: listing.lat,
        lng: listing.lng,
        latitude: listing.latitude,
        longitude: listing.longitude
      });
    }
  }, [listing]);

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);
    
  // Favorites loading effect
  useEffect(() => {
    if (isMounted) {
      try {
        const savedFavorites = localStorage.getItem('favoriteListings');
        if (savedFavorites) {
          setFavoriteListings(JSON.parse(savedFavorites));
        }
      } catch (error) {
        console.error('Error loading favorites from localStorage:', error);
      }
    }
  }, [isMounted]);

  // Favorites saving effect
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favoriteListings, isMounted]);

  // Fetch listing effect
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      setListingLoading(true);
  
      try {
        // First try to find in featured listings (for mock data)
        const foundListing = featuredListings.find(listing => listing.id === id);
        
        if (foundListing) {
          setListing(foundListing);
          setListingLoading(false);
          return;
        }
        
        // If not found in featured, try Firestore
        const docRef = doc(db, 'listings', id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const firestoreData = docSnap.data();
          
          // Helper function for date conversion
          const convertFirestoreDate = (dateValue: any) => {
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
        
          const formattedListing = {
            id: docSnap.id,
            
            // Basic info
            title: firestoreData.title || `${firestoreData.listingType || 'Sublease'} in ${firestoreData.location || 'Campus Area'}`,
            listingType: firestoreData.listingType || 'Sublease',
            location: firestoreData.location || 'Campus Area',
            
            // ✅ CRITICAL: Preserve customLocation data from Firestore
            customLocation: firestoreData.customLocation || null,
            
            // ✅ ALSO: Preserve address field
            address: firestoreData.address || firestoreData.customLocation?.address || '',
            
            // Images - handle both single and multiple images
            image: firestoreData.image || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop",
            additionalImages: firestoreData.additionalImages || [],
            
            // Dates
            availableFrom: convertFirestoreDate(firestoreData.availableFrom || firestoreData.startDate),
            availableTo: convertFirestoreDate(firestoreData.availableTo || firestoreData.endDate),
            dateRange: firestoreData.dateRange || (() => {
              const start = convertFirestoreDate(firestoreData.availableFrom || firestoreData.startDate);
              const end = convertFirestoreDate(firestoreData.availableTo || firestoreData.endDate);
              return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            })(),
            partialDatesOk: Boolean(firestoreData.partialDatesOk || false),
            
            // Pricing
            price: Number(firestoreData.price || firestoreData.rent || 0),
            rent: Number(firestoreData.rent || firestoreData.price || 0),
            negotiable: Boolean(firestoreData.rentNegotiation?.isNegotiable || false),
            utilitiesIncluded : Boolean(firestoreData.utilitiesIncluded || false),
            approximateUtilities: Number(firestoreData.approximateUtilities || 0),

            // Property details
            bedrooms: Number(firestoreData.bedrooms || 1),
            bathrooms: Number(firestoreData.bathrooms || 1),
            distance: Number(firestoreData.distance || 0.5),
            includedItems: firestoreData.includedItems || [],
            // Ratings
            rating: Number(firestoreData.rating || 0),
            reviews: Number(firestoreData.reviews || 0),
            averageRating: Number(firestoreData.averageRating || firestoreData.reviewStats?.averageRating || 0),
totalReviews: Number(firestoreData.totalReviews || firestoreData.reviewStats?.totalReviews || 0),
            // Amenities
            amenities: Array.isArray(firestoreData.amenities) ? firestoreData.amenities : [],
            
            // Host information
            hostId: firestoreData.hostId || firestoreData.userId || firestoreData.createdBy?.uid || docSnap.id,
            hostName: firestoreData.hostName || firestoreData.createdBy?.displayName || 'Anonymous',
            hostEmail: firestoreData.hostEmail || firestoreData.createdBy?.email || '',
            hostBio: firestoreData.hostBio || `Hello, I'm ${firestoreData.hostName || 'a student'} looking to sublease my place.`,
            hostImage: firestoreData.hostImage || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
            
            // Description
            description: firestoreData.description || firestoreData.additionalDetails || 'No description available',
            
            // Additional fields for detail page
            accommodationType: firestoreData.accommodationType || (firestoreData.isPrivateRoom ? 'private' : 'entire'),
            preferredGender: firestoreData.preferredGender || 'any',
            isVerifiedUMN: Boolean(firestoreData.isVerifiedUMN || false),
            hostReviews: firestoreData.hostReviews || [],
            noiseLevel: firestoreData.roommatePreferences?.noiseLevel,
            cleanliness : firestoreData.roommatePreferences?.cleanlinessLevel,

            
            // Booleans
            isPrivateRoom: Boolean(firestoreData.isPrivateRoom),
            hasRoommates: Boolean(firestoreData.hasRoommates),
            smokingAllowed : Boolean(firestoreData.roommatePreferences?.smokingAllowed),
            petsAllowed : Boolean(firestoreData.roommatePreferences?.petsAllowed),

            contactMethods: firestoreData.contactInfo?.methods?.filter(method => method.selected) || [],
          };
          
          setListing(formattedListing);
        } else {
          console.log('No listing found with ID:', id);
          setListing(null);
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        setListing(null);
      } finally {
        setListingLoading(false);
      }
    };
    
    fetchListing();
  }, [id]);

  // Host reviews effect
useEffect(() => {
  if (listing?.hostId) {
    fetchHostReviews();
  }
}, [listing?.hostId]);

  // Keyboard navigation effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showAllImages) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      } else if (e.key === 'Escape') {
        setShowAllImages(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAllImages]);

  // Fetch unavailable dates effect
  useEffect(() => {
    if (listing?.id && listing?.partialDatesOk) {
      fetchUnavailableDates();
    }
  }, [listing?.id, listing?.partialDatesOk]);

  // Calendar functions
  const fetchUnavailableDates = async () => {
    if (!listing?.id) return;
    
    try {
      const docRef = doc(db, 'listings', listing.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const unavailable = data.unavailableDates || [];
        setUnavailableDates(unavailable);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    }
  };

  const saveUnavailableDates = async (dates) => {
    if (!listing?.id) return;
    
    try {
      const docRef = doc(db, 'listings', listing.id);
      await updateDoc(docRef, {
        unavailableDates: dates,
        updatedAt: serverTimestamp()
      });
      console.log('Unavailable dates saved successfully');
    } catch (error) {
      console.error('Error saving unavailable dates:', error);
      alert('Failed to save unavailable dates. Please try again.');
    }
  };

  const fetchHostData = async (hostId) => {
  if (!hostId) return;
  
  try {
    const hostDocRef = doc(db, 'users', hostId);
    const hostDocSnap = await getDoc(hostDocRef);
    
    if (hostDocSnap.exists()) {
      const data = hostDocSnap.data();
      setHostData(data);
    } else {
      console.log('No host data found');
      setHostData(null);
    }
  } catch (error) {
    console.error('Error fetching host data:', error);
    setHostData(null);
  }
};

  const formatDateString = (date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString) => {
    return new Date(dateString + 'T00:00:00');
  };

  const isDateUnavailable = (date) => {
    const dateString = formatDateString(date);
    return unavailableDates.includes(dateString);
  };

  const isDateInRange = (date) => {
    if (!listing?.availableFrom || !listing?.availableTo) return false;
    
    const availableFrom = listing.availableFrom.toDate ? listing.availableFrom.toDate() : new Date(listing.availableFrom);
    const availableTo = listing.availableTo.toDate ? listing.availableTo.toDate() : new Date(listing.availableTo);
    
    return date >= availableFrom && date <= availableTo;
  };
useEffect(() => {
  if (listing?.hostId) {
    fetchHostData(listing.hostId);
  }
}, [listing?.hostId]);
  const handleDateClick = (date) => {
  if (!isDateInRange(date)) return;
  
  const dateString = formatDateString(date);
  
  if (isSelectingRange) {
    if (!rangeStart) {
      setRangeStart(date);
    } else {
      // Complete the range selection
      const start = rangeStart <= date ? rangeStart : date;
      const end = rangeStart <= date ? date : rangeStart;
      
      const datesInRange = [];
      const currentDate = new Date(start);
      
      while (currentDate <= end) {
        datesInRange.push(formatDateString(new Date(currentDate)));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      // Toggle availability for the range
      const newUnavailableDates = [...unavailableDates];
      const allInRangeUnavailable = datesInRange.every(d => unavailableDates.includes(d));
      
      if (allInRangeUnavailable) {
        // Remove all dates in range
        datesInRange.forEach(d => {
          const index = newUnavailableDates.indexOf(d);
          if (index > -1) newUnavailableDates.splice(index, 1);
        });
      } else {
        // Add all dates in range
        datesInRange.forEach(d => {
          if (!newUnavailableDates.includes(d)) {
            newUnavailableDates.push(d);
          }
        });
      }
      
      setUnavailableDates(newUnavailableDates);
      saveUnavailableDates(newUnavailableDates);
      setRangeStart(null);
      setIsSelectingRange(false);
    }
  } else {
    // Single date toggle
    const newUnavailableDates = [...unavailableDates];
    const index = newUnavailableDates.indexOf(dateString);
    
    if (index > -1) {
      newUnavailableDates.splice(index, 1);
    } else {
      newUnavailableDates.push(dateString);
    }
    
    setUnavailableDates(newUnavailableDates);
    saveUnavailableDates(newUnavailableDates);
  }
  
  // DO NOT reset currentMonth here - this was likely causing the issue
};




  // Calendar component
// Calendar component
const AvailabilityCalendar = () => {
  if (!listing?.availableFrom || !listing?.availableTo || !currentMonth) return null;
  
  const availableFrom = listing.availableFrom.toDate ? listing.availableFrom.toDate() : new Date(listing.availableFrom);
  const availableTo = listing.availableTo.toDate ? listing.availableTo.toDate() : new Date(listing.availableTo);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };
  
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const days = getDaysInMonth(currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {isUserHost ? 'Manage Availability' : 'Available Dates'}
        </h3>
        {isUserHost && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSelectingRange(!isSelectingRange)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                isSelectingRange 
                  ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                  : 'bg-gray-100 text-gray-700 border border-gray-300'
              }`}
            >
              {isSelectingRange ? 'Cancel Range' : 'Select Range'}
            </button>
          </div>
        )}
      </div>

      
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
            disabled={currentMonth < new Date(availableFrom.getFullYear(), availableFrom.getMonth(), 1)}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h4 className="font-medium text-lg">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h4>
          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-gray-100 rounded-md"
            disabled={currentMonth > new Date(availableTo.getFullYear(), availableTo.getMonth(), 1)}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            if (!day) {
              return <div key={index} className="p-2"></div>;
            }
            
            const isInRange = isDateInRange(day);
            const isUnavailable = isDateUnavailable(day);
            const isRangeStart = rangeStart && formatDateString(day) === formatDateString(rangeStart);
            
            let dayClasses = "p-2 text-center text-sm rounded-md cursor-pointer transition-colors ";
            
            if (!isInRange) {
              dayClasses += "text-gray-300 cursor-not-allowed bg-gray-50";
            } else if (isUnavailable) {
              dayClasses += "bg-red-100 text-red-800 hover:bg-red-200";
            } else {
              dayClasses += "bg-green-100 text-green-800 hover:bg-green-200";
            }
            
            if (isRangeStart) {
              dayClasses += " ring-2 ring-orange-500";
            }
            
            if (!isUserHost) {
              dayClasses = dayClasses.replace("cursor-pointer", "cursor-default");
            }
            
            return (
              <div
                key={index}
                className={dayClasses}
                onClick={() => isUserHost && handleDateClick(day)}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
          <span className="text-gray-600">Unavailable</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
          <span className="text-gray-600">Outside range</span>
        </div>
      </div>
    </div>
  );
};

  useEffect(() => {
  if (listing?.availableFrom && !currentMonth) {
    const availableFrom = listing.availableFrom.toDate ? listing.availableFrom.toDate() : new Date(listing.availableFrom);
    setCurrentMonth(new Date(availableFrom.getFullYear(), availableFrom.getMonth(), 1));
  }
}, [listing?.availableFrom, currentMonth]);

  // THEN your conditional returns and early exits
  if (listingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Listing not found</p>
          <button 
            onClick={() => router.push('/sublease/search/')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Back to search page
          </button>
        </div>
      </div>
    );
  }

  // ✅ CHECK: Determine if current user is the host
  const isUserHost = user && listing && (
    user.uid === listing.hostId ||
    user.uid === listing.userId ||
    user.uid === listing.id ||
    user.email === listing.hostEmail
  );

  console.log('🔍 Host ownership check:', {
    userId: user?.uid,
    userEmail: user?.email,
    listingHostId: listing?.hostId,
    listingUserId: listing?.userId,
    listingId: listing?.id,
    listingHostEmail: listing?.hostEmail,
    isUserHost: isUserHost
  });

  const handleNeighborhoodDetected = (neighborhood: string) => {
    setDetectedNeighborhood(neighborhood);
  };

  const getListingCoordinates = () => {
    // Try different possible coordinate sources from your listing data
    
    // Direct coordinates object
    if (listing?.coordinates?.lat && listing?.coordinates?.lng) {
      return {
        lat: listing.coordinates.lat,
        lng: listing.coordinates.lng
      };
    }
    
    // Separate lat/lng fields
    if (listing?.lat && listing?.lng) {
      return {
        lat: listing.lat,
        lng: listing.lng
      };
    }
    
    // Latitude/longitude fields
    if (listing?.latitude && listing?.longitude) {
      return {
        lat: listing.latitude,
        lng: listing.longitude
      };
    }
    
    // Location object with coordinates
    if (listing?.location?.coordinates) {
      if (Array.isArray(listing.location.coordinates) && listing.location.coordinates.length >= 2) {
        // GeoJSON format [lng, lat]
        return {
          lat: listing.location.coordinates[1],
          lng: listing.location.coordinates[0]
        };
      }
      if (listing.location.coordinates.lat && listing.location.coordinates.lng) {
        return {
          lat: listing.location.coordinates.lat,
          lng: listing.location.coordinates.lng
        };
      }
    }
    
    // If no coordinates available, try to geocode the address using Google Maps
    // This will be handled by the NeighborhoodDetector component itself
    
    return null;
  };

  const geocodeListingAddress = async (): Promise<{lat: number, lng: number} | null> => {
    if (!listing?.location || !window.google?.maps) return null;
    
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode(
        { address: listing.location },
        (results, status) => {
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            resolve(null);
          }
        }
      );
    });
  };
  
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
              className="absolute right-0 mt-2 w-70 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
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
                  onClick={() => router.push(`browse/notification/`)}
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
  
  // Rest of your component logic and functions...
  const toggleFavorite = (listing) => {
    const isFavorited = favoriteListings.some(item => item.id === listing.id);
    
    if (isFavorited) {
      setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
    } else {
      // add new
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

  // all image array
  const allImages = [
    listing.image,
    ...(Array.isArray(listing.additionalImages) ? listing.additionalImages : [])
  ].filter(Boolean);

  // go to previous image
  const goToPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  // go to next image
  const goToNextImage = () => {
    setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // check if the image already in the current listings
  const isCurrentListingFavorited = favoriteListings.some(item => item.id === listing?.id);
  
  //connect option
  const navigateToTour = () => {
    router.push(`/sublease/search/${id}/tour`);
  };

  // ✅ FIXED: Updated navigateToMessage with self-messaging prevention
  const navigateToMessage = async () => {
    // Check if user is authenticated
    if (!user) {
      alert('Please sign in to send a message');
      router.push('/auth/');
      return;
    }

    // ✅ PREVENT SELF-MESSAGING: Check if user is the host
    if (isUserHost) {
      alert('You cannot message yourself about your own listing!');
      return;
    }
  
    // Debug: Log the listing object to see what fields are available
    console.log('🔍 Current listing object:', listing);
    console.log('🔍 Available listing fields:', Object.keys(listing));
    console.log('🔍 Host-related fields:', {
      hostId: listing.hostId,
      hostName: listing.hostName,
      hostEmail: listing.hostEmail,
      userId: listing.userId,
      createdBy: listing.createdBy,
      ownerId: listing.ownerId
    });
  
    // Try to find the host ID from different possible fields
    let hostId = listing.hostId || 
                 listing.userId || 
                 listing.createdBy?.uid ||
                 listing.createdBy;

    // ✅ FALLBACK: If no specific hostId, try to determine from context
    if (!hostId && listing.id) {
      // For mock data where hostId might not be set, use listing ID as fallback
      hostId = listing.id;
      console.log('⚠️ Using listing ID as hostId fallback:', hostId);
    }
  
    console.log('🔍 Resolved hostId:', hostId);
  
    // If still no hostId, we can't proceed
    if (!hostId) {
      console.error('❌ No host ID found in listing:', listing);
      alert('Cannot start conversation: Host information is missing from this listing.');
      return;
    }
  
    // ✅ ADDITIONAL SAFETY CHECK: Prevent self-messaging with resolved hostId
    if (user.uid === hostId) {
      alert('You cannot message yourself about your own listing!');
      return;
    }
  
    setIsCreatingConversation(true);
  
    try {
      console.log('🔍 Looking for existing conversation...');
      
      // Step 1: Check if conversation already exists
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('listingId', '==', listing.id),
        where('participants', 'array-contains', user.uid)
      );
      
      const existingConversations = await getDocs(conversationsQuery);
      
      if (!existingConversations.empty) {
        // Conversation exists - navigate to it
        const existingConversation = existingConversations.docs[0];
        console.log('✅ Found existing conversation:', existingConversation.id);
        router.push(`/sublease/search/${existingConversation.id}/message`);
        return;
      }
      
      console.log('📝 Creating new conversation...');
      
      // Step 2: Create new conversation with validated data
      const newConversationData = {
        listingId: listing.id || '',
        listingTitle: listing.title || 'Untitled Listing',
        listingImage: listing.image || '',
        listingPrice: listing.price || 0,
        listingLocation: listing.location || '',
        
        // Host information - use the resolved hostId
        hostId: hostId,
        hostName: listing.hostName || listing.createdBy?.displayName || 'Host',
        hostEmail: listing.hostEmail || listing.createdBy?.email || '',
        hostImage: listing.hostImage || '',
        
        // Guest information (current user)
        guestId: user.uid,
        guestName: user.displayName || user.email || 'Guest',
        guestEmail: user.email || '',
        
        // Participants array for easy querying
        participants: [user.uid, hostId],
        
        // Initial state
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        
        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Validate the data before sending
      console.log('📝 Conversation data to create:', newConversationData);
      
      // Double-check no undefined values in critical fields
      if (!newConversationData.hostId || !newConversationData.guestId || !newConversationData.listingId) {
        throw new Error(`Missing critical data: hostId=${newConversationData.hostId}, guestId=${newConversationData.guestId}, listingId=${newConversationData.listingId}`);
      }
      
      // ✅ FINAL SAFETY CHECK: Ensure host and guest are different
      if (newConversationData.hostId === newConversationData.guestId) {
        throw new Error('Cannot create conversation: Host and guest cannot be the same person');
      }
      
      // Create the conversation document
      const conversationRef = await addDoc(collection(db, 'conversations'), newConversationData);
      console.log('✅ Created new conversation:', conversationRef.id);
      
      // Navigate to the new conversation
      router.push(`/sublease/search/${conversationRef.id}/message`);
      
    } catch (error) {
      console.error('❌ Error creating conversation:', error);
      alert(`Failed to start conversation: ${error.message}`);
    } finally {
      setIsCreatingConversation(false);
    }
  };

  const getAmenityIcon = (amenity) => {
    const amenityLower = amenity.toLowerCase();
    
    if (amenityLower.includes('wifi') || amenityLower.includes('wi-fi')) {
      return <Wifi size={16} />;
    }
    if (amenityLower.includes('parking') || amenityLower.includes('garage')) {
      return <MapPin size={16} />;
    }
    if (amenityLower.includes('washer') || amenityLower.includes('dryer') || amenityLower.includes('laundry')) {
      return <Droplets size={16} />;
    }
    if (amenityLower.includes('pet') || amenityLower.includes('pet-friendly')) {
      return <Heart size={16} />;
    }
    if (amenityLower.includes('air conditioning') || amenityLower.includes('heating')) {
      return <Thermometer size={16} />;
    }
    if (amenityLower.includes('utilities')) {
      return <DollarSign size={16} />;
    }
    if (amenityLower.includes('dishwasher')) {
      return <Utensils size={16} />;
    }
    if (amenityLower.includes('gym') || amenityLower.includes('fitness')) {
      return <Dumbbell size={16} />;
    }
    if (amenityLower.includes('sauna')) {
      return <Droplets size={16} />;
    }
    if (amenityLower.includes('balcony') || amenityLower.includes('outdoor')) {
      return <Trees size={16} />;
    }
    if (amenityLower.includes('rooftop')) {
      return <Building size={16} />;
    }
    if (amenityLower.includes('grill') || amenityLower.includes('bbq')) {
      return <Flame size={16} />;
    }
    if (amenityLower.includes('elevator')) {
      return <ArrowUp size={16} />;
    }
    if (amenityLower.includes('security') || amenityLower.includes('secure')) {
      return <Shield size={16} />;
    }
    if (amenityLower.includes('package') || amenityLower.includes('locker')) {
      return <Package size={16} />;
    }
    if (amenityLower.includes('wheelchair') || amenityLower.includes('accessible')) {
      return <Accessibility size={16} />;
    }
    if (amenityLower.includes('study') || amenityLower.includes('coworking')) {
      return <BookOpen size={16} />;
    }
    if (amenityLower.includes('recreation') || amenityLower.includes('lounge')) {
      return <Sofa size={16} />;
    }
    if (amenityLower.includes('game room')) {
      return <Gamepad2 size={16} />;
    }
    if (amenityLower.includes('movie') || amenityLower.includes('media')) {
      return <Play size={16} />;
    }
    if (amenityLower.includes('trash') || amenityLower.includes('recycling')) {
      return <Trash2 size={16} />;
    }
    
    // default
    return <Star size={16} />;
  };

const updateReviewerStats = async (reviewerId: string, reviewData: {
  reviewId: string,
  revieweeId: string,
  revieweeName: string,
  listingId: string,
  listingTitle: string,
  rating: number,
  comment: string,
  createdAt: any
}) => {
  try {
    const reviewerRef = doc(db, 'users', reviewerId);
    const reviewerDoc = await getDoc(reviewerRef);
    
    if (reviewerDoc.exists()) {
      const userData = reviewerDoc.data();
      const currentReviewsGiven = userData.reviewsGiven || [];
      const currentReviewsGivenCount = userData.reviewsGivenCount || 0;
      
      // 새로운 리뷰 정보 추가
      const newReviewRecord = {
        reviewId: reviewData.reviewId,
        revieweeId: reviewData.revieweeId,
        revieweeName: reviewData.revieweeName,
        listingId: reviewData.listingId,
        listingTitle: reviewData.listingTitle,
        rating: reviewData.rating,
        comment: reviewData.comment,
        createdAt: reviewData.createdAt,
        timestamp: new Date()
      };
      
      // 리뷰 목록과 카운트 업데이트
      await updateDoc(reviewerRef, {
        reviewsGiven: [...currentReviewsGiven, newReviewRecord],
        reviewsGivenCount: currentReviewsGivenCount + 1,
        lastReviewGiven: reviewData.createdAt
      });
      
      console.log(`Updated reviewer ${reviewerId} stats: ${currentReviewsGivenCount + 1} reviews given`);
    } else {
      // 새 사용자인 경우 초기 리뷰 통계 생성
      await updateDoc(reviewerRef, {
        reviewsGiven: [{
          reviewId: reviewData.reviewId,
          revieweeId: reviewData.revieweeId,
          revieweeName: reviewData.revieweeName,
          listingId: reviewData.listingId,
          listingTitle: reviewData.listingTitle,
          rating: reviewData.rating,
          comment: reviewData.comment,
          createdAt: reviewData.createdAt,
          timestamp: new Date()
        }],
        reviewsGivenCount: 1,
        lastReviewGiven: reviewData.createdAt
      });
      
      console.log(`Created initial reviewer stats for ${reviewerId}`);
    }
  } catch (error) {
    console.error('Error updating reviewer stats:', error);
  }
};


const addReview = async () => {
  if (!newReviewComment.trim()) {
    alert('Please write a comment for your review.');
    return;
  }

  if (!user) {
    alert('Please sign in to write a review.');
    return;
  }

  // Prevent self-review
  if (user.uid === listing.hostId) {
    alert('You cannot review your own listing!');
    return;
  }

  try {
    // Check if user already reviewed this host
    const existingReviewQuery = query(
      collection(db, 'reviews'),
      where('reviewerId', '==', user.uid),
      where('revieweeId', '==', listing.hostId),
      where('listingId', '==', listing.id)
    );
    
    const existingReviews = await getDocs(existingReviewQuery);
    
    if (!existingReviews.empty) {
      alert('You have already reviewed this host for this listing!');
      return;
    }

    // Create the review document
    const reviewData = {
      reviewerId: user.uid,
      reviewerName: user.displayName || user.email || 'Anonymous',
      reviewerEmail: user.email,
      revieweeId: listing.hostId,
      revieweeName: listing.hostName,
      listingId: listing.id,
      listingTitle: listing.title,
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      interactionType: 'sublease',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Add review to reviews collection
    const reviewRef = await addDoc(collection(db, 'reviews'), reviewData);
    console.log('Review added successfully:', reviewRef.id);

    // Update the local state to show the new review immediately
    const newReview = {
      id: reviewRef.id,
      name: user.displayName || user.email || 'Anonymous',
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      }),
      comment: newReviewComment,
      rating: newReviewRating
    };
    
    const updatedReviews = [newReview, ...hostReviews];
    setHostReviews(updatedReviews);

    // Update the host's review statistics (you might want to do this server-side with Cloud Functions)
    await updateHostReviewStats(listing.hostId, newReviewRating);

    await updateReviewerStats(user.uid, {
      reviewId: reviewRef.id,
      revieweeId: listing.hostId,
      revieweeName: listing.hostName,
      listingId: listing.id,
      listingTitle: listing.title,
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      createdAt: new Date()
    });
    // Reset form
    setShowReviewModal(false);
    setNewReviewComment('');
    setNewReviewRating(5);

    alert('Review submitted successfully!');

  } catch (error) {
    console.error('Error adding review:', error);
    alert('Failed to submit review. Please try again.');
  }
};


const updateHostReviewStats = async (hostId: string, newRating: number) => {
  try {
    // Get current user document
    const userRef = doc(db, 'users', hostId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentStats = userData.reviewStats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      // Calculate new average
      const totalReviews = currentStats.totalReviews + 1;
      const newAverage = ((currentStats.averageRating * currentStats.totalReviews) + newRating) / totalReviews;

      // Update rating distribution
      const newDistribution = { ...currentStats.ratingDistribution };
      newDistribution[newRating] = (newDistribution[newRating] || 0) + 1;

      // Update user document
      await updateDoc(userRef, {
        reviewStats: {
          averageRating: Math.round(newAverage * 10) / 10, // Round to 1 decimal
          totalReviews: totalReviews,
          ratingDistribution: newDistribution
        },
        averageRating: Math.round(newAverage * 10) / 10,
        totalReviews: totalReviews
      });
    } else {
      // Create initial review stats for new user
      await updateDoc(userRef, {
        reviewStats: {
          averageRating: newRating,
          totalReviews: 1,
          ratingDistribution: {
            1: newRating === 1 ? 1 : 0,
            2: newRating === 2 ? 1 : 0,
            3: newRating === 3 ? 1 : 0,
            4: newRating === 4 ? 1 : 0,
            5: newRating === 5 ? 1 : 0
          }
        },
        averageRating: newRating,
        totalReviews: 1
      });
    }
  } catch (error) {
    console.error('Error updating host review stats:', error);
  }
};

const fetchHostReviews = async () => {
  if (!listing?.hostId) return;

  try {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('revieweeId', '==', listing.hostId),
      orderBy('createdAt', 'desc')
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        reviewerId: data.reviewerId,
        name: data.reviewerName,
        date: data.createdAt?.toDate().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long'
        }) || 'Recent',
        comment: data.comment,
        rating: data.rating,
        isEdited: data.isEdited || false 
      };
    });
    
    setHostReviews(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
};
  //calculate the average rating
  const hostReviewCount = hostReviews.length;
  const hostRating = hostReviews.length > 0 
    ? (hostReviews.reduce((sum, review) => sum + review.rating, 0) / hostReviews.length).toFixed(1)
    : "0.0";

    const fetchUserReviewStats = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        reviewsGivenCount: userData.reviewsGivenCount || 0,
        reviewsGiven: userData.reviewsGiven || [],
        lastReviewGiven: userData.lastReviewGiven || null
      };
    }
    
    return {
      reviewsGivenCount: 0,
      reviewsGiven: [],
      lastReviewGiven: null
    };
  } catch (error) {
    console.error('Error fetching user review stats:', error);
    return {
      reviewsGivenCount: 0,
      reviewsGiven: [],
      lastReviewGiven: null
    };
  }
};

// 🆕 hostData에 리뷰어 정보도 포함시키기 (Badge 컴포넌트에서 사용)
// const [hostData, setHostData] = useState({
//   totalReviews: 0,
//   averageRating: 0,
//   reviewsGivenCount: 0 // 리뷰어로서의 통계
// });

// const [currentUserReviewStats, setCurrentUserReviewStats] = useState({
//   reviewsGivenCount: 0,
//   reviewsGiven: [],
//   lastReviewGiven: null
// });

const loadHostDataWithReviewerStats = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setHostData({
        totalReviews: userData.totalReviews || 0,
        averageRating: userData.averageRating || 0,
        reviewsGivenCount: userData.reviewsGivenCount || 0
      });
    }
  } catch (error) {
    console.error('Error loading host data:', error);
  }
};

const deleteReview = async (reviewId, reviewData) => {
  if (!window.confirm('Are you sure you want to delete this review?')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'reviews', reviewId));
    
    await removeRatingFromHostStats(reviewData.revieweeId, reviewData.rating);
    
    await removeReviewFromReviewerStats(reviewData.reviewerId, reviewId);
    
    const updatedReviews = hostReviews.filter(review => review.id !== reviewId);
    setHostReviews(updatedReviews);
    
    alert('Review deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting review:', error);
    alert('Failed to delete review. Please try again.');
  }
};

const updateReview = async (reviewId, originalReviewData) => {
  if (!editReviewComment.trim()) {
    alert('Please write a comment for your review.');
    return;
  }

  try {
    const updatedAt = new Date();
    
    await updateDoc(doc(db, 'reviews', reviewId), {
      rating: editReviewRating,
      comment: editReviewComment.trim(),
      updatedAt: updatedAt,
      isEdited: true
    });
    
    if (originalReviewData.rating !== editReviewRating) {
      await updateHostRatingChange(
        originalReviewData.revieweeId, 
        originalReviewData.rating, 
        editReviewRating
      );
    }
    
    await updateReviewerReviewData(originalReviewData.reviewerId, reviewId, {
      rating: editReviewRating,
      comment: editReviewComment.trim(),
      updatedAt: updatedAt
    });
    
    const updatedReviews = hostReviews.map(review => 
      review.id === reviewId 
        ? {
            ...review,
            rating: editReviewRating,
            comment: editReviewComment.trim(),
            isEdited: true
          }
        : review
    );
    setHostReviews(updatedReviews);
    
    setEditingReviewId(null);
    setEditReviewComment('');
    setEditReviewRating(5);
    
    alert('Review updated successfully!');
    
  } catch (error) {
    console.error('Error updating review:', error);
    alert('Failed to update review. Please try again.');
  }
};

const removeRatingFromHostStats = async (hostId, removedRating) => {
  try {
    const userRef = doc(db, 'users', hostId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentStats = userData.reviewStats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      
      if (currentStats.totalReviews <= 1) {
        await updateDoc(userRef, {
          reviewStats: {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          },
          averageRating: 0,
          totalReviews: 0
        });
      } else {
        const newTotalReviews = currentStats.totalReviews - 1;
        const newAverage = ((currentStats.averageRating * currentStats.totalReviews) - removedRating) / newTotalReviews;
        
        const newDistribution = { ...currentStats.ratingDistribution };
        newDistribution[removedRating] = Math.max(0, (newDistribution[removedRating] || 1) - 1);
        
        await updateDoc(userRef, {
          reviewStats: {
            averageRating: Math.round(newAverage * 10) / 10,
            totalReviews: newTotalReviews,
            ratingDistribution: newDistribution
          },
          averageRating: Math.round(newAverage * 10) / 10,
          totalReviews: newTotalReviews
        });
      }
    }
  } catch (error) {
    console.error('Error removing rating from host stats:', error);
  }
};

const updateHostRatingChange = async (hostId, oldRating, newRating) => {
  try {
    const userRef = doc(db, 'users', hostId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const currentStats = userData.reviewStats || {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
      
      const newAverage = ((currentStats.averageRating * currentStats.totalReviews) - oldRating + newRating) / currentStats.totalReviews;
      
      const newDistribution = { ...currentStats.ratingDistribution };
      newDistribution[oldRating] = Math.max(0, (newDistribution[oldRating] || 1) - 1);
      newDistribution[newRating] = (newDistribution[newRating] || 0) + 1;
      
      await updateDoc(userRef, {
        reviewStats: {
          averageRating: Math.round(newAverage * 10) / 10,
          totalReviews: currentStats.totalReviews,
          ratingDistribution: newDistribution
        },
        averageRating: Math.round(newAverage * 10) / 10
      });
    }
  } catch (error) {
    console.error('Error updating host rating change:', error);
  }
};

const removeReviewFromReviewerStats = async (reviewerId, reviewId) => {
  try {
    const reviewerRef = doc(db, 'users', reviewerId);
    const reviewerDoc = await getDoc(reviewerRef);
    
    if (reviewerDoc.exists()) {
      const userData = reviewerDoc.data();
      const currentReviewsGiven = userData.reviewsGiven || [];
      const filteredReviews = currentReviewsGiven.filter(review => review.reviewId !== reviewId);
      
      await updateDoc(reviewerRef, {
        reviewsGiven: filteredReviews,
        reviewsGivenCount: filteredReviews.length,
        lastReviewGiven: filteredReviews.length > 0 
          ? filteredReviews[filteredReviews.length - 1].createdAt 
          : null
      });
    }
  } catch (error) {
    console.error('Error removing review from reviewer stats:', error);
  }
};

const updateReviewerReviewData = async (reviewerId, reviewId, updatedData) => {
  try {
    const reviewerRef = doc(db, 'users', reviewerId);
    const reviewerDoc = await getDoc(reviewerRef);
    
    if (reviewerDoc.exists()) {
      const userData = reviewerDoc.data();
      const currentReviewsGiven = userData.reviewsGiven || [];
      const updatedReviews = currentReviewsGiven.map(review => 
        review.reviewId === reviewId 
          ? { ...review, ...updatedData }
          : review
      );
      
      await updateDoc(reviewerRef, {
        reviewsGiven: updatedReviews
      });
    }
  } catch (error) {
    console.error('Error updating reviewer review data:', error);
  }
};

  const handleTabClick = (tab: string) => {
    // Handle tab clicks for profile dropdown
    setShowProfile(false);
    // Add navigation logic here based on tab
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       {/* Header */}
       <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3 hidden md:flex">
                <motion.div 
                    className="flex items-center space-x-7 relative"
                    whileHover={{ scale: 1.05 }}
                >
                {/* Main Subox Logo */}
                <motion.div className="relative mt-3">
                {/* House Icon */}
                <motion.svg 
                    className="w-12 h-12" 
                    viewBox="0 0 100 100" 
                    fill="none"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    {/* House Base */}
                    <motion.path
                    d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
                    fill="#E97451"
                    animate={{ 
                        fill: ["#E97451", "#F59E0B", "#E97451"],
                        scale: [1, 1.02, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    />
                    {/* House Roof */}
                    <motion.path
                    d="M15 50L50 20L85 50L50 15L15 50Z"
                    fill="#D97706"
                    animate={{ rotate: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    />
                    {/* Window */}
                    <motion.rect
                    x="40"
                    y="50"
                    width="20"
                    height="15"
                    fill="white"
                    animate={{ 
                        opacity: [1, 0.8, 1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    />
                    {/* Door */}
                    <motion.rect
                    x="45"
                    y="65"
                    width="10"
                    height="15"
                    fill="white"
                    animate={{ scaleY: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    />
                </motion.svg>

                {/* Tag Icon */}
                <motion.svg 
                    className="w-8 h-8 absolute -top-2 -right-2" 
                    viewBox="0 0 60 60" 
                    fill="none"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.path
                    d="M5 25L25 5H50V25L30 45L5 25Z"
                    fill="#E97451"
                    animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.circle
                    cx="38"
                    cy="17"
                    r="4"
                    fill="white"
                    animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.svg>
                </motion.div>

                {/* Subox Text */}
                <motion.div className="flex flex-col -mx-4">
                <motion.span 
                    className="text-3xl font-bold text-gray-900"
                    animate={{
                    background: [
                        "linear-gradient(45deg, #1F2937, #374151)",
                        "linear-gradient(45deg, #E97451, #F59E0B)",
                        "linear-gradient(45deg, #1F2937, #374151)"
                    ],
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent"
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    Subox
                </motion.span>
                <motion.span 
                    className="text-xs text-gray-500 font-medium tracking-wider"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Subleases
                </motion.span>
                </motion.div>
                </motion.div>
              </div>

              <div className="flex items-center space-x-3 flex md:hidden">
                <motion.div 
                    className="flex items-center space-x-7 relative"
                    whileHover={{ scale: 1.05 }}
                >
                {/* Main Subox Logo */}
                <motion.div className="relative mt-3">
                {/* House Icon */}
                <motion.svg 
                    className="w-10 h-10" 
                    viewBox="0 0 100 100" 
                    fill="none"
                    whileHover={{ rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.5 }}
                >
                    {/* House Base */}
                    <motion.path
                    d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
                    fill="#E97451"
                    animate={{ 
                        fill: ["#E97451", "#F59E0B", "#E97451"],
                        scale: [1, 1.02, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    />
                    {/* House Roof */}
                    <motion.path
                    d="M15 50L50 20L85 50L50 15L15 50Z"
                    fill="#D97706"
                    animate={{ rotate: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    />
                    {/* Window */}
                    <motion.rect
                    x="40"
                    y="50"
                    width="20"
                    height="15"
                    fill="white"
                    animate={{ 
                        opacity: [1, 0.8, 1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    />
                    {/* Door */}
                    <motion.rect
                    x="45"
                    y="65"
                    width="10"
                    height="15"
                    fill="white"
                    animate={{ scaleY: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    />
                </motion.svg>

                {/* Tag Icon */}
                <motion.svg 
                    className="w-6 h-6 absolute -top-1 -right-1" 
                    viewBox="0 0 60 60" 
                    fill="none"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.path
                    d="M5 25L25 5H50V25L30 45L5 25Z"
                    fill="#E97451"
                    animate={{ 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    />
                    <motion.circle
                    cx="38"
                    cy="17"
                    r="4"
                    fill="white"
                    animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    />
                </motion.svg>
                </motion.div>

                {/* Subox Text */}
                <motion.div className="flex flex-col -mx-4">
                <motion.span 
                    className="text-xl font-bold text-gray-900"
                    animate={{
                    background: [
                        "linear-gradient(45deg, #1F2937, #374151)",
                        "linear-gradient(45deg, #E97451, #F59E0B)",
                        "linear-gradient(45deg, #1F2937, #374151)"
                    ],
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent"
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                >
                    Subox
                </motion.span>
                <motion.span 
                    className="text-[10px] text-gray-500 font-medium tracking-wider"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Subleases
                </motion.span>
                </motion.div>
                </motion.div>
              </div>

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
 
               {/* Profile */}
               <div className="relative">
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => router.push("/profile")}
                   className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                 >
                   <User className="w-5 h-5 text-gray-600" />
                 </motion.button>
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

     {/* image gallery */}
     {showAllImages && (
       <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
         <div className="w-full max-w-4xl">
           {/* close button */}
           <div className="flex justify-end mb-2">
             <button 
               onClick={() => setShowAllImages(false)}
               className="p-1 bg-white rounded-full text-black hover:bg-gray-200"
             >
               <X size={24} />
             </button>
           </div>
           
           {/* showing image */}
           <div className="relative mb-4">
             <div className="h-96 flex items-center justify-center">
               <img 
                 src={allImages[activeImage]} 
                 alt={`Image ${activeImage + 1}`}
                 className="max-h-full max-w-full object-contain"
               />
             </div>
             
             {/* left arrow */}
             <button 
               onClick={goToPrevImage}
               className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
               aria-label="Previous image"
             >
               <ArrowLeft size={24} />
             </button>
             
             {/* right arrow */}
             <button 
               onClick={goToNextImage}
               className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
               aria-label="Next image"
             >
               <ArrowRight size={24} />
             </button>
           </div>
           
           {/* image index */}
           <div className="text-white text-center mb-4">
             {activeImage + 1} / {allImages.length}
           </div>
           
           {/* show main image */}
           <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
             {allImages.map((img, index) => (
               <div 
                 key={index}
                 className={`h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index ? 'border-orange-500' : 'border-transparent'}`}
                 onClick={() => setActiveImage(index)}
               >
                 <img 
                   src={img}
                   alt={`Thumbnail ${index + 1}`}
                   className="w-full h-full object-cover"
                 />
               </div>
             ))}
           </div>
           
           {/* keyboard usage info */}
           <div className="text-white text-center mt-4 text-sm opacity-70">
              ← → key can move the image. ESC for exit.
           </div>
         </div>
       </div>
     )}

     {/* detail page */}
     <div className="pt-0">
       
       <div className="max-w-4xl mx-auto p-6">
         {/* back button*/}
         <button 
           onClick={() => router.push('/sublease/search/')}
           className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium cursor-pointer"
         >
           <ChevronLeft className="w-5 h-5 mr-1" />
           Previous Page
         </button>

         {/* main contents box */}
         <div className="bg-white p-6 rounded-lg shadow-md mb-6">
           {/* image section */}
           <div className="flex flex-col md:flex-row md:gap-4 mb-6">
             {/* main picture */}
             <div className="md:w-2/3 h-72 md:h-96 rounded-lg overflow-hidden mb-4 md:mb-0">
               <img 
                 src={allImages[activeImage] || listing.image}
                 alt={listing.title}
                 className="w-full h-full object-cover"
               />
             </div>
             
             {/* additional pictures */}
             <div className="md:w-1/3">
               <div className="grid grid-cols-2 gap-2 h-full">
                 <div 
                   className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === 0 ? 'border-orange-500' : 'border-transparent'}`}
                   onClick={() => setActiveImage(0)}
                 >
                   <img 
                     src={listing.image}
                     alt="Main view"
                     className="w-full h-full object-cover"
                   />
                 </div>
                 
                 {listing.additionalImages && listing.additionalImages.slice(0, 2).map((img, index) => (
                   <div 
                     key={index}
                     className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index + 1 ? 'border-orange-500' : 'border-transparent'}`}
                     onClick={() => setActiveImage(index + 1)}
                   >
                     <img 
                       src={img}
                       alt={`Additional view ${index + 1}`}
                       className="w-full h-full object-cover"
                     />
                   </div>
                 ))}
                 
                 {/* + button - to see all images */}
                 <div 
                   className="h-24 md:h-auto rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                   onClick={() => setShowAllImages(true)}
                 >
                   <Plus className="text-gray-500" />
                 </div>
               </div>
             </div>
           </div>

            {/* title */}
            <div className="mb-6">
               <h1 className="text-2xl font-bold text-orange-900">{listing.title}</h1>
               {detectedNeighborhood && (
                 <p className="text-sm text-gray-600 mt-1 flex items-center">
                   <Home className="w-4 h-4 mr-1" />
                   Located in {detectedNeighborhood}
                 </p>
               )}
           </div>

             {/* Key Information */}
           <div className="bg-white rounded-lg border border-gray-200 mb-6">
             {/* Header */}
             <div className="p-6 border-b border-gray-100">
               <h2 className="text-lg font-semibold text-gray-900">Key Information</h2>
             </div>

             <div className="p-6">
               {/* Main Information */}
               <div className="space-y-4 mb-6">
                 <div className="flex items-center gap-3">
                   <MapPin size={18} className="text-orange-500" />
                   <span className="text-gray-700">{listing.location}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <DollarSign size={18} className="text-orange-500" />
                   <span className="text-gray-700">${listing.price}/month</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <BedDouble size={18} className="text-orange-500" />
                   <span className="text-gray-700">{listing.bedrooms} Bed {listing.bathrooms} Bath</span>
                 </div>
                 <div className="flex items-center gap-3">
                   {listing.includedItems[0] ? 
                     <X size={18} className="text-red-500" /> : 
                     <Check size={18} className="text-green-500" />
                   }
                   <span className="text-gray-700">{listing.includedItems[0] ? "Unfurnished" : "Furnished"}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <Calendar size={18} className="text-orange-500" />
                   <span className="text-gray-700">{listing.dateRange}</span>
                 </div>

                 {listing.preferredGender && (
                   <p className="flex items-center ml-0.5 gap-1">
                     {getGenderInfo(listing.preferredGender).icon}
                     <span className={`${listing.preferredGender === 'female' ? 'text-pink-600' : listing.preferredGender === 'male' ? 'text-orange-600' : 'text-green-600'} font-medium`}>
                       {getGenderInfo(listing.preferredGender).text}
                     </span>
                   </p>
                 )}

               </div>

               {/* Features */}
               <div className="pt-6 border-t border-gray-100">
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                     <Users size={16} className={listing.hasRoommates ? "text-green-500" : "text-gray-400"} />
                     <span className="text-sm text-gray-700">{listing.hasRoommates ? "Has roommates" : "No roommates"}</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     {listing.negotiable ? 
                       <Check size={16} className="text-green-500" /> : 
                       <X size={16} className="text-red-500" />
                     }
                     <span className="text-sm text-gray-700">{listing.negotiable ? "Negotiable" : "Non-Negotiable"}</span>
                   </div>

                   <div className="flex items-center gap-3">
                     <X size={16} className={listing.smokingAllowed ? "text-green-500" : "text-red-500"} />
                     <span className="text-sm text-gray-700">{listing.smokingAllowed ? "Smoking allowed" : "Non-Smoking"}</span>
                   </div>
                   
                   {listing.noiseLevel && (
                     <div className="flex items-center gap-3">
                       <Volume2 size={16} className="text-gray-400" />
                       <span className="text-sm text-gray-700">Preferred noise level: {listing.noiseLevel}</span>
                     </div>
                   )}
                   
                   <div className="flex items-center gap-3">
                     <CalendarCheck size={16} className={listing.partialDatesOk ? "text-green-500" : "text-gray-400"} />
                     <span className="text-sm text-gray-700">{listing.partialDatesOk ? "Flexible dates" : "Fixed dates only"}</span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <Zap size={16} className={listing.utilitiesIncluded ? "text-green-500" : "text-orange-500"} />
                     <span className="text-sm text-gray-700">
                       {listing.utilitiesIncluded ? 
                         "Utilities included" : 
                         `Utilities: ~${listing.approximateUtilities}`
                       }
                     </span>
                   </div>
                   
                   <div className="flex items-center gap-3">
                     <Heart size={16} className={listing.petsAllowed ? "text-green-500" : "text-gray-400"} />
                     <span className="text-sm text-gray-700">{listing.petsAllowed ? "Pets allowed" : "No pets allowed"}</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>

{/* Host Information */}
<div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
    <h2 className="text-xl font-bold text-orange-800 mb-2">Host Information</h2>
    <div className="flex items-start">
        <div className="w-16 h-16 rounded-full overflow-hidden mr-4 flex-shrink-0">
        <img 
            src={listing.hostImage || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop"} 
            alt="Host" 
            className="w-full h-full object-cover "
        />
        </div>
        <div className="flex-1">
        <div className="flex items-center ">
            <h3 className="font-medium text-lg text-gray-700">{listing.hostName || "Anonymous"}</h3>
            {/* UMN verified */}
            {/* {listing.isVerifiedUMN && (
            <div className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                UMN Verified
            </div>
            )} */}
        

       <Badges listing={listing} hostData={hostData} className = "mr-4" />
</div>
        
   {/* Host Rating Display from Firebase */}
<div className="flex items-center mt-2 mb-2">
    <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star 
            key={star} 
            className={`w-4 h-4 ${star <= Math.round(hostData?.averageRating || 0) ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} 
            />
        ))}
        <span className="ml-2 text-gray-700 font-medium text-sm">
            {(hostData?.averageRating || 0).toFixed(1)}/5
        </span>
        <span className="ml-2 text-gray-600 text-sm">
            ({hostData?.totalReviews || 0} {(hostData?.totalReviews || 0) === 1 ? 'review' : 'reviews'})
        </span>
    </div>
</div>
        {/* one sentence description */}
        <p className="text-gray-700 mt-2">{listing.hostBio || " "}</p>

                   {listing.contactMethods && listing.contactMethods.length > 0 && (
                     <div className="mt-3">
                       <h4 className="text-sm font-medium text-gray-600 mb-2">Contact Information:</h4>
                       <div className="space-y-1">
                         {listing.contactMethods.map((method, index) => (
                           <div key={index} className="flex items-center text-sm text-gray-700">
                             <span className="font-medium mr-2">{method.name}:</span>
                             <span className="text-orange-600">{method.value}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   </div>
               </div>
           </div>

           {/* ✅ FIXED: Updated connect section with self-messaging prevention */}
           <div className="space-y-4">
               {/* Connect Options - showConnectOptions가 true일 때만 보임 */}
               {showConnectOptions && (
                   <div className="grid grid-cols-2 gap-4 mb-4">
                   <button 
                       onClick={navigateToTour}
                       className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-4 rounded-lg flex flex-col items-center justify-center transition"
                   >
                       <Video className="w-8 h-8 mb-2" />
                       <span className="font-medium">Schedule Tour</span>
                       <span className="text-xs text-gray-600 mt-1">Virtual or in-person</span>
                   </button>
                   
                   {/* ✅ CONDITIONAL RENDERING: Only show message button for non-hosts */}
                   {!isUserHost ? (
                     <button 
                       onClick={navigateToMessage}
                       disabled={isCreatingConversation}
                       className={`flex-1 ${isCreatingConversation ? 'bg-orange-400' : 'bg-orange-500'} text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex flex-col items-center justify-center cursor-pointer disabled:cursor-not-allowed`}
                     >
                       {isCreatingConversation ? (
                         <>
                           <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mb-2"></div>
                           Creating...
                         </>
                       ) : (
                         <>
                           <MessageCircle className="w-8 h-8 mb-2" />
                           <span className="font-medium">Send Message</span>
                           <span className="text-xs text-orange-100 mt-1">Contact the host</span>
                         </>
                       )}
                     </button>
                   ) : (
                     <div className="flex-1 bg-gray-200 text-gray-600 px-6 py-3 rounded-lg border flex flex-col items-center justify-center">
                       <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
                       <span className="font-medium">Your Listing</span>
                       <span className="text-xs text-gray-500 mt-1">You cannot message yourself</span>
                     </div>
                   )}
                   </div>
               )}

               <div className="flex space-x-4">
                   <button 
                   onClick={(e) => {
                           e.stopPropagation();
                            toggleFavorite(listing)}}
                   className={`flex-1 ${isCurrentListingFavorited ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} px-6 py-3 rounded-lg ${isCurrentListingFavorited ? 'hover:bg-red-600' : 'hover:bg-red-200'} transition flex items-center justify-center cursor-pointer`}
                   >
                   <Heart className={`mr-2 ${isCurrentListingFavorited ? 'fill-current' : ''}`} />
                   {isCurrentListingFavorited ? 'Remove from Favorites' : 'Add Favorites'}
                   </button>
                   
                   <button 
                   onClick={() => setShowConnectOptions(!showConnectOptions)} 
                   className={`flex-1 ${showConnectOptions ? 'bg-orange-600' : 'bg-orange-500'} text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex items-center justify-center cursor-pointer`}
                   >
                   {showConnectOptions ? 'Hide Options' : 'Connect'}
                   </button>
               </div>
               </div>
               </div>

         {/* additional information */}
         <div className="space-y-4">
           {/* location */}
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="flex items-center gap-2 mb-3">
               <MapPin size={20} className="text-orange-600" />
               <h3 className="text-lg font-semibold text-gray-900">Location</h3>
             </div>
             <p className="text-gray-700">Located in {listing.location}.</p>
           </div>
           
           {/* available date */}
           <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center gap-2 mb-3">
               <Calendar size={20} className="text-orange-600" />
               <h3 className="text-lg font-semibold text-gray-900">Available</h3>
             </div>
             <p className="text-gray-700">{listing.dateRange}</p>
           </div>
           
           {/* price */}
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="flex items-center gap-2 mb-3">
               <DollarSign size={20} className="text-orange-600" />
               <h3 className="text-lg font-semibold text-gray-900">Price</h3>
             </div>
             <p className="text-gray-700">${listing.price} per month</p>
           </div>
           
           {/* detail description */}
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="flex items-center gap-2 mb-3">
               <Info size={20} className="text-orange-600" />
               <h3 className="text-lg font-semibold text-gray-900">Details</h3>
             </div>
             <p className="text-gray-700">{listing.description || 'No description available.'}</p>
           </div>
           
            {/* if unfurnished*/}
           {listing.includedItems[0] &&
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="flex items-center gap-2 mb-4">
               <Flame size={20} className="text-orange-600" />
               <h3 className="text-lg font-semibold text-gray-900">Available Items</h3>
             </div>
             <div className="grid grid-cols-2 gap-2">
               {listing.includedItems && listing.includedItems.map((items, index) => (
                 <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                   <div className="w-6 h-6 flex items-center justify-center text-green-400 mr-2">
                     {getAmenityIcon(items)}
                   </div>
                   <span className="text-gray-700 capitalize">{items}</span>
                 </div>
               ))}
             </div>
           </div>
           }
           
           {/* Amenities */}
           {listing.amenities[0] &&
           <div className="bg-white p-4 rounded-lg shadow">
             <div className="flex items-center gap-2 mb-4">
               <Star size={20} className="text-orange-600" />
               <h3 className="text-lg font-semibold text-gray-900">Amenities</h3>
             </div>
             <div className="grid grid-cols-2 gap-2">
               {listing.amenities && listing.amenities.map((amenity, index) => (
                 <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                   <div className="w-6 h-6 flex items-center justify-center text-green-400 mr-2">
                     {getAmenityIcon(amenity)}
                   </div>
                   <span className="text-gray-700 capitalize">{amenity}</span>
                 </div>
               ))}
             </div>
           </div>
             }

     {/* Host Ratings Section */}
     <div className="mb-8">
  <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Host Ratings</h2>
  
  <div className="flex items-center gap-4 bg-gray-50 rounded-lg">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star 
        key={star} 
        className={`w-5 h-5 ${star <= Math.round(hostRating) ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} 
      />
    ))}
    <span className="ml-2 text-gray-700 font-medium">
      {hostRating}/5
    </span>
    <span className="ml-2 text-gray-600 text-sm">
      ({hostReviewCount} reviews)
    </span>
  </div>
  
  {/* Reviews List with Edit/Delete functionality */}
  <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
    <div className="space-y-4">
      {/* when no review */}
      {hostReviews.length === 0 && (
        <p className="text-gray-500 italic">No reviews yet. Be the first to leave a review!</p>
      )}
      
      {/* review listings with edit/delete */}
      {hostReviews.map((review) => {
        const isMyReview = user && review.reviewerId === user.uid;
        const isEditing = editingReviewId === review.id;
        
        return (
          <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center">
                <div>
                  <div className="font-medium text-gray-600">{review.name}</div>
                  <div className="text-sm text-gray-500 flex items-center">
                    {review.date}
                    {review.isEdited && (
                      <span className="ml-2 text-xs text-gray-400">(edited)</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Star Rating */}
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`w-3 h-3 ${star <= review.rating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                
                {/* Edit/Delete buttons for own reviews */}
                {isMyReview && !isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingReviewId(review.id);
                        setEditReviewRating(review.rating);
                        setEditReviewComment(review.comment);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteReview(review.id, {
                        reviewerId: review.reviewerId,
                        revieweeId: listing.hostId,
                        rating: review.rating
                      })}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Review Content - 편집 모드 vs 일반 모드 */}
            {isEditing ? (
              <div className="mt-3 bg-white p-4 rounded-lg border">
                {/* Edit Rating */}
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setEditReviewRating(star)}
                        className="transition-colors"
                      >
                        <Star
                          size={20}
                          className={`${
                            editReviewRating >= star 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          } hover:text-yellow-400`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Edit Comment */}
                <textarea
                  value={editReviewComment}
                  onChange={(e) => setEditReviewComment(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none mb-3"
                  rows={3}
                />
                
                {/* Save/Cancel Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => updateReview(review.id, {
                      reviewerId: review.reviewerId,
                      revieweeId: listing.hostId,
                      rating: review.rating
                    })}
                    disabled={!editReviewComment.trim()}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 text-sm transition"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => {
                      setEditingReviewId(null);
                      setEditReviewComment('');
                      setEditReviewRating(5);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-700">{review.comment}</p>
            )}
          </div>
        );
      })}
    </div>
  </div>
</div>

{/* Write a Review Button - 기존 그대로 */}
{!isUserHost && user ? (
  <button 
    onClick={() => setShowReviewModal(!showReviewModal)}
    className="mt-6 mb-8 w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center cursor-pointer"
  >
    <Star className="w-4 h-4 mr-2" />
    Write a Review
  </button>
) : isUserHost ? (
  <div className="mt-6 mb-8 w-full py-2 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center">
    <Star className="w-4 h-4 mr-2" />
    You cannot review your own listing
  </div>
) : (
  <button 
    onClick={() => router.push('/auth')}
    className="mt-6 mb-8 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition flex items-center justify-center cursor-pointer"
  >
    <Star className="w-4 h-4 mr-2" />
    Sign in to Write a Review
  </button>
)}

{/* Review Form Dropdown - 기존 그대로 */}
{showReviewModal && (
  <div className="mb-8 bg-white border border-gray-200 rounded-lg p-6 shadow-lg animate-fadeIn">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-gray-900">Write a Review</h3>
      <button 
        onClick={() => setShowReviewModal(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>
    </div>
    
    {/* Star Rating */}
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setNewReviewRating(star)}
            className="transition-colors"
          >
            <Star 
              size={24} 
              className={`${newReviewRating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
            />
          </button>
        ))}
      </div>
    </div>
    
    {/* Review Text */}
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
      <textarea
        value={newReviewComment}
        onChange={(e) => setNewReviewComment(e.target.value)}
        placeholder="Share your experience with this property..."
        className="w-full p-3 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
        rows={4}
      />
    </div>
    
    {/* Submit Buttons */}
    <div className="flex gap-3">
      <button
        onClick={addReview}
        disabled={!newReviewComment.trim()}
        className="flex-1 py-2 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
      >
        Submit Review
      </button>
      
      <button
        onClick={() => {
          setShowReviewModal(false);
          setNewReviewComment('');
          setNewReviewRating(5);
        }}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
      >
        Cancel
      </button>
    </div>
  </div>
)}

    {/* Availability Calendar - Only show if partial dates are allowed */}
   {listing.partialDatesOk && (
  <div className="mb-6">
    <AvailabilityCalendar />
  </div>
)}

  <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
        onLoad={() => {
          console.log('Google Maps API loaded successfully');
        }}
        onError={(e) => {
          console.error('Google Maps API failed to load:', e);
        }}
      />
      
    {/* Location Section */}
    <div className="mt-4 mb-4">
      {/* Address */}
      <NeighborhoodDetectorWrapper 
        listing={listing} 
        onNeighborhoodDetected={handleNeighborhoodDetected} 
      />
    </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-orange-300 text-white py-12 w-full">
        <div className="hidden md:block max-w-7xl mx-auto px-4">
          {/* Upper Grid: 4 columns from original + 4 new columns in two rows */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Subox Brand */}
            <div>
              <ul className="space-y-2">
                <div className="flex items-center space-x-3 mt-3 px-5">
                  {/* Main Subox Logo */}
              <motion.div className="relative">
                {/* House Icon */}
                <motion.svg 
                  className="w-12 h-12" 
                  viewBox="0 0 100 100" 
                  fill="none"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {/* House Base */}
                  <motion.path
                    d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
                    fill="#E97451"
                    animate={{ 
                      fill: ["#E97451", "#F59E0B", "#E97451"],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  {/* House Roof */}
                  <motion.path
                    d="M15 50L50 20L85 50L50 15L15 50Z"
                    fill="#D97706"
                    animate={{ rotate: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  {/* Window */}
                  <motion.rect
                    x="40"
                    y="50"
                    width="20"
                    height="15"
                    fill="white"
                    animate={{ 
                      opacity: [1, 0.8, 1],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Door */}
                  <motion.rect
                    x="45"
                    y="65"
                    width="10"
                    height="15"
                    fill="white"
                    animate={{ scaleY: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </motion.svg>
 
                {/* Tag Icon */}
                <motion.svg 
                  className="w-8 h-8 absolute -top-2 -right-2" 
                  viewBox="0 0 60 60" 
                  fill="none"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.path
                    d="M5 25L25 5H50V25L30 45L5 25Z"
                    fill="#E97451"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.circle
                    cx="38"
                    cy="17"
                    r="4"
                    fill="white"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.svg>
              </motion.div>
    
                  {/* Subox Text */}
                  <motion.div className="flex flex-col text-3xl font-bold text-white">
                      Subox
                  </motion.div>
                </div>
                <p className="text-white text-sm mt-4 px-3">
                  Find the perfect short-term housing solution near your campus and needed items.
                </p>
              </ul>
            </div>

            {/* Sublease */}
            <div className="px-4">
              <h4 className="font-bold mb-4">Sublease</h4>
              <ul className="space-y-2">
                <li><a href="/sale/browse" className="hover:underline">Home</a></li>
                <li><a href="/search" className="hover:underline">Search</a></li>
                <li><a href="#" className="hover:underline">List Your Space</a></li>
                <li><a href="/help" className="hover:underline">Campus Map</a></li>
              </ul>
            </div>

            {/* Move out sale */}
            <div>
              <h4 className="font-bold mb-4">Move Out Sale</h4>
              <ul className="space-y-2">
                <li><a href="/sale/browse" className="hover:underline">Browse Items</a></li>
                <li><a href="#" className="hover:underline">Post Your Items</a></li>
                <li><a href="#" className="hover:underline">See Favorites</a></li>
                <li><a href="#" className="hover:underline">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Support</h3>
              <p className="text-lg">Need help?</p>
              <a
                href="/help"
                id='help'
                className="inline-block mt-3 px-6 py-3 bg-white text-orange-600 font-semibold rounded-full shadow hover:bg-orange-600 hover:text-white transition"
              >
                Visit Help Center
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/30 my-10"></div>

          {/* Bottom Grid: 4 more sections */}
          <div className="grid grid-cols-1 ml-75 md:grid-cols-4 gap-8 text-center md:text-left">

            {/* Get Started */}
            <div>
              <h3 className="font-bold mb-4">Get Started</h3>
              <ul className="space-y-2">
                <li><a href="auth" className="hover:underline">Log in</a></li>
                <li><a href="auth?mode=signup" className="hover:underline">Sign up</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:underline">Features</a></li>
                <li><a href="#use-cases" className="hover:underline">Use Cases</a></li>
                <li><a href="#how-it-works" className="hover:underline">How it Works</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-10 border-t border-white/30 text-center text-sm text-orange-100">
            © {new Date().getFullYear()} Subox. All rights reserved.
          </div>
        </div>
        <div className="md:hidden max-w-7xl mx-auto px-4">
          {/* Upper Grid: stacked on mobile, grid on desktop */}
          <div className="flex flex-col gap-10 md:grid md:grid-cols-4 md:gap-8 mb-10">

            {/* Subox Brand */}
            <div>
              <div className="flex items-center space-x-3 mt-3 px-2 md:px-5">
                {/* Logo */}
              <motion.div className="relative">
                {/* House Icon */}
                <motion.svg 
                  className="w-12 h-12" 
                  viewBox="0 0 100 100" 
                  fill="none"
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {/* House Base */}
                  <motion.path
                    d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
                    fill="#E97451"
                    animate={{ 
                      fill: ["#E97451", "#F59E0B", "#E97451"],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  {/* House Roof */}
                  <motion.path
                    d="M15 50L50 20L85 50L50 15L15 50Z"
                    fill="#D97706"
                    animate={{ rotate: [0, 1, 0] }}
                    transition={{ duration: 4, repeat: Infinity }}
                  />
                  {/* Window */}
                  <motion.rect
                    x="40"
                    y="50"
                    width="20"
                    height="15"
                    fill="white"
                    animate={{ 
                      opacity: [1, 0.8, 1],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Door */}
                  <motion.rect
                    x="45"
                    y="65"
                    width="10"
                    height="15"
                    fill="white"
                    animate={{ scaleY: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  />
                </motion.svg>
 
                {/* Tag Icon */}
                <motion.svg 
                  className="w-8 h-8 absolute -top-2 -right-2" 
                  viewBox="0 0 60 60" 
                  fill="none"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <motion.path
                    d="M5 25L25 5H50V25L30 45L5 25Z"
                    fill="#E97451"
                    animate={{ 
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.circle
                    cx="38"
                    cy="17"
                    r="4"
                    fill="white"
                    animate={{ 
                      scale: [1, 1.3, 1],
                      opacity: [1, 0.7, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.svg>
              </motion.div>

                <div className="text-3xl font-bold">Subox</div>
              </div>
              <p className="text-white text-sm mt-4 px-2 md:px-3">
                Find the perfect short-term housing solution near your campus and needed items.
              </p>
            </div>

            {/* Sublease and Move out Sale*/}
            <div className='flex justify-center gap-4'>
              <div>              
                <h4 className="font-bold text-lg md:text-xl mb-3 border-b border-white/30 pb-2">Sublease</h4>
                <ul className="space-y-2 text-sm md:text-base">
                  <li><a href="/sale/browse" className="hover:underline">Home</a></li>
                  <li><a href="/search" className="hover:underline">Search</a></li>
                  <li><a href="#" className="hover:underline">List Your Space</a></li>
                  <li><a href="/help" className="hover:underline">Campus Map</a></li>
                </ul>
              </div>
              <div>              
                <h4 className="font-bold text-lg md:text-xl mb-3 border-b border-white/30 pb-2">Move Out Sale</h4>
                <ul className="space-y-2 text-sm md:text-base">
                  <li><a href="/sale/browse" className="hover:underline">Browse Items</a></li>
                  <li><a href="#" className="hover:underline">Post Your Items</a></li>
                  <li><a href="#" className="hover:underline">See Favorites</a></li>
                  <li><a href="#" className="hover:underline">Blog</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 border-b border-white/30 pb-2">Get Started</h3>
                <ul className="space-y-2 text-sm md:text-lg">
                  <li><a href="auth" className="hover:underline">Log in</a></li>
                  <li><a href="auth?mode=signup" className="hover:underline">Sign up</a></li>
                </ul>
              </div>
            </div>


            {/* Support */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-3 border-b border-white/30 pb-2">Support</h3>
              <p className="text-sm md:text-lg">Need help?</p>
              <a
                href="/help"
                id="help"
                className="inline-block mt-3 px-5 py-2 bg-white text-orange-600 font-semibold rounded-full shadow hover:bg-orange-600 hover:text-white transition"
              >
                Visit Help Center
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-6 border-t border-white/30 text-center text-xs md:text-sm text-orange-100">
            © {new Date().getFullYear()} Subox. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  </div>
);
};

export default ListingDetailPage;