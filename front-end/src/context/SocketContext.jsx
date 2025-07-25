import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketConnection = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: {
        userId: user.id || user._id
      }
    });

    // Connection event handlers
    socketConnection.on('connect', () => {
      console.log('✅ WebSocket connected:', socketConnection.id);
      setIsConnected(true);
      setConnectionError(null);
      
      // Join user-specific room
      if (user.role) {
        socketConnection.emit('joinRoom', user.id || user._id, user.role);
      }
    });

    socketConnection.on('disconnect', (reason) => {
      console.log('❌ WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    socketConnection.on('connect_error', (error) => {
      console.error('🔴 WebSocket connection error:', error);
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // Booking-related events
    socketConnection.on('booking_created', (data) => {
      console.log('📅 Booking created event received:', data);
      // This will be handled by individual components that need it
    });

    socketConnection.on('booking_updated', (data) => {
      console.log('📝 Booking updated event received:', data);
    });

    socketConnection.on('booking_cancelled', (data) => {
      console.log('❌ Booking cancelled event received:', data);
    });

    setSocket(socketConnection);

    // Cleanup on unmount or user change
    return () => {
      console.log('🔌 Cleaning up WebSocket connection');
      socketConnection.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [user]);

  // Utility functions
  const emitEvent = (eventName, data) => {
    if (socket && isConnected) {
      socket.emit(eventName, data);
    } else {
      console.warn('Cannot emit event: Socket not connected');
    }
  };

  const onEvent = (eventName, callback) => {
    if (socket) {
      socket.on(eventName, callback);
      
      // Return cleanup function
      return () => {
        socket.off(eventName, callback);
      };
    }
  };

  const offEvent = (eventName, callback) => {
    if (socket) {
      socket.off(eventName, callback);
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    emitEvent,
    onEvent,
    offEvent,
    // Convenience methods for common events
    onBookingCreated: (callback) => onEvent('booking_created', callback),
    onBookingUpdated: (callback) => onEvent('booking_updated', callback),
    onBookingCancelled: (callback) => onEvent('booking_cancelled', callback)
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;
