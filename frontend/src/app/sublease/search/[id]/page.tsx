"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, Plus,
  ArrowLeft, ArrowRight,Video, MessageCircle
} from 'lucide-react';
import { doc, getDoc, addDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import { featuredListings } from '../../../../data/listings';
import NeighborhoodDetector from '@/components/NeighborhoodDetector'; // Adjust path as needed


  // gender information icon
  const getGenderInfo = (preferredGender) => {
    switch(preferredGender) {
      case 'male':
        return { icon: <User className="w-4 h-4 mr-2 text-orange-500" />, text: "Male Only" };
      case 'female':
        return { icon: <User className="w-4 h-4 mr-2 text-pink-500" />, text: "Female Only" };
      case 'any':
      default:
        return { icon: <Users className="w-4 h-4 mr-2 text-green-500" />, text: "Any" };
    }
  };

// Updated NeighborhoodDetectorWrapper using the new custom map
// Updated NeighborhoodDetectorWrapper using the new custom map
const NeighborhoodDetectorWrapper = ({ listing, onNeighborhoodDetected }: { 
  listing: any, 
  onNeighborhoodDetected: (neighborhood: string) => void 
}) => {
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [locationType, setLocationType] = useState<'specific' | 'neighborhood' | 'none'>('none');
  const [locationName, setLocationName] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const processListingLocation = async () => {
      if (!listing) return;
      
      console.log('🔍 Processing listing:', {
        location: listing.location,
        customLocation: listing.customLocation,
        address: listing.address
      });
      
      // ✅ CASE 1: Has specific coordinates in customLocation
      if (listing?.customLocation?.lat && listing?.customLocation?.lng) {
        console.log('✅ Found specific coordinates in customLocation');
        setCoordinates({
          lat: listing.customLocation.lat,
          lng: listing.customLocation.lng
        });
        setLocationType('specific');
        
        // Use the placeName, address, or default to "Specific Location"
        const locationDisplayName = listing.customLocation.placeName || 
                                   listing.customLocation.address || 
                                   'Specific Location';
        setLocationName(locationDisplayName);
        setDebugInfo(`Specific coordinates: ${listing.customLocation.lat.toFixed(4)}, ${listing.customLocation.lng.toFixed(4)}`);
        
        // Notify parent component
        if (listing.customLocation.placeName) {
          onNeighborhoodDetected(listing.customLocation.placeName);
        }
        return;
      }
      
      // ✅ CASE 2: Has neighborhood name (but not "Other")
      if (listing?.location && listing.location !== 'Other') {
        console.log('✅ Found neighborhood name, will geocode:', listing.location);
        setLocationName(listing.location);
        setIsGeocoding(true);
        
        try {
          // Wait for Google Maps to be loaded
          let attempts = 0;
          const maxAttempts = 20;
          
          const waitForGoogleMaps = () => {
            return new Promise<void>((resolve, reject) => {
              const checkGoogle = () => {
                attempts++;
                if (window.google?.maps) {
                  console.log('✅ Google Maps loaded');
                  resolve();
                } else if (attempts < maxAttempts) {
                  console.log(`⏳ Waiting for Google Maps... (${attempts}/${maxAttempts})`);
                  setTimeout(checkGoogle, 500);
                } else {
                  reject(new Error('Google Maps API not loaded after waiting'));
                }
              };
              checkGoogle();
            });
          };
          
          await waitForGoogleMaps();
          
          // Geocode the neighborhood name
          const geocodedLocation = await geocodeLocation(listing.location);
          
          if (geocodedLocation) {
            setCoordinates({
              lat: geocodedLocation.lat,
              lng: geocodedLocation.lng
            });
            setLocationType('neighborhood'); // Always neighborhood for location field
            onNeighborhoodDetected(listing.location);
            console.log('✅ Successfully geocoded neighborhood');
          } else {
            setDebugInfo('Could not geocode neighborhood');
            setLocationType('none');
          }
        } catch (error) {
          console.error('Error geocoding neighborhood:', error);
          setDebugInfo(`Error: ${error.message}`);
          setLocationType('none');
        } finally {
          setIsGeocoding(false);
        }
        return;
      }
      
      // ✅ CASE 3: Location is "Other" but no customLocation
      if (listing?.location === 'Other' && !listing?.customLocation) {
        console.log('⚠️ Location is "Other" but no specific coordinates provided');
        setLocationName('Location not specified');
        setLocationType('none');
        setDebugInfo('Location marked as "Other" with no specific coordinates');
        return;
      }
      
      // ✅ CASE 4: No location data at all
      console.log('❌ No location data found');
      setLocationName('No location');
      setLocationType('none');
      setDebugInfo('No location data available');
    };

    processListingLocation();
  }, [listing]);

  // Geocoding function
  const geocodeLocation = async (locationQuery: string): Promise<{lat: number, lng: number} | null> => {
    if (!window.google?.maps) {
      setDebugInfo('Google Maps not loaded');
      return null;
    }
    
    // Add Minneapolis context for better geocoding
    const searchQuery = locationQuery.includes('Minneapolis') || locationQuery.includes('MN') 
      ? locationQuery 
      : `${locationQuery}, Minneapolis, MN`;
    
    console.log('🔍 Geocoding location:', searchQuery);
    
    return new Promise((resolve) => {
      const geocoder = new window.google.maps.Geocoder();
      
      geocoder.geocode(
        { address: searchQuery },
        (results, status) => {
          console.log('🔍 Geocoding result:', { results, status });
          
          if (status === 'OK' && results?.[0]?.geometry?.location) {
            const location = results[0].geometry.location;
            const coords = {
              lat: location.lat(),
              lng: location.lng()
            };
            
            console.log('✅ Geocoded successfully:', coords);
            setDebugInfo(`Geocoded: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
            resolve(coords);
          } else {
            console.log('❌ Geocoding failed:', status);
            setDebugInfo(`Geocoding failed: ${status}`);
            resolve(null);
          }
        }
      );
    });
  };

  // Loading state
  if (isGeocoding) {
    return (
      <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
        <span className="text-blue-700 font-medium">Finding {locationName} on map...</span>
      </div>
    );
  }

  // No location available
  if (locationType === 'none' || !coordinates) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2">
          <MapPin size={20} className="text-gray-400" />
          <div>
            <span className="text-gray-700 font-medium">Location not available</span>
            <p className="text-gray-500 text-sm mt-1">No location information provided for this listing</p>
          </div>
        </div>
        {debugInfo && (
          <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
            Debug: {debugInfo}
          </div>
        )}
      </div>
    );
  }

  // Show map for both specific locations and neighborhood areas
  return (
    <div className="space-y-4">
      {/* Map Component */}
      <NeighborhoodDetector
        latitude={coordinates.lat}
        longitude={coordinates.lng}
        onNeighborhoodDetected={onNeighborhoodDetected}
        showMap={true}
        locationType={locationType}
        locationName={locationName}
      />
      
      {/* Location Summary */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          {locationType === 'specific' ? (
            <>
              <MapPin size={16} className="text-red-500" />
              <span className="text-sm font-medium text-gray-700">Exact Address Provided</span>
            </>
          ) : (
            <>
              <Home size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Neighborhood Area</span>
            </>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};



const ListingDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
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
  const { user } = useAuth();
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
  // ALL useEffect hooks next
  useEffect(() => {
    setIsMounted(true);
  }, []);
    
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

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favoriteListings, isMounted]);

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
  
  // Pricing
  price: Number(firestoreData.price || firestoreData.rent || 0),
  rent: Number(firestoreData.rent || firestoreData.price || 0),
  
  // Property details
  bedrooms: Number(firestoreData.bedrooms || 1),
  bathrooms: Number(firestoreData.bathrooms || 1),
  distance: Number(firestoreData.distance || 0.5),
  
  // Ratings
  rating: Number(firestoreData.rating || 4.2),
  reviews: Number(firestoreData.reviews || 8),
  
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
  preferredGender: firestoreData.roommatePreferences?.gender || firestoreData.preferredGender || 'any',
  isVerifiedUMN: Boolean(firestoreData.isVerifiedUMN || false),
  hostReviews: firestoreData.hostReviews || [],
  
  // Booleans
  isPrivateRoom: Boolean(firestoreData.isPrivateRoom),
  utilitiesIncluded: Boolean(firestoreData.utilitiesIncluded),
  hasRoommates: Boolean(firestoreData.hasRoommates),
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

  useEffect(() => {
    if (listing?.hostReviews) {
      setHostReviews(listing.hostReviews);
    }
  }, [listing]);

  // use keyboard to move image
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
    
    setIsSidebarOpen(true);
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
  const isCurrentListingFavorited = favoriteListings.some(item => item.id === listing.id);
  
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


  
  // amenity icon
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

 
  

  const addReview = () => {
    if (!newReviewComment.trim()) {
      alert('Please write a comment for your review.');
      return;
    }
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });

    const newReview = {
      id: Date.now(), // not the actual ID (need to change)
      name: "You", // not the actual name (need to change)
      date: formattedDate,
      comment: newReviewComment,
      rating: newReviewRating
    };
    
    const updatedReviews = [newReview, ...hostReviews];
    setHostReviews(updatedReviews);

    setShowReviewModal(false);
    setNewReviewComment('');
    setNewReviewRating(5);
  };

  //calculate the average rating
  const hostReviewCount = hostReviews.length;
  const hostRating = hostReviews.length > 0 
    ? (hostReviews.reduce((sum, review) => sum + review.rating, 0) / hostReviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="fixed md:left-0 md:top-0 md:bottom-0 md:h-full md:w-16 w-full top-0 left-0 h-16 bg-orange-200 text-white shadow-lg z-50 md:flex md:flex-col">
        {/* navigation for mobile */}
        <div className="w-full h-full flex items-center justify-between px-4 md:hidden">
          <span className="font-bold text-lg">CampusSubleases</span>
          <div className="flex items-center space-x-4">
            <button
              title="Add New"
              className="group cursor-pointer outline-none hover:rotate-90 duration-300 p-2 rounded-lg hover:bg-orange-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" className="stroke-slate-100 fill-none group-hover:fill-orange-500 group-active:stroke-slate-200 group-active:fill-orange-900 group-active:duration-0 duration-300">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5"></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-lg transition cursor-pointer hover:bg-orange-300"
            >
              <Heart size={20} />
            </button>
            <button className="p-2 rounded-lg transition cursor-pointer hover:bg-orange-300">
              <User size={20} />
            </button>
          </div>
        </div>
        
        {/* navigation for desktop */}
        <div className="hidden md:flex md:flex-col md:h-full">
          <div className="flex flex-col items-center">
            <div className="font-bold text-xl mt-6 mb-4">CS</div>
            <button title="Add New" className="group cursor-pointer outline-none hover:rotate-90 duration-300 p-3 rounded-lg hover:bg-orange-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" className="stroke-slate-100 fill-none group-hover:fill-orange-500 group-active:stroke-slate-200 group-active:fill-orange-900 group-active:duration-0 duration-300">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5"></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
          </div>
          <div className="mt-auto flex flex-col items-center space-y-4 mb-8">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-3 rounded-lg hover:bg-orange-300 transition cursor-pointer"
            >
              <Heart size={20} />
            </button>
            <button className="p-3 rounded-lg hover:bg-orange-300 transition cursor-pointer">
              <User size={20} />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Favorites Sidebar */}
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
          {isMounted && (
            <>
              {favoriteListings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Heart size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No favorite listings yet</p>
                  <p className="text-sm mt-2">Click the heart icon on listings to save them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteListings.map(listing => (
                    <div 
                      key={listing.id} 
                      className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        router.push(`/sublease/search/${listing.id}`);
                      }}
                    >
                      <div className="flex">
                        <div 
                          className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                          style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                        ></div>
                        <div className="p-3 flex-1">
                          <div className="font-medium text-gray-700">{listing.title}</div>
                          <div className="text-sm text-gray-500">{listing.location}</div>
                          <div className="text-sm font-bold text-[#15361F] mt-1">
                            ${listing.price}/mo
                          </div>
                        </div>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 self-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
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
      <div className="md:pl-16 pt-16 md:pt-0">
        
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
            
            {/* key information */}
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
              <h2 className="text-xl font-bold text-orange-800 mb-2">Key Information</h2>
              <div className="space-y-2">
                <p className="flex items-center text-gray-700"><MapPin className="w-4 h-4 mr-2 text-orange-500" /> {listing.location}</p>
                <p className="flex items-center text-gray-700"><DollarSign className="w-4 h-4 mr-2 text-orange-500" /> ${listing.price}/month</p>
                <p className="flex items-center text-gray-700"><BedDouble className="w-4 h-4 mr-2 text-orange-500" /> {listing.bedrooms}Bed {listing.bathrooms}Bath</p>
                <p className="flex items-center text-gray-700"><Calendar className="w-4 h-4 mr-2 text-orange-500" /> {listing.dateRange}</p>
                <p className="flex items-center text-gray-700"><Star className="w-4 h-4 mr-2 text-orange-500" /> {listing.rating} ({listing.reviews} Reviews)</p>
                
                {/* gender information */}
                {listing.preferredGender && (
                  <p className="flex items-center">
                    {getGenderInfo(listing.preferredGender).icon}
                    <span className={`${listing.preferredGender === 'female' ? 'text-pink-600' : listing.preferredGender === 'male' ? 'text-orange-600' : 'text-green-600'} font-medium`}>
                      {getGenderInfo(listing.preferredGender).text}
                    </span>
                  </p>
                )}
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
                    <div>
                    <div className="flex items-center">
                        <h3 className="font-medium text-lg text-gray-700">{listing.hostName || "Anonymous"}</h3>
                        {/* UMN verified */}
                        {listing.isVerifiedUMN && (
                        <div className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            UMN Verified
                        </div>
                        )}
                    </div>
                    {/* one sentence description */}
                    <p className="text-gray-700 mt-2">{listing.hostBio || " "}</p>
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
                    onClick={() => toggleFavorite(listing)}
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
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Location</h2>
              <p className="text-gray-700">Located in {listing.location}, this accommodation is {listing.distance} miles from campus.</p>
            </div>
            
            {/* available date */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Available</h2>
              <p className="text-gray-700">{listing.dateRange}</p>
            </div>
            
            {/* price */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Price</h2>
              <p className="text-gray-700">${listing.price} per month</p>
            </div>
            
            {/* detail description */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Details</h2>
              <p className="text-gray-700">{listing.description || 'No description available.'}</p>
            </div>
            
            {/* Amenities */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Amenities</h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities && listing.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <div className="w-6 h-6 flex items-center justify-center text-orange-500 mr-2">
                      {getAmenityIcon(amenity)}
                    </div>
                    <span className="text-gray-700 capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Host Ratings */}
            <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-orange-800">Host Ratings</h2>
            
            {/* average ratings*/}
            <div className="flex items-center mb-4">
                <div className="flex items-center">
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
            </div>

            <NeighborhoodDetectorWrapper 
  listing={listing} 
  onNeighborhoodDetected={handleNeighborhoodDetected} 
/>
            
            {/* review listings*/}
            <div className="mt-4 space-y-4">
                {/* when no review*/}
                {hostReviews.length === 0 && (
                <p className="text-gray-500 italic">No reviews yet. Be the first to leave a review!</p>
                )}
                
                {/* review listings */}
                {hostReviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="font-medium">{review.name}</div>
                        <div className="text-sm text-gray-500">{review.date}</div>
                    </div>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= review.rating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} 
                        />
                        ))}
                    </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                </div>
                ))}
            </div>
            
            {/* write a review button */}
            <button 
                onClick={() => setShowReviewModal(true)}
                className="mt-6 w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center cursor-pointer"
            >
                <Star className="w-4 h-4 mr-2" />
                Write a Review
            </button>
            </div>

            {/* write review modal*/}
            {showReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-orange-800">Write a Review</h3>
                    <button 
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer"
                    >
                    <X size={20} />
                    </button>
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                    Your Rating
                    </label>
                    <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 focus:outline-none"
                        >
                        <Star 
                            className={`w-8 h-8 ${star <= newReviewRating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'} cursor-pointer`} 
                        />
                        </button>
                    ))}
                    </div>
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                    Your Review
                    </label>
                    <textarea
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[150px] text-gray-700"
                    placeholder="Share your experience with this host..."
                    required
                    ></textarea>
                </div>
                
                <div className="flex space-x-3">
                    <button 
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-500 cursor-pointer"
                    >
                    Cancel
                    </button>
                    <button 
                    onClick={addReview}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer"
                    >
                    Submit Review
                    </button>
                </div>
                </div>
            </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <footer className="bg-orange-200 text-white py-12 w-full mt-16 md:pl-4">
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
      </div>
    </div>
  );
};

export default ListingDetailPage;