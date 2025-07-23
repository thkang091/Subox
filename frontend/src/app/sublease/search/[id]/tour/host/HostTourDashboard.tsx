import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, Users, Check, X, ChevronRight, 
  MapPin, User, Mail, Phone, AlertCircle, CheckCircle, 
  XCircle, Filter, Search, RefreshCw, Bell, Settings,
  Eye, MessageSquare
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot, doc, updateDoc, 
  addDoc, serverTimestamp, getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';
import EmailService from '@/lib/emailService';

export default function HostTourDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [tourRequests, setTourRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    today: 0
  });

  // Load tour requests for current host
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'tourRequests'),
      where('hostId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const requests = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          approvedAt: doc.data().approvedAt?.toDate(),
          rejectedAt: doc.data().rejectedAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        }));

        setTourRequests(requests);
        calculateStats(requests);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading tour requests:', error);
        setError('Failed to load tour requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const calculateStats = (requests) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      today: requests.filter(r => {
        const tourDate = new Date(r.date);
        return tourDate >= today && tourDate < tomorrow;
      }).length
    };

    setStats(stats);
  };

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
      const request = tourRequests.find(r => r.id === requestId);
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
          senderName: user.displayName || user.email,
          type: 'tour_response',
          title: `Tour Request ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
          message: `Your tour request for ${request.listingTitle} has been ${newStatus}`,
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

  const filteredRequests = tourRequests.filter(request => {
    // Filter by status
    if (filter !== 'all' && request.status !== filter) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        request.guestName?.toLowerCase().includes(searchLower) ||
        request.listingTitle?.toLowerCase().includes(searchLower) ||
        request.guestEmail?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tour requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Tour Requests Dashboard</h1>
          <p className="text-gray-600">Manage tour requests for your properties</p>
        </div>

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
            <div className="text-2xl font-bold text-blue-600">{stats.today}</div>
            <div className="text-sm text-gray-600">Today's Tours</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
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
                placeholder="Search by guest name, property, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full lg:w-80 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
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

        {/* Tour Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {filter === 'all' ? 'No tour requests yet' : `No ${filter} requests`}
            </h3>
            <p className="text-gray-500">
              {filter === 'all' 
                ? 'Tour requests will appear here when guests book tours for your properties.'
                : `You don't have any ${filter} tour requests at the moment.`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Request Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800 mb-1">
                          {request.listingTitle}
                        </h3>
                        <p className="text-gray-600 flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {request.listingLocation}
                        </p>
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
                          <div className="font-medium">{request.guestName}</div>
                          <div className="text-xs">{request.guestEmail}</div>
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

                    {request.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start">
                          <MessageSquare className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{request.message}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
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
                </div>
              </div>
            ))}
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
                      <p><span className="font-medium">Price:</span> ${selectedRequest.listingPrice}/month</p>
                    </div>
                  </div>

                  {/* Guest Info */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-3">Guest Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Name:</span> {selectedRequest.guestName}</p>
                      <p><span className="font-medium">Email:</span> {selectedRequest.guestEmail}</p>
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

                  {/* Action Buttons */}
                  {selectedRequest.status === 'pending' && (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => {
                          updateRequestStatus(selectedRequest.id, 'approved');
                          setSelectedRequest(null);
                        }}
                        className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
                      >
                        Approve Request
                      </button>
                      <button
                        onClick={() => {
                          updateRequestStatus(selectedRequest.id, 'rejected');
                          setSelectedRequest(null);
                        }}
                        className="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors font-medium"
                      >
                        Reject Request
                      </button>
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
}