"use client"

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Camera, 
  Upload, 
  X, 
  DollarSign, 
  Package, 
  MapPin, 
  Truck, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Image as ImageIcon
} from "lucide-react";
import LocationPicker from '../../../components/LocationPicker';

interface ItemData {
  price: string;
  priceType: "fixed" | "obo";
  itemName: string;
  condition: string;
  location: string;
  delivery: string;
}

export default function ItemListingPage() {
  const [step, setStep] = useState<"upload" | "details" | "description">("upload");
  const [images, setImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [itemsData, setItemsData] = useState<ItemData[]>([]);
  const [generatedDescriptions, setGeneratedDescriptions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number, address: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setImages(prev => {
              const newImages = [...prev, e.target!.result as string];
              // Initialize data for new image
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
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Use back camera on mobile
        } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      // Set video source after component updates
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Camera access denied or not available. Please check your permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0);
        
        // Convert to data URL
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        // Add to images
        setImages(prev => {
          const newImages = [...prev, dataURL];
          // Initialize data for new image
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
        
        // Stop camera
        stopCamera();
      }
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setItemsData(prev => prev.filter((_, i) => i !== index));
    setGeneratedDescriptions(prev => prev.filter((_, i) => i !== index));
    if (currentImageIndex >= images.length - 1) {
      setCurrentImageIndex(Math.max(0, images.length - 2));
    }
  };

  const updateItemData = (index: number, field: keyof ItemData, value: string) => {
    setItemsData(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const generateDescription = async (index: number) => {
    const item = itemsData[index];
    if (!item.itemName || !item.condition || !item.price) return;
    
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/process-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'generate',
          itemData: {
            itemName: item.itemName,
            condition: item.condition,
            price: item.price,
            priceType: item.priceType,
            delivery: item.delivery,
            location: item.location
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate description');
      }

      const data = await response.json();
      
      setGeneratedDescriptions(prev => 
        prev.map((desc, i) => i === index ? data.description : desc)
      );
    } catch (error) {
      console.error('Error generating description:', error);
      // Fallback to local generation if API fails
      const fallbackDescriptions = [
        `${item.itemName} in ${item.condition.toLowerCase()} condition - ${item.price} ${item.priceType === 'obo' ? 'OBO' : ''}, ${item.delivery === 'pickup' ? 'pickup only' : 'delivery available'}!`,
        `Great ${item.condition.toLowerCase()} ${item.itemName} for ${item.price}${item.priceType === 'obo' ? ' OBO' : ''} - perfect for students!`,
        `Selling my ${item.itemName} (${item.condition.toLowerCase()}) for ${item.price}${item.priceType === 'obo' ? ' or best offer' : ''}. ${item.delivery === 'pickup' ? 'Pickup only' : 'Can deliver'}.`
      ];
      const fallbackDescription = fallbackDescriptions[Math.floor(Math.random() * fallbackDescriptions.length)];
      setGeneratedDescriptions(prev => 
        prev.map((desc, i) => i === index ? fallbackDescription : desc)
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const canProceedToDetails = images.length > 0;
  const canProceedToDescription = itemsData.length > 0 && itemsData.every((item, index) => {
    console.log(`Checking item ${index}:`, item);
    return item && 
           typeof item.price === 'string' && item.price.trim() !== '' && 
           typeof item.itemName === 'string' && item.itemName.trim() !== '' && 
           typeof item.condition === 'string' && item.condition.trim() !== '' &&
           typeof item.location === 'string' && item.location.trim() !== '';
  });

  // Add this for debugging
  console.log('itemsData:', itemsData);
  console.log('canProceedToDescription:', canProceedToDescription);

  // Upload Step
  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {/* Header */}
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
                  <span className="text-xl font-bold text-gray-900">Add Photos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

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
                        <ImageIcon size={24} className="mr-3" />
                        Choose Photos
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
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
                    <Camera size={24} className="text-gray-400 mb-2" />
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
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        </div>
      </div>
    );
  }

  // Camera Modal
  if (showCamera) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Camera Header */}
        <div className="bg-black/80 text-white p-4 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopCamera}
            className="flex items-center px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={24} />
          </motion.button>
          <span className="text-lg font-semibold">Take Photo</span>
          <div className="w-12"></div>
        </div>

        {/* Camera View */}
        <div className="flex-1 relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          
          {/* Camera Controls */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopCamera}
              className="w-12 h-12 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center"
            >
              <X size={24} />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={capturePhoto}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center">
                <Camera size={32} className="text-white" />
              </div>
            </motion.button>
            
            <div className="w-12 h-12"></div>
          </div>
        </div>
      </div>
    );
  }

  // Details Step
  if (step === "details") {
    const currentItem = itemsData[currentImageIndex] || {};
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStep("upload")}
                  className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft size={20} className="text-gray-600" />
                </motion.button>
                <div className="flex items-center space-x-2">
                  <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none">
                    <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                    <rect x="20" y="20" width="10" height="10" fill="white" />
                  </svg>
                  <span className="text-xl font-bold text-gray-900">Item Details</span>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {currentImageIndex + 1} of {images.length}
              </div>
            </div>
          </div>
        </div>

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
            {/* Price */}
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

            {/* Item Name */}
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

            {/* Condition */}
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

            {/* Location with Google Maps */}
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

            {/* Pickup/Delivery */}
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
            onClick={() => {
              console.log('Button clicked - Current data:', itemsData);
              console.log('Current item data:', itemsData[currentImageIndex]);
              console.log('Can proceed?', canProceedToDescription);
              setStep("description"); // Force proceed for now to test
            }}
            className={`w-full mt-6 py-4 text-white text-lg font-semibold rounded-xl transition-colors shadow-lg ${
              canProceedToDescription 
                ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer' 
                : 'bg-gray-400 hover:bg-gray-500 cursor-pointer'
            }`}
          >
            Generate Descriptions
            {!canProceedToDescription && (
              <span className="block text-sm mt-1">
                Complete all required fields (*) - Debug Mode
              </span>
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // Description Step
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep("details")}
                className="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </motion.button>
              <div className="flex items-center space-x-2">
                <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none">
                  <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                  <rect x="20" y="20" width="10" height="10" fill="white" />
                </svg>
                <span className="text-xl font-bold text-gray-900">Smart Descriptions</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {images.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex gap-4 mb-4">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                <img src={image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{itemsData[index]?.itemName}</h3>
                <p className="text-gray-600">${itemsData[index]?.price} {itemsData[index]?.priceType === 'obo' ? 'OBO' : ''}</p>
                <p className="text-sm text-gray-500">{itemsData[index]?.condition}</p>
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
                {isGenerating ? "Generating..." : generatedDescriptions[index] ? "Regenerate" : "Generate"}
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
                  <p className="text-gray-700">{generatedDescriptions[index]}</p>
                  <div className="flex items-center mt-2 text-sm text-green-600">
                    <Check size={16} className="mr-1" />
                    Ready to post
                  </div>
                </motion.div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-500 text-sm">Click "Generate" to create a description</p>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={generatedDescriptions.some(desc => !desc)}
          className="w-full py-4 bg-orange-600 text-white text-lg font-semibold rounded-xl disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors shadow-lg"
        >
          List All Items ({images.length})
        </motion.button>
      </div>
    </div>
  );
}