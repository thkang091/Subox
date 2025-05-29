"use client"


import React, { useState, useEffect } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Tv, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, CircleUser
} from 'lucide-react';

// Component for the sublease search interface
const SearchPage = () => {
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
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');

  // =========================
  // Mock Data
  // =========================

  //added availableFrom, availableTo, and accommodationType
  const featuredListings = [
    {
      id: 1,
      title: "Modern Studio near Campus",
      location: "Dinkytown",
      price: 950,
      distance: 0.3,
      dateRange: "Jun 1 - Aug 31",
      availableFrom: new Date(2025, 5, 1), // June 1
      availableTo: new Date(2025, 7, 31), // August 31
      accommodationType: 'entire',
      bedrooms: 1,
      bathrooms: 1,
      image: "/api/placeholder/800/500",
      rating: 4.8,
      reviews: 24,
      amenities: ['wifi', 'laundry', 'furnished']
    },
    {
      id: 2,
      title: "Spacious 2BR with River View",
      location: "East Bank",
      price: 1450,
      distance: 0.7,
      dateRange: "May 15 - Sep 15",
      availableFrom: new Date(2025, 4, 15),
      availableTo: new Date(2025, 8, 15),
      accommodationType: 'entire',
      bedrooms: 2,
      bathrooms: 1,
      image: "/api/placeholder/800/500",
      rating: 4.6,
      reviews: 18,
      amenities: ['wifi', 'parking', 'laundry', 'ac']
    },
    {
      id: 3,
      title: "Cozy Apartment with Balcony",
      location: "Stadium Village",
      price: 1100,
      distance: 0.5,
      dateRange: "Jun 15 - Aug 15",
      availableFrom: new Date(2025, 5, 15),
      availableTo: new Date(2025, 7, 15),
      accommodationType: 'entire',
      bedrooms: 1,
      bathrooms: 1,
      image: "/api/placeholder/800/500",
      rating: 4.9,
      reviews: 32,
      amenities: ['wifi', 'furnished', 'utilities', 'ac']
    },
    {
      id: 4,
      title: "Private Room in Shared House",
      location: "Como",
      price: 600,
      distance: 1.2,
      dateRange: "Available Now",
      availableFrom: new Date(),
      availableTo: new Date(2025, 11, 31),
      bedrooms: 1,
      bathrooms: 1,
      accommodationType: 'private',
      image: "/api/placeholder/800/500",
      rating: 4.5,
      reviews: 12,
      amenities: ['wifi', 'utilities', 'parking']
    },
    {
      id: 5,
      title: "Luxury 3BR Apartment",
      location: "East Bank",
      price: 1800,
      distance: 0.8,
      dateRange: "Jul 1 - Dec 31",
      availableFrom: new Date(2025, 6, 1),
      availableTo: new Date(2025, 11, 31),
      bedrooms: 3,
      bathrooms: 2,
      accommodationType: 'entire',
      image: "/api/placeholder/800/500",
      rating: 4.9,
      reviews: 8,
      amenities: ['wifi', 'parking', 'laundry', 'ac', 'gym', 'furnished']
    },
    {
      id: 6,
      title: "Budget-Friendly Studio",
      location: "Stadium Village",
      price: 700,
      distance: 0.6,
      dateRange: "Jun 1 - Aug 31",
      availableFrom: new Date(2025, 5, 1),
      availableTo: new Date(2025, 7, 31),
      bedrooms: 1,
      bathrooms: 1,
      accommodationType: 'entire',
      image: "/api/placeholder/800/500",
      rating: 4.3,
      reviews: 15,
      amenities: ['wifi', 'utilities']
    },
    {
      id: 7,
      title: "Shared Room Near Library",
      location: "Dinkytown",
      price: 450,
      distance: 0.2,
      dateRange: "Available Now",
      availableFrom: new Date(),
      availableTo: new Date(2025, 11, 31),
      bedrooms: 1,
      bathrooms: 1,
      accommodationType: 'shared',
      image: "/api/placeholder/800/500",
      rating: 4.1,
      reviews: 20,
      amenities: ['wifi', 'utilities', 'laundry']
    },
    {
      id: 8,
      title: "Pet-Friendly 2BR House",
      location: "Como",
      price: 1600,
      distance: 1.5,
      dateRange: "May 1 - Oct 31",
      availableFrom: new Date(2025, 4, 1),
      availableTo: new Date(2025, 9, 31),
      bedrooms: 2,
      bathrooms: 2,
      accommodationType: 'entire',
      image: "/api/placeholder/800/500",
      rating: 4.7,
      reviews: 28,
      amenities: ['wifi', 'parking', 'laundry', 'pets', 'furnished', 'ac']
    }
  ];

  const neighborhoods = [
    { name: 'Dinkytown', description: 'Historic student area with cafes and shops', count: 32, image: '/api/placeholder/400/200' },
    { name: 'Stadium Village', description: 'Close to sports venues and campus', count: 28, image: '/api/placeholder/400/200' },
    { name: 'Como', description: 'Quiet residential area near campus', count: 15, image: '/api/placeholder/400/200' }
  ];

  // =========================
  // Helper Functions
  // =========================

  useEffect(() => {
    setSearchResults([...featuredListings]);
  }, []);

  // location toggle function
  const toggleLocation = (loc) => {
    if (location.includes(loc)) {
      // if the location already selected, cancel it
      setLocation(location.filter(item => item !== loc));
    } else {
      // if the location not already selected, add it
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
  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  // Handle amenity selection
  const toggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter(a => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
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
  // Reset all search fields
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
    //show all listings
    setSearchResults(featuredListings); 
  };

  // Handle search
  const handleSearch = () => {
    setIsSearching(true);
    
    // filtering logic
    setTimeout(() => {
      let filtered = [...featuredListings];

      //for debug
      console.log('Starting with listings:', filtered.length); 
      
      // location filter
      if (location.length > 0) {
        filtered = filtered.filter(listing => location.includes(listing.location));
        console.log('After location filter:', filtered.length); //for debug
      }
      
      // date filter
      if (dateRange.checkIn && dateRange.checkOut) {
        filtered = filtered.filter(listing => {
          // filter when there are availableFrom and availableTo
          if (listing.availableFrom && listing.availableTo) {
            return listing.availableFrom <= dateRange.checkIn && 
                  listing.availableTo >= dateRange.checkOut;
          }
          return true;
        });
        console.log('After date filter:', filtered.length); // for debug
      }
        
      // accommodation type filter
      if (accommodationType) {
        filtered = filtered.filter(listing => listing.accommodationType === accommodationType);
        console.log('After accommodation type filter:', filtered.length); // for debug
      }
      
      // number of bedroom filter 
      if (bedrooms > 1) {
        filtered = filtered.filter(listing => listing.bedrooms === bedrooms);
        console.log('After exact bedrooms filter:', filtered.length); // for debug
      }
      
      // number of bathroom filter 
      if (bathrooms > 1) {
        filtered = filtered.filter(listing => listing.bathrooms === bathrooms);
        console.log('After exact bathrooms filter:', filtered.length); // for debug
      }
      
      // price range
      filtered = filtered.filter(listing => 
        listing.price >= priceRange.min && listing.price <= priceRange.max
      );
      console.log('After price filter:', filtered.length);
      
      // amenities filter
      if (selectedAmenities.length > 0) {
        filtered = filtered.filter(listing => {
          if (!listing.amenities) return false;
          return selectedAmenities.every(amenity => listing.amenities.includes(amenity));
        });
        console.log('After amenities filter:', filtered.length);
      }
      
      console.log('Final filtered listings:', filtered.length);
      setSearchResults(filtered);
      setIsSearching(false);
      setActiveSection(null);
    }, 1000);
  };

  // Handle saving a search
  const saveSearch = () => {
    const newSavedSearch = {
      id: Date.now(),
      location: [...location],
      dateRange: dateRange,
      bathrooms: bathrooms,
      bedrooms: bedrooms
    };
    
    setSavedSearches([newSavedSearch, ...savedSearches]);
  };

  // Apply saved search
  const applySavedSearch = (search) => {
    setLocation(search.location || []);
    setDateRange(search.dateRange || { checkIn: null, checkOut: null });
    setBathrooms(search.bathrooms || 1);
    setBedrooms(search.bedrooms || 1);
    
    // Trigger search with the applied filters
    setTimeout(() => handleSearch(), 100);
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

  // =========================
  // Render Components
  // =========================

  // Location Section
  const renderLocationSection = () => (
    <div className="p-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Campus Neighborhoods</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Dinkytown', 'East Bank', 'Stadium Village', 'Como', 'Other'].map((loc) => (
              <div 
                key={loc}
                className={`p-3 rounded-lg border cursor-pointer transition ${location.includes(loc) ? 'bg-orange-50 border-orange-200' : 'hover:bg-gray-50'}`}
                onClick={() => toggleLocation(loc)}
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
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Commute Location (Optional)</h3>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-orange-900" size={18} />
            <input 
              type="text" 
              placeholder="Enter your commute destination" 
              className="w-full p-3 pl-10 border rounded-lg text-gray-700 focus:ring-2 focus:ring-orange-700 focus:border-orange-400 outline-none transition"
              value={commuteLocation}
              onChange={(e) => setCommuteLocation(e.target.value)}
            />
            <div className="absolute right-3 top-3 text-orange-900">
              <button className="hover:text-orange-500 cursor-pointer">
                <Search size={20} />
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Add your school or work location to find places with an easy commute
          </div>
          
          {/* show selected location */}
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
          
          <div className="mt-6 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600 mr-3 mt-1">
                <Users size={16} />
              </div>
              <div>
                <h4 className="font-medium text-blue-800">Pro Tip: Roommate Matching</h4>
                <p className="text-sm text-blue-700 mt-1">Looking for roommates? Check the "Roommate Matching" option in filters to find people to share with!</p>
              </div>
            </div>
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

  // Calendar/Dates Section
  const renderCalendarSection = () => (
    <div className="p-5 border-t border-gray-200 animate-fadeIn">
      <div className="flex flex-col md:flex-row items-start gap-6">
        <div className="w-full md:w-1/2 lg:w-3/5">
          <div className="flex justify-between mb-4 items-center text-gray-900">
            <button 
              onClick={goToPreviousMonth} 
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1 text-center font-bold">
              {monthNames[currentMonth]} {currentYear}
            </div>
            <button 
              onClick={goToNextMonth} 
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          
          <div className="mb-6">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-sm font-medium text-gray-600">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1 text-gray-400">
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
                      h-8 sm:h-10 md:h-12 flex items-center justify-center rounded-lg cursor-pointer relative
                      ${!day ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100'}
                      ${isToday ? 'border border-gray-300' : ''}
                      ${isSelected && !isCheckIn && !isCheckOut ? 'bg-orange-100 text-orange-800' : ''}
                      ${isCheckIn ? 'bg-orange-500 text-white' : ''}
                      ${isCheckOut ? 'bg-orange-500 text-white' : ''}
                    `}
                    onClick={() => day && handleDateClick(day)}
                  >
                    {day}
                    {isCheckIn && (
                      //In
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-white hidden sm:block">
                        
                      </div>
                    )}
                    {isCheckOut && (
                      //Out
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-white hidden sm:block">
                      
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col">
          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="font-medium mb-2 sm:mb-3 text-gray-800">Your Selection</h3>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="bg-white p-2 sm:p-3 rounded-lg border flex-1">
                <div className="text-xs text-gray-500">Check-in</div>
                <div className="font-semibold text-sm sm:text-base text-gray-600">
                  {dateRange.checkIn 
                    ? formatDate(dateRange.checkIn) 
                    : 'Select date'}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
              <div className="bg-white p-2 sm:p-3 rounded-lg border flex-1">
                <div className="text-xs text-gray-500">Check-out</div>
                <div className="font-semibold text-sm sm:text-base text-gray-600">
                  {dateRange.checkOut 
                    ? formatDate(dateRange.checkOut) 
                    : 'Select date'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-2 space-y-2 sm:space-y-3">
            <button 
              onClick={setAvailableNow}
              className="w-full p-2 sm:p-3 border border-orange-200 text-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-50 transition text-sm sm:text-base"
            >
              <Calendar size={16} className="mr-2 flex-shrink-0" />
              <span>Available Now (Two weeks)</span>
            </button>
            
            <button 
              onClick={setSummerSemester}
              className="w-full p-2 sm:p-3 border border-orange-200 text-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-50 transition text-sm sm:text-base"
            >
              <Calendar size={16} className="mr-2 flex-shrink-0" />
              <span>Summer Semester (May-Aug)</span>
            </button>
            
            <button 
              onClick={setFallSemester}
              className="w-full p-2 sm:p-3 border border-orange-200 text-orange-500 rounded-lg flex items-center justify-center hover:bg-orange-50 transition text-sm sm:text-base"
            >
              <Calendar size={16} className="mr-2 flex-shrink-0" />
              <span>Fall Semester (Aug-Dec)</span>
            </button>
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
          Apply Dates
        </button>
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
        
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Accommodation Type</h3>
          <div className="space-y-3">
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${accommodationType === 'entire' ? 'border-orange-500 bg-orange-50' : ''}`}
              onClick={() => setAccommodationType('entire')}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${accommodationType === 'entire' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                  <Home size={20} />
                </div>
                <div>
                  <div className="font-medium text-gray-600">Entire Place</div>
                  <div className="text-sm text-gray-500 mt-1">Have the entire place to yourself</div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${accommodationType === 'private' ? 'border-orange-500 bg-orange-50' : ''}`}
              onClick={() => setAccommodationType('private')}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${accommodationType === 'private' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                  <Home size={20} />
                </div>
                <div>
                  <div className="font-medium text-gray-600">Private Room</div>
                  <div className="text-sm text-gray-500 mt-1">Your own bedroom, shared common spaces</div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${accommodationType === 'shared' ? 'border-orange-500 bg-orange-50' : ''}`}
              onClick={() => setAccommodationType('shared')}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${accommodationType === 'shared' ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-500'}`}>
                  <Users size={20} />
                </div>
                <div>
                  <div className="font-medium text-gray-600">Shared Room</div>
                  <div className="text-sm text-gray-500 mt-1">Share a bedroom with others</div>
                </div>
              </div>
            </div>
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
  const renderFiltersSection = () => (
    <div className="p-5 border-t border-gray-200 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Price Range</h3>
          <div className="p-4 border rounded-lg">
            {/* price type */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Price Type</div>
              <div className="flex space-x-2">
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${priceType === 'monthly' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setPriceType('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${priceType === 'weekly' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setPriceType('weekly')}
                >
                  Weekly
                </button>
                <button 
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${priceType === 'daily' ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => setPriceType('daily')}
                >
                  Daily
                </button>
              </div>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {priceType.charAt(0).toUpperCase() + priceType.slice(1)} Rent
                </span>
                <span className="text-sm font-medium text-gray-700">
                  ${convertPrice(priceRange.min, priceType)} - ${convertPrice(priceRange.max, priceType)}
                </span>
              </div>
              
              <div className="relative mt-6 mb-8">
                <div className="h-2 bg-gray-200 rounded-full relative">
                  {/* show selected range*/}
                  <div 
                    className="absolute h-2 bg-gradient-to-r from-orange-300 to-orange-500 rounded-full transition-all duration-200"
                    style={{
                      left: `${Math.max(0, ((priceRange.min - 500) / (2000 - 500)) * 100)}%`,
                      width: `${Math.max(0, ((priceRange.max - priceRange.min) / (2000 - 500)) * 100)}%`
                    }}
                  ></div>
                </div>
                
                {/* min slider */}
                <input 
                  type="range" 
                  min="500" 
                  max="2000" 
                  step="50"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange('min', e.target.value)}
                  className="absolute top-0 h-2 w-full appearance-none bg-transparent cursor-pointer slider-thumb slider-min"
                  style={{ zIndex: priceRange.min > priceRange.max - 100 ? 2 : 1 }}
                />
                
                {/* max slider */}
                <input 
                  type="range" 
                  min="500" 
                  max="2000" 
                  step="50"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange('max', e.target.value)}
                  className="absolute top-0 h-2 w-full appearance-none bg-transparent cursor-pointer slider-thumb"
                  style={{ zIndex: priceRange.max < priceRange.min + 100 ? 2 : 1 }}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-sm text-gray-700">Min</label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min={priceType === 'monthly' ? 500 : priceType === 'weekly' ? 125 : 17}
                    max={priceType === 'monthly' ? 1950 : priceType === 'weekly' ? 487 : 65}
                    step={priceType === 'monthly' ? 50 : priceType === 'weekly' ? 12 : 1}
                    value={convertPrice(priceRange.min, priceType)}
                    onChange={(e) => {
                      // saved the price to monthly
                      const value = parseInt(e.target.value);
                      let monthlyValue;
                      
                      switch(priceType) {
                        case 'weekly':
                          monthlyValue = value * 4;
                          break;
                        case 'daily':
                          monthlyValue = value * 30;
                          break;
                        default:
                          monthlyValue = value;
                      }
                      
                      handlePriceChange('min', monthlyValue);
                    }}
                    className="p-2 pl-7 sm:text-sm border border-gray-300 rounded-md focus:ring-[#15361F] focus:border-[#15361F] w-24 text-gray-700"
                  />
                </div>
              </div>
              
              <div className="text-gray-500">to</div>
              
              <div>
                <label className="font-medium text-sm text-gray-700">Max</label>
                <div className="mt-1 relative rounded-md">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    min={priceType === 'monthly' ? 550 : priceType === 'weekly' ? 137 : 18}
                    max={priceType === 'monthly' ? 2000 : priceType === 'weekly' ? 500 : 67}
                    step={priceType === 'monthly' ? 50 : priceType === 'weekly' ? 12 : 1}
                    value={convertPrice(priceRange.max, priceType)}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      let monthlyValue;
                      
                      switch(priceType) {
                        case 'weekly':
                          monthlyValue = value * 4;
                          break;
                        case 'daily':
                          monthlyValue = value * 30;
                          break;
                        default:
                          monthlyValue = value;
                      }
                      
                      handlePriceChange('max', monthlyValue);
                    }}
                    className="p-2 pl-7 sm:text-sm border border-gray-300 rounded-md focus:ring-[#15361F] focus:border-[#15361F] w-24 text-gray-700"
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
              { id: 'gym', label: 'Fitness Center', icon: <Users size={16} /> }
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
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <button 
          className="text-orange-500 text-sm font-medium hover:underline flex items-center"
          onClick={() => {
            setPriceRange({ min: 500, max: 2000 });
            setSelectedAmenities([]);
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

  // Featured Listings Section
  const renderFeaturedListings = () => {
    const displayListings = searchResults;
    const sectionTitle = hasSearchCriteria() ? 'Search Results' : 'All Subleases';

    return (
      <div className="w-full md:pl-16 px-4 mt-12 mb-16 md:pr-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-orange-600">
              {sectionTitle}
              {hasSearchCriteria() && ` (${displayListings.length} found)`}
            </h2>
            <button 
              onClick={resetSearch} 
              className="text-gray-700 hover:underline font-medium cursor-pointer"
            >
              View all
            </button>
          </div>
        
        {displayListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Home size={48} className="mx-auto mb-2 opacity-50" />
              <p className="text-lg">No listings found matching your criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters or search in different areas</p>
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
              <div key={listing.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1">
                <div 
                  className="h-48 bg-gray-200 relative" 
                  style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                >
                  {/*price*/}
                  <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold text-gray-700">
                    ${convertPrice(listing.price, priceType)}{getPriceUnit(priceType)}
                  </div>
                  {/*add favorites button*/}
                  <button 
                    className={`absolute top-2 left-2 p-2 rounded-full transition-all cursor-pointer ${
                      favoriteListings.some(item => item.id === listing.id) 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white text-gray-500 hover:text-red-500'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation(); // don't allow the card click event
                      toggleFavorite(listing);
                    }}
                  >
                    <Heart 
                      size={18} 
                      className={favoriteListings.some(item => item.id === listing.id) ? 'fill-current' : ''} 
                    />
                  </button>
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
                  
                  <div className="mt-3 flex flex-wrap gap-1">
                    {listing.amenities.map((amenity, index) => (
                      <div key={index} className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-md flex items-center">
                        {getAmenityIcon(amenity)}
                        <span className="ml-1">{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
                      </div>
                    ))}
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

  // Neighborhoods Section
  const renderNeighborhoods = () => (
    <div className="bg-gray-50 py-16 w-full md:pl-16 md:pl-0">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center text-orange-500">Popular Neighborhoods</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {neighborhoods.map((neighborhood, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl shadow-md group cursor-pointer">
              <div 
                className="h-64 bg-gray-200 transition-transform duration-500 group-hover:scale-110" 
                style={{backgroundImage: `url(${neighborhood.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-70"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h3 className="text-xl font-bold">{neighborhood.name}</h3>
                <p className="text-sm opacity-90 mb-2">{neighborhood.description}</p>
                <span className="text-xs font-medium bg-white bg-opacity-30 rounded-full px-2 py-1">
                  {neighborhood.count} subleases available
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // How It Works Section
  const renderHowItWorks = () => (
    <div className="bg-white py-16 w-full md:pl-16 md:pl-0">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4 text-center text-orange-500">How It Works</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Finding your perfect sublease is easy with our simple three-step process</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-600">Search</h3>
            <p className="text-gray-600">Use our advanced filters to find subleases that match your exact needs</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <Home size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-600">Connect</h3>
            <p className="text-gray-600">Message subleasers directly and schedule viewings</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2 text-gray-600">Move In</h3>
            <p className="text-gray-600">Sign your sublease agreement and get ready to move in</p>
          </div>
        </div>
      </div>
    </div>
  );

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
      {/* Navigation */}
        <nav className="fixed md:left-0 md:top-0 md:bottom-0 md:h-full md:w-16 w-full top-0 left-0 h-16 bg-orange-200 text-white shadow-lg z-50 md:flex md:flex-col">
          {/* top navigation for mobile */}
          <div className="w-full h-full flex items-center justify-between px-4 md:hidden">
            {/* logo */}
            <span className="font-bold text-lg">CampusSubleases</span>
            
            {/* mobile button group */}
            <div className="flex items-center space-x-4">
              <button
                title="Add New"
                className="group cursor-pointer outline-none hover:rotate-90 duration-300 p-2 rounded-lg hover:bg-orange-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  className="stroke-slate-100 fill-none group-hover:fill-orange-500 group-active:stroke-slate-200 group-active:fill-orange-900 group-active:duration-0 duration-300"
                >
                  <path
                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                    strokeWidth="1.5"
                  ></path>
                  <path d="M8 12H16" strokeWidth="1.5"></path>
                  <path d="M12 16V8" strokeWidth="1.5"></path>
                </svg>
              </button>
              
              <button 
                title = "Favorites"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-lg transition cursor-pointer hover:bg-orange-300"
              >
                <Heart size={20} />
              </button>
              
              <button 
                title = "Profile"
                className="p-2 rounded-lg transition cursor-pointer hover:bg-orange-300">
                <User size={20} />
              </button>
            </div>
          </div>
          
          {/* desktop navigation*/}
          <div className="hidden md:flex md:flex-col md:h-full">
            {/* logo and add new */}
            <div className="flex flex-col items-center">
              {/* logo */}
              <div className="font-bold text-xl mt-6 mb-4">
                CS
              </div>
              
              {/* Add New for desktop (left header) */}
              <button
                title="Add New"
                className="group cursor-pointer outline-none hover:rotate-90 duration-300 p-3 rounded-lg hover:bg-orange-300"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24px"
                  height="24px"
                  viewBox="0 0 24 24"
                  className="stroke-slate-100 fill-none group-hover:fill-orange-500 group-active:stroke-slate-200 group-active:fill-orange-900 group-active:duration-0 duration-300"
                >
                  <path
                    d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
                    strokeWidth="1.5"
                  ></path>
                  <path d="M8 12H16" strokeWidth="1.5"></path>
                  <path d="M12 16V8" strokeWidth="1.5"></path>
                </svg>
              </button>
            </div>
            
            {/* favorites and profile for desktop*/}
            <div className="mt-auto flex flex-col items-center space-y-4 mb-8">
              <button 
                title = "Favorites"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-3 rounded-lg hover:bg-orange-300 transition cursor-pointer"
              >
                <Heart size={20} />
              </button>
              
              <button 
                title = "Profile"
                className="p-3 rounded-lg hover:bg-orange-300 transition cursor-pointer">
                <User size={20} />
              </button>
            </div>
          </div>
        </nav>
      
      {/* Favorites Sidebar */}
      {renderFavoritesSidebar()}
      
      <div className="md:pl-16 pt-16 md:pt-0">
      {/* Hero Section */}
      <div className="relative bg-white-100 text-orange-500">
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-14 flex flex-col items-center text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Find Your Perfect Sublease Near Campus</h1>
          <p className="text-lg max-w-2xl mb-6 text-gray-700">
            Easily search for short-term student subleases. Find the right place with the amenities you need, when you need it.
          </p>
        </div>
      </div>
            
      {/* Main Search Container */}
      <div className="w-full max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        <div className="bg-white rounded-xl shadow-xl transition-all duration-300 overflow-hidden">
          {/* Search Controls */}
          <div className="flex flex-col md:flex-row md:items-center p-3 gap-2">
            {/* Location */}
            <div 
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'location' ? 'bg-gray-100 border border-gray-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('location')}
            >
              <div className="flex items-center">
                <MapPin className="mr-2 text-orange-500 flex-shrink-0" size={18} />
                <div>
                  <div className="font-medium text-sm text-gray-500">Location</div>
                  <div className={`font-semibold ${location.length > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
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
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'dates' ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('dates')}
            >
              <div className="flex items-center">
                <Calendar className="mr-2 text-orange-500 flex-shrink-0" size={18} />
                <div>
                  <div className="font-medium text-sm text-gray-500">Dates</div>
                  <div className={`font-semibold ${dateRange.checkIn ? 'text-gray-800' : 'text-gray-400'}`}>
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
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'rooms' ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('rooms')}
            >
              <div className="flex items-center">
                <BedDouble className="mr-2 text-orange-500 flex-shrink-0" size={18} />
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
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'filters' ? 'bg-orange-50 border border-orange-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('filters')}
            >
              <div className="flex items-center">
                <Filter className="mr-2 text-orange-500 flex-shrink-0" size={18} />
                <div>
                  <div className="font-medium text-sm text-gray-500">Filters</div>
                  <div className={`font-semibold ${selectedAmenities.length > 0 || priceRange.min !== 500 || priceRange.max !== 2000 ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selectedAmenities.length > 0 
                      ? `${selectedAmenities.length} filter${selectedAmenities.length !== 1 ? 's' : ''} applied` 
                      : 'Add filters'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Search Button */}
            <button 
              className="p-4 rounded-lg text-white flex items-center justify-center bg-orange-600 hover:bg-orange-500 transition ml-2 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleSearch}
              disabled={isSearching}
            >
              {isSearching ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Search size={20} className="mr-2" />
              )}
              <span className="font-medium">Search</span>
            </button>
            
            {/* Reset Button - Only show if search criteria exists */}
            {hasSearchCriteria() && (
              <button 
                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 transition"
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

        {/* Saved Searches Section */}
        <div className="mt-6 max-w-5xl mx-auto px-4 bg-white rounded-xl shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-black">Saved Searches</h2>
            
            {/* Save Search Button */}
            <button 
              className="flex items-center px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition-all"
              onClick={saveSearch}
              disabled={!hasSearchCriteria()}
            >
              <Bookmark size={18} className="mr-2" />
              <span className="font-medium">Save current search</span>
            </button>
          </div>
          
          {savedSearches.length === 0 ? (
            <div className="flex items-center justify-center py-4 text-gray-500">
              <Search size={20} className="mr-2 opacity-70" />
              <span>No saved searches yet. Search and save for quick access.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedSearches.map(search => (
                <div 
                  key={search.id}
                  className="border rounded-lg p-3 hover:shadow-md transition relative group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-gray-700">
                        {search.location && search.location.length > 0 
                          ? search.location.join(', ')
                          : 'Any location'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {search.dateRange.checkIn ? formatDate(search.dateRange.checkIn) : 'Any dates'} 
                        {search.dateRange.checkOut ? ` - ${formatDate(search.dateRange.checkOut)}` : ''}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {search.bedrooms} bedroom{search.bedrooms !== 1 ? 's' : ''}, {search.bathrooms} bathrooms{search.bathrooms !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <button 
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedSearch(search.id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <button 
                    onClick={() => applySavedSearch(search)}
                    className="mt-2 w-full py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>

      {/* Content Sections */}
      {renderFeaturedListings()}
      {renderNeighborhoods()}
      {renderHowItWorks()}
      {renderFooter()}
            
      {/* Global Styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }

        /* price slider */
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #D35400;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #D35400;
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .slider-thumb:focus {
          outline: none;
        }
        
        .slider-thumb:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(21, 54, 31, 0.2);
        }

        
      `}</style>
    </div>
  );
};

export default SearchPage;