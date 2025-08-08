"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search,  Filter, 
  Heart, 
  ShoppingCart, 
  MapPin, 
  Clock, 
  Star,
  Grid3X3,
  List,
  Bell,
  User,
  History,
  Bookmark,
  GitCompare,
  Map as MapIcon,
  Package,
  Truck,
  DollarSign,
  Calendar,
  X,
  ChevronDown,
  Plus,
  Minus,
  SlidersHorizontal,
  MessagesSquare,
  Menu,
  ArrowLeft
} from "lucide-react";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';

const MoveOutSalePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [comparisonPriorities, setComparisonPriorities] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedCondition, setSelectedCondition] = useState("All Conditions");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [cart, setCart] = useState(new Map());
  const [compareItems, setCompareItems] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openFilterSection, setOpenFilterSection] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [activeTab, setActiveTab] = useState('favorites');
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(false);
  const [showAvailableDate, setShowAvailableDate] = useState(null);
  const router = useRouter();
  const [showComparison, setShowComparison] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Firebase state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
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

  // read parameter from URL
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  
  const locationParam = urlParams.get('location');
  if (locationParam) {
    setSelectedLocation(locationParam);
  }
  
  const searchParam = urlParams.get('search');
  if (searchParam) {
    setSearchQuery(searchParam);
  }
  
  const deliveryParam = urlParams.get('delivery');
  const pickupParam = urlParams.get('pickup');
  if (deliveryParam === 'true') {
    setSelectedDelivery(true);
  }
  if (pickupParam === 'true') {
    setSelectedPickup(true);
  }
}, []);

  // Real-time products fetching with saleItems collection
  useEffect(() => {
    let q = collection(db, 'saleItems');
    
    // Apply filters
    const constraints = [];
    
    if (selectedCategory !== "All Categories") {
      constraints.push(where("category", "==", selectedCategory));
    }
    if (selectedLocation !== "All Locations") {
      constraints.push(where("location", "==", selectedLocation.toLowerCase().replace(/\s+/g, '-')));
    }
    if (selectedCondition !== "All Conditions") {
      constraints.push(where("condition", "==", selectedCondition));
    }
    if (selectedDelivery) {
      constraints.push(where("deliveryAvailable", "==", true));
    }
    if (selectedPickup) {
      constraints.push(where("pickupAvailable", "==", true));
    }
    
    // Add orderBy - for simple queries without complex filtering
    try {
      if (constraints.length === 0) {
        q = query(q, orderBy("createdAt", "desc"), limit(50));
      } else {
        // For filtered queries, you might need to create composite indexes
        q = query(q, ...constraints, limit(50));
      }
    } catch (error) {
      // If orderBy fails due to missing index, just use constraints
      if (constraints.length > 0) {
        q = query(q, ...constraints, limit(50));
      } else {
        q = query(q, limit(50));
      }
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listingsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Safely handle timestamp conversion
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          // Ensure required fields have defaults
          views: data.views || 0,
          sellerRating: data.sellerRating || 4.5,
          originalPrice: data.originalPrice || data.price * 1.2,
          availableUntil: data.availableUntil || "2025-12-31"
        };
      });
      setProducts(listingsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching listings:", error);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [selectedCategory, selectedLocation, selectedCondition, selectedDelivery, selectedPickup]);

  // Fetch recommended products
  useEffect(() => {
    if (products.length > 0) {
      // Simple recommendation: just take the first 4 products
      // You can make this more sophisticated later
      setRecommended(products.slice(0, 4));
    }
  }, [products]);

  const categories = [
    "All Categories", "Furniture", "Electronics", "Books", "Textbooks", "Clothing", 
    "Kitchen", "Decor", "Sports", "Appliances", "General"
  ];
  
  const conditions = ["All Conditions", "New", "Like New", "Good", "Fair", "Used"];
  const locations = ["All Locations", "Dinkytown", "Eastbank", "Westbank", "Como", "Marcy-holmes"];

  const notifications = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" }
  ];

  // Client-side filtering for additional filters not handled by Firestore
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesAvailableUntil = !showAvailableDate || 
      (product.availableUntil && new Date(product.availableUntil) <= showAvailableDate);
    
    return matchesSearch && matchesPrice && matchesAvailableUntil;
  });

  //favorites list
  const toggleFavorite = (product) => {
    // check if it is already there
    const isFavorited = favoriteListings.some(item => item.id === product.id);

    if (isFavorited) {
      // if already added, cancel it
      setFavoriteListings(favoriteListings.filter(item => item.id !== product.id));
    } else {
      // add new favorites
      const favoriteItem = {
        id: product.id,
        name: product.name || 'Untitled Listing',
        location: product.location || 'Unknown Location',
        price: product.price || 0,
        image: product.image || '/api/placeholder/800/500',
      };
      
      setFavoriteListings([favoriteItem, ...favoriteListings]);
      // open sidebar
      setIsSidebarOpen(true);
      // change the tap into favorites
      setActiveTab('favorites');
    }
  };

  const updateCart = (productId, quantity) => {
    const newCart = new Map(cart);
    if (quantity === 0) {
      newCart.delete(productId);
    } else {
      newCart.set(productId, quantity);
    }
    setCart(newCart);
  };

  const toggleCompare = (productId) => {
    const newCompare = new Set(compareItems);
    if (newCompare.has(productId)) {
      newCompare.delete(productId);
    } else if (newCompare.size < 3) {
      newCompare.add(productId);
    }
    setCompareItems(newCompare);
  };

  const handleTabClick = (tab) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  const handleSearchSubmit = (e) => {
  e.preventDefault();
  if (!searchQuery.trim()) return;

  setSearchHistory((prev) => {
    const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0,5);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
    return updated;
  });

  // URL parameter update
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('search', searchQuery);
  
  // URL update
  window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
};

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(stored);
  }, []);

  const FilterSection = ({ title, id, children }) => (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpenFilterSection(openFilterSection === id ? null : id)}
        className="w-full flex justify-between items-center px-4 py-3 text-left text-gray-900 font-medium hover:bg-gray-50"
      >
        <span>{title}</span>
        <span>{openFilterSection === id ? "▲" : "▼"}</span>
      </button>
      {openFilterSection === id && <div className="p-4 space-y-2">{children}</div>}
    </div>
  );

