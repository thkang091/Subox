"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  ChevronLeft, Calendar, Clock, Video, Users, ChevronRight, MapPin, 
  DollarSign, Star, CheckCircle, User, AlertCircle, Settings, RefreshCw 
} from 'lucide-react';
import { 
  doc, getDoc, addDoc, collection, serverTimestamp, query, where, getDocs 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import HostAvailabilitySetup from './host/HostAvailabilitySetup';
import HostTourDashboard from './host/HostTourDashboard';
import GuestTourDashboard from './guest/GuestTourDashboard';
import EmailService from '@/lib/emailService';

export default function TourPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const { user, loading: authLoading, requireAuth } = useAuth();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [tourType, setTourType] = useState('virtual');
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [error, setError] = useState('');
  const [existingBooking, setExistingBooking] = useState(null);
  
  // Host availability state
  const [hostAvailability, setHostAvailability] = useState(null);
  const [showAvailabilitySetup, setShowAvailabilitySetup] = useState(false);
  const [showTourDashboard, setShowTourDashboard] = useState(false);
  const [showGuestDashboard, setShowGuestDashboard] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [existingTours, setExistingTours] = useState([]);
  
  // Check for existing bookings
  const checkExistingBookings = async () => {
    if (!user || !id) return;
    
    try {
      const q = query(
        collection(db, 'tourRequests'),
        where('listingId', '==', id),
        where('guestId', '==', user.uid),
        where('status', 'in', ['pending', 'approved'])
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const booking = querySnapshot.docs[0].data();
        setExistingBooking(booking);
      }
    } catch (error) {
      console.error('Error checking existing bookings:', error);
    }
  };

  // Load existing tour bookings for availability calculation
  const loadExistingTours = async () => {
    if (!id) return [];
    
    try {
      const q = query(
        collection(db, 'tourRequests'),
        where('listingId', '==', id),
        where('status', 'in', ['approved', 'pending'])
      );
      
      const querySnapshot = await getDocs(q);
      const tours = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date
      }));
      
      setExistingTours(tours);
      return tours;
    } catch (error) {
      console.error('Error loading existing tours:', error);
      return [];
    }
  };

  // Load host availability from database
  const loadHostAvailability = async () => {
    if (!id || !listing?.hostId) return;

    setAvailabilityLoading(true);
    
    try {
      const availabilityDoc = await getDoc(doc(db, 'hostAvailability', `${id}_${listing.hostId}`));
      
      if (availabilityDoc.exists()) {
        const data = availabilityDoc.data();
        setHostAvailability(data);
        
        // If user is the host and no availability is set, show setup
        if (user?.uid === listing.hostId && !data.availability) {
          setShowAvailabilitySetup(true);
        }
      } else {
        // No availability set
        if (user?.uid === listing.hostId) {
          setShowAvailabilitySetup(true);
        } else {
          setHostAvailability(null);
        }
      }
    } catch (error) {
      console.error('Error loading host availability:', error);
    } finally {
      setAvailabilityLoading(false);
    }
  };
  
  // Fetch listing data
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      setLoading(true);
      setError('');
      
      try {
        const docRef = doc(db, 'listings', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          const listingData = {
            id: docSnap.id,
            ...data,
            image: data.image || "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
            hostName: data.hostName || data.createdBy?.displayName || 'Property Host',
            hostId: data.createdBy?.uid || data.hostId,
            hostEmail: data.createdBy?.email || data.hostEmail,
            rating: data.rating || 4.8,
            reviewCount: data.reviewCount || 23
          };
          
          setListing(listingData);
          
          // Check if current user is the host
          if (user?.uid === listingData.hostId) {
            setIsHost(true);
          }
        } else {
          setError('Listing not found');
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
        setError('Failed to load listing. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchListing();
  }, [id, user]);

  // Load availability and existing tours when listing is loaded
  useEffect(() => {
    if (listing) {
      loadHostAvailability();
      loadExistingTours();
    }
  }, [listing, user]);
  
  // Check existing bookings when user changes
  useEffect(() => {
    if (user && listing && !isHost) {
      checkExistingBookings();
    }
  }, [user, listing, isHost, id]);

  // Generate available time slots based on host availability
  const generateAvailableSlots = (date, hostAvailability) => {
    if (!hostAvailability || !hostAvailability.availability) return [];
    
    const dayOfWeek = date.getDay();
    const dayAvailability = hostAvailability.availability[dayOfWeek];
    
    if (!dayAvailability || !dayAvailability.available || !dayAvailability.times) {
      return [];
    }

    const dateString = date.toISOString().split('T')[0];
    const now = new Date();
    const minBookingTime = new Date(now.getTime() + (hostAvailability.advanceBooking || 24) * 60 * 60 * 1000);
    
    // Get existing bookings for this date
    const dayBookings = existingTours.filter(tour => {
      const tourDate = new Date(tour.date);
      return tourDate.toDateString() === date.toDateString();
    });

    // Check if max bookings reached
    if (dayBookings.length >= (hostAvailability.maxBookings || 3)) {
      return [];
    }

    const availableSlots = [];
    const duration = hostAvailability.appointmentDuration || 60;
    const buffer = hostAvailability.bufferTime || 15;

    dayAvailability.times.forEach(timeBlock => {
      const [startHour, startMinute] = timeBlock.start.split(':').map(Number);
      const [endHour, endMinute] = timeBlock.end.split(':').map(Number);
      
      const blockStart = new Date(date);
      blockStart.setHours(startHour, startMinute, 0, 0);
      
      const blockEnd = new Date(date);
      blockEnd.setHours(endHour, endMinute, 0, 0);
      
      let currentSlot = new Date(blockStart);
      
      while (currentSlot.getTime() + duration * 60 * 1000 <= blockEnd.getTime()) {
        const slotEnd = new Date(currentSlot.getTime() + duration * 60 * 1000);
        
        // Check if slot is in the future with minimum advance booking
        if (currentSlot >= minBookingTime) {
          // Check if slot conflicts with existing bookings
          const hasConflict = dayBookings.some(booking => {
            const bookingStart = new Date(booking.date);
            const bookingEnd = new Date(bookingStart.getTime() + duration * 60 * 1000);
            
            return (currentSlot < bookingEnd && slotEnd > bookingStart);
          });
          
          if (!hasConflict) {
            availableSlots.push({
              time: currentSlot.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              datetime: currentSlot.toISOString()
            });
          }
        }
        
        // Move to next slot (duration + buffer)
        currentSlot = new Date(currentSlot.getTime() + (duration + buffer) * 60 * 1000);
      }
    });

    return availableSlots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    
    // Check authentication
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Prevent self-booking
    if (user.uid === listing.hostId) {
      setError("You cannot book a tour for your own listing!");
      return;
    }
    
    // Check for existing bookings
    if (existingBooking) {
      setError("You already have a pending or approved tour request for this property.");
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create tour request in Firestore
      const tourRequest = {
        listingId: listing.id,
        listingTitle: listing.title,
        listingLocation: listing.location,
        listingPrice: listing.price,
        listingImage: listing.image,
        hostId: listing.hostId,
        hostName: listing.hostName,
        hostEmail: listing.hostEmail,
        guestId: user.uid,
        guestName: user.displayName || user.email,
        guestEmail: user.email,
        date: selectedTime, // This is the full datetime from the selected slot
        time: new Date(selectedTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        tourType: tourType,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'tourRequests'), tourRequest);
      
      // Send email notification to host
      await EmailService.sendTourRequestEmail(
        listing.hostEmail,
        user.displayName || user.email,
        user.email,
        {
          ...tourRequest,
          message: '', // Add message field if you want to include guest messages
        }
      );
      
      // Create notification for the host
      const notification = {
        recipientId: listing.hostId,
        senderId: user.uid,
        senderName: user.displayName || user.email,
        type: 'tour_request',
        title: 'New Tour Request',
        message: `${user.displayName || user.email} has requested a ${tourType} tour for ${listing.title}`,
        listingId: listing.id,
        tourDate: selectedTime,
        tourTime: new Date(selectedTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        read: false,
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'notifications'), notification);
      
      setShowConfirmation(true);
    } catch (error) {
      console.error('Error creating tour request:', error);
      setError('Failed to send tour request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calendar functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
    setSelectedDate(null);
    setSelectedTime('');
  };
  
  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
    setSelectedDate(null);
    setSelectedTime('');
  };
  
  const handleDateClick = (day, month, year) => {
    const newDate = new Date(year, month, day);
    const availableSlots = generateAvailableSlots(newDate, hostAvailability);
    
    if (availableSlots.length > 0) {
      setSelectedDate(newDate);
      setSelectedTime('');
    }
  };
  
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month days
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${prevMonthDays - i}`} className="p-2 text-center text-gray-300 text-sm">
          {prevMonthDays - i}
        </div>
      );
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const availableSlots = generateAvailableSlots(date, hostAvailability);
      const isAvailable = availableSlots.length > 0;
      const isSelected = selectedDate && selectedDate.getDate() === day && 
                         selectedDate.getMonth() === month && 
                         selectedDate.getFullYear() === year;
      const isPast = date < today;
      
      days.push(
        <div 
          key={`current-${day}`} 
          className={`p-1 text-center cursor-pointer rounded-lg mx-auto w-8 h-8 flex items-center justify-center text-sm font-medium transition-all duration-200
                     ${isSelected ? 'bg-orange-500 text-white shadow-lg transform scale-110' : ''}
                     ${isAvailable && !isPast && !isSelected ? 'hover:bg-orange-100 hover:scale-105 text-gray-700' : ''}
                     ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                     ${!isAvailable && !isPast ? 'text-gray-400 cursor-not-allowed' : ''}
                     ${isAvailable && !isPast ? 'ring-1 ring-orange-200' : ''}
                    `}
          onClick={() => !isPast && isAvailable && handleDateClick(day, month, year)}
        >
          {day}
        </div>
      );
    }
    
    // Next month days
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    for (let i = 1; i <= totalCells - (daysInMonth + firstDayOfMonth); i++) {
      days.push(
        <div key={`next-${i}`} className="p-2 text-center text-gray-300 text-sm">
          {i}
        </div>
      );
    }
    
    return days;
  };
  
  const availableSlots = selectedDate ? generateAvailableSlots(selectedDate, hostAvailability) : [];
  
  // Auth Modal Component
  const AuthModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <User className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sign In Required</h3>
          <p className="text-gray-600">Please sign in to book a tour with the host.</p>
        </div>
        <div className="space-y-3">
          <button 
            onClick={() => router.push('/auth/signin')}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Sign In
          </button>
          <button 
            onClick={() => setShowAuthModal(false)}
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
  
  // Existing Booking Alert
  const ExistingBookingAlert = () => (
    <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
      <div className="flex items-start">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
        <div>
          <h3 className="font-semibold text-yellow-800 mb-1">Existing Tour Request</h3>
          <p className="text-sm text-yellow-700">
            You already have a {existingBooking?.status} tour request for this property
            {existingBooking?.date && ` on ${new Date(existingBooking.date).toLocaleDateString()}`}.
          </p>
        </div>
      </div>
    </div>
  );

  // Show loading while auth is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tour booking...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/search')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }
  
  if (!listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🏠</div>
          <p className="text-xl text-gray-600 mb-4">Listing not found</p>
          <button 
            onClick={() => router.push('/search')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  // Show guest dashboard
  if (user && !isHost && showGuestDashboard) {
    return (
      <GuestTourDashboard onBack={() => setShowGuestDashboard(false)} />
    );
  }

  // Show tour dashboard for hosts
  if (isHost && showTourDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => setShowTourDashboard(false)}
            className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Tour Page
          </button>
          
          <HostTourDashboard />
        </div>
      </div>
    );
  }

  // Show availability setup for hosts
  if (isHost && showAvailabilitySetup) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <button 
            onClick={() => router.push(`/search/${id}`)}
            className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Listing
          </button>
          
          <HostAvailabilitySetup 
            listingId={id}
            hostId={user.uid}
            onComplete={() => {
              setShowAvailabilitySetup(false);
              loadHostAvailability();
            }}
          />
        </div>
      </div>
    );
  }
  
  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tour Request Sent!</h2>
            <p className="text-gray-600">Your tour request has been sent to {listing.hostName}.</p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold text-gray-700 mb-2">Tour Details:</h3>
            <p className="text-sm text-gray-600 mb-1">
              <Calendar className="w-4 h-4 inline mr-2" />
              {selectedDate?.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <Clock className="w-4 h-4 inline mr-2" />
              {new Date(selectedTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              })}
            </p>
            <p className="text-sm text-gray-600">
              {tourType === 'virtual' ? <Video className="w-4 h-4 inline mr-2" /> : <Users className="w-4 h-4 inline mr-2" />}
              {tourType === 'virtual' ? 'Virtual Tour' : 'In-Person Tour'}
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800">
              You'll receive a notification when {listing.hostName} responds to your request.
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => setShowGuestDashboard(true)}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              View My Tour Requests
            </button>
            <button 
              onClick={() => router.push(`/search/${id}`)}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Back to Listing
            </button>
            <button 
              onClick={() => router.push('/search')}
              className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Continue Searching
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Auth Modal */}
      {showAuthModal && <AuthModal />}
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm p-4">
        <button 
          onClick={() => router.push(`/search/${id}`)}
          className="flex items-center text-orange-600 hover:text-orange-800 font-medium"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back
        </button>
      </div>
      
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-4xl">
        {/* Desktop Back Button */}
        <button 
          onClick={() => router.push(`/search/${id}`)}
          className="hidden lg:flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Listing
        </button>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 lg:p-8">
            {/* Guest Management Section */}
            {user && !isHost && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-green-800">My Tour Requests</h3>
                    <p className="text-sm text-green-600">
                      View the status of your tour requests
                    </p>
                  </div>
                  <button
                    onClick={() => setShowGuestDashboard(true)}
                    className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    View My Requests
                  </button>
                </div>
              </div>
            )}
            
            {/* Host Management Section */}
            {isHost && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800">Host Management</h3>
                    <p className="text-sm text-blue-600">
                      {hostAvailability ? 'Manage your tour availability and requests' : 'Set up your tour availability'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowTourDashboard(true)}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      View Requests
                    </button>
                    <button
                      onClick={() => setShowAvailabilitySetup(true)}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      {hostAvailability ? 'Edit Availability' : 'Set Availability'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <h1 className="text-2xl lg:text-3xl font-bold text-orange-800 mb-6">Schedule a Tour</h1>
            
            {/* Error Display */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}
            
            {/* No Availability Warning for Guests */}
            {!isHost && !hostAvailability && !availabilityLoading && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-1">No Availability Set</h3>
                    <p className="text-sm text-yellow-700">
                      The host hasn't set up their tour availability yet. Please contact them directly or check back later.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading Availability */}
            {availabilityLoading && (
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center">
                  <RefreshCw className="w-5 h-5 text-gray-600 animate-spin mr-3" />
                  <p className="text-gray-600">Loading availability...</p>
                </div>
              </div>
            )}
            
            {/* Existing Booking Alert */}
            {existingBooking && <ExistingBookingAlert />}
            
            {/* Property Info */}
            <div className="mb-8 p-4 bg-gray-50 rounded-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div 
                  className="w-full sm:w-24 h-24 rounded-xl overflow-hidden shadow-md"
                  style={{
                    backgroundImage: `url(${listing.image})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center'
                  }}
                ></div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg lg:text-xl text-gray-800">{listing.title}</h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {listing.location}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-orange-800 font-bold text-lg flex items-center">
                      <DollarSign className="w-5 h-5" />
                      {listing.price}/month
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                      {listing.rating} ({listing.reviewCount} reviews)
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Host Info */}
            <div className="mb-6 p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isHost ? 'Your Listing' : `Requesting tour with ${listing.hostName}`}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isHost 
                      ? 'Manage your tour bookings and availability' 
                      : user 
                        ? `Booking as ${user.displayName || user.email}` 
                        : 'Sign in required to book'
                    }
                  </p>
                </div>
                {!user && !isHost && (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
            
            {/* Form - disabled if host, not authenticated, has existing booking, or no availability */}
            {!isHost && hostAvailability && (
              <form onSubmit={handleSubmit} className="space-y-8">
                <fieldset disabled={!user || existingBooking} className="space-y-8">
                  {/* Tour Type Selection */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-4 text-lg">Choose Tour Type</label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div 
                        className={`border-2 rounded-xl p-6 flex items-center cursor-pointer transition-all duration-200 ${
                          tourType === 'virtual' 
                            ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105' 
                            : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                        } ${(!user || existingBooking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !existingBooking && setTourType('virtual')}
                      >
                        <Video className={`w-6 h-6 mr-4 ${tourType === 'virtual' ? 'text-orange-500' : 'text-gray-400'}`} />
                        <div>
                          <div className={`font-semibold ${tourType === 'virtual' ? 'text-orange-800' : 'text-gray-700'}`}>
                            Virtual Tour
                          </div>
                          <div className="text-sm text-gray-500">Video call tour</div>
                        </div>
                      </div>
                      
                      <div 
                        className={`border-2 rounded-xl p-6 flex items-center cursor-pointer transition-all duration-200 ${
                          tourType === 'in-person' 
                            ? 'border-orange-500 bg-orange-50 shadow-md transform scale-105' 
                            : 'border-gray-200 hover:border-orange-200 hover:bg-gray-50'
                        } ${(!user || existingBooking) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => !existingBooking && setTourType('in-person')}
                      >
                        <Users className={`w-6 h-6 mr-4 ${tourType === 'in-person' ? 'text-orange-500' : 'text-gray-400'}`} />
                        <div>
                          <div className={`font-semibold ${tourType === 'in-person' ? 'text-orange-800' : 'text-gray-700'}`}>
                            In-Person Tour
                          </div>
                          <div className="text-sm text-gray-500">Meet at property</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Date Selection */}
                  <div>
                    <label className="block text-gray-700 font-semibold mb-4 text-lg">
                      <Calendar className="w-5 h-5 inline mr-2" />
                      Select Date
                    </label>
                    
                    <div className={`border-2 border-gray-200 rounded-xl overflow-hidden ${(!user || existingBooking) ? 'opacity-50' : ''}`}>
                      {/* Calendar Header */}
                      <div className="flex justify-between items-center p-4 bg-white border-b border-gray-200">
                        <button 
                          type="button"
                          onClick={prevMonth}
                          disabled={!user || existingBooking}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        
                        <h3 className="font-bold text-lg text-gray-800">
                          {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </h3>
                        
                        <button 
                          type="button"
                          onClick={nextMonth}
                          disabled={!user || existingBooking}
                          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      
                      {/* Day Headers */}
                      <div className="grid grid-cols-7 gap-1 p-4 bg-gray-50 border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1 p-4 bg-white">
                        {renderCalendar()}
                      </div>
                      
                      {/* Selected Date Display */}
                      {selectedDate && (
                        <div className="p-4 bg-orange-50 border-t border-orange-200">
                          <p className="text-sm text-orange-800 font-medium">
                            Selected: {selectedDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {selectedDate && availableSlots.length === 0 && (
                      <p className="mt-3 text-red-500 font-medium">
                        No available times for this date. Please select another date.
                      </p>
                    )}
                  </div>
                  
                  {/* Time Selection */}
                  {selectedDate && availableSlots.length > 0 && (
                    <div>
                      <label className="block text-gray-700 font-semibold mb-4 text-lg">
                        <Clock className="w-5 h-5 inline mr-2" />
                        Select Time
                      </label>
                      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 ${(!user || existingBooking) ? 'opacity-50' : ''}`}>
                        {availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            type="button"
                            disabled={!user || existingBooking}
                            className={`p-4 border-2 rounded-xl text-center font-medium transition-all duration-200 disabled:cursor-not-allowed ${
                              selectedTime === slot.datetime 
                                ? 'border-orange-500 bg-orange-50 text-orange-800 shadow-md transform scale-105' 
                                : 'border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedTime(slot.datetime)}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </fieldset>
                
                {/* Submit Button */}
                <button 
                  type="submit"
                  disabled={!user || !selectedDate || !selectedTime || isSubmitting || existingBooking}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                    (!user || !selectedDate || !selectedTime || isSubmitting || existingBooking)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg transform hover:scale-105'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Sending Request...
                    </div>
                  ) : !user ? (
                    'Sign In to Request Tour'
                  ) : existingBooking ? (
                    'Tour Already Requested'
                  ) : (
                    'Request Tour'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}