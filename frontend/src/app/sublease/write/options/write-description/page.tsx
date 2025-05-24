"use client"

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  MessageSquare
} from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  description: string;
}

export default function WriteDescriptionPage() {
  const [description, setDescription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

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

  const processDescription = async () => {
    if (!description.trim()) return;
    
    setIsProcessing(true);
    
    try {
      // Step 1: Analyze Text
      updateStepStatus('analyze', 'processing');
      await new Promise(resolve => setTimeout(resolve, 1000));
      updateStepStatus('analyze', 'completed');

      // Step 2: Translation Check
      updateStepStatus('translate', 'processing');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus('translate', 'completed');

      // Step 3: Grammar & Style
      updateStepStatus('cleanup', 'processing');
      
      const cleanupResponse = await fetch('/api/process-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'cleanup',
          description: description
        })
      });

      if (!cleanupResponse.ok) throw new Error('Cleanup failed');
      const cleanupData = await cleanupResponse.json();
      setCleanedDescription(cleanupData.cleaned);
      updateStepStatus('cleanup', 'completed');

      // Step 4: Extract Details
      updateStepStatus('extract', 'processing');
      
      const extractResponse = await fetch('/api/process-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'extract',
          description: description
        })
      });

      if (!extractResponse.ok) throw new Error('Extract failed');
      const extractData = await extractResponse.json();
      setExtractedData(extractData.extract);
      updateStepStatus('extract', 'completed');

      // Step 5: Generate Questions
      updateStepStatus('questions', 'processing');
      
      const questionsResponse = await fetch('/api/process-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'questions',
          description: description
        })
      });

      if (!questionsResponse.ok) throw new Error('Questions generation failed');
      
      const questionsData = await questionsResponse.json();
      updateStepStatus('questions', 'completed');

      // Start chat flow
      setTimeout(() => {
        setShowChat(true);
        startChatFlow(questionsData.questions);
      }, 1000);

    } catch (error) {
      console.error('Processing error:', error);
      // Mark current processing step as error
      const currentStep = processingSteps.find(step => step.status === 'processing');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error');
      }
    }
  };

  const startChatFlow = async (questionsData: any) => {
    setIsTyping(true);
    
    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // First show the summary
    const summaryMessage: ChatMessage = {
      role: 'assistant',
      content: questionsData.summary || "Great! I've analyzed your description.",
      timestamp: new Date()
    };
    
    setChatMessages([summaryMessage]);
    setIsTyping(false);
    
    // Then show missing info after a delay
    if (questionsData.missing && questionsData.missing.length > 0) {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          const missingMessage: ChatMessage = {
            role: 'assistant',
            content: `I need a few more details:\n\n${questionsData.missing.map((item: string) => `• ${item}`).join('\n')}`,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, missingMessage]);
          setIsTyping(false);
          
          // Ask first question after another delay
          if (questionsData.questions && questionsData.questions.length > 0) {
            setAllQuestions(questionsData.questions);
            setTimeout(() => {
              setIsTyping(true);
              setTimeout(() => {
                const questionMessage: ChatMessage = {
                  role: 'assistant',
                  content: questionsData.questions[0],
                  timestamp: new Date()
                };
                setChatMessages(prev => [...prev, questionMessage]);
                setCurrentQuestion(questionsData.questions[0]);
                setCurrentQuestionIndex(0);
                setIsTyping(false);
              }, 1000);
            }, 1500);
          }
        }, 1200);
      }, 1500);
    } else {
      // If no missing info, go straight to questions
      if (questionsData.questions && questionsData.questions.length > 0) {
        setAllQuestions(questionsData.questions);
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            const questionMessage: ChatMessage = {
              role: 'assistant',
              content: questionsData.questions[0],
              timestamp: new Date()
            };
            setChatMessages(prev => [...prev, questionMessage]);
            setCurrentQuestion(questionsData.questions[0]);
            setCurrentQuestionIndex(0);
            setIsTyping(false);
          }, 1000);
        }, 1000);
      }
    }
  };

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [allQuestions, setAllQuestions] = useState<string[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [cleanedDescription, setCleanedDescription] = useState("");

  // Complete listing data structure like your chat page
  const [listingData, setListingData] = useState({
    // Basic info from OpenAI extraction
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
    
    // Additional data from chat questions
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
    
    // Question-answer pairs for reference
    questionAnswers: []
  });

  const handleChatResponse = async (response: string) => {
    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: response,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);

    // Store the answer with question
    const currentQ = allQuestions[currentQuestionIndex];
    setUserAnswers(prev => [...prev, response]);
    
    // Update listing data based on question type and answer
    updateListingDataFromAnswer(currentQ, response);

    // Simulate AI processing and response
    setIsTyping(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Move to next question or finish
    const nextQuestionIndex = currentQuestionIndex + 1;
    
    if (nextQuestionIndex < allQuestions.length) {
      // Ask next question
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: getRandomPositiveResponse(),
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      
      // Ask the next question after a short delay
      setTimeout(() => {
        const nextQuestionMessage: ChatMessage = {
          role: 'assistant',
          content: allQuestions[nextQuestionIndex],
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, nextQuestionMessage]);
        setCurrentQuestionIndex(nextQuestionIndex);
      }, 800);
    } else {
      // All questions answered - compile final data
      const finalResponse: ChatMessage = {
        role: 'assistant',
        content: "Awesome! 🎉 I have all the info I need. Creating your perfect listing now...",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, finalResponse]);
      
      // Show final summary and save data
      setTimeout(() => {
        const completeListingData = compileFinalListingData();
        console.log('Complete Listing Data:', completeListingData);
        
        // Here you can send to your backend or redirect
        // router.push('/listing-created');
        showFinalSummary(completeListingData);
      }, 2000);
    }
    
    setIsTyping(false);
  };

  // Helper function to get random positive responses
  const getRandomPositiveResponse = () => {
    const responses = [
      "Perfect! 👍",
      "Great! 🙌", 
      "Awesome! ✨",
      "Nice! 👌",
      "Got it! 📝",
      "Excellent! 🎯"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  // Update listing data based on question and answer
  const updateListingDataFromAnswer = (question: string, answer: string) => {
    const lowerQ = question.toLowerCase();
    const lowerA = answer.toLowerCase();
    
    // Store question-answer pair
    setListingData(prev => ({
      ...prev,
      questionAnswers: [...prev.questionAnswers, { question, answer }]
    }));
    
    // Parse specific answers based on question type
    if (lowerQ.includes('rent') || lowerQ.includes('monthly') || lowerQ.includes('cost')) {
      const rentMatch = answer.match(/\$?(\d+)/);
      if (rentMatch) {
        setListingData(prev => ({ ...prev, rent: parseInt(rentMatch[1]) }));
      }
    }
    
    if (lowerQ.includes('address') || lowerQ.includes('location') || lowerQ.includes('where')) {
      setListingData(prev => ({ ...prev, address: answer }));
    }
    
    if (lowerQ.includes('bedroom') || lowerQ.includes('room')) {
      const bedroomMatch = answer.match(/(\d+)/);
      if (bedroomMatch) {
        setListingData(prev => ({ ...prev, bedrooms: parseInt(bedroomMatch[1]) }));
      }
    }
    
    if (lowerQ.includes('bathroom')) {
      const bathroomMatch = answer.match(/(\d+)/);
      if (bathroomMatch) {
        setListingData(prev => ({ ...prev, bathrooms: parseInt(bathroomMatch[1]) }));
      }
    }
    
    if (lowerQ.includes('contact') || lowerQ.includes('reach')) {
      setListingData(prev => ({ ...prev, contactInfo: answer }));
    }
    
    if (lowerQ.includes('deposit')) {
      const depositMatch = answer.match(/\$?(\d+)/);
      if (depositMatch) {
        setListingData(prev => ({ ...prev, deposit: parseInt(depositMatch[1]) }));
      }
    }
    
    if (lowerQ.includes('available') || lowerQ.includes('date')) {
      if (lowerQ.includes('from') || lowerQ.includes('start')) {
        setListingData(prev => ({ ...prev, availableFrom: answer }));
      } else if (lowerQ.includes('to') || lowerQ.includes('end')) {
        setListingData(prev => ({ ...prev, availableTo: answer }));
      }
    }
    
    if (lowerQ.includes('utilities')) {
      const included = lowerA.includes('yes') || lowerA.includes('included');
      setListingData(prev => ({ ...prev, utilitiesIncluded: included }));
    }
    
    if (lowerQ.includes('furnished')) {
      const furnished = lowerA.includes('yes') || lowerA.includes('furnished');
      setListingData(prev => ({ ...prev, furnished: furnished }));
    }
    
    if (lowerQ.includes('pets')) {
      const petFriendly = lowerA.includes('yes') || lowerA.includes('allowed');
      setListingData(prev => ({ ...prev, petFriendly: petFriendly }));
    }
  };

  // Compile final listing data
  const compileFinalListingData = () => {
    // Merge extracted data with chat answers
    const finalData = {
      ...listingData,
      description: description,
      cleanedDescription: cleanedDescription,
      
      // Override with extracted data if available
      ...(extractedData && {
        rent: extractedData.rent || listingData.rent,
        bedrooms: extractedData.bedrooms || listingData.bedrooms,
        bathrooms: extractedData.bathrooms || listingData.bathrooms,
        location: extractedData.location || listingData.location,
        furnished: extractedData.furnished !== null ? extractedData.furnished : listingData.furnished,
        utilitiesIncluded: extractedData.utilitiesIncluded !== null ? extractedData.utilitiesIncluded : listingData.utilitiesIncluded,
        petFriendly: extractedData.petFriendly !== null ? extractedData.petFriendly : listingData.petFriendly,
        contactInfo: extractedData.contactInfo || listingData.contactInfo,
        deposit: extractedData.deposit || listingData.deposit,
        availableFrom: extractedData.availableFrom || listingData.availableFrom,
        availableTo: extractedData.availableTo || listingData.availableTo,
      }),
      
      // Metadata
      createdAt: new Date().toISOString(),
      allQuestions: allQuestions,
      allAnswers: userAnswers,
    };
    
    return finalData;
  };

  // Show final summary
  const showFinalSummary = (data: any) => {
    const summaryMessage: ChatMessage = {
      role: 'assistant',
      content: `Here's your complete listing! 🎉

📝 **Type**: ${data.listingType || 'Sublease'}
💰 **Rent**: ${data.rent}/month
🛏️ **Space**: ${data.bedrooms} bed, ${data.bathrooms} bath
📍 **Location**: ${data.location || data.address}
📅 **Available**: ${data.availableFrom} to ${data.availableTo}
🏠 **Furnished**: ${data.furnished ? 'Yes' : 'No'}
⚡ **Utilities**: ${data.utilitiesIncluded ? 'Included' : 'Not included'}
🐕 **Pets**: ${data.petFriendly ? 'Allowed' : 'Not allowed'}
📞 **Contact**: ${data.contactInfo}

Your listing is ready to publish! 🚀`,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, summaryMessage]);
  };

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

              {/* Smart Features - Simplified */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 text-center"
              >
                <div className="max-w-xl mx-auto space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">AI-Powered Smart Cleanup</h3>
                  <div className="grid grid-cols-3 gap-6 text-sm text-gray-700">
                    <div>Auto-translate any language</div>
                    <div>Fix grammar & typos</div>
                    <div>Ask for missing details</div>
                  </div>
                </div>
              </motion.div>

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

              {/* Bottom Info - Simplified */}
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
                    <div className={`max-w-sm px-6 py-4 rounded-2xl text-lg ${
                      message.role === 'user' 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {message.content}
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

              {/* Chat Input */}
              <div className="p-8 border-t border-gray-100">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    className="flex-1 px-6 py-4 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 text-lg"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        handleChatResponse(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                      }
                    }}
                  />
                  <button 
                    className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleChatResponse(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}