"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { 
  Calendar, ChevronLeft, ChevronRight, MapPin, Users, Home, 
  Search, X, Bookmark, Star, Wifi, Droplets, Sparkles, 
  Filter, BedDouble, DollarSign, LogIn, Heart, User, Plus,
  ArrowLeft, ArrowRight,Video, MessageCircle, Flag
} from 'lucide-react';

import { featuredListings } from '../../../data/listings';

const ListingDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [showAllImages, setShowAllImages] = useState(false);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [isMounted, setIsMounted] = useState(false);
  const [showConnectOptions, setShowConnectOptions] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const [scamDetails, setScamDetails] = useState("");
  const [informationDetails, setInformationDetails] = useState("");
  const [matchDetails, setMatchDetails] = useState<string[]>([]);
  const [priceDetails, setPriceDetails] = useState("");
  const [offensiveDetails, setOffensiveDetails] = useState("");
  const [unsafeDetails, setUnsafeDetails] = useState("");
  const [sellerProblem, setSellerProblem] = useState("");
  const [details, setDetails] = useState("");
  
  
  useEffect(() => {
    setIsMounted(true);
    }, []);
    
    useEffect(() => {
        if (isMounted) {
            try {
            const savedFavorites = localStorage.getItem('favoriteListings');
            if (savedFavorites) {
                setFavoriteListings(JSON.parse(savedFavorites));
            }
            } catch (error) {
            console.error('Error loading favorites from localStorage:', error);
            }
        }
    }, [isMounted]);
  
  // when favoriteListings is changed, update the localStorage
  useEffect(() => {
  if (isMounted) {
    try {
      localStorage.setItem('favoriteListings', JSON.stringify(favoriteListings));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }
}, [favoriteListings, isMounted]);
  
  // find listing data
  const listing = featuredListings.find(item => 
    item.id === parseInt(id as string) || item.id.toString() === id
  );
  
  const toggleFavorite = (listing) => {
    const isFavorited = favoriteListings.some(item => item.id === listing.id);
    
    if (isFavorited) {
      setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
    } else {
      // add new
      const favoriteItem = {
        id: listing.id,
        title: listing.title || 'Untitled Listing',
        location: listing.location || 'Unknown Location',
        price: listing.price || 0,
        bedrooms: listing.bedrooms || 1,
        ...(listing.bathrooms !== undefined && { bathrooms: listing.bathrooms }),
        image: listing.image || '/api/placeholder/800/500',
        ...(listing.dateRange && { dateRange: listing.dateRange })
      };
      
      setFavoriteListings([favoriteItem, ...favoriteListings]);
    }
    
    setIsSidebarOpen(true);
  };

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Cannot find any listings</p>
          <button 
            onClick={() => router.push('/search')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            back to search page
          </button>
        </div>
      </div>
    );
  }

  // review
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [hostReviews, setHostReviews] = useState(listing.hostReviews || []);

  // all image array
  const allImages = [listing.image, ...(listing.additionalImages || [])];
  
  // gp to previous image
  const goToPrevImage = () => {
    setActiveImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };
  
  // go to next image
  const goToNextImage = () => {
    setActiveImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

   // check if the image already in the current listings
  const isCurrentListingFavorited = favoriteListings.some(item => item.id === listing.id);
  
  //connect option
    const navigateToTour = () => {
    router.push(`/search/${id}/tour`);
    };

    const navigateToMessage = () => {
    router.push(`/search/${id}/message`);
    };

  // use keyboard to move image
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showAllImages) return;
      
      if (e.key === 'ArrowLeft') {
        goToPrevImage();
      } else if (e.key === 'ArrowRight') {
        goToNextImage();
      } else if (e.key === 'Escape') {
        setShowAllImages(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAllImages]);
  
  // gender information icon
  const getGenderInfo = (preferredGender) => {
    switch(preferredGender) {
      case 'male':
        return { icon: <User className="w-4 h-4 mr-2 text-orange-500" />, text: "Male Only" };
      case 'female':
        return { icon: <User className="w-4 h-4 mr-2 text-pink-500" />, text: "Female Only" };
      case 'any':
      default:
        return { icon: <Users className="w-4 h-4 mr-2 text-green-500" />, text: "Any" };
    }
  };
  
  // amenity icon
  const getAmenityIcon = (amenity) => {
    switch (amenity) {
      case 'wifi': return <Wifi size={16} />;
      case 'parking': return <MapPin size={16} />;
      case 'laundry': return <Droplets size={16} />;
      case 'furnished': return <Home size={16} />;
      case 'utilities': return <DollarSign size={16} />;
      case 'ac': return <Sparkles size={16} />;
      default: return <Star size={16} />;
    }
  };

  const addReview = () => {
  if (!newReviewComment.trim()) {
    alert('Please write a comment for your review.');
    return;
  }
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  const newReview = {
    id: Date.now(), // not the actual ID (need to change)
    name: "You", // not the actual name (need to change)
    date: formattedDate,
    comment: newReviewComment,
    rating: newReviewRating
  };
  
  const updatedReviews = [newReview, ...hostReviews];
  setHostReviews(updatedReviews);

  setShowReviewModal(false);
  setNewReviewComment('');
  setNewReviewRating(5);
};

