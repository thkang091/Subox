import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Clock, Car, Route, X, Navigation, Users, Heart, Star, Calendar, BedDouble, Train, Bus, Bike, Zap, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

// Enhanced map component that shows mode-specific results from CommuteLocationPicker
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
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState(null);
  const [isLoadingGoogleMaps, setIsLoadingGoogleMaps] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(true);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState({});
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

  // Enhanced route colors and styles based on transport mode
  const getRouteStyle = (transportMode, isAlternative = false, alternativeIndex = 0) => {
    const baseStyles = {
      walking: { 
        color: '#22c55e', 
        weight: 4, 
        opacity: 0.8,
        pattern: 'solid'
      },
      transit: { 
        color: '#3b82f6', 
        weight: 5, 
        opacity: 0.9,
        pattern: 'solid'
      },
      bicycling: { 
        color: '#f97316', 
        weight: 4, 
        opacity: 0.8,
        pattern: 'solid'
      },
      driving: { 
        color: '#8b5cf6', 
        weight: 5, 
        opacity: 0.8,
        pattern: 'solid'
      },
      scooter: { 
        color: '#eab308', 
        weight: 4, 
        opacity: 0.8,
        pattern: 'solid'
      }
    };

    const style = baseStyles[transportMode] || baseStyles.transit;
    
    if (isAlternative) {
      return {
        ...style,
        opacity: style.opacity * 0.6,
        weight: style.weight - 1,
        color: adjustColorBrightness(style.color, alternativeIndex * 20)
      };
    }
    
    return style;
  };

  const adjustColorBrightness = (hex, percent) => {
    const num = parseInt(hex.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
  };

  // Enhanced map update with mode-specific route rendering
  useEffect(() => {
    if (!mapInstanceRef.current || !isVisible || !mapInitialized) return;

    console.log('🗺️ Updating enhanced map with:', {
      routeResults: routeResults.length,
      selectedDestination,
      listings: listings.length
    });

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
        title: selectedDestination.placeName || 'Your Commute Destination',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#dc2626" stroke="#fff" stroke-width="3"/>
              <circle cx="20" cy="20" r="8" fill="#fff"/>
              <circle cx="20" cy="20" r="4" fill="#dc2626"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 40)
        }
      });
      markersRef.current.push(destinationMarker);
      bounds.extend({ lat: selectedDestination.lat, lng: selectedDestination.lng });
    }

    // Add enhanced markers for listings with mode-specific route rendering
    listings.forEach((listing, index) => {
      const coords = getListingCoordinates(listing);
      const routeResult = routeResults.find(r => r.listingId === listing.id);
      const hasRoute = !!routeResult;
      
      console.log(`🏠 Processing listing ${listing.id}:`, {
        coords,
        hasRoute,
        routeResult: routeResult ? { 
          duration: routeResult.duration, 
          distance: routeResult.distance,
          transportMode: routeResult.transportMode,
          hasAlternatives: !!routeResult.alternatives?.length 
        } : null
      });
      
      // Create enhanced marker with transport mode indication
      const transportIcon = routeResult ? getTransportModeIcon(routeResult.transportMode) : '📍';
      const marker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: mapInstanceRef.current,
        title: hasRoute 
          ? `${listing.title} - ${routeResult.duration} ${routeResult.transportMode} commute`
          : `${listing.title} - Route not calculated`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="50" height="60" viewBox="0 0 50 60" xmlns="http://www.w3.org/2000/svg">
              <path d="M25 0C11.2 0 0 11.2 0 25c0 18.8 25 35 25 35s25-16.2 25-35C50 11.2 38.8 0 25 0z" fill="${hasRoute ? '#f97316' : '#6b7280'}"/>
              <circle cx="25" cy="25" r="18" fill="#fff"/>
              <text x="25" y="18" text-anchor="middle" fill="${hasRoute ? '#f97316' : '#6b7280'}" font-size="7" font-weight="bold">${Math.round(listing.price/100)}k</text>
              <text x="25" y="28" text-anchor="middle" fill="${hasRoute ? '#f97316' : '#6b7280'}" font-size="8">${transportIcon}</text>
              ${hasRoute 
                ? `<text x="25" y="36" text-anchor="middle" fill="#f97316" font-size="5" font-weight="bold">${routeResult.duration.split(' ')[0]}min</text>`
                : `<text x="25" y="36" text-anchor="middle" fill="#6b7280" font-size="5" font-weight="bold">No route</text>`
              }
            </svg>
          `),
          scaledSize: new window.google.maps.Size(40, 48)
        }
      });

      // Add click listener with enhanced info
      marker.addListener('click', () => {
        setSelectedListing({
          ...listing, 
          commute: routeResult, 
          coordinates: coords,
          alternatives: routeResult?.alternatives || []
        });
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: coords.lat, lng: coords.lng });

      // Enhanced route rendering with mode-specific styles and alternatives
      if (routeResult && routeResult.route && selectedDestination) {
        console.log(`🛣️ Drawing enhanced ${routeResult.transportMode} route for listing ${listing.id}`);
        
        try {
          // Render primary route
          renderEnhancedRoute(
            routeResult.route, 
            routeResult.transportMode, 
            listing.id, 
            false, 
            0
          );

          // Render alternative routes if enabled and available
          if (showAlternatives && routeResult.alternatives && routeResult.alternatives.length > 0) {
            console.log(`🔀 Drawing ${routeResult.alternatives.length} alternative routes for ${listing.id}`);
            
            routeResult.alternatives.forEach((alternative, altIndex) => {
              renderEnhancedRoute(
                alternative.route,
                routeResult.transportMode,
                listing.id,
                true,
                altIndex
              );
            });
          }
          
        } catch (error) {
          console.error(`❌ Error rendering enhanced route for listing ${listing.id}:`, error);
          
          // Fallback to simple line
          try {
            const path = [
              { lat: coords.lat, lng: coords.lng },
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
            
          } catch (fallbackError) {
            console.error(`❌ All route rendering methods failed for listing ${listing.id}:`, fallbackError);
          }
        }
      }
    });

    // Apply optimal zoom immediately
    if (routeResults.length > 0 && selectedDestination) {
      console.log('🎯 Calculating optimal zoom for enhanced routes...');
      
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
        mapInstanceRef.current.fitBounds(routeBounds, { padding: 60 });
        
        setTimeout(() => {
          const currentZoom = mapInstanceRef.current.getZoom();
          if (currentZoom < 13) {
            mapInstanceRef.current.setZoom(13);
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

  // Enhanced route rendering function
  const renderEnhancedRoute = (route, transportMode, listingId, isAlternative, alternativeIndex) => {
    const style = getRouteStyle(transportMode, isAlternative, alternativeIndex);
    
    try {
      if (route.overview_path && route.overview_path.length > 0) {
        const routePath = route.overview_path.map(point => ({
          lat: point.lat(),
          lng: point.lng()
        }));

        // Enhanced polyline with mode-specific styling
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
            { icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 2 }, offset: '0', repeat: '10px' }
          ];
        }

        // Special handling for transit routes - add station markers
        if (transportMode === 'transit' && !isAlternative) {
          addTransitStationMarkers(route, listingId);
        }

        const polyline = new window.google.maps.Polyline(polylineOptions);

        // Add route click listener for details
        polyline.addListener('click', (event) => {
          showRouteDetails(route, transportMode, event.latLng, isAlternative, alternativeIndex);
        });

        if (isAlternative) {
          alternativeRenderersRef.current.push({
            setMap: (map) => polyline.setMap(map)
          });
        } else {
          directionsRenderersRef.current.push({
            setMap: (map) => polyline.setMap(map)
          });
        }
        
        console.log(`✅ Enhanced ${transportMode} route rendered for ${listingId} (alternative: ${isAlternative})`);
      }
    } catch (error) {
      console.error(`❌ Error in enhanced route rendering:`, error);
    }
  };

  // Add transit station markers for better visualization
  const addTransitStationMarkers = (route, listingId) => {
    if (!route.legs || !route.legs[0] || !route.legs[0].steps) return;

    route.legs[0].steps.forEach((step, stepIndex) => {
      if (step.travel_mode === 'TRANSIT' && step.transit) {
        const transit = step.transit;
        
        // Add departure station marker
        if (transit.departure_stop) {
          const stationMarker = new window.google.maps.Marker({
            position: transit.departure_stop.location,
            map: mapInstanceRef.current,
            title: `${transit.departure_stop.name} - ${transit.line.name}`,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="#fff" stroke-width="2"/>
                  <circle cx="10" cy="10" r="4" fill="#fff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(20, 20)
            }
          });
          markersRef.current.push(stationMarker);
        }
      }
    });
  };

  // Show detailed route information
  const showRouteDetails = (route, transportMode, position, isAlternative, alternativeIndex) => {
    const infoWindow = new window.google.maps.InfoWindow({
      content: generateRouteInfoContent(route, transportMode, isAlternative, alternativeIndex),
      position: position
    });
    
    infoWindow.open(mapInstanceRef.current);
  };

  // Generate enhanced route info content
  const generateRouteInfoContent = (route, transportMode, isAlternative, alternativeIndex) => {
    const leg = route.legs[0];
    const routeType = isAlternative ? `Alternative Route ${alternativeIndex + 1}` : 'Primary Route';
    
    let content = `
      <div style="max-width: 250px; font-family: Arial, sans-serif;">
        <h4 style="margin: 0 0 8px 0; color: #1f2937;">${routeType}</h4>
        <p style="margin: 4px 0; color: #6b7280;"><strong>Mode:</strong> ${getTransportModeLabel(transportMode)}</p>
        <p style="margin: 4px 0; color: #6b7280;"><strong>Duration:</strong> ${leg.duration?.text || 'Unknown'}</p>
        <p style="margin: 4px 0; color: #6b7280;"><strong>Distance:</strong> ${leg.distance?.text || 'Unknown'}</p>
    `;

    if (transportMode === 'transit' && leg.steps) {
      const transitSteps = leg.steps.filter(step => step.travel_mode === 'TRANSIT');
      if (transitSteps.length > 0) {
        content += '<p style="margin: 8px 0 4px 0; color: #1f2937;"><strong>Transit Lines:</strong></p>';
        transitSteps.forEach(step => {
          const transit = step.transit;
          if (transit?.line?.name) {
            content += `<p style="margin: 2px 0; color: #3b82f6; font-size: 12px;">• ${transit.line.name}</p>`;
          }
        });
      }
    }

    if (transportMode === 'driving' && leg.duration_in_traffic) {
      content += `<p style="margin: 4px 0; color: #dc2626;"><strong>In Traffic:</strong> ${leg.duration_in_traffic.text}</p>`;
    }

    content += '</div>';
    return content;
  };

  // Helper functions
  const getTransportModeIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'walking': return '🚶';
      case 'transit': return '🚌';
      case 'bicycling': return '🚴';
      case 'driving': return '🚗';
      case 'scooter': return '🛴';
      default: return '📍';
    }
  };

  const getTransportIcon = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'walking': return <Users size={14} className="text-green-500" />;
      case 'transit': return <Train size={14} className="text-blue-500" />;
      case 'bicycling': return <Bike size={14} className="text-orange-500" />;
      case 'driving': return <Car size={14} className="text-purple-500" />;
      case 'scooter': return <Zap size={14} className="text-yellow-500" />;
      default: return <Route size={14} className="text-gray-500" />;
    }
  };

  const getTransportModeLabel = (mode) => {
    switch (mode?.toLowerCase()) {
      case 'walking': return 'Walking';
      case 'transit': return 'Public Transit';
      case 'bicycling': return 'Biking';
      case 'driving': return 'Driving';
      case 'scooter': return 'Scooter/E-bike';
      default: return 'Unknown';
    }
  };

  const convertPrice = (monthlyPrice, type = 'monthly') => {
    switch(type) {
      case 'weekly': return Math.round(monthlyPrice / 4);
      case 'daily': return Math.round(monthlyPrice / 30);
      default: return monthlyPrice;
    }
  };

  const toggleAlternativeRoutes = () => {
    setShowAlternatives(!showAlternatives);
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
            <p className="text-gray-600">Loading Enhanced Map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced Map Section */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="relative">
          <div ref={mapRef} className="w-full h-96" />
          
          {/* Enhanced Map Controls */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Enhanced Route Controls</h4>
            <div className="space-y-2">
              <button
                onClick={toggleAlternativeRoutes}
                className={`w-full text-xs px-2 py-1 rounded transition-colors ${
                  showAlternatives 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAlternatives ? 'Hide' : 'Show'} Alternative Routes
              </button>
            </div>
          </div>
          
          {/* Enhanced Selected Listing Info Panel */}
          {selectedListing && (
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm z-10 max-h-96 overflow-y-auto">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{selectedListing.title}</h4>
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <MapPin size={14} className="inline mr-1" />
                {selectedListing.coordinates?.address || selectedListing.address || selectedListing.location}
              </div>
              
              <div className="text-lg font-bold text-orange-600 mb-2">
                ${selectedListing.price}/month
              </div>
              
              <div className="text-sm text-gray-600 mb-3">
                {selectedListing.bedrooms} bed • {selectedListing.bathrooms} bath
              </div>
              
              {/* Enhanced Commute Info */}
              {selectedListing.commute ? (
                <div className="border-t pt-3">
                  <div className="flex items-center gap-2 text-sm mb-2">
                    {getTransportIcon(selectedListing.commute.transportMode)}
                    <span className="font-medium text-blue-800">
                      {selectedListing.commute.duration} {getTransportModeLabel(selectedListing.commute.transportMode).toLowerCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    Distance: {selectedListing.commute.distance}
                  </div>

                  {/* Transit Details */}
                  {selectedListing.commute.transitDetails && (
                    <div className="bg-blue-50 p-2 rounded text-xs mb-2">
                      <div className="font-medium text-blue-800 mb-1">Transit Details:</div>
                      {selectedListing.commute.transitDetails.departureTime && (
                        <div>Depart: {selectedListing.commute.transitDetails.departureTime}</div>
                      )}
                      {selectedListing.commute.transitDetails.totalFare && (
                        <div>Fare: {selectedListing.commute.transitDetails.totalFare}</div>
                      )}
                    </div>
                  )}

                  {/* Alternative Routes */}
                  {selectedListing.alternatives && selectedListing.alternatives.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => toggleRouteDetails(selectedListing.id)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        {routeDetailsExpanded[selectedListing.id] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        {selectedListing.alternatives.length} alternative route{selectedListing.alternatives.length > 1 ? 's' : ''}
                      </button>
                      
                      {routeDetailsExpanded[selectedListing.id] && (
                        <div className="mt-2 space-y-1">
                          {selectedListing.alternatives.map((alt, index) => (
                            <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                              <div className="font-medium">Route {index + 1}</div>
                              <div className="text-gray-600">{alt.duration} • {alt.distance}</div>
                              {alt.description && (
                                <div className="text-gray-500 text-xs">{alt.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t pt-2">
                  <div className="text-sm text-gray-500">
                    📍 Route not calculated for this listing
                  </div>
                </div>
              )}

              <button
                onClick={() => onListingClick && onListingClick(selectedListing)}
                className="w-full mt-3 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm font-medium"
              >
                View Full Details
              </button>
            </div>
          )}

          {/* Enhanced Map Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-10">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Enhanced Route Legend</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span>Your Destination</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span>Listings with Routes ({routeResults.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
                <span>Other Listings ({listings.length - routeResults.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 bg-blue-500"></div>
                <span>Primary Routes (solid)</span>
              </div>
              {showAlternatives && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-1 border-b-2 border-dashed border-blue-300"></div>
                  <span>Alternative Routes (dashed)</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Transit Stations</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Listings Grid */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-orange-600">
            Enhanced Commute Results
            <span className="text-sm font-normal text-gray-600 block">
              {routeResults.length} with detailed routes • {listings.length - routeResults.length} others
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <Info size={16} className="text-blue-500" />
            <span className="text-sm text-gray-600">Click routes on map for details</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings
            .sort((a, b) => {
              const routeA = routeResults.find(r => r.listingId === a.id);
              const routeB = routeResults.find(r => r.listingId === b.id);
              
              if (routeA && routeB) {
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
            .map((listing, index) => {
              const routeResult = routeResults.find(r => r.listingId === listing.id);
              const isFavorited = favoriteListings.some(fav => fav.id === listing.id);
              const hasAlternatives = routeResult?.alternatives && routeResult.alternatives.length > 0;
              
              return (
                <div 
                  key={listing.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1"
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
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold text-gray-700">
                      ${convertPrice(listing.price)}/mo
                    </div>
                    <button 
                      className={`absolute top-2 left-2 p-2 rounded-full transition-all cursor-pointer ${
                        isFavorited ? 'bg-red-500 text-white' : 'bg-white text-gray-500 hover:text-red-500'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteToggle && onFavoriteToggle(listing);
                      }}
                    >
                      <Heart size={18} className={isFavorited ? 'fill-current' : ''} />
                    </button>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-bold text-gray-800">{listing.title}</div>
                        <div className="text-gray-500 text-sm">{listing.location} · 0.5 miles from campus</div>
                      </div>
                      <div className="flex items-center text-amber-500">
                        <Star size={16} className="fill-current" />
                        <span className="ml-1 text-sm font-medium">{listing.rating || '4.2'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Calendar size={14} className="mr-1" />
                      <span>{listing.dateRange || 'Available now'}</span>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-700">
                      <BedDouble size={14} className="mr-1" />
                      <span>{listing.bedrooms} bedroom{listing.bedrooms !== 1 ? 's' : ''} · {listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {/* Enhanced Commute Info */}
                    <div className="mt-3 p-3 rounded-lg border">
                      {routeResult ? (
                        <div className="bg-blue-50 border-blue-200">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <div className="flex items-center gap-2">
                              {getTransportIcon(routeResult.transportMode)}
                              <span className="font-medium text-blue-800">
                                {routeResult.duration} {getTransportModeLabel(routeResult.transportMode).toLowerCase()}
                              </span>
                            </div>
                            <span className="text-blue-600 text-xs">
                              {routeResult.distance}
                            </span>
                          </div>
                          
                          {/* Transit-specific details */}
                          {routeResult.transportMode === 'transit' && routeResult.transitDetails && (
                            <div className="text-xs text-blue-700 mb-1">
                              {routeResult.transitDetails.departureTime && (
                                <div>🚌 Next departure: {routeResult.transitDetails.departureTime}</div>
                              )}
                              {routeResult.transitDetails.totalFare && (
                                <div>💰 Fare: {routeResult.transitDetails.totalFare}</div>
                              )}
                            </div>
                          )}
                          
                          {/* Alternatives indicator */}
                          {hasAlternatives && (
                            <div className="text-xs text-blue-600 flex items-center gap-1">
                              <Route size={10} />
                              <span>{routeResult.alternatives.length} alternative route{routeResult.alternatives.length > 1 ? 's' : ''} available</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-50 border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">
                              📍 Click "Show Enhanced Commute" to calculate route
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Amenities */}
                    {listing.amenities && listing.amenities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {listing.amenities.slice(0, 2).map((amenity, index) => (
                          <div key={index} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-md">
                            {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                          </div>
                        ))}
                        {listing.amenities.length > 2 && (
                          <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
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
      </div>
    </div>
  );
};

export default EnhancedCommuteResultsMap;