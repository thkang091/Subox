"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageCircle, Search, User, ChevronLeft, Clock, 
  Star, MapPin, Calendar, Bell, Filter, X, Home,
  Heart, Plus, Package, Menu, MessagesSquare, ArrowLeft
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, updateDoc, increment, limit, getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';

const ConversationListPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [activeTab, setActiveTab] = useState('sublease');
  const [showProfile, setShowProfile] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle profile dropdown navigation
  const handleTabClick = (tab) => {
    const routes = {
      purchased: '/profile/purchased',
      returned: '/profile/returned',
      cancelled: '/profile/cancelled',
      sold: '/profile/sold',
      sublease: '/sublease/search',
      reviews: '/profile/reviews',
      history: '/profile/history'
    };
    
    if (routes[tab]) {
      router.push(routes[tab]);
    }
    setShowProfile(false);
  };

  // Load notifications
  useEffect(() => {
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

  // Real-time conversation listener
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

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

          // Get the latest message
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
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            unreadCount: isUserHost ? (data.hostUnreadCount || 0) : (data.guestUnreadCount || 0),
            conversationType: data.conversationType || (data.listingType === 'moveout' ? 'moveout' : 'sublease')
          };
        });

        const conversationData = await Promise.all(conversationPromises);
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

  // Filter conversations
  const filteredConversations = conversations.filter(conversation => {
    const matchesTab = activeTab === 'sublease' 
      ? conversation.conversationType !== 'moveout'
      : conversation.conversationType === 'moveout';

    const matchesSearch = !searchTerm || 
      conversation.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.otherParticipant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.listingLocation?.toLowerCase().includes(searchTerm.toLowerCase());

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

  // Get counts for tabs
  const subleaseConversations = conversations.filter(conv => conv.conversationType !== 'moveout');
  const moveoutConversations = conversations.filter(conv => conv.conversationType === 'moveout');
  const subleaseUnreadCount = subleaseConversations.reduce((total, conv) => total + conv.unreadCount, 0);
  const moveoutUnreadCount = moveoutConversations.reduce((total, conv) => total + conv.unreadCount, 0);
  const totalUnreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  // Navigate to conversation
  const openConversation = (conversationId) => {
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

  // Loading state
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

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your messages</p>
          <button 
            onClick={() => router.push('/auth/')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
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
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <button 
                onClick={() => router.push('/sale/browse')}
                className="text-2xl font-bold text-gray-900 hover:text-orange-600 transition-colors"
              >
                Subox
              </button>
              <span className="text-sm text-gray-500 hidden sm:block">Messages</span>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => router.push(`browse/notificationDetail/${notif.id}`)}
                            className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left transition-colors"
                          >
                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{notif.message}</p>
                              <p className="text-xs text-gray-500">{notif.time}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => router.push('browse/notification/')}
                        className="mt-3 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        See all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                </button>

                {showProfile && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 space-y-1">
                      {[
                        { key: "purchased", label: "What I Purchased" },
                        { key: "returned", label: "What I Returned" },
                        { key: "cancelled", label: "What I Cancelled" },
                        { key: "sold", label: "What I Sold" },
                        { key: "sublease", label: "Sublease" },
                        { key: "reviews", label: "Reviews" }
                      ].map(item => (
                        <button 
                          key={item.key}
                          onClick={() => handleTabClick(item.key)} 
                          className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                        >
                          {item.label}
                        </button>
                      ))}
                      <hr className="my-2" />
                      <button 
                        onClick={() => handleTabClick("history")} 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      >
                        History
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Menu className="w-5 h-5 text-gray-600" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 space-y-2">
                      <p className="text-sm font-semibold text-orange-700 mb-2">Move Out Sale</p>
                      <button 
                        onClick={() => { router.push('../browse'); setShowMenu(false); }} 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      >
                        Browse Items
                      </button>                        
                      <button 
                        onClick={() => { router.push('/sale/create'); setShowMenu(false); }} 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      >
                        Sell Items
                      </button>
                      
                      <p className="text-sm font-semibold text-orange-700 mb-2 mt-4">Sublease</p>
                      <button 
                        onClick={() => { router.push('../search'); setShowMenu(false); }} 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      >
                        Find Sublease
                      </button>
                      <button 
                        onClick={() => { router.push('../search'); setShowMenu(false); }} 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      >
                        Post Sublease
                      </button>
                      
                      <hr className="my-2" />
                      <button 
                        onClick={() => { router.push('../help'); setShowMenu(false); }} 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-orange-600 transition-colors"
                      >
                        Help & Support
                      </button>
                      <button 
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/sublease/search')}
              className="flex items-center text-gray-600 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <MessageCircle className="w-8 h-8 mr-3 text-orange-500" />
                Messages
                {totalUnreadCount > 0 && (
                  <span className="ml-3 bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                    {totalUnreadCount}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">Your conversations about listings</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 mb-6">
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setActiveTab('sublease')}
              className={`flex items-center justify-center px-6 py-4 rounded-md transition-all font-medium ${
                activeTab === 'sublease'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Home className="w-5 h-5 mr-2" />
              <span>Sublease</span>
              {subleaseUnreadCount > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
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
              className={`flex items-center justify-center px-6 py-4 rounded-md transition-all font-medium ${
                activeTab === 'moveout'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Package className="w-5 h-5 mr-2" />
              <span>Move Out Sale</span>
              {moveoutUnreadCount > 0 && (
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'sublease' ? 'sublease' : 'move out sale'} conversations...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Conversations' },
              { key: 'unread', label: 'Unread Only' },
              { key: 'hosting', label: activeTab === 'sublease' ? 'As Host' : 'As Seller' },
              { key: 'guest', label: activeTab === 'sublease' ? 'As Guest' : 'As Buyer' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setFilterType(filter.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === filter.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-12 text-center">
              {activeTab === 'sublease' ? (
                <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              ) : (
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || filterType !== 'all' ? 'No conversations found' : `No ${activeTab === 'sublease' ? 'sublease' : 'move out sale'} messages yet`}
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                {searchTerm || filterType !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : activeTab === 'sublease'
                    ? 'Start browsing sublease listings to connect with hosts'
                    : 'Start browsing move out sale items to connect with sellers'
                }
              </p>
              {!searchTerm && filterType === 'all' && (
                <button
                  onClick={() => router.push(activeTab === 'sublease' ? '/sublease/search' : '/sale/browse')}
                  className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
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
                  className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Listing Image */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={conversation.listingImage || '/api/placeholder/64/64'}
                        alt={conversation.listingTitle || 'Listing'}
                        className="w-full h-full object-cover"
                      />
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
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-lg truncate mb-1">
                            {conversation.listingTitle || (activeTab === 'sublease' ? 'Untitled Listing' : 'Untitled Item')}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mb-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium mr-3 ${
                              conversation.isUserHost 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {conversation.isUserHost 
                                ? (activeTab === 'sublease' ? 'Hosting' : 'Selling')
                                : (activeTab === 'sublease' ? 'Guest' : 'Buying')
                              }
                            </span>
                            <span>with {conversation.otherParticipant.name}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="mr-3">{conversation.listingLocation}</span>
                            <span className="font-medium">${conversation.listingPrice}{activeTab === 'sublease' ? '/mo' : ''}</span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end ml-4">
                          <span className="text-xs text-gray-500 mb-1">
                            {formatTime(conversation.lastMessageTime)}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Latest Message Preview */}
                      {conversation.latestMessage && (
                        <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <span className={conversation.latestMessage.senderId === user.uid ? 'font-medium text-gray-800' : ''}>
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
      </main>
    </div>
  );
};

export default ConversationListPage;