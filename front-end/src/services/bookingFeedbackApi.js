import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/booking-feedback';

// Create feedback for a booking
export const createBookingFeedback = async (feedbackData) => {
  const res = await axios.post(API_BASE, feedbackData, { withCredentials: true });
  return res.data;
};

// Get feedback for a specific booking
export const getBookingFeedback = async (bookingId) => {
  const res = await axios.get(`${API_BASE}/booking/${bookingId}`, { withCredentials: true });
  return res.data;
};

// Get all feedback for a barber
export const getBarberFeedback = async (barberId, filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await axios.get(`${API_BASE}/barber/${barberId}?${params.toString()}`);
  return res.data;
};

// Get all feedback for a service
export const getServiceFeedback = async (serviceId, filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await axios.get(`${API_BASE}/service/${serviceId}?${params.toString()}`);
  return res.data;
};

// Update feedback (within 7 days)
export const updateBookingFeedback = async (feedbackId, updateData) => {
  const res = await axios.put(`${API_BASE}/${feedbackId}`, updateData, { withCredentials: true });
  return res.data;
};

// Mark feedback as helpful/unhelpful
export const markFeedbackHelpful = async (feedbackId, isHelpful) => {
  const res = await axios.post(
    `${API_BASE}/${feedbackId}/helpful`, 
    { isHelpful }, 
    { withCredentials: true }
  );
  return res.data;
};

// Add business response to feedback
export const addBusinessResponse = async (feedbackId, message) => {
  const res = await axios.post(
    `${API_BASE}/${feedbackId}/response`, 
    { message }, 
    { withCredentials: true }
  );
  return res.data;
};

// Get customer's feedback history
export const getCustomerFeedback = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await axios.get(`${API_BASE}/my-feedback?${params.toString()}`, { withCredentials: true });
  return res.data;
};

// Check if booking can be reviewed
export const canReviewBooking = async (bookingId) => {
  try {
    await getBookingFeedback(bookingId);
    return { canReview: false, reason: 'Feedback already exists' };
  } catch (error) {
    if (error.response?.status === 404) {
      return { canReview: true };
    }
    throw error;
  }
};
