import React, { useState, useEffect } from 'react';
import { 
  Clock, Plus, Trash2, Save, ChevronDown, ChevronUp, 
  Calendar, Info, CheckCircle, X 
} from 'lucide-react';
import { 
  doc, setDoc, getDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const HostAvailabilitySetup = ({ listingId, hostId, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [appointmentDuration, setAppointmentDuration] = useState(60); // minutes
  const [availability, setAvailability] = useState({
    0: { available: false, times: [] }, // Sunday
    1: { available: true, times: [{ start: '09:00', end: '17:00' }] }, // Monday
    2: { available: true, times: [{ start: '09:00', end: '17:00' }] }, // Tuesday
    3: { available: true, times: [{ start: '09:00', end: '17:00' }] }, // Wednesday
    4: { available: true, times: [{ start: '09:00', end: '17:00' }] }, // Thursday
    5: { available: true, times: [{ start: '09:00', end: '17:00' }] }, // Friday
    6: { available: false, times: [] }, // Saturday
  });
  const [bufferTime, setBufferTime] = useState(15); // minutes between appointments
  const [advanceBooking, setAdvanceBooking] = useState(24); // hours in advance
  const [maxBookings, setMaxBookings] = useState(3); // max bookings per day
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const durationOptions = [30, 45, 60, 90, 120];
  // Load existing availability if it exists
  useEffect(() => {
    const loadExistingAvailability = async () => {
      try {
        const availabilityDoc = await getDoc(doc(db, 'hostAvailability', `${listingId}_${hostId}`));
        if (availabilityDoc.exists()) {
          const data = availabilityDoc.data();
          setAvailability(data.availability || availability);
          setAppointmentDuration(data.appointmentDuration || 60);
          setBufferTime(data.bufferTime || 15);
          setAdvanceBooking(data.advanceBooking || 24);
          setMaxBookings(data.maxBookings || 3);
        }
      } catch (error) {
        console.error('Error loading availability:', error);
      }
    };

    if (listingId && hostId) {
      loadExistingAvailability();
    }
  }, [listingId, hostId]);

  const toggleDayAvailability = (dayIndex) => {
    setAvailability(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        available: !prev[dayIndex].available,
        times: !prev[dayIndex].available ? [{ start: '09:00', end: '17:00' }] : []
      }
    }));
  };

  const addTimeSlot = (dayIndex) => {
    setAvailability(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        times: [...prev[dayIndex].times, { start: '09:00', end: '17:00' }]
      }
    }));
  };

  const removeTimeSlot = (dayIndex, timeIndex) => {
    setAvailability(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        times: prev[dayIndex].times.filter((_, index) => index !== timeIndex)
      }
    }));
  };

  const updateTimeSlot = (dayIndex, timeIndex, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        times: prev[dayIndex].times.map((time, index) => 
          index === timeIndex ? { ...time, [field]: value } : time
        )
      }
    }));
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const validateAvailability = () => {
    const hasAvailableDays = Object.values(availability).some(day => day.available && day.times.length > 0);
    if (!hasAvailableDays) {
      setError('Please set at least one day as available with time slots.');
      return false;
    }

    // Validate time slots don't overlap
    for (const [dayIndex, dayData] of Object.entries(availability)) {
      if (dayData.available && dayData.times.length > 1) {
        const sortedTimes = [...dayData.times].sort((a, b) => a.start.localeCompare(b.start));
        for (let i = 0; i < sortedTimes.length - 1; i++) {
          if (sortedTimes[i].end > sortedTimes[i + 1].start) {
            setError(`Time slots overlap on ${daysOfWeek[dayIndex]}. Please fix the overlapping times.`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const saveAvailability = async () => {
    if (!validateAvailability()) return;

    setIsLoading(true);
    setError('');

    try {
      const availabilityData = {
        listingId,
        hostId,
        availability,
        appointmentDuration,
        bufferTime,
        advanceBooking,
        maxBookings,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'hostAvailability', `${listingId}_${hostId}`), availabilityData);
      
      setSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 2000);

    } catch (error) {
      console.error('Error saving availability:', error);
      setError('Failed to save availability. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Availability Set!</h2>
          <p className="text-gray-600 mb-4">
            Your tour availability has been configured. Guests can now book tours during your available times.
          </p>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              You can update your availability anytime by visiting this page again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Set Your Tour Availability</h1>
        <p className="text-gray-600">
          Configure when guests can book tours for your property. This will create a calendar that guests can use to schedule appointments.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Step 1: Basic Settings */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Appointment Settings
        </h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tour Duration
            </label>
            <select
              value={appointmentDuration}
              onChange={(e) => setAppointmentDuration(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {durationOptions.map(duration => (
                <option key={duration} value={duration}>
                  {duration} minutes
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Time Between Tours
            </label>
            <select
              value={bufferTime}
              onChange={(e) => setBufferTime(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={0}>No buffer</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Advance Booking
            </label>
            <select
              value={advanceBooking}
              onChange={(e) => setAdvanceBooking(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value={1}>1 hour</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Tours Per Day
            </label>
            <select
              value={maxBookings}
              onChange={(e) => setMaxBookings(Number(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {[1, 2, 3, 4, 5, 6, 8, 10].map(num => (
                <option key={num} value={num}>
                  {num} tour{num > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Weekly Availability */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Weekly Availability
        </h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800">
                Set your general availability for each day of the week. You can add multiple time blocks per day.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => toggleDayAvailability(index)}
                    className={`w-6 h-6 rounded border-2 mr-3 flex items-center justify-center ${
                      availability[index].available 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'border-gray-300'
                    }`}
                  >
                    {availability[index].available && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </button>
                  <h3 className={`font-medium ${
                    availability[index].available ? 'text-gray-800' : 'text-gray-400'
                  }`}>
                    {day}
                  </h3>
                </div>
                
                {availability[index].available && (
                  <button
                    type="button"
                    onClick={() => addTimeSlot(index)}
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Time
                  </button>
                )}
              </div>

              {availability[index].available && (
                <div className="space-y-3">
                  {availability[index].times.map((timeSlot, timeIndex) => (
                    <div key={timeIndex} className="flex items-center gap-3">
                      <select
                        value={timeSlot.start}
                        onChange={(e) => updateTimeSlot(index, timeIndex, 'start', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {timeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      
                      <span className="text-gray-500">to</span>
                      
                      <select
                        value={timeSlot.end}
                        onChange={(e) => updateTimeSlot(index, timeIndex, 'end', e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {timeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>

                      {availability[index].times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(index, timeIndex)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!availability[index].available && (
                <p className="text-sm text-gray-500 italic">Unavailable</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveAvailability}
          disabled={isLoading}
          className={`px-8 py-3 rounded-lg font-semibold transition-all ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-orange-500 text-white hover:bg-orange-600 hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            <div className="flex items-center">
              <Save className="w-5 h-5 mr-2" />
              Save Availability
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default HostAvailabilitySetup;