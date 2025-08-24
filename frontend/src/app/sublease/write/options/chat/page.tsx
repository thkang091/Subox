"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {query, where, getDocs, orderBy, deleteDoc} from 'firebase/firestore';
import { 
  ArrowLeft, 
  Send, 
  Plus, 
  MapPin, 
  Phone, 
  Eye,
  Mail, 
  MessageCircle, 
  Edit3, 
  Check, 
  X, 
  Camera, 
  User, 
  LogOut,
  Home,
  Calendar,
  DollarSign,
  Bed,
  Bath,
  Wifi,
  Car,
  Shield,
  Zap,
  Users,
  Star,
  Image as ImageIcon,
  FileText,
  Clock,
  Info,
  ChevronDown,
  Upload,
  Tag,
  Building,
  Heart,
  Settings,
  Grid,
  List
} from "lucide-react";

// Import the LocationPicker component
import LocationPicker from '../../../../../components/LocationPicker';
import { useAuth, AuthProvider } from '../../../../contexts/AuthInfo'; // Adjust path as needed
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust path to your firebase config
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase'; // Add this to your firebase config
import { doc, updateDoc } from 'firebase/firestore';

// Mock router and auth for demo
const mockRouter = {
  back: () => console.log('Navigate back'),
  push: (path) => console.log('Navigate to:', path)
};

const mockUser = {
  uid: 'demo-user',
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  photoURL: null
};

const mockAuth = {
  user: mockUser,
  loading: false,
  requireAuth: () => true,
  showAuthPrompt: () => {},
  signOut: () => console.log('Sign out')
};

// Types
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
  preferredGender: Gender;
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
  approximateUtilities: number;
  bedrooms: number;
  bathrooms: number;
  isPrivateRoom: boolean | null;
  amenities: {id: string; name: string; selected: boolean; icon: string}[];
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
  includedItems: {id: string; name: string; selected: boolean; icon: string}[];
  customIncludedItems: string;
  photos: File[];
  partialDatesOk: boolean | null;
  subleaseReason: string;
  additionalDetails: string;
  contactInfo: ContactInfo;
  listingTitle?: string;
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
    icon?: string;
    action: () => void;
  }[];
  input?: {
    type: string;
    placeholder?: string;
    action: (value: any) => void;
    options?: {value: string; label: string}[];
  };
}

// Main component wrapper
function ListingFormContent() {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const [showIntroScreen, setShowIntroScreen] = useState(true);
  const [savedDrafts, setSavedDrafts] = useState([]);
  const [loadingDrafts, setLoadingDrafts] = useState(true);
  // State Management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [draftSaved, setDraftSaved] = useState(false);
const [showPreview, setShowPreview] = useState(false);
const [completionPercentage, setCompletionPercentage] = useState(0);
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
    preferredGender: null,
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
    approximateUtilities: 0,
    bedrooms: 1,
    bathrooms: 1,
    isPrivateRoom: null,
    amenities: [
      { id: "washer-dryer", name: "In-unit washer / dryer", selected: false, icon: "washer" },
      { id: "parking", name: "Free parking", selected: false, icon: "car" },
      { id: "garage", name: "Garage parking", selected: false, icon: "building" },
      { id: "ac-heat", name: "Air conditioning / heating", selected: false, icon: "zap" },
      { id: "wifi", name: "Wi-Fi", selected: false, icon: "wifi" },
      { id: "gym", name: "Gym access", selected: false, icon: "heart" },
      { id: "pool", name: "Swimming pool", selected: false, icon: "waves" },
      { id: "pet-friendly", name: "Pet-friendly", selected: false, icon: "heart" },
      { id: "balcony", name: "Balcony or outdoor space", selected: false, icon: "home" },
      { id: "security", name: "Secure building / security", selected: false, icon: "shield" },
      { id: "elevator", name: "Elevator access", selected: false, icon: "building" },
      { id: "study-room", name: "Study or coworking space", selected: false, icon: "book" },
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
      { id: "desk", name: "Desk", selected: false, icon: "table" },
      { id: "chair", name: "Chair", selected: false, icon: "chair" },
      { id: "mattress", name: "Mattress", selected: false, icon: "bed" },
      { id: "bedframe", name: "Bed frame", selected: false, icon: "bed" },
      { id: "dresser", name: "Dresser", selected: false, icon: "box" },
      { id: "lamp", name: "Lamp", selected: false, icon: "lightbulb" },
      { id: "microwave", name: "Microwave", selected: false, icon: "zap" },
      { id: "refrigerator", name: "Refrigerator", selected: false, icon: "box" },
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

  // Effects
 useEffect(() => {
  if (loading) return; // Wait for auth to load
  
  if (!user && requireAuth('create_sublease')) {
    showAuthPrompt('create_sublease');
    router.push('/auth?mode=signup');
    return;
  }
  
  // Don't auto-initialize chat anymore - wait for intro screen completion
}, [loading, user, requireAuth, showAuthPrompt, router]);

useEffect(() => {
  if (user && showIntroScreen) {
    fetchSavedDrafts();
  }
}, [user, showIntroScreen]);

useEffect(() => {
  const completion = calculateCompletion(formData);
  setCompletionPercentage(completion);
}, [formData]);

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

  // Utility Functions
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const fetchSavedDrafts = async () => {
  if (!user) {
    setLoadingDrafts(false);
    return;
  }

  try {
    const draftsQuery = query(
      collection(db, 'listing_drafts'),
      where('hostId', '==', user.uid),
      orderBy('lastSaved', 'desc')
    );
    
    const draftsSnapshot = await getDocs(draftsQuery);
    const drafts = draftsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastSaved: doc.data().lastSaved?.toDate() || new Date()
    }));
    
    setSavedDrafts(drafts);
  } catch (error) {
    console.error('Error fetching drafts:', error);
  } finally {
    setLoadingDrafts(false);
  }
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

  // Message Management
  const lastAddedMessage = useRef<{text: string, timestamp: number, isUser: boolean} | null>(null);

  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>, delay = 0) => {
    const now = Date.now();
    
    // More thorough duplicate check
    const isDuplicate = messages.some(existingMsg => 
      existingMsg.text === message.text &&
      existingMsg.isUser === message.isUser &&
      existingMsg.step === message.step
    );
    
    if (isDuplicate) {
      console.log('🚫 Duplicate message prevented:', message.text.substring(0, 50));
      return;
    }
    
    // Additional check for recent duplicates
    if (lastAddedMessage.current && 
        lastAddedMessage.current.text === message.text &&
        lastAddedMessage.current.isUser === message.isUser &&
        now - lastAddedMessage.current.timestamp < 1000) {
      console.log('🚫 Recent duplicate prevented');
      return;
    }
    
    const timeout = setTimeout(() => {
      setMessages(prev => [...prev, {
        ...message,
        id: Date.now() + Math.random(),
        timestamp: new Date()
      }]);
      
      if (delay > 0) {
        setIsTyping(false);
      }
      
      lastAddedMessage.current = {
        text: message.text,
        timestamp: now,
        isUser: message.isUser
      };
    }, delay);
    
    timeoutRefs.current.push(timeout);
  };

  const addUserMessage = (text: string, step?: string) => {
    addMessage({ text, isUser: true, step });
  };

