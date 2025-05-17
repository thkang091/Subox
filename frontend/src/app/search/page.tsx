"use client"


import React, { useState } from 'react';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Tv, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn
} from 'lucide-react';

// Component for the sublease search interface
const SearchPage = () => {
  // =========================
  // State Definitions
  // =========================
  const [dateRange, setDateRange] = useState({ checkIn: null, checkOut: null });
  const [guestCount, setGuestCount] = useState(1);
  const [bedrooms, setBedrooms] = useState(1);
  const [location, setLocation] = useState('');
  const [commuteLocation, setCommuteLocation] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDates, setSelectedDates] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [accommodationType, setAccommodationType] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: 500, max: 2000 });
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // =========================
  // Mock Data
  // =========================
  const featuredListings = [
    {
      id: 1,
      title: "Modern Studio near Campus",
      location: "Dinkytown",
      price: 950,
      distance: 0.3,
      dateRange: "Jun 1 - Aug 31",
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
      bedrooms: 1,
      bathrooms: 1,
      image: "/api/placeholder/800/500",
      rating: 4.9,
      reviews: 32,
      amenities: ['wifi', 'furnished', 'utilities', 'ac']
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
    if (type === 'min') {
      setPriceRange({ ...priceRange, min: value });
    } else {
      setPriceRange({ ...priceRange, max: value });
    }
  };

  // Reset all search fields
  const resetSearch = () => {
    setDateRange({ checkIn: null, checkOut: null });
    setGuestCount(1);
    setBedrooms(1);
    setLocation('');
    setCommuteLocation('');
    setSelectedDates([]);
    setAccommodationType(null);
    setPriceRange({ min: 500, max: 2000 });
    setSelectedAmenities([]);
  };

  // Handle search
  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      setSearchResults(featuredListings);
      setIsSearching(false);
      setActiveSection(null);
    }, 1000);
  };

  // Handle saving a search
  const saveSearch = () => {
    const newSavedSearch = {
      id: Date.now(),
      location: location,
      dateRange: dateRange,
      guests: guestCount,
      bedrooms: bedrooms
    };
    
    setSavedSearches([...savedSearches, newSavedSearch]);
  };

  // Check if any search criteria is set
  const hasSearchCriteria = () => {
    return (
      dateRange.checkIn !== null || 
      dateRange.checkOut !== null || 
      guestCount > 1 || 
      bedrooms > 1 || 
      location !== '' || 
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
                className={`p-3 rounded-lg border cursor-pointer transition ${location === loc ? 'bg-indigo-50 border-indigo-300' : 'hover:bg-gray-50'}`}
                onClick={() => setLocation(loc)}
              >
                <div className="font-medium">{loc}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-gray-800">Commute Location (Optional)</h3>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Enter your commute destination" 
              className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition"
              value={commuteLocation}
              onChange={(e) => setCommuteLocation(e.target.value)}
            />
            <div className="absolute right-3 top-3 text-gray-400">
              <button className="hover:text-indigo-600">
                <Search size={18} />
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            Add your school or work location to find places with an easy commute
          </div>
          
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
          className="px-3 py-1.5 text-indigo-600 hover:underline"
          onClick={() => setActiveSection(null)}
        >
          Cancel
        </button>
        <button 
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
          onClick={() => setActiveSection(null)}
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
        <div className="flex-1">
          <div className="flex justify-between mb-4 items-center">
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
                <div key={i} className="text-center text-sm font-medium text-gray-500">
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
                      h-12 flex items-center justify-center rounded-lg cursor-pointer relative
                      ${!day ? 'text-gray-300 cursor-default' : 'hover:bg-gray-100'}
                      ${isToday ? 'border border-gray-300' : ''}
                      ${isSelected && !isCheckIn && !isCheckOut ? 'bg-indigo-100 text-indigo-800' : ''}
                      ${isCheckIn ? 'bg-indigo-600 text-white' : ''}
                      ${isCheckOut ? 'bg-indigo-600 text-white' : ''}
                    `}
                    onClick={() => day && handleDateClick(day)}
                  >
                    {day}
                    {isCheckIn && (
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-white">
                        In
                      </div>
                    )}
                    {isCheckOut && (
                      <div className="absolute bottom-0 left-0 right-0 text-center text-xs text-white">
                        Out
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <h3 className="font-medium mb-3 text-gray-800">Your Selection</h3>
            <div className="flex items-center space-x-3">
              <div className="bg-white p-3 rounded-lg border flex-1">
                <div className="text-xs text-gray-500">Check-in</div>
                <div className="font-medium">
                  {dateRange.checkIn 
                    ? formatDate(dateRange.checkIn) 
                    : 'Select date'}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
              <div className="bg-white p-3 rounded-lg border flex-1">
                <div className="text-xs text-gray-500">Check-out</div>
                <div className="font-medium">
                  {dateRange.checkOut 
                    ? formatDate(dateRange.checkOut) 
                    : 'Select date'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-2 space-y-3">
            <button className="w-full p-3 border border-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition">
              <Calendar size={18} className="mr-2" />
              <span>Available Now</span>
            </button>
            
            <button className="w-full p-3 border border-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition">
              <Calendar size={18} className="mr-2" />
              <span>Summer Semester (May-Aug)</span>
            </button>
            
            <button className="w-full p-3 border border-indigo-200 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition">
              <Calendar size={18} className="mr-2" />
              <span>Fall Semester (Aug-Dec)</span>
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end items-center space-x-3">
        <button 
          className="px-3 py-1.5 text-indigo-600 hover:underline"
          onClick={() => setActiveSection(null)}
        >
          Cancel
        </button>
        <button 
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
          onClick={() => setActiveSection(null)}
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
                <div className="font-medium">Bedrooms</div>
                <div className="text-sm text-gray-500">How many bedrooms do you need?</div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  className={`w-8 h-8 rounded-full border border-indigo-300 flex items-center justify-center ${bedrooms > 1 ? 'text-indigo-600' : 'text-gray-300'}`}
                  onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                  disabled={bedrooms <= 1}
                >
                  -
                </button>
                <span className="text-lg font-medium w-6 text-center">{bedrooms}</span>
                <button 
                  className="w-8 h-8 rounded-full border border-indigo-300 flex items-center justify-center text-indigo-600"
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
                <div className="font-medium">Residents</div>
                <div className="text-sm text-gray-500">Total number of people</div>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  className={`w-8 h-8 rounded-full border border-indigo-300 flex items-center justify-center ${guestCount > 1 ? 'text-indigo-600' : 'text-gray-300'}`}
                  onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                  disabled={guestCount <= 1}
                >
                  -
                </button>
                <span className="text-lg font-medium w-6 text-center">{guestCount}</span>
                <button 
                  className="w-8 h-8 rounded-full border border-indigo-300 flex items-center justify-center text-indigo-600"
                  onClick={() => setGuestCount(guestCount + 1)}
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
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${accommodationType === 'entire' ? 'border-indigo-300 bg-indigo-50' : ''}`}
              onClick={() => setAccommodationType('entire')}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${accommodationType === 'entire' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Home size={20} />
                </div>
                <div>
                  <div className="font-medium">Entire Place</div>
                  <div className="text-sm text-gray-500 mt-1">Have the entire place to yourself</div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${accommodationType === 'private' ? 'border-indigo-300 bg-indigo-50' : ''}`}
              onClick={() => setAccommodationType('private')}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${accommodationType === 'private' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Home size={20} />
                </div>
                <div>
                  <div className="font-medium">Private Room</div>
                  <div className="text-sm text-gray-500 mt-1">Your own bedroom, shared common spaces</div>
                </div>
              </div>
            </div>
            
            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${accommodationType === 'shared' ? 'border-indigo-300 bg-indigo-50' : ''}`}
              onClick={() => setAccommodationType('shared')}
            >
              <div className="flex items-start">
                <div className={`p-2 rounded-lg mr-3 ${accommodationType === 'shared' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'}`}>
                  <Users size={20} />
                </div>
                <div>
                  <div className="font-medium">Shared Room</div>
                  <div className="text-sm text-gray-500 mt-1">Share a bedroom with others</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end items-center space-x-3">
        <button 
          className="px-3 py-1.5 text-indigo-600 hover:underline"
          onClick={() => setActiveSection(null)}
        >
          Cancel
        </button>
        <button 
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
          onClick={() => setActiveSection(null)}
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
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Monthly Rent</span>
                <span className="text-sm font-medium text-gray-700">${priceRange.min} - ${priceRange.max}</span>
              </div>
              
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div 
                    className="absolute h-2 bg-indigo-500 rounded-full"
                    style={{
                      left: `${((priceRange.min - 500) / 1500) * 100}%`,
                      right: `${100 - ((priceRange.max - 500) / 1500) * 100}%`
                    }}
                  ></div>
                </div>
                
                <input 
                  type="range" 
                  min="500" 
                  max="2000" 
                  step="50"
                  value={priceRange.min}
                  onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
                  className="absolute top-0 h-2 w-full appearance-none bg-transparent pointer-events-none"
                />
                
                <input 
                  type="range" 
                  min="500" 
                  max="2000" 
                  step="50"
                  value={priceRange.max}
                  onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                  className="absolute top-0 h-2 w-full appearance-none bg-transparent pointer-events-none"
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
                    min="500"
                    max={priceRange.max - 50}
                    step="50"
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange('min', parseInt(e.target.value))}
                    className="p-2 pl-7 sm:text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-24"
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
                    min={priceRange.min + 50}
                    max="2000"
                    step="50"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange('max', parseInt(e.target.value))}
                    className="p-2 pl-7 sm:text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-24"
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
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
                onClick={() => toggleAmenity(amenity.id)}
              >
                <div className={`p-1 rounded-md mr-2 ${
                  selectedAmenities.includes(amenity.id)
                    ? 'bg-indigo-100'
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
          className="text-indigo-600 text-sm font-medium hover:underline flex items-center"
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
            className="px-3 py-1.5 text-indigo-600 hover:underline"
            onClick={() => setActiveSection(null)}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium"
            onClick={() => setActiveSection(null)}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );

  // Saved Searches Sidebar
  const renderSavedSearchesSidebar = () => (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg">Saved Searches</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {savedSearches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bookmark size={40} className="mx-auto mb-2 opacity-50" />
            <p>No saved searches yet</p>
            <p className="text-sm mt-2">Save your search criteria for quick access later</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map(search => (
              <div key={search.id} className="border rounded-lg p-3 hover:shadow-md transition cursor-pointer">
                <div className="font-medium">{search.location || 'Any location'}</div>
                <div className="text-sm text-gray-500">
                  {search.dateRange.checkIn ? formatDate(search.dateRange.checkIn) : 'Any dates'} 
                  {search.dateRange.checkOut ? ` - ${formatDate(search.dateRange.checkOut)}` : ''}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {search.guests} guest{search.guests !== 1 ? 's' : ''}, {search.bedrooms} bedroom{search.bedrooms !== 1 ? 's' : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Featured Listings Section
  const renderFeaturedListings = () => (
    <div className="w-full max-w-7xl mx-auto px-4 mt-12 mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-600">Featured Subleases</h2>
        <a href="#" className="text-indigo-600 hover:underline font-medium">View all</a>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {featuredListings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-1">
            <div 
              className="h-48 bg-gray-200 relative" 
              style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
            >
              <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold">
                ${listing.price}/mo
              </div>
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
                  <div key={index} className="bg-indigo-50 text-indigo-700 text-xs px-2 py-1 rounded-md flex items-center">
                    {getAmenityIcon(amenity)}
                    <span className="ml-1">{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Neighborhoods Section
  const renderNeighborhoods = () => (
    <div className="bg-gray-50 py-16">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">Popular Neighborhoods</h2>
        
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
    <div className="bg-white py-16">
      <div className="w-full max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">How It Works</h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Finding your perfect sublease is easy with our simple three-step process</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <Search size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Search</h3>
            <p className="text-gray-600">Use our advanced filters to find subleases that match your exact needs</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <Home size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Connect</h3>
            <p className="text-gray-600">Message subleasers directly and schedule viewings</p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-4">
              <Users size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Move In</h3>
            <p className="text-gray-600">Sign your sublease agreement and get ready to move in</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Footer
  const renderFooter = () => (
    <footer className="bg-gray-800 text-white py-12">
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">CampusSubleases</h3>
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
      {/* Top Navigation */}
      <nav className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="font-bold text-xl">CampusSubleases</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg font-medium transition">
                List Your Space
              </button>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition"
              >
                <Bookmark size={20} />
              </button>
              <button className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition">
                <LogIn size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Saved Searches Sidebar */}
      {renderSavedSearchesSidebar()}
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-indigo-700 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-24 flex flex-col items-center text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Find Your Perfect Sublease Near Campus</h1>
          <p className="text-xl max-w-2xl opacity-90 mb-10">
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
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'location' ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('location')}
            >
              <div className="flex items-center">
                <MapPin className="mr-2 text-indigo-600" size={18} />
                <div>
                  <div className="font-medium text-sm text-gray-500">Location</div>
                  <div className={`font-semibold ${location ? 'text-gray-800' : 'text-gray-400'}`}>
                    {location || 'Where are you looking?'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Dates */}
            <div 
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'dates' ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('dates')}
            >
              <div className="flex items-center">
                <Calendar className="mr-2 text-indigo-600" size={18} />
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
            
            {/* Guests & Bedrooms */}
            <div 
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'rooms' ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('rooms')}
            >
              <div className="flex items-center">
                <BedDouble className="mr-2 text-indigo-600" size={18} />
                <div>
                  <div className="font-medium text-sm text-gray-500">Rooms</div>
                  <div className="font-semibold text-gray-800">
                    {bedrooms} bedroom{bedrooms !== 1 ? 's' : ''}, {guestCount} person{guestCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Filters */}
            <div 
              className={`flex-1 p-3 rounded-lg cursor-pointer transition-all ${activeSection === 'filters' ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50 border border-transparent'}`}
              onClick={() => toggleSection('filters')}
            >
              <div className="flex items-center">
                <Filter className="mr-2 text-indigo-600" size={18} />
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
              className="p-4 rounded-lg text-white flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 transition ml-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
        
        {/* Quick Filters Section */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-gray-800">Quick Filters</h2>
            
            {/* Save Search Button */}
            <button 
              className="flex items-center px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              onClick={saveSearch}
            >
              <Bookmark size={18} className="mr-2" />
              <span className="font-medium">Save this search</span>
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center">
              <Calendar size={16} className="mr-1.5" />
              Available Now
            </button>
            <button className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center">
              <Users size={16} className="mr-1.5" />
              Pet Friendly
            </button>
            <button className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center">
              <Home size={16} className="mr-1.5" />
              Furnished
            </button>
            <button className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center">
              <DollarSign size={16} className="mr-1.5" />
              Utilities Included
            </button>
            <button className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center">
              <MapPin size={16} className="mr-1.5" />
              Parking
            </button>
            <button className="px-4 py-2 rounded-full border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition flex items-center">
              <Droplets size={16} className="mr-1.5" />
              Laundry
            </button>
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
      `}</style>
    </div>
  );
};

export default SearchPage;