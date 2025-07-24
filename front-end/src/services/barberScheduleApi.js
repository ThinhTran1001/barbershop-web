import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE = 'http://localhost:3000/api/barber-schedule';

// Create axios instance with credentials for authenticated requests
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const fetchAvailableSlots = async (barberId, date, options = {}) => {
  const params = {
    barberId,
    date,
    ...options
  };
  const res = await axios.get(`${API_BASE}/available-slots`, { params });
  return res.data;
};

export const checkBarberOff = async (barberId, date) => {
  const res = await axios.get(`${API_BASE}/is-off`, { params: { barberId, date } });
  return res.data;
};

// Real-time validation for specific time slot
export const validateTimeSlotAvailability = async (data) => {
  try {
    const res = await api.post('/validate-availability', data);
    return res.data;
  } catch (error) {
    console.error('Error validating time slot availability:', error);

    // Return a safe default if validation fails
    return {
      available: true,
      message: 'Validation failed - please proceed with caution',
      error: error.message
    };
  }
};

