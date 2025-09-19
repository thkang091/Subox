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

// Types
interface ContactMethod {
  id: string;
  name: string;
  selected: boolean;
  value: string;
}

interface ContactInfo {
  methods: ContactMethod[];
  note: string;
}

interface CustomLocation {
  address: string;
  lat: number;
  lng: number;
  placeName: string;
}

interface CurrentRoommateInfo {
  hasPets: boolean | null;
  isQuiet: boolean | null;
  smokes: boolean | null;
}

interface RoommatePreferences {
  cleanlinessLevel: string | null;
  gender: string | null;
  noiseLevel: string | null;
  petsAllowed: boolean | null;
  smokingAllowed: boolean | null;
}

interface RentNegotiation {
  isNegotiable: boolean;
  maxPrice: number;
  minPrice: number;
}

interface ListingData {
  id: string;
  accommodationType: string;
  additionalDetails: string;
  additionalImages: string[];
  address: string;
  amenities: string[];
  availableFrom: Timestamp;
  availableTo: Timestamp;
  bathrooms: number;
  bedrooms: number;
  contactInfo: ContactInfo;
  createdAt: Timestamp;
  currentRoommateInfo: CurrentRoommateInfo;
  customIncludedItems: string;
  customLocation: CustomLocation;
  dateOption: string;
  dateRange: string;
  description: string;
  distance: number;
  endDate: string;
  hasRoommates: boolean;
  hostBio: string;
  hostEmail: string;
  hostId: string;
  hostImage: string;
  hostName: string;
  hostReviews: string[];
  image: string;
  includedItems: string[];
  isPrivateRoom: boolean;
  isVerifiedUMN: boolean;
  listingType: string;
  location: string;
  partialDatesOk: boolean;
  preferredGender: string;
  price: number;
  rating: number;
  rent: number;
  rentNegotiation: RentNegotiation;
  reviews: number;
  roommatePreferences: RoommatePreferences;
  showExactAddress: boolean;
  startDate: string;
  status: string;
  subleaseReason: string;
  title: string;
  utilitiesIncluded: boolean;
  viewCount: number;
}

// Components
const LoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
  </div>
);

