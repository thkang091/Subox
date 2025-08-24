import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, Clock, Car, Route, X, Navigation, Users, Heart, Star, 
  Calendar, BedDouble, Train, Bus, Bike, Zap, ChevronDown, ChevronUp, 
  Info, AlertCircle, Eye, EyeOff, Home
} from 'lucide-react';

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

const EnhancedCommuteResultsMap = ({ 
  routeResults = [], 
  selectedDestination = null,
  listings = [],
  onListingClick,
  onFavoriteToggle,
  favoriteListings = [],
  isVisible = false,
  onClose
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const directionsRenderersRef = useRef([]);
  const alternativeRenderersRef = useRef([]);
  
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [routeDetailsExpanded, setRouteDetailsExpanded] = useState({});

  // Check if Google Maps is loaded
  useEffect(() => {
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
        return true;
      }
      return false;
    };

    if (!checkGoogleMaps()) {
      const interval = setInterval(() => {
        if (checkGoogleMaps()) {
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isGoogleMapsLoaded || !mapRef.current || mapInstanceRef.current || !isVisible) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 44.9778, lng: -93.2358 }, // Minneapolis center
      zoom: 12,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;
    setMapInitialized(true);
  }, [isGoogleMapsLoaded, isVisible]);

  // Helper function to get listing coordinates
  const getListingCoordinates = (listing) => {
    if (listing.customLocation && listing.customLocation.lat && listing.customLocation.lng) {
      return {
        lat: listing.customLocation.lat,
        lng: listing.customLocation.lng,
        address: listing.customLocation.address || listing.address || listing.location
      };
    }
    
    if (listing.lat && listing.lng) {
      return {
        lat: listing.lat,
        lng: listing.lng,
        address: listing.address || listing.location
      };
    }
    
    const neighborhoodCoords = {
      'Dinkytown': { lat: 44.9796, lng: -93.2354 },
      'East Bank': { lat: 44.9743, lng: -93.2277 },
      'Stadium Village': { lat: 44.9756, lng: -93.2189 },
      'Como': { lat: 44.9823, lng: -93.2077 },
      'St. Paul': { lat: 44.9537, lng: -93.0900 },
      'Other': { lat: 44.9778, lng: -93.2358 }
    };
    
    const baseCoords = neighborhoodCoords[listing.location] || neighborhoodCoords['Other'];
    return {
      lat: baseCoords.lat + (Math.random() - 0.5) * 0.01,
      lng: baseCoords.lng + (Math.random() - 0.5) * 0.01,
      address: listing.address || listing.location || 'Minneapolis, MN'
    };
  };

  // Route styling based on transport mode
  const getRouteStyle = (transportMode, isAlternative = false) => {
    const baseStyles = {
      walking: { color: '#22c55e', weight: 4, opacity: 0.8 },
      transit: { color: '#3b82f6', weight: 5, opacity: 0.9 },
      bicycling: { color: '#f97316', weight: 4, opacity: 0.8 },
      driving: { color: '#8b5cf6', weight: 5, opacity: 0.8 },
      scooter: { color: '#eab308', weight: 4, opacity: 0.8 }
    };

    const style = baseStyles[transportMode] || baseStyles.transit;
    
    if (isAlternative) {
      return {
        ...style,
        opacity: style.opacity * 0.5,
        weight: style.weight - 1
      };
    }
    
    return style;
  };

  // Update map with route results
  useEffect(() => {
    if (!mapInstanceRef.current || !isVisible || !mapInitialized) return;

    // Clear existing markers and routes
    markersRef.current.forEach(marker => marker.setMap(null));
    directionsRenderersRef.current.forEach(renderer => renderer.setMap(null));
    alternativeRenderersRef.current.forEach(renderer => renderer.setMap(null));
    markersRef.current = [];
    directionsRenderersRef.current = [];
    alternativeRenderersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    // Add destination marker
    if (selectedDestination) {
      const destinationMarker = new window.google.maps.Marker({
        position: { lat: selectedDestination.lat, lng: selectedDestination.lng },
        map: mapInstanceRef.current,
        title: selectedDestination.placeName || 'Your Destination',
        zIndex: 1000,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="48" viewBox="0 0 40 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 0C9 0 0 9 0 20c0 15 20 28 20 28s20-13 20-28C40 9 31 0 20 0z" fill="#dc2626"/>
              <circle cx="20" cy="20" r="12" fill="#fff"/>
              <circle cx="20" cy="20" r="8" fill="#dc2626"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 48),
          anchor: new window.google.maps.Point(20, 48)
        }
      });
      markersRef.current.push(destinationMarker);
      bounds.extend({ lat: selectedDestination.lat, lng: selectedDestination.lng });
    }

    // Add listing markers
    listings.forEach((listing, index) => {
      const coords = getListingCoordinates(listing);
      const routeResult = routeResults.find(r => r.listingId === listing.id);
      const hasRoute = !!routeResult;
      
      // Check if listing is close to destination
      const isCloseToDestination = selectedDestination && 
        calculateDistance(coords.lat, coords.lng, selectedDestination.lat, selectedDestination.lng) < 0.05;
      
      // Adjust position slightly if too close to destination
      let adjustedCoords = coords;
      if (isCloseToDestination) {
        const offsetAngle = (index * 45) * (Math.PI / 180);
        const offsetDistance = 0.001;
        adjustedCoords = {
          ...coords,
          lat: coords.lat + Math.sin(offsetAngle) * offsetDistance,
          lng: coords.lng + Math.cos(offsetAngle) * offsetDistance
        };
      }
      
      // Create marker with clean design
      const marker = new window.google.maps.Marker({
        position: { lat: adjustedCoords.lat, lng: adjustedCoords.lng },
        map: mapInstanceRef.current,
        title: routeResult?.isAtDestination 
          ? `${listing.title} - At destination`
          : hasRoute 
            ? `${listing.title} - ${routeResult.duration} commute`
            : `${listing.title}`,
        zIndex: routeResult?.isAtDestination ? 1001 : (isCloseToDestination ? 999 : 500),
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="36" height="44" viewBox="0 0 36 44" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 0C8 0 0 8 0 18c0 14 18 26 18 26s18-12 18-26C36 8 28 0 18 0z" 
                    fill="${routeResult?.isAtDestination ? '#10b981' : (hasRoute ? '#f97316' : '#6b7280')}" 
                    stroke="#fff" 
                    stroke-width="2"/>
              <circle cx="18" cy="18" r="12" fill="#fff"/>
              <text x="18" y="15" text-anchor="middle" fill="${routeResult?.isAtDestination ? '#10b981' : (hasRoute ? '#f97316' : '#6b7280')}" 
                    font-size="7" font-weight="bold">$${Math.round(listing.price/100)}k</text>
              <text x="18" y="23" text-anchor="middle" fill="${routeResult?.isAtDestination ? '#10b981' : (hasRoute ? '#f97316' : '#6b7280')}" 
                    font-size="6">${routeResult?.isAtDestination 
                      ? 'HERE' 
                      : hasRoute 
                        ? `${routeResult.duration.split(' ')[0]}min`
                        : 'N/A'
                    }</text>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(36, 44),
          anchor: new window.google.maps.Point(18, 44)
        }
      });

      // Add click listener
      marker.addListener('click', () => {
        setSelectedListing({
          ...listing, 
          commute: routeResult, 
          coordinates: adjustedCoords,
          alternatives: routeResult?.alternatives || [],
          isCloseToDestination,
          isAtDestination: routeResult?.isAtDestination
        });
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: adjustedCoords.lat, lng: adjustedCoords.lng });

      // Render routes
      if (routeResult && routeResult.route && selectedDestination && !routeResult.isAtDestination) {
        try {
          renderRoute(
            routeResult.route, 
            routeResult.transportMode, 
            false
          );

          // Render alternatives if enabled
          if (showAlternatives && routeResult.alternatives && routeResult.alternatives.length > 0) {
            routeResult.alternatives.forEach((alternative, altIndex) => {
              renderRoute(
                alternative.route,
                routeResult.transportMode,
                true
              );
            });
          }
          
        } catch (error) {
          console.error(`Error rendering route for listing ${listing.id}:`, error);
          
          // Fallback to simple line
          const path = [
            { lat: adjustedCoords.lat, lng: adjustedCoords.lng },
            { lat: selectedDestination.lat, lng: selectedDestination.lng }
          ];

          const style = getRouteStyle(routeResult.transportMode);
          const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: style.color,
            strokeOpacity: style.opacity,
            strokeWeight: style.weight,
            map: mapInstanceRef.current
          });

          directionsRenderersRef.current.push({
            setMap: (map) => polyline.setMap(map)
          });
        }
      }
    });

    // Fit map bounds
    if (routeResults.length > 0 && selectedDestination) {
      const routeBounds = new window.google.maps.LatLngBounds();
      routeBounds.extend(new window.google.maps.LatLng(selectedDestination.lat, selectedDestination.lng));
      
      routeResults.forEach(routeResult => {
        const listing = listings.find(l => l.id === routeResult.listingId);
        if (listing) {
          const coords = getListingCoordinates(listing);
          routeBounds.extend(new window.google.maps.LatLng(coords.lat, coords.lng));
        }
      });
      
      setTimeout(() => {
        mapInstanceRef.current.fitBounds(routeBounds, { padding: 80 });
        
        setTimeout(() => {
          const currentZoom = mapInstanceRef.current.getZoom();
          if (currentZoom < 12) {
            mapInstanceRef.current.setZoom(12);
          } else if (currentZoom > 16) {
            mapInstanceRef.current.setZoom(16);
          }
        }, 300);
      }, 500);
      
    } else if (selectedDestination) {
      mapInstanceRef.current.setCenter({ lat: selectedDestination.lat, lng: selectedDestination.lng });
      mapInstanceRef.current.setZoom(13);
    }
    
  }, [routeResults, selectedDestination, listings, isVisible, mapInitialized, showAlternatives]);

  // Route rendering function
  const renderRoute = (route, transportMode, isAlternative) => {
    const style = getRouteStyle(transportMode, isAlternative);
    
    try {
      if (route.overview_path && route.overview_path.length > 0) {
        const routePath = route.overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));

        const polylineOptions = {
          path: routePath,
          geodesic: true,
          strokeColor: style.color,
          strokeOpacity: style.opacity,
          strokeWeight: style.weight,
          map: mapInstanceRef.current
        };

        // Add dashed pattern for alternatives
        if (isAlternative) {
          polylineOptions.strokePattern = [
            { icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 }, offset: '0', repeat: '8px' }
          ];
        }

        const polyline = new window.google.maps.Polyline(polylineOptions);

        if (isAlternative) {
          alternativeRenderersRef.current.push({
            setMap: (map) => polyline.setMap(map)
          });
        } else {
          directionsRenderersRef.current.push({
            setMap: (map) => polyline.setMap(map)
          });
        }
      }
    } catch (error) {
      console.error('Error in route rendering:', error);
    }
  };

  // Helper functions
  const getTransportIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'walking': return <Users size={16} className="text-green-600" />;
      case 'transit': return <Train size={16} className="text-blue-600" />;
      case 'bicycling': return <Bike size={16} className="text-orange-600" />;
      case 'driving': return <Car size={16} className="text-purple-600" />;
      case 'scooter': return <Zap size={16} className="text-yellow-600" />;
      default: return <Route size={16} className="text-gray-500" />;
    }
  };

  const getTransportLabel = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'walking': return 'Walking';
      case 'transit': return 'Transit';
      case 'bicycling': return 'Biking';
      case 'driving': return 'Driving';
      case 'scooter': return 'Scooter';
      default: return 'Unknown';
    }
  };

  const toggleRouteDetails = (listingId) => {
    setRouteDetailsExpanded(prev => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  if (!isVisible) return null;

  if (!isGoogleMapsLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Map...</p>
          </div>
        </div>
      </div>
    );
  }

  const listingsAtDestination = routeResults.filter(r => r.isAtDestination).length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Map Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="relative">
          <div ref={mapRef} className="w-full h-96" />
          
          {/* Map Controls */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Map Controls</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className={`flex items-center gap-2 w-full text-xs px-3 py-2 rounded-md transition-colors ${
                  showAlternatives 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAlternatives ? <EyeOff size={14} /> : <Eye size={14} />}
                {showAlternatives ? 'Hide' : 'Show'} Alternatives
              </button>
            </div>
          </div>
          
          {/* Selected Listing Panel */}
          {selectedListing && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm z-10 max-h-96 overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900">{selectedListing.title}</h3>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                <MapPin size={14} />
                {selectedListing.coordinates?.address || selectedListing.address || selectedListing.location}
              </div>
              
              <div className="text-xl font-bold text-orange-600 mb-2">
                ${selectedListing.price}/month
              </div>
              
              <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                <BedDouble size={14} />
                {selectedListing.bedrooms} bed • {selectedListing.bathrooms} bath
              </div>
              
              {/* Commute Information */}
              {selectedListing.commute ? (
                selectedListing.isAtDestination ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <Home size={16} className="text-green-600" />
                      <span className="font-medium text-green-800">At destination</span>
                    </div>
                    <div className="text-xs text-green-700">
                      No commute needed - you're already here!
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTransportIcon(selectedListing.commute.transportMode)}
                        <span className="font-medium text-blue-800 text-sm">
                          {selectedListing.commute.duration}
                        </span>
                      </div>
                      <span className="text-blue-600 text-xs">
                        {selectedListing.commute.distance}
                      </span>
                    </div>
                    
                    {selectedListing.alternatives && selectedListing.alternatives.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleRouteDetails(selectedListing.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          {routeDetailsExpanded[selectedListing.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                          {selectedListing.alternatives.length} alternative{selectedListing.alternatives.length > 1 ? 's' : ''}
                        </button>
                        
                        {routeDetailsExpanded[selectedListing.id] && (
                          <div className="mt-2 space-y-2">
                            {selectedListing.alternatives.map((alt, index) => (
                              <div key={index} className="bg-white border border-blue-200 rounded p-2 text-xs">
                                <div className="font-medium text-gray-900">Route {index + 1}</div>
                                <div className="text-gray-600">{alt.duration} • {alt.distance}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <div className="text-sm text-gray-600">
                    Route not calculated
                  </div>
                </div>
              )}

              <button
                onClick={() => onListingClick && onListingClick(selectedListing)}
                className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Legend</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                <span>Your destination</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>At destination ({listingsAtDestination})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>With routes ({routeResults.length - listingsAtDestination})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span>Other listings</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* At Destination Notice */}
      {listingsAtDestination > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
              <Home size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-green-800 mb-1">
                {listingsAtDestination} listing{listingsAtDestination > 1 ? 's' : ''} at your destination
              </h3>
              <p className="text-sm text-green-700">
                These properties are located at your destination - perfect for zero-commute living!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Commute Results</h2>
            <p className="text-gray-600">
              {listingsAtDestination} at destination • {routeResults.length - listingsAtDestination} with calculated routes • {listings.length - routeResults.length} without routes
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info size={16} />
            Click markers for details
          </div>
        </div>
        
        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings
            .sort((a, b) => {
              const routeA = routeResults.find(r => r.listingId === a.id);
              const routeB = routeResults.find(r => r.listingId === b.id);
              
              // Prioritize listings at destination
              if (routeA?.isAtDestination && !routeB?.isAtDestination) return -1;
              if (!routeA?.isAtDestination && routeB?.isAtDestination) return 1;
              
              if (routeA && routeB && !routeA.isAtDestination && !routeB.isAtDestination) {
                const parseTime = (timeStr) => {
                  const match = timeStr.match(/(\d+)/);
                  return match ? parseInt(match[1]) : 999;
                };
                return parseTime(routeA.duration) - parseTime(routeB.duration);
              }
              
              if (routeA && !routeB) return -1;
              if (!routeA && routeB) return 1;
              return a.price - b.price;
            })
            .map((listing) => {
              const routeResult = routeResults.find(r => r.listingId === listing.id);
              const isFavorited = favoriteListings.some(fav => fav.id === listing.id);
              
              return (
                <div 
                  key={listing.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onListingClick && onListingClick(listing)}
                >
                  <div 
                    className="h-48 bg-gray-200 relative" 
                    style={{
                      backgroundImage: `url(${listing.image || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop'})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-gray-800">
                      ${listing.price}/mo
                    </div>
                    <button 
                      className={`absolute top-3 left-3 p-2 rounded-full transition-all ${
                        isFavorited ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:text-red-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteToggle && onFavoriteToggle(listing);
                      }}
                    >
                      <Heart size={16} className={isFavorited ? 'fill-current' : ''} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                      <div className="flex items-center text-amber-500">
                        <Star size={14} className="fill-current" />
                        <span className="ml-1 text-sm">{listing.rating || '4.2'}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                      <MapPin size={14} />
                      {listing.location}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <BedDouble size={14} />
                      {listing.bedrooms} bed • {listing.bathrooms} bath
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3 flex items-center gap-1">
                      <Calendar size={14} />
                      {listing.dateRange || 'Available now'}
                    </div>
                    
                    {/* Commute Information */}
                    <div className="border-t pt-3">
                      {routeResult ? (
                        routeResult.isAtDestination ? (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Home size={16} className="text-green-600" />
                                <span className="font-medium text-green-800 text-sm">At destination</span>
                              </div>
                              <span className="text-green-600 text-xs">0 mi</span>
                            </div>
                            <div className="text-xs text-green-700">
                              No commute needed!
                            </div>
                          </div>
                        ) : (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                {getTransportIcon(routeResult.transportMode)}
                                <span className="font-medium text-blue-800 text-sm">
                                  {routeResult.duration}
                                </span>
                              </div>
                              <span className="text-blue-600 text-xs">
                                {routeResult.distance}
                              </span>
                            </div>
                            
                            <div className="text-xs text-blue-700">
                              {getTransportLabel(routeResult.transportMode)} commute
                            </div>
                            
                            {/* Transit details */}
                            {routeResult.transportMode === 'transit' && routeResult.transitDetails && (
                              <div className="text-xs text-blue-600 mt-1">
                                {routeResult.transitDetails.totalFare && (
                                  <div>Fare: {routeResult.transitDetails.totalFare}</div>
                                )}
                              </div>
                            )}
                            
                            {/* Alternatives indicator */}
                            {routeResult.alternatives && routeResult.alternatives.length > 0 && (
                              <div className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                <Route size={10} />
                                <span>{routeResult.alternatives.length} alternative{routeResult.alternatives.length > 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <div className="text-sm text-gray-600 text-center">
                            Route not calculated
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Amenities */}
                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {listing.amenities.slice(0, 2).map((amenity, index) => (
                          <div key={index} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded">
                            {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                          </div>
                        ))}
                        {listing.amenities.length > 2 && (
                          <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            +{listing.amenities.length - 2} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        {/* No Results Message */}
        {listings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or commute preferences.</p>
          </div>
        )}

        {/* No Routes Message */}
        {listings.length > 0 && routeResults.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">No routes calculated yet</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Use the commute location picker to calculate routes to these listings.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close Map
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedCommuteResultsMap;