import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Spin,
  Alert,
  Empty,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { toast } from 'react-toastify';
import { getAvailableBarbersForCustomers } from '../services/barberApi';
import './BarberChoiceToggle.css';

const { Title, Text } = Typography;

/**
 * BarberSelectionInTimeStep Component
 * 
 * Hiển thị danh sách barber để người dùng chọn trong bước Select Time
 * Chỉ hiển thị khi người dùng chọn checkbox "Choose Barber"
 */
const BarberSelectionInTimeStep = ({
  selectedDate,
  service,
  selectedBarber,
  onBarberSelect,
  disabled = false
}) => {
  const [loading, setLoading] = useState(false);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [error, setError] = useState('');

  // Load available barbers when date changes
  useEffect(() => {
    if (selectedDate && service) {
      loadAvailableBarbers();
    } else {
      setAvailableBarbers([]);
    }
  }, [selectedDate, service]);

  // Load available barbers for the selected date
  const loadAvailableBarbers = async () => {
    if (!selectedDate || !service) return;

    setLoading(true);
    setError('');

    try {
      const dateString = selectedDate.format('YYYY-MM-DD');
      const response = await getAvailableBarbersForCustomers(
        dateString,
        null, // timeSlot - we don't have specific time yet
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

  // Handle barber selection
  const handleBarberSelect = (barber) => {
    onBarberSelect(barber);
    toast.success(`Selected barber: ${barber.name}`, {
      position: "top-right",
      autoClose: 2000,
    });
  };

  // Refresh barbers
  const handleRefresh = () => {
    loadAvailableBarbers();
  };

  if (!selectedDate) {
    return (
      <Alert
        message="Date Required"
        description="Please select a date first to see available barbers."
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
      />
    );
  }

  return (
    <div className="barber-selection-in-time-step fade-in">
      <Card
        title={
          <Space>
            <UserOutlined />
            Choose Your Barber for {selectedDate.format('DD/MM/YYYY')}
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
        style={{ marginBottom: '16px' }}
      >
      <Spin spinning={loading}>
        {error ? (
          <Alert
            message="Error Loading Barbers"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          />
        ) : availableBarbers.length === 0 && !loading ? (
          <Empty
            description="No barbers available for this date"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div>
            <Text style={{ marginBottom: '16px', display: 'block' }}>
              Select a barber to see their available time slots:
            </Text>
            <Row gutter={[16, 16]}>
              {availableBarbers.map((barber) => (
                <Col xs={24} sm={12} md={8} lg={6} key={barber._id}>
                  <Card
                    hoverable
                    className={`barber-card ${selectedBarber?._id === barber._id ? 'selected' : ''}`}
                    onClick={() => !disabled && handleBarberSelect(barber)}
                    style={{
                      border: selectedBarber?._id === barber._id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      backgroundColor: selectedBarber?._id === barber._id ? '#f0f8ff' : 'white',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1
                    }}
                    bodyStyle={{ padding: '12px' }}
                  >
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      {/* Barber Avatar and Name */}
                      <div style={{ textAlign: 'center' }}>
                        <Avatar 
                          size={48} 
                          src={barber.profileImage} 
                          icon={<UserOutlined />}
                          style={{ marginBottom: '8px' }}
                        />
                        <div>
                          <Text strong style={{ fontSize: '14px' }}>
                            {barber.name}
                          </Text>
                          {selectedBarber?._id === barber._id && (
                            <CheckCircleOutlined 
                              style={{ 
                                color: '#1890ff', 
                                marginLeft: '4px',
                                fontSize: '16px'
                              }} 
                            />
                          )}
                        </div>
                      </div>

                      {/* Barber Details */}
                      <div style={{ textAlign: 'center' }}>
                        {/* Rating */}
                        {barber.averageRating && (
                          <div style={{ marginBottom: '4px' }}>
                            <StarOutlined style={{ color: '#faad14' }} />
                            <Text style={{ marginLeft: '4px', fontSize: '12px' }}>
                              {barber.averageRating.toFixed(1)}
                            </Text>
                          </div>
                        )}

                        {/* Experience */}
                        {barber.experienceYears && (
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                            {barber.experienceYears} years experience
                          </Text>
                        )}

                        {/* Specialties */}
                        {barber.specialties && barber.specialties.length > 0 && (
                          <div style={{ marginTop: '6px' }}>
                            {barber.specialties.slice(0, 2).map(specialty => (
                              <Tag 
                                key={specialty} 
                                size="small" 
                                color="blue"
                                style={{ fontSize: '10px', margin: '1px' }}
                              >
                                {specialty}
                              </Tag>
                            ))}
                            {barber.specialties.length > 2 && (
                              <Tooltip title={barber.specialties.slice(2).join(', ')}>
                                <Tag size="small" color="default" style={{ fontSize: '10px' }}>
                                  +{barber.specialties.length - 2}
                                </Tag>
                              </Tooltip>
                            )}
                          </div>
                        )}
                      </div>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )}
      </Spin>
      </Card>
    </div>
  );
};

export default BarberSelectionInTimeStep;
