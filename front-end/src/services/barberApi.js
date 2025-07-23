import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/barbers';

// Enhanced barber fetching with filtering
export const fetchAllBarbers = async (filters = {}) => {
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

// Get barbers by specialty (legacy support)
export const fetchBarbersBySpecialty = async (specialty) => {
  const res = await axios.get(`${API_BASE}/by-specialty`, { params: { specialty } });
  return res.data;
};

// Auto-assign barber
export const autoAssignBarber = async (serviceId, bookingDate, customerPreferences = {}) => {
  const res = await axios.post(`${API_BASE}/auto-assign`, {
    serviceId,
    bookingDate,
    customerPreferences
  }, { withCredentials: true });
  return res.data;
};

// Get barber availability
export const getBarberAvailability = async (barberId, startDate, endDate) => {
  const res = await axios.get(`${API_BASE}/availability`, {
    params: { barberId, startDate, endDate }
  });
  return res.data;
};

// Get barber by ID
export const fetchBarberById = async (barberId) => {
  const res = await axios.get(`${API_BASE}/${barberId}`);
  return res.data;
};

// Get barber bookings
export const getBarberBookings = async (barberId, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await axios.get(`${API_BASE}/${barberId}/bookings?${params.toString()}`);
  return res.data;
};

export const getBarberByUserId = async (userId) => {
  const res = await axios.get(`${API_BASE}/by-user/${userId}`);
  return res.data;
};

export const getBarberPublicById = async (barberId) => {
  const res = await axios.get(`${API_BASE}/public/${barberId}`);
  return res.data;
};
