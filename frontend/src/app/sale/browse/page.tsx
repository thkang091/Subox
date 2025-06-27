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
  const [cart, setCart] = useState(new Map());
  const [compareItems, setCompareItems] = useState(new Set());
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [openFilterSection, setOpenFilterSection] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [showFavorite, setShowFavorite] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(false);
  const [showAvailableDate, setShowAvailableDate] = useState(null);
  const router = useRouter();
  const [showComparison, setShowComparison] = useState(false);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);

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
      veteran: true,
      bestRater: false,
      alumni: false,
      bestReviewer: false,
      trustedSeller: false,
      trustedRenter: false
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
      veteran: false,
      bestRater: false,
      alumni: false,
      bestReviewer: false,
      trustedSeller: true,
      trustedRenter: false
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
      veteran: false,
      bestRater: true,
      alumni: false,
      bestReviewer: false,
      trustedSeller: false,
      trustedRenter: false
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
      veteran: false,
      bestRater: false,
      alumni: true,
      bestReviewer: false,
      trustedSeller: false,
      trustedRenter: true
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
      veteran: false,
      bestRater: true,
      alumni: false,
      bestReviewer: false,
      trustedSeller: true,
      trustedRenter: false
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
      veteran: true,
      bestRater: false,
      alumni: false,
      bestReviewer: true,
      trustedSeller: false,
      trustedRenter: false
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

  const cartProducts = Array.from(cart.entries()).map(([productId, quantity]) => {
    const product = products.find(p => p.id === productId);
    if (!product) return null;
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity,
    };
  }).filter(Boolean);

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


              {/* Cart */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCart(!showCart)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {cart.size > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
                      {cart.size}
                    </span>
                  )}
                </motion.button>

                <AnimatePresence>
                  {showCart && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                      <div className="p-4 space-y-2">
                        {Array.from(cart.entries()).map(([productId, quantity]) => {
                          const product = products.find(p => p.id === productId);
                          if (!product) return null;

                          return (
                            <div key={productId} className="flex items-center space-x-3">
                              <img 
                                src={product.image} 
                                className="w-10 h-10 rounded" 
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{product.name}</span>
                                <span className="text-xs text-gray-500">Qty: {quantity}</span>
                              </div>
                            </div>
                          );
                        })}
                        {cart.size === 0 && (
                          <p className="text-sm text-gray-500">Your cart is empty.</p>
                        )}
                        {cart.size > 0 && (
                          <button
                            onClick={() =>{
                              console.log("cartProducts:", cartProducts);
                              localStorage.setItem("cart", JSON.stringify(cartProducts));
                              router.push("browse/buy/");
                            }}
                            className="mt-2 w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
                          >
                            Buy
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Profile */}
              <div className="relative">
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

                          <div className="flex items-center space-x-2">
                            {cart.has(product.id) ? (
                              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    updateCart(product.id, (cart.get(product.id) || 1) - 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-l-lg"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2 py-1 text-sm font-medium">{cart.get(product.id)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    updateCart(product.id, (cart.get(product.id) || 0) + 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-r-lg"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  updateCart(product.id, 1);
                                }}
                                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                              >
                                Add to Cart
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                      {/* Product Seller info */}
                        <Link key={`seller-${product.id}`} href={`browse/profile/${product.seller}`} className="text-sm text-gray-500">
                          Sold by <span className="font-medium text-gray-700">{product.seller}</span>
                          {product.bestRater && (
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

                                    // Smaller star size for more spacing
                                    const starPoints = [];
                                    const numPoints = 5;
                                    const outerRadius = 8;
                                    const innerRadius = 4;

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
                                        fill="#FFD700" // Gold color
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
                                  y="60"
                                  textAnchor="middle"
                                  fontSize="32"
                                  fontWeight="900"
                                  fill="#FFCC33"
                                  fontFamily="Georgia, serif"
                                >
                                  M
                                </text>
                              </svg>
                            </div>
                          )}


                          {product.trustedSeller && (
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
                                <g transform="translate(50, 50) scale(0.8)">
                                  <g transform="translate(-32, -32)" stroke="#000" strokeWidth="2" fill="none">
                                    <path d="M46.025 33.56l5.427 5.431a4 4 0 0 0 5.657-5.656L43.68 19.9c-2.441-2.44-5.137-2.672-8.016.208l-.838.828a4 4 0 0 1-5.655-5.656L32 12.455C35.266 9.185 37.124 8 39.873 8h4.34L62 25.776l-6.23 6.23" />
                                    <path d="M46.014 33.559l6.844 6.841a4 4 0 0 1-5.658 5.66l-6.239-6.242" />
                                    <path d="M40.962 39.818l4.825 4.827a4 4 0 0 1-5.652 5.655l-2.827-2.828" />
                                    <path d="M37.616 47.78l1.39 1.393a4 4 0 0 1-5.653 5.657l-1.39-1.394" />
                                    <path d="M8.45 32.007L2 25.556 18.021 9.531s2.132 2.482 3.924 2.482c2.174 0 2.706-.706 4-2 2.124-2.126 5.32-2.063 8 .613" />
                                    <path d="M15.6 36.163a4 4 0 1 0-5.653-5.655l-2.825 2.827a4 4 0 0 0 5.655 5.656z" />
                                    <path d="M21.258 41.818a4 4 0 0 0-5.658-5.656L11.362 40.4a4 4 0 0 0 5.655 5.656zm5.653 5.656a4 4 0 0 0-5.653-5.656l-2.827 2.827a4 4 0 0 0 5.655 5.655z" />
                                    <path d="M32.258 53.436A4 4 0 1 0 26.6 47.78l-1.392 1.393a4 4 0 0 0 5.655 5.657z" />
                                  </g>
                                </g>
                              </svg>
                            </div>
                          )}

                          {product.trustedRenter && (
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
                                <g transform="translate(50, 50) scale(0.9) translate(-25, -25)">
                                  {/* Solid House */}
                                  <path
                                    d="M 25 5 L 5 25 L 12 25 L 12 45 L 38 45 L 38 25 L 45 25 Z"
                                    fill="#000"
                                  />

                                  {/* Vertical Key inside House */}
                                  <g transform="translate(23, 30)">
                                    <circle cx="2.5" cy="2.5" r="2" fill="#4CAF50" />
                                    <rect x="2" y="4" width="1" height="10" fill="#4CAF50" />
                                    <rect x="1" y="10" width="3" height="1" fill="#4CAF50" />
                                    <rect x="1" y="12" width="2" height="1" fill="#4CAF50" />
                                  </g>
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
                                <g transform="translate(50, 50) scale(0.9) translate(-25, -25)">
                                  
                                  {/* Diamond top of cap */}
                                  <polygon
                                    points="25,5 0,17 25,29 50,17"
                                    fill="#FFEB3B"
                                  />

                                  {/* Bottom curved fabric */}
                                  <path
                                    d="
                                      M8,22 
                                      Q25,34 42,22 
                                      L42,30 
                                      Q25,42 8,30 
                                      Z
                                    "
                                    fill="#FFEB3B"
                                  />

                                  {/* Tassel string */}
                                  <line x1="42" y1="17" x2="42" y2="30" stroke="#FFEB3B" strokeWidth="2" />

                                  {/* Tassel circular button */}
                                  <circle cx="42" cy="30" r="2" fill="#FFEB3B" />

                                  {/* Tassel triangle */}
                                  <polygon points="40,32 44,32 42,37" fill="#FFEB3B" />

                                </g>
                              </svg>
                            </div>
                          )}
                          {product.bestReviewer && (
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
                          {product.veteran && (
                            <div className="w-5 h-5">
                              <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full h-full"
                                aria-label="Military Medal Badge Icon"
                                role="img"
                              >
                                <title>Military Medal Badge Icon</title>

                                {/* Military green circular base */}
                                <circle cx="50" cy="50" r="48" fill="#4B5320" />

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
                                      fill="#4B5320"
                                    />
                                  );
                                })}

                                {/* Military Medal Icon */}
                                <g transform="translate(50, 50) scale(0.7) translate(-25, -25)" stroke="#000" strokeWidth="2" fill="none">
                                  
                                  {/* Ribbon */}
                                  <path d="M10 5 L40 5 L35 20 L15 20 Z" />
                                  <line x1="17" y1="5" x2="17" y2="20" />
                                  <line x1="25" y1="5" x2="25" y2="20" />
                                  <line x1="33" y1="5" x2="33" y2="20" />

                                  {/* Connecting lines to star */}
                                  <line x1="15" y1="20" x2="25" y2="30" />
                                  <line x1="35" y1="20" x2="25" y2="30" />

                                  {/* Star */}
                                  <polygon
                                    points="25,35 28,42 35,43 30,48 32,55 25,51 18,55 20,48 15,43 22,42"
                                    fill="none"
                                    stroke="#000"
                                    strokeWidth="2"
                                  />

                                </g>
                              </svg>
                            </div>
                          )}
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

                            <div className="flex items-center space-x-2">
                              {cart.has(product.id) ? (
                                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      updateCart(product.id, (cart.get(product.id) || 1) - 1);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-l-lg"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 py-1 text-sm font-medium">{cart.get(product.id)}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      updateCart(product.id, (cart.get(product.id) || 0) + 1);
                                    }}
                                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-r-lg"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    updateCart(product.id, 1);
                                  }}
                                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                                >
                                  Add to Cart
                                </motion.button>
                              )}
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