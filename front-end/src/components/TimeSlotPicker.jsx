import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  DatePicker,
  Typography,
  Row,
  Col,
  Button,
  Spin,
  Alert,
  Tag,
  Tooltip,
  Modal,
  Space,
  Divider,
  Empty
} from 'antd';
import { toast } from 'react-toastify';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
  UserDeleteOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { fetchAvailableSlots, checkBarberOff, validateTimeSlotAvailability } from '../services/barberScheduleApi';

const { Title, Text } = Typography;

const TimeSlotPicker = ({ barberId, serviceId, durationMinutes, onSelect }) => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [isOff, setIsOff] = useState(false);
  const [offReason, setOffReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [validatingSlot, setValidatingSlot] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingSlot, setPendingSlot] = useState(null);

  // Ensure durationMinutes has a default value
  const serviceDuration = durationMinutes || 30;

  // Get customer ID from token for conflict checking
  const getCustomerId = () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.id || payload._id || payload.userId;
      }
    } catch (e) {
      console.warn('Could not extract customer ID from token:', e);
    }
    return null;
  };

  const customerId = getCustomerId();

  // Debug logging
  console.log('TimeSlotPicker props:', { barberId, serviceId, durationMinutes, serviceDuration, customerId });

  // Load available slots when barberId or date changes
  const loadAvailableSlots = useCallback(async () => {
    if (!barberId || !selectedDate) return;

    const dateString = selectedDate.format('YYYY-MM-DD');

    setLoading(true);
    setError('');
    setSlots([]);
    setIsOff(false);
    setOffReason('');

    try {
      // Check if barber is off
      const offRes = await checkBarberOff(barberId, dateString);
      if (offRes.isOff) {
        setIsOff(true);
        setOffReason(offRes.reason || 'day off');
        setSlots([]);

        // Show toast notification based on reason
        if (offRes.reason === 'absence') {
          toast.warn('⚠️ Barber is unavailable due to approved absence', {
            position: "top-right",
            autoClose: 4000,
          });
        } else {
          toast.warn(`⚠️ Barber is not working on this date (${offRes.reason || 'day off'})`, {
            position: "top-right",
            autoClose: 4000,
          });
        }

        setLoading(false);
        return;
      }

      // Fetch available slots with customer ID for conflict checking
      const slotsData = await fetchAvailableSlots(barberId, dateString, {
        serviceId,
        durationMinutes: serviceDuration,
        customerId
      });

      if (!slotsData.available) {
        setError(slotsData.reason || 'No slots available');
        setSlots([]);
      } else {
        setSlots(slotsData.slots);
        if (slotsData.slots.length > 0) {
          toast.success(`✅ Found ${slotsData.slots.length} available time slots`, {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: true,
          });
        }
      }
    } catch (error) {
      console.error('Error loading slots:', error);
      setError('Failed to fetch available slots');
      toast.error('Failed to load available time slots. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [barberId, selectedDate, serviceId, serviceDuration, customerId]);

  useEffect(() => {
    loadAvailableSlots();
  }, [loadAvailableSlots]);

  const handleSlotSelect = (slot) => {
    setPendingSlot(slot);
    setConfirmModalVisible(true);
  };

  const confirmSlotSelection = async () => {
    if (!pendingSlot || !selectedDate) return;

    setValidatingSlot(pendingSlot);
    setConfirmModalVisible(false);

    try {
      const dateString = selectedDate.format('YYYY-MM-DD');
      const bookingDateTime = new Date(`${dateString}T${pendingSlot}:00.000Z`);

      const validation = await validateTimeSlotAvailability({
        barberId,
        bookingDate: bookingDateTime.toISOString(),
        durationMinutes: serviceDuration,
        customerId
      });

      if (!validation.available) {
        // Show error message based on conflict type
        if (validation.conflictType === 'CUSTOMER_CONFLICT') {
          toast.error(`You already have a booking with ${validation.conflictingBooking?.barberName || 'another barber'} at this time`, {
            position: "top-right",
            autoClose: 5000,
          });
        } else if (validation.conflictType === 'BARBER_CONFLICT') {
          toast.error('This time slot is no longer available', {
            position: "top-right",
            autoClose: 4000,
          });
        } else {
          toast.error(validation.reason || 'Time slot is no longer available', {
            position: "top-right",
            autoClose: 4000,
          });
        }

        // Refresh slots to show current availability
        await loadAvailableSlots();
        setValidatingSlot(null);
        setPendingSlot(null);
        return;
      }

      setSelectedSlot(pendingSlot);

      // Create selected datetime object
      const selectedDateTime = {
        date: dateString,
        time: pendingSlot,
        dateTime: `${dateString} ${pendingSlot}`,
        label: `${selectedDate.format('DD/MM/YYYY')} at ${pendingSlot}`,
        barberId,
        serviceId,
        durationMinutes: serviceDuration
      };

      toast.success('🎉 Time slot selected successfully!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      if (onSelect) onSelect(selectedDateTime);
    } catch (error) {
      console.error('Error validating slot:', error);
      toast.error('Failed to validate time slot. Please try again.', {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setValidatingSlot(null);
      setPendingSlot(null);
    }
  };

  // Helper function to get slot status
  const getSlotStatus = (slot) => {
    if (selectedSlot === slot) return 'selected';
    if (validatingSlot === slot) return 'validating';
    return 'available';
  };

  // Helper function to calculate end time
  const calculateEndTime = (startTime) => {
    const start = dayjs(`2000-01-01 ${startTime}`);
    const end = start.add(serviceDuration, 'minute');
    return end.format('HH:mm');
  };

  // Disable past dates
  const disabledDate = (current) => {
    const isPastDate = current && current < dayjs().startOf('day');
    if (isPastDate && current.isAfter(dayjs().subtract(1, 'day'))) {
      // Show toast for dates that are just past (yesterday or today before current time)
      toast.warn('📅 Past dates cannot be selected for booking', {
        position: "top-right",
        autoClose: 3000,
        toastId: 'past-date-warning', // Prevent duplicate toasts
      });
    }
    return isPastDate;
  };

  return (
    <Card
      style={{
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        border: '1px solid #f0f0f0'
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          Select Date & Time
        </Title>

        {serviceDuration && (
          <div style={{ marginTop: 8 }}>
            <Tag color="blue" icon={<ClockCircleOutlined />}>
              Service Duration: {serviceDuration} minutes
            </Tag>
            {serviceDuration > 30 && (
              <Tag color="orange" style={{ marginLeft: 8 }}>
                Will reserve {Math.ceil(serviceDuration / 30)} time slots
              </Tag>
            )}
          </div>
        )}
      </div>

      {/* Date Selection */}
      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>
          Choose Date:
        </Text>
        <DatePicker
          value={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setSelectedSlot('');
            setError('');
            if (date) {
              toast.info(`📅 Date selected: ${date.format('DD/MM/YYYY')}`, {
                position: "top-right",
                autoClose: 2000,
                hideProgressBar: true,
              });
            }
          }}
          disabledDate={disabledDate}
          placeholder="Select a date"
          style={{ width: '100%' }}
          size="large"
          format="DD/MM/YYYY"
          allowClear={false}
        />
        <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
          <InfoCircleOutlined style={{ marginRight: 4 }} />
          Past dates are disabled for booking
        </Text>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading available time slots...</Text>
          </div>
        </div>
      )}

      {/* Barber Off Day */}
      {isOff && !loading && (
        <Alert
          message="Barber Unavailable"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>
                {offReason === 'absence' ? (
                  <>
                    <UserDeleteOutlined style={{ marginRight: 8 }} />
                    This barber is not available on the selected date due to approved absence.
                  </>
                ) : (
                  <>
                    <ExclamationCircleOutlined style={{ marginRight: 8 }} />
                    This barber is not working on the selected date ({offReason}).
                  </>
                )}
              </div>
              <Button
                type="link"
                size="small"
                onClick={loadAvailableSlots}
                icon={<ReloadOutlined />}
              >
                Check Again
              </Button>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert
          message="Unable to Load Time Slots"
          description={
            <div>
              <div style={{ marginBottom: 8 }}>{error}</div>
              <Button
                type="primary"
                size="small"
                onClick={loadAvailableSlots}
                icon={<ReloadOutlined />}
              >
                Try Again
              </Button>
            </div>
          }
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Time Slots */}
      {!loading && !isOff && !error && selectedDate && (
        <div>
          <Divider />

          {slots.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text>No available time slots for this date</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    All slots are booked or unavailable
                  </Text>
                </div>
              }
            >
              <Button
                type="primary"
                onClick={loadAvailableSlots}
                icon={<ReloadOutlined />}
              >
                Refresh Availability
              </Button>
            </Empty>
          ) : (
            <div>
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong>
                  Available Time Slots ({slots.length})
                </Text>
                <Button
                  type="text"
                  size="small"
                  onClick={loadAvailableSlots}
                  icon={<ReloadOutlined />}
                >
                  Refresh
                </Button>
              </div>

              {serviceDuration > 30 && (
                <Alert
                  message={`Extended Service Notice`}
                  description={`This ${serviceDuration}-minute service will reserve ${Math.ceil(serviceDuration / 30)} consecutive time slots.`}
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}

              <Row gutter={[12, 12]}>
                {slots.map(slot => {
                  const status = getSlotStatus(slot);
                  const endTime = calculateEndTime(slot);

                  return (
                    <Col xs={12} sm={8} md={6} key={slot}>
                      <Card
                        hoverable={status === 'available'}
                        onClick={() => status === 'available' ? handleSlotSelect(slot) : null}
                        style={{
                          textAlign: 'center',
                          cursor: status === 'available' ? 'pointer' : 'default',
                          border: status === 'selected' ? '2px solid #52c41a' : '1px solid #d9d9d9',
                          backgroundColor:
                            status === 'selected' ? '#f6ffed' :
                            status === 'validating' ? '#f0f0f0' : 'white',
                          transition: 'all 0.3s ease',
                          opacity: status === 'validating' ? 0.7 : 1
                        }}
                        styles={{ body: { padding: '12px 8px' } }}
                      >
                        <div>
                          <Text strong style={{
                            fontSize: '16px',
                            color: status === 'selected' ? '#52c41a' : '#1890ff'
                          }}>
                            {slot}
                          </Text>

                          {serviceDuration > 30 && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: '11px' }}>
                                to {endTime}
                              </Text>
                            </div>
                          )}

                          <div style={{ marginTop: 8 }}>
                            {status === 'selected' && (
                              <Tag color="success" icon={<CheckCircleOutlined />}>
                                Selected
                              </Tag>
                            )}
                            {status === 'validating' && (
                              <Tag color="processing">
                                <Spin size="small" style={{ marginRight: 4 }} />
                                Validating
                              </Tag>
                            )}
                            {status === 'available' && (
                              <Tag color="blue">
                                Available
                              </Tag>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Confirm Time Slot Selection
          </div>
        }
        open={confirmModalVisible}
        onOk={confirmSlotSelection}
        onCancel={() => {
          setConfirmModalVisible(false);
          setPendingSlot(null);
        }}
        okText="Confirm Selection"
        cancelText="Cancel"
        okButtonProps={{
          type: 'primary',
          icon: <CheckCircleOutlined />
        }}
      >
        {pendingSlot && selectedDate && (
          <div>
            <Text>You are about to select the following time slot:</Text>

            <Card style={{ margin: '16px 0', backgroundColor: '#f6ffed' }}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <Text strong>Date: </Text>
                  <Text>{selectedDate.format('dddd, MMMM DD, YYYY')}</Text>
                </div>

                <div>
                  <ClockCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <Text strong>Time: </Text>
                  <Text>{pendingSlot}</Text>
                  {serviceDuration > 30 && (
                    <Text type="secondary"> - {calculateEndTime(pendingSlot)}</Text>
                  )}
                </div>

                <div>
                  <InfoCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                  <Text strong>Duration: </Text>
                  <Text>{serviceDuration} minutes</Text>
                </div>
              </Space>
            </Card>

            <Text type="secondary" style={{ fontSize: '12px' }}>
              Please confirm your selection. This time slot will be reserved for your booking.
            </Text>
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default TimeSlotPicker;

