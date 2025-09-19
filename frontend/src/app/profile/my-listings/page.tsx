"use client"

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthInfo';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Home, 
  Lock, 
  Plus, 
  MapPin, 
  Calendar, 
  Bed, 
  Bath, 
  Edit, 
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Clock
} from 'lucide-react';

// Types
interface Listing {
  id: string;
  location?: string;
  address?: string;  // Your actual data structure
  title?: string;
  description?: string;
  rent?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  additionalImages?: string[];  // Your actual field name
  deliveryAvailable?: boolean;
  deactivatedAt?: Timestamp;
  pickupAvailable?: boolean;
  availableFrom?: Timestamp;
  availableTo?: Timestamp;
  hostId: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: 'active' | 'rented' | 'unavailable';
  amenities?: string[];
  furnished?: boolean;
  accommodationType?: string;
  additionalDetails?: string;
}

// Utility functions
const formatDate = (timestamp?: Timestamp): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

// NEW: Calculate days remaining for reactivation
const getDaysRemainingForReactivation = (deactivatedAt: Timestamp | undefined): number => {
  if (!deactivatedAt) return 0;
  
  const deactivatedDate = deactivatedAt.toDate ? deactivatedAt.toDate() : new Date(deactivatedAt);
  const now = new Date();
  const diffTime = now.getTime() - deactivatedDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, 5 - diffDays);
};

// NEW: Check if item can be reactivated (within 5 days)
const canReactivate = (deactivatedAt: Timestamp | undefined): boolean => {
  return getDaysRemainingForReactivation(deactivatedAt) > 0;
};

const formatRent = (rent: number | undefined): string => {
  if (!rent) return 'Contact for price';
  return `$${rent.toLocaleString()}/month`;
};

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

const AuthRequired = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center">
      <Lock className="mx-auto h-16 w-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h1>
      <p className="text-lg text-gray-600 mb-6">Please log in to view your listings.</p>
      <Link 
        href="/auth" 
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Sign In
      </Link>
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-16">
    <Home className="mx-auto h-16 w-16 text-gray-400 mb-4" />
    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Listings Yet</h2>
    <p className="text-gray-600 mb-6">You haven&apos;t created any sublease listings. Start listing your space today!</p>
    <Link 
      href="/create-listing" 
      className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
    >
      <Plus className="mr-2 h-4 w-4" />
      Create Listing
    </Link>
  </div>
);

