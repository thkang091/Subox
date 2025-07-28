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
  Bell,
  MessagesSquare,
  User,
  Menu
} from "lucide-react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Component imports
import LocationPicker from '../../../../../components/LocationPicker';
import { notification } from "@/data/notificationlistings";

// ===============================
// TYPES AND INTERFACES
// ===============================

interface ItemData {
  price: string;
  priceType: "fixed" | "obo";
  itemName: string;
  condition: string;
  location: string;
  delivery: string;
}

type AppStep = "upload" | "camera" | "photo-preview" | "details" | "description";

// ===============================
// MAIN COMPONENT
// ===============================

export default function ItemListingPage() {
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  // Core app state
  const [step, setStep] = useState<AppStep>("upload");
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [itemsData, setItemsData] = useState<ItemData[]>([]);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Camera specific state
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
  // PROFILE AND MENU
  // ===============================
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
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

  const handleTabClick = (tab) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  const profileButton = () => { 
    return (  
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
    </div>);
  };

  const menuButton = () => {
    return (
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
    );

  };

  const logoB = () => {
    return (
      <motion.div 
          className="flex items-center space-x-7 relative"
          whileHover={{ scale: 1.05 }}
          onClick={() => router.push("/find")}
      >
      <motion.div className="relative w-12 h-12">
        <motion.svg 
            className="w-12 h-12" 
            viewBox="0 0 100 100" 
            fill="none"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
        >

            <motion.path
            d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
            fill="#E97451"
            animate={{ 
                fill: ["#E97451", "#F59E0B", "#E97451"],
                scale: [1, 1.02, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            />

            <motion.path
            d="M15 50L50 20L85 50L50 15L15 50Z"
            fill="#D97706"
            animate={{ rotate: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            />

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
      </motion.div>
    );
  };



  // ===============================
  // NOTIFICATIONS
  // ===============================
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
                      onClick={() => router.push(`/sale/browse/notification?id=${notif.id}`)}
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
                  onClick={() => router.push(`/sale/browse/notification/`)}
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

  
  // ===============================
  // REFS
  // ===============================
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    setStep("upload");
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

      // Get actual video dimensions
      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 720;
      
      // Calculate the square size and position to match the overlay
      // The overlay uses min(100vw, 100vh - 160px) for size
      const viewportSize = Math.min(window.innerWidth, window.innerHeight - 160);
      
      // Calculate what portion of the video this represents
      const videoAspectRatio = videoWidth / videoHeight;
      const screenAspectRatio = window.innerWidth / window.innerHeight;
      
      let cropSize, cropX, cropY;
      
      if (videoAspectRatio > screenAspectRatio) {
        // Video is wider than screen - crop from sides
        const scaledHeight = videoHeight;
        const scaledWidth = scaledHeight * screenAspectRatio;
        cropSize = Math.min(scaledWidth, scaledHeight);
        cropX = (videoWidth - cropSize) / 2;
        cropY = (videoHeight - cropSize) / 2;
      } else {
        // Video is taller than screen - crop from top/bottom
        const scaledWidth = videoWidth;
        const scaledHeight = scaledWidth / screenAspectRatio;
        cropSize = Math.min(scaledWidth, scaledHeight);
        cropX = (videoWidth - cropSize) / 2;
        cropY = (videoHeight - cropSize) / 2;
      }

      // Ensure we're getting a square
      const finalCropSize = Math.min(cropSize, cropSize);
      cropX = (videoWidth - finalCropSize) / 2;
      cropY = (videoHeight - finalCropSize) / 2;

      // Set canvas to square dimensions (high quality)
      const outputSize = 800; // High quality square output
      canvas.width = outputSize;
      canvas.height = outputSize;
      
      // Draw the exact square that matches the overlay
      ctx.drawImage(
        video,
        cropX, cropY, finalCropSize, finalCropSize, // Source: exact square from video
        0, 0, outputSize, outputSize              // Destination: full canvas
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

    setImages(prev => {
      const newImages = [...prev, capturedPhoto];
      
      setItemsData(prevData => [
        ...prevData,
        {
          price: "",
          priceType: "fixed",
          itemName: "",
          condition: "",
          location: selectedLocation?.address || "Dinkytown",
          delivery: "pickup"
        }
      ]);
      
      setGeneratedDescriptions(prevDesc => [...prevDesc, ""]);
      return newImages;
    });
    
    setCapturedPhoto(null);
    setStep("upload");
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  // ===============================
  // IMAGE MANAGEMENT FUNCTIONS
  // ===============================

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImages(prev => {
            const newImages = [...prev, e.target!.result as string];
            
            setItemsData(prevData => [
              ...prevData,
              {
                price: "",
                priceType: "fixed",
                itemName: "",
                condition: "",
                location: selectedLocation?.address || "Dinkytown",
                delivery: "pickup"
              }
            ]);
            
            setGeneratedDescriptions(prevDesc => [...prevDesc, ""]);
            return newImages;
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setItemsData(prev => prev.filter((_, i) => i !== index));
    setGeneratedDescriptions(prev => prev.filter((_, i) => i !== index));
    
    if (currentImageIndex >= images.length - 1) {
      setCurrentImageIndex(Math.max(0, images.length - 2));
    }
  };

  // ===============================
  // NAVIGATION FUNCTIONS
  // ===============================

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
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

  const generateDescription = async (index: number) => {
    const item = itemsData[index];
    if (!item.itemName || !item.condition || !item.price) return;
    
    setIsGenerating(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const fallbackDescriptions = [
        `${item.itemName} in ${item.condition.toLowerCase()} condition - $${item.price} ${item.priceType === 'obo' ? 'OBO' : ''}, ${item.delivery === 'pickup' ? 'pickup only' : 'delivery available'}!`,
        `Great ${item.condition.toLowerCase()} ${item.itemName} for $${item.price}${item.priceType === 'obo' ? ' OBO' : ''} - perfect for students!`,
        `Selling my ${item.itemName} (${item.condition.toLowerCase()}) for $${item.price}${item.priceType === 'obo' ? ' or best offer' : ''}. ${item.delivery === 'pickup' ? 'Pickup only' : 'Can deliver'}.`
      ];
      
      const fallbackDescription = fallbackDescriptions[Math.floor(Math.random() * fallbackDescriptions.length)];
      
      setGeneratedDescriptions(prev => 
        prev.map((desc, i) => i === index ? fallbackDescription : desc)
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

  const canProceedToDetails = images.length > 0;

  const canProceedToDescription = itemsData.length > 0 && itemsData.every((item) => {
    return (
      item && 
      typeof item.price === 'string' && item.price.trim() !== '' && 
      typeof item.itemName === 'string' && item.itemName.trim() !== '' && 
      typeof item.condition === 'string' && item.condition.trim() !== '' &&
      typeof item.location === 'string' && item.location.trim() !== ''
    );
  });

  // ===============================
  // SHARED UI COMPONENTS
  // ===============================

  const renderHeader = (title: string, onBack?: () => void) => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <div className="flex items-center space-x-3 mt-1 mx-25">
            {logoB()}
            <span className="text-xl font-bold text-gray-900">{title}</span>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {onBack ? onBack() : (router.push("/find"))}}
              className="flex items-center px-3 py-2 rounded-lg hover:bg-orange-600 text-black hover:text-white transition-colors"
            >
              <ArrowLeft size={20} /> Back
            </motion.button>
            <NotificationsButton notifications={notification} />
            <MessagesSquare className="p-2 bg-orange-500 rounded-lg text-white hover:bg-orange-600 hover:scale-105 transition-colors h-9 w-9" />
            {profileButton()}
            {menuButton()}
          </div>
        </div>
          
          {step === "details" && (
            <div className="text-sm text-gray-500">
              {currentImageIndex + 1} of {images.length}
            </div>
          )}
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
          setStep("upload");
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
                onClick={startCamera}
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
        {renderHeader("Photo Preview", () => setStep("upload"))}
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              How does this look?
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
                Use Photo
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
        {/* Camera Header */}
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
            <span className="text-lg font-semibold">Take Photo</span>
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

        {/* Camera View Container */}
        <div className="flex-1 relative overflow-hidden bg-black">
          {/* Video Element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: 'scaleX(-1)' }}
          />
          
          {/* Camera Loading Overlay */}
          {!cameraReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="w-12 h-12 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-lg font-medium">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Accurate Square Capture Frame Overlay */}
          {cameraReady && showCaptureFrame && (
            <div className="absolute inset-0 pointer-events-none z-20">
              {/* Calculate and show exact crop area */}
              <div 
                className="absolute bg-black/50"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              >
                {/* This will be calculated to match the actual video dimensions */}
                <div 
                  className="absolute border-2 border-white bg-transparent"
                  style={{
                    // Position the square based on video aspect ratio
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 'min(100vw, 100vh - 160px)', // Account for header/controls
                    height: 'min(100vw, 100vh - 160px)',
                    aspectRatio: '1/1'
                  }}
                >
                  {/* Corner indicators */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-orange-500" />
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-orange-500" />
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-orange-500" />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-orange-500" />
                  
                  {/* Center cross for better alignment */}
                  <div className="absolute top-1/2 left-1/2 w-4 h-0.5 bg-white/60 -translate-x-1/2 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-white/60 -translate-x-1/2 -translate-y-1/2" />
                </div>
                
                {/* Mask out the square area to create the overlay effect */}
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
                
                {/* Frame instruction */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-center z-30">
                  <p className="text-white/90 text-sm font-medium bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
                    📸 This exact square will be captured
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Grid overlay (optional) */}
          {cameraReady && showCaptureFrame && (
            <div className="absolute inset-0 pointer-events-none z-15">
              <div className="w-full h-full flex items-center justify-center">
                <div 
                  className="grid grid-cols-3 grid-rows-3 opacity-20"
                  style={{
                    width: 'min(90vw, 90vh)',
                    height: 'min(90vw, 90vh)',
                    maxWidth: '400px',
                    maxHeight: '400px'
                  }}
                >
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white/40" />
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Camera Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent safe-area-bottom">
            <div className="flex items-center justify-center space-x-12">
              {/* Cancel Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopCamera}
                className="w-14 h-14 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center border border-white/30"
              >
                <X size={24} />
              </motion.button>
              
              {/* Capture Button */}
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
              
              {/* Frame Toggle Button */}
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
            
            {/* Instructions */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: cameraReady ? 1 : 0, y: cameraReady ? 0 : 20 }}
              className="text-center mt-4"
            >
              <p className="text-white/90 text-sm font-medium">
                {showCaptureFrame 
                  ? "Position your item in the square frame" 
                  : "Tap the focus button to show capture frame"
                }
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

            {images.length === 0 ? (
              // Empty State
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
                        onClick={startCamera}
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
              // Images Grid
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-square rounded-xl overflow-hidden group"
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ))}
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <Image size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add More</span>
                  </button>
                  
                  <button
                    onClick={startCamera}
                    className="aspect-square border-2 border-dashed border-orange-400 rounded-xl flex flex-col items-center justify-center hover:border-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    <Camera size={24} className="text-orange-500 mb-2" />
                    <span className="text-sm text-orange-600">Take Photo</span>
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("details")}
                  disabled={!canProceedToDetails}
                  className="w-full py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors shadow-lg"
                >
                  Continue to Details ({images.length} {images.length === 1 ? 'item' : 'items'})
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
  // DETAILS SCREEN
  // ===============================

  if (step === "details") {
    const currentItem = itemsData[currentImageIndex] || {};
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Item Details", () => setStep("upload"))}

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Image Carousel */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-6"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-lg">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentImageIndex}
                  src={images[currentImageIndex]}
                  alt="Item"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              
              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronLeft size={24} />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronRight size={24} />
                  </motion.button>
                </>
              )}

              {/* Image Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Form for Current Item */}
          <motion.div 
            key={currentImageIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
          >
            {/* Price Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <DollarSign size={20} className="mr-2 text-orange-600" />
                Price *
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Enter price"
                  value={currentItem.price || ""}
                  onChange={(e) => updateItemData(currentImageIndex, 'price', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <select
                  value={currentItem.priceType || "fixed"}
                  onChange={(e) => updateItemData(currentImageIndex, 'priceType', e.target.value as "fixed" | "obo")}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="fixed">Fixed</option>
                  <option value="obo">OBO</option>
                </select>
              </div>
            </div>

            {/* Item Name Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <Package size={20} className="mr-2 text-orange-600" />
                Item Name *
              </label>
              <input
                type="text"
                placeholder="e.g., IKEA Malm Desk"
                value={currentItem.itemName || ""}
                onChange={(e) => updateItemData(currentImageIndex, 'itemName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    onClick={() => updateItemData(currentImageIndex, 'condition', condition)}
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

            {/* Location Section */}
            <div>
              <label className="flex items-center text-lg font-semibold text-gray-900 mb-3">
                <MapPin size={20} className="mr-2 text-orange-600" />
                Location *
              </label>
              <LocationPicker
                initialValue={currentItem.location}
                onLocationSelect={(location) => {
                  updateItemData(currentImageIndex, 'location', location.address);
                  setSelectedLocation(location);
                }}
              />
            </div>

            {/* Pickup/Delivery Section */}
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
                    onClick={() => updateItemData(currentImageIndex, 'delivery', option.value)}
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

          {/* Continue Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStep("description")}
            className={`w-full mt-6 py-4 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg ${
              canProceedToDescription 
                ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer' 
                : 'bg-orange-500 hover:bg-orange-600 cursor-pointer'
            }`}
          >
            Generate Descriptions
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

  // ===============================
  // DESCRIPTION SCREEN
  // ===============================

  if (step === "description") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {renderHeader("Smart Descriptions", () => setStep("details"))}

        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              {/* Item Header */}
              <div className="flex gap-4 mb-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {itemsData[index]?.itemName}
                  </h3>
                  <p className="text-gray-600">
                    ${itemsData[index]?.price} {itemsData[index]?.priceType === 'obo' ? 'OBO' : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {itemsData[index]?.condition}
                  </p>
                </div>
              </div>

              {/* Description Generator Header */}
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

              {/* Description Content */}
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
                      Click "Generate" to create a smart description for your item
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {/* Final Submit Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Ready to List Your Items?
              </h3>
              <p className="text-gray-600">
                {generatedDescriptions.filter(desc => desc).length} of {images.length} descriptions ready
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={generatedDescriptions.some(desc => !desc)}
              className={`w-full py-4 text-lg font-semibold rounded-xl transition-colors shadow-lg ${
                generatedDescriptions.every(desc => desc)
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {generatedDescriptions.every(desc => desc) ? (
                <div className="flex items-center justify-center">
                  <CheckCircle size={24} className="mr-2" />
                  List All Items ({images.length})
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

  // ===============================
  // FALLBACK RENDER
  // ===============================

  return null;
}