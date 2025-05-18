"use client"

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { useEffect } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { sendEmailVerification } from "firebase/auth";



export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); 
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("savedEmail");
    const savedPassword = localStorage.getItem("savedPassword");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(savedPassword);
      setRememberMe(true);

      signInWithEmailAndPassword(auth, email, password);

      alert("Auto logged in!")
      
    }
  }, []);

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
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">{isLogin ? "Login" : "Sign Up"}</h1>
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
