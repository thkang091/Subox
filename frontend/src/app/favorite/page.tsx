"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, Package, Building, X, Search,
  MapPin, DollarSign, Calendar, ChevronLeft,
  Grid3X3, List, Filter, SlidersHorizontal
} from 'lucide-react';


// TypeScript interfaces
interface SaleItem {
  id: number;
  name: string;
  price: number;
  location: string;
  image: string;
  category: string;
  condition: string;
  postedDate: string;
}

interface SubleaseItem {
  id: number;
  title: string;
  price: number;
  location: string;
  image: string;
  bedrooms: number;
  bathrooms: number;
  startDate: string;
  endDate: string;
  amenities: string[];
}

const FavoritesPage = () => {
  // State
  const [activeTab, setActiveTab] = useState<'sales' | 'subleases'>('sales');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favoriteSales, setFavoriteSales] = useState<SaleItem[]>([]);
  const [favoriteSubleases, setFavoriteSubleases] = useState<SubleaseItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  
  const router = useRouter();

  // Load favorites from localStorage when component mounts
  useEffect(() => {
    setIsMounted(true);
    
    // Load favorite sales
    try {
      const savedSales = localStorage.getItem('favoriteSaleItems');
      if (savedSales) {
        setFavoriteSales(JSON.parse(savedSales));
      }
    } catch (error) {
      console.error('Error loading favorite sales from localStorage:', error);
    }
    
    // Load favorite subleases
    try {
      const savedSubleases = localStorage.getItem('favoriteSubleaseItems');
      if (savedSubleases) {
        setFavoriteSubleases(JSON.parse(savedSubleases));
      }
    } catch (error) {
      console.error('Error loading favorite subleases from localStorage:', error);
    }
  }, []);

  // Save to localStorage when favorites change
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('favoriteSaleItems', JSON.stringify(favoriteSales));
      } catch (error) {
        console.error('Error saving favorite sales to localStorage:', error);
      }
    }
  }, [favoriteSales, isMounted]);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('favoriteSubleaseItems', JSON.stringify(favoriteSubleases));
      } catch (error) {
        console.error('Error saving favorite subleases to localStorage:', error);
      }
    }
  }, [favoriteSubleases, isMounted]);

  // Remove item from favorites
  const removeSaleItem = (id: number) => {
    setFavoriteSales(favoriteSales.filter(item => item.id !== id));
  };

  const removeSubleaseItem = (id: number) => {
    setFavoriteSubleases(favoriteSubleases.filter(item => item.id !== id));
  };

  // Filter favorites based on search query and filters
  const filteredSales = favoriteSales.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.includes(item.category);
    const matchesLocation = selectedLocations.length === 0 || 
                           selectedLocations.includes(item.location);
    
    return matchesSearch && matchesPrice && matchesCategory && matchesLocation;
  });

  const filteredSubleases = favoriteSubleases.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
    const matchesLocation = selectedLocations.length === 0 || 
                           selectedLocations.includes(item.location);
    
    return matchesSearch && matchesPrice && matchesLocation;
  });

  // Categories for filter
  const categories = ['Furniture', 'Electronics', 'Books', 'Clothing', 'Kitchen', 'Decor'];
  
  // Locations
  const locations = ['Dinkytown', 'Eastbank', 'Westbank', 'Como', 'Marcy-holmes'];

  // Toggle category selection
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Toggle location selection
  const toggleLocation = (location: string) => {
    if (selectedLocations.includes(location)) {
      setSelectedLocations(selectedLocations.filter(l => l !== location));
    } else {
      setSelectedLocations([...selectedLocations, location]);
    }
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-12">
      <Heart size={64} className="mx-auto text-gray-300 mb-4" />
      <h3 className="text-xl font-medium text-gray-700 mb-2">
        {activeTab === 'sales' ? 'No saved sale items yet' : 'No saved subleases yet'}
      </h3>
      <p className="text-gray-500 mb-6 max-w-md mx-auto">
        {activeTab === 'sales' 
          ? 'Browse Move Out Sale listings and click the heart icon to save your favorite items here'
          : 'Browse Sublease listings and click the heart icon to save your favorite subleases here'
        }
      </p>
      <button
        onClick={() => router.push(activeTab === 'sales' ? '/sale/browse' : '/sublease/search')}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        {activeTab === 'sales' ? 'Browse Sale Items' : 'Browse Subleases'}
      </button>
    </div>
  );

  // Render filters panel
  const renderFilters = () => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-800">Filters</h3>
        <button 
          onClick={() => {
            setPriceRange([0, 5000]);
            setSelectedCategories([]);
            setSelectedLocations([]);
          }}
          className="text-sm text-orange-500 hover:text-orange-700"
        >
          Reset All
        </button>
      </div>
      
      {/* Price Range */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Price Range</h4>
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">${priceRange[0]}</span>
          <input
            type="range"
            min="0"
            max="5000"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-gray-600">${priceRange[1]}</span>
          <input
            type="range"
            min="0"
            max="5000"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
      
      {/* Categories - only show for sales */}
      {activeTab === 'sales' && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-3 py-1 text-sm rounded-full ${
                  selectedCategories.includes(category)
                    ? 'bg-orange-100 text-orange-700 border-orange-300'
                    : 'bg-gray-100 text-gray-700 border-gray-200'
                } border hover:bg-orange-50 transition-colors`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Locations */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Locations</h4>
        <div className="flex flex-wrap gap-2">
          {locations.map(location => (
            <button
              key={location}
              onClick={() => toggleLocation(location)}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedLocations.includes(location)
                  ? 'bg-orange-100 text-orange-700 border-orange-300'
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              } border hover:bg-orange-50 transition-colors`}
            >
              {location}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Render sale items in grid mode
  const renderSaleItemsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredSales.map(item => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="relative">
            <div 
              className="h-48 bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <button 
              onClick={() => removeSaleItem(item.id)}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50"
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-800 mb-1 truncate">{item.name}</h3>
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span>{item.location}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-orange-600">${item.price}</span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {item.condition}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render sale items in list mode
  const renderSaleItemsList = () => (
    <div className="space-y-3">
      {filteredSales.map(item => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex">
            <div 
              className="w-24 h-24 bg-gray-200 bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="p-3 flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-800 mb-1">{item.name}</h3>
                <button 
                  onClick={() => removeSaleItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-2">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{item.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-orange-600">${item.price}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {item.condition}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render sublease items in grid mode
  const renderSubleaseItemsGrid = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {filteredSubleases.map(item => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="relative">
            <div 
              className="h-48 bg-gray-200 bg-cover bg-center"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <button 
              onClick={() => removeSubleaseItem(item.id)}
              className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm hover:bg-red-50"
            >
              <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            </button>
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-800 mb-1 truncate">{item.title}</h3>
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-orange-600">${item.price}/mo</span>
              <div className="text-xs text-gray-600">
                {item.bedrooms}B/{item.bathrooms}B
              </div>
            </div>
            <div className="flex items-center text-gray-500 text-xs">
              <Calendar className="w-3.5 h-3.5 mr-1" />
              <span>{item.startDate} - {item.endDate}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render sublease items in list mode
  const renderSubleaseItemsList = () => (
    <div className="space-y-3">
      {filteredSubleases.map(item => (
        <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="flex">
            <div 
              className="w-24 h-24 bg-gray-200 bg-cover bg-center flex-shrink-0"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            <div className="p-3 flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium text-gray-800 mb-1">{item.title}</h3>
                <button 
                  onClick={() => removeSubleaseItem(item.id)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex items-center text-gray-500 text-sm mb-1">
                <MapPin className="w-3.5 h-3.5 mr-1" />
                <span>{item.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-orange-600">${item.price}/mo</span>
                <div className="text-xs text-gray-600">
                  {item.bedrooms}B/{item.bathrooms}B
                </div>
              </div>
              <div className="flex items-center text-gray-500 text-xs">
                <Calendar className="w-3.5 h-3.5 mr-1" />
                <span>{item.startDate} - {item.endDate}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back button */}
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              <span>Back</span>
            </button>
            
            {/* Page title */}
            <h1 className="text-xl font-bold text-gray-900">My Favorites</h1>
            
            {/* Spacer to maintain centering */}
            <div className="w-20"></div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('sales')}
            className={`py-3 px-5 text-center ${
              activeTab === 'sales'
                ? 'border-b-2 border-orange-500 text-orange-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Package className="w-4 h-4 mr-2" />
              <span>Move Out Sales</span>
              {favoriteSales.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5">
                  {favoriteSales.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('subleases')}
            className={`py-3 px-5 text-center ${
              activeTab === 'subleases'
                ? 'border-b-2 border-orange-500 text-orange-600 font-medium'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center">
              <Building className="w-4 h-4 mr-2" />
              <span>Subleases</span>
              {favoriteSubleases.length > 0 && (
                <span className="ml-2 bg-orange-100 text-orange-600 text-xs rounded-full px-2 py-0.5">
                  {favoriteSubleases.length}
                </span>
              )}
            </div>
          </button>
        </div>
        
        {/* Search and filters */}
        {((activeTab === 'sales' && favoriteSales.length > 0) || 
          (activeTab === 'subleases' && favoriteSubleases.length > 0)) && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search your favorite ${activeTab === 'sales' ? 'items' : 'subleases'}...`}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-5 h-5 mr-2 text-gray-500" />
                <span>Filters</span>
              </button>
              
              {/* View mode toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center px-3 py-2 ${
                    viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center px-3 py-2 ${
                    viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Filters panel */}
            {showFilters && renderFilters()}
          </div>
        )}
        
        {/* Content */}
        <div>
          {activeTab === 'sales' ? (
            // Sales items
            favoriteSales.length === 0 ? (
              renderEmptyState()
            ) : filteredSales.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No matches found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filters to find what you're looking for
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPriceRange([0, 5000]);
                    setSelectedCategories([]);
                    setSelectedLocations([]);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              viewMode === 'grid' ? renderSaleItemsGrid() : renderSaleItemsList()
            )
          ) : (
            // Sublease items
            favoriteSubleases.length === 0 ? (
              renderEmptyState()
            ) : filteredSubleases.length === 0 ? (
              <div className="text-center py-12">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">No matches found</h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filters to find what you're looking for
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPriceRange([0, 5000]);
                    setSelectedLocations([]);
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              viewMode === 'grid' ? renderSubleaseItemsGrid() : renderSubleaseItemsList()
            )
          )}
        </div>
      </div>
    </div>
  );
};

// Add dummy data for demonstration purposes
// You can remove this in production and rely on the localStorage data
const dummySaleItems: SaleItem[] = [
  {
    id: 1,
    name: "IKEA MALM Desk",
    price: 75,
    location: "Dinkytown",
    image: "https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&h=500",
    category: "Furniture",
    condition: "Good",
    postedDate: "2025-06-15"
  },
  {
    id: 2,
    name: "MacBook Pro 2023",
    price: 1200,
    location: "Eastbank",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&h=500",
    category: "Electronics",
    condition: "Like New",
    postedDate: "2025-06-18"
  },
  {
    id: 3,
    name: "Textbooks Bundle",
    price: 120,
    location: "Westbank",
    image: "https://images.unsplash.com/photo-1588580000645-f39a59f73ab7?auto=format&fit=crop&w=800&h=500",
    category: "Books",
    condition: "Good",
    postedDate: "2025-06-20"
  }
];

const dummySubleaseItems: SubleaseItem[] = [
  {
    id: 1,
    title: "Cozy Studio near Campus",
    price: 850,
    location: "Dinkytown",
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&h=500",
    bedrooms: 0,
    bathrooms: 1,
    startDate: "Jul 1, 2025",
    endDate: "Aug 31, 2025",
    amenities: ["WiFi", "Laundry", "Parking"]
  },
  {
    id: 2,
    title: "Modern 2BR Apartment",
    price: 1400,
    location: "Como",
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&h=500",
    bedrooms: 2,
    bathrooms: 1,
    startDate: "Jul 15, 2025",
    endDate: "Dec 31, 2025",
    amenities: ["WiFi", "Gym", "Dishwasher", "Parking"]
  }
];

export default FavoritesPage;