import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Avatar,
  Tag,
  Rate,
  Space,
  Alert,
  Spin,
  Empty,
  Divider,
  Badge,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  StarOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getAvailableBarbersForCustomers } from '../services/barberApi';

const { Title, Text } = Typography;

const BarberSelectionStep = ({ 
  service, 
  timeSlot, 
  onBarberSelect, 
  selectedBarber,
  isAutoAssign = false 
}) => {
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [error, setError] = useState('');

  // Load available barbers when timeSlot changes
  useEffect(() => {
    if (timeSlot && service) {
      loadAvailableBarbers();
    }
  }, [timeSlot, service]);

  // Load available barbers for the selected time slot
  const loadAvailableBarbers = async () => {
    if (!timeSlot || !service) return;

    setLoading(true);
    setError('');
    
    try {
      const response = await getAvailableBarbersForCustomers(
        timeSlot.date,
        timeSlot.time,
        service._id
      );

      if (response.success) {
        setAvailableBarbers(response.availableBarbers || []);
      } else {
        setError(response.message || 'Failed to load available barbers');
        setAvailableBarbers([]);
      }
    } catch (error) {
      console.error('Error loading available barbers:', error);
      setError('Failed to load available barbers. Please try again.');
      setAvailableBarbers([]);
      toast.error('Failed to load available barbers');
    } finally {
      setLoading(false);
    }
  };

  // Handle auto-assignment
  const handleAutoAssign = async () => {
    if (!timeSlot || !service) return;

    setAutoAssigning(true);
    
    try {
      const response = await axios.post('/api/barbers/auto-assign-for-slot', {
        date: timeSlot.date,
        timeSlot: timeSlot.time,
        serviceId: service._id
      });

      if (response.data.success) {
        const assignedBarber = response.data.assignedBarber;
        
        // Create auto-assignment object
        const autoAssignmentData = {
          isAutoAssign: true,
          assignedBarber: assignedBarber,
          assignmentDetails: response.data.assignmentDetails,
          alternativeBarbers: response.data.alternativeBarbers
        };

        onBarberSelect(autoAssignmentData);
        
        toast.success(`Auto-assigned: ${assignedBarber.name}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(response.data.message || 'Auto-assignment failed');
      }
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      toast.error('Auto-assignment failed. Please try again.');
    } finally {
      setAutoAssigning(false);
    }
  };

  // Handle specific barber selection
  const handleBarberSelect = (barber) => {
    const barberData = {
      isAutoAssign: false,
      selectedBarber: barber
    };

    onBarberSelect(barberData);
    
    toast.success(`Selected barber: ${barber.name}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Render barber card
  const renderBarberCard = (barber, isSelected = false) => (
    <Card
      key={barber._id}
      hoverable
      className={`barber-card ${isSelected ? 'selected' : ''}`}
      onClick={() => handleBarberSelect(barber)}
      style={{
        marginBottom: '16px',
        border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
        backgroundColor: isSelected ? '#f0f8ff' : 'white',
        cursor: 'pointer'
      }}
      bodyStyle={{ padding: '16px' }}
    >
      <Row align="middle" gutter={16}>
        <Col span={6}>
          <Avatar
            size={64}
            src={barber.profileImageUrl}
            icon={<UserOutlined />}
            style={{ backgroundColor: '#1890ff' }}
          />
        </Col>
        
        <Col span={18}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div>
              <Title level={5} style={{ margin: 0, marginBottom: '4px' }}>
                {barber.name}
              </Title>
              <Space size="small" wrap>
                <Rate 
                  disabled 
                  defaultValue={barber.averageRating || 0} 
                  style={{ fontSize: '14px' }}
                />
                <Text type="secondary">({barber.averageRating?.toFixed(1) || 'No rating'})</Text>
              </Space>
            </div>
            
            <Space size="small" wrap>
              <Tag icon={<ClockCircleOutlined />} color="blue">
                {barber.experienceYears || 0} years
              </Tag>
              <Tag icon={<TeamOutlined />} color="green">
                {barber.totalBookings || 0} bookings
              </Tag>
              {barber.specialties && barber.specialties.slice(0, 2).map(specialty => (
                <Tag key={specialty} color="purple">{specialty}</Tag>
              ))}
            </Space>
            
            {barber.availabilityStatus && (
              <Badge 
                status="success" 
                text="Available for this time slot"
                style={{ fontSize: '12px' }}
              />
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );

  if (!timeSlot || !service) {
    return (
      <Alert
        message="Time Slot Required"
        description="Please select a time slot first before choosing a barber."
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
      />
    );
  }

  return (
    <div className="barber-selection-step">
      {/* Time Slot Summary */}
      <Card 
        size="small" 
        style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
        title={
          <Space>
            <CalendarOutlined style={{ color: '#1890ff' }} />
            Selected Time Slot
          </Space>
        }
      >
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space direction="vertical" size="small">
              <Text strong>{timeSlot.label}</Text>
              <Space size="small" wrap>
                <Tag icon={<CalendarOutlined />} color="blue">
                  {timeSlot.date}
                </Tag>
                <Tag icon={<ClockCircleOutlined />} color="green">
                  {timeSlot.time}
                </Tag>
                <Tag color="purple">
                  {service.durationMinutes || 30} minutes
                </Tag>
              </Space>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Text type="secondary">
              Service: {service.name}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Current Selection Display */}
      {(selectedBarber || isAutoAssign) && (
        <Alert
          message="Current Selection"
          description={
            isAutoAssign ? (
              <Space direction="vertical" size="small">
                <Text strong>Auto-Assignment Selected</Text>
                {selectedBarber?.assignedBarber && (
                  <Text>Assigned: {selectedBarber.assignedBarber.name}</Text>
                )}
              </Space>
            ) : (
              <Text strong>
                Selected Barber: {selectedBarber?.selectedBarber?.name || selectedBarber?.name}
              </Text>
            )
          }
          type="success"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Auto-Assignment Option */}
      <Card 
        style={{ marginBottom: '24px', backgroundColor: '#fff7e6' }}
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#faad14' }} />
            Quick Option: Auto-Assignment
          </Space>
        }
      >
        <Row align="middle" justify="space-between">
          <Col span={16}>
            <Space direction="vertical" size="small">
              <Text strong>Let us choose the best barber for you</Text>
              <Text type="secondary">
                We'll automatically assign the highest-rated available barber based on 
                their rating, experience, and current workload.
              </Text>
            </Space>
          </Col>
          <Col span={8} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleAutoAssign}
              loading={autoAssigning}
              size="large"
              style={{ 
                background: 'linear-gradient(135deg, #faad14 0%, #ffc53d 100%)',
                border: 'none'
              }}
            >
              Auto-Assign
            </Button>
          </Col>
        </Row>
      </Card>

      <Divider orientation="left">
        <Space>
          <UserOutlined />
          Or Choose a Specific Barber
        </Space>
      </Divider>

      {/* Available Barbers */}
      <Card 
        title={`Available Barbers (${availableBarbers.length})`}
        loading={loading}
      >
        {error && (
          <Alert
            message="Error Loading Barbers"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" onClick={loadAvailableBarbers}>
                Retry
              </Button>
            }
          />
        )}

        {!loading && !error && availableBarbers.length === 0 && (
          <Empty 
            description="No barbers available for this time slot"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}

        {!loading && !error && availableBarbers.length > 0 && (
          <Row gutter={[16, 16]}>
            {availableBarbers.map(barber => (
              <Col xs={24} sm={12} lg={8} key={barber._id}>
                {renderBarberCard(
                  barber, 
                  selectedBarber?.selectedBarber?._id === barber._id
                )}
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Instructions */}
      <Card 
        size="small" 
        style={{ marginTop: '16px', backgroundColor: '#f0f8ff' }}
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            How to Choose
          </Space>
        }
      >
        <Space direction="vertical" size="small">
          <Text>
            • <strong>Auto-Assignment:</strong> Quick option - we'll choose the best available barber
          </Text>
          <Text>
            • <strong>Specific Barber:</strong> Browse and select a barber based on their profile and ratings
          </Text>
          <Text>
            • All shown barbers are confirmed available for your selected time slot
          </Text>
          <Text type="secondary">
            • Ratings are based on customer feedback and booking history
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default BarberSelectionStep;
