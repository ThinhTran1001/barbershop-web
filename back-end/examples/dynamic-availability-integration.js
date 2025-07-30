/**
 * Integration examples for Dynamic Barber Availability System
 * Shows how to use the new API endpoints in frontend applications
 */

// Example 1: Real-time availability checking for booking form
const checkRealTimeAvailability = async (barberId, date, fromTime = null) => {
  try {
    const params = new URLSearchParams({
      barberId,
      date,
      durationMinutes: 60, // 1 hour service
      customerId: 'current_user_id'
    });

    if (fromTime) {
      params.append('fromTime', fromTime);
    }

    const response = await fetch(`/api/barber-schedule/real-time-availability?${params}`);
    const data = await response.json();

    if (data.available) {
      console.log('✅ Real-time availability found:', {
        totalSlots: data.availableSlots,
        dynamicSync: data.realTimeSync,
        lastUpdated: data.lastUpdated,
        availableFrom: fromTime || 'start of day'
      });

      return {
        success: true,
        slots: data.slots,
        message: `${data.availableSlots} slots available${data.realTimeSync ? ' (real-time)' : ''}`
      };
    } else {
      return {
        success: false,
        message: 'No availability found'
      };
    }
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      message: 'Failed to check availability'
    };
  }
};

// Example 2: Booking completion with automatic slot release
const completeBooking = async (bookingId) => {
  try {
    const response = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        status: 'completed'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Booking completed successfully:', {
        bookingId: data.booking._id,
        completedAt: data.booking.completedAt,
        message: data.message
      });

      // Automatically refresh availability for this barber
      await refreshBarberAvailability(data.booking.barberId, getTodayDate());

      return {
        success: true,
        booking: data.booking,
        message: 'Booking completed and schedule updated'
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error completing booking:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Example 3: Admin force release slots for early completion
const forceReleaseSlots = async (barberId, date, bookingId, completionTime) => {
  try {
    const response = await fetch('/api/barber-schedule/force-release-slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
      },
      body: JSON.stringify({
        barberId,
        date,
        bookingId,
        completionTime
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Slots released successfully:', {
        releasedSlots: data.result.releasedSlots,
        keptSlots: data.result.keptBookedSlots,
        totalReleased: data.result.totalSlotsReleased,
        completionTime: data.result.completionTime
      });

      return {
        success: true,
        result: data.result,
        message: data.message
      };
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Error releasing slots:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Example 4: Get detailed schedule information with dynamic availability
const getScheduleDetails = async (barberId, date) => {
  try {
    const response = await fetch(`/api/barber-schedule/schedule-details?barberId=${barberId}&date=${date}`);
    const data = await response.json();

    if (data.exists) {
      console.log('📅 Schedule details:', {
        totalSlots: data.schedule.totalSlots,
        availableSlots: data.schedule.availableSlots.length,
        bookedSlots: data.schedule.bookedSlots.length,
        dynamicEnabled: data.dynamicAvailabilityEnabled,
        lastUpdated: data.schedule.lastUpdated
      });

      // Show completed bookings with early completion info
      if (data.completedBookings.length > 0) {
        console.log('✅ Completed bookings today:');
        data.completedBookings.forEach(booking => {
          console.log(`   ${booking.id}: ${booking.originalTime} → ${booking.completedAt} ${booking.earlyCompletion ? '(EARLY)' : ''}`);
        });
      }

      return {
        success: true,
        schedule: data.schedule,
        completedBookings: data.completedBookings,
        dynamicEnabled: data.dynamicAvailabilityEnabled
      };
    } else {
      return {
        success: false,
        message: 'No schedule found'
      };
    }
  } catch (error) {
    console.error('Error getting schedule details:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Example 5: React component for real-time availability display
const RealTimeAvailabilityComponent = () => {
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState('');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  const refreshAvailability = async () => {
    if (!selectedBarber || !selectedDate) return;

    setLoading(true);
    try {
      const result = await checkRealTimeAvailability(selectedBarber, selectedDate);
      setAvailability(result);
    } catch (error) {
      console.error('Failed to refresh availability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAvailability();
  }, [selectedBarber, selectedDate]);

  return (
    <div className="real-time-availability">
      <h3>Real-Time Availability</h3>
      
      <div className="controls">
        <select value={selectedBarber} onChange={(e) => setSelectedBarber(e.target.value)}>
          <option value="">Select Barber</option>
          {/* Barber options */}
        </select>
        
        <input 
          type="date" 
          value={selectedDate} 
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        
        <button onClick={refreshAvailability} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {availability && (
        <div className="availability-results">
          {availability.success ? (
            <div className="success">
              <p>✅ {availability.message}</p>
              <div className="slots">
                {availability.slots.map(slot => (
                  <span key={slot} className="slot">{slot}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="error">
              <p>❌ {availability.message}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Example 6: Automatic refresh when bookings are completed
const setupRealTimeUpdates = (barberId, date) => {
  // Set up WebSocket or polling for real-time updates
  const refreshInterval = setInterval(async () => {
    const scheduleDetails = await getScheduleDetails(barberId, date);
    
    if (scheduleDetails.success) {
      // Check if any bookings were completed recently
      const recentCompletions = scheduleDetails.completedBookings.filter(booking => {
        const completedAt = new Date(booking.completedAt);
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return completedAt > fiveMinutesAgo;
      });

      if (recentCompletions.length > 0) {
        console.log('🔄 Recent completions detected, refreshing availability...');
        await refreshBarberAvailability(barberId, date);
        
        // Notify user about new availability
        showNotification(`New time slots available! ${recentCompletions.length} appointment(s) completed early.`);
      }
    }
  }, 30000); // Check every 30 seconds

  return () => clearInterval(refreshInterval);
};

// Utility functions
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

const refreshBarberAvailability = async (barberId, date) => {
  // Trigger a refresh of availability data in your application state
  console.log(`Refreshing availability for barber ${barberId} on ${date}`);
};

const showNotification = (message) => {
  // Show notification to user (toast, alert, etc.)
  console.log('📢 Notification:', message);
};

// Export for use in other modules
module.exports = {
  checkRealTimeAvailability,
  completeBooking,
  forceReleaseSlots,
  getScheduleDetails,
  RealTimeAvailabilityComponent,
  setupRealTimeUpdates
};

// Usage examples
console.log('Dynamic Availability Integration Examples');
console.log('========================================');

// Example usage
(async () => {
  const barberId = 'barber_123';
  const date = '2024-01-15';

  // Check availability from 12:00 onwards
  const availability = await checkRealTimeAvailability(barberId, date, '12:00');
  console.log('Availability check result:', availability);

  // Get detailed schedule information
  const scheduleDetails = await getScheduleDetails(barberId, date);
  console.log('Schedule details:', scheduleDetails);
})();
