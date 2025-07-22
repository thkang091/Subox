
"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, User, Heart, 
  Package, Menu, X, Send, Check, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { title } from 'process';

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
  const [firstPage, setFirstPage] = useState(true);
  const [secondPage, setSecondPage] = useState(false);
  const [thirdPage, setThirdPage] = useState(false);
  const [fourthPage, setFourthPage] = useState(false);
  const [secondPageId, setSecondPageId] = useState("");
  const [thirdPageId, setThirdPageId] = useState(0);
  const [query, setQuery] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState([]);

  
  const router = useRouter();

  const [selected, setSelected] = useState<string | null>(null);
  const emojis = [
    { label: "No", icon: "😞" },
    { label: "Kind of", icon: "😐" },
    { label: "Yes", icon: "😊" },
  ];

  const helpSections = [
    {
      id: "getstarted",
      title: "Get Started",
      count: 4,
      icon:  <Package className="w-10 h-10 text-orange-600 " />,
      description: "Everything you need to get started.",
      question: [
        "How to use Subox", 
        "Moving sale", 
        "Sublease", 
        "Post"
      ],
      answer: [
        "Log in to Subox. Then, click your needed item: sublease or moving sale. After clicking one, choose if you want to post a sale or sublease, or find a place or product to rent or buy.",
        "Go into moving sale and find what you want. You can search for products before you login. However, to buy a product, logging in is mandatory.",
        "Go into sublease and find a place you want. You can search for a place before you login. However, to rent a place, logging in is mandatory.",
        "If you want to post an item or a place, you need to log in and follow the guide."
      ]
    },
    {
      id: "howitworks",
      title: "How it Works",
      count: 4,
      icon: 
        <svg
          viewBox="0 0 4000 4000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 fill-current text-orange-500 scale-y-[-1]"
        >
          <path d="M2998 3868 c-20 -25 -17 -47 18 -119 52 -106 52 -105 -104 -29 -1168
          571 -2552 -568 -2234 -1839 68 -272 236 -601 307 -601 60 0 63 56 8 136 -229
          333 -313 865 -196 1244 283 913 1250 1347 2108 946 187 -87 187 -87 30 -149
          -130 -51 -174 -120 -85 -133 62 -9 396 152 384 184 -121 314 -188 417 -236
          360z"/>
          <path d="M2076 3225 c-17 -19 -37 -76 -44 -127 -19 -130 -133 -175 -232 -91
          -94 79 -155 70 -266 -43 -110 -111 -119 -171 -42 -262 90 -108 12 -242 -140
          -242 -81 0 -112 -59 -112 -213 0 -152 31 -207 115 -207 146 0 224 -138 136
          -242 -77 -92 -67 -154 45 -264 112 -110 171 -119 263 -41 105 87 240 6 241
          -145 0 -80 62 -110 213 -104 198 9 208 83 12 92 -121 6 -125 8 -125 60 -1 193
          -238 308 -392 191 l-70 -53 -69 67 c-82 80 -82 80 -19 155 121 144 1 384 -191
          384 -58 0 -59 2 -59 110 l0 110 65 0 c109 1 159 40 210 167 51 128 55 107 -48
          249 -33 45 -31 49 38 119 80 79 60 81 210 -27 103 -75 303 51 320 201 l10 91
          105 0 105 0 10 -91 c13 -113 46 -151 175 -197 109 -39 90 -44 236 61 45 33 49
          31 118 -38 l71 -71 -65 -91 -66 -92 50 -115 c54 -125 105 -165 211 -166 l65 0
          0 -110 0 -110 -65 0 c-105 -1 -156 -41 -204 -160 -49 -122 -47 -141 25 -236
          l51 -67 -72 -72 -72 -72 -73 56 c-77 59 -178 63 -242 10 -70 -59 -4 -122 85
          -81 44 20 59 16 110 -28 91 -76 153 -66 263 46 110 111 119 171 43 262 -89
          105 -10 242 139 242 81 0 112 59 112 213 0 152 -31 207 -115 207 -149 0 -226
          136 -137 242 78 92 68 154 -44 264 -112 110 -171 119 -264 41 -99 -84 -213
          -39 -232 91 -20 140 -49 162 -218 162 -112 0 -151 -8 -174 -35z"/>
          <path d="M3460 3189 c0 -17 36 -91 80 -164 770 -1276 -602 -2773 -1950 -2128
          l-160 77 137 62 c135 62 175 123 91 140 -50 9 -378 -150 -378 -184 0 -41 141
          -359 166 -375 73 -47 91 32 34 144 -46 89 -33 97 64 40 380 -223 1036 -208
          1476 33 826 451 1088 1489 583 2301 -54 87 -143 121 -143 54z"/>
          <path d="M2100 2674 c-212 -67 -343 -335 -276 -562 70 -234 469 -407 611 -265
          51 50 8 98 -73 81 -325 -71 -569 231 -404 499 197 319 724 110 622 -246 -27
          -96 43 -177 89 -103 181 294 -215 708 -569 596z"/>
        </svg>,
      description: "Step-by-step guide on using the platform.",
      question: [
        "How do I create an account?", 
        "How do I post a listing?", 
        "How do I filter and save my pick in moving sales?", 
        "How do I find a place to rent?"
      ],
      answer: [
        "To create an account, click signup and fill the form.",
        "After logging in, click 'Post' and fill details or use AI listing.",
        "Click the icon on the bottom right and filter what you'r finding. Then, click the heart button by saving in your favorite list.",
        "Go to the sublease page and filter through the map in it and check your preference like date, cleanliness, etc."
      ]
    },
    {
      id: "optimize",
      title: "Optimize listing",
      count: 5,
      icon: 
        <svg
          viewBox="0 0 4000 4000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 fill-current text-orange-500 scale-y-[-1]"
        >
          <path d="M610 2993 c-225 -38 -418 -214 -489 -447 -21 -67 -21 -84 -21 -866 0
          -782 0 -799 21 -866 34 -110 87 -202 160 -275 72 -73 129 -110 228 -148 l66
          -26 640 -5 640 -5 60 -37 c210 -131 426 -141 640 -30 85 45 208 162 254 244
          119 212 112 454 -20 659 l-39 60 0 615 c0 689 3 662 -73 808 -55 106 -147 198
          -253 253 -149 77 -97 73 -991 72 -439 -1 -809 -4 -823 -6z m1693 -113 c125
          -39 235 -132 292 -247 56 -115 55 -101 55 -714 l0 -568 -57 35 c-120 72 -225
          98 -367 92 -164 -9 -290 -66 -413 -188 -67 -67 -128 -160 -158 -241 -20 -54
          -33 -59 -170 -59 -85 0 -105 -8 -105 -45 0 -39 19 -45 131 -45 l106 0 7 -85
          c7 -98 43 -221 84 -285 15 -25 32 -51 36 -58 6 -10 -106 -12 -586 -10 l-593 3
          -79 39 c-133 65 -219 164 -265 305 -21 63 -21 79 -21 867 l0 803 23 74 c42
          131 127 234 243 292 107 54 88 53 960 54 786 1 814 0 877 -19z m77 -1510 c141
          -27 299 -153 364 -291 73 -154 69 -334 -10 -491 -38 -74 -134 -170 -213 -212
          -277 -146 -613 -39 -746 238 -97 202 -54 457 104 615 126 125 311 177 501 141z"/>
          <path d="M1063 2654 c-7 -3 -82 -86 -168 -185 -86 -98 -158 -179 -161 -179 -3
          0 -49 32 -102 70 -104 76 -136 85 -154 45 -10 -22 -8 -29 13 -51 38 -40 234
          -184 252 -184 25 0 387 408 387 436 0 15 -35 55 -47 53 -5 0 -13 -3 -20 -5z"/>
          <path d="M1392 2398 c-16 -16 -15 -53 2 -67 9 -8 144 -10 481 -9 467 3 468 3
          476 24 5 14 2 29 -7 43 -15 21 -18 21 -478 21 -346 0 -465 -3 -474 -12z"/>
          <path d="M1030 1938 c-17 -18 -88 -99 -158 -180 -69 -82 -131 -148 -137 -148
          -6 0 -55 32 -109 70 -54 39 -104 70 -111 70 -17 0 -45 -33 -45 -53 0 -17 91
          -94 203 -170 53 -36 72 -45 86 -38 29 16 355 395 368 428 7 18 -25 53 -47 53
          -10 0 -32 -15 -50 -32z"/>
          <path d="M1395 1710 c-15 -16 -17 -26 -9 -48 l9 -27 467 -3 467 -2 17 25 c15
          23 15 27 0 50 l-16 25 -459 0 c-447 0 -458 0 -476 -20z"/>
          <path d="M1015 1186 c-27 -30 -99 -113 -160 -185 -60 -71 -113 -130 -118 -130
          -4 -1 -50 31 -103 69 -106 77 -137 86 -156 44 -12 -25 -10 -29 33 -68 66 -60
          219 -166 238 -166 9 0 51 39 92 88 166 193 289 343 289 352 0 14 -38 50 -52
          50 -7 0 -35 -24 -63 -54z"/>
          <path d="M2520 1118 c-12 -13 -78 -105 -148 -205 -70 -101 -130 -183 -133
          -183 -4 0 -53 36 -109 80 -102 80 -125 91 -148 68 -28 -28 -13 -57 66 -124 95
          -81 191 -154 203 -154 14 0 57 52 152 187 125 178 197 290 197 307 0 14 -36
          46 -52 46 -4 0 -17 -10 -28 -22z"/>
        </svg>,
      description: "Learn how to get your badges.",
      question: [
        "How do I get a school or alumni badge?", 
        "How do I get a trusted seller badge?", 
        "How do I get a trusted renter badge?", 
        "How do I get a best rater badge?",
        "How do I get a best reviewer badge?"
      ],
      answer: [
        "To get a school badge, you need to add and verify your school email. For alumni badge, you need to check the checkbox for alumni and add your graduation date.",
        "To get a trusted seller badge, you need to have sold at least 10 products.",
        "To get a trusted renter badge, you need to have subleased at least 4 times.",
        "To get a best rater badge, you need to have rated at least 15 products or sublease and have a rate error less than 2.",
        "To get a best reviewer badge, you need to have wrote at least 20 reviews."
      ]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting",
      count: 5,
      icon: 
        <svg
          viewBox="0 0 4000 4000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-17 h-17 fill-current text-orange-500 scale-y-[-1] -mx-2 my-1"
        >
          <path d="M1139 2559 l-96 -41 5 -120 5 -120 -59 -60 -59 -60 -122 5 -121 6
          -43 -106 -42 -105 86 -80 87 -80 0 -88 0 -88 -87 -80 -87 -79 43 -105 43 -104
          120 4 120 5 63 -63 c90 -89 89 -89 203 103 l93 158 -36 41 c-63 69 -90 140
          -90 233 0 67 5 90 28 140 97 208 370 263 536 107 91 -86 131 -220 98 -333 -14
          -45 -50 -111 -91 -164 -8 -11 165 -338 186 -351 6 -4 41 24 78 61 l68 68 120
          -5 120 -4 43 104 43 105 -87 79 -87 80 0 88 0 88 87 80 86 80 -42 105 -43 106
          -121 -6 -122 -5 -59 60 -59 60 5 120 5 120 -99 41 c-54 23 -102 41 -107 41 -4
          0 -43 -38 -85 -85 l-78 -85 -88 0 -88 0 -78 85 c-42 47 -82 85 -88 84 -6 0
          -54 -18 -107 -40z"/>
          <path d="M1485 1493 c-11 -2 -30 -12 -42 -21 -12 -9 -110 -165 -218 -347 -183
          -308 -196 -333 -192 -369 7 -51 43 -86 98 -97 24 -4 205 -8 402 -9 388 0 401
          2 425 55 26 56 17 79 -164 404 -97 174 -185 328 -196 343 -22 32 -70 50 -113
          41z m61 -239 c18 -17 24 -32 21 -47 -3 -12 -9 -83 -12 -157 -4 -74 -12 -141
          -17 -147 -12 -15 -47 -17 -67 -4 -10 6 -16 55 -24 176 l-11 168 23 18 c32 26
          57 24 87 -7z m2 -402 c6 -9 12 -25 12 -36 0 -52 -75 -76 -104 -34 -22 31 -20
          45 9 74 27 27 59 26 83 -4z"/>
        </svg>,
      description: "Fix common issues or errors you may encounter.",
      question: [
        "I forgot my password.", 
        "App crashes on launch.", 
        "Google and Facebook log in is not working.", 
        "Cannot go to the next page.",
        "The UI is weird on my device?"
      ],
      answer: [
        "Click 'Forgot password' to reset it.",
        "Try refreshing the website or check your browser update, blocks, etc. and if it still doesn't work, contact us.",
        "Try refreshing the website or check your Google or Facebook account and if it still doesn't work, contact us.",
        "Check your network and if it still doesn't work, contact us.",
        "Try refreshing the website. If it still doesn't work, contact us and try it with another device: laptop, computer, or other mobile devices."
      ]
    },
    {
      id: "updates",
      title: "Updates",
      count: 1,
      icon: 
        <svg
          viewBox="0 0 4000 4000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-17 h-17 fill-current text-orange-500 scale-y-[-1] -my-1"
        >
            <path d="M945 2145 c-215 -41 -385 -128 -543 -280 -138 -131 -232 -291 -284
            -483 -17 -63 -21 -106 -22 -237 0 -142 3 -171 26 -257 27 -99 86 -231 136
            -303 23 -33 34 -40 62 -40 28 0 36 5 43 25 8 21 1 38 -37 100 -199 322 -174
            735 62 1032 210 263 542 396 874 348 83 -12 272 -73 242 -78 -37 -6 -59 -38
            -48 -70 l9 -27 134 -3 c144 -3 161 2 161 47 -1 35 -81 221 -102 234 -12 8 -24
            7 -44 -1 -25 -12 -26 -16 -21 -57 l6 -44 -68 29 c-124 51 -224 71 -371 76 -93
            2 -160 -1 -215 -11z"/>
            <path d="M1081 1823 c-16 -16 -131 -140 -255 -276 -288 -317 -288 -317 -65
            -317 128 0 139 1 152 21 16 21 12 54 -7 67 -6 4 -39 9 -73 12 l-62 5 174 190
            c95 105 177 190 181 189 4 0 85 -86 181 -190 l173 -189 -57 -3 c-32 -2 -63 -8
            -70 -14 -10 -8 -13 -59 -13 -204 l0 -194 -210 0 -210 0 0 84 c0 64 -4 88 -16
            100 -18 19 -55 21 -72 4 -17 -17 -17 -259 0 -276 9 -9 88 -12 294 -12 244 0
            285 2 298 16 13 13 16 46 16 205 l0 189 94 0 c102 0 120 9 114 53 -3 25 -475
            550 -505 561 -24 10 -31 7 -62 -21z"/>
            <path d="M1896 1694 c-24 -23 -20 -41 21 -102 45 -69 94 -184 119 -282 27
            -108 25 -315 -4 -425 -80 -297 -308 -542 -599 -641 -223 -76 -440 -70 -666 18
            -77 30 -80 32 -51 38 17 4 36 10 42 14 16 9 15 59 0 74 -17 17 -259 17 -276 0
            -20 -20 -14 -52 25 -150 41 -105 57 -128 88 -128 32 0 49 24 42 64 l-5 33 81
            -34 c229 -96 505 -109 737 -32 335 110 587 378 682 727 31 114 31 352 0 476
            -24 96 -90 246 -142 320 -33 50 -65 60 -94 30z"/>
            <path d="M832 688 c-15 -15 -15 -61 0 -76 17 -17 569 -17 586 0 15 15 15 61 0
            76 -17 17 -569 17 -586 0z"/>
            <path d="M936 484 c-19 -18 -21 -55 -4 -72 8 -8 66 -12 195 -12 170 0 183 1
            193 19 14 27 13 47 -6 65 -23 24 -355 24 -378 0z"/>
        </svg>,
      description: "Subox product updates",
      question: [
        "Subox AI summaries & Notes"
      ],
      answer: [
        <>
            We're introducing several major updates in Subox 1.0, focusing on general things for easy use.
            <p className='mt-10'>Post your product through AI</p>
            <p>By using AI, we help you post your pdocut easy and fast</p>
            <p className='mt-10'>Post your sublease though chat.</p>
            <p>But just answering the questions, you can easily post your sublease.</p>
        </>
      ]
    },
    {
      id: "faq",
      title: "FAQ",
      count: 5,
      icon: 
        <svg
          viewBox="0 0 4000 4000"
          xmlns="http://www.w3.org/2000/svg"
          className="w-15 h-15 fill-current text-orange-500 scale-y-[-1] my-1"
        >
          <path d="M990 2239 c-159 -18 -362 -95 -501 -190 -81 -55 -198 -166 -260 -248
          -65 -87 -153 -264 -184 -374 -73 -259 -47 -542 74 -792 170 -352 510 -588 899
          -625 616 -58 1164 394 1222 1008 57 602 -370 1137 -970 1218 -116 15 -168 16
          -280 3z m351 -223 c170 -43 295 -112 418 -230 188 -182 281 -400 281 -661 0
          -249 -81 -450 -255 -634 -269 -283 -691 -363 -1050 -197 -191 88 -358 258
          -448 455 -106 235 -104 526 7 766 88 191 258 358 455 448 177 80 406 100 592
          53z"/>
          <path d="M1023 1775 c-181 -49 -303 -201 -303 -377 0 -52 4 -63 29 -89 66 -66
          171 -15 171 83 1 69 60 153 125 178 17 6 54 11 83 11 133 0 228 -127 193 -259
          -9 -33 -32 -62 -99 -130 -92 -92 -145 -177 -176 -281 -28 -95 -31 -92 85 -89
          l102 3 12 42 c20 68 58 123 139 201 99 96 138 172 144 280 12 214 -120 387
          -326 431 -68 14 -114 13 -179 -4z"/>
          <path d="M1027 664 c-4 -4 -7 -52 -7 -106 l0 -98 105 0 106 0 -3 103 -3 102
          -95 3 c-53 1 -99 0 -103 -4z"/>
        </svg>,
      description: "Find answers to frequently asked questions.",
      question: [
        "Is Subox Free?", 
        "How is a Move Out Sale different from a regular secondhand sale?", 
        "How should I price my items for a Move Out Sale?", 
        "Should I accept payment methods other than cash?",
        "How can I negotiate prices at a Move Out Sale?"
      ],
      answer: [
        "A sublease (or subleasing) is an arrangement where a current tenant rents out all or part of their leased property to a third party for a portion of their remaining lease term. The original tenant maintains their contractual relationship with the landlord while creating a new landlord-tenant relationship with the subtenant.",
        "Move Out Sales typically have firm deadlines based on moving dates, include multiple items from one seller, often feature deeper discounts due to time constraints, and may offer package deals for purchasing multiple items.",
        "Consider the item's age, condition, original price, and market demand. Generally, pricing between 30-70% of the original cost works well. High-demand or barely-used items can be priced higher, while older items should be priced more aggressively.",
        "Digital payment apps are increasingly common and provide transaction records. Consider accepting popular payment apps but be aware of potential fraud risks. Cash is still preferred for smaller transactions.",
        "Be respectful and reasonable with offers, consider buying multiple items for a package discount, point out any issues with the item that might affect its value, and be prepared to pay the asking price for high-demand items."
      ]
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

  //Search
  const handleSearch = () => {
    if (typeof query !== "string" || query.trim() === "") {
      setFilteredQuestions([]);
      return;
    }
    const results = [];

    helpSections.forEach((section) => {
      section.question.forEach((q, index) => {
        if (q.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            sectionId: section.id,
            question: q,
            index,
          });
        }
      });
    });

    setFilteredQuestions(results);
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
                {firstPage ? (
                <div className="flex flex-col items-center justify-center px-4 py-20">
                  {/* Label */}
                  <label htmlFor="search" className="text-3xl font-bold mb-7">
                    Helpful information for better use
                  </label>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch();
                      setFirstPage(false);
                      setFourthPage(true);
                    }}
                    className="w-lg"
                    >
                      {/* Search Input */}
                      <div className="w-full max-w-3xl">
                        <div className="relative w-full max-w-3xl">
                          {/* Search input with space for the button */}
                          <input
                            id="search"
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
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
                    </form>
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center px-4 py-20">
                  {/* Search Input */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearch();
                      setFirstPage(false);
                      setFourthPage(true);
                    }}
                    className="w-2xl"
                    >
                    <div className="w-full max-w-3xl">
                      <div className="relative w-full max-w-3xl">
                        {/* Search input with space for the button */}
                        <input
                          id="search"
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
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
                  </form>
                </div>
                )}
                {firstPage && (
                <div className="w-full max-w-[825px] border border-orange-200 rounded-2xl p-6 bg-white/60 shadow-sm mx-auto">
                  {/* Title inside the border */}
                  <h2 className="text-lg pl-4 font-semibold text-orange-600 mb-4">
                    Most viewed information
                  </h2>

                  {/* Content (buttons) */}
                  <div className="flex justify-between space-x-4">
                    <button 
                    className="flex item-center flex-1 rounded-md bg-white px-4 py-2 text-gray-600 text-left font-inter text-sm hover:bg-orange-100"
                    onClick={() => {
                      setFirstPage(false);
                      setThirdPage(true);
                      setSecondPageId("faq");
                      setThirdPageId(4);
                    }}
                    >
                      How can I negotiate prices at a Move Out Sale?
                      <span className='ml-auto text-orange-500'>-&gt;</span>
                    </button>
                    <button 
                    className="flex item-center flex-1 rounded-md bg-white px-4 py-2 text-gray-600 text-left font-inter text-sm hover:bg-orange-100"
                    onClick={() => {
                      setFirstPage(false);
                      setThirdPage(true);
                      setSecondPageId("howitworks");
                      setThirdPageId(1);
                    }}
                    >
                      How do I post a listing?
                      <span className='ml-auto text-orange-500'>-&gt;</span>
                    </button>

                    </div>
                  </div>
                )}
                </div>
              </div>
              {firstPage && (
              <div className="max-w-4xl mx-auto px-4 -mt-10 mb-60">
                <div className="max-w-4xl mx-auto px-4">
                  <div className="flex gap-4 mb-10">
                    {/* Left grid: first half of helpSections */}
                    <div className="grid grid-cols-1 gap-4 flex-1">
                      {helpSections.slice(0, Math.ceil(helpSections.length / 2)).map((section) => (
                        <div
                          key={section.id}
                          className="relative bg-white border border-orange-200 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-orange-100 transition duration-300 h-full"
                          onClick={() => {
                            setFirstPage(false);
                            setSecondPage(true);
                            setSecondPageId(section.id);
                          }}
                        >
                          <div className="absolute top-4 left-4 h-6 w-6 text-orange-500">
                            {section.icon}
                          </div>
                          <h3 className="text-xl font-semibold text-orange-600 mb-2 mt-12">
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
                          className="relative bg-white border border-orange-200 rounded-xl shadow-lg p-6 cursor-pointer hover:bg-orange-100 transition duration-300 h-full"
                          onClick={() => {
                            setFirstPage(false);
                            setSecondPage(true);
                            setSecondPageId(section.id);
                          }}
                        >
                          <div className="absolute -top-2 left-5 h-6 w-6 text-orange-500">
                            {section.icon}
                          </div>
                          <h3 className="text-xl font-semibold text-orange-600 mb-2 mt-11">
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
              )}
              {secondPage && (
              <div className="max-w-4xl mx-auto py-16 px-8">
                {helpSections.filter((section) => section.id === secondPageId)
                .map((section) => (
                  <div className='-mt-20'>
                    <span 
                      className='text-gray-600 text-inter hover:underline hover:text-orange-600 pl-4'
                      onClick={() => {
                        setFirstPage(true); 
                        setSecondPage(false);
                        setSecondPageId("");
                      }}
                    >All Collections</span>
                    <span className='ml-4 text-orange-600'>&gt;</span>
                    <span className='ml-4 text-gray-700'>{section.title}</span>
                    {section.id === "getstarted" &&
                      <div className=" mt-5 h-6 w-6 text-orange-500 pl-4">
                        {section.icon}
                      </div>
                    }
                    {section.id === "troubleshooting" &&
                      <div className="-mt-1 mb-15 h-6 w-6 text-orange-500 pl-4">
                        {section.icon}
                      </div>
                    }
                    {section.id === "howitworks" &&
                      <div className="mt-5 h-8 w-8 text-orange-500 pl-4">
                        {section.icon}
                      </div>
                    }
                    {section.id === "updates" &&
                      <div className="-mt-1 mb-16 h-6 w-6 text-orange-500 pl-4">
                        {section.icon}
                      </div>
                    }
                    {section.id === "optimize" &&
                      <div className="mt-4 mb-11 h-6 w-6 text-orange-500 pl-4">
                        {section.icon}
                      </div>
                    }
                    {section.id === "faq" &&
                      <div className="-mt-2 mb-14 h-7 w-7 text-orange-500 pl-4">
                        {section.icon}
                      </div>
                    }
                    <h1 className="text-3xl font-bold text-orange-600 mb-2 text-left pl-4 mt-10">{section.title}</h1>
                    <h2 className="text-md font-sans text-gray-600 mb-6 text-left pl-4">{section.description}</h2>
                    <h3 className="text-sm font-sans text-gray-400 text-left pl-4">{section.question.length} articles</h3>
                      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 my-7">
                          <div className="space-y-4">
                            {section.question.map((q, index) => (
                              <div
                                key={index}
                                className="cursor-pointer p-4 rounded hover:bg-orange-100 transition"
                                onClick={() => {
                                  setSecondPage(false);
                                  setThirdPage(true);
                                  setThirdPageId(index);
                                }}
                              >
                                <h3 className="text-lg font-semibold text-orange-600">{q}</h3>
                              </div>
                            ))}
                          </div>
                      </div>
                      <span
                        className="inline-block mt-8 px-6 py-2 bg-orange-500 text-white rounded-3xl hover:bg-orange-600"
                        onClick={() => {
                          setFirstPage(true);
                          setSecondPage(false);
                          setSecondPageId("");
                        }}
                      >← Back to Help</span>
                  </div>
                ))}
              </div>
              )}
              {thirdPage && (
              <div className="max-w-3xl mx-auto py-16 px-6">
                {helpSections.filter((section) => section.id === secondPageId)
                .map((section) => (
                  <div className='-mt-20'>
                    <span 
                      className='text-gray-600 text-inter hover:underline hover:text-orange-600 pl-4'
                      onClick={() => {
                        setFirstPage(true); 
                        setThirdPage(false);
                        setSelected(null);
                        setSecondPageId("");
                        setThirdPageId(0);
                      }}
                    >All Collections</span>
                    <span className='ml-4 text-orange-600'>&gt;</span>
                    <span 
                      className='text-gray-600 text-inter hover:underline hover:text-orange-600 pl-4'
                      onClick={() => {
                        setSecondPage(true); 
                        setThirdPage(false);
                        setSelected(null);
                        setThirdPageId(0);
                      }}
                    >{section.title}</span>
                    <span className='ml-4 text-orange-600'>&gt;</span>
                    <span className='ml-4 text-gray-700'>{section.question[thirdPageId]}</span>
                      <p className="text-3xl font-bold text-orange-600 mb-4 mt-10">{section.question[thirdPageId]}</p>
                      <p className="text-sm font-inter text-gray-600 mb-4">Updated 1 day ago</p>
                      <p className="text-lg text-gray-700 mt-10">{section.answer[thirdPageId]}</p>
                      <div className="flex flex-col items-center justify-center mt-16 space-y-4">
                        {/* Question */}
                        <p className="text-lg font-semibold text-gray-800">
                          Did this answer your question?
                        </p>

                        {/* Emoji Buttons */}
                        <div className="flex space-x-6 text-3xl">
                          {emojis.map(({ label, icon }) => (
                            <button
                              key={label}
                              aria-label={label}
                              onClick={() => setSelected(label)}
                              className={`transition transform duration-300 ease-in-out hover:scale-110 ${
                                selected === null
                                  ? "scale-100"
                                  : selected === label
                                  ? "scale-125"
                                  : "scale-90 opacity-60"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      <span
                        className="inline-block mt-8 px-6 py-2 bg-orange-500 text-white rounded-3xl hover:bg-orange-600"
                        onClick={() => {
                          setSecondPage(true);
                          setThirdPage(false);
                          setSelected(null);
                          setThirdPageId(0);
                        }}
                      >← Back to {section.title}</span>
                  </div>
                ))}
                </div>
              )}

              {fourthPage && filteredQuestions.length > 0 && (
                <div className="max-w-4xl mx-auto py-16 px-8">
                  {filteredQuestions.map((result, i) => {
                    const section = helpSections.find(sec => sec.id === result.sectionId);

                    if (!section) return null;

                    return (
                      <div key={i} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-20 -mt-30">
                        <div className="cursor-pointer p-4 rounded hover:bg-orange-100 transition"
                          onClick={() => {
                            setSecondPage(false);
                            setThirdPage(true);
                            setThirdPageId(result.index);
                            setSecondPageId(result.sectionId);
                            setFourthPage(false);
                          }}
                        >
                          <h3 className="text-lg font-semibold text-orange-600">{result.question}</h3>
                        </div>
                      </div>
                    );
                  })}
                  <span
                    className="inline-block mt-8 px-6 py-2 bg-orange-500 text-white rounded-3xl hover:bg-orange-600"
                    onClick={() => {
                      setFirstPage(true);
                      setFourthPage(false);
                    }}
                  >← Back to Help</span>
                </div>
              )}

              {fourthPage && filteredQuestions.length === 0 && (
                <div className="flex flex-col items-center justify-center text-orange-500 font-bold text-4xl mt-28 mb-80 space-y-6">
                  <p>No results found</p>
                  <button
                    className="px-4 py-1 bg-orange-500 text-white rounded-full text-sm hover:bg-orange-600"
                    onClick={() => {
                      setFirstPage(true);
                      setFourthPage(false);
                    }}
                  >
                    ← Back to Help
                  </button>
                </div>
              )}

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