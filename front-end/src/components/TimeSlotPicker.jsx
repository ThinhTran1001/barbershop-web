import React, { useState, useEffect, useCallback } from 'react';
import { fetchAvailableSlots, checkBarberOff, validateTimeSlotAvailability } from '../services/barberScheduleApi';
import ToastService from '../services/toastService.jsx';

const TimeSlotPicker = ({ barberId, serviceId, durationMinutes, onSelect }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [isOff, setIsOff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [validatingSlot, setValidatingSlot] = useState(null);

  // Ensure durationMinutes has a default value
  const serviceDuration = durationMinutes || 30;

  // Get customer ID from token for conflict checking
  const getCustomerId = () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload._id || payload.userId;
      }
    } catch (e) {
      console.warn('Could not extract customer ID from token:', e);
    }
    return null;
  };

  const customerId = getCustomerId();

  // Debug logging
  console.log('TimeSlotPicker props:', { barberId, serviceId, durationMinutes, serviceDuration, customerId });

  // Load available slots when barberId or date changes
  const loadAvailableSlots = useCallback(async () => {
    if (!barberId || !date) return;

    setLoading(true);
    setError('');
    setSlots([]);
    setIsOff(false);

    // Show loading toast for longer operations
    if (serviceDuration > 60) {
      ToastService.showLoadingToast('Loading available slots for extended service...', 'slot-loading');
    }

    try {
      // Check if barber is off
      const offRes = await checkBarberOff(barberId, date);
      if (offRes.isOff) {
        setIsOff(true);
        setSlots([]);

        // Show appropriate message based on reason
        if (offRes.reason === 'absence') {
          ToastService.showInfo(
            'Barber Unavailable',
            'This barber is not available on the selected date due to approved absence.',
            5
          );
        } else {
          ToastService.showInfo(
            'Barber Off Day',
            `This barber is not working on the selected date (${offRes.reason || 'day off'}).`,
            5
          );
        }
        setLoading(false);
        return;
      }

      // Fetch available slots with customer ID for conflict checking
      const slotsData = await fetchAvailableSlots(barberId, date, {
        serviceId,
        durationMinutes: serviceDuration,
        customerId
      });

      if (!slotsData.available) {
        setError(slotsData.reason || 'No slots available');
        setSlots([]);
      } else {
        setSlots(slotsData.slots);
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Failed to fetch available slots');

      // Show network error toast
      ToastService.showNetworkError('loading available time slots');
    } finally {
      setLoading(false);
      // Hide loading toast
      ToastService.hideLoadingToast('slot-loading');
    }
  }, [barberId, date, serviceId, serviceDuration]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const handleSlotSelect = async (slot) => {
    setValidatingSlot(slot);

    try {
      // Validate time slot before selection with customer ID for conflict checking
      const bookingDateTime = new Date(`${date}T${slot}:00.000Z`);
      const validation = await validateTimeSlotAvailability({
        barberId,
        bookingDate: bookingDateTime.toISOString(),
        durationMinutes: serviceDuration,
        customerId
      });

      if (!validation.available) {
        // Show enhanced error notifications based on conflict type
        if (validation.conflictType === 'CUSTOMER_CONFLICT') {
          ToastService.showValidationError({
            conflictType: 'CUSTOMER_CONFLICT',
            reason: validation.reason,
            conflictingBarber: validation.conflictingBooking?.barberName
          });
        } else if (validation.conflictType === 'BARBER_CONFLICT') {
          ToastService.showValidationError({
            conflictType: 'BARBER_CONFLICT',
            reason: validation.reason
          });
        } else {
          ToastService.showValidationError({
            reason: validation.reason || 'Time slot is no longer available'
          });
        }

        // Refresh slots to show current availability
        await loadAvailableSlots();
        setValidatingSlot(null);
        return;
      }

      // Show success notification for valid slot
      ToastService.showValidationSuccess('Time slot is available and ready for booking');

      // If validation was skipped due to auth issues, show a warning but continue
      if (validation.message && validation.message.includes('Validation skipped')) {
        ToastService.showWarning(
          'Validation Warning',
          'Unable to validate time slot in real-time. Please proceed with caution.',
          6
        );
      }

      setSelectedSlot(slot);
      // Tạo object chứa cả ngày và giờ
      const selectedDateTime = {
        date: date,
        time: slot,
        dateTime: `${date} ${slot}`, // Format: "2024-07-15 14:30"
        label: `${new Date(date).toLocaleDateString('vi-VN')} lúc ${slot}`,
        barberId,
        serviceId,
        durationMinutes: serviceDuration
      };

      if (onSelect) onSelect(selectedDateTime);
    } catch (error) {
      console.error('Error validating slot:', error);

      // Show network error for validation failure
      ToastService.showNetworkError('validating time slot');
    } finally {
      setValidatingSlot(null);
    }
  };

  return (
    <div>
      <h3>Select Date & Time</h3>
      {serviceDuration && (
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
          Service duration: {serviceDuration} minutes
          {serviceDuration > 30 && (
            <span style={{ color: '#ff6b35', fontWeight: 'bold' }}>
              {' '}(Will block {Math.ceil(serviceDuration / 30)} time slots)
            </span>
          )}
        </div>
      )}
      <input
        type="date"
        value={date}
        min={new Date().toISOString().split('T')[0]}
        onChange={e => { setDate(e.target.value); setSelectedSlot(''); }}
      />

      {loading && <p>Loading available slots...</p>}
      {isOff && <p style={{ color: 'red' }}>Barber is off on this day.</p>}
      {error && (
        <div style={{ color: 'red' }}>
          <p>{error}</p>
          <button onClick={loadAvailableSlots} style={{ fontSize: '12px' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !isOff && !error && date && (
        <div>
          {slots.length === 0 ? (
            <div>
              <p>No available slots for this day. All time slots are booked.</p>
              <button onClick={loadAvailableSlots} style={{ fontSize: '12px' }}>
                Refresh availability
              </button>
            </div>
          ) : (
            <div>
              <p style={{ color: 'green', fontSize: '14px' }}>
                {slots.length} available time slots for {serviceDuration}-minute service
                <button
                  onClick={loadAvailableSlots}
                  style={{ marginLeft: '10px', fontSize: '12px' }}
                >
                  Refresh
                </button>
              </p>
              {serviceDuration > 30 && (
                <p style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                  Note: Each selected time will reserve {Math.ceil(serviceDuration / 30)} consecutive slots
                </p>
              )}
              <ul>
                {slots.map(slot => {
                  // Calculate end time for display
                  const startTime = new Date(`2000-01-01T${slot}:00`);
                  const endTime = new Date(startTime.getTime() + serviceDuration * 60000);
                  const endTimeStr = endTime.toTimeString().substring(0, 5);

                  return (
                    <li key={slot}>
                      <button
                        disabled={selectedSlot === slot || validatingSlot === slot}
                        onClick={() => handleSlotSelect(slot)}
                        style={{
                          backgroundColor: selectedSlot === slot ? '#1890ff' : 'white',
                          color: selectedSlot === slot ? 'white' : 'black',
                          opacity: validatingSlot === slot ? 0.6 : 1,
                          border: '1px solid #ccc',
                          padding: '8px 12px',
                          margin: '2px',
                          borderRadius: '4px',
                          cursor: validatingSlot === slot ? 'wait' : 'pointer',
                          minWidth: '120px',
                          textAlign: 'left'
                        }}
                      >
                        <div>
                          <strong>{slot}</strong>
                          {serviceDuration > 30 && (
                            <div style={{ fontSize: '10px', opacity: 0.8 }}>
                              to {endTimeStr}
                            </div>
                          )}
                        </div>
                        {selectedSlot === slot && ' ✓ Selected'}
                        {validatingSlot === slot && ' ⏳ Validating...'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;

