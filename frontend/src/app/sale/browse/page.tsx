"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
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
  SlidersHorizontal
} from "lucide-react";
import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";




export default function MoveOutSalePage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedCondition, setSelectedCondition] = useState("All Conditions");
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [compareItems, setCompareItems] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openFilterSection, setOpenFilterSection] = useState(null);
  const [showFavorite, setShowFavorite] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(false);
  const [showAvailableDate, setShowAvailableDate] = useState(null);
  const router = useRouter();
  const [showComparison, setShowComparison] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [userItself, setUserItself] = useState(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserItself(user);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);



  const categories = [
    "All Categories", "Furniture", "Electronics", "Books", "Clothing", 
    "Kitchen", "Decor", "Sports", "Textbooks", "Appliances"
  ];

  const conditions = ["All Conditions", "New", "Like-new", "Good", "Fair"];
  const locations = ["All Locations", "Dinkytown", "Eastbank", "Westbank", "Como", "Marcy-holmes"];

  // Sample product data
  const products = [
    {
      id: 1,
      name: "IKEA Desk Chair",
      price: 45,
      originalPrice: 80,
      condition: "Good",
      category: "Furniture",
      location: "Dinkytown",
      image: "https://www.ikea.com/kr/en/images/products/flintan-office-chair-with-armrests-beige__1007238_pe825958_s5.jpg?f=s",
      seller: "Sarah M.",
      availableUntil: "2025-06-20",
      description: "Comfortable office chair, minor wear on armrests",
      deliveryAvailable: true,
      pickupAvailable: true,
      rating: 4.5,
      views: 23,
      student: true,
      rate: true,
      rateError: true,
      alumni: false,
      review: true,
      sold: false,
      rent: false
    },
    {
      id: 2,
      name: "MacBook Pro 13\"",
      price: 650,
      originalPrice: 1200,
      condition: "Like-new",
      category: "Electronics",
      location: "Eastbank",
      image: "https://www.macking.co.uk/cdn/shop/products/2020MBPSpaceGray1.jpg?v=1668600761",
      seller: "Mike R.",
      availableUntil: "2025-06-05",
      description: "2020 model, barely used, comes with charger",
      deliveryAvailable: false,
      pickupAvailable: true,
      rating: 5.0,
      views: 87,
      student: true,
      rate: false,
      rateError: false,
      alumni: false,
      review: false,
      sold: false,
      rent: true
    },
    {
      id: 3,
      name: "Organic Chemistry Textbook",
      price: 25,
      originalPrice: 300,
      condition: "Good",
      category: "Textbooks",
      location: "Westbank",
      image: "https://m.media-amazon.com/images/I/71sAlGmgJBL._UF1000,1000_QL80_.jpg",
      seller: "Alex K.",
      availableUntil: "2025-06-14",
      description: "Some highlighting, great for CHEM 2301",
      deliveryAvailable: true,
      pickupAvailable: true,
      rating: 4.0,
      views: 12,
      student: false,
      rate: false,
      rateError: true,
      alumni: false,
      review: false,
      sold: true,
      rent: false
    },
    {
      id: 4,
      name: "Mini Fridge",
      price: 80,
      originalPrice: 150,
      condition: "Good",
      category: "Appliances",
      location: "Como",
      image: "https://www.kroger.com/product/images/large/front/0019639325699",
      seller: "Emma L.",
      availableUntil: "2025-06-01",
      description: "Perfect for dorm room, clean and functional",
      deliveryAvailable: true,
      pickupAvailable: true,
      rating: 4.2,
      views: 34,
      student: false,
      rate: false,
      rateError: false,
      alumni: true,
      review: false,
      sold: true,
      rent: true
    },
    {
      id: 5,
      name: "Nike Running Shoes",
      price: 35,
      originalPrice: 120,
      condition: "Good",
      category: "Clothing",
      location: "Dinkytown",
      image: "https://www.solereview.com/wp-content/uploads/2025/03/Nike_Vomero_18_on_road.jpg",
      seller: "Jordan T.",
      availableUntil: "2025-06-29",
      description: "Size 9, worn for one semester",
      deliveryAvailable: false,
      pickupAvailable: true,
      rating: 4.3,
      views: 18,
      student: false,
      rate: true,
      rateError: true,
      alumni: false,
      review: true,
      sold: false,
      rent: false
    },
    {
      id: 6,
      name: "Coffee Maker",
      price: 20,
      originalPrice: 60,
      condition: "Fair",
      category: "Kitchen",
      location: "Marcy-holmes",
      image: "https://us.home-appliances.philips/cdn/shop/files/BaristaBrew_LongAmericano_1920x1080_pdp_1500x.jpg?v=1727984512",
      seller: "Lisa H.",
      availableUntil: "2025-06-01",
      description: "Works great, some cosmetic wear",
      deliveryAvailable: true,
      pickupAvailable: false,
      rating: 3.8,
      views: 9,
      student: false,
      rate: false,
      rateError: false,
      alumni: false,
      review: true,
      sold: false,
      rent: false
    }
  ];
  

  const notifications = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" },
      { 
        id: 4, 
        type: "message from Jordan T.", 
        productId: 5,
        message: "Is it okay to have a deal in Quad? I think Quad is right between your place and mine.", 
        time: "30min ago" 
    } 
  ];


  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    const matchesCondition = selectedCondition === "All Conditions" || product.condition === selectedCondition;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    const matchesLocation = selectedLocation === "All Locations" || product.location === selectedLocation;
    const matchesFavorites = !showFavorite || favorites.has(product.id);
    const matchesDelivery = !selectedDelivery || product.deliveryAvailable === selectedDelivery;
    const matchesPickup = !selectedPickup || product.pickupAvailable === selectedPickup;
    const matchesAvailableUntil =
      !showAvailableDate || new Date(product.availableUntil) <= showAvailableDate;
    
    return matchesSearch && matchesCategory && matchesCondition && matchesPrice && matchesLocation && matchesFavorites && matchesDelivery && matchesPickup && matchesAvailableUntil
  });

  const toggleFavorite = (product) => {
    const raw = localStorage.getItem("favorites");
    let favorites = raw ? JSON.parse(raw) : [];

    const exists = favorites.find(p => p.id === product.id);

    if (exists) {
      favorites = favorites.filter(p => p.id !== product.id);
    } else {
      favorites.push(product); // full product info
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));

    setFavorites(new Set(favorites.map(p => p.id))); 
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

  const handleTabClick = (tab: string) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchHistory((prev) => {
      const updated = [searchQuery, ...prev.filter(q => q !==searchQuery)].slice(0,5);
      localStorage.setItem("searchHistory", JSON.stringify(updated));
      return updated;
    })
  }

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

  const NotificationsButton = ({ notifications }) => {
    const [showNotifications, setShowNotifications] = useState(false);

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
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => router.push(`browse/notification?id=${notif.id}`)}
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

                {/* See All Notifications */}
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

  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    if (typeof window === "undefined") return; // SSR guard

    const viewedIds = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
    const searchTerms = JSON.parse(localStorage.getItem("searchHistory") || "[]");

    const viewedProducts = products.filter(p => viewedIds.includes(p.id));

    if (viewedProducts.length === 0) {
      setRecommended(products.slice(0, 4)); // fallback
      return;
    }

    const similarByView = products.filter(p =>
      viewedProducts.some(vp =>
        p.id !== vp.id && (
          p.category === vp.category ||
          p.location === vp.location ||
          Math.abs(p.price - vp.price) < 20
        )
      )
    );

    const similarBySearch = products.filter(p =>
      searchTerms.some(term =>
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(term.toLowerCase()))
      )
    );

    const combined = [...similarByView, ...similarBySearch];
    const uniqueRecommended = [...new Map(combined.map(p => [p.id, p])).values()].slice(0, 4);

    setRecommended(uniqueRecommended.length > 0 ? uniqueRecommended : products.slice(0, 4));
  }, []); // If products are loaded later, like from an API, change the empty [] to [products]

  if (recommended.length === 0) return null;
  




  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">Subox</span>
              <span className="text-sm text-gray-500 hidden sm:block">Move Out Sales</span>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <form onSubmit={handleSearchSubmit}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setShowHistory(true)}
                    onBlur={() => setTimeout(() => setShowHistory(false), 200)} // Slight delay to allow click
                    placeholder="Search items..."
                    className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              

              {/* Notifications */}
              <NotificationsButton notifications={notifications} />

              {/* Profile */}
              <div className="relative">
                {/* Greeting */}
                <span className="text-sm text-gray-700 font-medium">
                  {userItself ? `Welcome, ${userItself.displayName || "User"}` : "Please sign in"}
                </span>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfile(!showProfile)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
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
                        <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Purchased</button>
                        <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Returned</button>
                        <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Cancelled</button>
                        <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Sold</button>
                        <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Sublease</button>
                        <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Reviews</button>
                        <hr className="my-2" />
                        <button onClick={() => router.push('browse/temp')} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Temp</button>
                        <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">History</button>
                        <button onClick={() => handleTabClick("other")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Other</button>
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
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
                    ✕
                  </button>
                </div>

                {/* Category */}
                <div className="mt-11">
                  <FilterSection title={`${selectedCategory}`} id="category">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                          selectedCategory === category 
                            ? "bg-orange-100 text-orange-700 font-medium" 
                            : "hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {category === "All Categories" ? "All Categories" : category}
                      </button>
                    ))}
                  </FilterSection>
                </div>

                {/* Condition */}
                <FilterSection title={`${selectedCondition}`} id="condition">
                  {conditions.map(condition => (
                    <button
                      key={condition}
                      onClick={() => setSelectedCondition(condition)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${
                        selectedCondition === condition 
                          ? "bg-orange-100 text-orange-700 font-medium" 
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {condition === "All Conditions" ? "All Conditions" : condition}
                    </button>
                  ))}
                </FilterSection>

                {/* Price Range */}
                <div className="mb-3 mt-6">
                  <label className="block text-sm font-medium">
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
                    className="w-full"
                  />
                </div>
                {/* Favorite */}
                <div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowFavorite(!showFavorite)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        showFavorite 
                          ? "bg-red-500 text-white" 
                          : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={showFavorite ? "currentColor" : "none"} />
                    </motion.button>
                </div>
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
                          : "bg-white/90 text-gray-600 hover:bg-orange-50 hover:text-orange-500"
                      }`}
                >
                  <Truck
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
                          : "bg-white/90 text-gray-600 hover:bg-orange-50 hover:text-orange-500"
                      }`}
                >
                  <Package
                    className="w-4 h-4"
                    fill={selectedPickup ? "currentColor" : "none"}
                  />
                </motion.button>
                {/* Available Date */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Available Until</h2>
                  <DatePicker
                    selected={showAvailableDate}
                    onChange={(date) => setShowAvailableDate(date)}
                    dateFormat="yyyy-MM-dd"
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                    placeholderText="Select a date"
                    minDate={new Date()}
                  />
                </div>
              </div>
            </div>
          {/*Location*/}
          <div className="fixed top-30 left-6 z-40">
            <div className="relative inline-block w-53">
              {/* Dropdown Button */}
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {selectedLocation || "Select Location"}
              </button>

              {/* Dropdown List */}
              {showLocationDropdown && (
                <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {locations.map((location) => (
                    <button
                      key={location}
                      onClick={() => {
                        setSelectedLocation(location);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm capitalize transition-colors ${
                        selectedLocation === location
                          ? "bg-orange-100 text-orange-700 font-medium"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === "list" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <List className="w-5 h-5" />
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
                  className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
                    viewMode === "list" ? "flex" : ""
                  }`}
                >
                  <Link href={`browse/product/${product.id}`} className="block">
                    <div className="cursor-pointer">
                      {/* Product Image */}
                      <div className={`relative ${viewMode === "list" ? "w-48 h-32" : "aspect-square"}`}>
                        <img
                          src={product.image}
                          className="w-full h-full object-cover"
                        />
                        {/* Condition Badge */}
                        <div className="absolute bottom-2 left-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.condition === "new" ? "bg-green-100 text-green-700" :
                            product.condition === "like-new" ? "bg-blue-100 text-blue-700" :
                            product.condition === "good" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {product.condition}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900">${product.price}</div>
                            <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                          </div>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" />
                            <span className="capitalize">{product.location.replace("-", " ")}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Until {product.availableUntil}</span>
                          </div>
                          {product.deliveryAvailable && (
                            <div className="flex items-center space-x-1">
                              <Truck className="w-3 h-3" />
                              <span>Delivery</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium">{product.rating}</span>
                            </div>
                            <span className="text-gray-500 text-sm">• {product.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                      {/* Product Seller info */}
                        <Link key={`seller-${product.id}`} href={`browse/profile/${product.seller}`} className="text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1">
                          Sold by <span className="font-medium text-gray-700">{product.seller}</span>
                          {product.rate && product.rateError && (
                            <div className="w-5 h-5">
                              <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                                aria-label="Five Star Badge Icon"
                                role="img"
                              >
                                <title>Five Star Badge Icon</title>

                                {/* Black circular base */}
                                <circle cx="50" cy="50" r="48" fill="#000" />

                                {/* Wavy edge */}
                                {[...Array(20)].map((_, i) => {
                                  const angle = (i * 360) / 20;
                                  const rad = (angle * Math.PI) / 180;
                                  const rOuter = 50;
                                  const rInner = 45;
                                  const x1 = 50 + rOuter * Math.cos(rad);
                                  const y1 = 50 + rOuter * Math.sin(rad);
                                  const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
                                  const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
                                  const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
                                  const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);
                                  return (
                                    <path
                                      key={i}
                                      d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`}
                                      fill="#000"
                                    />
                                  );
                                })}

                                {/* Five Stars smaller for spacing */}
                                <g>
                                  {[...Array(5)].map((_, i) => {
                                    const angle = (i * 360) / 5 - 90;
                                    const rad = (angle * Math.PI) / 180;
                                    const r = 20;
                                    const cx = 50 + r * Math.cos(rad);
                                    const cy = 50 + r * Math.sin(rad);

                                    const starPoints = [];
                                    const numPoints = 5;
                                    const outerRadius = 10; // Slightly larger
                                    const innerRadius = 5;

                                    for (let j = 0; j < numPoints * 2; j++) {
                                      const isOuter = j % 2 === 0;
                                      const radius = isOuter ? outerRadius : innerRadius;
                                      const pointAngle = (j * Math.PI) / numPoints - Math.PI / 2;
                                      const x = cx + radius * Math.cos(pointAngle);
                                      const y = cy + radius * Math.sin(pointAngle);
                                      starPoints.push(`${x},${y}`);
                                    }

                                    return (
                                      <polygon
                                        key={i}
                                        points={starPoints.join(" ")}
                                        fill="#FFD700"
                                      />
                                    );
                                  })}
                                </g>
                              </svg>
                            </div>
                          )}

                          {product.student && (
                            <div className="w-5 h-5">
                              <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                              >
                                {/* Maroon base circle */}
                                <circle cx="50" cy="50" r="48" fill="#7A0019" />
                                
                                {/* Wavy bottle cap edge */}
                                {[...Array(20)].map((_, i) => {
                                  const angle = (i * 360) / 20;
                                  const rad = (angle * Math.PI) / 180;
                                  const rOuter = 50;
                                  const rInner = 45;
                                  const x1 = 50 + rOuter * Math.cos(rad);
                                  const y1 = 50 + rOuter * Math.sin(rad);
                                  const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
                                  const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
                                  const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
                                  const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);

                                  return (
                                    <path
                                      key={i}
                                      d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`}
                                      fill="#7A0019"
                                    />
                                  );
                                })}

                                {/* Gold "M" */}
                                <text
                                  x="50"
                                  y="64"
                                  textAnchor="middle"
                                  fontSize="45"
                                  fontWeight="900"
                                  fill="#FFCC33"
                                  fontFamily="Georgia, serif"
                                >
                                  M
                                </text>
                              </svg>
                            </div>
                          )}


                          {product.sold && (
                            <div className="w-5 h-5">
                              <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                {/* Yellow base */}
                                <circle cx="50" cy="50" r="48" fill="#FFD700" />

                                {/* Wavy edge (bottle cap) */}
                                {[...Array(20)].map((_, i) => {
                                  const angle = (i * 360) / 20;
                                  const rad = (angle * Math.PI) / 180;
                                  const rOuter = 50;
                                  const rInner = 45;
                                  const x1 = 50 + rOuter * Math.cos(rad);
                                  const y1 = 50 + rOuter * Math.sin(rad);
                                  const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
                                  const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
                                  const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
                                  const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);
                                  return <path key={i} d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`} fill="#FFD700" />;
                                })}

                                {/* Larger Handshake Icon */}
                                <g transform="translate(35, 63) scale(0.007, -0.007) translate(-2500, -2500)">
                                  <path d="M4245 8763 c-337 -82 -607 -271 -782 -548 -64 -100 -125 -256 -159
                                  -405 -24 -104 -24 -377 0 -470 57 -214 114 -343 212 -473 87 -115 223 -241
                                  339 -314 52 -33 207 -104 265 -122 159 -48 196 -53 370 -53 175 0 209 5 375
                                  55 245 74 506 278 652 512 27 42 106 208 114 238 60 224 58 216 59 394 0 135
                                  -4 189 -19 251 -35 148 -72 241 -153 384 -102 180 -382 420 -558 478 -14 5
                                  -50 18 -80 29 -126 48 -211 61 -398 60 -118 -1 -197 -6 -237 -16z m841 -724
                                  c32 -30 46 -84 34 -133 -8 -34 -60 -90 -387 -418 -403 -404 -409 -408 -489
                                  -393 -32 6 -65 33 -206 173 -133 131 -170 174 -179 204 -14 54 -2 101 35 137
                                  28 28 41 32 85 33 63 0 71 -5 189 -121 51 -50 100 -91 110 -91 9 0 157 140
                                  327 311 171 171 319 315 330 320 35 16 125 3 151 -22z"/>
                                  <path d="M1686 6187 c-17 -18 -53 -64 -79 -103 -74 -107 -133 -186 -691 -938
                                  -98 -133 -185 -250 -193 -261 -7 -11 -107 -147 -221 -302 -417 -567 -378 -509
                                  -368 -547 5 -21 137 -134 326 -278 19 -15 67 -52 105 -82 189 -151 239 -186
                                  264 -186 35 0 39 4 102 90 147 199 407 549 427 576 12 16 35 47 50 69 15 22
                                  39 56 54 75 34 44 384 517 435 588 47 65 75 103 241 327 74 99 142 191 152
                                  205 10 14 50 68 89 120 39 52 71 102 71 111 0 22 -33 57 -110 115 -78 59 -408
                                  320 -465 368 -65 54 -116 86 -138 86 -11 0 -34 -15 -51 -33z"/>
                                  <path d="M7655 6191 c-90 -43 -175 -81 -180 -81 -3 0 -35 -14 -72 -31 -88 -40
                                  -118 -54 -173 -77 -91 -40 -166 -73 -195 -87 -200 -90 -205 -94 -205 -136 0
                                  -16 6 -43 14 -61 8 -18 35 -84 60 -145 25 -62 67 -164 92 -225 48 -117 85
                                  -209 136 -338 16 -41 36 -88 43 -105 7 -16 26 -64 43 -105 16 -41 51 -127 77
                                  -190 26 -63 60 -148 76 -187 16 -40 42 -106 58 -145 16 -40 50 -125 76 -188
                                  26 -63 61 -149 77 -190 17 -41 36 -88 43 -105 12 -28 32 -76 105 -260 25 -64
                                  82 -201 147 -360 13 -33 32 -68 40 -77 20 -22 56 -23 96 -2 49 25 54 28 197
                                  89 73 31 141 61 149 65 9 4 32 15 51 23 19 9 65 30 103 46 37 17 69 31 72 31
                                  3 0 35 14 72 31 38 17 92 42 120 55 29 14 57 34 63 45 12 22 6 64 -18 119 -30
                                  71 -41 97 -72 175 -17 44 -37 94 -45 110 -7 17 -19 48 -28 70 -20 53 -76 192
                                  -92 230 -7 17 -28 66 -45 110 -17 44 -37 94 -45 110 -7 17 -19 48 -28 70 -20
                                  53 -76 192 -92 230 -7 17 -28 66 -45 110 -18 44 -38 94 -45 110 -7 17 -20 48
                                  -28 70 -8 22 -36 92 -62 155 -26 63 -61 149 -77 190 -17 41 -36 89 -43 105 -7
                                  17 -27 65 -44 108 -80 200 -139 346 -195 482 -25 61 -46 115 -46 121 0 19 -46
                                  54 -71 54 -13 0 -42 -9 -64 -19z"/>
                                  <path d="M4325 5511 c-57 -8 -172 -53 -229 -89 -22 -14 -83 -66 -135 -116
                                  -691 -659 -698 -667 -706 -709 -16 -86 16 -140 110 -183 127 -58 221 -76 390
                                  -76 185 0 299 27 450 104 219 113 269 132 380 147 169 21 343 -26 478 -130 40
                                  -32 507 -405 632 -506 33 -26 72 -57 86 -68 15 -11 73 -58 130 -104 138 -111
                                  171 -138 239 -191 31 -25 135 -108 231 -186 162 -130 296 -223 344 -237 11 -3
                                  45 -15 75 -27 54 -21 81 -28 205 -50 104 -18 182 -12 478 37 107 18 110 21 83
                                  85 -8 18 -29 69 -46 113 -18 44 -38 94 -45 110 -12 28 -32 76 -105 260 -15 39
                                  -49 122 -75 185 -26 63 -54 133 -62 155 -9 22 -21 54 -28 70 -8 17 -27 65 -44
                                  108 -54 135 -93 231 -106 262 -7 17 -28 66 -45 110 -17 44 -37 94 -45 110 -7
                                  17 -20 50 -30 75 -9 25 -23 59 -30 75 -7 17 -26 64 -43 105 -64 159 -95 236
                                  -107 265 -12 26 -58 141 -86 213 -12 30 -33 27 -104 -14 -203 -117 -325 -147
                                  -507 -125 -57 7 -136 19 -177 27 -40 8 -87 14 -103 14 -17 0 -67 7 -112 15
                                  -44 8 -126 21 -181 29 -55 9 -134 21 -175 27 -41 7 -91 13 -110 16 -19 2 -79
                                  10 -132 18 -54 8 -144 22 -200 30 -57 9 -143 22 -193 30 -110 18 -282 26 -350
                                  16z"/>
                                  <path d="M2377 5081 c-89 -120 -250 -338 -357 -485 -107 -146 -266 -361 -353
                                  -478 -87 -117 -197 -267 -244 -333 -47 -66 -101 -139 -120 -163 -43 -53 -39
                                  -67 32 -118 63 -45 135 -138 163 -210 11 -27 23 -80 27 -117 4 -37 11 -69 15
                                  -72 4 -2 31 13 60 35 91 68 191 110 301 128 91 15 107 15 199 0 292 -47 502
                                  -268 539 -566 6 -46 14 -88 17 -94 4 -6 27 -8 58 -4 121 15 284 -28 391 -102
                                  71 -49 111 -88 159 -157 79 -111 108 -194 116 -330 l5 -100 95 -6 c95 -5 210
                                  -40 251 -75 8 -8 19 -14 23 -14 4 0 32 -21 61 -47 107 -92 178 -228 194 -373
                                  l6 -55 95 -7 c140 -9 226 -38 331 -110 95 -64 160 -153 211 -285 20 -49 23
                                  -77 23 -188 0 -135 -2 -143 -56 -261 -11 -23 -17 -48 -14 -56 11 -29 105 -58
                                  186 -58 158 0 275 92 314 248 13 51 14 73 5 114 -16 78 -44 133 -92 180 -35
                                  36 -219 183 -372 298 -18 14 -78 60 -132 103 -55 43 -151 118 -215 167 -151
                                  115 -169 137 -169 202 0 66 33 113 90 128 74 20 68 24 425 -255 147 -115 221
                                  -172 350 -272 55 -42 135 -105 178 -140 162 -131 234 -155 362 -118 58 17 131
                                  74 163 128 34 55 47 138 33 205 -18 82 -60 137 -159 210 -89 64 -269 193 -422
                                  302 -149 106 -333 238 -414 297 -86 63 -116 101 -116 151 0 63 38 111 103 132
                                  61 19 60 20 509 -303 68 -48 165 -118 217 -155 51 -37 128 -92 170 -123 279
                                  -203 365 -236 498 -194 68 22 102 42 151 89 130 123 147 314 40 462 -23 32
                                  -132 120 -378 303 -190 141 -361 268 -380 281 -19 14 -42 30 -50 37 -8 6 -82
                                  61 -164 122 -82 61 -157 123 -168 138 -11 18 -18 46 -18 77 0 43 4 53 39 87
                                  35 35 44 39 91 39 47 0 59 -5 137 -61 47 -33 91 -65 97 -70 11 -10 443 -330
                                  531 -394 28 -20 143 -106 258 -191 114 -85 211 -154 216 -154 5 0 14 -6 20
                                  -14 11 -13 24 -17 116 -36 84 -18 242 46 294 118 45 64 61 114 61 198 0 59 -4
                                  85 -14 94 -8 6 -48 17 -88 25 -263 47 -387 114 -738 395 -81 65 -195 156 -294
                                  235 -127 101 -322 257 -361 290 -22 18 -89 72 -150 120 -60 47 -137 108 -170
                                  135 -334 270 -362 289 -469 309 -95 18 -165 0 -330 -83 -147 -74 -172 -85
                                  -271 -116 -136 -43 -190 -50 -370 -50 -176 0 -234 7 -360 46 -202 62 -306 136
                                  -375 264 -34 64 -35 68 -34 180 0 109 2 119 32 181 28 57 59 92 209 238 105
                                  102 173 175 167 181 -5 5 -151 10 -324 12 -284 3 -319 5 -360 23 -50 21 -121
                                  67 -140 90 -7 8 -16 15 -21 15 -5 0 -82 -99 -172 -219z"/>
                                  <path d="M1903 2995 c-103 -25 -168 -79 -293 -245 -36 -47 -70 -92 -76 -100
                                  -7 -8 -32 -40 -56 -70 -280 -354 -310 -404 -316 -522 -6 -125 33 -217 132
                                  -304 76 -68 137 -89 251 -88 93 2 121 10 207 63 36 22 110 108 264 309 43 57
                                  128 167 187 245 153 199 161 217 161 347 -1 125 -18 170 -93 252 -56 61 -112
                                  95 -191 114 -66 16 -108 16 -177 -1z"/>
                                  <path d="M2612 2302 c-64 -33 -107 -73 -177 -166 -30 -39 -98 -128 -152 -198
                                  -306 -396 -305 -395 -323 -487 -8 -39 -7 -71 1 -115 36 -189 214 -313 397
                                  -276 65 13 150 55 184 90 14 15 112 136 198 246 78 98 268 333 286 353 12 13
                                  36 52 53 87 27 55 31 75 31 144 0 146 -63 246 -201 320 -52 27 -65 30 -150 30
                                  -82 -1 -101 -4 -147 -28z"/>
                                  <path d="M3335 1622 c-79 -33 -95 -50 -255 -252 -72 -92 -163 -203 -183 -225
                                  -36 -39 -77 -109 -88 -149 -18 -68 -6 -167 28 -228 66 -117 207 -185 331 -159
                                  95 21 142 59 244 196 37 50 88 117 112 150 132 176 159 214 183 265 37 78 41
                                  145 12 222 -29 79 -102 155 -175 181 -61 21 -156 21 -209 -1z"/>
                                  <path d="M4005 1053 c-72 -30 -97 -50 -167 -140 -38 -48 -75 -95 -81 -103
                                  -119 -148 -142 -197 -141 -299 2 -109 39 -182 121 -242 77 -55 117 -69 198
                                  -69 122 0 204 51 292 183 26 39 50 77 53 82 3 6 23 37 45 70 67 102 77 131 78
                                  225 0 72 -4 93 -26 136 -68 134 -245 209 -372 157z"/>
                                </g>
                              </svg>
                            </div>
                          )}

                          {product.rent && (
                            <div className="w-5 h-5">
                              <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                                aria-label="Rent contract badge icon"
                                role="img"
                              >
                                <title>Rent Contract Icon</title>

                                {/* Green circular base */}
                                <circle cx="50" cy="50" r="48" fill="#4CAF50" />

                                {/* Wavy edge */}
                                {[...Array(20)].map((_, i) => {
                                  const angle = (i * 360) / 20;
                                  const rad = (angle * Math.PI) / 180;
                                  const rOuter = 50;
                                  const rInner = 45;
                                  const x1 = 50 + rOuter * Math.cos(rad);
                                  const y1 = 50 + rOuter * Math.sin(rad);
                                  const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
                                  const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
                                  const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
                                  const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);
                                  return (
                                    <path
                                      key={i}
                                      d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`}
                                      fill="#4CAF50"
                                    />
                                  );
                                })}

                                {/* Even Bigger Center Icon */}
                                <g transform="translate(33, 77) scale(0.0045, -0.0045) translate(-2500, -2500)">
                                  <path d="M4495 13910 c-265 -26 -538 -108 -790 -239 -91 -47 -89 -46 -210
                                  -125 -278 -182 -549 -479 -694 -760 -23 -44 -38 -83 -34 -87 5 -4 71 -33 148
                                  -63 77 -31 149 -60 160 -65 11 -5 39 -17 63 -26 47 -20 50 -30 23 -83 -17 -34
                                  -54 -146 -94 -281 -19 -62 -11 -87 30 -97 53 -14 169 -90 240 -158 147 -138
                                  225 -304 248 -521 11 -112 -30 -305 -84 -395 -11 -19 -24 -42 -27 -50 -10 -22
                                  -73 -100 -115 -141 -161 -160 -408 -245 -636 -218 -182 21 -340 90 -458 201
                                  -145 135 -211 258 -250 462 -19 99 -19 154 1 252 39 195 124 338 271 455 74
                                  59 224 139 261 139 24 0 52 30 52 56 0 11 7 45 15 75 8 30 23 81 32 114 21 80
                                  61 200 84 253 29 68 26 78 -27 86 -133 18 -419 -3 -609 -44 -283 -62 -589
                                  -203 -817 -376 -142 -108 -299 -259 -389 -374 -24 -30 -46 -57 -50 -60 -9 -7
                                  -118 -175 -147 -225 -82 -146 -161 -340 -207 -510 -9 -33 -23 -83 -31 -111 -8
                                  -28 -14 -62 -14 -75 0 -13 -7 -57 -15 -98 -22 -105 -22 -479 0 -604 59 -333
                                  154 -578 323 -838 93 -142 255 -323 390 -434 39 -33 62 -74 62 -112 0 -15 -21
                                  -107 -46 -203 -25 -96 -49 -191 -53 -211 -4 -19 -11 -41 -15 -47 -3 -6 -10
                                  -30 -15 -54 -5 -24 -16 -70 -25 -103 -10 -33 -37 -139 -62 -235 -25 -96 -54
                                  -209 -65 -250 -11 -41 -24 -91 -28 -110 -5 -19 -19 -71 -31 -115 -12 -44 -26
                                  -96 -31 -115 -4 -19 -17 -69 -29 -110 -12 -41 -24 -101 -27 -133 -6 -59 -1
                                  -75 62 -212 55 -119 85 -185 85 -189 0 -3 19 -44 41 -93 71 -152 82 -199 57
                                  -246 -15 -29 -13 -28 -243 -181 -110 -73 -211 -146 -225 -161 -43 -46 -35 -98
                                  39 -250 35 -71 83 -171 107 -220 59 -121 59 -154 1 -209 -23 -23 -74 -60 -112
                                  -84 -207 -127 -309 -197 -327 -226 -35 -56 -29 -77 112 -371 101 -211 103
                                  -218 71 -272 -13 -21 -49 -47 -108 -79 -48 -26 -106 -58 -128 -70 -22 -13 -64
                                  -36 -94 -51 -126 -65 -141 -120 -70 -252 23 -42 57 -105 77 -141 19 -36 38
                                  -69 42 -75 4 -5 22 -37 40 -70 18 -33 45 -82 60 -110 15 -27 44 -81 65 -120
                                  93 -172 134 -213 199 -201 18 4 87 38 152 77 65 39 135 80 154 90 19 11 51 29
                                  70 40 19 12 100 59 180 106 80 47 186 109 237 139 50 30 101 65 111 79 11 14
                                  30 58 41 98 27 91 51 171 66 222 26 84 82 275 165 570 5 17 18 62 30 100 12
                                  39 25 84 30 100 104 368 146 513 166 570 8 23 14 48 14 57 0 10 6 32 14 50 8
                                  18 35 107 61 198 72 256 86 303 94 330 8 24 24 79 55 185 7 28 27 95 44 150
                                  16 55 44 152 62 215 39 141 105 365 135 465 36 116 150 512 165 573 5 19 13
                                  46 18 60 5 15 17 54 27 87 9 33 23 78 30 100 7 22 27 92 45 155 64 232 67 240
                                  114 261 22 10 54 19 70 19 54 0 222 47 366 103 377 144 721 412 991 772 89
                                  118 239 379 239 416 0 21 -20 29 -73 29 -63 0 -230 37 -382 86 -201 64 -343
                                  132 -536 259 -151 99 -185 138 -195 227 -12 106 30 178 133 225 57 26 147 33
                                  196 14 15 -6 73 -41 130 -78 129 -86 128 -85 217 -129 79 -38 296 -110 415
                                  -138 103 -23 268 -32 282 -15 6 8 19 61 29 119 28 158 26 510 -4 677 -22 122
                                  -59 265 -87 336 -8 20 -22 56 -31 80 -9 23 -43 96 -75 162 -239 495 -678 881
                                  -1219 1073 -65 23 -72 41 -35 95 14 21 25 40 25 43 0 15 145 189 220 264 189
                                  190 453 352 685 420 215 63 325 80 525 80 200 0 310 -17 525 -80 101 -29 263
                                  -104 370 -170 182 -112 347 -263 479 -438 84 -111 209 -341 204 -374 -3 -24
                                  -12 -29 -93 -54 -210 -64 -438 -252 -565 -465 -88 -149 -141 -409 -120 -591 5
                                  -40 14 -131 20 -203 5 -71 19 -233 30 -360 11 -126 23 -267 27 -311 l6 -81
                                  -59 -35 c-114 -66 -265 -121 -459 -168 -27 -6 -114 -18 -193 -24 -163 -15
                                  -166 -17 -202 -103 -13 -32 -38 -89 -56 -128 -60 -130 -84 -187 -84 -201 0 -8
                                  21 -15 57 -20 83 -10 385 4 473 22 231 47 318 72 453 126 68 28 102 37 109 30
                                  6 -6 14 -64 19 -129 4 -65 13 -149 18 -188 6 -38 11 -95 11 -125 0 -30 7 -116
                                  15 -190 8 -74 21 -205 29 -290 16 -171 41 -258 103 -364 82 -141 55 -113 1008
                                  -1055 253 -250 658 -651 900 -890 242 -239 625 -617 850 -840 226 -223 599
                                  -593 830 -822 231 -229 439 -428 462 -443 37 -22 53 -26 120 -26 64 1 85 5
                                  116 24 36 22 141 125 962 935 176 174 635 627 1020 1007 385 380 850 839 1034
                                  1020 360 355 381 382 381 474 0 93 -20 117 -417 509 -202 201 -561 556 -798
                                  791 -236 234 -651 644 -921 910 -269 267 -780 772 -1135 1122 -355 351 -672
                                  658 -704 684 -68 52 -219 144 -238 144 -7 0 -17 4 -22 9 -20 18 -154 51 -250
                                  61 -128 13 -408 39 -550 50 -159 13 -333 30 -470 46 -67 8 -141 14 -165 14
                                  -25 0 -108 7 -185 15 -77 8 -210 21 -295 30 -85 8 -225 21 -310 30 -85 8 -174
                                  15 -197 15 -47 0 -64 13 -82 62 -27 71 -44 115 -59 153 -25 62 -130 264 -161
                                  310 -100 146 -132 189 -213 282 -175 200 -419 387 -658 504 -112 55 -264 115
                                  -360 142 -208 58 -327 77 -535 82 -99 2 -220 0 -270 -5z m4963 -4039 c55 -28
                                  97 -79 117 -140 17 -51 17 -56 0 -115 l-18 -61 -570 -565 c-313 -311 -583
                                  -574 -601 -585 -24 -16 -48 -20 -111 -20 -69 0 -85 4 -115 25 -45 32 -51 38
                                  -78 81 -29 49 -31 153 -2 208 23 46 1132 1146 1182 1172 46 25 147 25 196 0z
                                  m1216 -1233 c148 -42 222 -202 150 -324 -35 -59 -1121 -1132 -1177 -1161 -100
                                  -54 -245 -15 -301 81 -33 57 -37 156 -7 214 17 34 1108 1122 1163 1160 21 15
                                  92 40 117 41 7 1 32 -4 55 -11z"/>
                                  <path d="M2655 11695 c-103 -38 -193 -144 -216 -254 -13 -62 -1 -160 27 -212
                                  63 -122 233 -212 357 -188 118 22 211 90 261 191 22 43 26 66 26 133 0 71 -4
                                  90 -30 142 -36 71 -103 141 -168 174 -59 30 -194 37 -257 14z"/>
                                </g>
                              </svg>
                            </div>
                          )}

                          {product.alumni && (
                            <div className="w-5 h-5">
                              <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                                aria-label="Graduation Badge Icon"
                                role="img"
                              >
                                <title>Graduation Badge Icon</title>

                                {/* Blue circular base */}
                                <circle cx="50" cy="50" r="48" fill="#2196F3" />

                                {/* Wavy edge */}
                                {[...Array(20)].map((_, i) => {
                                  const angle = (i * 360) / 20;
                                  const rad = (angle * Math.PI) / 180;
                                  const rOuter = 50;
                                  const rInner = 45;
                                  const x1 = 50 + rOuter * Math.cos(rad);
                                  const y1 = 50 + rOuter * Math.sin(rad);
                                  const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
                                  const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
                                  const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
                                  const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);
                                  return (
                                    <path
                                      key={i}
                                      d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`}
                                      fill="#2196F3"
                                    />
                                  );
                                })}

                                {/* Graduation Cap with Larger Size */}
                                <g transform="translate(70, 34) scale(0.022, -0.022) translate(-2500, -2500)">
                                  <path d="M1538 2733 c-9 -2 -290 -133 -625 -291 -426 -202 -609 -293 -611
                                  -305 -3 -14 16 -26 77 -54 l81 -36 0 -217 c0 -119 3 -257 6 -306 l7 -89 -42
                                  -18 c-51 -23 -92 -80 -98 -139 -5 -54 29 -125 74 -153 28 -18 32 -25 33 -65 0
                                  -117 -50 -296 -110 -389 -40 -61 -99 -123 -143 -149 -29 -18 -41 -41 -32 -63
                                  6 -14 232 -185 259 -195 19 -7 77 46 114 104 68 106 77 222 37 446 -13 76 -27
                                  171 -31 211 -6 71 -6 72 19 79 36 9 87 55 103 93 32 75 4 163 -66 209 l-40 27
                                  0 283 c0 156 2 284 5 284 3 0 184 -84 403 -187 561 -263 583 -273 621 -273 23
                                  0 164 62 450 196 229 108 507 239 619 292 111 52 202 100 202 107 0 7 -6 17
                                  -12 22 -27 21 -1225 571 -1253 576 -16 3 -37 3 -47 0z"/>
                                  <path d="M2005 1628 c-198 -93 -377 -172 -397 -175 -60 -9 -109 9 -413 153
                                  -160 75 -314 147 -343 160 l-53 24 3 -273 3 -274 30 -43 c73 -106 261 -194
                                  500 -235 119 -20 353 -23 470 -6 266 40 471 138 542 258 l28 48 3 268 c2 147
                                  0 267 -5 266 -4 0 -170 -77 -368 -171z"/>
                                </g>
                              </svg>
                            </div>
                          )}
                          {product.review && (
                            <div className="w-5 h-5">
                              <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                                aria-label="Pencil Badge Icon"
                                role="img"
                              >
                                <title>Pencil Badge Icon</title>

                                {/* White circular base */}
                                <circle cx="50" cy="50" r="48" fill="#FFFFFF" />

                                {/* Wavy edge */}
                                {[...Array(20)].map((_, i) => {
                                  const angle = (i * 360) / 20;
                                  const rad = (angle * Math.PI) / 180;
                                  const rOuter = 50;
                                  const rInner = 45;
                                  const x1 = 50 + rOuter * Math.cos(rad);
                                  const y1 = 50 + rOuter * Math.sin(rad);
                                  const x2 = 50 + rInner * Math.cos(rad + Math.PI / 40);
                                  const y2 = 50 + rInner * Math.sin(rad + Math.PI / 40);
                                  const x3 = 50 + rOuter * Math.cos(rad + Math.PI / 20);
                                  const y3 = 50 + rOuter * Math.sin(rad + Math.PI / 20);
                                  return (
                                    <path
                                      key={i}
                                      d={`M${x1},${y1} Q${x2},${y2} ${x3},${y3} Z`}
                                      fill="#FFFFFF"
                                      stroke="#000"
                                      strokeWidth="1"
                                    />
                                  );
                                })}

                                {/* Centered, Larger Pencil */}
                                <g transform="translate(50, 50) scale(1.1) rotate(-45) translate(-22, -22)">
                                  
                                  {/* Eraser */}
                                  <rect x="20" y="0" width="10" height="5" fill="#000" />

                                  {/* Body */}
                                  <rect x="20" y="7" width="10" height="23" fill="#000" />

                                  {/* Tip */}
                                  <polygon points="20,30 30,30 25,40" fill="#000" />

                                </g>
                              </svg>
                            </div>
                          )}
                          </span>
                        </Link>
                  </div>
                  {/* Quick Actions Overlay */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(product)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        favorites.has(product.id) 
                          ? "bg-red-500 text-white" 
                          : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={favorites.has(product.id) ? "currentColor" : "none"} />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleCompare(product.id)}
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
            {filteredProducts.length === 0 && (
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
                    className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all ${
                      viewMode === "list" ? "flex" : ""
                    }`}
                  >
                    <Link href={`/product/${product.id}`} className="block">
                      <div className="cursor-pointer">
                        {/* Product Image */}
                        <div className={`relative ${viewMode === "list" ? "w-48 h-32" : "aspect-square"}`}>
                          <img
                            src={product.image}
                            className="w-full h-full object-cover"
                          />
                          {/* Condition Badge */}
                          <div className="absolute bottom-2 left-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              product.condition === "new" ? "bg-green-100 text-green-700" :
                              product.condition === "like-new" ? "bg-blue-100 text-blue-700" :
                              product.condition === "good" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {product.condition}
                            </span>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="p-4 flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 text-lg">{product.name}</h3>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">${product.price}</div>
                              <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                            </div>
                          </div>

                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span className="capitalize">{product.location.replace("-", " ")}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Until {product.availableUntil}</span>
                            </div>
                            {product.deliveryAvailable && (
                              <div className="flex items-center space-x-1">
                                <Truck className="w-3 h-3" />
                                <span>Delivery</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{product.rating}</span>
                              </div>
                              <span className="text-gray-500 text-sm">• {product.views} views</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        {/* Product Seller info */}
                          <Link key={`seller-${product.id}`} href={`/profile/${product.seller}`} className="text-sm text-gray-500">
                            Sold by <span className="font-medium text-gray-700">{product.seller}</span>
                          </Link>
                    </div>
                    {/* Quick Actions Overlay */}
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleFavorite(product.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          favorites.has(product.id) 
                            ? "bg-red-500 text-white" 
                            : "bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500"
                        }`}
                      >
                        <Heart className="w-4 h-4" fill={favorites.has(product.id) ? "currentColor" : "none"} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => toggleCompare(product.id)}
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
      
      {/*comparison table*/}
      {showComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full p-6 relative overflow-x-auto">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              onClick={() => setShowComparison(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">Compare Products</h2>

            <table className="min-w-full table-auto border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 text-gray-600 font-medium">Attribute</th>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return (
                      <th key={id} className="text-left py-2 px-4 text-gray-900 font-semibold">
                        {product?.name}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">Price</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`price-${id}`} className="py-2 px-4">${product?.price}</td>;
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">Location</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`location-${id}`} className="py-2 px-4">{product?.location}</td>;
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">Rating</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`rating-${id}`} className="py-2 px-4">{product?.rating}</td>;
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">views</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`views-${id}`} className="py-2 px-4">{product?.views}</td>;
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">available until</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`availableUntil-${id}`} className="py-2 px-4">{product?.availableUntil}</td>;
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">delivery</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`delivery-${id}`} className="py-2 px-4">{product?.deliveryAvailable ? "available" : "unavailable"}</td>;
                  })}
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium text-gray-600">pickup</td>
                  {Array.from(compareItems).map(id => {
                    const product = products.find(p => p.id === id);
                    return <td key={`pickup-${id}`} className="py-2 px-4">{product?.pickupAvailable ? "available" : "unavailable"}</td>;
                  })}
                </tr>
                {/* Add more attributes as needed */}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <AnimatePresence>
        {favorites.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-30"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">Favorites Updated</h4>
                <p className="text-sm text-gray-600">
                  You have {favorites.size} favorite {favorites.size === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}