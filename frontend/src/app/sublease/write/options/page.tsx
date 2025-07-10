"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, MessageSquare, Edit3, Camera, Clock, Zap, CheckCircle, User, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from '../../../contexts/AuthInfo';


// Main component content
function SubleaseOptionsContent() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth?mode=signup');
    }
  }, [user, loading, router]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    // Navigate to different routes based on option
    setTimeout(() => {
      if (option === "chat") {
        router.push("/sublease/write/options/chat"); // Updated route
      } else if (option === "description") {
        router.push("/sublease/write/options/write-description"); // Updated route
      }
    }, 500);
  };

  const resetSelection = () => {
    setSelectedOption(null);
    // Navigate back to previous page
    router.push("/find");
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    hover: {
      y: -8,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 15
      }
    }
  };

  // Show loading while auth is checking
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If not authenticated, show message while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Please sign in to create listings. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
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

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Back Button */}
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

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 font-medium text-sm">
                        {getUserInitials()}
                      </span>
                    </div>
                    <div className="hidden sm:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {getUserDisplayName()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>
                  </button>
                  
                  {/* User Dropdown */}
                  {showUserMenu && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                      >
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <div className="font-medium">{getUserDisplayName()}</div>
                          <div className="text-xs text-gray-500 truncate">{user.email}</div>
                        </div>
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/profile');
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User size={16} className="mr-2" />
                          Profile
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut size={16} className="mr-2" />
                          Sign Out
                        </button>
                      </motion.div>
                      {/* Click outside to close */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowUserMenu(false)}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Sublease Listing
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome back, {getUserDisplayName()}! Choose how you'd like to create your listing.
          </p>
        </motion.div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto"
        >
          {/* Option 1: Chat Style Questions */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            onClick={() => handleOptionSelect("chat")}
            className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
              selectedOption === "chat" 
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-2xl transform scale-105" 
                : "bg-white shadow-lg hover:shadow-2xl border border-gray-100"
            }`}
          >
            {selectedOption === "chat" && (
              <motion.div 
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-500/20"
              />
            )}
            
            <div className="relative z-10 p-8">
              <div className="mb-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
                  selectedOption === "chat" ? "bg-white/20" : "bg-gradient-to-br from-blue-100 to-purple-100"
                }`}>
                  <MessageSquare size={36} className={selectedOption === "chat" ? "text-white" : "text-blue-600"} />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedOption === "chat" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-700"
                  }`}>
                    IMESSAGE STYLE
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    selectedOption === "chat" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"
                  }`}>
                    GUIDED
                  </span>
                </div>
              </div>
              
              <h3 className={`text-2xl font-bold mb-4 ${
                selectedOption === "chat" ? "text-white" : "text-gray-900"
              }`}>
                Chat Like iMessage
              </h3>
              
              <p className={`text-base leading-relaxed mb-6 ${
                selectedOption === "chat" ? "text-blue-100" : "text-gray-600"
              }`}>
                Text back and forth just like messaging a friend. We'll ask simple questions and you tap your answers.
              </p>
              
              <div className="space-y-3 mb-8">
                {/* iMessage Style Preview */}
                <div className={`${selectedOption === "chat" ? "bg-white/10" : "bg-gray-100"} rounded-xl p-4`}>
                  <div className="space-y-3">
                    {/* System message */}
                    <div className="flex justify-start">
                      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        selectedOption === "chat" ? "bg-white/20 text-blue-100" : "bg-gray-300 text-gray-800"
                      }`}>
                        What type of listing are you posting? 🏠
                      </div>
                    </div>
                    
                    {/* User response */}
                    <div className="flex justify-end">
                      <div className="max-w-xs px-4 py-2 rounded-2xl bg-blue-500 text-white text-sm">
                        Sublet
                      </div>
                    </div>
                    
                    {/* System follow-up */}
                    <div className="flex justify-start">
                      <div className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                        selectedOption === "chat" ? "bg-white/20 text-blue-100" : "bg-gray-300 text-gray-800"
                      }`}>
                        When is it available? 📅
                      </div>
                    </div>
                    
                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className={`px-4 py-2 rounded-2xl ${
                        selectedOption === "chat" ? "bg-white/20" : "bg-gray-300"
                      }`}>
                        <div className="flex space-x-1">
                          <div className={`w-2 h-2 rounded-full animate-bounce ${
                            selectedOption === "chat" ? "bg-blue-200" : "bg-gray-500"
                          }`} style={{ animationDelay: '0ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${
                            selectedOption === "chat" ? "bg-blue-200" : "bg-gray-500"
                          }`} style={{ animationDelay: '150ms' }}></div>
                          <div className={`w-2 h-2 rounded-full animate-bounce ${
                            selectedOption === "chat" ? "bg-blue-200" : "bg-gray-500"
                          }`} style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-2 text-sm ${
                  selectedOption === "chat" ? "text-blue-200" : "text-gray-500"
                }`}>
                  <Clock size={14} />
                  <span>Takes 3-5 minutes • Just like texting with a friend</span>
                </div>
              </div>
              
              {!selectedOption && (
                <div className="flex items-center text-blue-600 font-semibold">
                  <span>Start Questions</span>
                  <motion.div 
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.div>
                </div>
              )}
              
              {selectedOption === "chat" && (
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-1 bg-white/40 rounded-full"
                />
              )}
            </div>
          </motion.div>

          {/* Option 2: Free-form Description */}
          <motion.div
            variants={itemVariants}
            whileHover="hover"
            onClick={() => handleOptionSelect("description")}
            className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
              selectedOption === "description" 
                ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-2xl transform scale-105" 
                : "bg-white shadow-lg hover:shadow-2xl border border-gray-100"
            }`}
          >
            {selectedOption === "description" && (
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-500/20"
              />
            )}
            
            <div className="relative z-10 p-8">
              <div className="mb-6">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 ${
                  selectedOption === "description" ? "bg-white/20" : "bg-gradient-to-br from-orange-100 to-red-100"
                }`}>
                  <Edit3 size={36} className={selectedOption === "description" ? "text-white" : "text-orange-600"} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedOption === "description" ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                }`}>
                  SMART CLEANUP
                </span>
              </div>
              
              <h3 className={`text-2xl font-bold mb-4 ${
                selectedOption === "description" ? "text-white" : "text-gray-900"
              }`}>
                Write & We'll Fix It
              </h3>
              
              <p className={`text-base leading-relaxed mb-6 ${
                selectedOption === "description" ? "text-orange-100" : "text-gray-600"
              }`}>
                Just dump everything in a text box - typos, different languages, whatever! We'll clean it up and ask for missing details through iMessage-style chat.
              </p>
              
              <div className="space-y-3 mb-8">
                <div className={`p-4 rounded-xl border-2 border-dashed ${
                  selectedOption === "description" ? "border-white/30 bg-white/10" : "border-gray-200 bg-gray-50"
                }`}>
                  <span className={`text-sm italic ${selectedOption === "description" ? "text-orange-100" : "text-gray-600"}`}>
                    "apartamento 2 cuartos cerca universidad. tiene muebles. disponible enero-mayo. $1200/mes incluye utilidades..."
                  </span>
                </div>
                
                {/* Smart features preview */}
                <div className="space-y-2">
                  <div className={`flex items-center space-x-2 text-sm ${
                    selectedOption === "description" ? "text-orange-200" : "text-gray-500"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${selectedOption === "description" ? "bg-orange-300" : "bg-blue-400"}`}></div>
                    <span>Auto-translate any language to English</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${
                    selectedOption === "description" ? "text-orange-200" : "text-gray-500"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${selectedOption === "description" ? "bg-orange-300" : "bg-green-400"}`}></div>
                    <span>Fix typos and grammar automatically</span>
                  </div>
                  <div className={`flex items-center space-x-2 text-sm ${
                    selectedOption === "description" ? "text-orange-200" : "text-gray-500"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${selectedOption === "description" ? "bg-orange-300" : "bg-purple-400"}`}></div>
                    <span>Text you for any missing details</span>
                  </div>
                </div>
              </div>
              
              {!selectedOption && (
                <div className="flex items-center text-orange-600 font-semibold">
                  <span>Start Writing</span>
                  <motion.div 
                    className="ml-2"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                  >
                    →
                  </motion.div>
                </div>
              )}
              
              {selectedOption === "description" && (
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-1 bg-white/40 rounded-full"
                />
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Success message for authenticated user */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">You're Ready to Create!</h3>
            <p className="text-green-100 mb-6">
              Your account is verified and ready. Choose your preferred method above to get started with your sublease listing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center text-green-100">
                <CheckCircle size={20} className="mr-2" />
                Account verified
              </div>
              <div className="flex items-center text-green-100">
                <Zap size={20} className="mr-2" />
                Ready to publish
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Main component with AuthProvider wrapper
export default function SubleaseOptionsPage() {
  return (
    <AuthProvider>
      <SubleaseOptionsContent />
    </AuthProvider>
  );
}