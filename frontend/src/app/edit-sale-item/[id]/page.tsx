"use client"

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthInfo';
import { 
  doc, 
  getDoc, 
  updateDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import Image from 'next/image';
import Link from 'next/link';

// Types based on your actual Firestore data structure
interface SaleItemData {
  id: string;
  availableUntil: string;
  category: string;
  condition: string;
  createdAt: Timestamp;
  deliveryAvailable: boolean;
  description: string;
  hostId: string;
  image: string;                    // Single main image
  images: string[];                 // Array of images
  location: string;
  name: string;
  originalPrice: number;
  pickupAvailable: boolean;
  price: number;
  priceType: string;
  seller: string;
  sellerEmail: string;
  sellerID: string;
  sellerPhoto: string;
  sellerRating: number;
  shortDescription: string;
  updatedAt: Timestamp;
  views: number;
  status?: 'active' | 'sold' | 'unavailable';
}

// Utility function to format date for input
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  return dateString;
};

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

const EditSaleItemPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [saleItem, setSaleItem] = useState<SaleItemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<SaleItemData>>({});


  const fetchSaleItem = useCallback(async () => {
    try {
      setLoading(true);
      const saleItemDoc = await getDoc(doc(db, 'saleItems', id as string));
      
      if (!saleItemDoc.exists()) {
        setError('Sale item not found');
        return;
      }

      const rawData = saleItemDoc.data();
      console.log('Raw sale item data:', rawData); // Debug log
      
      const saleItemData = { 
        id: saleItemDoc.id, 
        ...rawData,
        status: rawData.status || 'active' // Default status
      } as SaleItemData;
      
      // Check if user owns this sale item
      if (saleItemData.hostId !== user?.uid && saleItemData.sellerID !== user?.uid) {
        setError('You do not have permission to edit this item');
        return;
      }

      // Combine ALL images from ALL possible fields
      const allImages: string[] = [];
      
      console.log('Main image:', saleItemData.image);
      console.log('Images array:', saleItemData.images);
      
      // Add main image if exists
      if (saleItemData.image && typeof saleItemData.image === 'string') {
        allImages.push(saleItemData.image);
      }
      
      // Add images from array if exists
      if (saleItemData.images && Array.isArray(saleItemData.images)) {
        saleItemData.images.forEach(img => {
          if (img && typeof img === 'string') {
            allImages.push(img);
          }
        });
      }
      
      // Remove duplicates and empty strings
      const uniqueImages = [...new Set(allImages)].filter(img => img && img.trim() !== '');
      
      console.log('Combined unique images:', uniqueImages);
      // Update the sale item data with all combined images
      const updatedSaleItemData = {
        ...saleItemData,
        images: uniqueImages // Store all images in the images array
      };

      setSaleItem(updatedSaleItemData);
      setFormData(updatedSaleItemData);
    } catch (error) {
      console.error('Error fetching sale item:', error);
      setError('Failed to load sale item');
    } finally {
      setLoading(false);
    }
  },[id, user?.uid]);

  useEffect(() => {
    if (!authLoading && user && id) {
      fetchSaleItem();
    }
  }, [user, authLoading, id, fetchSaleItem]);

  const handleInputChange = (field: string, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    setImageUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const imageRef = ref(storage, `saleItems/${user?.uid}/${Date.now()}_${index}.jpg`);
        await uploadBytes(imageRef, file);
        return getDownloadURL(imageRef);
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newImageUrls]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload images');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    try {
      // Try to remove from Firebase Storage (might fail if URL format is different)
      try {
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);
      } catch (storageError) {
        console.log('Could not delete from storage (URL might be external):', storageError);
      }

      // Update form data (remove from UI regardless of storage deletion)
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index) || []
      }));
    } catch (error) {
      console.error('Error removing image:', error);
      // Still remove from UI
      setFormData(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        // Update both image fields for compatibility
        image: formData.images?.[0] || '', // Set first image as main image
        images: formData.images || [],
        // Auto-generate short description if description exists
        shortDescription: formData.description ? 
          (formData.description.length > 50 ? 
            formData.description.substring(0, 50) + '...' : 
            formData.description) : '',
        updatedAt: new Date()
      };
      
      console.log('Saving update data:', updateData);
      
      await updateDoc(doc(db, 'saleItems', id as string), updateData);
      
      alert('Sale item updated successfully!');
      router.push('/profile/my-sale-items');
    } catch (error) {
      console.error('Error updating sale item:', error);
      alert('Failed to update sale item: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/profile/my-sale-items" className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Back to Sale Items
          </Link>
        </div>
      </div>
    );
  }

  if (!saleItem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💰</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sale Item Not Found</h1>
          <Link href="/profile/my-sale-items" className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Back to Sale Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">✏️</span>
                Edit Sale Item
              </h1>
              <p className="text-gray-600 mt-1">Update your sale item details</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/profile/my-sale-items"
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Basic Information - Column 1 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Books">Books</option>
                    <option value="Sports">Sports</option>
                    <option value="General">General</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Describe your item..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter location"
                  />
                </div>
              </div>
            </div>

            {/* Seller Information */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Seller Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seller Name</label>
                  <input
                    type="text"
                    value={formData.seller || ''}
                    onChange={(e) => handleInputChange('seller', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={formData.sellerEmail || ''}
                    onChange={(e) => handleInputChange('sellerEmail', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seller Rating</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.sellerRating || 0}
                    onChange={(e) => handleInputChange('sellerRating', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Options - Column 2 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Pricing & Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                    <input
                      type="number"
                      value={formData.price || ''}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Original Price ($)</label>
                    <input
                      type="number"
                      value={formData.originalPrice || ''}
                      onChange={(e) => handleInputChange('originalPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                    <select
                      value={formData.condition || ''}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="New">New</option>
                      <option value="Like New">Like New</option>
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Type</label>
                    <select
                      value={formData.priceType || ''}
                      onChange={(e) => handleInputChange('priceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="fixed">Fixed Price</option>
                      <option value="negotiable">Negotiable</option>
                      <option value="obo">Or Best Offer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available Until</label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.availableUntil || '')}
                    onChange={(e) => handleInputChange('availableUntil', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="active">Active</option>
                    <option value="sold">Sold</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Availability Options */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Availability Options</h2>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pickup"
                    checked={formData.pickupAvailable || false}
                    onChange={(e) => handleInputChange('pickupAvailable', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="pickup" className="ml-2 text-sm text-gray-700">
                    🚶 Pickup Available
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={formData.deliveryAvailable || false}
                    onChange={(e) => handleInputChange('deliveryAvailable', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="delivery" className="ml-2 text-sm text-gray-700">
                    🚚 Delivery Available
                  </label>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Views:</span>
                  <span className="text-sm font-medium">{formData.views || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium">
                    {formData.createdAt ? new Date(formData.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated:</span>
                  <span className="text-sm font-medium">
                    {formData.updatedAt ? new Date(formData.updatedAt.toDate()).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Images - Column 3 */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
            
            {/* Current Images */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">
                Current Images ({(formData.images || []).length})
              </p>
              
              {(formData.images || []).length > 0 ? (
                <div className="space-y-3">
                  {(formData.images || []).map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={imageUrl}
                        alt={`Item image ${index + 1}`}
                        width={300}
                        height={200}
                        className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        unoptimized
                      />
                      <button
                        onClick={() => handleRemoveImage(imageUrl, index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Main Image
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-gray-400 text-3xl mb-3">📷</div>
                  <p className="text-gray-500 text-sm">No images uploaded yet</p>
                </div>
              )}
            </div>

            {/* Upload New Images */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-300 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
                id="image-upload"
                disabled={imageUploading}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer ${imageUploading ? 'opacity-50' : ''}`}
              >
                <div className="text-gray-400 mb-2 text-2xl">
                  {imageUploading ? '⏳' : '📷'}
                </div>
                <p className="text-sm text-gray-600 font-medium">
                  {imageUploading ? 'Uploading...' : 'Click to upload images'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Support: JPG, PNG, GIF
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/profile/my-sale-items"
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Back to Sale Items */}
        <div className="mt-8 text-center">
          <Link
            href="/profile/my-sale-items"
            className="text-orange-600 hover:text-orange-700 hover:underline"
          >
            ← Back to My Sale Items
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditSaleItemPage;