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
      trustedSeller: false,
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
                            <svg
                              viewBox="0 0 100 100"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5" // 40x40 pixels
                              role="img"
                              aria-label="Best Rater Badge"
                            >
                              {/* Bottle cap background */}
                              <circle cx="50" cy="50" r="48" fill="#000000" /> {/* Black */}

                              {/* Wavy cap edge */}
                              <path
                                d="M50,2 
                                  C54,10 66,6 70,12 
                                  C74,18 86,14 88,22 
                                  C90,30 98,34 96,42 
                                  C94,50 100,58 94,64 
                                  C88,70 90,82 82,86 
                                  C74,90 70,98 62,96 
                                  C54,94 46,100 38,96 
                                  C30,92 26,94 18,88 
                                  C10,82 12,70 6,64 
                                  C0,58 6,50 4,42 
                                  C2,34 10,30 12,22 
                                  C14,14 26,18 30,12 
                                  C34,6 46,10 50,2 Z"
                                fill="#000000"
                              />

                              <g transform="scale(0.6) translate(35, 35)">
                                {/* Five stars in star shape */}
                                <polygon
                                  points="50,35 54,47 67,47 56,55 60,67 50,59 40,67 44,55 33,47 46,47"
                                  fill="#FFD700"
                                  stroke="#FFC107"
                                  strokeWidth="1"
                                />
                                <polygon
                                  points="36,30 39,36 45,36 40,40 42,46 36,42 30,46 32,40 27,36 33,36"
                                  fill="#FFD700"
                                  stroke="#FFC107"
                                  strokeWidth="0.8"
                                />
                                <polygon
                                  points="64,30 67,36 73,36 68,40 70,46 64,42 58,46 60,40 55,36 61,36"
                                  fill="#FFD700"
                                  stroke="#FFC107"
                                  strokeWidth="0.8"
                                />
                                <polygon
                                  points="37,60 40,66 46,66 41,70 43,76 37,72 31,76 33,70 28,66 34,66"
                                  fill="#FFD700"
                                  stroke="#FFC107"
                                  strokeWidth="0.8"
                                />
                                <polygon
                                  points="63,60 66,66 72,66 67,70 69,76 63,72 57,76 59,70 54,66 60,66"
                                  fill="#FFD700"
                                  stroke="#FFC107"
                                  strokeWidth="0.8"
                                />
                              </g>
                            </svg>
                          )}

                          {product.student && (
                            <svg
                              viewBox="0 0 100 100"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              role="img"
                              aria-label="Student Badge"
                            >
                              {/* Bottle cap background */}
                              <circle cx="50" cy="50" r="48" fill="#7C2529" /> {/* Maroon */}

                              {/* Wavy cap edge */}
                              <path
                                d="M50,2 
                                  C54,10 66,6 70,12 
                                  C74,18 86,14 88,22 
                                  C90,30 98,34 96,42 
                                  C94,50 100,58 94,64 
                                  C88,70 90,82 82,86 
                                  C74,90 70,98 62,96 
                                  C54,94 46,100 38,96 
                                  C30,92 26,94 18,88 
                                  C10,82 12,70 6,64 
                                  C0,58 6,50 4,42 
                                  C2,34 10,30 12,22 
                                  C14,14 26,18 30,12 
                                  C34,6 46,10 50,2 Z"
                                fill="#7C2529"
                              />

                              {/* M letter */}
                              <text
                                x="50%"
                                y="60%"
                                textAnchor="middle"
                                fill="#FFD700"
                                fontSize="40"
                                fontWeight="bold"
                                fontFamily="Arial, sans-serif"
                                dy=".3em"
                              >
                                M
                              </text>
                            </svg>
                          )}

                          {product.trustedSeller && (
                            <svg
                              viewBox="0 0 100 100"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              role="img"
                              aria-label="Trusted Seller Badge"
                            >
                              {/* Bottle cap background */}
                              <circle cx="50" cy="50" r="48" fill="#FFD700" /> {/* Yellow */}

                              {/* Wavy cap edge */}
                              <path
                                d="M50,2 
                                  C54,10 66,6 70,12 
                                  C74,18 86,14 88,22 
                                  C90,30 98,34 96,42 
                                  C94,50 100,58 94,64 
                                  C88,70 90,82 82,86 
                                  C74,90 70,98 62,96 
                                  C54,94 46,100 38,96 
                                  C30,92 26,94 18,88 
                                  C10,82 12,70 6,64 
                                  C0,58 6,50 4,42 
                                  C2,34 10,30 12,22 
                                  C14,14 26,18 30,12 
                                  C34,6 46,10 50,2 Z"
                                fill="#FFD700"
                              />

                              {/* Handshake icon */}
                              <path
                                d="M35 45 C34 42, 38 42, 39 45
                                  L43 53 C44 55, 46 55, 47 53
                                  L50 48 L53 53 C54 55, 56 55, 57 53
                                  L61 45 C62 42, 66 42, 65 45
                                  L58 60 C57 62, 54 62, 52 60
                                  L50 56 L48 60 C46 62, 43 62, 42 60 Z"
                                fill="#000000"
                              />
                            </svg>
                          )}

                          {product.trustedRenter && (
                            <svg
                              viewBox="0 0 100 100"
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              role="img"
                              aria-label="Trusted Renter Badge"
                            >
                              {/* Bottle cap background */}
                              <circle cx="50" cy="50" r="48" fill="#28a745" /> {/* Green */}

                              {/* Wavy cap edge */}
                              <path
                                d="M50,2 
                                  C54,10 66,6 70,12 
                                  C74,18 86,14 88,22 
                                  C90,30 98,34 96,42 
                                  C94,50 100,58 94,64 
                                  C88,70 90,82 82,86 
                                  C74,90 70,98 62,96 
                                  C54,94 46,100 38,96 
                                  C30,92 26,94 18,88 
                                  C10,82 12,70 6,64 
                                  C0,58 6,50 4,42 
                                  C2,34 10,30 12,22 
                                  C14,14 26,18 30,12 
                                  C34,6 46,10 50,2 Z"
                                fill="#28a745"
                              />

                              {/* House with key icon */}
                              {/* Roof */}
                              <path d="M30 55 L50 40 L70 55" stroke="#000" strokeWidth="2" fill="none" />
                              {/* Walls */}
                              <path d="M34 55 V72 H66 V55" stroke="#000" strokeWidth="2" fill="none" />
                              {/* Door */}
                              <rect x="46" y="62" width="8" height="10" fill="#000" />
                              {/* Key */}
                              <circle cx="66" cy="36" r="4" fill="#000" />
                              <line x1="62" y1="36" x2="48" y2="36" stroke="#000" strokeWidth="2" />
                              <line x1="52" y1="36" x2="52" y2="33" stroke="#000" strokeWidth="2" />
                              <line x1="56" y1="36" x2="56" y2="39" stroke="#000" strokeWidth="2" />
                            </svg>
                          )}

                          {product.alumni && (
                            <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                            >
                                {/* Bottle cap background */}
                                <circle cx="50" cy="50" r="48" fill="#2C4F91" /> {/* Blue */}

                                {/* Wavy cap edge */}
                                <path
                                    d="M50,2 
                                        C54,10 66,6 70,12 
                                        C74,18 86,14 88,22 
                                        C90,30 98,34 96,42 
                                        C94,50 100,58 94,64 
                                        C88,70 90,82 82,86 
                                        C74,90 70,98 62,96 
                                        C54,94 46,100 38,96 
                                        C30,92 26,94 18,88 
                                        C10,82 12,70 6,64 
                                        C0,58 6,50 4,42 
                                        C2,34 10,30 12,22 
                                        C14,14 26,18 30,12 
                                        C34,6 46,10 50,2 Z"
                                    fill="#2C4F91"
                                />

                                {/* Graduation Cap (Gold) */}
                                <g transform="translate(25, 35) scale(0.5)">
                                    <path
                                    d="M50 10 L90 25 L50 40 L10 25 Z"
                                    fill="#FFD700"
                                    />
                                    <rect x="45" y="40" width="10" height="15" fill="#FFD700" />
                                    <line x1="90" y1="25" x2="90" y2="38" stroke="#FFD700" strokeWidth="3" />
                                    <circle cx="90" cy="38" r="2.5" fill="#FFD700" />
                                </g>
                            </svg>
                          )}
                          {product.bestReviewer && (
                            <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                            >
                                {/* Bottle cap background */}
                                <circle cx="50" cy="50" r="48" fill="#ffffff" /> {/* White */}

                                {/* Wavy cap edge */}
                                <path
                                    d="M50,2 
                                        C54,10 66,6 70,12 
                                        C74,18 86,14 88,22 
                                        C90,30 98,34 96,42 
                                        C94,50 100,58 94,64 
                                        C88,70 90,82 82,86 
                                        C74,90 70,98 62,96 
                                        C54,94 46,100 38,96 
                                        C30,92 26,94 18,88 
                                        C10,82 12,70 6,64 
                                        C0,58 6,50 4,42 
                                        C2,34 10,30 12,22 
                                        C14,14 26,18 30,12 
                                        C34,6 46,10 50,2 Z"
                                    fill="#ffffff"
                                />

                                {/* Pencil icon */}
                                <g fill="none" stroke="#000000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" transform="translate(30 30) scale(0.8)">
                                    {/* Pencil body */}
                                    <rect x="15" y="5" width="10" height="40" fill="#000" />
                                    {/* Pencil tip */}
                                    <path d="M15 5 L20 0 L25 5 Z" fill="#000" />
                                    {/* Pencil eraser */}
                                    <rect x="15" y="45" width="10" height="5" fill="#555" />
                                </g>
                            </svg>
                          )}
                          {product.veteran && (
                            <svg
                                viewBox="0 0 100 100"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5"
                            >
                                {/* Camouflage background pattern */}
                                <defs>
                                    <pattern id="camo" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                                    <rect width="20" height="20" fill="#4B5320" /> {/* Army green */}
                                    <circle cx="5" cy="5" r="7" fill="#6B4423" /> {/* Brown splotch */}
                                    <circle cx="15" cy="15" r="7" fill="#C2B280" /> {/* Beige splotch */}
                                    </pattern>
                                </defs>

                                {/* Background circle with camo pattern */}
                                <circle cx="50" cy="50" r="48" fill="url(#camo)" />

                                {/* Wavy cap edge in camo color */}
                                <path
                                    d="M50,2 
                                        C54,10 66,6 70,12 
                                        C74,18 86,14 88,22 
                                        C90,30 98,34 96,42 
                                        C94,50 100,58 94,64 
                                        C88,70 90,82 82,86 
                                        C74,90 70,98 62,96 
                                        C54,94 46,100 38,96 
                                        C30,92 26,94 18,88 
                                        C10,82 12,70 6,64 
                                        C0,58 6,50 4,42 
                                        C2,34 10,30 12,22 
                                        C14,14 26,18 30,12 
                                        C34,6 46,10 50,2 Z"
                                    fill="url(#camo)"
                                />

                                {/* Military helmet icon */}
                                <g
                                  transform="translate(25 30) scale(1.2)"
                                  fill="none"
                                  stroke="#6B4423"
                                  strokeWidth="2"
                                >
                                  {/* Helmet dome */}
                                  <ellipse cx="25" cy="20" rx="25" ry="15" />

                                  {/* Helmet base */}
                                  <rect x="5" y="20" width="40" height="15" rx="7" ry="7" />

                                  {/* Helmet front visor */}
                                  <path d="M5 20 Q25 10 45 20" strokeWidth="3" />
                                </g>
                            </svg>
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