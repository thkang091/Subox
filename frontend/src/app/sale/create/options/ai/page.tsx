"use client"

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Camera, 
  X, 
  DollarSign, 
  Package, 
  MapPin, 
  Truck, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Target,
  Check,
  Image,
  RefreshCw,
  CheckCircle,
  Focus,
  Brain,
  Zap,
  Plus,
  Trash2,
  Loader,
  Wand2,
  AlertCircle
} from "lucide-react";

// Component imports
import LocationPicker from '../../../../../components/LocationPicker';

// ===============================
// TYPES AND INTERFACES
// ===============================

interface DetectedItem {
  id: string;
  name: string;
  confidence: number;
  category: string;
  suggestedPrice: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  selected: boolean;
}

interface ItemData {
  price: string;
  priceType: "fixed" | "obo";
  itemName: string;
  condition: string;
  location: string;
  delivery: string;
  detectedItemId?: string;
  aiGenerated: boolean;
}

type AppStep = "upload" | "camera" | "photo-preview" | "ai-detection" | "item-selection" | "details" | "description";

// ===============================
// CUSTOM HOOKS
// ===============================

const useVisionAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = async (imageDataUrl: string): Promise<DetectedItem[] | null> => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageDataUrl }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      const detectedItems: DetectedItem[] = data.suggestions.map((suggestion: any, index: number) => ({
        id: `item-${index}`,
        name: suggestion.itemName,
        confidence: Math.round(suggestion.confidence * 100),
        category: suggestion.category,
        suggestedPrice: suggestion.suggestedPrice,
        boundingBox: data.analysis.objects[index]?.boundingBox,
        selected: true
      }));

      return detectedItems;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyzeImage, isAnalyzing, error };
};

// ===============================
// MAIN COMPONENT
// ===============================

