
"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, User, Heart, 
  Package, Menu, X, Send, Check, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from 'next/link';


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

interface FavoriteItem {
  id: number;
  name: string;
  location: string;
  price: number;
  image: string;
}

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
}

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

export type FAQItem = {
  id: number
  question: string
  answer: string
}

export const faqData: FAQItem[] = [
  {
    id: 1,
    question: "Is Subox Free?",
    answer: "A sublease (or subleasing) is an arrangement where a current tenant rents out all or part of their leased property to a third party for a portion of their remaining lease term. The original tenant maintains their contractual relationship with the landlord while creating a new landlord-tenant relationship with the subtenant."
  },
  {
    id: 2,
    question: "How is a Move Out Sale different from a regular secondhand sale?",
    answer: "Move Out Sales typically have firm deadlines based on moving dates, include multiple items from one seller, often feature deeper discounts due to time constraints, and may offer package deals for purchasing multiple items."
  },
  {
    id: 3,
    question: "How should I price my items for a Move Out Sale?",
    answer: "Consider the item's age, condition, original price, and market demand. Generally, pricing between 30-70% of the original cost works well. High-demand or barely-used items can be priced higher, while older items should be priced more aggressively."
  },
  {
    id: 4,
    question: "Should I accept payment methods other than cash?",
    answer: "Digital payment apps are increasingly common and provide transaction records. Consider accepting popular payment apps but be aware of potential fraud risks. Cash is still preferred for smaller transactions."
  },
  {
    id: 5,
    question: "How can I negotiate prices at a Move Out Sale?",
    answer: "Be respectful and reasonable with offers, consider buying multiple items for a package discount, point out any issues with the item that might affect its value, and be prepared to pay the asking price for high-demand items."
  }
];