//Report
const handleSubmitReport = () => {
    if (!reportReason) {
      alert("Please select a reason for reporting.");
      return;
    }

    if (!scamDetails && reportReason == "scam") {
      alert("Please select a scam detail.");
      return;
    }
    else if (!matchDetails && reportReason == "mismatch") {
      alert("Please select a mismatch detail.");
      return;
    }
    else if (!informationDetails && reportReason == "information") {
      alert("Please select missing information.");
      return;
    }
    else if (!sellerProblem && reportReason == "seller") {
      alert("Please select a problem about the seller.");
      return;
    }
    else if (!priceDetails && reportReason == "price") {
      alert("Please select a price issue.");
      return;
    }
    else if (!unsafeDetails && reportReason == "unsafe") {
      alert("Please select a reason why it's unsafe.");
      return;
    }
    else if (!offensiveDetails && reportReason == "offensive") {
      alert("Please select a reason why it's offensive.");
      return;
    }

    // Submit logic here, like sending to Firestore or your backend
    alert("Seller reported. Thank you!");
    setShowReportForm(false);
    setReportReason("");
    setScamDetails("");
    setMatchDetails([]);
    setInformationDetails("");
    setSellerProblem("");
    setPriceDetails("");
    setUnsafeDetails("");
    setOffensiveDetails("");
    setDetails("");
  };

