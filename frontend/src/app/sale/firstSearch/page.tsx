"use client"

import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Truck, ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from '../../../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SearchLocationPicker from '../../../components/SearchLocationPicker';

const MoveOutSaleSearchPage = ({ userData = null }) => {
  const [location, setLocation] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deliveryOption, setDeliveryOption] = useState({
    delivery: false,
    pickup: false
  });

  // Firebase user state
  const [currentUser, setCurrentUser] = useState(null);
  const [firebaseUserData, setFirebaseUserData] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Dynamic neighborhoods generated from Google Maps
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [isLoadingNeighborhoods, setIsLoadingNeighborhoods] = useState(false);
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);

  // Track if we've already loaded user location
  const [hasLoadedUserLocation, setHasLoadedUserLocation] = useState(false);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Set up real-time listener for user document
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const userData = doc.data();
            setFirebaseUserData(userData);
            console.log('Firebase user data loaded:', userData);
          } else {
            console.log('No user document found');
            setFirebaseUserData(null);
          }
          setIsLoadingUser(false);
        }, (error) => {
          console.error('Error fetching user data:', error);
          setIsLoadingUser(false);
        });

        return () => unsubscribeDoc();
      } else {
        setFirebaseUserData(null);
        setIsLoadingUser(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    loadGoogleMaps();
  }, []);

  // Load user's saved location and generate neighborhoods
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
        
        setLocation(displayName);
        setHasLoadedUserLocation(true);
        
        // Generate neighborhoods around user's saved location
        generateNearbyNeighborhoods(userLocationData);
      } else {
        console.log('No saved user location found, using default setup');
        setNeighborhoods(["Select a location", "All Areas"]);
        setHasLoadedUserLocation(true);
      }
    }
  }, [firebaseUserData, userData, isGoogleMapsReady, isLoadingUser, hasLoadedUserLocation]);

  const loadGoogleMaps = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return;
    }

    if (window.google && window.google.maps && window.google.maps.places) {
      setIsGoogleMapsReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsGoogleMapsReady(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=beta`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => setIsGoogleMapsReady(true);
    script.onerror = () => console.error('Failed to load Google Maps');
    
    document.head.appendChild(script);
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
      
      // Reduced radius for more accurate local neighborhoods
      const searchRadius = userLocation.areaType === 'city' ? 8000 : 5000; // 8km for cities, 5km for specific locations
      
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
      
      // Add "All Areas" option at the end
      cleanedNeighborhoods.push("All Areas");
      
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
        "All Areas"
      ].filter(Boolean);
      
      console.log('Using fallback neighborhoods:', fallbackNeighborhoods);
      setNeighborhoods(fallbackNeighborhoods);
    }
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams();
    
    if (location && location !== "All Areas") {
      searchParams.append('location', location);
    }
    
    if (searchQuery.trim()) {
      searchParams.append('search', searchQuery);
    }
    
    if (deliveryOption.delivery) {
      searchParams.append('delivery', 'true');
    }
    if (deliveryOption.pickup) {
      searchParams.append('pickup', 'true');
    }

    setTimeout(() => {
      const searchUrl = `/sale/browse?${searchParams.toString()}`;
      console.log('Moving to:', searchUrl);
      window.location.href = searchUrl;
    }, 1500);
  };

  const handleSkip = () => {
    window.location.href = '/sale/browse';
  };

  const handleLocationSelect = (loc) => {
    setLocation(loc);
    setShowLocationDropdown(false);
  };

  const toggleDeliveryOption = (option) => {
    setDeliveryOption(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  // Enhanced Interactive Background
  const InteractiveBackground = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    
    useEffect(() => {
      const handleMouseMove = (e) => {
        setMousePosition({ 
          x: (e.clientX / window.innerWidth) * 100, 
          y: (e.clientY / window.innerHeight) * 100 
        });
      };
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Generate floating geometric shapes
    const geometricShapes = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 60 + 20,
      shape: ['circle', 'triangle', 'square', 'hexagon'][Math.floor(Math.random() * 4)],
      duration: Math.random() * 25 + 15,
      delay: Math.random() * 5
    }));

    // Generate flowing particles
    const flowingParticles = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 30 + 20
    }));

    const ShapeComponent = ({ shape, size, className }) => {
      switch (shape) {
        case 'circle':
          return <div className={`rounded-full ${className}`} style={{ width: size, height: size }} />;
        case 'triangle':
          return (
            <div 
              className={className}
              style={{
                width: 0,
                height: 0,
                borderLeft: `${size/2}px solid transparent`,
                borderRight: `${size/2}px solid transparent`,
                borderBottom: `${size}px solid currentColor`,
              }}
            />
          );
        case 'square':
          return <div className={className} style={{ width: size, height: size }} />;
        case 'hexagon':
          return (
            <div 
              className={`${className} relative`}
              style={{ width: size, height: size * 0.866 }}
            >
              <div
                className="absolute inset-0 bg-current transform rotate-60"
                style={{
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                }}
              />
            </div>
          );
        default:
          return <div className={`rounded-full ${className}`} style={{ width: size, height: size }} />;
      }
    };

    return (
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Animated Gradient Mesh */}
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)",
              "radial-gradient(circle at 80% 20%, rgba(251, 146, 60, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
              "radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)"
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Mouse-Following Glow */}
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(251, 146, 60, 0.4) 0%, transparent 70%)",
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: "translate(-50%, -50%)"
          }}
          transition={{ type: "spring", stiffness: 50, damping: 30 }}
        />

        {/* Floating Geometric Shapes */}
        {geometricShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="absolute text-orange-300 opacity-10"
            style={{
              left: `${shape.x}%`,
              top: `${shape.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 100 - 50, 0],
              rotate: [0, 360, 0],
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{
              duration: shape.duration,
              repeat: Infinity,
              ease: "easeInOut",
              delay: shape.delay
            }}
          >
            <ShapeComponent 
              shape={shape.shape} 
              size={shape.size} 
              className="text-current"
            />
          </motion.div>
        ))}

        {/* Flowing Particles */}
        {flowingParticles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-gradient-to-r from-orange-400 to-orange-600 opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -120, 0],
              x: [0, Math.random() * 80 - 40, 0],
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        {/* Interactive Grid Dots */}
        {Array.from({ length: 60 }, (_, i) => {
          const row = Math.floor(i / 10);
          const col = i % 10;
          const x = (col * 10) + 10;
          const y = (row * 15) + 10;
          
          const distance = Math.sqrt(
            Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2)
          );
          const scale = Math.max(0.3, 1.5 - distance / 25);
          const opacity = Math.max(0.1, 0.9 - distance / 35);
          
          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              animate={{
                scale,
                opacity,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {i % 3 === 0 ? (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path d="M1 3L4 1L7 3V6H5V5H3V6H1V3Z" fill="#E97451" opacity="0.6"/>
                </svg>
              ) : i % 3 === 1 ? (
                <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                  <path d="M1 3L3 1H5V3L4 5L1 3Z" fill="#F59E0B" opacity="0.6"/>
                  <circle cx="4" cy="2" r="0.5" fill="white" opacity="0.8"/>
                </svg>
              ) : (
                <div className="w-1 h-1 rounded-full bg-orange-300" />
              )}
            </motion.div>
          );
        })}

        {/* Pulsing Circles */}
        {Array.from({ length: 6 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-orange-300 opacity-20 flex items-center justify-center"
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
              width: 50 + i * 20,
              height: 50 + i * 20,
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.4, 0.1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5
            }}
          >
            {i % 2 === 0 && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 5L6 2L10 5V9H8V7H4V9H2V5Z" fill="#E97451" opacity="0.4"/>
                <circle cx="6" cy="4" r="0.5" fill="white" opacity="0.6"/>
              </svg>
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state while user data is being fetched
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

  // Main Render
  return (
    <div className="min-h-screen bg-white text-gray-800 flex flex-col items-center pt-16 pb-10 px-4">
      <div>
        {isClient ? (
          <InteractiveBackground />
        ) : (
          <div className="min-h-screen" />
        )}
      </div>

      {/* Skip Button */}
      <div className="absolute top-4 right-4 z-20 animate-fadeIn">
        <button
          onClick={handleSkip}
          className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full hover:bg-white hover:text-orange-600 transition-all transform hover:scale-105 hover:shadow-lg"
        >
          <span className="font-medium">Skip</span>
        </button>
      </div>

      {/* Background gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#ffebda] to-white -z-10"></div>

      {/* Main Heading */}
      <div className="flex items-center mb-10 mt-12 text-center">
        <MapPin size={36} className="text-orange-600" />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 ml-2">
          Find Move Out Sales Near You
        </h1>
      </div>
      
      {/* Location Status Display */}
      {location && location !== "Select location" && (
        <div className="mb-6 text-center">
          <p className="text-sm text-gray-600">
            Searching in: <span className="font-semibold text-orange-600">{location}</span>
          </p>
        </div>
      )}
      
      {/* Search Container */}
      <div className="w-full max-w-3xl mx-auto mb-8">
        <div className="relative flex flex-col md:flex-row rounded-xl overflow-hidden shadow-lg border border-gray-200">
          {/* Location Selector */}
          <div className="relative bg-white px-4 py-3 md:w-auto md:flex-shrink-0 cursor-pointer border-b md:border-b-0 md:border-r border-gray-200">
            <div 
              className="flex items-center justify-between gap-2"
              onClick={() => {
                setShowLocationDropdown(!showLocationDropdown);
              }}
            >
              <div className="flex items-center">
                <MapPin size={20} className="text-orange-600 mr-2 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-xs text-gray-500 font-medium">Location</div>
                  <div className="font-semibold text-gray-800 truncate max-w-[200px]">
                    {location || "Select location"}
                  </div>
                </div>
              </div>
              <ChevronDown 
                size={18} 
                className={`text-gray-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} 
              />
            </div>
            
            {/* Location Dropdown - Enhanced Full Interface */}
            {showLocationDropdown && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
                  
                  {/* Header */}
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">Choose Your Location</h2>
                        <p className="text-orange-100">Select from popular areas or search for any location</p>
                      </div>
                      <button
                        onClick={() => setShowLocationDropdown(false)}
                        className="text-white hover:text-orange-200 text-3xl"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row h-full max-h-[60vh]">
                    
                    {/* Left Side - Search Location Picker */}
                    <div className="lg:w-1/2 p-6 border-b lg:border-b-0 lg:border-r border-gray-200">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Search size={20} className="text-orange-500" />
                          Search Any Location
                        </h3>
                        <p className="text-sm text-gray-600">Find and select any city, address, or landmark</p>
                      </div>
                      
                      <SearchLocationPicker 
                        initialValue=""
                        onLocationSelect={(selectedLocation) => {
                          console.log('Selected custom location:', selectedLocation);
                          const locationName = selectedLocation.placeName || selectedLocation.address || selectedLocation.displayName;
                          setLocation(locationName);
                          setShowLocationDropdown(false);
                          
                          // Generate new neighborhoods for the selected location
                          if (selectedLocation.lat && selectedLocation.lng) {
                            generateNearbyNeighborhoods(selectedLocation);
                          }
                        }}
                      />
                    </div>
                    
                    {/* Right Side - Popular Areas */}
                    <div className="lg:w-1/2 p-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <MapPin size={20} className="text-orange-500" />
                          Popular Areas Near You
                          {isLoadingNeighborhoods && (
                            <span className="ml-2">
                              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></span>
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">Quick select from nearby neighborhoods</p>
                      </div>

                      <div className="overflow-y-auto max-h-80">
                        {neighborhoods.length > 0 && neighborhoods[0] !== "Select a location" ? (
                          <div className="space-y-2">
                            {neighborhoods.map((neighborhood, idx) => (
                              <div 
                                key={idx}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${
                                  neighborhood === location 
                                    ? 'bg-orange-50 border-orange-300 text-orange-700' 
                                    : 'bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300'
                                }`}
                                onClick={() => handleLocationSelect(neighborhood)}
                              >
                                <div className="flex items-center">
                                  <MapPin size={16} className="text-orange-500 mr-3 flex-shrink-0" />
                                  <span className="font-medium">
                                    {neighborhood}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : !isLoadingNeighborhoods ? (
                          <div className="text-center py-8 text-gray-500">
                            <MapPin size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-sm">No saved location found</p>
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
                  
                  {/* Footer */}
                  <div className="bg-gray-50 p-4 flex justify-end">
                    <button
                      onClick={() => setShowLocationDropdown(false)}
                      className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
  {/* Search Input */}
          <div className="flex-1 flex">
            <input 
              type="text" 
              placeholder="Search for furniture, electronics, books..." 
              className="w-full px-6 py-4 bg-white text-gray-800 border-0 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button 
              onClick={handleSearch}
              className="bg-[#ffb71e] hover:bg-[#ffa700] px-6 md:px-8 transition-colors flex items-center justify-center"
            >
              <Search size={22} className="text-gray-800" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Delivery Options */}
      <div className="w-full max-w-3xl mb-10 bg-white rounded-xl p-5 shadow-md border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Delivery Preferences</h2>
        <div className="flex flex-wrap gap-4">
          <div 
            className={`flex items-center gap-3 px-5 py-3 rounded-lg cursor-pointer transition-all ${
              deliveryOption.delivery 
                ? 'bg-[#ffebda] border border-[#ffb71e]' 
                : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleDeliveryOption('delivery')}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              deliveryOption.delivery 
                ? 'border-orange-600 bg-orange-600' 
                : 'border-gray-400'
            }`}>
              {deliveryOption.delivery && <Check size={14} className="text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <Truck size={20} className={deliveryOption.delivery ? "text-orange-600" : "text-gray-500"} />
              <span>Delivery</span>
            </div>
          </div>
          
          <div 
            className={`flex items-center gap-3 px-5 py-3 rounded-lg cursor-pointer transition-all ${
              deliveryOption.pickup 
                ? 'bg-[#ffebda] border border-[#ffb71e]' 
                : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => toggleDeliveryOption('pickup')}
          >
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
              deliveryOption.pickup 
                ? 'border-orange-600 bg-orange-600' 
                : 'border-gray-400'
            }`}>
              {deliveryOption.pickup && <Check size={14} className="text-white" />}
            </div>
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} className={deliveryOption.pickup ? "text-orange-600" : "text-gray-500"} />
              <span>Pickup</span>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 w-full mt-2">
            {!deliveryOption.delivery && !deliveryOption.pickup ? (
              "Select at least one option to see all available listings"
            ) : deliveryOption.delivery && deliveryOption.pickup ? (
              "Showing items available for both delivery and pickup"
            ) : deliveryOption.delivery ? (
              "Showing items available for delivery"
            ) : (
              "Showing items available for pickup only"
            )}
          </div>
        </div>
      </div>
      
      {/* Dynamic Neighborhood Quick Access - Only show if we have neighborhoods from user location */}
      {neighborhoods.length > 1 && neighborhoods[0] !== "Select a location" && (
        <div className="w-full max-w-3xl">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Popular Areas Near You
            {isLoadingNeighborhoods && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border border-gray-400 border-t-transparent"></span>
                Loading...
              </span>
            )}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {neighborhoods
              .filter(neighborhood => neighborhood !== "All Areas") // Exclude "All Areas"
              .slice(0, 8) // Show up to 8 neighborhoods
              .map((neighborhood, idx) => (
              <div 
                key={idx}
                className="bg-white hover:bg-[#ffebda] rounded-lg p-3 text-center cursor-pointer transition-all hover:shadow-md border border-gray-200 hover:border-[#ffb71e] transform hover:-translate-y-1"
                onClick={() => handleLocationSelect(neighborhood)}
              >
                <span className="text-sm">{neighborhood}</span>
              </div>
            ))}
          </div>
          
          {neighborhoods.length === 1 && neighborhoods[0] === "All Areas" && (
            <div className="text-center py-8 text-gray-500">
              <p>Discovering areas near you...</p>
              <div className="mt-2">
                <span className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* No Location Message - Show when no user location is available */}
      {(!location || location === "Select location") && neighborhoods.length <= 1 && !isLoadingNeighborhoods && (
        <div className="w-full max-w-3xl text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <MapPin size={48} className="mx-auto text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No saved location found</h3>
            <p className="text-gray-600 mb-4">
              Set your location to see popular areas and get personalized results
            </p>
            <button
              onClick={() => setShowLocationDropdown(true)}
              className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Choose Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MoveOutSaleSearchPage;