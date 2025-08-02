/**
 * Booking status validation utilities
 * Provides consistent validation logic and user messages across the application
 */

// Booking status constants
export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
  REJECTED: 'rejected'
};

// Final statuses that cannot be changed
export const FINAL_STATUSES = [
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.NO_SHOW,
  BOOKING_STATUS.REJECTED
];

// Active statuses that can be modified
export const ACTIVE_STATUSES = [
  BOOKING_STATUS.PENDING,
  BOOKING_STATUS.CONFIRMED
];

/**
 * Check if a booking can be confirmed
 * @param {Object} booking - The booking object
 * @returns {Object} - { canConfirm: boolean, reason: string }
 */
export const canConfirmBooking = (booking) => {
  if (!booking) {
    return { canConfirm: false, reason: 'Booking not found' };
  }

  if (booking.status === BOOKING_STATUS.PENDING) {
    return { canConfirm: true, reason: null };
  }

  let reason;
  switch (booking.status) {
    case BOOKING_STATUS.CANCELLED:
      reason = 'This booking cannot be confirmed because it has already been cancelled.';
      break;
    case BOOKING_STATUS.COMPLETED:
      reason = 'This booking cannot be confirmed because it has already been completed.';
      break;
    case BOOKING_STATUS.CONFIRMED:
      reason = 'This booking has already been confirmed.';
      break;
    case BOOKING_STATUS.NO_SHOW:
      reason = 'This booking cannot be confirmed because it was marked as no-show.';
      break;
    case BOOKING_STATUS.REJECTED:
      reason = 'This booking cannot be confirmed because it has been rejected.';
      break;
    default:
      reason = `Cannot confirm booking with status: ${booking.status}. Only pending bookings can be confirmed.`;
  }

  return { canConfirm: false, reason };
};

/**
 * Check if a booking status can be updated
 * @param {Object} booking - The booking object
 * @param {string} newStatus - The new status to transition to
 * @param {string} userRole - The role of the user attempting the update
 * @returns {Object} - { canUpdate: boolean, reason: string }
 */
export const canUpdateBookingStatus = (booking, newStatus, userRole = 'customer') => {
  if (!booking) {
    return { canUpdate: false, reason: 'Booking not found' };
  }

  // Check if booking is in a final state
  if (FINAL_STATUSES.includes(booking.status)) {
    let reason;
    switch (booking.status) {
      case BOOKING_STATUS.CANCELLED:
        reason = 'This booking cannot be updated because it has already been cancelled.';
        break;
      case BOOKING_STATUS.COMPLETED:
        reason = 'This booking cannot be updated because it has already been completed.';
        break;
      case BOOKING_STATUS.NO_SHOW:
        reason = 'This booking cannot be updated because it was marked as no-show.';
        break;
      case BOOKING_STATUS.REJECTED:
        reason = 'This booking cannot be updated because it has been rejected.';
        break;
      default:
        reason = 'This booking cannot be updated because it is in a final state.';
    }
    return { canUpdate: false, reason };
  }

  // Role-based validation
  const validTransitions = {
    admin: {
      [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.REJECTED],
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.NO_SHOW, BOOKING_STATUS.REJECTED]
    },
    barber: {
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.NO_SHOW]
    },
    customer: {
      [BOOKING_STATUS.PENDING]: [BOOKING_STATUS.CANCELLED],
      [BOOKING_STATUS.CONFIRMED]: [BOOKING_STATUS.CANCELLED] // With time restrictions
    }
  };

  const allowedTransitions = validTransitions[userRole]?.[booking.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return {
      canUpdate: false,
      reason: `${userRole} cannot change status from ${booking.status} to ${newStatus}`
    };
  }

  return { canUpdate: true, reason: null };
};

/**
 * Check if a booking can be cancelled by a customer
 * @param {Object} booking - The booking object
 * @returns {Object} - { canCancel: boolean, reason: string }
 */
