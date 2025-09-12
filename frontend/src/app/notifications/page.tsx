"use client"

import React, { useState, useEffect } from 'react';
import { 
  Bell, MessageSquare, Calendar, Clock, CheckCircle, XCircle,
  User, MapPin, ArrowLeft, Filter, Trash2, Home,
  Video, Users, Mail, AlertCircle, RefreshCw, Eye, EyeOff, Menu, MessagesSquare, Heart
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, doc, updateDoc,
  deleteDoc, writeBatch, or
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, messages, tours, unread
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null); // 'host' or 'guest'
  const [userListings, setUserListings] = useState([]);
  const [activeTab, setActiveTab] = useState('guest'); // 'guest' or 'host'
  const [showMenu, setShowMenu] = useState(false);

  // Determine user role by checking if they have any listings
  useEffect(() => {
    if (!user?.uid) return;

    const checkUserRole = async () => {
      try {
        const listingsQuery = query(
          collection(db, 'listings'),
          where('hostId', '==', user.uid)
        );
        
        const unsubscribe = onSnapshot(listingsQuery, (snapshot) => {
          const listings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUserListings(listings);
          setUserRole(listings.length > 0 ? 'host' : 'guest');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('guest'); // Default to guest
      }
    };

    checkUserRole();
  }, [user?.uid]);

  // For router
  const router = useRouter();

  // Load notifications for current user
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const allNotifications = new Map();
        
        querySnapshot.docs.forEach(doc => {
          const notifData = {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          };
          allNotifications.set(doc.id, notifData);
        });

        const notificationsArray = Array.from(allNotifications.values())
          .sort((a, b) => {
            if (!a.createdAt || !b.createdAt) return 0;
            return b.createdAt - a.createdAt;
          });

        setNotifications(notificationsArray);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setError('Failed to load notifications: ' + error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const determineNotificationRole = (notification) => {
    if (notification.type === 'tour_request') {
      if (notification.listingId && userListings.some(listing => listing.id === notification.listingId)) {
        return 'host';
      }
      if (notification.senderId === user?.uid) {
        return 'guest';
      }
      return 'host';
    } else if (notification.type === 'tour_response') {
      if (notification.senderId === user?.uid) {
        return 'host';
      }
      return 'guest';
    } else if (notification.type === 'new_message') {
      if (notification.senderId === user?.uid) {
        return 'sent';
      } else {
        if (notification.listingId && userListings.some(listing => listing.id === notification.listingId)) {
          return 'host';
        } else {
          return 'guest';
        }
      }
    }
    return 'guest';
  };

  const guestNotifications = notifications.filter(n => {
    const role = determineNotificationRole(n);
    return role === 'guest' || role === 'sent';
  });

  const hostNotifications = notifications.filter(n => {
    const role = determineNotificationRole(n);
    return role === 'host';
  });

  const markAsRead = async (notificationId) => {
    setUpdating(notificationId);
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    } finally {
      setUpdating(null);
    }
  };

  const markAllAsRead = async (roleType = 'all') => {
    let targetNotifications = notifications;
    
    if (roleType === 'guest') {
      targetNotifications = guestNotifications;
    } else if (roleType === 'host') {
      targetNotifications = hostNotifications;
    }

    const unreadNotifications = targetNotifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    setUpdating(`all-${roleType}`);
    try {
      const batch = writeBatch(db);
      unreadNotifications.forEach(notif => {
        batch.update(doc(db, 'notifications', notif.id), { read: true });
      });
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all notifications as read');
    } finally {
      setUpdating(null);
    }
  };

  const deleteNotification = async (notificationId) => {
    setUpdating(notificationId);
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    } finally {
      setUpdating(null);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_message': return <MessageSquare className="w-5 h-5" />;
      case 'tour_response': return <Calendar className="w-5 h-5" />;
      case 'tour_request': return <Clock className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (type, read) => {
    const baseColors = {
      'new_message': 'border-blue-200 bg-blue-50',
      'tour_response': 'border-green-200 bg-green-50',
      'tour_request': 'border-orange-200 bg-orange-50'
    };
    
    if (read) {
      return 'border-gray-200 bg-white';
    }
    
    return baseColors[type] || 'border-gray-200 bg-gray-50';
  };

  const getTimeAgo = (date) => {
    if (!date) return 'Unknown time';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const filterNotifications = (notificationsList) => {
    return notificationsList.filter(notification => {
      if (filter === 'unread' && notification.read) return false;
      if (filter === 'messages' && notification.type !== 'new_message') return false;
      if (filter === 'tours' && !['tour_response', 'tour_request'].includes(notification.type)) return false;
      return true;
    });
  };

  const filteredGuestNotifications = filterNotifications(guestNotifications);
  const filteredHostNotifications = filterNotifications(hostNotifications);

  const guestUnreadCount = guestNotifications.filter(n => !n.read).length;
  const hostUnreadCount = hostNotifications.filter(n => !n.read).length;

  const NotificationList = ({ notifications, roleType, unreadCount }) => (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border">
        <div className="flex items-center">
          <div className={`p-2 rounded-full mr-3 ${
            roleType === 'guest' ? 'bg-blue-100' : 'bg-purple-100'
          }`}>
            {roleType === 'guest' ? (
              <User className={`w-5 h-5 ${roleType === 'guest' ? 'text-blue-600' : 'text-purple-600'}`} />
            ) : (
              <Home className={`w-5 h-5 ${roleType === 'guest' ? 'text-blue-600' : 'text-purple-600'}`} />
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 capitalize">
              {roleType} Notifications
            </h2>
            <p className="text-sm text-gray-600">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead(roleType)}
            disabled={updating === `all-${roleType}`}
            className={`flex items-center px-3 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
              roleType === 'guest' 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-purple-500 hover:bg-purple-600'
            } disabled:opacity-50`}
          >
            {updating === `all-${roleType}` ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Mark All Read
          </button>
        )}
      </div>

      {/* Notifications */}
      {notifications.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            No {roleType} notifications yet
          </h3>
          <p className="text-gray-500 text-sm">
            {roleType === 'guest' 
              ? 'Notifications about your bookings and messages will appear here.'
              : 'Notifications about your property listings will appear here.'
            }
          </p>
        </div>
      ) : (
        notifications.map((notification) => (
          <div 
            key={notification.id} 
            className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
              getNotificationColor(notification.type, notification.read)
            } ${!notification.read ? 'border-l-4 border-l-orange-400' : ''}`}
            onClick={() => setSelectedNotification(notification)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className={`p-2 rounded-full ${
                  notification.type === 'new_message' ? 'bg-blue-100 text-blue-600' :
                  notification.type === 'tour_response' ? 'bg-green-100 text-green-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                    {notification.message}
                  </p>

                  {notification.type === 'new_message' && notification.messagePreview && (
                    <div className="bg-gray-100 p-2 rounded text-xs text-gray-700 mb-2">
                      "{notification.messagePreview}"
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs text-gray-500">
                      <User className="w-3 h-3 mr-1" />
                      {notification.senderName}
                      <span className="mx-2">•</span>
                      <Clock className="w-3 h-3 mr-1" />
                      {getTimeAgo(notification.createdAt)}
                    </div>

                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          disabled={updating === notification.id}
                          className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors"
                          title="Mark as read"
                        >
                          {updating === notification.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        disabled={updating === notification.id}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
                <p className="text-gray-600">
                  {(guestUnreadCount + hostUnreadCount) > 0 
                    ? `${guestUnreadCount + hostUnreadCount} unread notification${(guestUnreadCount + hostUnreadCount) > 1 ? 's' : ''}` 
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-4'>
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
                onClick={() => router.push("/profile")}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
              </motion.button>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white p-1 rounded-xl shadow-sm mb-6 inline-flex">
            <button
              onClick={() => setActiveTab('guest')}
              className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'guest'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <User className="w-5 h-5 mr-2" />
              Guest
              {guestUnreadCount > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === 'guest' ? 'bg-blue-400 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {guestUnreadCount}
                </span>
              )}
            </button>
            
            {userRole === 'host' && (
              <button
                onClick={() => setActiveTab('host')}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'host'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Home className="w-5 h-5 mr-2" />
                Host
                {hostUnreadCount > 0 && (
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === 'host' ? 'bg-purple-400 text-white' : 'bg-purple-500 text-white'
                  }`}>
                    {hostUnreadCount}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
            <div className="flex flex-wrap gap-2">
              {[
                { 
                  key: 'all', 
                  label: 'All', 
                  count: activeTab === 'guest' ? guestNotifications.length : hostNotifications.length 
                },
                { 
                  key: 'unread', 
                  label: 'Unread', 
                  count: activeTab === 'guest' ? guestUnreadCount : hostUnreadCount 
                },
                { 
                  key: 'messages', 
                  label: 'Messages', 
                  count: (activeTab === 'guest' ? guestNotifications : hostNotifications).filter(n => n.type === 'new_message').length 
                },
                { 
                  key: 'tours', 
                  label: 'Tours', 
                  count: (activeTab === 'guest' ? guestNotifications : hostNotifications).filter(n => ['tour_response', 'tour_request'].includes(n.type)).length 
                }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? (activeTab === 'guest' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white')
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                  <span className="ml-2 text-xs">({filterOption.count})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Notifications Content */}
        {activeTab === 'guest' && (
          <NotificationList 
            notifications={filteredGuestNotifications}
            roleType="guest"
            unreadCount={guestUnreadCount}
          />
        )}

        {activeTab === 'host' && userRole === 'host' && (
          <NotificationList 
            notifications={filteredHostNotifications}
            roleType="host"
            unreadCount={hostUnreadCount}
          />
        )}

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedNotification.title}
                  </h2>
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        selectedNotification.type === 'new_message' ? 'bg-blue-100 text-blue-700' :
                        selectedNotification.type === 'tour_response' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        <div className="flex items-center">
                          {getNotificationIcon(selectedNotification.type)}
                          <span className="ml-1 capitalize">
                            {selectedNotification.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedNotification.read ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedNotification.read ? 'Read' : 'Unread'}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-700">From: {selectedNotification.senderName}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Message:</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {selectedNotification.type === 'new_message' && selectedNotification.messagePreview && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Message Preview:</h3>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-800 text-sm">"{selectedNotification.messagePreview}"</p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Received: {selectedNotification.createdAt?.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {!selectedNotification.read && (
                      <button
                        onClick={() => {
                          markAsRead(selectedNotification.id);
                          setSelectedNotification(null);
                        }}
                        className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
                      >
                        Mark as Read
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        deleteNotification(selectedNotification.id);
                        setSelectedNotification(null);
                      }}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}