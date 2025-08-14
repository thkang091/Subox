'use client'

import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, getDocs, limit, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/app/contexts/AuthInfo';
import { MapPin, Heart, User, Package, Bell, X, ArrowLeft, ArrowRight,
        ChevronLeft, Plus, Flag, MessageCircle
} from 'lucide-react';
import React from 'react';
import Badges from '@/data/badge';

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
  const [seller, setSeller] = useState<SellerInfo>({
    ID: "none",
    name: "seller",
    email: "seller@example.com",
    photoURL: null
  });

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
    
    setIsSidebarOpen(true);
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

  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setIsLoggedIn(true);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

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

  // Badge function
  const [badgeList, setBadgeList] = useState([]);
  
  useEffect(() => {
    const list = [];

    if (isLoggedIn) {
      list.push(Badges.schoolBadge());
    }
    else {
      list.push(Badges.alumniBadge());
    }
    setBadgeList(list);
  }, []);

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
  const allImages = product ? [
    product.image,
    ...(product.additionalImages || []),
    ...(product.images || [])
  ].filter(Boolean) : [];

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
            <motion.div 
                className="flex items-center space-x-6 relative mt-1"
                whileHover={{ scale: 1.05 }}
                onClick={() => {isLoggedIn ? (router.push("/find")) : router.push("/")}}
            >
            {/* Main Subox Logo */}
            <motion.div className="relative">
            {/* House Icon */}
            <motion.svg 
                className="w-12 h-12" 
                viewBox="0 0 100 100" 
                fill="none"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
            >
                {/* House Base */}
                <motion.path
                d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
                fill="#E97451"
                animate={{ 
                    fill: ["#E97451", "#F59E0B", "#E97451"],
                    scale: [1, 1.02, 1]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                />
                {/* House Roof */}
                <motion.path
                d="M15 50L50 20L85 50L50 15L15 50Z"
                fill="#D97706"
                animate={{ rotate: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                />
                {/* Window */}
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
                {/* Door */}
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

            {/* Tag Icon */}
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

            {/* Subox Text */}
            <motion.div className="flex flex-col -mx-4">
            <motion.span 
                className="text-3xl font-bold text-gray-900"
                animate={{
                background: [
                    "linear-gradient(45deg, #1F2937, #374151)",
                    "linear-gradient(45deg, #E97451, #F59E0B)",
                    "linear-gradient(45deg, #1F2937, #374151)"
                ],
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent"
                }}
                transition={{ duration: 4, repeat: Infinity }}
            >
                Subox
            </motion.span>
            <motion.span 
                className="text-xs text-gray-500 font-medium tracking-wider"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                SUBLEASE
                {badgeList.map((badge, i) => (
                  <span key={i} className="inline-flex items-center translate-y-1">
                    {React.cloneElement(badge as React.ReactElement, {
                      className: "w-4 h-4 ml-1"
                    })}
                  </span>
                ))}
            </motion.span>
            </motion.div>
            </motion.div>

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
                  <Heart size={20} className="w-5 h-5 text-gray-600"/>
                </motion.button>
 
                {/* Favorites Sidebar */}
                <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>                
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
                            {favoriteListings.map(favProduct => (
                              <div 
                                key={favProduct.id} 
                                className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                                onClick={() => {
                                  setIsSidebarOpen(false);
                                  router.push(`/sale/browse/product/${favProduct.id}`);
                                }}
                              >
                                <div className="flex">
                                  <div 
                                    className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                                    style={{backgroundImage: `url(${favProduct.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                                  ></div>
                                  <div className="p-3 flex-1">
                                    <div className="font-medium text-gray-700">{favProduct.name}</div>
                                    <div className="text-sm text-gray-500">{favProduct.location}</div>
                                    <div className="text-sm font-bold text-[#15361F] mt-1">
                                      ${favProduct.price}
                                    </div>
                                  </div>
                                  <button 
                                    className="p-2 text-gray-400 hover:text-red-500 self-start"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setFavoriteListings(favoriteListings.filter(item => item.id !== favProduct.id));
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
                      <span className="text-xs text-gray-500 ml-1">+{allImages.length - 3}</span>
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
              {product.originalPrice && product.originalPrice !== product.price && (
                <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
              )}
              <div className="flex items-center space-x-1 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span className="capitalize">{product.location?.replace("-", " ")}</span>
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
        
          {/* Details Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-semibold text-gray-600 mb-4">Details</h3>
            <div className="space-y-3">
              <p className="text-gray-600">{product.description}</p>
              
              {/* Additional Product Details */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                <div>
                  <span className="font-medium text-gray-700">Condition:</span>
                  <span className="ml-2 text-gray-600">{product.condition || 'Not specified'}</span>
                </div>
                
                {product.category && (
                  <div>
                    <span className="font-medium text-gray-700">Category:</span>
                    <span className="ml-2 text-gray-600">{product.category}</span>
                  </div>
                )}
                
                {product.views !== undefined && (
                  <div>
                    <span className="font-medium text-gray-700">Views:</span>
                    <span className="ml-2 text-gray-600">{product.views}</span>
                  </div>
                )}
                
                {product.availableUntil && (
                  <div>
                    <span className="font-medium text-gray-700">Available Until:</span>
                    <span className="ml-2 text-gray-600">{product.availableUntil}</span>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-gray-700">Delivery:</span>
                  <span className="ml-2 text-gray-600">
                    {product.deliveryAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
                
                <div>
                  <span className="font-medium text-gray-700">Pickup:</span>
                  <span className="ml-2 text-gray-600">
                    {product.pickupAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
                
                {product.priceType && (
                  <div>
                    <span className="font-medium text-gray-700">Price Type:</span>
                    <span className="ml-2 text-gray-600 capitalize">{product.priceType}</span>
                  </div>
                )}
                
                {product.priceType === 'negotiable' && product.minPrice && product.maxPrice && (
                  <div>
                    <span className="font-medium text-gray-700">Price Range:</span>
                    <span className="ml-2 text-gray-600">${product.minPrice} - ${product.maxPrice}</span>
                  </div>
                )}
              </div>
              
              {/* Listing Timestamp */}
              {product.createdAt && (
                <div className="pt-4 border-t border-gray-200">
                  <span className="font-medium text-gray-700">Listed:</span>
                  <span className="ml-2 text-gray-600">
                    {product.createdAt instanceof Date 
                      ? product.createdAt.toLocaleDateString() + ' at ' + product.createdAt.toLocaleTimeString()
                      : new Date(product.createdAt).toLocaleDateString() + ' at ' + new Date(product.createdAt).toLocaleTimeString()
                    }
                  </span>
                </div>
              )}
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
                      <p className="text-gray-500 text-xs capitalize">{item.location?.replace("-", " ")}</p>
                      
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