export const canCancelBooking = (booking) => {
  if (!booking) {
    return { canCancel: false, reason: 'Booking not found' };
  }

  // Check if booking is already in a final state
  if (FINAL_STATUSES.includes(booking.status)) {
    let reason;
    switch (booking.status) {
      case BOOKING_STATUS.CANCELLED:
        reason = 'This booking has already been cancelled.';
        break;
      case BOOKING_STATUS.COMPLETED:
        reason = 'This booking cannot be cancelled because it has already been completed.';
        break;
      case BOOKING_STATUS.NO_SHOW:
        reason = 'This booking cannot be cancelled because it was marked as no-show.';
        break;
      case BOOKING_STATUS.REJECTED:
        reason = 'This booking cannot be cancelled because it has been rejected.';
        break;
      default:
        reason = 'This booking cannot be cancelled.';
    }
    return { canCancel: false, reason };
  }

  // Only pending bookings can be cancelled
  if (booking.status !== BOOKING_STATUS.PENDING) {
    let reason;
    switch (booking.status) {
      case BOOKING_STATUS.CONFIRMED:
        reason = 'Cannot cancel confirmed booking. Please contact the barber shop directly.';
        break;
      default:
        reason = `Cannot cancel booking with status: ${booking.status}`;
    }
    return {
      canCancel: false,
      reason
    };
  }

  return { canCancel: true, reason: null };
};

/**
 * Get user-friendly status text
 * @param {string} status - The booking status
 * @returns {string} - User-friendly status text
 */
export const getStatusText = (status) => {
  const statusTexts = {
    [BOOKING_STATUS.PENDING]: 'Chờ xác nhận',
    [BOOKING_STATUS.CONFIRMED]: 'Đã xác nhận',
    [BOOKING_STATUS.COMPLETED]: 'Hoàn thành',
    [BOOKING_STATUS.CANCELLED]: 'Đã hủy',
    [BOOKING_STATUS.NO_SHOW]: 'Không đến',
    [BOOKING_STATUS.REJECTED]: 'Đã từ chối'
  };
  return statusTexts[status] || status;
};

/**
 * Get status color for UI components
 * @param {string} status - The booking status
 * @returns {string} - Color name for Ant Design components
 */
export const getStatusColor = (status) => {
  const statusColors = {
    [BOOKING_STATUS.PENDING]: 'orange',
    [BOOKING_STATUS.CONFIRMED]: 'blue',
    [BOOKING_STATUS.COMPLETED]: 'green',
    [BOOKING_STATUS.CANCELLED]: 'red',
    [BOOKING_STATUS.NO_SHOW]: 'volcano',
    [BOOKING_STATUS.REJECTED]: 'magenta'
  };
  return statusColors[status] || 'default';
};

/**
 * Check if a booking is in an active state (can be modified)
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if booking is active
 */
export const isBookingActive = (booking) => {
  return booking && ACTIVE_STATUSES.includes(booking.status);
};

/**
 * Check if a booking is in a final state (cannot be modified)
 * @param {Object} booking - The booking object
 * @returns {boolean} - True if booking is in final state
 */
export const isBookingFinal = (booking) => {
  return booking && FINAL_STATUSES.includes(booking.status);
};

/**
 * Get appropriate action message for disabled buttons
 * @param {Object} booking - The booking object
 * @param {string} action - The action being attempted (e.g., 'confirm', 'update', 'cancel')
 * @returns {string} - Message explaining why action is disabled
 */
export const getDisabledActionMessage = (booking, action = 'update') => {
  if (!booking) {
    return 'Booking not found';
  }

  if (isBookingFinal(booking)) {
    switch (booking.status) {
      case BOOKING_STATUS.CANCELLED:
        return `Cannot ${action} this booking because it has already been cancelled.`;
      case BOOKING_STATUS.COMPLETED:
        return `Cannot ${action} this booking because it has already been completed.`;
      case BOOKING_STATUS.NO_SHOW:
        return `Cannot ${action} this booking because it was marked as no-show.`;
      case BOOKING_STATUS.REJECTED:
        return `Cannot ${action} this booking because it has been rejected.`;
      default:
        return `Cannot ${action} this booking because it is in a final state.`;
    }
  }

  return `Cannot ${action} this booking with current status: ${getStatusText(booking.status)}`;
};
