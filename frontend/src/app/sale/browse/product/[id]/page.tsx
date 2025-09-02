'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, 
  getDocs, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/app/contexts/AuthInfo';
import { MapPin, Heart, User, Package, Bell, X,
        ChevronLeft, Plus, Flag, MessagesSquare, Menu,  ArrowLeft, ArrowRight,Video, 
        MessageCircle, AlertCircle, Info, DollarSign, BedDouble, Calendar, Users, 
        Expand, Eye, EyeOff, Navigation, Check, Volume2,CalendarCheck,Zap,Cigarette, BookOpen
      } from 'lucide-react';

    import DeliveryZoneMap from '@/components/DeliveryZoneMap';



// Interfaces
interface PageParams {
  id?: string;
  productId?: string;
  saleItemId?: string;
}

interface ProductData {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  priceType?: string;
  minPrice?: number;
  maxPrice?: number;
  category?: string;
  condition: string;
  location: string;
  deliveryAvailable?: boolean;
  pickupAvailable?: boolean;
  // Add these new fields
  deliveryZone?: {
    center: { lat: number; lng: number };
    radius: number;
    type: 'delivery';
  };
  pickupLocations?: Array<{
    lat: number;
    lng: number;
    address: string;
    placeName?: string;
  }>;
  image?: string;
  images?: string[];
  additionalImages?: string[];
  views?: number;
  sellerRating?: number;
  seller?: string;
  sellerEmail?: string;
  sellerPhoto?: string;
  hostId?: string;
  sellerID?: string;
  createdAt?: Date;
  updatedAt?: Date;
  availableUntil?: string;
  similarity?: number;
}


interface SellerInfo {
  ID: string;
  name: string;
  email: string;
  photoURL: string | null;
}

