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
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';
import { 
  DollarSign, 
  Lock, 
  Plus, 
  MapPin, 
  Calendar, 
  Edit, 
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  Package,
  Truck,
  User,
  Eye,
  Clock,
  Trash2,
  Search
} from 'lucide-react';

// Types
interface SaleItem {
  id: string;
  category: string;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  location?: string;
  images?: string[];
  image?: string;
  pickupAvailable: boolean;
  deliveryAvailable?: boolean;
  condition?: string;
  hostId: string;
  sellerID?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  status: 'active' | 'sold' | 'unavailable';
  deactivatedAt?: Timestamp; // NEW: Track when item was deactivated
  availableUntil?: string;
  priceType?: string;
  seller?: string;
  sellerEmail?: string;
  views?: number;
}

// Utility functions
const formatDate = (timestamp?: Timestamp): string => {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString();
};

const formatPrice = (price: number | undefined): string => {
  if (!price) return 'Free';
  return `$${price.toFixed(2)}`;
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
      <p className="text-lg text-gray-600 mb-6">Please log in to view your sale items.</p>
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
    <DollarSign className="mx-auto h-16 w-16 text-gray-400 mb-4" />
    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Sale Items Yet</h2>
    <p className="text-gray-600 mb-6">You haven&apos;t created any sale items. Start selling your items today!</p>
    <Link 
      href="/create-sale-item" 
      className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
    >
      <Plus className="mr-2 h-4 w-4" />
      Create Sale Item
    </Link>
  </div>
);

const ErrorState = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="text-center">
      <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Sale Items</h1>
      <p className="text-red-600 text-lg mb-4">{error}</p>
      <button 
        onClick={onRetry}
        className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

