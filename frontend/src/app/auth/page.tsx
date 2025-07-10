"use client"

import { 
  useState,
  useEffect
} from "react";
import { 
  auth,
  db,
  storage
 } from "@/lib/firebase";
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
  setDoc
} from "firebase/firestore"
import { 
  uploadBytes, 
  ref, 
  getDownloadURL 
} from "firebase/storage";
import { AuthProvider, useAuth } from '../contexts/AuthInfo';

// Main Auth Page Content
function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  // Get initial mode from URL params
  const initialMode = searchParams.get('mode');
  
  // Auth state
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Basic auth fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Signup fields - Required
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  
  // Signup fields - Optional
  const [schoolEmail, setSchoolEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [quickBio, setQuickBio] = useState("");
  
  // Profile image
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Phone verification
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneVerificationCode, setPhoneVerificationCode] = useState("");
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/find");
    }
  }, [user, authLoading, router]);

  // Auto-login effect
  useEffect(() => {
    if (authLoading) return; // Wait for auth to load
    
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedEmail && savedPassword && !user) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);

      signInWithEmailAndPassword(auth, savedEmail, savedPassword)
        .then((userCredential) => {
          const user = userCredential.user;
          if (user.emailVerified) {
            router.push("/find");
          }
        })
        .catch((error) => {
          console.error("Auto login failed:", error);
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        });
    }
  }, [router, user, authLoading]);

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
    setPhoneVerificationCode("");
    setShowPhoneVerification(false);
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

  const sendPhoneVerification = async () => {
    if (!phoneNumber) {
      alert("Please enter your phone number");
      return;
    }
    
    // Demo verification code (replace with real SMS service)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Verification code:", code);
    setShowPhoneVerification(true);
    alert(`Demo: Verification code is ${code}`);
  };

  const verifyPhoneCode = () => {
    if (phoneVerificationCode.length === 6) {
      setIsPhoneVerified(true);
      setShowPhoneVerification(false);
      alert("Phone number verified!");
    } else {
      alert("Please enter a valid 6-digit code");
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      alert("Please enter your email first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/invalid-credential") {
        alert("No account found");
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email");
      } else {
        alert("Failed to send reset email");
      }
    }
  };

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
  const saveUserData = async (user: any, photoURL: string) => {
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
      isStudentVerified: schoolEmail && isSchoolEmail(schoolEmail),
      badges: {
        studentVerified: schoolEmail && isSchoolEmail(schoolEmail),
        phoneVerified: isPhoneVerified,
        socialLinked: !!socialLink
      },
      createdAt: new Date()
    };

    await setDoc(doc(db, "users", user.uid), userData);
  };

  // Main authentication handler
  const handleAuth = async () => {
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
        
        // Redirect will happen automatically via useEffect when user state updates
        router.push("/find");
      } else {
        // Signup flow
        if (!validateSignupForm()) {
          setLoading(false);
          return;
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
          alert("Account created! Please check your email for verification before signing in.");
        } catch (emailError) {
          console.error("Failed to send verification email:", emailError);
          alert("Account created but couldn't send verification email");
        }

        // Reset form and switch to login
        resetForm();
        setIsLogin(true);
      }
    } catch (error: any) {
      console.error(error);
      
      // Handle specific error codes
      const errorMessages: { [key: string]: string } = {
        "auth/invalid-email": "Invalid email address",
        "auth/missing-password": "Password is required",
        "auth/invalid-credential": "Wrong email or password",
        "auth/email-already-in-use": "Email is already registered",
        "auth/weak-password": "Password must be at least 6 characters",
        "auth/network-request-failed": "Network error. Check your connection"
      };
      
      const message = errorMessages[error.code] || "Authentication failed";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  // Social login handlers
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
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
          schoolEmail: "",
          phoneNumber: "",
          isPhoneVerified: false,
          socialLink: "Google Account",
          quickBio: "",
          isStudentVerified: false,
          badges: { 
            studentVerified: false,
            phoneVerified: false,
            socialLinked: true 
          },
          createdAt: new Date(),
        });
      }

      router.push("/find");
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
          schoolEmail: "",
          phoneNumber: "",
          isPhoneVerified: false,
          socialLink: "Facebook Account",
          quickBio: "",
          isStudentVerified: false,
          badges: { 
            studentVerified: false,
            phoneVerified: false,
            socialLinked: true 
          },
          createdAt: new Date(),
        });
      }

      router.push("/find");
    } catch (error) {
      console.error("Facebook login error:", error);
      alert("Facebook login failed");
    }
  };

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If user is already logged in, show a message while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">You're already signed in. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-10 h-10" viewBox="0 0 50 50" fill="none">
                <path d="M25 5L40 15V35L25 45L10 35V15L25 5Z" fill="#E97451" />
                <rect x="20" y="20" width="10" height="10" fill="white" />
              </svg>
              <svg className="w-8 h-8 -ml-1" viewBox="0 0 40 40" fill="none">
                <path d="M5 10L20 5L35 10L30 35L15 40L5 35L5 10Z" fill="#E97451" />
                <circle cx="15" cy="15" r="3" fill="white" />
              </svg>
              <h1 className="text-4xl font-bold text-gray-800">Subox</h1>
            </div>
          </div>
          <p className="text-gray-600">Sublets & Moving Sales</p>
          
          {/* Back to Browse Button */}
          <div className="mt-4">
            <button
              onClick={() => router.push('/find')}
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              ← Continue browsing without account
            </button>
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
                    <img src={previewUrl} alt="Profile preview" className="w-full h-full object-cover" />
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
              <>
                {/* Required Fields */}
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

                {/* Optional Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Email 
                    <span className="text-gray-400 font-normal"> (Optional)</span>
                    <span className="ml-1 inline-flex items-center">
                      <svg className="w-4 h-4 text-blue-500 cursor-help" fill="currentColor" viewBox="0 0 20 20" title="Including a school email (.edu) will earn you a verified student badge">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="john.doe@university.edu"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <div className="mt-1 flex items-center space-x-2">
                    <p className="text-xs text-blue-600">
                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      School emails (.edu) earn a "🎓 Verified Student" badge
                    </p>
                    {schoolEmail && isSchoolEmail(schoolEmail) && (
                      <span className="text-green-600 text-xs">🎓 Student Badge Eligible</span>
                    )}
                  </div>
                </div>

                {/* Phone Number with Verification */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-gray-400">(Optional)</span>
                    {isPhoneVerified && (
                      <span className="ml-2 text-green-600 text-sm">📱 Verified</span>
                    )}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    {phoneNumber && !isPhoneVerified && (
                      <button
                        type="button"
                        onClick={sendPhoneVerification}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm whitespace-nowrap"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                  
                  {phoneNumber && (
                    <p className="text-xs text-blue-600 mt-1">
                      <svg className="w-3 h-3 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Verified phone numbers earn a "📱 Verified" badge
                    </p>
                  )}
                  
                  {showPhoneVerification && (
                    <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-gray-700 mb-3 font-medium">Enter the 6-digit verification code:</p>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="123456"
                          value={phoneVerificationCode}
                          onChange={(e) => setPhoneVerificationCode(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={verifyPhoneCode}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm whitespace-nowrap"
                        >
                          Verify
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Demo mode: Any 6-digit code will work</p>
                    </div>
                  )}
                </div>

                {/* Social Link */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Social Media Link <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/johndoe or https://linkedin.com/in/johndoe"
                    value={socialLink}
                    onChange={(e) => setSocialLink(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">Add credibility to your profile with a social media link</p>
                </div>

                {/* Quick Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quick Bio <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    placeholder="Tell others a bit about yourself in one line..."
                    value={quickBio}
                    onChange={(e) => setQuickBio(e.target.value)}
                    maxLength={120}
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">{quickBio.length}/120 characters</p>
                </div>
              </>
            )}

            {/* Email and Password (Both modes) */}
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

            {/* Login Options */}
            {isLogin && (
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

          {/* Submit Button */}
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
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>

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
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with AuthProvider wrapper
export default function AuthPage() {
  return (
    <AuthProvider>
      <AuthPageContent />
    </AuthProvider>
  );
}