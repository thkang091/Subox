"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { ChevronLeft, Calendar, Clock, Video, Users, ChevronRight } from 'lucide-react';
import { featuredListings } from '../../../../data/listings';

export default function TourPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [tourType, setTourType] = useState('virtual');
  
  // save the avialable date and time (host)
  const [hostAvailability, setHostAvailability] = useState({});
  
  const listing = featuredListings.find(item => 
    item.id === parseInt(id) || item.id.toString() === id
  );
  
  // bring the available time 
  useEffect(() => {
    // example data
    const availability = {};
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      
      // set only week (without weekend)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        const dateStr = date.toISOString().split('T')[0];
        
        // random time(to test)
        const availableTimes = [];
        const possibleTimes = ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM', '6:00 PM'];
        
        // randon time (to test)
        const numTimes = Math.floor(Math.random() * 3);
        const shuffled = [...possibleTimes].sort(() => 0.5 - Math.random());
        availableTimes.push(...shuffled.slice(0, numTimes).sort());
        
        availability[dateStr] = availableTimes;
      }
    }
    
    setHostAvailability(availability);
  }, []);
  
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
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    
    // tour request
    const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    alert(`Tour request sent! Date: ${formattedDate}, Time: ${selectedTime}, Type: ${tourType}`);
    router.push(`/search/${id}`);
  };
  
  // calendar
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };
  
  // move to previous month
  const prevMonth = () => {
    const prev = new Date(currentMonth);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonth(prev);
  };
  
  // move to next month
  const nextMonth = () => {
    const next = new Date(currentMonth);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonth(next);
  };
  
  // bring the available time of the selected date
  const getAvailableTimesForDate = (date) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return hostAvailability[dateStr] || [];
  };
  
  
  const handleDateClick = (day, month, year) => {
    const newDate = new Date(year, month, day);
    const dateStr = newDate.toISOString().split('T')[0];
    
    // check the available
    if (hostAvailability[dateStr] && hostAvailability[dateStr].length > 0) {
      setSelectedDate(newDate);
      setSelectedTime(''); 
    }
  };
  
  // calendar
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${prevMonthDays - i}`} className="p-2 text-center text-gray-300">
          {prevMonthDays - i}
        </div>
      );
    }

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const isAvailable = hostAvailability[dateStr] && hostAvailability[dateStr].length > 0;
      const isSelected = selectedDate && selectedDate.getDate() === day && 
                         selectedDate.getMonth() === month && 
                         selectedDate.getFullYear() === year;
      const isPast = date < new Date(today.setHours(0, 0, 0, 0));
      
      days.push(
        <div 
          key={`current-${day}`} 
          className={`p-2 text-center cursor-pointer rounded-full mx-auto w-10 h-10 flex items-center justify-center
                     ${isSelected ? 'bg-orange-500 text-white' : ''}
                     ${isAvailable && !isPast ? 'hover:bg-orange-100' : ''}
                     ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                     ${!isAvailable && !isPast ? 'text-gray-400 cursor-not-allowed' : ''}
                    `}
          onClick={() => !isPast && isAvailable && handleDateClick(day, month, year)}
        >
          {day}
        </div>
      );
    }
    
    const totalCells = Math.ceil((daysInMonth + firstDayOfMonth) / 7) * 7;
    for (let i = 1; i <= totalCells - (daysInMonth + firstDayOfMonth); i++) {
      days.push(
        <div key={`next-${i}`} className="p-2 text-center text-gray-300">
          {i}
        </div>
      );
    }
    
    return days;
  };
  
  const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : [];
  
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
          <h1 className="text-2xl font-bold text-orange-800 mb-6">Schedule a Tour</h1>
          
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
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">Tour Type</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`border rounded-lg p-4 flex items-center cursor-pointer ${tourType === 'virtual' ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setTourType('virtual')}
                >
                  <Video className={`w-5 h-5 mr-3 ${tourType === 'virtual' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-medium ${tourType === 'virtual' ? 'text-orange-800' : 'text-gray-700'}`}>Virtual Tour</div>
                    <div className="text-xs text-gray-500">Via video call</div>
                  </div>
                </div>
                
                <div 
                  className={`border rounded-lg p-4 flex items-center cursor-pointer ${tourType === 'in-person' ? 'border-orange-500 bg-orange-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setTourType('in-person')}
                >
                  <Users className={`w-5 h-5 mr-3 ${tourType === 'in-person' ? 'text-orange-500' : 'text-gray-400'}`} />
                  <div>
                    <div className={`font-medium ${tourType === 'in-person' ? 'text-orange-800' : 'text-gray-700'}`}>In-Person</div>
                    <div className="text-xs text-gray-500">Meet at the property</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-medium mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Select Date
              </label>
              
              <div className="border rounded-lg">
                {/* calendar header*/}
                <div className="flex justify-between items-center p-4 border-b text-gray-800">
                  <button 
                    type="button"
                    onClick={prevMonth}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <h3 className="font-medium">
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  
                  <button 
                    type="button"
                    onClick={nextMonth}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 p-2 border-b">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* calendar date */}
                <div className="grid grid-cols-7 gap-1 p-2 text-gray-800">
                  {renderCalendar()}
                </div>
                
                {/* show selected date */}
                {selectedDate && (
                  <div className="p-4 border-t bg-gray-50">
                    <p className="text-sm text-gray-600">
                      Selected: <span className="font-medium text-orange-800">
                        {selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              
              {/* if there is no available tiem, show the message */}
              {selectedDate && availableTimes.length === 0 && (
                <p className="mt-2 text-sm text-red-500">No available times for this date. Please select another date.</p>
              )}
            </div>
            
            {/* select time */}
            {selectedDate && availableTimes.length > 0 && (
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Select Time
                </label>
                <div className="grid grid-cols-3 gap-2 text-gray-400">
                  {availableTimes.map((time, index) => (
                    <div 
                      key={index}
                      className={`p-3 border rounded-lg text-center cursor-pointer ${selectedTime === time ? 'border-orange-500 bg-orange-50 text-orange-800' : 'hover:bg-gray-50'}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={!selectedDate || !selectedTime}
              className={`w-full py-3 rounded-lg font-medium transition cursor-pointer ${
                (!selectedDate || !selectedTime) 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              Request Tour
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}