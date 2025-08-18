// src/app/find/page.tsx
"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from '../contexts/AuthInfo';

// Custom Interactive Icons
const CustomIcons = {
  ArrowLeft: ({ size = 24, className = "" }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      whileHover={{ x: -2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <motion.path 
        d="M19 12H5M12 19L5 12L12 5" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.svg>
  ),

  Home: ({ size = 32, className = "", animated = false }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      className={className}
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.path 
        d="M4 12L16 2L28 12V26C28 27.1 27.1 28 26 28H6C4.9 28 4 27.1 4 26V12Z" 
        fill="currentColor" 
        opacity="0.2"
        animate={animated ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path 
        d="M4 12L16 2L28 12V26C28 27.1 27.1 28 26 28H6C4.9 28 4 27.1 4 26V12Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <motion.path 
        d="M12 28V18H20V28" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </motion.svg>
  ),

  Key: ({ size = 28, className = "", animated = false }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      className={className}
      whileHover={{ rotate: 15 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <motion.circle 
        cx="9" 
        cy="9" 
        r="7" 
        stroke="currentColor" 
        strokeWidth="2"
        fill="currentColor"
        opacity="0.2"
        animate={animated ? { rotate: 360 } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
      <motion.circle 
        cx="9" 
        cy="9" 
        r="7" 
        stroke="currentColor" 
        strokeWidth="2"
        fill="none"
      />
      <motion.path 
        d="M21 21L15 15M15 15L21 9M15 15H25" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
    </motion.svg>
  ),

  Package: ({ size = 32, className = "", animated = false }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 32 32" 
      fill="none" 
      className={className}
      whileHover={{ rotateY: 15 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.path 
        d="M16 2L26 8V24L16 30L6 24V8L16 2Z" 
        fill="currentColor" 
        opacity="0.2"
        animate={animated ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path 
        d="M16 2L26 8V24L16 30L6 24V8L16 2Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <motion.path 
        d="M6 8L16 14L26 8M16 14V30" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      />
    </motion.svg>
  ),

  Tag: ({ size = 28, className = "", animated = false }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      className={className}
      whileHover={{ scale: 1.1, rotate: -10 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <motion.path 
        d="M2 13.5L13.5 2H25V13.5L13.5 25L2 13.5Z" 
        fill="currentColor" 
        opacity="0.2"
        animate={animated ? { rotate: [0, 5, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path 
        d="M2 13.5L13.5 2H25V13.5L13.5 25L2 13.5Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <motion.circle 
        cx="19" 
        cy="8" 
        r="2" 
        fill="currentColor"
        animate={animated ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.svg>
  ),

  Search: ({ size = 28, className = "", animated = false }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      className={className}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <motion.circle 
        cx="12" 
        cy="12" 
        r="8" 
        stroke="currentColor" 
        strokeWidth="2"
        fill="currentColor"
        opacity="0.1"
        animate={animated ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.circle 
        cx="12" 
        cy="12" 
        r="8" 
        stroke="currentColor" 
        strokeWidth="2"
        fill="none"
      />
      <motion.path 
        d="M21 21L25 25" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
        animate={animated ? { rotate: [0, 10, 0] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.svg>
  ),

  ShoppingBag: ({ size = 28, className = "", animated = false }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      className={className}
      whileHover={{ scale: 1.1, rotateZ: 5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <motion.path 
        d="M6 7H22L21 21H7L6 7Z" 
        fill="currentColor" 
        opacity="0.2"
        animate={animated ? { y: [0, -2, 0] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path 
        d="M6 7H22L21 21H7L6 7Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        fill="none"
      />
      <motion.path 
        d="M10 10V6C10 4.9 10.9 4 12 4H16C17.1 4 18 4.9 18 6V10" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8 }}
      />
    </motion.svg>
  ),

  User: ({ size = 16, className = "" }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      className={className}
      whileHover={{ scale: 1.1 }}
    >
      <motion.circle cx="8" cy="5" r="3" fill="currentColor" />
      <motion.path d="M2 13C2 10.8 4.8 9 8 9S14 10.8 14 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </motion.svg>
  ),

  LogOut: ({ size = 16, className = "" }) => (
    <motion.svg 
      width={size} 
      height={size} 
      viewBox="0 0 16 16" 
      fill="none" 
      className={className}
      whileHover={{ x: 2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <motion.path d="M6 14H3C2.4 14 2 13.6 2 13V3C2 2.4 2.4 2 3 2H6M11 11L14 8L11 5M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  )
};

// Enhanced Interactive Background
const InteractiveBackground = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100, 
        y: (e.clientY / window.innerHeight) * 100 
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Generate floating geometric shapes
  const geometricShapes = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 60 + 20,
    shape: ['circle', 'triangle', 'square', 'hexagon'][Math.floor(Math.random() * 4)],
    duration: Math.random() * 25 + 15,
    delay: Math.random() * 5
  }));

  // Generate flowing particles
  const flowingParticles = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 6 + 2,
    duration: Math.random() * 30 + 20
  }));

  // Generate grid dots that respond to mouse
  const gridDots = Array.from({ length: 80 }, (_, i) => {
    const row = Math.floor(i / 10);
    const col = i % 10;
    return {
      id: i,
      x: (col * 10) + 10,
      y: (row * 12.5) + 10,
    };
  });

  const ShapeComponent = ({ shape, size, className }) => {
    switch (shape) {
      case 'circle':
        return <div className={`rounded-full ${className}`} style={{ width: size, height: size }} />;
      case 'triangle':
        return (
          <div 
            className={className}
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size/2}px solid transparent`,
              borderRight: `${size/2}px solid transparent`,
              borderBottom: `${size}px solid currentColor`,
            }}
          />
        );
      case 'square':
        return <div className={className} style={{ width: size, height: size }} />;
      case 'hexagon':
        return (
          <div 
            className={`${className} relative`}
            style={{ width: size, height: size * 0.866 }}
          >
            <div
              className="absolute inset-0 bg-current transform rotate-60"
              style={{
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
              }}
            />
          </div>
        );
      default:
        return <div className={`rounded-full ${className}`} style={{ width: size, height: size }} />;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Animated Gradient Mesh */}
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          background: [
            "radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 20%, rgba(251, 146, 60, 0.2) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 20%, rgba(251, 146, 60, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)"
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Mouse-Following Glow */}
      <motion.div
        className="absolute w-96 h-96 rounded-full opacity-20"
        style={{
          background: "radial-gradient(circle, rgba(251, 146, 60, 0.4) 0%, transparent 70%)",
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: "translate(-50%, -50%)"
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
      />

      {/* Floating Geometric Shapes */}
      {geometricShapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute text-orange-300 opacity-10"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
            rotate: [0, 360, 0],
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.15, 0.05],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay
          }}
        >
          <ShapeComponent 
            shape={shape.shape} 
            size={shape.size} 
            className="text-current"
          />
        </motion.div>
      ))}

      {/* Flowing Particles */}
      {flowingParticles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-gradient-to-r from-orange-400 to-orange-600 opacity-20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -120, 0],
            x: [0, Math.random() * 80 - 40, 0],
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Interactive Grid Dots - Changed to Cute Subox Elements */}
      {Array.from({ length: 60 }, (_, i) => {
        const row = Math.floor(i / 10);
        const col = i % 10;
        const x = (col * 10) + 10;
        const y = (row * 15) + 10;
        
        const distance = Math.sqrt(
          Math.pow(mousePosition.x - x, 2) + Math.pow(mousePosition.y - y, 2)
        );
        const scale = Math.max(0.3, 1.5 - distance / 25);
        const opacity = Math.max(0.1, 0.9 - distance / 35);
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
            animate={{
              scale,
              opacity,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {/* Cute mini house or tag icons instead of dots */}
            {i % 3 === 0 ? (
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <path d="M1 3L4 1L7 3V6H5V5H3V6H1V3Z" fill="#E97451" opacity="0.6"/>
              </svg>
            ) : i % 3 === 1 ? (
              <svg width="6" height="6" viewBox="0 0 6 6" fill="none">
                <path d="M1 3L3 1H5V3L4 5L1 3Z" fill="#F59E0B" opacity="0.6"/>
                <circle cx="4" cy="2" r="0.5" fill="white" opacity="0.8"/>
              </svg>
            ) : (
              <div className="w-1 h-1 rounded-full bg-orange-300" />
            )}
          </motion.div>
        );
      })}

      {/* Pulsing Circles - Changed to Subox themed elements */}
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-orange-300 opacity-20 flex items-center justify-center"
          style={{
            left: `${20 + i * 15}%`,
            top: `${30 + i * 10}%`,
            width: 50 + i * 20,
            height: 50 + i * 20,
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.4, 0.1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 4 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5
          }}
        >
          {/* Mini Subox logo in the center */}
          {i % 2 === 0 && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 5L6 2L10 5V9H8V7H4V9H2V5Z" fill="#E97451" opacity="0.4"/>
              <circle cx="6" cy="4" r="0.5" fill="white" opacity="0.6"/>
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Enhanced Interactive Card Component
const InteractiveCard = ({ 
  icon, 
  title, 
  description, 
  action, 
  isSelected, 
  onClick, 
  authStatus, 
  gradient = "from-orange-400 to-orange-600" 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      layout
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl cursor-pointer transition-all duration-500 ${
        isSelected 
          ? `bg-gradient-to-br ${gradient} text-white shadow-2xl transform scale-105` 
          : "bg-white shadow-lg hover:shadow-2xl"
      }`}
    >
      {/* Animated Background Gradient */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
        animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
      />

      {/* Content */}
      <div className="relative z-10 p-8">
        {/* Icon Container */}
        <motion.div 
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
            isSelected ? "bg-white/20" : "bg-orange-100 group-hover:bg-orange-200"
          }`}
          whileHover={{ rotate: 360 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          <div className={isSelected ? "text-white" : "text-orange-600"}>
            {React.cloneElement(icon, { animated: isHovered })}
          </div>
        </motion.div>

        {/* Text Content */}
        <motion.h3 
          className={`text-2xl font-bold mb-3 ${
            isSelected ? "text-white" : "text-gray-900"
          }`}
          animate={isHovered ? { x: 5 } : { x: 0 }}
        >
          {title}
        </motion.h3>
        
        <motion.p 
          className={`mb-6 ${
            isSelected ? "text-orange-100" : "text-gray-600"
          }`}
          animate={isHovered ? { x: 5 } : { x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {description}
        </motion.p>

        {/* Auth Status */}
        <AnimatePresence>
          {authStatus && !isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-xs px-3 py-2 rounded-lg mb-4 ${
                authStatus.type === 'required' 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-green-600 bg-green-50'
              }`}
            >
              {authStatus.icon} {authStatus.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Text */}
        {!isSelected && (
          <motion.div 
            className="flex items-center text-orange-600 font-medium"
            animate={isHovered ? { x: 10 } : { x: 0 }}
          >
            <span>{action}</span>
            <motion.span
              className="ml-2"
              animate={isHovered ? { x: 5 } : { x: 0 }}
            >
              →
            </motion.span>
          </motion.div>
        )}

        {/* Loading Progress */}
        {isSelected && (
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 0.5 }}
            className="h-1 bg-white/30 mt-4 rounded-full"
          />
        )}
      </div>

      {/* Animated Border */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient} transform origin-left`}
        initial={{ scaleX: 0 }}
        animate={isHovered ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

// Main component content
function MoveOutPageContent() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [subleaseAction, setSubleaseAction] = useState<string | null>(null);
  const [saleAction, setSaleAction] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Event handlers
  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
    setSubleaseAction(null);
    setSaleAction(null);
  };

  const handleSubleaseActionSelect = (action: string) => {
    const authRequired = action === "write";
    
    if (authRequired && !user) {
      router.push('/auth?mode=signup');
      return;
    }

    setSubleaseAction(action);
    setTimeout(() => {
      if (action === "write") {
        router.push("/sublease/write/options/chat");
      } else {
        router.push("/sublease/firstSearch");
      }
    }, 500);
  };

  const handleSaleActionSelect = (action: string) => {
    const authRequired = action === "sell";
    
    if (authRequired && !user) {
      router.push('/auth?mode=signup');
      return;
    }

    setSaleAction(action);
    setTimeout(() => {
      if (action === "sell") {
        router.push("/sale/create/options/nonai");
      } else {
        router.push("/sale/browse");
      }
    }, 500);
  };

  const resetSelection = () => {
    setSelectedOption(null);
    setSubleaseAction(null);
    setSaleAction(null);
  };

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  const getUserDisplayName = () => {
    if (!user) return '';
    return user.displayName || user.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const name = getUserDisplayName();
    return name.charAt(0).toUpperCase();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { 
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };
// Add this new logo component
const SuboxLogo = ({ size = 200, className = "" }) => (
  <motion.div 
    className={`flex items-center justify-center ${className}`}
    whileHover={{ scale: 1.05 }}
    transition={{ duration: 0.3 }}
  >
    <svg width={size} height={size * 0.4} viewBox="0 0 400 160" fill="none">
      {/* House icon */}
      <motion.g
        animate={{ rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <path
          d="M45 55L65 40L85 55V75C85 77 83 79 81 79H49C47 79 45 77 45 75V55Z"
          fill="#E97451"
        />
        <path
          d="M40 60L65 40L90 60L65 35L40 60Z"
          fill="#D97706"
        />
        <rect x="60" y="65" width="10" height="8" fill="white" />
        <rect x="62" y="70" width="6" height="9" fill="white" />
      </motion.g>
      
      {/* Tag icon */}
      <motion.g
        animate={{ rotate: [0, -3, 3, 0] }}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
      >
        <path
          d="M95 50L105 40H120V50L115 60L95 50Z"
          fill="#E97451"
        />
        <circle cx="112" cy="45" r="2" fill="white" />
      </motion.g>

      {/* Subox text */}
      <motion.g
        animate={{ 
          fill: ["#2D3748", "#E97451", "#2D3748"]
        }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        <text x="140" y="55" fontSize="28" fontWeight="bold" fill="currentColor" fontFamily="Inter, sans-serif">
          Subox
        </text>
      </motion.g>
      
      {/* Subtitle */}
      <text x="140" y="75" fontSize="10" fill="#6B7280" fontFamily="Inter, sans-serif" letterSpacing="2">
        SUBLETS & MOVING SALES
      </text>
    </svg>
  </motion.div>
);

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 flex items-center justify-center">
        <motion.div 
          className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 relative overflow-hidden">
      <InteractiveBackground />
      
      {/* Header */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Enhanced Subox Logo */}
            <motion.div 
              className="flex items-center space-x-4 relative"
              whileHover={{ scale: 1.05 }}
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
              <motion.div className="flex flex-col">
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
 
              {/* Interactive Follower Elements */}
              <motion.div className="absolute -inset-4 pointer-events-none">
                {Array.from({ length: 6 }, (_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-orange-300 rounded-full opacity-60"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + Math.sin(i) * 20}%`,
                    }}
                    animate={{
                      x: [0, 10, -10, 0],
                      y: [0, -5, 5, 0],
                      scale: [0.5, 1, 0.5],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 3 + i * 0.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-4">
              {/* Enhanced Back Button */}
              <AnimatePresence>
                {selectedOption && (
                  <motion.button 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetSelection}
                    className="flex items-center px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    <CustomIcons.ArrowLeft size={18} className="mr-2 text-gray-600" />
                    <span className="font-medium text-gray-700">Back</span>
                  </motion.button>
                )}
              </AnimatePresence>
              
              {/* Enhanced User Menu */}
              {user ? (
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSignOut}
                    className="hidden md:flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <CustomIcons.LogOut size={16} className="mr-1" />
                    Sign Out
                  </motion.button>
                  
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <motion.div 
                        className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <span className="text-orange-600 font-medium text-sm">
                          {getUserInitials()}
                        </span>
                      </motion.div>
                      <div className="hidden sm:block text-left">
                        <div className="text-sm font-medium text-gray-900">
                          Welcome, {getUserDisplayName()}!
                        </div>
                        <div className="text-xs text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </motion.button>
                    
                    <AnimatePresence>
                      {showUserMenu && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-50 border border-gray-200"
                          >
                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                              <div className="font-medium">{getUserDisplayName()}</div>
                              <div className="text-xs text-gray-500 truncate">{user.email}</div>
                            </div>
                            <motion.button
                              whileHover={{ backgroundColor: "#f3f4f6" }}
                              onClick={() => {
                                setShowUserMenu(false);
                                router.push('/profile');
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700"
                            >
                              <CustomIcons.User size={16} className="mr-2" />
                              Profile
                            </motion.button>
                            <motion.button
                              whileHover={{ backgroundColor: "#f3f4f6" }}
                              onClick={() => {
                                setShowUserMenu(false);
                                router.push('/my-listings');
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700"
                            >
                              <CustomIcons.Home size={16} className="mr-2" />
                              My Listings
                            </motion.button>
                            <div className="border-t border-gray-100 my-1"></div>
                            <motion.button
                              whileHover={{ backgroundColor: "#fef2f2" }}
                              onClick={handleSignOut}
                              className="flex items-center w-full px-4 py-2 text-sm text-red-600"
                            >
                              <CustomIcons.LogOut size={16} className="mr-2" />
                              Sign Out
                            </motion.button>
                          </motion.div>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setShowUserMenu(false)}
                          />
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/auth')}
                  className="px-4 py-2 text-orange-600 hover:text-orange-700 font-medium"
                >
                  Sign In
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
 
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        {/* Enhanced Page Title */}
        <motion.div 
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 relative"
        >
          <AnimatePresence mode="wait">
            {selectedOption ? (
              <motion.div
                key="selected"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <motion.h1 
                  className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
                  animate={{ 
                    background: ["linear-gradient(45deg, #E97451, #F59E0B)", "linear-gradient(45deg, #F59E0B, #E97451)"],
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent"
                  }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                >
                  {selectedOption === "sublease" ? "Sublease Options" : "Moving Sale"}
                </motion.h1>
                <motion.p 
                  className="text-lg text-gray-600 max-w-2xl mx-auto"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  Choose your path below
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                key="main"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative"
              >
                {/* Floating Subox Mascot Elements */}
                <motion.div className="absolute -top-8 left-1/2 transform -translate-x-1/2 pointer-events-none">
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: `${-100 + i * 50}px`,
                        top: `${Math.sin(i) * 20}px`,
                      }}
                    >
                      {/* Mini House Icons */}
                      <motion.svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        animate={{
                          y: [0, -10, 0],
                          rotate: [0, 5, 0],
                          opacity: [0.4, 0.8, 0.4]
                        }}
                        transition={{
                          duration: 3 + i * 0.5,
                          repeat: Infinity,
                          delay: i * 0.3
                        }}
                      >
                        <path d="M4 9L10 4L16 9V15H12V12H8V15H4V9Z" fill="#E97451" opacity="0.6"/>
                        <circle cx="10" cy="8" r="1" fill="white" />
                      </motion.svg>
                    </motion.div>
                  ))}
                </motion.div>
 
              
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Main Options */}
        <AnimatePresence mode="wait">
          {!selectedOption && (
            <motion.div 
              key="main-options"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {/* Sublease Option */}
              <motion.div variants={itemVariants}>
                <InteractiveCard
                  icon={<CustomIcons.Home size={32} />}
                  title="Sublease Space"
                  description="List your apartment or find your next home with ease"
                  action="Get Started"
                  onClick={() => handleOptionSelect("sublease")}
                  gradient="from-orange-400 to-orange-600"
                />
              </motion.div>
              
              {/* Moving Sale Option */}
              <motion.div variants={itemVariants}>
                <InteractiveCard
                  icon={<CustomIcons.Package size={32} />}
                  title="Moving Sale"
                  description="Sell items or find great deals from students near you"
                  action="Get Started"
                  onClick={() => handleOptionSelect("sale")}
                  gradient="from-orange-400 to-orange-600"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Sublease Sub-Options */}
        <AnimatePresence mode="wait">
          {selectedOption === "sublease" && (
            <motion.div 
              key="sublease-options"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {/* List Your Space */}
              <motion.div variants={itemVariants}>
                <InteractiveCard
                  icon={<CustomIcons.Key size={28} />}
                  title="List Your Space"
                  description="Create a stunning listing for your apartment or room"
                  action="Create Listing"
                  isSelected={subleaseAction === "write"}
                  onClick={() => handleSubleaseActionSelect("write")}
                  authStatus={!user ? {
                    type: 'required',
                    icon: <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />,
                    text: 'Sign in required to create listings'
                  } : {
                    type: 'ready',
                    icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
                    text: 'Ready to create listings!'
                  }}
                  gradient="from-blue-400 to-purple-600"
                />
              </motion.div>
              
              {/* Find a Sublease */}
              <motion.div variants={itemVariants}>
                <InteractiveCard
                  icon={<CustomIcons.Search size={28} />}
                  title="Find a Sublease"
                  description="Browse available spaces and find your perfect match"
                  action="Browse Listings"
                  isSelected={subleaseAction === "browse"}
                  onClick={() => handleSubleaseActionSelect("browse")}
                  authStatus={{
                    type: 'ready',
                    icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
                    text: 'No account needed to browse'
                  }}
                  gradient="from-green-400 to-blue-600"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Moving Sale Sub-Options */}
        <AnimatePresence mode="wait">
          {selectedOption === "sale" && (
            <motion.div 
              key="sale-options"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto"
            >
              {/* Sell Your Items */}
              <motion.div variants={itemVariants}>
                <InteractiveCard
                  icon={<CustomIcons.Tag size={28} />}
                  title="Sell Your Items"
                  description="List furniture and items with beautiful photos and descriptions"
                  action="Create Listing"
                  isSelected={saleAction === "sell"}
                  onClick={() => handleSaleActionSelect("sell")}
                  authStatus={!user ? {
                    type: 'required',
                    icon: <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />,
                    text: 'Sign in required to sell items'
                  } : {
                    type: 'ready',
                    icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
                    text: 'Ready to sell items!'
                  }}
                  gradient="from-purple-400 to-pink-600"
                />
              </motion.div>
              
              {/* Browse Items */}
              <motion.div variants={itemVariants}>
                <InteractiveCard
                  icon={<CustomIcons.ShoppingBag size={28} />}
                  title="Browse Items"
                  description="Find amazing deals on furniture and essentials from fellow students"
                  action="Browse Items"
                  isSelected={saleAction === "buy"}
                  onClick={() => handleSaleActionSelect("buy")}
                  authStatus={{
                    type: 'ready',
                    icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
                    text: 'No account needed to browse'
                  }}
                  gradient="from-yellow-400 to-orange-600"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
 
       
      </div>
    </div>
  );
 }

// Main component with AuthProvider wrapper
export default function MoveOutPage() {
  return (
    <AuthProvider>
      <MoveOutPageContent />
    </AuthProvider>
  );
}