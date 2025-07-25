import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/barber-absences';

// Create barber absence (Barber only - barberId auto-determined from auth)
export const createBarberAbsence = async (absenceData) => {
  try {
    const res = await axios.post(API_BASE, absenceData, { withCredentials: true });
    return res.data;
  } catch (error) {
    // Enhanced error handling
    if (error.response?.status === 403) {
      throw new Error('Only barbers can create absence requests');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data.message || 'Invalid request data');
    } else if (error.response?.status === 404) {
      throw new Error('Barber profile not found');
    }
    throw error;
  }
};

// Get barber's own absence requests (Barber only)
export const getMyAbsenceRequests = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  try {
    const res = await axios.get(`${API_BASE}/my-requests?${params.toString()}`, {
      withCredentials: true
    });
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Only barbers can view their own requests');
    }
    throw error;
  }
};

// Get all barber absences (Admin only)
export const getAllAbsences = async (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  });

  try {
    const res = await axios.get(`${API_BASE}?${params.toString()}`, { withCredentials: true });
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    throw error;
  }
};

// Update absence approval status (Admin only)
export const updateAbsenceApproval = async (absenceId, isApproved) => {
  try {
    const res = await axios.put(
      `${API_BASE}/${absenceId}/approval`,
      { isApproved },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    } else if (error.response?.status === 404) {
      throw new Error('Absence request not found');
    }
    throw error;
  }
};

// Reschedule affected bookings (Admin only)
export const rescheduleAffectedBookings = async (absenceId, reschedulingOptions) => {
  try {
    const res = await axios.put(
      `${API_BASE}/${absenceId}/reschedule`,
      { reschedulingOptions },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    throw error;
  }
};

// Delete absence (Admin only)
export const deleteAbsence = async (absenceId) => {
  try {
    const res = await axios.delete(`${API_BASE}/${absenceId}`, { withCredentials: true });
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    } else if (error.response?.status === 404) {
      throw new Error('Absence request not found');
    }
    throw error;
  }
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
};

// Get available barbers for specific time slot
export const getAvailableBarbers = async (date, timeSlot, excludeBarberId) => {
  try {
    const res = await axios.get('http://localhost:3000/api/barbers/available', {
      params: { date, timeSlot, excludeBarberId },
      withCredentials: true
    });
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    }
    throw error;
  }
};

// Reassign affected bookings to new barbers
export const reassignAffectedBookings = async (absenceId, assignments) => {
  try {
    const res = await axios.put(
      `${API_BASE}/${absenceId}/reassign-bookings`,
      { assignments },
      { withCredentials: true }
    );
    return res.data;
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin privileges required');
    } else if (error.response?.status === 404) {
      throw new Error('Absence request not found');
    }
    throw error;
  }
};