const SaleItemCard = ({ 
  item, 
  onStatusUpdate, 
  onItemDelete 
}: { 
  item: SaleItem; 
  onStatusUpdate: (id: string, status: string) => void;
  onItemDelete: (id: string) => void;
}) => {
  const [updating, setUpdating] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-gray-100 text-gray-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
      else if (newStatus === 'active' && item.status === 'unavailable') {
        updateData.deactivatedAt = null;
      }

      await updateDoc(doc(db, 'saleItems', item.id), updateData);
      onStatusUpdate(item.id, newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // NEW: Handle permanent deletion after 5 days
  const handlePermanentDelete = async () => {
    if (!confirm('This item will be permanently deleted. This action cannot be undone. Are you sure?')) {
      return;
    }

    setUpdating(true);
    try {
      await deleteDoc(doc(db, 'saleItems', item.id));
      onItemDelete(item.id);
      alert('Item permanently deleted.');
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Calculate reactivation status
  const daysRemaining = getDaysRemainingForReactivation(item.deactivatedAt);
  const canReactivateItem = canReactivate(item.deactivatedAt);

  return (
    <div className="bg-white rounded-xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden relative">
        {((item.images && item.images.length > 0) || item.image) && !imageError ? (
          <Image
            src={item.images?.[0] || item.image || ''}
            alt={item.title || item.name || item.category}
            fill
            className="object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 mb-2" />
              <p className="text-sm text-gray-500">No Image</p>
            </div>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {item.status}
          </span>
        </div>

        {/* NEW: Grace Period Warning */}
        {item.status === 'unavailable' && item.deactivatedAt && (
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

        {item.originalPrice && item.originalPrice > (item.price || 0) && (
          <div className="absolute bottom-3 left-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              ${item.originalPrice} → ${item.price}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 text-lg">
            {item.title || item.name || item.category}
          </h3>
          <div className="text-right">
            <span className="text-lg font-bold text-orange-600">
              {formatPrice(item.price)}
            </span>
            {item.originalPrice && item.originalPrice > (item.price || 0) && (
              <p className="text-xs text-gray-500 line-through">
                ${item.originalPrice}
              </p>
            )}
          </div>
        </div>

        {item.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="space-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <MapPin className="mr-1 h-3 w-3" />
            <span>{item.location || 'Location not specified'}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>Created: {formatDate(item.createdAt)}</span>
          </div>
          
          {/* NEW: Show deactivation date and grace period info */}
          {item.status === 'unavailable' && item.deactivatedAt && (
            <div className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              <span className="text-red-600">
                Deactivated: {formatDate(item.deactivatedAt)}
              </span>
            </div>
          )}

          {item.availableUntil && (
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              <span>Available until: {new Date(item.availableUntil).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center space-x-4">
            {item.pickupAvailable && (
              <span className="text-green-600 flex items-center">
                <User className="mr-1 h-3 w-3" />
                Pickup Available
              </span>
            )}
            {item.deliveryAvailable && (
              <span className="text-blue-600 flex items-center">
                <Truck className="mr-1 h-3 w-3" />
                Delivery Available
              </span>
            )}
          </div>
          {item.condition && (
            <div className="flex items-center">
              <span>✨ Condition: {item.condition}</span>
            </div>
          )}
          {item.priceType && item.priceType !== 'fixed' && (
            <div className="flex items-center">
              <DollarSign className="mr-1 h-3 w-3" />
              <span className="text-blue-600">{item.priceType}</span>
            </div>
          )}
          {item.views && item.views > 0 && (
            <div className="flex items-center">
              <Eye className="mr-1 h-3 w-3" />
              <span>{item.views} views</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link
            href={`/edit-sale-item/${item.id}`}
            className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center flex items-center justify-center"
          >
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Link>
          
          {item.status === 'active' && (
            <>
              <button
                onClick={() => handleStatusChange('sold')}
                disabled={updating}
                className="flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Mark as Sold'}
              </button>
              
              <button
                onClick={() => handleStatusChange('unavailable')}
                disabled={updating}
                className="flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                title="Item will be hidden from browse and can be reactivated within 5 days"
              >
                {updating ? 'Updating...' : 'Deactivate'}
              </button>
            </>
          )}
          
          {/* NEW: Enhanced reactivation logic */}
          {item.status === 'unavailable' && (
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

          {item.status === 'sold' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={updating}
              className="flex-1 px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              {updating ? 'Updating...' : 'Mark Available'}
            </button>
          )}
        </div>

        {/* NEW: Grace period explanation */}
        {item.status === 'unavailable' && item.deactivatedAt && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              {canReactivateItem ? (
                <>
                  <strong>Grace Period:</strong> You have {daysRemaining} days to reactivate this item. 
                  After that, it will be permanently deleted.
                </>
              ) : (
                <>
                  <strong>Grace Period Expired:</strong> This item can no longer be reactivated and 
                  will be permanently deleted.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Component
const MySaleItems = () => {
  const { user, loading: authLoading } = useAuth();
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'unavailable'>('all');

  // Handle status update
  const handleStatusUpdate = (itemId: string, newStatus: string) => {
    setSaleItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { 
              ...item, 
              status: newStatus as 'active' | 'sold' | 'unavailable',
              deactivatedAt: newStatus === 'unavailable' ? Timestamp.now() : null
            }
          : item
      )
    );
  };

  // NEW: Handle item deletion
  const handleItemDelete = (itemId: string) => {
    setSaleItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Filter items
  const filteredItems = saleItems.filter(item => {
    if (filter === 'all') return true;
    return item.status === filter;
  });

  // NEW: Get count of items needing attention (grace period ending soon)
  const itemsNeedingAttention = saleItems.filter(item => 
    item.status === 'unavailable' && 
    item.deactivatedAt &&
    getDaysRemainingForReactivation(item.deactivatedAt) <= 2 &&
    getDaysRemainingForReactivation(item.deactivatedAt) > 0
  ).length;

  // NEW: Clean up expired items
  const cleanupExpiredItems = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const expiredItems = saleItems.filter(item => 
        item.status === 'unavailable' && 
        item.deactivatedAt && 
        !canReactivate(item.deactivatedAt)
      );

      for (const item of expiredItems) {
        try {
          await deleteDoc(doc(db, 'saleItems', item.id));
          console.log(`Cleaned up expired item: ${item.id}`);
        } catch (error) {
          console.error(`Failed to cleanup item ${item.id}:`, error);
        }
      }

      if (expiredItems.length > 0) {
        // Refresh the list after cleanup
        fetchSaleItems();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  },[user?.uid]);

  // Fetch sale items
  const fetchSaleItems = useCallback(async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      const q = query(
        collection(db, 'saleItems'),
        where('hostId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const items: SaleItem[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Combine all images from different fields
        const allImages: string[] = [];
        
        // Add main image if exists
        if (data.image && typeof data.image === 'string') {
          allImages.push(data.image);
        }
        
        // Add images from array if exists
        if (data.images && Array.isArray(data.images)) {
          data.images.forEach((img: string) => {
            if (img && typeof img === 'string') {
              allImages.push(img);
            }
          });
        }
        
        // Remove duplicates and empty strings
        const uniqueImages = [...new Set(allImages)].filter(img => img && img.trim() !== '');
        
        return {
          id: doc.id,
          ...data,
          images: uniqueImages,
          status: data.status || 'active', // Default to active if no status
          deactivatedAt: data.deactivatedAt || null // NEW: Include deactivation timestamp
        } as SaleItem;
      });
      
      setSaleItems(items);
      setError(null);

      // NEW: Run cleanup after fetching items
      setTimeout(() => cleanupExpiredItems(), 1000);
    } catch (error) {
      console.error('Error fetching sale items:', error);
      setError('Failed to load sale items');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, cleanupExpiredItems]);

  // Effects
  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchSaleItems();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, fetchSaleItems]);

  // NEW: Set up periodic cleanup (check every hour)
  useEffect(() => {
    if (user?.uid && saleItems.length > 0) {
      const interval = setInterval(cleanupExpiredItems, 60 * 60 * 1000); // 1 hour
      return () => clearInterval(interval);
    }
  }, [user, saleItems, cleanupExpiredItems]);

  // Render states
  if (authLoading || loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <AuthRequired />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={fetchSaleItems} />;
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
                <DollarSign className="mr-3 h-8 w-8 text-orange-500" />
                My Sale Items
                {/* NEW: Attention indicator */}
                {itemsNeedingAttention > 0 && (
                  <span className="ml-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full flex items-center">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    {itemsNeedingAttention} need attention
                  </span>
                )}
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your items for sale ({saleItems.length} total)
              </p>
            </div>
            <Link
              href="/create-sale-item"
              className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Item
            </Link>
          </div>

          {/* NEW: Grace period notice */}
          {itemsNeedingAttention > 0 && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-600 mr-3 mt-1 h-5 w-5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Items Need Attention</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    You have {itemsNeedingAttention} deactivated item(s) with 2 or fewer days left to reactivate. 
                    After the grace period expires, these items will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex space-x-2">
            {(['all', 'active', 'sold', 'unavailable'] as const).map((status) => (
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
                    ({saleItems.filter(item => item.status === status).length})
                  </span>
                )}
                {status === 'all' && (
                  <span className="ml-1 text-xs">({saleItems.length})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {filteredItems.length === 0 ? (
          filter === 'all' ? <EmptyState /> : (
            <div className="text-center py-16">
              <Search className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                No {filter} items found
              </h2>
              <p className="text-gray-600 mb-4">
                You don&apos;t have any {filter} sale items.
              </p>
              <button
                onClick={() => setFilter('all')}
                className="text-orange-600 hover:text-orange-700 hover:underline"
              >
                View all items
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <SaleItemCard
                key={item.id}
                item={item}
                onStatusUpdate={handleStatusUpdate}
                onItemDelete={handleItemDelete}
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

export default MySaleItems;