const deleteDraft = async (draftId) => {
  try {
    await deleteDoc(doc(db, 'listing_drafts', draftId));
    setSavedDrafts(prev => prev.filter(draft => draft.id !== draftId));
    console.log('Draft deleted successfully');
  } catch (error) {
    console.error('Error deleting draft:', error);
    alert('Failed to delete draft. Please try again.');
  }
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

  // Form Handlers
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
  
  const calculateCompletion = (data) => {
  const fields = [
    data.listingType,
    data.preferredGender,
    data.startDate && data.endDate,
    data.location,
    data.rent > 0,
    data.utilitiesIncluded !== null,
    data.bedrooms > 0,
    data.bathrooms > 0,
    data.isPrivateRoom !== null,
    data.amenities.some(a => a.selected),
    data.hasRoommates !== null,
    data.photos.length >= 3,
    data.partialDatesOk !== null,
    data.additionalDetails || data.subleaseReason,
    data.contactInfo.methods.some(m => m.selected && m.value.trim()),
    data.listingTitle,
    data.customIncludedItems || data.includedItems.some(i => i.selected),
    data.rentNegotiation.isNegotiable !== null
  ];
  
  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
};


const showListingPreview = () => {
  // Use the current form data or the ref data
  const dataToPreview = currentListingDataRef.current || formData;
  
  // Create a preview object that mimics the listing detail structure
  const previewData = {
    id: 'preview-' + Date.now(),
    title: dataToPreview.listingTitle || `${dataToPreview.listingType || 'Sublease'} in ${dataToPreview.location || 'Campus Area'}`,
    listingType: dataToPreview.listingType || 'Sublease',
    location: dataToPreview.location || 'Campus Area',
    customLocation: dataToPreview.customLocation,
    address: dataToPreview.address || '',
    
    // Only include images if photos exist
    image: dataToPreview.photos && dataToPreview.photos.length > 0 
      ? URL.createObjectURL(dataToPreview.photos[0]) 
      : "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop",
    additionalImages: dataToPreview.photos && dataToPreview.photos.length > 1 
      ? dataToPreview.photos.slice(1).map(photo => URL.createObjectURL(photo))
      : [],
      
    availableFrom: dataToPreview.startDate ? new Date(dataToPreview.startDate) : new Date(),
    availableTo: dataToPreview.endDate ? new Date(dataToPreview.endDate) : new Date(),
    dateRange: dataToPreview.startDate && dataToPreview.endDate 
      ? `${new Date(dataToPreview.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(dataToPreview.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : 'Dates not set',
    partialDatesOk: dataToPreview.partialDatesOk || false,
    price: dataToPreview.rent || 0,
    rent: dataToPreview.rent || 0,
    negotiable: dataToPreview.rentNegotiation?.isNegotiable || false,
    utilitiesIncluded: dataToPreview.utilitiesIncluded || false,
    approximateUtilities: dataToPreview.approximateUtilities || 0,
    bedrooms: dataToPreview.bedrooms || 1,
    bathrooms: dataToPreview.bathrooms || 1,
    distance: 0.5,
    includedItems: dataToPreview.includedItems ? dataToPreview.includedItems.filter(i => i.selected).map(i => i.name) : [],
    rating: 0,
    reviews: 0,
    amenities: dataToPreview.amenities ? dataToPreview.amenities.filter(a => a.selected).map(a => a.name) : [],
    hostId: user?.uid || 'preview-user',
    hostName: user?.displayName || user?.email || 'Your Name',
    hostEmail: user?.email || '',
    hostBio: `Hello, I'm ${user?.displayName || 'a student'} looking to sublease my place.`,
    hostImage: user?.photoURL || "https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=800&h=500&auto=format&fit=crop",
    description: dataToPreview.additionalDetails || dataToPreview.subleaseReason || 'No description available',
    accommodationType: dataToPreview.isPrivateRoom ? 'private' : 'shared',
    preferredGender: dataToPreview.preferredGender || 'any',
    isVerifiedUMN: false,
    hostReviews: [],
    noiseLevel: dataToPreview.roommatePreferences?.noiseLevel,
    cleanliness: dataToPreview.roommatePreferences?.cleanlinessLevel,
    isPrivateRoom: dataToPreview.isPrivateRoom || false,
    hasRoommates: dataToPreview.hasRoommates || false,
    smokingAllowed: dataToPreview.roommatePreferences?.smokingAllowed || false,
    petsAllowed: dataToPreview.roommatePreferences?.petsAllowed || false,
    contactMethods: dataToPreview.contactInfo?.methods ? dataToPreview.contactInfo.methods.filter(method => method.selected && method.value.trim()) : []
  };

  // Store preview data in localStorage
  localStorage.setItem('previewData', JSON.stringify(previewData));
  
  // Navigate to a preview route within the same domain
  const previewUrl = `/sublease/search/preview?preview=true&timestamp=${Date.now()}`;
  window.open(previewUrl, '_blank');
  
  // Add a message confirming the preview opened
  addSystemMessage("Preview opened in a new tab! You can return here to make changes or continue with publishing.", undefined, undefined, "previewOpened");
};

const saveDraft = async () => {
  if (!user) {
    alert('Please sign in to save drafts');
    return;
  }

  try {
    const draftData = {
      ...formData,
      hostId: user.uid,
      hostName: user.displayName || user.email || 'Anonymous',
      hostEmail: user.email,
      isDraft: true,
      completionPercentage: calculateCompletion(formData),
      lastSaved: new Date(),
      createdAt: new Date(),
      status: 'draft'
    };

    const docRef = await addDoc(collection(db, 'listing_drafts'), draftData);
    console.log('Draft saved with ID:', docRef.id);
    setDraftSaved(true);
    
    // Show success message
    addSystemMessage("Your listing has been saved as a draft! You can continue editing anytime.", undefined, undefined, "draftSaved");
    
    setTimeout(() => setDraftSaved(false), 3000);
  } catch (error) {
    console.error('Error saving draft:', error);
    alert('Failed to save draft. Please try again.');
  }
};

  // Step Handlers
  const handleListingTypeSelect = (type: ListingType) => {
    setFormData(prev => ({ ...prev, listingType: type }));
    addUserMessage(type as string, "listingType");
    goToNextStep();
    
    setTimeout(() => {
      askGenderPreference();
    }, 500);
  };

  const askGenderPreference = () => {
    addSystemMessage("Who would you prefer as a roommate/tenant?", [
      { 
        value: "gender-any", 
        label: "Open to any gender", 
        icon: "users",
        action: () => handleGenderPreferenceSelect("Any") 
      },
      { 
        value: "gender-male", 
        label: "Male only", 
        icon: "user",
        action: () => handleGenderPreferenceSelect("Male") 
      },
      { 
        value: "gender-female", 
        label: "Female only", 
        icon: "user",
        action: () => handleGenderPreferenceSelect("Female") 
      },
      { 
        value: "gender-nonbinary", 
        label: "Non-binary", 
        icon: "user",
        action: () => handleGenderPreferenceSelect("Non-binary") 
      },
    ], undefined, "preferredGender");
  };

  const handleGenderPreferenceSelect = (gender: Gender) => {
    setFormData(prev => ({ ...prev, preferredGender: gender }));
    addUserMessage(`Gender preference: ${gender}`, "preferredGender");
    goToNextStep();
    
    setTimeout(() => {
      addSystemMessage("Perfect! When is your place available?", [
        { 
          value: "Summer (May–Aug)", 
          label: "Summer (May–Aug)", 
          icon: "calendar",
          action: () => handleDateOptionSelect("Summer (May–Aug)") 
        },
        { 
          value: "Fall (Sept–Dec)", 
          label: "Fall (Sept–Dec)", 
          icon: "calendar",
          action: () => handleDateOptionSelect("Fall (Sept–Dec)") 
        },
        { 
          value: "Spring (Jan–Apr)", 
          label: "Spring (Jan–Apr)", 
          icon: "calendar",
          action: () => handleDateOptionSelect("Spring (Jan–Apr)") 
        },
        { 
          value: "Full Year", 
          label: "Full Year", 
          icon: "calendar",
          action: () => handleDateOptionSelect("Full Year") 
        },
        { 
          value: "Custom", 
          label: "Custom dates", 
          icon: "settings",
          action: () => handleDateOptionSelect("Custom") 
        },
      ], undefined, "availability");
    }, 500);
  };

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
            addSystemMessage("Invalid date format. Please select valid dates.", undefined, undefined, "error");
            return;
          }
          
          if (endDate <= startDate) {
            addSystemMessage("End date must be after start date.", undefined, undefined, "error");
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
      let startDate = "";
      let endDate = "";
      
      try {
        switch(option) {
          case "Summer (May–Aug)": 
            startDate = `${currentYear}-05-02`; 
            endDate = `${currentYear}-09-01`; 
            break;
          case "Fall (Sept–Dec)": 
            startDate = `${currentYear}-08-31`; 
            endDate = `${currentYear}-12-16`; 
            break;
          case "Spring (Jan–Apr)": 
            startDate = `${currentYear}-01-02`; 
            endDate = `${currentYear}-04-30`; 
            break;
          case "Full Year": 
            startDate = `${currentYear}-01-02`; 
            endDate = `${currentYear}-12-31`; 
            break;
        }
        
        setFormData(prev => ({ ...prev, startDate, endDate }));
        goToNextStep();
        setTimeout(() => askLocation(), 500);
        
      } catch (error) {
        addSystemMessage("Error setting dates. Please try custom dates.", undefined, undefined, "error");
      }
    }
  };

 const askLocation = () => {
  addSystemMessage("Please search for and select your specific location:", undefined, {
    type: "location-picker",
    action: (locationData: any) => {
      setFormData(prev => ({ 
        ...prev, 
        location: "Other",
        customLocation: locationData,
        address: locationData.address
      }));
      addUserMessage(`Selected: ${locationData.address}`, "location");
      goToNextStep();
      setTimeout(() => askRentPrice(), 500);
    }
  }, "location");
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
          { value: "show-address", label: "Show exact address", icon: "mapPin", action: () => handleAddressVisibilitySelect(true) },
          { value: "hide-address", label: "Only show neighborhood", icon: "eye", action: () => handleAddressVisibilitySelect(false) },
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

  const askRentPrice = () => {
    addSystemMessage("How much is the monthly rent?", undefined, {
      type: "number",
      placeholder: "Enter monthly rent",
      action: (rent: number) => {
        setFormData(prev => ({ ...prev, rent }));
        addUserMessage(`$${rent} per month`, "rent");
        
        setTimeout(() => {
          addSystemMessage("Is the rent negotiable?", [
            { value: "rent-negotiable", label: "Yes, it's negotiable", icon: "dollarSign", action: () => handleRentNegotiable(true) },
            { value: "rent-fixed", label: "No, price is fixed", icon: "lock", action: () => handleRentNegotiable(false) },
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

  const askUtilities = () => {
    addSystemMessage("Are utilities included in the rent?", [
      { value: "utilities-yes", label: "Yes, utilities included", icon: "zap", action: () => handleUtilitiesIncluded(true) },
      { value: "utilities-no", label: "No, utilities not included", icon: "x", action: () => handleUtilitiesIncluded(false) },
    ], undefined, "utilities");
  };

  const handleUtilitiesIncluded = (included: boolean) => {
    setFormData(prev => ({ ...prev, utilitiesIncluded: included }));
    addUserMessage(included ? "Yes, utilities are included" : "No, utilities are not included", "utilities");
    
    if (!included) {
      setTimeout(() => {
        addSystemMessage("What's the approximate monthly cost for utilities? (Optional) This helps tenants budget better.", [
          { 
            value: "utilities-estimate", 
            label: "Provide estimate", 
            icon: "dollarSign",
            action: () => {
              addSystemMessage("What's the approximate monthly utilities cost?", undefined, {
                type: "number",
                placeholder: "Enter estimated utilities cost (e.g., 50, 100)",
                action: (utilitiesCost: number) => {
                  setFormData(prev => ({ ...prev, approximateUtilities: utilitiesCost }));
                  addUserMessage(`Approximate utilities: $${utilitiesCost}/month`, "utilities");
                  goToNextStep();
                  setTimeout(() => askRoomsDetails(), 500);
                }
              }, "utilities");
            }
          },
          { 
            value: "utilities-skip", 
            label: "Skip - I don't know", 
            icon: "x",
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

  const askRoomsDetails = () => {
    addSystemMessage("Tell me about the space", undefined, {
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

  const askAmenities = () => {
    addSystemMessage("Which amenities does your place include? (Select all that apply)", undefined, {
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

  const askRoommates = () => {
    addSystemMessage("Will you have roommates?", [
      { value: "roommates-yes", label: "Yes", icon: "users", action: () => handleRoommatesAnswer(true) },
      { value: "roommates-no", label: "No", icon: "user", action: () => handleRoommatesAnswer(false) },
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
    addSystemMessage("Tell me about your roommate. Is your roommate generally quiet?", [
      { value: "quiet-yes", label: "Yes, they're quiet", icon: "check", action: () => handleQuietAnswer(true) },
      { value: "quiet-no", label: "No, they can be loud", icon: "x", action: () => handleQuietAnswer(false) },
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
        { value: "smoke-yes", label: "Yes", icon: "x", action: () => handleSmokeAnswer(true) },
        { value: "smoke-no", label: "No", icon: "check", action: () => handleSmokeAnswer(false) },
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
        { value: "pets-yes", label: "Yes", icon: "heart", action: () => handleCurrentPetsAnswer(true) },
        { value: "pets-no", label: "No", icon: "x", action: () => handleCurrentPetsAnswer(false) },
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
    addSystemMessage("Are pets allowed for new roommates?", [
      { value: "pets-yes", label: "Yes", icon: "heart", action: () => handlePetsPreference(true) },
      { value: "pets-no", label: "No", icon: "x", action: () => handlePetsPreference(false) },
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
      addSystemMessage("Is smoking allowed?", [
        { value: "smoking-yes", label: "Yes", icon: "check", action: () => handleSmokingPreference(true) },
        { value: "smoking-no", label: "No", icon: "x", action: () => handleSmokingPreference(false) },
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
      addSystemMessage("Preferred noise level?", [
        { value: "noise-low", label: "Low", icon: "volume", action: () => handleNoisePreference("Low") },
        { value: "noise-medium", label: "Medium", icon: "volume", action: () => handleNoisePreference("Medium") },
        { value: "noise-high", label: "High", icon: "volume", action: () => handleNoisePreference("High") },
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
      addSystemMessage("Preferred cleanliness level?", [
        { value: "clean-low", label: "Low", icon: "star", action: () => handleCleanlinessPreference("Low") },
        { value: "clean-medium", label: "Medium", icon: "star", action: () => handleCleanlinessPreference("Medium") },
        { value: "clean-high", label: "High", icon: "star", action: () => handleCleanlinessPreference("High") },
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

  const askPhotos = () => {
    addSystemMessage("Please upload at least 3 photos of your space. The more photos you include, the more likely your listing will get attention! Include: bedroom, bathroom, living space, kitchen, etc.", undefined, {
      type: "file",
      action: (files: File[]) => {
        setFormData(prev => ({ ...prev, photos: files }));
        addUserMessage(`Uploaded ${files.length} photos`, "photos");
        goToNextStep();
        setTimeout(() => askFurnishedStatus(), 500);
      }
    }, "photos");
  };

  const askFurnishedStatus = () => {
    addSystemMessage("Is your place furnished?", [
      { value: "furnished-yes", label: "Yes, it's furnished", icon: "home", action: () => handleFurnishedStatus(true) },
      { value: "furnished-no", label: "No, it's not furnished", icon: "x", action: () => handleFurnishedStatus(false) },
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

  const askIncludedItems = () => {
    addSystemMessage("Since your place isn't furnished, are you including any furniture or items for the next tenant? (Select all that apply, or skip if none)", undefined, {
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

  const askSubleaseReason = () => {
    addSystemMessage("Would you like to share why you're subletting? (Optional) This can help potential renters understand your situation better.", [
      { 
        value: "reason-yes", 
        label: "Yes, I'll share the reason", 
        icon: "fileText",
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
        icon: "x",
        action: () => {
          addUserMessage("Skipping reason", "subleaseReason");
          goToNextStep();
          setTimeout(() => askRoomTour(), 500);
        }
      },
    ], undefined, "subleaseReason");
  };

  const askRoomTour = () => {
    addSystemMessage("Are you open to giving room tours to potential renters?", [
      { value: "tour-yes", label: "Yes, I'm open to tours", icon: "eye", action: () => handleRoomTour(true) },
      { value: "tour-no", label: "No tours, photos only", icon: "camera", action: () => handleRoomTour(false) },
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
    
    // Don't increment step here since we're going to ask additional details next
    setTimeout(() => askAdditionalDetails(), 500);
  };

  const askAdditionalDetails = () => {
    addSystemMessage("Any additional details to make your listing stand out? (Optional - apartment features, neighborhood highlights, etc.)", [
      { 
        value: "details-yes", 
        label: "Yes, I have more details", 
        icon: "plus",
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
        icon: "x",
        action: () => {
          addUserMessage("No additional details", "additionalDetails");
          goToNextStep();
          setTimeout(() => askPartialAvailability(), 500);
        }
      },
    ], undefined, "additionalDetails");
  };

  const askPartialAvailability = () => {
    addSystemMessage("Are you open to renting for just part of the dates? (e.g., if your lease is June to August, would you consider renting just for June?)", [
      { value: "partial-yes", label: "Yes, I'm flexible with dates", icon: "calendar", action: () => handlePartialAvailability(true) },
      { value: "partial-no", label: "No, I need the entire period covered", icon: "lock", action: () => handlePartialAvailability(false) },
    ], undefined, "partialAvailability");
  };

  const handlePartialAvailability = (partialOk: boolean) => {
    setFormData(prev => ({ ...prev, partialDatesOk: partialOk }));
    addUserMessage(partialOk ? "Yes, I'm flexible with dates" : "No, I need the entire period covered", "partialAvailability");
    setTimeout(() => askContactInfo(), 500);
  };

  const askContactInfo = () => {
    addSystemMessage("How would you like potential renters to contact you? We have our built-in chat system, but you can also provide additional contact methods if you prefer.", undefined, {
      type: "contact-info",
      action: (contactData: any) => {
        setFormData(prev => {
          const updatedData = { ...prev, contactInfo: contactData };
          
          setTimeout(() => {
            const selectedMethods = contactData.methods
              .filter((m: any) => m.selected && m.value.trim())
              .map((m: any) => `${m.name}: ${m.value}`)
              .join(", ");
            
            addUserMessage(`Contact methods: ${selectedMethods || "Built-in chat only"}${contactData.note ? `\nNote: ${contactData.note}` : ""}`, "contactInfo");
            
            setTimeout(() => {
              askTitleOfListing();
            }, 50);
          }, 10);
          
          return updatedData;
        });
      }
    }, "contactInfo");
  };

  const askTitleOfListing = () => {
    // Check if title question already exists
    const hasTitleMessage = messages.some(msg => 
      !msg.isUser && msg.text && msg.text.includes("create a catchy title")
    );
      
    if (hasTitleMessage) {
      console.log('Title message already exists, skipping');
      return;
    }
    
    addSystemMessage("Finally, let's create a catchy title for your listing! Write a short, descriptive title that will attract potential renters:", undefined, {
      type: "textarea",
      placeholder: "e.g., Cozy Room Near Campus with Great Amenities",
      action: (title: string) => {
        // Check if this exact title response already exists
        const hasTitleResponse = messages.some(msg => 
          msg.isUser && 
          msg.text && 
          msg.text === `Listing title: "${title}"`
        );
        
        if (hasTitleResponse) {
          console.log('Title response already exists, skipping');
          return;
        }

        setFormData(prev => {
          const updatedData = { ...prev, listingTitle: title };
          
          addUserMessage(`Listing title: "${title}"`, "listingTitle");
      
          // Use a longer timeout to ensure the user message is added first
          setTimeout(() => {
            console.log("About to show summary with data:", updatedData);
            showListingSummaryWithData(updatedData);
          }, 500);
          
          return updatedData;
        });
      }
    }, "listingTitle");
  };

  const showListingSummaryWithData = (currentFormData: ListingData) => {
    console.log("📋 Summary called with data:", currentFormData);
    
    // Check if summary already exists
    const hasSummaryMessage = messages.some(msg => 
      !msg.isUser && msg.text && msg.text.includes("Here's your listing summary!")
    );
    
    if (hasSummaryMessage) {
      console.log('Summary already exists, skipping');
      return;
    }
    
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
    
    let summary = `Here's your listing summary!

Title: ${currentFormData.listingTitle || "Not set"}
Type: ${currentFormData.listingType || "Not set"}
Gender Preference: ${currentFormData.preferredGender || "Not set"}
Available: ${formatDate(currentFormData.startDate)} to ${formatDate(currentFormData.endDate)}
Location: ${getLocationDisplay()}
Rent: ${getRentDisplay()}${getNegotiationDisplay()}
Utilities: ${getUtilitiesDisplay()}
Space: ${currentFormData.bedrooms} bedroom(s), ${currentFormData.bathrooms} bathroom(s), ${getRoomTypeDisplay()}
Amenities: ${selectedAmenities || "None"}`;

    if (currentFormData.hasRoommates === true) {
      summary += `\nAbout current roommate: ${currentFormData.currentRoommateInfo.isQuiet ? 'Quiet' : 'Can be loud'}, ${currentFormData.currentRoommateInfo.smokes ? 'Smokes' : "Doesn't smoke"}, ${currentFormData.currentRoommateInfo.hasPets ? 'Has pets' : 'No pets'}`;
      summary += `\nNew Roommate Preferences: Pets (${currentFormData.roommatePreferences.petsAllowed ? 'Yes' : 'No'}), Smoking (${currentFormData.roommatePreferences.smokingAllowed ? 'Yes' : 'No'}), Noise (${currentFormData.roommatePreferences.noiseLevel || 'Not specified'}), Cleanliness (${currentFormData.roommatePreferences.cleanlinessLevel || 'Not specified'})`;
    }

    const isFurnished = currentFormData.amenities.find(a => a.id === 'furnished')?.selected;
    if (!isFurnished && (selectedItems || currentFormData.customIncludedItems)) {
      let itemsDisplay = selectedItems;
      if (currentFormData.customIncludedItems) {
        itemsDisplay = itemsDisplay ? `${itemsDisplay}, ${currentFormData.customIncludedItems}` : currentFormData.customIncludedItems;
      }
      summary += `\nIncluded Items: ${itemsDisplay || "None"}`;
    }

    summary += `\nPhotos: ${currentFormData.photos.length} uploaded
Partial availability: ${currentFormData.partialDatesOk === true ? 'Yes' : currentFormData.partialDatesOk === false ? 'No' : 'Not specified'}`;

    if (currentFormData.subleaseReason) {
      summary += `\nReason for sublease: ${currentFormData.subleaseReason}`;
    }

    if (currentFormData.additionalDetails) {
      summary += `\nAdditional details: ${currentFormData.additionalDetails}`;
    }

    summary += `\nContact: ${contactMethods || "Built-in chat system"}`;
    
    if (currentFormData.contactInfo.note) {
      summary += `\nContact note: ${currentFormData.contactInfo.note}`;
    }
    
   addSystemMessage(summary, [
  { 
    value: "preview", 
    label: "Preview listing", 
    icon: "eye",
    action: () => {
      showListingPreview();
    }
  },
  { 
    value: "confirm", 
    label: "Confirm and publish listing", 
    icon: "check",
    action: () => {
      handleSubmitFormWithData();
    }
  },
  { 
    value: "edit", 
    label: "Edit listing", 
    icon: "edit",
    action: () => showEditOptions() 
  },
], undefined, "summary");

  };

  const showEditOptions = () => {
    addSystemMessage("What would you like to edit?", [
      { value: "edit-type", label: "Listing Type", icon: "fileText", action: () => handleEditStep("listingType") },
      { value: "edit-gender", label: "Gender Preference", icon: "user", action: () => handleEditStep("preferredGender") },
      { value: "edit-dates", label: "Availability", icon: "calendar", action: () => handleEditStep("availability") },
      { value: "edit-location", label: "Location", icon: "mapPin", action: () => handleEditStep("location") },
      { value: "edit-rent", label: "Rent & Price", icon: "dollarSign", action: () => handleEditStep("rent") },
      { value: "edit-utilities", label: "Utilities", icon: "zap", action: () => handleEditStep("utilities") },
      { value: "edit-rooms", label: "Room Details", icon: "bed", action: () => handleEditStep("rooms") },
      { value: "edit-amenities", label: "Amenities", icon: "home", action: () => handleEditStep("amenities") },
      { value: "edit-roommates", label: "Roommate Info", icon: "users", action: () => handleEditStep("roommates") },
      { value: "edit-photos", label: "Photos", icon: "camera", action: () => handleEditStep("photos") },
      { value: "edit-furnished", label: "Furnished Status", icon: "home", action: () => handleEditStep("furnished") },
      { value: "edit-items", label: "Included Items", icon: "grid", action: () => handleEditStep("includedItems") },
      { value: "edit-reason", label: "Sublease Reason", icon: "fileText", action: () => handleEditStep("subleaseReason") },
      { value: "edit-details", label: "Additional Details", icon: "star", action: () => handleEditStep("additionalDetails") },
      { value: "edit-partial", label: "Partial Availability", icon: "clock", action: () => handleEditStep("partialAvailability") },
      { value: "edit-contact", label: "Contact Info", icon: "phone", action: () => handleEditStep("contactInfo") },
      { value: "edit-title", label: "Title", icon: "tag", action: () => handleEditStep("listingTitle") },
      { value: "back-summary", label: "Back to Summary", icon: "arrowLeft", action: () => showListingSummaryWithData(formData) },
    ], undefined, "editMenu");
  };

  const handleEditStep = (step: string) => {
    setEditingStep(step);
    
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
            { value: "Sublet", label: "Sublet", icon: "home", action: () => handleListingTypeSelect("Sublet") },
            { value: "Lease Takeover", label: "Lease Takeover", icon: "fileText", action: () => handleListingTypeSelect("Lease Takeover") },
            { value: "Room in Shared Unit", label: "Room in Shared Unit", icon: "users", action: () => handleListingTypeSelect("Room in Shared Unit") },
          ], undefined, "listingType");
          break;
        case "preferredGender":
          askGenderPreference();
          break;
        case "availability":
          addSystemMessage("When is your place available?", [
            { value: "Summer (May–Aug)", label: "Summer (May–Aug)", icon: "calendar", action: () => handleDateOptionSelect("Summer (May–Aug)") },
            { value: "Fall (Sept–Dec)", label: "Fall (Sept–Dec)", icon: "calendar", action: () => handleDateOptionSelect("Fall (Sept–Dec)") },
            { value: "Spring (Jan–Apr)", label: "Spring (Jan–Apr)", icon: "calendar", action: () => handleDateOptionSelect("Spring (Jan–Apr)") },
            { value: "Full Year", label: "Full Year", icon: "calendar", action: () => handleDateOptionSelect("Full Year") },
            { value: "Custom", label: "Custom dates", icon: "settings", action: () => handleDateOptionSelect("Custom") },
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
        case "listingTitle": askTitleOfListing(); break;
      }
      setEditingStep(null);
    }, 100);
  };

  // Firebase image upload function
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
      addSystemMessage("Error: No listing data found. Please try again.", undefined, undefined, "error");
      return;
    }
    
    try {
      addSystemMessage("Creating your listing and uploading photos...", undefined, undefined, "creating");
      
      // Validation
      if (!dataToSubmit.startDate || typeof dataToSubmit.startDate !== 'string' || dataToSubmit.startDate.trim() === '') {
        addSystemMessage("Invalid start date. Please check your availability dates.", undefined, undefined, "error");
        return;
      }
      
      if (!dataToSubmit.endDate || typeof dataToSubmit.endDate !== 'string' || dataToSubmit.endDate.trim() === '') {
        addSystemMessage("Invalid end date. Please check your availability dates.", undefined, undefined, "error");
        return;
      }
      
      if (!dataToSubmit.photos || dataToSubmit.photos.length < 3) {
        addSystemMessage("Please upload at least 3 photos before submitting.", undefined, undefined, "error");
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
          addSystemMessage("End date must be after start date. Please check your dates.", undefined, undefined, "error");
          return;
        }
        
      } catch (dateError) {
        addSystemMessage("Error processing dates. Please check your availability dates and try again.", undefined, undefined, "error");
        return;
      }
      
      if (!dataToSubmit.listingType || !dataToSubmit.location || !dataToSubmit.rent || dataToSubmit.rent <= 0) {
        addSystemMessage("Please fill in all required fields.", undefined, undefined, "error");
        return;
      }
      
      console.log("✅ All validations passed, creating listing...");
      
      const tempListingData = {
        title: dataToSubmit.listingTitle,
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
        addSystemMessage("Failed to upload images. Please try again.", undefined, undefined, "error");
        return;
      }
      
      const completeListingData = {
        title: String(dataToSubmit.listingTitle),
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
      
      addSystemMessage("Your listing has been successfully created with all photos! Redirecting to your listing page...", undefined, undefined, "submitted");
      
      setTimeout(() => {
        router.push(`/sublease/search/${docRef.id}`);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error creating listing:', error);
      addSystemMessage("Error creating listing. Please try again.", undefined, undefined, "error");
    }
  };

  // Icon component helper
  const IconComponent = ({ name, size = 16, className = "" }) => {
    const icons = {
      home: Home,
      fileText: FileText,
      users: Users,
      user: User,
      calendar: Calendar,
      settings: Settings,
      mapPin: MapPin,
      search: MapPin,
      eye: Settings,
      dollarSign: DollarSign,
      lock: Shield,
      zap: Zap,
      x: X,
      check: Check,
      heart: Heart,
      volume: Settings,
      star: Star,
      camera: Camera,
      plus: Plus,
      edit: Edit3,
      arrowLeft: ArrowLeft,
      phone: Phone,
      tag: Tag,
      bed: Bed,
      grid: Grid,
      clock: Clock,
      wifi: Wifi,
      car: Car,
      building: Building,
      shield: Shield
    };
    
    const Icon = icons[name] || Settings;
    return <Icon size={size} className={className} />;
  };

  // Custom Input Components
  const renderCustomInput = (input: ChatMessage['input']) => {
    if (!input) return null;
    
    switch (input.type) {
      case 'price-range':
        return (
          <div className="mt-4 space-y-4 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="text-sm text-gray-700 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                <p className="font-semibold text-gray-800">Price Range</p>
              </div>
              <p>Current rent: <span className="font-semibold">${formData.rent}</span></p>
              <p className="text-orange-600 text-sm mt-1">Set a realistic range around your rent price</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Minimum Price</label>
                <input
                  type="number"
                  placeholder={`Min (e.g. ${Math.max(0, formData.rent - 200)})`}
                  max={formData.rent}
                  className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
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
                  className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
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
            
            {formData.rentNegotiation.minPrice > 0 && formData.rentNegotiation.maxPrice > 0 && (
              <div className="mt-3">
                {formData.rentNegotiation.minPrice >= formData.rentNegotiation.maxPrice && (
                  <p className="text-red-600 text-sm flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Minimum price should be less than maximum price
                  </p>
                )}
                {formData.rentNegotiation.minPrice > formData.rent && (
                  <p className="text-orange-600 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Minimum price is higher than your listed rent
                  </p>
                )}
                {formData.rentNegotiation.maxPrice < formData.rent && (
                  <p className="text-orange-600 text-sm flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Maximum price is lower than your listed rent
                  </p>
                )}
              </div>
            )}
            
            <button 
              className={`w-full p-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${
                formData.rentNegotiation.minPrice > 0 && 
                formData.rentNegotiation.maxPrice > 0 && 
                formData.rentNegotiation.minPrice < formData.rentNegotiation.maxPrice
                  ? "bg-orange-400 text-white hover:bg-orange-500"
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
              <Check className="w-4 h-4" />
              Confirm Price Range
            </button>
          </div>
        );
        
      case 'date-range':
        return (
          <div className="mt-4 space-y-4 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Select Date Range</h3>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, startDate: e.target.value }));
                }}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, endDate: e.target.value }));
                }}
              />
            </div>
            <button 
              className="w-full p-3 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              onClick={() => {
                if (formData.startDate && formData.endDate) {
                  input.action({ start: formData.startDate, end: formData.endDate });
                }
              }}
            >
              <Check className="w-4 h-4" />
              Confirm Dates
            </button>
          </div>
        );
        
      case 'location-picker':
        return (
          <div className="mt-4 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Location Picker</h3>
            </div>
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
          <div className="mt-4 space-y-6 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Contact Methods</h3>
            </div>
            <p className="text-sm text-gray-600">Select and fill in the contact methods you'd like to use:</p>
            
            {formData.contactInfo.methods.map((method) => (
              <div key={method.id} className="space-y-3">
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
                    className="w-4 h-4 text-orange-400 rounded focus:ring-orange-300 border-orange-300"
                  />
                  <label className="font-medium text-gray-700 flex items-center gap-2">
                    {method.id === 'phone' && <Phone size={16} className="text-orange-400" />}
                    {method.id === 'email' && <Mail size={16} className="text-orange-400" />}
                    {method.id === 'instagram' && <MessageCircle size={16} className="text-orange-400" />}
                    {method.id === 'snapchat' && <MessageCircle size={16} className="text-orange-400" />}
                    {method.id === 'other' && <MessageCircle size={16} className="text-orange-400" />}
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
                    className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent ml-7 transition-all"
                  />
                )}
              </div>
            ))}
            
            <div className="mt-6">
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
                className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none transition-all"
                rows={3}
              />
            </div>
            
            <button 
              className="w-full p-3 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              onClick={() => {
                input.action(formData.contactInfo);
              }}
            >
              <Check className="w-4 h-4" />
              Confirm Contact Information
            </button>
          </div>
        );
        
      case 'rooms':
        return (
          <div className="mt-4 space-y-6 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Bed className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Room Details</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Bedrooms</label>
                <select 
                  className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
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
                  className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all"
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
              <label className="block mb-3 text-sm font-medium text-gray-700">Room Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`p-4 rounded-xl border text-center font-medium transition-all flex items-center justify-center gap-2 ${
                    formData.isPrivateRoom === true
                      ? "bg-orange-400 border-orange-400 text-white shadow-md" 
                      : "border-orange-200 text-gray-700 hover:bg-orange-100 hover:border-orange-300"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: true }))}
                >
                  <User className="w-4 h-4" />
                  Private Room
                </button>
                <button
                  type="button"
                  className={`p-4 rounded-xl border text-center font-medium transition-all flex items-center justify-center gap-2 ${
                    formData.isPrivateRoom === false
                      ? "bg-orange-400 border-orange-400 text-white shadow-md" 
                      : "border-orange-200 text-gray-700 hover:bg-orange-100 hover:border-orange-300"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: false }))}
                >
                  <Users className="w-4 h-4" />
                  Shared Room
                </button>
              </div>
            </div>
           
            <button 
              className="w-full p-3 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
              <Check className="w-4 h-4" />
              Confirm Room Details
            </button>
          </div>
        );
        
      case 'multiselect':
        return (
          <div className="mt-4 space-y-4 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Select Amenities</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
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
                    className={`p-4 rounded-xl border text-left font-medium transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-orange-400 border-orange-400 text-white shadow-md" 
                        : "border-orange-200 text-gray-700 hover:bg-orange-100 hover:border-orange-300"
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
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      isSelected ? 'border-white bg-white' : 'border-orange-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-orange-400" />}
                    </div>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button 
              className="w-full p-3 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
              <Check className="w-4 h-4" />
              Confirm Selection
            </button>
          </div>
        );

      case 'included-items':
        return (
          <div className="mt-4 space-y-6 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Grid className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Included Items</h3>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 mb-4">Select items you're including:</p>
              {formData.includedItems.map((item) => (
                <button
                  key={item.id}
                  className={`w-full p-4 rounded-xl border text-left font-medium transition-all flex items-center gap-3 ${
                    item.selected
                      ? "bg-orange-400 border-orange-400 text-white shadow-md" 
                      : "border-orange-200 text-gray-700 hover:bg-orange-100 hover:border-orange-300"
                  }`}
                  onClick={() => {
                    const updatedItems = formData.includedItems.map(i => 
                      i.id === item.id ? { ...i, selected: !i.selected } : i
                    );
                    setFormData(prev => ({ ...prev, includedItems: updatedItems }));
                  }}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    item.selected ? 'border-white bg-white' : 'border-orange-300'
                  }`}>
                    {item.selected && <Check className="w-3 h-3 text-orange-400" />}
                  </div>
                  {item.name}
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
                className="w-full p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none transition-all"
                rows={3}
              />
            </div>
            
            <button 
              className="w-full p-3 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
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
              <Check className="w-4 h-4" />
              Confirm Included Items
            </button>
          </div>
        );
        
      case 'file':
        return (
          <div className="mt-4 space-y-4 bg-orange-50 p-6 rounded-2xl border border-orange-200">
            <div className="flex items-center gap-2 mb-4">
              <Camera className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-800">Upload Photos</h3>
            </div>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-medium text-gray-800">Photo Requirements:</p>
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
                  addSystemMessage("Some files were rejected. Please use JPG, PNG, or WebP format only. HEIC files are not supported.");
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
                  addSystemMessage("Some files were rejected. Please use JPG, PNG, or WebP format only.");
                }
                
                setFormData(prev => ({ ...prev, photos: [...prev.photos, ...validFiles] }));
              }}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="w-full p-4 bg-white border-2 border-dashed border-orange-300 text-gray-700 rounded-xl hover:bg-orange-50 hover:border-orange-400 flex items-center justify-center transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus size={20} className="mr-2 text-orange-400" />
                Choose Photos
              </button>
              
              <button 
                className="w-full p-4 bg-white border-2 border-dashed border-orange-300 text-gray-700 rounded-xl hover:bg-orange-50 hover:border-orange-400 flex items-center justify-center transition-all"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={20} className="mr-2 text-orange-400" />
                Take Photo
              </button>
            </div>
            
            {formData.photos.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-600 font-medium flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-orange-400" />
                    {formData.photos.length} photo{formData.photos.length !== 1 ? 's' : ''} selected
                  </p>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, photos: [] }))}
                    className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {formData.photos.slice(0, 9).map((file, index) => (
                    <div key={index} className="relative aspect-square rounded-xl bg-gray-200 overflow-hidden border border-orange-200">
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
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {formData.photos.length > 9 && (
                    <div className="aspect-square rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-sm font-medium border border-orange-200">
                      +{formData.photos.length - 9} more
                    </div>
                  )}
                </div>
                
                {formData.photos.length < 3 && (
                  <div className="bg-orange-100 border border-orange-300 rounded-xl p-4 mb-4">
                    <p className="text-orange-800 text-sm flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      You need at least 3 photos. Please add {3 - formData.photos.length} more photo{3 - formData.photos.length !== 1 ? 's' : ''}.
                    </p>
                  </div>
                )}
                
                <button 
                  className={`w-full p-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 ${
                    formData.photos.length >= 3
                      ? "bg-orange-400 text-white hover:bg-orange-500"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                  onClick={() => {
                    if (formData.photos.length >= 3) {
                      input.action(formData.photos);
                    }
                  }}
                  disabled={formData.photos.length < 3}
                >
                  {formData.photos.length >= 3 ? (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {formData.photos.length} Photos
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4" />
                      Need {3 - formData.photos.length} More Photo{3 - formData.photos.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Show loading while auth is checking */}
      {loading && (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
        </div>
      )}

      {/* If not authenticated, show message while redirecting */}
      {!loading && !user && (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400 mx-auto mb-4"></div>
            <p className="text-gray-600">Please sign in to create listings. Redirecting...</p>
          </div>
        </div>
      )}

{!loading && user && showIntroScreen && (
  <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl border border-orange-200 max-w-2xl w-full p-8">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <Home className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Your Listing</h1>
        <p className="text-gray-600">You can fill in up to 18 steps to give guests a complete view of your sublet.</p>
      </div>
      
      {/* Progress Bar Preview */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">18 steps</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-orange-400 h-2 rounded-full w-0 transition-all duration-500"></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">Many steps are optional - you can always edit later</p>
      </div>

     {savedDrafts.map((draft) => (
  <div
    key={draft.id}
    className="bg-orange-50 border border-orange-200 rounded-lg p-4 hover:bg-orange-100 transition-colors"
  >
    <div className="flex items-center justify-between">
      <div 
        className="flex-1 cursor-pointer"
        onClick={() => {
          // Load draft data
          setFormData(draft);
          setShowIntroScreen(false);
          setHasInitialized(true);
          
          // Continue from where user left off
          const timeout = setTimeout(() => {
            addSystemMessage("Welcome back! Let's continue where you left off. What would you like to do next?", [
              { 
                value: "continue", 
                label: "Continue editing", 
                icon: "edit",
                action: () => {
                  // Determine next step based on completion
                  if (!draft.listingType) {
                    handleListingTypeSelect(null);
                  } else if (!draft.preferredGender) {
                    askGenderPreference();
                  } else {
                    showListingSummaryWithData(draft);
                  }
                }
              },
              { 
                value: "summary", 
                label: "View summary", 
                icon: "eye",
                action: () => showListingSummaryWithData(draft) 
              },
            ], undefined, "draftContinue");
          }, 100);
          timeoutRefs.current.push(timeout);
        }}
      >
        <h4 className="font-medium text-gray-800">
          {draft.listingTitle || `${draft.listingType || 'Draft'} in ${draft.location || 'Campus Area'}`}
        </h4>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-sm text-orange-600 font-medium">
            {draft.completionPercentage || 0}% complete
          </span>
          <span className="text-xs text-gray-500">
            Last saved: {draft.lastSaved.toLocaleDateString()}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-12 h-2 bg-gray-200 rounded-full">
          <div 
            className="h-2 bg-orange-400 rounded-full transition-all"
            style={{ width: `${draft.completionPercentage || 0}%` }}
          ></div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Are you sure you want to delete this draft?')) {
              deleteDraft(draft.id);
            }
          }}
          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
          title="Delete draft"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
))}

      
      <div className="space-y-3">
        <button
          onClick={() => {
            setShowIntroScreen(false);
            setHasInitialized(true);
            const timeout = setTimeout(() => {
              setMessages([{
                id: Date.now(),
                text: "Let's create a listing for your space! What type of listing are you posting?",
                isUser: false,
                timestamp: new Date(),
                step: "listingType",
                options: [
                  { 
                    value: "Sublet", 
                    label: "Sublet", 
                    icon: "home",
                    action: () => handleListingTypeSelect("Sublet") 
                  },
                  { 
                    value: "Lease Takeover", 
                    label: "Lease Takeover", 
                    icon: "fileText",
                    action: () => handleListingTypeSelect("Lease Takeover") 
                  },
                  { 
                    value: "Room in Shared Unit", 
                    label: "Room in Shared Unit", 
                    icon: "users",
                    action: () => handleListingTypeSelect("Room in Shared Unit") 
                  },
                ]
              }]);
            }, 100);
            timeoutRefs.current.push(timeout);
          }}
          className="w-full p-4 bg-orange-400 text-white rounded-xl hover:bg-orange-500 font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
        >
          <Home className="w-5 h-5" />
          {savedDrafts.length > 0 ? 'Start New Listing' : 'Start Now'}
        </button>
        
        <button
          onClick={() => {
            router.push('/find');
          }}
          className="w-full p-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Skip & Fill Later
        </button>
      </div>
    </div>
  </div>
)}


      {/* Main content - only show if user is authenticated */}
      {!loading && user && (
        <>
          {/* Header */}
          <div className="bg-white shadow-sm border-b sticky top-0 z-50 backdrop-blur-sm bg-white/95">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-all duration-200 p-2 rounded-lg hover:bg-orange-50 hover:scale-105 active:scale-95"
          >
            <ArrowLeft size={20} className="transition-transform group-hover:-translate-x-1" />
            <span className="hidden sm:inline font-medium">Back</span>
          </button>
          
<div className="text-center">
  <h1 className="text-lg font-semibold text-gray-800">Create Listing</h1>
  <div className="flex items-center gap-2 mt-1">
    <div className="w-32 bg-gray-200 rounded-full h-2">
      <div 
        className="bg-orange-400 h-2 rounded-full transition-all duration-500" 
        style={{ width: `${completionPercentage}%` }}
      ></div>
    </div>
    <span className="text-xs text-gray-500">{completionPercentage}% complete</span>
  </div>
  <p className="text-xs text-gray-500 mt-1">Step {Math.min(currentStep, 18)} of 18</p>
</div>

{/* Save Draft and Preview Buttons */}
<div className="flex items-center gap-2">
  <button
    onClick={saveDraft}
    className={`px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 ${
      draftSaved 
        ? 'bg-green-100 text-green-700' 
        : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
    }`}
  >
    {draftSaved ? (
      <>
        <Check className="w-4 h-4" />
        Saved
      </>
    ) : (
      <>
        <Plus className="w-4 h-4" />
        Save Draft
      </>
    )}
  </button>


    {completionPercentage >= 60 && (
    <button
      onClick={() => showListingPreview()}
      className="px-3 py-1.5 text-sm rounded-lg transition-all flex items-center gap-1 bg-blue-100 text-blue-700 hover:bg-blue-200"
    >
      <Eye className="w-4 h-4" />
      Preview
    </button>
  )}
</div>



          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 transition-all duration-200 p-2 rounded-lg hover:bg-orange-50 hover:scale-105 active:scale-95"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                <span className="text-orange-600 font-bold text-sm">
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
              <ChevronDown className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {/* User Dropdown */}
            {showUserMenu && (
              <>
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-200 animate-in slide-in-from-top-2 duration-200">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                        <span className="text-orange-600 font-bold">
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
                      <User size={16} className="mr-3 group-hover:scale-110 transition-transform text-orange-400" />
                      <span className="font-medium">Profile Settings</span>
                      <ArrowLeft size={16} className="ml-auto text-gray-400 group-hover:text-orange-300 group-hover:translate-x-1 transition-all rotate-180" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/dashboard');
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 group"
                    >
                      <Grid size={16} className="mr-3 group-hover:scale-110 transition-transform text-orange-400" />
                      <span className="font-medium">My Dashboard</span>
                      <ArrowLeft size={16} className="ml-auto text-gray-400 group-hover:text-orange-300 group-hover:translate-x-1 transition-all rotate-180" />
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        router.push('/listings');
                      }}
                      className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-all duration-150 group"
                    >
                      <List size={16} className="mr-3 group-hover:scale-110 transition-transform text-orange-400" />
                      <span className="font-medium">My Listings</span>
                      <ArrowLeft size={16} className="ml-auto text-gray-400 group-hover:text-orange-300 group-hover:translate-x-1 transition-all rotate-180" />
                    </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  {/* Sign Out */}
                  <button
                    onClick={() => {
                      signOut();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-150 group"
                  >
                    <LogOut size={16} className="mr-3 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Sign Out</span>
                    <ArrowLeft size={16} className="ml-auto text-red-400 group-hover:text-red-500 group-hover:translate-x-1 transition-all rotate-180" />
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-4">
        <div className="bg-white min-h-[calc(100vh-120px)] flex flex-col rounded-2xl shadow-xl border border-orange-200">
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
                      className="absolute -top-2 -right-2 bg-orange-100 hover:bg-orange-200 text-orange-600 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 shadow-sm"
                    >
                      <Edit3 size={12} />
                    </button>
                  )}
                  
                  <div
                    className={`px-4 py-3 rounded-2xl shadow-sm ${
                      message.isUser
                        ? 'bg-orange-400 text-white ml-auto rounded-br-md'
                        : 'bg-gray-50 text-gray-800 mr-auto rounded-bl-md border border-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</div>
                    {message.options && (
                      <div className="mt-4 space-y-2">
                        {message.options.map((option, index) => (
                          <button
                            key={index}
                            onClick={option.action}
                            className="w-full text-left p-3 bg-white text-gray-800 rounded-xl border border-orange-200 hover:bg-orange-50 hover:border-orange-300 transition-all text-sm font-medium shadow-sm flex items-center gap-3"
                          >
                            {option.icon && <IconComponent name={option.icon} size={16} className="text-orange-400" />}
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {message.input && renderCustomInput(message.input)}
                    <div className="text-xs opacity-70 mt-2 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-50 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input Area */}
          {showInput && (
            <div className="border-t bg-white p-4 sm:p-6 rounded-b-2xl border-orange-200">
              <form onSubmit={handleTextInputSubmit} className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 p-3 rounded-xl border border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent transition-all bg-orange-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="px-4 py-3 bg-orange-400 text-white rounded-xl hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center justify-center"
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