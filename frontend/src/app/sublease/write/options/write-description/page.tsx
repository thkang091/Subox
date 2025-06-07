"use client"

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare,
  DollarSign,
  Home,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Wifi,
  Car,
  PawPrint,
  Sofa,
  User,
  Users,
  Bed,
  Bath,
  Eye,
  X
} from "lucide-react";

// Import LocationPicker component
import LocationPicker from '../../../../../components/LocationPicker';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'location' | 'analyzed-data' | 'edit-data' | 'yes-no';
  questionKey?: string;
  input?: {
    type: string;
    placeholder?: string;
    action: (value: any) => void;
  };
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

interface QuestionConfig {
  key: string;
  question: string;
  type: 'text' | 'location' | 'yes-no';
  icon?: any;
  required: boolean;
  inputType?: string; // 'text', 'number', 'email', 'tel', 'date'
  placeholder?: string;
}

interface ListingData {
  listingType: any;
  rent: number;
  deposit: number;
  bedrooms: number;
  bathrooms: number;
  location: string;
  address: string;
  availableFrom: string;
  availableTo: string;
  furnished: boolean;
  utilitiesIncluded: boolean;
  petFriendly: boolean;
  contactInfo: string;
  description: string;
  cleanedDescription: string;
  amenities: any[];
  photos: any[];
  roommatePreferences: {
    gender: any;
    petsAllowed: any;
    smokingAllowed: any;
    noiseLevel: any;
    cleanlinessLevel: any;
  };
  hasRoommates: any;
  partialDatesOk: any;
  additionalNotes: string;
  questionAnswers: any[];
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function WriteDescriptionPage() {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  // Form state
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [currentInputAction, setCurrentInputAction] = useState<((value: any) => void) | null>(null);
  
  // Question flow state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<QuestionConfig[]>([]);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: any}>({});
  
  // Data state
  const [extractedData, setExtractedData] = useState<any>(null);
  const [cleanedDescription, setCleanedDescription] = useState("");
  const [showAnalyzedData, setShowAnalyzedData] = useState(false);
  const extractedDataRef = useRef<any>(null);

  
  // Processing steps
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([
    {
      id: 'analyze',
      label: 'Analyzing Text',
      status: 'pending',
      description: 'Understanding your description'
    },
    {
      id: 'translate',
      label: 'Translation Check',
      status: 'pending',
      description: 'Auto-translating if needed'
    },
    {
      id: 'cleanup',
      label: 'Grammar & Style',
      status: 'pending',
      description: 'Fixing typos and improving clarity'
    },
    {
      id: 'extract',
      label: 'Extract Details',
      status: 'pending',
      description: 'Finding key information'
    },
    {
      id: 'questions',
      label: 'Generate Questions',
      status: 'pending',
      description: 'Identifying missing details'
    }
  ]);
  
  // Complete listing data structure
  const [listingData, setListingData] = useState<ListingData>({
    listingType: null,
    rent: 0,
    deposit: 0,
    bedrooms: 0,
    bathrooms: 0,
    location: "",
    address: "",
    availableFrom: "",
    availableTo: "",
    furnished: false,
    utilitiesIncluded: false,
    petFriendly: false,
    contactInfo: "",
    description: "",
    cleanedDescription: "",
    amenities: [],
    photos: [],
    roommatePreferences: {
      gender: null,
      petsAllowed: null,
      smokingAllowed: null,
      noiseLevel: null,
      cleanlinessLevel: null,
    },
    hasRoommates: null,
    partialDatesOk: null,
    additionalNotes: "",
    questionAnswers: []
  });

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================
  
  // Sync extracted data with listing data when it's first received
// Improved useEffect for syncing extracted data with listing data
useEffect(() => {
    if (extractedData && Object.keys(extractedData).length > 0) {
      console.log("Syncing extracted data to listing data:", extractedData);
      setListingData(prev => {
        const updated = { ...prev };
        
        // Only update if we have valid values
        if (extractedData.rent !== null && extractedData.rent !== undefined && extractedData.rent > 0) {
          updated.rent = extractedData.rent;
        }
        
        if (extractedData.bedrooms !== null && extractedData.bedrooms !== undefined) {
          updated.bedrooms = extractedData.bedrooms;
        }
        
        if (extractedData.bathrooms !== null && extractedData.bathrooms !== undefined) {
          updated.bathrooms = extractedData.bathrooms;
        }
        
        if (extractedData.location && extractedData.location.trim().length > 0) {
          updated.location = extractedData.location;
          updated.address = extractedData.location;
        }
        
        if (extractedData.furnished !== null && extractedData.furnished !== undefined) {
          updated.furnished = extractedData.furnished;
        }
        
        if (extractedData.utilitiesIncluded !== null && extractedData.utilitiesIncluded !== undefined) {
          updated.utilitiesIncluded = extractedData.utilitiesIncluded;
        }
        
        if (extractedData.petFriendly !== null && extractedData.petFriendly !== undefined) {
          updated.petFriendly = extractedData.petFriendly;
        }
        
        if (extractedData.contactInfo && extractedData.contactInfo.trim().length > 0) {
          updated.contactInfo = extractedData.contactInfo;
        }
        
        if (extractedData.deposit !== null && extractedData.deposit !== undefined) {
          updated.deposit = extractedData.deposit;
        }
        
        if (extractedData.availableFrom && extractedData.availableFrom.trim().length > 0) {
          updated.availableFrom = extractedData.availableFrom;
        }
        
        if (extractedData.availableTo && extractedData.availableTo.trim().length > 0) {
          updated.availableTo = extractedData.availableTo;
        }
        
        // Always update description and cleaned description
        updated.description = description;
        updated.cleanedDescription = cleanedDescription;
        
        console.log("Updated listing data:", updated);
        return updated;
      });
    }
  }, [extractedData, description, cleanedDescription]);
  
  
  const handleBack = () => {
    router.push("/find");
  };

  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setProcessingSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================
  
  const callOpenAIAPI = async (step: string, description: string, itemData?: any) => {
    try {
      const response = await fetch('/api/process-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step,
          description,
          itemData
        }),
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API call failed for step ${step}:`, error);
      throw error;
    }
  };

  // ============================================================================
  // QUESTION GENERATION & CONVERSION
  // ============================================================================
  const convertAPIQuestionsToFormatWithData = (apiQuestions: string[], extractedDataParam: any): QuestionConfig[] => {
    const questions: QuestionConfig[] = [];
    
    // Use the parameter instead of state
    const extractedData = extractedDataParam;
    
    // Check what information we already have from extracted data
    const hasRent = extractedData?.rent !== null && 
                    extractedData?.rent !== undefined && 
                    extractedData?.rent > 0;
    
    const hasBedrooms = extractedData?.bedrooms !== null && 
                        extractedData?.bedrooms !== undefined;
    
    const hasBathrooms = extractedData?.bathrooms !== null && 
                         extractedData?.bathrooms !== undefined;
    
    const hasLocation = extractedData?.location && 
                        extractedData.location.trim().length > 0;
    
    const hasAvailabilityFrom = extractedData?.availableFrom && 
                                extractedData.availableFrom.trim().length > 0;
    
    const hasAvailabilityTo = extractedData?.availableTo && 
                              extractedData.availableTo.trim().length > 0;
    
    const hasAvailabilityDates = hasAvailabilityFrom && hasAvailabilityTo;
    
    const hasContactInfo = extractedData?.contactInfo && 
                           extractedData.contactInfo.trim().length > 0 &&
                           !extractedData.contactInfo.toLowerCase().includes('no contact');
    
    const hasDeposit = extractedData?.deposit !== null && 
                       extractedData?.deposit !== undefined;
    
    const hasFurnished = extractedData?.furnished !== null && 
                         extractedData?.furnished !== undefined;
    
    const hasUtilities = extractedData?.utilitiesIncluded !== null && 
                         extractedData?.utilitiesIncluded !== undefined;
    
    const hasPets = extractedData?.petFriendly !== null && 
                    extractedData?.petFriendly !== undefined;
  
    console.log("Data check with direct parameter:", {
      hasRent, 
      hasBedrooms, 
      hasBathrooms, 
      hasLocation, 
      hasAvailabilityDates, 
      hasContactInfo, 
      hasDeposit, 
      hasFurnished, 
      hasUtilities, 
      hasPets, 
      extractedData
    });
  
    // Essential questions - only ask if missing
    const essentialQuestions = [
      {
        condition: !hasRent,
        question: "What's the monthly rent for this place?",
        key: "rent_essential",
        type: "text" as const,
        inputType: "number",
        placeholder: "Enter rent amount (e.g., 1200)",
        icon: DollarSign,
        required: true
      },
      {
        condition: !hasDeposit,
        question: "What's the security deposit amount?",
        key: "deposit_essential", 
        type: "text" as const,
        inputType: "number",
        placeholder: "Enter deposit amount (e.g., 500) or 0 if none",
        icon: DollarSign,
        required: true
      },
      {
        condition: !hasBedrooms,
        question: "How many bedrooms does this place have?",
        key: "bedrooms_essential",
        type: "text" as const,
        inputType: "number",
        placeholder: "Enter number of bedrooms (e.g., 2 or 0 for studio)",
        icon: Bed,
        required: true
      },
      {
        condition: !hasBathrooms,
        question: "How many bathrooms does this place have?",
        key: "bathrooms_essential",
        type: "text" as const,
        inputType: "number",
        placeholder: "Enter number of bathrooms (e.g., 1.5)",
        icon: Bath,
        required: true
      },
      {
        condition: !hasLocation,
        question: "What's the location or address of this place?",
        key: "location_essential",
        type: "location" as const,
        icon: MapPin,
        required: true
      },
      {
        condition: !hasAvailabilityDates,
        question: "What are the availability dates? (Start date - End date)",
        key: "availability_essential",
        type: "text" as const,
        inputType: "text",
        placeholder: "e.g., January 15, 2025 - May 31, 2025",
        icon: Calendar,
        required: true
      },
      {
        condition: !hasContactInfo,
        question: "How should interested people contact you?",
        key: "contact_essential",
        type: "text" as const,
        inputType: "text",
        placeholder: "e.g., email@example.com or phone number",
        icon: Phone,
        required: true
      }
    ];
  
    // Add essential missing questions first
    essentialQuestions.forEach((eq) => {
      if (eq.condition) {
        console.log(`Adding essential question: ${eq.key} (condition: ${eq.condition})`);
        questions.push({
          key: eq.key,
          question: eq.question,
          type: eq.type,
          inputType: eq.inputType,
          placeholder: eq.placeholder,
          icon: eq.icon,
          required: eq.required
        });
      } else {
        console.log(`Skipping essential question: ${eq.key} (already have data)`);
      }
    });
  
    // If we have all essential data, no need to process additional questions
    if (questions.length === 0) {
      console.log("All essential data present, skipping additional questions");
      return questions;
    }
    
    // Process API questions for additional details only if not already covered
    apiQuestions.forEach((question, index) => {
      const lowerQuestion = question.toLowerCase();
      
      // Skip if we already have or asked for this information
      if ((lowerQuestion.includes('rent') || lowerQuestion.includes('price')) && 
          (hasRent || questions.some(q => q.key.includes('rent')))) {
        console.log(`Skipping API question about rent: already have data or asked`);
        return;
      }
      
      if ((lowerQuestion.includes('bedroom') || lowerQuestion.includes('bed')) && 
          (hasBedrooms || questions.some(q => q.key.includes('bedrooms')))) {
        console.log(`Skipping API question about bedrooms: already have data or asked`);
        return;
      }
      
      if ((lowerQuestion.includes('bathroom') || lowerQuestion.includes('bath')) && 
          (hasBathrooms || questions.some(q => q.key.includes('bathrooms')))) {
        console.log(`Skipping API question about bathrooms: already have data or asked`);
        return;
      }
      
      if ((lowerQuestion.includes('location') || lowerQuestion.includes('address')) && 
          (hasLocation || questions.some(q => q.key.includes('location')))) {
        console.log(`Skipping API question about location: already have data or asked`);
        return;
      }
      
      if ((lowerQuestion.includes('available') || lowerQuestion.includes('when') || lowerQuestion.includes('date')) && 
          (hasAvailabilityDates || questions.some(q => q.key.includes('availability')))) {
        console.log(`Skipping API question about availability: already have data or asked`);
        return;
      }
      
      if ((lowerQuestion.includes('contact') || lowerQuestion.includes('reach')) && 
          (hasContactInfo || questions.some(q => q.key.includes('contact')))) {
        console.log(`Skipping API question about contact: already have data or asked`);
        return;
      }
      
      if ((lowerQuestion.includes('deposit') || lowerQuestion.includes('security')) && 
          (hasDeposit || questions.some(q => q.key.includes('deposit')))) {
        console.log(`Skipping API question about deposit: already have data or asked`);
        return;
      }
      
      // Additional questions for missing details
      if (lowerQuestion.includes('furnished') || lowerQuestion.includes('furniture')) {
        if (!hasFurnished) {
          questions.push({
            key: `furnished_${index}`,
            question: "Is this place furnished?",
            type: 'yes-no',
            icon: Sofa,
            required: false
          });
        }
      }
      else if (lowerQuestion.includes('utilities') || lowerQuestion.includes('bills')) {
        if (!hasUtilities) {
          questions.push({
            key: `utilities_${index}`,
            question: "Are utilities included in the rent?",
            type: 'yes-no',
            icon: Wifi,
            required: false
          });
        }
      }
      else if (lowerQuestion.includes('pets') || lowerQuestion.includes('animals')) {
        if (!hasPets) {
          questions.push({
            key: `pets_${index}`,
            question: "Are pets allowed?",
            type: 'yes-no',
            icon: PawPrint,
            required: false
          });
        }
      }
      else if (lowerQuestion.includes('smoking allowed') ||
               lowerQuestion.includes('parking included') ||
               lowerQuestion.includes('partial dates') ||
               lowerQuestion.includes('flexible') ||
               lowerQuestion.includes('open to') ||
               lowerQuestion.includes('negotiable')) {
        questions.push({
          key: `yesno_${index}`,
          question: question,
          type: 'yes-no',
          icon: CheckCircle,
          required: false
        });
      }
      else if (lowerQuestion.includes('roommate') || lowerQuestion.includes('sharing') ||
               lowerQuestion.includes('shared') || lowerQuestion.includes('live with')) {
        questions.push({
          key: `roommates_${index}`,
          question: "Will there be roommates?",
          type: 'yes-no',
          icon: Users,
          required: false
        });
      } 
      else {
        // Generic questions - use text input
        questions.push({
          key: `other_${index}`,
          question: question,
          type: 'text',
          inputType: 'text',
          placeholder: 'Please provide details...',
          icon: MessageSquare,
          required: false
        });
      }
    });
    console.log(`Generated ${questions.length} questions:`, questions.map(q => q.key));
    return questions.slice(0, 8);
  };

  // ============================================================================
  // PROCESSING PIPELINE
  // ============================================================================
  
  const processDescription = async () => {
    if (!description.trim()) return;
    
    setIsProcessing(true);
    let extractedDataResult = null;
    let questionsDataResult = null;
    
    try {
      // Step 1: Analyze Text
      updateStepStatus('analyze', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus('analyze', 'completed');
  
      // Step 2: Translation Check
      updateStepStatus('translate', 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus('translate', 'completed');
  
      // Step 3: Grammar & Style - Real API call
      updateStepStatus('cleanup', 'processing');
      try {
        const cleanupData = await callOpenAIAPI('cleanup', description);
        setCleanedDescription(cleanupData.cleaned || description);
        updateStepStatus('cleanup', 'completed');
      } catch (error) {
        console.error('Cleanup failed:', error);
        updateStepStatus('cleanup', 'error');
        return;
      }
  
      // Step 4: Extract Details - Real API call
      updateStepStatus('extract', 'processing');
      try {
        const extractData = await callOpenAIAPI('extract', description);
        extractedDataResult = extractData.extract;
        
        // Store in both state and ref for reliability
        setExtractedData(extractedDataResult);
        extractedDataRef.current = extractedDataResult;
        
        console.log("Extracted data set:", extractedDataResult);
        updateStepStatus('extract', 'completed');
      } catch (error) {
        console.error('Extract failed:', error);
        updateStepStatus('extract', 'error');
        return;
      }
  
      // Step 5: Generate Questions - Real API call
      updateStepStatus('questions', 'processing');
      try {
        const questionsData = await callOpenAIAPI('questions', description);
        questionsDataResult = questionsData;
        updateStepStatus('questions', 'completed');
        
        // Start chat flow with both extracted data and questions data
        setTimeout(() => {
          setShowChat(true);
          startChatFlowWithData(questionsDataResult, extractedDataResult);
        }, 1000);
        
      } catch (error) {
        console.error('Questions generation failed:', error);
        updateStepStatus('questions', 'error');
      }
  
    } catch (error) {
      console.error('Processing error:', error);
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };


  // ============================================================================
  // CHAT FLOW MANAGEMENT
  // ============================================================================
  
 

  const startChatFlowWithData = async (questionsData: any, extractedData: any) => {
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const summaryMessage: ChatMessage = {
      role: 'assistant',
      content: questionsData.questions?.summary || "Great! I've analyzed your description and found some helpful information.",
      timestamp: new Date()
    };
    
    setChatMessages([summaryMessage]);
    setIsTyping(false);
    
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        const analyzedDataMessage: ChatMessage = {
          role: 'assistant',
          content: "Here's what I found in your description:",
          type: 'analyzed-data',
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, analyzedDataMessage]);
        setShowAnalyzedData(true);
        setIsTyping(false);
        
        setTimeout(() => {
          if (questionsData.questions?.questions && questionsData.questions.questions.length > 0) {
            // Generate questions using the extracted data directly
            const convertedQuestions = convertAPIQuestionsToFormatWithData(
              questionsData.questions.questions, 
              extractedData
            );
            setAllQuestions(convertedQuestions);
            
            console.log("Converted questions:", convertedQuestions);
            console.log("Number of questions to ask:", convertedQuestions.length);
            
            setTimeout(() => {
              if (convertedQuestions.length > 0) {
                askNextQuestion(convertedQuestions, 0);
              } else {
                console.log("No questions needed, going straight to finish");
                finishQuestioning();
              }
            }, 1000);
          } else {
            console.log("No API questions, checking if we need to ask essentials");
            const essentialQuestions = convertAPIQuestionsToFormatWithData([], extractedData);
            setAllQuestions(essentialQuestions);
            
            setTimeout(() => {
              if (essentialQuestions.length > 0) {
                askNextQuestion(essentialQuestions, 0);
              } else {
                finishQuestioning();
              }
            }, 1000);
          }
        }, 2000);
      }, 1200);
    }, 1500);
  };
  

  
const startChatFlow = async (questionsData: any) => {
  setIsTyping(true);
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const summaryMessage: ChatMessage = {
    role: 'assistant',
    content: questionsData.questions?.summary || "Great! I've analyzed your description and found some helpful information.",
    timestamp: new Date()
  };
  
  setChatMessages([summaryMessage]);
  setIsTyping(false);
  
  setTimeout(() => {
    setIsTyping(true);
    setTimeout(() => {
      const analyzedDataMessage: ChatMessage = {
        role: 'assistant',
        content: "Here's what I found in your description:",
        type: 'analyzed-data',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, analyzedDataMessage]);
      setShowAnalyzedData(true);
      setIsTyping(false);
      
      // IMPORTANT: Wait for extractedData to be set before generating questions
      setTimeout(() => {
        if (questionsData.questions?.questions && questionsData.questions.questions.length > 0) {
          // Generate questions AFTER extractedData has been properly set
          const convertedQuestions = convertAPIQuestionsToFormat(questionsData.questions.questions);
          setAllQuestions(convertedQuestions);
          
          console.log("Converted questions:", convertedQuestions);
          console.log("Number of questions to ask:", convertedQuestions.length);
          
          setTimeout(() => {
            if (convertedQuestions.length > 0) {
              askNextQuestion(convertedQuestions, 0);
            } else {
              console.log("No questions needed, going straight to finish");
              finishQuestioning();
            }
          }, 1000);
        } else {
          console.log("No API questions, checking if we need to ask essentials");
          // Still check if we need essential questions even if API didn't generate any
          const essentialQuestions = convertAPIQuestionsToFormat([]);
          setAllQuestions(essentialQuestions);
          
          setTimeout(() => {
            if (essentialQuestions.length > 0) {
              askNextQuestion(essentialQuestions, 0);
            } else {
              finishQuestioning();
            }
          }, 1000);
        }
      }, 2000); // Increased delay to ensure extractedData is set
    }, 1200);
  }, 1500);
};



useEffect(() => {
    if (extractedData && Object.keys(extractedData).length > 0) {
      console.log("Syncing extracted data to listing data:", extractedData);
      setListingData(prev => {
        const updated = {
          ...prev,
          rent: extractedData.rent !== null && extractedData.rent !== undefined ? extractedData.rent : prev.rent,
          bedrooms: extractedData.bedrooms !== null && extractedData.bedrooms !== undefined ? extractedData.bedrooms : prev.bedrooms,
          bathrooms: extractedData.bathrooms !== null && extractedData.bathrooms !== undefined ? extractedData.bathrooms : prev.bathrooms,
          location: extractedData.location || prev.location,
          address: extractedData.location || prev.address,
          furnished: extractedData.furnished !== null && extractedData.furnished !== undefined ? extractedData.furnished : prev.furnished,
          utilitiesIncluded: extractedData.utilitiesIncluded !== null && extractedData.utilitiesIncluded !== undefined ? extractedData.utilitiesIncluded : prev.utilitiesIncluded,
          petFriendly: extractedData.petFriendly !== null && extractedData.petFriendly !== undefined ? extractedData.petFriendly : prev.petFriendly,
          contactInfo: extractedData.contactInfo || prev.contactInfo,
          deposit: extractedData.deposit !== null && extractedData.deposit !== undefined ? extractedData.deposit : prev.deposit,
          availableFrom: extractedData.availableFrom || prev.availableFrom,
          availableTo: extractedData.availableTo || prev.availableTo,
          description: description,
          cleanedDescription: cleanedDescription,
        };
        console.log("Updated listing data:", updated);
        return updated;
      });
      
      // Force re-evaluation of questions after data sync
      setTimeout(() => {
        console.log("Re-evaluating questions after data sync...");
        // This will trigger question generation with the updated extracted data
      }, 500);
    }
  }, [extractedData, description, cleanedDescription]); // Added dependencies
  

  const askNextQuestion = (questions: QuestionConfig[], questionIndex: number) => {
    console.log(`Asking question ${questionIndex + 1} of ${questions.length}`);
    
    if (questionIndex >= questions.length) {
      console.log("All questions completed, finishing...");
      finishQuestioning();
      return;
    }

    const question = questions[questionIndex];
    console.log(`Current question: ${question.question}`);
    
    setIsTyping(true);
    
    setTimeout(() => {
      const questionMessage: ChatMessage = {
        role: 'assistant',
        content: question.question,
        type: question.type,
        questionKey: question.key,
        timestamp: new Date(),
        input: question.type === 'text' ? {
          type: question.inputType || 'text',
          placeholder: question.placeholder || 'Type your answer...',
          action: (value: string) => handleTextResponse(question.key, value)
        } : undefined
      };
      setChatMessages(prev => [...prev, questionMessage]);
      setIsTyping(false);
      
      if (question.type === 'text') {
        setShowInput(true);
        setCurrentInputAction(() => (value: string) => handleTextResponse(question.key, value));
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }, 1000);
  };

  // ============================================================================
  // RESPONSE HANDLERS
  // ============================================================================
  
  const handleTextResponse = (questionKey: string, value: string) => {
    processUserResponse(questionKey, value);
    setShowInput(false);
    setInputValue("");
    setCurrentInputAction(null);
  };

  const handleYesNoResponse = (questionKey: string, answer: string) => {
    console.log(`Handling yes/no response: ${questionKey} = ${answer}`);
    processUserResponse(questionKey, answer);
  };

  const handleLocationResponse = (questionKey: string, locationData: any) => {
    const userMessage: ChatMessage = {
      role: 'user',
      content: `📍 ${locationData.address}`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    setUserAnswers(prev => ({
      ...prev,
      [questionKey]: locationData
    }));
    
    setListingData(prev => ({
      ...prev,
      location: locationData.address,
      address: locationData.address
    }));

    showPositiveResponseAndContinue();
  };

  const processUserResponse = (questionKey: string, value: any) => {
    console.log(`Processing user response: ${questionKey} = ${value}`);
    
    const userMessage: ChatMessage = {
      role: 'user',
      content: value.toString(),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    setUserAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionKey]: value
      };
      console.log("Updated user answers:", newAnswers);
      return newAnswers;
    });
    
    updateListingDataFromAnswer(questionKey, value);
    showPositiveResponseAndContinue();
  };

  const showPositiveResponseAndContinue = () => {
    setIsTyping(true);
    setTimeout(() => {
      const responses = ["Perfect! 👍", "Great! ✨", "Got it! 📝", "Excellent! 🎯", "Thanks! 👌", "Awesome! 🙌"];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
      
      // Increment the question index BEFORE asking the next question
      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      
      setTimeout(() => {
        askNextQuestion(allQuestions, nextQuestionIndex);
      }, 800);
    }, 1000);
  };

  const handleTextInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentInputAction) return;
    currentInputAction(inputValue);
  };

  // ============================================================================
  // DATA UPDATE LOGIC
  // ============================================================================
  
  const updateListingDataFromAnswer = (questionKey: string, answer: string | number) => {
    setListingData(prev => {
      const newData = { ...prev };
      
      if (questionKey.includes('rent')) {
        newData.rent = Number(answer) || 0;
      } else if (questionKey.includes('deposit')) {
        newData.deposit = Number(answer) || 0;
      } else if (questionKey.includes('bedrooms')) {
        newData.bedrooms = Number(answer) || 0;
      } else if (questionKey.includes('bathrooms')) {
        newData.bathrooms = Number(answer) || 0;
      } else if (questionKey.includes('furnished')) {
        newData.furnished = answer.toString().toLowerCase().includes('yes');
      } else if (questionKey.includes('utilities')) {
        newData.utilitiesIncluded = answer.toString().toLowerCase().includes('yes');
      } else if (questionKey.includes('pets')) {
        newData.petFriendly = answer.toString().toLowerCase().includes('yes');
      } else if (questionKey.includes('contact')) {
        newData.contactInfo = answer.toString();
      } else if (questionKey.includes('availability') || questionKey.includes('date')) {
        const answerStr = answer.toString();
        // Parse date range like "January 15, 2025 - May 31, 2025"
        if (answerStr.includes(' - ')) {
          const dates = answerStr.split(' - ');
          if (dates.length === 2) {
            newData.availableFrom = dates[0].trim();
            newData.availableTo = dates[1].trim();
          }
        } else {
          newData.availableFrom = answerStr;
        }
      } else if (questionKey.includes('roommates')) {
        newData.hasRoommates = answer.toString().toLowerCase().includes('yes');
      } else if (questionKey.includes('partial')) {
        newData.partialDatesOk = answer.toString().toLowerCase().includes('yes');
      }
      
      return newData;
    });
  };

  // ============================================================================
  // EDIT DATA FUNCTIONALITY
  // ============================================================================
  
  const showEditDataDialog = () => {
    setIsTyping(true);
    setTimeout(() => {
      const editMessage: ChatMessage = {
        role: 'assistant',
        content: "I found some information that might need updating. Would you like to edit any of these details?",
        type: 'edit-data',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, editMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleEditExtractedData = (field: string, newValue: any) => {
    setExtractedData(prev => ({
      ...prev,
      [field]: newValue
    }));

    setListingData(prev => ({
      ...prev,
      [field]: newValue
    }));

    const userMessage: ChatMessage = {
      role: 'user',
      content: `Updated ${field}: ${newValue}`,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    setTimeout(() => {
      const confirmMessage: ChatMessage = {
        role: 'assistant',
        content: "Perfect! I've updated that information. ✨",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, confirmMessage]);
      setIsTyping(false);
    }, 1000);
  };

  // ============================================================================
  // COMPLETION LOGIC
  // ============================================================================
  
  const finishQuestioning = () => {
    setIsTyping(true);
    setTimeout(() => {
      const finalMessage: ChatMessage = {
        role: 'assistant',
        content: "Awesome! 🎉 I have all the information I need. Let me create your perfect listing now...",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, finalMessage]);
      setIsTyping(false);
      
      setTimeout(() => {
        showFinalSummary();
      }, 2000);
    }, 1000);
  };

  const showFinalSummary = () => {
    const finalData = compileFinalListingData();
    
    console.log("Showing final summary with data:", finalData);
    
    const summaryMessage: ChatMessage = {
      role: 'assistant',
      content: `Here's your complete listing! 🎉
  
  📝 **Type**: ${finalData.listingType || 'Sublease'}
  💰 **Rent**: $${finalData.rent || 'TBD'}/month
  🛏️ **Space**: ${finalData.bedrooms || 'TBD'} bed, ${finalData.bathrooms || 'TBD'} bath
  📍 **Location**: ${finalData.location || finalData.address || 'TBD'}
  📅 **Available**: ${finalData.availableFrom || 'TBD'} to ${finalData.availableTo || 'TBD'}
  🏠 **Furnished**: ${finalData.furnished ? 'Yes' : 'No'}
  ⚡ **Utilities**: ${finalData.utilitiesIncluded ? 'Included' : 'Not included'}
  🐕 **Pets**: ${finalData.petFriendly ? 'Allowed' : 'Not allowed'}
  💳 **Deposit**: $${finalData.deposit || '0'}
  📞 **Contact**: ${finalData.contactInfo || 'TBD'}
  
  Your listing is ready to publish! 🚀`,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, summaryMessage]);
  };


 const compileFinalListingData = () => {
  // Use the ref data which is more reliable than state
  const currentExtractedData = extractedDataRef.current || extractedData;
  
  console.log("Compiling final data...");
  console.log("Current extracted data:", currentExtractedData);
  console.log("User answers:", userAnswers);
  console.log("Current listing data state:", listingData);
  
  // Start with the current listing data instead of defaults
  let finalData = { ...listingData };
  
  // Apply extracted data if available (this should override defaults)
  if (currentExtractedData) {
    console.log("Applying extracted data...");
    
    // Only update if the extracted data has valid values
    if (currentExtractedData.rent !== null && currentExtractedData.rent !== undefined && currentExtractedData.rent > 0) {
      finalData.rent = currentExtractedData.rent;
      console.log("Set rent to:", currentExtractedData.rent);
    }
    
    if (currentExtractedData.bedrooms !== null && currentExtractedData.bedrooms !== undefined) {
      finalData.bedrooms = currentExtractedData.bedrooms;
      console.log("Set bedrooms to:", currentExtractedData.bedrooms);
    }
    
    if (currentExtractedData.bathrooms !== null && currentExtractedData.bathrooms !== undefined) {
      finalData.bathrooms = currentExtractedData.bathrooms;
      console.log("Set bathrooms to:", currentExtractedData.bathrooms);
    }
    
    if (currentExtractedData.location && currentExtractedData.location.trim().length > 0) {
      finalData.location = currentExtractedData.location;
      finalData.address = currentExtractedData.location;
      console.log("Set location to:", currentExtractedData.location);
    }
    
    if (currentExtractedData.availableFrom && currentExtractedData.availableFrom.trim().length > 0) {
      finalData.availableFrom = currentExtractedData.availableFrom;
      console.log("Set availableFrom to:", currentExtractedData.availableFrom);
    }
    
    if (currentExtractedData.availableTo && currentExtractedData.availableTo.trim().length > 0) {
      finalData.availableTo = currentExtractedData.availableTo;
      console.log("Set availableTo to:", currentExtractedData.availableTo);
    }
    
    if (currentExtractedData.furnished !== null && currentExtractedData.furnished !== undefined) {
      finalData.furnished = currentExtractedData.furnished;
      console.log("Set furnished to:", currentExtractedData.furnished);
    }
    
    if (currentExtractedData.utilitiesIncluded !== null && currentExtractedData.utilitiesIncluded !== undefined) {
      finalData.utilitiesIncluded = currentExtractedData.utilitiesIncluded;
      console.log("Set utilities to:", currentExtractedData.utilitiesIncluded);
    }
    
    if (currentExtractedData.petFriendly !== null && currentExtractedData.petFriendly !== undefined) {
      finalData.petFriendly = currentExtractedData.petFriendly;
      console.log("Set pets to:", currentExtractedData.petFriendly);
    }
    
    if (currentExtractedData.contactInfo && currentExtractedData.contactInfo.trim().length > 0) {
      finalData.contactInfo = currentExtractedData.contactInfo;
      console.log("Set contact to:", currentExtractedData.contactInfo);
    }
    
    if (currentExtractedData.deposit !== null && currentExtractedData.deposit !== undefined) {
      finalData.deposit = currentExtractedData.deposit;
      console.log("Set deposit to:", currentExtractedData.deposit);
    }
  }
  
  // Apply user answers (this overrides extracted data)
  console.log("Applying user answers...");
  Object.keys(userAnswers).forEach(key => {
    const answer = userAnswers[key];
    console.log(`Processing user answer: ${key} = ${answer}`);
    
    if (key.includes('rent')) {
      const rentValue = Number(answer);
      if (rentValue > 0) {
        finalData.rent = rentValue;
      }
    } else if (key.includes('deposit')) {
      const depositValue = Number(answer);
      if (depositValue >= 0) { // Allow 0 for no deposit
        finalData.deposit = depositValue;
        console.log("Updated deposit from user answer:", finalData.deposit);
      }
    } else if (key.includes('bedrooms')) {
      const bedroomsValue = Number(answer);
      if (bedroomsValue >= 0) {
        finalData.bedrooms = bedroomsValue;
      }
    } else if (key.includes('bathrooms')) {
      const bathroomsValue = Number(answer);
      if (bathroomsValue >= 0) {
        finalData.bathrooms = bathroomsValue;
      }
    } else if (key.includes('furnished')) {
      finalData.furnished = answer.toString().toLowerCase().includes('yes');
    } else if (key.includes('utilities')) {
      finalData.utilitiesIncluded = answer.toString().toLowerCase().includes('yes');
    } else if (key.includes('pets')) {
      finalData.petFriendly = answer.toString().toLowerCase().includes('yes');
    } else if (key.includes('contact')) {
      finalData.contactInfo = answer.toString();
    } else if (key.includes('location')) {
      if (typeof answer === 'object' && answer.address) {
        finalData.location = answer.address;
        finalData.address = answer.address;
      } else {
        finalData.location = answer.toString();
        finalData.address = answer.toString();
      }
    } else if (key.includes('availability') || key.includes('date')) {
      const answerStr = answer.toString();
      if (answerStr.includes(' - ')) {
        const dates = answerStr.split(' - ');
        if (dates.length === 2) {
          finalData.availableFrom = dates[0].trim();
          finalData.availableTo = dates[1].trim();
        }
      } else {
        finalData.availableFrom = answerStr;
      }
    } else if (key.includes('roommates')) {
      finalData.hasRoommates = answer.toString().toLowerCase().includes('yes');
    } else if (key.includes('partial')) {
      finalData.partialDatesOk = answer.toString().toLowerCase().includes('yes');
    }
  });
  
  // Ensure we have the current description and cleaned description
  finalData.description = description;
  finalData.cleanedDescription = cleanedDescription;
  
  console.log("Final compiled data:", finalData);
  
  return {
    ...finalData,
    userAnswers: userAnswers,
    createdAt: new Date().toISOString(),
    allQuestions: allQuestions,
  };
};



  // ============================================================================
  // RENDER COMPONENTS
  // ============================================================================
  
  const renderAnalyzedData = () => {
    if (!extractedData) return null;

    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="my-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Eye size={20} className="text-blue-600 mr-2" />
            <h4 className="font-semibold text-blue-900">Extracted Information</h4>
          </div>
          <button
            onClick={() => showEditDataDialog()}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
          >
            <Edit3 size={16} className="mr-1" />
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {extractedData.rent && (
            <div className="flex items-center">
              <DollarSign size={16} className="text-green-600 mr-2" />
              <span className="font-medium">Rent:</span>
              <span className="ml-1">${extractedData.rent}/month</span>
            </div>
          )}
          
          {extractedData.deposit && (
            <div className="flex items-center">
              <DollarSign size={16} className="text-orange-600 mr-2" />
              <span className="font-medium">Deposit:</span>
              <span className="ml-1">${extractedData.deposit}</span>
            </div>
          )}
          
          {extractedData.bedrooms !== null && (
            <div className="flex items-center">
              <Bed size={16} className="text-purple-600 mr-2" />
              <span className="font-medium">Bedrooms:</span>
              <span className="ml-1">{extractedData.bedrooms}</span>
            </div>
          )}
          
          {extractedData.bathrooms !== null && (
            <div className="flex items-center">
              <Bath size={16} className="text-blue-600 mr-2" />
              <span className="font-medium">Bathrooms:</span>
              <span className="ml-1">{extractedData.bathrooms}</span>
            </div>
          )}
          
          {extractedData.location && (
            <div className="flex items-center">
              <MapPin size={16} className="text-red-600 mr-2" />
              <span className="font-medium">Location:</span>
              <span className="ml-1">{extractedData.location}</span>
            </div>
          )}
          
          {extractedData.availableFrom && (
            <div className="flex items-center">
              <Calendar size={16} className="text-green-600 mr-2" />
              <span className="font-medium">Available From:</span>
              <span className="ml-1">{extractedData.availableFrom}</span>
            </div>
          )}
          
          {extractedData.availableTo && (
            <div className="flex items-center">
              <Calendar size={16} className="text-red-600 mr-2" />
              <span className="font-medium">Available To:</span>
              <span className="ml-1">{extractedData.availableTo}</span>
            </div>
          )}
          
          {extractedData.furnished !== null && (
            <div className="flex items-center">
              <Sofa size={16} className="text-orange-600 mr-2" />
              <span className="font-medium">Furnished:</span>
              <span className="ml-1">{extractedData.furnished ? 'Yes' : 'No'}</span>
            </div>
          )}
          
          {extractedData.utilitiesIncluded !== null && (
            <div className="flex items-center">
              <Wifi size={16} className="text-green-600 mr-2" />
              <span className="font-medium">Utilities:</span>
              <span className="ml-1">{extractedData.utilitiesIncluded ? 'Included' : 'Not included'}</span>
            </div>
          )}
          
          {extractedData.petFriendly !== null && (
            <div className="flex items-center">
              <PawPrint size={16} className="text-yellow-600 mr-2" />
              <span className="font-medium">Pets:</span>
              <span className="ml-1">{extractedData.petFriendly ? 'Allowed' : 'Not allowed'}</span>
            </div>
          )}
          
          {extractedData.contactInfo && (
            <div className="flex items-center col-span-full">
              <Mail size={16} className="text-blue-600 mr-2" />
              <span className="font-medium">Contact:</span>
              <span className="ml-1">{extractedData.contactInfo}</span>
            </div>
          )}
        </div>
        
        {Object.values(extractedData).filter(v => v !== null && v !== undefined).length === 0 && (
          <p className="text-gray-600 text-sm">No specific details detected - I'll ask you for the information!</p>
        )}
      </motion.div>
    );
  };

  const renderEditDataOptions = () => {
    if (!extractedData) return null;

    const editableFields = [
      { key: 'rent', label: 'Monthly Rent', icon: DollarSign, type: 'number', placeholder: 'Enter rent amount' },
      { key: 'deposit', label: 'Security Deposit', icon: DollarSign, type: 'number', placeholder: 'Enter deposit amount' },
      { key: 'bedrooms', label: 'Bedrooms', icon: Bed, type: 'number', placeholder: 'Enter number of bedrooms' },
      { key: 'bathrooms', label: 'Bathrooms', icon: Bath, type: 'number', placeholder: 'Enter number of bathrooms' },
      { key: 'location', label: 'Location', icon: MapPin, type: 'text', placeholder: 'Enter location' },
      { key: 'availableFrom', label: 'Available From', icon: Calendar, type: 'text', placeholder: 'Enter start date' },
      { key: 'availableTo', label: 'Available To', icon: Calendar, type: 'text', placeholder: 'Enter end date' },
      { key: 'contactInfo', label: 'Contact Info', icon: Mail, type: 'text', placeholder: 'Enter contact information' }
    ];

    return (
      <div className="mt-4 space-y-3">
        {editableFields.map((field) => {
          const currentValue = extractedData[field.key];
          if (currentValue === null || currentValue === undefined) return null;
          
          return (
            <div key={field.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center">
                <field.icon size={16} className="text-gray-600 mr-2" />
                <span className="font-medium text-gray-700">{field.label}:</span>
                <span className="ml-2 text-gray-900">{currentValue}</span>
              </div>
              <button
                onClick={() => {
                  setIsTyping(true);
                  setTimeout(() => {
                    const editFieldMessage: ChatMessage = {
                      role: 'assistant',
                      content: `Please enter the correct ${field.label.toLowerCase()}:`,
                      type: 'text',
                      timestamp: new Date(),
                      input: {
                        type: field.type,
                        placeholder: field.placeholder,
                        action: (value: any) => handleEditExtractedData(field.key, value)
                      }
                    };
                    setChatMessages(prev => [...prev, editFieldMessage]);
                    setIsTyping(false);
                    setShowInput(true);
                    setCurrentInputAction(() => (value: any) => handleEditExtractedData(field.key, value));
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }, 1000);
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Edit
              </button>
            </div>
          );
        })}
        
        <button
          onClick={() => {
            setIsTyping(true);
            setTimeout(() => {
              const continueMessage: ChatMessage = {
                role: 'assistant',
                content: "Great! Now let me ask you a few more questions to complete your listing.",
                timestamp: new Date()
              };
              setChatMessages(prev => [...prev, continueMessage]);
              setIsTyping(false);
              
              setTimeout(() => {
                if (allQuestions.length > 0) {
                  askNextQuestion(allQuestions, 0);
                } else {
                  finishQuestioning();
                }
              }, 1500);
            }, 1000);
          }}
          className="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 font-medium transition-colors"
        >
          Continue with Questions
        </button>
      </div>
    );
  };

  const renderYesNoOptions = (message: ChatMessage) => {
    if (!message.questionKey || message.type !== 'yes-no') return null;

    return (
      <div className="mt-4 flex space-x-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleYesNoResponse(message.questionKey!, 'Yes')}
          className="flex-1 p-4 text-center font-semibold rounded-xl transition-colors bg-green-500 hover:bg-green-600 text-white"
        >
          ✅ Yes
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleYesNoResponse(message.questionKey!, 'No')}
          className="flex-1 p-4 text-center font-semibold rounded-xl transition-colors bg-red-500 hover:bg-red-600 text-white"
        >
          ❌ No
        </motion.button>
      </div>
    );
  };

  const renderLocationPicker = (message: ChatMessage) => {
    if (message.type !== 'location' || !message.questionKey) return null;

    return (
      <div className="mt-4">
        <LocationPicker
          onLocationSelect={(location) => handleLocationResponse(message.questionKey!, location)}
          showDeliveryOptions={false}
        />
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8" viewBox="0 0 50 50" fill="none">
                <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
              </svg>
              <svg className="w-6 h-6 -ml-2" viewBox="0 0 40 40" fill="none">
                <path d="M5 10L20 5L35 10L30 35L15 40L5 35L5 10Z" fill="#E97451" />
                <circle cx="15" cy="15" r="3" fill="white" />
              </svg>
              <span className="text-2xl font-bold text-gray-900">Subox</span>
            </div>
            <motion.button 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleBack}
              className="flex items-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2 text-gray-600" />
              <span className="font-medium text-gray-700">Back</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16">
        <AnimatePresence mode="wait">
          {!showChat ? (
            <motion.div
              key="description-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Header */}
              <div className="text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center"
                >
                  <Edit3 size={36} className="text-orange-600" />
                </motion.div>
                <div>
                  <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Write Your Description
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Just write whatever comes to mind in any language. We'll clean it up and ask for missing details.
                  </p>
                </div>
              </div>

              {/* Main Form */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100"
              >
                <div className="p-8 space-y-8">
                  {/* Text Area */}
                  <div className="space-y-4">
                    <label className="block text-lg font-medium text-gray-900">
                      Describe your sublease listing
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="apartamento 2 cuartos cerca universidad. tiene muebles. disponible enero-mayo. $1200/mes incluye utilidades. contacto: maria@email.com

(Any language, typos OK - we'll fix everything!)"
                      className="w-full h-80 p-6 border-2 border-gray-200 rounded-2xl resize-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all text-gray-900 placeholder-gray-400 text-lg leading-relaxed"
                      disabled={isProcessing}
                    />
                    <div className="flex justify-between items-center text-sm text-gray-500">
                      <span>Write in any language - we'll handle the rest!</span>
                      <span>{description.length} characters</span>
                    </div>
                  </div>

                  {/* Processing Steps */}
                  {isProcessing && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="bg-gray-50 rounded-2xl p-6 space-y-6"
                    >
                      <div className="flex items-center space-x-3">
                        <Loader2 className="animate-spin text-orange-500" size={24} />
                        <h3 className="text-lg font-semibold text-gray-900">Processing your description...</h3>
                      </div>
                      <div className="space-y-4">
                        {processingSteps.map((step) => (
                          <div key={step.id} className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {step.status === 'completed' && (
                                <CheckCircle className="text-green-500" size={24} />
                              )}
                              {step.status === 'processing' && (
                                <Loader2 className="animate-spin text-orange-500" size={24} />
                              )}
                              {step.status === 'error' && (
                                <AlertCircle className="text-red-500" size={24} />
                              )}
                              {step.status === 'pending' && (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{step.label}</div>
                              <div className="text-sm text-gray-500">{step.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={processDescription}
                    disabled={!description.trim() || isProcessing}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold py-6 px-8 rounded-2xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <span>Clean Up & Continue</span>
                    )}
                  </motion.button>
                </div>
              </motion.div>

              {/* Bottom Info */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center space-y-6"
              >
                <h3 className="text-2xl font-bold text-gray-900">No pressure writing</h3>
                <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                  Just dump everything you can think of. Typos, incomplete sentences, mixed languages - we'll sort it all out and create a professional listing.
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-interface"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden max-w-2xl mx-auto"
            >
              {/* Chat Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 p-8 text-white">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Subox Assistant</h3>
                    <p className="text-orange-100">Let's complete your listing</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-8 space-y-6">
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-sm ${message.role === 'user' ? '' : 'w-full max-w-full'}`}>
                      {message.role === 'user' ? (
                        <div className="px-6 py-4 rounded-2xl text-lg bg-orange-500 text-white">
                          {message.content}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="px-6 py-4 rounded-2xl text-lg bg-gray-100 text-gray-800">
                            {message.content}
                          </div>
                          
                          {/* Show analyzed data if this message has it */}
                          {message.type === 'analyzed-data' && showAnalyzedData && renderAnalyzedData()}
                          
                          {/* Show edit data options */}
                          {message.type === 'edit-data' && renderEditDataOptions()}
                          
                          {/* Show yes/no options */}
                          {message.type === 'yes-no' && renderYesNoOptions(message)}
                          
                          {/* Show location picker */}
                          {message.type === 'location' && renderLocationPicker(message)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-6 py-4 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress indicator */}
              {allQuestions.length > 0 && (
                <div className="px-8 py-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Question {Math.min(currentQuestionIndex + 1, allQuestions.length)} of {allQuestions.length}</span>
                    <div className="flex space-x-1">
                      {allQuestions.map((_, index) => (
                        <div
                          key={index}
                          className={`w-2 h-2 rounded-full ${
                            index < currentQuestionIndex ? 'bg-green-500' :
                            index === currentQuestionIndex ? 'bg-orange-500' :
                            'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Input Area */}
              {showInput && (
                <div className="border-t border-gray-200 bg-white p-4">
                  <form onSubmit={handleTextInputSubmit} className="flex items-center space-x-3">
                    <div className="flex-1 relative">
                      {(() => {
                        const lastMessage = chatMessages[chatMessages.length - 1];
                        const inputType = lastMessage?.input?.type || 'text';
                        const placeholder = lastMessage?.input?.placeholder || 'Type your answer...';
                        
                        if (inputType === 'number') {
                          return (
                            <input
                              ref={inputRef}
                              type="number"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder={placeholder}
                              className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                            />
                          );
                        } else {
                          return (
                            <input
                              ref={inputRef}
                              type="text"
                              value={inputValue}
                              onChange={(e) => setInputValue(e.target.value)}
                              placeholder={placeholder}
                              className="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-50"
                            />
                          );
                        }
                      })()}
                    </div>
                    <button
                      type="submit"
                      disabled={!inputValue.trim()}
                      className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors hover:bg-orange-600"
                    >
                      <ArrowLeft size={16} className="rotate-180" />
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}