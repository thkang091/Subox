"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ChevronLeft, Send } from 'lucide-react';
import { featuredListings } from '../../../../data/listings';

export default function MessagePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [message, setMessage] = useState('');
  
  // message template
  const messageTemplates = [
    "Hello! I'm interested in your listing. Is it still available?",
    "Can you tell me more about the neighborhood?",
    "Are utilities included in the price?",
    "What's the closest bus stop to the property?"
  ];
  
  const listing = featuredListings.find(item => 
    item.id === parseInt(id) || item.id.toString() === id
  );
  
  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Listing not found</p>
          <button 
            onClick={() => router.push('/search')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    );
  }
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    alert(`Message sent: "${message}"`);
    router.push(`/search/${id}`);
  };
  
  const selectTemplate = (template) => {
    setMessage(template);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-5 md:pt-8 md:pl-16">
      <div className="max-w-2xl mx-auto p-6">
        <button 
          onClick={() => router.push(`/search/${id}`)}
          className="flex items-center text-orange-600 hover:text-orange-800 mb-6 font-medium cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Listing
        </button>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-orange-800 mb-6">Contact Host</h1>
          
          <div className="mb-6 flex items-start">
            <div 
              className="w-20 h-20 rounded-lg overflow-hidden mr-4"
              style={{backgroundImage: `url(${listing.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}
            ></div>
            <div>
              <h2 className="font-semibold text-lg text-gray-700">{listing.title}</h2>
              <p className="text-gray-600">{listing.location}</p>
              <p className="text-orange-800 font-bold mt-1">${listing.price}/month</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">Message Recommendation</h3>
            <div className="grid grid-cols-1 gap-2">
              {messageTemplates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => selectTemplate(template)}
                  className="text-left p-3 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition text-gray-700 cursor-pointer"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>
          
          <form onSubmit={handleSendMessage}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                Your Message to {listing.hostName || "Host"}
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[150px] text-gray-700"
                placeholder="Type your message here..."
                required
              ></textarea>
            </div>
            
            <button 
              type="submit"
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}