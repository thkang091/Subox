"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Home, Box, Key, ShoppingBag, Search } from "lucide-react";

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
    // Simulate a delay before navigation for animation effect
    setTimeout(() => {
      if (action === "write") {
        router.push("/sublease/write");
      } else {
        router.push("/sublease/search");
      }
    }, 500);
  };

  const handleSaleActionSelect = (action: string) => {
    setSaleAction(action);
    // Simulate a delay before navigation for animation effect
    setTimeout(() => {
      if (action === "sell") {
        router.push("/sale/create");
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
      scale: 1.05,
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6">
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        {selectedOption ? (
          <div className="flex items-center justify-between mb-6">
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-3xl md:text-4xl font-bold ${
                selectedOption === "sublease" ? "text-blue-700" : "text-purple-700"
              }`}
            >
              {selectedOption === "sublease" ? "Sublease Options" : "Move Out Sale"}
            </motion.h1>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetSelection}
              className={`flex items-center px-4 py-2 rounded-full ${
                selectedOption === "sublease" 
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              <ArrowLeft size={18} className="mr-2" />
              <span className="font-medium">Back</span>
            </motion.button>
          </div>
        ) : (
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
          >
            Moving Options
          </motion.h1>
        )}
        
        {!selectedOption && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.2 } }}
            className="text-lg text-gray-600 mb-10 text-center max-w-2xl mx-auto"
          >
            What would you like to do today?
          </motion.p>
        )}
      </motion.div>
      
      {/* Main option selector */}
      {!selectedOption && (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col md:flex-row gap-4 md:gap-6 w-full max-w-4xl"
        >
          <motion.div 
            variants={itemVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOptionSelect("sublease")}
            className="flex-1 bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 md:p-8 rounded-2xl shadow-lg cursor-pointer overflow-hidden relative group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-blue-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <Home size={isSmallScreen ? 32 : 40} className="mb-4 text-blue-200" />
            <div className="text-2xl md:text-3xl font-bold mb-3">Move Out / Sublease</div>
            <p className="text-blue-100 text-lg">List your space or find available subleases</p>
            <div className="absolute bottom-4 right-4 bg-blue-400 bg-opacity-20 rounded-full p-2 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
              <Key size={24} className="text-white" />
            </div>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={() => handleOptionSelect("sale")}
            className="flex-1 bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 md:p-8 rounded-2xl shadow-lg cursor-pointer overflow-hidden relative group"
          >
            <div className="absolute top-0 left-0 w-full h-full bg-purple-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <Box size={isSmallScreen ? 32 : 40} className="mb-4 text-purple-200" />
            <div className="text-2xl md:text-3xl font-bold mb-3">Move Out Sale</div>
            <p className="text-purple-100 text-lg">Sell your items or find great deals</p>
            <div className="absolute bottom-4 right-4 bg-purple-400 bg-opacity-20 rounded-full p-2 transform translate-y-10 group-hover:translate-y-0 transition-transform duration-300">
              <ShoppingBag size={24} className="text-white" />
            </div>
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
          className="w-full max-w-4xl"
        >
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          >
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubleaseActionSelect("write")}
              className={`relative p-6 md:p-8 rounded-2xl shadow-md overflow-hidden cursor-pointer 
                ${subleaseAction === "write" 
                  ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white" 
                  : "bg-white text-blue-700 border-2 border-blue-400"
                }`}
            >
              {subleaseAction === "write" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 30 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 h-4 w-4 rounded-full z-0"
                />
              )}
              <div className="relative z-10">
                <Key size={32} className={`mb-4 ${subleaseAction === "write" ? "text-blue-200" : "text-blue-500"}`} />
                <div className="text-xl md:text-2xl font-bold mb-3">List Your Space</div>
                <p className={`text-lg ${subleaseAction === "write" ? "text-blue-100" : "text-gray-600"}`}>
                  Create a listing for your apartment or room
                </p>
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: subleaseAction === "write" ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="h-1 bg-blue-300 mt-4 rounded-full"
                />
              </div>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSubleaseActionSelect("browse")}
              className={`relative p-6 md:p-8 rounded-2xl shadow-md overflow-hidden cursor-pointer 
                ${subleaseAction === "browse" 
                  ? "bg-gradient-to-br from-blue-500 to-blue-700 text-white" 
                  : "bg-white text-blue-700 border-2 border-blue-400"
                }`}
            >
              {subleaseAction === "browse" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 30 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 h-4 w-4 rounded-full z-0"
                />
              )}
              <div className="relative z-10">
                <Search size={32} className={`mb-4 ${subleaseAction === "browse" ? "text-blue-200" : "text-blue-500"}`} />
                <div className="text-xl md:text-2xl font-bold mb-3">Find a Sublease</div>
                <p className={`text-lg ${subleaseAction === "browse" ? "text-blue-100" : "text-gray-600"}`}>
                  Browse available subleases in your area
                </p>
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: subleaseAction === "browse" ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="h-1 bg-blue-300 mt-4 rounded-full"
                />
              </div>
            </motion.div>
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
          className="w-full max-w-4xl"
        >
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
          >
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSaleActionSelect("sell")}
              className={`relative p-6 md:p-8 rounded-2xl shadow-md overflow-hidden cursor-pointer 
                ${saleAction === "sell" 
                  ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white" 
                  : "bg-white text-purple-700 border-2 border-purple-400"
                }`}
            >
              {saleAction === "sell" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 30 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 h-4 w-4 rounded-full z-0"
                />
              )}
              <div className="relative z-10">
                <ShoppingBag size={32} className={`mb-4 ${saleAction === "sell" ? "text-purple-200" : "text-purple-500"}`} />
                <div className="text-xl md:text-2xl font-bold mb-3">Sell Your Items</div>
                <p className={`text-lg ${saleAction === "sell" ? "text-purple-100" : "text-gray-600"}`}>
                  List furniture and other items for sale
                </p>
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: saleAction === "sell" ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="h-1 bg-purple-300 mt-4 rounded-full"
                />
              </div>
            </motion.div>
            
            <motion.div
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSaleActionSelect("buy")}
              className={`relative p-6 md:p-8 rounded-2xl shadow-md overflow-hidden cursor-pointer 
                ${saleAction === "buy" 
                  ? "bg-gradient-to-br from-purple-500 to-purple-700 text-white" 
                  : "bg-white text-purple-700 border-2 border-purple-400"
                }`}
            >
              {saleAction === "buy" && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 30 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-purple-600 h-4 w-4 rounded-full z-0"
                />
              )}
              <div className="relative z-10">
                <Search size={32} className={`mb-4 ${saleAction === "buy" ? "text-purple-200" : "text-purple-500"}`} />
                <div className="text-xl md:text-2xl font-bold mb-3">Browse Items</div>
                <p className={`text-lg ${saleAction === "buy" ? "text-purple-100" : "text-gray-600"}`}>
                  Find furniture and items at great prices
                </p>
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: saleAction === "buy" ? "100%" : "0%" }}
                  transition={{ duration: 0.5 }}
                  className="h-1 bg-purple-300 mt-4 rounded-full"
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}