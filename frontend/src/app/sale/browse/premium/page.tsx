// src/app/vip/page.tsx or wherever your routing is

"use client"

import { useState } from "react";
import { motion } from "framer-motion";
import { House } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VIPPage() {
  const [isVIP, setIsVIP] = useState(false);
  const router = useRouter();

  const handlePurchase = () => {
    // Simulate payment success
    setIsVIP(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-white px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-yellow-300">
        <h1 className="text-4xl font-bold text-yellow-600 mb-4">VIP Membership</h1>
        <p className="text-gray-600 mb-6">
          Unlock premium features and exclusive perks by becoming a VIP member.
        </p>

        {!isVIP ? (
          <>
            <ul className="text-left space-y-3 mb-8 text-gray-700">
              <li>✅ Early access to new listings</li>
              <li>✅ Highlighted items in search results</li>
              <li>✅ Priority chat with sellers</li>
              <li>✅ Custom location filters</li>
              <li>✅ VIP badge on your profile</li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePurchase}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Become a VIP for $4.99/month
            </motion.button>
          </>
        ) : (
          <div className="text-green-600 text-xl font-semibold mt-6">
            <div>
                🎉 You're now a VIP member!
            </div>
            <button
                onClick={() => {router.push("/sale/browse")}}
            >
                <House/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
