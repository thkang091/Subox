"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Clock, Video, Users, Check, X, 
  MapPin, User, AlertCircle, CheckCircle, 
  XCircle, Search, RefreshCw, Bell, Settings,
  Eye, MessageSquare, ChevronLeft, Plus, Trash2, Save,
  Home, Building2
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, doc, updateDoc, 
  addDoc, serverTimestamp, getDocs, setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import EmailService from '@/lib/emailService';

const ProfileTourPage = () => {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState(null); // 'host' or 'guest'
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'requests', 'availability'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canSwitchRoles, setCanSwitchRoles] = useState(false);

  // Host-specific state
  const [hostListings, setHostListings] = useState([]);
  const [hostTourRequests, setHostTourRequests] = useState([]);
  const [hostAvailabilities, setHostAvailabilities] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);

  // Guest-specific state
  const [guestTourRequests, setGuestTourRequests] = useState([]);

  // Common state
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    upcoming: 0
  });

  const isUpcoming = useCallback((date) => {
    return new Date(date) > new Date();
  }, []);

  // Helper function to determine the most relevant default role
  const determineDefaultRole = useCallback((listings, guestTours, hostTours) => {
    // If user has pending host requests, show host view
    const pendingHostRequests = hostTours.filter(tour => tour.status === 'pending').length;
    if (pendingHostRequests > 0) return 'host';
    
    // If user has upcoming guest tours, show guest view
    const upcomingGuestTours = guestTours.filter(tour => 
      tour.status === 'approved' && isUpcoming(tour.date)
    ).length;
    if (upcomingGuestTours > 0) return 'guest';
    
    // If user has listings, default to host
    if (listings.length > 0) return 'host';
    
    // Otherwise, default to guest
    return 'guest';
  }, [isUpcoming]);

  // Load host-specific data
  const loadHostData = () => {
    if (!user?.uid) return;

    // Load host tour requests
    const hostTourQuery = query(
      collection(db, 'tourRequests'),
      where('hostId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeHostTours = onSnapshot(hostTourQuery, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setHostTourRequests(requests);
      calculateHostStats(requests);
    });

    // Load host availability settings
    loadHostAvailabilities();

    return () => {
      unsubscribeHostTours();
    };
  };


  
  // Load guest-specific data
  const loadGuestData = () => {
    if (!user?.uid) return;

    const guestTourQuery = query(
      collection(db, 'tourRequests'),
      where('guestId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribeGuestTours = onSnapshot(guestTourQuery, (querySnapshot) => {
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        approvedAt: doc.data().approvedAt?.toDate(),
        rejectedAt: doc.data().rejectedAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
      setGuestTourRequests(requests);
      calculateGuestStats(requests);
    });

    return () => {
      unsubscribeGuestTours();
    };
  };

  // Determine user role and load data
  useEffect(() => {
    if (!user?.uid) return;

    const loadUserData = async () => {
      setLoading(true);
      try {
        // Check for URL parameters to force a specific role
        const urlParams = new URLSearchParams(window.location.search);
        const forceRole = urlParams.get('role'); // ?role=guest or ?role=host

        // Fetch all data first to determine capabilities
        const listingsQuery = query(
          collection(db, 'listings'),
          where('hostId', '==', user.uid)
        );
        const listingsSnapshot = await getDocs(listingsQuery);
        const listings = listingsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const guestTourQuery = query(
          collection(db, 'tourRequests'),
          where('guestId', '==', user.uid)
        );
        const guestTourSnapshot = await getDocs(guestTourQuery);
        const guestTours = guestTourSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const hostTourQuery = query(
          collection(db, 'tourRequests'),
          where('hostId', '==', user.uid)
        );
        const hostTourSnapshot = await getDocs(hostTourQuery);
        const hostTours = hostTourSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Determine if user can switch between roles
        const hasHostCapability = listings.length > 0 || hostTours.length > 0;
        const hasGuestCapability = guestTours.length > 0;
        setCanSwitchRoles(hasHostCapability && hasGuestCapability);

        // Determine role
        let finalRole;
        if (forceRole === 'guest' || forceRole === 'host') {
          finalRole = forceRole;
        } else {
          finalRole = determineDefaultRole(listings, guestTours, hostTours);
        }

        setUserRole(finalRole);

        if (finalRole === 'host') {
          setHostListings(listings);
          loadHostData();
        } else {
          setGuestTourRequests(guestTours);
          loadGuestData();
        }
      } catch (error) {
        console.error('Error determining user role:', error);
        // Default to guest view on error
        setUserRole('guest');
        loadGuestData();
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user?.uid, determineDefaultRole, loadGuestData, loadHostData]);



  // Switch between host and guest roles
  const switchToRole = (role) => {
    setUserRole(role);
    setActiveTab('overview');
    
    // Update URL without page reload
    const url = new URL(window.location);
    url.searchParams.set('role', role);
    window.history.pushState({}, '', url);

    if (role === 'host') {
      loadHostData();
    } else {
      loadGuestData();
    }
  };

  // Load host availability settings
  const loadHostAvailabilities = async () => {
    try {
      const availabilityQuery = query(
        collection(db, 'hostAvailability'),
        where('hostId', '==', user.uid)
      );
      const availabilitySnapshot = await getDocs(availabilityQuery);
      const availabilities = availabilitySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHostAvailabilities(availabilities);
    } catch (error) {
      console.error('Error loading host availabilities:', error);
    }
  };

  // Calculate stats for host
  const calculateHostStats = (requests) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      upcoming: requests.filter(r => 
        r.status === 'approved' && new Date(r.date) > today
      ).length
    };
    setStats(stats);
  };

  // Calculate stats for guest
  const calculateGuestStats = (requests) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      upcoming: requests.filter(r => 
        r.status === 'approved' && new Date(r.date) > today
      ).length
    };
    setStats(stats);
  };

  // Update tour request status (host only)
  const updateRequestStatus = async (requestId, newStatus, note = '') => {
    setUpdating(requestId);
    setError('');

    try {
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
        [`${newStatus}At`]: serverTimestamp(),
        [`${newStatus}By`]: user.uid
      };

      if (note) {
        updateData.hostNote = note;
      }

      await updateDoc(doc(db, 'tourRequests', requestId), updateData);

      // Send email notification to guest
      const request = hostTourRequests.find(r => r.id === requestId);
      if (request) {
        if (newStatus === 'approved') {
          await EmailService.sendTourApprovalEmail(
            request.guestEmail,
            request.guestName,
            request,
            note
          );
        } else if (newStatus === 'rejected') {
          await EmailService.sendTourRejectionEmail(
            request.guestEmail,
            request.guestName,
            request,
            note
          );
        }

        // Create notification for the guest
       const notification = {
  recipientId: request.guestId,
  senderId: user.uid,
  senderName: user.displayName || user.email || 'Anonymous',
  type: 'tour_response',
  title: `Tour Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
  message: `Your tour request for ${request.listingTitle || 'a property'} has been ${newStatus}`,
  listingId: request.listingId,
  tourRequestId: requestId,
  tourDate: request.date,
  read: false,
  createdAt: serverTimestamp()
};


        await addDoc(collection(db, 'notifications'), notification);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      setError('Failed to update request');
    } finally {
      setUpdating(null);
    }
  };

  // Utility functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'approved': return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };


  // Filter tour requests
  const getFilteredRequests = () => {
    const requests = userRole === 'host' ? hostTourRequests : guestTourRequests;
    
    return requests.filter(request => {
      if (filter !== 'all' && request.status !== filter) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.guestName?.toLowerCase().includes(searchLower) ||
          request.listingTitle?.toLowerCase().includes(searchLower) ||
          request.guestEmail?.toLowerCase().includes(searchLower) ||
          request.hostName?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  };

  // Availability Setup Component (Host only)
  const AvailabilitySetupModal = () => {
    const [appointmentDuration, setAppointmentDuration] = useState(60);
    const [availability, setAvailability] = useState({
      0: { available: false, times: [] },
      1: { available: true, times: [{ start: '09:00', end: '17:00' }] },
      2: { available: true, times: [{ start: '09:00', end: '17:00' }] },
      3: { available: true, times: [{ start: '09:00', end: '17:00' }] },
      4: { available: true, times: [{ start: '09:00', end: '17:00' }] },
      5: { available: true, times: [{ start: '09:00', end: '17:00' }] },
      6: { available: false, times: [] },
    });
    const [bufferTime, setBufferTime] = useState(15);
    const [advanceBooking, setAdvanceBooking] = useState(24);
    const [maxBookings, setMaxBookings] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const durationOptions = [30, 45, 60, 90, 120];

    // Load existing availability if editing
    useEffect(() => {
      if (selectedListing && showAvailabilityModal) {
        const existingAvailability = hostAvailabilities.find(
          avail => avail.listingId === selectedListing.id
        );
        
        if (existingAvailability) {
          setAvailability(existingAvailability.availability || availability);
          setAppointmentDuration(existingAvailability.appointmentDuration || 60);
          setBufferTime(existingAvailability.bufferTime || 15);
          setAdvanceBooking(existingAvailability.advanceBooking || 24);
          setMaxBookings(existingAvailability.maxBookings || 3);
        }
      }
    }, [selectedListing, showAvailabilityModal, availability, selectedListing, showAvailabilityModal]);

    const toggleDayAvailability = (dayIndex) => {
      setAvailability(prev => ({
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          available: !prev[dayIndex].available,
          times: !prev[dayIndex].available ? [{ start: '09:00', end: '17:00' }] : []
        }
      }));
    };

    const addTimeSlot = (dayIndex) => {
      setAvailability(prev => ({
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          times: [...prev[dayIndex].times, { start: '09:00', end: '17:00' }]
        }
      }));
    };

    const removeTimeSlot = (dayIndex, timeIndex) => {
      setAvailability(prev => ({
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          times: prev[dayIndex].times.filter((_, index) => index !== timeIndex)
        }
      }));
    };

    const updateTimeSlot = (dayIndex, timeIndex, field, value) => {
      setAvailability(prev => ({
        ...prev,
        [dayIndex]: {
          ...prev[dayIndex],
          times: prev[dayIndex].times.map((time, index) => 
            index === timeIndex ? { ...time, [field]: value } : time
          )
        }
      }));
    };

    const generateTimeOptions = () => {
      const options = [];
      for (let hour = 6; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
          options.push({ value: timeString, label: displayTime });
        }
      }
      return options;
    };

    const timeOptions = generateTimeOptions();

    const saveAvailability = async () => {
      if (!selectedListing) return;

      setIsLoading(true);
      setError('');

      try {
        const availabilityData = {
          listingId: selectedListing.id,
          hostId: user.uid,
          availability,
          appointmentDuration,
          bufferTime,
          advanceBooking,
          maxBookings,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await setDoc(
          doc(db, 'hostAvailability', `${selectedListing.id}_${user.uid}`), 
          availabilityData
        );
        
        setSuccess(true);
        setTimeout(() => {
          setShowAvailabilityModal(false);
          setSuccess(false);
          loadHostAvailabilities();
        }, 2000);

      } catch (error) {
        console.error('Error saving availability:', error);
        setError('Failed to save availability. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (success) {
      return (
        <div className="text-center p-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Availability Updated!</h3>
          <p className="text-gray-600">Your tour availability has been saved successfully.</p>
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto">
        {/* Basic Settings */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Appointment Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour Duration
              </label>
              <select
                value={appointmentDuration}
                onChange={(e) => setAppointmentDuration(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {durationOptions.map(duration => (
                  <option key={duration} value={duration}>
                    {duration} minutes
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buffer Time Between Tours
              </label>
              <select
                value={bufferTime}
                onChange={(e) => setBufferTime(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={0}>No buffer</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Advance Booking
              </label>
              <select
                value={advanceBooking}
                onChange={(e) => setAdvanceBooking(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Tours Per Day
              </label>
              <select
                value={maxBookings}
                onChange={(e) => setMaxBookings(Number(e.target.value))}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                  <option key={num} value={num}>
                    {num} tour{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weekly Availability */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Availability</h3>
          
          <div className="space-y-3">
            {daysOfWeek.map((day, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => toggleDayAvailability(index)}
                      className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                        availability[index].available 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'border-gray-300'
                      }`}
                    >
                      {availability[index].available && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </button>
                    <h4 className={`font-medium text-sm ${
                      availability[index].available ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {day}
                    </h4>
                  </div>
                  
                  {availability[index].available && (
                    <button
                      type="button"
                      onClick={() => addTimeSlot(index)}
                      className="text-orange-600 hover:text-orange-800 text-xs font-medium flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Time
                    </button>
                  )}
                </div>

                {availability[index].available && (
                  <div className="space-y-2">
                    {availability[index].times.map((timeSlot, timeIndex) => (
                      <div key={timeIndex} className="flex items-center gap-2">
                        <select
                          value={timeSlot.start}
                          onChange={(e) => updateTimeSlot(index, timeIndex, 'start', e.target.value)}
                          className="flex-1 p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        >
                          {timeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        
                        <span className="text-gray-500 text-xs">to</span>
                        
                        <select
                          value={timeSlot.end}
                          onChange={(e) => updateTimeSlot(index, timeIndex, 'end', e.target.value)}
                          className="flex-1 p-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-orange-500 focus:border-transparent"
                        >
                          {timeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        {availability[index].times.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTimeSlot(index, timeIndex)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!availability[index].available && (
                  <p className="text-xs text-gray-500 italic">Unavailable</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={saveAvailability}
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {isLoading ? (
              <div className="flex items-center">
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center">
                <Save className="w-4 h-4 mr-2" />
                Save Availability
              </div>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tour management...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6">
          <User className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to view your tour management.</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={() => router.push('/profile')}
            className="flex items-center text-orange-600 hover:text-orange-800 mb-4 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back to Profile
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">
                {userRole === 'host' ? 'Host Tour Management' : 'My Tour Requests'}
              </h1>
              <p className="text-gray-600">
                {userRole === 'host' 
                  ? 'Manage your tour availability and guest requests' 
                  : 'Track your tour requests and upcoming appointments'
                }
              </p>
            </div>
            
            {userRole === 'guest' && (
              <button
                onClick={() => router.push('/sublease/search')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Listings
              </button>
            )}
          </div>
        </div>

        {/* Role Toggle for Mixed Users */}
        {canSwitchRoles && (
          <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-center">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => switchToRole('guest')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userRole === 'guest'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Guest View
                </button>
                <button
                  onClick={() => switchToRole('host')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    userRole === 'host'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Host View
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.upcoming}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
        </div>

        {/* Host-specific tabs */}
        {userRole === 'host' && (
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'overview'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'requests'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Tour Requests
                </button>
                <button
                  onClick={() => setActiveTab('availability')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'availability'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Availability Settings
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4 rounded-xl mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Host Overview Tab */}
        {userRole === 'host' && activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Listings with Availability Status */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Listings</h2>
              
              {hostListings.length > 0 ? (
                <div className="space-y-4">
                  {hostListings.map(listing => {
                    const availabilitySet = hostAvailabilities.some(avail => avail.listingId === listing.id);
                    const listingTours = hostTourRequests.filter(tour => tour.listingId === listing.id);
                    const pendingTours = listingTours.filter(tour => tour.status === 'pending').length;
                    
                    return (
                      <div key={listing.id} className="border border-gray-200 rounded-lg p-4 hover:border-orange-300 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">
                                {listing.address || listing.location || 'Location not specified'}
                              </h3>
                              {availabilitySet ? (
                                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  Tours Enabled
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                                  Setup Required
                                </span>
                              )}
                              {pendingTours > 0 && (
                                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                  {pendingTours} Pending
                                </span>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Total Tours: {listingTours.length}</p>
                              {listing.bedrooms && listing.bathrooms && (
                                <p className="flex items-center">
                                  <Home className="w-4 h-4 mr-1" />
                                  {listing.bedrooms} bed • {listing.bathrooms} bath
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col space-y-2">
                            <button
                              onClick={() => router.push(`/listing/${listing.id}`)}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200 transition-colors"
                            >
                              View Listing
                            </button>
                            <button
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowAvailabilityModal(true);
                              }}
                              className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs hover:bg-orange-200 transition-colors"
                            >
                              {availabilitySet ? 'Edit Availability' : 'Setup Tours'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first listing to start hosting tours</p>
                  <button
                    onClick={() => router.push('/create-listing')}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Listing
                  </button>
                </div>
              )}
            </div>

            {/* Recent Tour Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Tour Activity</h2>
              
              {hostTourRequests.length > 0 ? (
                <div className="space-y-4">
                  {hostTourRequests.slice(0, 5).map(request => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
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
                          </div>
                          
                          <h4 className="font-medium text-gray-900 mb-1">{request.guestName}</h4>
                          <div className="text-sm text-gray-600">
                            <p>{request.date} at {request.time}</p>
                            <p className="truncate">{request.listingTitle}</p>
                          </div>
                        </div>
                        
                        {request.status === 'pending' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => updateRequestStatus(request.id, 'approved')}
                              disabled={updating === request.id}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
                            >
                              {updating === request.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                'Approve'
                              )}
                            </button>
                            <button
                              onClick={() => updateRequestStatus(request.id, 'rejected')}
                              disabled={updating === request.id}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                            >
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
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Tour Requests</h3>
                  <p className="text-gray-500">Tour requests will appear here when guests book tours</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Host Requests Tab or Guest Main View */}
        {(userRole === 'host' && activeTab === 'requests') || userRole === 'guest' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {/* Filters and Search */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      filter === status
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                    {status !== 'all' && (
                      <span className="ml-2 text-xs">
                        ({stats[status]})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search by ${userRole === 'host' ? 'guest name or property' : 'property or host'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full lg:w-80 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Tour Requests List */}
            {getFilteredRequests().length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  {filter === 'all' ? 'No tour requests yet' : `No ${filter} requests`}
                </h3>
                <p className="text-gray-500">
                  {userRole === 'host' 
                    ? 'Tour requests will appear here when guests book tours for your properties.'
                    : filter === 'all' 
                      ? 'Start exploring listings to request your first tour.'
                      : `You don't have any ${filter} tour requests at the moment.`
                  }
                </p>
                {userRole === 'guest' && (
                  <button
                    onClick={() => router.push('/sublease/search')}
                    className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Listings
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredRequests().map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Request Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-800 mb-1">
                              {request.listingTitle || `Property #${request.listingId?.slice(-6)}`}
                            </h3>
                            {request.listingLocation && (
                              <p className="text-gray-600 flex items-center text-sm">
                                <MapPin className="w-4 h-4 mr-1" />
                                {request.listingLocation}
                              </p>
                            )}
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            <div className="flex items-center">
                              {getStatusIcon(request.status)}
                              <span className="ml-1 capitalize">{request.status}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <User className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium">
                                {userRole === 'host' ? request.guestName : request.hostName}
                              </div>
                              <div className="text-xs">
                                {userRole === 'host' ? request.guestEmail : 'Host'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium">
                                {new Date(request.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs">{request.time}</div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            {request.tourType === 'virtual' ? (
                              <Video className="w-4 h-4 mr-2" />
                            ) : (
                              <Users className="w-4 h-4 mr-2" />
                            )}
                            <div>
                              <div className="font-medium capitalize">{request.tourType}</div>
                              <div className="text-xs">Tour</div>
                            </div>
                          </div>

                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <div>
                              <div className="font-medium">
                                {request.createdAt?.toLocaleDateString()}
                              </div>
                              <div className="text-xs">Requested</div>
                            </div>
                          </div>
                        </div>

                        {/* Status Messages for Guests */}
                        {userRole === 'guest' && (
                          <div className={`mt-3 p-3 rounded-lg ${
                            request.status === 'pending' ? 'bg-yellow-50' :
                            request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                          }`}>
                            <p className={`text-sm font-medium ${
                              request.status === 'pending' ? 'text-yellow-800' :
                              request.status === 'approved' ? 'text-green-800' : 'text-red-800'
                            }`}>
                              {request.status === 'pending' && 'Your tour request is being reviewed by the host'}
                              {request.status === 'approved' && 'Great! Your tour has been approved'}
                              {request.status === 'rejected' && 'This tour request was declined. Try booking a different time'}
                            </p>
                          </div>
                        )}

                        {/* Host Note */}
                        {request.hostNote && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-start">
                              <MessageSquare className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="font-medium text-blue-800 text-sm mb-1">Host Message:</div>
                                <p className="text-sm text-blue-700">{request.hostNote}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Upcoming Tour Alert for Guests */}
                        {userRole === 'guest' && request.status === 'approved' && isUpcoming(request.date) && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-green-800 text-sm">Tour Confirmed!</p>
                                <p className="text-green-700 text-xs">
                                  {request.tourType === 'virtual' 
                                    ? "You'll receive a video call link from the host." 
                                    : 'Meet the host at the property address.'
                                  }
                                </p>
                              </div>
                              <Bell className="w-5 h-5 text-green-600" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons for Hosts */}
                      {userRole === 'host' && (
                        <div className="flex flex-col sm:flex-row gap-2 lg:flex-col lg:w-32">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'approved')}
                                disabled={updating === request.id}
                                className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                {updating === request.id ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-1" />
                                    Approve
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => updateRequestStatus(request.id, 'rejected')}
                                disabled={updating === request.id}
                                className="flex items-center justify-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium disabled:opacity-50"
                              >
                                <X className="w-4 h-4 mr-1" />
                                Reject
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Host Availability Tab */}
        {userRole === 'host' && activeTab === 'availability' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Availability Settings</h2>
              <p className="text-sm text-gray-600">Manage tour availability for each of your listings</p>
            </div>

            {hostListings.length > 0 ? (
              <div className="space-y-4">
                {hostListings.map(listing => {
                  const availabilityConfig = hostAvailabilities.find(avail => avail.listingId === listing.id);
                  
                  return (
                    <div key={listing.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg mb-1">
                            {listing.address || listing.location || 'Location not specified'}
                          </h3>
                          {availabilityConfig ? (
                            <div className="text-sm text-gray-600 space-y-1">
                              <p>Duration: {availabilityConfig.appointmentDuration} minutes</p>
                              <p>Buffer: {availabilityConfig.bufferTime} minutes</p>
                              <p>Advance booking: {availabilityConfig.advanceBooking} hours</p>
                              <p>Max daily tours: {availabilityConfig.maxBookings}</p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No availability settings configured</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowAvailabilityModal(true);
                          }}
                          className="flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          {availabilityConfig ? 'Edit Settings' : 'Setup Availability'}
                        </button>
                      </div>

                      {availabilityConfig && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-800 mb-3">Weekly Schedule</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                              const dayAvailability = availabilityConfig.availability[index];
                              return (
                                <div key={day} className="text-xs">
                                  <div className="font-medium text-gray-700 mb-1">{day}</div>
                                  {dayAvailability?.available ? (
                                    <div className="space-y-1">
                                      {dayAvailability.times.map((time, timeIndex) => (
                                        <div key={timeIndex} className="text-green-600">
                                          {time.start} - {time.end}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-gray-400">Unavailable</div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Available</h3>
                <p className="text-gray-500 mb-4">Create a listing first to set up tour availability</p>
                <button
                  onClick={() => router.push('/create-listing')}
                  className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Listing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Availability Setup Modal */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-90vh overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {hostAvailabilities.some(avail => avail.listingId === selectedListing?.id) 
                      ? 'Edit Tour Availability' 
                      : 'Setup Tour Availability'
                    }
                  </h2>
                  <button
                    onClick={() => setShowAvailabilityModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>
                {selectedListing && (
                  <p className="text-gray-600 mt-2">
                    Setting up tours for: {selectedListing.address || selectedListing.location}
                  </p>
                )}
              </div>
              
              <div className="p-6">
                <AvailabilitySetupModal />
              </div>
            </div>
          </div>
        )}

        {/* Request Details Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-90vh overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Tour Request Details</h2>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-700">Status:</span>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedRequest.status)}`}>
                      <div className="flex items-center">
                        {getStatusIcon(selectedRequest.status)}
                        <span className="ml-1 capitalize">{selectedRequest.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Property Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Title:</span> {selectedRequest.listingTitle}</p>
                      <p><span className="font-medium">Location:</span> {selectedRequest.listingLocation}</p>
                      {selectedRequest.listingPrice && (
                        <p><span className="font-medium">Price:</span> ${selectedRequest.listingPrice}/month</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">
                      {userRole === 'host' ? 'Guest Information' : 'Host Information'}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Name:</span> {
                          userRole === 'host' ? selectedRequest.guestName : selectedRequest.hostName
                        }
                      </p>
                      {userRole === 'host' && selectedRequest.guestEmail && (
                        <p><span className="font-medium">Email:</span> {selectedRequest.guestEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Tour Details */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Tour Details</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Type:</span> {selectedRequest.tourType} tour</p>
                      <p><span className="font-medium">Date:</span> {new Date(selectedRequest.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</p>
                      <p><span className="font-medium">Time:</span> {selectedRequest.time}</p>
                    </div>
                  </div>

                  {/* Message */}
                  {selectedRequest.message && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Guest Message</h3>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedRequest.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Host Note */}
                  {selectedRequest.hostNote && (
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Host Note</h3>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-700">{selectedRequest.hostNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Timeline</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Requested:</span> {selectedRequest.createdAt?.toLocaleString()}</p>
                      {selectedRequest.approvedAt && (
                        <p><span className="font-medium">Approved:</span> {selectedRequest.approvedAt.toLocaleString()}</p>
                      )}
                      {selectedRequest.rejectedAt && (
                        <p><span className="font-medium">Rejected:</span> {selectedRequest.rejectedAt.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Hosts */}
                  {userRole === 'host' && selectedRequest.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          updateRequestStatus(selectedRequest.id, 'approved');
                          setSelectedRequest(null);
                        }}
                        disabled={updating === selectedRequest.id}
                        className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                      >
                        {updating === selectedRequest.id ? (
                          <div className="flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                            Approving...
                          </div>
                        ) : (
                          'Approve Request'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          updateRequestStatus(selectedRequest.id, 'rejected');
                          setSelectedRequest(null);
                        }}
                        disabled={updating === selectedRequest.id}
                        className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                      >
                        Reject Request
                      </button>
                    </div>
                  )}

                  {/* Contact Actions for Guests */}
                  {userRole === 'guest' && selectedRequest.status === 'approved' && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">Your Tour is Confirmed!</h4>
                      <p className="text-sm text-green-700 mb-3">
                        {selectedRequest.tourType === 'virtual' 
                          ? "You'll receive a video call link from the host before your scheduled time."
                          : 'Make sure to arrive at the property address on time for your in-person tour.'
                        }
                      </p>
                      
                      {selectedRequest.tourType === 'virtual' ? (
                        <div className="flex items-center text-sm text-green-700">
                          <Video className="w-4 h-4 mr-2" />
                          Virtual tour - wait for host&apos;s video link
                        </div>
                      ) : (
                        <div className="flex items-center text-sm text-green-700">
                          <MapPin className="w-4 h-4 mr-2" />
                          Meet at: {selectedRequest.listingLocation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileTourPage;