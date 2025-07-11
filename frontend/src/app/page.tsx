"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Home, Search, Camera, Package, MapPin, Users, Star,
  ArrowRight, Play, ChevronRight, Check, Heart, Truck,
  Calendar, Bus, Bike, Filter, DollarSign, Sparkles,
  Grid3X3, List, Bell, User, Plus, X, Zap, Upload,
  Scan, Image as ImageIcon, ShoppingBag, MessageCircle,
  Navigation, Clock, Video, Phone,
  Brain, Wand2, MessageSquare, Cpu, RefreshCw, CheckCircle,
  AlertCircle, Smartphone, Send, ChevronLeft, FileText, Target,
  ThumbsUp, BedDouble, Lightbulb, ChevronDown, Award, TrendingUp,
  XCircle,
  GitCompare, SlidersHorizontal,
  Wifi, Car, Snowflake, Dumbbell, Eye, GraduationCap,
  Building, TreePine, Coffee, Shield
} from 'lucide-react';


const SuboxHomepage = () => {
  const [activeDemo, setActiveDemo] = useState('sale');
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [capturedItems, setCapturedItems] = useState([]);
  const [isDemoFocused, setIsDemoFocused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [demoHover, setDemoHover] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assemblyStep, setAssemblyStep] = useState(0);
  
  const stepInterval = useRef(null);
  const assemblyInterval = useRef(null);
  const suboxIntroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  
  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const featuresY = useTransform(scrollYProgress, [0.2, 0.8], [100, -50]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);

  // Smooth scroll to Subox introduction
  const scrollToSuboxIntro = () => {
    suboxIntroRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Auto-play demo steps
  useEffect(() => {
    if (isPlaying) {
      stepInterval.current = setInterval(() => {
        setCurrentStep(prev => {
          const maxSteps = activeDemo === 'sublease' ? subleaseSteps.length - 1 : saleSteps.length - 1;
          return prev >= maxSteps ? 0 : prev + 1;
        });
      }, 3000);
    } else {
      clearInterval(stepInterval.current);
    }
    
    return () => clearInterval(stepInterval.current);
  }, [isPlaying, activeDemo]);

  // Assembly animation effect
  useEffect(() => {
    if (isAssembling) {
      assemblyInterval.current = setInterval(() => {
        setAssemblyStep(prev => {
          if (prev >= 3) {
            setIsAssembling(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1500);
    } else {
      clearInterval(assemblyInterval.current);
    }
    
    return () => clearInterval(assemblyInterval.current);
  }, [isAssembling]);

  // Enhanced demo focus handlers with epic transitions
  const handleDemoFocus = () => {
    setIsDemoFocused(true);
  };

  const handleDemoClose = (e) => {
    e.stopPropagation();
    setIsDemoFocused(false);
  };

  const subleaseSteps = [
    {
      title: "Search Perfect Sublease",
      description: "Find your ideal temporary housing with advanced filters",
      component: <SubleaseSearchDemo step={currentStep} />,
      icon: <Search size={24} />
    },
    {
      title: "Explore Neighborhoods", 
      description: "Discover campus areas with commute calculations",
      component: <NeighborhoodDemo step={currentStep} />,
      icon: <MapPin size={24} />
    },
    {
      title: "Connect with Hosts",
      description: "Chat directly with verified student hosts",
      component: <ConnectDemo step={currentStep} />,
      icon: <Users size={24} />
    },
    {
      title: "Secure Your Stay",
      description: "Book with confidence using our secure platform",
      component: <BookingDemo step={currentStep} />,
      icon: <Check size={24} />
    }
  ];

  const saleSteps = [
    {
      title: "Capture Your Items",
      description: "Take photos or scan items instantly",
      component: <CameraDemo step={currentStep} capturedItems={capturedItems} setCapturedItems={setCapturedItems} />,
      icon: <Camera size={24} />
    },
    {
      title: "AI-Powered Magic",
      description: "Smart categorization and pricing in seconds",
      component: <AIProcessingDemo step={currentStep} capturedItems={capturedItems} />,
      icon: <Sparkles size={24} />
    },
    {
      title: "Instant Marketplace",
      description: "Your items go live automatically",
      component: <ListingDemo step={currentStep} capturedItems={capturedItems} />,
      icon: <Package size={24} />
    },
    {
      title: "Connect & Sell",
      description: "Chat with buyers and close deals fast",
      component: <SalesDemo step={currentStep} capturedItems={capturedItems} />,
      icon: <DollarSign size={24} />
    }
  ];

  const currentSteps = activeDemo === 'sublease' ? subleaseSteps : saleSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-50 relative overflow-hidden">

      {/* Animated Background Elements */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ scale: backgroundScale }}
      >
        <motion.div 
          className="absolute w-96 h-96 bg-gradient-to-r from-orange-200/30 to-orange-300/30 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * 0.02,
            y: mousePosition.y * 0.02,
            rotate: 360,
          }}
          transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" } }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div 
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-200/30 to-purple-300/30 rounded-full blur-3xl"
          animate={{
            x: mousePosition.x * -0.01,
            y: mousePosition.y * -0.01,
            rotate: -360,
          }}
          transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" } }}
          style={{ top: '60%', right: '10%' }}
        />
      </motion.div>

      {/* Navigation */}
      <motion.nav 
        className="relative z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="relative">
                <motion.div 
                  className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Home size={20} className="text-white" />
                  <Package size={12} className="text-white absolute -top-1 -right-1" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Su<span className="text-orange-500">box</span>
                </h1>
                <p className="text-xs text-gray-500 font-medium">SUBLETS & MOVING SALES</p>
              </div>
            </motion.div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'How it Works', 'Pricing'].map((item, i) => (
                <motion.a 
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  className="text-gray-600 hover:text-orange-500 font-medium transition-colors relative"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                >
                  {item}
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500 origin-left"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <motion.button
                className="px-4 py-2 text-gray-600 hover:text-orange-500 font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                Log in
              </motion.button>
              <motion.button
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                Get Started
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section with Furniture Animation */}
      <motion.section 
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
        style={{ y: heroY }}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-16">
          {/* Hero Text - Left Side */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              className="perspective-1000"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight cursor-default"
                initial={{ opacity: 0, y: 30, rotateX: 20 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                whileHover={{ 
                  rotateX: 5,
                  rotateY: 2,
                  scale: 1.02,
                  textShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  transition: { duration: 0.3 }
                }}
                style={{
                  transformStyle: "preserve-3d",
                  textShadow: "0 5px 15px rgba(0,0,0,0.1)"
                }}
              >
                <motion.span
                  className="inline-block"
                  whileHover={{ 
                    rotateX: -3,
                    y: -4,
                    transition: { duration: 0.3, type: "spring", stiffness: 400 }
                  }}
                >
                  Student life.
                </motion.span>
                <br />
                <motion.span 
                  className="text-orange-500 inline-block"
                  initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  whileHover={{ 
                    rotateY: 5,
                    rotateX: -2,
                    scale: 1.05,
                    y: -8,
                    textShadow: "0 15px 35px rgba(249, 115, 22, 0.3)",
                    transition: { duration: 0.3, type: "spring", stiffness: 300 }
                  }}
                  style={{
                    transformStyle: "preserve-3d",
                    textShadow: "0 8px 20px rgba(249, 115, 22, 0.2)"
                  }}
                >
                  Simplified.
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 mb-8 max-w-3xl leading-relaxed cursor-default"
                initial={{ opacity: 0, y: 20, rotateX: 15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                whileHover={{ 
                  rotateX: 2,
                  y: -3,
                  scale: 1.01,
                  textShadow: "0 5px 15px rgba(0,0,0,0.08)",
                  transition: { duration: 0.3 }
                }}
                style={{
                  transformStyle: "preserve-3d",
                  textShadow: "0 2px 8px rgba(0,0,0,0.05)"
                }}
              >
                <motion.span
                  className="inline-block"
                  whileHover={{ 
                    rotateX: -1,
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                >
                  The all-in-one platform for student housing and campus marketplace.
                </motion.span>
                {" "}
                <motion.span
                  className="inline-block font-semibold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent"
                  whileHover={{ 
                    rotateY: 3,
                    scale: 1.05,
                    y: -3,
                    transition: { duration: 0.3, type: "spring", stiffness: 400 }
                  }}
                  style={{
                    filter: "drop-shadow(0 4px 8px rgba(249, 115, 22, 0.15))"
                  }}
                >
                  Capture, list, and sell your items instantly with AI-powered magic.
                </motion.span>
              </motion.p>
            </motion.div>

            {/* Sign Up / Sign In Section */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
            >
              <motion.button
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="flex items-center justify-center gap-2">
                  Get Started Free
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ArrowRight size={20} />
                  </motion.div>
                </span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Furniture Animation Container - Right Side */}
          <motion.div 
            className="flex-1 relative w-full h-[600px] perspective-1000"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            {/* L-shaped Sofa - Top Left Position */}
            <motion.div
              className="absolute z-10"
              initial={{ 
                x: -400,
                y: -100,
                scale: 1.4,
                rotate: 0,
                opacity: 0
              }}
              animate={{
                x: 20,
                y: 5,
                scale: 1.8,
                rotate: 0,
                opacity: 1,
              }}
              transition={{ 
                duration: 1.5, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.5
              }}
            >
              <motion.img
                src="Sofa_Left.png"
                alt="L-shaped sofa"
                className="w-80 h-80 object-contain drop-shadow-2xl"
                whileHover={{ 
                  scale: 1.05, 
                  transition: { duration: 0.3 }
                }}
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{
                  y: { 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 2
                  }
                }}
              />
              
              {/* Sofa assembly particles */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.5 }}
              >
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 bg-orange-400 rounded-full"
                    style={{
                      top: `${15 + i * 6}%`,
                      left: `${10 + i * 7}%`,
                    }}
                    animate={{
                      scale: [0, 1, 0],
                      opacity: [0, 0.8, 0],
                      y: [0, -30, -60],
                      x: [0, Math.random() * 20 - 10],
                    }}
                    transition={{
                      duration: 2,
                      delay: 1.3 + i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 4
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Coffee Table - Center Bottom Position */}
            <motion.div
              className="absolute z-5"
              initial={{ 
                x: 0,
                y: -400,
                scale: 1.0,
                rotate: 0,
                opacity: 0
              }}
              animate={{
                x: 120,
                y: 200,
                scale: 1.2,
                rotate: 0,
                opacity: 1,
              }}
              transition={{ 
                duration: 1.2, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 1.5
              }}
            >
              <motion.img
                src="Table.png"
                alt="Coffee table"
                className="w-48 h-48 object-contain drop-shadow-xl"
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { duration: 0.3 }
                }}
                animate={{
                  x: [0, 3, 0, -3, 0],
                }}
                transition={{
                  x: { 
                    duration: 5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 3
                  }
                }}
              />
              
              {/* Table assembly particles */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.5 }}
              >
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      background: `linear-gradient(45deg, #f97316, #8b5cf6)`,
                      top: `${5 + i * 6}%`,
                      left: `${5 + i * 6}%`,
                    }}
                    animate={{
                      scale: [0, 1.5, 0],
                      opacity: [0, 1, 0],
                      y: [0, -40],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 2.2,
                      delay: 2.1 + i * 0.1,
                      repeat: Infinity,
                      repeatDelay: 4
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Single Chair - Right Center Position */}
            <motion.div
              className="absolute z-10"
              initial={{ 
                x: 600,
                y: 100,
                scale: 1.4,
                rotate: 0,
                opacity: 0
              }}
              animate={{
                x: 320,
                y: 260,
                scale: 1.3,
                rotate: -1,
                opacity: 1,
              }}
              transition={{ 
                duration: 1.5, 
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: 0.8
              }}
            >
              <motion.img
                src="Sofa_Right.png"
                alt="Single chair"
                className="w-64 h-64 object-contain drop-shadow-2xl"
                whileHover={{ 
                  scale: 1.05, 
                  transition: { duration: 0.3 }
                }}
                animate={{
                  y: [0, -3, 0],
                }}
                transition={{
                  y: { 
                    duration: 3.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 2.5
                  }
                }}
              />
              
              {/* Chair assembly particles */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.3, duration: 0.5 }}
              >
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-purple-400 rounded-full"
                    style={{
                      top: `${25 + i * 8}%`,
                      left: `${20 + i * 8}%`,
                    }}
                    animate={{
                      scale: [0, 1.2, 0],
                      opacity: [0, 0.9, 0],
                      y: [0, -25, -50],
                      rotate: [0, 180, 360],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: 1.6 + i * 0.15,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>

            {/* Purple decorative dots positioned like in image 2 */}
            <motion.div
              className="absolute w-3 h-3 bg-purple-400 rounded-full opacity-70"
              style={{ top: '15%', right: '5%' }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-60"
              style={{ top: '45%', right: '15%' }}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 2
              }}
            />
            <motion.div
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-50"
              style={{ top: '25%', left: '45%' }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
            <motion.div
              className="absolute w-2.5 h-2.5 bg-purple-400 rounded-full opacity-80"
              style={{ bottom: '25%', right: '8%' }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
            <motion.div
              className="absolute w-2 h-2 bg-purple-300 rounded-full opacity-60"
              style={{ bottom: '40%', left: '75%' }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.6, 0.9, 0.6],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1.5
              }}
            />

            {/* Assembly completion glow effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-200/20 via-purple-200/20 to-orange-200/20 rounded-full blur-3xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </motion.div>

            {/* Final celebration burst */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-15"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 4, duration: 0.1 }}
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: `linear-gradient(45deg, ${['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f5950b'][i % 5]}, ${['#fb923c', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24'][i % 5]})`,
                    top: '40%',
                    left: '40%',
                  }}
                  animate={{
                    x: Math.cos(i * 18 * Math.PI / 180) * (100 + Math.random() * 80),
                    y: Math.sin(i * 18 * Math.PI / 180) * (100 + Math.random() * 80),
                    scale: [1, 1.3, 0],
                    opacity: [1, 0.7, 0],
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 2.5,
                    ease: "easeOut",
                    delay: 4 + Math.random() * 0.5
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Subox Introduction Section - Listing Detail Style */}
        <motion.section 
          ref={suboxIntroRef}
          className="relative z-10 max-w-4xl mx-auto px-6 py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ marginTop: "-140px" }} // CHANGE THIS VALUE TO MOVE DESTINATION HIGHER (-100px moves it up)
        >

          {/* Main content box - matching listing detail style */}
          <motion.div 
            className="bg-white p-6 rounded-lg shadow-md"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
             {/* Image section - matching the listing layout */}
            <div className="flex flex-col md:flex-row md:gap-4 mb-6">
              {/* Main picture */}
              <div className="md:w-190 h-72 md:h-96 rounded-lg overflow-hidden mb-4 md:mb-0">
                <img 
                  src="/Sublease.png"
                  alt="Subox Platform Main View"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Additional pictures */}
              <div className="md:w-1/2">
                <div className="grid grid-cols-1.5 gap-1 h-full">
                  <div className="h-24 md:h-auto rounded-lg overflow-hidden">
                    <img 
                      src="/Moveout.png"
                      alt="Subox Housing Features"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Key information - matching the listing detail style */}
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
              <h2 className="text-xl font-bold text-orange-800 mb-2">Platform Features</h2>
              <div className="space-y-2">
                <p className="flex items-center text-gray-700"><DollarSign className="w-4 h-4 mr-2 text-orange-500" /> Free to Start</p>
                <p className="flex items-center text-gray-700"><BedDouble className="w-4 h-4 mr-2 text-orange-500" /> Housing & Marketplace</p>
                <p className="flex items-center text-gray-700"><Calendar className="w-4 h-4 mr-2 text-orange-500" /> Available 24/7</p>
                <p className="flex items-center text-gray-700"><Star className="w-4 h-4 mr-2 text-orange-500" /> Student Verified</p>
                
                {/* Additional feature */}
                <p className="flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-500" />
                  <span className="text-green-600 font-medium">For Everyone</span>
                </p>
              </div>
            </div>
            
            {/* Platform Information - matching host info style */}
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
              <h2 className="text-xl font-bold text-orange-800 mb-2">About Subox</h2>
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-full overflow-hidden mr-4 flex-shrink-0 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                  <Package size={32} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="font-medium text-lg text-gray-700">Subox Team</h3>
                    {/* Platform verified badge */}
                    <div className="ml-2 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Platform Verified
                    </div>
                  </div>
                  {/* Platform description */}
                  <p className="text-gray-700 mt-2">
                    Fully designed, developed, and organized by Taehoon Kang, with support from Ian Kim and Yejin Shin.
                  </p>
                </div>
              </div>
            </div>

            {/* Connect/Action buttons - matching the listing style */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button className="flex-1 bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-orange-200 transition flex items-center justify-center cursor-pointer">
                  <Heart className="mr-2" />
                  Learn More
                </button>
                
                <button className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex items-center justify-center cursor-pointer">
                  Get Started
                </button>
              </div>
            </div>
          </motion.div>

          {/* Additional information sections - matching listing detail */}
          <div className="space-y-4 mt-6">
            {/* How it works */}
            <motion.div 
              className="bg-white p-4 rounded-lg shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h2 className="text-lg font-semibold mb-2 text-orange-800">How Subox Works</h2>
              <p className="text-gray-700">Simply create an account, search for housing or list items for sale. Our AI-powered platform makes it easy to connect with other students in your area.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-4 rounded-lg shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Built Only for Students?</h2>
              <p className="text-gray-700">
                Nope! Subox welcomes anyone looking for flexible, months-long stays. Planning a long internship or remote semester? You'll find better deals here than scrolling Airbnb. List or sublease for a semester, a summer, or however long you need—no limits, zero hassle.
              </p>
            </motion.div>

            {/* Platform benefits */}
            <motion.div 
              className="bg-white p-4 rounded-lg shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Why Choose Subox</h2>
              <p className="text-gray-700">
                Built by a student who procrastinates everything until the last possible second. We get the chaos of finals, packing, and not knowing where your internship even is yet. That's why we created Subox: an AI-powered, zero-effort platform made for students who just need things to work, fast.
              </p>
            </motion.div>
            
            {/* Platform Features */}
            <motion.div 
              className="bg-white p-4 rounded-lg shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Key Features</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 flex items-center justify-center text-orange-500 mr-2">
                    <Search size={16} />
                  </div>
                  <span className="text-gray-700 capitalize">Smart Search with Google Map</span>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 flex items-center justify-center text-orange-500 mr-2">
                    <Camera size={16} />
                  </div>
                  <span className="text-gray-700 capitalize">Instant Listing</span>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 flex items-center justify-center text-orange-500 mr-2">
                    <Users size={16} />
                  </div>
                  <span className="text-gray-700 capitalize">Student Network</span>
                </div>
                <div className="flex items-center p-2 bg-gray-50 rounded">
                  <div className="w-6 h-6 flex items-center justify-center text-orange-500 mr-2">
                    <Check size={16} />
                  </div>
                  <span className="text-gray-700 capitalize">Verified Users</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Demo Toggle */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <div className="bg-white rounded-2xl p-2 shadow-xl border border-gray-200">
            <div className="flex gap-2">
              <motion.button
                onClick={() => {
                  setActiveDemo('sublease');
                  setCurrentStep(0);
                }}
                className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                  activeDemo === 'sublease' 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home size={20} className="inline mr-2" />
                Sublease Housing
              </motion.button>
              <motion.button
                onClick={() => {
                  setActiveDemo('sale');
                  setCurrentStep(0);
                }}
                className={`px-8 py-4 rounded-xl font-semibold transition-all ${
                  activeDemo === 'sale' 
                    ? 'bg-orange-500 text-white shadow-lg' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Camera size={20} className="inline mr-2" />
                Instant Selling
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Interactive Workflow Demo */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8 relative z-10">
        {/* Step Navigation */}
        <motion.div 
          className="space-y-1"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
        >
          {/* Play Controls */}
          <div className="flex items-center gap-4 mb-8">
            <motion.button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                isPlaying 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-orange-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isPlaying ? <X size={16} /> : <Play size={16} />}
              {isPlaying ? 'Stop Demo' : 'Play Demo'}
            </motion.button>
            <span className="text-sm text-gray-500">
              {currentStep + 1} of {currentSteps.length}
            </span>
          </div>

          {/* Steps */}
          <AnimatePresence>
            {currentSteps.map((step, index) => (
              <motion.div
                key={`${activeDemo}-${index}`}
                onClick={() => setCurrentStep(index)}
                className={`p-6 rounded-xl cursor-pointer transition-all ${
                  currentStep === index
                    ? 'bg-white shadow-xl border-2 border-orange-200'
                    : 'bg-white/60 hover:bg-white hover:shadow-lg border border-gray-200'
                }`}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, x: -50 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  scale: currentStep === index ? 1.02 : 1,
                  borderColor: currentStep === index ? '#fed7aa' : '#e5e7eb'
                }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <motion.div 
                    className={`p-3 rounded-lg ${
                      currentStep === index 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                    animate={{
                      backgroundColor: currentStep === index ? '#f97316' : '#f3f4f6',
                      color: currentStep === index ? '#ffffff' : '#4b5563',
                      rotate: currentStep === index ? 360 : 0
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    {step.icon}
                  </motion.div>
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold mb-2 ${
                      currentStep === index ? 'text-gray-900' : 'text-gray-600'
                    }`}>
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {currentStep === index && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-orange-500"
                    >
                      <ArrowRight size={24} />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Enhanced Demo Visualization */}
        <motion.div 
          className={`relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden cursor-pointer ${
            isDemoFocused ? 'fixed top-[2%] left-[2%] right-[2%] bottom-[2%] z-50' : ''
          }`}
          initial={{ opacity: 0, x: 100, rotateY: 45 }}
          animate={isDemoFocused ? {
            opacity: 1,
            x: 0,
            y: 0,
            rotateY: 0,
            rotateX: 0,
            scale: 1,
            borderRadius: "40px",
            transition: { 
              type: "spring", 
              stiffness: 120, 
              damping: 20, 
              duration: 1.5,
              ease: [0.175, 0.885, 0.32, 1.275]
            }
          } : {
            opacity: 1,
            x: 0,
            rotateY: 0,
            rotateX: 0,
            scale: demoHover ? 1.05 : 1,
            y: demoHover ? -20 : 0,
            borderRadius: "24px",
            transition: { 
              delay: isDemoFocused ? 0 : 1.4, 
              duration: 0.5, 
              ease: "easeOut" 
            }
          }}
          style={!isDemoFocused ? { minHeight: '600px' } : {}}
          onClick={handleDemoFocus}
          onMouseEnter={() => setDemoHover(true)}
          onMouseLeave={() => setDemoHover(false)}
          whileHover={!isDemoFocused ? { 
            rotateX: 8,
            rotateY: -4,
            boxShadow: "0 50px 100px -20px rgba(249, 115, 22, 0.4)",
            transition: { duration: 0.4, ease: "easeOut" }
          } : {}}
          whileTap={!isDemoFocused ? {
            scale: 0.95,
            rotateX: 12,
            rotateY: -6,
            transition: { duration: 0.15, ease: "easeInOut" }
          } : {}}
        >
          {/* Enhanced interactive glow effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-transparent to-purple-400/20 pointer-events-none"
            animate={{
              opacity: demoHover && !isDemoFocused ? [0, 0.5, 0] : 0,
              scale: demoHover && !isDemoFocused ? [1, 1.03, 1] : 1,
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Epic expansion effect on tap */}
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl"
            initial={{ scale: 0, opacity: 0 }}
            animate={isDemoFocused ? {
              scale: [0, 0.3, 1.2, 2],
              opacity: [0, 0.4, 0.2, 0],
            } : { scale: 0, opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="w-full h-full bg-gradient-to-br from-orange-300/40 via-orange-400/30 to-purple-400/40 rounded-3xl" />
          </motion.div>

          {/* Explosive ring effect on tap */}
          <AnimatePresence>
            {isDemoFocused && (
              <>
                <motion.div
                  className="absolute inset-0 border-4 border-orange-400/60 rounded-3xl pointer-events-none"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ 
                    scale: [1, 1.5, 2.5],
                    opacity: [0.8, 0.4, 0],
                    borderWidth: ["4px", "8px", "2px"]
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 border-2 border-purple-400/40 rounded-3xl pointer-events-none"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ 
                    scale: [1, 2, 3.5],
                    opacity: [0.6, 0.3, 0],
                  }}
                  transition={{ duration: 1.3, ease: "easeOut", delay: 0.1 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Demo content with epic scaling */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeDemo}-${currentStep}`}
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                y: 0, 
                scale: 1,
                transition: {
                  delay: isDemoFocused ? 0.6 : 0,
                  duration: isDemoFocused ? 1 : 0.5,
                  ease: "easeOut"
                }
              }}
              exit={{ opacity: 0, y: -40, scale: 1.1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={isDemoFocused ? "p-16 h-full overflow-auto" : "p-8 h-full"}
            >
              <motion.div
                animate={{
                  scale: isDemoFocused ? 1.15 : 1,
                }}
                transition={{ 
                  delay: isDemoFocused ? 0.8 : 0,
                  duration: 0.8, 
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                <motion.div
                  animate={isDemoFocused ? {
                    rotateY: [0, 5, 0],
                    rotateX: [0, 2, 0],
                  } : {}}
                  transition={{ 
                    delay: 1,
                    duration: 2,
                    ease: "easeInOut"
                  }}
                >
                  {currentSteps[currentStep]?.component}
                </motion.div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Enhanced close button */}
          <AnimatePresence>
            {isDemoFocused && (
              <motion.div
                className="absolute top-6 right-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <motion.button
                  className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
                  initial={{ opacity: 0, scale: 0, rotate: -90 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0, rotate: 90 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  onClick={handleDemoClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={20} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Enhanced Interactive Features Section */}
      <InteractiveFeaturesSection featuresY={featuresY} />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};




// Interactive Features Section Component
const InteractiveFeaturesSection = ({ featuresY }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  
  const features = [
    {
    icon: <Target size={32} />,
    title: "Our Mission",
    description: "Simple, functional, and always improving - built for students, by students",
    color: "from-green-500 to-emerald-500",
    demo: <MissionDemo />
  }
,
    {
      icon: <Zap size={32} />,
      title: "Instant Processing",
      description: "Get price suggestions and descriptions in seconds",
      color: "from-orange-500 to-red-500",
      demo: <BadgeFeatureDemo/>
    },
    {
      icon: <Users size={32} />,
      title: "Campus Network",
      description: "Connect with verified students in your area instantly",
      color: "from-purple-500 to-pink-500",
      demo: <NetworkFeatureDemo />
    },
  ];

  return (
    <motion.section 
      ref={ref}
      className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      style={{ y: featuresY }}
      id="features"
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16"
      >
        <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Built for <span className="text-orange-500">instant</span> student life
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Revolutionary AI-powered platform that makes selling your stuff as easy as taking a photo
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard key={index} feature={feature} index={index} isInView={isInView} />
        ))}
      </div>
    </motion.section>
  );
};

// Enhanced Feature Card Component
const FeatureCard = ({ feature, index, isInView }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotateX: 45 }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        rotateX: 0 
      } : { 
        opacity: 0, 
        y: 100, 
        rotateX: 45 
      }}
      transition={{ 
        delay: index * 0.2, 
        duration: 0.8, 
        ease: "easeOut" 
      }}
      whileHover={{ 
        y: -20, 
        scale: 1.05,
        rotateY: 5,
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group perspective-1000"
    >
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 h-full relative overflow-hidden transform-gpu">
        {/* Animated Background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
          animate={{
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? 10 : 0,
          }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Icon */}
        <motion.div 
          className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 shadow-lg relative z-10`}
          animate={{
            scale: isHovered ? 1.2 : 1,
            rotate: isHovered ? 360 : 0,
            y: isHovered ? -10 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {feature.icon}
        </motion.div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-4 relative z-10">{feature.title}</h3>
        <p className="text-gray-600 leading-relaxed mb-6 relative z-10">{feature.description}</p>
        
        {/* Interactive Demo Area */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: isHovered ? 1 : 0, 
            height: isHovered ? 'auto' : 0 
          }}
          transition={{ duration: 0.3 }}
        >
          {isHovered && feature.demo}
        </motion.div>
      </div>
    </motion.div>
  );
};

// Demo Components for Features


const CameraFeatureDemo = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative">
        {/* iPhone Frame */}
        <svg
          viewBox="0 0 375 812"
          width="300"
          height="650"
          className="drop-shadow-2xl"
        >
          {/* Outer frame */}
          <rect
            x="0"
            y="0"
            width="375"
            height="812"
            rx="55"
            fill="#2a2a2a"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          
          {/* Screen bezel */}
          <rect
            x="8"
            y="8"
            width="359"
            height="796"
            rx="47"
            fill="#000"
          />
          
          {/* Screen */}
          <rect
            x="12"
            y="12"
            width="351"
            height="788"
            rx="43"
            fill="#000"
          />
          
          {/* Camera viewfinder - blurred home interior */}
          <rect
            x="12"
            y="50"
            width="351"
            height="600"
            rx="0"
            fill="url(#homeGradient)"
          />
          
          {/* Gradient for home interior */}
          <defs>
            <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f5dc"/>
              <stop offset="25%" stopColor="#e6e6e6"/>
              <stop offset="50%" stopColor="#d3d3d3"/>
              <stop offset="75%" stopColor="#c8b99c"/>
              <stop offset="100%" stopColor="#8b7355"/>
            </linearGradient>
            
            {/* Blur filter for background */}
            <filter id="blur" x="0" y="0" width="100%" height="100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
            </filter>
          </defs>
          
          {/* Blurred furniture shapes */}
          <g filter="url(#blur)">
            {/* Sofa */}
            <rect x="50" y="400" width="120" height="60" rx="10" fill="#8B4513" opacity="0.7"/>
            <rect x="55" y="385" width="110" height="20" rx="10" fill="#A0522D" opacity="0.6"/>
            
            {/* Coffee table */}
            <rect x="200" y="420" width="80" height="30" rx="5" fill="#654321" opacity="0.8"/>
            
            {/* TV/Cabinet */}
            <rect x="280" y="200" width="70" height="80" rx="5" fill="#2F4F4F" opacity="0.6"/>
            
            {/* Lamp */}
            <circle cx="320" cy="180" r="15" fill="#FFE4B5" opacity="0.5"/>
            <rect x="318" y="195" width="4" height="40" fill="#8B4513" opacity="0.7"/>
            
            {/* Plant */}
            <circle cx="80" cy="300" r="25" fill="#228B22" opacity="0.6"/>
            <rect x="78" y="325" width="4" height="30" fill="#8B4513" opacity="0.7"/>
            
            {/* Wall frames */}
            <rect x="30" y="150" width="40" height="30" rx="2" fill="#4A4A4A" opacity="0.5"/>
            <rect x="100" y="140" width="35" height="25" rx="2" fill="#4A4A4A" opacity="0.5"/>
          </g>
          
          {/* Notch area */}
          <rect
            x="12"
            y="12"
            width="351"
            height="38"
            rx="43"
            fill="rgba(0,0,0,0.3)"
          />
          
          {/* Notch */}
          <rect
            x="137"
            y="22"
            width="100"
            height="18"
            rx="9"
            fill="#000"
          />
          
          {/* Top camera controls */}
          <circle cx="45" cy="32" r="12" fill="rgba(255,255,255,0.2)"/>
          <text x="41" y="36" fill="white" fontSize="10">⚡</text>
          
          <circle cx="330" cy="32" r="12" fill="rgba(255,255,255,0.2)"/>
          <text x="327" y="36" fill="white" fontSize="10">⚙</text>
          
          {/* Zoom level indicators */}
          <text x="80" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">.5</text>
          <circle cx="140" cy="580" r="15" fill="rgba(255,255,255,0.3)"/>
          <text x="140" y="585" fill="yellow" fontSize="12" textAnchor="middle" fontWeight="bold">1x</text>
          <text x="200" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">2</text>
          <text x="260" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">5</text>
          
          {/* Camera controls overlay */}
          <rect
            x="12"
            y="650"
            width="351"
            height="150"
            fill="rgba(0,0,0,0.8)"
          />
          
          {/* Camera mode selector */}
          <text x="50" y="675" fill="white" fontSize="11" textAnchor="middle">SLO-MO</text>
          <text x="120" y="675" fill="white" fontSize="11" textAnchor="middle">VIDEO</text>
          <text x="188" y="675" fill="yellow" fontSize="11" textAnchor="middle" fontWeight="bold">PHOTO</text>
          <text x="256" y="675" fill="white" fontSize="11" textAnchor="middle">PORTRAIT</text>
          <text x="320" y="675" fill="white" fontSize="11" textAnchor="middle">PANO</text>
          
          {/* Camera button */}
          <circle cx="188" cy="720" r="35" fill="white"/>
          <circle cx="188" cy="720" r="30" fill="white" stroke="#ddd" strokeWidth="3"/>
          
          {/* Gallery thumbnail */}
          <rect x="50" y="700" width="30" height="30" rx="5" fill="#4682B4"/>
          <rect x="52" y="702" width="26" height="26" rx="3" fill="#87CEEB"/>
          
          {/* Flip camera button */}
          <circle cx="320" cy="720" r="20" fill="rgba(255,255,255,0.2)"/>
          <text x="315" y="725" fill="white" fontSize="14">↻</text>
          
          {/* Home indicator */}
          <rect x="150" y="780" width="75" height="4" rx="2" fill="white" fillOpacity="0.8"/>
        </svg>
        
        {/* Camera Feature Demo overlay - merged into the main component */}
        <div 
          className="absolute bg-gray-900 rounded-lg p-3 text-white shadow-lg animate-pulse"
          style={{
            top: '20%',
            left: '20%',
            width: '60%',
            transform: 'scale(0.8)'
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const iPhoneCameraInterface = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="relative">
        {/* iPhone Frame */}
        <svg
          viewBox="0 0 375 812"
          width="300"
          height="650"
          className="drop-shadow-2xl"
        >
          {/* Outer frame */}
          <rect
            x="0"
            y="0"
            width="375"
            height="812"
            rx="55"
            fill="#2a2a2a"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          
          {/* Screen bezel */}
          <rect
            x="8"
            y="8"
            width="359"
            height="796"
            rx="47"
            fill="#000"
          />
          
          {/* Screen */}
          <rect
            x="12"
            y="12"
            width="351"
            height="788"
            rx="43"
            fill="#000"
          />
          
          {/* Camera viewfinder - blurred home interior */}
          <rect
            x="12"
            y="50"
            width="351"
            height="600"
            rx="0"
            fill="url(#homeGradient)"
          />
          
          {/* Gradient for home interior */}
          <defs>
            <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f5dc"/>
              <stop offset="25%" stopColor="#e6e6e6"/>
              <stop offset="50%" stopColor="#d3d3d3"/>
              <stop offset="75%" stopColor="#c8b99c"/>
              <stop offset="100%" stopColor="#8b7355"/>
            </linearGradient>
            
            {/* Blur filter for background */}
            <filter id="blur" x="0" y="0" width="100%" height="100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
            </filter>
          </defs>
          
          {/* Blurred furniture shapes */}
          <g filter="url(#blur)">
            {/* Sofa */}
            <rect x="50" y="400" width="120" height="60" rx="10" fill="#8B4513" opacity="0.7"/>
            <rect x="55" y="385" width="110" height="20" rx="10" fill="#A0522D" opacity="0.6"/>
            
            {/* Coffee table */}
            <rect x="200" y="420" width="80" height="30" rx="5" fill="#654321" opacity="0.8"/>
            
            {/* TV/Cabinet */}
            <rect x="280" y="200" width="70" height="80" rx="5" fill="#2F4F4F" opacity="0.6"/>
            
            {/* Lamp */}
            <circle cx="320" cy="180" r="15" fill="#FFE4B5" opacity="0.5"/>
            <rect x="318" y="195" width="4" height="40" fill="#8B4513" opacity="0.7"/>
            
            {/* Plant */}
            <circle cx="80" cy="300" r="25" fill="#228B22" opacity="0.6"/>
            <rect x="78" y="325" width="4" height="30" fill="#8B4513" opacity="0.7"/>
            
            {/* Wall frames */}
            <rect x="30" y="150" width="40" height="30" rx="2" fill="#4A4A4A" opacity="0.5"/>
            <rect x="100" y="140" width="35" height="25" rx="2" fill="#4A4A4A" opacity="0.5"/>
          </g>
          
          {/* Notch area */}
          <rect
            x="12"
            y="12"
            width="351"
            height="38"
            rx="43"
            fill="rgba(0,0,0,0.3)"
          />
          
          {/* Notch */}
          <rect
            x="137"
            y="22"
            width="100"
            height="18"
            rx="9"
            fill="#000"
          />
          
          {/* Top camera controls */}
          <circle cx="45" cy="32" r="12" fill="rgba(255,255,255,0.2)"/>
          <text x="41" y="36" fill="white" fontSize="10">⚡</text>
          
          <circle cx="330" cy="32" r="12" fill="rgba(255,255,255,0.2)"/>
          <text x="327" y="36" fill="white" fontSize="10">⚙</text>
          
          {/* Zoom level indicators */}
          <text x="80" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">.5</text>
          <circle cx="140" cy="580" r="15" fill="rgba(255,255,255,0.3)"/>
          <text x="140" y="585" fill="yellow" fontSize="12" textAnchor="middle" fontWeight="bold">1x</text>
          <text x="200" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">2</text>
          <text x="260" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">5</text>
          
          {/* Camera controls overlay */}
          <rect
            x="12"
            y="650"
            width="351"
            height="150"
            fill="rgba(0,0,0,0.8)"
          />
          
          {/* Camera mode selector */}
          <text x="50" y="675" fill="white" fontSize="11" textAnchor="middle">SLO-MO</text>
          <text x="120" y="675" fill="white" fontSize="11" textAnchor="middle">VIDEO</text>
          <text x="188" y="675" fill="yellow" fontSize="11" textAnchor="middle" fontWeight="bold">PHOTO</text>
          <text x="256" y="675" fill="white" fontSize="11" textAnchor="middle">PORTRAIT</text>
          <text x="320" y="675" fill="white" fontSize="11" textAnchor="middle">PANO</text>
          
          {/* Camera button */}
          <circle cx="188" cy="720" r="35" fill="white"/>
          <circle cx="188" cy="720" r="30" fill="white" stroke="#ddd" strokeWidth="3"/>
          
          {/* Gallery thumbnail */}
          <rect x="50" y="700" width="30" height="30" rx="5" fill="#4682B4"/>
          <rect x="52" y="702" width="26" height="26" rx="3" fill="#87CEEB"/>
          
          {/* Flip camera button */}
          <circle cx="320" cy="720" r="20" fill="rgba(255,255,255,0.2)"/>
          <text x="315" y="725" fill="white" fontSize="14">↻</text>
          
          {/* Home indicator */}
          <rect x="150" y="780" width="75" height="4" rx="2" fill="white" fillOpacity="0.8"/>
        </svg>
        
        {/* Camera Feature Demo positioned on the landscape view */}
        <div 
          className="absolute"
          style={{
            top: '20%',
            left: '20%',
            width: '60%',
            transform: 'scale(0.8)'
          }}
        >
          <CameraFeatureDemo />
        </div>
      </div>
    </div>
  );
};


// Interactive MissionDemo Component
const MissionDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const missionSteps = [
    {
      title: "Keep it Simple",
      description: "Three taps to list, one tap to buy",
      icon: <Smartphone size={20} />,
      detail: "Streamlined workflows that get you from idea to sale in seconds",
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Stay Functional",
      description: "Every feature serves a real student need",
      icon: <CheckCircle size={20} />,
      detail: "Built through student feedback, tested by real campus users",
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Always Improving",
      description: "Your feedback shapes our updates",
      icon: <TrendingUp size={20} />,
      detail: "Weekly updates based on your suggestions and usage patterns",
      color: "from-orange-500 to-red-500"
    }
  ];

  const handleStepClick = (index) => {
    if (index !== currentStep) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(index);
        setIsAnimating(false);
      }, 150);
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedback.trim()) {
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedback('');
      }, 3000);
    }
  };

  const progressPercentage = ((currentStep + 1) / missionSteps.length) * 100;

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-600 to-emerald-600"></div>
      </div>

      <div className="relative z-10">
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Our Mission in Action</h3>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Interactive Steps */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {missionSteps.map((step, index) => (
            <button
              key={index}
              onClick={() => handleStepClick(index)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-300 group ${
                currentStep === index
                  ? 'border-green-500 bg-white shadow-lg transform scale-105'
                  : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-md'
              }`}
            >
              <div className={`flex flex-col items-center transition-all duration-300 ${
                currentStep === index ? 'text-green-600' : 'text-gray-600 group-hover:text-green-500'
              }`}>
                <div className="mb-2 p-2 rounded-full bg-gray-100 group-hover:bg-green-50 transition-colors">
                  {step.icon}
                </div>
                <div className="text-xs font-semibold text-center">{step.title}</div>
              </div>
              {currentStep === index && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>

        {/* Current Step Display */}
        <div className={`bg-white rounded-xl p-5 mb-6 border-l-4 border-green-500 shadow-sm transition-all duration-300 ${
          isAnimating ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'
        }`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${missionSteps[currentStep].color}`}>
              <div className="text-white">
                {missionSteps[currentStep].icon}
              </div>
            </div>
            <h4 className="font-bold text-gray-800">
              {missionSteps[currentStep].title}
            </h4>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {missionSteps[currentStep].description}
          </p>
          <p className="text-gray-500 text-xs">
            {missionSteps[currentStep].detail}
          </p>
        </div>

        {/* Interactive Feedback Section */}
        
      </div>
    </div>
  );
};

const BadgeFeatureDemo = () => {
  const badges = [
    {
      id: 'trusted-seller',
      name: 'Trusted Seller',
      icon: Shield,
      color: 'emerald',
      description: '10+ successful sales',
      earned: true
    },
    {
      id: 'trusted-renter',
      name: 'Trusted Renter',
      icon: TrendingUp,
      color: 'blue',
      description: '4+ rental experiences',
      earned: false
    },
    {
      id: 'best-rater',
      name: 'Best Rater',
      icon: Star,
      color: 'yellow',
      description: 'Accurate ratings',
      earned: true
    },
    {
      id: 'school',
      name: 'Student',
      icon: GraduationCap,
      color: 'purple',
      description: 'Current student',
      earned: false
    },
    {
      id: 'alumni',
      name: 'Alumni',
      icon: Award,
      color: 'indigo',
      description: 'Graduate member',
      earned: true
    }
  ];

  const getBadgeGradient = (color) => {
    const gradients = {
      emerald: 'from-emerald-400 to-emerald-600',
      blue: 'from-blue-400 to-blue-600',
      yellow: 'from-yellow-400 to-yellow-600',
      purple: 'from-purple-400 to-purple-600',
      indigo: 'from-indigo-400 to-indigo-600'
    };
    return gradients[color];
  };

  const getBadgeTextColor = (color) => {
    const colors = {
      emerald: '#10b981',
      blue: '#3b82f6',
      yellow: '#f59e0b',
      purple: '#8b5cf6',
      indigo: '#6366f1'
    };
    return colors[color];
  };

  return (
    <motion.div 
      className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-6 border border-orange-200 shadow-sm"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 0.9, 1.1, 1],
            rotate: [0, 15, -10, 20, 0],
            y: [0, -5, 2, -3, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut",
            repeatDelay: 0.5
          }}
        >
          <motion.div 
            className="bg-gradient-to-r from-orange-400 to-red-500 p-2 rounded-full shadow-md relative overflow-hidden"
            whileHover={{ 
              scale: 1.3,
              rotate: 360,
              boxShadow: "0 0 20px rgba(255, 165, 0, 0.6)"
            }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0"
              animate={{ 
                opacity: [0, 0.3, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            />
            <Zap size={18} className="text-white relative z-10" />
          </motion.div>
        </motion.div>
        <div>
          <motion.h3 
            className="text-base font-semibold text-gray-800"
            animate={{ 
              color: ["#1f2937", "#f59e0b", "#dc2626", "#1f2937"]
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Trust Badge System
          </motion.h3>
          <motion.p 
            className="text-xs text-gray-600"
            animate={{ y: [0, -1, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            Earn credibility & boost success rates
          </motion.p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
        {badges.map((badge, index) => {
          const IconComponent = badge.icon;
          return (
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: 20, rotate: -180 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ 
                  delay: 0.4 + index * 0.2,
                  type: "spring",
                  stiffness: 200,
                  damping: 10
                }}
                whileHover={{ 
                  scale: 1.15, 
                  y: -8,
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.3 }
                }}
              >
                {/* Floating particles around earned badges */}
                {badge.earned && (
                  <>
                    {[...Array(6)].map((_, i) => (
                      <motion.div
                        key={`particle-${badge.id}-${i}`}
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                        style={{
                          left: `${50 + 30 * Math.cos(i * Math.PI / 3)}%`,
                          top: `${50 + 30 * Math.sin(i * Math.PI / 3)}%`,
                        }}
                        animate={{
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 360],
                          x: [0, Math.cos(i * Math.PI / 3) * 20, 0],
                          y: [0, Math.sin(i * Math.PI / 3) * 20, 0]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.3 + index * 0.5,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Badge Circle with Scalloped Edge */}
                <motion.div
                  className={`relative w-16 h-16 rounded-full shadow-lg transition-all duration-300 ${
                    badge.earned 
                      ? `bg-gradient-to-br ${getBadgeGradient(badge.color)} shadow-lg` 
                      : 'bg-gray-200 shadow-sm'
                  }`}
                  style={{
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                  }}
                  animate={badge.earned ? {
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 4px 15px rgba(0,0,0,0.1)",
                      "0 8px 25px rgba(255,215,0,0.3)",
                      "0 4px 15px rgba(0,0,0,0.1)"
                    ]
                  } : {}}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                  whileHover={{ 
                    rotate: [0, -15, 15, -10, 10, 0],
                    scale: 1.1,
                    boxShadow: "0 0 30px rgba(255,215,0,0.8)"
                  }}
                >
                  {/* Pulsing inner glow for earned badges */}
                  {badge.earned && (
                    <motion.div
                      className="absolute inset-1 rounded-full bg-white opacity-20"
                      style={{
                        clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                      }}
                      animate={{
                        opacity: [0.1, 0.3, 0.1],
                        scale: [0.8, 1, 0.8]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.3
                      }}
                    />
                  )}

                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center"
                    animate={badge.earned ? {
                      rotate: [0, 360],
                      scale: [1, 1.1, 1]
                    } : {}}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                      delay: index * 0.8
                    }}
                  >
                    <IconComponent 
                      size={24} 
                      className={`${badge.earned ? 'text-white drop-shadow-sm' : 'text-gray-400'}`}
                    />
                  </motion.div>
                  
                  {/* Enhanced sparkle effects */}
                  {badge.earned && (
                    <>
                      <motion.div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-md"
                        animate={{ 
                          scale: [1, 1.5, 1, 1.3, 1],
                          rotate: [0, 180, 360],
                          boxShadow: [
                            "0 0 5px rgba(255,215,0,0.5)",
                            "0 0 15px rgba(255,165,0,0.8)",
                            "0 0 5px rgba(255,215,0,0.5)"
                          ]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.2
                        }}
                      />
                      <motion.div
                        className="absolute -bottom-1 -left-1 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full shadow-md"
                        animate={{ 
                          scale: [1, 1.8, 1, 1.4, 1],
                          rotate: [0, -180, -360],
                          x: [0, 2, -2, 0],
                          y: [0, -2, 2, 0]
                        }}
                        transition={{ 
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.3
                        }}
                      />
                      <motion.div
                        className="absolute top-1/2 -left-2 w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full shadow-md"
                        animate={{ 
                          scale: [0, 1.2, 0],
                          rotate: [0, 720],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: index * 0.4
                        }}
                      />
                    </>
                  )}
                </motion.div>

                {/* Badge Label with bounce effect */}
                <motion.div 
                  className="mt-3 text-center"
                  animate={badge.earned ? {
                    y: [0, -2, 0]
                  } : {}}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: index * 0.5
                  }}
                >
                  <motion.span 
                    className={`text-xs font-semibold ${badge.earned ? 'text-gray-700' : 'text-gray-400'}`}
                    animate={badge.earned ? {
                      color: [
                        "#374151",
                        getBadgeTextColor(badge.color),
                        "#374151"
                      ]
                    } : {}}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.6
                    }}
                  >
                    {badge.name}
                  </motion.span>
                  <motion.p 
                    className={`text-xs mt-1 ${badge.earned ? 'text-gray-600' : 'text-gray-400'}`}
                    animate={badge.earned ? {
                      opacity: [0.6, 1, 0.6]
                    } : {}}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.4
                    }}
                  >
                    {badge.description}
                  </motion.p>
                </motion.div>
              </motion.div>
          );
        })}
      </div>

      <motion.div
        className="bg-white rounded-lg p-4 border border-orange-100 relative overflow-hidden"
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
        whileHover={{ 
          scale: 1.02,
          boxShadow: "0 10px 30px rgba(255,165,0,0.2)"
        }}
      >
        {/* Animated background gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-100 via-pink-100 to-orange-100 opacity-50"
          animate={{
            x: [-100, 100, -100],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-1">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`progress-badge-${i}`}
                  className="w-6 h-6 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    delay: 1 + i * 0.2, 
                    type: "spring",
                    stiffness: 200,
                    damping: 10
                  }}
                  whileHover={{ 
                    scale: 1.3,
                    rotate: 360,
                    boxShadow: "0 0 15px rgba(255,165,0,0.6)"
                  }}
                >
                  <motion.span 
                    className="text-xs text-white font-bold"
                    animate={{
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.3
                    }}
                  >
                    {i + 1}
                  </motion.span>
                </motion.div>
              ))}
            </div>
            <motion.span 
              className="text-sm text-gray-700 font-medium"
              animate={{
                color: ["#374151", "#f59e0b", "#374151"]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              3/5 badges earned
            </motion.span>
          </div>
          <motion.button
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 relative overflow-hidden"
            whileHover={{ 
              scale: 1.08,
              boxShadow: "0 0 20px rgba(255,165,0,0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                "0 4px 15px rgba(255,165,0,0.2)",
                "0 8px 25px rgba(255,165,0,0.4)",
                "0 4px 15px rgba(255,165,0,0.2)"
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Button shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20"
              animate={{
                x: [-100, 100],
                opacity: [0, 0.5, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                repeatDelay: 1
              }}
            />
            <span className="relative z-10">Complete Profile</span>
          </motion.button>
        </div>
      </motion.div>

      <motion.p
        className="text-xs text-center text-gray-600 mt-3 relative"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <motion.span
          animate={{
            scale: [1, 1.1, 1],
            color: ["#6b7280", "#f59e0b", "#ec4899", "#6b7280"]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          ✨ Badge holders get 3x more visibility and higher success rates
        </motion.span>
        {/* Floating sparkles around text */}
        {[...Array(5)].map((_, i) => (
          <motion.span
            key={`sparkle-${i}`}
            className="absolute text-yellow-400 text-xs"
            style={{
              left: `${20 + i * 15}%`,
              top: `${-10 + (i % 2) * 20}px`
            }}
            animate={{
              y: [0, -5, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.5, 1, 0.5],
              rotate: [0, 180, 360]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4
            }}
          >
            ✨
          </motion.span>
        ))}
      </motion.p>
    </motion.div>
  );
};
const NetworkFeatureDemo = () => (
  <motion.div 
    className="bg-purple-50 rounded-lg p-4 border border-purple-200"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ delay: 0.2 }}
  >
    <div className="flex items-center gap-2 mb-2">
      <div className="flex -space-x-2">
        {[1,2,3].map(i => (
          <div key={i} className="w-6 h-6 bg-purple-400 rounded-full border-2 border-white" />
        ))}
      </div>
      <span className="text-sm font-medium text-purple-800">47 nearby</span>
    </div>
    <div className="text-xs text-purple-600">Active buyers</div>
  </motion.div>
);

// CTA Section Component
const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  
  return (
    <motion.section 
      ref={ref}
      className="relative z-10 max-w-7xl mx-auto px-6 py-20"
    >
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={isInView ? { 
          opacity: 1, 
          y: 0, 
          scale: 1 
        } : { 
          opacity: 0, 
          y: 100, 
          scale: 0.8 
        }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-16 text-white relative overflow-hidden"
      >
        {/* Animated Background Elements */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-orange-600/50 to-transparent"
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{ duration: 5, repeat: Infinity }}
        />
        
        <div className="relative z-10">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Ready to revolutionize your student life?
          </motion.h2>
          <motion.p 
            className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Join thousands of students already using Subox to sell items instantly and find perfect housing
          </motion.p>
          <motion.button
            className="px-8 py-4 bg-white text-orange-600 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all"
            whileHover={{ 
              scale: 1.05, 
              y: -5,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" 
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            Start Selling in Seconds
            <motion.span
              className="inline-block ml-2"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowRight size={20} />
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
    </motion.section>
  );
};

const CameraDemo = ({ capturedItems, setCapturedItems }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showDetection, setShowDetection] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const fileInputRef = useRef(null);

  // Real detected items with accurate positioning for the actual photo
  const detectedItems = [
    { 
      id: 1, 
      name: "Wooden Desk", 
      confidence: 92, 
      price: 85, 
      selected: true,
      category: "Furniture",
      condition: "Good",
      position: { 
        left: "15%",
        top: "55%",
        width: "65%",
        height: "35%"
      }
    },
    { 
      id: 2, 
      name: "Office Chair", 
      confidence: 88, 
      price: 45, 
      selected: true,
      category: "Furniture", 
      condition: "Excellent",
      position: { 
        left: "60%",
        top: "25%",
        width: "35%",
        height: "65%"
      }
    },
    { 
      id: 3, 
      name: "Table Lamp", 
      confidence: 79, 
      price: 25, 
      selected: false,
      category: "Electronics",
      condition: "Good",
      position: { 
        left: "8%",
        top: "15%",
        width: "25%",
        height: "30%"
      }
    }
  ];

  const handleCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      // Add the selected items from detection to captured items
      const selectedItems = detectedItems.filter(item => item.selected);
      const newItems = selectedItems.map(item => ({
        id: Date.now() + item.id,
        name: item.name,
        image: `item-${item.id}`,
        category: item.category,
        price: item.price,
        condition: item.condition,
      }));
      
      setCapturedItems(prev => [...prev, ...newItems]);
      setIsCapturing(false);
      setShowScanner(false);
      setShowDetection(true);
    }, 3000);
  };

  const startCapture = () => {
    setShowScanner(true);
    setShowDetection(false);
    setTimeout(handleCapture, 500);
  };



  const resetView = () => {
    setShowDetection(false);
    setShowScanner(false);
    setIsCapturing(false);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      // Process the uploaded image
      const reader = new FileReader();
      reader.onload = (e) => {
        // Here you would typically process the image
        // For now, we'll simulate the same detection process
        startCapture();
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Capture Your Items</h3>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-red-400 rounded-full" />
          <div className="w-3 h-3 bg-yellow-400 rounded-full" />
          <div className="w-3 h-3 bg-green-400 rounded-full" />
        </div>
      </div>
      
      {/* iPhone Camera Interface */}
      <div className="flex items-center justify-center bg-gray-100 rounded-xl p-6">
        <div className="relative">
          {/* Flash Effect */}
          {isCapturing && (
            <motion.div
              className="absolute inset-0 bg-white z-30 rounded-[55px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 0.3 }}
            />
          )}
          
          {/* iPhone Frame */}
          <svg
            viewBox="0 0 375 812"
            width="300"
            height="650"
            className="drop-shadow-2xl"
          >
          {/* Outer frame */}
          <rect
            x="0"
            y="0"
            width="375"
            height="812"
            rx="55"
            fill="#2a2a2a"
            stroke="#1a1a1a"
            strokeWidth="2"
          />
          
          {/* Screen bezel */}
          <rect
            x="8"
            y="8"
            width="359"
            height="796"
            rx="47"
            fill="#000"
          />
          
          {/* Screen */}
          <rect
            x="12"
            y="12"
            width="351"
            height="788"
            rx="43"
            fill="#000"
          />
          
          {/* Camera viewfinder - blurred home interior */}
          <rect
            x="12"
            y="50"
            width="351"
            height="600"
            rx="0"
            fill="url(#homeGradient)"
          />
          
          {/* Gradient for home interior */}
          <defs>
            <linearGradient id="homeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f5dc"/>
              <stop offset="25%" stopColor="#e6e6e6"/>
              <stop offset="50%" stopColor="#d3d3d3"/>
              <stop offset="75%" stopColor="#c8b99c"/>
              <stop offset="100%" stopColor="#8b7355"/>
            </linearGradient>
            
            {/* Blur filter for background */}
            <filter id="blur" x="0" y="0" width="100%" height="100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3"/>
            </filter>
          </defs>
          
          {/* Top camera controls */}
          <circle cx="45" cy="32" r="12" fill="rgba(255,255,255,0.2)"/>
          <text x="41" y="36" fill="white" fontSize="10">⚡</text>
          
          <circle cx="330" cy="32" r="12" fill="rgba(255,255,255,0.2)"/>
          <text x="327" y="36" fill="white" fontSize="10">⚙</text>
          
          {/* Zoom level indicators */}
          <text x="80" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">.5</text>
          <circle cx="140" cy="580" r="15" fill="rgba(255,255,255,0.3)"/>
          <text x="140" y="585" fill="yellow" fontSize="12" textAnchor="middle" fontWeight="bold">1x</text>
          <text x="200" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">2</text>
          <text x="260" y="580" fill="white" fontSize="14" textAnchor="middle" opacity="0.7">5</text>
          
          {/* Camera controls overlay */}
          <rect
            x="12"
            y="650"
            width="351"
            height="150"
            fill="rgba(0,0,0,0.8)"
          />
          
          {/* Camera mode selector */}
          <text x="50" y="675" fill="white" fontSize="11" textAnchor="middle">SLO-MO</text>
          <text x="120" y="675" fill="white" fontSize="11" textAnchor="middle">VIDEO</text>
          <text x="188" y="675" fill="yellow" fontSize="11" textAnchor="middle" fontWeight="bold">PHOTO</text>
          <text x="256" y="675" fill="white" fontSize="11" textAnchor="middle">PORTRAIT</text>
          <text x="320" y="675" fill="white" fontSize="11" textAnchor="middle">PANO</text>
          
          {/* Interactive Camera button */}
          <motion.circle 
            cx="188" 
            cy="720" 
            r="35" 
            fill="white"
            className="cursor-pointer"
            onClick={startCapture}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
          <motion.circle 
            cx="188" 
            cy="720" 
            r="30" 
            fill="white" 
            stroke="#ddd" 
            strokeWidth="3"
            className="cursor-pointer"
            onClick={startCapture}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          />
          
          {/* Gallery thumbnail */}
          <rect x="50" y="700" width="30" height="30" rx="5" fill="#4682B4"/>
          <rect x="52" y="702" width="26" height="26" rx="3" fill="#87CEEB"/>
          
          {/* Flip camera button */}
          <circle cx="320" cy="720" r="20" fill="rgba(255,255,255,0.2)"/>
          <text x="315" y="725" fill="white" fontSize="14">↻</text>
          
          {/* Home indicator */}
          <rect x="150" y="780" width="75" height="4" rx="2" fill="white" fillOpacity="0.8"/>
        </svg>

          
          {/* Scanner overlay when scanning */}
          {showScanner && (
            <div 
              className="absolute z-20"
              style={{
                top: '6.2%',
                left: '3.2%',
                width: '93.6%',
                height: '87.6%'
              }}
            >
              <motion.div
                className="absolute inset-4 border-2 border-orange-400 rounded-lg"
                animate={{ 
                  scale: [1, 1.02, 1],
                  borderColor: ['#fb923c', '#f97316', '#fb923c']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Scanner Line */}
              <motion.div
                className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent"
                animate={{ y: [16, 400, 16] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              
              {/* Corner Markers */}
              {[
                { top: '16px', left: '16px' },
                { top: '16px', right: '16px' },
                { bottom: '16px', left: '16px' },
                { bottom: '16px', right: '16px' }
              ].map((position, i) => (
                <motion.div
                  key={i}
                  className="absolute w-6 h-6 border-2 border-orange-400"
                  style={{
                    ...position,
                    borderRadius: i === 0 ? '8px 0 0 0' : 
                               i === 1 ? '0 8px 0 0' :
                               i === 2 ? '0 0 0 8px' : '0 0 8px 0'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    borderColor: ['#fb923c', '#f97316', '#fb923c']
                  }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
              
              {/* AI Detection Processing */}
              {isCapturing && (
                <motion.div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white px-4 py-2 rounded-lg"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles size={16} />
                    </motion.div>
                    <span className="text-sm">Processing...</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}
          
          {/* Detection overlay when showing results */}
          {showDetection && (
            <div 
              className="absolute z-20"
              style={{
                top: '6.2%',
                left: '3.2%',
                width: '93.6%',
                height: '73.9%'
              }}
            >
              <img 
                src="/Picture.png" 
                alt="Furniture detection"
                className="w-full h-full object-cover rounded-lg"
                onLoad={() => setImageLoaded(true)}
              />
              
              {/* Detection boxes positioned for real photo */}
              {detectedItems.map((item, idx) => {
                const isSelected = item.selected;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.4 }}
                    className={`absolute rounded-lg transition-all duration-300 ${
                      isSelected 
                        ? "border-3 border-green-400" 
                        : "border-3 border-red-500"
                    }`}
                    style={{
                      left: item.position.left,
                      top: item.position.top,
                      width: item.position.width,
                      height: item.position.height
                    }}
                  >
                    {/* Detection label */}
                    <div 
                      className={`absolute ${
                        item.id === 3 ? '-top-10' : '-bottom-10'
                      } left-0 flex items-center space-x-2 px-3 py-2 rounded-full text-white text-sm font-medium whitespace-nowrap ${
                        isSelected ? "bg-green-500" : "bg-gray-700"
                      }`}
                      style={{
                        maxWidth: '200px',
                        fontSize: '12px'
                      }}
                    >
                      {isSelected ? (
                        <CheckCircle size={16} className="text-white" />
                      ) : (
                        <XCircle size={16} className="text-white" />
                      )}
                      <span>
                        {item.name} 
                      </span>
                    </div>
                    
                    {/* Pulse animation for selected items */}
                    {isSelected && (
                      <motion.div
                        className="absolute inset-0 border-2 border-green-300 rounded-lg"
                        animate={{ 
                          opacity: [0.3, 0.7, 0.3]
                        }}
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </motion.div>
                );
              })}
              
              {/* AI Status */}
              <motion.div 
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-xl flex items-center space-x-2 border border-gray-600"
                animate={{ 
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Brain size={16} className="text-blue-400" />
                <span> Detected {detectedItems.filter(i => i.selected).length} items</span>
              </motion.div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-1 gap-3">
        <motion.button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium shadow-lg"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload size={18} />
          Upload Photo from Desktop
        </motion.button>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Reset Button when showing detection */}
      {showDetection && (
        <motion.button
          onClick={resetView}
          className="w-full p-3 bg-gray-500 text-white rounded-xl font-medium shadow-lg flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Camera size={18} />
          Reset View
        </motion.button>
      )}
      
      {/* Recently Captured Items */}
      {capturedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="text-lg font-semibold text-gray-800">Recently Captured</h4>
          <div className="grid grid-cols-2 gap-3">
            {capturedItems.slice(-4).map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
              >
                <div className="w-full h-16 bg-gradient-to-br from-blue-200 to-blue-300 rounded-lg mb-2" />
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{item.category}</div>
                <div className="text-orange-600 font-bold text-sm">${item.price}</div>
                {item.confidence && (
                  <div className="text-xs text-green-600">AI: {item.confidence}%</div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </div>
  );
};


const AIProcessingDemo = ({ capturedItems, isGenerating, onDescriptionGenerate, onAIComplete }) => {
  const [processingStep, setProcessingStep] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [descriptionVariants, setDescriptionVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  
  const descriptionSteps = [
    { 
      label: "Analyzing item details...", 
      icon: <Eye size={20} />, 
      color: "blue",
      description: "Processing item name, condition, and pricing"
    },
    { 
      label: "Understanding context...", 
      icon: <Brain size={20} />, 
      color: "purple",
      description: "Evaluating delivery options and location"
    },
    { 
      label: "Crafting compelling language...", 
      icon: <MessageSquare size={20} />, 
      color: "green",
      description: "Generating persuasive marketing copy"
    },
    { 
      label: "Optimizing for engagement...", 
      icon: <Target size={20} />, 
      color: "orange",
      description: "Adding keywords and emotional triggers"
    },
    { 
      label: "Finalizing description...", 
      icon: <Sparkles size={20} />, 
      color: "pink",
      description: "Polishing tone and call-to-action"
    }
  ];

  const analyzeItemForDescription = (item) => {
    // Handle Camera Demo item structure
    const itemName = item.name || item.itemName || 'Item';
    const condition = item.condition || 'Good';
    const price = item.price || 0;
    const category = item.category || 'General';

    return {
      itemAnalysis: {
        name: itemName,
        condition: condition,
        price: price,
        priceType: 'fixed',
        location: 'Campus Area',
        delivery: 'pickup',
        category: category
      },
      writingElements: {
        hook: condition === 'Excellent' ? 'Amazing' : condition === 'Good' ? 'Great' : 'Solid',
        urgency: 'priced to sell',
        appeal: category === 'Books' ? 'Perfect for students!' : 
               category === 'Furniture' ? 'Great for any space!' : 
               category === 'Electronics' ? 'Tech lovers will love this!' :
               'Excellent value!',
        logistics: 'Quick pickup available'
      },
      optimizations: [
        'Added emotional appeal',
        'Included target audience',
        'Emphasized value proposition',
        'Clear call-to-action',
        'Location-specific language'
      ]
    };
  };

  const generateDescriptionVariants = (item) => {
    const analysis = analyzeItemForDescription(item);
    if (!analysis) return [];

    const { itemAnalysis, writingElements } = analysis;
    
    return [
      {
        style: "Friendly & Casual",
        description: `${writingElements.hook} ${itemAnalysis.name} in ${itemAnalysis.condition.toLowerCase()} condition! ${writingElements.appeal} Only ${itemAnalysis.price}. ${writingElements.logistics} near campus. Message me for quick response!`,
        tags: ["conversational", "approachable", "student-friendly"]
      },
      {
        style: "Professional & Direct",
        description: `${itemAnalysis.name} available in ${itemAnalysis.condition.toLowerCase()} condition. Priced at ${itemAnalysis.price}. ${writingElements.logistics}. Located near campus. Serious inquiries only.`,
        tags: ["professional", "concise", "business-like"]
      },
      {
        style: "Enthusiastic & Sales-y",
        description: `🌟 ${writingElements.hook} ${itemAnalysis.name} - ${itemAnalysis.condition} condition! 🌟 ${writingElements.appeal} Don't miss this fantastic deal at ${itemAnalysis.price}! ${writingElements.logistics}. Perfect addition to your ${itemAnalysis.category === 'Furniture' ? 'home' : itemAnalysis.category === 'Books' ? 'studies' : 'collection'}. Grab it before it's gone! 💯`,
        tags: ["energetic", "emoji-rich", "urgency-driven"]
      }
    ];
  };

  useEffect(() => {
    // Auto-trigger AI analysis when new items are captured from Camera Demo
    if (capturedItems.length > 0 && !isGenerating) {
      const currentItem = capturedItems[capturedItems.length - 1];
      setIsAnalyzing(true);
      setProcessingStep(0);
      setAnalysisResults(null);
      setDescriptionVariants([]);
      
      const interval = setInterval(() => {
        setProcessingStep(prev => {
          const newStep = prev + 1;
          
          if (newStep >= descriptionSteps.length) {
            setIsAnalyzing(false);
            const analysis = analyzeItemForDescription(currentItem);
            const variants = generateDescriptionVariants(currentItem);
            
            setAnalysisResults(analysis);
            setDescriptionVariants(variants);
            setSelectedVariant(0);
            
            // Notify parent that AI processing is complete
            if (onAIComplete) {
              onAIComplete({
                item: currentItem,
                analysis: analysis,
                descriptions: variants,
                selectedDescription: variants[0]?.description
              });
            }
            
            clearInterval(interval);
            return descriptionSteps.length;
          }
          return newStep;
        });
      }, 800);
      
      return () => clearInterval(interval);
    }
  }, [capturedItems.length]);

  const selectDescription = (index) => {
    setSelectedVariant(index);
    if (onDescriptionGenerate) {
      onDescriptionGenerate(descriptionVariants[index].description);
    }
  };

  const latestItem = capturedItems[capturedItems.length - 1];

  if (!latestItem) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <Wand2 size={32} className="text-purple-600" />
          </motion.div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Description Generator
          </h3>
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-xl p-12 text-center border border-purple-200"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <FileText size={64} className="text-purple-400 mx-auto mb-6" />
          </motion.div>
          <div className="text-xl font-semibold text-gray-700 mb-3">AI Writer Ready</div>
          <div className="text-gray-500 mb-6">Add item details to generate compelling descriptions</div>
          <div className="grid grid-cols-3 gap-4 text-sm text-gray-400">
            <div className="flex flex-col items-center gap-2">
              <Brain size={20} />
              <span>Smart Analysis</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <MessageSquare size={20} />
              <span>Persuasive Copy</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Target size={20} />
              <span>Optimization</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ 
            rotate: isAnalyzing ? [0, 360] : 0,
            scale: isAnalyzing ? [1, 1.1, 1] : 1
          }}
          transition={{ 
            rotate: { duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: "linear" },
            scale: { duration: 1, repeat: isAnalyzing ? Infinity : 0 }
          }}
        >
          <Wand2 size={32} className="text-purple-600" />
        </motion.div>
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          AI Description Generator
        </h3>
        {!isAnalyzing && analysisResults && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg text-sm font-medium shadow-lg"
          >
            <Eye size={16} />
            {showDetailedAnalysis ? 'Hide' : 'Show'} Analysis
          </motion.button>
        )}
      </div>
      
      {/* Item Details Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
      >
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package size={16} />
          Item Details Being Analyzed
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Item Name</div>
            <div className="font-medium text-gray-900">
              {latestItem.name || latestItem.itemName || 'Detected Item'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Category</div>
            <div className="font-medium text-gray-900">
              {latestItem.category || 'General'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Condition</div>
            <div className="font-medium text-gray-900">
              {latestItem.condition || 'Good'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Price</div>
            <div className="font-medium text-gray-900">
              ${latestItem.price || 0}
            </div>
          </div>
        </div>
        
        {/* Camera Demo items always have data, so no missing data warning needed */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-800">
            <CheckCircle size={16} />
            <span className="text-sm font-medium">AI detected all required details from your photo!</span>
          </div>
        </div>
      </motion.div>
      
      {/* AI Processing Animation */}
      {isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 rounded-xl p-6 border border-purple-200 shadow-lg"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-xl text-gray-800">Analyzing Item Details</div>
              <div className="text-sm text-gray-600">AI is crafting your perfect description...</div>
            </div>
            <motion.div 
              className="text-purple-500"
              animate={{ 
                rotate: 360,
                scale: [1, 1.3, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1, repeat: Infinity }
              }}
            >
              <Sparkles size={28} />
            </motion.div>
          </div>
          
          <div className="space-y-3">
            {descriptionSteps.map((step, i) => (
              <motion.div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                  i < processingStep 
                    ? 'bg-green-50 border-2 border-green-300 shadow-sm' 
                    : i === processingStep
                      ? 'bg-white border-2 border-purple-400 shadow-md' 
                      : 'bg-gray-50 border border-gray-200'
                }`}
                animate={{
                  scale: i === processingStep ? 1.02 : 1,
                  opacity: i <= processingStep ? 1 : 0.4
                }}
              >
                <motion.div
                  animate={i === processingStep ? { 
                    rotate: 360,
                    scale: [1, 1.2, 1]
                  } : {}}
                  transition={{ 
                    rotate: { duration: 1.5, repeat: i === processingStep ? Infinity : 0, ease: "linear" },
                    scale: { duration: 0.8, repeat: i === processingStep ? Infinity : 0 }
                  }}
                  className={`${
                    i < processingStep ? 'text-green-500' : 
                    i === processingStep ? 'text-purple-500' : 'text-gray-400'
                  }`}
                >
                  {i < processingStep ? <Check size={20} /> : step.icon}
                </motion.div>
                <div className="flex-1">
                  <div className={`font-medium ${
                    i < processingStep ? 'text-green-700' : 
                    i === processingStep ? 'text-purple-700' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Detailed Analysis Results */}
      {showDetailedAnalysis && analysisResults && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm"
        >
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Brain size={16} className="text-purple-500" />
            AI Analysis Breakdown
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-800 mb-3">Writing Elements Identified</h5>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hook Word:</span>
                  <span className="text-sm font-medium text-purple-600">
                    "{analysisResults.writingElements.hook}"
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Urgency Level:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {analysisResults.writingElements.urgency}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Target Appeal:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {analysisResults.writingElements.appeal}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Logistics:</span>
                  <span className="text-sm font-medium text-green-600">
                    {analysisResults.writingElements.logistics}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-gray-800 mb-3">AI Optimizations Applied</h5>
              <div className="space-y-2">
                {analysisResults.optimizations.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" />
                    <span className="text-sm text-gray-600">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Generated Description Variants */}
      {!isAnalyzing && descriptionVariants.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <MessageSquare size={16} className="text-green-500" />
            AI-Generated Description Options
          </h4>
          
          {descriptionVariants.map((variant, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.01 }}
              className={`p-5 rounded-xl border cursor-pointer transition-all ${
                selectedVariant === i 
                  ? 'border-purple-300 bg-purple-50 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-md'
              }`}
              onClick={() => selectDescription(i)}
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">{variant.style}</h5>
                <div className="flex items-center gap-2">
                  {selectedVariant === i && (
                    <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                      Selected ✓
                    </span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full"
                  >
                    Use This
                  </motion.button>
                </div>
              </div>
              
              <div className="text-gray-700 leading-relaxed mb-3">
                {variant.description}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {variant.tags.map((tag, j) => (
                  <span key={j} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Trigger regeneration
                if (onDescriptionGenerate) {
                  onDescriptionGenerate('regenerate');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium"
            >
              <RefreshCw size={16} />
              Generate New Options
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
            >
              <CheckCircle size={16} />
              Confirm Selection
            </motion.button>
          </motion.div>
        </motion.div>
      )}
      
      {/* Camera Demo Auto-Analysis Success */}
      {!isAnalyzing && descriptionVariants.length === 0 && latestItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 rounded-xl p-6 border border-green-200"
        >
          <div className="text-center">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h4 className="font-semibold text-green-800 mb-2">AI Analysis Complete!</h4>
            <p className="text-green-700 mb-4">
              Successfully analyzed your {latestItem.category || 'item'} and generated smart descriptions.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const analysis = analyzeItemForDescription(latestItem);
                const variants = generateDescriptionVariants(latestItem);
                setAnalysisResults(analysis);
                setDescriptionVariants(variants);
                setSelectedVariant(0);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium"
            >
              View AI Descriptions
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

const ListingDemo = () => {
  const [compareItems, setCompareItems] = useState(new Set());
  const [comparisonPriorities, setComparisonPriorities] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);

  // Sample items for demonstration
  const items = [
    {
      id: 1,
      name: "MacBook Pro 13-inch",
      category: "Electronics",
      price: 899,
      originalPrice: 1299,
      condition: "Like New",
      location: "dinkytown",
      image: "/api/placeholder/300/300",
      sellerRating: 4.8,
      views: 127,
      deliveryAvailable: true,
      pickupAvailable: true,
      availableUntil: "2025-12-31",
      shortDescription: "Perfect for students, barely used laptop with all accessories included."
    },
    {
      id: 2,
      name: "IKEA Study Desk",
      category: "Furniture",
      price: 65,
      originalPrice: 120,
      condition: "Good",
      location: "eastbank",
      image: "/api/placeholder/300/300",
      sellerRating: 4.5,
      views: 89,
      deliveryAvailable: false,
      pickupAvailable: true,
      availableUntil: "2025-11-30",
      shortDescription: "Sturdy desk perfect for dorm rooms, some minor scratches."
    },
    {
      id: 3,
      name: "iPhone 14",
      category: "Electronics",
      price: 650,
      originalPrice: 799,
      condition: "New",
      location: "westbank",
      image: "/api/placeholder/300/300",
      sellerRating: 4.9,
      views: 203,
      deliveryAvailable: true,
      pickupAvailable: false,
      availableUntil: "2025-12-25",
      shortDescription: "Brand new, unopened iPhone 14 in original packaging."
    }
  ];

  useEffect(() => {
    // Auto-demo: Add items to comparison with animation
    const timer = setTimeout(() => {
      if (animationStep === 0) {
        setCompareItems(new Set([1]));
        setAnimationStep(1);
      } else if (animationStep === 1) {
        setCompareItems(new Set([1, 2]));
        setAnimationStep(2);
      } else if (animationStep === 2) {
        setCompareItems(new Set([1, 2, 3]));
        setAnimationStep(3);
      } else if (animationStep === 3) {
        setComparisonPriorities(['price', 'condition']);
        setAnimationStep(4);
      } else if (animationStep === 4) {
        setShowComparison(true);
        setAnimationStep(5);
      }
    }, animationStep < 3 ? 1500 : animationStep === 3 ? 2000 : 3000);

    return () => clearTimeout(timer);
  }, [animationStep]);

  const toggleCompare = (productId) => {
    const newCompare = new Set(compareItems);
    if (newCompare.has(productId)) {
      newCompare.delete(productId);
    } else if (newCompare.size < 3) {
      newCompare.add(productId);
    }
    setCompareItems(newCompare);
  };

  const togglePriority = (priority) => {
    if (comparisonPriorities.includes(priority)) {
      setComparisonPriorities(comparisonPriorities.filter(p => p !== priority));
    } else {
      setComparisonPriorities([...comparisonPriorities, priority]);
    }
  };

  // Calculate scores for smart ranking
  const calculateScore = (product) => {
    let score = 0;
    const prices = Array.from(compareItems).map(id => items.find(p => p.id === id)?.price || 0);
    
    if (comparisonPriorities.includes('price')) {
      const minPrice = Math.min(...prices);
      score += product.price === minPrice ? 25 : (minPrice / product.price) * 25;
    }
    if (comparisonPriorities.includes('condition')) {
      const conditionScore = { 'New': 25, 'Like New': 20, 'Good': 15, 'Fair': 10, 'Used': 5 };
      score += conditionScore[product.condition] || 0;
    }
    if (comparisonPriorities.includes('rating')) {
      score += (product.sellerRating / 5) * 25;
    }
    if (comparisonPriorities.includes('delivery') && product.deliveryAvailable) {
      score += 15;
    }
    if (comparisonPriorities.includes('pickup') && product.pickupAvailable) {
      score += 15;
    }

    return score;
  };

  return (
    <div className="space-y-6 bg-gradient-to-br from-orange-50 via-white to-gray-50 min-h-screen p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h3 className="text-3xl font-bold text-gray-900 mb-2">Smart Compare Items Demo</h3>
        <p className="text-gray-600">Watch how our intelligent comparison system works</p>
      </motion.div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {items.slice(0, 3).map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className={`bg-white rounded-xl shadow-lg border-2 overflow-hidden hover:shadow-xl transition-all duration-300 ${
              compareItems.has(product.id) 
                ? 'border-orange-400 ring-4 ring-orange-100' 
                : 'border-gray-200 hover:border-orange-200'
            }`}
          >
            {/* Product Image */}
            <div className="relative aspect-square bg-gray-200">
              <div className="w-full h-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                <Package size={48} className="text-orange-600" />
              </div>
              
              {/* Compare Toggle Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleCompare(product.id)}
                className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg transition-all duration-200 ${
                  compareItems.has(product.id)
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-orange-50 hover:text-orange-500'
                }`}
              >
                <GitCompare size={20} className="mx-auto" />
              </motion.button>

              {/* Condition Badge */}
              <div className="absolute bottom-3 left-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                  product.condition === "New" ? "bg-green-100 text-green-700" :
                  product.condition === "Like New" ? "bg-blue-100 text-blue-700" :
                  product.condition === "Good" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {product.condition}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{product.name}</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">${product.price}</div>
                  {product.originalPrice && (
                    <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.shortDescription}</p>

              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <MapPin size={14} />
                  <span className="capitalize">{product.location?.replace("-", " ")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star size={14} className="text-yellow-400 fill-current" />
                  <span>{product.sellerRating}</span>
                </div>
              </div>

              <div className="flex items-center space-x-3 text-sm text-gray-600">
                {product.deliveryAvailable && (
                  <div className="flex items-center space-x-1">
                    <Truck size={14} className="text-green-600" />
                    <span>Delivery</span>
                  </div>
                )}
                {product.pickupAvailable && (
                  <div className="flex items-center space-x-1">
                    <Package size={14} className="text-blue-600" />
                    <span>Pickup</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Compare Panel */}
      <AnimatePresence>
        {compareItems.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="bg-white border-2 border-orange-200 rounded-xl shadow-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <GitCompare className="w-6 h-6 text-orange-500" />
                  <span className="text-xl font-bold text-gray-900">
                    Compare Items ({compareItems.size}/3)
                  </span>
                </div>
                
                <div className="flex space-x-2">
                  {Array.from(compareItems).map(productId => {
                    const product = items.find(p => p.id === productId);
                    return product ? (
                      <motion.div 
                        key={productId} 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center space-x-2 bg-orange-100 rounded-lg px-3 py-1"
                      >
                        <span className="text-sm font-medium">{product.name.split(' ').slice(0, 2).join(' ')}</span>
                        <button
                          onClick={() => toggleCompare(productId)}
                          className="text-orange-600 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ) : null;
                  })}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowComparison(!showComparison)}
                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-200 font-medium shadow-lg"
              >
                {showComparison ? 'Hide Comparison' : 'Compare Now'}
              </motion.button>
            </div>

            {/* Priority Selection */}
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200"
            >
              <div className="flex items-center space-x-2 mb-3">
                <SlidersHorizontal className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Set Your Priorities</h4>
                <span className="text-xs text-gray-500">(Select what matters most)</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                {[
                  { key: 'price', label: 'Best Price', icon: DollarSign, color: 'green' },
                  { key: 'condition', label: 'Condition', icon: Star, color: 'blue' },
                  { key: 'rating', label: 'Rating', icon: Star, color: 'yellow' },
                  { key: 'location', label: 'Location', icon: MapPin, color: 'purple' },
                  { key: 'delivery', label: 'Delivery', icon: Truck, color: 'indigo' },
                  { key: 'pickup', label: 'Pickup', icon: Package, color: 'pink' }
                ].map(priority => {
                  const isSelected = comparisonPriorities.includes(priority.key);
                  
                  return (
                    <motion.button
                      key={priority.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePriority(priority.key)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                        isSelected 
                          ? 'bg-orange-500 text-white border-orange-500 shadow-lg' 
                          : 'bg-white text-gray-700 border-gray-200 hover:border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      <priority.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{priority.label}</span>
                      <span className="sm:hidden">{priority.label.split(' ')[0]}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            {/* Detailed Comparison Table */}
            <AnimatePresence>
              {showComparison && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  <div className="grid gap-0" style={{gridTemplateColumns: `200px repeat(${compareItems.size}, 1fr)`}}>
                    
                    {/* Headers */}
                    <div className="bg-orange-100 border-b border-gray-200 p-4 font-bold text-orange-800">
                      Product Details
                    </div>
                    {(() => {
                      const products = Array.from(compareItems).map(id => items.find(p => p.id === id)).filter(Boolean);
                      const sortedProducts = comparisonPriorities.length > 0 
                        ? products.sort((a, b) => calculateScore(b) - calculateScore(a))
                        : products;

                      return sortedProducts.map((product, index) => {
                        const isRecommended = index === 0 && comparisonPriorities.length > 0;
                        
                        return (
                          <div 
                            key={product.id}
                            className={`border-b border-gray-200 p-4 text-center relative ${
                              isRecommended ? 'bg-gradient-to-r from-orange-100 to-red-100' : 'bg-gray-50'
                            }`}
                          >
                            {isRecommended && (
                              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                  🏆 BEST MATCH
                                </span>
                              </div>
                            )}
                            <div className="font-bold text-gray-900 mt-2">{product.name}</div>
                            <div className="text-sm text-gray-600">{product.category}</div>
                          </div>
                        );
                      });
                    })()}

                    {/* Price Row */}
                    <div className="border-b border-gray-200 p-4 font-semibold text-gray-800 bg-gray-50 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                      Price
                    </div>
                    {(() => {
                      const products = Array.from(compareItems).map(id => items.find(p => p.id === id)).filter(Boolean);
                      const sortedProducts = comparisonPriorities.length > 0 
                        ? products.sort((a, b) => calculateScore(b) - calculateScore(a))
                        : products;
                      const minPrice = Math.min(...products.map(p => p.price));

                      return sortedProducts.map(product => {
                        const isLowest = product.price === minPrice;
                        const isPriority = comparisonPriorities.includes('price');
                        
                        return (
                          <div 
                            key={`price-${product.id}`}
                            className={`border-b border-gray-200 p-4 text-center ${
                              isLowest && isPriority ? 'bg-green-100 text-green-800' :
                              isLowest ? 'bg-green-50 text-green-700' : 'bg-white'
                            }`}
                          >
                            <div className="text-xl font-bold">${product.price}</div>
                            {product.originalPrice && (
                              <div className="text-sm text-gray-500 line-through">${product.originalPrice}</div>
                            )}
                            {isLowest && (
                              <div className="text-xs font-bold text-green-600 mt-1">LOWEST</div>
                            )}
                          </div>
                        );
                      });
                    })()}

                    {/* Condition Row */}
                    <div className="border-b border-gray-200 p-4 font-semibold text-gray-800 bg-gray-50 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-blue-600" />
                      Condition
                    </div>
                    {(() => {
                      const products = Array.from(compareItems).map(id => items.find(p => p.id === id)).filter(Boolean);
                      const sortedProducts = comparisonPriorities.length > 0 
                        ? products.sort((a, b) => calculateScore(b) - calculateScore(a))
                        : products;

                      return sortedProducts.map(product => (
                        <div key={`condition-${product.id}`} className="border-b border-gray-200 p-4 text-center bg-white">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            product.condition === "New" ? "bg-green-100 text-green-700" :
                            product.condition === "Like New" ? "bg-blue-100 text-blue-700" :
                            product.condition === "Good" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {product.condition}
                          </span>
                        </div>
                      ));
                    })()}

                    {/* Rating Row */}
                    <div className="border-b border-gray-200 p-4 font-semibold text-gray-800 bg-gray-50 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Rating
                    </div>
                    {(() => {
                      const products = Array.from(compareItems).map(id => items.find(p => p.id === id)).filter(Boolean);
                      const sortedProducts = comparisonPriorities.length > 0 
                        ? products.sort((a, b) => calculateScore(b) - calculateScore(a))
                        : products;

                      return sortedProducts.map(product => (
                        <div key={`rating-${product.id}`} className="border-b border-gray-200 p-4 text-center bg-white">
                          <div className="flex items-center justify-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-bold">{product.sellerRating}</span>
                          </div>
                        </div>
                      ));
                    })()}

                    {/* Match Score Row (if priorities are set) */}
                    {comparisonPriorities.length > 0 && (
                      <>
                        <div className="border-b border-gray-200 p-4 font-semibold text-gray-800 bg-orange-50 flex items-center">
                          <SlidersHorizontal className="w-4 h-4 mr-2 text-orange-600" />
                          Match Score
                        </div>
                        {(() => {
                          const products = Array.from(compareItems).map(id => items.find(p => p.id === id)).filter(Boolean);
                          const sortedProducts = products.sort((a, b) => calculateScore(b) - calculateScore(a));

                          return sortedProducts.map((product, index) => {
                            const score = calculateScore(product);
                            const isHighest = index === 0;
                            
                            return (
                              <div 
                                key={`score-${product.id}`}
                                className={`border-b border-gray-200 p-4 text-center ${
                                  isHighest ? 'bg-orange-100' : 'bg-white'
                                }`}
                              >
                                <div className="text-xl font-bold text-orange-600">{Math.round(score)}%</div>
                                {isHighest && (
                                  <div className="text-xs font-bold text-orange-600 mt-1">BEST MATCH</div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </>
                    )}

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {compareItems.size === 0 && animationStep >= 5 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300"
        >
          <GitCompare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No items to compare</h3>
          <p className="text-gray-600 mb-4">Click the compare button on products to add them here.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setCompareItems(new Set([1, 2]));
              setComparisonPriorities(['price']);
            }}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Try Demo Again
          </motion.button>
        </motion.div>
      )}

      {/* Success Message */}
      {compareItems.size > 0 && showComparison && comparisonPriorities.length > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3 text-green-800">
            <Check size={20} className="flex-shrink-0" />
            <div>
              <span className="font-semibold">Smart Comparison Active!</span>
              <div className="text-sm text-green-700 mt-1">
                Items are ranked by your priorities: {comparisonPriorities.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};



const SalesDemo = ({ capturedItems }) => {
  const [messages, setMessages] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [soldItems, setSoldItems] = useState(0);

  useEffect(() => {
    if (capturedItems.length > 0) {
      const timer = setTimeout(() => {
        const buyers = ['Jessica', 'Mike', 'Sarah', 'Alex', 'Emma'];
        const newMessage = {
          id: Date.now(),
          buyer: buyers[Math.floor(Math.random() * buyers.length)],
          item: capturedItems[capturedItems.length - 1],
          type: Math.random() > 0.5 ? 'purchase' : 'inquiry',
          time: 'Just now'
        };
        setMessages(prev => [newMessage, ...prev.slice(0, 2)]);
        
        if (newMessage.type === 'purchase') {
          setEarnings(prev => prev + newMessage.item.price);
          setSoldItems(prev => prev + 1);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [capturedItems.length]);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-900">Connect & Sell</h3>
      
      {/* Messages */}
      <div className="space-y-3">
        {messages.map((message, i) => (
          <motion.div 
            key={message.id}
            className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
              message.type === 'purchase' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-orange-50 border-orange-200'
            }`}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02, y: -2 }}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
              message.type === 'purchase' ? 'bg-green-500' : 'bg-orange-500'
            }`}>
              {message.buyer[0]}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {message.type === 'purchase' 
                  ? `${message.buyer} purchased your ${message.item.category}!` 
                  : `${message.buyer} is interested in your ${message.item.category}`
                }
              </div>
              <div className="text-xs text-gray-500">{message.time}</div>
            </div>
            <div className="text-right">
              {message.type === 'purchase' ? (
                <div className="text-green-600 font-bold">${message.item.price}</div>
              ) : (
                <motion.button 
                  className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Reply
                </motion.button>
              )}
            </div>
          </motion.div>
        ))}
        
        {messages.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <MessageCircle size={32} className="text-gray-400 mx-auto mb-2" />
            <div className="text-gray-600 text-sm">Messages will appear here when buyers contact you</div>
          </div>
        )}
      </div>
      
      {/* Earnings Dashboard */}
      {(earnings > 0 || soldItems > 0) && (
        <motion.div 
          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <motion.div 
                className="text-2xl font-bold text-green-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.7 }}
              >
                ${earnings}
              </motion.div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </div>
            <div>
              <motion.div 
                className="text-2xl font-bold text-blue-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.8 }}
              >
                {soldItems}
              </motion.div>
              <div className="text-sm text-gray-600">Items Sold</div>
            </div>
            <div>
              <motion.div 
                className="text-2xl font-bold text-purple-600"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.9 }}
              >
                {messages.length}
              </motion.div>
              <div className="text-sm text-gray-600">Active Chats</div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <motion.button
          className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <MessageCircle size={16} />
          View All Chats
        </motion.button>
        <motion.button
          className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-medium"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <DollarSign size={16} />
          Withdraw Funds
        </motion.button>
      </div>
    </div>
  );
};

// Sublease Demo Components (keeping original ones)
const SubleaseSearchDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStep, setFilterStep] = useState(0);
  const [searchResults, setSearchResults] = useState(247);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [hoveredStep, setHoveredStep] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState({
    bedrooms: 1,
    bathrooms: 1,
    accommodationType: 'entire',
    priceRange: [500, 2000],
    amenities: []
  });

  const steps = [
    { 
      title: 'Location', 
      subtitle: 'Where are you looking?', 
      value: '', 
      placeholder: 'Enter location...',
      icon: MapPin,
      color: 'from-orange-400 to-red-400'
    },
    { 
      title: 'Dates', 
      subtitle: 'When do you need it?', 
      value: '', 
      placeholder: 'Select dates...',
      icon: Calendar,
      color: 'from-orange-400 to-amber-400'
    },
    { 
      title: 'Rooms', 
      subtitle: 'How many rooms?', 
      value: '1 bedroom, 1 bathroom', 
      placeholder: '',
      icon: Home,
      color: 'from-orange-400 to-yellow-400'
    }
  ];

  const accommodationTypes = [
    { 
      id: 'entire', 
      icon: Home, 
      title: 'Entire Place', 
      subtitle: 'Have the entire place to yourself',
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      id: 'private', 
      icon: Building, 
      title: 'Private Room', 
      subtitle: 'Your own bedroom, shared common spaces',
      gradient: 'from-orange-500 to-amber-500'
    },
    { 
      id: 'shared', 
      icon: Users, 
      title: 'Shared Room', 
      subtitle: 'Share a bedroom with others',
      gradient: 'from-orange-500 to-yellow-500'
    }
  ];

  const amenities = [
    { id: 'wifi', icon: Wifi, label: 'WiFi Included', color: 'text-blue-500' },
    { id: 'parking', icon: Car, label: 'Parking', color: 'text-green-500' },
    { id: 'laundry', icon: Home, label: 'In-unit Laundry', color: 'text-purple-500' },
    { id: 'pet', icon: Heart, label: 'Pet Friendly', color: 'text-pink-500' },
    { id: 'furnished', icon: Coffee, label: 'Furnished', color: 'text-brown-500' },
    { id: 'utilities', icon: DollarSign, label: 'Utilities Included', color: 'text-emerald-500' },
    { id: 'ac', icon: Snowflake, label: 'Air Conditioning', color: 'text-cyan-500' },
    { id: 'gym', icon: Dumbbell, label: 'Fitness Center', color: 'text-red-500' }
  ];

  const budgetPresets = [
    { 
      id: 'budget', 
      icon: Home, 
      title: 'Budget', 
      range: '$500-$800', 
      min: 500, 
      max: 800,
      gradient: 'from-green-400 to-emerald-500'
    },
    { 
      id: 'mid', 
      icon: Building, 
      title: 'Mid-range', 
      range: '$800-$1200', 
      min: 800, 
      max: 1200,
      gradient: 'from-orange-400 to-amber-500'
    },
    { 
      id: 'premium', 
      icon: Star, 
      title: 'Premium', 
      range: '$1200-$1600', 
      min: 1200, 
      max: 1600,
      gradient: 'from-purple-400 to-pink-500'
    },
    { 
      id: 'luxury', 
      icon: Sparkles, 
      title: 'Luxury', 
      range: '$1600-$2000', 
      min: 1600, 
      max: 2000,
      gradient: 'from-yellow-400 to-orange-500'
    }
  ];

  const sampleListings = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300&h=200&fit=crop",
      title: "Modern Studio in Dinkytown",
      price: "$850/month",
      location: "Dinkytown, Minneapolis",
      rating: 4.8,
      amenities: ['wifi', 'furnished', 'ac'],
      type: "Entire Place"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=300&h=200&fit=crop",
      title: "Cozy 1BR Near Campus",
      price: "$950/month",
      location: "University Area",
      rating: 4.6,
      amenities: ['parking', 'laundry', 'pet'],
      type: "Private Room"
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop",
      title: "Spacious Shared Living",
      price: "$650/month",
      location: "Downtown Minneapolis",
      rating: 4.4,
      amenities: ['wifi', 'gym', 'utilities'],
      type: "Shared Room"
    }
  ];

  // Typing animation for location
  useEffect(() => {
    if (currentStep === 0) {
      setIsTyping(true);
      const text = "Dinkytown, Minneapolis";
      let index = 0;
      const timer = setInterval(() => {
        setTypedText(text.slice(0, index));
        index++;
        if (index > text.length) {
          clearInterval(timer);
          setIsTyping(false);
          setTimeout(() => setCurrentStep(1), 1000);
        }
      }, 100);
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  // Auto-play through steps
  useEffect(() => {
    if (currentStep === 1) {
      const timer = setTimeout(() => setCurrentStep(2), 2000);
      return () => clearTimeout(timer);
    } else if (currentStep === 2) {
      const timer = setTimeout(() => {
        setCurrentStep(3);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Auto-play through filter steps
  useEffect(() => {
    if (showFilters && filterStep < 3) {
      const timer = setTimeout(() => {
        setFilterStep(prev => prev + 1);
      }, 2500);
      return () => clearTimeout(timer);
    } else if (showFilters && filterStep >= 3) {
      const timer = setTimeout(() => {
        setShowFilters(false);
        setSearchResults(42);
        setShowResults(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showFilters, filterStep]);

  const getCurrentStepValue = (index) => {
    if (index === 0 && currentStep >= 1) return typedText || 'Dinkytown, Minneapolis';
    if (index === 1 && currentStep >= 2) return 'May 1 - Aug 31, 2025';
    if (index === 2 && currentStep >= 3) return '1 bedroom, 1 bathroom';
    return '';
  };

  const toggleAmenity = (amenityId) => {
    setSelectedFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId]
    }));
  };

  const handleSearch = () => {
    if (currentStep >= 3) {
      setShowResults(true);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 p-4 bg-gradient-to-br from-orange-50 via-white to-amber-50 min-h-screen">
      {/* Compact Header */}
      <div className="relative">
        <motion.div
          className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-20"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        
        <div className="flex items-center justify-between relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Home className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Find Your Perfect Sublease
              </h3>
              <p className="text-gray-600 text-sm">Discover amazing places to call home</p>
            </div>
          </motion.div>
          <motion.div 
            className="flex gap-1"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-red-400 to-red-500 rounded-full" />
            <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full" />
            <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full" />
          </motion.div>
        </div>
      </div>

      {/* Main Search Interface - More Compact */}
      <motion.div 
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-100 relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400"
            animate={{ 
              background: [
                'linear-gradient(45deg, #fb923c, #ef4444)',
                'linear-gradient(90deg, #f59e0b, #fb923c)',
                'linear-gradient(135deg, #fb923c, #ef4444)'
              ]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6 relative z-10">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
              <motion.div
                key={index}
                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer group flex-1 ${
                  currentStep > index 
                    ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50' 
                    : currentStep === index 
                    ? 'border-orange-300 bg-gradient-to-br from-orange-25 to-orange-50' 
                    : 'border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:border-orange-200'
                }`}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: '0 8px 30px rgba(251, 146, 60, 0.15)'
                }}
                animate={{ 
                  scale: currentStep === index ? [1, 1.01, 1] : 1,
                  borderColor: currentStep === index ? '#fb923c' : undefined
                }}
                transition={{ duration: 0.3, repeat: currentStep === index ? Infinity : 0, repeatDelay: 2 }}
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => currentStep >= index && setCurrentStep(index)}
              >
                <div className="flex items-start gap-3">
                  <motion.div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden ${
                      currentStep > index ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-300'
                    }`}
                    whileHover={{ rotate: 5 }}
                  >
                    <StepIcon size={18} className="text-white relative z-10" />
                    {currentStep > index && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-orange-400 to-red-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-500 mb-1 font-medium">{step.title}</div>
                    <div className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                      {index === 0 && currentStep === 0 ? (
                        <div className="flex items-center gap-1">
                          <span>{typedText}</span>
                          {isTyping && (
                            <motion.span
                              animate={{ opacity: [0, 1, 0] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="text-orange-500"
                            >
                              |
                            </motion.span>
                          )}
                        </div>
                      ) : (
                        getCurrentStepValue(index) || step.subtitle
                      )}
                    </div>
                    {getCurrentStepValue(index) && (
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        className={`h-1.5 bg-gradient-to-r ${step.color} rounded-full mt-2`}
                        transition={{ duration: 0.8 }}
                      />
                    )}
                  </div>
                </div>
                
                {hoveredStep === index && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                  >
                    <ChevronRight size={10} className="text-white" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Compact Filters Button */}
          <motion.button
            onClick={() => setShowFilters(true)}
            className={`p-4 rounded-xl border-2 transition-all group relative overflow-hidden ${
              currentStep >= 3 
                ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100' 
                : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
            }`}
            disabled={currentStep < 3}
            whileHover={currentStep >= 3 ? { 
              scale: 1.02,
              boxShadow: '0 8px 30px rgba(251, 146, 60, 0.15)'
            } : {}}
            whileTap={currentStep >= 3 ? { scale: 0.98 } : {}}
          >
            <div className="flex items-center gap-3 relative z-10">
              <motion.div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  currentStep >= 3 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-300'
                }`}
                whileHover={currentStep >= 3 ? { rotate: 180 } : {}}
                transition={{ duration: 0.3 }}
              >
                <Filter size={18} className="text-white" />
              </motion.div>
              <div className="text-left">
                <div className="text-xs text-gray-500 mb-1 font-medium">Filters</div>
                <div className="font-semibold text-sm text-gray-900 group-hover:text-orange-600 transition-colors">
                  Add filters
                </div>
              </div>
            </div>
            
            {currentStep >= 3 && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-red-400/10"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            )}
          </motion.button>
        </div>

        {/* Compact Search Button */}
        <motion.button
          onClick={handleSearch}
          className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 text-lg transition-all relative overflow-hidden ${
            currentStep >= 3 
              ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-xl' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={currentStep < 3}
          whileHover={currentStep >= 3 ? { 
            scale: 1.02,
            boxShadow: '0 15px 30px rgba(251, 146, 60, 0.4)'
          } : {}}
          whileTap={currentStep >= 3 ? { scale: 0.98 } : {}}
        >
          <motion.div
            animate={currentStep >= 3 ? { rotate: [0, 360] } : {}}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Search size={20} />
          </motion.div>
          <span>Search {searchResults} listings</span>
          
          {currentStep >= 3 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.button>
      </motion.div>

      {/* Compact Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-orange-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold text-gray-900">Found {searchResults} listings</h4>
              <div className="flex gap-2">
                <motion.button 
                  className="px-3 py-1.5 bg-orange-500 text-white rounded-lg font-medium text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Map View
                </motion.button>
                <motion.button 
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  List View
                </motion.button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sampleListings.map((listing, index) => (
                <motion.div
                  key={listing.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group cursor-pointer"
                  whileHover={{ y: -3 }}
                >
                  <div className="relative overflow-hidden">
                    <img 
                      src={listing.image} 
                      alt={listing.title}
                      className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 flex gap-1">
                      <motion.button
                        className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Heart size={14} className="text-gray-600" />
                      </motion.button>
                      <motion.button
                        className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <Eye size={14} className="text-gray-600" />
                      </motion.button>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-white/90 px-2 py-1 rounded-full text-xs font-medium">
                      {listing.type}
                    </div>
                  </div>
                  
                  <div className="p-3">
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="font-bold text-gray-900 text-sm">{listing.title}</h5>
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-current" />
                        <span className="text-xs font-medium">{listing.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 text-xs mb-2">{listing.location}</p>
                    
                    <div className="flex items-center gap-1 mb-2">
                      {listing.amenities.slice(0, 3).map(amenityId => {
                        const amenity = amenities.find(a => a.id === amenityId);
                        if (!amenity) return null;
                        const AmenityIcon = amenity.icon;
                        return (
                          <div key={amenityId} className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center">
                            <AmenityIcon size={10} className="text-orange-600" />
                          </div>
                        );
                      })}
                      {listing.amenities.length > 3 && (
                        <span className="text-xs text-gray-500">+{listing.amenities.length - 3}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-orange-600">{listing.price}</span>
                      <motion.button
                        className="px-1 py-2 bg-orange-500 text-white rounded-lg text-xs font-small"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        View Details
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Filter Modal */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
            >
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <Filter className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Filters
                    </h4>
                    <p className="text-gray-600 text-xs">Customize your search</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowFilters(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Compact Filter Content */}
              <div className="space-y-6">
                {/* Room Configuration */}
                <div>
                  <h5 className="font-bold text-base mb-4 text-gray-900">Room Configuration</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50">
                      <div className="text-xs text-gray-500 mb-2 font-medium">Bedrooms</div>
                      <div className="flex items-center justify-between">
                        <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-sm">-</button>
                        <span className="font-bold">{selectedFilters.bedrooms}</span>
                        <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                    <div className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50">
                      <div className="text-xs text-gray-500 mb-2 font-medium">Bathrooms</div>
                      <div className="flex items-center justify-between">
                        <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-sm">-</button>
                        <span className="font-bold">{selectedFilters.bathrooms}</span>
                        <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-sm">+</button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Type */}
                <div>
                  <h5 className="font-bold text-base mb-4 text-gray-900">Accommodation Type</h5>
                  <div className="space-y-3">
                    {accommodationTypes.map((type) => {
                      const TypeIcon = type.icon;
                      return (
                        <div
                          key={type.id}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            selectedFilters.accommodationType === type.id
                              ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50'
                              : 'border-gray-200 hover:border-orange-300 bg-gradient-to-br from-white to-gray-50'
                          }`}
                          onClick={() => setSelectedFilters(prev => ({ ...prev, accommodationType: type.id }))}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-r ${type.gradient}`}>
                              <TypeIcon size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="font-bold text-sm">{type.title}</div>
                              <div className="text-xs text-gray-600">{type.subtitle}</div>
                            </div>
                            {selectedFilters.accommodationType === type.id && (
                              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h5 className="font-bold text-base mb-4 text-gray-900">Price Range</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {budgetPresets.map((preset, index) => {
                      const PresetIcon = preset.icon;
                      return (
                        <button
                          key={preset.id}
                          className={`p-3 rounded-xl border-2 text-center transition-all ${
                            filterStep === 2 && index === 1
                              ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50'
                              : 'border-gray-200 hover:border-orange-300 bg-gradient-to-br from-white to-gray-50'
                          }`}
                        >
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center bg-gradient-to-r ${preset.gradient}`}>
                            <PresetIcon size={14} className="text-white" />
                          </div>
                          <div className="font-bold text-xs mb-1">{preset.title}</div>
                          <div className="text-xs text-gray-600">{preset.range}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Amenities */}
                <div>
                  <h5 className="font-bold text-base mb-4 text-gray-900">Amenities</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {amenities.map((amenity, index) => {
                      const AmenityIcon = amenity.icon;
                      const isSelected = selectedFilters.amenities.includes(amenity.id);
                      const shouldHighlight = filterStep === 3 && [0, 1, 4, 6].includes(index);
                      
                      return (
                        <button
                          key={amenity.id}
                          className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                            isSelected || shouldHighlight
                              ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-red-50'
                              : 'border-gray-200 hover:border-orange-300 bg-gradient-to-br from-white to-gray-50'
                          }`}
                          onClick={() => toggleAmenity(amenity.id)}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isSelected || shouldHighlight ? 'bg-orange-500' : 'bg-gray-200'
                            }`}
                          >
                            <AmenityIcon 
                              size={14} 
                              className={isSelected || shouldHighlight ? 'text-white' : 'text-gray-600'} 
                            />
                          </div>
                          <span className="text-xs font-medium text-center">{amenity.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowFilters(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:from-orange-600 hover:to-red-600 transition-all"
                  onClick={() => setShowFilters(false)}
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compact Demo Status */}
      <motion.div 
        className="text-center relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-orange-100"
          animate={{ 
            y: [0, -3, 0],
            boxShadow: [
              '0 8px 25px rgba(251, 146, 60, 0.1)',
              '0 15px 35px rgba(251, 146, 60, 0.2)',
              '0 8px 25px rgba(251, 146, 60, 0.1)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <motion.div
            className="w-1.5 h-1.5 bg-orange-500 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // For demo purposes, we'll simulate the Google Maps API being loaded
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log('Google Maps API loaded (simulated)');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const calculateRoute = async (origin, destination, travelMode) => {
    // Simulate route calculation
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      routes: [{
        legs: [{
          distance: { text: '2.5 miles' },
          duration: { text: '8 minutes' },
          steps: [
            { instructions: 'Head north on Hennepin Ave', distance: { text: '0.3 mi' } },
            { instructions: 'Turn right onto Washington Ave', distance: { text: '0.8 mi' } },
            { instructions: 'Continue on Nicollet Mall', distance: { text: '0.7 mi' } },
            { instructions: 'Turn left on 10th St', distance: { text: '0.4 mi' } },
            { instructions: 'Arrive at Target Headquarters', distance: { text: '' } }
          ]
        }]
      }]
    };
  };

  const geocodeAddress = async (address) => {
    // Simulate geocoding
    await new Promise(resolve => setTimeout(resolve, 300));
    return [{
      geometry: {
        location: {
          lat: () => 44.9778,
          lng: () => -93.2650
        }
      }
    }];
  };

  return {
    isLoaded,
    loadError,
    calculateRoute,
    geocodeAddress
  };
};



const NeighborhoodDemo = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransport, setSelectedTransport] = useState('car');
  const [showRoute, setShowRoute] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [autoTypingComplete, setAutoTypingComplete] = useState(false);

  const transportModes = [
    { id: 'car', icon: 'CAR', label: 'Car', time: '8 min', distance: '2.5 miles', color: '#f97316', mode: 'DRIVING' },
    { id: 'transit', icon: 'BUS', label: 'Transit', time: '15 min', distance: '3.1 miles', color: '#ea580c', mode: 'TRANSIT' },
    { id: 'walk', icon: 'WALK', label: 'Walk', time: '32 min', distance: '2.8 miles', color: '#dc2626', mode: 'WALKING' },
    { id: 'bike', icon: 'BIKE', label: 'Bike', time: '12 min', distance: '2.6 miles', color: '#f59e0b', mode: 'BICYCLING' },
    { id: 'scooter', icon: 'SCOOT', label: 'Scooter', time: '10 min', distance: '2.5 miles', color: '#d97706', mode: 'DRIVING' }
  ];

  // Original full listings from your working code
  const mockListings = [

    {
      id: 2,
      title: "1BR Loft Downtown",
      price: "$1,450/month", 
      location: "North Loop",
      commute: "7 min drive",
      rating: 4.9,
      features: ["Pet OK", "Balcony", "In-unit W/D"],
      coordinates: { lat: 44.9833, lng: -93.2719 }
    },
    {
      id: 4,
      title: "Modern 2BR Apartment",
      price: "$1,650/month",
      location: "Mill District",
      commute: "6 min drive",
      rating: 4.7,
      features: ["Pool", "Fitness Center", "Concierge"],
      coordinates: { lat: 44.9740, lng: -93.2594 }
    },
    {
      id: 5,
      title: "Cozy 1BR near River",
      price: "$1,100/month",
      location: "West Bank",
      commute: "9 min drive",
      rating: 4.5,
      features: ["River View", "Bike Storage", "Laundry"],
      coordinates: { lat: 44.9699, lng: -93.2456 }
    },
    {
      id: 6,
      title: "Luxury Penthouse",
      price: "$2,800/month",
      location: "Downtown East",
      commute: "4 min drive",
      rating: 4.9,
      features: ["City View", "Rooftop Deck", "Valet"],
      coordinates: { lat: 44.9816, lng: -93.2553 }
    }
  ];

  const targetHQCoords = { lat: 44.9778, lng: -93.2650 };

  // Auto-type effect for search
  useEffect(() => {
    const targetText = "Target Headquarters";
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex <= targetText.length) {
        setSearchQuery(targetText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setAutoTypingComplete(true);
      }
    }, 150); // Type each character every 150ms

    return () => clearInterval(typeInterval);
  }, []);

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMaps = () => {
      return new Promise((resolve, reject) => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        
        if (!apiKey) {
          reject(new Error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.'));
          return;
        }

        if (window.google && window.google.maps) {
          resolve(window.google);
          return;
        }

        const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
        if (existingScript) {
          const checkLoaded = () => {
            if (window.google && window.google.maps) {
              resolve(window.google);
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
          if (window.google && window.google.maps) {
            resolve(window.google);
          } else {
            reject(new Error('Google Maps failed to load'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
        };

        document.head.appendChild(script);
      });
    };

    loadGoogleMaps()
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
        console.log('Google Maps loaded successfully');
      })
      .catch((error) => {
        console.error('Google Maps loading error:', error);
        if (error.message.includes('API key not found')) {
          setLoadError('Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env.local file');
        } else {
          setLoadError('Google Maps failed to load. Check your API key and internet connection.');
        }
        setIsLoaded(true); // Still allow demo to work
      });
  }, []);

  // Initialize map when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      if (window.google && window.google.maps) {
        try {
          const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: targetHQCoords,
            zoom: 13,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              },
              {
                featureType: 'transit',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });

          const dirService = new window.google.maps.DirectionsService();
          const dirRenderer = new window.google.maps.DirectionsRenderer({
            suppressMarkers: true,
            polylineOptions: {
              strokeColor: '#1a73e8',
              strokeWeight: 4,
              strokeOpacity: 0.8
            }
          });

          dirRenderer.setMap(mapInstance);

          setMap(mapInstance);
          setDirectionsService(dirService);
          setDirectionsRenderer(dirRenderer);

          // Add Target HQ marker
          new window.google.maps.Marker({
            position: targetHQCoords,
            map: mapInstance,
            title: 'Target Headquarters',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="23" fill="#dc2626" stroke="#ffffff" stroke-width="4"/>
                  <circle cx="25" cy="25" r="15" fill="#ffffff"/>
                  <circle cx="25" cy="25" r="8" fill="#dc2626"/>
                  <circle cx="25" cy="25" r="3" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(50, 50),
              anchor: new window.google.maps.Point(25, 25)
            }
          });

          console.log('Google Maps initialized successfully');
        } catch (error) {
          console.error('Error initializing Google Maps:', error);
          setLoadError('Error initializing Google Maps');
        }
      }
    }
  }, [isLoaded, map]);

  // Handle search and route calculation - triggers after auto-typing completes
  useEffect(() => {
    if (!isLoaded || !autoTypingComplete) return;

    const performSearch = async () => {
      setIsSearching(true);
      
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSearchResults(mockListings);
      
      // If using real Google Maps, add markers and routes
      if (map && window.google && window.google.maps) {
        // Add all listing markers
        mockListings.forEach((listing, index) => {
          const marker = new window.google.maps.Marker({
            position: listing.coordinates,
            map: map,
            title: listing.title,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 0C7.163 0 0 7.163 0 16c0 16 16 24 16 24s16-8 16-24C32 7.163 24.837 0 16 0z" 
                        fill="${selectedListing === listing.id ? '#dc2626' : '#f97316'}"/>
                  <circle cx="16" cy="16" r="8" fill="#ffffff"/>
                  <text x="16" y="20" text-anchor="middle" fill="#f97316" font-size="10" font-weight="bold">$</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(32, 40),
              anchor: new window.google.maps.Point(16, 40)
            }
          });

          marker.addListener('click', () => {
            setSelectedListing(selectedListing === listing.id ? null : listing.id);
          });
        });

        // Show routes from ALL listings to Target HQ if no specific listing is selected
        if (!selectedListing && directionsService) {
          mockListings.forEach((listing, index) => {
            const directionsRenderer = new window.google.maps.DirectionsRenderer({
              suppressMarkers: true,
              preserveViewport: true,
              polylineOptions: {
                strokeColor: '#f97316',
                strokeWeight: 3,
                strokeOpacity: 0.6
              }
            });
            
            directionsRenderer.setMap(map);

            const request = {
              origin: listing.coordinates,
              destination: targetHQCoords,
              travelMode: window.google.maps.TravelMode.DRIVING,
              unitSystem: window.google.maps.UnitSystem.IMPERIAL
            };

            directionsService.route(request, (result, status) => {
              if (status === 'OK') {
                directionsRenderer.setDirections(result);
              }
            });
          });
        }
      }

      setShowRoute(true);
      setIsSearching(false);
    };

    performSearch();
  }, [autoTypingComplete, selectedTransport, isLoaded, map]);

  // Calculate and display route when listing is selected
  useEffect(() => {
    if (!selectedListing || !directionsService || !directionsRenderer) return;

    const selectedListingData = mockListings.find(l => l.id === selectedListing);
    if (!selectedListingData) return;

    const currentTransport = transportModes.find(t => t.id === selectedTransport);
    const travelMode = window.google.maps.TravelMode[currentTransport?.mode] || window.google.maps.TravelMode.DRIVING;

    const request = {
      origin: selectedListingData.coordinates,
      destination: targetHQCoords,
      travelMode: travelMode,
      unitSystem: window.google.maps.UnitSystem.IMPERIAL
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          steps: leg.steps.slice(0, 4).map(step => ({
            instructions: step.instructions.replace(/<[^>]*>/g, ''),
            distance: step.distance.text
          }))
        });

        // Update transport mode color
        directionsRenderer.setOptions({
          polylineOptions: {
            strokeColor: currentTransport?.color || '#1a73e8',
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        });
      } else {
        console.warn('Directions request failed due to ' + status);
        // Fallback route info
        setRouteInfo({
          distance: currentTransport?.distance || '2.5 miles',
          duration: currentTransport?.time || '8 min',
          steps: [
            { instructions: 'Head north on Hennepin Ave', distance: '0.3 mi' },
            { instructions: 'Turn right onto Washington Ave', distance: '0.8 mi' },
            { instructions: 'Continue on Nicollet Mall', distance: '0.7 mi' },
            { instructions: 'Turn left on 10th St', distance: '0.4 mi' }
          ]
        });
      }
    });
  }, [selectedListing, selectedTransport, directionsService, directionsRenderer]);

  const currentTransport = transportModes.find(t => t.id === selectedTransport);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Find Housing Near Work</h3>
        <motion.div 
          className="flex items-center gap-2 text-green-600"
          animate={{ opacity: isSearching ? [1, 0.6, 1] : 1 }}
          transition={{ duration: 2, repeat: isSearching ? Infinity : 0 }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs font-medium">
            {isSearching ? 'Searching...' : 'Live Search'}
          </span>
        </motion.div>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200">
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <div className="text-xs text-gray-500 mb-1">Search Destination</div>
            <div className="relative">
              <motion.input
                type="text"
                value={searchQuery}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                whileFocus={{ scale: 1.01 }}
                placeholder="Enter workplace address..."
              />
              {/* Blinking cursor */}
              <motion.div
                className="absolute right-3 top-1/2 transform -translate-y-1/2 w-0.5 h-4 bg-blue-500"
                animate={{ opacity: !autoTypingComplete ? [1, 0] : 0 }}
                transition={{ duration: 0.8, repeat: !autoTypingComplete ? Infinity : 0 }}
              />
            </div>
          </div>
          <motion.button
            disabled={true}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search Housing'}
          </motion.button>
        </div>

        {/* Transport Mode Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {transportModes.map((mode) => (
            <motion.button
              key={mode.id}
              onClick={() => setSelectedTransport(mode.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedTransport === mode.id
                  ? 'text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: selectedTransport === mode.id ? mode.color : undefined 
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-xs font-bold px-1">{mode.icon}</span>
              <div className="text-left">
                <div className="text-sm font-medium">{mode.label}</div>
                <div className="text-xs opacity-75">{mode.time}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {loadError && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800 text-sm">
            <strong>Google Maps Setup:</strong>
            <div className="mt-2">
              {loadError.includes('API key not found') ? (
                <div>
                  Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in your project root with:
                  <div className="bg-gray-100 p-2 rounded mt-1 font-mono text-xs">
                    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
                  </div>
                </div>
              ) : (
                <div>{loadError}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Container */}
      <div className="relative bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-lg" style={{ height: '400px' }}>
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <div className="text-sm text-gray-600">Loading Google Maps...</div>
            </div>
          </div>
        ) : (
          <div ref={mapRef} className="w-full h-full" />
        )}

        {/* Route Info Card */}
        {showRoute && routeInfo && selectedListing && (
          <motion.div 
            className="absolute top-4 right-4 bg-white rounded-xl p-4 shadow-lg border max-w-64"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentTransport?.color }}
              >
                <span className="text-white text-xs font-bold">{currentTransport?.icon}</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900">{routeInfo.duration}</div>
                <div className="text-sm text-gray-500">{routeInfo.distance} • {currentTransport?.label}</div>
              </div>
            </div>
            
            <div className="border-t pt-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Route Details</div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {routeInfo.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span 
                      className="mt-0.5 font-bold"
                      style={{ color: currentTransport?.color }}
                    >
                      →
                    </span>
                    <div className="flex-1">
                      <div className="text-gray-700">{step.instructions}</div>
                      {step.distance && (
                        <div className="text-gray-500">{step.distance}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Housing Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Housing Near {searchQuery}</h4>
          <span className="text-sm text-gray-500">{searchResults.length} results</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {searchResults.map((listing, i) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => setSelectedListing(listing.id === selectedListing ? null : listing.id)}
              className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${
                selectedListing === listing.id
                  ? 'border-orange-400 bg-orange-50 shadow-lg'
                  : 'border-gray-200 bg-white hover:shadow-md hover:border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center relative">
                  <div className="w-5 h-4 bg-orange-600" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                  <div className="absolute bottom-0 w-3 h-1 bg-orange-600"></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{listing.title}</div>
                  <div className="text-orange-600 font-bold">{listing.price}</div>
                  <div className="text-sm text-gray-500">{listing.location}</div>
                </div>
                <div className="flex items-center gap-1">
                </div>
              </div>
              
              <div className="space-y-2">
                <div 
                  className="text-sm font-medium"
                  style={{ color: currentTransport?.color }}
                >
                  {currentTransport?.icon} {listing.commute} to {searchQuery}
                </div>
                <div className="flex gap-1 flex-wrap">
                  {listing.features.map((feature, idx) => (
                    <span key={idx} className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ConnectDemo = () => {
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [selectedHost, setSelectedHost] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [videoCall, setVideoCall] = useState(false);

  const hosts = [
    { 
      name: 'Sarah Chen', 
      rating: 4.9, 
      responseTime: '< 2 min', 
      verified: true,
      online: true,
      listing: 'Cozy Studio in Dinkytown',
      price: '$850/month',
      avatar: 'SC',
      languages: ['EN', 'ZH'],
      responseRate: 98,
      tours: 47,
      badges: ['Superhost', 'Quick Reply', '5-Star'],
      lastActive: 'Active now'
    },
    { 
      name: 'Alex Rivera', 
      rating: 4.7, 
      responseTime: '< 5 min', 
      verified: true,
      online: false,
      listing: '1BR near Campus',
      price: '$950/month',
      avatar: 'AR',
      languages: ['EN', 'ES'],
      responseRate: 94,
      tours: 32,
      badges: ['Verified', 'Local Expert'],
      lastActive: '5 min ago'
    },
    {
      name: 'Emma Johnson',
      rating: 5.0,
      responseTime: '< 1 min',
      verified: true,
      online: true,
      listing: 'Shared House in Como',
      price: '$650/month',
      avatar: 'EJ',
      languages: ['EN'],
      responseRate: 100,
      tours: 89,
      badges: ['Superhost', 'Instant Book', 'Top Rated'],
      lastActive: 'Active now'
    }
  ];

  const tourSteps = [
    { title: "Welcome! Virtual Tour Starting...", icon: "🏠", bg: "from-blue-400 to-blue-600" },
    { title: "Living Room & Study Area", icon: "🛋️", bg: "from-green-400 to-green-600" },
    { title: "Kitchen & Dining", icon: "🍳", bg: "from-yellow-400 to-orange-500" },
    { title: "Bedroom & Storage", icon: "🛏️", bg: "from-purple-400 to-purple-600" },
    { title: "Bathroom & Amenities", icon: "🚿", bg: "from-pink-400 to-pink-600" },
    { title: "Tour Complete! Questions?", icon: "✨", bg: "from-emerald-400 to-emerald-600" }
  ];

  useEffect(() => {
    const messageTimer = setInterval(() => {
      if (selectedHost !== null && Math.random() > 0.7) {
        const messages = [
          "Hey! I saw you're interested in my place 😊",
          "I can show you around virtually if you'd like!",
          "The location is perfect for campus commute",
          "When would be a good time for a quick chat?"
        ];
        setActiveMessages(prev => [...prev, {
          id: Date.now(),
          text: messages[Math.floor(Math.random() * messages.length)],
          sender: hosts[selectedHost].name,
          time: 'Just now'
        }].slice(-3));
      }
    }, 4000);

    return () => clearInterval(messageTimer);
  }, [selectedHost]);

  useEffect(() => {
    if (showTour) {
      const interval = setInterval(() => {
        setTourStep(prev => {
          if (prev >= tourSteps.length - 1) {
            setShowTour(false);
            return 0;
          }
          return prev + 1;
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [showTour]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Connect with Hosts</h3>
        <motion.div 
          className="flex items-center gap-2 text-green-600"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium">{hosts.filter(h => h.online).length} Online</span>
        </motion.div>
      </div>
      
      <div className="space-y-4">
        {hosts.map((host, i) => (
          <motion.div 
            key={host.name}
            className={`p-5 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${
              selectedHost === i 
                ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-white shadow-xl' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15 }}
            onClick={() => setSelectedHost(selectedHost === i ? null : i)}
            whileHover={{ y: -3, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Animated Background Gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-transparent opacity-0"
              animate={{
                opacity: selectedHost === i ? 1 : 0,
                backgroundPosition: selectedHost === i ? ['0% 50%', '100% 50%'] : '0% 50%'
              }}
              transition={{ duration: 3, repeat: selectedHost === i ? Infinity : 0 }}
            />
            
            <div className="relative z-10">
              {/* Host Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="relative">
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    {host.avatar}
                  </motion.div>
                  
                  {/* Online Status */}
                  <motion.div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                      host.online ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                    animate={host.online ? {
                      scale: [1, 1.2, 1],
                      boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0.4)', '0 0 0 10px rgba(34, 197, 94, 0)']
                    } : {}}
                    transition={{ duration: 2, repeat: host.online ? Infinity : 0 }}
                  >
                    {host.verified && (
                      <Check size={12} className="text-white absolute top-0.5 left-0.5" />
                    )}
                  </motion.div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-lg">{host.name}</span>
                    <div className="flex gap-1">
                      {host.badges.slice(0, 2).map(badge => (
                        <motion.span 
                          key={badge}
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            badge === 'Superhost' ? 'bg-purple-100 text-purple-700' :
                            badge === 'Verified' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {badge}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-1">{host.listing}</div>
                  <div className="text-lg font-bold text-orange-600 mb-2">{host.price}</div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      <span className="font-semibold">{host.rating}</span>
                    </div>
                    <div className="text-gray-500">
                      {host.lastActive}
                    </div>
                    <div className="flex gap-1">
                      {host.languages.map(lang => (
                        <span key={lang} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <motion.button
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      host.online 
                        ? 'bg-green-500 text-white shadow-lg hover:shadow-xl' 
                        : 'bg-gray-200 text-gray-600'
                    }`}
                    whileHover={host.online ? { scale: 1.05, y: -2 } : {}}
                    whileTap={{ scale: 0.95 }}
                  >
                    {host.online ? 'Message Now' : 'Offline'}
                  </motion.button>
                </div>
              </div>
              
              {/* Expanded Content */}
              <AnimatePresence>
                {selectedHost === i && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 pt-4 space-y-4"
                  >
                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">{host.responseRate}%</div>
                        <div className="text-xs text-gray-500">Response Rate</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-600">{host.responseTime}</div>
                        <div className="text-xs text-gray-500">Response Time</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{host.tours}</div>
                        <div className="text-xs text-gray-500">Tours Given</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-orange-600">{host.languages.length}</div>
                        <div className="text-xs text-gray-500">Languages</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-3">
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTour(true);
                          setTourStep(0);
                        }}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-medium shadow-lg"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Camera size={16} />
                        Virtual Tour
                      </motion.button>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoCall(true);
                        }}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium shadow-lg"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Video size={16} />
                        Video Call
                      </motion.button>
                      
                      <motion.button
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-medium shadow-lg"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <MessageCircle size={16} />
                        Chat
                      </motion.button>
                    </div>
                    
                    {/* Live Messages */}
                    {activeMessages.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 rounded-xl p-4 border border-blue-200"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <MessageCircle size={16} className="text-blue-600" />
                          </motion.div>
                          <span className="text-sm font-medium text-blue-800">Live Messages</span>
                        </div>
                        <div className="space-y-2">
                          {activeMessages.map((message, idx) => (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white rounded-lg p-3 shadow-sm"
                            >
                              <div className="text-sm text-gray-800">{message.text}</div>
                              <div className="text-xs text-gray-500 mt-1">{message.time}</div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* Virtual Tour Overlay */}
      <AnimatePresence>
        {showTour && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full mx-4"
              style={{ height: '80vh' }}
            >
              {/* Tour Header */}
              <div className="bg-gradient-to-r from-gray-900 to-black text-white p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.div 
                    className="text-4xl"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    {tourSteps[tourStep]?.icon}
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-bold">{tourSteps[tourStep]?.title}</h3>
                    <p className="text-gray-300">Step {tourStep + 1} of {tourSteps.length}</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => setShowTour(false)}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>
              
              {/* Tour Content */}
              <motion.div 
                className={`h-full bg-gradient-to-br ${tourSteps[tourStep]?.bg} relative overflow-hidden`}
                key={tourStep}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                {/* 3D Room Simulation */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-white text-center"
                    animate={{ 
                      scale: [0.8, 1, 0.8],
                      rotateY: [0, 5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <div className="text-8xl mb-4">{tourSteps[tourStep]?.icon}</div>
                    <h2 className="text-3xl font-bold mb-2">{tourSteps[tourStep]?.title}</h2>
                    <p className="text-xl opacity-90">360° Interactive Experience</p>
                  </motion.div>
                </div>
                
                {/* Floating UI Elements */}
                <div className="absolute top-6 right-6 space-y-3">
                  {[1,2,3].map(i => (
                    <motion.div
                      key={i}
                      className="bg-white/20 backdrop-blur rounded-lg p-3 text-white"
                      animate={{
                        y: [0, -10, 0],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.5
                      }}
                    >
                      <div className="text-sm">📏 {12 + i * 2} ft²</div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Progress Bar */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="bg-white h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((tourStep + 1) / tourSteps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-white text-sm">
                    <span>Virtual Tour Progress</span>
                    <span>{Math.round(((tourStep + 1) / tourSteps.length) * 100)}% Complete</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Video Call Overlay */}
      <AnimatePresence>
        {videoCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl mx-4"
              style={{ height: '70vh' }}
            >
              {/* Video Call Header */}
              <div className="bg-black/50 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center font-bold">
                    SC
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-sm text-gray-300">Connecting...</div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setVideoCall(false)}
                  >
                    <Phone size={20} className="text-white" />
                  </motion.button>
                </div>
              </div>
              
              {/* Video Content */}
              <div className="relative h-full bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
                <motion.div
                  className="text-center text-white"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Video size={64} className="mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Connecting to Sarah...</h3>
                  <p className="text-gray-300">Get ready for a live apartment tour!</p>
                </motion.div>
                
                {/* Floating Connection Status */}
                <motion.div
                  className="absolute top-4 left-4 bg-green-500 text-white px-3 py-2 rounded-lg flex items-center gap-2"
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-sm font-medium">HD Quality</span>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



const BookingDemo = () => {
  const [messages, setMessages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [autoResponses] = useState([
    "🏠 Sublet",
    "Dinkytown", 
    "$850/month",
    "Done!"
  ]);
  const chatContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  const demoSteps = [
    {
      type: 'facebook',
      showFacebookPost: true
    },
    {
      type: 'system',
      text: "🎉 Too lazy to write all that?\n\nI'll just ask you a quick questions!\n\nWhat type of listing?",
      options: [
        { label: "🏠 Sublet", value: "🏠 Sublet" },
        { label: "🔄 Lease Takeover", value: "🔄 Lease Takeover" },
        { label: "🛏️ Room Share", value: "🛏️ Room Share" }
      ]
    },
    {
      type: 'system',
      text: "Where? 📍",
      options: [
        { label: "Dinkytown", value: "Dinkytown" },
        { label: "East Bank", value: "East Bank" },
        { label: "Stadium Village", value: "Stadium Village" }
      ]
    },
    {
      type: 'system',
      text: "Monthly rent? 💰",
      input: { type: 'number', placeholder: '$850' }
    },
    {
      type: 'system',
      text: "✨ BOOM! Your listing is ready!\n\nWe auto-filled everything else 🚀",
      showFinal: true
    }
  ];

  useEffect(() => {
    if (currentStep < demoSteps.length) {
      const timer = setTimeout(() => {
        if (currentStep === 0) {
          // For Facebook post, show it immediately
          setMessages(prev => [...prev, { 
            ...demoSteps[currentStep], 
            id: Date.now(),
            timestamp: new Date()
          }]);
          
          // After showing Facebook post, wait then show transition
          setTimeout(() => {
            setShowTransition(true);
            setTimeout(() => {
              setShowTransition(false);
              setCurrentStep(1);
            }, 2000);
          }, 3500);
        } else {
          // For chat messages, show typing indicator first
          setIsTyping(true);
          setTimeout(() => {
            setMessages(prev => [...prev, { 
              ...demoSteps[currentStep], 
              id: Date.now(),
              timestamp: new Date()
            }]);
            setIsTyping(false);
            
            if (currentStep > 0 && currentStep < 4) {
              setTimeout(() => {
                const response = autoResponses[currentStep - 1];
                handleAutoResponse(response);
              }, 2500);
            }
          }, 1000);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  useEffect(() => {
    if (chatEndRef.current && chatContainerRef.current) {
      chatEndRef.current.scrollIntoView({ 
        behavior: "smooth", 
        block: "end",
        inline: "nearest"
      });
    }
  }, [messages, isTyping]);

  const handleAutoResponse = (response) => {
    setMessages(prev => [...prev, {
      type: 'user',
      text: response,
      id: Date.now() + 1,
      timestamp: new Date()
    }]);

    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
    }, 800);
  };

  const renderFacebookPost = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-t-2xl border-b border-gray-200 shadow-sm relative"
    >
      {/* Facebook brand header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">f</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Create Post</h3>
        </div>
        <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
          <span className="text-gray-600 text-lg">×</span>
        </button>
      </div>
      
      {/* Facebook Groups indicator */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2 text-sm text-blue-700">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="font-medium">U of M Housing & Sublets</span>
          <span className="text-blue-500">• 24,573 members</span>
        </div>
      </div>
      
      {/* Toggle */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-gray-700 text-sm">Post anonymously</span>
          <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
            <motion.div 
              className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm"
              animate={{ x: 26 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
        </div>
      </div>
      
      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white font-bold text-sm">TK</span>
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">Tony Kang</div>
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span>Public Group</span>
          </div>
        </div>
      </div>
      
      {/* Post content area */}
      <div className="px-4 py-3">
        <div className="text-gray-400 text-base mb-4 min-h-[60px] flex items-center">
          <span className="leading-relaxed">What would you like to share about your place?</span>
        </div>
        
        {/* Pain points */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
        >
          <div className="text-red-600 text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-base">😤</span>
            <span>SO MUCH TO WRITE:</span>
          </div>
          <div className="space-y-2 text-xs text-red-700">
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              <span>Long description about the place</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              <span>List all amenities & room details</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              <span>Dates, prices, lease terms</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              <span>Format everything perfectly</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1 h-1 bg-red-400 rounded-full"></span>
              <span>Upload photos one by one</span>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Facebook toolbar */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-3 font-medium">Add to your post</div>
        <div className="flex items-center gap-4">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-green-200 transition-colors"
          >
            <span className="text-lg">📷</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
          >
            <span className="text-lg">👥</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-red-200 transition-colors"
          >
            <span className="text-lg">📍</span>
          </motion.div>
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="w-9 h-9 bg-yellow-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-yellow-200 transition-colors"
          >
            <span className="text-lg">😊</span>
          </motion.div>
          <div className="text-gray-400 font-bold cursor-pointer hover:text-gray-600">•••</div>
        </div>
      </div>
      
      {/* Post button */}
      <div className="px-4 py-4">
        <button 
          className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed transition-all"
          disabled
        >
          Post
        </button>
      </div>

      {/* Facebook-style bottom bar */}
      <div className="bg-gray-50 px-4 py-2 rounded-b-2xl border-t border-gray-100">
        <div className="text-xs text-gray-400 text-center">
          Facebook • Mobile App
        </div>
      </div>
    </motion.div>
  );

  const renderTransition = () => (
    <AnimatePresence>
      {showTransition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className="text-center"
          >
            <motion.div 
              className="inline-block bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg"
              animate={{ 
                scale: [1, 1.05, 1],
                boxShadow: [
                  "0 4px 20px rgba(249, 115, 22, 0.3)",
                  "0 8px 30px rgba(249, 115, 22, 0.4)",
                  "0 4px 20px rgba(249, 115, 22, 0.3)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles size={16} className="inline mr-2" />
              😫 Too much work! There's a better way...
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderFinalCard = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 border border-green-200"
    >
      <div className="text-center mb-4">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center"
        >
          <Check className="text-white" size={24} />
        </motion.div>
        <h3 className="font-bold text-gray-900 text-lg">Perfect Listing Created! 🎉</h3>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-3 shadow-sm border border-gray-100"
      >
        <div className="flex items-center gap-2 mb-2">
          <Home size={16} className="text-blue-500" />
          <span className="font-semibold text-sm">Sublet in Dinkytown</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-orange-500" />
            <span>Dinkytown</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign size={12} className="text-green-500" />
            <span>$850/month</span>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-3 gap-1">
          {[1, 2, 3].map((_, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="aspect-square bg-gray-100 rounded flex items-center justify-center"
            >
              <Camera size={12} className="text-gray-400" />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-4 text-center"
      >
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg inline-block">
          <Sparkles size={16} className="inline mr-1" />
          Published in 30 seconds!
        </div>
        <div className="text-xs text-gray-600 mt-2">🚀 vs 20+ minutes the old way</div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-400 to-red-400 text-white p-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <MessageCircle size={18} />
          <span className="font-bold">Smart Listing</span>
        </div>
      </div>

      {/* Messages Container - Fixed height with internal scroll */}
      <div 
        ref={chatContainerRef}
        className="h-[500px] overflow-y-auto bg-gray-50 scroll-smooth"
        style={{ 
          scrollBehavior: 'smooth',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E0 transparent'
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div 
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {message.showFacebookPost ? (
                <div className="p-2">
                  {renderFacebookPost()}
                </div>
              ) : (
                <div className={`flex p-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[280px]">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`px-4 py-3 rounded-2xl ${
                        message.type === 'user' 
                          ? 'bg-orange-500 text-white rounded-br-md'
                          : 'bg-white text-gray-800 rounded-bl-md shadow-sm border'
                      }`}
                    >
                      <div className="text-sm font-medium whitespace-pre-wrap">
                        {message.text}
                      </div>
                      
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-3 bg-orange-50 text-gray-800 rounded-xl border border-orange-200 text-sm font-medium text-center cursor-pointer hover:bg-orange-100 transition-colors"
                            >
                              {option.label}
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {message.input && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-3"
                        >
                          <div className="w-full p-3 bg-gray-50 rounded-xl border text-gray-600 text-sm">
                            {message.input.placeholder}
                          </div>
                        </motion.div>
                      )}

                      {message.showFinal && renderFinalCard()}
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {renderTransition()}

        <AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex justify-start p-3"
            >
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border">
                <div className="flex space-x-1">
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.1 }}
                  />
                  <motion.div 
                    className="w-2 h-2 bg-orange-400 rounded-full"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};
export default SuboxHomepage;