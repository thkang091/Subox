
"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, User, Heart, 
  Package, Menu, X, Send, Check, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { title } from 'process';
import { faqData } from './faq/page';
import { hiwData } from './howitworks/page';
import { opData } from './optimize/page';
import { troubleData } from './troubleshooting/page';

// Define TypeScript interfaces
interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  location: string;
  image: string;
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  availableUntil: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
}

// Individual FAQ item component
const FAQItemComponent = ({ item, isOpen, onToggle }: { 
  item: FAQItem; 
  isOpen: boolean; 
  onToggle: () => void 
}) => {
  return (
    <div className={`border-b border-gray-700 ${isOpen ? 'bg-white' : ''}`}>
      <button
        className={`w-full flex justify-between items-center py-6 px-0 text-left hover:text-orange-400 transition-colors duration-300 ${
          isOpen ? 'text-orange-600' : 'text-black'
        }`}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <span className="text-lg font-medium pr-4">{item.question}</span>
        <span
          className={`text-xl transition-transform duration-300 text-gray-400 ${
            isOpen ? 'rotate-90 text-orange-400' : ''
          }`}
        >
          ›
        </span>
      </button>
      
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 pb-6' : 'max-h-0'
        }`}
      >
        <div className="bg-orange-100 p-5 rounded-lg">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
};

// Notifications dropdown component
const NotificationsButton = ({ notifications }: { notifications: Notification[] }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          >
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => router.push(`browse/notificationDetail/${notif.id}`)}
                    className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 text-left"
                  >
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{notif.message}</p>
                      <p className="text-xs text-gray-500">{notif.time}</p>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => router.push(`browse/notification/`)}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                See all notifications
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Help page component
const HelpPage = () => {
  // State variables
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const router = useRouter();


  const helpSections = [
    {
      id: "get-started",
      title: "Get Started",
      count: 0,
      description: "Everything you need to get started"
    },
    {
      id: "how-it-works",
      title: "How it Works",
      count: hiwData.length,
      description: "Step-by-step guide on using the platform."
    },
    {
      id: "optimize",
      title: "Optimize listing",
      count: opData.length,
      description: "Learn how to get your badges."
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      count: troubleData.length,
      description: "Fix common issues or errors you may encounter."
    },
    {
      id: "update",
      title: "Updates",
      count: 0,
      description: "Subox product updates"
    },
    {
      id: "faq",
      title: "FAQ",
      count: faqData.length,
      description: "Find answers to frequently asked questions."
    }
  ];

  // Notification data
  const notifications: Notification[] = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" }
  ];


  // Handle profile tab click
  const handleTabClick = (tab: string) => {
    router.push(`browse/profile/user?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };


  const isFormValid = () => {
  return formData.name.trim() !== '' && 
         formData.email.trim() !== '' && 
         formData.subject.trim() !== '' && 
         formData.message.trim() !== '';
  };

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // Form status
  const [status, setStatus] = useState({
    submitted: false,
    submitting: false,
    info: { error: false, msg: null }
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [id]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
     // Check if all fields are filled
    if (!isFormValid()) {
      setStatus({
        submitted: false,
        submitting: false,
        info: { error: true, msg: "Please fill all entries." }
      });
      return;
    }

    try {

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success state
      setStatus({
        submitted: true,
        submitting: false,
        info: { error: false, msg: "Your message sent successfully!" }
      });
      
      // Reset form after successful submission
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus({
          submitted: false,
          submitting: false,
          info: { error: false, msg: null }
        });
      }, 5000);
      
    } catch (error) {
      setStatus({
        submitted: false,
        submitting: false,
        info: { error: true, msg: "You failed sent a message. Please try again." }
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
        {/* Header */}
              <div className="bg-gradient-to-b from-orange-200 to-white pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <ul className="space-y-2 ">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <li><a href="/" className="text-2xl font-bold text-gray-900">Subox</a></li>
                    </div>
                    </ul>
        
        
                    {/* Header Actions */}
                    <div className="flex items-center space-x-4">
                      

                      {/* Notifications */}
                      <NotificationsButton notifications={notifications} />
        
                      {/* Profile */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowProfile(!showProfile)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <User className="w-5 h-5 text-gray-600" />
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
        
                      {/* menu */}
                      <div className="relative">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowMenu(!showMenu)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Menu className="w-5 h-5 text-gray-600" />
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
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  Browse Items
                                </button>                        
                                <button 
                                  onClick={() => {
                                    router.push('/sale/create');
                                    setShowMenu(false);
                                  }} 
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  Sell Items
                                </button> 
                                <button 
                                  onClick={() => {
                                    router.push('/sale/create');
                                    setShowMenu(false);
                                  }} 
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
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
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  Find Sublease
                                </button>   
                                <button 
                                  onClick={() => {
                                    router.push('../search');
                                    setShowMenu(false);
                                  }} 
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  Post Sublease
                                </button>   
                                <button 
                                  onClick={() => {
                                    router.push('../search');
                                    setShowMenu(false);
                                  }} 
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  My Sublease Listing
                                </button>
                                <hr className="my-2" />
                                <button 
                                  onClick={() => {
                                    router.push('../sale/browse');
                                    setShowMenu(false);
                                  }} 
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  Messages
                                </button>   
                                <button 
                                  onClick={() => {
                                    router.push('../help');
                                    setShowMenu(false);
                                  }} 
                                  className="w-full text-left px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                                >
                                  Help & Support
                                </button>
        
                                {/* need change (when user didn't log in -> show log in button) */}
                                <hr className="my-2" />
                                 {/* log in/ out */}
                                  {isLoggedIn ? (
                                    <button className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors">
                                      Logout
                                    </button>
                                  ) : (
                                    <button className="w-full text-left px-3 py-2 rounded-md text-sm text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors">
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
                <div className="flex flex-col items-center justify-center px-4 py-20">
                  {/* Label */}
                  <label htmlFor="search" className="text-3xl font-bold mb-7">
                    Helpful information for better use
                  </label>
                  {/* Search Input */}
                  <div className="w-full max-w-3xl">
                    <div className="relative w-full max-w-3xl">
                      {/* Search input with space for the button */}
                      <input
                        id="search"
                        type="text"
                        placeholder="Search for information..."
                        className="w-full rounded-3xl border border-gray-300 px-10 py-4 pr-24 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      />

                      {/* "Go" button inside input, positioned to the right */}
                      <button
                        type="submit"
                        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-orange-400 px-4 py-2 text-white font-semibold hover:bg-orange-500"
                      >
                        Go
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="w-full max-w-[825px] border border-orange-200 rounded-2xl p-6 bg-white/60 shadow-sm mx-auto">
                  {/* Title inside the border */}
                  <h2 className="text-lg pl-4 font-semibold text-orange-600 mb-4">
                    Most viewed information
                  </h2>

                  {/* Content (buttons) */}
                  <div className="flex justify-between space-x-4">
                    <button 
                    className="flex item-center flex-1 rounded-md bg-white px-4 py-2 text-gray-600 text-left font-inter text-sm hover:bg-orange-100"
                    onClick={() => router.push("help/faq/5")}
                    >
                      How can I negotiate prices at a Move Out Sale?
                      <span className='ml-auto text-orange-500'>-&gt;</span>
                    </button>
                    <button 
                    className="flex item-center flex-1 rounded-md bg-white px-4 py-2 text-gray-600 text-left font-inter text-sm hover:bg-orange-100"
                    onClick={() => router.push("help/howitworks/2")}
                    >
                      How do I post a listing?
                      <span className='ml-auto text-orange-500'>-&gt;</span>
                    </button>

                  </div>
                </div>
              </div>
      </div>
        <div className="max-w-4xl mx-auto px-4 -mt-10 mb-60">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex gap-4 mb-10">
              {/* Left grid: first half of helpSections */}
              <div className="grid grid-cols-1 gap-4 flex-1">
                {helpSections.slice(0, Math.ceil(helpSections.length / 2)).map((section) => (
                  <div
                    key={section.id}
                    className="bg-white border border-orange-200 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-orange-50 transition duration-300"
                    onClick={() => section.title == "How it Works" ? router.push("help/howitworks") : router.push("help/optimize")}
                  >
                    <h3 className="text-xl font-semibold text-orange-600 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                    <p className="text-xs text-gray-400 mt-3">{section.count} articles</p>
                  </div>
                ))}
              </div>

              {/* Right grid: second half of helpSections */}
              <div className="grid grid-cols-1 gap-4 flex-1">
                {helpSections.slice(Math.ceil(helpSections.length / 2)).map((section) => (
                  <div
                    key={section.id}
                    className="bg-white border border-orange-200 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-orange-50 transition duration-300"
                    onClick={() => section.title == "Troubleshooting" ? router.push("help/troubleshooting") : router.push("help/faq")}
                  >
                    <h3 className="text-xl font-semibold text-orange-600 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-600">{section.description}</p>
                    <p className="text-xs text-gray-400 mt-3">{section.count} articles</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="bg-orange-400 text-white py-12 w-full ">
        <div className="max-w-7xl mx-auto px-4 ">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 ">
            <div>
              <ul className="space-y-2 ">
              <div className="flex items-center space-x-3 mt-3 px-5">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <li><a href="/sale/browse" className="text-xl font-bold text-white">Subox</a></li>
              </div>
              <p className="text-gray-500 text-sm text-white mt-4 px-3">Find the perfect short-term housing solution near your campus and needed items.</p>
              </ul>
            </div>
            
            <div className="px-4">
              <h4 className="font-bold mb-4">Sublease</h4>
              <ul className="space-y-2">
                <li><a href="/sale/browse" className="hover:underline">Home</a></li>
                <li><a href="/search" className="hover:underline">Search</a></li>
                <li><a href="#" className="hover:underline">List Your Space</a></li>
                <li><a href="/help" className="hover:underline">Campus Map</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Move out sale</h4>
              <ul className="space-y-2">
                <li><a href="/sale/browse" className="hover:underline">Browse Items</a></li>
                <li><a href="#" className="hover:underline">Post Your Items</a></li>
                <li><a href="#" className="hover:underline">See favorites</a></li>
                <li><a href="#" className="hover:underline">Blog</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-gray-700 text-white text-sm text-center">
            <p>&copy; 2025 CampusSubleases. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};


export default HelpPage;