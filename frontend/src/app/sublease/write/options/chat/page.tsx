"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Plus, MapPin, Phone, Mail, MessageCircle, Edit3, Check, X, Camera, Bell, MessagesSquare, User, Menu} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Import the LocationPicker component
import LocationPicker from '../../../../../components/LocationPicker';
import { notification } from "@/data/notificationlistings";

// ========================================================================================
// TYPES AND INTERFACES
// ========================================================================================

type ListingType = "Sublet" | "Lease Takeover" | "Room in Shared Unit" | null;
type LocationOption = "Dinkytown" | "East Bank" | "West Bank" | "Stadium Village" | 
  "Saint Paul Campus" | "Downtown Minneapolis" | "Southeast Como" | "Prospect Park" | "Other" | null;
type DateOption = "Summer (May–Aug)" | "Fall (Sept–Dec)" | "Spring (Jan–Apr)" | "Full Year" | "Custom" | null;
type Gender = "Any" | "Male" | "Female" | "Non-binary" | null;
type Level = "Low" | "Medium" | "High" | null;
type ContactMethod = "phone" | "email" | "instagram" | "snapchat" | "other";

interface ContactInfo {
  methods: {
    id: ContactMethod;
    name: string;
    value: string;
    selected: boolean;
  }[];
  note: string;
}

interface RentNegotiation {
  isNegotiable: boolean | null;
  minPrice: number;
  maxPrice: number;
}

interface ListingData {
  listingType: ListingType;
  startDate: string;
  endDate: string;
  dateOption: DateOption;
  selectedMonths: string[];
  location: LocationOption;
  customLocation: {
    lat: number;
    lng: number;
    address: string;
    placeName?: string;
  } | null;
  showExactAddress: boolean;
  address: string;
  rent: number;
  rentNegotiation: RentNegotiation;
  utilitiesIncluded: boolean | null;
  bedrooms: number;
  bathrooms: number;
  isPrivateRoom: boolean | null;
  amenities: {id: string; name: string; selected: boolean}[];
  hasRoommates: boolean | null;
  roommatePreferences: {
    gender: Gender;
    petsAllowed: boolean | null;
    smokingAllowed: boolean | null;
    noiseLevel: Level;
    cleanlinessLevel: Level;
  };
  currentRoommateInfo: {
    isQuiet: boolean | null;
    smokes: boolean | null;
    hasPets: boolean | null;
  };
  includedItems: {id: string; name: string; selected: boolean}[];
  customIncludedItems: string;
  photos: File[];
  partialDatesOk: boolean | null;
  subleaseReason: string;
  additionalDetails: string;
  contactInfo: ContactInfo;
}

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  step?: string;
  options?: {
    value: string;
    label: string;
    action: () => void;
  }[];
  input?: {
    type: string;
    placeholder?: string;
    action: (value: any) => void;
    options?: {value: string; label: string}[];
  };
}

// ========================================================================================
// MAIN COMPONENT
// ========================================================================================

