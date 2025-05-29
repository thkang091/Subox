"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Box, Key, ShoppingBag, Search, Tag, Package } from "lucide-react";

export default function MoveOutPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [subleaseAction, setSubleaseAction] = useState<string | null>(null);
  const [saleAction, setSaleAction] = useState<string | null>(null);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const router = useRouter();

  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setSubleaseAction(null);
    setSaleAction(null);
  };

  const handleSubleaseActionSelect = (action: string) => {
    setSubleaseAction(action);
    setTimeout(() => {
      if (action === "write") {
        router.push("/sublease/write/options");
      } else {
        router.push("/sublease/search");
      }
    }, 500);
  };

  const handleSaleActionSelect = (action: string) => {
    setSaleAction(action);
    setTimeout(() => {
      if (action === "sell") {
        router.push("/sale/create/options");
      } else {
        router.push("/sale/browse");
      }
    }, 500);
  };

  const resetSelection = () => {
    setSelectedOption(null);
    setSubleaseAction(null);
    setSaleAction(null);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20
      }
    },
    exit: { 
      y: -20, 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    },
    hover: {
      y: -5,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none">
                <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
              </svg>
              <svg className="w-6 h-6 -ml-2" viewBox="0 0 40 40" fill="none">
                <path d="M5 10L20 5L35 10L30 35L15 40L5 35L5 10Z" fill="#E97451" />
                <circle cx="15" cy="15" r="3" fill="white" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">Subox</span>
            </div>
            {selectedOption && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetSelection}
                className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2 text-gray-600" />
                <span className="font-medium text-gray-700">Back</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          {selectedOption ? (
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {selectedOption === "sublease" ? "Sublease Options" : "Moving Sale"}
            </h1>
          ) : (
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                What are you looking to do?
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Whether you're subleasing your space or selling items, we've got you covered.
              </p>
            </>
          )}
        </motion.div>
        
        {/* Main option selector */}
        {!selectedOption && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            <motion.div 
              variants={itemVariants}
              whileHover="hover"
              onClick={() => handleOptionSelect("sublease")}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                  <Home size={32} className="text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Sublease Space</h3>
                <p className="text-gray-600 mb-6">List your apartment or find your next home</p>
                <div className="flex items-center text-orange-600 font-medium">
                  <span>Get Started</span>
                  <Key size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover="hover"
              onClick={() => handleOptionSelect("sale")}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                  <Package size={32} className="text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Moving Sale</h3>
                <p className="text-gray-600 mb-6">Sell items or find great deals near you</p>
                <div className="flex items-center text-orange-600 font-medium">
                  <span>Get Started</span>
                  <Tag size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
              <div className="h-2 bg-gradient-to-r from-orange-400 to-orange-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Sublease options */}
        {selectedOption === "sublease" && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              onClick={() => handleSubleaseActionSelect("write")}
              className={`group relative p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                subleaseAction === "write" 
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl" 
                  : "bg-white shadow-lg hover:shadow-xl"
              }`}
            >
              {subleaseAction === "write" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-orange-400 opacity-20 rounded-2xl"
                />
              )}
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  subleaseAction === "write" ? "bg-white/20" : "bg-orange-100"
                }`}>
                  <Key size={28} className={subleaseAction === "write" ? "text-white" : "text-orange-600"} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  subleaseAction === "write" ? "text-white" : "text-gray-900"
                }`}>
                  List Your Space
                </h3>
                <p className={`mb-4 ${
                  subleaseAction === "write" ? "text-orange-100" : "text-gray-600"
                }`}>
                  Create a listing for your apartment or room
                </p>
                {!subleaseAction && (
                  <span className="text-orange-600 font-medium group-hover:translate-x-1 inline-block transition-transform">
                    Create Listing →
                  </span>
                )}
                {subleaseAction === "write" && (
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="h-1 bg-white/30 mt-4 rounded-full"
                  />
                )}
              </div>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              onClick={() => handleSubleaseActionSelect("browse")}
              className={`group relative p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                subleaseAction === "browse" 
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl" 
                  : "bg-white shadow-lg hover:shadow-xl"
              }`}
            >
              {subleaseAction === "browse" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-orange-400 opacity-20 rounded-2xl"
                />
              )}
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  subleaseAction === "browse" ? "bg-white/20" : "bg-orange-100"
                }`}>
                  <Search size={28} className={subleaseAction === "browse" ? "text-white" : "text-orange-600"} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  subleaseAction === "browse" ? "text-white" : "text-gray-900"
                }`}>
                  Find a Sublease
                </h3>
                <p className={`mb-4 ${
                  subleaseAction === "browse" ? "text-orange-100" : "text-gray-600"
                }`}>
                  Browse available spaces in your area
                </p>
                {!subleaseAction && (
                  <span className="text-orange-600 font-medium group-hover:translate-x-1 inline-block transition-transform">
                    Browse Listings →
                  </span>
                )}
                {subleaseAction === "browse" && (
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="h-1 bg-white/30 mt-4 rounded-full"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Move Out Sale options */}
        {selectedOption === "sale" && (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
          >
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              onClick={() => handleSaleActionSelect("sell")}
              className={`group relative p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                saleAction === "sell" 
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl" 
                  : "bg-white shadow-lg hover:shadow-xl"
              }`}
            >
              {saleAction === "sell" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-orange-400 opacity-20 rounded-2xl"
                />
              )}
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  saleAction === "sell" ? "bg-white/20" : "bg-orange-100"
                }`}>
                  <Tag size={28} className={saleAction === "sell" ? "text-white" : "text-orange-600"} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  saleAction === "sell" ? "text-white" : "text-gray-900"
                }`}>
                  Sell Your Items
                </h3>
                <p className={`mb-4 ${
                  saleAction === "sell" ? "text-orange-100" : "text-gray-600"
                }`}>
                  List furniture and items for sale
                </p>
                {!saleAction && (
                  <span className="text-orange-600 font-medium group-hover:translate-x-1 inline-block transition-transform">
                    Create Listing →
                  </span>
                )}
                {saleAction === "sell" && (
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="h-1 bg-white/30 mt-4 rounded-full"
                  />
                )}
              </div>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -8 }}
              onClick={() => handleSaleActionSelect("buy")}
              className={`group relative p-8 rounded-2xl cursor-pointer transition-all duration-300 ${
                saleAction === "buy" 
                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl" 
                  : "bg-white shadow-lg hover:shadow-xl"
              }`}
            >
              {saleAction === "buy" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 bg-orange-400 opacity-20 rounded-2xl"
                />
              )}
              <div className="relative z-10">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 ${
                  saleAction === "buy" ? "bg-white/20" : "bg-orange-100"
                }`}>
                  <ShoppingBag size={28} className={saleAction === "buy" ? "text-white" : "text-orange-600"} />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${
                  saleAction === "buy" ? "text-white" : "text-gray-900"
                }`}>
                  Browse Items
                </h3>
                <p className={`mb-4 ${
                  saleAction === "buy" ? "text-orange-100" : "text-gray-600"
                }`}>
                  Find great deals on furniture and more
                </p>
                {!saleAction && (
                  <span className="text-orange-600 font-medium group-hover:translate-x-1 inline-block transition-transform">
                    Browse Items →
                  </span>
                )}
                {saleAction === "buy" && (
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.5 }}
                    className="h-1 bg-white/30 mt-4 rounded-full"
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Features Section */}
        {!selectedOption && (
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-20 max-w-6xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">Why Choose Subox?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Verified Listings</h3>
                <p className="text-gray-600">All listings are verified to ensure safety and authenticity</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick & Easy</h3>
                <p className="text-gray-600">List or find what you need in just a few clicks</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Focused</h3>
                <p className="text-gray-600">Connect with locals in your area for seamless transitions</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}