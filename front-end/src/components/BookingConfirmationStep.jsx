import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Divider,
  Tag,
  Alert,
  Descriptions,
  Modal,
  Result,
  Spin
} from 'antd';
import {
  CheckCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import api from '../services/axiosInstance';
import { getAvailableBarbersForCustomers } from '../services/barberApi';

const { Title, Text } = Typography;

const BookingConfirmationStep = ({
  service,
  timeSlot,
  barber,
  isAutoAssign,
  customerInfo,
  onBookingComplete,
  onEditStep
}) => {
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [autoAssignedBarber, setAutoAssignedBarber] = useState(null);
  const [autoAssignLoading, setAutoAssignLoading] = useState(false);

  // Get the actual barber info (from time step selection or regular barber selection)
  const getActualBarber = () => {
    if (timeSlot?.selectedBarberInStep) {
      return timeSlot.selectedBarberInStep;
    }
    return barber;
  };

  // Get the actual auto-assign status
  const getActualAutoAssign = () => {
    if (timeSlot?.chooseBarberManually === false) {
      return true;
    }
    if (timeSlot?.selectedBarberInStep) {
      return false;
    }
    return isAutoAssign;
  };

  const actualBarber = getActualBarber();
  const actualIsAutoAssign = getActualAutoAssign();

  // Auto-assign barber when needed (for preview only, actual assignment happens in backend)
  useEffect(() => {
    const autoAssignBarber = async () => {
      if (actualIsAutoAssign && !autoAssignedBarber && timeSlot && service && !loading) {
        setAutoAssignLoading(true);
        try {

          const response = await getAvailableBarbersForCustomers(
            timeSlot.date,
            timeSlot.time,
            service._id
          );

          if (response.success && response.availableBarbers && response.availableBarbers.length > 0) {
            // Select the best barber (highest rating, most experience, etc.)
            const bestBarber = response.availableBarbers.reduce((best, current) => {
              const bestScore = (best.averageRating || 0) * 0.7 + (best.experienceYears || 0) * 0.3;
              const currentScore = (current.averageRating || 0) * 0.7 + (current.experienceYears || 0) * 0.3;
              return currentScore > bestScore ? current : best;
            });

            setAutoAssignedBarber(bestBarber);
            toast.success(`Auto-assigned barber: ${bestBarber.name}`, {
              position: "top-right",
              autoClose: 3000,
            });
          } else {
            // Don't show error toast - backend will handle auto-assignment during booking
          }
        } catch (error) {
          // Don't show error toast - backend will handle auto-assignment during booking
        } finally {
          setAutoAssignLoading(false);
        }
      }
    };

    autoAssignBarber();
  }, [actualIsAutoAssign, timeSlot, service, autoAssignedBarber, loading]);

  // Get the final barber (manual selection, auto-assigned, or null)
  const getFinalBarber = () => {
    if (actualBarber) return actualBarber;
    if (autoAssignedBarber) return autoAssignedBarber;
    return null;
  };

  const finalBarber = getFinalBarber();
  const finalIsAutoAssign = actualIsAutoAssign && !actualBarber;



  // Calculate total price (could include additional fees in the future)
  const totalPrice = service?.price || 0;

  // Handle booking submission
  const handleConfirmBooking = async () => {
    setLoading(true);

    try {

      // Determine barber ID based on selection mode
      let selectedBarberId = null;
      let autoAssignMode = finalIsAutoAssign;

      // Use final barber (manual selection or auto-assigned)
      if (finalBarber) {
        selectedBarberId = finalBarber._id;
        autoAssignMode = false;
      } else {
        autoAssignMode = true;
      }



      // Prepare booking data for single-page flow
      const bookingData = {
        serviceId: service._id,
        barberId: autoAssignMode ? null : selectedBarberId,
        bookingDate: new Date(`${timeSlot.date}T${timeSlot.time}:00`).toISOString(),
        timeSlot: timeSlot.time,
        date: timeSlot.date,
        durationMinutes: service.durationMinutes || 30,
        note: customerInfo.note || '',
        notificationMethods: customerInfo.notificationMethods || ['email'],
        customerName: customerInfo.customerName,
        customerEmail: customerInfo.customerEmail,
        customerPhone: customerInfo.customerPhone,
        autoAssignBarber: autoAssignMode
      };

      // Test authentication first using the configured api instance
      try {
        await api.get('/auth/me');
      } catch (authError) {
        if (authError.response?.status === 401) {
          toast.error('Your session has expired. Please log in again.');
          setLoading(false);
          return;
        }
      }

      // Use the configured api instance for booking
      const response = await api.post('/bookings/single-page', bookingData);

      if (response.data.success) {
        setBookingResult(response.data);
        toast.success('🎉 Booking created successfully!', {
          position: "top-right",
          autoClose: 3000,
        });

        // Show additional success message with booking details
        setTimeout(() => {
          toast.info(`📅 Your appointment is confirmed for ${timeSlot.date} at ${timeSlot.time}`, {
            position: "top-right",
            autoClose: 5000,
          });
        }, 1000);

        if (onBookingComplete) {
          onBookingComplete(response.data);
        }
      } else {
        throw new Error(response.data.message || 'Booking failed');
      }
    } catch (error) {

      let errorMessage = 'Failed to create booking. Please try again.';

      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid booking data. Please check your information.';
      } else if (error.response?.status === 409) {
        errorMessage = 'Time slot is no longer available. Please select a different time.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`❌ ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  // Show booking success result
  if (bookingResult) {
    return (
      <Result
        status="success"
        title="Booking Confirmed!"
        subTitle={`Your appointment has been successfully booked. Booking ID: ${bookingResult.booking._id}`}
        extra={[
          <Button type="primary" key="new-booking" onClick={() => window.location.reload()}>
            Book Another Appointment
          </Button>,
          <Button key="my-bookings" onClick={() => window.location.href = '/my-booking'}>
            View My Bookings
          </Button>,
        ]}
      >
        <Card style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
          <Descriptions title="Booking Details" bordered column={1}>
            <Descriptions.Item label="Service">
              {bookingResult.bookingDetails.service.name}
            </Descriptions.Item>
            <Descriptions.Item label="Date & Time">
              {bookingResult.bookingDetails.schedule.date} at {bookingResult.bookingDetails.schedule.timeSlot}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {bookingResult.bookingDetails.service.duration} minutes
            </Descriptions.Item>
            <Descriptions.Item label="Barber">
              {bookingResult.bookingDetails.barber.name}
              {bookingResult.bookingDetails.barber.isAutoAssigned && (
                <Tag color="gold" style={{ marginLeft: '8px' }}>Auto-assigned</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Price">
              {bookingResult.bookingDetails.service.price?.toLocaleString()} VND
            </Descriptions.Item>
            <Descriptions.Item label="Customer">
              {bookingResult.bookingDetails.customer.name}
            </Descriptions.Item>
            <Descriptions.Item label="Contact">
              {bookingResult.bookingDetails.customer.email} | {bookingResult.bookingDetails.customer.phone}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Result>
    );
  }

  return (
    <div className="booking-confirmation-step">
      {/* Final Review Header */}
      <Card 
        style={{ marginBottom: '24px', backgroundColor: '#f6ffed' }}
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Review Your Booking
          </Space>
        }
      >
        <Alert
          message="Please review all details before confirming your booking"
          description="Once confirmed, you will receive a confirmation email and can manage your booking from 'My Bookings' page."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      </Card>

      {/* Booking Details */}
      <Row gutter={[16, 16]}>
        {/* Service Details */}
        <Col xs={24} lg={12}>
          <Card 
            title="Service Details"
            extra={
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={() => onEditStep(0)}
                size="small"
              >
                Edit
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>{service?.name}</Title>
                <Text type="secondary">{service?.description}</Text>
              </div>
              
              <Space size="small" wrap>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {service?.durationMinutes || 30} minutes
                </Tag>
                <Tag color="green">
                  {service?.price?.toLocaleString()} VND
                </Tag>
                {service?.category && (
                  <Tag color="purple">{service.category}</Tag>
                )}
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Appointment Details */}
        <Col xs={24} lg={12}>
          <Card
            title="Appointment Details"
            extra={
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => onEditStep(1)}
                size="small"
              >
                Edit
              </Button>
            }
          >
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>{timeSlot?.label}</Title>
              </div>

              <Space size="small" wrap>
                <Tag icon={<CalendarOutlined />} color="blue">
                  {timeSlot?.date}
                </Tag>
                <Tag icon={<ClockCircleOutlined />} color="green">
                  {timeSlot?.time}
                </Tag>
              </Space>

              {/* Barber Information */}
              <Divider style={{ margin: '12px 0' }} />
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  <UserOutlined style={{ marginRight: '8px' }} />
                  Barber
                </Text>
                <div style={{ marginLeft: '24px' }}>
                  <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
                    {autoAssignLoading ? (
                      <Space>
                        <Spin size="small" />
                        Assigning barber...
                      </Space>
                    ) : finalBarber ? (
                      finalBarber.name
                    ) : finalIsAutoAssign ? (
                      'Auto-assigned'
                    ) : (
                      'Barber'
                    )}
                  </Title>
                  {autoAssignLoading ? (
                    <Text type="secondary">Finding the best available barber for you...</Text>
                  ) : finalBarber ? (
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>
                      {finalBarber.experienceYears ? `${finalBarber.experienceYears} years experience` : 'Professional barber'}
                    </Text>
                  ) : finalIsAutoAssign ? (
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Best available barber will be assigned</Text>
                  ) : (
                    <Text type="secondary" style={{ display: 'block', marginBottom: '8px' }}>Professional barber</Text>
                  )}

                  <Space size="small" wrap>
                    {autoAssignLoading ? (
                      <Tag color="processing">Assigning...</Tag>
                    ) : finalBarber ? (
                      <>
                        {finalBarber.averageRating && (
                          <Tag color="gold">★ {finalBarber.averageRating.toFixed(1)}</Tag>
                        )}
                        {finalIsAutoAssign && (
                          <Tag color="green">Auto-assigned</Tag>
                        )}
                        {finalBarber.specialties?.slice(0, 2).map(specialty => (
                          <Tag key={specialty} color="purple">{specialty}</Tag>
                        ))}
                      </>
                    ) : finalIsAutoAssign ? (
                      <Tag color="gold">Auto-assignment</Tag>
                    ) : (
                      <Tag color="default">Manual selection</Tag>
                    )}
                  </Space>
                </div>
              </div>
            </Space>
          </Card>
        </Col>



        {/* Customer Details */}
        <Col xs={24} lg={12}>
          <Card 
            title="Contact Information"
            extra={
              <Button 
                type="link" 
                icon={<EditOutlined />}
                onClick={() => onEditStep(2)}
                size="small"
              >
                Edit
              </Button>
            }
          >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Space>
                <UserOutlined />
                <Text>{customerInfo?.customerName || 'Not provided'}</Text>
              </Space>
              <Space>
                <MailOutlined />
                <Text>{customerInfo?.customerEmail || 'Not provided'}</Text>
              </Space>
              <Space>
                <PhoneOutlined />
                <Text>{customerInfo?.customerPhone || 'Not provided'}</Text>
              </Space>

              {customerInfo?.note && (
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Note:</Text>
                  <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <Text>{customerInfo.note}</Text>
                  </div>
                </div>
              )}

              {customerInfo?.notificationMethods && customerInfo.notificationMethods.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Notification Methods:</Text>
                  <div style={{ marginTop: '4px' }}>
                    {customerInfo.notificationMethods.map(method => (
                      <Tag key={method} color="blue" style={{ marginRight: '4px' }}>
                        {method}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Price Summary */}
      <Card 
        style={{ marginTop: '24px', backgroundColor: '#f0f8ff' }}
        title="Price Summary"
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size="small">
              <Text>Service: {service?.name}</Text>
              <Text type="secondary">Duration: {service?.durationMinutes || 30} minutes</Text>
            </Space>
          </Col>
          <Col>
            <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
              {totalPrice.toLocaleString()} VND
            </Title>
          </Col>
        </Row>
      </Card>

      {/* Confirmation Button */}
      <Card style={{ marginTop: '24px', textAlign: 'center' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>Ready to confirm your booking?</Title>
            <Text type="secondary">
              By confirming, you agree to our terms and conditions. 
              You can cancel or reschedule up to 2 hours before your appointment.
            </Text>
          </div>
          
          <Button
            type="primary"
            size="large"
            icon={loading ? <LoadingOutlined /> : <CheckCircleOutlined />}
            onClick={() => setShowConfirmModal(true)}
            loading={loading}
            style={{ 
              height: '50px', 
              fontSize: '16px', 
              minWidth: '200px',
              background: 'linear-gradient(135deg, #52c41a 0%, #73d13d 100%)',
              border: 'none'
            }}
          >
            Confirm Booking
          </Button>
        </Space>
      </Card>

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Your Booking"
        open={showConfirmModal}
        onOk={handleConfirmBooking}
        onCancel={() => setShowConfirmModal(false)}
        okText="Yes, Confirm Booking"
        cancelText="Cancel"
        confirmLoading={loading}
        icon={<ExclamationCircleOutlined />}
      >
        <Space direction="vertical" size="middle">
          <Text>Are you sure you want to confirm this booking?</Text>
          <div style={{ padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Text strong>{service?.name}</Text><br />
            <Text>{timeSlot?.label}</Text><br />
            <Text>{finalBarber ? finalBarber.name : (finalIsAutoAssign ? 'Auto-assigned barber' : 'Barber')}</Text><br />
            <Text strong style={{ color: '#1890ff' }}>{totalPrice.toLocaleString()} VND</Text>
          </div>
          <Text type="secondary">
            You will receive a confirmation email after booking.
          </Text>
        </Space>
      </Modal>
    </div>
  );
};

export default BookingConfirmationStep;
