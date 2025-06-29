import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/barbers';

export const fetchAllBarbers = async () => {
  const res = await axios.get(API_BASE);
  return res.data;
};

export const fetchBarbersBySpecialty = async (specialty) => {
  const res = await axios.get(`${API_BASE}/by-specialty`, { params: { specialty } });
  return res.data;
};

