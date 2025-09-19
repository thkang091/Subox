"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useInView } from 'framer-motion';
import {
  Home, Search, Camera, Users, Star,
  ArrowRight, Check, Heart,
  Calendar, DollarSign, X,
  BedDouble, Menu
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Image from 'next/image';


const SuboxHomepage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isAssembling, setIsAssembling] = useState(false);

  const [showNav, setShowNav] = useState(true);
  const [lastScrolly, setLastScrolly] = useState(0);
  const [scrolledPastTop, setScrolledPastTop] = useState(false);
  
  const assemblyInterval = useRef(null);
  const suboxIntroRef = useRef(null);
  const { scrollYProgress } = useScroll();

  const router = useRouter();

  const [showMenu, setShowMenu] = useState(false);
  
  // Parallax transforms
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const howY = useTransform(scrollYProgress, [0.2, 0.8] , [100, -50]);

  // Scroll Navigation bar
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;

      setScrolledPastTop(currentY > 20);

      if (currentY > lastScrolly && currentY > 20) {
        setShowNav(false);
      } else if (currentY < lastScrolly) {
        setShowNav(true);
      } else if (currentY <= 20) {
        setShowNav(true);
      }

      setLastScrolly(currentY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrolly]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);


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
        className={`hidden md:block fixed top-0 z-50 transition-all duration-300 w-fit left-1/2 -translate-x-1/2 ${
          scrolledPastTop && showNav
            ? 'bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-md rounded-xl py-2 px-4 w-fit mx-auto'
            : 'bg-transparent border-none shadow-none rounded-none py-4 px-6'
        }`}
        initial={{ y: 0 }}
        animate={{ y: showNav ? 0 : -100 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="w-fit flex items-center justify-between gap-8 whitespace-nowrap">
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
            </motion.div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8 whitespace-nowrap">
              {['Use Cases', 'How it works', 'Help'].map((item, i) => {
                const help = item === 'Help';
                const link = help ? "/help" : `#${item.toLowerCase().replace(/ /g, '-')}`;

                return(                
                <motion.a 
                  key={item}
                  href={link}
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
                </motion.a>);
              })}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4 whitespace-nowrap">
              <motion.button
                className="px-4 py-2 text-gray-600 hover:text-orange-500 font-medium transition-colors"
                onClick={() => router.push("auth/")}
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
                onClick={() => router.push("auth?mode=signup")}
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
      </motion.nav>

    <div className="block md:hidden ">
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="pt-4 px-4 relative"
      >
        {/* Header Row with Logo + Menu Button */}
        <div className='fixed inset-x-0 top-0 z-50 bg-white/30 backdrop-blur-2xl border-b border-gray-200/1'>
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2">
            {/* Logo */}
            <motion.div 
              className="flex items-center space-x-2 -mx-1 mt-1"
            >              
            {/* Main Subox Logo */}
              <motion.div className="relative">
                {/* House Icon */}
                <motion.svg 
                  className="w-10 h-10" 
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
                  className="w-6 h-6 absolute -top-1 -right-1" 
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
                  className="text-xl font-bold text-gray-900"
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
                  className="text-[10px] text-gray-500 font-medium tracking-wider"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  SUBLETS & MOVING SALES
                </motion.span>
              </motion.div>
            </motion.div>

            {/* Menu Button */}
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 rounded-md -mt-2 -mx-4"
            >
              <Menu className='text-gray-600' />
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 right-0 w-64 flex flex-col gap-4 mt-4 bg-white z-50 p-4"
          >
            <button
              className='ml-auto'
              onClick={() => setShowMenu(false)}
            >
              <X/>
            </button>
            {["Use Cases", "How it works", "Help"].map((item) => {
              const help = item === "Help";
              const link = help
                ? "/help"
                : `#${item.toLowerCase().replace(/ /g, "-")}`;

              return (
                <a
                  key={item}
                  href={link}
                  className="text-gray-600 hover:text-orange-500 font-medium"
                >
                  {item}
                </a>
              );
            })}

            {/* Auth Buttons */}
            <button
              className="px-4 py-2 text-gray-600 hover:text-orange-500 font-medium transition-colors"
              onClick={() => router.push("auth/")}
            >
              Log in
            </button>
            <button
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={() => router.push("auth?mode=signup")}
            >
              Get Started
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>

      {/* Hero Section with Furniture Animation */}
      <motion.section 
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
        style={{ y: heroY }}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 mb-16">
          {/* Hero Text - Left Side */}
          <motion.div
            className="flex-1 text-center lg:text-left hidden md:block"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              className="perspective-1000"
            >
              <motion.h1 
                className="text-5xl md:text-7xl font-bold font-sans text-gray-900 mb-6 leading-tight cursor-default"
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
                className="text-xl font-inter text-gray-600 mb-8 max-w-3xl leading-relaxed cursor-default"
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
                onClick={() => router.push("auth?mode=signup")}
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
            <div className='hidden md:block'>
              {/* L-shaped Sofa - Top Left Position */}
              <motion.div
                className="absolute z-10"
                initial={{ 
                  x: -400,
                  y: 600,
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
                  y: 400,
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
                  y: 600,
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
            </div>

          <motion.section 
            className="relative z-10 max-w-7xl mx-auto px-4 py-12 sm:px-6 sm:py-20 block md:hidden"
            style={{ y: heroY }}
          >
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 sm:gap-16 mb-12">
              <motion.div
                className="flex-1 text-center lg:text-left"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <motion.h1 
                  className="text-3xl sm:text-4xl md:text-7xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight"
                >
                  Student life.<br />
                  <span className="text-orange-500">Simplified.</span>
                </motion.h1>

                <motion.p 
                  className="text-base sm:text-lg md:text-xl text-gray-600 mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0"
                >
                  The all-in-one platform for student housing and campus marketplace.{" "}
                  <span className="font-semibold bg-gradient-to-r from-orange-500 to-purple-600 bg-clip-text text-transparent">
                    Capture, list, and sell your items instantly with AI-powered magic.
                  </span>
                </motion.p>

                <motion.div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <button 
                    className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    onClick={() => router.push("auth?mode=signup")}
                  >
                    Get Started Free
                  </button>
                </motion.div>
              </motion.div>
            </div>
          </motion.section>

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
                <Image 
                  src="/Sublease.png"
                  alt="Subox Platform Main View"
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Additional pictures */}
              <div className="md:w-1/2">
                <div className="grid grid-cols-1.5 gap-1 h-full">
                  <div className="h-24 md:h-auto rounded-lg overflow-hidden">
                    <Image 
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
                <div className="w-16 h-16 overflow-hidden mr-4 flex-shrink-0 flex items-center justify-center">
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
                
                <button 
                  className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex items-center justify-center cursor-pointer"
                  onClick={() => router.push("auth?mode=signup")}
                >
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
                Nope! Subox welcomes anyone looking for flexible, months-long stays. Planning a long internship or remote semester? You&apos;ll find better deals here than scrolling Airbnb. List or sublease for a semester, a summer, or however long you need—no limits, zero hassle.
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
                Built by a student who procrastinates everything until the last possible second. We get the chaos of finals, packing, and not knowing where your internship even is yet. That&apos;s why we created Subox: an AI-powered, zero-effort platform made for students who just need things to work, fast.
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
      </motion.section>


    <section className="text-center px-6 mt-10 mb-10">
      <div className="max-w-4xl mx-auto">
        {/* Animated Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold font-sans text-gray-900 leading-tight"
        >
          Your <span className="text-orange-500">Space</span>. Your <span className='text-orange-500'>Stuff</span>. <br className="hidden md:block" /> Your <span className='text-orange-500'>Time</span> to
          <span className='text-orange-500'> Move</span>.
        </motion.h1>

        {/* Animated Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-6 text-lg md:text-xl text-gray-700 font-medium font-inter"
        >
          Find subleases and student essentials near you —{" "}
          <span className="text-orange-500 font-semibold">faster</span>,{" "}
          <span className="text-orange-500 font-semibold">safer</span>,{" "}
          <span className="text-orange-500 font-semibold">smarter</span>.
        </motion.p>
      </div>
    </section>

    <UseCasesSection />

    <section className="text-center px-6 bg-white mt-10 mb-40">
      <div className="max-w-4xl mx-auto">
        {/* Animated Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight font-sans"
        >
          Why waste it when you can{" "}
          <span className="text-orange-500">Subox</span> it?
        </motion.h2>

        {/* Animated Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-6 text-lg md:text-xl text-gray-700 font-medium font-inter"
        >
          We connect students who need a place with those who are leaving one.{" "}
          <br className="hidden md:block" /> Simple.
        </motion.p>
      </div>
    </section>

      <HowItWorksSection howY={howY} />

      <footer className="bg-orange-300 text-white py-12 w-full">
        <div className="hidden md:block max-w-7xl mx-auto px-4">
          {/* Upper Grid: 4 columns from original + 4 new columns in two rows */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Subox Brand */}
            <div>
              <ul className="space-y-2">
                <div className="flex items-center space-x-3 mt-3 px-5">
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
                  <motion.div className="flex flex-col text-3xl font-bold text-white">
                      Subox
                  </motion.div>
                </div>
                <p className="text-white text-sm mt-4 px-3">
                  Find the perfect short-term housing solution near your campus and needed items.
                </p>
              </ul>
            </div>

            {/* Sublease */}
            <div className="px-4">
              <h4 className="font-bold mb-4">Sublease</h4>
              <ul className="space-y-2">
                <li><a href="/sale/browse" className="hover:underline">Home</a></li>
                <li><a href="/search" className="hover:underline">Search</a></li>
                <li><a href="#" className="hover:underline">List Your Space</a></li>
                <li><a href="/help" className="hover:underline">Campus Map</a></li>
              </ul>
            </div>

            {/* Move out sale */}
            <div>
              <h4 className="font-bold mb-4">Move Out Sale</h4>
              <ul className="space-y-2">
                <li><a href="/sale/browse" className="hover:underline">Browse Items</a></li>
                <li><a href="#" className="hover:underline">Post Your Items</a></li>
                <li><a href="#" className="hover:underline">See Favorites</a></li>
                <li><a href="#" className="hover:underline">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-2xl font-bold mb-4">Support</h3>
              <p className="text-lg">Need help?</p>
              <a
                href="/help"
                id='help'
                className="inline-block mt-3 px-6 py-3 bg-white text-orange-400 font-semibold rounded-full shadow hover:bg-orange-400 hover:text-white transition"
              >
                Visit Help Center
              </a>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/30 my-10"></div>

          {/* Bottom Grid: 4 more sections */}
          <div className="grid grid-cols-1 ml-75 md:grid-cols-4 gap-8 text-center md:text-left">

            {/* Get Started */}
            <div>
              <h3 className="font-bold mb-4">Get Started</h3>
              <ul className="space-y-2">
                <li><a href="auth" className="hover:underline">Log in</a></li>
                <li><a href="auth?mode=signup" className="hover:underline">Sign up</a></li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-bold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:underline">Features</a></li>
                <li><a href="#use-cases" className="hover:underline">Use Cases</a></li>
                <li><a href="#how-it-works" className="hover:underline">How it Works</a></li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-10 border-t border-white/30 text-center text-sm text-orange-100">
            © {new Date().getFullYear()} Subox. All rights reserved.
          </div>
        </div>
        <div className="md:hidden max-w-7xl mx-auto px-4">
          {/* Upper Grid: stacked on mobile, grid on desktop */}
          <div className="flex flex-col gap-10 md:grid md:grid-cols-4 md:gap-8 mb-10">

            {/* Subox Brand */}
            <div>
              <div className="flex items-center space-x-3 mt-3 px-2 md:px-5">
                {/* Logo */}
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

                <div className="text-3xl font-bold">Subox</div>
              </div>
              <p className="text-white text-sm mt-4 px-2 md:px-3">
                Find the perfect short-term housing solution near your campus and needed items.
              </p>
            </div>

            {/* Sublease and Move out Sale*/}
            <div className='flex justify-center gap-4'>
              <div>              
                <h4 className="font-bold text-lg md:text-xl mb-3 border-b border-white/30 pb-2">Sublease</h4>
                <ul className="space-y-2 text-sm md:text-base">
                  <li><a href="/sale/browse" className="hover:underline">Home</a></li>
                  <li><a href="/search" className="hover:underline">Search</a></li>
                  <li><a href="#" className="hover:underline">List Your Space</a></li>
                  <li><a href="/help" className="hover:underline">Campus Map</a></li>
                </ul>
              </div>
              <div>              
                <h4 className="font-bold text-lg md:text-xl mb-3 border-b border-white/30 pb-2">Move Out Sale</h4>
                <ul className="space-y-2 text-sm md:text-base">
                  <li><a href="/sale/browse" className="hover:underline">Browse Items</a></li>
                  <li><a href="#" className="hover:underline">Post Your Items</a></li>
                  <li><a href="#" className="hover:underline">See Favorites</a></li>
                  <li><a href="#" className="hover:underline">Blog</a></li>
                </ul>
              </div>
            </div>
            <div className='flex justify-center gap-4'>
              <div>
                <h3 className="text-xl font-bold mb-3 border-b border-white/30 pb-2">Get Started</h3>
                <ul className="space-y-2 text-sm md:text-lg">
                  <li><a href="auth" className="hover:underline">Log in</a></li>
                  <li><a href="auth?mode=signup" className="hover:underline">Sign up</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 border-b border-white/30 pb-2">Resources</h3>
                <ul className="space-y-2 text-sm md:text-lg">
                  <li><a href="#features" className="hover:underline">Features</a></li>
                  <li><a href="#use-cases" className="hover:underline">Use Cases</a></li>
                  <li><a href="#how-it-works" className="hover:underline">How it Works</a></li>
                </ul>
              </div>
            </div>


            {/* Support */}
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold mb-3 border-b border-white/30 pb-2">Support</h3>
              <p className="text-sm md:text-lg">Need help?</p>
              <a
                href="/help"
                id="help"
                className="inline-block mt-3 px-5 py-2 bg-white text-orange-600 font-semibold rounded-full shadow hover:bg-orange-600 hover:text-white transition"
              >
                Visit Help Center
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-10 pt-6 border-t border-white/30 text-center text-xs md:text-sm text-orange-100">
            © {new Date().getFullYear()} Subox. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};

// Use Cases
// Inside your homepage file, near the top (after imports):

const useCases = [
  {
    title: "Post",
    description: "Subox helps you post your sublease easy and fast with AI.",
    image: "post-gif.gif",
  },
  {
    title: "Rent",
    description: "Subox helps you browse verified subleases and contact the host instantly.",
    image: "rent-gif.gif",
  },  
  {
    title: "Sell",
    description: "Subox helps you sell your product easy and fast through AI auto listing.",
    image: "sell-gif.gif"
  },
  {
    title: "Buy",
    description: "Subox helps you discover great deals on moving sale products from fellow students, alumnis, and users in Minnesota",
    image: "buy-gif.gif",
  },
];

function UseCasesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const sections = Array.from(
        containerRef.current.querySelectorAll(".use-case-explanation")
      );

      const scrollTop = window.scrollY + window.innerHeight / 2;

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const offsetTop = section.offsetTop;
        const offsetBottom = offsetTop + section.offsetHeight;

        if (scrollTop >= offsetTop && scrollTop < offsetBottom) {
          setActiveIndex(i);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.section
      ref={containerRef}
      id="use-cases"
      className="relative z-10 max-w-7xl mx-auto px-6 py-20"
    >
      <section
        className="max-w-7xl mx-auto px-6 py-20 flex flex-col md:flex-row gap-10"
        style={{ minHeight: "600px" }}
      >
        {/* Left side (desktop image) */}
        <div className="hidden md:block md:w-1/2 sticky top-20 h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={useCases[activeIndex].image}
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              {Array.isArray(useCases[activeIndex].image) ? (
                <Swiper
                  modules={[Navigation, Autoplay]}
                  spaceBetween={20}
                  slidesPerView={1}
                  navigation
                  autoplay={{ delay: 3000, disableOnInteraction: false }}
                  loop
                >
                  {useCases[activeIndex].image.map((imgSrc, idx) => (
                    <SwiperSlide key={imgSrc}>
                      <Image
                        src={imgSrc}
                        alt={`Slide ${idx}`}
                        className="w-full h-full object-contain rounded-xl shadow-lg"
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <Image
                  src={useCases[activeIndex].image}
                  alt={useCases[activeIndex].title}
                  className="w-full h-full object-contain rounded-xl shadow-lg"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right side (titles + description + image for mobile) */}
        <div className="md:w-1/2 flex flex-col gap-20">
          {useCases.map((useCase, i) => (
            <div
              key={useCase.title}
              className="use-case-explanation cursor-pointer flex flex-col gap-4"
              onClick={() => setActiveIndex(i)}
            >
              {/* Title + Subtitle */}
              <div>
                <h3
                  className={`text-3xl font-bold mb-2 ${
                    i === activeIndex ? "text-orange-500" : "text-gray-700"
                  }`}
                >
                  {useCase.title}
                </h3>
                <p className="text-lg text-gray-600 max-w-xl">
                  {useCase.description}
                </p>
              </div>

              {/* Show image under text on mobile only when clicked */}
              {i === activeIndex && (
                <div className="md:hidden mt-4">
                  {Array.isArray(useCase.image) ? (
                    <Swiper
                      modules={[Navigation, Autoplay]}
                      spaceBetween={20}
                      slidesPerView={1}
                      navigation
                      autoplay={{ delay: 3000, disableOnInteraction: false }}
                      loop
                    >
                      {useCase.image.map((imgSrc, idx) => (
                        <SwiperSlide key={imgSrc}>
                          <Image
                            src={imgSrc}
                            alt={`Slide ${idx}`}
                            className="w-full h-64 object-contain rounded-xl shadow-lg"
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <Image
                      src={useCase.image}
                      alt={useCase.title}
                      className="w-full h-64 object-contain rounded-xl shadow-lg"
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </motion.section>
  );
}

// How it works
const HowItWorksSection = ({ howY }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div className="w-full bg-orange-50">
      <motion.section
        ref={ref}
        id="how-it-works"
        style={{ y: howY }}
        className="relative z-10 max-w-7xl mx-auto px-6 py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            How it<span className="text-orange-500"> works</span>
          </h2>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            A quick look at how to post and rent subleases or sell and buy moving items on Subox.
          </p>
        </motion.div>
        <div className="md:hidden flex flex-col gap-16">
          {[
            {
              title: <>Post a <span className="text-orange-500">Sublease</span></>,
              image: "post-gif.gif",
              description: <>Easily post your sublease with a <span className="text-orange-500">few clicks</span> and <span className="text-orange-500">photos</span>.</>,
            },            
            {
              title: <><span className='text-orange-500'>Rent </span>a Place</>,
              image: "rent-gif.gif",
              description: <>Browse local subleases from trusted <span className="text-orange-500">students</span>, <span className="text-orange-500">alumnis</span>, and <span className="text-orange-500">users in Minnesota</span> and contact directly.</>,
            },
            {
              title: <>Sell a <span className='text-orange-500'>Product</span></>,
              image: "sell-gif.gif",
              description: <>Snap a photo and let <span className="text-orange-500">AI</span> handle the rest of your <span className="text-orange-500">item listing</span>.</>,
            },
            {
              title: <><span className='text-orange-500'>Buy </span>a Product</>,
              image: "buy-gif.gif",
              description: <>Buy what you need <span className="text-orange-500">easily</span> and <span className="text-orange-500">quickly</span> by contacting directly.</>,
            },
          ].map((step, index) => {
            const isImageLeft = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={`flex flex-col md:flex-row items-center gap-10 ${
                  isImageLeft ? '' : 'md:flex-row-reverse'
                }`}
              >                
              {/* Text */}
                <div className="md:w-1/2 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-lg text-gray-600">{step.description}</p>
                </div>

              {/* Image */}
                <div className="relative w-full md:w-1/2 h-64 overflow-hidden rounded-xl shadow-lg">
                  <Image
                    src={step.image}
                    alt={step.title || "Step image"}
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
        <div className="hidden md:block flex flex-col gap-16">
          {[
            {
              title: <>Post a <span className="text-orange-500">Sublease</span></>,
              image: "post-gif.gif",
              description: <>Easily post your sublease with a <span className="text-orange-500">few clicks</span> and <span className="text-orange-500">photos</span>.</>,
            },            
            {
              title: <><span className='text-orange-500'>Rent </span>a Place</>,
              image: "rent-gif.gif",
              description: <>Browse local subleases from trusted <span className="text-orange-500">students</span>, <span className="text-orange-500">alumnis</span>, and <span className="text-orange-500">users in Minnesota</span> and contact directly.</>,
            },
            {
              title: <>Sell a <span className='text-orange-500'>Product</span></>,
              image: "sell-gif.gif",
              description: <>Snap a photo and let <span className="text-orange-500">AI</span> handle the rest of your <span className="text-orange-500">item listing</span>.</>,
            },
            {
              title: <><span className='text-orange-500'>Buy </span>a Product</>,
              image: "buy-gif.gif",
              description: <>Buy what you need <span className="text-orange-500">easily</span> and <span className="text-orange-500">quickly</span> by contacting directly.</>,
            },
          ].map((step, index) => {
            const isImageLeft = index % 2 === 0;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                className={`flex flex-col md:flex-row items-center gap-10 ${
                  isImageLeft ? '' : 'md:flex-row-reverse'
                }`}
              >
                {/* Image */}
                <div className="relative w-full md:w-1/2 h-64 overflow-hidden rounded-xl shadow-lg">
                  <Image
                    src={step.image}
                    alt={step.title || "Step Title"}
                    className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                  />
                  <Image
                    src={step.hoverImage}
                    alt={step.title || "Step Title"}
                    className="absolute inset-0 w-full h-full object-cover opacity-0 hover:opacity-100 transition-opacity duration-300"
                  />
                </div>

                {/* Text */}
                <div className="md:w-1/2 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">{step.title}</h3>
                  <p className="text-lg text-gray-600">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};

export default SuboxHomepage;