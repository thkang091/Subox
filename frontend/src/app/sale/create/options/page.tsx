"use client"

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Camera, 
  Image, 
  Brain, 
  Zap, 
  Sparkles, 
  Target, 
  Clock, 
  DollarSign, 
  Package, 
  CheckCircle,
  ArrowRight,
  Wand2,
  Eye,
  Plus,
  RefreshCw,
  Lightbulb,
  Star,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Truck,
  Home,
  Search,
  X,
  Check
} from "lucide-react";
import RealPhotoDetection from "../../../../components/image"


// ===============================
// TYPES
// ===============================

type ListingOption = "ai" | "traditional" | null;
type PreviewStep = "photo" | "detection" | "details" | "description";

// ===============================
// MOCK DATA
// ===============================

const mockDetectedItems = [
  { id: 1, name: "Wooden Desk", confidence: 92, price: 85, selected: true },
  { id: 2, name: "Office Chair", confidence: 88, price: 45, selected: true },
  { id: 3, name: "Table Lamp", confidence: 79, price: 25, selected: false }
];

const mockTraditionalItems = [
  { 
    id: 1, 
    name: "IKEA Malm Desk", 
    price: 120, 
    condition: "Good", 
    description: "Great desk for students! Used for 2 years, minor scratches but very functional. Perfect for dorm or apartment."
  },
  { 
    id: 2, 
    name: "Gaming Chair", 
    price: 80, 
    condition: "Like New", 
    description: "Comfortable ergonomic chair, barely used. Great for gaming or studying long hours."
  },
  { 
    id: 3, 
    name: "Bookshelf", 
    price: 40, 
    condition: "Fair", 
    description: "Sturdy wooden bookshelf with some wear marks. Perfect for organizing books and decor."
  }
];

// ===============================
// MAIN COMPONENT
// ===============================