export default function EnhancedListingFormPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  
  // ========================================================================================
  // STATE MANAGEMENT
  // ========================================================================================
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ListingData>({
    listingType: null,
    startDate: "",
    endDate: "",
    dateOption: null,
    selectedMonths: [],
    location: null,
    customLocation: null,
    showExactAddress: false,
    address: "",
    rent: 0,
    rentNegotiation: {
      isNegotiable: null,
      minPrice: 0,
      maxPrice: 0
    },
    utilitiesIncluded: null,
    bedrooms: 1,
    bathrooms: 1,
    isPrivateRoom: null,
    amenities: [
      { id: "washer-dryer", name: "In-unit washer / dryer", selected: false },
      { id: "parking", name: "Free parking", selected: false },
      { id: "ac-heat", name: "Air conditioning / heating", selected: false },
      { id: "furnished", name: "Furnished", selected: false },
      { id: "gym", name: "Gym access", selected: false },
      { id: "utilities", name: "Utilities included", selected: false },
      { id: "pet-friendly", name: "Pet-friendly", selected: false },
      { id: "wifi", name: "Wi-Fi", selected: false },
      { id: "dishwasher", name: "Dishwasher", selected: false },
      { id: "balcony", name: "Balcony or outdoor space", selected: false },
    ],
    hasRoommates: null,
    roommatePreferences: {
      gender: null,
      petsAllowed: null,
      smokingAllowed: null,
      noiseLevel: null,
      cleanlinessLevel: null,
    },
    currentRoommateInfo: {
      isQuiet: null,
      smokes: null,
      hasPets: null,
    },
    includedItems: [
      { id: "desk", name: "Desk", selected: false },
      { id: "chair", name: "Chair", selected: false },
      { id: "mini-fridge", name: "Mini fridge", selected: false },
      { id: "kitchenware", name: "Kitchenware", selected: false },
      { id: "mattress", name: "Mattress", selected: false },
      { id: "bookshelf", name: "Bookshelf", selected: false },
    ],
    customIncludedItems: "",
    photos: [],
    partialDatesOk: null,
    subleaseReason: "",
    additionalDetails: "",
    contactInfo: {
      methods: [
        { id: "phone", name: "Phone", value: "", selected: false },
        { id: "email", name: "Email", value: "", selected: false },
        { id: "instagram", name: "Instagram", value: "", selected: false },
        { id: "snapchat", name: "Snapchat", value: "", selected: false },
        { id: "other", name: "Other", value: "", selected: false },
      ],
      note: ""
    }
  });

  // ========================================================================================
  // NOTIFICATIONS
  // ========================================================================================

  const NotificationsButton = ({ notifications }: { notifications: Notification[] }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const router = useRouter();

    return (
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowNotifications(!showNotifications)}
          className="p-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors relative"
        >
          <Bell className="w-5 h-5 text-white" />
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
                <h3 className="font-semibold text-orange-600 mb-3">Notifications</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => router.push(`browse/notificationDetail/${notif.id}`)}
                      className="w-full flex items-start space-x-3 p-2 rounded-lg hover:bg-orange-50 text-left"
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
                  className="mt-3 text-sm text-orange-600 hover:underline"
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

  // ========================================================================================
  // PROFILE AND MENU
  // ========================================================================================

  const [showProfile, setShowProfile] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
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

  const handleTabClick = (tab) => {
    router.push(`browse/profile/${userId}?tab=${tab}/`);
    setShowProfile(false); // close dropdown
  };

  // ========================================================================================
  // EFFECTS AND LIFECYCLE
  // ========================================================================================

  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      const timeout = setTimeout(() => {
        setMessages([{
          id: Date.now(),
          text: "Hi! Let's create a listing for your space 🏠\n\nWhat type of listing are you posting?",
          isUser: false,
          timestamp: new Date(),
          step: "listingType",
          options: [
            { value: "Sublet", label: "Sublet", action: () => handleListingTypeSelect("Sublet") },
            { value: "Lease Takeover", label: "Lease Takeover", action: () => handleListingTypeSelect("Lease Takeover") },
            { value: "Room in Shared Unit", label: "Room in Shared Unit", action: () => handleListingTypeSelect("Room in Shared Unit") },
          ]
        }]);
      }, 100);
      timeoutRefs.current.push(timeout);
    }
  }, []);
  
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ========================================================================================
  // UTILITY FUNCTIONS
  // ========================================================================================

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  // ========================================================================================
  // MESSAGE MANAGEMENT
  // ========================================================================================

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>, delay = 0) => {
    const timeout = setTimeout(() => {
      setMessages(prev => [...prev, {
        ...message,
        id: Date.now() + Math.random(),
        timestamp: new Date()
      }]);
      if (delay > 0) {
        setIsTyping(false);
      }
    }, delay);
    timeoutRefs.current.push(timeout);
  };
  
  const addUserMessage = (text: string, step?: string) => {
    addMessage({ text, isUser: true, step });
  };
  
  const addSystemMessage = (text: string, options?: ChatMessage['options'], input?: ChatMessage['input'], step?: string) => {
    setIsTyping(true);
    setShowInput(false);
    addMessage({ text, isUser: false, options, input, step }, 1200);
    
    if (input && (input.type === "text" || input.type === "number" || input.type === "textarea")) {
      setTimeout(() => {
        setShowInput(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 1300);
    }
  };

  // ========================================================================================
  // FORM INPUT HANDLERS
  // ========================================================================================

  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const lastInputMessage = [...messages].reverse().find(m => m.input);
    
    if (lastInputMessage?.input) {
      if (lastInputMessage.input.type === "text" || lastInputMessage.input.type === "textarea") {
        lastInputMessage.input.action(inputValue);
      } else if (lastInputMessage.input.type === "number") {
        lastInputMessage.input.action(Number(inputValue));
      }
    }
    
    setInputValue("");
    setShowInput(false);
  };

  const handleSubmitForm = () => {
    console.log("Form submitted:", formData);
    addSystemMessage("🎉 Your listing has been successfully created!\n\nRedirecting to your dashboard...", undefined, undefined, "submitted");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  // ========================================================================================
  // EDIT FUNCTIONALITY
  // ========================================================================================

  const handleEditStep = (step: string) => {
    setEditingStep(step);
    
    // Remove messages after the step being edited
    setMessages(prev => {
      const stepMessageIndex = prev.findIndex(m => m.step === step && !m.isUser);
      if (stepMessageIndex !== -1) {
        return prev.slice(0, stepMessageIndex);
      }
      return prev;
    });
    
    setTimeout(() => {
      switch (step) {
        case "listingType":
          addSystemMessage("What type of listing are you posting?", [
            { value: "Sublet", label: "Sublet", action: () => handleListingTypeSelect("Sublet") },
            { value: "Lease Takeover", label: "Lease Takeover", action: () => handleListingTypeSelect("Lease Takeover") },
            { value: "Room in Shared Unit", label: "Room in Shared Unit", action: () => handleListingTypeSelect("Room in Shared Unit") },
          ], undefined, "listingType");
          break;
        case "availability":
          addSystemMessage("When is your place available?", [
            { value: "Summer (May–Aug)", label: "Summer (May–Aug)", action: () => handleDateOptionSelect("Summer (May–Aug)") },
            { value: "Fall (Sept–Dec)", label: "Fall (Sept–Dec)", action: () => handleDateOptionSelect("Fall (Sept–Dec)") },
            { value: "Spring (Jan–Apr)", label: "Spring (Jan–Apr)", action: () => handleDateOptionSelect("Spring (Jan–Apr)") },
            { value: "Full Year", label: "Full Year", action: () => handleDateOptionSelect("Full Year") },
            { value: "Custom", label: "Custom dates", action: () => handleDateOptionSelect("Custom") },
          ], undefined, "availability");
          break;
        case "location": askLocation(); break;
        case "rent": askRentPrice(); break;
        case "utilities": askUtilities(); break;
        case "rooms": askRoomsDetails(); break;
        case "amenities": askAmenities(); break;
        case "roommates": askRoommates(); break;
        case "photos": askPhotos(); break;
        case "furnished": askFurnishedStatus(); break;
        case "includedItems": askIncludedItems(); break;
        case "subleaseReason": askSubleaseReason(); break;
        case "additionalDetails": askAdditionalDetails(); break;
        case "partialAvailability": askPartialAvailability(); break;
        case "contactInfo": askContactInfo(); break;
      }
      setEditingStep(null);
    }, 100);
  };

  const showEditOptions = () => {
    addSystemMessage("What would you like to edit? 📝", [
      { value: "edit-type", label: "📝 Listing Type", action: () => handleEditStep("listingType") },
      { value: "edit-dates", label: "📅 Availability", action: () => handleEditStep("availability") },
      { value: "edit-location", label: "📍 Location", action: () => handleEditStep("location") },
      { value: "edit-rent", label: "💰 Rent & Price", action: () => handleEditStep("rent") },
      { value: "edit-utilities", label: "🔌 Utilities", action: () => handleEditStep("utilities") },
      { value: "edit-rooms", label: "🛏️ Room Details", action: () => handleEditStep("rooms") },
      { value: "edit-amenities", label: "🏠 Amenities", action: () => handleEditStep("amenities") },
      { value: "edit-roommates", label: "👥 Roommate Info", action: () => handleEditStep("roommates") },
      { value: "edit-photos", label: "📸 Photos", action: () => handleEditStep("photos") },
      { value: "edit-furnished", label: "🛋️ Furnished Status", action: () => handleEditStep("furnished") },
      { value: "edit-items", label: "📦 Included Items", action: () => handleEditStep("includedItems") },
      { value: "edit-reason", label: "💭 Sublease Reason", action: () => handleEditStep("subleaseReason") },
      { value: "edit-details", label: "✨ Additional Details", action: () => handleEditStep("additionalDetails") },
      { value: "edit-partial", label: "⏰ Partial Availability", action: () => handleEditStep("partialAvailability") },
      { value: "edit-contact", label: "📱 Contact Info", action: () => handleEditStep("contactInfo") },
      { value: "back-summary", label: "⬅️ Back to Summary", action: () => showListingSummaryWithData(formData) },
    ], undefined, "editMenu");
  };

  // ========================================================================================
  // STEP 1: LISTING TYPE
  // ========================================================================================

  const handleListingTypeSelect = (type: ListingType) => {
    setFormData(prev => ({ ...prev, listingType: type }));
    addUserMessage(type as string, "listingType");
    goToNextStep();
    
    setTimeout(() => {
      addSystemMessage("Perfect! 📅\n\nWhen is your place available?", [
        { value: "Summer (May–Aug)", label: "Summer (May–Aug)", action: () => handleDateOptionSelect("Summer (May–Aug)") },
        { value: "Fall (Sept–Dec)", label: "Fall (Sept–Dec)", action: () => handleDateOptionSelect("Fall (Sept–Dec)") },
        { value: "Spring (Jan–Apr)", label: "Spring (Jan–Apr)", action: () => handleDateOptionSelect("Spring (Jan–Apr)") },
        { value: "Full Year", label: "Full Year", action: () => handleDateOptionSelect("Full Year") },
        { value: "Custom", label: "Custom dates", action: () => handleDateOptionSelect("Custom") },
      ], undefined, "availability");
    }, 500);
  };

  // ========================================================================================
  // STEP 2: AVAILABILITY
  // ========================================================================================

  const handleDateOptionSelect = (option: DateOption) => {
    setFormData(prev => ({ ...prev, dateOption: option }));
    addUserMessage(option as string, "availability");
    
    if (option === "Custom") {
      addSystemMessage("Please select your start and end dates:", undefined, {
        type: "date-range",
        action: (dates: {start: string, end: string}) => {
          setFormData(prev => ({ 
            ...prev, 
            startDate: dates.start, 
            endDate: dates.end 
          }));
          addUserMessage(`From ${dates.start} to ${dates.end}`, "availability");
          goToNextStep();
          setTimeout(() => askLocation(), 500);
        }
      }, "availability");
    } else {
      const currentYear = new Date().getFullYear();
      let startDate = "";
      let endDate = "";
      
      switch(option) {
        case "Summer (May–Aug)": startDate = `${currentYear}-05-01`; endDate = `${currentYear}-08-31`; break;
        case "Fall (Sept–Dec)": startDate = `${currentYear}-09-01`; endDate = `${currentYear}-12-31`; break;
        case "Spring (Jan–Apr)": startDate = `${currentYear}-01-01`; endDate = `${currentYear}-04-30`; break;
        case "Full Year": startDate = `${currentYear}-01-01`; endDate = `${currentYear}-12-31`; break;
      }
      
      setFormData(prev => ({ ...prev, startDate, endDate }));
      goToNextStep();
      setTimeout(() => askLocation(), 500);
    }
  };

  // ========================================================================================
  // STEP 3: LOCATION
  // ========================================================================================

  const askLocation = () => {
    addSystemMessage("Great! 📍\n\nWhere is your place located?", [
      { value: "Dinkytown", label: "Dinkytown", action: () => handleLocationSelect("Dinkytown") },
      { value: "East Bank", label: "East Bank", action: () => handleLocationSelect("East Bank") },
      { value: "West Bank", label: "West Bank", action: () => handleLocationSelect("West Bank") },
      { value: "Stadium Village", label: "Stadium Village", action: () => handleLocationSelect("Stadium Village") },
      { value: "Saint Paul Campus", label: "Saint Paul Campus", action: () => handleLocationSelect("Saint Paul Campus") },
      { value: "Downtown Minneapolis", label: "Downtown Minneapolis", action: () => handleLocationSelect("Downtown Minneapolis") },
      { value: "Southeast Como", label: "Southeast Como", action: () => handleLocationSelect("Southeast Como") },
      { value: "Prospect Park", label: "Prospect Park", action: () => handleLocationSelect("Prospect Park") },
      { value: "Other", label: "Other location", action: () => handleLocationSelect("Other") },
    ], undefined, "location");
  };

  const handleLocationSelect = (location: LocationOption) => {
    setFormData(prev => ({ ...prev, location }));
    addUserMessage(location as string, "location");
    
    if (location === "Other") {
      setTimeout(() => {
        addSystemMessage("Please search for and select your specific location:", undefined, {
          type: "location-picker",
          action: (locationData: any) => {
            setFormData(prev => ({ 
              ...prev, 
              customLocation: locationData,
              address: locationData.address
            }));
            addUserMessage(`Selected: ${locationData.address}`, "location");
            goToNextStep();
            setTimeout(() => askRentPrice(), 500);
          }
        }, "location");
      }, 500);
    } else {
      setTimeout(() => {
        addSystemMessage("Do you want to display the exact address or just the neighborhood?", [
          { value: "show-address", label: "Show exact address", action: () => handleAddressVisibilitySelect(true) },
          { value: "hide-address", label: "Only show neighborhood", action: () => handleAddressVisibilitySelect(false) },
        ], undefined, "location");
      }, 500);
    }
  };

  const handleAddressVisibilitySelect = (showExact: boolean) => {
    setFormData(prev => ({ ...prev, showExactAddress: showExact }));
    addUserMessage(showExact ? "Show exact address" : "Only show neighborhood", "location");
    
    if (showExact) {
      setTimeout(() => {
        addSystemMessage("Please search for and select your exact address:", undefined, {
          type: "location-picker",
          action: (locationData: any) => {
            setFormData(prev => ({ 
              ...prev, 
              address: locationData.address,
              customLocation: locationData
            }));
            addUserMessage(`Address: ${locationData.address}`, "location");
            goToNextStep();
            setTimeout(() => askRentPrice(), 500);
          }
        }, "location");
      }, 500);
    } else {
      goToNextStep();
      setTimeout(() => askRentPrice(), 500);
    }
  };

  // ========================================================================================
  // STEP 4: RENT PRICE
  // ========================================================================================

  const askRentPrice = () => {
    addSystemMessage("How much is the monthly rent? 💰", undefined, {
      type: "number",
      placeholder: "Enter monthly rent",
      action: (rent: number) => {
        setFormData(prev => ({ ...prev, rent }));
        addUserMessage(`$${rent} per month`, "rent");
        
        setTimeout(() => {
          addSystemMessage("Is the rent negotiable?", [
            { value: "rent-negotiable", label: "Yes, it's negotiable", action: () => handleRentNegotiable(true) },
            { value: "rent-fixed", label: "No, price is fixed", action: () => handleRentNegotiable(false) },
          ], undefined, "rent");
        }, 500);
      }
    }, "rent");
  };

  const handleRentNegotiable = (isNegotiable: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      rentNegotiation: { ...prev.rentNegotiation, isNegotiable } 
    }));
    addUserMessage(isNegotiable ? "Yes, rent is negotiable" : "No, price is fixed", "rent");
    
    if (isNegotiable) {
      setTimeout(() => {
        addSystemMessage("What's your acceptable price range?", undefined, {
          type: "price-range",
          action: (range: {min: number, max: number}) => {
            setFormData(prev => ({ 
              ...prev, 
              rentNegotiation: { 
                ...prev.rentNegotiation, 
                minPrice: range.min, 
                maxPrice: range.max 
              } 
            }));
            addUserMessage(`Price range: $${range.min} - $${range.max}`, "rent");
            setTimeout(() => askUtilities(), 500);
          }
        }, "rent");
      }, 500);
    } else {
      setTimeout(() => askUtilities(), 500);
    }
  };

  // ========================================================================================
  // STEP 5: UTILITIES
  // ========================================================================================

  const askUtilities = () => {
    addSystemMessage("Are utilities included in the rent?", [
      { value: "utilities-yes", label: "Yes, utilities included", action: () => handleUtilitiesIncluded(true) },
      { value: "utilities-no", label: "No, utilities not included", action: () => handleUtilitiesIncluded(false) },
    ], undefined, "utilities");
  };

  const handleUtilitiesIncluded = (included: boolean) => {
    setFormData(prev => ({ ...prev, utilitiesIncluded: included }));
    addUserMessage(included ? "Yes, utilities are included" : "No, utilities are not included", "utilities");
    goToNextStep();
    setTimeout(() => askRoomsDetails(), 500);
  };

  // ========================================================================================
  // STEP 6: ROOM DETAILS
  // ========================================================================================

  const askRoomsDetails = () => {
    addSystemMessage("Tell me about the space 🛏️", undefined, {
      type: "rooms",
      action: (details: {bedrooms: number, bathrooms: number, isPrivate: boolean}) => {
        setFormData(prev => ({ 
          ...prev, 
          bedrooms: details.bedrooms,
          bathrooms: details.bathrooms,
          isPrivateRoom: details.isPrivate
        }));
        addUserMessage(`${details.bedrooms} bedroom(s), ${details.bathrooms} bathroom(s), ${details.isPrivate ? 'Private' : 'Shared'} room`, "rooms");
        goToNextStep();
        setTimeout(() => askAmenities(), 500);
      }
    }, "rooms");
  };

  // ========================================================================================
  // STEP 7: AMENITIES
  // ========================================================================================

  const askAmenities = () => {
    addSystemMessage("Which amenities does your place include? 🏠\n\n(Select all that apply)", undefined, {
      type: "multiselect",
      options: formData.amenities.map(amenity => ({ value: amenity.id, label: amenity.name })),
      action: (selectedIds: string[]) => {
        const updatedAmenities = formData.amenities.map(amenity => ({
          ...amenity,
          selected: selectedIds.includes(amenity.id)
        }));
        
        setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
        
        const selectedAmenities = updatedAmenities
          .filter(a => a.selected)
          .map(a => a.name)
          .join(", ");
          
        addUserMessage(`Selected amenities: ${selectedAmenities || "None"}`, "amenities");
        goToNextStep();
        setTimeout(() => askRoommates(), 500);
      }
    }, "amenities");
  };

  // ========================================================================================
  // STEP 8: ROOMMATES
  // ========================================================================================

  const askRoommates = () => {
    addSystemMessage("Will you have roommates? 👥", [
      { value: "roommates-yes", label: "Yes", action: () => handleRoommatesAnswer(true) },
      { value: "roommates-no", label: "No", action: () => handleRoommatesAnswer(false) },
    ], undefined, "roommates");
  };

  const handleRoommatesAnswer = (hasRoommates: boolean) => {
    setFormData(prev => ({ ...prev, hasRoommates }));
    addUserMessage(hasRoommates ? "Yes, I will have roommates" : "No roommates", "roommates");
    
    if (hasRoommates) {
      setTimeout(() => askCurrentRoommateInfo(), 500);
    } else {
      goToNextStep();
      setTimeout(() => askPhotos(), 500);
    }
  };

  const askCurrentRoommateInfo = () => {
    addSystemMessage("Tell me about yourself as a roommate 🤔\n\nAre you generally quiet?", [
      { value: "quiet-yes", label: "Yes, I'm quiet", action: () => handleQuietAnswer(true) },
      { value: "quiet-no", label: "No, I can be loud", action: () => handleQuietAnswer(false) },
    ], undefined, "roommates");
  };

  const handleQuietAnswer = (isQuiet: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      currentRoommateInfo: { ...prev.currentRoommateInfo, isQuiet } 
    }));
    addUserMessage(isQuiet ? "Yes, I'm quiet" : "No, I can be loud", "roommates");
    
    setTimeout(() => {
      addSystemMessage("Do you smoke?", [
        { value: "smoke-yes", label: "Yes", action: () => handleSmokeAnswer(true) },
        { value: "smoke-no", label: "No", action: () => handleSmokeAnswer(false) },
      ], undefined, "roommates");
    }, 500);
  };

  const handleSmokeAnswer = (smokes: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      currentRoommateInfo: { ...prev.currentRoommateInfo, smokes } 
    }));
    addUserMessage(smokes ? "Yes, I smoke" : "No, I don't smoke", "roommates");
    
    setTimeout(() => {
      addSystemMessage("Do you have pets?", [
        { value: "pets-yes", label: "Yes", action: () => handleCurrentPetsAnswer(true) },
        { value: "pets-no", label: "No", action: () => handleCurrentPetsAnswer(false) },
      ], undefined, "roommates");
    }, 500);
  };

  const handleCurrentPetsAnswer = (hasPets: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      currentRoommateInfo: { ...prev.currentRoommateInfo, hasPets } 
    }));
    addUserMessage(hasPets ? "Yes, I have pets" : "No, I don't have pets", "roommates");
    setTimeout(() => askRoommatePreferences(), 500);
  };

  const askRoommatePreferences = () => {
    addSystemMessage("What gender preference do you have for roommates?", [
      { value: "gender-any", label: "Open to any gender", action: () => handleGenderPreference("Any") },
      { value: "gender-male", label: "Male only", action: () => handleGenderPreference("Male") },
      { value: "gender-female", label: "Female only", action: () => handleGenderPreference("Female") },
      { value: "gender-nonbinary", label: "Non-binary", action: () => handleGenderPreference("Non-binary") },
    ], undefined, "roommates");
  };

  const handleGenderPreference = (gender: Gender) => {
    setFormData(prev => ({ 
      ...prev, 
      roommatePreferences: {
        ...prev.roommatePreferences,
        gender
      }
    }));
    addUserMessage(`Gender preference: ${gender}`, "roommates");
    
    setTimeout(() => {
      addSystemMessage("Are pets allowed for roommates? 🐕", [
        { value: "pets-yes", label: "Yes", action: () => handlePetsPreference(true) },
        { value: "pets-no", label: "No", action: () => handlePetsPreference(false) },
      ], undefined, "roommates");
    }, 500);
  };

  const handlePetsPreference = (petsAllowed: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      roommatePreferences: {
        ...prev.roommatePreferences,
        petsAllowed
      }
    }));
    addUserMessage(`Pets allowed: ${petsAllowed ? "Yes" : "No"}`, "roommates");
    
    setTimeout(() => {
      addSystemMessage("Is smoking allowed? 🚭", [
        { value: "smoking-yes", label: "Yes", action: () => handleSmokingPreference(true) },
        { value: "smoking-no", label: "No", action: () => handleSmokingPreference(false) },
      ], undefined, "roommates");
    }, 500);
  };

  const handleSmokingPreference = (smokingAllowed: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      roommatePreferences: {
        ...prev.roommatePreferences,
        smokingAllowed
      }
    }));
    addUserMessage(`Smoking allowed: ${smokingAllowed ? "Yes" : "No"}`, "roommates");
    
    setTimeout(() => {
      addSystemMessage("Preferred noise level? 🔊", [
        { value: "noise-low", label: "Low", action: () => handleNoisePreference("Low") },
        { value: "noise-medium", label: "Medium", action: () => handleNoisePreference("Medium") },
        { value: "noise-high", label: "High", action: () => handleNoisePreference("High") },
      ], undefined, "roommates");
    }, 500);
  };

  const handleNoisePreference = (noiseLevel: Level) => {
    setFormData(prev => ({ 
      ...prev, 
      roommatePreferences: {
        ...prev.roommatePreferences,
        noiseLevel
      }
    }));
    addUserMessage(`Noise level: ${noiseLevel}`, "roommates");
    
    setTimeout(() => {
      addSystemMessage("Preferred cleanliness level? ✨", [
        { value: "clean-low", label: "Low", action: () => handleCleanlinessPreference("Low") },
        { value: "clean-medium", label: "Medium", action: () => handleCleanlinessPreference("Medium") },
        { value: "clean-high", label: "High", action: () => handleCleanlinessPreference("High") },
      ], undefined, "roommates");
    }, 500);
  };

  const handleCleanlinessPreference = (cleanlinessLevel: Level) => {
    setFormData(prev => ({ 
      ...prev, 
      roommatePreferences: {
        ...prev.roommatePreferences,
        cleanlinessLevel
      }
    }));
    addUserMessage(`Cleanliness level: ${cleanlinessLevel}`, "roommates");
    
    goToNextStep();
    setTimeout(() => askPhotos(), 500);
  };

  // ========================================================================================
  // STEP 9: PHOTOS
  // ========================================================================================

  const askPhotos = () => {
    addSystemMessage("Please upload at least 3 photos of your space 📸\n\n(The more photos you include, the more likely your listing will get a takeover!)\n\nInclude: bedroom, bathroom, living space, kitchen, etc.", undefined, {
      type: "file",
      action: (files: File[]) => {
        setFormData(prev => ({ ...prev, photos: files }));
        addUserMessage(`Uploaded ${files.length} photos`, "photos");
        goToNextStep();
        setTimeout(() => askFurnishedStatus(), 500);
      }
    }, "photos");
  };

  // ========================================================================================
  // STEP 10: FURNISHED STATUS
  // ========================================================================================

  const askFurnishedStatus = () => {
    addSystemMessage("Is your place furnished? 🛋️", [
      { value: "furnished-yes", label: "Yes, it's furnished", action: () => handleFurnishedStatus(true) },
      { value: "furnished-no", label: "No, it's not furnished", action: () => handleFurnishedStatus(false) },
    ], undefined, "furnished");
  };

  const handleFurnishedStatus = (isFurnished: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      amenities: prev.amenities.map(amenity => 
        amenity.id === 'furnished' 
          ? { ...amenity, selected: isFurnished }
          : amenity
      )
    }));
    addUserMessage(isFurnished ? "Yes, it's furnished" : "No, it's not furnished", "furnished");
    
    if (!isFurnished) {
      setTimeout(() => askIncludedItems(), 500);
    } else {
      goToNextStep();
      setTimeout(() => askSubleaseReason(), 500);
    }
  };

  // ========================================================================================
  // STEP 11: INCLUDED ITEMS (only for non-furnished places)
  // ========================================================================================

  const askIncludedItems = () => {
    addSystemMessage("Since your place isn't furnished, are you including any furniture or items for the next tenant? 📦\n\n(Select all that apply, or skip if none)", undefined, {
      type: "included-items",
      action: (data: { selectedIds: string[], customItems: string }) => {
        const updatedItems = formData.includedItems.map(item => ({
          ...item,
          selected: data.selectedIds.includes(item.id)
        }));
        
        setFormData(prev => ({ 
          ...prev, 
          includedItems: updatedItems,
          customIncludedItems: data.customItems
        }));
        
        const selectedItems = updatedItems
          .filter(i => i.selected)
          .map(i => i.name)
          .join(", ");
        
        const itemsText = selectedItems ? 
          (data.customItems ? `${selectedItems}, ${data.customItems}` : selectedItems) :
          (data.customItems || "None");
        
        addUserMessage(`Included items: ${itemsText}`, "includedItems");
        goToNextStep();
        setTimeout(() => askSubleaseReason(), 500);
      }
    }, "includedItems");
  };

  // ========================================================================================
  // STEP 12: SUBLEASE REASON (Optional)
  // ========================================================================================

  const askSubleaseReason = () => {
    addSystemMessage("Would you like to share why you're subletting? (Optional) 💭\n\nThis can help potential renters understand your situation better.", [
      { 
        value: "reason-yes", 
        label: "Yes, I'll share the reason", 
        action: () => {
          addSystemMessage("What's the reason for your sublease?", undefined, {
            type: "textarea",
            placeholder: "e.g., Studying abroad, internship, graduating early...",
            action: (reason: string) => {
              setFormData(prev => ({ ...prev, subleaseReason: reason }));
              addUserMessage(`Reason: ${reason}`, "subleaseReason");
              goToNextStep();
              setTimeout(() => askRoomTour(), 500);
            }
          }, "subleaseReason");
        }
      },
      { 
        value: "reason-no", 
        label: "Skip this question", 
        action: () => {
          addUserMessage("Skipping reason", "subleaseReason");
          goToNextStep();
          setTimeout(() => askRoomTour(), 500);
        }
      },
    ], undefined, "subleaseReason");
  };

  // ========================================================================================
  // STEP 13: ROOM TOUR
  // ========================================================================================

  const askRoomTour = () => {
    addSystemMessage("Are you open to giving room tours to potential renters? 🏠👀", [
      { value: "tour-yes", label: "Yes, I'm open to tours", action: () => handleRoomTour(true) },
      { value: "tour-no", label: "No tours, photos only", action: () => handleRoomTour(false) },
    ], undefined, "roomTour");
  };

  const handleRoomTour = (tourAvailable: boolean) => {
    const tourInfo = tourAvailable ? "Open to room tours" : "No tours, photos only";
    addUserMessage(tourInfo, "roomTour");
    
    setFormData(prev => ({ 
      ...prev, 
      additionalDetails: prev.additionalDetails 
        ? `${prev.additionalDetails}\n\nRoom tours: ${tourInfo}`
        : `Room tours: ${tourInfo}`
    }));
    
    goToNextStep();
    setTimeout(() => askAdditionalDetails(), 500);
  };

  // ========================================================================================
  // STEP 14: ADDITIONAL DETAILS
  // ========================================================================================

  const askAdditionalDetails = () => {
    addSystemMessage("Any additional details to make your listing stand out? ✨\n\n(Optional - apartment features, neighborhood highlights, etc.)", [
      { 
        value: "details-yes", 
        label: "Yes, I have more details", 
        action: () => {
          addSystemMessage("What additional details would you like to include?", undefined, {
            type: "textarea",
            placeholder: "e.g., Recently renovated, close to campus, great natural light, rooftop access...",
            action: (details: string) => {
              setFormData(prev => ({ 
                ...prev, 
                additionalDetails: prev.additionalDetails 
                  ? `${prev.additionalDetails}\n\nAdditional details: ${details}`
                  : details
              }));
              addUserMessage(`Additional details: ${details}`, "additionalDetails");
              goToNextStep();
              setTimeout(() => askPartialAvailability(), 500);
            }
          }, "additionalDetails");
        }
      },
      { 
        value: "details-no", 
        label: "No additional details", 
        action: () => {
          addUserMessage("No additional details", "additionalDetails");
          goToNextStep();
          setTimeout(() => askPartialAvailability(), 500);
        }
      },
    ], undefined, "additionalDetails");
  };

  // ========================================================================================
  // STEP 15: PARTIAL AVAILABILITY
  // ========================================================================================

  const askPartialAvailability = () => {
    addSystemMessage("Are you open to renting for just part of the dates? 📅\n\n(e.g., if your lease is June to August, would you consider renting just for June?)", [
      { value: "partial-yes", label: "Yes, I'm flexible with dates", action: () => handlePartialAvailability(true) },
      { value: "partial-no", label: "No, I need the entire period covered", action: () => handlePartialAvailability(false) },
    ], undefined, "partialAvailability");
  };

  const handlePartialAvailability = (partialOk: boolean) => {
    setFormData(prev => ({ ...prev, partialDatesOk: partialOk }));
    addUserMessage(partialOk ? "Yes, I'm flexible with dates" : "No, I need the entire period covered", "partialAvailability");
    setTimeout(() => askContactInfo(), 500);
  };

  // ========================================================================================
  // STEP 16: CONTACT INFORMATION
  // ========================================================================================

  const askContactInfo = () => {
    addSystemMessage("How would you like potential renters to contact you? 📱\n\nWe have our built-in chat system, but you can also provide additional contact methods if you prefer.", undefined, {
      type: "contact-info",
      action: (contactData: any) => {
        setFormData(prev => {
          const updatedData = { ...prev, contactInfo: contactData };
          setTimeout(() => {
            console.log("About to show summary with data:", updatedData);
            showListingSummaryWithData(updatedData);
          }, 100);
          return updatedData;
        });
        
        const selectedMethods = contactData.methods
          .filter((m: any) => m.selected && m.value.trim())
          .map((m: any) => `${m.name}: ${m.value}`)
          .join(", ");
        
        addUserMessage(`Contact methods: ${selectedMethods || "Built-in chat only"}${contactData.note ? `\nNote: ${contactData.note}` : ""}`, "contactInfo");
      }
    }, "contactInfo");
  };

  // ========================================================================================
  // SUMMARY AND FINAL STEPS
  // ========================================================================================

  const showListingSummaryWithData = (currentFormData: ListingData) => {
    console.log("Summary called with data:", currentFormData);
    
    const selectedAmenities = currentFormData.amenities
      .filter(a => a.selected)
      .map(a => a.name)
      .join(", ");
      
    const selectedItems = currentFormData.includedItems
      .filter(i => i.selected)
      .map(i => i.name)
      .join(", ");

    const contactMethods = currentFormData.contactInfo.methods
      .filter(m => m.selected && m.value.trim())
      .map(m => `${m.name}: ${m.value}`)
      .join(", ");
    
    const formatDate = (dateStr: string) => {
      if (!dateStr) return "Not set";
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    };
    
    const getLocationDisplay = () => {
      if (currentFormData.customLocation && currentFormData.customLocation.address) {
        return currentFormData.customLocation.address;
      } else if (currentFormData.location) {
        return currentFormData.location;
      } else {
        return "Not set";
      }
    };
    
    const getRentDisplay = () => {
      if (currentFormData.rent > 0) {
        return `${currentFormData.rent}/month`;
      } else {
        return "$0/month";
      }
    };
    
    const getNegotiationDisplay = () => {
      if (currentFormData.rentNegotiation.isNegotiable === true) {
        if (currentFormData.rentNegotiation.minPrice > 0 && currentFormData.rentNegotiation.maxPrice > 0) {
          return ` (Negotiable: ${currentFormData.rentNegotiation.minPrice}-${currentFormData.rentNegotiation.maxPrice})`;
        } else {
          return " (Negotiable)";
        }
      } else if (currentFormData.rentNegotiation.isNegotiable === false) {
        return " (Fixed price)";
      } else {
        return "";
      }
    };
    
    const getUtilitiesDisplay = () => {
      if (currentFormData.utilitiesIncluded === true) return "Included";
      if (currentFormData.utilitiesIncluded === false) return "Not included";
      return "Not specified";
    };
    
    const getRoomTypeDisplay = () => {
      if (currentFormData.isPrivateRoom === true) return "Private room";
      if (currentFormData.isPrivateRoom === false) return "Shared room";
      return "Not specified";
    };
    
    let summary = `Here's your listing summary! ✨

📝 Type: ${currentFormData.listingType || "Not set"}
📅 Available: ${formatDate(currentFormData.startDate)} to ${formatDate(currentFormData.endDate)}
📍 Location: ${getLocationDisplay()}
💵 Rent: ${getRentDisplay()}${getNegotiationDisplay()}
🏠 Utilities: ${getUtilitiesDisplay()}
🛏️ Space: ${currentFormData.bedrooms} bedroom(s), ${currentFormData.bathrooms} bathroom(s), ${getRoomTypeDisplay()}
🏠 Amenities: ${selectedAmenities || "None"}`;

    if (currentFormData.hasRoommates === true) {
      summary += `\n👤 About you: ${currentFormData.currentRoommateInfo.isQuiet ? 'Quiet' : 'Can be loud'}, ${currentFormData.currentRoommateInfo.smokes ? 'Smokes' : "Doesn't smoke"}, ${currentFormData.currentRoommateInfo.hasPets ? 'Has pets' : 'No pets'}`;
      summary += `\n👥 Roommate Preferences: Gender (${currentFormData.roommatePreferences.gender || 'Not specified'}), Pets (${currentFormData.roommatePreferences.petsAllowed ? 'Yes' : 'No'}), Smoking (${currentFormData.roommatePreferences.smokingAllowed ? 'Yes' : 'No'}), Noise (${currentFormData.roommatePreferences.noiseLevel || 'Not specified'}), Cleanliness (${currentFormData.roommatePreferences.cleanlinessLevel || 'Not specified'})`;
    }

    const isFurnished = currentFormData.amenities.find(a => a.id === 'furnished')?.selected;
    if (!isFurnished && (selectedItems || currentFormData.customIncludedItems)) {
      let itemsDisplay = selectedItems;
      if (currentFormData.customIncludedItems) {
        itemsDisplay = itemsDisplay ? `${itemsDisplay}, ${currentFormData.customIncludedItems}` : currentFormData.customIncludedItems;
      }
      summary += `\n📦 Included Items: ${itemsDisplay || "None"}`;
    }

    summary += `\n📸 Photos: ${currentFormData.photos.length} uploaded
⏰ Partial availability: ${currentFormData.partialDatesOk === true ? 'Yes' : currentFormData.partialDatesOk === false ? 'No' : 'Not specified'}`;

    if (currentFormData.subleaseReason) {
      summary += `\n💭 Reason for sublease: ${currentFormData.subleaseReason}`;
    }

    if (currentFormData.additionalDetails) {
      summary += `\n✨ Additional details: ${currentFormData.additionalDetails}`;
    }

    summary += `\n📱 Contact: ${contactMethods || "Built-in chat system"}`;
    
    if (currentFormData.contactInfo.note) {
      summary += `\n📝 Contact note: ${currentFormData.contactInfo.note}`;
    }
    
    addSystemMessage(summary, [
      { 
        value: "confirm", 
        label: "✅ Confirm and publish listing", 
        action: handleSubmitForm 
      },
      { 
        value: "edit", 
        label: "✏️ Edit listing", 
        action: () => showEditOptions() 
      },
    ], undefined, "summary");
  };


  // ========================================================================================
  // CUSTOM INPUT COMPONENTS
  // ========================================================================================

  const renderCustomInput = (input: ChatMessage['input']) => {
    if (!input) return null;
    
    switch (input.type) {
      case 'date-range':
        return (
          <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, startDate: e.target.value }));
                }}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, endDate: e.target.value }));
                }}
              />
            </div>
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                if (formData.startDate && formData.endDate) {
                  input.action({ start: formData.startDate, end: formData.endDate });
                }
              }}
            >
              Confirm Dates
            </button>
          </div>
        );
        
      case 'location-picker':
        return (
          <div className="mt-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <LocationPicker
              onLocationSelect={(location) => {
                input.action(location);
              }}
              showDeliveryOptions={false}
            />
          </div>
        );
        
      case 'price-range':
        return (
          <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Minimum Price</label>
                <input
                  type="number"
                  placeholder="Min $"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      rentNegotiation: { 
                        ...prev.rentNegotiation, 
                        minPrice: Number(e.target.value) 
                      } 
                    }));
                  }}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Maximum Price</label>
                <input
                  type="number"
                  placeholder="Max $"
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      rentNegotiation: { 
                        ...prev.rentNegotiation, 
                        maxPrice: Number(e.target.value) 
                      } 
                    }));
                  }}
                />
              </div>
            </div>
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                if (formData.rentNegotiation.minPrice > 0 && formData.rentNegotiation.maxPrice > 0) {
                  input.action({ 
                    min: formData.rentNegotiation.minPrice, 
                    max: formData.rentNegotiation.maxPrice 
                  });
                }
              }}
            >
              Confirm Price Range
            </button>
          </div>
        );
        
      case 'contact-info':
        return (
          <div className="mt-3 space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="text-sm text-gray-600 mb-3">
              <p className="font-medium text-gray-800 mb-2">📱 Contact Methods</p>
              <p>Select and fill in the contact methods you'd like to use:</p>
            </div>
            
            {formData.contactInfo.methods.map((method) => (
              <div key={method.id} className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={method.selected}
                    onChange={(e) => {
                      const updatedMethods = formData.contactInfo.methods.map(m =>
                        m.id === method.id ? { ...m, selected: e.target.checked } : m
                      );
                      setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, methods: updatedMethods }
                      }));
                    }}
                    className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <label className="font-medium text-gray-700 flex items-center gap-2">
                    {method.id === 'phone' && <Phone size={16} />}
                    {method.id === 'email' && <Mail size={16} />}
                    {method.id === 'instagram' && <MessageCircle size={16} />}
                    {method.id === 'snapchat' && <MessageCircle size={16} />}
                    {method.id === 'other' && <MessageCircle size={16} />}
                    {method.name}
                  </label>
                </div>
                {method.selected && (
                  <input
                    type={method.id === 'email' ? 'email' : method.id === 'phone' ? 'tel' : 'text'}
                    placeholder={
                      method.id === 'phone' ? '(123) 456-7890' :
                      method.id === 'email' ? 'your@email.com' :
                      method.id === 'instagram' ? '@username' :
                      method.id === 'snapchat' ? 'username' :
                      'Contact details'
                    }
                    value={method.value}
                    onChange={(e) => {
                      const updatedMethods = formData.contactInfo.methods.map(m =>
                        m.id === method.id ? { ...m, value: e.target.value } : m
                      );
                      setFormData(prev => ({
                        ...prev,
                        contactInfo: { ...prev.contactInfo, methods: updatedMethods }
                      }));
                    }}
                    className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ml-7 transition-all"
                  />
                )}
              </div>
            ))}
            
            <div className="mt-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Additional contact note (optional)
              </label>
              <textarea
                placeholder="e.g., 'Prefer texts over calls', 'Available weekdays 9-5', etc."
                value={formData.contactInfo.note}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, note: e.target.value }
                  }));
                }}
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows={2}
              />
            </div>
            
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                input.action(formData.contactInfo);
              }}
            >
              Confirm Contact Information
            </button>
          </div>
        );
        
      case 'rooms':
        return (
          <div className="mt-3 space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Bedrooms</label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                >
                  {[0, 1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Bathrooms</label>
                <select 
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                >
                  {[0, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Room Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`p-3 rounded-xl border text-center font-medium transition-all ${
                    formData.isPrivateRoom === true
                      ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: true }))}
                >
                  Private Room
                </button>
                <button
                  type="button"
                  className={`p-3 rounded-xl border text-center font-medium transition-all ${
                    formData.isPrivateRoom === false
                      ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: false }))}
                >
                  Shared Room
                </button>
              </div>
            </div>
           
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                if (formData.isPrivateRoom !== null) {
                  input.action({ 
                    bedrooms: formData.bedrooms, 
                    bathrooms: formData.bathrooms, 
                    isPrivate: formData.isPrivateRoom 
                  });
                }
              }}
            >
              Confirm Room Details
            </button>
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-1 gap-2">
              {input.options?.map((option) => {
                const isAmenitySelected = formData.amenities.some(
                  a => a.id === option.value && a.selected
                );
                
                const isItemSelected = formData.includedItems.some(
                  i => i.id === option.value && i.selected
                );
                
                const isSelected = isAmenitySelected || isItemSelected;
                
                return (
                  <button
                    key={option.value}
                    className={`p-3 rounded-xl border text-left font-medium transition-all ${
                      isSelected
                        ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                    }`}
                    onClick={() => {
                      if (formData.amenities.some(a => a.id === option.value)) {
                        const updatedAmenities = formData.amenities.map(amenity => 
                          amenity.id === option.value 
                            ? { ...amenity, selected: !amenity.selected }
                            : amenity
                        );
                        setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
                      } 
                      else if (formData.includedItems.some(i => i.id === option.value)) {
                        const updatedItems = formData.includedItems.map(item => 
                          item.id === option.value 
                            ? { ...item, selected: !item.selected }
                            : item
                        );
                        setFormData(prev => ({ ...prev, includedItems: updatedItems }));
                      }
                    }}
                  >
                    {isSelected ? '✓ ' : ''}{option.label}
                  </button>
                );
              })}
            </div>
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                if (input.options?.[0]?.value === formData.amenities[0].id) {
                  const selectedIds = formData.amenities
                    .filter(a => a.selected)
                    .map(a => a.id);
                  input.action(selectedIds);
                } else {
                  const selectedIds = formData.includedItems
                    .filter(i => i.selected)
                    .map(i => i.id);
                  input.action(selectedIds);
                }
              }}
            >
              Confirm Selection
            </button>
          </div>
        );

      case 'included-items':
        return (
          <div className="mt-3 space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-3">Select items you're including:</p>
              {formData.includedItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full p-3 rounded-xl border text-left font-medium transition-all ${
                    item.selected
                      ? "bg-blue-500 border-blue-500 text-white shadow-md" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  onClick={() => {
                    const updatedItems = formData.includedItems.map(i => 
                      i.id === item.id ? { ...i, selected: !i.selected } : i
                    );
                    setFormData(prev => ({ ...prev, includedItems: updatedItems }));
                  }}
                >
                  {item.selected ? '✓ ' : ''}{item.name}
                </button>
              ))}
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Other items you're including (optional)
              </label>
              <textarea
                placeholder="e.g., bed frame, kitchen utensils, cleaning supplies, extra blankets..."
                value={formData.customIncludedItems}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, customIncludedItems: e.target.value }));
                }}
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                rows={3}
              />
            </div>
            
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-all shadow-sm hover:shadow-md"
              onClick={() => {
                const selectedIds = formData.includedItems
                  .filter(i => i.selected)
                  .map(i => i.id);
                input.action({ 
                  selectedIds, 
                  customItems: formData.customIncludedItems 
                });
              }}
            >
              Confirm Included Items
            </button>
          </div>
        );
        
      case 'file':
        return (
          <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="text-sm text-gray-600 mb-3">
              <p className="font-medium text-gray-800 mb-1">📸 Photo Requirements</p>
              <p>• At least 3 photos required</p>
              <p>• Supported formats: JPG, PNG, WebP</p>
              <p className="text-red-600">• HEIC files not supported (iPhone users: change to JPG in camera settings)</p>
            </div>
            
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const validFiles = files.filter(file => {
                  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                  return validTypes.includes(file.type);
                });
                
                if (validFiles.length !== files.length) {
                  addSystemMessage("⚠️ Some files were rejected. Please use JPG, PNG, or WebP format only. HEIC files are not supported.");
                }
                
                setFormData(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
              }}
            />
            
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                const validFiles = files.filter(file => {
                  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                  return validTypes.includes(file.type);
                });
                
                if (validFiles.length !== files.length) {
                  addSystemMessage("⚠️ Some files were rejected. Please use JPG, PNG, or WebP format only.");
                }
                
                setFormData(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
              }}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                className="w-full p-4 bg-white border-2 border-dashed border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} className="mr-2" />
                Choose Photos
              </button>
              
              <button 
                className="w-full p-4 bg-white border-2 border-dashed border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center transition-all"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={20} className="mr-2" />
                Take Photo
              </button>
            </div>
            
            {formData.photos.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-gray-600 font-medium">
                    {formData.photos.length} photo{formData.photos.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, photos: [] }))}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {formData.photos.slice(0, 9).map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-xl bg-gray-200 overflow-hidden border border-gray-300">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            photos: prev.photos.filter((_, i) => i !== index)
                          }));
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {formData.photos.length > 9 && (
                    <div className="aspect-square rounded-xl bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium border border-gray-400">
                      +{formData.photos.length - 9} more
                    </div>
                  )}
                </div>
                
                {formData.photos.length < 3 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-3">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ You need at least 3 photos. Please add {3 - formData.photos.length} more photo{3 - formData.photos.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
                
                <button 
                  className={`w-full p-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${
                    formData.photos.length >= 3
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (formData.photos.length >= 3) {
                      input.action(formData.photos);
                    }
                  }}
                  disabled={formData.photos.length < 3}
                >
                  {formData.photos.length >= 3 
                    ? `Upload ${formData.photos.length} Photos` 
                    : `Need ${3 - formData.photos.length} More Photo${3 - formData.photos.length !== 1 ? 's' : ''}`
                  }
                </button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // ========================================================================================
  // RENDER COMPONENT
  // ========================================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <motion.div 
              className="flex items-center space-x-6 relative mt-1"
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push("/find")}
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
          <motion.span 
              className="text-xs text-gray-500 font-medium tracking-wider"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
          >
              SUBLEASE
          </motion.span>
          </motion.div>
          </motion.div>
          <h1 className="text-lg font-semibold text-gray-800">Create Listing</h1>
          <div className="flex w-16 space-x-2 mx-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-black hover:text-white transition-colors p-2 rounded-lg hover:bg-orange-600"
            >
              <ArrowLeft size={20} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <NotificationsButton notifications={notification}/>
            <div className="p-2 bg-orange-500 rounded-lg hover:scale-105 hover:bg-orange-600 transition-colors relative"><MessagesSquare className = "w-5 h-5 text-white"/></div>
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

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white min-h-[calc(100vh-80px)] flex flex-col rounded-t-3xl shadow-xl">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}
              >
                <div className="relative max-w-xs sm:max-w-md lg:max-w-lg">
                  {/* Edit button for system messages with steps */}
                  {!message.isUser && message.step && message.step !== 'summary' && message.step !== 'editMenu' && (
                    <button
                      onClick={() => handleEditStep(message.step!)}
                      className="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 text-gray-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                    >
                      <Edit3 size={12} />
                    </button>
                  )}
                  
                  <div
                    className={`px-4 py-3 rounded-3xl shadow-sm ${
                      message.isUser
                        ? 'bg-blue-500 text-white ml-auto rounded-br-lg'
                        : 'bg-gray-100 text-gray-800 mr-auto rounded-bl-lg'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
                    {message.options && (
                      <div className="mt-3 space-y-2">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={option.action}
                            className="w-full text-left p-3 bg-white text-gray-800 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {message.input && renderCustomInput(message.input)}
                    <div className="text-xs opacity-70 mt-2">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-3xl rounded-bl-lg shadow-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          {showInput && (
            <div className="border-t bg-white p-4 sm:p-6 rounded-b-3xl">
              <form onSubmit={handleTextInputSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}