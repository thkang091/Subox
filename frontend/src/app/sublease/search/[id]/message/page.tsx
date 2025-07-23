"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Send, ArrowLeft, Phone, Video, MoreVertical, 
  Image as ImageIcon, Paperclip, Info,
  MapPin, Calendar, DollarSign, Star, User, Heart,
  X, ChevronLeft, ChevronRight, Wifi, Droplets,
  Sparkles, Home, BedDouble, Plus, MessageCircle,
  Search, Filter, Package, Truck, Clock, Shield
} from 'lucide-react';
import { 
  collection, query, orderBy, onSnapshot, where,
  addDoc, doc, getDoc, updateDoc, serverTimestamp,
  increment, getDocs, limit
} from 'firebase/firestore';
import { 
  ref, uploadBytes, getDownloadURL, deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import { featuredListings } from '../../../../../data/listings';

const ConversationDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const conversationId = params?.id;
  const { user } = useAuth();
  
  const [conversation, setConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showListingDetails, setShowListingDetails] = useState(true);
  const [listing, setListing] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversationList, setShowConversationList] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'sublease', 'moveout'
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Determine if this is a move out sale conversation
  const isMoveOutSale = conversation?.conversationType === 'moveout';
  const isSubleaseConversation = !isMoveOutSale;

  // Get appropriate labels based on conversation type
  const getLabels = () => {
    if (isMoveOutSale) {
      return {
        hostLabel: 'Seller',
        guestLabel: 'Buyer',
        listingType: 'Item',
        priceLabel: '',
        actionButton: 'View Item Details',
        tourButton: 'Ask About Pickup',
        hostActions: ['Send Sale Agreement', 'Schedule Item Pickup', 'Request Payment Info'],
        guestActions: ['Ask About Condition', 'Inquire About Pickup Time', 'Request More Photos']
      };
    } else {
      return {
        hostLabel: 'Host',
        guestLabel: 'Guest',
        listingType: 'Listing',
        priceLabel: '/month',
        actionButton: 'View Full Details',
        tourButton: 'Schedule Tour',
        hostActions: ['Send Rental Agreement', 'Schedule Property Tour', 'Request References'],
        guestActions: ['Request Tour', 'Ask About Utilities', 'Inquire About Move-in Date']
      };
    }
  };

  const labels = getLabels();

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations list
  useEffect(() => {
    if (!user?.uid) {
      setConversationsLoading(false);
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

          // Get latest message
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
            // Determine conversation type
            conversationType: data.conversationType || (data.listingType === 'moveout' ? 'moveout' : 'sublease')
          };
        });

        const conversationData = await Promise.all(conversationPromises);
        setConversations(conversationData);
        setConversationsLoading(false);
      },
      (error) => {
        console.error('Error fetching conversations:', error);
        setConversationsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Load conversation details
  useEffect(() => {
    if (!conversationId || !user?.uid) {
      setLoading(false);
      return;
    }

    const loadConversation = async () => {
      try {
        const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
        
        if (!conversationDoc.exists()) {
          console.error('Conversation not found');
          setLoading(false);
          return;
        }

        const conversationData = conversationDoc.data();
        
        // Check if user is participant
        if (!conversationData.participants.includes(user.uid)) {
          console.error('User not authorized for this conversation');
          router.push('/sublease/search');
          return;
        }

        // Determine user role
        const isUserHost = conversationData.hostId === user.uid;
        const otherParticipant = isUserHost ? {
          id: conversationData.guestId,
          name: conversationData.guestName,
          email: conversationData.guestEmail,
          image: conversationData.guestImage || '/api/placeholder/40/40'
        } : {
          id: conversationData.hostId,
          name: conversationData.hostName,
          email: conversationData.hostEmail,
          image: conversationData.hostImage || '/api/placeholder/40/40'
        };

        const conversationWithType = {
          id: conversationDoc.id,
          ...conversationData,
          isUserHost,
          otherParticipant,
          createdAt: conversationData.createdAt?.toDate() || new Date(),
          updatedAt: conversationData.updatedAt?.toDate() || new Date(),
          // Determine conversation type
          conversationType: conversationData.conversationType || (conversationData.listingType === 'moveout' ? 'moveout' : 'sublease')
        };

        setConversation(conversationWithType);

        // Load listing details
        await loadListingDetails(conversationData.listingId, conversationWithType.conversationType);

        // Mark messages as read
        await markMessagesAsRead(conversationDoc.id, isUserHost);
        
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConversation();
  }, [conversationId, user?.uid, router]);

  // Load listing details (works for both sublease and moveout)
  const loadListingDetails = async (listingId, conversationType = 'sublease') => {
    if (!listingId) return;

    try {
      // Try featured listings first (mock data) - primarily for sublease
      if (conversationType !== 'moveout') {
        const foundListing = featuredListings.find(listing => listing.id === listingId);
        if (foundListing) {
          setListing(foundListing);
          return;
        }
      }
      
      // Try appropriate Firestore collection based on type
      const collectionName = conversationType === 'moveout' ? 'moveout-items' : 'listings';
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

        // Format data based on conversation type
        let formattedListing;
        
        if (conversationType === 'moveout') {
          formattedListing = {
            id: docSnap.id,
            title: firestoreData.title || firestoreData.itemName || 'Unnamed Item',
            location: firestoreData.location || firestoreData.pickupLocation || 'Campus Area',
            image: firestoreData.image || firestoreData.images?.[0] || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&h=500&auto=format&fit=crop",
            additionalImages: firestoreData.additionalImages || firestoreData.images?.slice(1) || [],
            price: Number(firestoreData.price || 0),
            condition: firestoreData.condition || 'Good',
            category: firestoreData.category || 'Other',
            rating: Number(firestoreData.sellerRating || 4.2),
            reviews: Number(firestoreData.sellerReviews || 8),
            features: Array.isArray(firestoreData.features) ? firestoreData.features : [],
            hostName: firestoreData.sellerName || firestoreData.hostName || 'Anonymous',
            hostImage: firestoreData.sellerImage || firestoreData.hostImage || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
            description: firestoreData.description || 'No description available',
            availableFrom: convertFirestoreDate(firestoreData.availableFrom || firestoreData.pickupDate),
            availableTo: convertFirestoreDate(firestoreData.availableTo || firestoreData.lastPickupDate),
            isVerifiedUMN: Boolean(firestoreData.isVerifiedUMN || false),
            // Move out sale specific fields
            dimensions: firestoreData.dimensions,
            weight: firestoreData.weight,
            pickupInfo: firestoreData.pickupInfo,
            paymentMethods: firestoreData.paymentMethods || []
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
            rating: Number(firestoreData.rating || 4.2),
            reviews: Number(firestoreData.reviews || 8),
            amenities: Array.isArray(firestoreData.amenities) ? firestoreData.amenities : [],
            hostName: firestoreData.hostName || 'Anonymous',
            hostImage: firestoreData.hostImage || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
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
  };

  // Real-time messages listener
  useEffect(() => {
    if (!conversationId || !user?.uid) return;

    const messagesQuery = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const messageData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        
        setMessages(messageData);
      },
      (error) => {
        console.error('Error fetching messages:', error);
      }
    );

    return () => unsubscribe();
  }, [conversationId, user?.uid]);

  // Mark messages as read
  const markMessagesAsRead = async (convId, isHost) => {
    try {
      const updateField = isHost ? 'hostUnreadCount' : 'guestUnreadCount';
      await updateDoc(doc(db, 'conversations', convId), {
        [updateField]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Send message
  const sendMessage = async (e, messageData = null) => {
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
        lastMessage: finalMessageData.text || (finalMessageData.type === 'image' ? '📷 Image' : '📎 File'),
        lastMessageTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [otherUserUnreadField]: increment(1)
      });

      if (!messageData) {
        setNewMessage('');
        inputRef.current?.focus();
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (file, type = 'file') => {
    if (!file || !conversation) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploadingFile(true);

    try {
      // Create unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      const folderPath = type === 'image' ? 'conversation-images' : 'conversation-files';
      const storageRef = ref(storage, `${folderPath}/${conversationId}/${filename}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create message data
      const messageData = {
        type: type,
        [type === 'image' ? 'imageUrl' : 'fileUrl']: downloadURL,
        fileName: file.name,
        fileSize: file.size,
        text: type === 'image' ? '' : `Shared a file: ${file.name}`
      };

      // Send message with file
      await sendMessage(null, messageData);

    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file, 'image');
    }
    // Reset input
    e.target.value = '';
  };

  // Handle general file upload
  const handleGeneralFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, 'file');
    }
    // Reset input
    e.target.value = '';
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
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
  };

  // Format time display for conversation list
  const formatConversationTime = (date) => {
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

  // Get preview text for message
  const getMessagePreview = (message) => {
    if (!message) return 'No messages yet';
    
    switch (message.type) {
      case 'image':
        return '📷 Image';
      case 'file':
        return '📎 File';
      default:
        return message.text || 'Message';
    }
  };

  // Filter conversations based on active tab
  const filteredConversations = conversations.filter(conv => {
    // Tab filter
    let matchesTab = true;
    if (activeTab === 'sublease') {
      matchesTab = conv.conversationType !== 'moveout';
    } else if (activeTab === 'moveout') {
      matchesTab = conv.conversationType === 'moveout';
    }

    // Search filter
    const matchesSearch = !searchTerm || 
      conv.listingTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.otherParticipant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.listingLocation?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Format message time
  const formatMessageTime = (date) => {
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
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
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
  };

  // Image navigation
  const allImages = listing ? [
    listing.image,
    ...(Array.isArray(listing.additionalImages) ? listing.additionalImages : [])
  ].filter(Boolean) : [];

  const goToPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  const goToNextImage = () => {
    setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  // Feature/Amenity icons (works for both types)
  const getFeatureIcon = (feature) => {
    switch (feature.toLowerCase()) {
      case 'wifi': return <Wifi size={16} />;
      case 'parking': return <MapPin size={16} />;
      case 'laundry': return <Droplets size={16} />;
      case 'furnished': return <Home size={16} />;
      case 'utilities': return <DollarSign size={16} />;
      case 'ac': return <Sparkles size={16} />;
      case 'delivery': return <Truck size={16} />;
      case 'warranty': return <Shield size={16} />;
      case 'pickup': return <Package size={16} />;
      default: return <Star size={16} />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const messageGroups = groupMessagesByDate(messages);

  if (loading || conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">Conversation not found</p>
          <button 
            onClick={() => router.push('/sublease/search/')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Image Gallery Modal */}
      {showAllImages && listing && (
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
              
              <button 
                onClick={goToPrevImage}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={goToNextImage}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
              >
                <ChevronRight size={24} />
              </button>
            </div>
            
            <div className="text-white text-center mb-4">
              {activeImage + 1} / {allImages.length}
            </div>
          </div>
        </div>
      )}
 
      {/* Left Sidebar - Conversations List */}
      {showConversationList && (
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Conversations Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Messages
              </h2>
              <button
                onClick={() => setShowConversationList(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tab Selection */}
            <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 px-3 py-1 rounded-md text-sm transition ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab('sublease')}
                className={`flex-1 px-3 py-1 rounded-md text-sm transition flex items-center justify-center ${
                  activeTab === 'sublease' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                <Home className="w-3 h-3 mr-1" />
                Sublease
              </button>
              <button
                onClick={() => setActiveTab('moveout')}
                className={`flex-1 px-3 py-1 rounded-md text-sm transition flex items-center justify-center ${
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
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
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                      conv.id === conversationId ? 'bg-orange-50 border-r-2 border-orange-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Listing Image with Type Indicator */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={conv.listingImage || '/api/placeholder/48/48'}
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
                              <span className={`px-2 py-1 rounded-full text-xs ${
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
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full mt-1">
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
      )}
 
      {/* Main Content Container */}
      <div className={`flex w-full transition-all duration-300 ${showListingDetails ? 'mr-0' : ''}`}>
        
        {/* Center - Messages */}
        <div className={`flex flex-col transition-all duration-300 ${showListingDetails ? 'flex-1 max-w-none' : 'w-full'}`}>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              {!showConversationList && (
                <button
                  onClick={() => setShowConversationList(true)}
                  className="p-2 hover:bg-gray-100 rounded-full mr-3 transition lg:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              
              <button
                onClick={() => router.push('/sublease/search/')}
                className="p-2 hover:bg-gray-100 rounded-full mr-3 transition hidden lg:block"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {conversation && (
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full overflow-hidden mr-3">
                    <img 
                      src={conversation.otherParticipant.image}
                      alt={conversation.otherParticipant.name}
                      className="w-full h-full object-cover"
                    />
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
                className={`p-2 rounded-full transition ${showListingDetails ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
              >
                <Info className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <Phone className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <Video className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
 
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!conversation ? (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose a conversation from the list to start messaging</p>
              </div>
            ) : messageGroups.length === 0 ? (
              <div className="text-center py-8">
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
                  <div className="text-center my-4">
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
                        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                      >
                        {/* Avatar for other user's messages */}
                        {!isOwnMessage && (
                          <div className={`w-8 h-8 rounded-full overflow-hidden mr-2 ${showAvatar ? '' : 'invisible'}`}>
                            <img 
                              src={conversation.otherParticipant.image}
                              alt={conversation.otherParticipant.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'ml-auto' : ''}`}>
                          {/* Handle different message types */}
                          {message.type === 'image' ? (
                            <div className="mb-2">
                              <div className="rounded-2xl overflow-hidden border border-gray-200">
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
                                : 'bg-white text-gray-900 border-gray-200'
                            }`}>
                              <div className="flex items-center">
                                <Paperclip className="w-4 h-4 mr-2 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium truncate">{message.fileName}</p>
                                  <p className={`text-xs ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'}`}>
                                    {formatFileSize(message.fileSize)}
                                  </p>
                                </div>
                                <button
                                  onClick={() => window.open(message.fileUrl, '_blank')}
                                  className={`ml-2 p-1 rounded ${
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
                                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
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
              className={`bg-white border-t border-gray-200 p-4 sticky bottom-0 left-0 right-0 ${dragOver ? 'bg-orange-50 border-orange-300' : ''}`}              onDragOver={handleDragOver}
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
 
              <form onSubmit={sendMessage} className="flex items-end space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full px-4 py-3 pr-20 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                      className="p-1 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
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
                      className="p-1 text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={(!newMessage.trim() || sending || uploadingFile)}
                  className={`p-3 rounded-full transition ${
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
 
        {/* Right Side - Listing/Item Details */}
        {showListingDetails && listing && (
          <div className="w-80 xl:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  {isMoveOutSale ? (
                    <><Package className="w-5 h-5 mr-2" />Item Details</>
                  ) : (
                    <><Home className="w-5 h-5 mr-2" />Listing Details</>
                  )}
                </h2>
                <button
                  onClick={() => setShowListingDetails(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Main Image */}
              <div className="relative mb-4">
                <div className="h-40 rounded-lg overflow-hidden">
                  <img 
                    src={allImages[activeImage] || listing.image}
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
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={goToNextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition"
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
              
              {/* Owner Avatar */}
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full overflow-hidden mr-3">
                  <img 
                    src={listing.hostImage}
                    alt={listing.hostName}
                    className="w-full h-full object-cover"
                  />
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
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">${listing.price}{labels.priceLabel}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Location</span>
                  <span className="font-medium text-right text-xs">{listing.location}</span>
                </div>
                
                {/* Conditional details based on type */}
                {isMoveOutSale ? (
                  <>
                    {listing.condition && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Condition</span>
                        <span className="font-medium text-xs">{listing.condition}</span>
                      </div>
                    )}
                    {listing.category && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Category</span>
                        <span className="font-medium text-xs">{listing.category}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Bedrooms</span>
                    <span className="font-medium text-xs">{listing.bedrooms} bed, {listing.bathrooms} bath</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rating</span>
                  <div className="flex items-center">
                    <Star className="w-3 h-3 text-orange-400 fill-current mr-1" />
                    <span className="font-medium text-sm">{listing.rating}</span>
                    <span className="text-gray-500 ml-1 text-xs">({listing.reviews})</span>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Features/Amenities */}
            {((isMoveOutSale && listing.features) || (!isMoveOutSale && listing.amenities)) && (
              <div className="p-4 border-b border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">
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
            <div className="p-4 space-y-2">
              <button
                onClick={() => setIsFavorited(!isFavorited)}
                className={`w-full py-2 px-3 rounded-lg border transition flex items-center justify-center text-sm ${
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
                className="w-full py-2 px-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium text-sm"
              >
                {labels.actionButton}
              </button>
              
              <button
                onClick={() => router.push(`/sublease/search/${listing.id}/tour`)}
                className="w-full py-2 px-3 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition font-medium text-sm"
              >
                {labels.tourButton}
              </button>
            </div>
 
            {/* Quick Actions for Conversations */}
            {conversation && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Quick Actions</h4>
                <div className="space-y-2 text-xs">
                  {conversation.isUserHost ? (
                    labels.hostActions.map((action, index) => (
                      <button key={index} className="w-full text-left text-orange-600 hover:text-orange-800 py-2">
                        {action}
                      </button>
                    ))
                  ) : (
                    labels.guestActions.map((action, index) => (
                      <button 
                        key={index}
                        onClick={() => {
                          if (action.includes('Tour') || action.includes('Pickup')) {
                            router.push(`/sublease/search/${listing.id}/tour`);
                          }
                        }}
                        className="w-full text-left text-orange-600 hover:text-orange-800 py-2"
                      >
                        {action}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
 
            {/* Description */}
            {listing.description && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">
                  {isMoveOutSale ? 'About this item' : 'About this place'}
                </h4>
                <p className="text-gray-700 text-xs leading-relaxed">
                  {listing.description}
                </p>
              </div>
            )}
 
            {/* Availability/Pickup Information */}
            {listing.availableFrom && listing.availableTo && (
              <div className="p-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">
                  {isMoveOutSale ? 'Pickup Availability' : 'Availability'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
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
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">
                      {isMoveOutSale ? 'Last pickup date' : 'Check-out'}
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

            {/* Move Out Sale Specific Information */}
            {isMoveOutSale && (
              <>
                {/* Dimensions and Weight */}
                {(listing.dimensions || listing.weight) && (
                  <div className="p-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Item Specifications</h4>
                    <div className="space-y-2">
                      {listing.dimensions && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Dimensions</span>
                          <span className="font-medium">{listing.dimensions}</span>
                        </div>
                      )}
                      {listing.weight && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Weight</span>
                          <span className="font-medium">{listing.weight}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Methods */}
                {listing.paymentMethods && listing.paymentMethods.length > 0 && (
                  <div className="p-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Payment Methods</h4>
                    <div className="flex flex-wrap gap-2">
                      {listing.paymentMethods.map((method, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pickup Information */}
                {listing.pickupInfo && (
                  <div className="p-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3 text-sm">Pickup Information</h4>
                    <p className="text-gray-700 text-xs leading-relaxed">
                      {listing.pickupInfo}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Contact Information */}
            {conversation && (
              <div className="p-4 border-t border-gray-200 bg-orange-50">
                <div className="text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-5 h-5 text-orange-600" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-1 text-sm">Need Help?</h4>
                  <p className="text-gray-600 text-xs mb-4">
                    Contact {conversation.isUserHost 
                      ? `your ${isMoveOutSale ? 'buyer' : 'guest'}` 
                      : `your ${isMoveOutSale ? 'seller' : 'host'}`
                    } if you have any questions about this {isMoveOutSale ? 'item' : 'listing'}.
                  </p>
                  <div className="flex space-x-2">
                    <button className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs">
                      <Phone className="w-4 h-4 mx-auto" />
                    </button>
                    <button className="flex-1 py-2 px-3 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-xs">
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