export default function MoveOutSaleNavigation() {
  
  // ===============================
  // STATE MANAGEMENT & ROUTER
  // ===============================
  
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<ListingOption>(null);
  const [isHovering, setIsHovering] = useState<ListingOption>(null);
  const [aiPreviewStep, setAiPreviewStep] = useState<PreviewStep>("photo");
  const [traditionalItemIndex, setTraditionalItemIndex] = useState(0);

  // ===============================
  // ROUTER HANDLERS
  // ===============================

  const handleAIPath = () => {
    router.push("options/ai/");
  };

  const handleTraditionalPath = () => {
    router.push("options/nonai/");
  };

  const handleSelectedOption = () => {
    if (selectedOption === "ai") {
      handleAIPath();
    } else if (selectedOption === "traditional") {
      handleTraditionalPath();
    }
  };

  // ===============================
  // EFFECTS
  // ===============================

  // Auto-cycle through AI preview steps
  useEffect(() => {
    if (isHovering === "ai") {
      const stepTimeouts = {
        photo: 2500,
        detection: 3500,
        details: 3000,
        description: 3500
      };

      const timeout = setTimeout(() => {
        setAiPreviewStep(prev => {
          switch (prev) {
            case "photo": return "detection";
            case "detection": return "details";
            case "details": return "description";
            case "description": return "photo";
            default: return "photo";
          }
        });
      }, stepTimeouts[aiPreviewStep as keyof typeof stepTimeouts]);

      return () => clearTimeout(timeout);
    }
  }, [aiPreviewStep, isHovering]);

  // Reset preview when not hovering
  useEffect(() => {
    if (isHovering !== "ai") {
      setAiPreviewStep("photo");
    }
  }, [isHovering]);

  // ===============================
  // UI COMPONENTS
  // ===============================

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </motion.button>
            
            <div className="flex items-center space-x-2">
              <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none">
                <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
              </svg>
              <span className="text-xl font-bold text-gray-900">Move Out Sale</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // AI Preview Component with Realistic Furniture and Accurate Detection Boxes
  const AIPreview = () => (
    <div className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-lg">
      <div className="text-center mb-3">
        <div className="text-sm font-medium text-purple-900">🤖 Live Preview</div>
        <div className="text-xs text-purple-600">Hover to see it in action!</div>
      </div>

      <AnimatePresence mode="wait">
        {aiPreviewStep === "photo" && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="space-y-2"
          >
            <div className="bg-black rounded-lg p-4 aspect-square relative overflow-hidden">
              {/* Camera frame overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                <motion.div 
                  className="border-2 border-purple-400 rounded-lg w-3/4 h-3/4 relative"
                  animate={{ 
                    borderColor: ["#a855f7", "#3b82f6", "#a855f7"],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  {/* Corner indicators with pulse */}
                  {[
                    { top: -1, left: -1, borderL: true, borderT: true },
                    { top: -1, right: -1, borderR: true, borderT: true },
                    { bottom: -1, left: -1, borderL: true, borderB: true },
                    { bottom: -1, right: -1, borderR: true, borderB: true }
                  ].map((corner, idx) => (
                    <motion.div
                      key={idx}
                      className={`absolute w-4 h-4 border-2 border-purple-500 ${
                        corner.borderL ? 'border-l-2' : ''
                      } ${corner.borderR ? 'border-r-2' : ''
                      } ${corner.borderT ? 'border-t-2' : ''
                      } ${corner.borderB ? 'border-b-2' : ''}`}
                      style={{
                        top: corner.top,
                        left: corner.left,
                        right: corner.right,
                        bottom: corner.bottom
                      }}
                      animate={{ 
                        opacity: [0.5, 1, 0.5],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        delay: idx * 0.2
                      }}
                    />
                  ))}
                  
                  {/* Center icon with pulse */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Brain size={24} className="text-purple-400" />
                    </motion.div>
                  </div>
                  
                  {/* Scanning line effect */}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent"
                    animate={{ 
                      top: ["10%", "90%", "10%"]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
              </div>
              
              <motion.div 
                className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium"
                animate={{ 
                  y: [0, -2, 0]
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity
                }}
              >
                📸 Position furniture here
              </motion.div>
            </div>
          </motion.div>
        )}

        {aiPreviewStep === "detection" && (
          <motion.div
            key="detection"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {/* Use the imported RealPhotoDetection component */}
            <RealPhotoDetection />
          </motion.div>
        )}

        {aiPreviewStep === "details" && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Brain size={16} className="text-purple-600" />
                <span className="text-sm font-medium">AI Pre-filled Details</span>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Wooden Desk</span>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">$85</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Condition</span>
                  <span className="text-gray-800">Good</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location</span>
                  <span className="text-gray-800">Dinkytown</span>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">Auto-filled by AI!</div>
          </motion.div>
        )}

        {aiPreviewStep === "description" && (
          <motion.div
            key="description"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Wand2 size={16} className="text-purple-600" />
                <span className="text-sm font-medium">AI Description</span>
              </div>
              
              <div className="text-xs text-gray-700 leading-relaxed">
                "🤖 AI-detected Wooden Desk in good condition - $85, pickup only! Perfect for students and anyone looking for quality furniture."
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <CheckCircle size={12} className="text-green-600" />
                <span className="text-xs text-green-600">Ready to post!</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // Traditional Preview Component
  const TraditionalPreview = () => {
    const currentItem = mockTraditionalItems[traditionalItemIndex];
    
    return (
      <div className="bg-white rounded-xl p-4 border-2 border-orange-200 shadow-lg">
        <div className="text-center mb-3">
          <div className="text-sm font-medium text-orange-900">📸 Live Preview</div>
          <div className="text-xs text-orange-600">Click to explore the flow!</div>
        </div>

        <div className="space-y-3">
          {/* Multi-Photo Upload Simulation */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-1 mb-2">
              {[0, 1, 2].map((photoIndex) => (
                <div 
                  key={photoIndex}
                  className={`aspect-square rounded border-2 transition-all duration-300 ${
                    photoIndex <= traditionalItemIndex 
                      ? 'bg-gradient-to-br from-orange-100 to-gray-100 border-orange-300' 
                      : 'bg-gray-100 border-gray-200 opacity-50'
                  }`}
                >
                  {photoIndex <= traditionalItemIndex ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image size={16} className="text-orange-500" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Plus size={12} className="text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <div className="text-xs text-orange-600 font-medium">
                Photo {traditionalItemIndex + 1} of 3
              </div>
              <div className="flex items-center justify-center space-x-2 mt-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTraditionalItemIndex(prev => prev > 0 ? prev - 1 : 0);
                  }}
                  disabled={traditionalItemIndex === 0}
                  className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={12} />
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTraditionalItemIndex(prev => prev < 2 ? prev + 1 : 2);
                  }}
                  disabled={traditionalItemIndex === 2}
                  className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Manual Form Fields */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign size={14} className="text-orange-600" />
              <div className="flex-1 bg-gray-50 rounded px-2 py-1 border">
                <input 
                  type="text" 
                  value={`$${currentItem.price}`}
                  readOnly
                  className="w-full text-xs text-gray-800 bg-transparent border-none outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Package size={14} className="text-orange-600" />
              <div className="flex-1 bg-gray-50 rounded px-2 py-1 border">
                <input 
                  type="text" 
                  value={currentItem.name}
                  readOnly
                  className="w-full text-xs text-gray-800 bg-transparent border-none outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-xs text-orange-600">🧼</div>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-1">
                  {["Like New", "Good", "Fair", "Used"].map((condition) => (
                    <button
                      key={condition}
                      className={`px-2 py-1 rounded text-xs border transition-colors ${
                        currentItem.condition === condition
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {condition}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin size={14} className="text-orange-600" />
              <div className="flex-1 bg-gray-50 rounded px-2 py-1 border">
                <span className="text-xs text-gray-800">Dinkytown</span>
              </div>
            </div>
          </div>

          {/* Description Generation */}
          <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <Sparkles size={12} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-900">Smart Description</span>
              </div>
              <button className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded hover:bg-orange-200 transition-colors">
                Generate
              </button>
            </div>
            <div className="text-xs text-orange-700 leading-relaxed">
              {currentItem.description}
            </div>
            <div className="mt-1 flex items-center space-x-2">
              <CheckCircle size={10} className="text-green-600" />
              <span className="text-xs text-green-600">Ready to post!</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===============================
  // MAIN RENDER
  // ===============================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {renderHeader()}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <Package size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏠 Moving Out Sale
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose how you want to list your items for sale. See exactly how each option works!
          </p>
        </motion.div>

        {/* Interactive Selection Cards */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* AI-Powered Option */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onHoverStart={() => setIsHovering("ai")}
            onHoverEnd={() => setIsHovering(null)}
            onClick={() => setSelectedOption(selectedOption === "ai" ? null : "ai")}
            className={`relative cursor-pointer transition-all duration-300 ${
              selectedOption === "ai" || isHovering === "ai"
                ? 'transform scale-[1.02]' 
                : ''
            }`}
          >
            <div className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 shadow-lg hover:shadow-2xl ${
              selectedOption === "ai" 
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50' 
                : isHovering === "ai"
                ? 'border-purple-300'
                : 'border-gray-200'
            }`}>
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                  selectedOption === "ai" || isHovering === "ai"
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg transform scale-110' 
                    : 'bg-gradient-to-r from-purple-500 to-blue-500'
                }`}>
                  <Brain size={28} className="text-white" />
                </div>
                
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">🤖 AI Smart Listing</h3>
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                    RECOMMENDED
                  </div>
                </div>
                
                <p className="text-gray-600">
                  Take a photo and let AI detect your furniture instantly!
                </p>
              </div>

              {/* Interactive Preview */}
              <div className="mb-6">
                <AIPreview />
              </div>

              {/* Features */}
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 10, -10, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Camera size={16} />
                  </motion.div>
                  <div>
                    <h4 className="font-medium text-purple-900">📸 Smart Camera</h4>
                    <p className="text-sm text-purple-700">Just point & shoot - AI does the rest!</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                    <Zap size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900">⚡ Instant Detection</h4>
                    <p className="text-sm text-purple-700">Identifies items with bounding boxes</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg flex items-center justify-center">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-purple-900">📈 Better Results</h4>
                    <p className="text-sm text-purple-700">AI descriptions get 40% more responses</p>
                  </div>
                </motion.div>
              </div>

              {/* Selection Indicator */}
              <AnimatePresence>
                {selectedOption === "ai" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle size={20} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Traditional Option */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onHoverStart={() => setIsHovering("traditional")}
            onHoverEnd={() => setIsHovering(null)}
            onClick={() => setSelectedOption(selectedOption === "traditional" ? null : "traditional")}
            className={`relative cursor-pointer transition-all duration-300 ${
              selectedOption === "traditional" || isHovering === "traditional"
                ? 'transform scale-[1.02]' 
                : ''
            }`}
          >
            <div className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 shadow-lg hover:shadow-2xl ${
              selectedOption === "traditional" 
                ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-gray-50' 
                : isHovering === "traditional"
                ? 'border-orange-300'
                : 'border-gray-200'
            }`}>
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300 ${
                  selectedOption === "traditional" || isHovering === "traditional"
                    ? 'bg-orange-600 shadow-lg transform scale-110' 
                    : 'bg-orange-500'
                }`}>
                  <Image size={28} className="text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">📸 Traditional Listing</h3>
                <p className="text-gray-600">
                  Full control with multiple photos per item
                </p>
              </div>

              {/* Interactive Preview */}
              <div className="mb-6">
                <TraditionalPreview />
              </div>

              {/* Features */}
              <div className="space-y-3">
                <motion.div 
                  className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Eye size={16} />
                  </motion.div>
                  <div>
                    <h4 className="font-medium text-orange-900">👁️ Full Control</h4>
                    <p className="text-sm text-orange-700">Take multiple photos, customize everything</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center"
                    animate={{ 
                      rotate: [0, 180, 360]
                    }}
                    transition={{ 
                      duration: 4, 
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <Plus size={16} />
                  </motion.div>
                  <div>
                    <h4 className="font-medium text-orange-900">📷 Multiple Photos</h4>
                    <p className="text-sm text-orange-700">Upload several photos per item</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200"
                  whileHover={{ scale: 1.02, x: 5 }}
                >
                  <motion.div 
                    className="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2.5, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Lightbulb size={16} />
                  </motion.div>
                  <div>
                    <h4 className="font-medium text-orange-900">💡 Smart Descriptions</h4>
                    <p className="text-sm text-orange-700">Generate descriptions on demand</p>
                  </div>
                </motion.div>
              </div>

              {/* Selection Indicator */}
              <AnimatePresence>
                {selectedOption === "traditional" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <CheckCircle size={20} className="text-white" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Action Section */}
        <AnimatePresence>
          {selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center mb-12"
            >
              <div className={`max-w-md mx-auto p-6 rounded-2xl shadow-xl ${
                selectedOption === "ai" 
                  ? 'bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200' 
                  : 'bg-gradient-to-r from-orange-50 to-gray-50 border border-orange-200'
              }`}>
                <div className="mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    selectedOption === "ai" ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-orange-600'
                  }`}>
                    {selectedOption === "ai" ? <Brain size={24} className="text-white" /> : <Image size={24} className="text-white" />}
                  </div>
                  <h3 className={`text-lg font-bold ${
                    selectedOption === "ai" ? 'text-purple-900' : 'text-orange-900'
                  }`}>
                    {selectedOption === "ai" ? "🤖 AI Smart Listing Selected" : "📸 Traditional Listing Selected"}
                  </h3>
                  <p className={`text-sm mt-1 ${
                    selectedOption === "ai" ? 'text-purple-700' : 'text-orange-700'
                  }`}>
                    {selectedOption === "ai" 
                      ? "Get ready for lightning-fast AI-powered listings!" 
                      : "Perfect choice for detailed, customized listings!"
                    }
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSelectedOption}
                  className={`w-full py-4 text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg ${
                    selectedOption === "ai" 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  <motion.span 
                    className="flex items-center justify-center"
                    whileHover={{ x: 5 }}
                  >
                    <motion.div
                      animate={selectedOption === "ai" ? { 
                        rotate: [0, 5, -5, 0],
                        scale: [1, 1.1, 1]
                      } : {}}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {selectedOption === "ai" ? (
                        <Camera size={20} className="mr-2" />
                      ) : (
                        <Image size={20} className="mr-2" />
                      )}
                    </motion.div>
                    {selectedOption === "ai" ? "Start AI Photo Detection" : "Start Photo Upload"}
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <ArrowRight size={20} className="ml-2" />
                    </motion.div>
                  </motion.span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* No Selection Prompt */}
        {!selectedOption && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <div className="max-w-md mx-auto p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose Your Listing Style</h3>
              <p className="text-sm text-gray-600">
                Select either AI Smart Listing or Traditional Listing above to continue
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}