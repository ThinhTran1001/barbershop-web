import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';

/**
 * Custom hook for managing time-based booking completion eligibility
 * Provides real-time updates on whether a booking can be completed
 */
const useBookingCompletion = (bookingId, refreshInterval = 30000) => {
  const [completionState, setCompletionState] = useState({
    canComplete: false,
    reason: null,
    timeInfo: null,
    uiState: null,
    timeUntilCompletion: null,
    loading: true,
    error: null,
    lastChecked: null
  });

  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check completion eligibility
  const checkEligibility = useCallback(async () => {
    if (!bookingId) {
      setCompletionState(prev => ({
        ...prev,
        loading: false,
        error: 'No booking ID provided'
      }));
      return;
    }

    try {
      setCompletionState(prev => ({ ...prev, loading: true, error: null }));

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bookings/${bookingId}/completion-eligibility`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check completion eligibility');
      }

      const data = await response.json();

      setCompletionState({
        canComplete: data.canComplete,
        reason: data.reason,
        timeInfo: data.timeInfo,
        uiState: data.uiState,
        timeUntilCompletion: data.timeUntilCompletion,
        booking: data.booking,
        loading: false,
        error: null,
        lastChecked: new Date()
      });

    } catch (error) {
      console.error('Error checking completion eligibility:', error);
      setCompletionState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, [bookingId]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !bookingId) return;

    // Initial check
    checkEligibility();

    // Set up interval for auto-refresh
    const interval = setInterval(checkEligibility, refreshInterval);

    return () => clearInterval(interval);
  }, [checkEligibility, autoRefresh, refreshInterval, bookingId]);

  // Manual refresh function
  const refresh = useCallback(() => {
    checkEligibility();
  }, [checkEligibility]);

  // Toggle auto-refresh
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  // Get formatted time information
  const getFormattedTimeInfo = useCallback(() => {
    if (!completionState.timeInfo) return null;

    const { timeInfo } = completionState;
    
    return {
      currentTime: timeInfo.currentTime,
      bookingWindow: `${timeInfo.bookingStartTime} - ${timeInfo.bookingEndTime}`,
      graceWindow: timeInfo.graceEndTime,
      isToday: timeInfo.isToday,
      isInGracePeriod: timeInfo.isInGracePeriod,
      windowStatus: timeInfo.windowStatus,
      gracePeriodMinutes: timeInfo.gracePeriodMinutes
    };
  }, [completionState.timeInfo]);

  // Get completion button props
  const getButtonProps = useCallback(() => {
    if (!completionState.uiState) {
      return {
        disabled: true,
        loading: completionState.loading,
        children: 'Hoàn thành',
        title: completionState.loading ? 'Đang kiểm tra...' : 'Không thể hoàn thành'
      };
    }

    const { uiState } = completionState;
    
    return {
      disabled: !uiState.buttonEnabled,
      loading: completionState.loading,
      type: uiState.buttonType,
      children: uiState.buttonText,
      title: uiState.tooltipText,
      ...uiState.buttonProps
    };
  }, [completionState.uiState, completionState.loading]);

  // Get status message for display
  const getStatusMessage = useCallback(() => {
    if (completionState.loading) {
      return { type: 'info', message: 'Đang kiểm tra thời gian...' };
    }

    if (completionState.error) {
      return { type: 'error', message: completionState.error };
    }

    if (!completionState.canComplete && completionState.reason) {
      return { type: 'warning', message: completionState.reason };
    }

    if (completionState.canComplete && completionState.timeInfo?.windowStatus) {
      return { 
        type: 'success', 
        message: `Có thể hoàn thành - ${completionState.timeInfo.windowStatus}` 
      };
    }

    return null;
  }, [completionState]);

  // Check if booking is starting soon
  const isStartingSoon = useCallback(() => {
    if (!completionState.timeUntilCompletion) return false;
    
    const { timeUntilStart, hasStarted } = completionState.timeUntilCompletion;
    return !hasStarted && timeUntilStart <= 30; // Starting within 30 minutes
  }, [completionState.timeUntilCompletion]);

  // Get countdown information
  const getCountdownInfo = useCallback(() => {
    if (!completionState.timeUntilCompletion) return null;

    const { timeUntilStart, hasStarted, formattedTime, message: timeMessage } = completionState.timeUntilCompletion;

    return {
      hasStarted,
      timeUntilStart,
      formattedTime,
      message: timeMessage,
      isStartingSoon: !hasStarted && timeUntilStart <= 30
    };
  }, [completionState.timeUntilCompletion]);

  return {
    // State
    ...completionState,
    autoRefresh,

    // Actions
    refresh,
    toggleAutoRefresh,

    // Computed values
    getFormattedTimeInfo,
    getButtonProps,
    getStatusMessage,
    isStartingSoon,
    getCountdownInfo,

    // Utilities
    isEligible: completionState.canComplete,
    isLoading: completionState.loading,
    hasError: !!completionState.error
  };
};

export default useBookingCompletion;
