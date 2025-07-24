import React from 'react';
import { notification } from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined, 
  InfoCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

/**
 * Custom toast notification service for booking system
 * Provides consistent styling and behavior across the application
 */

// Configure default notification settings
notification.config({
  placement: 'topRight',
  duration: 4.5,
  rtl: false,
});

class ToastService {
  
  // Success notifications
  static showBookingSuccess(bookingDetails) {
    const { serviceName, barberName, date, time, duration } = bookingDetails;
    
    notification.success({
      message: '✅ Booking Created Successfully!',
      description: (
        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
          <div style={{ marginBottom: '8px', fontWeight: '500' }}>
            <CalendarOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
            {serviceName} ({duration} minutes)
          </div>
          <div style={{ marginBottom: '4px' }}>
            <UserOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
            Barber: {barberName}
          </div>
          <div>
            <ClockCircleOutlined style={{ marginRight: '6px', color: '#fa8c16' }} />
            {new Date(date).toLocaleDateString('vi-VN')} at {time}
          </div>
        </div>
      ),
      duration: 6,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      style: {
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
      }
    });
  }

  static showValidationSuccess(message = 'Time slot is available') {
    notification.success({
      message: '✅ Slot Available',
      description: message,
      duration: 3,
      icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      style: {
        backgroundColor: '#f6ffed',
        border: '1px solid #b7eb8f',
      }
    });
  }

  // Error notifications
  static showCustomerDoubleBookingError(details) {
    const { reason, conflictingBarber, conflictTime, conflictDuration } = details;
    
    notification.error({
      message: '⚠️ Double-Booking Prevented',
      description: (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px', color: '#ff4d4f', fontWeight: '500' }}>
            You already have a booking during this time period.
          </div>
          <div style={{ marginBottom: '4px' }}>
            <UserOutlined style={{ marginRight: '6px' }} />
            Existing booking with: {conflictingBarber}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <ClockCircleOutlined style={{ marginRight: '6px' }} />
            Time: {new Date(conflictTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </div>
          <div>
            Duration: {conflictDuration} minutes
          </div>
        </div>
      ),
      duration: 10,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      style: {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
      }
    });
  }

  static showBarberConflictError(details) {
    const { reason, conflictTime, conflictDuration } = details;
    
    notification.error({
      message: '❌ Time Slot Unavailable',
      description: (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px', color: '#ff4d4f' }}>
            This time slot conflicts with an existing booking.
          </div>
          <div style={{ marginBottom: '4px' }}>
            <ClockCircleOutlined style={{ marginRight: '6px' }} />
            Conflicting booking: {new Date(conflictTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}
          </div>
          <div>
            Duration: {conflictDuration} minutes
          </div>
        </div>
      ),
      duration: 8,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      style: {
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
      }
    });
  }

  static showDailyLimitError(barberName) {
    notification.error({
      message: '📅 Daily Booking Limit Reached',
      description: (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            {barberName || 'This barber'} has reached the maximum number of bookings for this date.
          </div>
          <div style={{ color: '#666' }}>
            Please select a different date or barber.
          </div>
        </div>
      ),
      duration: 8,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      style: {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
      }
    });
  }

  static showScheduleUpdateError() {
    notification.error({
      message: '🔧 Schedule Update Failed',
      description: (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            Failed to update the barber's schedule. Your booking was not created.
          </div>
          <div style={{ color: '#666' }}>
            Please try again or contact support if the problem persists.
          </div>
        </div>
      ),
      duration: 10,
      icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      style: {
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
      }
    });
  }

  static showNetworkError(operation = 'operation') {
    notification.error({
      message: '🌐 Network Error',
      description: (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            Unable to complete {operation} due to network issues.
          </div>
          <div style={{ color: '#666' }}>
            Please check your internet connection and try again.
          </div>
        </div>
      ),
      duration: 8,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      style: {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
      }
    });
  }

  static showValidationError(details) {
    const { conflictType, reason, conflictingBarber } = details;
    
    let message, description, duration = 8;
    
    if (conflictType === 'CUSTOMER_CONFLICT') {
      message = '⚠️ Double-Booking Detected';
      description = (
        <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '4px' }}>
            {reason}
          </div>
          {conflictingBarber && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              Conflicting appointment with: {conflictingBarber}
            </div>
          )}
        </div>
      );
      duration = 10;
    } else if (conflictType === 'BARBER_CONFLICT') {
      message = '❌ Time Slot Unavailable';
      description = reason;
    } else {
      message = '⚠️ Validation Failed';
      description = reason || 'Time slot is no longer available';
    }

    notification.error({
      message,
      description,
      duration,
      icon: conflictType === 'CUSTOMER_CONFLICT' ? 
        <ExclamationCircleOutlined style={{ color: '#faad14' }} /> :
        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      style: conflictType === 'CUSTOMER_CONFLICT' ? {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
      } : {
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
      }
    });
  }

  // Loading notifications
  static showLoadingToast(message, key = 'loading') {
    notification.info({
      key,
      message: '⏳ Processing...',
      description: message,
      duration: 0, // Don't auto-close
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      style: {
        backgroundColor: '#e6f7ff',
        border: '1px solid #91d5ff',
      }
    });
  }

  static hideLoadingToast(key = 'loading') {
    notification.destroy(key);
  }

  // Generic notifications
  static showWarning(message, description, duration = 6) {
    notification.warning({
      message,
      description,
      duration,
      icon: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
      style: {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
      }
    });
  }

  static showInfo(message, description, duration = 4) {
    notification.info({
      message,
      description,
      duration,
      icon: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
      style: {
        backgroundColor: '#e6f7ff',
        border: '1px solid #91d5ff',
      }
    });
  }

  // Clear all notifications
  static clearAll() {
    notification.destroy(); // This is correct - without key destroys all
  }
}

export default ToastService;
