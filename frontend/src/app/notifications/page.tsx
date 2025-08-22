"use client"

import React, { useState, useEffect } from 'react';
import { 
  Bell, MessageSquare, Calendar, Clock, CheckCircle, XCircle,
  User, MapPin, ArrowLeft, Filter, Trash2,
  Video, Users, Mail, AlertCircle, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, doc, updateDoc,
  deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';

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
          setUserRole(snapshot.docs.length > 0 ? 'host' : 'guest');
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('guest'); // Default to guest
      }
    };

    checkUserRole();
  }, [user?.uid]);

  // Load notifications for current user
  useEffect(() => {
    if (!user?.uid) return;

    // Use simple query without orderBy to avoid index issues
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notifs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }))
        .sort((a, b) => {
          // Sort by createdAt descending (newest first)
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt - a.createdAt;
        });

        setNotifications(notifs);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading notifications:', error);
        setError('Failed to load notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

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

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    setUpdating('all');
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

  const getNotificationRoleLabel = (notification) => {
    // Determine if this notification is for host or guest role
    if (notification.type === 'tour_request') {
      return { label: 'Host', color: 'bg-purple-100 text-purple-700' };
    } else if (notification.type === 'tour_response') {
      return { label: 'Guest', color: 'bg-blue-100 text-blue-700' };
    } else if (notification.type === 'new_message') {
      // For messages, determine context based on listing ownership
      // If the message is about a listing you own, you're acting as host
      // If it's about someone else's listing, you're acting as guest
      
      // We can infer from the message content or use additional context
      // For now, let's check if the user is likely the host or guest based on available data
      if (notification.senderId === user?.uid) {
        return { label: 'Sent', color: 'bg-green-100 text-green-700' };
      } else {
        // Check if this is related to your listing (you're the host) or someone else's (you're the guest)
        // We need to determine this from the context
        if (userRole === 'host') {
          // If user has listings, this could be either role
          // We need more context to determine if this message is about their listing or someone else's
          return { label: 'As Host', color: 'bg-purple-100 text-purple-700' };
        } else {
          return { label: 'As Guest', color: 'bg-blue-100 text-blue-700' };
        }
      }
    }
    return null;
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'messages' && notification.type !== 'new_message') return false;
    if (filter === 'tours' && !['tour_response', 'tour_request'].includes(notification.type)) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-orange-500 mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Notifications</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={updating === 'all'}
                className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium disabled:opacity-50"
              >
                {updating === 'all' ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Mark All Read
              </button>
            )}
          </div>

          {/* Role Badge - Updated for dual role users */}
          <div className="flex items-center mb-4">
            <div className="flex items-center gap-2">
              {userRole === 'host' && (
                <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                  <Users className="w-4 h-4 mr-1" />
                  Host Account
                </div>
              )}
              <div className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                <User className="w-4 h-4 mr-1" />
                Guest Account
              </div>
              {notifications.some(n => getNotificationRoleLabel(n)) && (
                <span className="text-xs text-gray-500">
                  Notifications are labeled by role
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'messages', label: 'Messages', count: notifications.filter(n => n.type === 'new_message').length },
              { key: 'tours', label: 'Tours', count: notifications.filter(n => ['tour_response', 'tour_request'].includes(n.type)).length }
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
                <span className="ml-2 text-xs">({filterOption.count})</span>
              </button>
            ))}
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

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Notifications will appear here when you receive messages or tour updates.'
                : `You don't have any ${filter} notifications at the moment.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md cursor-pointer ${
                  getNotificationColor(notification.type, notification.read)
                } ${!notification.read ? 'border-l-4 border-l-orange-400' : ''}`}
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${
                      notification.type === 'new_message' ? 'bg-blue-100 text-blue-600' :
                      notification.type === 'tour_response' ? 'bg-green-100 text-green-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800 text-sm">
                            {notification.title}
                          </h3>
                          {/* Role Label */}
                          {getNotificationRoleLabel(notification) && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getNotificationRoleLabel(notification).color}`}>
                              {getNotificationRoleLabel(notification).label}
                            </span>
                          )}
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Message Preview for new messages */}
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
            ))}
          </div>
        )}

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-90vh overflow-y-auto">
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
                  {/* Notification Type Badge */}
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
                      
                      {/* Role Label in Modal */}
                      {getNotificationRoleLabel(selectedNotification) && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationRoleLabel(selectedNotification).color}`}>
                          {getNotificationRoleLabel(selectedNotification).label}
                        </div>
                      )}
                    </div>
                    
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedNotification.read ? 'bg-gray-100 text-gray-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {selectedNotification.read ? 'Read' : 'Unread'}
                    </div>
                  </div>

                  {/* Sender Info */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-500 mr-2" />
                      <span className="font-medium text-gray-700">From: {selectedNotification.senderName}</span>
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <h3 className="font-medium text-gray-800 mb-2">Message:</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {selectedNotification.message}
                    </p>
                  </div>

                  {/* Message Preview for new messages */}
                  {selectedNotification.type === 'new_message' && selectedNotification.messagePreview && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Message Preview:</h3>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-blue-800 text-sm">"{selectedNotification.messagePreview}"</p>
                      </div>
                    </div>
                  )}

                  {/* Tour Details for tour notifications */}
                  {(['tour_response', 'tour_request'].includes(selectedNotification.type)) && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Tour Details:</h3>
                      <div className="space-y-2 text-sm">
                        {selectedNotification.listingId && (
                          <p><span className="font-medium">Property ID:</span> {selectedNotification.listingId}</p>
                        )}
                        {selectedNotification.tourDate && (
                          <p><span className="font-medium">Tour Date:</span> {new Date(selectedNotification.tourDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Received: {selectedNotification.createdAt?.toLocaleString()}
                    </p>
                  </div>

                  {/* Actions */}
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