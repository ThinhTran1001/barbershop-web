/**
 * Booking status validation utilities for backend
 * Provides consistent validation logic and error messages across controllers
 */

// Booking status constants
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
};

// Final statuses that cannot be changed
const FINAL_STATUSES = [
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.NO_SHOW
];

// Active statuses that can be modified
const ACTIVE_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED
];

/**
 * Check if a booking can be confirmed
 * @param {Object} booking - The booking object
 * @returns {Object} - { valid: boolean, error: string|null }
 */
const validateBookingConfirmation = (booking) => {
  if (!booking) {
    return { valid: false, error: 'Booking not found' };
  }

  if (booking.status === BOOKING_STATUS.PENDING) {
    return { valid: true, error: null };
  }

  let error;
  switch (booking.status) {
    case BOOKING_STATUS.CANCELLED:
      error = 'This booking cannot be confirmed because it has already been cancelled.';
      break;
    case BOOKING_STATUS.COMPLETED:
      error = 'This booking cannot be confirmed because it has already been completed.';
      break;
    case BOOKING_STATUS.CONFIRMED:
      error = 'This booking has already been confirmed.';
      break;
    case BOOKING_STATUS.NO_SHOW:
      error = 'This booking cannot be confirmed because it was marked as no-show.';
      break;
    default:
      error = `Cannot confirm booking with status: ${booking.status}. Only pending bookings can be confirmed.`;
  }

  return { valid: false, error };
};

/**
 * Check if a booking status can be updated
 * @param {Object} booking - The booking object
 * @param {string} newStatus - The new status to transition to
 * @param {string} userRole - The role of the user attempting the update
 * @returns {Object} - { valid: boolean, error: string|null }
 */
const validateBookingStatusUpdate = (booking, newStatus, userRole = 'customer') => {
  if (!booking) {
    return { valid: false, error: 'Booking not found' };
  }

  // Check if booking is in a final state
  if (FINAL_STATUSES.includes(booking.status)) {
    let error;
    switch (booking.status) {
      case BOOKING_STATUS.CANCELLED:
        error = 'This booking cannot be updated because it has already been cancelled.';
        break;
      case BOOKING_STATUS.COMPLETED:
        error = 'This booking cannot be updated because it has already been completed.';
        break;
      case BOOKING_STATUS.NO_SHOW:
        error = 'This booking cannot be updated because it was marked as no-show.';
        break;
      default:
        error = 'This booking cannot be updated because it is in a final state.';
    }
    return { valid: false, error };
  }

  // Role-based validation
  const validTransitions = {
    admin: {
      [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW],
      [BOOKING_STATUS.CANCELLED]: [],
      [BOOKING_STATUS.COMPLETED]: [],
      [BOOKING_STATUS.NO_SHOW]: []
    },
    barber: {
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.NO_SHOW],
      [BOOKING_STATUS.PENDING]: [],
      [BOOKING_STATUS.CANCELLED]: [],
      [BOOKING_STATUS.COMPLETED]: [],
      [BOOKING_STATUS.NO_SHOW]: []
    },
    customer: {
      [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.CONFIRMED]: [],
      [BOOKING_STATUS.CANCELLED]: [],
      [BOOKING_STATUS.COMPLETED]: [],
      [BOOKING_STATUS.NO_SHOW]: []
    }
  };

  const allowedTransitions = validTransitions[userRole]?.[booking.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    let error;
    
    // Provide specific messages for final statuses
    if (FINAL_STATUSES.includes(booking.status)) {
      switch (booking.status) {
        case BOOKING_STATUS.CANCELLED:
          error = 'This booking cannot be updated because it has already been cancelled.';
          break;
        case BOOKING_STATUS.COMPLETED:
          error = 'This booking cannot be updated because it has already been completed.';
          break;
        case BOOKING_STATUS.NO_SHOW:
          error = 'This booking cannot be updated because it was marked as no-show.';
          break;
        default:
          error = 'This booking cannot be updated because it is in a final state.';
      }
    } else {
      error = `${userRole} cannot change status from ${booking.status} to ${newStatus}`;
    }
    
    return { valid: false, error };
  }

  return { valid: true, error: null };
};

/**
 * Check if a booking can be cancelled
 * @param {Object} booking - The booking object
 * @returns {Object} - { valid: boolean, error: string|null }
 */
const validateBookingCancellation = (booking) => {
  if (!booking) {
    return { valid: false, error: 'Booking not found' };
  }

  // Check if booking is already in a final state
  if (FINAL_STATUSES.includes(booking.status)) {
    let error;
    switch (booking.status) {
      case BOOKING_STATUS.CANCELLED:
        error = 'This booking has already been cancelled.';
        break;
      case BOOKING_STATUS.COMPLETED:
        error = 'This booking cannot be cancelled because it has already been completed.';
        break;
      case BOOKING_STATUS.NO_SHOW:
        error = 'This booking cannot be cancelled because it was marked as no-show.';
        break;
      default:
        error = 'This booking cannot be cancelled.';
    }
    return { valid: false, error };
  }

  // Only pending and confirmed bookings can be cancelled
  if (![BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED].includes(booking.status)) {
    return {
      valid: false,
      error: `Cannot cancel booking with status: ${booking.status}`
    };
  }

  return { valid: true, error: null };
};

/**
 * Get error message for bulk confirmation
 * @param {string} status - The booking status
 * @returns {string} - Error message for bulk operations
 */
const getBulkConfirmationError = (status) => {
  switch (status) {
    case BOOKING_STATUS.CANCELLED:
      return 'Booking has already been cancelled';
    case BOOKING_STATUS.COMPLETED:
      return 'Booking has already been completed';
    case BOOKING_STATUS.CONFIRMED:
      return 'Booking has already been confirmed';
    case BOOKING_STATUS.NO_SHOW:
      return 'Booking was marked as no-show';
    default:
      return `Cannot confirm booking with status: ${status}`;
  }
};

/**
 * Check if a booking is in an active state (can be modified)
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if booking is active
 */
const isBookingActive = (booking) => {
  return booking && ACTIVE_STATUSES.includes(booking.status);
};

/**
 * Check if a booking is in a final state (cannot be modified)
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if booking is in final state
 */
const isBookingFinal = (booking) => {
  return booking && FINAL_STATUSES.includes(booking.status);
};

module.exports = {
  BOOKING_STATUS,
  FINAL_STATUSES,
  ACTIVE_STATUSES,
  validateBookingConfirmation,
  validateBookingStatusUpdate,
  validateBookingCancellation,
  getBulkConfirmationError,
  isBookingActive,
  isBookingFinal
};
