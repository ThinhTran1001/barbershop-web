import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Card, Spin, Typography, Alert, Button, Space } from 'antd';
import { InfoCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

const { Title, Text } = Typography;

/**
 * BookingFlowRedirect Component
 * 
 * Handles redirects from the old multi-step booking flow to the new single-page flow.
 * Preserves any existing booking data from localStorage and provides user-friendly messaging.
 */
const BookingFlowRedirect = ({ 
  fromRoute, 
  message = "Redirecting to improved booking experience...",
  delay = 2000 
}) => {
  const location = useLocation();

  useEffect(() => {
    // Check for existing booking data in localStorage
    const selectedService = localStorage.getItem('selectedService');
    const selectedBarber = localStorage.getItem('selectedBarber');
    const selectedTimeSlot = localStorage.getItem('selectedTimeSlot');

    let redirectMessage = "Redirecting to our improved single-page booking experience!";
    
    if (selectedService || selectedBarber || selectedTimeSlot) {
      redirectMessage = "We found your previous booking selections. Redirecting to complete your booking...";
    }

    // Show toast notification
    toast.info(redirectMessage, {
      position: "top-center",
      autoClose: delay - 500,
      hideProgressBar: false,
    });

    // Auto-redirect after delay
    const timer = setTimeout(() => {
      // The Navigate component will handle the actual redirect
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  // Prepare state to pass to the new booking flow
  const getRedirectState = () => {
    const state = {
      fromLegacyFlow: true,
      originalRoute: fromRoute || location.pathname
    };

    // Check for existing booking data
    try {
      const selectedService = localStorage.getItem('selectedService');
      if (selectedService) {
        state.preSelectedService = JSON.parse(selectedService);
      }
    } catch (error) {
      console.warn('Error parsing selected service from localStorage:', error);
    }

    return state;
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh',
      padding: '20px'
    }}>
      <Card 
        style={{ 
          maxWidth: '500px', 
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Spin size="large" />
          
          <div>
            <Title level={3} style={{ color: '#1890ff', marginBottom: '8px' }}>
              Upgrading Your Experience
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {message}
            </Text>
          </div>

          <Alert
            message="What's New?"
            description={
              <Space direction="vertical" size="small" style={{ textAlign: 'left' }}>
                <Text>• Complete your entire booking on one page</Text>
                <Text>• Faster service and barber selection</Text>
                <Text>• Real-time availability checking</Text>
                <Text>• Improved mobile experience</Text>
              </Space>
            }
            type="info"
            icon={<InfoCircleOutlined />}
            style={{ textAlign: 'left' }}
          />

          <div>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              You'll be redirected automatically in a few seconds...
            </Text>
          </div>

          {/* Manual redirect button */}
          <Button 
            type="primary" 
            icon={<ArrowRightOutlined />}
            onClick={() => {
              // Force immediate redirect
              window.location.href = '/book-service';
            }}
            size="large"
          >
            Continue to New Booking Experience
          </Button>
        </Space>

        {/* Hidden Navigate component for automatic redirect */}
        <Navigate 
          to="/book-service" 
          state={getRedirectState()} 
          replace 
        />
      </Card>
    </div>
  );
};

export default BookingFlowRedirect;
