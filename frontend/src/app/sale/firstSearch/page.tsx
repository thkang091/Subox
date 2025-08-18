"use client"

import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Truck, ShoppingBag, Check } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
// Component imports - This should use the actual LocationPicker component
import SearchLocationPicker from '../../../components/SearchLocationPicker';

const MoveOutSaleSearchPage = () => {
const [location, setLocation] = useState("University of Minnesota");
const [showLocationDropdown, setShowLocationDropdown] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
const [deliveryOption, setDeliveryOption] = useState({
delivery: false,
pickup: false
});
const umnNeighborhoods = [
"University of Minnesota - Twin Cities",
"Dinkytown",
"Stadium Village",
"Como",
"Prospect Park",
"Cedar-Riverside",
"Marcy-Holmes",
"St. Anthony Park",
"Northeast Minneapolis",
"Seward",
"All Areas"
];

const handleSearch = () => {
  const searchParams = new URLSearchParams();
  
  if (location && location !== "All Areas") {
    searchParams.append('location', location);
  }
  
  if (searchQuery.trim()) {
    searchParams.append('search', searchQuery);
  }
  
  if (deliveryOption.delivery) {
    searchParams.append('delivery', 'true');
  }
  if (deliveryOption.pickup) {
    searchParams.append('pickup', 'true');
  }

  setTimeout(() => {
    const searchUrl = `/sale/browse?${searchParams.toString()}`;
    console.log('Moving to:', searchUrl);
    window.location.href = searchUrl;
  }, 1500);
};


<input 
  type="text" 
  placeholder="Search for furniture, electronics, books..." 
  className="w-full px-6 py-4 bg-white text-gray-800 border-0 outline-none"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
/>


const handleSkip = () => {
window.location.href = '/sale/browse';
};


const handleLocationSelect = (loc) => {
setLocation(loc);
setShowLocationDropdown(false);
};
const toggleDeliveryOption = (option) => {
setDeliveryOption(prev => ({
...prev,
[option]: !prev[option]
}));
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

const [isClient, setIsClient] = useState(false);

useEffect(() => {
  setIsClient(true);
}, []);



// Main Render
return (
<div className="min-h-screen bg-white text-gray-800 flex flex-col items-center pt-16 pb-10 px-4">
     <div>
    {isClient ? (
      <InteractiveBackground /> // rendering only at client
    ) : (
      <div className="min-h-screen" /> // place holder for sever
    )}
  </div>

    {/* Skip Button */}
    <div className="absolute top-4 right-4 z-20 animate-fadeIn">
    <button
        onClick={handleSkip}
        className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-600 rounded-full hover:bg-white hover:text-orange-600 transition-all transform hover:scale-105 hover:shadow-lg"
    >
        <span className="font-medium">Skip</span>
    </button>
    </div>
{/* Background gradient accent */}
<div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[#ffebda] to-white -z-10"></div>
  {/* Main Heading */}
  <div className="flex items-center mb-10 mt-12 text-center">
    <MapPin size={36} className="text-[#7a0019]" /> {/* UMN Maroon color */}
    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 ml-2">
      Find Move Out Sales Near You
    </h1>
  </div>
  
  {/* Search Container */}
  <div className="w-full max-w-3xl mx-auto mb-8">
    <div className="relative flex flex-col md:flex-row rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {/* Location Selector */}
      <div className="relative bg-white px-4 py-3 md:w-auto md:flex-shrink-0 cursor-pointer border-b md:border-b-0 md:border-r border-gray-200">
        <div 
  className="flex items-center justify-between gap-2"
  onClick={() => {
    setShowLocationDropdown(!showLocationDropdown);
  }}
>
          <div className="flex items-center">
            <MapPin size={20} className="text-[#7a0019] mr-2 flex-shrink-0" />
            <div className="text-left">
              <div className="text-xs text-gray-500 font-medium">Location</div>
              <div className="font-semibold text-gray-800 truncate max-w-[200px]">{location}</div>
            </div>
          </div>
           <ChevronDown 
                size={18} 
                className={`text-gray-400 transition-transform ${showLocationDropdown ? 'rotate-180' : ''}`} 
            />


            {showLocationDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20">
                <SearchLocationPicker 
                    initialValue={location}
                    onLocationSelect={(selectedLocation) => {
                        console.log('선택된 위치:', selectedLocation);
                        const locationName = selectedLocation.placeName || selectedLocation.address || selectedLocation;
                        setLocation([locationName]);
                    setShowLocationDropdown(false);
                    }}
                />
                </div>
            )}
        </div>
        
       
        {/* Location Dropdown */}
        {/* {showLocationDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            {umnNeighborhoods.map((neighborhood, idx) => (
              <div 
                key={idx}
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-none"
                onClick={() => handleLocationSelect(neighborhood)}
              >
                <div className="flex items-center">
                  <MapPin size={16} className="text-[#7a0019] mr-2" />
                  <span className={neighborhood === location ? "font-semibold text-[#7a0019]" : ""}>{neighborhood}</span>
                </div>
              </div>
            ))}
          </div>
        )} */}
      </div>
      
      {/* Search Input */}
      <div className="flex-1 flex">
        <input 
            type="text" 
            placeholder="Search for furniture, electronics, books..." 
            className="w-full px-6 py-4 bg-white text-gray-800 border-0 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}  // Enter 키로도 검색 가능
        />
        <button onClick={handleSearch}
        className="bg-[#ffb71e] hover:bg-[#ffa700] px-6 md:px-8 transition-colors flex items-center justify-center">
            <Search size={22} className="text-gray-800" />
        </button>
        </div>

    </div>

     {showLocationDropdown && 
        <div className=" text-white p-4">
            <SearchLocationPicker 
                initialValue={location}
                onLocationSelect={(selectedLocation) => {
                console.log('Selected Location:', selectedLocation);
                const locationName = selectedLocation.placeName || selectedLocation.address || selectedLocation;
                setLocation([locationName]);
                setShowLocationDropdown(false);
                }}
            />
        </div>
        }

  </div>
  
  {/* Delivery Options */}
  <div className="w-full max-w-3xl mb-10 bg-white rounded-xl p-5 shadow-md border border-gray-100">
    <h2 className="text-lg font-semibold mb-4 text-gray-800">Delivery Preferences</h2>
    <div className="flex flex-wrap gap-4">
      <div 
        className={`flex items-center gap-3 px-5 py-3 rounded-lg cursor-pointer transition-all ${
          deliveryOption.delivery 
            ? 'bg-[#ffebda] border border-[#ffb71e]' 
            : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => toggleDeliveryOption('delivery')}
      >
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
          deliveryOption.delivery 
            ? 'border-[#7a0019] bg-[#7a0019]' 
            : 'border-gray-400'
        }`}>
          {deliveryOption.delivery && <Check size={14} className="text-white" />}
        </div>
        <div className="flex items-center gap-2">
          <Truck size={20} className={deliveryOption.delivery ? "text-[#7a0019]" : "text-gray-500"} />
          <span>Delivery</span>
        </div>
      </div>
      
      <div 
        className={`flex items-center gap-3 px-5 py-3 rounded-lg cursor-pointer transition-all ${
          deliveryOption.pickup 
            ? 'bg-[#ffebda] border border-[#ffb71e]' 
            : 'bg-gray-50 border border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => toggleDeliveryOption('pickup')}
      >
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
          deliveryOption.pickup 
            ? 'border-[#7a0019] bg-[#7a0019]' 
            : 'border-gray-400'
        }`}>
          {deliveryOption.pickup && <Check size={14} className="text-white" />}
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag size={20} className={deliveryOption.pickup ? "text-[#7a0019]" : "text-gray-500"} />
          <span>Pickup</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-500 w-full mt-2">
        {!deliveryOption.delivery && !deliveryOption.pickup ? (
          "Select at least one option to see all available listings"
        ) : deliveryOption.delivery && deliveryOption.pickup ? (
          "Showing items available for both delivery and pickup"
        ) : deliveryOption.delivery ? (
          "Showing items available for delivery"
        ) : (
          "Showing items available for pickup only"
        )}
      </div>
    </div>
  </div>
  
  {/* Neighborhood Quick Access */}
  <div className="w-full max-w-3xl">
    <h2 className="text-lg font-semibold mb-4 text-gray-800">Popular Areas Near UMN</h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {umnNeighborhoods.map((neighborhood, idx) => (
        <div 
          key={idx}
          className="bg-white hover:bg-[#ffebda] rounded-lg p-3 text-center cursor-pointer transition-all hover:shadow-md border border-gray-200 hover:border-[#ffb71e] transform hover:-translate-y-1"
          onClick={() => handleLocationSelect(neighborhood)}
        >
          <span className="text-sm">{neighborhood}</span>
        </div>
      ))}
    </div>
  </div>
</div>
);
}

export default MoveOutSaleSearchPage;