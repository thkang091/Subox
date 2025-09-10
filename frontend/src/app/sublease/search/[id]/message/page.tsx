"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Send, ArrowLeft, Phone, Video, MoreVertical, 
  Image as ImageIcon, Paperclip, Info, MapPin, 
  Calendar, DollarSign, Star, User, Heart, X, 
  ChevronLeft, ChevronRight, Wifi, Home, BedDouble, 
  Plus, MessageCircle, Search, Package, Truck, 
  Clock, Shield, Menu
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, where,
  addDoc, doc, getDoc, updateDoc, serverTimestamp,
  increment, getDocs, limit
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import { featuredListings } from '../../../../../data/listings';
import { motion, AnimatePresence } from 'framer-motion';

const ConversationDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id;
  const { user } = useAuth();

  // For mobile form
  const [showLeft, setShowLeft] = useState(false);

  
  // Core state
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [listing, setListing] = useState(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI state
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showListingDetails, setShowListingDetails] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const unsubscribeRefs = useRef({});

  // Memoized conversation type detection
  const isMoveOutSale = useMemo(() => 
    conversation?.conversationType === 'moveout' || conversation?.listingType === 'moveout',
    [conversation]
  );

  // Memoized labels
  const labels = useMemo(() => {
    if (isMoveOutSale) {
      return {
        hostLabel: 'Seller',
        guestLabel: 'Buyer',
        listingType: 'Item',
        priceLabel: '',
        actionButton: 'View Item Details',
        tourButton: 'Ask About Pickup'
      };
    } else {
      return {
        hostLabel: 'Host',
        guestLabel: 'Guest',
        listingType: 'Listing',
        priceLabel: '/month',
        actionButton: 'View Full Details',
        tourButton: 'Schedule Tour'
      };
    }
  }, [isMoveOutSale]);

  // Generate color for user avatar based on name
  const getAvatarColor = useCallback((name) => {
    if (!name) return '#f97316'; // Default orange
    
    const colors = [
      '#f97316', // Orange
      '#3b82f6', // Blue
      '#10b981', // Emerald
      '#8b5cf6', // Purple
      '#ef4444', // Red
      '#f59e0b', // Amber
      '#06b6d4', // Cyan
      '#84cc16', // Lime
      '#ec4899', // Pink
      '#6366f1'  // Indigo
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }, []);

  // Get user initials for fallback
  const getUserInitials = useCallback((name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }, []);


  // Create notification for new message
const createMessageNotification = async (messageData, conversation) => {
  try {
    const recipientId = conversation.isUserHost ? conversation.guestId : conversation.hostId;
    const recipientName = conversation.isUserHost ? conversation.guestName : conversation.hostName;
    
    const notification = {
      recipientId: recipientId,
      senderId: user.uid,
      senderName: user.displayName || user.email || 'Anonymous',
      type: 'new_message',
      title: 'New Message',
      message: `${user.displayName || user.email || 'Someone'} sent you a message about ${conversation.listingTitle || 'a listing'}`,
      messagePreview: messageData.text?.slice(0, 100) || (messageData.type === 'image' ? 'Image' : 'File'),
      listingId: conversation.listingId,
      conversationId: conversationId,
      read: false,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, 'notifications'), notification);
  } catch (error) {
    console.error('Error creating message notification:', error);
    // Don't fail the message send if notification creation fails
  }
};

  // Check if image exists and is valid
  const checkImageExists = useCallback((url) => {
    return new Promise((resolve) => {
      if (!url) {
        resolve(false);
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }, []);

  // Safe image helper with fallback
  const getSafeImageUrl = useCallback((imageUrl, fallbackType = 'user') => {
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl === '/api/placeholder/40/40') {
      if (fallbackType === 'listing') {
        return `data:image/svg+xml,${encodeURIComponent(`
          <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" fill="#f9fafb"/>
            <rect x="16" y="20" width="32" height="24" fill="#e5e7eb" rx="2"/>
            <circle cx="24" cy="28" r="3" fill="#d1d5db"/>
            <path d="M16 36l8-6 4 3 8-5v12H16z" fill="#d1d5db"/>
          </svg>
        `)}`;
      }
      return null; // Return null for user images to trigger initials display
    }
    return imageUrl;
  }, []);

  // Auto-scroll when messages update
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, scrollToBottom]);

  // Enhanced error handling
  const handleError = useCallback((error, context = '') => {
    console.error(`Error in ${context}:`, error);
    setError(`${context}: ${error.message}`);
  }, []);

  // Load conversations
  useEffect(() => {
    if (!user?.uid) {
      setConversationsLoading(false);
      return;
    }

    let mounted = true;

    const loadConversations = async () => {
      try {
        const conversationsQuery = query(
          collection(db, 'conversations'),
          where('participants', 'array-contains', user.uid),
          orderBy('lastMessageTime', 'desc')
        );

        const unsubscribe = onSnapshot(
          conversationsQuery,
          async (snapshot) => {
            if (!mounted) return;

            try {
              const conversationPromises = snapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                
                const isUserHost = data.hostId === user.uid;
                const otherParticipant = isUserHost ? {
                  id: data.guestId,
                  name: data.guestName || 'Unknown User',
                  email: data.guestEmail || '',
                  image: data.guestImage
                } : {
                  id: data.hostId,
                  name: data.hostName || 'Unknown User',
                  email: data.hostEmail || '',
                  image: data.hostImage
                };

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
                      text: messageData.text || '',
                      type: messageData.type || 'text',
                      senderId: messageData.senderId,
                      createdAt: messageData.createdAt?.toDate() || new Date()
                    };
                  }
                } catch (messageError) {
                  console.warn('Failed to load latest message:', messageError);
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

              if (mounted) {
                setConversations(conversationData);
                setConversationsLoading(false);
              }
            } catch (error) {
              if (mounted) {
                handleError(error, 'Loading conversations');
                setConversationsLoading(false);
              }
            }
          },
          (error) => {
            if (mounted) {
              handleError(error, 'Conversations listener');
              setConversationsLoading(false);
            }
          }
        );

        unsubscribeRefs.current.conversations = unsubscribe;

      } catch (error) {
        if (mounted) {
          handleError(error, 'Setting up conversations listener');
          setConversationsLoading(false);
        }
      }
    };

    loadConversations();

    return () => {
      mounted = false;
      if (unsubscribeRefs.current.conversations) {
        unsubscribeRefs.current.conversations();
      }
    };
  }, [user?.uid, handleError]);

  // Load conversation
  useEffect(() => {
    if (!conversationId || !user?.uid) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadConversation = async () => {
      try {
        setLoading(true);
        setError(null);

        const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
        
        if (!mounted) return;

        if (!conversationDoc.exists()) {
          setLoading(false);
          return;
        }

        const conversationData = conversationDoc.data();
        
        if (!conversationData.participants?.includes(user.uid)) {
          setError('You do not have access to this conversation.');
          setLoading(false);
          return;
        }

        const isUserHost = conversationData.hostId === user.uid;
        const otherParticipant = isUserHost ? {
          id: conversationData.guestId,
          name: conversationData.guestName || 'Unknown User',
          email: conversationData.guestEmail || '',
          image: conversationData.guestImage
        } : {
          id: conversationData.hostId,
          name: conversationData.hostName || 'Unknown User',
          email: conversationData.hostEmail || '',
          image: conversationData.hostImage
        };

        const conversationWithType = {
          id: conversationDoc.id,
          ...conversationData,
          isUserHost,
          otherParticipant,
          createdAt: conversationData.createdAt?.toDate() || new Date(),
          updatedAt: conversationData.updatedAt?.toDate() || new Date(),
          conversationType: conversationData.conversationType || (conversationData.listingType === 'moveout' ? 'moveout' : 'sublease')
        };

        if (mounted) {
          setConversation(conversationWithType);
          
          if (conversationData.listingId) {
            loadListingDetails(conversationData.listingId, conversationWithType.conversationType);
          }

          try {
            await markMessagesAsRead(conversationDoc.id, isUserHost);
          } catch (readError) {
            console.warn('Failed to mark messages as read:', readError);
          }
        }
        
      } catch (error) {
        if (mounted) {
          handleError(error, 'Loading conversation');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadConversation();

    return () => {
      mounted = false;
    };
  }, [conversationId, user?.uid]);

  // Load listing details
  const loadListingDetails = useCallback(async (listingId, conversationType = 'sublease') => {
    if (!listingId) return;

    try {
      if (conversationType !== 'moveout') {
        const foundListing = featuredListings.find(listing => listing.id === listingId);
        if (foundListing) {
          setListing(foundListing);
          return;
        }
      }
      
      // Use the correct collection name based on conversation type
      const collectionName = conversationType === 'moveout' ? 'saleItems' : 'listings';
      const docRef = doc(db, collectionName, listingId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        
        const convertFirestoreDate = (dateValue) => {
          if (!dateValue) return new Date();
          if (dateValue.toDate && typeof dateValue.toDate === 'function') {
            return dateValue.toDate();
          }
          return new Date(dateValue) || new Date();
        };

        let formattedListing;
        
        if (conversationType === 'moveout') {
          // Map saleItems fields to the expected format
          formattedListing = {
            id: docSnap.id,
            title: firestoreData.name || firestoreData.title || 'Unnamed Item',
            location: firestoreData.location || 'Campus Area',
            image: firestoreData.image || (firestoreData.images && firestoreData.images[0]) || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&h=500&auto=format&fit=crop",
            additionalImages: firestoreData.additionalImages || (firestoreData.images ? firestoreData.images.slice(1) : []) || [],
            price: Number(firestoreData.price || 0),
            originalPrice: Number(firestoreData.originalPrice || firestoreData.price || 0),
            condition: firestoreData.condition || 'Good',
            category: firestoreData.category || 'Other',
            rating: Number(firestoreData.sellerRating || 4.5),
            reviews: Number(firestoreData.sellerReviews || 12),
            features: firestoreData.features || [],
            hostName: firestoreData.seller || firestoreData.sellerEmail || 'Anonymous',
            hostImage: firestoreData.sellerPhoto,
            description: firestoreData.description || firestoreData.shortDescription || 'No description available',
            availableFrom: new Date(),
            availableTo: firestoreData.availableUntil ? new Date(firestoreData.availableUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isVerifiedUMN: Boolean(firestoreData.isVerifiedUMN || false),
            priceType: firestoreData.priceType || 'fixed',
            pickupAvailable: Boolean(firestoreData.pickupAvailable || true),
            deliveryAvailable: Boolean(firestoreData.deliveryAvailable || false),
            views: Number(firestoreData.views || 0),
            createdAt: convertFirestoreDate(firestoreData.createdAt),
            updatedAt: convertFirestoreDate(firestoreData.updatedAt)
          };
        } else {
          formattedListing = {
            id: docSnap.id,
            title: firestoreData.title || `${firestoreData.listingType || 'Sublease'} in ${firestoreData.location || 'Campus Area'}`,
            location: firestoreData.location || 'Campus Area',
            image: firestoreData.image || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop",
            additionalImages: firestoreData.additionalImages || [],
            price: Number(firestoreData.price || firestoreData.rent || 0),
            bedrooms: Number(firestoreData.bedrooms || 1),
            bathrooms: Number(firestoreData.bathrooms || 1),
            rating: Number(firestoreData.rating || 4.5),
            reviews: Number(firestoreData.reviews || 8),
            amenities: Array.isArray(firestoreData.amenities) ? firestoreData.amenities : [],
            hostName: firestoreData.hostName || 'Anonymous',
            hostImage: firestoreData.hostImage,
            description: firestoreData.description || 'No description available',
            availableFrom: convertFirestoreDate(firestoreData.availableFrom),
            availableTo: convertFirestoreDate(firestoreData.availableTo),
            isVerifiedUMN: Boolean(firestoreData.isVerifiedUMN || false),
          };
        }
        
        setListing(formattedListing);
      }
    } catch (error) {
      console.error('Error loading listing:', error);
    }
  }, []);

  // Messages listener
  useEffect(() => {
    if (!conversationId || !user?.uid) return;

    let mounted = true;

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        if (!mounted) return;

        try {
          const messageData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          
          setMessages(messageData);
        } catch (error) {
          console.error('Error processing messages:', error);
        }
      },
      (error) => {
        if (mounted) {
          console.error('Messages listener error:', error);
        }
      }
    );

    unsubscribeRefs.current.messages = unsubscribe;

    return () => {
      mounted = false;
      if (unsubscribeRefs.current.messages) {
        unsubscribeRefs.current.messages();
      }
    };
  }, [conversationId, user?.uid]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (convId, isHost) => {
    try {
      const updateField = isHost ? 'hostUnreadCount' : 'guestUnreadCount';
      await updateDoc(doc(db, 'conversations', convId), {
        [updateField]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Send message
const sendMessage = useCallback(async (e, messageData = null) => {
  if (e) e.preventDefault();
  
  const finalMessageData = messageData || {
    text: newMessage.trim(),
    type: 'text'
  };
  
  if (!finalMessageData.text && !finalMessageData.imageUrl && !finalMessageData.fileUrl) return;
  if (sending || !conversation) return;

  setSending(true);
  
  try {
    const messageDoc = {
      ...finalMessageData,
      senderId: user.uid,
      senderName: user.displayName || user.email || 'Anonymous',
      createdAt: serverTimestamp(),
      listingId: conversation.listingId
    };

    await addDoc(
      collection(db, 'conversations', conversationId, 'messages'), 
      messageDoc
    );

    const otherUserUnreadField = conversation.isUserHost ? 'guestUnreadCount' : 'hostUnreadCount';
    
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: finalMessageData.text || (finalMessageData.type === 'image' ? 'Image' : 'File'),
      lastMessageTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
      [otherUserUnreadField]: increment(1)
    });

    // CREATE NOTIFICATION - ADD THIS PART
    await createMessageNotification(finalMessageData, conversation);

    if (!messageData) {
      setNewMessage('');
      inputRef.current?.focus();
    }
    
  } catch (error) {
    handleError(error, 'Sending message');
    alert('Failed to send message. Please try again.');
  } finally {
    setSending(false);
  }
}, [newMessage, sending, conversation, user, conversationId, handleError]);
  // File upload
  const handleFileUpload = useCallback(async (file, type = 'file') => {
    if (!file || !conversation) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);

    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const folderPath = type === 'image' ? 'conversation-images' : 'conversation-files';
      const storageRef = ref(storage, `${folderPath}/${conversationId}/${filename}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const messageData = {
        type: type,
        [type === 'image' ? 'imageUrl' : 'fileUrl']: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        text: type === 'image' ? '' : `Shared a file: ${file.name}`
      };

      await sendMessage(null, messageData);

    } catch (error) {
      handleError(error, 'Uploading file');
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  }, [conversation, conversationId, sendMessage, handleError]);

  // File input handlers
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, 'image');
    }
    e.target.value = '';
  }, [handleFileUpload]);

  const handleGeneralFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'file');
    }
    e.target.value = '';
  }, [handleFileUpload]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleFileUpload(file, 'image');
      } else {
        handleFileUpload(file, 'file');
      }
    }
  }, [handleFileUpload]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      let matchesTab = true;
      if (activeTab === 'sublease') {
        matchesTab = conv.conversationType !== 'moveout';
      } else if (activeTab === 'moveout') {
        matchesTab = conv.conversationType === 'moveout';
      }

      const matchesSearch = !searchTerm || 
        conv.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.otherParticipant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.listingLocation?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [conversations, activeTab, searchTerm]);

  // Time formatting functions
  const formatConversationTime = useCallback((date) => {
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
  }, []);

  const formatMessageTime = useCallback((date) => {
    if (!date) return '';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else if (diffInDays === 1) {
      return 'Yesterday ' + messageDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    }
  }, []);

  // Message preview helper
  const getMessagePreview = useCallback((message) => {
    if (!message) return 'No messages yet';
    
    switch (message.type) {
      case 'image':
        return 'Image';
      case 'file':
        return 'File';
      default:
        return message.text || 'Message';
    }
  }, []);

  // Group messages by date
  const messageGroups = useMemo(() => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];

    messages.forEach(message => {
      const messageDate = message.createdAt.toDateString();
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({ date: currentDate, messages: currentGroup });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });

    if (currentGroup.length > 0) {
      groups.push({ date: currentDate, messages: currentGroup });
    }

    return groups;
  }, [messages]);

  // Image navigation
  const allImages = useMemo(() => {
    if (!listing) return [];
    return [
      listing.image,
      ...(Array.isArray(listing.additionalImages) ? listing.additionalImages : [])
    ].filter(Boolean);
  }, [listing]);

  const goToPrevImage = useCallback(() => {
    setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }, [allImages.length]);
  
  const goToNextImage = useCallback(() => {
    setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }, [allImages.length]);

  // Feature/Amenity icons
  const getFeatureIcon = useCallback((feature) => {
    switch (feature.toLowerCase()) {
      case 'wifi': return <Wifi size={16} />;
      case 'parking': return <MapPin size={16} />;
      case 'furnished': return <Home size={16} />;
      case 'utilities': return <DollarSign size={16} />;
      case 'delivery': return <Truck size={16} />;
      case 'warranty': return <Shield size={16} />;
      case 'pickup': return <Package size={16} />;
      default: return <Star size={16} />;
    }
  }, []);

  // Loading state
  if (loading || conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <button 
              onClick={() => setError(null)}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.push('/sublease/search/')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Back to Messages
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No conversation found
  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Conversation not found</h2>
          <p className="text-gray-600 mb-6">This conversation may have been deleted or you may not have access to it.</p>
          <button 
            onClick={() => router.push('/sublease/search/')}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Image Gallery Modal */}
      {showAllImages && listing && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <div className="flex justify-end mb-4">
              <button 
                onClick={() => setShowAllImages(false)}
                className="p-2 bg-white rounded-full text-black hover:bg-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <div className="h-96 flex items-center justify-center">
                <img 
                  src={getSafeImageUrl(allImages[activeImage], 'listing')} 
                  alt={`Image ${activeImage + 1}`}
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>
              
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={goToPrevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition-colors"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  
                  <button 
                    onClick={goToNextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition-colors"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}
            </div>
            
            <div className="text-white text-center">
              {activeImage + 1} of {allImages.length}
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen hidden md:flex">
        {/* Left Sidebar - Conversations List */}
        <div className={`${showConversationList ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden lg:w-80`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              <button
                onClick={() => setShowConversationList(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tab Selection */}
            <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors font-medium ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('sublease')}
                className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center font-medium ${
                  activeTab === 'sublease' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <Home className="w-3 h-3 mr-1" />
                Sublease
              </button>
              <button
                onClick={() => setActiveTab('moveout')}
                className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center font-medium ${
                  activeTab === 'moveout' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <Package className="w-3 h-3 mr-1" />
                Sale
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No conversations found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => router.push(`/sublease/search/${conv.id}/message`)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      conv.id === conversationId ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Listing Image */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={getSafeImageUrl(conv.listingImage, 'listing')}
                          alt={conv.listingTitle || 'Listing'}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1">
                          {conv.conversationType === 'moveout' ? (
                            <Package className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                          ) : (
                            <Home className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                          )}
                        </div>
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate text-sm">
                              {conv.listingTitle || (conv.conversationType === 'moveout' ? 'Untitled Item' : 'Untitled Listing')}
                            </h4>
                            <p className="text-xs text-gray-500 truncate mt-1">
                              {conv.otherParticipant.name}
                            </p>
                            <div className="flex items-center mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                conv.isUserHost 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {conv.isUserHost 
                                  ? (conv.conversationType === 'moveout' ? 'Seller' : 'Host')
                                  : (conv.conversationType === 'moveout' ? 'Buyer' : 'Guest')
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end ml-2">
                            <span className="text-xs text-gray-500">
                              {formatConversationTime(conv.lastMessageTime)}
                            </span>
                            {conv.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1 font-medium">
                                {conv.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Latest Message Preview */}
                        <div className="mt-2 text-xs text-gray-600">
                          <span className={conv.latestMessage?.senderId === user.uid ? 'font-medium' : ''}>
                            {conv.latestMessage?.senderId === user.uid ? 'You: ' : ''}
                          </span>
                          <span className="truncate">
                            {getMessagePreview(conv.latestMessage)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              {!showConversationList && (
                <button
                  onClick={() => setShowConversationList(true)}
                  className="p-2 hover:bg-gray-100 rounded-full mr-3 transition-colors lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => router.push('/sublease/search/')}
                className="p-2 hover:bg-gray-100 rounded-full mr-3 transition-colors hidden lg:block"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {conversation && (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                    {getSafeImageUrl(conversation.otherParticipant.image, 'user') ? (
                      <img 
                        src={getSafeImageUrl(conversation.otherParticipant.image, 'user')}
                        alt={conversation.otherParticipant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ 
                        backgroundColor: getAvatarColor(conversation.otherParticipant.name),
                        display: getSafeImageUrl(conversation.otherParticipant.image, 'user') ? 'none' : 'flex'
                      }}
                    >
                      {getUserInitials(conversation.otherParticipant.name)}
                    </div>
                  </div>
                  <div>
                    <h1 className="font-semibold text-gray-900">
                      {conversation.otherParticipant.name}
                    </h1>
                    <p className="text-sm text-gray-500 flex items-center">
                      {isMoveOutSale ? (
                        <Package className="w-3 h-3 mr-1" />
                      ) : (
                        <Home className="w-3 h-3 mr-1" />
                      )}
                      {conversation.isUserHost ? labels.hostLabel : labels.guestLabel} • {conversation.listingTitle}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowListingDetails(!showListingDetails)}
                className={`p-2 rounded-full transition-colors ${showListingDetails ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
              >
                <Info className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messageGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isMoveOutSale ? <Package className="w-8 h-8 text-orange-500" /> : <Send className="w-8 h-8 text-orange-500" />}
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Start the conversation</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {conversation.isUserHost 
                    ? `Say hello to ${conversation.otherParticipant.name} who's interested in your ${isMoveOutSale ? 'item' : 'listing'}!`
                    : `Send a message to ${conversation.otherParticipant.name} about their ${isMoveOutSale ? 'item' : 'listing'}.`
                  }
                </p>
              </div>
            ) : (
              messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date separator */}
                  <div className="text-center my-6">
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {new Date(group.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  {/* Messages for this date */}
                  {group.messages.map((message, messageIndex) => {
                    const isOwnMessage = message.senderId === user.uid;
                    const showAvatar = !isOwnMessage && (
                      messageIndex === 0 || 
                      group.messages[messageIndex - 1]?.senderId !== message.senderId
                    );
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                      >
                        {/* Avatar for other user's messages */}
                        {!isOwnMessage && (
                          <div className={`w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                            {getSafeImageUrl(conversation.otherParticipant.image, 'user') ? (
                              <img 
                                src={getSafeImageUrl(conversation.otherParticipant.image, 'user')}
                                alt={conversation.otherParticipant.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full flex items-center justify-center text-white font-medium text-xs"
                              style={{ 
                                backgroundColor: getAvatarColor(conversation.otherParticipant.name),
                                display: getSafeImageUrl(conversation.otherParticipant.image, 'user') ? 'none' : 'flex'
                              }}
                            >
                              {getUserInitials(conversation.otherParticipant.name)}
                            </div>
                          </div>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
                          {/* Handle different message types */}
                          {message.type === 'image' ? (
                            <div className="mb-2">
                              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                <img 
                                  src={message.imageUrl} 
                                  alt="Shared image"
                                  className="w-full h-auto max-h-64 object-cover cursor-pointer"
                                  onClick={() => window.open(message.imageUrl, '_blank')}
                                />
                              </div>
                            </div>
                          ) : message.type === 'file' ? (
                            <div className={`p-3 rounded-2xl border ${
                              isOwnMessage 
                                ? 'bg-orange-500 text-white border-orange-500' 
                                : 'bg-white text-gray-900 border-gray-200 shadow-sm'
                            }`}>
                              <div className="flex items-center">
                                <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  <p className={`text-xs ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'}`}>
                                    {Math.round(message.fileSize / 1024)} KB
                                  </p>
                                </div>
                                <button
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                  className={`ml-2 p-1 rounded transition-colors ${
                                    isOwnMessage 
                                      ? 'hover:bg-orange-600' 
                                      : 'hover:bg-gray-100'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-orange-500 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                          )}
                          <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {conversation && (
            <div 
              className={`bg-white border-t border-gray-200 p-4 ${dragOver ? 'bg-orange-50 border-orange-300' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* File upload indicators */}
              {uploadingFile && (
                <div className="mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-3"></div>
                    <span className="text-sm text-orange-700">Uploading file...</span>
                  </div>
                </div>
              )}

              {dragOver && (
                <div className="mb-3 p-4 border-2 border-dashed border-orange-300 rounded-lg text-center">
                  <p className="text-orange-600 text-sm">Drop files here to upload</p>
                </div>
              )}

              <form onSubmit={sendMessage} className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    disabled={sending || uploadingFile}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleGeneralFileUpload}
                      className="hidden"
                      accept="*/*"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    
                    <input
                      ref={imageInputRef}
                      type="file"
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={(!newMessage.trim() || sending || uploadingFile)}
                  className={`p-3 rounded-full transition-colors ${
                    newMessage.trim() && !sending && !uploadingFile
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sending || uploadingFile ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Sidebar - Listing Details */}
        {showListingDetails && listing && (
          <div className="w-80 xl:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  {isMoveOutSale ? (
                    <>
                      <Package className="w-5 h-5 mr-2" />
                      Item Details
                    </>
                  ) : (
                    <>
                      <Home className="w-5 h-5 mr-2" />
                      Listing Details
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setShowListingDetails(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Main Image */}
              <div className="relative mb-4">
                <div className="h-40 rounded-lg overflow-hidden">
                  <img 
                    src={getSafeImageUrl(allImages[activeImage] || listing.image, 'listing')}
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowAllImages(true)}
                  />
                </div>
                
                {/* Image Navigation */}
                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={goToPrevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    
                    {/* Image indicators */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {allImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === activeImage ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Title and Owner */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{listing.title}</h3>
              <p className="text-gray-600 mb-3">{isMoveOutSale ? 'Sold by' : 'Hosted by'} {listing.hostName}</p>
              
              {/* Owner Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                    {getSafeImageUrl(listing.hostImage, 'user') ? (
                      <img 
                        src={getSafeImageUrl(listing.hostImage, 'user')}
                        alt={listing.hostName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-medium text-xs"
                      style={{ 
                        backgroundColor: getAvatarColor(listing.hostName),
                        display: getSafeImageUrl(listing.hostImage, 'user') ? 'none' : 'flex'
                      }}
                    >
                      {getUserInitials(listing.hostName)}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{listing.rating || 4.5} ({listing.reviews || 8} reviews)</span>
                  </div>
                </div>
                {listing.isVerifiedUMN && (
                  <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    UMN Verified
                  </div>
                )}
              </div>
            </div>

            {/* Key Details */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold text-lg">${listing.price}{labels.priceLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium text-sm">{listing.location}</span>
                </div>
                
                {/* Conditional details */}
                {isMoveOutSale ? (
                  <>
                    {listing.condition && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Condition</span>
                        <span className="font-medium text-sm">{listing.condition}</span>
                      </div>
                    )}
                    {listing.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium text-sm">{listing.category}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bedrooms</span>
                    <span className="font-medium text-sm">{listing.bedrooms} bed, {listing.bathrooms} bath</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features/Amenities */}
            {((isMoveOutSale && listing.features) || (!isMoveOutSale && listing.amenities)) && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isMoveOutSale ? 'Features' : 'Amenities'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(isMoveOutSale ? listing.features : listing.amenities)?.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded text-xs">
                      <div className="w-4 h-4 flex items-center justify-center text-orange-500 mr-2">
                        {getFeatureIcon(item)}
                      </div>
                      <span className="text-gray-700 capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 space-y-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`w-full py-3 px-4 rounded-lg border transition-colors flex items-center justify-center font-medium ${
                  isFavorited 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </button>
              
              <button
                onClick={() => router.push(`/sublease/search/${listing.id}`)}
                className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                {labels.actionButton}
              </button>
              
              <button
                onClick={() => router.push(`/sublease/search/${listing.id}/tour`)}
                className="w-full py-3 px-4 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                {labels.tourButton}
              </button>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isMoveOutSale ? 'About this item' : 'About this place'}
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Availability Information */}
            {listing.availableFrom && listing.availableTo && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isMoveOutSale ? 'Item Availability' : 'Availability'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {isMoveOutSale ? 'Available from' : 'Check-in'}
                    </span>
                    <span className="font-medium">
                      {listing.availableFrom.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {isMoveOutSale ? 'Available until' : 'Check-out'}
                    </span>
                    <span className="font-medium">
                      {listing.availableTo.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {conversation && (
              <div className="p-4 border-t border-gray-200 bg-orange-50">
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Need Help?</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Contact {conversation.isUserHost 
                      ? `your ${isMoveOutSale ? 'buyer' : 'guest'}` 
                      : `your ${isMoveOutSale ? 'seller' : 'host'}`
                    } if you have any questions.
                  </p>
                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Phone className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Video className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Mobile form */}
      <div className="flex h-screen w-auto md:hidden">
        <motion.button 
          className='left-1 mt-5 border w-10 h-10'
          onClick={() => setShowLeft(true)}
          >
          <Menu/>
        </motion.button>
        {showLeft && (
          <AnimatePresence>
            <div className={`${showConversationList ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden w-80`}>
              <motion.button 
                className='right-1 mt-5 w-10 h-10'
                onClick={() => setShowLeft(false)}
              >
                <X/>
              </motion.button>
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                  <button
                    onClick={() => setShowConversationList(false)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Tab Selection */}
                <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors font-medium ${
                      activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('sublease')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center font-medium ${
                      activeTab === 'sublease' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Home className="w-3 h-3 mr-1" />
                    Sublease
                  </button>
                  <button
                    onClick={() => setActiveTab('moveout')}
                    className={`flex-1 px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-center font-medium ${
                      activeTab === 'moveout' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                    }`}
                  >
                    <Package className="w-3 h-3 mr-1" />
                    Sale
                  </button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No conversations found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => router.push(`/sublease/search/${conv.id}/message`)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          conv.id === conversationId ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Listing Image */}
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                            <img 
                              src={getSafeImageUrl(conv.listingImage, 'listing')}
                              alt={conv.listingTitle || 'Listing'}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 right-1">
                              {conv.conversationType === 'moveout' ? (
                                <Package className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                              ) : (
                                <Home className="w-3 h-3 text-orange-600 bg-white rounded-full p-0.5" />
                              )}
                            </div>
                          </div>

                          {/* Conversation Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 truncate text-sm">
                                  {conv.listingTitle || (conv.conversationType === 'moveout' ? 'Untitled Item' : 'Untitled Listing')}
                                </h4>
                                <p className="text-xs text-gray-500 truncate mt-1">
                                  {conv.otherParticipant.name}
                                </p>
                                <div className="flex items-center mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    conv.isUserHost 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {conv.isUserHost 
                                      ? (conv.conversationType === 'moveout' ? 'Seller' : 'Host')
                                      : (conv.conversationType === 'moveout' ? 'Buyer' : 'Guest')
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end ml-2">
                                <span className="text-xs text-gray-500">
                                  {formatConversationTime(conv.lastMessageTime)}
                                </span>
                                {conv.unreadCount > 0 && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1 font-medium">
                                    {conv.unreadCount}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Latest Message Preview */}
                            <div className="mt-2 text-xs text-gray-600">
                              <span className={conv.latestMessage?.senderId === user.uid ? 'font-medium' : ''}>
                                {conv.latestMessage?.senderId === user.uid ? 'You: ' : ''}
                              </span>
                              <span className="truncate">
                                {getMessagePreview(conv.latestMessage)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </AnimatePresence>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              {!showConversationList && (
                <button
                  onClick={() => setShowConversationList(true)}
                  className="p-2 hover:bg-gray-100 rounded-full mr-3 transition-colors lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => router.push('/sublease/search/')}
                className="p-2 hover:bg-gray-100 rounded-full mr-3 transition-colors hidden lg:block"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {conversation && (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3 flex-shrink-0">
                    {getSafeImageUrl(conversation.otherParticipant.image, 'user') ? (
                      <img 
                        src={getSafeImageUrl(conversation.otherParticipant.image, 'user')}
                        alt={conversation.otherParticipant.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-semibold text-sm"
                      style={{ 
                        backgroundColor: getAvatarColor(conversation.otherParticipant.name),
                        display: getSafeImageUrl(conversation.otherParticipant.image, 'user') ? 'none' : 'flex'
                      }}
                    >
                      {getUserInitials(conversation.otherParticipant.name)}
                    </div>
                  </div>
                  <div>
                    <h1 className="font-semibold text-gray-900">
                      {conversation.otherParticipant.name}
                    </h1>
                    <p className="text-sm text-gray-500 flex items-center">
                      {isMoveOutSale ? (
                        <Package className="w-3 h-3 mr-1" />
                      ) : (
                        <Home className="w-3 h-3 mr-1" />
                      )}
                      {conversation.isUserHost ? labels.hostLabel : labels.guestLabel} • {conversation.listingTitle}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowListingDetails(!showListingDetails)}
                className={`p-2 rounded-full transition-colors ${showListingDetails ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
              >
                <Info className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messageGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {isMoveOutSale ? <Package className="w-8 h-8 text-orange-500" /> : <Send className="w-8 h-8 text-orange-500" />}
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Start the conversation</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {conversation.isUserHost 
                    ? `Say hello to ${conversation.otherParticipant.name} who's interested in your ${isMoveOutSale ? 'item' : 'listing'}!`
                    : `Send a message to ${conversation.otherParticipant.name} about their ${isMoveOutSale ? 'item' : 'listing'}.`
                  }
                </p>
              </div>
            ) : (
              messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  {/* Date separator */}
                  <div className="text-center my-6">
                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                      {new Date(group.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  {/* Messages for this date */}
                  {group.messages.map((message, messageIndex) => {
                    const isOwnMessage = message.senderId === user.uid;
                    const showAvatar = !isOwnMessage && (
                      messageIndex === 0 || 
                      group.messages[messageIndex - 1]?.senderId !== message.senderId
                    );
                    
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
                      >
                        {/* Avatar for other user's messages */}
                        {!isOwnMessage && (
                          <div className={`w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 ${showAvatar ? '' : 'invisible'}`}>
                            {getSafeImageUrl(conversation.otherParticipant.image, 'user') ? (
                              <img 
                                src={getSafeImageUrl(conversation.otherParticipant.image, 'user')}
                                alt={conversation.otherParticipant.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full flex items-center justify-center text-white font-medium text-xs"
                              style={{ 
                                backgroundColor: getAvatarColor(conversation.otherParticipant.name),
                                display: getSafeImageUrl(conversation.otherParticipant.image, 'user') ? 'none' : 'flex'
                              }}
                            >
                              {getUserInitials(conversation.otherParticipant.name)}
                            </div>
                          </div>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
                          {/* Handle different message types */}
                          {message.type === 'image' ? (
                            <div className="mb-2">
                              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                <img 
                                  src={message.imageUrl} 
                                  alt="Shared image"
                                  className="w-full h-auto max-h-64 object-cover cursor-pointer"
                                  onClick={() => window.open(message.imageUrl, '_blank')}
                                />
                              </div>
                            </div>
                          ) : message.type === 'file' ? (
                            <div className={`p-3 rounded-2xl border ${
                              isOwnMessage 
                                ? 'bg-orange-500 text-white border-orange-500' 
                                : 'bg-white text-gray-900 border-gray-200 shadow-sm'
                            }`}>
                              <div className="flex items-center">
                                <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  <p className={`text-xs ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'}`}>
                                    {Math.round(message.fileSize / 1024)} KB
                                  </p>
                                </div>
                                <button
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                  className={`ml-2 p-1 rounded transition-colors ${
                                    isOwnMessage 
                                      ? 'hover:bg-orange-600' 
                                      : 'hover:bg-gray-100'
                                  }`}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isOwnMessage
                                  ? 'bg-orange-500 text-white rounded-br-sm'
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm shadow-sm'
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                          )}
                          <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          {conversation && (
            <div 
              className={`bg-white border-t border-gray-200 p-4 ${dragOver ? 'bg-orange-50 border-orange-300' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* File upload indicators */}
              {uploadingFile && (
                <div className="mb-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500 mr-3"></div>
                    <span className="text-sm text-orange-700">Uploading file...</span>
                  </div>
                </div>
              )}

              {dragOver && (
                <div className="mb-3 p-4 border-2 border-dashed border-orange-300 rounded-lg text-center">
                  <p className="text-orange-600 text-sm">Drop files here to upload</p>
                </div>
              )}

              <form onSubmit={sendMessage} className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    disabled={sending || uploadingFile}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleGeneralFileUpload}
                      className="hidden"
                      accept="*/*"
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    
                    <input
                      ref={imageInputRef}
                      type="file"
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={(!newMessage.trim() || sending || uploadingFile)}
                  className={`p-3 rounded-full transition-colors ${
                    newMessage.trim() && !sending && !uploadingFile
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {sending || uploadingFile ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Sidebar - Listing Details */}
        {showListingDetails && listing && (
          <div className="w-80 xl:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  {isMoveOutSale ? (
                    <>
                      <Package className="w-5 h-5 mr-2" />
                      Item Details
                    </>
                  ) : (
                    <>
                      <Home className="w-5 h-5 mr-2" />
                      Listing Details
                    </>
                  )}
                </h2>
                <button
                  onClick={() => setShowListingDetails(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Main Image */}
              <div className="relative mb-4">
                <div className="h-40 rounded-lg overflow-hidden">
                  <img 
                    src={getSafeImageUrl(allImages[activeImage] || listing.image, 'listing')}
                    alt={listing.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setShowAllImages(true)}
                  />
                </div>
                
                {/* Image Navigation */}
                {allImages.length > 1 && (
                  <>
                    <button 
                      onClick={goToPrevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </button>
                    
                    {/* Image indicators */}
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {allImages.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index === activeImage ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Title and Owner */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{listing.title}</h3>
              <p className="text-gray-600 mb-3">{isMoveOutSale ? 'Sold by' : 'Hosted by'} {listing.hostName}</p>
              
              {/* Owner Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                    {getSafeImageUrl(listing.hostImage, 'user') ? (
                      <img 
                        src={getSafeImageUrl(listing.hostImage, 'user')}
                        alt={listing.hostName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-medium text-xs"
                      style={{ 
                        backgroundColor: getAvatarColor(listing.hostName),
                        display: getSafeImageUrl(listing.hostImage, 'user') ? 'none' : 'flex'
                      }}
                    >
                      {getUserInitials(listing.hostName)}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{listing.rating || 4.5} ({listing.reviews || 8} reviews)</span>
                  </div>
                </div>
                {listing.isVerifiedUMN && (
                  <div className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    UMN Verified
                  </div>
                )}
              </div>
            </div>

            {/* Key Details */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold text-lg">${listing.price}{labels.priceLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium text-sm">{listing.location}</span>
                </div>
                
                {/* Conditional details */}
                {isMoveOutSale ? (
                  <>
                    {listing.condition && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Condition</span>
                        <span className="font-medium text-sm">{listing.condition}</span>
                      </div>
                    )}
                    {listing.category && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium text-sm">{listing.category}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Bedrooms</span>
                    <span className="font-medium text-sm">{listing.bedrooms} bed, {listing.bathrooms} bath</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features/Amenities */}
            {((isMoveOutSale && listing.features) || (!isMoveOutSale && listing.amenities)) && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isMoveOutSale ? 'Features' : 'Amenities'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {(isMoveOutSale ? listing.features : listing.amenities)?.slice(0, 6).map((item, index) => (
                    <div key={index} className="flex items-center p-2 bg-gray-50 rounded text-xs">
                      <div className="w-4 h-4 flex items-center justify-center text-orange-500 mr-2">
                        {getFeatureIcon(item)}
                      </div>
                      <span className="text-gray-700 capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="p-4 space-y-3">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`w-full py-3 px-4 rounded-lg border transition-colors flex items-center justify-center font-medium ${
                  isFavorited 
                    ? 'bg-red-50 border-red-200 text-red-600' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? 'Saved' : 'Save'}
              </button>
              
              <button
                onClick={() => router.push(`/sublease/search/${listing.id}`)}
                className="w-full py-3 px-4 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                {labels.actionButton}
              </button>
              
              <button
                onClick={() => router.push(`/sublease/search/${listing.id}/tour`)}
                className="w-full py-3 px-4 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                {labels.tourButton}
              </button>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isMoveOutSale ? 'About this item' : 'About this place'}
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Availability Information */}
            {listing.availableFrom && listing.availableTo && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  {isMoveOutSale ? 'Item Availability' : 'Availability'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {isMoveOutSale ? 'Available from' : 'Check-in'}
                    </span>
                    <span className="font-medium">
                      {listing.availableFrom.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {isMoveOutSale ? 'Available until' : 'Check-out'}
                    </span>
                    <span className="font-medium">
                      {listing.availableTo.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Contact Information */}
            {conversation && (
              <div className="p-4 border-t border-gray-200 bg-orange-50">
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1">Need Help?</h4>
                  <p className="text-gray-600 text-sm mb-4">
                    Contact {conversation.isUserHost 
                      ? `your ${isMoveOutSale ? 'buyer' : 'guest'}` 
                      : `your ${isMoveOutSale ? 'seller' : 'host'}`
                    } if you have any questions.
                  </p>
                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Phone className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                      <Video className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationDetailPage;