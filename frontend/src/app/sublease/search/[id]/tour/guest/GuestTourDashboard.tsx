import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Video, Users, CheckCircle, XCircle, 
  AlertCircle, MapPin, User, Mail, RefreshCw, ChevronLeft,
  Bell, MessageSquare
} from 'lucide-react';
import { 
  collection, query, where, orderBy, onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/contexts/AuthInfo';

const GuestTourDashboard = ({ onBack }) => {
  const { user } = useAuth();
  const [tourRequests, setTourRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load tour requests for current guest
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'tourRequests'),
      where('guestId', '==', user.uid),
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
        setLoading(false);
      },
      (error) => {
        console.error('Error loading tour requests:', error);
        setError('Failed to load your tour requests');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'approved': return 'text-green-700 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'approved': return <CheckCircle className="w-5 h-5" />;
      case 'rejected': return <XCircle className="w-5 h-5" />;
      default: return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'pending': return 'Your tour request is being reviewed by the host';
      case 'approved': return 'Great! Your tour has been approved';
      case 'rejected': return 'This tour request was declined. Try booking a different time';
      default: return 'Unknown status';
    }
  };

  const isUpcoming = (date) => {
    return new Date(date) > new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your tour requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-orange-600 hover:text-orange-800 mb-4 font-medium transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">My Tour Requests</h1>
          <p className="text-gray-600">Track the status of your tour requests</p>
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

        {/* Tour Requests */}
        {tourRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow-sm text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tour requests yet</h3>
            <p className="text-gray-500 mb-6">
              You haven't requested any tours yet. Browse properties and book tours to see them here.
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              Browse Properties
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tourRequests.map((request) => (
              <div key={request.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(request.status)}`}>
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className="ml-2 capitalize">{request.status}</span>
                    </div>
                  </div>
                  
                  {request.status === 'approved' && isUpcoming(request.date) && (
                    <div className="bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-blue-700">Upcoming</span>
                    </div>
                  )}
                </div>

                {/* Status Message */}
                <div className={`p-3 rounded-lg mb-4 ${
                  request.status === 'pending' ? 'bg-yellow-50' :
                  request.status === 'approved' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    request.status === 'pending' ? 'text-yellow-800' :
                    request.status === 'approved' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {getStatusMessage(request.status)}
                  </p>
                </div>

                {/* Property Info */}
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-800 mb-2">{request.listingTitle}</h3>
                  <p className="text-gray-600 flex items-center text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {request.listingLocation}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Price:</span> ${request.listingPrice}/month
                  </p>
                </div>

                {/* Tour Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium text-sm">
                        {new Date(request.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="text-xs text-gray-500">{request.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    {request.tourType === 'virtual' ? (
                      <Video className="w-4 h-4 mr-2" />
                    ) : (
                      <Users className="w-4 h-4 mr-2" />
                    )}
                    <div>
                      <div className="font-medium text-sm capitalize">{request.tourType} Tour</div>
                      <div className="text-xs text-gray-500">
                        {request.tourType === 'virtual' ? 'Video call' : 'In-person visit'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <div>
                      <div className="font-medium text-sm">{request.hostName}</div>
                      <div className="text-xs text-gray-500">Host</div>
                    </div>
                  </div>
                </div>

                {/* Host Note */}
                {request.hostNote && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start">
                      <MessageSquare className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-blue-800 text-sm mb-1">Host Message:</div>
                        <p className="text-sm text-blue-700">{request.hostNote}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Requested: {request.createdAt?.toLocaleDateString()}</span>
                    {request.approvedAt && (
                      <span>Approved: {request.approvedAt.toLocaleDateString()}</span>
                    )}
                    {request.rejectedAt && (
                      <span>Declined: {request.rejectedAt.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Action for upcoming approved tours */}
                {request.status === 'approved' && isUpcoming(request.date) && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800 text-sm">Tour Confirmed!</p>
                        <p className="text-green-700 text-xs">
                          {request.tourType === 'virtual' 
                            ? 'You\'ll receive a video call link from the host.' 
                            : 'Meet the host at the property address.'
                          }
                        </p>
                      </div>
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestTourDashboard;