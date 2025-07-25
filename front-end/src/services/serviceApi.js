import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/services';

// Enhanced service fetching with filtering
export const fetchAllServices = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
  });

  const res = await axios.get(`${API_BASE}?${params.toString()}`);
  return res.data;
};

// Get service categories
export const fetchServiceCategories = async () => {
  const res = await axios.get(`${API_BASE}/categories`);
  return res.data;
};

// Get hair types
export const fetchHairTypes = async () => {
  const res = await axios.get(`${API_BASE}/hair-types`);
  return res.data;
};

// Get style compatibility options
export const fetchStyleCompatibility = async () => {
  const res = await axios.get(`${API_BASE}/style-compatibility`);
  return res.data;
};

// Search services
export const searchServices = async (query, limit = 10) => {
  const res = await axios.get(`${API_BASE}/search`, {
    params: { q: query, limit }
  });
  return res.data;
};

// Enhanced service suggestions
export const fetchServiceSuggestions = async ({ hairType, stylePreference, userId, limit = 10 }) => {
  const params = {};
  if (hairType) params.hairType = hairType;
  if (stylePreference) params.stylePreference = stylePreference;
  if (userId) params.userId = userId;
  if (limit) params.limit = limit;

  const res = await axios.get(`${API_BASE}/suggestions`, { params });
  return res.data;
};

// Booking related functions
export const createBooking = async (bookingData) => {
  const res = await axios.post('http://localhost:3000/api/bookings', bookingData, { withCredentials: true });
  return res.data;
};

export const getMyBookings = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await axios.get(`http://localhost:3000/api/bookings/me?${params.toString()}`, { withCredentials: true });
  return res.data;
};

// Update booking status
export const updateBookingStatus = async (bookingId, status, reason) => {
  const res = await axios.put(
    `http://localhost:3000/api/bookings/${bookingId}/status`,
    { status, reason },
    { withCredentials: true }
  );
  return res.data;
};

// Update booking details (edit booking)
export const updateBooking = async (bookingId, updateData) => {
  const res = await axios.put(
    `http://localhost:3000/api/bookings/${bookingId}`,
    updateData,
    { withCredentials: true }
  );
  return res.data;
};

// Cancel booking
export const cancelBooking = async (bookingId, reason) => {
  const res = await axios.put(
    `http://localhost:3000/api/bookings/${bookingId}/cancel`,
    { reason },
    { withCredentials: true }
  );
  return res.data;
};

// Check availability
export const checkAvailability = async (barberId, bookingDate, durationMinutes) => {
  const res = await axios.post(
    'http://localhost:3000/api/bookings/check-availability',
    { barberId, bookingDate, durationMinutes },
    { withCredentials: true }
  );
  return res.data;
};

// Get all services (for edit booking)
export const getServices = async () => {
  const res = await axios.get('http://localhost:3000/api/services', { withCredentials: true });
  return res.data;
};

// Get all barbers (for edit booking)
export const getBarbers = async () => {
  const res = await axios.get('http://localhost:3000/api/barbers', { withCredentials: true });
  return res.data;
};
