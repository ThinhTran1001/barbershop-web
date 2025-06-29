import axios from 'axios';

const API_BASE = '/api/barber-schedule';

export const fetchAvailableSlots = async (barberId, date) => {
  const res = await axios.get(`${API_BASE}/available-slots`, { params: { barberId, date } });
  return res.data;
};

export const checkBarberOff = async (barberId, date) => {
  const res = await axios.get(`${API_BASE}/is-off`, { params: { barberId, date } });
  return res.data;
};