const ListingCard = ({ listing, onStatusUpdate, onListDelete  }
  : { 
    listing: Listing; 
    onStatusUpdate: (id: string, status: string) => void; 
    onListDelete: (id: string) => void; 
  }) => {
  const [updating, setUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'rented':
        return 'bg-blue-100 text-blue-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePermanentDelete = async () => {
    if (!confirm('This item will be permanently deleted. This action cannot be undone. Are you sure?')) {
      return;
    }

    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'listing', listing.id));
      onListDelete(listing.id);
      alert('Item permanently deleted.');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const daysRemaining = getDaysRemainingForReactivation(listing.deactivatedAt);
  const canReactivateItem = canReactivate(listing.deactivatedAt);

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // If changing to unavailable, set deactivatedAt timestamp
      if (newStatus === 'unavailable') {
        updateData.deactivatedAt = new Date();
      }
      // If reactivating, remove deactivatedAt timestamp
      else if (newStatus === 'active' && listing.status === 'unavailable') {
        updateData.deactivatedAt = null;
      }

      await updateDoc(doc(db, 'listing', listing.id), updateData);
      onStatusUpdate(listing.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden relative">
        {/* Check both images and additionalImages fields */}
        {((listing.images && listing.images.length > 0) || (listing.additionalImages && listing.additionalImages.length > 0)) && !imageError ? (
          <Image
            src={listing.images?.[0] || listing.additionalImages?.[0] || ''}
            alt={listing.title || listing.address || listing.location || 'Listing'}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Home className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm text-gray-500">No Image</p>
            </div>
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
        </div>
        {listing.furnished && (
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Furnished
            </span>
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}>
            {listing.status}
          </span>
        </div>

        {/* NEW: Grace Period Warning */}
        {listing.status === 'unavailable' && listing.deactivatedAt && (
          <div className="absolute top-3 left-3">
            {canReactivateItem ? (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {daysRemaining} days to reactivate
              </span>
            ) : (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-200 text-red-900 flex items-center">
                <AlertTriangle className="mr-1 h-3 w-3" />
                Grace period expired
              </span>
            )}
          </div>
        )}

      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">
            {listing.title || listing.address || listing.location || 'Untitled Listing'}
          </h3>
          <span className="text-lg font-bold text-orange-600">
            {formatRent(listing.rent)}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-2 flex items-center">
          <MapPin className="mr-1 h-3 w-3" />
          {listing.address || listing.location || 'Location not specified'}
        </p>

        {(listing.description || listing.additionalDetails) && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {listing.description || listing.additionalDetails}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          {(listing.bedrooms || listing.bathrooms) && (
            <div className="flex items-center space-x-4">
              {listing.bedrooms && (
                <span className="flex items-center">
                  <Bed className="mr-1 h-3 w-3" />
                  {listing.bedrooms} bed{listing.bedrooms > 1 ? 's' : ''}
                </span>
              )}
              {listing.bathrooms && (
                <span className="flex items-center">
                  <Bath className="mr-1 h-3 w-3" />
                  {listing.bathrooms} bath{listing.bathrooms > 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>Created: {formatDate(listing.createdAt)}</span>
          </div>

          {(listing.availableFrom || listing.availableTo) && (
            <div className="flex items-center space-x-4">
              {listing.availableFrom && (
                <span className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  From: {formatDate(listing.availableFrom)}
                </span>
              )}
              {listing.availableTo && (
                <span className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  To: {formatDate(listing.availableTo)}
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            {listing.deliveryAvailable && <span className="text-green-600">✓ Tours Available</span>}
            {listing.pickupAvailable && <span className="text-blue-600">✓ Immediate Move-in</span>}
            {listing.accommodationType && <span className="text-blue-600">{listing.accommodationType}</span>}
          </div>

          {listing.amenities && listing.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {listing.amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  {amenity}
                </span>
              ))}
              {listing.amenities.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                  +{listing.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/edit-listing/${listing.id}`}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center flex items-center justify-center"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Link>
          
          {listing.status === 'active' && (
            <button
              onClick={() => handleStatusChange('rented')}
              disabled={updating}
              className="flex-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Mark as Rented'}
            </button>
          )}
          
          {listing.status === 'active' && (
            <button
              onClick={() => handleStatusChange('unavailable')}
              disabled={updating}
              className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Mark Unavailable'}
            </button>
          )}

          {/* NEW: Enhanced reactivation logic */}
          {listing.status === 'unavailable' && (
            <>
              {canReactivateItem ? (
                <button
                  onClick={() => handleStatusChange('active')}
                  disabled={updating}
                  className="flex-1 px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                  title={`You have ${daysRemaining} days left to reactivate this item`}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  {updating ? 'Updating...' : `Reactivate (${daysRemaining}d left)`}
                </button>
              ) : (
                <button
                  onClick={handlePermanentDelete}
                  disabled={updating}
                  className="flex-1 px-3 py-2 text-sm bg-red-200 text-red-800 rounded-lg hover:bg-red-300 transition-colors disabled:opacity-50 flex items-center justify-center"
                  title="Grace period expired. Item will be permanently deleted."
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {updating ? 'Deleting...' : 'Delete Permanently'}
                </button>
              )}
            </>
          )}
          
          {listing.status !== 'active' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={updating}
              className="flex-1 px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              {updating ? 'Updating...' : 'Reactivate'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Component
const MyListings = () => {
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'rented' | 'unavailable'>('all');


  // Handle status update
  const handleStatusUpdate = (listingId: string, newStatus: string) => {
    setListings(prev => 
      prev.map(listing => 
        listing.id === listingId 
          ? { ...listing, status: newStatus as 'active' | 'rented' | 'unavailable' }
          : listing
      )
    );
  };

  const handleListingDelete = (listId: string) => {
    setListings(prev => prev.filter(listing => listing.id !== listId));
  };

  // Filter listings
  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    return listing.status === filter;
  });

  // NEW: Clean up expired items
  const cleanupExpiredLists = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const expiredLists = listings.filter(list => 
        list.status === 'unavailable' && 
        list.deactivatedAt && 
        !canReactivate(list.deactivatedAt)
      );

      for (const list of expiredLists) {
        try {
          await deleteDoc(doc(db, 'listing', list.id));
          console.log(`Cleaned up expired item: ${list.id}`);
        } catch (error) {
          console.error(`Failed to cleanup item ${list.id}:`, error);
        }
      }

      if (expiredLists.length > 0) {
        // Refresh the list after cleanup
        fetchListings();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [user?.uid]);

  // Fetch listings
  const fetchListings = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      
      // Try listings collection first, fallback to saleItems if needed
      let q;
      try {
        q = query(
          collection(db, 'listings'),
          where('hostId', '==', user.uid)
        );
      } catch (error) {
        // Fallback to saleItems collection
        q = query(
          collection(db, 'saleItems'),
          where('hostId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        console.log("Error occured", error);
      }
      
      const querySnapshot = await getDocs(q);
      const items: Listing[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || 'active' // Default to active if no status
      } as Listing));
      
      // Sort by creation date (newest first)
      items.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      setListings(items);
      setError(null);

      // NEW: Run cleanup after fetching items
      setTimeout(() => cleanupExpiredLists(), 1000);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, cleanupExpiredLists]);

  // Effects
  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchListings();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, fetchListings]);

  // NEW: Set up periodic cleanup (check every hour)
  useEffect(() => {
    if (user?.uid && listings.length > 0) {
      const interval = setInterval(cleanupExpiredLists, 60 * 60 * 1000); // 1 hour
      return () => clearInterval(interval);
    }
  }, [user, listings, cleanupExpiredLists]);

  // Render states
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthRequired />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Listings</h1>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={fetchListings}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Home className="mr-3 h-8 w-8 text-orange-500" />
                My Sublease Listings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your sublease listings ({listings.length} total)
              </p>
            </div>
            <Link
              href="/sublease/write/options/chat"
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Listing
            </Link>
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            {(['all', 'active', 'rented', 'unavailable'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-orange-50 border border-gray-200'
                }`}
              >
                {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({listings.filter(listing => listing.status === status).length})
                  </span>
                )}
                {status === 'all' && (
                  <span className="ml-1 text-xs">({listings.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {filteredListings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onStatusUpdate={handleStatusUpdate}
                onListDelete={handleListingDelete}
              />
            ))}
          </div>
        )}

        {/* Back to Profile */}
        <div className="mt-12 text-center">
          <Link
            href="/profile"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Profile
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MyListings;