"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthInfo';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Calendar, Clock, Video, Users, CheckCircle, XCircle, 
  AlertCircle, MapPin, User, Settings, Bell, Home,
  ShoppingCart, Search, Plus, Eye, ArrowLeft, Building2,
  DollarSign, Package, UserPlus, X, UserCheck, TrendingUp,
  Activity, Star, MessageSquare, Filter,ChevronLeft,ChevronRight,  Grid, List, Menu, MessagesSquare, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { notification } from '@/data/notificationlistings';

// Type definitions
interface UserInfo {
  id: string;
  displayName?: string;
  profilePicture?: string;
  badges?: string[];
  email?: string;
}

interface Listing {
  id: string;
  location?: string;
  address?: string;
  accommodationType?: string;
  additionalDetails?: string;
  additionalImages?: string[];
  amenities?: string[];
  availableFrom?: Timestamp;
  availableTo?: Timestamp;
  bedrooms?: number;
  bathrooms?: number;
  contactInfo?: any;
  createdAt: Timestamp;
  deliveryAvailable?: boolean;
  hostId: string;
  status?: 'active' | 'rented' | 'unavailable';
  [key: string]: any;
}

interface SaleItem {
  id: string;
  category: string;
  createdAt: Timestamp;
  pickupAvailable?: boolean;
  hostId: string;
  [key: string]: any;
}

interface TourRequest {
  id: string;
  listingId: string;
  guestId: string;
  hostId: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  date: string;
  time: string;
  tourType: 'virtual' | 'in-person';
  listingTitle?: string;
  listingLocation?: string;
  listingPrice?: number;
  hostName?: string;
  guestName?: string;
  hostNote?: string;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  [key: string]: any;
}

interface HostAvailability {
  id: string;
  listingId: string;
  hostId: string;
  availability: any;
  appointmentDuration: number;
  bufferTime: number;
  advanceBooking: number;
  maxBookings: number;
  [key: string]: any;
}

interface Conversation {
  id: string;
  participants: string[];
  participantNames: { [uid: string]: string };
  lastMessageTime: Timestamp;
  otherParticipantName: string;
  [key: string]: any;
}

interface ConversationWithNames {
  id: string;
  participants: string[];
  participantNames: { [uid: string]: string };
  lastMessageTime: Timestamp;
  otherParticipantName: string;
  guestName: string;
  hostName: string;
  guestId?: string;
  hostId?: string;
  lastMessage?: string;
  [key: string]: any;
}

interface ProfileData {
  userInfo: UserInfo | null;
  hostListings: Listing[];
  hostSaleItems: SaleItem[];
  guestTourRequests: TourRequest[];
  hostTourRequests: TourRequest[]; 
  hostAvailabilities: HostAvailability[]; 
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
}

// Navigation flow state type
type NavigationFlow = 'main' | 'sublease' | 'moveout-sale';
type UserRole = 'guest' | 'host' | 'buyer' | 'seller';

// useConversationsWithNames hook
const useConversationsWithNames = (userId: string | undefined) => {
  const [conversations, setConversations] = useState<ConversationWithNames[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversationsWithNames = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('lastMessageTime', 'desc'),
        limit(10)
      );
      
      const conversationsSnapshot = await getDocs(conversationsQuery);
      
      const conversationsWithNames = conversationsSnapshot.docs.map((docSnapshot) => {
        const conversationData = { id: docSnapshot.id, ...docSnapshot.data() };
        const participants = conversationData.participants || [];
        
        const guestName = conversationData.guestName || 'Unknown Guest';
        const hostName = conversationData.hostName || 'Unknown Host';
        const guestId = conversationData.guestId;
        const hostId = conversationData.hostId;
        
        let otherParticipantName = 'Unknown User';
        
        if (userId === guestId) {
          otherParticipantName = hostName;
        } else if (userId === hostId) {
          otherParticipantName = guestName;
        } else {
          const otherParticipants = participants.filter((id: string) => id !== userId);
          if (otherParticipants.length > 0) {
            otherParticipantName = guestName !== 'Unknown Guest' ? guestName : hostName;
          }
        }
        
        const participantNames: { [uid: string]: string } = {};
        if (guestId) participantNames[guestId] = guestName;
        if (hostId) participantNames[hostId] = hostName;
        
        return {
          ...conversationData,
          participantNames,
          otherParticipantName,
          guestName,
          hostName
        } as ConversationWithNames;
      });
      
      setConversations(conversationsWithNames);
      setError(null);
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversationsWithNames();
  }, [userId]);

  return { conversations, loading, error, refetch: fetchConversationsWithNames };
};


// Utility functions
const formatDate = (timestamp: Timestamp | any): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

const formatTime = (timestamp: Timestamp | any): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString();
};

const getBadgeColor = (badge: string): string => {
  const colors: Record<string, string> = {
    'Super Host': 'bg-yellow-100 text-yellow-800',
    'Reliable Guest': 'bg-green-100 text-green-800',
    'Verified User': 'bg-blue-100 text-blue-800',
    'New Member': 'bg-purple-100 text-purple-800'
  };
  return colors[badge] || 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'completed': 'bg-blue-100 text-blue-800',
    'cancelled': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'approved': return <CheckCircle className="w-4 h-4" />;
    case 'rejected': return <XCircle className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'cancelled': return <XCircle className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
};

const isUpcoming = (date: string) => {
  return new Date(date) > new Date();
};

// Loading, Auth, and Error Components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

const AuthRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <User className="w-10 h-10 text-orange-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
      <p className="text-lg text-gray-600 mb-6">Please log in to view your profile.</p>
      <Link 
        href="/auth" 
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors inline-flex items-center"
      >
        <User className="w-4 h-4 mr-2" />
        Sign In
      </Link>
    </div>
  </div>
);


const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-8">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Profile</h1>
      <p className="text-red-600 text-lg mb-4">{error}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

