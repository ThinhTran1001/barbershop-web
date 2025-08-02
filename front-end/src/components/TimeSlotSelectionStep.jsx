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
import { fetchAllAvailableSlots } from '../services/barberScheduleApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const TimeSlotSelectionStep = ({
  service,
  barber,
  onTimeSlotSelect,
  selectedTimeSlot,
  isAutoAssign = false
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [error, setError] = useState('');

  // Load available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  // Load available time slots for the selected date
  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    setError('');

    try {
      const dateString = selectedDate.format('YYYY-MM-DD');
      const response = await fetchAllAvailableSlots(dateString, {
        serviceId: service?._id,
        durationMinutes: service?.durationMinutes || 30
      });

      if (response.success) {
        setAvailableSlots(response.availableSlots || []);
      } else {
        setError(response.message || 'Failed to load available slots');
        setAvailableSlots([]);
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
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slot) => {
    if (!selectedDate) return;

    const dateString = selectedDate.format('YYYY-MM-DD');

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
      barber: barber ? {
        id: barber._id,
        name: barber.name
      } : null,
      isAutoAssign
    };

    onTimeSlotSelect(enhancedTimeSlot);

    toast.success(`Time slot selected: ${enhancedTimeSlot.label}`, {
      position: "top-right",
      autoClose: 2000,
    });
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
                {availableSlots.map((slot) => (
                  <Col xs={12} sm={8} md={6} lg={4} key={slot.time}>
                    <Tooltip title={slot.label}>
                      <Button
                        type={selectedTimeSlot?.time === slot.time ? 'primary' : 'default'}
                        onClick={() => handleTimeSlotSelect(slot)}
                        style={{
                          width: '100%',
                          height: '60px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                        icon={selectedTimeSlot?.time === slot.time ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {slot.time}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {slot.availableBarberCount} available
                        </div>
                      </Button>
                    </Tooltip>
                  </Col>
                ))}
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
            • Available time slots will appear for your selected date
          </Text>
          <Text>
            • Green slots are available, gray slots are already booked
          </Text>
          <Text>
            • Bookings must be made at least 30 minutes in advance
          </Text>
          {isAutoAssign && (
            <Text type="warning">
              • Since you chose auto-assignment, any available slot can be selected
            </Text>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TimeSlotSelectionStep;
