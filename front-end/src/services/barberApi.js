import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/barbers';

// Function to get the accessToken from cookies
const getAccessToken = () => {
  const name = 'accessToken=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

// Create an Axios instance
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // This is important if your API uses cookies for sessions or other purposes
});

// Add a request interceptor to include the accessToken in the Authorization header
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

  const res = await api.get(`?${params.toString()}`); // Use the 'api' instance
  return res.data;
};

// Get barbers by specialty (legacy support)
export const fetchBarbersBySpecialty = async (specialty) => {
  const res = await api.get(`/by-specialty`, { params: { specialty } }); // Use the 'api' instance
  return res.data;
};

// Auto-assign barber
export const autoAssignBarber = async (serviceId, bookingDate, customerPreferences = {}) => {
  const res = await api.post(`/auto-assign`, { // Use the 'api' instance
    serviceId,
    bookingDate,
    customerPreferences
  });
  return res.data;
};

// Get barber availability
export const getBarberAvailability = async (barberId, startDate, endDate) => {
  const res = await api.get(`/availability`, { // Use the 'api' instance
    params: { barberId, startDate, endDate }
  });
  return res.data;
};

// Get barber by ID
export const fetchBarberById = async (barberId) => {
  const res = await api.get(`/${barberId}`); // Use the 'api' instance
  return res.data;
};

// Get barber bookings
export const getBarberBookings = async (userId, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await api.get(`/${userId}/bookings?${params.toString()}`); // Use the 'api' instance with auth
  return res.data;
};

export const getBarberByUserId = async (userId) => {
  const res = await api.get(`/by-user/${userId}`); // Use the 'api' instance
  return res.data;
};

export const getBarberPublicById = async (barberId) => {
  const res = await api.get(`/public/${barberId}`); // Use the 'api' instance
  return res.data;
};

export const getBarberFeedbackById = (id) => api.get(`/feedback-barber/${id}`); // Use the 'api' instance

// Get available barbers for customers (no authentication required)
export const getAvailableBarbersForCustomers = async (date, timeSlot, serviceId) => {
  // Use direct axios call without authentication for this public endpoint
  // Create a fresh axios instance without interceptors to avoid auth headers
  const publicAxios = axios.create();
  const res = await publicAxios.get(`${API_BASE}/available-for-customers`, {
    params: {
      date,
      timeSlot,
      serviceId
    }
  });
  return res.data;
};

