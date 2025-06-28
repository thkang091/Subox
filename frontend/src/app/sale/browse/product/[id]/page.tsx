'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
// import { doc, getDoc } from 'firebase/firestore';
// import { db } from '@/lib/firebase';
import { MapPin, Heart, User, Package, Search, ShoppingCart, Bell, X, ArrowLeft, ArrowRight,
        ChevronLeft, Plus, Flag, MessageCircle
} from 'lucide-react';
import { products } from '../../../../../data/saleListings';

const ProductDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [favorites, setFavorites] = useState(new Set());
  const [cart, setCart] = useState(new Map());
  const [product, setProduct] = useState<any>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [scamDetails, setScamDetails] = useState("");
  const [informationDetails, setInformationDetails] = useState("");
  const [matchDetails, setMatchDetails] = useState<string[]>([]);
  const [priceDetails, setPriceDetails] = useState("");
  const [offensiveDetails, setOffensiveDetails] = useState("");
  const [unsafeDetails, setUnsafeDetails] = useState("");
  const [sellerProblem, setSellerProblem] = useState("");
  const [details, setDetails] = useState("");
  const [seller, setSeller] = useState<any>({
    ID : "none",
    name: "seller",
    email: "seller@example.com",
    photoURL: null
  });

  const notifications = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" }
  ];

  useEffect(() => {
    setIsMounted(true);
    }, []);
    
    useEffect(() => {
        if (isMounted) {
            try {
            const savedFavorites = localStorage.getItem('favoriteListings');
            if (savedFavorites) {
                setFavoriteListings(JSON.parse(savedFavorites));
            }
            } catch (error) {
            console.error('Error loading favorites from localStorage:', error);
            }
        }
    }, [isMounted]);

    // when favoriteListings is changed, update the localStorage
    useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favoriteListings, isMounted]);
    
    // find listing data
    const prod = products.find(item => 
      item.id === parseInt(id as string) || item.id.toString() === id
    );
    
    const toggleFavorite = (prod) => {
      const isFavorited = favoriteListings.some(item => item.id === prod.id);
      
      if (isFavorited) {
        setFavoriteListings(favoriteListings.filter(item => item.id !== prod.id));
      } else {
        // add new
        const favoriteItem = {
          id: prod.id,
          title: prod.title || 'Untitled Listing',
          location: prod.location || 'Unknown Location',
          price: prod.price || 0,
          bedrooms: prod.bedrooms || 1,
          ...(prod.bathrooms !== undefined && { bathrooms: prod.bathrooms }),
          image: prod.image || '/api/placeholder/800/500',
          ...(prod.dateRange && { dateRange: prod.dateRange })
        };
        
        setFavoriteListings([favoriteItem, ...favoriteListings]);
      }
      
      setIsSidebarOpen(true);
    };
  

  useEffect(() => {
  //   const fetchData = async () => {
  //     const productRef = doc(db, 'products', id as string);
  //     const productSnap = await getDoc(productRef);
  //     if (productSnap.exists()) {
  //       const productData = productSnap.data();
  //       setProduct(productData);

  //       // Fetch seller profile
  //       const sellerRef = doc(db, 'users', productData.seller);
  //       const sellerSnap = await getDoc(sellerRef);
  //       if (sellerSnap.exists()) {
  //         setSeller(sellerSnap.data());
  //       }
  //     }
  //   };

  //   if (id) fetchData();
  // }, [id]);

  // find listing data
      const foundProduct = products.find(item => 
      item.id === parseInt(id as string) || item.id.toString() === id
    );
    
    if (foundProduct) {
      setProduct(foundProduct);

      setSeller({
      ID: foundProduct.sellerID || "none",
      name: foundProduct.seller || "seller",
      email: foundProduct.sellerEmail || "seller@example.com",
      photoURL: foundProduct.sellerPhoto || null
    });

    }
  }, [id]);

  const mismatchOptions = [
    {value: "reviews", label: "Reviews"},
    {value: "image", label: "Image"},
    {value: "title", label: "Title"},
    {value: "bullet", label: "Bullet Points"},
    {value: "brand", label: "Brand"},
    {value: "other-mismatches", label: "Other mismatches"}
  ]


  const handleTabClick = (tab: string) => {
    router.push(`browse/profile/${product.id}/`);
    setShowProfile(false); // close dropdown
  };

  const handleSubmitReport = () => {
    if (!reportReason) {
      alert("Please select a reason for reporting.");
      return;
    }

    if (!scamDetails && reportReason == "scam") {
      alert("Please select a scam detail.");
      return;
    }
    else if (!matchDetails && reportReason == "mismatch") {
      alert("Please select a mismatch detail.");
      return;
    }
    else if (!informationDetails && reportReason == "information") {
      alert("Please select missing information.");
      return;
    }
    else if (!sellerProblem && reportReason == "seller") {
      alert("Please select a problem about the seller.");
      return;
    }
    else if (!priceDetails && reportReason == "price") {
      alert("Please select a price issue.");
      return;
    }
    else if (!unsafeDetails && reportReason == "unsafe") {
      alert("Please select a reason why it's unsafe.");
      return;
    }
    else if (!offensiveDetails && reportReason == "offensive") {
      alert("Please select a reason why it's offensive.");
      return;
    }

    // Submit logic here, like sending to Firestore or your backend
    alert("Seller reported. Thank you!");
    setShowReportForm(false);
    setReportReason("");
    setScamDetails("");
    setMatchDetails([]);
    setInformationDetails("");
    setSellerProblem("");
    setPriceDetails("");
    setUnsafeDetails("");
    setOffensiveDetails("");
    setDetails("");
  };

  const navigateToMessage = () => {
  router.push(`${product.id}/message`);
  };

   // check if the image already in the current listings
  const isCurrentListingFavorited = favoriteListings.some(item => item.id === product.id);
  

  // all image array
  const allImages = product ? [product.image, ...(product.additionalImages || [])] : [];


    // gp to previous image
  const goToPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  // go to next image
  const goToNextImage = () => {
    setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // use keyboard to move image
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showAllImages) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      } else if (e.key === 'Escape') {
        setShowAllImages(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAllImages]);


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
                      onClick={() => router.push(`browse/notificationDetail/${notif.id}`)}
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


  if (!product) return <div className="p-4">Loading...</div>;

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
              
              {/* Notifications */}
              <NotificationsButton notifications={notifications} />


              {/* Favorites */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
                >
                  <Heart size={20} 
                    className = "w-5 h-5 text-gray-600"/>
                </motion.button>

              {/* Favorites Sidebar */}
              <div className={`fixed md:left-16 left-0 top-0 md:top-0 top-16 h-full md:h-full h-[calc(100%-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-lg text-orange-500">Favorites</h2>
                    <button 
                      onClick={() => setIsSidebarOpen(false)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* favorites list */}
                  {isMounted && (
                    <>
                      {favoriteListings.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Heart size={40} className="mx-auto mb-2 opacity-50" />
                          <p>No favorite listings yet</p>
                          <p className="text-sm mt-2">Click the heart icon on listings to save them here</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {favoriteListings.map(listing => (
                            <div 
                              key={product.id} 
                              className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                              onClick={() => {
                                setIsSidebarOpen(false);
                                router.push(`/sale/browse/product/${product.id}`);
                              }}
                            >
                              <div className="flex">
                                <div 
                                  className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                                  style={{backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                                ></div>
                                <div className="p-3 flex-1">
                                  <div className="font-medium text-gray-700">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.location}</div>
                                  <div className="text-sm font-bold text-[#15361F] mt-1">
                                    ${product.price}
                                  </div>
                                </div>
                                <button 
                                  className="p-2 text-gray-400 hover:text-red-500 self-start"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFavoriteListings(favoriteListings.filter(item => item.id !== product.id));
                                  }}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
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
                        <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Sold</button>
                        <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Sublease</button>
                        <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Reviews</button>
                        <hr className="my-2" />
                        <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">History</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* image gallery */}
      {showAllImages && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            {/* close buttion */}
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setShowAllImages(false)}
                className="p-1 bg-white rounded-full text-black hover:bg-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* showing image */}
            <div className="relative mb-4">
              <div className="h-96 flex items-center justify-center">
                <img 
                  src={allImages[activeImage]} 
                  alt={`Image ${activeImage + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              {/* left arrow */}
              <button 
                onClick={goToPrevImage}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
                aria-label="Previous image"
              >
                <ArrowLeft size={24} />
              </button>
              
              {/* right arrow */}
              <button 
                onClick={goToNextImage}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
                aria-label="Next image"
              >
                <ArrowRight size={24} />
              </button>
            </div>
            
            {/* image index */}
            <div className="text-white text-center mb-4">
              {activeImage + 1} / {allImages.length}
            </div>
            
            {/* show main image */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {allImages.map((img, index) => (
                <div 
                  key={index}
                  className={`h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index ? 'border-orange-500' : 'border-transparent'}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img 
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* keyboard usage info */}
            <div className="text-white text-center mt-4 text-sm opacity-70">
               ← → key can move the image. ESC for exit.
            </div>
          </div>
        </div>
      )}

      {/* main */}   
        <div className="max-w-4xl mx-auto p-6">
          {/* back button*/}
          <button 
            onClick={() => router.push('/sale/browse')}
            className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Home Page
          </button>

          {/* main contents box */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            {/* image section */}
            <div className="flex flex-col md:flex-row md:gap-4 mb-6">
              {/* main picture */}
              <div className="md:w-2/3 h-72 md:h-96 rounded-lg overflow-hidden mb-4 md:mb-0">
                <img 
                  src={activeImage === 0 ? product.image : product.additionalImages[activeImage - 1]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* additional pictures */}
              <div className="md:w-1/3">
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div 
                    className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === 0 ? 'border-orange-500' : 'border-transparent'}`}
                    onClick={() => setActiveImage(0)}
                  >
                    <img 
                      src={product.image}
                      alt="Main view"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {product.additionalImages && product.additionalImages.slice(0, 2).map((img, index) => (
                    <div 
                      key={index}
                      className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index + 1 ? 'border-orange-500' : 'border-transparent'}`}
                      onClick={() => setActiveImage(index + 1)}
                    >
                      <img 
                        src={img}
                        alt={`Additional view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  
                  {/* + button - to see all images */}
                  <div 
                    className="h-24 md:h-auto rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                    onClick={() => setShowAllImages(true)}
                  >
                    <Plus className="text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

    
      {/* Seller Profile Picture */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {seller.photoURL ? (
            <img src={seller.photoURL} alt="Seller" className="w-24 h-24 rounded-full border-2 border-gray-300" />
          ) : (
            <div className="w-24 h-24 bg-gray-300 rounded-full" />
          )}
          <div>
            <h2 className="text-xl font-bold text-gray-700">{seller.name}</h2>
            <p className="text-gray-500 text-sm">{seller.email}</p>
          </div>
        </div>

      {/* Main report button */}
      <button
        title="Report seller"
        onClick={() => setShowReportForm((prev) => !prev)}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
      >
        <Flag size={18} />
        <span className="text-sm">Report</span>
      </button>

      {/* Report form */}
      {showReportForm && (
        <div className="mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-md w-200 absolute z-10">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason for report
          </label>
          <select
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
          >
            <option value="">-- Select a reason --</option>
            <option value="information">Some proudct information is missing, inaccurate or could be improved</option>
            <option value="mismatch">Parts of this page don't match</option>
            <option value="price">I have an issue with the price</option>
            <option value="offensive">This product or content is offensive</option>
            <option value="unsafe">This product or content is illegal, unsafe or suspicious</option>
            <option value="seller">I have an issue with a Seller</option>
            <option value="scam">I think this is a scam</option>
            <option value="other">Other</option>
          </select>

          {reportReason === "scam" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scam Details
              </label>
              <select
                value={scamDetails}
                onChange={(e) => setScamDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select scam type --</option>
                <option value="suspicious-payment">Asked for a suspicious way of payment</option>
                <option value="fake-listing">Fake product listing</option>
                <option value="other-scam">Other scam-related issue</option>
              </select>
            </div>
          )}

          {reportReason === "information" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Missing information
              </label>
              <select
                value={informationDetails}
                onChange={(e) => setInformationDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select missing information --</option>
                <option value="image">Images</option>
                <option value="size">Size</option>
                <option value="release-info">Release Information</option>
                <option value="model">Model</option>
                <option value="brand">Brand</option>
                <option value="condition">Condition</option>
                <option value="other-info">Other missing information</option>
              </select>
            </div>
          )}

          {reportReason === "mismatch" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mismatch Details (Select all that apply)
              </label>
              <div className="space-y-2">
                {mismatchOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={matchDetails.includes(option.value)}
                      onChange={(e) => {
                        const newValues = e.target.checked
                          ? [...matchDetails, option.value]
                          : matchDetails.filter((val) => val !== option.value);
                        setMatchDetails(newValues);
                      }}
                      className="h-4 w-4 text-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {reportReason === "price" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price Issues
              </label>
              <select
                value={priceDetails}
                onChange={(e) => setPriceDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select price issues --</option>
                <option value="price-disparity">Price disparity between single and multi-pack</option>
                <option value="discount">Discount error</option>
                <option value="price-condition">Prices for conditions higher than new</option>
                <option value="other-price">Other price issue</option>
              </select>
            </div>
          )}

          {reportReason === "offensive" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason why it's offensive
              </label>
              <select
                value={offensiveDetails}
                onChange={(e) => setOffensiveDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select reason why it's offensive --</option>
                <option value="sexual">Sexually explicit content</option>
                <option value="choice">Too offensive word choices</option>
                <option value="other-scam">Other reasons why it's offensive</option>
              </select>
            </div>
          )}

          {reportReason === "unsafe" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason why it's unsafe
              </label>
              <select
                value={unsafeDetails}
                onChange={(e) => setUnsafeDetails(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select reason it's unsafe --</option>
                <option value="counterfeit">It's counterfeit</option>
                <option value="intellectual">Uses my intellectual property without permission</option>
                <option value="safety-regulation">Not safe or compliant with product safety regulations</option>
                <option value="reviews">Reviews and Answers contain illegal content</option>
                <option value="other-scam">Other  reasons it's unsafe</option>
              </select>
            </div>
          )}

          {reportReason === "seller" && (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Problem about the seller
              </label>
              <select
                value={sellerProblem}
                onChange={(e) => setSellerProblem(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select seller problem --</option>
                <option value="identity">Using false or misleading identity information</option>
                <option value="contact">Using false or misleading contact information</option>
                <option value="reviews">Attempting to manipulate reviews</option>
                <option value="inappropriate">Engaging in other inappropriate activity</option>
                <option value="stolen">Selling a potentially stolen product</option>
                <option value="other-scam">Other scam-related issue</option>
              </select>
            </div>
          )}

          

          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded mb-3 resize-none"
            rows={3}
          />

          <div className="flex justify-between">
            <button
              onClick={handleSubmitReport}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
            >
              Submit
            </button>
            <button
              onClick={() => setShowReportForm(false)}
              className="text-gray-500 text-sm hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-700">{product.name}</h1>
        <p className="text-gray-600 mb-4">{product.shortDescription}</p>

        <div className="flex items-center space-x-4 mb-4">
          <div className="text-xl font-bold text-green-600">${product.price}</div>
          <div className="flex items-center space-x-1 text-gray-500">
            <MapPin className="w-4 h-4" />
            <span className="capitalize">{product.location?.replace("-", " ")}</span>
          </div>
        </div>

        {/* add favorites and connect */}
        <div className="space-y-4 ">
          {/* Connect Options - it can be seen when showConnectOptions is true */}
          {showConnectOptions && (
            <div className="grid gap-4 mb-4 ">

              <button 
                  onClick={navigateToMessage}
                  className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-4 rounded-lg flex flex-col items-center justify-center transition"
              >
                  <MessageCircle className="w-8 h-8 mb-2" />
                  <span className="font-medium">Send Message</span>
                  <span className="text-xs text-gray-600 mt-1">Chat with the host</span>
              </button>
            </div>
          )}

          <div className="flex space-x-4">
              <button 
              onClick={() => toggleFavorite(product)}
              className={`flex-1 ${isCurrentListingFavorited ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} px-6 py-3 rounded-lg ${isCurrentListingFavorited ? 'hover:bg-red-600' : 'hover:bg-red-200'} transition flex items-center justify-center cursor-pointer`}
              >
              <Heart className={`mr-2 ${isCurrentListingFavorited ? 'fill-current' : ''}`} />
              {isCurrentListingFavorited ? 'Remove from Favorites' : 'Add Favorites'}
              </button>
              
              <button 
              onClick={() => setShowConnectOptions(!showConnectOptions)} 
              className={`flex-1 ${showConnectOptions ? 'bg-orange-600' : 'bg-orange-500'} text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex items-center justify-center cursor-pointer`}
              >
              {showConnectOptions ? 'Hide Options' : 'Message'}
              </button>
            </div>
          </div>
        </div>
      
      

    {/*Detail */}
    <div className="bg-white  rounded-lg shadow p-6">
      <p className="font-semibold text-gray-600 mb-4">Detail</p>
      <h1 className="text-xl font-medium mb-2 text-gray-600">{product.description}</h1>
    </div>

    {/* Other Items by This Seller */}
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-600">Other items by {seller.name}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products
          .filter(item => item.sellerID === product.sellerID && item.id !== product.id)
          .slice(0, 8) // max 8 items
          .map(item => (
            <div 
              key={item.id}
              onClick={() => router.push(`/sale/browse/product/${item.id}`)}
              className="cursor-pointer bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h4 className="font-medium text-sm truncate text-gray-700">{item.name}</h4>
                <p className="text-green-600 font-bold text-sm">${item.price}</p>
                <p className="text-gray-500 text-xs">{item.location}</p>
              </div>
            </div>
          ))}
      </div>
      
      {/* if there is no other items */}
      {products.filter(item => item.sellerID === product.sellerID && item.id !== product.id).length === 0 && (
        <p className="text-gray-500 text-center py-8">This seller has no other items listed.</p>
      )}
    </div>

    {/* similar product matching */}
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <h3 className="text-xl font-bold mb-4 text-gray-600">Similar Products</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products
          .filter(item => {
            if (item.id === product.id) return false;
            
            const productWords = product.name.toLowerCase().split(/\s+/);
            const itemWords = item.name.toLowerCase().split(/\s+/);
            
            // find product with same word
            return productWords.some(word => 
              word.length > 2 && itemWords.some(itemWord => 
                itemWord.includes(word) || word.includes(itemWord)
              )
            );
          })
          .slice(0, 8)
          .map(item => (
            <div 
              key={item.id}
              onClick={() => router.push(`/sale/browse/product/${item.id}`)}
              className="cursor-pointer bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <img 
                src={item.image} 
                alt={item.name}
                className="w-full h-32 object-cover"
              />
              <div className="p-3">
                <h4 className="font-medium text-sm truncate text-gray-700">{item.name}</h4>
                <p className="text-orange-600 font-bold text-sm">${item.price}</p>
                <p className="text-gray-500 text-xs">{item.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
    </div>
  );
}

export default ProductDetailPage;
