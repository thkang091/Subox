"use client"

import { 
  useState,
  useEffect,
  useCallback
} from "react";
import Image from "next/image";
import { 
  auth,
  db,
  storage
 } from "@/lib/firebase";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import AuthLocationPicker from '../../components/AuthLocationPicker'; // Adjust path as needed
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X } from 'lucide-react';

import { updateProfile } from "firebase/auth";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  sendEmailVerification,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  getAdditionalUserInfo
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "firebase/firestore"
import { 
  uploadBytes, 
  ref, 
  getDownloadURL 
} from "firebase/storage";


export default function AuthPage() {
  const router = useRouter();
  
  // Location for campus/residence
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showPostAuthLocationPicker, setShowPostAuthLocationPicker] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Store user for post-auth location update
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Basic auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup fields - Required
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");

  // Mode for auth
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  useEffect(() => {
    if (mode === "signup") {
      setIsLogin(false);
    }
  }, [mode]);
  
  // Signup fields - Optional
  const [schoolEmail, setSchoolEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [quickBio, setQuickBio] = useState("");
  const [address, setAddress] = useState("");
  
  // Profile image
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Phone verification
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Rate for caculation
  const [rated, setRated] = useState<number[]>([]);
  const [averageRate, setAverageRate] = useState<number[]>([]);
  const [rateError, setRateError] = useState(0);

  // Steps
  const [step, setStep] = useState(0);
  const steps = 4; // Change from 3 to 4

  const calculateRateError = (userRatings: number[], averageRatings: number[]) => {
    if (
      userRatings.length === 0 ||
      averageRatings.length === 0 ||
      userRatings.length !== averageRatings.length
    ) return 0;

    const totalError = userRatings.reduce((sum, rating, i) => {
      return sum + Math.abs(rating - averageRatings[i]);
    }, 0);

    return totalError / userRatings.length;
  };

  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => {
    setRateError(calculateRateError(rated, averageRate));
  }, [rated, averageRate]);

  const history = {
    rated,
    averageRate,
    rateError,
    purchased: [],
    sold: [],
    rented: [],
    subleased: [],
    reviewed: [],
    cancelled: [],
    returned: [],
  };

  // Alumni
  const [isAlumni, setIsAlumni] = useState(false);
  const [graduationDate, setGraduationDate] = useState("");
  const [error, setError] = useState("");

  // Check if user has location and redirect or show location picker
  const checkUserLocationAndRedirect = useCallback(async (user) => {
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // Document doesn't exist, create it first
        console.log("User document doesn't exist, creating basic document");
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName || "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          userLocation: null,
          createdAt: new Date(),
          isStudentVerified: false,
          badges: {},
          history: {
            purchased: [],
            sold: [],
            rented: [],
            subleased: [],
            rated: [],
            reviewed: [],
            averageRate: [],
            rateError: 0,
            cancelled: [],
            returned: [],
          }
        });
        
        // Show location picker for new document
        setCurrentUser(user);
        setShowPostAuthLocationPicker(true);
        return;
      }
      
      const userData = userDoc.data();
      
      if (!userData?.userLocation) {
        // User doesn't have location, show location picker
        setCurrentUser(user);
        setShowPostAuthLocationPicker(true);
      } else {
        // User has location, proceed to app
        router.push("/find");
      }
    } catch (error) {
      console.error("Error checking user location:", error);
      // If there's an error, still proceed to app
      router.push("/find");
    }
  },[router]);

  // Auto-login effect
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);

      signInWithEmailAndPassword(auth, savedEmail, savedPassword)
        .then(async (userCredential) => {
          const user = userCredential.user;
          if (user.emailVerified) {
            await checkUserLocationAndRedirect(user);
          }
        })
        .catch((error) => {
          console.error("Auto login failed:", error);
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        });
    }
  }, [router, checkUserLocationAndRedirect]);

  // Handle location selection for already authenticated user
  const handlePostAuthLocationSelect = async (location: unknown) => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create document if it doesn't exist
        await setDoc(userDocRef, {
          fullName: currentUser.displayName || "",
          email: currentUser.email || "",
          photoURL: currentUser.photoURL || "",
          userLocation: location,
          createdAt: new Date(),
          isStudentVerified: false,
          badges: {},
          history: {
            purchased: [],
            sold: [],
            rented: [],
            subleased: [],
            rated: [],
            reviewed: [],
            averageRate: [],
            rateError: 0,
            cancelled: [],
            returned: [],
          }
        });
      } else {
        // Update existing document
        await updateDoc(userDocRef, {
          userLocation: location,
          updatedAt: new Date()
        });
      }
      
      setShowPostAuthLocationPicker(false);
      setCurrentUser(null);
      router.push("/find");
    } catch (error) {
      console.error("Error updating user location:", error);
      alert("Failed to save location. You can update it later in your profile.");
      setShowPostAuthLocationPicker(false);
      setCurrentUser(null);
      router.push("/find");
    }
  };

  // Helper functions
  const isSchoolEmail = (email: string) => {
    return email.includes('.edu') || email.includes('.ac.') || 
           email.includes('university') || email.includes('college');
  };

  const resetForm = () => {
    setFullName("");
    setDob("");
    setSchoolEmail("");
    setPhoneNumber("");
    setSocialLink("");
    setQuickBio("");
    setSelectedImageFile(null);
    setPreviewUrl(null);
    setIsPhoneVerified(false);
    setUserLocation(null);
    setShowLocationPicker(false);
    setIsAlumni(false);
    setRated([]);
    setAverageRate([]);
    setRateError(0);
  };

  // Event handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const bgColors = ["#ffffff", "#fff7ed", "#eefaf5"];

  const contentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
  };

  const handleNext = () => {
    setError("");
    
    // Validate step 0 (required)
    if (step === 0) {
      if (!fullName.trim() || !dob) {
        setError("Please enter your full name and date of birth to continue.");
        return;
      }
      if (!email || !password) {
        setError("Please enter both email and password to continue.");
        return;
      }
    }
    
    // Move to next step
    setStep((s) => Math.min(s + 1, steps - 1));
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = () => {
    // Final submit logic here — replace with your API call
    console.log({
      fullName,
      dob,
      schoolEmail,
      isAlumni,
      graduationDate,
      phoneNumber,
      isPhoneVerified,
      quickBio,
      socialLink,
      address,
    });
  };


  const forgotPassword = () => {
    setForgotMode(true);
  };

  const sendPasswordReset = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error) {
      console.error(error);
      if (error.code === "auth/invalid-credential") {
        alert("No account found");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email");
      } else {
        alert("Failed to send reset email");
      }
    } finally {
      setForgotMode(false);
    }
  }

  // Validation
  const validateSignupForm = () => {
    if (!fullName.trim()) {
      alert("Please enter your full name");
      return false;
    }
    
    if (!dob) {
      alert("Please enter your date of birth");
      return false;
    }
    
    if (new Date(dob) >= new Date()) {
      alert("Date of birth must be in the past");
      return false;
    }
    
    return true;
  };

  // Upload profile image
  const uploadProfileImage = async (userId: string): Promise<string> => {
    if (!selectedImageFile) {
      return "https://yourapp.com/default-profile.png";
    }

    try {
      const storageRef = ref(storage, `profilePictures/${userId}`);
      await uploadBytes(storageRef, selectedImageFile);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Image upload failed:", error);
      return "https://yourapp.com/default-profile.png";
    }
  };

  // Save user data to Firestore
  const saveUserData = async (user, photoURL: string) => {
    await updateProfile(user, {
      displayName: fullName
    });

    const userData = {
      fullName,
      dob,
      email,
      photoURL,
      schoolEmail: schoolEmail || null,
      phoneNumber: phoneNumber || null,
      isPhoneVerified,
      socialLink: socialLink || null,
      quickBio: quickBio || null,
      address: address || null,
      userLocation: userLocation || null,
      isStudentVerified: schoolEmail && isSchoolEmail(schoolEmail),
      history: {
        purchased: history.purchased,
        sold: history.sold,
        rented: history.rented,
        subleased: history.subleased,
        rated: history.rated,
        reviewed: history.reviewed,
        averageRate: history.averageRate,
        rateError: history.rateError,
        cancelled: history.cancelled,
        returned: history.returned,
      },
      badges: {
        studentVerified: schoolEmail && isSchoolEmail(schoolEmail) && !isAlumni,
        alumni: isAlumni && isSchoolEmail(schoolEmail) && schoolEmail,
        phoneVerified: isPhoneVerified,
        trustedRenter: history.rented.length >= 4,
        trustedSeller: history.sold.length >= 10,
        bestRater: history.rated.length >= 15 && history.rateError <= 1,
        bestReviewer: history.reviewed.length >= 20,
        socialLinked: !!socialLink
      },
      createdAt: new Date()
    };

    await setDoc(doc(db, "users", user.uid), userData);
  };

  // Main authentication handler
  const handleAuth = async () => {
    if (forgotMode) {
      sendPasswordReset();
      return;
    }

    if (!validate()) return;

    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          alert("Please verify your email before logging in");
          setLoading(false);
          return;
        }

        // Handle remember me
        if (rememberMe) {
          localStorage.setItem("savedEmail", email);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        }
        
        // Check if user has location before redirecting
        await checkUserLocationAndRedirect(user);
      } else {
        // Signup flow
        if (!validateSignupForm()) {
          setLoading(false);
          return;
        }

        if (schoolEmail && !schoolEmail.endsWith('.edu')) {
          alert("Please enter a valid .edu email to receive a student badge.");
          setLoading(false);
          return;
        }

        // Check if email already exists before creating account
        try {
          const signInMethods = await fetchSignInMethodsForEmail(auth, email);
          if (signInMethods.length > 0) {
            alert("An account with this email already exists. Please try logging in instead.");
            setLoading(false);
            return;
          }
        } catch (emailCheckError) {
          console.log("Could not check email existence, proceeding with signup ", emailCheckError);
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Upload profile image
        const photoURL = await uploadProfileImage(user.uid);

        // Save user data
        await saveUserData(user, photoURL);

        // Send verification email
        try {
          await sendEmailVerification(user);
          alert("Account created! Please check your email for verification.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          alert("Account created but couldn't send verification email");
        }

        // Reset form and switch to login
        resetForm();
        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      
      // Handle specific error codes
      const errorMessages: { [key: string]: string } = {
        "auth/invalid-email": "Invalid email address",
        "auth/missing-password": "Password is required",
        "auth/invalid-credential": "Wrong email or password",
        "auth/email-already-in-use": "This email is already registered. Please try logging in instead, or use a different email.",
        "auth/weak-password": "Password must be at least 6 characters",
        "auth/network-request-failed": "Network error. Check your connection",
        "auth/too-many-requests": "Too many failed attempts. Please try again later."
      };
      
      const message = errorMessages[error.code] || "Authentication failed";
      alert(message);
      
      // If email already in use, switch to login mode
      if (error.code === "auth/email-already-in-use") {
        setIsLogin(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Checking alumni error code
  const validate = () => {
    if (isAlumni) {
      if (!graduationDate) {
        setError("Please enter your graduation date.");
        return false;
      }
    }
    setError("");
    return true;
  };

  // Social login handlers
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        // Create document for new users
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName || "",
          dob: "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          socialLink: "Google Account",
          userLocation: null, // New users won't have location
          isStudentVerified: false,
          badges: { socialLinked: true },
          history: {
            purchased: [],
            sold: [],
            rented: [],
            subleased: [],
            rated: [],
            reviewed: [],
            averageRate: [],
            rateError: 0,
            cancelled: [],
            returned: [],
          },
          createdAt: new Date(),
        });
      }

      // Check if user has location before redirecting
      await checkUserLocationAndRedirect(user);
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed");
    }
  };

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const additionalInfo = getAdditionalUserInfo(result);
      if (additionalInfo?.isNewUser) {
        await setDoc(doc(db, "users", user.uid), {
          fullName: user.displayName || "",
          dob: "",
          email: user.email || "",
          photoURL: user.photoURL || "",
          socialLink: "Facebook Account",
          userLocation: null, // New users won't have location
          badges: { socialLinked: true },
          createdAt: new Date(),
        });
      } 

      // Check if user has location before redirecting
      await checkUserLocationAndRedirect(user);
    } catch (error) {
      if (error.code === "auth/account-exists-with-different-credential") {
        const email = error.customData?.email;

        if (email) {
          // Get the existing sign-in methods for this email
          alert("This email is linked with a different method. Please try signing in using that method.");
        } else {
          alert("Account exists with different sign-in method.");
        }
      }
      console.error("Facebook login error:", error);
      alert("Facebook login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center -mb-4 mr-17">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-6 relative mt-3"
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push("/")}                
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
                  SUBLETS & MOVING SALES
                </motion.span>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            {isLogin ? "Welcome Back!" : "Create Account"}
          </h2>

          {/* Profile Image Upload (Signup only) */}
          {!isLogin && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture <span className="text-gray-400">(Optional)</span>
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center overflow-hidden">
                  {previewUrl ? (
                    <Image src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                    Choose Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Signup Fields */}
            {!isLogin && (
              <motion.div
                animate={{ backgroundColor: bgColors[step] }}
                transition={{ duration: 0.45 }}
                className="flex items-center justify-center px-4"
              >
                <div className="w-full max-w-3xl mx-auto p-6">
                  {/* Header + Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold text-gray-800">Create account</h2>
                      <div className="text-sm text-gray-600">Step {step + 1} of {steps}</div>
                    </div>

                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          background: "#fb923c", // orange
                          width: `${((step) / (steps - 1)) * 100}%`,
                          transition: "width 360ms ease",
                        }}
                      />
                    </div>
                  </div>

                  {/* form (prevent full page refresh) */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (step < steps - 1) handleNext();
                      else handleSubmit();
                    }}
                    className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow"
                  >
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={step}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.32 }}
                      >
                        {/* === STEP 0: Required fields === */}
                        {step === 0 && (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  placeholder="John Doe"
                                  value={fullName}
                                  onChange={(e) => setFullName(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                  autoFocus
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Date of Birth <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="date"
                                  value={dob}
                                  onChange={(e) => setDob(e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <input
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                              </label>
                              <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              />
                            </div>

                            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
                          </>
                        )}

                        {/* === STEP 1: Optional — school / alumni === */}
                        {step === 1 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                School Email <span className="text-gray-400">(Optional)</span>
                              </label>
                              <input
                                type="email"
                                value={schoolEmail}
                                onChange={(e) => setSchoolEmail(e.target.value)}
                                placeholder="example@school.edu"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-2">
                                School emails (.edu) earn a verified student badge. You may enter one even if graduated.
                              </p>
                            </div>

                            <div className="mt-4">
                              <label className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isAlumni}
                                  onChange={(e) => setIsAlumni(e.target.checked)}
                                  className="form-checkbox h-5 w-5 text-green-600"
                                />
                                <span className="text-sm font-medium text-gray-700">Currently graduated</span>
                              </label>

                              {isAlumni && (
                                <div className="mt-3">
                                  <label className="block text-sm text-gray-700">Graduation Date</label>
                                  <input
                                    type="date"
                                    value={graduationDate}
                                    onChange={(e) => setGraduationDate(e.target.value)}
                                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                                  />
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* === STEP 2: Optional — phone, social, bio, address === */}
                        {step === 2 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number <span className="text-gray-400">(Optional)</span>
                              </label>
                              <div className="flex space-x-2">
                                <input
                                  type="tel"
                                  placeholder="+1 (555) 123-4567"
                                  value={phoneNumber}
                                  onChange={(e) => setPhoneNumber(e.target.value)}
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    // demo verification toggler — replace with real flow
                                    if (!phoneNumber) { setError("Enter your phone to verify"); return; }
                                    setIsPhoneVerified(true);
                                    setError("");
                                  }}
                                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm"
                                >
                                  {isPhoneVerified ? "Verified" : "Verify"}
                                </button>
                              </div>
                              <p className="text-xs text-blue-600 mt-1">Verified phones earn a &quot;📱 Verified&quot; badge</p>
                            </div>
                            

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Social Media Link <span className="text-gray-400">(Optional)</span></label>
                              <input
                                type="url"
                                placeholder="https://instagram.com/you"
                                value={socialLink}
                                onChange={(e) => setSocialLink(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              />
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Quick Bio <span className="text-gray-400">(Optional)</span></label>
                              <textarea
                                placeholder="One-line about you..."
                                value={quickBio}
                                onChange={(e) => setQuickBio(e.target.value)}
                                maxLength={120}
                                rows={2}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                              />
                              <p className="text-xs text-gray-500 mt-1">{quickBio.length}/120 characters</p>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-1">Address <span className="text-gray-400">(Optional)</span></label>
                              <input
                                type="text"
                                placeholder="Enter your address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                              />
                            </div>
                          </>
                        )}

                        {/* === STEP 3: Location === */}
                        {step === 3 && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Where is your school campus or where do you live?
                              </label>
                              <p className="text-xs text-gray-500 mb-4">
                                This will help you find nearby sublets and move-out items. We&apos;ll provide more interaction even if you&apos;re not familiar with the location.
                              </p>
                              
                              {!userLocation ? (
                                <button
                                  type="button"
                                  onClick={() => setShowLocationPicker(true)}
                                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-orange-600"
                                >
                                  <MapPin size={20} />
                                  <span>Select Your Location</span>
                                </button>
                              ) : (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-2">
                                      <MapPin size={16} className="text-green-600 mt-0.5" />
                                      <div className="min-w-0 flex-1">
                                        <h4 className="font-medium text-green-900 text-sm truncate">
                                          {userLocation.placeName || userLocation.city || 'Selected Location'}
                                        </h4>
                                        <p className="text-xs text-green-700 mt-1 truncate">
                                          {userLocation.address}
                                        </p>
                                        {userLocation.areaType && (
                                          <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                            {userLocation.areaType === 'city' ? 'City Area' : 
                                             userLocation.areaType === 'neighborhood' ? 'Neighborhood' : 'Specific Location'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUserLocation(null);
                                        setShowLocationPicker(true);
                                      }}
                                      className="text-green-600 hover:text-green-800 text-xs font-medium flex-shrink-0 ml-2"
                                    >
                                      Change
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>

                    {/* Buttons */}
                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        {step > 0 ? (
                          <button
                            type="button"
                            onClick={handleBack}
                            className="px-4 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded-md text-sm transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Back
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {step < steps - 1 ? (
                          <button
                            type="button"
                            onClick={handleNext}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md"
                          >
                            Next
                          </button>
                        ) : (
                          <button
                            onClick={handleAuth}
                            disabled={loading}
                            type="submit"
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md"
                          >
                            Create account
                          </button>
                        )}
                      </div>
                    </div>

                    {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                  </form>
                </div>
              </motion.div>
            )}

            {/* Email and Password (Both modes) */}
            {isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            )}

            {!forgotMode && isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
              </div>
            )}
            
            {/* Login Options */}
            {isLogin && !forgotMode && (
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={forgotPassword}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}
          </div>

          {isLogin && forgotMode && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Go Back?
              </button>
            </div>
          )}

          {/* Submit Button */}
          {isLogin && (
            <button
              onClick={handleAuth}
              disabled={loading}
              className="w-full mt-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
              ) : (
                forgotMode ? "Send Reset Email" : "Sign In"
              )}
            </button>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogleLogin}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Google</span>
            </button>
            
            <button
              onClick={handleFacebookLogin}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-gray-700">Facebook</span>
            </button>
          </div>

          {/* Toggle Auth Mode */}
          <p className="text-center mt-6 text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                if (!isLogin) resetForm();
              }}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              {isLogin ? "Sign up" : "Login"}
            </button>
          </p>

          {/* Signup Location Picker Modal */}
          {showLocationPicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Select Location</h3>
                  <button
                    onClick={() => setShowLocationPicker(false)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
                  <AuthLocationPicker
                    onLocationSelect={(location) => {
                      setUserLocation(location);
                      setShowLocationPicker(false);
                    }}
                    initialValue=""
                  />
                </div>
              </div>
            </div>
          )}

          {/* Post-Auth Location Picker Modal */}
          {showPostAuthLocationPicker && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Fixed Header */}
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-center">Welcome! Let&apos;s set your location</h3>
                  <p className="text-sm text-gray-600 text-center mt-2">
                    Help us show you nearby sublets and moving sales by selecting your location.
                  </p>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <AuthLocationPicker
                    onLocationSelect={(location) => {
                      // Just store the selected location, don't save to Firebase yet
                      setUserLocation(location);
                    }}
                    initialValue=""
                  />
                </div>
                
                {/* Fixed Footer with Buttons */}
                <div className="p-4 border-t border-gray-200 space-y-3 flex-shrink-0 bg-white">
                  {userLocation && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-blue-900 text-sm">
                            {userLocation.placeName || userLocation.city || 'Selected Location'}
                          </h4>
                          <p className="text-xs text-blue-700 mt-1 break-words">
                            {userLocation.address}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowPostAuthLocationPicker(false);
                        setCurrentUser(null);
                        setUserLocation(null);
                        router.push("/find");
                      }}
                      className="flex-1 px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Skip for now
                    </button>
                    
                    <button
                      onClick={() => {
                        if (userLocation) {
                          handlePostAuthLocationSelect(userLocation);
                        } else {
                          alert("Please select a location first");
                        }
                      }}
                      disabled={!userLocation}
                      className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Confirm Location
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}