const ProductDetailPage = () => {
  const router = useRouter();
  const params = useParams() as PageParams;
  const { user } = useAuth();
  
  // Enhanced ID extraction
  const extractProductId = (): string | null => {
    if (params?.id) return params.id;
    
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const match = pathname.match(/\/product\/([^\/]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    
    return null;
  };

  const id = extractProductId();
  const [actualId, setActualId] = useState<string | null>(null);
  
  // State management
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [otherSellerItems, setOtherSellerItems] = useState<ProductData[]>([]);
  const [similarProducts, setSimilarProducts] = useState<ProductData[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [locationCheckResult, setLocationCheckResult] = useState<{
  inZone: boolean;
  distance?: number;
} | null>(null);
  const [seller, setSeller] = useState<SellerInfo>({
    ID: "none",
    name: "seller",
    email: "seller@example.com",
    photoURL: null
  });


const getDeliveryMode = (product: ProductData): 'delivery' | 'pickup' | 'both' => {
  console.log('getDeliveryMode called with:', {
    deliveryAvailable: product.deliveryAvailable,
    hasDeliveryZone: !!product.deliveryZone,
    pickupAvailable: product.pickupAvailable,
    hasPickupLocations: !!product.pickupLocations?.length,
    product // Log the entire product to see what's there
  });
  
  const hasDelivery = product.deliveryAvailable && product.deliveryZone;
  const hasPickup = product.pickupAvailable && product.pickupLocations?.length;
  
  if (hasDelivery && hasPickup) return 'both';
  if (hasDelivery) return 'delivery';
  if (hasPickup) return 'pickup';
  
  // Fallback: if deliveryAvailable is true but no deliveryZone, still show delivery mode
  if (product.deliveryAvailable) return 'delivery';
  return 'pickup';
};

// Ad
  const notifications = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" }
  ];

  // Check if current user is the seller
  const isCurrentUserSeller = user && product && user.uid === product.hostId;

  // Mount effect
  useEffect(() => {
    setIsMounted(true);
  }, []);
    
  // Load favorites from localStorage
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

  // Save favorites to localStorage
  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favoriteListings, isMounted]);
    
  // Toggle favorite function
  const toggleFavorite = (prod: ProductData) => {
    const isFavorited = favoriteListings.some(item => item.id === prod.id);
    
    if (isFavorited) {
      setFavoriteListings(favoriteListings.filter(item => item.id !== prod.id));
    } else {
      const favoriteItem = {
        id: prod.id,
        name: prod.name || 'Untitled Listing',
        location: prod.location || 'Unknown Location',
        price: prod.price || 0,
        image: prod.image || '/api/placeholder/800/500',
      };
      
      setFavoriteListings([favoriteItem, ...favoriteListings]);
    }
    
    // setIsSidebarOpen(true);
  };

  // Enhanced messaging function
  const navigateToMessage = async () => {
    if (!user) {
      alert('Please log in to message the seller');
      return;
    }

    if (!product) {
      alert('Product information not available');
      return;
    }

    // Check if user is trying to message themselves
    if (user.uid === product.hostId) {
      alert('You cannot message yourself');
      return;
    }

    setCreatingConversation(true);

    try {
      // First, check if a conversation already exists between these users for this item
      const existingConversationQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid),
        where('listingId', '==', product.id)
      );

      const existingConversations = await getDocs(existingConversationQuery);
      let conversationId = null;

      // Check if any of the existing conversations involve both users
      for (const convDoc of existingConversations.docs) {
        const convData = convDoc.data();
        if (convData.participants.includes(product.hostId)) {
          conversationId = convDoc.id;
          break;
        }
      }

      // If no existing conversation, create a new one
      if (!conversationId) {
        const conversationData = {
          participants: [user.uid, product.hostId],
          hostId: product.hostId,
          hostName: seller.name,
          hostEmail: seller.email,
          hostImage: seller.photoURL || '/api/placeholder/40/40',
          guestId: user.uid,
          guestName: user.displayName || user.email || 'User',
          guestEmail: user.email || '',
          guestImage: user.photoURL || '/api/placeholder/40/40',
          listingId: product.id,
          listingTitle: product.name,
          listingImage: product.image || '/api/placeholder/400/300',
          listingLocation: product.location,
          listingPrice: product.price,
          conversationType: 'moveout', // Since this is from move out sale
          lastMessage: '',
          lastMessageTime: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          hostUnreadCount: 0,
          guestUnreadCount: 0,
        };

        const newConversationRef = await addDoc(collection(db, 'conversations'), conversationData);
        conversationId = newConversationRef.id;
      }

      // Navigate to the conversation
      router.push(`/sublease/search/${conversationId}/message`);

    } catch (error) {
      console.error('Error creating/finding conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setCreatingConversation(false);
    }
  };

  // Fetch other items by the same seller
  const fetchOtherSellerItems = async (hostId: string, currentProductId: string) => {
    try {
      const q = query(
        collection(db, 'saleItems'),
        where('hostId', '==', hostId),
        orderBy('createdAt', 'desc'),
        limit(12)
      );
      
      const querySnapshot = await getDocs(q);
      const items: ProductData[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentProductId) {
          items.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
          } as ProductData);
        }
      });
      
      setOtherSellerItems(items);
    } catch (error) {
      console.error('Error fetching other seller items:', error);
    }
  };

  // Enhanced algorithm for finding similar products
  const fetchSimilarProducts = async (currentProduct: ProductData) => {
    try {
      const similarItems: ProductData[] = [];
      
      // Strategy 1: Same category
      if (currentProduct.category) {
        const categoryQuery = query(
          collection(db, 'saleItems'),
          where('category', '==', currentProduct.category),
          orderBy('createdAt', 'desc'),
          limit(8)
        );
        
        const categorySnapshot = await getDocs(categoryQuery);
        categorySnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== currentProduct.id) {
            similarItems.push({
              id: doc.id,
              ...data,
              similarity: 0.8,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            } as ProductData);
          }
        });
      }

      // Strategy 2: Similar price range (±30%)
      const priceMin = Math.floor(currentProduct.price * 0.7);
      const priceMax = Math.ceil(currentProduct.price * 1.3);
      
      const priceQuery = query(
        collection(db, 'saleItems'),
        where('price', '>=', priceMin),
        where('price', '<=', priceMax),
        orderBy('price'),
        limit(8)
      );
      
      const priceSnapshot = await getDocs(priceQuery);
      priceSnapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id !== currentProduct.id && !similarItems.find(item => item.id === doc.id)) {
          similarItems.push({
            id: doc.id,
            ...data,
            similarity: 0.6,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
          } as ProductData);
        }
      });

      // Strategy 3: Same location
      if (currentProduct.location) {
        const locationQuery = query(
          collection(db, 'saleItems'),
          where('location', '==', currentProduct.location),
          orderBy('createdAt', 'desc'),
          limit(6)
        );
        
        const locationSnapshot = await getDocs(locationQuery);
        locationSnapshot.forEach((doc) => {
          const data = doc.data();
          if (doc.id !== currentProduct.id && !similarItems.find(item => item.id === doc.id)) {
            similarItems.push({
              id: doc.id,
              ...data,
              similarity: 0.5,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt
            } as ProductData);
          }
        });
      }

      // Remove duplicates and sort by similarity score
      const uniqueItems = similarItems.filter((item, index, self) => 
        index === self.findIndex(t => t.id === item.id)
      );

      const sortedItems = uniqueItems
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, 8);

      setSimilarProducts(sortedItems);
    } catch (error) {
      console.error('Error fetching similar products:', error);
    }
  };

  // Enhanced product fetching
  useEffect(() => {
    const fetchProduct = async () => {
      const productId = extractProductId();
      
      if (!productId) {
        setError('No product ID found in URL parameters');
        setLoading(false);
        return;
      }

      const cleanId = String(productId).trim();
      if (!cleanId) {
        setError('Invalid product ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const productRef = doc(db, 'saleItems', cleanId);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const rawData = productSnap.data();
          
          const productData: ProductData = { 
            id: productSnap.id, 
            ...rawData,
            createdAt: rawData.createdAt?.toDate ? rawData.createdAt.toDate() : rawData.createdAt,
            updatedAt: rawData.updatedAt?.toDate ? rawData.updatedAt.toDate() : rawData.updatedAt
          } as ProductData;
          
          setProduct(productData);
          setActualId(cleanId);
          
          // Try to increment view count
          try {
            await updateDoc(productRef, {
              views: increment(1)
            });
          } catch (viewError) {
            console.warn('Could not increment view count:', viewError);
          }
          
          // Set seller info
          const sellerInfo: SellerInfo = {
            ID: productData.hostId || productData.sellerID || "none",
            name: productData.seller || "Seller",
            email: productData.sellerEmail || "seller@example.com",
            photoURL: productData.sellerPhoto || null
          };
          setSeller(sellerInfo);
          
          // Fetch recommendations
          setLoadingRecommendations(true);
          if (productData.hostId) {
            await fetchOtherSellerItems(productData.hostId, cleanId);
          }
          await fetchSimilarProducts(productData);
          setLoadingRecommendations(false);
          
        } else {
          setError(`Product not found. ID: ${cleanId}`);
          setTimeout(() => {
            router.push('/sale/browse');
          }, 3000);
        }
      } catch (error) {
        setError(`Error loading product: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [params, router]);

  const handleTabClick = (tab: string) => {
    if (actualId || id) {
      router.push(`/sale/profile/${actualId || id}?tab=${tab}`);
    }
    setShowProfile(false);
  };

  // Check if favorited
  const isCurrentListingFavorited = favoriteListings.some(item => item.id === product?.id);
  
  // All images array
  // const allImages = product ? [
  //   product.image,
  //   ...(product.additionalImages || []),
  //   ...(product.images || [])
  // ].filter(Boolean) : [];

  const allImages = product ? [...new Set([
    product.image,
    ...(product.additionalImages || []),
    ...(product.images || [])
  ])].filter(Boolean) : [];

  // Image navigation
  const goToPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  const goToNextImage = () => {
    setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [showAllImages, allImages.length]);

  const NotificationsButton = ({ notifications }: { notifications: any[] }) => {
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
                      onClick={() => router.push(`/sale/browse/notificationDetail/${notif.id}`)}
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
                <button
                  onClick={() => router.push(`/sale/browse/notification/`)}
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4">
              <X className="w-16 h-16 mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Loading Error</h2>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button 
                onClick={() => router.push('/sale/browse')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
              >
                Back to Browse
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Product not found</p>
            <button 
              onClick={() => router.push('/sale/browse')}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Back to Browse
            </button>
          </div>
        </div>
      </div>
    );
  }
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
 
              {/* messages */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.location.href = '/sublease/search/list'}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <MessagesSquare size={20} className = "w-5 h-5 text-gray-600"/>
              </motion.button>              
 
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

              {/* menu */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
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
                            router.push('/sale/browse');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Browse Items
                        </button>                        
                        <button 
                          onClick={() => {
                            router.push('/sale/create/options/nonai');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Sell Items
                        </button> 
                        <button 
                          onClick={() => {
                            router.push('/sale/browse');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          My Items
                        </button>   
                        
                        <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
                          Sublease
                        </p>
                        <button 
                          onClick={() => {
                            router.push('/sublease/search');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Find Sublease
                        </button>   
                        <button 
                          onClick={() => {
                            router.push('/sublease/write/options/chat');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Post Sublease
                        </button>   
                        <button 
                          onClick={() => {
                            router.push('../search');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          My Sublease Listing
                        </button>
                        <hr className="my-2" />
                        <button                              
                          onClick={() => {                               
                            router.push('/favorite');                               
                            setShowMenu(false);                             
                          }}                              
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                          >                             
                          <Heart className="w-4 h-4 text-gray-600" />                             
                          Favorites                           
                        </button>
                        <button 
                          onClick={() => {
                            router.push('/sublease/search/list');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors flex items-center gap-2"
                        >
                          <MessagesSquare className="w-4 h-4 text-gray-600" />                             
                          Messages
                        </button>   
                        <button 
                          onClick={() => {
                            router.push('../help');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Help & Support
                        </button>

                        {/* need change (when user didn't log in -> show log in button) */}
                        <hr className="my-2" />
                          {/* log in/ out */}
                          {isLoggedIn ? (
                            <button className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                              Logout
                            </button>
                          ) : (
                            <button className="w-full text-left px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                              Login
                            </button>
                          )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* Image Gallery Modal */}
      {showAllImages && allImages.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setShowAllImages(false)}
                className="p-1 bg-white rounded-full text-black hover:bg-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <div className="h-96 flex items-center justify-center">
                <img 
                  src={allImages[activeImage]} 
                  alt={`Image ${activeImage + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              {allImages.length > 1 && (
                <button 
                  onClick={goToPrevImage}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
                  aria-label="Previous image"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              
              {allImages.length > 1 && (
                <button 
                  onClick={goToNextImage}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
                  aria-label="Next image"
                >
                  <ArrowRight size={24} />
                </button>
              )}
            </div>
            
            <div className="text-white text-center mb-4">
              {activeImage + 1} / {allImages.length}
            </div>
            
            {allImages.length > 1 && (
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
            )}
            
            <div className="text-white text-center mt-4 text-sm opacity-70">
               ← → keys to navigate. ESC to exit.
            </div>
          </div>
        </div>
      )}
 
      {/* Main Content */}   
      <div className="max-w-4xl mx-auto p-6">
        {/* Back Button */}
        <button 
          onClick={() => router.push('/sale/browse')}
          className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Browse
        </button>
 
        {/* Main Content Box */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          {/* Image Section */}
          <div className="flex flex-col md:flex-row md:gap-4 mb-6">
            {/* Main Picture */}
            <div className="md:w-2/3 h-72 md:h-96 rounded-lg overflow-hidden mb-4 md:mb-0">
              {allImages.length > 0 ? (
                <img 
                  src={allImages[activeImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowAllImages(true)}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                  <span className="ml-2 text-gray-500">No image available</span>
                </div>
              )}
            </div>
            
            {/* Additional Pictures */}
            {allImages.length > 1 && (
              <div className="md:w-1/3">
                <div className="grid grid-cols-2 gap-2 h-full">
                  {allImages.slice(0, 3).map((img, index) => (
                    <div 
                      key={index}
                      className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index ? 'border-orange-500' : 'border-transparent'}`}
                      onClick={() => setActiveImage(index)}
                    >
                      <img 
                        src={img}
                        alt={`View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  
                  {/* Show All Images Button */}
                  {allImages.length > 3 && (
                    <div 
                      className="h-24 md:h-auto rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                      onClick={() => setShowAllImages(true)}
                    >
                      <Plus className="text-gray-500" />
                      <span className="text-xs text-gray-500 ml-1">{allImages.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
 
          {/* Seller Profile Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {seller.photoURL ? (
                <img src={seller.photoURL} alt="Seller" className="w-24 h-24 rounded-full border-2 border-gray-300" />
              ) : (
                <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-500" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-gray-700">{seller.name}</h2>
                <p className="text-gray-500 text-sm">{seller.email}</p>
                {isCurrentUserSeller && (
                  <p className="text-orange-600 text-sm font-medium mt-1">This is your listing</p>
                )}
              </div>
            </div>
 
            {/* Report Button - Only for other users */}
            {!isCurrentUserSeller && (
              <button
                title="Report seller"
                onClick={() => alert('Reported seller')}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
              >
                <Flag size={20} />
              </button>
            )}
          </div>
 
          {/* Product Information */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-2 text-gray-700">{product.name}</h1>
            <p className="text-gray-600 mb-4">{product.shortDescription || product.description}</p>
 
            <div className="flex items-center space-x-4 mb-4">
              <div className="text-xl font-bold text-green-600">${product.price}</div>
              {/* {product.originalPrice && product.originalPrice !== product.price && (
                <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
              )} */}
              <div className="flex items-center space-x-1 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{product.location?.replace(/-/g, " ").toUpperCase()}</span>
              </div>
            </div>
 
            {/* Action Buttons - Show for both sellers and buyers, but different actions */}
            <div className="space-y-4">
              {isCurrentUserSeller ? (
                // Seller view - route to messages
                <button 
                  onClick={() => router.push('/sublease/search/list')}
                  className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-center cursor-pointer"
                >
                  <MessageCircle className="mr-2" />
                  View Your Messages
                </button>
              ) : (
                // Buyer view - existing functionality
                <>
                  {/* Connect Options */}
                  {showConnectOptions && (
                    <div className="grid gap-4 mb-4">
                      <button 
                        onClick={navigateToMessage}
                        disabled={creatingConversation}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-4 rounded-lg flex flex-col items-center justify-center transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {creatingConversation ? (
                          <>
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="font-medium">Starting conversation...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="w-8 h-8 mb-2" />
                            <span className="font-medium">Send Message</span>
                          </>
                        )}
                        <span className="text-xs text-gray-600 mt-1">Chat with the seller</span>
                      </button>
                    </div>
                  )}
 
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => toggleFavorite(product)}
                      className={`flex-1 ${isCurrentListingFavorited ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} px-6 py-3 rounded-lg ${isCurrentListingFavorited ? 'hover:bg-red-600' : 'hover:bg-red-200'} transition flex items-center justify-center cursor-pointer`}
                    >
                      <Heart className={`mr-2 ${isCurrentListingFavorited ? 'fill-current' : ''}`} />
                      {isCurrentListingFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                    </button>
                    
                    <button 
                      onClick={() => setShowConnectOptions(!showConnectOptions)} 
                      disabled={creatingConversation}
                      className={`flex-1 ${showConnectOptions ? 'bg-orange-600' : 'bg-orange-500'} text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {showConnectOptions ? 'Hide Options' : 'Message'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
 
          {/* Key Information */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Key Information</h2>
            </div>

            <div className="p-6">
              {/* Main Information */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-orange-500" />
                  <span className="text-gray-700">Location: {product.location?.replace(/-/g, " ").toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign size={18} className="text-orange-500" />
                  <span className="text-gray-700">${product.price}</span>
                  {product.priceType && (
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      product.priceType === 'fixed' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {product.priceType === 'fixed' ? 'Fixed Price' : 'Negotiable'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-orange-500" />
                  <span className="text-gray-700">Available Until: {product.availableUntil || 'Not specified'}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-orange-500" />
                  <span className="text-gray-700">{product.category}</span>
                </div>
              </div>

              {/* Delivery and Pickup Options */}
              <div className="pt-6 border-t border-gray-100">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {product.deliveryAvailable ? 
                      <Check size={16} className="text-green-500" /> : 
                      <X size={16} className="text-red-500" />
                    }
                    <span className="text-sm text-gray-700">
                      {product.deliveryAvailable ? "Delivery Available" : "No Delivery"}
                    </span>
                    {product.deliveryAvailable && product.deliveryZone && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {Math.round(product.deliveryZone.radius / 1000 * 100) / 100}km radius
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {product.pickupAvailable ? 
                      <Check size={16} className="text-green-500" /> : 
                      <X size={16} className="text-red-500" />
                    }
                    <span className="text-sm text-gray-700">
                      {product.pickupAvailable ? "Pickup Available" : "No Pickup"}
                    </span>
                    {product.pickupAvailable && product.pickupLocations && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        {product.pickupLocations.length} location{product.pickupLocations.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery/Pickup Zone Map */}
          {(product.deliveryAvailable || product.pickupAvailable) && (
            <div className="bg-white rounded-lg border border-gray-200 mb-6">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin size={20} className="mr-2 text-orange-500" />
                  {getDeliveryMode(product) === 'both' ? 'Delivery & Pickup Options' :
                   getDeliveryMode(product) === 'delivery' ? 'Delivery Zone' : 'Pickup Locations'}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {getDeliveryMode(product) === 'both' ? 'Check delivery availability or view pickup locations' :
                   getDeliveryMode(product) === 'delivery' ? 'Check if delivery is available to your address' : 
                   'View available pickup locations'}
                </p>
              </div>

              <div className="p-6">
                <DeliveryZoneMap
                  deliveryZone={product.deliveryZone}
                  pickupLocations={product.pickupLocations || []}
                  mode={getDeliveryMode(product)}
                  onLocationCheck={(inZone, distance) => {
                    setLocationCheckResult({ inZone, distance });
                  }}
                />
                
                {/* Location Check Result Display */}
                {locationCheckResult && getDeliveryMode(product) === 'delivery' && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    locationCheckResult.inZone
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className={`flex items-center space-x-2 ${
                      locationCheckResult.inZone ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {locationCheckResult.inZone ? 
                        <Check size={16} /> : 
                        <X size={16} />
                      }
                      <span className="font-medium">
                        {locationCheckResult.inZone 
                          ? `Delivery available! (${locationCheckResult.distance}km from center)`
                          : `Outside delivery zone (${locationCheckResult.distance}km from center)`
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
                
          {/* Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info size={20} className="text-orange-600" />
                <h3 className="text-lg font-semibold text-gray-900">Details</h3>
              </div>
              <div className="space-y-3">
                <p className="text-gray-600">{product.description}</p>
              </div>
          </div>
        </div>
 
        {/* Other Items by This Seller */}
        {otherSellerItems.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-600">Other items by {seller.name}</h3>
            
            {loadingRecommendations ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherSellerItems.slice(0, 8).map(item => (
                  <div 
                    key={item.id}
                    onClick={() => router.push(`/sale/browse/product/${item.id}`)}
                    className="cursor-pointer bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <img 
                      src={item.image || '/api/placeholder/200/150'} 
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate text-gray-700">{item.name}</h4>
                      <p className="text-green-600 font-bold text-sm">${item.price}</p>
                      <p className="text-gray-500 text-xs capitalize">{item.location?.replace("-", " ")}</p>
                      {item.condition && (
                        <p className="text-gray-400 text-xs mt-1">{item.condition}</p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
 
        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-xl font-bold mb-4 text-gray-600">Similar Products</h3>
            
            {loadingRecommendations ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {similarProducts.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => router.push(`/sale/browse/product/${item.id}`)}
                    className="cursor-pointer bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-shadow relative"
                  >
                    {/* Similarity Badge */}
                    {item.similarity && item.similarity > 0.6 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10">
                        {Math.round(item.similarity * 100)}% match
                      </div>
                    )}
                    
                    <img 
                      src={item.image || '/api/placeholder/200/150'} 
                      alt={item.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3">
                      <h4 className="font-medium text-sm truncate text-gray-700">{item.name}</h4>
                      <p className="text-orange-600 font-bold text-sm">${item.price}</p>
                      <p className="text-gray-500 text-xs capitalize">{item.location?.replace(/-/g, " ").toUpperCase()}</p>
                      
                      {/* Show Why It's Similar */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.category === product.category && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Same category</span>
                        )}
                        {item.location === product.location && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Same location</span>
                        )}
                        {Math.abs(item.price - product.price) / product.price < 0.3 && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Similar price</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Algorithm Explanation */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>How we find similar products:</strong> We match based on category, price range (±30%), 
                location, and product name similarity. Items with higher match percentages are more similar to this product.
              </p>
            </div>
          </div>
        )}
 
        {/* No Recommendations Message */}
        {!loadingRecommendations && otherSellerItems.length === 0 && similarProducts.length === 0 && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <div className="text-center py-8 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No recommendations available</h3>
              <p className="text-sm">This seller has no other items, and we couldn't find similar products at the moment.</p>
              <button 
                onClick={() => router.push('/sale/browse')}
                className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Browse All Products
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetailPage;