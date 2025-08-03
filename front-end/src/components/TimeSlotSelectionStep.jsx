import React, { useState, useEffect } from 'react';
import {
  Card,
  Alert,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Divider,
  Button,
  Spin,
  DatePicker,
  Empty,
  Tooltip
} from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { fetchAllAvailableSlots, fetchAvailableSlots, fetchAllSlots, fetchAllSlotsForBarber } from '../services/barberScheduleApi';
import BarberChoiceToggle from './BarberChoiceToggle';
import BarberSelectionInTimeStep from './BarberSelectionInTimeStep';
import './BarberChoiceToggle.css';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TimeSlotSelectionStep = ({
  service,
  barber,
  onTimeSlotSelect,
  selectedTimeSlot,
  isAutoAssign = false,
  onBarberSelect, // New prop to handle barber selection from parent
  refreshTrigger // New prop to trigger refresh when booking is completed
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState('');

  // New state for barber choice mode
  const [chooseBarberManually, setChooseBarberManually] = useState(false);
  const [selectedBarberInStep, setSelectedBarberInStep] = useState(null);

  // Restore previous selections when component mounts or selectedTimeSlot changes
  useEffect(() => {
    if (selectedTimeSlot) {
      // Restore date selection
      if (selectedTimeSlot.date) {
        setSelectedDate(dayjs(selectedTimeSlot.date));
      }

      // Restore barber selection mode and barber
      if (selectedTimeSlot.chooseBarberManually !== undefined) {
        setChooseBarberManually(selectedTimeSlot.chooseBarberManually);
      }

      if (selectedTimeSlot.selectedBarberInStep) {
        setSelectedBarberInStep(selectedTimeSlot.selectedBarberInStep);
      }
    }
  }, [selectedTimeSlot]);

  // Load available slots when date or barber selection changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, chooseBarberManually, selectedBarberInStep]);

  // Refresh slots when refreshTrigger changes (after booking completion)
  useEffect(() => {
    if (refreshTrigger && selectedDate && service) {
      loadAvailableSlots();
    }
  }, [refreshTrigger]);

  // Load available time slots for the selected date
  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError('');

    try {
      const dateString = selectedDate.format('YYYY-MM-DD');
      let response;

      if (chooseBarberManually && selectedBarberInStep) {
        // Load all slots (both available and not available) for specific barber
        response = await fetchAllSlotsForBarber(selectedBarberInStep._id, dateString, {
          serviceId: service?._id,
          durationMinutes: service?.durationMinutes || 30
        });

        if (response.success) {
          setAvailableSlots(response.allSlots || []);
        } else {
          setError(response.message || 'Failed to load slots for selected barber');
          setAvailableSlots([]);
        }
      } else {
        // Load all slots (both available and not available) across all barbers
        response = await fetchAllSlots(dateString, {
          serviceId: service?._id,
          durationMinutes: service?.durationMinutes || 30
        });

        if (response.success) {
          setAvailableSlots(response.allSlots || []);
        } else {
          setError(response.message || 'Failed to load slots');
          setAvailableSlots([]);
        }
      }
    } catch (error) {
      console.error('Error loading available slots:', error);
      setError('Failed to load available time slots. Please try again.');
      setAvailableSlots([]);
      toast.error('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  // Handle date selection
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setAvailableSlots([]);
    setError('');
    // Reset barber selection when date changes
    if (chooseBarberManually) {
      setSelectedBarberInStep(null);
    }
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (!selectedDate) return;

    const dateString = selectedDate.format('YYYY-MM-DD');

    // Determine the barber info based on selection mode
    let barberInfo = null;
    let isAutoAssignMode = !chooseBarberManually;

    if (chooseBarberManually && selectedBarberInStep) {
      barberInfo = {
        id: selectedBarberInStep._id,
        name: selectedBarberInStep.name
      };
      isAutoAssignMode = false;
    }

    // Create enhanced time slot object with additional info
    const enhancedTimeSlot = {
      date: dateString,
      time: slot.time,
      dateTime: `${dateString} ${slot.time}`,
      label: `${selectedDate.format('DD/MM/YYYY')} at ${slot.time}`,
      availableBarberCount: slot.availableBarberCount,
      service: {
        id: service._id,
        name: service.name,
        duration: service.durationMinutes || 30
      },
      barber: barberInfo,
      isAutoAssign: isAutoAssignMode,
      chooseBarberManually: chooseBarberManually,
      selectedBarberInStep: selectedBarberInStep
    };

    onTimeSlotSelect(enhancedTimeSlot);

    // Also notify parent about barber selection if manual mode
    if (chooseBarberManually && selectedBarberInStep && onBarberSelect) {
      onBarberSelect(selectedBarberInStep, false); // false = not auto-assign
    }

    toast.success(`Time slot selected: ${enhancedTimeSlot.label}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Update existing time slot with new barber information
  const updateTimeSlotWithNewBarber = (barber, isAutoAssign) => {
    if (!selectedTimeSlot || !selectedDate) return;

    const dateString = selectedDate.format('YYYY-MM-DD');

    // Determine the barber info
    let barberInfo = null;
    if (!isAutoAssign && barber) {
      barberInfo = {
        id: barber._id,
        name: barber.name
      };
    }

    // Create updated time slot object
    const updatedTimeSlot = {
      ...selectedTimeSlot,
      barber: barberInfo,
      isAutoAssign: isAutoAssign,
      chooseBarberManually: !isAutoAssign,
      selectedBarberInStep: barber
    };

    // Update parent with new time slot data
    onTimeSlotSelect(updatedTimeSlot);
  };

  // Handle barber choice toggle
  const handleBarberChoiceChange = (chooseManually) => {
    setChooseBarberManually(chooseManually);
    setSelectedBarberInStep(null);
    setAvailableSlots([]);
    setError('');

    // Notify parent about the choice change
    if (onBarberSelect) {
      if (chooseManually) {
        onBarberSelect(null, false); // Clear barber selection, not auto-assign
      } else {
        onBarberSelect(null, true); // Clear barber selection, enable auto-assign
      }
    }

    // If we have a previously selected time slot, update it with new barber choice
    if (selectedTimeSlot && selectedDate) {
      updateTimeSlotWithNewBarber(null, !chooseManually);
    }
  };

  // Handle barber selection in time step
  const handleBarberSelectInStep = (barber) => {
    setSelectedBarberInStep(barber);
    setAvailableSlots([]); // Clear slots to reload for selected barber
    setError('');

    // Notify parent about barber selection change
    if (onBarberSelect) {
      onBarberSelect(barber, false); // false = not auto-assign
    }

    // If we have a previously selected time slot, update it with new barber info
    if (selectedTimeSlot && selectedDate) {
      updateTimeSlotWithNewBarber(barber, false);
    }
  };

  // Refresh time slots
  const handleRefresh = () => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  };

  // Disable past dates
  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  if (!service) {
    return (
      <Alert
        message="Service Required"
        description="Please select a service first before choosing a time slot."
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
      />
    );
  }

  return (
    <div className="time-slot-selection-step">
      {/* Service Summary */}
      <Card 
        size="small" 
        style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            Selected Service
          </Space>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={handleRefresh}
            loading={loading}
            size="small"
          >
            Refresh
          </Button>
        }
      >
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space direction="vertical" size="small">
              <Title level={5} style={{ margin: 0 }}>
                {service.name}
              </Title>
              <Space size="small" wrap>
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  {service.durationMinutes || 30} minutes
                </Tag>
                <Tag color="green">
                  {service.price?.toLocaleString()} VND
                </Tag>
                {service.category && (
                  <Tag color="purple">{service.category}</Tag>
                )}
              </Space>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              {service.price?.toLocaleString()} VND
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Duration: {service.durationMinutes || 30} min
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Barber Info (if specific barber selected) */}
      {barber && !isAutoAssign && (
        <Card 
          size="small" 
          style={{ marginBottom: '24px', backgroundColor: '#f6ffed' }}
          title={
            <Space>
              <CalendarOutlined style={{ color: '#52c41a' }} />
              Selected Barber
            </Space>
          }
        >
          <Row align="middle">
            <Col span={16}>
              <Space direction="vertical" size="small">
                <Title level={5} style={{ margin: 0 }}>
                  {barber.name}
                </Title>
                <Space size="small" wrap>
                  {barber.specialties && barber.specialties.map(specialty => (
                    <Tag key={specialty} color="green">{specialty}</Tag>
                  ))}
                  {barber.averageRating && (
                    <Tag color="gold">★ {barber.averageRating.toFixed(1)}</Tag>
                  )}
                </Space>
              </Space>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Text type="secondary">
                {barber.experienceYears} years experience
              </Text>
            </Col>
          </Row>
        </Card>
      )}

      {/* Auto Assignment Info */}
      {isAutoAssign && (
        <Alert
          message="Auto-Assignment Selected"
          description="We'll assign the best available barber for your selected time slot based on ratings and availability."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Current Selection Display */}
      {selectedTimeSlot && (
        <Alert
          message="Current Selection"
          description={
            <Space direction="vertical" size="small">
              <Text strong>
                {selectedTimeSlot.label}
              </Text>
              <Space size="small" wrap>
                <Tag icon={<CalendarOutlined />} color="blue">
                  {selectedTimeSlot.date}
                </Tag>
                <Tag icon={<ClockCircleOutlined />} color="green">
                  {selectedTimeSlot.time}
                </Tag>
                <Tag color="purple">
                  {selectedTimeSlot.service?.duration || service.durationMinutes || 30} minutes
                </Tag>
              </Space>
            </Space>
          }
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Divider orientation="left">
        <Space>
          <ClockCircleOutlined />
          Choose Your Appointment Time
        </Space>
      </Divider>

      {/* Date Selection */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={12}>
            <div>
              <Text strong>Select Date:</Text>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                disabledDate={disabledDate}
                placeholder="Choose appointment date"
                style={{ width: '100%', marginTop: '8px' }}
                size="large"
                format="DD/MM/YYYY"
              />
            </div>
          </Col>
          <Col span={12}>
            <div style={{ textAlign: 'right' }}>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                disabled={!selectedDate}
              >
                Refresh Slots
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Barber Choice Toggle - Only show if date is selected */}
      {selectedDate && (
        <BarberChoiceToggle
          chooseBarberManually={chooseBarberManually}
          onChoiceChange={handleBarberChoiceChange}
          disabled={loading}
        />
      )}

      {/* Barber Selection - Only show if manual choice is enabled and date is selected */}
      {selectedDate && chooseBarberManually && (
        <BarberSelectionInTimeStep
          selectedDate={selectedDate}
          service={service}
          selectedBarber={selectedBarberInStep}
          onBarberSelect={handleBarberSelectInStep}
          disabled={loading}
        />
      )}

      {/* Time Slot Selection */}
      <Card>
        <Spin spinning={loading}>
          {!selectedDate ? (
            <Empty
              description="Please select a date first"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : error ? (
            <Alert
              message="Error Loading Time Slots"
              description={error}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={handleRefresh}>
                  Retry
                </Button>
              }
            />
          ) : availableSlots.length === 0 && !loading ? (
            <Empty
              description="No available time slots for this date"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            <div>
              <Text strong style={{ marginBottom: '16px', display: 'block' }}>
                Available Time Slots for {selectedDate?.format('DD/MM/YYYY')}:
              </Text>
              <Row gutter={[12, 12]}>
                {availableSlots.map((slot) => {
                  const isSelected = selectedTimeSlot?.time === slot.time &&
                                     selectedTimeSlot?.date === selectedDate?.format('YYYY-MM-DD');
                  const isSlotNotAvailable = !slot.available || slot.availableBarberCount === 0;
                  const needsBarberSelection = chooseBarberManually && !selectedBarberInStep;
                  const shouldDisable = isSlotNotAvailable || needsBarberSelection;

                  return (
                    <Col xs={12} sm={8} md={6} lg={4} key={slot.time}>
                      <Tooltip
                        title={
                          needsBarberSelection
                            ? "Please select a barber first"
                            : isSlotNotAvailable
                              ? "This time slot is not available"
                              : slot.label
                        }
                      >
                        <Button
                          type={isSelected ? 'primary' : 'default'}
                          onClick={() => !shouldDisable && handleTimeSlotSelect(slot)}
                          disabled={shouldDisable}
                          className={`slot-button ${isSelected ? 'selected' : ''} ${shouldDisable ? 'disabled-overlay' : ''}`}
                          style={{
                            width: '100%',
                            height: '60px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: shouldDisable ? '#f5f5f5' : undefined,
                            borderColor: shouldDisable ? '#d9d9d9' : undefined,
                            cursor: shouldDisable ? 'not-allowed' : 'pointer'
                          }}
                          icon={isSelected ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                        >
                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                            {slot.time}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            opacity: shouldDisable ? 0.5 : 0.8,
                            color: shouldDisable ? '#999' : 'inherit'
                          }}>
                            {needsBarberSelection
                              ? 'Select barber first'
                              : chooseBarberManually && selectedBarberInStep
                                ? selectedBarberInStep.name
                                : slot.available
                                  ? `${slot.availableBarberCount} available`
                                  : 'Not available'
                            }
                          </div>
                        </Button>
                      </Tooltip>
                    </Col>
                  );
                })}
              </Row>
            </div>
          )}
        </Spin>
      </Card>

      {/* Instructions */}
      <Card 
        size="small" 
        style={{ marginTop: '16px', backgroundColor: '#f0f8ff' }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            Instructions
          </Space>
        }
      >
        <Space direction="vertical" size="small">
          <Text>
            • Select a date from the calendar (past dates are disabled)
          </Text>
          <Text>
            • Choose whether to select a specific barber or use auto-assignment
          </Text>
          {chooseBarberManually ? (
            <>
              <Text>
                • Select a barber from the available list for your chosen date
              </Text>
              <Text>
                • Time slots will show only for your selected barber
              </Text>
            </>
          ) : (
            <>
              <Text>
                • All available time slots across all barbers will be shown
              </Text>
              <Text>
                • We'll automatically assign the best available barber for your selected time
              </Text>
            </>
          )}
          <Text>
            • Available slots are shown in blue, disabled slots are grayed out
          </Text>
          <Text>
            • Bookings must be made at least 30 minutes in advance
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default TimeSlotSelectionStep;
