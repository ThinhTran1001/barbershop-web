import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/services';

export const fetchAllServices = async () => {
  const res = await axios.get(API_BASE);
  return res.data;
};

export const fetchServiceSuggestions = async ({ hairType, userId }) => {
  const params = {};
  if (hairType) params.hairType = hairType;
  if (userId) params.userId = userId;
  const res = await axios.get(`${API_BASE}/suggestions`, { params });
  return res.data;
};

export const createBooking = async (bookingData) => {
  const res = await axios.post('http://localhost:3000/api/bookings', bookingData, { withCredentials: true });
  return res.data;
};

export const getMyBookings = async () => {
  const res = await axios.get('http://localhost:3000/api/bookings/me', { withCredentials: true });
  return res.data;
};
