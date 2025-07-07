import React, { useState } from 'react';
import BookingInfoForm from '../../components/BookingInfoForm.jsx';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const BookingPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  // Get real booking data from navigation state (passed from previous steps)
  const bookingData = location.state || {};

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');
    try {
      await axios.post('http://localhost:3000/api/bookings', {
        ...bookingData,
        ...formData
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
    setLoading(false);
  };

  if (submitted) return <div>Booking successful! Check your email/SMS for confirmation.</div>;

  return (
    <div>
      <h1>Enter Your Booking Info</h1>
      <BookingInfoForm onSubmit={handleSubmit} />
      {loading && <p>Submitting...</p>}
      {error && <p style={{color:'red'}}>{error}</p>}
    </div>
  );
};

export default BookingPage;