const NotificationsButton = ({ notifications }: { notifications: Notification[] }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-white" />
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
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-orange-600 mb-3">Notifications</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => router.push(`browse/notification?id=${notif.id}`)}
                    className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-orange-50 text-left"
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
                className="mt-3 text-sm text-orange-600 hover:underline"
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


  // Favorites Sidebar
  const renderFavoritesSidebar = () => (
    <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>                
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
            <p>No favorite items yet</p>
            <p className="text-sm mt-2">Click the heart icon on items to save them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteListings.map(product => (
              <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer">
                <div className="flex" onClick={() => {
                  setIsSidebarOpen(false);
                  router.push(`/sale/product/${product.id}/`);
                }}>
                  <div 
                    className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                    style={{backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                  ></div>
                  <div className="p-3 flex-1">
                    <div className="font-medium text-gray-700">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.location}</div>
                    <div className="text-sm font-bold text-[#15361F] mt-1">
                      ${product.price}
                    </div>
                  </div>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-500 self-start"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(product);
                    }}
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center space-x-3">
                <motion.div 
                    className="flex items-center space-x-7 relative"
                    whileHover={{ scale: 1.05 }}
                >
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
                    MOVING SALES
                </motion.span>
                </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading listings...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <motion.div 
                  className="flex items-center space-x-7 relative"
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {isLoggedIn ? (router.push("/find")) : (router.push("/"))}}
              >
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
                  MOVING SALES
              </motion.span>
              </motion.div>
              </motion.div>
            </div>
 
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-between w-full">
                {/* Search */}
                <div className="relative hidden md:block mr-auto">
                  <form onSubmit={handleSearchSubmit}>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowHistory(true)}
                      onBlur={() => setTimeout(() => setShowHistory(false), 200)} // Slight delay to allow click
                      placeholder="Search items..."
                      className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-700"
                    />
                  </form>

                  {showHistory && searchHistory.length > 0 && (
                    <ul className="absolute left-0 top-full mt-1 w-64 bg-white border border-gray-200">
                      {searchHistory.map((query, index) => (
                        <li
                          key={index}
                          onMouseDown={() => setSearchQuery(query)}
                          className="pl-10 pr-4 py-2 w-64 border-transparent border-gray-300 hover:bg-gray-100 cursor-pointer"
                        >
                          {query}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Back Button */}
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/find")}
                  className="ml-32 flex items-center px-3 py-2 rounded-lg hover:bg-orange-600 text-black hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} className="mr-1" />
                  Back
                </motion.button>
              </div>
              
              {/* Notifications */}
              <NotificationsButton notifications={notifications} />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <MessagesSquare className = "w-5 h-5 text-white"/>
              </motion.button>

 
              {/* Favorites */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 bg-orange-500 rounded-lg hover:bg-orange600 transition-colors"
              >
                <Heart size={20} className = "w-5 h-5 text-white"/>
              </motion.button>
 
              {/* Profile */}
              <div className="relative">
              <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfile(!showProfile)}
                  className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                  <User className="w-5 h-5 text-white" />
              </motion.button>

              <AnimatePresence>
                  {showProfile && (
                  <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                  >
                      <div className="p-4 space-y-2">
                      <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Purchased</button>
                      <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Returned</button>
                      <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Cancelled</button>
                      <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Sold</button>
                      <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">Sublease</button>
                      <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">Reviews</button>
                      <hr className="my-2" />
                      <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">History</button>
                      </div>
                  </motion.div>
                  )}
              </AnimatePresence>
              </div>
              {/* menu */}
              <div className="relative">
              <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                  <Menu className="w-5 h-5 text-white" />
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
                          router.push('../browse');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          Browse Items
                      </button>                        
                      <button 
                          onClick={() => {
                          router.push('/sale/create');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          Sell Items
                      </button> 
                      <button 
                          onClick={() => {
                          router.push('/sale/create');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          My Items
                      </button>   
                      
                      <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
                          Sublease
                      </p>
                      <button 
                          onClick={() => {
                          router.push('../search');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          Find Sublease
                      </button>   
                      <button 
                          onClick={() => {
                          router.push('../search');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          Post Sublease
                      </button>   
                      <button 
                          onClick={() => {
                          router.push('../search');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          My Sublease Listing
                      </button>
                      <hr className="my-2" />
                      <button 
                          onClick={() => {
                          router.push('../sale/browse');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          Messages
                      </button>   
                      <button 
                          onClick={() => {
                          router.push('../help');
                          setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                      >
                          Help & Support
                      </button>

                      {/* need change (when user didn't log in -> show log in button) */}
                      <hr className="my-2" />
                          {/* log in/ out */}
                          {isLoggedIn ? (
                          <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">
                              Logout
                          </button>
                          ) : (
                          <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">
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
 
      {/* Mobile Search */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 w-4 h-4" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent  text-gray-700"
          />
        </div>
      </div>
 
      {/* Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Floating Filter Button */}
          <div className="fixed bottom-10 right-10 z-50">
            <AnimatePresence>
              {!showFilters && (
                <motion.button
                  key="filter-button"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowFilters(true)}
                  className="w-14 h-14 bg-orange-500 text-white rounded-full shadow-lg flex items-center justify-center"
                >
                  <Filter className="w-6 h-6" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
 
            {/* Slide-in Filter Panel */}
            <div
              className={`fixed top-0 right-0 h-full w-85 bg-white border-l border-gray-200 shadow-lg z-60 overflow-y-auto transition-transform duration-300 ${
                showFilters ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-orange-600">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>
 
                {/* Category */}
                <div className="mt-11">
                  <h3 className="text-sm font-semibold text-orange-600 mb-2">Category</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <label
                        key={category}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm capitalize cursor-pointer transition-colors ${
                          selectedCategory === category 
                            ? "bg-orange-100 text-orange-700 font-medium" 
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selectedCategory === category}
                          onChange={() => setSelectedCategory(category)}
                          className="w-4 h-4 border-gray-400 text-orange-500 accent-orange-500"
                        />
                        <span>{category === "All Categories" ? "All Categories" : category}</span>
                      </label>
                    ))}
                  </div>
                </div>
 
                {/* Location */}
                <div className="mt-11">
                  <h3 className="text-sm font-semibold text-orange-600 mb-2">Location</h3>
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <label
                        key={location}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm capitalize cursor-pointer transition-colors ${
                          selectedLocation === location
                            ? "bg-orange-100 text-orange-700 font-medium"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="location"
                          value={location}
                          checked={selectedLocation === location}
                          onChange={() => setSelectedLocation(location)}
                          className="w-4 h-4 border-gray-400 text-orange-500 accent-orange-500"
                        />
                        <span>{location === "All Locations" ? "All Locations" : location}</span>
                      </label>
                    ))}
                  </div>
                </div>
 
                {/* Condition */}
                <div className="mt-11">
                  <h3 className="text-sm font-semibold text-orange-600 mb-2">Condition</h3>
                  <div className="space-y-2">
                    {conditions.map((condition) => (
                      <label
                        key={condition}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm capitalize cursor-pointer transition-colors ${
                          selectedCondition === condition
                            ? "bg-orange-100 text-orange-700 font-medium"
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name="condition"
                          value={condition}
                          checked={selectedCondition === condition}
                          onChange={() => setSelectedCondition(condition)}
                          className="w-4 h-4 border-gray-400 text-orange-500 accent-orange-500"
                        />
                        <span>
                          {condition === "All Conditions" ? "All Conditions" : condition}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
 
                {/* Price Range */}
                <div className="mb-3 mt-6">
                  <label className="block text-sm font-medium text-orange-600 mb-2">
                    Price Range (${priceRange[0]} - ${priceRange[1]})
                  </label>
                  <div className="flex gap-2 mb-3">
                    {[100, 200, 300, 400, 500].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setPriceRange([0, amount])}
                        className="px-3 py-1 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full appearance-none h-2 bg-orange-400 hover:bg-orange-500 rounded-full outline-none transition"
                    style={{accentColor: '#f97316'}}
                  />
                </div>
                
                {/* Delivery & Pickup Buttons */}
                <div className="flex space-x-4">
                {/* Delivery Available */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setSelectedDelivery(!selectedDelivery)
                  }
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedDelivery 
                          ? "bg-orange-500 text-white" 
                          : "bg-white/90 text-black hover:bg-orange-50 hover:text-orange-500"
                      }`}
                >
                  <Truck
                    size = {24}
                    className="w-4 h-4"
                    fill={selectedDelivery ? "currentColor" : "none"}
                  />
                </motion.button>
                {/* Pickup Available */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() =>
                    setSelectedPickup(!selectedPickup)
                  }
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        selectedPickup 
                          ? "bg-orange-500 text-white" 
                          : "bg-white/90 text-black hover:bg-orange-50 hover:text-orange-500"
                      }`}
                >
                  <Package
                    size = {24}
                    className="w-4 h-4"
                    fill={selectedPickup ? "currentColor" : "none"}
                  />
                </motion.button>
              </div>
    
                {/* Available Date */}
                <div className="space-y-4">
                  <h2 className="text-medium font-semibold text-orange-600">Available Until</h2>
                  <DatePicker
                    selected={showAvailableDate}
                    onChange={(date) => setShowAvailableDate(date)}
                    dateFormat="yyyy-MM-dd"
                    inline
                    calendarClassName="bg-white border border-orange-400 rounded-lg shadow-md p-2"
                    dayClassName={(date) => 
                      "rounded-full text-gray-700 transition hover:bg-orange-400"
                    }
                  />
                </div>
              </div>
          
        </div>
 
          
          {/* Main Content */}
          <div className="flex-1">
            {/* Header Controls */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Move Out Sale Items
                </h1>
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                  {filteredProducts.length} items
                </span>
              </div>
 
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "grid" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <Grid3X3 className="w-5 h-5" />
                </motion.button>
                
              </div>
            </div>
 
            {/* Products Grid/List */}
            <motion.div 
              layout
              className={`grid gap-6 ${
                viewMode === "grid" 
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                  : "grid-cols-1"
              }`}
            >
              {filteredProducts.map(product => (
                <motion.div
                  key={`product-${product.id}`}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all relative ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  {/* Link wraps the main clickable area */}
                  <Link href={`browse/product/${product.id}`} className="block flex-1">
                    <div className="cursor-pointer">
                      {/* Product Image */}
                      <div className={`relative ${viewMode === "list" ? "w-48 h-32" : "aspect-square"}`}>
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          {product.image ? (
                              <img src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-24 h-24 bg-gray-300 rounded-full" />
                            )}                        
                        </div>
                        {/* Condition Badge */}
                        <div className="absolute bottom-2 left-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.condition === "New" ? "bg-green-100 text-green-700" :
                            product.condition === "Like New" ? "bg-blue-100 text-blue-700" :
                            product.condition === "Good" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {product.condition}
                          </span>
                        </div>
                        {/* Category Badge */}
                        {product.category && (
                          <div className="absolute bottom-2 right-2">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                              {product.category}
                            </span>
                          </div>
                        )}
                      </div>
 
                      {/* Product Info */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">${product.price}</div>
                            {product.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                            )}
                          </div>
                        </div>
 
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription || product.description}</p>
 
                        <div className="flex items-center space-x-4 text-sm text-black mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin size={15} className="w-3 h-3" />
                            <span className="capitalize">{product.location?.replace("-", " ")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock size={15} className="w-3 h-3" />
                            <span>Until {product.availableUntil}</span>
                          </div>
                        </div>
 
                        <div className="flex items-center space-x-4 text-sm text-black mb-3">
                        {product.deliveryAvailable && (
                            <div className="flex items-center space-x-1">
                              <Truck size={15} className="w-3 h-3" />
                              <span>Delivery</span>
                            </div>
                          )}
                          {product.pickupAvailable && (
                              <div className="flex items-center space-x-1 ">
                                <img 
                                  src="../../../../images/heart-handshake.png" 
                                  alt="pickup" 
                                  className="w-3 h-3 object-cover rounded"
                                />
                                <span>Pick-up</span>
                              </div>
                          )}
                        </div>
 
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-600">{product.sellerRating}</span>
                            </div>
                            <span className="text-gray-500 text-sm">• {product.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
 
                  {/* Quick Actions Overlay - OUTSIDE the Link */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault(); // Prevent link navigation
                        e.stopPropagation(); // Stop event bubbling
                        toggleFavorite(product);
                      }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        favoriteListings.some(item => item.id === product.id)  
                          ? "bg-red-500 text-white" 
                          : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
                      }`}
                    >
                      <Heart size={18} className={favoriteListings.some(item => item.id === product.id) ? 'fill-current' : ''}  />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.preventDefault(); // Prevent link navigation
                        e.stopPropagation(); // Stop event bubbling
                        toggleCompare(product.id);
                      }}
                      disabled={!compareItems.has(product.id) && compareItems.size >= 3}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        compareItems.has(product.id) 
                          ? "bg-purple-500 text-white" 
                          : "bg-white/90 text-gray-600 hover:bg-purple-50 hover:text-purple-500 disabled:opacity-50"
                      }`}
                    >
                      <GitCompare className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
 
            {/* Empty State */}
            {filteredProducts.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms.</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All Categories");
                    setSelectedCondition("All Conditions");
                    setPriceRange([0, 500]);
                    setSelectedLocation("All Locations");
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Clear All Filters
                </motion.button>
              </motion.div>
            )}
 
            {/* Recommended Items */}
            {recommended.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recommended for You</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {recommended.map(product => (
                    <motion.div
                      key={`rec-${product.id}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2 }}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all relative"
                    >
                      <Link href={`browse/product/${product.id}`} className="block">
                        <div className="cursor-pointer">
                          {/* Product Image */}
                          <div className="relative aspect-square">
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              {product.image ? (
                                <img src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-24 h-24 bg-gray-300 rounded-full" />
                              )}
                            </div>
                            {/* Condition Badge */}
                            <div className="absolute bottom-2 left-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                product.condition === "New" ? "bg-green-100 text-green-700" :
                                product.condition === "Like New" ? "bg-blue-100 text-blue-700" :
                                product.condition === "Good" ? "bg-yellow-100 text-yellow-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {product.condition}
                              </span>
                            </div>
                            {/* Category Badge */}
                            {product.category && (
                              <div className="absolute bottom-2 right-2">
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                  {product.category}
                                </span>
                              </div>
                            )}
                          </div>
 
                          {/* Product Info */}
                          <div className="p-4 flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                              <div className="text-right">
                                <div className="text-xl font-bold text-gray-900">${product.price}</div>
                                {product.originalPrice && (
                                  <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                                )}
                              </div>
                            </div>
 
                            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription || product.description}</p>
 
                            <div className="flex items-center space-x-4 text-sm text-black mb-3">
                              <div className="flex items-center space-x-1">
                                <MapPin size={15} className="w-3 h-3" />
                                <span className="capitalize">{product.location?.replace("-", " ")}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock size={15} className="w-3 h-3" />
                                <span>Until {product.availableUntil}</span>
                              </div>
                            </div>
                          <div className="flex items-center space-x-4 text-sm text-black mb-3">
                          {product.deliveryAvailable && (
                              <div className="flex items-center space-x-1">
                                <Truck size={15} className="w-3 h-3" />
                                <span>Delivery</span>
                              </div>
                            )}
                            {product.pickupAvailable && (
                                <div className="flex items-center space-x-1 ">
                                  <img 
                                    src="../../../../images/heart-handshake.png" 
                                    alt="pickup" 
                                    className="w-3 h-3 object-cover rounded"
                                  />
                                  <span>Pick-up</span>
                                </div>
                            )}
                          </div>
 
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm font-medium text-gray-600">{product.sellerRating}</span>
                                </div>
                                <span className="text-gray-500 text-sm">• {product.views} views</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
 
                      {/* Quick Actions Overlay */}
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFavorite(product);
                          }}
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            favoriteListings.some(item => item.id === product.id) 
                            ? "bg-red-500 text-white" 
                            : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        <Heart size={18} className={favoriteListings.some(item => item.id === product.id) ? 'fill-current' : ''} 
                         />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleCompare(product.id);
                        }}
                        disabled={!compareItems.has(product.id) && compareItems.size >= 3}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          compareItems.has(product.id) 
                            ? "bg-purple-500 text-white" 
                            : "bg-white/90 text-gray-600 hover:bg-purple-50 hover:text-purple-500 disabled:opacity-50"
                        }`}
                      >
                        <GitCompare className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
 
    {/* Compare Panel */}
    <AnimatePresence>
      {compareItems.size > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <GitCompare className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-gray-900">
                    Compare Items ({compareItems.size}/3)
                  </span>
                </div>
                <div className="flex space-x-2">
                  {Array.from(compareItems).map(productId => {
                    const product = products.find(p => p.id === productId);
                    return product ? (
                      <div key={productId} className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
                        <span className="text-sm font-medium">{product.name}</span>
                        <button
                          onClick={() => toggleCompare(productId)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setShowComparison(true);
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Compare Now
                </motion.button>
                <button
                  onClick={() => setCompareItems(new Set())}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
   {/*Enhanced super responsive and interactive comparison table*/}
{/*Enhanced flexible priority-based comparison table*/}
{showComparison && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-2 sm:p-4"
        onClick={(e) => e.target === e.currentTarget && setShowComparison(false)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden relative"
        >
          {/* Header with Priority Selector */}
          <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Smart Product Comparison</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Select what matters most to you • Comparing {compareItems.size} of 3 items
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors self-end sm:self-auto"
                onClick={() => setShowComparison(false)}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
              </motion.button>
            </div>

            {/* Priority Selection Panel */}
            <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-3">
                <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                <h3 className="font-semibold text-gray-900">What's Most Important to You?</h3>
                <span className="text-xs text-gray-500">(Select multiple)</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { key: 'price', label: 'Best Price', icon: DollarSign, color: 'green' },
                  { key: 'condition', label: 'Condition', icon: Star, color: 'blue' },
                  { key: 'rating', label: 'Seller Rating', icon: Star, color: 'yellow' },
                  { key: 'location', label: 'Location', icon: MapPin, color: 'purple' },
                  { key: 'delivery', label: 'Delivery', icon: Truck, color: 'indigo' },
                  { key: 'pickup', label: 'Pickup', icon: Package, color: 'pink' }
                ].map(priority => {
                  const isSelected = comparisonPriorities.includes(priority.key);
                  const colorClasses = {
                    green: isSelected ? 'bg-green-500 text-white border-green-500' : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
                    blue: isSelected ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
                    yellow: isSelected ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                    purple: isSelected ? 'bg-purple-500 text-white border-purple-500' : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
                    indigo: isSelected ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
                    pink: isSelected ? 'bg-pink-500 text-white border-pink-500' : 'bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100'
                  };

                  return (
                    <motion.button
                      key={priority.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (isSelected) {
                          setComparisonPriorities(comparisonPriorities.filter(p => p !== priority.key));
                        } else {
                          setComparisonPriorities([...comparisonPriorities, priority.key]);
                        }
                      }}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${colorClasses[priority.color]}`}
                    >
                      <priority.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{priority.label}</span>
                      <span className="sm:hidden">{priority.label.split(' ')[0]}</span>
                      {isSelected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-2 h-2 bg-white rounded-full" />}
                    </motion.button>
                  );
                })}
              </div>

              {comparisonPriorities.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-3 bg-gray-50 rounded-lg"
                >
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Prioritizing:</span> {comparisonPriorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setComparisonPriorities([])}
                      className="ml-2 text-xs text-red-600 hover:text-red-800 underline"
                    >
                      Clear all
                    </motion.button>
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Mobile View (below md breakpoint) */}
          <div className="md:hidden overflow-auto max-h-[calc(95vh-200px)]">
            <div className="p-4 space-y-4">
              {(() => {
                // Calculate scores for mobile ranking
                const productScores = Array.from(compareItems).map(id => {
                  const product = products.find(p => p.id === id);
                  if (!product) return { id, score: 0, product: null };

                  let score = 0;
                  const prices = Array.from(compareItems).map(id => products.find(p => p.id === id)?.price || 0);
                  const ratings = Array.from(compareItems).map(id => products.find(p => p.id === id)?.sellerRating || 0);
                  
                  if (comparisonPriorities.includes('price')) {
                    const minPrice = Math.min(...prices);
                    score += product.price === minPrice ? 20 : (minPrice / product.price) * 20;
                  }
                  if (comparisonPriorities.includes('condition')) {
                    const conditionScore = { 'New': 20, 'Like New': 16, 'Good': 12, 'Fair': 8, 'Used': 4 };
                    score += conditionScore[product.condition] || 0;
                  }
                  if (comparisonPriorities.includes('rating')) {
                    score += (product.sellerRating / 5) * 20;
                  }
                  if (comparisonPriorities.includes('delivery') && product.deliveryAvailable) {
                    score += 15;
                  }
                  if (comparisonPriorities.includes('pickup') && product.pickupAvailable) {
                    score += 15;
                  }

                  return { id, score, product };
                }).sort((a, b) => b.score - a.score);

                return productScores.map(({ id, score, product }, index) => {
                  if (!product) return null;
                  
                  const isRecommended = index === 0 && comparisonPriorities.length > 0;
                  
                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-lg transition-all duration-300 ${
                        isRecommended ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-red-50' : 'border-gray-200'
                      }`}
                    >
                      {/* Recommendation Badge */}
                      {isRecommended && (
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center space-x-2 mb-3 p-2 bg-orange-500 text-white rounded-lg"
                        >
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold">🏆 Best Match for Your Priorities</span>
                        </motion.div>
                      )}

                      {/* Mobile Product Header */}
                      <div className="flex items-start space-x-4 mb-4">
                        <div className="relative flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleCompare(id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                          >
                            <X className="w-3 h-3" />
                          </motion.button>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{product.name}</h3>
                          <p className="text-sm text-gray-500">{product.category}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`text-2xl font-bold ${
                              comparisonPriorities.includes('price') && 
                              product.price === Math.min(...Array.from(compareItems).map(id => products.find(p => p.id === id)?.price || 0))
                                ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              ${product.price}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.condition === "New" ? "bg-green-100 text-green-700" :
                              product.condition === "Like New" ? "bg-blue-100 text-blue-700" :
                              product.condition === "Good" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {product.condition}
                            </span>
                          </div>
                          
                          {/* Priority Score */}
                          {comparisonPriorities.length > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Match Score:</span>
                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(score, 100)}%` }}
                                    transition={{ delay: index * 0.1 + 0.5 }}
                                    className={`h-2 rounded-full ${
                                      isRecommended ? 'bg-orange-500' : 'bg-blue-500'
                                    }`}
                                  />
                                </div>
                                <span className="text-xs font-bold text-gray-700">{Math.round(score)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Priority Highlights */}
                      {comparisonPriorities.length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-xs font-bold text-gray-700 mb-2">Your Priority Highlights:</h4>
                          <div className="flex flex-wrap gap-2">
                            {comparisonPriorities.map(priority => {
                              let highlight = '';
                              let colorClass = 'bg-gray-100 text-gray-700';
                              
                              if (priority === 'price') {
                                const isLowest = product.price === Math.min(...Array.from(compareItems).map(id => products.find(p => p.id === id)?.price || 0));
                                highlight = isLowest ? '🏆 Lowest Price' : `$${product.price}`;
                                colorClass = isLowest ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
                              } else if (priority === 'condition') {
                                highlight = product.condition;
                                colorClass = product.condition === 'New' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700';
                              } else if (priority === 'rating') {
                                const isHighest = product.sellerRating === Math.max(...Array.from(compareItems).map(id => products.find(p => p.id === id)?.sellerRating || 0));
                                highlight = isHighest ? `⭐ ${product.sellerRating} (Highest)` : `⭐ ${product.sellerRating}`;
                                colorClass = isHighest ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700';
                              } else if (priority === 'delivery') {
                                highlight = product.deliveryAvailable ? '✓ Delivery' : '✗ No Delivery';
                                colorClass = product.deliveryAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
                              } else if (priority === 'pickup') {
                                highlight = product.pickupAvailable ? '✓ Pickup' : '✗ No Pickup';
                                colorClass = product.pickupAvailable ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';
                              }
                              
                              return (
                                <span key={priority} className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
                                  {highlight}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Mobile Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setShowComparison(false);
                          router.push(`browse/product/${product.id}`);
                        }}
                        className={`w-full py-3 font-medium rounded-lg transition-all duration-200 shadow-md ${
                          isRecommended 
                            ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                            : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                        }`}
                      >
                        {isRecommended ? '🎯 View Recommended Item' : 'View Product Details'}
                      </motion.button>
                    </motion.div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Desktop/Tablet View (md and above) */}
          <div className="hidden md:block overflow-auto max-h-[calc(95vh-240px)]">
            <div className="p-6">
              {/* Desktop Product Cards Header with Smart Ranking */}
              <div className="grid gap-4 mb-8" style={{gridTemplateColumns: `250px repeat(${compareItems.size}, 1fr)`}}>
                {/* Smart Insights Panel */}
                <div className="flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-center">
                    <SlidersHorizontal className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-medium">Smart Comparison</p>
                    <p className="text-xs text-gray-400">Based on your priorities</p>
                    {comparisonPriorities.length === 0 && (
                      <p className="text-xs text-orange-500 mt-1 font-medium">Select priorities above</p>
                    )}
                  </div>
                </div>
                
                {/* Desktop Product Cards with Smart Ranking */}
                {(() => {
                  // Calculate scores and rank products
                  const productScores = Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    if (!product) return { id, score: 0, product: null };

                    let score = 0;
                    const prices = Array.from(compareItems).map(id => products.find(p => p.id === id)?.price || 0);
                    const ratings = Array.from(compareItems).map(id => products.find(p => p.id === id)?.sellerRating || 0);
                    
                    if (comparisonPriorities.includes('price')) {
                      const minPrice = Math.min(...prices);
                      score += product.price === minPrice ? 25 : (minPrice / product.price) * 25;
                    }
                    if (comparisonPriorities.includes('condition')) {
                      const conditionScore = { 'New': 25, 'Like New': 20, 'Good': 15, 'Fair': 10, 'Used': 5 };
                      score += conditionScore[product.condition] || 0;
                    }
                    if (comparisonPriorities.includes('rating')) {
                      score += (product.sellerRating / 5) * 25;
                    }
                    if (comparisonPriorities.includes('delivery') && product.deliveryAvailable) {
                      score += 15;
                    }
                    if (comparisonPriorities.includes('pickup') && product.pickupAvailable) {
                      score += 15;
                    }

                    return { id, score, product };
                  }).sort((a, b) => b.score - a.score);

                  return productScores.map(({ id, score, product }, index) => {
                    if (!product) return null;
                    
                    const isRecommended = index === 0 && comparisonPriorities.length > 0;
                    const rank = index + 1;
                    
                    return (
                      <motion.div 
                        key={id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, zIndex: 10 }}
                        className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 relative ${
                          isRecommended ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50' : 'border-gray-200'
                        }`}
                      >
                        {/* Ranking Badge */}
                        {comparisonPriorities.length > 0 && (
                          <div className={`absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ${
                            isRecommended ? 'bg-gradient-to-r from-orange-500 to-red-600' : 
                            rank === 2 ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                            'bg-gradient-to-r from-yellow-600 to-orange-600'
                          }`}>
                            {rank}
                          </div>
                        )}

                        {/* Recommendation Crown */}
                        {isRecommended && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute -top-2 right-4 text-2xl"
                          >
                            👑
                          </motion.div>
                        )}

                        {/* Desktop Product Image */}
                        <div className="relative mb-4 group">
                          <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 transition-transform duration-300 group-hover:scale-105">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-12 h-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          {/* Floating Action Buttons */}
                          <div className="absolute top-2 right-2 flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <motion.button
                              whileHover={{ scale: 1.1, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleCompare(id)}
                              className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                            >
                              <X className="w-3 h-3" />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => toggleFavorite(product)}
                              className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                                favoriteListings.some(item => item.id === product.id)
                                  ? "bg-red-500 text-white" 
                                  : "bg-white text-gray-600 hover:bg-red-50 hover:text-red-500"
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${favoriteListings.some(item => item.id === product.id) ? 'fill-current' : ''}`} />
                            </motion.button>
                          </div>
                          
                          {/* Condition badge */}
                          <div className="absolute bottom-2 left-2">
                            <motion.span 
                              whileHover={{ scale: 1.1 }}
                              className={`px-2 py-1 rounded-full text-xs font-medium shadow-sm ${
                                product.condition === "New" ? "bg-green-100 text-green-700 border border-green-200" :
                                product.condition === "Like New" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                                product.condition === "Good" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                                "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}>
                              {product.condition}
                            </motion.span>
                          </div>
                        </div>
                        
                        {/* Desktop Product Info */}
                        <div className="space-y-2">
                          <h3 className={`font-bold text-gray-900 text-sm leading-tight line-clamp-2 transition-colors ${
                            isRecommended ? 'text-orange-600' : 'group-hover:text-orange-600'
                          }`}>
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-500">{product.category}</p>
                          
                          {/* Price with priority highlighting */}
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="text-center py-2"
                          >
                            <span className={`text-2xl font-bold ${
                              comparisonPriorities.includes('price') && 
                              product.price === Math.min(...Array.from(compareItems).map(id => products.find(p => p.id === id)?.price || 0))
                                ? 'text-green-600' : 'text-orange-600'
                            }`}>
                              ${product.price}
                            </span>
                          </motion.div>
                          
                          {/* Match Score */}
                          {comparisonPriorities.length > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-600">Match Score</span>
                                <span className="font-bold text-gray-800">{Math.round(score)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.min(score, 100)}%` }}
                                  transition={{ delay: index * 0.1 + 0.5 }}
                                  className={`h-2 rounded-full ${
                                    isRecommended ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-blue-500'
                                  }`}
                                />
                              </div>
                            </div>
                          )}
                          
                          {/* Quick stats */}
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span>{product.sellerRating}</span>
                            </div>
                            <span>{product.views} views</span>
                          </div>
                          
                          {/* View product button */}
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setShowComparison(false);
                              router.push(`browse/product/${product.id}`);
                            }}
                            className={`w-full py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${
                              isRecommended 
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                            }`}
                          >
                            {isRecommended ? '🎯 View Best Match' : 'View Details'}
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  });
                })()}
              </div>

              {/* Desktop Comparison Table with Priority Highlighting */}
              <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                <div className="grid gap-0" style={{gridTemplateColumns: `250px repeat(${compareItems.size}, 1fr)`}}>
                  
                  {/* Price Row with Smart Highlighting */}
                  <motion.div 
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className={`border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center ${
                      comparisonPriorities.includes('price') ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-gray-50'
                    }`}
                  >
                    <DollarSign className={`w-5 h-5 mr-3 ${comparisonPriorities.includes('price') ? 'text-green-600' : 'text-gray-600'}`} />
                    <span>Price Comparison</span>
                    {comparisonPriorities.includes('price') && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold"
                      >
                        HIGH PRIORITY
                      </motion.span>
                    )}
                  </motion.div>
                  {(() => {
                    const prices = Array.from(compareItems).map(id => {
                      const product = products.find(p => p.id === id);
                      return product?.price || 0;
                    });
                    const minPrice = Math.min(...prices);
                    
                    return Array.from(compareItems).map(id => {
                      const product = products.find(p => p.id === id);
                      const isLowest = product?.price === minPrice;
                      const isPriority = comparisonPriorities.includes('price');
                      
                      return (
                        <motion.div 
                          key={`price-${id}`}
                          whileHover={{ scale: 1.02 }}
                          className={`border-b border-gray-200 p-4 flex items-center justify-between transition-all duration-200 ${
                            isLowest && isPriority ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-300' :
                            isLowest ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 
                            'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className={`text-xl font-bold ${
                            isLowest && isPriority ? 'text-green-800' :
                            isLowest ? 'text-green-700' : 'text-gray-900'
                          }`}>
                            ${product?.price}
                          </span>
                          {isLowest && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm ${
                                isPriority ? 'bg-green-300 text-green-900' : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {isPriority ? '🎯 BEST CHOICE' : '🏆 Lowest'}
                            </motion.span>
                          )}
                        </motion.div>
                      );
                    });
                  })()}

                  {/* Condition Row with Smart Highlighting */}
                  <motion.div 
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className={`border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center ${
                      comparisonPriorities.includes('condition') ? 'bg-gradient-to-r from-blue-50 to-cyan-50' : 'bg-gray-50'
                    }`}
                  >
                    <Star className={`w-5 h-5 mr-3 ${comparisonPriorities.includes('condition') ? 'text-blue-600' : 'text-gray-600'}`} />
                    <span>Condition</span>
                    {comparisonPriorities.includes('condition') && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded-full font-bold"
                      >
                        HIGH PRIORITY
                      </motion.span>
                    )}
                  </motion.div>
                  {(() => {
                    const conditionRank = { 'New': 5, 'Like New': 4, 'Good': 3, 'Fair': 2, 'Used': 1 };
                    const conditions = Array.from(compareItems).map(id => {
                      const product = products.find(p => p.id === id);
                      return conditionRank[product?.condition] || 0;
                    });
                    const bestCondition = Math.max(...conditions);
                    
                    return Array.from(compareItems).map(id => {
                      const product = products.find(p => p.id === id);
                      const isBest = conditionRank[product?.condition] === bestCondition;
                      const isPriority = comparisonPriorities.includes('condition');
                      
                      return (
                        <motion.div 
                          key={`condition-${id}`}
                          whileHover={{ scale: 1.02 }}
                          className={`border-b border-gray-200 p-4 flex items-center justify-between transition-all duration-200 ${
                            isBest && isPriority ? 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-300' :
                            isBest ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200' : 
                            'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product?.condition === "New" ? "bg-green-100 text-green-700" :
                            product?.condition === "Like New" ? "bg-blue-100 text-blue-700" :
                            product?.condition === "Good" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {product?.condition}
                          </span>
                          {isBest && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm ${
                                isPriority ? 'bg-blue-300 text-blue-900' : 'bg-blue-200 text-blue-800'
                              }`}
                            >
                              {isPriority ? '🎯 BEST CHOICE' : '⭐ Best'}
                            </motion.span>
                          )}
                        </motion.div>
                      );
                    });
                  })()}

                  {/* Location Row */}
                  <motion.div 
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className={`border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center ${
                      comparisonPriorities.includes('location') ? 'bg-gradient-to-r from-purple-50 to-pink-50' : 'bg-gray-50'
                    }`}
                  >
                    <MapPin className={`w-5 h-5 mr-3 ${comparisonPriorities.includes('location') ? 'text-purple-600' : 'text-gray-600'}`} />
                    <span>Location</span>
                    {comparisonPriorities.includes('location') && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-1 bg-purple-200 text-purple-800 text-xs rounded-full font-bold"
                      >
                        HIGH PRIORITY
                      </motion.span>
                    )}
                  </motion.div>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    const isPriority = comparisonPriorities.includes('location');
                    
                    return (
                      <motion.div 
                        key={`location-${id}`}
                        whileHover={{ scale: 1.02, backgroundColor: "#f9fafb" }}
                        className={`border-b border-gray-200 p-4 transition-all duration-200 ${
                          isPriority ? 'bg-purple-50' : 'bg-white'
                        }`}
                      >
                        <span className="capitalize text-gray-900 font-medium">
                          {product?.location?.replace("-", " ")}
                        </span>
                      </motion.div>
                    );
                  })}

                  {/* Seller Rating Row with Smart Highlighting */}
                  <motion.div 
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className={`border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center ${
                      comparisonPriorities.includes('rating') ? 'bg-gradient-to-r from-yellow-50 to-orange-50' : 'bg-gray-50'
                    }`}
                  >
                    <Star className={`w-5 h-5 mr-3 ${comparisonPriorities.includes('rating') ? 'text-yellow-500' : 'text-gray-600'}`} />
                    <span>Seller Rating</span>
                    {comparisonPriorities.includes('rating') && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-bold"
                      >
                        HIGH PRIORITY
                      </motion.span>
                    )}
                  </motion.div>
                  {(() => {
                    const ratings = Array.from(compareItems).map(id => {
                      const product = products.find(p => p.id === id);
                      return product?.sellerRating || 0;
                    });
                    const maxRating = Math.max(...ratings);
                    
                    return Array.from(compareItems).map(id => {
                      const product = products.find(p => p.id === id);
                      const isHighest = product?.sellerRating === maxRating;
                      const isPriority = comparisonPriorities.includes('rating');
                      
                      return (
                        <motion.div 
                          key={`rating-${id}`}
                          whileHover={{ scale: 1.02 }}
                          className={`border-b border-gray-200 p-4 flex items-center justify-between transition-all duration-200 ${
                            isHighest && isPriority ? 'bg-gradient-to-r from-yellow-100 to-orange-100 border-yellow-300' :
                            isHighest ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : 
                            'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(product?.sellerRating || 0) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                            <span className={`font-bold ${
                              isHighest && isPriority ? 'text-yellow-800' :
                              isHighest ? 'text-yellow-700' : 'text-gray-900'
                            }`}>
                              {product?.sellerRating}
                            </span>
                          </div>
                          {isHighest && (
                            <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`text-xs px-2 py-1 rounded-full font-bold shadow-sm ${
                                isPriority ? 'bg-yellow-300 text-yellow-900' : 'bg-yellow-200 text-yellow-800'
                              }`}
                            >
                              {isPriority ? '🎯 BEST CHOICE' : '⭐ Highest'}
                            </motion.span>
                          )}
                        </motion.div>
                      );
                    });
                  })()}

                  {/* Delivery & Pickup Options Row */}
                  <motion.div 
                    whileHover={{ backgroundColor: "#f9fafb" }}
                    className={`border-b border-gray-200 p-4 font-bold text-gray-800 flex items-center ${
                      comparisonPriorities.includes('delivery') || comparisonPriorities.includes('pickup') ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-gray-50'
                    }`}
                  >
                    <Truck className={`w-5 h-5 mr-3 ${
                      comparisonPriorities.includes('delivery') || comparisonPriorities.includes('pickup') ? 'text-indigo-600' : 'text-gray-600'
                    }`} />
                    <span>Delivery Options</span>
                    {(comparisonPriorities.includes('delivery') || comparisonPriorities.includes('pickup')) && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-2 px-2 py-1 bg-indigo-200 text-indigo-800 text-xs rounded-full font-bold"
                      >
                        HIGH PRIORITY
                      </motion.span>
                    )}
                  </motion.div>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    const deliveryPriority = comparisonPriorities.includes('delivery');
                    const pickupPriority = comparisonPriorities.includes('pickup');
                    const hasPreferredOptions = (deliveryPriority && product?.deliveryAvailable) || (pickupPriority && product?.pickupAvailable);
                    
                    return (
                      <motion.div 
                        key={`delivery-options-${id}`}
                        whileHover={{ scale: 1.02 }}
                        className={`border-b border-gray-200 p-4 transition-all duration-200 ${
                          hasPreferredOptions ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col space-y-2">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              product?.deliveryAvailable 
                                ? deliveryPriority ? "bg-green-200 text-green-800 border-2 border-green-300" : "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            {product?.deliveryAvailable ? "Delivery ✓" : "No Delivery ✗"}
                            {deliveryPriority && product?.deliveryAvailable && (
                              <span className="ml-1">🎯</span>
                            )}
                          </motion.div>
                          
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                              product?.pickupAvailable 
                                ? pickupPriority ? "bg-blue-200 text-blue-800 border-2 border-blue-300" : "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            <img 
                              src="../../../../images/heart-handshake.png" 
                              alt="pickup" 
                              className="w-3 h-3 mr-1 object-cover rounded"
                            />
                            {product?.pickupAvailable ? "Pickup ✓" : "No Pickup ✗"}
                            {pickupPriority && product?.pickupAvailable && (
                              <span className="ml-1">🎯</span>
                            )}
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}

                </div>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-6 border-t border-gray-200 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCompareItems(new Set())}
                    className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors font-medium"
                  >
                    🗑️ Clear All
                  </motion.button>
                  
                  <span className="text-sm text-gray-500">
                    {compareItems.size} of 3 items • {comparisonPriorities.length} priorities selected
                  </span>
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Share functionality with priorities
                      const prioritiesText = comparisonPriorities.length > 0 ? ` (Prioritizing: ${comparisonPriorities.join(', ')})` : '';
                      if (navigator.share) {
                        navigator.share({
                          title: 'Smart Product Comparison',
                          text: `Check out this smart product comparison${prioritiesText}!`,
                          url: window.location.href
                        });
                      } else {
                        alert('Comparison link copied to clipboard!');
                      }
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    📤 Share
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowComparison(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Close
                  </motion.button>
                  
         
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    )}
   
  </div>
 );
  ;
}

export default MoveOutSalePage;