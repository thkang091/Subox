"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Plus } from "lucide-react";

// Types
type ListingType = "Sublet" | "Lease Takeover" | "Room in Shared Unit" | null;
type LocationOption = "Dinkytown" | "East Bank" | "West Bank" | "Stadium Village" | 
  "Saint Paul Campus" | "Downtown Minneapolis" | "Southeast Como" | "Prospect Park" | null;
type DateOption = "Summer (May–Aug)" | "Fall (Sept–Dec)" | "Spring (Jan–Apr)" | "Full Year" | "Custom" | null;
type Gender = "Any" | "Male" | "Female" | "Non-binary" | null;
type Level = "Low" | "Medium" | "High" | null;

// Interfaces
interface ListingData {
  listingType: ListingType;
  startDate: string;
  endDate: string;
  dateOption: DateOption;
  selectedMonths: string[];
  location: LocationOption;
  showExactAddress: boolean;
  address: string;
  rent: number;
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
  includedItems: {id: string; name: string; selected: boolean}[];
  photos: File[];
  partialDatesOk: boolean | null;
}

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
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

export default function ListingFormPage() {
  const router = useRouter();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [messageIdCounter, setMessageIdCounter] = useState(1);
  
  const [formData, setFormData] = useState<ListingData>({
    listingType: null,
    startDate: "",
    endDate: "",
    dateOption: null,
    selectedMonths: [],
    location: null,
    showExactAddress: false,
    address: "",
    rent: 0,
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
    includedItems: [
      { id: "desk", name: "Desk", selected: false },
      { id: "chair", name: "Chair", selected: false },
      { id: "mini-fridge", name: "Mini fridge", selected: false },
      { id: "kitchenware", name: "Kitchenware", selected: false },
      { id: "mattress", name: "Mattress", selected: false },
      { id: "bookshelf", name: "Bookshelf", selected: false },
    ],
    photos: [],
    partialDatesOk: null,
  });

  // Effects
  useEffect(() => {
    // Initialize chat with first message
    addSystemMessage(
      "Hi! Let's create a listing for your space 🏠\n\nWhat type of listing are you posting?",
      [
        { value: "Sublet", label: "Sublet", action: () => handleListingTypeSelect("Sublet") },
        { value: "Lease Takeover", label: "Lease Takeover", action: () => handleListingTypeSelect("Lease Takeover") },
        { value: "Room in Shared Unit", label: "Room in Shared Unit", action: () => handleListingTypeSelect("Room in Shared Unit") },
      ]
    );
  }, []);
  
  // Auto-scroll to the bottom when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Chat Message Functions
  const addMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>, delay = 0) => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        ...message,
        id: messageIdCounter,
        timestamp: new Date()
      }]);
      setMessageIdCounter(prev => prev + 1);
      if (delay > 0) {
        setIsTyping(false);
      }
    }, delay);
  };
  
  const addUserMessage = (text: string) => {
    addMessage({ text, isUser: true });
  };
  
  const addSystemMessage = (text: string, options?: ChatMessage['options'], input?: ChatMessage['input']) => {
    setIsTyping(true);
    setShowInput(false);
    addMessage({ text, isUser: false, options, input }, 1200);
    
    if (input && (input.type === "text" || input.type === "number")) {
      setTimeout(() => {
        setShowInput(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 1300);
    }
  };

  // Navigation Functions
  const goToNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  // Submit Handler
  const handleSubmitForm = () => {
    console.log("Form submitted:", formData);
    addSystemMessage("🎉 Your listing has been successfully created!\n\nRedirecting to your dashboard...");
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  // Form Input Handlers
  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Find the last message with input action
    const lastInputMessage = [...messages].reverse().find(m => m.input);
    
    if (lastInputMessage?.input) {
      if (lastInputMessage.input.type === "text") {
        lastInputMessage.input.action(inputValue);
      } else if (lastInputMessage.input.type === "number") {
        lastInputMessage.input.action(Number(inputValue));
      }
    }
    
    setInputValue("");
    setShowInput(false);
  };

  // Step 1: Listing Type
  const handleListingTypeSelect = (type: ListingType) => {
    setFormData(prev => ({ ...prev, listingType: type }));
    addUserMessage(type as string);
    goToNextStep();
    
    // Ask about availability
    setTimeout(() => {
      addSystemMessage(
        "Perfect! 📅\n\nWhen is your place available?",
        [
          { 
            value: "Summer (May–Aug)", 
            label: "Summer (May–Aug)", 
            action: () => handleDateOptionSelect("Summer (May–Aug)") 
          },
          { 
            value: "Fall (Sept–Dec)", 
            label: "Fall (Sept–Dec)", 
            action: () => handleDateOptionSelect("Fall (Sept–Dec)") 
          },
          { 
            value: "Spring (Jan–Apr)", 
            label: "Spring (Jan–Apr)", 
            action: () => handleDateOptionSelect("Spring (Jan–Apr)") 
          },
          { 
            value: "Full Year", 
            label: "Full Year", 
            action: () => handleDateOptionSelect("Full Year") 
          },
          { 
            value: "Custom", 
            label: "Custom dates", 
            action: () => handleDateOptionSelect("Custom") 
          },
        ]
      );
    }, 500);
  };

  // Step 2: Availability
  const handleDateOptionSelect = (option: DateOption) => {
    setFormData(prev => ({ ...prev, dateOption: option }));
    addUserMessage(option as string);
    
    if (option === "Custom") {
      // Ask for custom date range
      addSystemMessage("Please select your start and end dates:", undefined, {
        type: "date-range",
        action: (dates: {start: string, end: string}) => {
          setFormData(prev => ({ 
            ...prev, 
            startDate: dates.start, 
            endDate: dates.end 
          }));
          addUserMessage(`From ${dates.start} to ${dates.end}`);
          goToNextStep();
          setTimeout(() => askLocation(), 500);
        }
      });
    } else {
      // Pre-set date ranges based on selection
      const currentYear = new Date().getFullYear();
      let startDate = "";
      let endDate = "";
      
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
      }
      
      setFormData(prev => ({ 
        ...prev, 
        startDate, 
        endDate
      }));
      
      goToNextStep();
      setTimeout(() => askLocation(), 500);
    }
  };

  // Step 3: Location
  const askLocation = () => {
    addSystemMessage(
      "Great! 📍\n\nWhere is your place located?",
      [
        { value: "Dinkytown", label: "Dinkytown", action: () => handleLocationSelect("Dinkytown") },
        { value: "East Bank", label: "East Bank", action: () => handleLocationSelect("East Bank") },
        { value: "West Bank", label: "West Bank", action: () => handleLocationSelect("West Bank") },
        { value: "Stadium Village", label: "Stadium Village", action: () => handleLocationSelect("Stadium Village") },
        { value: "Saint Paul Campus", label: "Saint Paul Campus", action: () => handleLocationSelect("Saint Paul Campus") },
        { value: "Downtown Minneapolis", label: "Downtown Minneapolis", action: () => handleLocationSelect("Downtown Minneapolis") },
        { value: "Southeast Como", label: "Southeast Como", action: () => handleLocationSelect("Southeast Como") },
        { value: "Prospect Park", label: "Prospect Park", action: () => handleLocationSelect("Prospect Park") },
      ]
    );
  };

  const handleLocationSelect = (location: LocationOption) => {
    setFormData(prev => ({ ...prev, location }));
    addUserMessage(location as string);
    
    // Ask about showing exact address
    setTimeout(() => {
      addSystemMessage(
        "Do you want to display the exact address or just the neighborhood?",
        [
          { 
            value: "show-address", 
            label: "Show exact address", 
            action: () => handleAddressVisibilitySelect(true) 
          },
          { 
            value: "hide-address", 
            label: "Only show neighborhood", 
            action: () => handleAddressVisibilitySelect(false) 
          },
        ]
      );
    }, 500);
  };

  const handleAddressVisibilitySelect = (showExact: boolean) => {
    setFormData(prev => ({ ...prev, showExactAddress: showExact }));
    addUserMessage(showExact ? "Show exact address" : "Only show neighborhood");
    
    if (showExact) {
      // Ask for address input
      setTimeout(() => {
        addSystemMessage("Please enter your address:", undefined, {
          type: "text",
          placeholder: "Enter your address",
          action: (address: string) => {
            setFormData(prev => ({ ...prev, address }));
            addUserMessage(address);
            goToNextStep();
            setTimeout(() => askRentPrice(), 500);
          }
        });
      }, 500);
    } else {
      goToNextStep();
      setTimeout(() => askRentPrice(), 500);
    }
  };

  // Step 4: Price
  const askRentPrice = () => {
    addSystemMessage("How much is the monthly rent? 💰", undefined, {
      type: "number",
      placeholder: "Enter monthly rent",
      action: (rent: number) => {
        setFormData(prev => ({ ...prev, rent }));
        addUserMessage(`$${rent} per month`);
        
        // Ask about utilities
        setTimeout(() => {
          addSystemMessage(
            "Are utilities included in the rent?",
            [
              { 
                value: "utilities-yes", 
                label: "Yes, utilities included", 
                action: () => handleUtilitiesIncluded(true) 
              },
              { 
                value: "utilities-no", 
                label: "No, utilities not included", 
                action: () => handleUtilitiesIncluded(false) 
              },
            ]
          );
        }, 500);
      }
    });
  };

  const handleUtilitiesIncluded = (included: boolean) => {
    setFormData(prev => ({ ...prev, utilitiesIncluded: included }));
    addUserMessage(included ? "Yes, utilities are included" : "No, utilities are not included");
    goToNextStep();
    setTimeout(() => askRoomsDetails(), 500);
  };

  // Step 5: Rooms
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
        addUserMessage(`${details.bedrooms} bedroom(s), ${details.bathrooms} bathroom(s), ${details.isPrivate ? 'Private' : 'Shared'} room`);
        goToNextStep();
        setTimeout(() => askAmenities(), 500);
      }
    });
  };

  // Step 6: Amenities
  const askAmenities = () => {
    addSystemMessage(
      "Which amenities does your place include? 🏠\n\n(Select all that apply)",
      undefined,
      {
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
            
          addUserMessage(`Selected amenities: ${selectedAmenities || "None"}`);
          goToNextStep();
          setTimeout(() => askRoommates(), 500);
        }
      }
    );
  };

  // Step 7: Roommates
  const askRoommates = () => {
    addSystemMessage(
      "Will you have roommates? 👥",
      [
        { 
          value: "roommates-yes", 
          label: "Yes", 
          action: () => handleRoommatesAnswer(true) 
        },
        { 
          value: "roommates-no", 
          label: "No", 
          action: () => handleRoommatesAnswer(false) 
        },
      ]
    );
  };

  const handleRoommatesAnswer = (hasRoommates: boolean) => {
    setFormData(prev => ({ ...prev, hasRoommates }));
    addUserMessage(hasRoommates ? "Yes, I will have roommates" : "No roommates");
    
    if (hasRoommates) {
      // Ask about roommate preferences
      setTimeout(() => askRoommatePreferences(), 500);
    } else {
      goToNextStep();
      setTimeout(() => askIncludedItems(), 500);
    }
  };

  const askRoommatePreferences = () => {
    // First ask about gender preference
    addSystemMessage(
      "Do you have a gender preference for roommates?",
      [
        { value: "gender-any", label: "Any", action: () => handleGenderPreference("Any") },
        { value: "gender-male", label: "Male", action: () => handleGenderPreference("Male") },
        { value: "gender-female", label: "Female", action: () => handleGenderPreference("Female") },
        { value: "gender-nonbinary", label: "Non-binary", action: () => handleGenderPreference("Non-binary") },
      ]
    );
  };

  const handleGenderPreference = (gender: Gender) => {
    setFormData(prev => ({ 
      ...prev, 
      roommatePreferences: {
        ...prev.roommatePreferences,
        gender
      }
    }));
    addUserMessage(`Gender preference: ${gender}`);
    
    // Ask about pets
    setTimeout(() => {
      addSystemMessage(
        "Are pets allowed? 🐕",
        [
          { value: "pets-yes", label: "Yes", action: () => handlePetsPreference(true) },
          { value: "pets-no", label: "No", action: () => handlePetsPreference(false) },
        ]
      );
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
    addUserMessage(`Pets allowed: ${petsAllowed ? "Yes" : "No"}`);
    
    // Ask about smoking
    setTimeout(() => {
      addSystemMessage(
        "Is smoking allowed? 🚭",
        [
          { value: "smoking-yes", label: "Yes", action: () => handleSmokingPreference(true) },
          { value: "smoking-no", label: "No", action: () => handleSmokingPreference(false) },
        ]
      );
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
    addUserMessage(`Smoking allowed: ${smokingAllowed ? "Yes" : "No"}`);
    
    // Ask about noise level
    setTimeout(() => {
      addSystemMessage(
        "Preferred noise level? 🔊",
        [
          { value: "noise-low", label: "Low", action: () => handleNoisePreference("Low") },
          { value: "noise-medium", label: "Medium", action: () => handleNoisePreference("Medium") },
          { value: "noise-high", label: "High", action: () => handleNoisePreference("High") },
        ]
      );
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
    addUserMessage(`Noise level: ${noiseLevel}`);
    
    // Ask about cleanliness
    setTimeout(() => {
      addSystemMessage(
        "Preferred cleanliness level? ✨",
        [
          { value: "clean-low", label: "Low", action: () => handleCleanlinessPreference("Low") },
          { value: "clean-medium", label: "Medium", action: () => handleCleanlinessPreference("Medium") },
          { value: "clean-high", label: "High", action: () => handleCleanlinessPreference("High") },
        ]
      );
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
    addUserMessage(`Cleanliness level: ${cleanlinessLevel}`);
    
    goToNextStep();
    setTimeout(() => askIncludedItems(), 500);
  };

  // Step 8: Included Items
  const askIncludedItems = () => {
    addSystemMessage(
      "Are you including any furniture or items? 📦\n\n(Select all that apply)",
      undefined,
      {
        type: "multiselect",
        options: formData.includedItems.map(item => ({ value: item.id, label: item.name })),
        action: (selectedIds: string[]) => {
          const updatedItems = formData.includedItems.map(item => ({
            ...item,
            selected: selectedIds.includes(item.id)
          }));
          
          setFormData(prev => ({ ...prev, includedItems: updatedItems }));
          
          const selectedItems = updatedItems
            .filter(i => i.selected)
            .map(i => i.name)
            .join(", ");
            
          addUserMessage(`Included items: ${selectedItems || "None"}`);
          goToNextStep();
          setTimeout(() => askPhotos(), 500);
        }
      }
    );
  };

  // Step 9: Photos
  const askPhotos = () => {
    addSystemMessage(
      "Please upload at least 3 photos 📸\n\n(bedroom, bathroom, living space, etc.)",
      undefined,
      {
        type: "file",
        action: (files: File[]) => {
          setFormData(prev => ({ ...prev, photos: files }));
          addUserMessage(`Uploaded ${files.length} photos`);
          goToNextStep();
          setTimeout(() => askPartialAvailability(), 500);
        }
      }
    );
  };

  // Step 10: Partial Availability
  const askPartialAvailability = () => {
    addSystemMessage(
      "Are you open to renting for just part of the dates? 📅\n\n(e.g., if your lease is June to August, would you consider renting just for June?)",
      [
        { 
          value: "partial-yes", 
          label: "Yes, I'm flexible with dates", 
          action: () => handlePartialAvailability(true) 
        },
        { 
          value: "partial-no", 
          label: "No, I need the entire period covered", 
          action: () => handlePartialAvailability(false) 
        },
      ]
    );
  };

  const handlePartialAvailability = (partialOk: boolean) => {
    setFormData(prev => ({ ...prev, partialDatesOk: partialOk }));
    addUserMessage(partialOk ? "Yes, I'm flexible with dates" : "No, I need the entire period covered");
    
    // Show summary and confirm
    setTimeout(() => showListingSummary(), 500);
  };

  // Final Summary
  const showListingSummary = () => {
    const selectedAmenities = formData.amenities
      .filter(a => a.selected)
      .map(a => a.name)
      .join(", ");
      
    const selectedItems = formData.includedItems
      .filter(i => i.selected)
      .map(i => i.name)
      .join(", ");
    
    const summary = `Here's your listing summary! ✨

📝 Type: ${formData.listingType}
📅 Available: ${formData.startDate} to ${formData.endDate}
📍 Location: ${formData.location}${formData.showExactAddress ? ` (${formData.address})` : ''}
💵 Rent: $${formData.rent}/month (Utilities ${formData.utilitiesIncluded ? 'included' : 'not included'})
🛏️ Space: ${formData.bedrooms} bedroom(s), ${formData.bathrooms} bathroom(s), ${formData.isPrivateRoom ? 'Private' : 'Shared'} room
🏠 Amenities: ${selectedAmenities || "None"}
${formData.hasRoommates ? `👥 Roommate Preferences: Gender (${formData.roommatePreferences.gender}), Pets (${formData.roommatePreferences.petsAllowed ? 'Yes' : 'No'}), Smoking (${formData.roommatePreferences.smokingAllowed ? 'Yes' : 'No'}), Noise (${formData.roommatePreferences.noiseLevel}), Cleanliness (${formData.roommatePreferences.cleanlinessLevel})` : ''}
📦 Included Items: ${selectedItems || "None"}
📸 Photos: ${formData.photos.length} uploaded
⏰ Partial availability: ${formData.partialDatesOk ? 'Yes' : 'No'}`;
    
    addSystemMessage(
      summary,
      [
        { 
          value: "confirm", 
          label: "✅ Confirm and publish listing", 
          action: handleSubmitForm 
        },
        { 
          value: "edit", 
          label: "✏️ Edit listing", 
          action: () => {
            addSystemMessage("What would you like to edit?");
            // Here you could add logic to go back to specific steps
          } 
        },
      ]
    );
  };

  // Format timestamp for messages
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Custom Components for different input types
  const renderCustomInput = (input: ChatMessage['input']) => {
    if (!input) return null;
    
    switch (input.type) {
      case 'date-range':
        return (
          <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl">
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Start Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, startDate: e.target.value }));
                }}
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">End Date</label>
              <input
                type="date"
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, endDate: e.target.value }));
                }}
              />
            </div>
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
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
        
      case 'rooms':
        return (
          <div className="mt-4 space-y-4 bg-gray-50 p-4 rounded-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Bedrooms</label>
                <select 
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: Number(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-gray-700">Bathrooms</label>
                <select 
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: Number(e.target.value) }))}
                >
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">Room Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-3 rounded-lg border font-medium transition-colors ${
                    formData.isPrivateRoom === true 
                      ? "bg-blue-500 border-blue-500 text-white" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: true }))}
                >
                  Private Room
                </button>
                <button
                  className={`p-3 rounded-lg border font-medium transition-colors ${
                    formData.isPrivateRoom === false 
                      ? "bg-blue-500 border-blue-500 text-white" 
                      : "border-gray-300 text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPrivateRoom: false }))}
                >
                  Shared Room
                </button>
              </div>
            </div>
            <button 
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
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
          <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl">
            <div className="grid grid-cols-1 gap-2">
              {input.options?.map((option) => {
                // For amenities
                const isAmenitySelected = formData.amenities.some(
                  a => a.id === option.value && a.selected
                );
                
                // For included items
                const isItemSelected = formData.includedItems.some(
                  i => i.id === option.value && i.selected
                );
                
                const isSelected = isAmenitySelected || isItemSelected;
                
                return (
                  <button
                    key={option.value}
                    className={`p-3 rounded-lg border text-left font-medium transition-colors ${
                      isSelected
                        ? "bg-blue-500 border-blue-500 text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => {
                      // Check if this is an amenity
                      if (formData.amenities.some(a => a.id === option.value)) {
                        const updatedAmenities = formData.amenities.map(amenity => 
                          amenity.id === option.value 
                            ? { ...amenity, selected: !amenity.selected }
                            : amenity
                        );
                        setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
                      } 
                      // Check if this is an included item
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
              className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
              onClick={() => {
                // Figure out if we're dealing with amenities or included items
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
        
      case 'file':
        return (
          <div className="mt-4 space-y-3 bg-gray-50 p-4 rounded-xl">
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                setFormData(prev => ({ ...prev, photos: files }));
              }}
            />
            <button 
              className="w-full p-4 bg-white border-2 border-dashed border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={20} className="mr-2" />
              Select Photos
            </button>
            
            {formData.photos.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3 font-medium">{formData.photos.length} photos selected</p>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {Array.from(formData.photos).slice(0, 6).map((file, index) => (
                    <div key={index} className="aspect-square rounded-lg bg-gray-200 overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {formData.photos.length > 6 && (
                    <div className="aspect-square rounded-lg bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                      +{formData.photos.length - 6} more
                    </div>
                  )}
                </div>
                
                <button 
                  className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                  onClick={() => {
                    if (formData.photos.length >= 1) {
                      input.action(formData.photos);
                    } else {
                      addSystemMessage("Please upload at least 3 photos of your space.");
                    }
                  }}
                >
                  Upload {formData.photos.length} Photos
                </button>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  // Main UI Render
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* iPhone-style Header */}
      <header className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center">
        <button 
          onClick={() => router.back()}
          className="mr-3 p-2 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} className="text-blue-500" />
        </button>
        
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">Subox</h1>
            <p className="text-xs text-gray-500">Creating your listing...</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-500">
          {currentStep}/10
        </div>
      </header>
      
      {/* Chat Messages Container */}
      <main className="flex-1 bg-white overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Chat Messages */}
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs ${message.isUser ? 'order-2' : 'order-1'}`}>
                <div 
                  className={`px-4 py-3 rounded-2xl whitespace-pre-line ${
                    message.isUser 
                      ? 'bg-blue-500 text-white rounded-br-md' 
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  {message.text}
                  
                  {/* Option Buttons */}
                  {message.options && message.options.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {message.options.map((option) => (
                        <button
                          key={option.value}
                          onClick={option.action}
                          className="block w-full text-left px-3 py-2 bg-white text-gray-800 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Custom Input UI */}
                  {message.input && renderCustomInput(message.input)}
                </div>
                
                {/* Message timestamp */}
                <div className={`text-xs text-gray-400 mt-1 ${
                  message.isUser ? 'text-right' : 'text-left'
                }`}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-xs">
                <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Auto-scroll anchor */}
          <div ref={chatEndRef}></div>
        </div>
        
        {/* Input Area */}
        {showInput && (
          <div className="border-t border-gray-200 bg-white p-4">
            <form onSubmit={handleTextInputSubmit} className="flex items-center space-x-3">
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type={messages[messages.length - 1]?.input?.type === "number" ? "number" : "text"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={messages[messages.length - 1]?.input?.placeholder || "Type a message..."}
                  className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                />
                {messages[messages.length - 1]?.input?.type === "number" && (
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">
                    $
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}