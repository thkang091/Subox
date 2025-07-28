'use client';

// add mmobile version too

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { notification } from '@/data/notificationlistings';
import { House, User, Search, ArrowLeft, MessagesSquare, Menu } from "lucide-react";
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
  const [user, setUser] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  
  let typeNotif;

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleTabClick = (tab: string) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        setUser(currentUser);
      } else {
        setUserId(null);
        setUser(null);
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
        <div className="w-1/3 border-r bg-[#FFF7F2] mt-16 px-6 py-4 overflow-y-auto">
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
      <div className="w-2/3 mt-16 px-6 py-4 overflow-y-auto bg-gradient-to-br from-[#FFF7F2] via-white to-white">
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
        className="absolute top-1 left-4 px-4 py-2"
      >
        <motion.div 
            className="flex items-center space-x-7 relative"
            whileHover={{ scale: 1.05 }}
        >
        {/* Main Subox Logo */}
        <motion.div className="relative">
        {/* House Icon */}
        <motion.svg 
            className="w-12 h-12" 
            viewBox="0 0 100 100" 
            fill="none"
            whileHover={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5 }}
        >
            {/* House Base */}
            <motion.path
            d="M20 45L50 20L80 45V75C80 78 77 80 75 80H25C22 80 20 78 20 75V45Z"
            fill="#E97451"
            animate={{ 
                fill: ["#E97451", "#F59E0B", "#E97451"],
                scale: [1, 1.02, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            />
            {/* House Roof */}
            <motion.path
            d="M15 50L50 20L85 50L50 15L15 50Z"
            fill="#D97706"
            animate={{ rotate: [0, 1, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            />
            {/* Window */}
            <motion.rect
            x="40"
            y="50"
            width="20"
            height="15"
            fill="white"
            animate={{ 
                opacity: [1, 0.8, 1],
                scale: [1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Door */}
            <motion.rect
            x="45"
            y="65"
            width="10"
            height="15"
            fill="white"
            animate={{ scaleY: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            />
        </motion.svg>

        {/* Tag Icon */}
        <motion.svg 
            className="w-8 h-8 absolute -top-2 -right-2" 
            viewBox="0 0 60 60" 
            fill="none"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
        >
            <motion.path
            d="M5 25L25 5H50V25L30 45L5 25Z"
            fill="#E97451"
            animate={{ 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.1, 1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.circle
            cx="38"
            cy="17"
            r="4"
            fill="white"
            animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            />
        </motion.svg>
        </motion.div>

        {/* Subox Text */}
        <motion.div className="flex flex-col -mx-4">
        <motion.span 
            className="text-3xl font-bold text-gray-900"
            animate={{
            background: [
                "linear-gradient(45deg, #1F2937, #374151)",
                "linear-gradient(45deg, #E97451, #F59E0B)",
                "linear-gradient(45deg, #1F2937, #374151)"
            ],
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            color: "transparent"
            }}
            transition={{ duration: 4, repeat: Infinity }}
        >
            Subox
        </motion.span>
        </motion.div>
        </motion.div>
      </button>
      {/* Search */}
      <div className="w-full flex items-start pt-4 px-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs flex items-center space-x-2">
          <Search className="text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
            placeholder="Search items..."
            className="pl-4 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </form>
        <div className='flex space-x-3'>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.back()}
            className="ml-32 flex items-center px-3 py-2 rounded-lg hover:bg-orange-600 text-black hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="mr-1" />
            Back
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
            <MessagesSquare className = "w-5 h-5 text-white"/>
          </motion.button>
          {/* Profile */}
          <div className="relative">
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfile(!showProfile)}
                className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
            >
                <User className="w-5 h-5 text-white" />
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
                    <button onClick={() => handleTabClick("purchased")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Purchased</button>
                    <button onClick={() => handleTabClick("returned")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Returned</button>
                    <button onClick={() => handleTabClick("cancelled")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Cancelled</button>
                    <button onClick={() => handleTabClick("sold")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">What I Sold</button>
                    <button onClick={() => handleTabClick("sublease")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">Sublease</button>
                    <button onClick={() => handleTabClick("reviews")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">Reviews</button>
                    <hr className="my-2" />
                    <button onClick={() => handleTabClick("history")} className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">History</button>
                    </div>
                </motion.div>
                )}
            </AnimatePresence>
          </div>
          {/* menu */}
          <div className="relative">
          <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
          >
              <Menu className="w-5 h-5 text-white" />
          </motion.button>

          <AnimatePresence>
              {showMenu && (
              <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
              >
                  <div className="p-4 space-y-2">
                  <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
                  Move Out Sale
                  </p>
                  <button 
                      onClick={() => {
                      router.push('../browse');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      Browse Items
                  </button>                        
                  <button 
                      onClick={() => {
                      router.push('/sale/create');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      Sell Items
                  </button> 
                  <button 
                      onClick={() => {
                      router.push('/sale/create');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      My Items
                  </button>   
                  
                  <p className="text-medium font-semibold max-w-2xl mb-4 text-orange-700">
                      Sublease
                  </p>
                  <button 
                      onClick={() => {
                      router.push('../search');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      Find Sublease
                  </button>   
                  <button 
                      onClick={() => {
                      router.push('../search');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      Post Sublease
                  </button>   
                  <button 
                      onClick={() => {
                      router.push('../search');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      My Sublease Listing
                  </button>
                  <hr className="my-2" />
                  <button 
                      onClick={() => {
                      router.push('../sale/browse');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      Messages
                  </button>   
                  <button 
                      onClick={() => {
                      router.push('../help');
                      setShowMenu(false);
                      }} 
                      className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors"
                  >
                      Help & Support
                  </button>

                  {/* need change (when user didn't log in -> show log in button) */}
                  <hr className="my-2" />
                      {/* log in/ out */}
                      {isLoggedIn ? (
                      <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">
                          Logout
                      </button>
                      ) : (
                      <button className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-orange-50 transition-colors">
                          Login
                      </button>
                      )}
                  </div>
              </motion.div>
              )}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}