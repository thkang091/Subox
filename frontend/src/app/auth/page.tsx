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
import { createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged ,
  sendPasswordResetEmail, 
  sendEmailVerification
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { 
  doc,
  setDoc
} from "firebase/firestore"
import { 
  uploadBytes, 
  ref, 
  getDownloadURL } from "firebase/storage";




export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const router = useRouter();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  
  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");

    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);

      signInWithEmailAndPassword(auth, savedEmail, savedPassword)
        .then((userCredential) => {
          const user = userCredential.user;

          if (user.emailVerified) {
            alert("Auto logged in!");
          } else {
            alert("Please verify your email before logging in.");
          }
        })
        .catch((error) => {
          console.error("Auto login failed:", error);
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        });
    }
  }, [router]);

  const forgotPassword = async () => {
    if (!email) {
      alert("Plase enter your eamil first");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!")
    } catch (error) {
      console.error(error);
      if (error.code == "auth/invalid-credential") {
        alert("No account found")
      } else if (error.code == "auth/invalid-email") {
        alert("invalid email. Please enter a valid email")
      } else {
        alert("Failed to send reset email. Try again later")
      }
    }
  }
  
  const handleAuth = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          alert("Please verify your email before logging in");
          return;
        }

        if (rememberMe) {
          localStorage.setItem("savedEmail", email);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.removeItem("savedEmail");
          localStorage.removeItem("savedPassword");
        }
        alert("Logged in successfully!");
      } else {

        let photoURL = "https://yourapp.com/default-profile.png";

        if (!fullName || !dob || !phoneNumber) {
          alert("Please complete all required fields");
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (selectedImageFile) {
          const storageRef = ref(storage, `profilePictures/${user.uid}`);
          await uploadBytes(storageRef, selectedImageFile);
          photoURL = await getDownloadURL(storageRef);
        }
        console.log("saving")
        await setDoc(doc(db, "users", user.uid), {
          fullName,
          dob,
          email,
          phoneNumber,
          photoURL,
          createdAt: new Date()
        });
        console.log("saved")
        await sendEmailVerification(user);
        alert("Verification email sent!")

        setIsLogin(true);
      }
    } catch (error) {
      console.error(error);
      if (error.code == "auth/invalid-email") {
        alert("The email address is not valid.");
      } else if (error.code == "auth/missing-password"){
        alert("Missing password")
      } else if (error.code == "auth/invalid-credential") {
        alert("Wrong email or password");
      } else if (error.code == "auth/wrong-password") {
        alert("Incorrect password.");
      } else if (error.code == "auth/email-already-in-use") {
        alert("This email is already registered");
      } else if (error.code == "auth/weak-password") {
        alert("The password is too weak. Password should be at least 6 characters.");
      } else {
        alert("Authentication failed. Please try again.");
    }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.emailVerified) {
        router.push("/temp");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">{isLogin ? "Login" : "Sign Up"}</h1>
      {!isLogin && (
        <>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setSelectedImageFile(file);
          }}
          className="mb-4 p-2 border rounded"
        />
        </>
      )}
      <input
        type="email"
        placeholder="Email"
        className="mb-2 p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        className="mb-4 p-2 border rounded"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {!isLogin && (
        <>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mb-4 p-2 border rounded"
        />

        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="mb-4 p-2 border rounded"
        />

        <input
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="mb-4 p-2 border rounded"
        />
        </>
      )}
      <button onClick={handleAuth} disabled={loading} className="bg-blue-500 text-white p-2 rounded mb-2">
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.1s]" />
            <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
          </div>
        ) : (
          isLogin ? "Login" : "Sign Up"
        )
      }
      </button> <label className="flex items-center space-x-2 mb-4">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={() => setRememberMe(!rememberMe)}
        />
        <span className="text-sm">Remember Me</span>
      </label>
      <button onClick={() => setIsLogin(!isLogin)} className="text-blue-500 underline text-sm">
        {isLogin ? "Create new account" : "Already have an account?"}
      </button>
      {isLogin && (      
      <button onClick={forgotPassword} className="text-blue-500 underline text-sm">
        Forgot Password?
      </button>)}
    </div>

  );
}
