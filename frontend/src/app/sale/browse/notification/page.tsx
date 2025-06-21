'use client';

// add mmobile version too

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notification } from '@/data/notificationlistings';
import { House, User, Search } from "lucide-react";
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function NotificationPage() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');
  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const router = useRouter();
  
  let typeNotif;

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleTabClick = (tab: string) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (initialId) {
      setSelectedId(Number(initialId));
    }
  }, [initialId]);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    router.push(`/sale/browse?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("searchHistory") || "[]");
    setSearchHistory(stored);
  }, []);


  const selectedNotif = notification.find((n) => n.id === selectedId);

  if (selectedNotif) {
    if (selectedNotif.type.startsWith("message from")) {
      typeNotif = (
                <button
                  onClick={() => router.push(`product/${selectedNotif.productId}/message`)}
                  className="text-sm text-gray-500 mb-4"
                >
                  {selectedNotif.type}
                </button>
                )
    } else if (selectedNotif.type.startsWith("favorite")) {
      typeNotif = (
                <button
                  onClick={() => router.push(`/sale/browse`)}
                  className="text-sm text-gray-500 mb-4"
                >
                  {selectedNotif.type}
                </button>
                )
    } else if (selectedNotif.type.startsWith("price")) {
      typeNotif = (
                <button
                  onClick={() => router.push(`product/${selectedNotif.productId}`)}
                  className="text-sm text-gray-500 mb-4"
                >
                  {selectedNotif.type}
                </button>
                )
    } else if (selectedNotif.type.startsWith("new")) {
      typeNotif = (
                <button
                  onClick={() => router.push(`product/${selectedNotif.productId}`)}
                  className="text-sm text-gray-500 mb-4"
                >
                  {selectedNotif.type}
                </button>
                )
    }else {
      typeNotif = <p className="text-sm text-gray-500 mb-4">{selectedNotif.type}</p>;
    }
  } else {
    typeNotif = null;
  }

  return (
    <div className="flex min-h-screen">
      {/* Left: notification list */}
        <div className="w-1/3 border-r bg-gray-100 mt-16 px-6 py-4 overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">Notifications</h2>
          <ul>
            {notification.map((notif) => (
              <li
                key={notif.id}
                onClick={() => setSelectedId(notif.id)}
                className={`cursor-pointer px-3 py-2 rounded-md mb-2 hover:bg-gray-200 ${
                  selectedId === notif.id ? 'bg-white font-semibold' : ''
                }`}
              >
                <p className="text-sm text-gray-900 truncate">{notif.message}</p>
                <p className="text-xs text-gray-500">{notif.time}</p>
              </li>
            ))}
          </ul>
        </div>
      {/* Right: selected notification */}
      <div className="w-2/3 mt-16 px-6 py-4 overflow-y-auto">
        {selectedNotif ? (
          <div>
            <h3 className="text-2xl font-semibold mb-2">Notification #{selectedNotif.id}</h3>
            {typeNotif}
            <p className="text-sm text-gray-500 mb-4">{selectedNotif.time}</p>
            <p className="text-lg">{selectedNotif.message}</p>
          </div>
        ) : (
          <div className="text-gray-500 text-lg">Select a notification to read</div>
        )}
      </div>
      <button
        onClick={() => router.push('/sale/browse')}
        className="absolute top-4 left-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        <House/>
      </button>
      {/* Search */}
      <div className="w-full flex justify-center pt-4 px-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="Search items..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </form>
      </div>
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowProfile(!showProfile)}
          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors mr-4"
        >
          <User className="w-8 h-8 text-gray-600" />
        </motion.button>

        <AnimatePresence>
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
            >
              <div className="p-4 space-y-2">
                <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Purchased</button>
                <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Returned</button>
                <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Cancelled</button>
                <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">What I Sold</button>
                <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Sublease</button>
                <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">Reviews</button>
                <hr className="my-2" />
                <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors">History</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