// Main Help page component
const troubleshootingPage = () => {
  // State variables
  const [openItem, setOpenItem] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState<FavoriteItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const router = useRouter();
  

  // Notification data
  const notifications: Notification[] = [
    { id: 1, type: "price-drop", message: "MacBook Pro price dropped by $50!", time: "2h ago" },
    { id: 2, type: "new-item", message: "New furniture items in Dinkytown", time: "4h ago" },
    { id: 3, type: "favorite", message: "Your favorited item is ending soon", time: "1d ago" }
  ];

  const [showContactForm, setShowContactForm] = useState(false);

  // Effect for client-side only code
  useEffect(() => {
    setIsMounted(true);
    
    // Get favorites from localStorage
    try {
      const savedFavorites = localStorage.getItem('favoriteListings');
      if (savedFavorites) {
        setFavoriteListings(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
    }

  }, []);

  // Update localStorage when favoriteListings changes
  useEffect(() => {
    if (isMounted && favoriteListings.length > 0) {
      try {
        localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
      } catch (error) {
        console.error('Error saving favorites to localStorage:', error);
      }
    }
  }, [favoriteListings, isMounted]);

  // Handle FAQ item toggle
  const handleToggle = (id: number) => {
    setOpenItem(openItem === id ? null : id);
  };


  // Handle profile tab click
  const handleTabClick = (tab: string) => {
    router.push(`browse/profile/user?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  // Toggle favorite item
  const toggleFavorite = (product: FavoriteItem) => {
    // Check if it is already there
    const isFavorited = favoriteListings.some(item => item.id === product.id);
  
    if (isFavorited) {
      // If already added, cancel it
      setFavoriteListings(favoriteListings.filter(item => item.id !== product.id));
    } else {
      // Add new favorites
      setFavoriteListings([product, ...favoriteListings]);
      // Open sidebar
      setIsSidebarOpen(true);
    }
  };

  // Render favorites sidebar
  const renderFavoritesSidebar = () => (
    <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>                
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="font-bold text-lg text-orange-500">Favorites</h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        {/* Favorites list */}
        {favoriteListings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Heart size={40} className="mx-auto mb-2 opacity-50" />
            <p>No favorite items yet</p>
            <p className="text-sm mt-2">Click the heart icon on items to save them here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favoriteListings.map(product => (
              <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer">
                <div className="flex">
                  <div 
                    className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                    style={{backgroundImage: `url(${product.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                  ></div>
                  <div className="p-3 flex-1">
                    <div className="font-medium text-gray-700">{product.name}</div>
                    <div className="text-sm text-gray-500">{product.location}</div>
                    <div className="text-sm font-bold text-[#15361F] mt-1">
                      ${product.price}
                    </div>
                  </div>
                  <button 
                    className="p-2 text-gray-400 hover:text-red-500 self-start"
                    onClick={() => toggleFavorite(product)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

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
    <div className="min-h-screen bg-gradient-to-b from-orange-200 via-orange-50 to-white text-black">
        {/* Header */}
              <div className="border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <ul className="space-y-2 ">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <li><a href="/sale/browse" className="text-2xl font-bold text-gray-900">Subox</a></li>
                      <span className="text-sm text-gray-500 hidden sm:block">Move Out Sales</span> 
                    </div>
                    </ul>
        
        
                    {/* Header Actions */}
                    <div className="flex items-center space-x-4">
                      

                      {/* Notifications */}
                      <NotificationsButton notifications={notifications} />
        
                      {/* Favorites */}
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Heart size={20} className = "w-5 h-5 text-gray-600"/>
                      </motion.button>
                      
                      {/* Favorites Sidebar */}
                      {renderFavoritesSidebar()}
        
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
                </div>
            </div>

      <div className="flex justify-center mt-10">
        <div className="flex justify-center mt-10 gap-4">
          {/* Open button, visible only when form is closed */}
          {!showContactForm && (
            <button
              onClick={() => setShowContactForm(true)}
              className="w-[300px] bg-orange-500 hover:bg-orange-600 text-white text-2xl font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300"
            >
              Contact Us
            </button>
          )}
        </div>

        <AnimatePresence>
          {showContactForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="w-250 mx-auto py-8 px-8 overflow-hidden"
            >
              <h1 className="text-3xl font-bold mb-4 text-black">Help & Support</h1>
              <h2 className="text-xl font-bold mb-6 text-black">
                Contact Us
              </h2>
              {status.info.msg && (
              <div 
                className={`mb-4 p-4 rounded-lg flex items-start ${
                  status.info.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                }`}
              >
                {status.info.error ? (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <span>{status.info.msg}</span>
              </div>
              )}

              <div className="space-y-4 px-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Write your name here"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="example@email.com"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    id="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Write the title of request here"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Content
                  </label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-400 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Write your request or question here"
                    required
                  />
                </div>
                
                <div className="flex justify-end gap-4 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={status.submitting || !isFormValid()}
                    className={`flex items-center justify-center px-6 py-3 rounded-md text-white font-medium transition-all duration-200 ${
                      status.submitting || !isFormValid()
                        ? 'bg-orange-300 cursor-not-allowed' 
                        : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700'
                    }`}
                  >
                    {status.submitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowContactForm(false)}
                    className="px-6 py-3 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-gray-500 mb-10 px-4">
                * You will get the answer within 5 days.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 my-12">
                <div className="space-y-4">
                  {faqData.map((faq) => (
                    <Link key={faq.id} href={`faq/${faq.id}/`}>
                      <div className="cursor-pointer p-4 rounded hover:bg-orange-100 transition">
                        <h3 className="text-lg font-semibold text-orange-600">{faq.question}</h3>
                      </div>
                    </Link>
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
          
          <div>
            <h4 className="font-bold mb-4">Help</h4>
            <ul className="space-y-2">
              <li><a href="/help" className="hover:underline">Email Us</a></li>
              <li><a href="/help" className="hover:underline">FAQ</a></li>
              <li><a href="#" className="hover:underline">Terms of Service</a></li>
              <li><a href="#" className="hover:underline">Privacy Policy</a></li>
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


export default troubleshootingPage;