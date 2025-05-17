"use client"

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation"; // App Router version

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true); 
  const router = useRouter();

  const handleAuth = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        alert("Logged in successfully!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        alert("Account created successfully!");
      }
      router.push("/select"); 
    } catch (error) {
      console.error(error);
      alert("Authentication failed. Check console.");
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
      <button onClick={handleAuth} className="bg-blue-500 text-white p-2 rounded mb-2">
        {isLogin ? "Login" : "Sign Up"}
      </button>
      <button onClick={() => setIsLogin(!isLogin)} className="text-blue-500 underline text-sm">
        {isLogin ? "Create new account" : "Already have an account?"}
      </button>
    </div>
  );
}