export default function AISmartListingPage() {
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  // Core app state
  const [step, setStep] = useState<AppStep>("upload");
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  // AI-related state
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<DetectedItem[]>([]);
  const [itemsData, setItemsData] = useState<ItemData[]>([]);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Camera state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showCaptureFrame, setShowCaptureFrame] = useState(true);
  
  // Location state
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  
  // ===============================
  // REFS
  // ===============================
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // ===============================
  // HOOKS
  // ===============================
  
  const { analyzeImage, isAnalyzing, error: visionError } = useVisionAnalysis();

  // ===============================
  // CAMERA FUNCTIONS
  // ===============================
  
  const startCamera = async () => {
    setCameraError(null);
    setCameraReady(false);
    
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        } 
      });
      
      setCameraStream(stream);
      setStep("camera");
      
      setTimeout(() => {
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => setCameraReady(true);
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera error:', error);
      setCameraError('Camera access denied. Please enable camera permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCapturedPhoto(null);
    setCameraReady(false);
    setStep("upload");
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || isCapturing) return;

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;
      const outputSize = 800;
      
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      const cropSize = Math.min(videoWidth, videoHeight);
      const cropX = (videoWidth - cropSize) / 2;
      const cropY = (videoHeight - cropSize) / 2;
      
      ctx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, outputSize, outputSize);
      
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      
      stopCamera();
      setCapturedPhoto(dataURL);
      setStep("photo-preview");
      
    } catch (error) {
      console.error('Capture error:', error);
      setCameraError('Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // ===============================
  // IMAGE MANAGEMENT FUNCTIONS
  // ===============================

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      if (e.target?.result) {
        const imageDataUrl = e.target.result as string;
        setCurrentImage(imageDataUrl);
        setStep("ai-detection");
        await analyzePhotoWithAI(imageDataUrl);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const confirmPhoto = async () => {
    if (!capturedPhoto) return;
    
    setCurrentImage(capturedPhoto);
    setCapturedPhoto(null);
    setStep("ai-detection");
    await analyzePhotoWithAI(capturedPhoto);
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // ===============================
  // AI ANALYSIS FUNCTIONS
  // ===============================

  const analyzePhotoWithAI = async (imageDataUrl: string) => {
    const results = await analyzeImage(imageDataUrl);
    
    if (results && results.length > 0) {
      setDetectedItems(results);
      setSelectedItems(results.filter(item => item.selected));
      setStep("item-selection");
    } else {
      setStep("details");
      addManualItem();
    }
  };

  const addManualItem = () => {
    const newItem: ItemData = {
      price: "",
      priceType: "fixed",
      itemName: "",
      condition: "",
      location: selectedLocation?.address || "Dinkytown",
      delivery: "pickup",
      aiGenerated: false
    };
    
    setItemsData([newItem]);
    setGeneratedDescriptions([""]);
  };

  // ===============================
  // ITEM MANAGEMENT FUNCTIONS
  // ===============================

  const toggleItemSelection = (itemId: string) => {
    setDetectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const removeDetectedItem = (itemId: string) => {
    setDetectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const addCustomItem = () => {
    const newItem: DetectedItem = {
      id: `custom-${Date.now()}`,
      name: "Custom Item",
      confidence: 100,
      category: "Other",
      suggestedPrice: 20,
      selected: true
    };
    
    setDetectedItems(prev => [...prev, newItem]);
  };

  const updateDetectedItemName = (itemId: string, newName: string) => {
    setDetectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, name: newName } : item
      )
    );
  };

  const proceedWithSelectedItems = () => {
    const selected = detectedItems.filter(item => item.selected);
    setSelectedItems(selected);
    
    const newItemsData: ItemData[] = selected.map(item => ({
      price: item.suggestedPrice.toString(),
      priceType: "fixed",
      itemName: item.name,
      condition: "Good",
      location: selectedLocation?.address || "Dinkytown",
      delivery: "pickup",
      detectedItemId: item.id,
      aiGenerated: true
    }));
    
    setItemsData(newItemsData);
    setGeneratedDescriptions(new Array(newItemsData.length).fill(""));
    setStep("details");
  };

  // ===============================
  // DATA MANAGEMENT FUNCTIONS
  // ===============================

  const updateItemData = (index: number, field: keyof ItemData, value: string) => {
    setItemsData(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const nextItem = () => {
    setCurrentItemIndex((prev) => (prev + 1) % itemsData.length);
  };

  const prevItem = () => {
    setCurrentItemIndex((prev) => (prev - 1 + itemsData.length) % itemsData.length);
  };

  const generateDescription = async (index: number) => {
    const item = itemsData[index];
    if (!item.itemName || !item.condition || !item.price) return;
    
    setIsGenerating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiPrefix = item.aiGenerated ? "🤖 AI-detected " : "";
      const description = `${aiPrefix}${item.itemName} in ${item.condition.toLowerCase()} condition - $${item.price} ${item.priceType === 'obo' ? 'OBO' : ''}, ${item.delivery === 'pickup' ? 'pickup only' : 'delivery available'}! Perfect for students and anyone looking for quality furniture.`;
      
      setGeneratedDescriptions(prev => 
        prev.map((desc, i) => i === index ? description : desc)
      );
      
    } catch (error) {
      console.error('Error generating description:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // ===============================
  // VALIDATION FUNCTIONS
  // ===============================

  const canProceedToDescription = itemsData.length > 0 && itemsData.every((item) => {
    return item.price.trim() !== '' && 
           item.itemName.trim() !== '' && 
           item.condition.trim() !== '' && 
           item.location.trim() !== '';
  });

  // ===============================
  // UI COMPONENTS
  // ===============================

  const renderHeader = (title: string, onBack?: () => void) => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            {onBack && (
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </motion.button>
            )}
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Brain size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">{title}</span>
            </div>
          </div>
          
          {step === "details" && itemsData.length > 1 && (
            <div className="text-sm text-gray-500">
              {currentItemIndex + 1} of {itemsData.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderCameraOverlay = () => {
    if (!cameraReady || !showCaptureFrame) return null;

    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        <div className="absolute bg-black/50 inset-0">
          <div 
            className="absolute border-2 border-white bg-transparent"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(100vw, 100vh - 160px)',
              height: 'min(100vw, 100vh - 160px)',
              aspectRatio: '1/1'
            }}
          >
            {/* Corner indicators */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-purple-500" />
            <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-purple-500" />
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-purple-500" />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-purple-500" />
            
            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-white/60 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-white/60 -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* Overlay mask */}
          <div 
            className="absolute bg-transparent border-2 border-transparent"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(100vw, 100vh - 160px)',
              height: 'min(100vw, 100vh - 160px)',
              aspectRatio: '1/1',
              boxShadow: '0 0 0 2000px rgba(0,0,0,0.5)'
            }}
          />
          
          {/* Instructions */}
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-30">
            <p className="text-white/90 text-sm font-medium bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
              🤖 AI will detect furniture in this frame
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ===============================
  // SCREEN RENDERS
  // ===============================

  // Upload Screen
  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("AI Smart Listing")}

        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI-Powered Listing</h1>
              <p className="text-gray-600">Take a photo and let AI detect your furniture automatically!</p>
            </div>

            {/* Upload Area */}
            <div className="border-2 border-dashed border-purple-300 rounded-xl p-12 text-center">
              <div className="space-y-6">
                {/* How it works */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Sparkles size={20} className="text-purple-600 mt-0.5" />
                    <div className="text-left">
                      <h4 className="font-medium text-purple-900">How it works:</h4>
                      <ul className="text-sm text-purple-700 mt-1 space-y-1">
                        <li>• Take a photo of your furniture</li>
                        <li>• AI detects items and suggests names & prices</li>
                        <li>• Review, edit, and publish your listings</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div>
                  <p className="text-gray-600 text-lg mb-6">Ready to get started?</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={startCamera}
                      className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors shadow-lg"
                    >
                      <Brain size={24} className="mr-3" />
                      AI Smart Camera
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center px-8 py-4 bg-gray-600 text-white text-lg font-semibold rounded-xl hover:bg-gray-700 transition-colors shadow-lg"
                    >
                      <Image size={24} className="mr-3" />
                      Upload Photo
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Camera Screen
  if (step === "camera") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Camera Header */}
        <div className="bg-black/90 backdrop-blur-sm text-white p-4 flex items-center justify-between relative z-10">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopCamera}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </motion.button>
          
          <div className="flex items-center space-x-2">
            <Camera size={20} />
            <span className="text-lg font-semibold">AI Smart Camera</span>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCaptureFrame(!showCaptureFrame)}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Focus size={20} />
          </motion.button>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Loading overlay */}
          {!cameraReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Starting AI camera...</p>
              </div>
            </div>
          )}

          {/* Camera overlay */}
          {renderCameraOverlay()}
          
          {/* Camera controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center space-x-12">
              {/* Cancel button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center border border-white/30"
              >
                <X size={24} />
              </motion.button>
              
              {/* Capture button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                disabled={!cameraReady || isCapturing}
                className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center"
                  animate={isCapturing ? { scale: [1, 0.8, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isCapturing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Brain size={28} className="text-white" />
                  )}
                </motion.div>
                
                {cameraReady && !isCapturing && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-white"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.button>
              
              {/* Frame toggle button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCaptureFrame(!showCaptureFrame)}
                className={`w-14 h-14 backdrop-blur-sm text-white rounded-full flex items-center justify-center border ${
                  showCaptureFrame ? 'bg-purple-600/80 border-purple-500' : 'bg-white/20 border-white/30'
                }`}
              >
                <Focus size={24} />
              </motion.button>
            </div>
            
            {/* Instructions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: cameraReady ? 1 : 0, y: cameraReady ? 0 : 20 }}
              className="text-center mt-4"
            >
              <p className="text-white/90 text-sm font-medium">
                {showCaptureFrame 
                  ? "Position furniture in the frame for AI detection" 
                  : "Tap focus to show capture frame"
                }
              </p>
            </motion.div>
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // Photo Preview Screen
  if (step === "photo-preview" && capturedPhoto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("Photo Preview", () => setStep("upload"))}
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Ready for AI Analysis?
            </h2>
            
            {/* Photo preview */}
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-100">
              <img 
                src={capturedPhoto} 
                alt="Captured photo" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* AI info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Brain size={20} className="text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">AI Analysis</h4>
                  <p className="text-sm text-blue-700">
                    Our AI will automatically detect furniture and items in your photo, 
                    suggest names and prices, making listing super quick!
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={retakePhoto}
                className="flex-1 flex items-center justify-center py-4 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                <RefreshCw size={20} className="mr-2" />
                Retake
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmPhoto}
                className="flex-1 flex items-center justify-center py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                <Zap size={20} className="mr-2" />
                Analyze with AI
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // AI Detection Screen
  if (step === "ai-detection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("AI Detection", () => setStep("upload"))}
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            {/* Current Image Preview */}
            <div className="mb-8">
              {currentImage && (
                <div className="aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-100 max-w-md mx-auto">
                  <img 
                    src={currentImage} 
                    alt="Analyzing" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            
            {/* Status Section */}
            <div className="space-y-6">
              {/* Status Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                {isAnalyzing ? (
                  <Loader size={32} className="text-white animate-spin" />
                ) : visionError ? (
                  <AlertCircle size={32} className="text-white" />
                ) : (
                  <Brain size={32} className="text-white" />
                )}
              </div>
              
              {/* Status Text */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isAnalyzing ? "🔍 Analyzing Your Photo..." : visionError ? "⚠️ Analysis Failed" : "✨ Analysis Complete"}
                </h2>
                <p className="text-gray-600">
                  {isAnalyzing 
                    ? "Our AI is identifying furniture and items in your photo. This may take a few seconds."
                    : visionError 
                    ? "We couldn't analyze your photo. You can still add items manually."
                    : "We've detected items in your photo!"
                  }
                </p>
              </div>
              
              {/* Progress Bar (when analyzing) */}
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div 
                      className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 3, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-sm text-gray-500">Detecting objects, analyzing prices...</p>
                </div>
              )}
              
              {/* Error Action Button */}
              {visionError && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setStep("details");
                    addManualItem();
                  }}
                  className="w-full py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
                >
                  Continue Manually
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Item Selection Screen - COMPLETE IMPROVED VERSION
if (step === "item-selection") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("Select Items", () => setStep("ai-detection"))}
        
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              🎯 We Found {detectedItems.length} Item{detectedItems.length !== 1 ? 's' : ''}!
            </h1>
            <p className="text-gray-600">
              Review and select the items you want to list. You can edit names, remove items, or add custom ones.
            </p>
          </div>
  
         {/* Photo with Bounding Boxes - MUCH BETTER VERSION */}
{currentImage && (
  <div className="relative mb-8">
    <div className="relative rounded-2xl overflow-hidden bg-gray-100 max-w-4xl mx-auto shadow-lg">
      <img 
        src={currentImage} 
        alt="Detected items" 
        className="w-full h-auto object-cover"
        style={{ 
          maxHeight: '600px',
          minHeight: '400px'
        }}
      />
      
      {/* Bounding boxes overlay - COMPLETELY REDESIGNED */}
      {detectedItems.map((item, index) => (
        item.boundingBox && (
          <div key={item.id}>
            {/* Main bounding box */}
            <div
              className={`absolute transition-all duration-300 hover:scale-105 ${
                item.selected 
                  ? 'border-3 border-green-500 shadow-lg' 
                  : 'border-3 border-red-500 shadow-lg'
              }`}
              style={{
                left: `${item.boundingBox.x}%`,
                top: `${item.boundingBox.y}%`,
                width: `${item.boundingBox.width}%`,
                height: `${item.boundingBox.height}%`,
                backgroundColor: item.selected 
                  ? 'rgba(34, 197, 94, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                backdropFilter: 'blur(1px)',
              }}
            />
            
            {/* Label with smart positioning */}
            <div 
              className={`absolute px-3 py-2 rounded-lg text-sm font-bold text-white shadow-xl z-20 ${
                item.selected ? 'bg-green-600' : 'bg-red-600'
              }`}
              style={{
                // Smart positioning logic
                left: `${Math.min(Math.max(item.boundingBox.x, 2), 75)}%`,
                top: item.boundingBox.y > 15 
                  ? `${item.boundingBox.y - 3}%` 
                  : `${item.boundingBox.y + item.boundingBox.height + 1}%`,
                transform: 'translateX(-50%)',
                maxWidth: '200px',
                whiteSpace: 'nowrap',
                fontSize: '13px',
                lineHeight: '1.2'
              }}
            >
              <div className="flex items-center space-x-1">
                <span>{item.name}</span>
                <span className="text-xs opacity-90">({Math.round(item.confidence)}%)</span>
              </div>
              
              {/* Small arrow pointing to box */}
              <div 
                className={`absolute w-0 h-0 ${
                  item.boundingBox.y > 15 
                    ? 'top-full border-l-4 border-r-4 border-t-4 border-transparent'
                    : 'bottom-full border-l-4 border-r-4 border-b-4 border-transparent'
                } ${
                  item.selected 
                    ? item.boundingBox.y > 15 ? 'border-t-green-600' : 'border-b-green-600'
                    : item.boundingBox.y > 15 ? 'border-t-red-600' : 'border-b-red-600'
                }`}
                style={{
                  left: '50%',
                  transform: 'translateX(-50%)'
                }}
              />
            </div>
            
            {/* Corner dots for better visibility */}
            {[
              { top: '-2px', left: '-2px' },
              { top: '-2px', right: '-2px' },
              { bottom: '-2px', left: '-2px' },
              { bottom: '-2px', right: '-2px' }
            ].map((position, dotIndex) => (
              <div
                key={dotIndex}
                className={`absolute w-3 h-3 rounded-full border-2 border-white ${
                  item.selected ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{
                  left: `${item.boundingBox.x + (position.right ? item.boundingBox.width : 0)}%`,
                  top: `${item.boundingBox.y + (position.bottom ? item.boundingBox.height : 0)}%`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 25
                }}
              />
            ))}
          </div>
        )
      ))}
      
      {/* Selection indicator overlay */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="text-xs font-medium text-gray-700">
            {detectedItems.filter(item => item.selected).length} / {detectedItems.length} selected
          </div>
        </div>
        
        {/* Legend */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Selected</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-700">Not selected</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick selection hint */}
      <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-xs">
        💡 Click items below to toggle selection
      </div>
    </div>
    
    {/* Image info bar */}
    <div className="mt-3 text-center text-sm text-gray-500">
      AI detected {detectedItems.length} items with average confidence of {Math.round(detectedItems.reduce((sum, item) => sum + item.confidence, 0) / detectedItems.length)}%
    </div>
  </div>
)}
  
          {/* Detected Items Management - IMPROVED */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detected Items</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={addCustomItem}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Add Item
              </motion.button>
            </div>
            
            {/* Items List - IMPROVED */}
            <div className="space-y-3">
              {detectedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                    item.selected 
                      ? 'border-green-200 bg-gradient-to-r from-green-50 to-green-100 shadow-sm' 
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {/* Selection Checkbox - IMPROVED */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleItemSelection(item.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                      item.selected 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'border-2 border-gray-300 bg-white hover:border-gray-400'
                    }`}
                  >
                    {item.selected && <Check size={16} />}
                  </motion.button>
                  
                  {/* Item Details - IMPROVED */}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateDetectedItemName(item.id, e.target.value)}
                      className={`font-medium bg-transparent border-none outline-none w-full text-lg ${
                        item.selected ? 'text-green-800' : 'text-gray-700'
                      }`}
                      placeholder="Item name..."
                    />
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mt-1">
                      <span className="flex items-center">
                        <Package size={14} className="mr-1" />
                        {item.category}
                      </span>
                      <span className="flex items-center">
                        <DollarSign size={14} className="mr-1" />
                        ${item.suggestedPrice}
                      </span>
                      <span className="flex items-center">
                        <Target size={14} className="mr-1" />
                        {Math.round(item.confidence)}% confidence
                      </span>
                    </div>
                  </div>
                  
                  {/* Remove Button - IMPROVED */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeDetectedItem(item.id)}
                    className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-all duration-200 shadow-sm"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
            
            {/* Summary Stats - NEW */}
            <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  <strong>{detectedItems.filter(item => item.selected).length}</strong> of <strong>{detectedItems.length}</strong> items selected
                </span>
                <span className="text-gray-600">
                  Avg confidence: <strong>{Math.round(detectedItems.reduce((sum, item) => sum + item.confidence, 0) / detectedItems.length)}%</strong>
                </span>
              </div>
            </div>
          </div>
  
          {/* Continue Button - IMPROVED */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={proceedWithSelectedItems}
            disabled={detectedItems.filter(item => item.selected).length === 0}
            className={`w-full py-4 text-white text-lg font-semibold rounded-xl transition-all duration-200 shadow-lg ${
              detectedItems.filter(item => item.selected).length > 0
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <span className="flex items-center justify-center">
              <CheckCircle size={20} className="mr-2" />
              Continue with {detectedItems.filter(item => item.selected).length} Selected Item{detectedItems.filter(item => item.selected).length !== 1 ? 's' : ''}
            </span>
          </motion.button>
        </div>
      </div>
    );
  }


  // Details Screen
  if (step === "details") {
    const currentItem = itemsData[currentItemIndex] || {};
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("Item Details", () => setStep(selectedItems.length > 0 ? "item-selection" : "upload"))}

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Current Image Display */}
          {currentImage && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-6"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
                <img
                  src={currentImage}
                  alt="Item"
                  className="w-full h-full object-cover"
                />
                
                {/* AI Detection Badge */}
                {currentItem.aiGenerated && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                    <Brain size={16} className="mr-1" />
                    AI Detected
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Multiple Items Navigation */}
          {itemsData.length > 1 && (
            <div className="flex items-center justify-between mb-6">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevItem}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <ChevronLeft size={20} className="mr-1" />
                Previous
              </motion.button>
              
              <span className="text-gray-600 font-medium">
                Item {currentItemIndex + 1} of {itemsData.length}
              </span>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextItem}
                className="flex items-center px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                Next
                <ChevronRight size={20} className="ml-1" />
              </motion.button>
            </div>
          )}

          {/* Item Details Form */}
          <motion.div 
            key={currentItemIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
          >
            {/* AI Suggestions Notice */}
            {currentItem.aiGenerated && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Brain size={20} className="text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">AI Suggestions Applied</h4>
                    <p className="text-sm text-purple-700">
                      We've pre-filled this information based on our AI analysis. Feel free to edit anything!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Price Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <DollarSign size={20} className="mr-2 text-purple-600" />
                Price *
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Enter price"
                  value={currentItem.price || ""}
                  onChange={(e) => updateItemData(currentItemIndex, 'price', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select
                  value={currentItem.priceType || "fixed"}
                  onChange={(e) => updateItemData(currentItemIndex, 'priceType', e.target.value as "fixed" | "obo")}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed</option>
                  <option value="obo">OBO</option>
                </select>
              </div>
            </div>

            {/* Item Name Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <Package size={20} className="mr-2 text-purple-600" />
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g., IKEA Malm Desk"
                value={currentItem.itemName || ""}
                onChange={(e) => updateItemData(currentItemIndex, 'itemName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Condition Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                🧼 Condition *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["Like New", "Good", "Fair", "Used"].map((condition) => (
                  <motion.button
                    key={condition}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateItemData(currentItemIndex, 'condition', condition)}
                    className={`px-4 py-3 rounded-lg border transition-colors ${
                      currentItem.condition === condition
                        ? "bg-purple-500 text-white border-purple-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    {condition}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Location Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <MapPin size={20} className="mr-2 text-purple-600" />
                Location *
              </label>
              <LocationPicker
                initialValue={currentItem.location}
                onLocationSelect={(location) => {
                  updateItemData(currentItemIndex, 'location', location.address);
                  setSelectedLocation(location);
                }}
              />
            </div>

            {/* Pickup/Delivery Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <Truck size={20} className="mr-2 text-purple-600" />
                Pickup/Delivery
              </label>
              <div className="space-y-2">
                {[
                  { value: "pickup", label: "Pickup only" },
                  { value: "delivery", label: "Delivery available" },
                  { value: "both", label: "Both pickup & delivery" }
                ].map((option) => (
                  <motion.button
                    key={option.value}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => updateItemData(currentItemIndex, 'delivery', option.value)}
                    className={`w-full px-4 py-3 rounded-lg border text-left transition-colors ${
                      currentItem.delivery === option.value
                        ? "bg-purple-500 text-white border-purple-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-purple-300"
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Continue to Descriptions Button */}
          <motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}  
            onClick={() => setStep("description")}
            className={`w-full mt-6 py-4 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg ${
              canProceedToDescription 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                : 'bg-gray-400 hover:bg-gray-500 cursor-pointer'
            }`}
          >
            Generate AI Descriptions
            {!canProceedToDescription && (
              <span className="block text-sm mt-1">
                Complete all required fields (*)
              </span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // Description Generation Screen
  if (step === "description") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("AI Descriptions", () => setStep("details"))}

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {/* Individual Item Descriptions */}
          {itemsData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              {/* Item Header */}
              <div className="flex gap-4 mb-4">
                {currentImage && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={currentImage} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {item.itemName}
                    </h3>
                    {item.aiGenerated && (
                      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                        <Brain size={12} className="mr-1" />
                        AI
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600">
                    ${item.price} {item.priceType === 'obo' ? 'OBO' : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.condition}
                  </p>
                </div>
              </div>

              {/* Description Generator */}
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center text-lg font-semibold text-gray-900">
                  <Wand2 size={20} className="mr-2 text-purple-600" />
                  AI-Generated Description
                </h4>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => generateDescription(index)}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:from-purple-700 hover:to-blue-700 transition-colors"
                >
                  {isGenerating ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </div>
                  ) : (
                    generatedDescriptions[index] ? "Regenerate" : "Generate"
                  )}
                </motion.button>
              </div>

              {/* Description Content */}
              <AnimatePresence>
                {generatedDescriptions[index] ? (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200"
                  >
                    <div className="mb-3">
                      <textarea
                        value={generatedDescriptions[index]}
                        onChange={(e) => {
                          const newDescriptions = [...generatedDescriptions];
                          newDescriptions[index] = e.target.value;
                          setGeneratedDescriptions(newDescriptions);
                        }}
                        className="w-full p-3 text-gray-700 bg-white border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={3}
                        placeholder="Edit your description..."
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-green-600">
                        <Check size={16} className="mr-1" />
                        Ready to post
                      </div>
                      <div className="text-xs text-gray-500">
                        {generatedDescriptions[index].length} characters
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500 text-sm">
                      Click "Generate" to create an AI-powered description for your item
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Final Publishing Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🚀 Ready to Launch Your Listings?
              </h3>
              <p className="text-gray-600">
                {generatedDescriptions.filter(desc => desc).length} of {itemsData.length} AI descriptions ready
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={generatedDescriptions.some(desc => !desc)}
              className={`w-full py-4 text-lg font-semibold rounded-xl transition-colors shadow-lg ${
                generatedDescriptions.every(desc => desc)
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {generatedDescriptions.every(desc => desc) ? (
                <div className="flex items-center justify-center">
                  <CheckCircle size={24} className="mr-2" />
                  Publish All Items ({itemsData.length})
                </div>
              ) : (
                `Generate ${generatedDescriptions.filter(desc => !desc).length} more description${generatedDescriptions.filter(desc => !desc).length !== 1 ? 's' : ''}`
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Camera Error Screen
  if (cameraError && step !== "camera") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white">
        {renderHeader("Camera Access", () => {
          setCameraError(null);
          setStep("upload");
        })}
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={32} className="text-red-600" />
            </div>
            
            {/* Error Content */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Camera Access Required
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {cameraError}
            </p>
            
            {/* Error Actions */}
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={startCamera}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-colors"
              >
                Try Again
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Upload Photo Instead
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===============================
  // FALLBACK RENDER
  // ===============================

  return null;
}
