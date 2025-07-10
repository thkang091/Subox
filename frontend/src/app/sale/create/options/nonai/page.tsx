"use client"

import { useState, useRef, useEffect } from "react";
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
  Check,
  Image,
  RefreshCw,
  CheckCircle,
  Focus,
  Plus,
  Trash2,
  Grid,
  AlertCircle
} from "lucide-react";
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from "next/navigation";

// Component imports - This should use the actual LocationPicker component
import LocationPicker from '../../../../../components/LocationPicker';


// ===============================
// TYPES AND INTERFACES
// ===============================

interface ItemData {
  price: string;
  priceType: "fixed" | "negotiable";
  minPrice?: string;
  maxPrice?: string;
  itemName: string;
  condition: string;
  location: string;
  category: string; 
  delivery: string;
  images: string[];
}

type AppStep = "upload" | "camera" | "photo-preview" | "items" | "item-details" | "description";



// ===============================
// MAIN COMPONENT
// ===============================

export default function ItemListingPage() {
  const router = useRouter(); // Add this line

  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  const [step, setStep] = useState("upload");
  const [items, setItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user] = useAuthState(auth);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [generatedDescriptions, setGeneratedDescriptions] = useState([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Camera specific state
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [showCaptureFrame, setShowCaptureFrame] = useState(true);
  const [cameraMode, setCameraMode] = useState("new-item");
  const [targetItemIndex, setTargetItemIndex] = useState(0);
  
  // Location state
  const [selectedLocation, setSelectedLocation] = useState(null);


  const [descriptionMode, setDescriptionMode] = useState("choose"); // "choose", "ai", "manual"
  const [manualDescriptions, setManualDescriptions] = useState([]);
  
  // ===============================
  // REFS
  // ===============================
  
  const fileInputRef = useRef(null);
  const addPhotosInputRef = useRef(null); // New ref for adding photos to existing items
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const addPhotoMenuRef = useRef(null);

  // ===============================
  // CAMERA FUNCTIONS
  // ===============================
  
  const startCamera = async (mode = "new-item", itemIndex = 0) => {
    setCameraError(null);
    setCameraReady(false);
    setCameraMode(mode);
    setTargetItemIndex(itemIndex);
    
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
          videoRef.current.onloadedmetadata = () => {
            setCameraReady(true);
          };
        }
      }, 100);
      
    } catch (error) {
      console.error('Camera error:', error);
      let errorMessage = 'Camera access denied. ';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage += 'Please enable camera permissions in your browser settings and refresh the page.';
        } else if (error.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage += 'Camera not supported by this browser.';
        } else {
          errorMessage += error.message;
        }
      }
      
      setCameraError(errorMessage);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCapturedPhoto(null);
    setCameraReady(false);
    if (cameraMode === "new-item") {
      setStep("upload");
    } else {
      setStep("items");
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady || isCapturing) return;

    setIsCapturing(true);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;
      
      const videoAspectRatio = videoWidth / videoHeight;
      const screenAspectRatio = window.innerWidth / window.innerHeight;
      
      let cropSize, cropX, cropY;
      
      if (videoAspectRatio > screenAspectRatio) {
        const scaledHeight = videoHeight;
        const scaledWidth = scaledHeight * screenAspectRatio;
        cropSize = Math.min(scaledWidth, scaledHeight);
        cropX = (videoWidth - cropSize) / 2;
        cropY = (videoHeight - cropSize) / 2;
      } else {
        const scaledWidth = videoWidth;
        const scaledHeight = scaledWidth / screenAspectRatio;
        cropSize = Math.min(scaledWidth, scaledHeight);
        cropX = (videoWidth - cropSize) / 2;
        cropY = (videoHeight - cropSize) / 2;
      }

      const finalCropSize = Math.min(cropSize, cropSize);
      cropX = (videoWidth - finalCropSize) / 2;
      cropY = (videoHeight - finalCropSize) / 2;

      const outputSize = 800;
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      ctx.drawImage(
        video,
        cropX, cropY, finalCropSize, finalCropSize,
        0, 0, outputSize, outputSize
      );
      
      const dataURL = canvas.toDataURL('image/jpeg', 0.9);
      
      if (!dataURL || dataURL === 'data:,') {
        throw new Error('Failed to capture image');
      }
      
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

  const confirmPhoto = () => {
    if (!capturedPhoto) return;

    if (cameraMode === "new-item") {
      const newItem = {
        price: "",
        priceType: "fixed",
        itemName: "",
        condition: "",
        location: selectedLocation?.address || "Dinkytown",
        delivery: "pickup",
        images: [capturedPhoto]
      };
      
      setItems(prev => [...prev, newItem]);
      setGeneratedDescriptions(prev => [...prev, ""]);
    } else {
      setItems(prev => prev.map((item, index) => 
        index === targetItemIndex 
          ? { ...item, images: [...item.images, capturedPhoto] }
          : item
      ));
    }
    
    setCapturedPhoto(null);
    setStep(cameraMode === "new-item" ? "upload" : "items");
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera(cameraMode, targetItemIndex);
  };

  // ===============================
  // IMAGE MANAGEMENT FUNCTIONS
  // ===============================

  const handleImageUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const newItem = {
            price: "",
            priceType: "fixed",
            itemName: "",
            condition: "",
            location: selectedLocation?.address || "Dinkytown",
            delivery: "pickup",
            images: [e.target.result]
          };
          
          setItems(prev => [...prev, newItem]);
          setGeneratedDescriptions(prev => [...prev, ""]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotosToItem = (event, itemIndex) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setItems(prev => prev.map((item, index) => 
            index === itemIndex 
              ? { ...item, images: [...item.images, e.target.result] }
              : item
          ));
        }
      };
      reader.readAsDataURL(file);
    });
    
    // Clear the input value so the same file can be selected again
    event.target.value = '';
  };

  const triggerAddPhotosUpload = (itemIndex) => {
    if (addPhotosInputRef.current) {
      addPhotosInputRef.current.dataset.itemIndex = itemIndex;
      addPhotosInputRef.current.click();
    }
  };

  const removeItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    setGeneratedDescriptions(prev => prev.filter((_, i) => i !== index));
    
    if (currentItemIndex >= items.length - 1) {
      setCurrentItemIndex(Math.max(0, items.length - 2));
    }
  };

  const removePhotoFromItem = (itemIndex, photoIndex) => {
    setItems(prev => prev.map((item, index) => 
      index === itemIndex 
        ? { ...item, images: item.images.filter((_, i) => i !== photoIndex) }
        : item
    ));

    const item = items[itemIndex];
    if (item.images.length === 1) {
      removeItem(itemIndex);
    }
  };

  // ===============================
  // NAVIGATION FUNCTIONS
  // ===============================

  const nextItem = () => {
    setCurrentItemIndex((prev) => (prev + 1) % items.length);
    setCurrentPhotoIndex(0);
  };

  const prevItem = () => {
    setCurrentItemIndex((prev) => (prev - 1 + items.length) % items.length);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    const currentItem = items[currentItemIndex];
    if (currentItem) {
      setCurrentPhotoIndex((prev) => (prev + 1) % currentItem.images.length);
    }
  };

  const prevPhoto = () => {
    const currentItem = items[currentItemIndex];
    if (currentItem) {
      setCurrentPhotoIndex((prev) => (prev - 1 + currentItem.images.length) % currentItem.images.length);
    }
  };

  // ===============================
  // DATA MANAGEMENT FUNCTIONS
  // ===============================

  const updateItemData = (index, field, value) => {
    setItems(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const validatePriceRange = (item) => {
    if (item.priceType === "fixed") return true;
    
    const basePrice = parseFloat(item.price);
    const minPrice = parseFloat(item.minPrice || "0");
    const maxPrice = parseFloat(item.maxPrice || "0");
    
    if (isNaN(basePrice) || isNaN(minPrice) || isNaN(maxPrice)) return false;
    
    return minPrice <= basePrice && basePrice <= maxPrice && minPrice < maxPrice;
  };

  const generateDescription = async (index) => {
    const item = items[index];
    console.log('🔍 Generate Description Debug - Starting for item:', index);
    console.log('📝 Item data:', item);
    
    if (!item.itemName || !item.condition || !item.price) {
      console.log('❌ Missing required fields:', {
        itemName: item.itemName,
        condition: item.condition,
        price: item.price
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const requestPayload = {
        step: 'generate',
        itemData: {
          itemName: item.itemName,
          condition: item.condition,
          price: item.price,
          priceType: item.priceType,
          delivery: item.delivery,
          location: item.location,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice
        }
      };
      
      console.log('📤 Making API request with payload:', requestPayload);
      
      const response = await fetch('../../../../api/process-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
  
      console.log('📥 API Response status:', response.status);
      console.log('📥 API Response ok:', response.ok);
      
      if (!response.ok) {
        console.error('❌ API Response not ok:', response.status, response.statusText);
        throw new Error(`API request failed with status ${response.status}`);
      }
  
      const data = await response.json();
      console.log('📋 API Response data:', data);
      
      if (data.description) {
        console.log('✅ Description received:', data.description);
        setGeneratedDescriptions(prev => 
          prev.map((desc, i) => i === index ? data.description : desc)
        );
      } else if (data.error) {
        console.error('❌ API returned error:', data.error);
        throw new Error(`API error: ${data.error}`);
      } else {
        console.error('❌ No description in response:', data);
        throw new Error('No description received');
      }
      
    } catch (error) {
      console.error('💥 Error generating description:', error);
      console.error('📊 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Fallback to local generation if API fails
      console.log('🔄 Falling back to local generation');
      let priceText = `$${item.price}`;
      if (item.priceType === "negotiable" && item.minPrice && item.maxPrice) {
        priceText = `$${item.minPrice}-${item.maxPrice} (asking $${item.price})`;
      }
      
      const fallbackDescriptions = [
        `${item.itemName} in ${item.condition.toLowerCase()} condition - ${priceText}, ${item.delivery === 'pickup' ? 'pickup only' : 'delivery available'}!`,
        `Great ${item.condition.toLowerCase()} ${item.itemName} for ${priceText} - perfect for students!`,
        `Selling my ${item.itemName} (${item.condition.toLowerCase()}) for ${priceText}. ${item.delivery === 'pickup' ? 'Pickup only' : 'Can deliver'}.`
      ];
      
      const fallbackDescription = fallbackDescriptions[Math.floor(Math.random() * fallbackDescriptions.length)];
      console.log('🔄 Using fallback description:', fallbackDescription);
      
      setGeneratedDescriptions(prev => 
        prev.map((desc, i) => i === index ? fallbackDescription : desc)
      );
    } finally {
      console.log('🏁 Generate description finished for item:', index);
      setIsGenerating(false);
    }
  };

  // ===============================
  // VALIDATION FUNCTIONS
  // ===============================

  const canProceedToItems = items.length > 0;

  const canProceedToDescription = items.length > 0 && items.every((item) => {
    const basicValidation = (
      item && 
      typeof item.price === 'string' && item.price.trim() !== '' && 
      typeof item.itemName === 'string' && item.itemName.trim() !== '' && 
      typeof item.condition === 'string' && item.condition.trim() !== '' &&
      typeof item.location === 'string' && item.location.trim() !== '' &&
      typeof item.category === 'string' && item.category.trim() !== ''
    );
    
    return basicValidation && validatePriceRange(item);
  });

  // ===============================
// HELPER FUNCTIONS (move these outside of step conditions)
// ===============================

// Helper function to get completion percentage
const getCompletionPercentage = (item) => {
  const requiredFields = ['price', 'itemName', 'condition', 'location', 'category'];
  const completedFields = requiredFields.filter(field => item[field] && item[field].trim() !== '').length;
  return Math.round((completedFields / requiredFields.length) * 100);
};

// Helper function to format price display
const formatPriceDisplay = (item) => {
  if (!item.price) return "No price set";
  
  const basePrice = `$${item.price}`;
  if (item.priceType === "negotiable" && item.minPrice && item.maxPrice) {
    return `$${item.minPrice} - $${item.maxPrice}`;
  }
  return basePrice;
};

// Helper function to get delivery icon and text
const getDeliveryInfo = (delivery) => {
  switch (delivery) {
    case 'pickup': return { icon: '📍', text: 'Pickup only' };
    case 'delivery': return { icon: '🚚', text: 'Delivery available' };
    case 'both': return { icon: '🔄', text: 'Pickup & Delivery' };
    default: return { icon: '❓', text: 'Not specified' };
  }
};


  // ===============================
  // SHARED UI COMPONENTS
  // ===============================

  const renderHeader = (title, onBack) => (
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
              <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none">
                <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
              </svg>
              <span className="text-xl font-bold text-gray-900">{title}</span>
            </div>
          </div>
          
          {step === "item-details" && (
            <div className="text-sm text-gray-500">
              Item {currentItemIndex + 1} of {items.length}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ===============================
  // CAMERA ERROR SCREEN
  // ===============================

  if (cameraError && step !== "camera") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Camera Access", () => {
          setCameraError(null);
          setStep(cameraMode === "new-item" ? "upload" : "items");
        })}
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 text-center"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera size={32} className="text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Camera Access Required
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {cameraError}
            </p>
            
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startCamera(cameraMode, targetItemIndex)}
                className="w-full py-3 bg-orange-600 text-white font-semibold rounded-xl hover:bg-orange-700 transition-colors"
              >
                Try Again
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Choose Photos Instead
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===============================
  // PHOTO PREVIEW SCREEN
  // ===============================

  if (step === "photo-preview" && capturedPhoto) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Photo Preview", () => setStep(cameraMode === "new-item" ? "upload" : "items"))}
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {cameraMode === "new-item" ? "New Item Photo" : "Adding Photo to Item"}
            </h2>
            
            <div className="relative aspect-square rounded-2xl overflow-hidden mb-6 bg-gray-100">
              <img 
                src={capturedPhoto} 
                alt="Captured photo" 
                className="w-full h-full object-cover"
              />
            </div>
            
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
                className="flex-1 flex items-center justify-center py-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
              >
                <CheckCircle size={20} className="mr-2" />
                {cameraMode === "new-item" ? "Create Item" : "Add Photo"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===============================
  // CAMERA SCREEN
  // ===============================

  if (step === "camera") {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="bg-black/90 backdrop-blur-sm text-white p-4 flex items-center justify-between relative z-10 safe-area-top">
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
            <span className="text-lg font-semibold">
              {cameraMode === "new-item" ? "Take Photo" : "Add Photo"}
            </span>
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

        <div className="flex-1 relative overflow-hidden bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {!cameraReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Starting camera...</p>
              </div>
            </div>
          )}

          {cameraReady && showCaptureFrame && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div 
                className="absolute bg-black/50"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
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
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-orange-500" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-orange-500" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-orange-500" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-orange-500" />
                  
                  <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-white/60 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-white/60 -translate-x-1/2 -translate-y-1/2" />
                </div>
                
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
                
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-30">
                  <p className="text-white/90 text-sm font-medium bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
                    📸 This exact square will be captured
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent safe-area-bottom">
            <div className="flex items-center justify-center space-x-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center border border-white/30"
              >
                <X size={24} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={capturePhoto}
                disabled={!cameraReady || isCapturing}
                className="relative w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <motion.div 
                  className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center"
                  animate={isCapturing ? { scale: [1, 0.8, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {isCapturing ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera size={28} className="text-white" />
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
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCaptureFrame(!showCaptureFrame)}
                className={`w-14 h-14 backdrop-blur-sm text-white rounded-full flex items-center justify-center border ${
                  showCaptureFrame ? 'bg-orange-600/80 border-orange-500' : 'bg-white/20 border-white/30'
                }`}
              >
                <Focus size={24} />
              </motion.button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: cameraReady ? 1 : 0, y: cameraReady ? 0 : 20 }}
              className="text-center mt-4"
            >
              <p className="text-white/90 text-sm font-medium mb-2">
                {showCaptureFrame 
                  ? "Position your item in the square frame" 
                  : "Tap the focus button to show capture frame"
                }
              </p>
              <p className="text-white/70 text-xs">
                Or tap the blue button to upload existing photos
              </p>
            </motion.div>
          </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  // ===============================
  // UPLOAD SCREEN
  // ===============================

  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Add Photos")}

        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">📸 Upload Your Photos</h1>
              <p className="text-gray-600">Add photos of the items you want to sell</p>
            </div>

            {items.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Camera size={32} className="text-orange-600" />
                  </div>
                  
                  <div>
                    <p className="text-gray-600 mb-6 text-lg">Take or upload photos of your items</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => startCamera("new-item")}
                        className="flex items-center justify-center px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow-lg"
                      >
                        <Camera size={24} className="mr-3" />
                        Take Photo
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center px-8 py-4 bg-gray-600 text-white text-lg font-semibold rounded-xl hover:bg-gray-700 transition-colors shadow-lg"
                      >
                        <Image size={24} className="mr-3" />
                        Choose Photos
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group bg-gray-50 rounded-xl p-4"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-200">
                        <img 
                          src={item.images[0]} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">
                            {item.images.length} photo{item.images.length !== 1 ? 's' : ''}
                          </span>
                          {item.itemName && (
                            <span className="text-xs text-gray-500 truncate max-w-20">
                              {item.itemName}
                            </span>
                          )}
                        </div>
                        
                        <button
                          onClick={() => removeItem(index)}
                          className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors p-4"
                  >
                    <Image size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500 text-center">Add New Item</span>
                  </button>
                  
                  <button
                    onClick={() => startCamera("new-item")}
                    className="aspect-square border-2 border-dashed border-orange-400 rounded-xl flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors p-4"
                  >
                    <Camera size={24} className="text-orange-500 mb-2" />
                    <span className="text-sm text-orange-600 text-center">Take Photo</span>
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("items")}
                  disabled={!canProceedToItems}
                  className="w-full py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors shadow-lg"
                >
                  Continue to Items ({items.length} {items.length === 1 ? 'item' : 'items'})
                </motion.button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </motion.div>
        </div>
      </div>
    );
  }

 
// ===============================
  // ITEMS OVERVIEW SCREEN
  // ===============================
  if (step === "items") {
    // Helper function to format price display
    const formatPriceDisplay = (item) => {
      if (!item.price) return "No price set";
      
      const basePrice = `$${item.price}`;
      if (item.priceType === "negotiable" && item.minPrice && item.maxPrice) {
        return `$${item.minPrice} - $${item.maxPrice}`;
      }
      return basePrice;
    };

    // Helper function to get completion percentage
    const getCompletionPercentage = (item) => {
      const requiredFields = ['price', 'itemName', 'condition', 'location'];
      const completedFields = requiredFields.filter(field => item[field] && item[field].trim() !== '').length;
      return Math.round((completedFields / requiredFields.length) * 100);
    };

    // Helper function to get delivery icon and text
    const getDeliveryInfo = (delivery) => {
      switch (delivery) {
        case 'pickup': return { icon: '📍', text: 'Pickup only' };
        case 'delivery': return { icon: '🚚', text: 'Delivery available' };
        case 'both': return { icon: '🔄', text: 'Pickup & Delivery' };
        default: return { icon: '❓', text: 'Not specified' };
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Your Items", () => setStep("upload"))}

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Summary Stats */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-orange-600">{items.length}</div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-green-600">
                    {items.filter(item => getCompletionPercentage(item) === 100).length}
                  </div>
                  <div className="text-sm text-gray-600">Ready to List</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-blue-600">
                    {items.reduce((total, item) => total + item.images.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Photos</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-purple-600">
                    ${items.filter(item => item.price).reduce((total, item) => total + parseFloat(item.price || '0'), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Value</div>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item, index) => {
              const completionPercentage = getCompletionPercentage(item);
              const deliveryInfo = getDeliveryInfo(item.delivery);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition-all duration-300"
                >
                  {/* Image Section */}
                  <div className="relative aspect-square bg-gray-100">
                    <img 
                      src={item.images[0]} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                    
                    {/* Image Counter */}
                    {item.images.length > 1 && (
                      <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                        <Camera size={12} />
                        <span>{item.images.length}</span>
                      </div>
                    )}
                    
                    {/* Completion Badge */}
                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${
                      completionPercentage === 100 
                        ? 'bg-green-500 text-white' 
                        : completionPercentage >= 75 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {completionPercentage}% Complete
                    </div>
                    
                    {/* Hover Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => startCamera("add-to-item", index)}
                        className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg"
                        title="Add Photo"
                      >
                        <Camera size={20} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => triggerAddPhotosUpload(index)}
                        className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg"
                        title="Upload Photos"
                      >
                        <Image size={20} />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setCurrentItemIndex(index);
                          setCurrentPhotoIndex(0);
                          setStep("item-details");
                        }}
                        className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg"
                        title="View Details"
                      >
                        <Grid size={20} />
                      </motion.button>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 space-y-4">
                    {/* Title and Price */}
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {item.itemName || "Untitled Item"}
                      </h3>
                      
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="text-xl font-bold text-orange-600">
                            {formatPriceDisplay(item)}
                          </div>
                          {item.priceType === "negotiable" && item.price && (
                            <div className="text-sm text-gray-500">
                              Asking: ${item.price} (Negotiable)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Item Details */}
                    <div className="space-y-3">
                      {/* Condition */}
                      {item.condition && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">🧼</span>
                          <span className={`text-sm px-2 py-1 rounded-full ${
                            item.condition === 'Like New' ? 'bg-green-100 text-green-700' :
                            item.condition === 'Good' ? 'bg-blue-100 text-blue-700' :
                            item.condition === 'Fair' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.condition} condition
                          </span>
                        </div>
                      )}

                      {/* Location */}
                      {item.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin size={14} className="text-gray-500" />
                          <span className="text-sm text-gray-600 truncate">
                            {item.location}
                          </span>
                        </div>
                      )}

                      {/* Delivery */}
                      {item.delivery && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{deliveryInfo.icon}</span>
                          <span className="text-sm text-gray-600">
                            {deliveryInfo.text}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Completion</span>
                        <span className="text-xs text-gray-500">{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${completionPercentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className={`h-2 rounded-full transition-colors ${
                            completionPercentage === 100 ? 'bg-green-500' :
                            completionPercentage >= 75 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setCurrentItemIndex(index);
                          setCurrentPhotoIndex(0);
                          setStep("item-details");
                        }}
                        className="flex-1 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-1"
                      >
                        <span>Edit Details</span>
                        {completionPercentage < 100 && (
                          <div className="w-4 h-4 bg-white/30 rounded-full flex items-center justify-center">
                            <span className="text-xs">!</span>
                          </div>
                        )}
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => removeItem(index)}
                        className="px-3 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Add New Item Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: items.length * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-8 flex flex-col items-center justify-center space-y-6 hover:border-orange-400 hover:bg-orange-50 transition-colors group"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Plus size={36} className="text-orange-600" />
              </div>
              
              <div className="text-center space-y-4">
                <h3 className="font-bold text-gray-900 text-lg">Add New Item</h3>
                <p className="text-sm text-gray-600">
                  Take a photo or upload images to add another item to your listing
                </p>
                <div className="space-y-3 w-full">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startCamera("new-item")}
                    className="w-full py-3 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Camera size={18} />
                    <span>Take Photo</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Image size={18} />
                    <span>Upload Photos</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Continue Button */}
          {items.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 text-center"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">Ready to Continue?</h3>
                  <p className="text-gray-600">
                    You have {items.filter(item => getCompletionPercentage(item) === 100).length} of {items.length} items ready to list
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("summary")}
                  className="px-8 py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl hover:bg-orange-700 transition-colors shadow-lg flex items-center justify-center space-x-2 mx-auto"
                >
                  <span>View Summary</span>
                  <div className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          {/* Hidden input for adding photos to existing items */}
          <input
            ref={addPhotosInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const itemIndex = parseInt(e.target.dataset.itemIndex);
              handleAddPhotosToItem(e, itemIndex);
            }}
            className="hidden"
          />
        </div>
      </div>
    );
  }

  // ===============================
  // SUMMARY DASHBOARD SCREEN
  // ===============================

  if (step === "summary") {
    const completedItems = items.filter(item => getCompletionPercentage(item) === 100);
    const allItemsComplete = completedItems.length === items.length && items.length > 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Summary Dashboard", () => setStep("items"))}

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Main Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 mb-8"
          >
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📊 Listing Summary
              </h1>
              <p className="text-gray-600">
                Review your items before generating descriptions
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-orange-600">{items.length}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-green-600">{completedItems.length}</div>
                <div className="text-sm text-gray-600">Complete</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {items.reduce((total, item) => total + item.images.length, 0)}
                </div>
                <div className="text-sm text-gray-600">Photos</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-purple-600">
                  ${items.filter(item => item.price).reduce((total, item) => total + parseFloat(item.price || '0'), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Value</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-500">
                  {Math.round((completedItems.length / items.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedItems.length / items.length) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-3 rounded-full transition-colors ${
                    allItemsComplete ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                />
              </div>
            </div>
          </motion.div>

          {/* Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {items.map((item, index) => {
              const completionPercentage = getCompletionPercentage(item);
              const isComplete = completionPercentage === 100;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-md overflow-hidden border-2 transition-all hover:shadow-lg ${
                    isComplete ? 'border-green-200' : 'border-orange-200'
                  }`}
                >
                  <div className="relative aspect-square">
                    <img 
                      src={item.images[0]} 
                      alt="" 
                      className="w-full h-full object-cover" 
                    />
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                      isComplete ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'
                    }`}>
                      {completionPercentage}%
                    </div>
                    {item.images.length > 1 && (
                      <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                        {item.images.length} photos
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.itemName || "Untitled Item"}
                      </h3>
                      <p className="text-orange-600 font-bold">
                        {item.price ? `$${item.price}` : "No price"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.condition ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.condition || "No condition"}
                      </span>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setCurrentItemIndex(index);
                          setStep("item-details");
                        }}
                        className="text-xs bg-orange-600 text-white px-3 py-1 rounded-full hover:bg-orange-700 transition-colors"
                      >
                        {isComplete ? "View" : "Complete"}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 space-y-4"
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {allItemsComplete ? "🎉 All Items Complete!" : "⚠️ Some Items Need Attention"}
              </h3>
              <p className="text-gray-600">
                {allItemsComplete 
                  ? "Your items are ready for description generation"
                  : `Complete ${items.length - completedItems.length} more item${items.length - completedItems.length !== 1 ? 's' : ''} to continue`
                }
              </p>
            </div>

            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("items")}
                className="flex-1 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors"
              >
                Edit Items
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep("description")}
                disabled={!allItemsComplete}
                className={`flex-1 py-3 font-semibold rounded-xl transition-colors ${
                  allItemsComplete
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {allItemsComplete ? "Generate Descriptions" : "Complete All Items First"}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===============================
  // ITEM DETAILS SCREEN
  // ===============================
  if (step === "item-details") {
    const currentItem = items[currentItemIndex];
    if (!currentItem) return null;
 
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Item Details", () => setStep("summary"))}
 
        <div className="max-w-2xl mx-auto px-4 py-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${currentItemIndex}-${currentPhotoIndex}`}
                  src={currentItem.images[currentPhotoIndex]}
                  alt="Item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {currentItem.images.length > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prevPhoto}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
                </>
              )}
 
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {currentItem.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
 
              <div className="absolute top-4 right-4 flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => startCamera("add-to-item", currentItemIndex)}
                  className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Plus size={18} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => triggerAddPhotosUpload(currentItemIndex)}
                  className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  <Image size={18} />
                </motion.button>
                
                {currentItem.images.length > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removePhotoFromItem(currentItemIndex, currentPhotoIndex)}
                    className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Trash2 size={18} />
                  </motion.button>
                )}
              </div>
 
              <div className="absolute top-4 left-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                {currentPhotoIndex + 1} / {currentItem.images.length}
              </div>
            </div>
 
            {currentItem.images.length > 1 && (
              <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
                {currentItem.images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setCurrentPhotoIndex(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === currentPhotoIndex ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
 
          {items.length > 1 && (
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={prevItem}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft size={20} className="mr-1" />
                Previous
              </motion.button>
              
              <span className="text-sm text-gray-600">
                Item {currentItemIndex + 1} of {items.length}
              </span>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextItem}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Next
                <ChevronRight size={20} className="ml-1" />
              </motion.button>
            </div>
          )}
 
          <motion.div 
            key={currentItemIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
          >
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <DollarSign size={20} className="mr-2 text-orange-600" />
                Price *
              </label>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateItemData(currentItemIndex, 'priceType', 'fixed')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      currentItem.priceType === 'fixed'
                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    Fixed Price
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => updateItemData(currentItemIndex, 'priceType', 'negotiable')}
                    className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                      currentItem.priceType === 'negotiable'
                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    Negotiable
                  </motion.button>
                </div>
 
                {currentItem.priceType === 'fixed' ? (
                  <input
                    type="number"
                    placeholder="Enter price"
                    value={currentItem.price || ""}
                    onChange={(e) => updateItemData(currentItemIndex, 'price', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asking Price *
                      </label>
                      <input
                        type="number"
                        placeholder="e.g., 500"
                        value={currentItem.price || ""}
                        onChange={(e) => updateItemData(currentItemIndex, 'price', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Price *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 400"
                          value={currentItem.minPrice || ""}
                          onChange={(e) => updateItemData(currentItemIndex, 'minPrice', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Max Price *
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 600"
                          value={currentItem.maxPrice || ""}
                          onChange={(e) => updateItemData(currentItemIndex, 'maxPrice', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    {currentItem.price && currentItem.minPrice && currentItem.maxPrice && !validatePriceRange(currentItem) && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle size={16} />
                        <span>
                          Asking price must be between min and max price, and min must be less than max
                        </span>
                      </div>
                    )}
                    
                    {currentItem.price && currentItem.minPrice && currentItem.maxPrice && validatePriceRange(currentItem) && (
                      <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <Check size={16} />
                        <span>
                          Price range looks good: ${currentItem.minPrice} - ${currentItem.maxPrice}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
 
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <Package size={20} className="mr-2 text-orange-600" />
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g., IKEA Malm Desk"
                value={currentItem.itemName || ""}
                onChange={(e) => updateItemData(currentItemIndex, 'itemName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
 
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
                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    {condition}
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
    <Package size={20} className="mr-2 text-orange-600" />
    Category *
  </label>
  <select
    value={currentItem.category || ""}
    onChange={(e) => updateItemData(currentItemIndex, 'category', e.target.value)}
    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
  >
    <option value="">Select a category</option>
    <option value="Furniture">Furniture</option>
    <option value="Electronics">Electronics</option>
    <option value="Books">Books</option>
    <option value="Textbooks">Textbooks</option>
    <option value="Clothing">Clothing</option>
    <option value="Kitchen">Kitchen</option>
    <option value="Decor">Decor</option>
    <option value="Sports">Sports</option>
    <option value="Appliances">Appliances</option>
    <option value="General">General</option>
  </select>
</div>

 
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <MapPin size={20} className="mr-2 text-orange-600" />
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
 
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <Truck size={20} className="mr-2 text-orange-600" />
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
                        ? "bg-orange-500 text-white border-orange-500 shadow-md"
                        : "bg-white text-gray-700 border-gray-300 hover:border-orange-300"
                    }`}
                  >
                    {option.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
 
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep("summary")}
            className="w-full mt-6 py-4 bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg"
          >
            Back to Summary
          </motion.button>
 
          {/* Hidden input for adding photos to existing items in item details */}
          <input
            ref={addPhotosInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              const itemIndex = parseInt(e.target.dataset.itemIndex);
              handleAddPhotosToItem(e, itemIndex);
            }}
            className="hidden"
          />
        </div>
      </div>
    );
  }
 
  // ===============================
  // DESCRIPTION SCREEN
  // ===============================
 // ===============================
// DESCRIPTION SCREEN
// ===============================

if (step === "description") {
  // Mode selection screen
  if (descriptionMode === "choose") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Create Descriptions", () => setStep("summary"))}

        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                ✍️ How would you like to create your descriptions?
              </h1>
              <p className="text-gray-600 text-lg">
                Choose your preferred method for writing item descriptions
              </p>
            </div>

            <div className="space-y-6">
              {/* AI Generation Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDescriptionMode("ai")}
                className="w-full p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Sparkles size={32} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-2">🤖 AI-Powered Descriptions</h3>
                    <p className="text-orange-100">
                      Let our smart AI create compelling descriptions based on your item details. 
                      You can edit and customize them afterwards.
                    </p>
                  </div>
                  <div className="text-white/80">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.button>

              {/* Manual Writing Option */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setDescriptionMode("manual");
                  // Initialize manual descriptions array
                  setManualDescriptions(items.map(() => ""));
                }}
                className="w-full p-6 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <Package size={32} />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xl font-bold mb-2">✏️ Write Your Own</h3>
                    <p className="text-gray-100">
                      Craft your own unique descriptions from scratch. 
                      Perfect for when you want complete creative control.
                    </p>
                  </div>
                  <div className="text-white/80">
                    <ChevronRight size={24} />
                  </div>
                </div>
              </motion.button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                💡 You can always switch between methods or edit descriptions later
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }
// ADD THIS FUNCTION BEFORE THE RETURN STATEMENT
const submitListings = async () => {
  try {
    setIsSubmitting(true);
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const descriptions = descriptionMode === 'ai' ? generatedDescriptions : manualDescriptions;
      
      // Upload images to Firebase Storage
      const imageUrls = [];
      for (let j = 0; j < item.images.length; j++) {
        try {
          // Convert data URL to blob
          const response = await fetch(item.images[j]);
          const imageBlob = await response.blob();
          
          // Create unique filename
          const timestamp = Date.now();
          const imageRef = ref(storage, `saleItems/${user.uid}/${timestamp}_${j}.jpg`);
          
          // Upload to Firebase Storage
          await uploadBytes(imageRef, imageBlob);
          const downloadURL = await getDownloadURL(imageRef);
          imageUrls.push(downloadURL);
        } catch (imageError) {
          console.error(`Error uploading image ${j} for item ${i}:`, imageError);
          throw imageError;
        }
      }
      
    
      // Create listing document
      const listingData = {
        hostId: user.uid,
        name: item.itemName,
        description: descriptions[i] || '',
        shortDescription: descriptions[i]?.substring(0, 100) + '...' || '',
        price: parseFloat(item.price),
        originalPrice: Math.round(parseFloat(item.price) * 1.2), // 20% markup for original price
        priceType: item.priceType,
        ...(item.priceType === 'negotiable' && {
          minPrice: parseFloat(item.minPrice),
          maxPrice: parseFloat(item.maxPrice)
        }),
        category: item.category,
        condition: item.condition,
        location: item.location.toLowerCase().replace(/\s+/g, '-'),
        deliveryAvailable: item.delivery === 'delivery' || item.delivery === 'both',
        pickupAvailable: item.delivery === 'pickup' || item.delivery === 'both',
        image: imageUrls[0], // Main image
        images: imageUrls,
        additionalImages: imageUrls.slice(1), // Additional images
        views: 0,
        sellerRating: 4.5, // Default rating - you can update this later
        seller: user.displayName || user.email?.split('@')[0] || 'Seller',
        sellerEmail: user.email,
        sellerPhoto: user.photoURL,
        sellerID: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        availableUntil: "2025-12-31" // You can add a date picker for this later
      };
      
      // Add to Firestore
      await addDoc(collection(db, 'saleItems'), listingData);
    }
    
    // Success - redirect to browse page
    alert(`Successfully created ${items.length} listing${items.length > 1 ? 's' : ''}!`);
    router.push('/sale/browse');
    
  } catch (error) {
    console.error('Error creating listings:', error);
    alert('Error creating listings. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  // AI Generation Mode
if (descriptionMode === "ai") {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {renderHeader("AI Smart Descriptions", () => setDescriptionMode("choose"))}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              🤖 AI Description Generator
            </h2>
            <p className="text-gray-600">
              Generate smart descriptions and edit them to your liking
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Description Generation */}
          <div className="space-y-6">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex gap-4 mb-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    {item.images.length > 1 && (
                      <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.images.length}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {item.itemName}
                    </h3>
                    <p className="text-gray-600">
                      {item.priceType === 'fixed' 
                        ? `$${item.price}` 
                        : `$${item.minPrice}-${item.maxPrice} (asking $${item.price})`
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.condition} • {item.images.length} photo{item.images.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h4 className="flex items-center text-lg font-semibold text-gray-900">
                    <Sparkles size={20} className="mr-2 text-orange-600" />
                    Smart Description
                  </h4>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => generateDescription(index)}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors"
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

                <AnimatePresence>
                  {generatedDescriptions[index] ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div className="mb-3">
                        <textarea
                          value={generatedDescriptions[index]}
                          onChange={(e) => {
                            const newDescriptions = [...generatedDescriptions];
                            newDescriptions[index] = e.target.value;
                            setGeneratedDescriptions(newDescriptions);
                          }}
                          className="w-full p-3 text-gray-700 bg-white border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          rows={4}
                          placeholder="AI-generated description will appear here. You can edit it as needed..."
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
                        Click "Generate" to create a smart AI description for your item
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>

          {/* Right Column - Item Details Summary */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Package size={20} className="mr-2 text-orange-600" />
                Item Details Summary
              </h3>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-3 mb-3">
                      <img 
                        src={item.images[0]} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {item.itemName}
                        </h4>
                        <p className="text-sm text-orange-600 font-medium">
                          {formatPriceDisplay(item)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Condition:</span>
                        <span className="text-gray-900">{item.condition}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-900 truncate ml-2">{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Delivery:</span>
                        <span className="text-gray-900">{getDeliveryInfo(item.delivery).text}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Photos:</span>
                        <span className="text-gray-900">{item.images.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Description:</span>
                        <span className={`text-sm ${generatedDescriptions[index] ? 'text-green-600' : 'text-red-500'}`}>
                          {generatedDescriptions[index] ? '✓ Generated' : '✗ Not generated'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900">Progress Summary</h4>
                  <p className="text-sm text-gray-600">
                    {generatedDescriptions.filter(desc => desc).length} of {items.length} descriptions ready
                  </p>
                </div>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDescriptionMode("choose")}
                    className="w-full py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Change Method
                  </motion.button>

                  <motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={submitListings}
  disabled={generatedDescriptions.some(desc => !desc) || isSubmitting}
  className={`w-full py-2 font-medium rounded-lg transition-colors ${
    generatedDescriptions.every(desc => desc) && !isSubmitting
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  {isSubmitting ? (
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      Creating Listings...
    </div>
  ) : generatedDescriptions.every(desc => desc) ? (
    <div className="flex items-center justify-center">
      <CheckCircle size={16} className="mr-2" />
      List All Items ({items.length})
    </div>
  ) : (
    `Generate ${generatedDescriptions.filter(desc => !desc).length} more`
  )}
</motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );


  
}

// Manual Writing Mode
if (descriptionMode === "manual") {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {renderHeader("Write Descriptions", () => setDescriptionMode("choose"))}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ✏️ Write Your Own Descriptions
            </h2>
            <p className="text-gray-600">
              Craft unique descriptions that showcase your items perfectly
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Manual Description Writing */}
          <div className="space-y-6">
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl shadow-lg p-6"
              >
                <div className="flex gap-4 mb-4">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                    {item.images.length > 1 && (
                      <div className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {item.images.length}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {item.itemName}
                    </h3>
                    <p className="text-gray-600">
                      {item.priceType === 'fixed' 
                        ? `$${item.price}` 
                        : `$${item.minPrice}-${item.maxPrice} (asking $${item.price})`
                      }
                    </p>
                    <p className="text-sm text-gray-500">
                      {item.condition} • {item.images.length} photo{item.images.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                    <Package size={20} className="mr-2 text-orange-600" />
                    Description
                  </label>
                  <textarea
                    value={manualDescriptions[index] || ""}
                    onChange={(e) => {
                      const newDescriptions = [...manualDescriptions];
                      newDescriptions[index] = e.target.value;
                      setManualDescriptions(newDescriptions);
                    }}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    rows={5}
                    placeholder={`Write a compelling description for your ${item.itemName}. Highlight its best features, condition, and why someone should buy it...`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm">
                    {manualDescriptions[index] && manualDescriptions[index].length > 0 ? (
                      <div className="text-green-600">
                        <Check size={16} className="mr-1 inline" />
                        Description ready
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <AlertCircle size={16} className="mr-1 inline" />
                        Description needed
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {manualDescriptions[index]?.length || 0} characters
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column - Item Details Summary */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Package size={20} className="mr-2 text-orange-600" />
                Item Details Summary
              </h3>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-3 mb-3">
                      <img 
                        src={item.images[0]} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0" 
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {item.itemName}
                        </h4>
                        <p className="text-sm text-orange-600 font-medium">
                          {formatPriceDisplay(item)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Condition:</span>
                        <span className="text-gray-900">{item.condition}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Location:</span>
                        <span className="text-gray-900 truncate ml-2">{item.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Delivery:</span>
                        <span className="text-gray-900">{getDeliveryInfo(item.delivery).text}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Photos:</span>
                        <span className="text-gray-900">{item.images.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Description:</span>
                        <span className={`text-sm ${manualDescriptions[index] && manualDescriptions[index].trim() ? 'text-green-600' : 'text-red-500'}`}>
                          {manualDescriptions[index] && manualDescriptions[index].trim() ? '✓ Written' : '✗ Not written'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center mb-4">
                  <h4 className="font-semibold text-gray-900">Progress Summary</h4>
                  <p className="text-sm text-gray-600">
                    {manualDescriptions.filter(desc => desc && desc.trim()).length} of {items.length} descriptions written
                  </p>
                </div>
                
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDescriptionMode("choose")}
                    className="w-full py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Change Method
                  </motion.button>

                  <motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  onClick={submitListings}
  disabled={manualDescriptions.some(desc => !desc || !desc.trim()) || isSubmitting}
  className={`w-full py-2 font-medium rounded-lg transition-colors ${
    manualDescriptions.every(desc => desc && desc.trim()) && !isSubmitting
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
  }`}
>
  {isSubmitting ? (
    <div className="flex items-center justify-center">
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
      Creating Listings...
    </div>
  ) : manualDescriptions.every(desc => desc && desc.trim()) ? (
    <div className="flex items-center justify-center">
      <CheckCircle size={16} className="mr-2" />
      List All Items ({items.length})
    </div>
  ) : (
    `Write ${manualDescriptions.filter(desc => !desc || !desc.trim()).length} more`
  )}
</motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

}


  return null;
}