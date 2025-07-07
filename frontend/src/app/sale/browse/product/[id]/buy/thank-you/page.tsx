"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ThankYouPage() {
  const router = useRouter();
  const [showHandshake, setShowHandshake] = useState(false);

  useEffect(() => {
    const handshakeTimer = setTimeout(() => {
      setShowHandshake(true);
    }, 1200); // show 🤝 and message after hands meet

    const redirectTimer = setTimeout(() => {
      router.push("/sale/browse");
    }, 5000);

    return () => {
      clearTimeout(handshakeTimer);
      clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white overflow-hidden">
      {/* 👋 Side hands animation */}
      {!showHandshake && (
        <div className="flex items-center justify-center w-full mb-8 relative h-20">
          <motion.div
            initial={{ x: "100vw" }}
            animate={{ x: 80 }}
            transition={{ duration: 1.2}}
            className="text-7xl mb-6"
          >
            🫲
          </motion.div>
          <motion.div
            initial={{ x: "-100vw" }}
            animate={{ x: -80 }}
            transition={{ duration: 1.2}}
            className="text-7xl mb-6"
          >
            🫱
          </motion.div>
        </div>
      )}

      {/* 🤝 Handshake and message appear together */}
      <AnimatePresence>
        {showHandshake && (
          <>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.2, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
              className="text-7xl mb-6"
            >
              🤝
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-4xl font-bold text-orange-600 text-center"
            >
              Thank you for your purchase!
            </motion.h1>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
