import React, { useEffect, useState } from 'react';
import { fetchAvailableSlots, checkBarberOff } from '../services/barberScheduleApi';

const TimeSlotPicker = ({ barberId, onSelect }) => {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [isOff, setIsOff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');

  useEffect(() => {
    if (!barberId || !date) return;
    setLoading(true);
    setError('');
    setSlots([]);
    setIsOff(false);
    checkBarberOff(barberId, date)
      .then(res => {
        if (res.isOff) {
          setIsOff(true);
          setLoading(false);
        } else {
          fetchAvailableSlots(barberId, date)
            .then(data => {
              if (!data.available) {
                setError(data.reason || 'No slots available');
                setSlots([]);
              } else {
                setSlots(data.slots);
              }
              setLoading(false);
            })
            .catch(() => {
              setError('Failed to fetch slots');
              setLoading(false);
            });
        }
      })
      .catch(() => {
        setError('Failed to check barber schedule');
        setLoading(false);
      });
  }, [barberId, date]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    if (onSelect) onSelect(slot);
  };

  return (
    <div>
      <h3>Select Date & Time</h3>
      <input
        type="date"
        value={date}
        min={new Date().toISOString().split('T')[0]}
        onChange={e => { setDate(e.target.value); setSelectedSlot(''); }}
      />
      {loading && <p>Loading slots...</p>}
      {isOff && <p style={{ color: 'red' }}>Barber is off on this day.</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !isOff && !error && date && (
        <div>
          {slots.length === 0 ? (
            <p>No available slots for this day.</p>
          ) : (
            <ul>
              {slots.map(slot => (
                <li key={slot}>
                  <button
                    disabled={selectedSlot === slot}
                    onClick={() => handleSlotSelect(slot)}
                  >
                    {slot} {selectedSlot === slot && '(Selected)'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;

