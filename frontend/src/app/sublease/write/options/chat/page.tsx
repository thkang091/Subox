"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Plus, MapPin, Phone, Mail, MessageCircle, Edit3, Check, X, Camera, User, LogOut } from "lucide-react";

// Import the LocationPicker component
import LocationPicker from '../../../../../components/LocationPicker';
import { useAuth, AuthProvider } from '../../../../contexts/AuthInfo'; // Adjust path as needed
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust path to your firebase config
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // Add this to your firebase config
import { doc, updateDoc } from 'firebase/firestore';


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
  preferredGender: Gender; // Added this for early gender preference
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
  approximateUtilities: number; // Added for optional utilities cost
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

function ListingFormContent() {
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [editingStep, setEditingStep] = useState<string | null>(null);

  const currentListingDataRef = useRef<ListingData | null>(null);

  const router = useRouter();
  const { user, loading, requireAuth, showAuthPrompt, signOut } = useAuth();

  
  const [formData, setFormData] = useState<ListingData>({
    listingType: null,
    preferredGender: null, // Added this
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
    approximateUtilities: 0, // Added this
    bedrooms: 1,
    bathrooms: 1,
    isPrivateRoom: null,
   amenities: [
      { id: "washer-dryer", name: "In-unit washer / dryer", selected: false },
      { id: "parking", name: "Free parking", selected: false },
      { id: "garage", name: "Garage parking", selected: false },
      { id: "ac-heat", name: "Air conditioning / heating", selected: false },
      { id: "ceiling-fan", name: "Ceiling fan", selected: false },
      { id: "wifi", name: "Wi-Fi", selected: false },
      { id: "utilities", name: "Utilities included", selected: false },
      { id: "dishwasher", name: "Dishwasher", selected: false },
      { id: "gym", name: "Gym access", selected: false },
      { id: "pool", name: "Swimming pool", selected: false },
      { id: "hot-tub", name: "Hot tub", selected: false },
      { id: "sauna", name: "Sauna", selected: false },
      { id: "pet-friendly", name: "Pet-friendly", selected: false },
      { id: "balcony", name: "Balcony or outdoor space", selected: false },
      { id: "rooftop", name: "Rooftop access", selected: false },
      { id: "grill", name: "Grill / BBQ area", selected: false },
      { id: "elevator", name: "Elevator access", selected: false },
      { id: "security", name: "Secure building / security", selected: false },
      { id: "package-locker", name: "Package locker", selected: false },
      { id: "bike-storage", name: "Bike storage", selected: false },
      { id: "accessible", name: "Wheelchair accessible", selected: false },
      { id: "study-room", name: "Study or coworking space", selected: false },
      { id: "recreation-room", name: "Recreation or lounge room", selected: false },
      { id: "game-room", name: "Game room", selected: false },
      { id: "movie-room", name: "Movie / media room", selected: false },
      { id: "coffee-machine", name: "Coffee machine / café area", selected: false },
      { id: "trash-service", name: "Trash / recycling service", selected: false },
    ]
    
,    
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
      { id: "kitchenware", name: "Kitchenware", selected: false },
      { id: "mattress", name: "Mattress", selected: false },
      { id: "bedframe", name: "Bed frame", selected: false },
      { id: "bookshelf", name: "Bookshelf", selected: false },
      { id: "dresser", name: "Dresser", selected: false },
      { id: "lamp", name: "Lamp", selected: false },
      { id: "closet", name: "Closet or wardrobe", selected: false },
      { id: "nightstand", name: "Nightstand", selected: false },
      { id: "mirror", name: "Mirror", selected: false },
      { id: "rug", name: "Rug", selected: false },
      { id: "fan", name: "Fan", selected: false },
      { id: "trash-can", name: "Trash can", selected: false },
      { id: "laundry-basket", name: "Laundry basket", selected: false },
      { id: "microwave", name: "Microwave", selected: false },
      { id: "toaster", name: "Toaster", selected: false },
      { id: "coffeemaker", name: "Coffee maker", selected: false },
      { id: "cleaning-supplies", name: "Cleaning supplies", selected: false },
      { id: "bedding", name: "Bedding (sheets, pillow, blanket)", selected: false },
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
  // EFFECTS AND LIFECYCLE
  // ========================================================================================
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (!user && requireAuth('create_sublease')) {
      showAuthPrompt('create_sublease');
      router.push('/auth?mode=signup');
      return;
    }
    
    if (!hasInitialized && user) { // Only initialize if user is authenticated
      setHasInitialized(true);
      const timeout = setTimeout(() => {
        setMessages([{
          id: Date.now(),
          text: "Hi! Let's create a listing for your space \n\nWhat type of listing are you posting?",
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
  }, [loading, user, hasInitialized, requireAuth, showAuthPrompt, router]);

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

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.displayName || user.email?.split('@')[0] || 'User';
  };
  
  const getUserInitials = () => {
    if (!user) return 'U';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };
  
  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
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
        case "preferredGender":
          askGenderPreference();
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
      { value: "edit-gender", label: "👤 Gender Preference", action: () => handleEditStep("preferredGender") },
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
    
    // NOW ASK GENDER PREFERENCE FIRST
    setTimeout(() => {
      askGenderPreference();
    }, 500);
  };

  // ========================================================================================
  // STEP 2: GENDER PREFERENCE (NEW - MOVED UP)
  // ========================================================================================

  const askGenderPreference = () => {
    addSystemMessage("Who would you prefer as a roommate/tenant?", [
      { value: "gender-any", label: "Open to any gender", action: () => handleGenderPreferenceSelect("Any") },
      { value: "gender-male", label: "Male only", action: () => handleGenderPreferenceSelect("Male") },
      { value: "gender-female", label: "Female only", action: () => handleGenderPreferenceSelect("Female") },
      { value: "gender-nonbinary", label: "Non-binary", action: () => handleGenderPreferenceSelect("Non-binary") },
    ], undefined, "preferredGender");
  };

  const handleGenderPreferenceSelect = (gender: Gender) => {
    setFormData(prev => ({ ...prev, preferredGender: gender }));
    addUserMessage(`Gender preference: ${gender}`, "preferredGender");
    goToNextStep();
    
    setTimeout(() => {
      addSystemMessage("Perfect! \n\nWhen is your place available?", [
        { value: "Summer (May–Aug)", label: "Summer (May–Aug)", action: () => handleDateOptionSelect("Summer (May–Aug)") },
        { value: "Fall (Sept–Dec)", label: "Fall (Sept–Dec)", action: () => handleDateOptionSelect("Fall (Sept–Dec)") },
        { value: "Spring (Jan–Apr)", label: "Spring (Jan–Apr)", action: () => handleDateOptionSelect("Spring (Jan–Apr)") },
        { value: "Full Year", label: "Full Year", action: () => handleDateOptionSelect("Full Year") },
        { value: "Custom", label: "Custom dates", action: () => handleDateOptionSelect("Custom") },
      ], undefined, "availability");
    }, 500);
  };

  // ========================================================================================
  // STEP 3: AVAILABILITY (MOVED FROM STEP 2)
  // ========================================================================================

  const handleDateOptionSelect = (option: DateOption) => {
    setFormData(prev => ({ ...prev, dateOption: option }));
    addUserMessage(option as string, "availability");
    
    if (option === "Custom") {
      addSystemMessage("Please select your start and end dates:", undefined, {
        type: "date-range",
        action: (dates: {start: string, end: string}) => {
          const startDate = new Date(dates.start);
          const endDate = new Date(dates.end);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            addSystemMessage("❌ Invalid date format. Please select valid dates.", undefined, undefined, "error");
            return;
          }
          
          if (endDate <= startDate) {
            addSystemMessage("❌ End date must be after start date.", undefined, undefined, "error");
            return;
          }
          
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
      const nextYear = currentYear + (new Date().getMonth() >= 8 ? 1 : 0);
      let startDate = "";
      let endDate = "";
      
      try {
        switch(option) {
          case "Summer (May–Aug)": 
            startDate = `${currentYear}-05-01`; 
            endDate = `${currentYear}-08-31`; 
            break;
          case "Fall (Sept–Dec)": 
            startDate = `${currentYear}-09-01`; 
            endDate = `${currentYear}-12-31`; 
            break;
          case "Spring (Jan–Apr)": 
            startDate = `${currentYear}-01-01`; 
            endDate = `${currentYear}-04-30`; 
            break;
          case "Full Year": 
            startDate = `${currentYear}-01-01`; 
            endDate = `${currentYear}-12-31`; 
            break;
          default:
            throw new Error("Invalid date option");
        }
        
        const testStart = new Date(startDate);
        const testEnd = new Date(endDate);
        
        if (isNaN(testStart.getTime()) || isNaN(testEnd.getTime())) {
          throw new Error("Generated invalid dates");
        }
        
        setFormData(prev => ({ ...prev, startDate, endDate }));
        goToNextStep();
        setTimeout(() => askLocation(), 500);
        
      } catch (error) {
        console.error("❌ Error setting predefined dates:", error);
        addSystemMessage("❌ Error setting dates. Please try custom dates.", undefined, undefined, "error");
      }
    }
  };

  // ========================================================================================
  // STEP 4: LOCATION (MOVED FROM STEP 3)
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
  // STEP 5: RENT PRICE (MOVED FROM STEP 4)
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
            addUserMessage(`Price range: ${range.min} - ${range.max}`, "rent");
            setTimeout(() => askUtilities(), 500);
          }
        }, "rent");
      }, 500);
    } else {
      setTimeout(() => askUtilities(), 500);
    }
  };

  // ========================================================================================
  // STEP 6: UTILITIES (UPDATED WITH APPROXIMATE COST)
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
    
    if (!included) {
      // Ask for approximate utilities cost
      setTimeout(() => {
        addSystemMessage("What's the approximate monthly cost for utilities? (Optional) 💡\n\nThis helps tenants budget better.", [
          { 
            value: "utilities-estimate", 
            label: "Provide estimate", 
            action: () => {
              addSystemMessage("What's the approximate monthly utilities cost?", undefined, {
                type: "number",
                placeholder: "Enter estimated utilities cost (e.g., 50, 100)",
                action: (utilitiesCost: number) => {
                  setFormData(prev => ({ ...prev, approximateUtilities: utilitiesCost }));
                  addUserMessage(`Approximate utilities: ${utilitiesCost}/month`, "utilities");
                  goToNextStep();
                  setTimeout(() => askRoomsDetails(), 500);
                }
              }, "utilities");
            }
          },
          { 
            value: "utilities-skip", 
            label: "Skip - I don't know", 
            action: () => {
              addUserMessage("Skipping utilities estimate", "utilities");
              goToNextStep();
              setTimeout(() => askRoomsDetails(), 500);
            }
          },
        ], undefined, "utilities");
      }, 500);
    } else {
      goToNextStep();
      setTimeout(() => askRoomsDetails(), 500);
    }
  };

  // ========================================================================================
  // STEP 7: ROOM DETAILS (MOVED FROM STEP 6)
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
  // STEP 8: AMENITIES (MOVED FROM STEP 7)
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
  // STEP 9: ROOMMATES (MOVED FROM STEP 8)
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
    addSystemMessage("Tell me about your roommate 🤔\n\nIs your roommate generally quiet?", [
      { value: "quiet-yes", label: "Yes, they're quiet", action: () => handleQuietAnswer(true) },
      { value: "quiet-no", label: "No, they can be loud", action: () => handleQuietAnswer(false) },
    ], undefined, "roommates");
  };
  
  const handleQuietAnswer = (isQuiet: boolean) => {
    setFormData(prev => ({ 
      ...prev, 
      currentRoommateInfo: { ...prev.currentRoommateInfo, isQuiet } 
    }));
    addUserMessage(isQuiet ? "Yes, they're quiet" : "No, they can be loud", "roommates");

    setTimeout(() => {
      addSystemMessage("Does your roommate smoke?", [
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
    addUserMessage(smokes ? "Yes, they smoke" : "No, they don't smoke", "roommates");

    setTimeout(() => {
      addSystemMessage("Does your roommate have any pets?", [
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
    addUserMessage(hasPets ? "Yes, they have pets" : "No, they don't have pets", "roommates");
    setTimeout(() => askRoommatePreferences(), 500);
  };
  
  const askRoommatePreferences = () => {
    addSystemMessage("Are pets allowed for new roommates? 🐕", [
      { value: "pets-yes", label: "Yes", action: () => handlePetsPreference(true) },
      { value: "pets-no", label: "No", action: () => handlePetsPreference(false) },
    ], undefined, "roommates");
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
  // STEP 10: PHOTOS (MOVED FROM STEP 9)
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
  // STEP 11: FURNISHED STATUS (MOVED FROM STEP 10)
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
  // STEP 12: INCLUDED ITEMS (MOVED FROM STEP 11)
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
  // STEP 13: SUBLEASE REASON (MOVED FROM STEP 12)
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
  // STEP 14: ROOM TOUR (MOVED FROM STEP 13)
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
  // STEP 15: ADDITIONAL DETAILS (MOVED FROM STEP 14)
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
  // STEP 16: PARTIAL AVAILABILITY (MOVED FROM STEP 15)
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
  // STEP 17: CONTACT INFORMATION (MOVED FROM STEP 16)
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
    console.log("📋 Summary called with data:", currentFormData);
    console.log("📋 Start date in summary:", currentFormData.startDate);
    console.log("📋 End date in summary:", currentFormData.endDate);
    
    // Store the data in a ref for immediate access
    currentListingDataRef.current = currentFormData;
    
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
      console.log("📅 Formatting date:", dateStr);
      if (!dateStr) return "Not set";
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid date";
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
      if (currentFormData.utilitiesIncluded === false) {
        let display = "Not included";
        if (currentFormData.approximateUtilities > 0) {
          display += ` (Est. ${currentFormData.approximateUtilities}/month)`;
        }
        return display;
      }
      return "Not specified";
    };
    
    const getRoomTypeDisplay = () => {
      if (currentFormData.isPrivateRoom === true) return "Private room";
      if (currentFormData.isPrivateRoom === false) return "Shared room";
      return "Not specified";
    };
    
    let summary = `Here's your listing summary! ✨

📝 Type: ${currentFormData.listingType || "Not set"}
👤 Gender Preference: ${currentFormData.preferredGender || "Not set"}
📅 Available: ${formatDate(currentFormData.startDate)} to ${formatDate(currentFormData.endDate)}
📍 Location: ${getLocationDisplay()}
💵 Rent: ${getRentDisplay()}${getNegotiationDisplay()}
🏠 Utilities: ${getUtilitiesDisplay()}
🛏️ Space: ${currentFormData.bedrooms} bedroom(s), ${currentFormData.bathrooms} bathroom(s), ${getRoomTypeDisplay()}
🏠 Amenities: ${selectedAmenities || "None"}`;

    if (currentFormData.hasRoommates === true) {
      summary += `\n👤 About current roommate: ${currentFormData.currentRoommateInfo.isQuiet ? 'Quiet' : 'Can be loud'}, ${currentFormData.currentRoommateInfo.smokes ? 'Smokes' : "Doesn't smoke"}, ${currentFormData.currentRoommateInfo.hasPets ? 'Has pets' : 'No pets'}`;
      summary += `\n👥 New Roommate Preferences: Pets (${currentFormData.roommatePreferences.petsAllowed ? 'Yes' : 'No'}), Smoking (${currentFormData.roommatePreferences.smokingAllowed ? 'Yes' : 'No'}), Noise (${currentFormData.roommatePreferences.noiseLevel || 'Not specified'}), Cleanliness (${currentFormData.roommatePreferences.cleanlinessLevel || 'Not specified'})`;
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
        action: () => {
          console.log("🚀 Submit button clicked");
          console.log("🚀 Using ref data:", currentListingDataRef.current);
          handleSubmitFormWithData();
        }
      },
      { 
        value: "edit", 
        label: "✏️ Edit listing", 
        action: () => showEditOptions() 
      },
    ], undefined, "summary");
  };

  // ========================================================================================
  // IMPROVED PRICE RANGE INPUT WITH VALIDATION
  // ========================================================================================

  const renderCustomInput = (input: ChatMessage['input']) => {
    if (!input) return null;
    
    switch (input.type) {
      case 'price-range':
        return (
          <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div className="text-sm text-gray-600 mb-3">
              <p className="font-medium text-gray-800 mb-1">💰 Price Range</p>
              <p>Current rent: <span className="font-semibold">${formData.rent}</span></p>
              <p className="text-yellow-700">💡 Tip: Set a realistic range around your rent price</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Minimum Price</label>
                <input
                  type="number"
                  placeholder={`Min (e.g. ${Math.max(0, formData.rent - 200)})`}
                  max={formData.rent}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      rentNegotiation: { 
                        ...prev.rentNegotiation, 
                        minPrice: value
                      } 
                    }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Should be less than ${formData.rent}</p>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Maximum Price</label>
                <input
                  type="number"
                  placeholder={`Max (e.g. ${formData.rent + 100})`}
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setFormData(prev => ({ 
                      ...prev, 
                      rentNegotiation: { 
                        ...prev.rentNegotiation, 
                        maxPrice: value
                      } 
                    }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Can be more than ${formData.rent}</p>
              </div>
            </div>
            
            {/* Validation Messages */}
            {formData.rentNegotiation.minPrice > 0 && formData.rentNegotiation.maxPrice > 0 && (
              <div className="mt-2">
                {formData.rentNegotiation.minPrice >= formData.rentNegotiation.maxPrice && (
                  <p className="text-red-600 text-sm">⚠️ Minimum price should be less than maximum price</p>
                )}
                {formData.rentNegotiation.minPrice > formData.rent && (
                  <p className="text-yellow-600 text-sm">⚠️ Minimum price is higher than your listed rent</p>
                )}
                {formData.rentNegotiation.maxPrice < formData.rent && (
                  <p className="text-yellow-600 text-sm">⚠️ Maximum price is lower than your listed rent</p>
                )}
              </div>
            )}
            
            <button 
              className={`w-full p-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${
                formData.rentNegotiation.minPrice > 0 && 
                formData.rentNegotiation.maxPrice > 0 && 
                formData.rentNegotiation.minPrice < formData.rentNegotiation.maxPrice
                  ? "bg-orange-300 text-white hover:bg-orange-400"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
              onClick={() => {
                if (formData.rentNegotiation.minPrice > 0 && 
                    formData.rentNegotiation.maxPrice > 0 && 
                    formData.rentNegotiation.minPrice < formData.rentNegotiation.maxPrice) {
                  input.action({ 
                    min: formData.rentNegotiation.minPrice, 
                    max: formData.rentNegotiation.maxPrice 
                  });
                }
              }}
              disabled={!(formData.rentNegotiation.minPrice > 0 && 
                         formData.rentNegotiation.maxPrice > 0 && 
                         formData.rentNegotiation.minPrice < formData.rentNegotiation.maxPrice)}
            >
              Confirm Price Range
            </button>
          </div>
        );
        
      case 'date-range':
        return (
          <div className="mt-3 space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, startDate: e.target.value }));
                }}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, endDate: e.target.value }));
                }}
              />
            </div>
            <button 
              className="w-full p-3 bg-orange-300 text-white rounded-xl hover:bg-orange-400 font-medium transition-all shadow-sm hover:shadow-md"
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
                    className="w-4 h-4 text-orange-300 rounded focus:ring-orange-300"
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
                    className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent ml-7 transition-all"
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
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none transition-all"
                rows={2}
              />
            </div>
            
            <button 
              className="w-full p-3 bg-orange-300 text-white rounded-xl hover:bg-orange-400 font-medium transition-all shadow-sm hover:shadow-md"
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
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
                  className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
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
                      ? "bg-orange-300 border-orange-300 text-white shadow-md" 
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
                      ? "bg-orange-300 border-orange-300 text-white shadow-md" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-gray-400"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: false }))}
                >
                  Shared Room
                </button>
              </div>
            </div>
           
            <button 
              className="w-full p-3 bg-orange-300 text-white rounded-xl hover:bg-orange-400 font-medium transition-all shadow-sm hover:shadow-md"
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
                        ? "bg-orange-300 border-orange-300 text-white shadow-md" 
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
              className="w-full p-3 bg-orange-300 text-white rounded-xl hover:bg-orange-400 font-medium transition-all shadow-sm hover:shadow-md"
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
                      ? "bg-orange-300 border-orange-300 text-white shadow-md" 
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
                className="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none transition-all"
                rows={3}
              />
            </div>
            
            <button 
              className="w-full p-3 bg-orange-300 text-white rounded-xl hover:bg-orange-400 font-medium transition-all shadow-sm hover:shadow-md"
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
                      ? "bg-orange-300 text-white hover:bg-orange-400"
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
  // UPLOAD AND SUBMISSION FUNCTIONS
  // ========================================================================================

  const uploadImagesToStorage = async (files: File[], listingId: string): Promise<string[]> => {
    console.log("📸 Starting image upload...", files.length, "files");
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        const filename = `listings/${listingId}/image_${index}_${Date.now()}.${file.name.split('.').pop()}`;
        const storageRef = ref(storage, filename);
        
        console.log(`📤 Uploading image ${index + 1}:`, filename);
        
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        console.log(`✅ Image ${index + 1} uploaded:`, downloadURL);
        return downloadURL;
      });
      
      const imageUrls = await Promise.all(uploadPromises);
      console.log("🎉 All images uploaded successfully:", imageUrls);
      return imageUrls;
      
    } catch (error) {
      console.error("❌ Error uploading images:", error);
      throw error;
    }
  };

  const handleSubmitFormWithData = async (): Promise<void> => {
    if (!user) {
      showAuthPrompt('create_sublease');
      return;
    }
    
    const dataToSubmit = currentListingDataRef.current;
    
    if (!dataToSubmit) {
      console.error("❌ No listing data found in ref");
      addSystemMessage("❌ Error: No listing data found. Please try again.", undefined, undefined, "error");
      return;
    }
    
    try {
      addSystemMessage("🔄 Creating your listing and uploading photos...", undefined, undefined, "creating");
      
      // Validation
      if (!dataToSubmit.startDate || typeof dataToSubmit.startDate !== 'string' || dataToSubmit.startDate.trim() === '') {
        addSystemMessage("❌ Invalid start date. Please check your availability dates.", undefined, undefined, "error");
        return;
      }
      
      if (!dataToSubmit.endDate || typeof dataToSubmit.endDate !== 'string' || dataToSubmit.endDate.trim() === '') {
        addSystemMessage("❌ Invalid end date. Please check your availability dates.", undefined, undefined, "error");
        return;
      }
      
      if (!dataToSubmit.photos || dataToSubmit.photos.length < 3) {
        addSystemMessage("❌ Please upload at least 3 photos before submitting.", undefined, undefined, "error");
        return;
      }
      
      let startDate: Date;
      let endDate: Date;
      
      try {
        startDate = new Date(dataToSubmit.startDate);
        endDate = new Date(dataToSubmit.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Invalid dates");
        }
        
        if (endDate <= startDate) {
          addSystemMessage("❌ End date must be after start date. Please check your dates.", undefined, undefined, "error");
          return;
        }
        
      } catch (dateError) {
        addSystemMessage("❌ Error processing dates. Please check your availability dates and try again.", undefined, undefined, "error");
        return;
      }
      
      if (!dataToSubmit.listingType || !dataToSubmit.location || !dataToSubmit.rent || dataToSubmit.rent <= 0) {
        addSystemMessage("❌ Please fill in all required fields.", undefined, undefined, "error");
        return;
      }
      
      console.log("✅ All validations passed, creating listing...");
      
      const tempListingData = {
        title: `${dataToSubmit.listingType} in ${dataToSubmit.location}`,
        listingType: dataToSubmit.listingType,
        location: dataToSubmit.location,
        hostId: user.uid,
        createdAt: new Date(),
        status: 'uploading'
      };
      
      const docRef = await addDoc(collection(db, 'listings'), tempListingData);
      console.log("📄 Temporary listing created with ID:", docRef.id);
      
      let uploadedImageUrls: string[] = [];
      try {
        uploadedImageUrls = await uploadImagesToStorage(dataToSubmit.photos, docRef.id);
      } catch (uploadError) {
        console.error("❌ Image upload failed:", uploadError);
        addSystemMessage("❌ Failed to upload images. Please try again.", undefined, undefined, "error");
        return;
      }
      
      const completeListingData = {
        title: `${dataToSubmit.listingType} in ${dataToSubmit.location}`,
        listingType: String(dataToSubmit.listingType),
        location: String(dataToSubmit.location),
        
        image: uploadedImageUrls[0],
        additionalImages: uploadedImageUrls.slice(1),
        
        customLocation: dataToSubmit.customLocation ? {
          lat: Number(dataToSubmit.customLocation.lat || 0),
          lng: Number(dataToSubmit.customLocation.lng || 0),
          address: String(dataToSubmit.customLocation.address || ''),
          placeName: String(dataToSubmit.customLocation.placeName || '')
        } : null,
        
        showExactAddress: Boolean(dataToSubmit.showExactAddress),
        address: String(dataToSubmit.address || ''),
        
        // Dates
        startDate: String(dataToSubmit.startDate),
        endDate: String(dataToSubmit.endDate),
        dateOption: String(dataToSubmit.dateOption || ''),
        dateRange: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        partialDatesOk: Boolean(dataToSubmit.partialDatesOk),
        availableFrom: startDate,
        availableTo: endDate,
        
        // Pricing
        rent: Number(dataToSubmit.rent),
        price: Number(dataToSubmit.rent),
        rentNegotiation: {
          isNegotiable: Boolean(dataToSubmit.rentNegotiation?.isNegotiable),
          minPrice: Number(dataToSubmit.rentNegotiation?.minPrice || 0),
          maxPrice: Number(dataToSubmit.rentNegotiation?.maxPrice || 0)
        },
        
        // Property details
        utilitiesIncluded: Boolean(dataToSubmit.utilitiesIncluded),
        approximateUtilities: Number(dataToSubmit.approximateUtilities || 0),
        bedrooms: Number(dataToSubmit.bedrooms || 1),
        bathrooms: Number(dataToSubmit.bathrooms || 1),
        isPrivateRoom: Boolean(dataToSubmit.isPrivateRoom),
        accommodationType: dataToSubmit.isPrivateRoom ? 'private' : 'shared',
        
        // Arrays
        amenities: Array.isArray(dataToSubmit.amenities) 
          ? dataToSubmit.amenities.filter(a => a && a.selected).map(a => String(a.name || ''))
          : [],
        includedItems: Array.isArray(dataToSubmit.includedItems) 
          ? dataToSubmit.includedItems.filter(i => i && i.selected).map(i => String(i.name || ''))
          : [],
        
        // Roommate info
        hasRoommates: Boolean(dataToSubmit.hasRoommates),
        roommatePreferences: {
          gender: dataToSubmit.roommatePreferences?.gender ? String(dataToSubmit.roommatePreferences.gender) : null,
          petsAllowed: dataToSubmit.roommatePreferences?.petsAllowed !== null ? Boolean(dataToSubmit.roommatePreferences.petsAllowed) : null,
          smokingAllowed: dataToSubmit.roommatePreferences?.smokingAllowed !== null ? Boolean(dataToSubmit.roommatePreferences.smokingAllowed) : null,
          noiseLevel: dataToSubmit.roommatePreferences?.noiseLevel ? String(dataToSubmit.roommatePreferences.noiseLevel) : null,
          cleanlinessLevel: dataToSubmit.roommatePreferences?.cleanlinessLevel ? String(dataToSubmit.roommatePreferences.cleanlinessLevel) : null
        },
        currentRoommateInfo: {
          isQuiet: dataToSubmit.currentRoommateInfo?.isQuiet !== null ? Boolean(dataToSubmit.currentRoommateInfo.isQuiet) : null,
          smokes: dataToSubmit.currentRoommateInfo?.smokes !== null ? Boolean(dataToSubmit.currentRoommateInfo.smokes) : null,
          hasPets: dataToSubmit.currentRoommateInfo?.hasPets !== null ? Boolean(dataToSubmit.currentRoommateInfo.hasPets) : null
        },
        
        // Additional details
        subleaseReason: String(dataToSubmit.subleaseReason || ''),
        additionalDetails: String(dataToSubmit.additionalDetails || ''),
        customIncludedItems: String(dataToSubmit.customIncludedItems || ''),
        
        // Contact info
        contactInfo: {
          methods: Array.isArray(dataToSubmit.contactInfo?.methods) 
            ? dataToSubmit.contactInfo.methods.map(method => ({
                id: String(method.id || ''),
                name: String(method.name || ''),
                value: String(method.value || ''),
                selected: Boolean(method.selected)
              }))
            : [],
          note: String(dataToSubmit.contactInfo?.note || '')
        },
        
        // Host information
        hostId: String(user.uid),
        hostName: String(user.displayName || user.email?.split('@')[0] || 'Anonymous'),
        hostEmail: String(user.email || ''),
        hostImage: user.photoURL || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
        hostBio: `Hello, I'm ${user.displayName || user.email?.split('@')[0] || 'a student'} looking to sublease my place.`,
        
        // Display fields
        distance: 0.5,
        rating: 4.2,
        reviews: 8,
        description: String(dataToSubmit.additionalDetails || 'No description available'),
        preferredGender: dataToSubmit.preferredGender || 'Any',
        isVerifiedUMN: false,
        hostReviews: [],
        
        // Metadata
        createdAt: new Date(),
        status: 'active',
        viewCount: 0
      };
      
      // Update the document with complete data
      await updateDoc(doc(db, 'listings', docRef.id), completeListingData);
      
      console.log("🎉 Listing created successfully with uploaded images!");
      
      addSystemMessage("🎉 Your listing has been successfully created with all photos!\n\nRedirecting to your listing page...", undefined, undefined, "submitted");
      
      setTimeout(() => {
        router.push(`/sublease/search/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error creating listing:', error);
      addSystemMessage("❌ Error creating listing. Please try again.", undefined, undefined, "error");
    }
  };

  // ========================================================================================
  // RENDER COMPONENT
  // ========================================================================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-300"></div>
      </div>
    );
  }
  
  // If not authenticated, show message while redirecting
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-300 mx-auto mb-4"></div>
          <p className="text-gray-600">Please sign in to create listings. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Show loading while auth is checking */}
      {loading && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-300"></div>
        </div>
      )}

      {/* If not authenticated, show message while redirecting */}
      {!loading && !user && (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-300 mx-auto mb-4"></div>
            <p className="text-gray-600">Please sign in to create listings. Redirecting...</p>
          </div>
        </div>
      )}

      {/* Main content - only show if user is authenticated */}
      {!loading && user && (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-all duration-200 p-2 rounded-lg hover:bg-gray-100 hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
                <span className="hidden sm:inline font-medium">Back</span>
              </button>
              
              <div className="flex items-center space-x-3">
                {/* Logo */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-300 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">S</span>
                  </div>
                  <h1 className="text-lg font-bold text-gray-800 hidden sm:block">Create Listing</h1>
                </div>
              </div>
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 transition-all duration-200 p-2 rounded-lg hover:bg-gray-100 hover:scale-105 active:scale-95"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                    <span className="text-orange-400 font-bold text-sm">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-semibold text-gray-900">
                      {getUserDisplayName()}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-24">
                      {user?.email || 'No email'}
                    </div>
                  </div>
                  <div className={`transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                
                {/* User Dropdown */}
                {showUserMenu && (
                  <>
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-purple-50 rounded-t-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-orange-400 font-bold">
                              {getUserInitials()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{getUserDisplayName()}</div>
                            <div className="text-xs text-gray-500 truncate">{user?.email || 'No email'}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Account Status */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center space-x-2 text-xs">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-600 font-medium">Account Active</span>
                        </div>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/profile');
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 group"
                        >
                          <User size={16} className="mr-3 group-hover:scale-110 transition-transform" />
                          <span className="font-medium">Profile Settings</span>
                          <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-orange-300 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/dashboard');
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 group"
                        >
                          <div className="mr-3 group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v6m8-6v6" />
                            </svg>
                          </div>
                          <span className="font-medium">My Dashboard</span>
                          <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-orange-300 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            router.push('/listings');
                          }}
                          className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 group"
                        >
                          <div className="mr-3 group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                            </svg>
                          </div>
                          <span className="font-medium">My Listings</span>
                          <svg className="w-4 h-4 ml-auto text-gray-400 group-hover:text-orange-300 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-gray-100 my-1"></div>
                      
                      {/* Sign Out */}
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 group"
                      >
                        <LogOut size={16} className="mr-3 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Sign Out</span>
                        <svg className="w-4 h-4 ml-auto text-red-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Click outside overlay */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowUserMenu(false)}
                    />
                  </>
                )}
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
                            ? 'bg-orange-300 text-white ml-auto rounded-br-lg'
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
                      className="flex-1 p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="px-4 py-3 bg-blue-300 text-white rounded-2xl hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function EnhancedListingFormPage() {
  return (
    <AuthProvider>
      <ListingFormContent />
    </AuthProvider>
  );
}