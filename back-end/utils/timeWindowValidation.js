/**
 * Time window validation utilities for booking status updates
 * Implements business rules for when barbers can mark bookings as completed
 */

/**
 * Check if current time is within the booking time window
 * @param {Object} booking - The booking object
 * @param {number} gracePeriodMinutes - Grace period after booking end time (default: 15 minutes)
 * @returns {Object} - { isWithinWindow: boolean, reason: string|null, timeInfo: Object }
 */
const isWithinBookingTimeWindow = (booking, gracePeriodMinutes = 15) => {
  if (!booking || !booking.bookingDate || !booking.durationMinutes) {
    return {
      isWithinWindow: false,
      reason: 'Invalid booking data',
      timeInfo: null
    };
  }

  const now = new Date();
  const bookingStart = new Date(booking.bookingDate);
  const bookingEnd = new Date(bookingStart.getTime() + booking.durationMinutes * 60000);
  const graceEnd = new Date(bookingEnd.getTime() + gracePeriodMinutes * 60000);

  // Format times for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const timeInfo = {
    currentTime: formatTime(now),
    currentDate: formatDate(now),
    bookingStartTime: formatTime(bookingStart),
    bookingEndTime: formatTime(bookingEnd),
    graceEndTime: formatTime(graceEnd),
    bookingDate: formatDate(bookingStart),
    gracePeriodMinutes,
    isToday: now.toDateString() === bookingStart.toDateString()
  };

  // Check if booking is today
  if (!timeInfo.isToday) {
    return {
      isWithinWindow: false,
      reason: `Chỉ có thể hoàn thành booking trong ngày ${timeInfo.bookingDate}`,
      timeInfo
    };
  }

  // Check if current time is before booking start
  if (now < bookingStart) {
    const minutesUntilStart = Math.ceil((bookingStart - now) / (1000 * 60));
    return {
      isWithinWindow: false,
      reason: `Booking chưa bắt đầu. Còn ${minutesUntilStart} phút nữa (${timeInfo.bookingStartTime})`,
      timeInfo
    };
  }

  // Check if current time is within booking window (including grace period)
  if (now <= graceEnd) {
    let windowStatus = '';
    if (now <= bookingEnd) {
      windowStatus = 'trong thời gian booking';
    } else {
      const minutesInGrace = Math.ceil((now - bookingEnd) / (1000 * 60));
      windowStatus = `trong thời gian gia hạn (${minutesInGrace}/${gracePeriodMinutes} phút)`;
    }

    return {
      isWithinWindow: true,
      reason: null,
      timeInfo: {
        ...timeInfo,
        windowStatus,
        isInGracePeriod: now > bookingEnd
      }
    };
  }

  // Current time is after grace period
  const minutesAfterGrace = Math.ceil((now - graceEnd) / (1000 * 60));
  return {
    isWithinWindow: false,
    reason: `Đã quá thời gian cho phép. Booking kết thúc lúc ${timeInfo.bookingEndTime} (gia hạn đến ${timeInfo.graceEndTime}), hiện tại đã quá ${minutesAfterGrace} phút`,
    timeInfo
  };
};

/**
 * Check if a booking can be marked as completed based on time window
 * @param {Object} booking - The booking object
 * @param {string} userRole - The role of the user (barber, admin, etc.)
 * @param {number} gracePeriodMinutes - Grace period after booking end time
 * @returns {Object} - { canComplete: boolean, reason: string|null, timeInfo: Object }
 */
const canCompleteBooking = (booking, userRole = 'barber', gracePeriodMinutes = 15) => {
  // Admins can complete bookings at any time
  if (userRole === 'admin') {
    return {
      canComplete: true,
      reason: null,
      timeInfo: {
        adminOverride: true,
        message: 'Admin có thể hoàn thành booking bất kỳ lúc nào'
      }
    };
  }

  // For barbers, check time window
  if (userRole === 'barber') {
    const windowCheck = isWithinBookingTimeWindow(booking, gracePeriodMinutes);
    
    return {
      canComplete: windowCheck.isWithinWindow,
      reason: windowCheck.reason,
      timeInfo: windowCheck.timeInfo
    };
  }

  // Other roles cannot complete bookings
  return {
    canComplete: false,
    reason: 'Chỉ có thợ cắt tóc hoặc quản trị viên mới có thể hoàn thành booking',
    timeInfo: null
  };
};

/**
 * Get time-based UI state for booking completion button
 * @param {Object} booking - The booking object
 * @param {string} userRole - The role of the user
 * @param {number} gracePeriodMinutes - Grace period after booking end time
 * @returns {Object} - UI state information
 */
const getCompletionUIState = (booking, userRole = 'barber', gracePeriodMinutes = 15) => {
  const completionCheck = canCompleteBooking(booking, userRole, gracePeriodMinutes);
  
  if (!completionCheck.canComplete) {
    return {
      buttonEnabled: false,
      buttonText: 'Hoàn thành',
      tooltipText: completionCheck.reason,
      buttonType: 'primary',
      buttonProps: { disabled: true },
      statusMessage: completionCheck.reason,
      timeInfo: completionCheck.timeInfo
    };
  }

  // Can complete - determine button state based on time window
  const timeInfo = completionCheck.timeInfo;
  let buttonText = 'Hoàn thành';
  let tooltipText = 'Đánh dấu booking đã hoàn thành';
  
  if (timeInfo?.isInGracePeriod) {
    buttonText = 'Hoàn thành (Gia hạn)';
    tooltipText = `Đang trong thời gian gia hạn. ${timeInfo.windowStatus}`;
  } else if (timeInfo?.windowStatus) {
    tooltipText = `Có thể hoàn thành - ${timeInfo.windowStatus}`;
  }

  return {
    buttonEnabled: true,
    buttonText,
    tooltipText,
    buttonType: 'primary',
    buttonProps: { type: 'primary' },
    statusMessage: null,
    timeInfo
  };
};

/**
 * Calculate time until booking can be completed
 * @param {Object} booking - The booking object
 * @returns {Object} - Time calculation information
 */
const getTimeUntilCompletion = (booking) => {
  if (!booking || !booking.bookingDate) {
    return { canCalculate: false, message: 'Invalid booking data' };
  }

  const now = new Date();
  const bookingStart = new Date(booking.bookingDate);
  
  if (now >= bookingStart) {
    return {
      canCalculate: true,
      message: 'Booking đã bắt đầu, có thể hoàn thành',
      timeUntilStart: 0,
      hasStarted: true
    };
  }

  const minutesUntilStart = Math.ceil((bookingStart - now) / (1000 * 60));
  const hoursUntilStart = Math.floor(minutesUntilStart / 60);
  const remainingMinutes = minutesUntilStart % 60;

  let timeMessage = '';
  if (hoursUntilStart > 0) {
    timeMessage = `${hoursUntilStart} giờ ${remainingMinutes} phút`;
  } else {
    timeMessage = `${minutesUntilStart} phút`;
  }

  return {
    canCalculate: true,
    message: `Booking bắt đầu sau ${timeMessage}`,
    timeUntilStart: minutesUntilStart,
    hasStarted: false,
    formattedTime: timeMessage
  };
};

module.exports = {
  isWithinBookingTimeWindow,
  canCompleteBooking,
  getCompletionUIState,
  getTimeUntilCompletion
};