const EditListingPage = () => {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [listing, setListing] = useState<ListingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<ListingData>>({});

  const fetchListing = useCallback(async () => {
    try {
      setLoading(true);
      const listingDoc = await getDoc(doc(db, 'listings', id as string));
      
      if (!listingDoc.exists()) {
        setError('Listing not found');
        return;
      }

      const listingData = { id: listingDoc.id, ...listingDoc.data() } as ListingData;
      
      // Check if user owns this listing
      if (listingData.hostId !== user?.uid) {
        setError('You do not have permission to edit this listing');
        return;
      }

      // Combine all images from different fields
      const allImages: string[] = [];
      
      // Add main image if exists
      if (listingData.image) {
        allImages.push(listingData.image);
      }
      
      // Add additional images if exists
      if (listingData.additionalImages && Array.isArray(listingData.additionalImages)) {
        allImages.push(...listingData.additionalImages);
      }
      
      // Remove duplicates
      const uniqueImages = [...new Set(allImages)];
      
      // Update the listing data with combined images
      const updatedListingData = {
        ...listingData,
        additionalImages: uniqueImages
      };

      setListing(updatedListingData);
      setFormData(updatedListingData);
    } catch (error) {
      console.error('Error fetching listing:', error);
      setError('Failed to load listing');
    } finally {
      setLoading(false);
    }
  },[id, user?.uid]);

  useEffect(() => {
    if (!authLoading && user && id) {
      fetchListing();
    }
  }, [user, authLoading, id, fetchListing]);



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
        const imageRef = ref(storage, `listings/${id}/image_${Date.now()}_${index}.jpg`);
        await uploadBytes(imageRef, file);
        return getDownloadURL(imageRef);
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        additionalImages: [...(prev.additionalImages || []), ...newImageUrls]
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
      // Remove from Firebase Storage
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);

      // Update form data
      setFormData(prev => ({
        ...prev,
        additionalImages: prev.additionalImages?.filter((_, i) => i !== index) || []
      }));
    } catch (error) {
      console.error('Error removing image:', error);
      // Still remove from UI even if Firebase deletion fails
      setFormData(prev => ({
        ...prev,
        additionalImages: prev.additionalImages?.filter((_, i) => i !== index) || []
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        // Update both image fields for compatibility
        image: formData.additionalImages?.[0] || '', // Set first image as main image
        additionalImages: formData.additionalImages || [],
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'listings', id as string), updateData);
      
      alert('Listing updated successfully!');
      router.push('/profile/my-listings');
    } catch (error) {
      console.error('Error updating listing:', error);
      alert('Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  const formatDateForInput = (timestamp?: Timestamp): string => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  const parseInputDate = (dateString: string): Timestamp => {
    return Timestamp.fromDate(new Date(dateString));
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
          <Link href="/profile/my-listings" className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Listing Not Found</h1>
          <Link href="/profile/my-listings" className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
            Back to Listings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <span className="mr-3">✏️</span>
                Edit Listing
              </h1>
              <p className="text-gray-600 mt-1">Update your sublease listing details</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href="/profile/my-listings"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || formData.additionalDetails || ''}
                  onChange={(e) => {
                    handleInputChange('description', e.target.value);
                    handleInputChange('additionalDetails', e.target.value);
                  }}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rent ($)</label>
                  <input
                    type="number"
                    value={formData.rent || formData.price || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      handleInputChange('rent', value);
                      handleInputChange('price', value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation Type</label>
                  <select
                    value={formData.accommodationType || ''}
                    onChange={(e) => handleInputChange('accommodationType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="shared">Shared</option>
                    <option value="private">Private</option>
                    <option value="entire">Entire Place</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={formData.bedrooms || ''}
                    onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.bathrooms || ''}
                    onChange={(e) => handleInputChange('bathrooms', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available From</label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.availableFrom)}
                    onChange={(e) => handleInputChange('availableFrom', parseInputDate(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Available To</label>
                  <input
                    type="date"
                    value={formatDateForInput(formData.availableTo)}
                    onChange={(e) => handleInputChange('availableTo', parseInputDate(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Images</h2>
            
            {/* Current Images */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current Images ({(formData.additionalImages || []).length})
              </p>
              
              {(formData.additionalImages || []).length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {(formData.additionalImages || []).map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={imageUrl}
                        alt={`Listing image ${index + 1}`}
                        width={200}
                        height={150}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        unoptimized
                      />
                      <button
                        onClick={() => handleRemoveImage(imageUrl, index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        ×
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="text-gray-400 text-2xl mb-2">📷</div>
                  <p className="text-gray-500 text-sm">No images uploaded yet</p>
                </div>
              )}
            </div>

            {/* Upload New Images */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
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
                <div className="text-gray-400 mb-2">
                  📷
                </div>
                <p className="text-sm text-gray-600">
                  {imageUploading ? 'Uploading...' : 'Click to upload images'}
                </p>
              </label>
            </div>
          </div>

          {/* Additional Details */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
                <select
                  value={formData.listingType || ''}
                  onChange={(e) => handleInputChange('listingType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Lease Takeover">Lease Takeover</option>
                  <option value="Sublease">Sublease</option>
                  <option value="Room Rental">Room Rental</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sublease Reason</label>
                <input
                  type="text"
                  value={formData.subleaseReason || ''}
                  onChange={(e) => handleInputChange('subleaseReason', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Included Items</label>
                <input
                  type="text"
                  value={(formData.includedItems || []).join(', ')}
                  onChange={(e) => handleInputChange('includedItems', e.target.value.split(', ').filter(item => item.trim()))}
                  placeholder="e.g., Mattress, Bookshelf, Desk"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="utilities"
                    checked={formData.utilitiesIncluded || false}
                    onChange={(e) => handleInputChange('utilitiesIncluded', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="utilities" className="ml-2 text-sm text-gray-700">
                    Utilities Included
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="privateRoom"
                    checked={formData.isPrivateRoom || false}
                    onChange={(e) => handleInputChange('isPrivateRoom', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="privateRoom" className="ml-2 text-sm text-gray-700">
                    Private Room
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="partialDates"
                    checked={formData.partialDatesOk || false}
                    onChange={(e) => handleInputChange('partialDatesOk', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="partialDates" className="ml-2 text-sm text-gray-700">
                    Partial Dates OK
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasRoommates"
                    checked={formData.hasRoommates || false}
                    onChange={(e) => handleInputChange('hasRoommates', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="hasRoommates" className="ml-2 text-sm text-gray-700">
                    Has Roommates
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-orange-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Listing Status</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || 'active'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="active">Active</option>
                <option value="rented">Rented</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <Link
            href="/profile/my-listings"
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Back to Listings */}
        <div className="mt-8 text-center">
          <Link
            href="/profile/my-listings"
            className="text-orange-600 hover:text-orange-700 hover:underline"
          >
            ← Back to My Listings
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EditListingPage;