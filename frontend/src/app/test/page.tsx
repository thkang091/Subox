"use client"

import { useEffect } from "react"
import { addDoc, collection } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function TestPage() {
  useEffect(() => {
    const runTest = async () => {
      try {
        const docRef = await addDoc(collection(db, "listings"), {
          title: "Test Listing",
          price: 999,
          createdAt: new Date(),
        })
        console.log("✅ Successfully wrote to Firestore:", docRef.id)
      } catch (error) {
        console.error("❌ Firestore error:", error)
      }
    }

    runTest()
  }, [])

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold">🔥 Firebase Test Page</h1>
      <p>Check your console + Firebase dashboard for a new listing.</p>
    </div>
  )
}
