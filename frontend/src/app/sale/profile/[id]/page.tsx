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

  const myBadgeInfo = { student: true, bestRater: true, trustedSeller: true, trustedRenter: true};
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

          {/* Badges */}
          <div className="mt-2 flex space-x-3 items-center">
            {myBadgeInfo.bestRater && (
              <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10" // 40x40 pixels
                role="img"
                aria-label="Best Rater Badge"
              >
                {/* Bottle cap background */}
                <circle cx="50" cy="50" r="48" fill="#000000" /> {/* Black */}

                {/* Wavy cap edge */}
                <path
                  d="M50,2 
                    C54,10 66,6 70,12 
                    C74,18 86,14 88,22 
                    C90,30 98,34 96,42 
                    C94,50 100,58 94,64 
                    C88,70 90,82 82,86 
                    C74,90 70,98 62,96 
                    C54,94 46,100 38,96 
                    C30,92 26,94 18,88 
                    C10,82 12,70 6,64 
                    C0,58 6,50 4,42 
                    C2,34 10,30 12,22 
                    C14,14 26,18 30,12 
                    C34,6 46,10 50,2 Z"
                  fill="#000000"
                />

                {/* Five stars in star shape */}
                <polygon
                  points="50,35 54,47 67,47 56,55 60,67 50,59 40,67 44,55 33,47 46,47"
                  fill="#FFD700"
                  stroke="#FFC107"
                  strokeWidth="1"
                />
                <polygon
                  points="36,30 39,36 45,36 40,40 42,46 36,42 30,46 32,40 27,36 33,36"
                  fill="#FFD700"
                  stroke="#FFC107"
                  strokeWidth="0.8"
                />
                <polygon
                  points="64,30 67,36 73,36 68,40 70,46 64,42 58,46 60,40 55,36 61,36"
                  fill="#FFD700"
                  stroke="#FFC107"
                  strokeWidth="0.8"
                />
                <polygon
                  points="37,60 40,66 46,66 41,70 43,76 37,72 31,76 33,70 28,66 34,66"
                  fill="#FFD700"
                  stroke="#FFC107"
                  strokeWidth="0.8"
                />
                <polygon
                  points="63,60 66,66 72,66 67,70 69,76 63,72 57,76 59,70 54,66 60,66"
                  fill="#FFD700"
                  stroke="#FFC107"
                  strokeWidth="0.8"
                />
              </svg>
            )}

            {myBadgeInfo.student && (
              <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                role="img"
                aria-label="Student Badge"
              >
                {/* Bottle cap background */}
                <circle cx="50" cy="50" r="48" fill="#7C2529" /> {/* Maroon */}

                {/* Wavy cap edge */}
                <path
                  d="M50,2 
                    C54,10 66,6 70,12 
                    C74,18 86,14 88,22 
                    C90,30 98,34 96,42 
                    C94,50 100,58 94,64 
                    C88,70 90,82 82,86 
                    C74,90 70,98 62,96 
                    C54,94 46,100 38,96 
                    C30,92 26,94 18,88 
                    C10,82 12,70 6,64 
                    C0,58 6,50 4,42 
                    C2,34 10,30 12,22 
                    C14,14 26,18 30,12 
                    C34,6 46,10 50,2 Z"
                  fill="#7C2529"
                />

                {/* M letter */}
                <text
                  x="50%"
                  y="60%"
                  textAnchor="middle"
                  fill="#FFD700"
                  fontSize="40"
                  fontWeight="bold"
                  fontFamily="Arial, sans-serif"
                  dy=".3em"
                >
                  M
                </text>
              </svg>
            )}

            {myBadgeInfo.trustedSeller && (
              <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                role="img"
                aria-label="Trusted Seller Badge"
              >
                {/* Bottle cap background */}
                <circle cx="50" cy="50" r="48" fill="#FFD700" /> {/* Yellow */}

                {/* Wavy cap edge */}
                <path
                  d="M50,2 
                    C54,10 66,6 70,12 
                    C74,18 86,14 88,22 
                    C90,30 98,34 96,42 
                    C94,50 100,58 94,64 
                    C88,70 90,82 82,86 
                    C74,90 70,98 62,96 
                    C54,94 46,100 38,96 
                    C30,92 26,94 18,88 
                    C10,82 12,70 6,64 
                    C0,58 6,50 4,42 
                    C2,34 10,30 12,22 
                    C14,14 26,18 30,12 
                    C34,6 46,10 50,2 Z"
                  fill="#FFD700"
                />

                {/* Handshake icon */}
                <path
                  d="M35 45 C34 42, 38 42, 39 45
                    L43 53 C44 55, 46 55, 47 53
                    L50 48 L53 53 C54 55, 56 55, 57 53
                    L61 45 C62 42, 66 42, 65 45
                    L58 60 C57 62, 54 62, 52 60
                    L50 56 L48 60 C46 62, 43 62, 42 60 Z"
                  fill="#000000"
                />
              </svg>
            )}

            {myBadgeInfo.trustedRenter && (
              <svg
                viewBox="0 0 100 100"
                xmlns="http://www.w3.org/2000/svg"
                className="w-10 h-10"
                role="img"
                aria-label="Trusted Renter Badge"
              >
                {/* Bottle cap background */}
                <circle cx="50" cy="50" r="48" fill="#28a745" /> {/* Green */}

                {/* Wavy cap edge */}
                <path
                  d="M50,2 
                    C54,10 66,6 70,12 
                    C74,18 86,14 88,22 
                    C90,30 98,34 96,42 
                    C94,50 100,58 94,64 
                    C88,70 90,82 82,86 
                    C74,90 70,98 62,96 
                    C54,94 46,100 38,96 
                    C30,92 26,94 18,88 
                    C10,82 12,70 6,64 
                    C0,58 6,50 4,42 
                    C2,34 10,30 12,22 
                    C14,14 26,18 30,12 
                    C34,6 46,10 50,2 Z"
                  fill="#28a745"
                />

                {/* Rent contraction icon: house with inward arrows */}
                {/* House base */}
                <rect x="30" y="40" width="40" height="25" rx="3" ry="3" fill="#000" />
                {/* Roof */}
                <path d="M30 40 L50 25 L70 40 Z" fill="#000" />
                {/* Left inward arrow */}
                <line x1="20" y1="52" x2="30" y2="52" stroke="#000" strokeWidth="2" />
                <polyline points="25,47 30,52 25,57" fill="none" stroke="#000" strokeWidth="2" />
                {/* Right inward arrow */}
                <line x1="70" y1="52" x2="80" y2="52" stroke="#000" strokeWidth="2" />
                <polyline points="75,47 70,52 75,57" fill="none" stroke="#000" strokeWidth="2" />
              </svg>
            )}
          </div>
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