//caculate the avrage rating
const hostReviewCount = hostReviews.length;
const hostRating = hostReviews.length > 0 
  ? (hostReviews.reduce((sum, review) => sum + review.rating, 0) / hostReviews.length).toFixed(1)
  : "0.0";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="fixed md:left-0 md:top-0 md:bottom-0 md:h-full md:w-16 w-full top-0 left-0 h-16 bg-orange-200 text-white shadow-lg z-50 md:flex md:flex-col">
        {/* navigation for mobile */}
        <div className="w-full h-full flex items-center justify-between px-4 md:hidden">
          <span className="font-bold text-lg">CampusSubleases</span>
          <div className="flex items-center space-x-4">
            <button
              title="Add New"
              className="group cursor-pointer outline-none hover:rotate-90 duration-300 p-2 rounded-lg hover:bg-orange-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" className="stroke-slate-100 fill-none group-hover:fill-orange-500 group-active:stroke-slate-200 group-active:fill-orange-900 group-active:duration-0 duration-300">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5"></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-lg transition cursor-pointer hover:bg-orange-300"
            >
              <Heart size={20} />
            </button>
            <button className="p-2 rounded-lg transition cursor-pointer hover:bg-orange-300">
              <User size={20} />
            </button>
          </div>
        </div>
        
        {/* navigation for desktop */}
        <div className="hidden md:flex md:flex-col md:h-full">
          <div className="flex flex-col items-center">
            <div className="font-bold text-xl mt-6 mb-4">CS</div>
            <button title="Add New" className="group cursor-pointer outline-none hover:rotate-90 duration-300 p-3 rounded-lg hover:bg-orange-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" className="stroke-slate-100 fill-none group-hover:fill-orange-500 group-active:stroke-slate-200 group-active:fill-orange-900 group-active:duration-0 duration-300">
                <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" strokeWidth="1.5"></path>
                <path d="M8 12H16" strokeWidth="1.5"></path>
                <path d="M12 16V8" strokeWidth="1.5"></path>
              </svg>
            </button>
          </div>
          <div className="mt-auto flex flex-col items-center space-y-4 mb-8">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-3 rounded-lg hover:bg-orange-300 transition cursor-pointer"
            >
              <Heart size={20} />
            </button>
            <button className="p-3 rounded-lg hover:bg-orange-300 transition cursor-pointer">
              <User size={20} />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Favorites Sidebar */}
      <div className={`fixed md:left-16 left-0 top-0 md:top-0 top-16 h-full md:h-full h-[calc(100%-4rem)] w-72 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} overflow-auto`}>
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-lg text-orange-500">Favorites</h2>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          {/* favorites list */}
          {isMounted && (
            <>
              {favoriteListings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Heart size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No favorite listings yet</p>
                  <p className="text-sm mt-2">Click the heart icon on listings to save them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {favoriteListings.map(listing => (
                    <div 
                      key={listing.id} 
                      className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => {
                        setIsSidebarOpen(false);
                        router.push(`/search/${listing.id}`);
                      }}
                    >
                      <div className="flex">
                        <div 
                          className="w-20 h-20 bg-gray-200 flex-shrink-0" 
                          style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
                        ></div>
                        <div className="p-3 flex-1">
                          <div className="font-medium text-gray-700">{listing.title}</div>
                          <div className="text-sm text-gray-500">{listing.location}</div>
                          <div className="text-sm font-bold text-[#15361F] mt-1">
                            ${listing.price}/mo
                          </div>
                        </div>
                        <button 
                          className="p-2 text-gray-400 hover:text-red-500 self-start"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFavoriteListings(favoriteListings.filter(item => item.id !== listing.id));
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* image gallery */}
      {showAllImages && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            {/* close buttion */}
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setShowAllImages(false)}
                className="p-1 bg-white rounded-full text-black hover:bg-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* showing image */}
            <div className="relative mb-4">
              <div className="h-96 flex items-center justify-center">
                <img 
                  src={allImages[activeImage]} 
                  alt={`Image ${activeImage + 1}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              
              {/* left arrow */}
              <button 
                onClick={goToPrevImage}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
                aria-label="Previous image"
              >
                <ArrowLeft size={24} />
              </button>
              
              {/* right arrow */}
              <button 
                onClick={goToNextImage}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-80 rounded-full text-gray-800 hover:bg-opacity-100 transition"
                aria-label="Next image"
              >
                <ArrowRight size={24} />
              </button>
            </div>
            
            {/* image index */}
            <div className="text-white text-center mb-4">
              {activeImage + 1} / {allImages.length}
            </div>
            
            {/* show main image */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {allImages.map((img, index) => (
                <div 
                  key={index}
                  className={`h-20 rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index ? 'border-orange-500' : 'border-transparent'}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img 
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* keyboard usage info */}
            <div className="text-white text-center mt-4 text-sm opacity-70">
               ← → key can move the image. ESC for exit.
            </div>
          </div>
        </div>
      )}



      {/* detail page */}
      <div className="md:pl-16 pt-16 md:pt-0">
        
        <div className="max-w-4xl mx-auto p-6">
          {/* back button*/}
          <button 
            onClick={() => router.push('/search')}
            className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Previous Page
          </button>

          {/* main contents box */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            {/* image section */}
            <div className="flex flex-col md:flex-row md:gap-4 mb-6">
              {/* main picture */}
              <div className="md:w-2/3 h-72 md:h-96 rounded-lg overflow-hidden mb-4 md:mb-0">
                <img 
                  src={activeImage === 0 ? listing.image : listing.additionalImages[activeImage - 1]}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* additional pictures */}
              <div className="md:w-1/3">
                <div className="grid grid-cols-2 gap-2 h-full">
                  <div 
                    className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === 0 ? 'border-orange-500' : 'border-transparent'}`}
                    onClick={() => setActiveImage(0)}
                  >
                    <img 
                      src={listing.image}
                      alt="Main view"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {listing.additionalImages && listing.additionalImages.slice(0, 2).map((img, index) => (
                    <div 
                      key={index}
                      className={`h-24 md:h-auto rounded-lg overflow-hidden cursor-pointer border-2 ${activeImage === index + 1 ? 'border-orange-500' : 'border-transparent'}`}
                      onClick={() => setActiveImage(index + 1)}
                    >
                      <img 
                        src={img}
                        alt={`Additional view ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  
                  {/* + button - to see all images */}
                  <div 
                    className="h-24 md:h-auto rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition"
                    onClick={() => setShowAllImages(true)}
                  >
                    <Plus className="text-gray-500" />
                  </div>
                </div>
              </div>
            </div>

             {/* title */}
            <h1 className="text-2xl font-bold text-orange-900 mb-6">{listing.title}</h1>
            
            {/* key information */}
            <div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
              <h2 className="text-xl font-bold text-orange-800 mb-2">Key Information</h2>
              <div className="space-y-2">
                <p className="flex items-center text-gray-700"><MapPin className="w-4 h-4 mr-2 text-orange-500" /> {listing.location}</p>
                <p className="flex items-center text-gray-700"><DollarSign className="w-4 h-4 mr-2 text-orange-500" /> ${listing.price}/month</p>
                <p className="flex items-center text-gray-700"><BedDouble className="w-4 h-4 mr-2 text-orange-500" /> {listing.bedrooms}Bed {listing.bathrooms}Bath</p>
                <p className="flex items-center text-gray-700"><Calendar className="w-4 h-4 mr-2 text-orange-500" /> {listing.dateRange}</p>
                <p className="flex items-center text-gray-700"><Star className="w-4 h-4 mr-2 text-orange-500" /> {listing.rating} ({listing.reviews} Reviews)</p>
                
                {/* gender information */}
                {listing.preferredGender && (
                  <p className="flex items-center">
                    {getGenderInfo(listing.preferredGender).icon}
                    <span className={`${listing.preferredGender === 'female' ? 'text-pink-600' : listing.preferredGender === 'male' ? 'text-orange-600' : 'text-green-600'} font-medium`}>
                      {getGenderInfo(listing.preferredGender).text}
                    </span>
                  </p>
                )}
              </div>
            </div>
            
            {/* Host Information */}
              <div className="bg-white p-4 rounded-lg border border-orange-200 mb-6">
                <h2 className="text-xl font-bold text-orange-800 mb-2">Host Information</h2>
                
                <div className="flex justify-between items-start">
                  {/* Profile Image */}
                  <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={listing.hostImage || "https://images.unsplash.com/photo-1543852786-1cf6624b9987?q=80&w=800&h=500&auto=format&fit=crop"} 
                      alt="Host" 
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Right Column: name, badge, bio, report */}
                  <div className="flex-1 ml-4">
                    <div className="flex justify-between items-start w-full">
                      {/* Name + badge */}
                      <div>
                        <h3 className="font-medium text-lg text-gray-700">{listing.hostName || "Anonymous"}</h3>
                        {listing.isVerifiedUMN && (
                          <div className="mt-1 bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center w-fit">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066..." clipRule="evenodd" />
                            </svg>
                            UMN Verified
                          </div>
                        )}
                      </div>

                      {/* Report Button (aligned top-right) */}
                      <button
                        title="Report seller"
                        onClick={() => setShowReportForm((prev) => !prev)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1 text-sm"
                      >
                        <Flag size={16} />
                        <span>Report</span>
                      </button>
                    </div>

                    {/* One-sentence description */}
                    <p className="text-gray-700 mt-2">{listing.hostBio || " "}</p>
                  </div>
                </div>

                {/* Report form */}
                {showReportForm && (
                  <div className="mt-2 p-4 bg-white border border-gray-300 rounded-lg shadow-md w-200 absolute z-10">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for report
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
                    >
                      <option value="">-- Select a reason --</option>
                      <option value="information">Some proudct information is missing, inaccurate or could be improved</option>
                      <option value="mismatch">Parts of this page don't match</option>
                      <option value="price">I have an issue with the price</option>
                      <option value="offensive">This product or content is offensive</option>
                      <option value="unsafe">This product or content is illegal, unsafe or suspicious</option>
                      <option value="seller">I have an issue with a Seller</option>
                      <option value="scam">I think this is a scam</option>
                      <option value="other">Other</option>
                    </select>

                    {reportReason === "scam" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Scam Details
                        </label>
                        <select
                          value={scamDetails}
                          onChange={(e) => setScamDetails(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">-- Select scam type --</option>
                          <option value="suspicious-payment">Asked for a suspicious way of payment</option>
                          <option value="fake-listing">Fake product listing</option>
                          <option value="other-scam">Other scam-related issue</option>
                        </select>
                      </div>
                    )}

                    {reportReason === "information" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Missing information
                        </label>
                        <select
                          value={informationDetails}
                          onChange={(e) => setInformationDetails(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">-- Select missing information --</option>
                          <option value="image">Images</option>
                          <option value="size">Size</option>
                          <option value="release-info">Release Information</option>
                          <option value="model">Model</option>
                          <option value="brand">Brand</option>
                          <option value="condition">Condition</option>
                          <option value="other-info">Other missing information</option>
                        </select>
                      </div>
                    )}

                    {reportReason === "mismatch" && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mismatch Details (Select all that apply)
                        </label>
                        <div className="space-y-2">
                          {mismatchOptions.map((option) => (
                            <label
                              key={option.value}
                              className="flex items-center space-x-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={matchDetails.includes(option.value)}
                                onChange={(e) => {
                                  const newValues = e.target.checked
                                    ? [...matchDetails, option.value]
                                    : matchDetails.filter((val) => val !== option.value);
                                  setMatchDetails(newValues);
                                }}
                                className="h-4 w-4 text-orange-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {reportReason === "price" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Price Issues
                        </label>
                        <select
                          value={priceDetails}
                          onChange={(e) => setPriceDetails(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">-- Select price issues --</option>
                          <option value="price-disparity">Price disparity between single and multi-pack</option>
                          <option value="discount">Discount error</option>
                          <option value="price-condition">Prices for conditions higher than new</option>
                          <option value="other-price">Other price issue</option>
                        </select>
                      </div>
                    )}

                    {reportReason === "offensive" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason why it's offensive
                        </label>
                        <select
                          value={offensiveDetails}
                          onChange={(e) => setOffensiveDetails(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">-- Select reason why it's offensive --</option>
                          <option value="sexual">Sexually explicit content</option>
                          <option value="choice">Too offensive word choices</option>
                          <option value="other-scam">Other reasons why it's offensive</option>
                        </select>
                      </div>
                    )}

                    {reportReason === "unsafe" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason why it's unsafe
                        </label>
                        <select
                          value={unsafeDetails}
                          onChange={(e) => setUnsafeDetails(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">-- Select reason it's unsafe --</option>
                          <option value="counterfeit">It's counterfeit</option>
                          <option value="intellectual">Uses my intellectual property without permission</option>
                          <option value="safety-regulation">Not safe or compliant with product safety regulations</option>
                          <option value="reviews">Reviews and Answers contain illegal content</option>
                          <option value="other-scam">Other  reasons it's unsafe</option>
                        </select>
                      </div>
                    )}

                    {reportReason === "seller" && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Problem about the seller
                        </label>
                        <select
                          value={sellerProblem}
                          onChange={(e) => setSellerProblem(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        >
                          <option value="">-- Select seller problem --</option>
                          <option value="identity">Using false or misleading identity information</option>
                          <option value="contact">Using false or misleading contact information</option>
                          <option value="reviews">Attempting to manipulate reviews</option>
                          <option value="inappropriate">Engaging in other inappropriate activity</option>
                          <option value="stolen">Selling a potentially stolen product</option>
                          <option value="other-scam">Other scam-related issue</option>
                        </select>
                      </div>
                    )}

                    

                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      placeholder="Additional details (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded mb-3 resize-none"
                      rows={3}
                    />

                    <div className="flex justify-between">
                      <button
                        onClick={handleSubmitReport}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => setShowReportForm(false)}
                        className="text-gray-500 text-sm hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
            </div>

            {/* add favorites and connect */}
            <div className="space-y-4">
                {/* Connect Options - showConnectOptions가 true일 때만 보임 */}
                {showConnectOptions && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                    <button 
                        onClick={navigateToTour}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-4 rounded-lg flex flex-col items-center justify-center transition"
                    >
                        <Video className="w-8 h-8 mb-2" />
                        <span className="font-medium">Schedule Tour</span>
                        <span className="text-xs text-gray-600 mt-1">Virtual or in-person</span>
                    </button>
                    
                    <button 
                        onClick={navigateToMessage}
                        className="bg-orange-100 hover:bg-orange-200 text-orange-800 p-4 rounded-lg flex flex-col items-center justify-center transition"
                    >
                        <MessageCircle className="w-8 h-8 mb-2" />
                        <span className="font-medium">Send Message</span>
                        <span className="text-xs text-gray-600 mt-1">Chat with the host</span>
                    </button>
                    </div>
                )}

                <div className="flex space-x-4">
                    <button 
                    onClick={() => toggleFavorite(listing)}
                    className={`flex-1 ${isCurrentListingFavorited ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} px-6 py-3 rounded-lg ${isCurrentListingFavorited ? 'hover:bg-red-600' : 'hover:bg-red-200'} transition flex items-center justify-center cursor-pointer`}
                    >
                    <Heart className={`mr-2 ${isCurrentListingFavorited ? 'fill-current' : ''}`} />
                    {isCurrentListingFavorited ? 'Remove from Favorites' : 'Add Favorites'}
                    </button>
                    
                    <button 
                    onClick={() => setShowConnectOptions(!showConnectOptions)} 
                    className={`flex-1 ${showConnectOptions ? 'bg-orange-600' : 'bg-orange-500'} text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition border flex items-center justify-center cursor-pointer`}
                    >
                    {showConnectOptions ? 'Hide Options' : 'Connect'}
                    </button>
                </div>
                </div>
                </div>

          {/* additional information */}
          <div className="space-y-4">
            {/* location */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Location</h2>
              <p className="text-gray-700">Located in {listing.location}, this accommodation is {listing.distance} miles from campus.</p>
            </div>
            
            {/* available date */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Available</h2>
              <p className="text-gray-700">{listing.dateRange}</p>
            </div>
            
            {/* price */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Price</h2>
              <p className="text-gray-700">${listing.price} per month</p>
            </div>
            
            {/* detail description */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Details</h2>
              <p className="text-gray-700">{listing.description || '상세 설명이 없습니다.'}</p>
            </div>
            
            {/* Amenities */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2 text-orange-800">Amenities</h2>
              <div className="grid grid-cols-2 gap-2">
                {listing.amenities && listing.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center p-2 bg-gray-50 rounded">
                    <div className="w-6 h-6 flex items-center justify-center text-orange-500 mr-2">
                      {getAmenityIcon(amenity)}
                    </div>
                    <span className="text-gray-700 capitalize">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Need:
            1. save the review in the server
            2. only the logged in user can write the review
            3. one user can write a review(can edit it)
            4. maintain the reveiw data when move the page */}
            {/* Host Ratings */}
            <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2 text-orange-800">Host Ratings</h2>
            
            {/* average ratings*/}
            <div className="flex items-center mb-4">
                <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                    key={star} 
                    className={`w-5 h-5 ${star <= Math.round(hostRating) ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} 
                    />
                ))}
                <span className="ml-2 text-gray-700 font-medium">
                    {hostRating}/5
                </span>
                <span className="ml-2 text-gray-600 text-sm">
                    ({hostReviewCount} reviews)
                </span>
                </div>
            </div>
            
            {/* review listings*/}
            <div className="mt-4 space-y-4">
                {/* when no review*/}
                {hostReviews.length === 0 && (
                <p className="text-gray-500 italic">No reviews yet. Be the first to leave a review!</p>
                )}
                
                {/* review listings */}
                {hostReviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="font-medium">{review.name}</div>
                        <div className="text-sm text-gray-500">{review.date}</div>
                    </div>
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star} 
                            className={`w-3 h-3 ${star <= review.rating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`} 
                        />
                        ))}
                    </div>
                    </div>
                    <p className="text-gray-700">{review.comment}</p>
                </div>
                ))}
            </div>
            
            {/* write a review button */}
            <button 
                onClick={() => setShowReviewModal(true)}
                className="mt-6 w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center justify-center cursor-pointer"
            >
                <Star className="w-4 h-4 mr-2" />
                Write a Review
            </button>
            </div>

            {/* write review modal*/}
            {showReviewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-orange-800">Write a Review</h3>
                    <button 
                    onClick={() => setShowReviewModal(false)}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-600 cursor-pointer"
                    >
                    <X size={20} />
                    </button>
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                    Your Rating
                    </label>
                    <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        className="p-1 focus:outline-none"
                        >
                        <Star 
                            className={`w-8 h-8 ${star <= newReviewRating ? 'text-orange-400 fill-orange-400' : 'text-gray-300'} cursor-pointer`} 
                        />
                        </button>
                    ))}
                    </div>
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 font-medium mb-2">
                    Your Review
                    </label>
                    <textarea
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[150px] text-gray-700"
                    placeholder="Share your experience with this host..."
                    required
                    ></textarea>
                </div>
                
                <div className="flex space-x-3">
                    <button 
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-500 cursor-pointer"
                    >
                    Cancel
                    </button>
                    <button 
                    onClick={addReview}
                    className="flex-1 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition cursor-pointer"
                    >
                    Submit Review
                    </button>
                </div>
                </div>
            </div>
            )}


          </div>
        </div>

        {/* Footer */}
        <footer className="bg-orange-200 text-white py-12 w-full mt-16 md:pl-4">
        <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
                <h3 className="font-bold text-lg mb-4">CampusSublease</h3>
                <p className="text-gray-400 text-sm">Find the perfect short-term housing solution near your campus.</p>
            </div>
            
            <div>
                <h4 className="font-bold mb-4">Quick Links</h4>
                <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Search</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">List Your Space</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">FAQ</a></li>
                </ul>
            </div>
            
            <div>
                <h4 className="font-bold mb-4">Resources</h4>
                <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Sublease Guide</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Neighborhoods</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Campus Map</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Blog</a></li>
                </ul>
            </div>
            
            <div>
                <h4 className="font-bold mb-4">Contact</h4>
                <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Email Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                </ul>
            </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-700 text-gray-400 text-sm text-center">
            <p>&copy; 2025 CampusSubleases. All rights reserved.</p>
            </div>
        </div>
        </footer>
      </div>
    </div>
  );
};

export default ListingDetailPage;