import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/barber-absences';

// Create barber absence
export const createBarberAbsence = async (absenceData) => {
  const res = await axios.post(API_BASE, absenceData, { withCredentials: true });
  return res.data;
};

// Get all barber absences
export const getAllAbsences = async (filters = {}) => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  const res = await axios.get(`${API_BASE}?${params.toString()}`, { withCredentials: true });
  return res.data;
};

// Update absence approval status
export const updateAbsenceApproval = async (absenceId, isApproved) => {
  const res = await axios.put(
    `${API_BASE}/${absenceId}/approval`,
    { isApproved },
    { withCredentials: true }
  );
  return res.data;
};

// Reschedule affected bookings
export const rescheduleAffectedBookings = async (absenceId, reschedulingOptions) => {
  const res = await axios.put(
    `${API_BASE}/${absenceId}/reschedule`,
    { reschedulingOptions },
    { withCredentials: true }
  );
  return res.data;
};

// Delete absence
export const deleteAbsence = async (absenceId) => {
  const res = await axios.delete(`${API_BASE}/${absenceId}`, { withCredentials: true });
  return res.data;
};

// Get barber calendar
export const getBarberCalendar = async (userId, month, year) => {
  const res = await axios.get(`${API_BASE}/calendar`, {
    params: { userId, month, year },
    withCredentials: true
  });
  return res.data;
};

export const getBarberSchedule = async (barberId, month, year) => {
  const res = await axios.get(`${API_BASE}/${barberId}/schedule`, {
    params: { month, year },
    withCredentials: true
  });
  return res.data;
}