const ProfileHeader = ({ userInfo, user }: { userInfo: UserInfo | null; user: any }) => {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  // Notifications dropdown component
  const NotificationsButton = ({ notifications }: { notifications: Notification[] }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
        >
          <Bell className="w-4 md:w-5 h-4 md:h-5 text-gray-500" />
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
              className="absolute right-0 mt-2 w-70 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div className="p-4">
                <h3 className="font-semibold text-orange-600 mb-3">Notifications</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => router.push(`browse/notification?id=${notif.id}`)}
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
                  onClick={() => router.push(`/notifications`)}
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
  return (
  <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-orange-100">
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0">
        {userInfo?.profilePicture ? (
          <Image
            src={userInfo.profilePicture}
            alt="Profile"
            className="rounded-full border-2 border-orange-200 w-15 h-15 md:w-20 md:h-20"
          />
        ) : (
          <div className="w-15 h-15 md:w-20 md:h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border-2 border-orange-300">
            <span className="text-orange-800 text-sm md:text-xl font-semibold">
              {userInfo?.displayName?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex-1">
        <h1 className="text-[16px] md:text-2xl font-bold text-gray-900">
          {userInfo?.displayName || user.email}
        </h1>
        <p className="text-gray-600 text-xs md:text-[16px]">{user.email}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {Array.isArray(userInfo?.badges) && userInfo.badges.length > 0 ? (
            userInfo.badges.map((badge, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-[9px] md:text-xs font-medium ${getBadgeColor(badge)}`}
              >
                {badge}
              </span>
            ))
          ) : (
            <span className="px-3 py-1 rounded-full text-[9px] md:text-xs font-medium bg-purple-100 text-purple-800">
              New Member
            </span>
          )}
        </div>
      </div>
      <div className='md:flex space-y-1 md:space-x-4 -mt-1 md:-mt-0'>

        <NotificationsButton notifications={notification}/>

        {/* messages */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.location.href = '/sublease/search/list'}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <MessagesSquare className = "w-4 md:w-4 h-3 md:h-5 text-gray-600"/>
        </motion.button>

        {/* menu */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Menu className="w-4 md:w-5 h-4 md:h-5 text-gray-600" />
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  </div>
  );
}

// Main Navigation Cards Component
const MainNavigationCards = ({ onNavigate }: { onNavigate: (flow: NavigationFlow) => void }) => (
  <div className="max-w-4xl mx-auto">
    <div className="text-center mb-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h2>
      <p className="text-lg text-gray-600">Choose your activity to get started</p>
    </div>
    
    <div className="grid grid-cols-2 text-[10px] mt-16 md:text-lg gap-8">
      {/* Sublease Card */}
      <div 
        onClick={() => onNavigate('sublease')}
        className="group bg-white rounded-2xl shadow-lg border-2 border-orange-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
      >
        <div className="p-8 text-center">
          <div className="mb-6 mx-auto w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Building2 className="w-10 h-10 text-orange-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors">
            Sublease
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Find or offer temporary housing, manage tour requests, and connect with potential subletters
          </p>
          <div className="text-sm text-orange-600 font-medium group-hover:underline">
            Explore sublease options
          </div>
        </div>
      </div>

      {/* Move-Out Sale Card */}
      <div 
        onClick={() => onNavigate('moveout-sale')}
        className="group bg-white rounded-2xl shadow-lg border-2 border-green-100 hover:border-green-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
      >
        <div className="p-8 text-center">
          <div className="mb-6 mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Package className="w-10 h-10 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">
            Move-Out Sale
          </h3>
          <p className="text-gray-600 mb-4 leading-relaxed">
            Buy or sell furniture, electronics, and other items from students moving out
          </p>
          <div className="text-sm text-green-600 font-medium group-hover:underline">
            Browse or sell items
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Sublease Role Selection Component
const SubleaseRoleSelection = ({ 
  onBack, 
  onRoleSelect, 
  profileData 
}: { 
  onBack: () => void; 
  onRoleSelect: (role: UserRole) => void;
  profileData: ProfileData;
}) => {
  const pendingHostTours = profileData.hostTourRequests.filter(tour => tour.status === 'pending').length;
  const upcomingGuestTours = profileData.guestTourRequests.filter(tour => 
    tour.status === 'approved' && isUpcoming(tour.date)
  ).length;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-orange-600 hover:text-orange-700 font-medium transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to main menu
        </button>
      </div>
      
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 -mt-3">Sublease Dashboard</h2>
        <p className="text-sm md:text-lg -mt-3 text-gray-600">Choose your role to access the right tools</p>
      </div>
      
      <div className="grid grid-cols-2 text-[10px] md:text-lg gap-8 -mt-2">
        {/* Guest Card */}
        <div 
          onClick={() => onRoleSelect('guest')}
          className="group bg-white rounded-2xl shadow-lg border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-blue-600" />
              </div>
              {upcomingGuestTours > 0 && (
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {upcomingGuestTours} upcoming tour{upcomingGuestTours > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
              Guest Dashboard
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Browse available subleases, request tours, manage your applications, and connect with hosts
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center text-[10px] md:text-sm text-gray-600">
                <Search className="w-4 h-4 mr-3 text-blue-500" />
                Browse and search listings
              </div>
              <div className="flex items-center text-[10px] md:text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-3 text-blue-500" />
                Request and manage tours
              </div>
              <div className="flex items-center text-[10px] md:text-sm text-gray-600">
                <Bell className="w-4 h-4 mr-3 text-blue-500" />
                Track application status
              </div>
            </div>
            
            <div className="mt-4 md:mt-6 text-xs md:text-sm text-blue-600 font-medium group-hover:underline">
              Access guest dashboard
            </div>
          </div>
        </div>

        {/* Host Card */}
        <div 
          onClick={() => onRoleSelect('host')}
          className="group bg-white rounded-2xl shadow-lg border-2 border-purple-100 hover:border-purple-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Home className="w-8 h-8 text-purple-600" />
              </div>
              {pendingHostTours > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pendingHostTours} pending tour{pendingHostTours > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors">
              Host Dashboard
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Manage your listings, set tour availability, review applications, and communicate with potential subletters
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center text-[10px] md:text-sm text-gray-600">
                <Plus className="w-4 h-4 mr-3 text-purple-500" />
                Create and manage listings
              </div>
              <div className="flex items-center text-[10px] md:text-sm text-gray-600">
                <Settings className="w-4 h-4 mr-3 text-purple-500" />
                Set tour availability
              </div>
              <div className="flex items-center text-[10px] md:text-sm text-gray-600">
                <Users className="w-4 h-4 mr-3 text-purple-500" />
                Manage tour requests
              </div>
            </div>
            
            <div className="mt-6 text-xs md:text-sm text-blue-600 font-medium group-hover:underline">
              Access host dashboard
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Move-Out Sale Role Selection Component
const MoveOutSaleRoleSelection = ({ 
  onBack, 
  onRoleSelect, 
  profileData 
}: { 
  onBack: () => void; 
  onRoleSelect: (role: UserRole) => void;
  profileData: ProfileData;
}) => (
  <div className="max-w-4xl mx-auto">
    <div className="flex items-center mb-6">
      <button
        onClick={onBack}
        className="flex items-center text-green-600 hover:text-green-700 font-medium transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back to main menu
      </button>
    </div>
    
    <div className="text-center mb-8">
      <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 -mt-3">Move-Out Sale Dashboard</h2>
      <p className="text-sm md:text-lg text-gray-600 -mt-3">Buy or sell items from students moving out</p>
    </div>
    
    <div className="grid grid-cols-2 text-[10px] md:text-lg gap-8 -mt-2">
      {/* Buyer Card */}
      <div 
        onClick={() => onRoleSelect('buyer')}
        className="group bg-white rounded-2xl shadow-lg border-2 border-emerald-100 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
      >
        <div className="p-8">
          <div className="mb-6 w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <ShoppingCart className="w-8 h-8 text-emerald-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
            Buyer Dashboard
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Browse furniture, electronics, and other items being sold by students. Find great deals on quality items.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center text-[10px] md:text-sm text-gray-600">
              <Search className="w-4 h-4 mr-3 text-emerald-500" />
              Browse available items
            </div>
            <div className="flex items-center text-[10px] md:text-sm text-gray-600">
              <Eye className="w-4 h-4 mr-3 text-emerald-500" />
              View detailed photos and descriptions
            </div>
            <div className="flex items-center text-[10px] md:text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-3 text-emerald-500" />
              Find items near you
            </div>
          </div>
          
          <div className="mt-6 text-xs md:text-sm text-emerald-600 font-medium group-hover:underline">
            Start browsing items
          </div>
        </div>
      </div>

      {/* Seller Card */}
      <div 
        onClick={() => onRoleSelect('seller')}
        className="group bg-white rounded-2xl shadow-lg border-2 border-teal-100 hover:border-teal-300 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="w-20 md:w-8 h-8 text-teal-600" />
            </div>
              {profileData.hostSaleItems.length > 0 && (
                <span className="bg-teal-100 text-teal-800 px-3 py-1 transform translate-x-5 rounded-full text-[8px] md:text-sm font-medium overflow-hidden">
                  {profileData.hostSaleItems.length} active listing{profileData.hostSaleItems.length > 1 ? 's' : ''}
                </span>
              )}
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">
            Seller Dashboard
          </h3>
          <p className="text-gray-600 mb-6 leading-relaxed">
            List your furniture, electronics, and other items for sale. Easy listing creation and buyer communication.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center text-[10px] md:text-sm text-gray-600">
              <Plus className="w-4 h-4 mr-3 text-teal-500" />
              Create item listings
            </div>
            <div className="flex items-center text-[10px] md:text-sm text-gray-600">
              <Settings className="w-4 h-4 mr-3 text-teal-500" />
              Manage your items
            </div>
            <div className="flex items-center text-[10px] md:text-sm text-gray-600">
              <Users className="w-4 h-4 mr-3 text-teal-500" />
              Communicate with buyers
            </div>
          </div>
          
          <div className="mt-6 text-xs md:text-sm text-teal-600 font-medium group-hover:underline">
            Manage your items
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Clean Host Activity Component
const HostActivity = ({ 
  hostListings,
  hostSaleItems,  
  hostTourRequests, 
  hostAvailabilities,
  onOpenCalendarModal
}: { 
  hostListings: Listing[]; 
  hostTourRequests: TourRequest[];
  hostAvailabilities: HostAvailability[];
  onOpenCalendarModal: (listing: Listing) => void;
}) => {
  const pendingTours = hostTourRequests.filter(tour => tour.status === 'pending');
  const upcomingTours = hostTourRequests.filter(tour => 
    tour.status === 'approved' && isUpcoming(tour.date)
  );
  
  // Add this line to define listing
  const listing = hostListings.length > 0 ? hostListings[0] : null


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Host Dashboard</h2>
            <p className="text-gray-600">Manage your listings and tour requests</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              href="/sublease/" 
              className="inline-flex items-center text-xs md:text-[16px] mb-8 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Listing
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Active Listings</p>
                <p className="text-2xl font-bold text-blue-900">{hostListings.length}</p>
              </div>
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Tours</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingTours.length}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Upcoming Tours</p>
                <p className="text-2xl font-bold text-green-900">{upcomingTours.length}</p>
              </div>
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Available Settings</p>
                <p className="text-2xl font-bold text-purple-900">{hostAvailabilities.length}</p>
              </div>
              <Settings className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tour Management Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Tour Management</h3>
          <Link 
  href={`/sublease/search/${listing.id}/tour`}
  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
>
  View All Tours
</Link>
        </div>

        {/* Recent Tour Requests */}
        {hostTourRequests.length > 0 ? (
          <div className="space-y-4">
            {hostTourRequests.slice(0, 4).map(tour => (
              <div key={tour.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tour.status)}`}>
                        <div className="flex items-center">
                          {getStatusIcon(tour.status)}
                          <span className="ml-1 capitalize">{tour.status}</span>
                        </div>
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        {tour.tourType === 'virtual' ? (
                          <Video className="w-4 h-4 mr-1" />
                        ) : (
                          <Users className="w-4 h-4 mr-1" />
                        )}
                        <span className="capitalize">{tour.tourType} Tour</span>
                      </div>
                      {tour.status === 'approved' && isUpcoming(tour.date) && (
                        <span className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700 font-medium">
                          Upcoming
                        </span>
                      )}
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      {tour.guestName || 'Guest Request'}
                    </h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{tour.date} at {tour.time}</p>
                      <p className="truncate">{tour.listingTitle || `Property #${tour.listingId?.slice(-6)}`}</p>
                    </div>
                  </div>
                  {tour.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Tour Requests</h4>
            <p className="text-gray-500 mb-4">Tour requests will appear here when guests book tours for your listings</p>
            <Link 
              href="/profile/my-listings" 
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Manage Your Listings
            </Link>
          </div>
        )}
      </div>

      {/* Sublease Listings */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Your Sublease Listings</h3>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">{hostListings.length} total</span>
            <Link 
              href="/profile/my-listings" 
              className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors"
            >
              View All
            </Link>
          </div>
        </div>

        {hostListings.length > 0 ? (
          <div className="space-y-4">
            {hostListings.slice(0, 3).map(listing => {
              const availabilitySet = hostAvailabilities.some(avail => avail.listingId === listing.id);
              let statusColor = 'bg-green-100 text-green-800';
              let statusText = 'Available';
              
              if (listing.status === 'unavailable') {
                statusColor = 'bg-red-100 text-red-800';
                statusText = 'Unavailable';
              } else if (listing.status === 'rented') {
                statusColor = 'bg-blue-100 text-blue-800';
                statusText = 'Rented';
              }
              
              return (
                <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">
                          {listing.address || listing.location || 'Location not specified'}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusText}
                        </span>
                        {listing.partialDatesOk && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Flexible Dates
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <p>Created: {formatDate(listing.createdAt)}</p>
                          {listing.bedrooms && listing.bathrooms && (
                            <p className="flex items-center mt-1">
                              <Home className="w-4 h-4 mr-1" />
                              {listing.bedrooms} bed • {listing.bathrooms} bath
                            </p>
                          )}
                        </div>
                        <div>
                          {(listing.availableFrom || listing.availableTo) && (
                            <p className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {listing.availableFrom ? formatDate(listing.availableFrom) : ''} - {listing.availableTo ? formatDate(listing.availableTo) : ''}
                            </p>
                          )}
                          <div className="flex items-center mt-1">
                            {availabilitySet ? (
                              <span className="text-green-600 text-sm flex items-center">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Tours enabled
                              </span>
                            ) : (
                              <span className="text-yellow-600 text-sm flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Setup tour availability
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <Link 
                        href={`/listing/${listing.id}`}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors text-center"
                      >
                        View
                      </Link>
                      {!availabilitySet && (
                        <Link 
                          href={`/sublease/search/${id}/tour`}
                          className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors text-center"
                        >
                          Setup Tours
                        </Link>
                      )}
                      {listing.partialDatesOk && (
  <button
    onClick={() => onOpenCalendarModal(listing)}  // CHANGE THIS
    className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors"
  >
    Manage Calendar
  </button>
)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Listings Yet</h4>
            <p className="text-gray-500 mb-4">Create your first sublease listing to start hosting</p>
            <Link 
              href="/create-listing" 
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Clean Guest Activity Component
const GuestActivity = ({ guestTourRequests }: { guestTourRequests: TourRequest[] }) => {
  const pendingTours = guestTourRequests.filter(tour => tour.status === 'pending');
  const approvedTours = guestTourRequests.filter(tour => tour.status === 'approved');
  const upcomingTours = approvedTours.filter(tour => isUpcoming(tour.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Guest Dashboard</h2>
            <p className="text-gray-600">Manage your tour requests and applications</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link 
              href="/sublease/search" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-sm md:text-[16px] text-white rounded-lg hover:bg-blue-700 transition-colors -mt-7 md:-mt-8"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Listings
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Pending Tours</p>
                <p className="text-2xl font-bold text-yellow-900">{pendingTours.length}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Approved Tours</p>
                <p className="text-2xl font-bold text-green-900">{approvedTours.length}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Upcoming Tours</p>
                <p className="text-2xl font-bold text-blue-900">{upcomingTours.length}</p>
              </div>
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tour Requests */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Your Tour Requests</h3>
          <Link 
            href="/sublease/search/${listing.id}/tour/" 
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            View All Tours
          </Link>
        </div>

        {guestTourRequests.length > 0 ? (
          <div className="space-y-4">
            {guestTourRequests.slice(0, 4).map(request => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        <div className="flex items-center">
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </div>
                      </span>
                      <div className="flex items-center text-sm text-gray-500">
                        {request.tourType === 'virtual' ? (
                          <Video className="w-4 h-4 mr-1" />
                        ) : (
                          <Users className="w-4 h-4 mr-1" />
                        )}
                        <span className="capitalize">{request.tourType} Tour</span>
                      </div>
                      {request.status === 'approved' && isUpcoming(request.date) && (
                        <span className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-700 font-medium">
                          Upcoming
                        </span>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-900 mb-1">
                      {request.listingTitle || `Property #${request.listingId?.slice(-6)}`}
                    </h4>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{request.date} at {request.time}</p>
                      <p>Host: {request.hostName || 'TBD'}</p>
                      {request.listingLocation && (
                        <p className="flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {request.listingLocation}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {request.status === 'approved' && isUpcoming(request.date) && (
                    <div className="text-right">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors">
                        Join Tour
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Tour Requests</h4>
            <p className="text-gray-500 mb-4">Start exploring listings to request your first tour</p>
            <Link 
              href="/sublease/search/" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Listings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

// Clean Conversations Component
const RecentConversations = ({ 
  conversations, 
  user, 
  selectedRole, 
  navigationFlow 
}: { 
  conversations: Conversation[]; 
  user?: any; 
  selectedRole?: UserRole | null;
  navigationFlow?: NavigationFlow;
}) => {
  // Filter conversations based on role and navigation flow
  const filteredConversations = conversations.filter(conversation => {
    const isUserHost = conversation.hostId === user?.uid;
    const conversationType = conversation.conversationType || 'sublease';
    
    // Filter by navigation flow (sublease vs moveout-sale)
    if (navigationFlow === 'sublease' && conversationType === 'moveout') return false;
    if (navigationFlow === 'moveout-sale' && conversationType !== 'moveout') return false;
    
    // Filter by selected role
    if (selectedRole === 'host' && (!isUserHost || conversationType !== 'sublease')) return false;
    if (selectedRole === 'guest' && (isUserHost || conversationType !== 'sublease')) return false;
    if (selectedRole === 'seller' && (!isUserHost || conversationType !== 'moveout')) return false;
    if (selectedRole === 'buyer' && (isUserHost || conversationType !== 'moveout')) return false;
    
    return true;
  });

  const getConversationTitle = () => {
    if (!selectedRole) return 'Recent Conversations';
    
    switch (selectedRole) {
      case 'host': return 'Host Conversations';
      case 'guest': return 'Guest Conversations';
      case 'seller': return 'Seller Conversations';
      case 'buyer': return 'Buyer Conversations';
      default: return 'Recent Conversations';
    }
  };

  const getEmptyStateMessage = () => {
    if (!selectedRole) return 'No conversations yet.';
    
    switch (selectedRole) {
      case 'host': return 'No hosting conversations yet.';
      case 'guest': return 'No guest conversations yet.';
      case 'seller': return 'No selling conversations yet.';
      case 'buyer': return 'No buying conversations yet.';
      default: return 'No conversations yet.';
    }
  };

  const getEmptyStateAction = () => {
    if (!selectedRole) return 'Start connecting with other users!';
    
    switch (selectedRole) {
      case 'host': return 'Create a sublease listing to start hosting!';
      case 'guest': return 'Browse sublease listings to start conversations!';
      case 'seller': return 'List items for sale to start selling!';
      case 'buyer': return 'Browse items to start buying conversations!';
      default: return 'Start connecting with other users!';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">{getConversationTitle()}</h3>
        <Link 
          href="/sublease/search/list" 
          className="text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors overflow-hidden"
        >
          View All Messages
        </Link>
      </div>

      {filteredConversations.length > 0 ? (
        <div className="space-y-4">
          {filteredConversations.map(conversation => {
            // Determine if user is host or guest
            const isUserHost = conversation.hostId === user?.uid;
            const conversationType = conversation.conversationType || 'sublease';
            
            return (
              <div key={conversation.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors cursor-pointer">
                <div className="flex items-start space-x-3">
                  {/* Listing/Item Image */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative bg-gray-100">
                    <img 
                      src={conversation.listingImage || '/api/placeholder/48/48'}
                      alt={conversation.listingTitle || 'Listing'}
                      className="w-full h-full object-cover"
                    />
                    {/* Type indicator */}
                    <div className="absolute top-1 right-1 bg-white rounded-full p-1">
                      {conversationType === 'moveout' ? (
                        <Package className="w-2 h-2 text-orange-600" />
                      ) : (
                        <Home className="w-2 h-2 text-orange-600" />
                      )}
                    </div>
                  </div>

                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm truncate mb-1">
                          {conversation.listingTitle || (conversationType === 'sublease' ? 'Untitled Listing' : 'Untitled Item')}
                        </h4>
                        
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isUserHost 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {isUserHost 
                              ? (conversationType === 'sublease' ? 'Hosting' : 'Selling')
                              : (conversationType === 'sublease' ? 'Guest' : 'Buying')
                            }
                          </span>
                          <span className="text-sm text-gray-500">with {conversation.otherParticipantName}</span>
                        </div>
                        
                        {/* Location and Price */}
                        {(conversation.listingLocation || conversation.listingPrice) && (
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            {conversation.listingLocation && (
                              <>
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{conversation.listingLocation}</span>
                              </>
                            )}
                            {conversation.listingPrice && (
                              <>
                                {conversation.listingLocation && <span className="mx-1">•</span>}
                                <span>${conversation.listingPrice}{conversationType === 'sublease' ? '/mo' : ''}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Latest Message Preview */}
                        {conversation.lastMessage && (
                          <div className="text-xs text-gray-600">
                            <span className="truncate">
                              "{conversation.lastMessage}"
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end ml-2">
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full mt-1">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Conversations</h4>
          <p className="text-gray-500 mb-2">{getEmptyStateMessage()}</p>
          <p className="text-sm text-gray-400">{getEmptyStateAction()}</p>
        </div>
      )}
    </div>
  );
};

// Clean Buyer Dashboard
const BuyerDashboard = ({ profileData }: { profileData: ProfileData }) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Buyer Dashboard</h2>
          <p className="text-gray-600">Find great deals on items from students moving out</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href="/browse-sale-items" 
            className="inline-flex items-center text-sm md:text-[16px] -mt-7 md:-mt-8 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Search className="w-4 h-4 mr-2" />
            Browse Items
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link 
          href="/browse-sale-items" 
          className="flex items-center justify-between p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-colors group"
        >
          <div className="flex items-center">
            <Search className="w-6 h-6 mr-3 text-emerald-600" />
            <div>
              <p className="font-medium text-gray-900">Browse All Items</p>
              <p className="text-sm text-gray-600">Explore all available items</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-emerald-600 rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <Link 
          href="/browse-sale-items?category=furniture" 
          className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors group"
        >
          <div className="flex items-center">
            <Home className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Furniture</p>
              <p className="text-sm text-gray-600">Desks, chairs, and more</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-blue-600 rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <Link 
          href="/browse-sale-items?category=electronics" 
          className="flex items-center justify-between p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 hover:border-purple-300 transition-colors group"
        >
          <div className="flex items-center">
            <Settings className="w-6 h-6 mr-3 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900">Electronics</p>
              <p className="text-sm text-gray-600">Laptops, monitors, and more</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-purple-600 rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>

    {/* Recent Activity */}
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Shopping Activity</h3>
      
      <div className="text-center py-8">
        <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">Start Your Shopping Journey</h4>
        <p className="text-gray-500 mb-4">Browse items from students in your area and find great deals</p>
        <Link 
          href="/browse-sale-items"
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Search className="w-4 h-4 mr-2" />
          Start Browsing
        </Link>
      </div>
    </div>
  </div>
);

// Clean Seller Dashboard
const SellerDashboard = ({ profileData }: { profileData: ProfileData }) => (
  <div className="space-y-6">
    {/* Header */}
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Seller Dashboard</h2>
          <p className="text-gray-600">Manage your item listings and sales</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            href="/create-sale-item" 
            className="inline-flex items-center text-xs md:text-[16px] mb-8 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Item
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-lg border border-teal-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-teal-800">Active Items</p>
              <p className="text-2xl font-bold text-teal-900">{profileData.hostSaleItems.length}</p>
            </div>
            <Package className="w-6 h-6 text-teal-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Views</p>
              <p className="text-2xl font-bold text-green-900">0</p>
            </div>
            <Eye className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Messages</p>
              <p className="text-2xl font-bold text-blue-900">0</p>
            </div>
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>

    {/* Quick Actions */}
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          href="/create-sale-item" 
          className="flex items-center justify-between p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200 hover:border-teal-300 transition-colors group"
        >
          <div className="flex items-center">
            <Plus className="w-6 h-6 mr-3 text-teal-600" />
            <div>
              <p className="font-medium text-gray-900">Create New Listing</p>
              <p className="text-sm text-gray-600">List a new item for sale</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-teal-600 rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
        
        <Link 
          href="/profile/my-sale-items/" 
          className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 hover:border-blue-300 transition-colors group"
        >
          <div className="flex items-center">
            <Settings className="w-6 h-6 mr-3 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900">Manage Items</p>
              <p className="text-sm text-gray-600">Edit and update your listings</p>
            </div>
          </div>
          <ArrowLeft className="w-4 h-4 text-blue-600 rotate-180 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>

    {/* Your Items */}
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Your Sale Items</h3>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">{profileData.hostSaleItems.length} total</span>
          <Link 
            href="/profile/my-sale-items" 
            className="text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
          >
            View All
          </Link>
        </div>
      </div>

      {profileData.hostSaleItems.length > 0 ? (
        <div className="space-y-4">
          {profileData.hostSaleItems.slice(0, 3).map(item => (
            <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{item.category}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.pickupAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.pickupAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Created: {formatDate(item.createdAt)}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors">
                    Edit
                  </button>
                  <button className="px-3 py-1 bg-teal-100 text-teal-700 rounded text-xs hover:bg-teal-200 transition-colors">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Items Listed</h4>
          <p className="text-gray-500 mb-4">Start selling your items to other students</p>
          <Link 
            href="/create-sale-item"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Item
          </Link>
        </div>
      )}
    </div>

    {/* Selling Tips */}
    <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Selling Tips</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>Take clear, well-lit photos from multiple angles</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>Write detailed descriptions including condition and dimensions</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>Price competitively by checking similar items</p>
          </div>
          <div className="flex items-start">
            <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p>Respond to messages quickly to build trust</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Clean Profile Stats Component
const ProfileStats = ({ profileData }: { profileData: ProfileData }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
    <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Overview</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
        <div className="flex items-center justify-center mb-2">
          <Building2 className="w-5 h-5 text-orange-600 mr-2" />
          <p className="text-2xl font-bold text-orange-600">{profileData.hostListings.length}</p>
        </div>
        <p className="text-sm text-gray-600">Active Listings</p>
      </div>
      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
        <div className="flex items-center justify-center mb-2">
          <Package className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-2xl font-bold text-green-600">{profileData.hostSaleItems.length}</p>
        </div>
        <p className="text-sm text-gray-600">Sale Items</p>
      </div>
      <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
        <div className="flex items-center justify-center mb-2">
          <Calendar className="w-5 h-5 text-purple-600 mr-2" />
          <p className="text-2xl font-bold text-purple-600">{profileData.guestTourRequests.length}</p>
        </div>
        <p className="text-sm text-gray-600">Tour Requests</p>
      </div>
      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
        <div className="flex items-center justify-center mb-2">
          <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
          <p className="text-2xl font-bold text-blue-600">{profileData.conversations.length}</p>
        </div>
        <p className="text-sm text-gray-600">Conversations</p>
      </div>
    </div>
  </div>
);


const CalendarManagementModal = ({ 
  listing, 
  isOpen, 
  onClose 
}: { 
  listing: Listing | null; 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);

  // Fetch unavailable dates when modal opens
  useEffect(() => {
    if (isOpen && listing?.id) {
      fetchUnavailableDates();
      // Set current month to listing's start date
      if (listing.availableFrom) {
        const startDate = listing.availableFrom.toDate ? listing.availableFrom.toDate() : new Date(listing.availableFrom);
        setCurrentMonth(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
      }
    }
  }, [isOpen, listing?.id]);

  const fetchUnavailableDates = async () => {
    if (!listing?.id) return;
    
    try {
      setLoading(true);
      const docRef = doc(db, 'listings', listing.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const unavailable = data.unavailableDates || [];
        setUnavailableDates(unavailable);
      }
    } catch (error) {
      console.error('Error fetching unavailable dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUnavailableDates = async (dates: string[]) => {
    if (!listing?.id) return;
    
    try {
      const docRef = doc(db, 'listings', listing.id);
      await updateDoc(docRef, {
        unavailableDates: dates,
        updatedAt: serverTimestamp()
      });
      console.log('Unavailable dates saved successfully');
    } catch (error) {
      console.error('Error saving unavailable dates:', error);
      alert('Failed to save unavailable dates. Please try again.');
    }
  };

  const formatDateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const isDateUnavailable = (date: Date): boolean => {
    const dateString = formatDateString(date);
    return unavailableDates.includes(dateString);
  };

  const isDateInRange = (date: Date): boolean => {
    if (!listing?.availableFrom || !listing?.availableTo) return false;
    
    const availableFrom = listing.availableFrom.toDate ? listing.availableFrom.toDate() : new Date(listing.availableFrom);
    const availableTo = listing.availableTo.toDate ? listing.availableTo.toDate() : new Date(listing.availableTo);
    
    return date >= availableFrom && date <= availableTo;
  };

  const handleDateClick = (date: Date) => {
    if (!isDateInRange(date)) return;
    
    const dateString = formatDateString(date);
    
    if (isSelectingRange) {
      if (!rangeStart) {
        setRangeStart(date);
      } else {
        // Complete the range selection
        const start = rangeStart <= date ? rangeStart : date;
        const end = rangeStart <= date ? date : rangeStart;
        
        const datesInRange: string[] = [];
        const currentDate = new Date(start);
        
        while (currentDate <= end) {
          datesInRange.push(formatDateString(new Date(currentDate)));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Toggle availability for the range
        const newUnavailableDates = [...unavailableDates];
        const allInRangeUnavailable = datesInRange.every(d => unavailableDates.includes(d));
        
        if (allInRangeUnavailable) {
          // Remove all dates in range
          datesInRange.forEach(d => {
            const index = newUnavailableDates.indexOf(d);
            if (index > -1) newUnavailableDates.splice(index, 1);
          });
        } else {
          // Add all dates in range
          datesInRange.forEach(d => {
            if (!newUnavailableDates.includes(d)) {
              newUnavailableDates.push(d);
            }
          });
        }
        
        setUnavailableDates(newUnavailableDates);
        saveUnavailableDates(newUnavailableDates);
        setRangeStart(null);
        setIsSelectingRange(false);
      }
    } else {
      // Single date toggle
      const newUnavailableDates = [...unavailableDates];
      const index = newUnavailableDates.indexOf(dateString);
      
      if (index > -1) {
        newUnavailableDates.splice(index, 1);
      } else {
        newUnavailableDates.push(dateString);
      }
      
      setUnavailableDates(newUnavailableDates);
      saveUnavailableDates(newUnavailableDates);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  if (!isOpen) return null;

  const days = getDaysInMonth(currentMonth);
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const availableFrom = listing?.availableFrom ? 
    (listing.availableFrom.toDate ? listing.availableFrom.toDate() : new Date(listing.availableFrom)) : 
    new Date();
  const availableTo = listing?.availableTo ? 
    (listing.availableTo.toDate ? listing.availableTo.toDate() : new Date(listing.availableTo)) : 
    new Date();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Availability</h2>
              <p className="text-sm text-gray-600">
                {listing?.address || listing?.location || 'Listing'} • 
                {formatDate(listing?.availableFrom)} - {formatDate(listing?.availableTo)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            </div>
          ) : (
            <>
             

              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIsSelectingRange(!isSelectingRange)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isSelectingRange 
                      ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-300'
                  }`}
                >
                  {isSelectingRange ? 'Cancel Range Selection' : 'Select Date Range'}
                </button>
                
                {rangeStart && (
                  <span className="text-sm text-gray-600">
                    Range start: {formatDateString(rangeStart)}
                  </span>
                )}
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    disabled={currentMonth < new Date(availableFrom.getFullYear(), availableFrom.getMonth(), 1)}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h4 className="font-medium text-lg">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h4>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-md"
                    disabled={currentMonth > new Date(availableTo.getFullYear(), availableTo.getMonth(), 1)}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayNames.map(day => (
                    <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-2"></div>;
                    }
                    
                    const isInRange = isDateInRange(day);
                    const isUnavailable = isDateUnavailable(day);
                    const isRangeStartDate = rangeStart && formatDateString(day) === formatDateString(rangeStart);
                    
                    let dayClasses = "p-2 text-center text-sm rounded-md cursor-pointer transition-colors ";
                    
                    if (!isInRange) {
                      dayClasses += "text-gray-300 cursor-not-allowed bg-gray-50";
                    } else if (isUnavailable) {
                      dayClasses += "bg-red-100 text-red-800 hover:bg-red-200";
                    } else {
                      dayClasses += "bg-green-100 text-green-800 hover:bg-green-200";
                    }
                    
                    if (isRangeStartDate) {
                      dayClasses += " ring-2 ring-orange-500";
                    }
                    
                    return (
                      <div
                        key={index}
                        className={dayClasses}
                        onClick={() => handleDateClick(day)}
                      >
                        {day.getDate()}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-center space-x-6 text-sm mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded mr-2"></div>
                  <span className="text-gray-600">Unavailable</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-2"></div>
                  <span className="text-gray-600">Outside range</span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};



// Main Profile Component
const UserProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { conversations, loading: conversationsLoading } = useConversationsWithNames(user?.uid);
  const [navigationFlow, setNavigationFlow] = useState<NavigationFlow>('main');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [selectedListingForCalendar, setSelectedListingForCalendar] = useState<Listing | null>(null);

  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    userInfo: null,
    hostListings: [],
    hostSaleItems: [],
    guestTourRequests: [],
    hostTourRequests: [],
    hostAvailabilities: [],
    conversations: [],
    loading: true,
    error: null
  });

  // Fetch user profile data
  const fetchUserProfile = async () => {
    if (!user?.uid) return;
    
    try {
      setProfileData(prev => ({ ...prev, loading: true }));
      
      // Fetch user information
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userInfo: UserInfo | null = userDoc.exists() 
        ? { id: userDoc.id, ...userDoc.data() } as UserInfo
        : null;

      // Fetch host listings
      let hostListings: Listing[] = [];
      try {
        const listingsQuery = query(
          collection(db, 'listings'),
          where('hostId', '==', user.uid)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        hostListings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Listing));
        hostListings.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });
      } catch (error) {
        console.log('Listings collection might not exist or no index, using saleItems');
        hostListings = [];
      }

      // Fetch host sale items
      const hostSaleItemsQuery = query(
        collection(db, 'saleItems'),
        where('hostId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const hostSaleItemsSnapshot = await getDocs(hostSaleItemsQuery);
      const hostSaleItems: SaleItem[] = hostSaleItemsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SaleItem));

      // Fetch guest tour requests
      const guestTourRequestsQuery = query(
        collection(db, 'tourRequests'),
        where('guestId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const guestTourRequestsSnapshot = await getDocs(guestTourRequestsQuery);
      const guestTourRequests: TourRequest[] = guestTourRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TourRequest));

      // Fetch host tour requests (tours requested for host's properties)
      const hostTourRequestsQuery = query(
        collection(db, 'tourRequests'),
        where('hostId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const hostTourRequestsSnapshot = await getDocs(hostTourRequestsQuery);
      const hostTourRequests: TourRequest[] = hostTourRequestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as TourRequest));

      // Fetch host availability settings
      let hostAvailabilities: HostAvailability[] = [];
      try {
        const availabilityQuery = query(
          collection(db, 'hostAvailability'),
          where('hostId', '==', user.uid)
        );
        const availabilitySnapshot = await getDocs(availabilityQuery);
        hostAvailabilities = availabilitySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as HostAvailability));
      } catch (error) {
        console.log('Host availability collection might not exist');
        hostAvailabilities = [];
      }

      setProfileData({
        userInfo,
        hostListings,
        hostSaleItems,
        guestTourRequests,
        hostTourRequests,
        hostAvailabilities,
        conversations: [],
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      setProfileData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load profile data'
      }));
    }
  };

  // Navigation handlers
  const handleNavigate = (flow: NavigationFlow) => {
    setNavigationFlow(flow);
    setSelectedRole(null);
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleBack = () => {
    setNavigationFlow('main');
    setSelectedRole(null);
  };

  // Effects
  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchUserProfile();
    } else if (!authLoading && !user) {
      setProfileData(prev => ({ ...prev, loading: false }));
    }
  }, [user, authLoading]);

  // Render loading state
  if (authLoading || profileData.loading) {
    return <LoadingSpinner />;
  }

  // Render auth required state
  if (!user) {
    return <AuthRequired />;
  }

  // Render error state
  if (profileData.error) {
    return <ErrorState error={profileData.error} onRetry={fetchUserProfile} />;
  }

  // Render main profile with progressive navigation
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Profile Header */}
        <ProfileHeader userInfo={profileData.userInfo} user={user} />

        {/* Progressive Navigation Content */}
        {navigationFlow === 'main' && (
          <MainNavigationCards onNavigate={handleNavigate} />
        )}

        {navigationFlow === 'sublease' && !selectedRole && (
          <SubleaseRoleSelection 
            onBack={handleBack}
            onRoleSelect={handleRoleSelect}
            profileData={profileData}
          />
        )}

        {navigationFlow === 'moveout-sale' && !selectedRole && (
          <MoveOutSaleRoleSelection 
            onBack={handleBack}
            onRoleSelect={handleRoleSelect}
            profileData={profileData}
          />
        )}

        {/* Role-specific content */}
        {selectedRole && (
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
              <button
                onClick={() => setSelectedRole(null)}
                className="flex items-center text-gray-600 hover:text-gray-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to {navigationFlow === 'sublease' ? 'sublease' : 'move-out sale'} options
              </button>
            </div>

            {/* Sublease Guest Dashboard */}
            {selectedRole === 'guest' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GuestActivity guestTourRequests={profileData.guestTourRequests} />
                <RecentConversations 
                  conversations={conversations} 
                  user={user} 
                  selectedRole={selectedRole}
                  navigationFlow={navigationFlow}
                />
              </div>
            )}

            {/* Sublease Host Dashboard */}
            {selectedRole === 'host' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HostActivity 
                  hostListings={profileData.hostListings} 
                  hostSaleItems={profileData.hostSaleItems}
                  hostTourRequests={profileData.hostTourRequests}
                  hostAvailabilities={profileData.hostAvailabilities}
                  onOpenCalendarModal={(listing) => {  // ADD THIS
                    setSelectedListingForCalendar(listing);
                    setShowCalendarModal(true);
                  }}
                />
                <div className="space-y-6">
                  <RecentConversations 
                    conversations={conversations} 
                    user={user} 
                    selectedRole={selectedRole}
                    navigationFlow={navigationFlow}
                  />
                  <ProfileStats profileData={{...profileData, conversations}} />
                </div>
              </div>
            )}

            {/* Move-Out Sale Buyer Dashboard */}
            {selectedRole === 'buyer' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <BuyerDashboard profileData={profileData} />
                <RecentConversations 
                  conversations={conversations} 
                  user={user} 
                  selectedRole={selectedRole}
                  navigationFlow={navigationFlow}
                />
              </div>
            )}

            {/* Move-Out Sale Seller Dashboard */}
            {selectedRole === 'seller' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SellerDashboard profileData={profileData} />
                <div className="space-y-6">
                  <RecentConversations 
                    conversations={conversations} 
                    user={user} 
                    selectedRole={selectedRole}
                    navigationFlow={navigationFlow}
                  />
                  <ProfileStats profileData={{...profileData, conversations}} />
                </div>
              </div>
              
            )}


            
          </div>
        )}

        
      </div> <CalendarManagementModal
        listing={selectedListingForCalendar}
        isOpen={showCalendarModal}
        onClose={() => {
          setShowCalendarModal(false);
          setSelectedListingForCalendar(null);
        }}
      />
    </div>
  );
};

export default UserProfile;