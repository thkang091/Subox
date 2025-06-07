'use client'

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ProfilePage = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [sublease, setSublease] = useState<any[]>([]);

  const params = useParams();
  const searchParams = useSearchParams();

  const tab = searchParams.get('tab') || 'purchased';
  const userId = params.id as string;
  if (!userId || typeof userId !== 'string' || userId.trim() === '') return;

  console.log("User ID:", userId);


  // Only for hydration fix
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        console.error('No such user!');
      }
    };

    fetchProfile();
  }, [userId]);

  // Prevent mismatch between server and client
  if (!isMounted) return null;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return <div className="p-6">Invalid user ID</div>;
  }


  if (!profile) return <div>Loading...</div>;

  const renderList = (items: any[]) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-500">No items found.</p>;
    }
    return (
      <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
        {items.map((item, i) => (
          <li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  };


  const renderTabContent = () => {
    switch (tab) {
      case 'purchased':
        return renderList(profile.purchased);
      case 'returned':
        return renderList(profile.returned);
      case 'cancelled':
        return renderList(profile.cancelled);
      case 'history':
        return renderList(profile.history);
      case 'sold':
        return renderList(profile.sold);
      case 'sublease':
        return renderList(profile.subleases);
      case 'reviews':
        return (
          <div className="space-y-4">
            {profile.reviews?.map((review: any, i: number) => (
              <div key={i} className="border p-3 rounded-md bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold">{review.from}</span>
                  <span className="text-sm text-yellow-600">Rating: {review.rating}/5</span>
                </div>
                <p className="text-gray-700 text-sm">{review.message}</p>
                <p className="text-xs text-gray-400">{review.timestamp}</p>
              </div>
            ))}
          </div>
        );
      default:
        return <div>Invalid tab</div>;
    }
  };


  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Profile Info Header */}
      <div className="flex items-center space-x-4 mb-6">
        {profile.photoURL ? (
          <img src={profile.photoURL} alt="Profile" className="w-16 h-16 rounded-full" />
        ) : (
          <div className="w-16 h-16 bg-gray-300 rounded-full" />
        )}
        <div>
          <h2 className="text-xl font-bold">{profile.name}</h2>
          <p className="text-gray-600 text-sm">DOB: {profile.dob || 'Not provided'}</p>
          <p className="text-gray-600 text-sm">{profile.email}</p>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white p-4 rounded-md shadow">
        <h3 className="text-lg font-semibold capitalize mb-3">{tab.replace(/^\w/, c => c.toUpperCase())}</h3>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ProfilePage;
