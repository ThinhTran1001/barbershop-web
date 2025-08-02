import React, { useState, useEffect } from 'react';
import {
  Card,
  Steps,
  Button,
  Row,
  Col,
  Typography,
  Spin,
  Alert,
  message,
  Divider,
  Space,
  Progress
} from 'antd';
import {
  ShoppingOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ServiceSelectionStep from '../../components/ServiceSelectionStep';
import TimeSlotSelectionStep from '../../components/TimeSlotSelectionStep';
import BarberSelectionStep from '../../components/BarberSelectionStep';
import CustomerInfoStep from '../../components/CustomerInfoStep';
import BookingConfirmationStep from '../../components/BookingConfirmationStep';
import './SinglePageBooking.css';

const { Title, Text } = Typography;
const { Step } = Steps;

const SinglePageBooking = () => {
  // Main state management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    service: null,
    timeSlot: null,
    barber: null, // Can be null for auto-assignment, or barber object
    customerInfo: null,
    isAutoAssign: false
  });

  const { user } = useAuth();
  const location = useLocation();

  // Handle pre-selected service from navigation
  useEffect(() => {
    if (location.state?.preSelectedService) {
      setBookingData(prev => ({
        ...prev,
        service: location.state.preSelectedService
      }));

      // Auto-advance to next step if service is pre-selected
      if (location.state.fromServiceList) {
        setCurrentStep(1);
        toast.success(`Service pre-selected: ${location.state.preSelectedService.name}`, {
          position: "top-right",
          autoClose: 2000,
        });
      }
    }
  }, [location.state]);

  // Step configuration
  const steps = [
    {
      title: 'Choose Service',
      icon: <ShoppingOutlined />,
      description: 'Select your desired service'
    },
    {
      title: 'Select Time',
      icon: <ClockCircleOutlined />,
      description: 'Pick date and time slot'
    },
    {
      title: 'Choose Barber',
      icon: <UserOutlined />,
      description: 'Select barber or auto-assign'
    },
    {
      title: 'Your Information',
      icon: <FormOutlined />,
      description: 'Enter contact details'
    },
    {
      title: 'Confirmation',
      icon: <CheckCircleOutlined />,
      description: 'Review and confirm booking'
    }
  ];

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Data update functions
  const updateBookingData = (stepData, step) => {
    setBookingData(prev => ({
      ...prev,
      ...stepData
    }));

    // Auto-advance to next step after data selection
    if (step !== undefined && step < steps.length - 1) {
      setCurrentStep(step + 1);
    }
  };

  // Handle service selection
  const handleServiceSelect = (service) => {
    updateBookingData({ service }, 0);
    toast.success(`Selected service: ${service.name}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlot) => {
    updateBookingData({ timeSlot }, 1);
    toast.success(`Selected time: ${timeSlot.label}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Handle barber selection
  const handleBarberSelect = (barberData) => {
    if (barberData.isAutoAssign) {
      updateBookingData({
        barber: barberData.assignedBarber,
        isAutoAssign: true,
        assignmentDetails: barberData.assignmentDetails
      }, 2);
      toast.success(`Auto-assigned: ${barberData.assignedBarber.name}`, {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      updateBookingData({
        barber: barberData.selectedBarber,
        isAutoAssign: false
      }, 2);
      toast.success(`Selected barber: ${barberData.selectedBarber.name}`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  // Handle customer info submission
  const handleCustomerInfoSubmit = (customerInfo) => {
    updateBookingData({ customerInfo }, 3);
    // Don't show toast for auto-save, only for final submission
    if (customerInfo.customerName && customerInfo.customerEmail && customerInfo.customerPhone) {
      toast.success('Contact information saved', {
        position: "top-right",
        autoClose: 1500,
      });
    }
  };

  // Handle booking completion
  const handleBookingComplete = (bookingResult) => {
    console.log('Booking completed:', bookingResult);
    // Could redirect to booking confirmation page or reset form
  };

  // Handle edit step (go back to specific step)
  const handleEditStep = (step) => {
    setCurrentStep(step);
    toast.info(`Editing step ${step + 1}`, {
      position: "top-right",
      autoClose: 1500,
    });
  };

  // Reset subsequent steps when going back
  const resetSubsequentSteps = (fromStep) => {
    const newData = { ...bookingData };
    
    if (fromStep <= 0) {
      newData.service = null;
      newData.timeSlot = null;
      newData.barber = null;
      newData.customerInfo = null;
      newData.isAutoAssign = false;
    } else if (fromStep <= 1) {
      newData.timeSlot = null;
      newData.barber = null;
      newData.customerInfo = null;
      newData.isAutoAssign = false;
    } else if (fromStep <= 2) {
      newData.barber = null;
      newData.customerInfo = null;
      newData.isAutoAssign = false;
    } else if (fromStep <= 3) {
      newData.customerInfo = null;
    }
    
    setBookingData(newData);
  };

  // Handle step click (allow going back)
  const handleStepClick = (step) => {
    if (step < currentStep) {
      setCurrentStep(step);
      resetSubsequentSteps(step);
    }
  };

  // Check if current step is valid/complete
  const isStepComplete = (step) => {
    switch (step) {
      case 0: return bookingData.service !== null;
      case 1: return bookingData.timeSlot !== null;
      case 2: return bookingData.barber !== null || bookingData.isAutoAssign;
      case 3: return bookingData.customerInfo !== null;
      case 4: return true; // Confirmation step
      default: return false;
    }
  };

  // Check if next button should be enabled
  const canProceedToNext = () => {
    return isStepComplete(currentStep);
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    let completedSteps = 0;
    for (let i = 0; i <= currentStep; i++) {
      if (isStepComplete(i)) completedSteps++;
    }
    return (completedSteps / steps.length) * 100;
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={3}>Select Your Service</Title>
            <Text type="secondary">Choose from our available services</Text>
            <ServiceSelectionStep
              onServiceSelect={handleServiceSelect}
              selectedService={bookingData.service}
            />
          </div>
        );
      case 1:
        return (
          <div>
            <Title level={3}>Choose Date & Time</Title>
            <Text type="secondary">Select your preferred appointment time</Text>
            <TimeSlotSelectionStep
              service={bookingData.service}
              barber={bookingData.barber}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedTimeSlot={bookingData.timeSlot}
              isAutoAssign={bookingData.isAutoAssign}
            />
          </div>
        );
      case 2:
        return (
          <div>
            <Title level={3}>Choose Your Barber</Title>
            <Text type="secondary">Select a specific barber or let us assign the best available one</Text>
            <BarberSelectionStep
              service={bookingData.service}
              timeSlot={bookingData.timeSlot}
              onBarberSelect={handleBarberSelect}
              selectedBarber={bookingData.barber}
              isAutoAssign={bookingData.isAutoAssign}
            />
          </div>
        );
      case 3:
        return (
          <div>
            <Title level={3}>Your Information</Title>
            <Text type="secondary">Please provide your contact details</Text>
            <CustomerInfoStep
              service={bookingData.service}
              timeSlot={bookingData.timeSlot}
              barber={bookingData.barber}
              isAutoAssign={bookingData.isAutoAssign}
              onCustomerInfoSubmit={handleCustomerInfoSubmit}
              customerInfo={bookingData.customerInfo}
            />
          </div>
        );
      case 4:
        return (
          <div>
            <Title level={3}>Booking Confirmation</Title>
            <Text type="secondary">Review your booking details and confirm</Text>
            <BookingConfirmationStep
              service={bookingData.service}
              timeSlot={bookingData.timeSlot}
              barber={bookingData.barber}
              isAutoAssign={bookingData.isAutoAssign}
              customerInfo={bookingData.customerInfo}
              onBookingComplete={handleBookingComplete}
              onEditStep={handleEditStep}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="single-page-booking" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <Title level={1}>Book Your Appointment</Title>
        <Text type="secondary">Complete your booking in a few simple steps</Text>
      </div>

      {/* Progress Bar */}
      <Card style={{ marginBottom: '24px' }}>
        <Progress 
          percent={getProgressPercentage()} 
          strokeColor="#1890ff"
          showInfo={false}
          style={{ marginBottom: '16px' }}
        />
        <Steps 
          current={currentStep} 
          size="small"
          onChange={handleStepClick}
          style={{ cursor: 'pointer' }}
        >
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              disabled={index > currentStep && !isStepComplete(index - 1)}
            />
          ))}
        </Steps>
      </Card>

      {/* Main Content */}
      <Card style={{ minHeight: '500px' }}>
        <Spin spinning={loading}>
          {renderStepContent()}
        </Spin>

        <Divider />

        {/* Navigation Buttons */}
        <Row justify="space-between" align="middle">
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={prevStep}
              disabled={currentStep === 0}
              size="large"
            >
              Previous
            </Button>
          </Col>
          
          <Col>
            <Space>
              <Text type="secondary">
                Step {currentStep + 1} of {steps.length}
              </Text>
            </Space>
          </Col>
          
          <Col>
            {currentStep === steps.length - 1 ? (
              <Text type="secondary">
                Use the "Confirm Booking" button above to complete your booking
              </Text>
            ) : (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={nextStep}
                disabled={!canProceedToNext()}
                size="large"
              >
                {currentStep === steps.length - 2 ? 'Review Booking' : 'Next'}
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <Card style={{ marginTop: '24px' }} title="Debug Info">
          <pre>{JSON.stringify(bookingData, null, 2)}</pre>
        </Card>
      )}
    </div>
  );
};

export default SinglePageBooking;
