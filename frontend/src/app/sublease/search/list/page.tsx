"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, Search, User, ChevronLeft, Clock, 
  Star, MapPin, Calendar, Bell, Filter, X, Home,
  Heart, Plus, Package, Menu, MessagesSquare
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, increment, limit, getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import { motion, AnimatePresence } from "framer-motion";

const ConversationListPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'unread', 'hosting', 'guest'
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('sublease'); // 'sublease' or 'moveout'
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Handle profile dropdown navigation
  const handleTabClick = (tab) => {
    switch(tab) {
      case "purchased":
        router.push('/profile/purchased');
        break;
      case "returned":
        router.push('/profile/returned');
        break;
      case "cancelled":
        router.push('/profile/cancelled');
        break;
      case "sold":
        router.push('/profile/sold');
        break;
      case "sublease":
        router.push('/sublease/search');
        break;
      case "reviews":
        router.push('/profile/reviews');
        break;
      case "history":
        router.push('/profile/history');
        break;
      default:
        break;
    }
    setShowProfile(false);
  };

  // Load notifications
  useEffect(() => {
    // Mock notifications - replace with actual data fetching
    setNotifications([
      {
        id: 1,
        message: "New message from John about your sublease listing",
        time: "2 minutes ago"
      },
      {
        id: 2,
        message: "Your move out sale item was purchased",
        time: "1 hour ago"
      }
    ]);
  }, []);

  // Set login status based on user
  useEffect(() => {
    setIsLoggedIn(!!user?.uid);
  }, [user]);

  // Real-time conversation listener
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log('Setting up conversation listener for user:', user.uid);

    // Query conversations where user is a participant
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      async (snapshot) => {
        const conversationPromises = snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          
          // Determine if user is host or guest for this conversation
          const isUserHost = data.hostId === user.uid;
          const otherParticipant = isUserHost ? {
            id: data.guestId,
            name: data.guestName,
            email: data.guestEmail,
            image: data.guestImage || '/api/placeholder/40/40'
          } : {
            id: data.hostId,
            name: data.hostName,
            email: data.hostEmail,
            image: data.hostImage || '/api/placeholder/40/40'
          };

          // Get the latest message from the messages subcollection
          let latestMessage = null;
          try {
            const messagesQuery = query(
              collection(db, 'conversations', docSnap.id, 'messages'),
              orderBy('createdAt', 'desc'),
              limit(1)
            );
            const messagesSnapshot = await getDocs(messagesQuery);
            if (!messagesSnapshot.empty) {
              const messageData = messagesSnapshot.docs[0].data();
              latestMessage = {
                id: messagesSnapshot.docs[0].id,
                text: messageData.text || messageData.content || '',
                senderId: messageData.senderId,
                createdAt: messageData.createdAt?.toDate() || new Date()
              };
            }
          } catch (error) {
            console.error('Error fetching latest message:', error);
          }

          return {
            id: docSnap.id,
            ...data,
            isUserHost,
            otherParticipant,
            latestMessage,
            // Convert Firestore timestamps
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            // Calculate unread count for current user
            unreadCount: isUserHost ? (data.hostUnreadCount || 0) : (data.guestUnreadCount || 0),
            // Determine conversation type based on listing type or collection
            conversationType: data.conversationType || (data.listingType === 'moveout' ? 'moveout' : 'sublease')
          };
        });

        const conversationData = await Promise.all(conversationPromises);
        console.log('Loaded conversations:', conversationData);
        setConversations(conversationData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Filter conversations based on tab, search and filter type
  const filteredConversations = conversations.filter(conversation => {
    // Tab filter - separate sublease and moveout conversations
    const matchesTab = activeTab === 'sublease' 
      ? conversation.conversationType !== 'moveout'
      : conversation.conversationType === 'moveout';

    // Search filter
    const matchesSearch = !searchTerm || 
      conversation.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.otherParticipant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.listingLocation?.toLowerCase().includes(searchTerm.toLowerCase());

    // Type filter
    let matchesType = true;
    switch (filterType) {
      case 'unread':
        matchesType = conversation.unreadCount > 0;
        break;
      case 'hosting':
        matchesType = conversation.isUserHost;
        break;
      case 'guest':
        matchesType = !conversation.isUserHost;
        break;
      default:
        matchesType = true;
    }

    return matchesTab && matchesSearch && matchesType;
  });

  // Get counts for each tab
  const subleaseConversations = conversations.filter(conv => conv.conversationType !== 'moveout');
  const moveoutConversations = conversations.filter(conv => conv.conversationType === 'moveout');
  const subleaseUnreadCount = subleaseConversations.reduce((total, conv) => total + conv.unreadCount, 0);
  const moveoutUnreadCount = moveoutConversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Navigate to conversation
  const openConversation = async (conversationId) => {
    router.push(`/sublease/search/${conversationId}/message`);
  };

  // Format time display
  const formatTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };
  
  // Notifications dropdown component
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

  // Get total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Show loading spinner while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center ">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">Sign In Required</h2>
          <p className="text-gray-500 mb-4">Please sign in to view your messages</p>
          <button 
            onClick={() => router.push('/auth/')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <ul className="space-y-2 ">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <li><a href="/sale/browse" className="text-2xl font-bold text-gray-900">Subox</a></li>
              <span className="text-sm text-gray-500 hidden sm:block">Move Out Sales</span> 
            </div>
            </ul>

            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationsButton notifications={notifications} />

              {/* Favorites */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
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
                        <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Purchased</button>
                        <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Returned</button>
                        <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Cancelled</button>
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
                            router.push('../browse');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Browse Items
                        </button>                        
                        <button 
                          onClick={() => {
                            router.push('/sale/create');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Sell Items
                        </button> 
                        <button 
                          onClick={() => {
                            router.push('/sale/create');
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
                            router.push('../search');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
                          Find Sublease
                        </button>   
                        <button 
                          onClick={() => {
                            router.push('../search');
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
                            router.push('../sale/browse');
                            setShowMenu(false);
                          }} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                        >
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
      
      {/* Main Content */}
      <div className=" mt-6 pt-16 md:pt-0 max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/sublease/search')}
              className="flex items-center text-orange-600 hover:text-orange-800 mr-4 font-medium cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <div>
              <h1 className="text-2xl font-bold text-orange-900 flex items-center">
                <MessageCircle className="w-6 h-6 mr-2" />
                Messages
                {totalUnreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600">Your conversations about listings</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-white rounded-lg shadow hover:shadow-md transition flex items-center"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-1">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('sublease')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition ${
                activeTab === 'sublease'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Home className="w-4 h-4 mr-2" />
              <span className="font-medium">Sublease</span>
              {subleaseUnreadCount > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === 'sublease' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {subleaseUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('moveout')}
              className={`flex-1 flex items-center justify-center px-4 py-3 rounded-md transition ${
                activeTab === 'moveout'
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4 mr-2" />
              <span className="font-medium">Move Out Sale</span>
              {moveoutUnreadCount > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === 'moveout' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {moveoutUnreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'sublease' ? 'sublease' : 'move out sale'} conversations...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Conversations' },
                { key: 'unread', label: 'Unread' },
                { key: 'hosting', label: activeTab === 'sublease' ? 'As Host' : 'As Seller' },
                { key: 'guest', label: activeTab === 'sublease' ? 'As Guest' : 'As Buyer' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key)}
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    filterType === filter.key
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              {activeTab === 'sublease' ? (
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              ) : (
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              )}
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {searchTerm || filterType !== 'all' ? 'No conversations found' : `No ${activeTab === 'sublease' ? 'sublease' : 'move out sale'} messages yet`}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : activeTab === 'sublease'
                    ? 'Start browsing sublease listings to connect with hosts'
                    : 'Start browsing move out sale items to connect with sellers'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => router.push(activeTab === 'sublease' ? '/sublease/search' : '/sale/browse')}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                >
                  Browse {activeTab === 'sublease' ? 'Sublease Listings' : 'Move Out Sale Items'}
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => openConversation(conversation.id)}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition"
                >
                  <div className="flex items-start space-x-4">
                    {/* Listing Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={conversation.listingImage || '/api/placeholder/64/64'}
                        alt={conversation.listingTitle || 'Listing'}
                        className="w-full h-full object-cover"
                      />
                      {/* Type indicator */}
                      <div className="absolute top-1 right-1">
                        {conversation.conversationType === 'moveout' ? (
                          <Package className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                        ) : (
                          <Home className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {conversation.listingTitle || (activeTab === 'sublease' ? 'Untitled Listing' : 'Untitled Item')}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs mr-2 ${
                              conversation.isUserHost 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {conversation.isUserHost 
                                ? (activeTab === 'sublease' ? 'Hosting' : 'Selling')
                                : (activeTab === 'sublease' ? 'Guest' : 'Buying')
                              }
                            </span>
                            <span>with {conversation.otherParticipant.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {conversation.listingLocation}
                            <span className="mx-2">•</span>
                            <span>${conversation.listingPrice}{activeTab === 'sublease' ? '/mo' : ''}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end ml-4">
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Latest Message Preview */}
                      {conversation.latestMessage && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className={conversation.latestMessage.senderId === user.uid ? 'font-medium' : ''}>
                            {conversation.latestMessage.senderId === user.uid ? 'You: ' : ''}
                          </span>
                          <span className="truncate">
                            {conversation.latestMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationListPage;