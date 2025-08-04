import React, { useState, useEffect } from 'react';
import {
  Modal,
  Card,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Row,
  Col,
  Alert,
  Spin,
  Avatar,
  Rate,
  Select,
  message,
  Descriptions,
  Divider,
  Progress
} from 'antd';
import {
  UserOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  UserSwitchOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

const AbsenceApprovalModal = ({ visible, onCancel, onSuccess, absence }) => {
  const [loading, setLoading] = useState(false);
  const [affectedBookings, setAffectedBookings] = useState([]);
  const [bookingActions, setBookingActions] = useState({});
  const [availableBarbers, setAvailableBarbers] = useState({});
  const [loadingBarbers, setLoadingBarbers] = useState({});
  const [processing, setProcessing] = useState(false);

  // Load affected bookings when modal opens
  useEffect(() => {
    if (visible && absence?._id) {
      loadAffectedBookings();
    }
  }, [visible, absence]);

  const loadAffectedBookings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/barber-absences/${absence._id}/affected-bookings`);
      setAffectedBookings(response.data.affectedBookings);
      
      // Initialize booking actions
      const initialActions = {};
      response.data.affectedBookings.forEach(booking => {
        initialActions[booking._id] = { action: null, newBarberId: null };
      });
      setBookingActions(initialActions);
    } catch (error) {
      console.error('Error loading affected bookings:', error);
      message.error('Failed to load affected bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableBarbers = async (booking) => {
    const bookingId = booking._id;
    setLoadingBarbers(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      const bookingDate = new Date(booking.bookingDate);
      const dateStr = bookingDate.toISOString().split('T')[0];
      const timeSlot = bookingDate.toTimeString().substring(0, 5);

      const response = await axios.get('/api/barbers/available-for-customers', {
        params: {
          date: dateStr,
          timeSlot: timeSlot,
          serviceId: booking.serviceId
        }
      });

      setAvailableBarbers(prev => ({
        ...prev,
        [bookingId]: response.data.availableBarbers || []
      }));
    } catch (error) {
      console.error('Error loading available barbers:', error);
      message.error('Failed to load available barbers');
      setAvailableBarbers(prev => ({ ...prev, [bookingId]: [] }));
    } finally {
      setLoadingBarbers(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleBookingAction = (bookingId, action, newBarberId = null) => {
    if (action === 'reject') {
      // For reject action, set with default rejection reason
      setBookingActions(prev => ({
        ...prev,
        [bookingId]: {
          action,
          newBarberId,
          rejectionReason: 'barber_unavailable',
          rejectionNote: 'Booking rejected due to approved barber absence'
        }
      }));
    } else {
      setBookingActions(prev => ({
        ...prev,
        [bookingId]: { action, newBarberId }
      }));
    }
  };

  const handleBarberSelect = (bookingId, barberId) => {
    setBookingActions(prev => ({
      ...prev,
      [bookingId]: { ...prev[bookingId], newBarberId: barberId }
    }));
  };

  const isAllBookingsProcessed = () => {
    return affectedBookings.every(booking =>
      bookingActions[booking._id]?.action &&
      (bookingActions[booking._id].action === 'reject' || bookingActions[booking._id].newBarberId)
    );
  };

  const getProcessedCount = () => {
    return affectedBookings.filter(booking =>
      bookingActions[booking._id]?.action &&
      (bookingActions[booking._id].action === 'reject' || bookingActions[booking._id].newBarberId)
    ).length;
  };

  const handleConfirmApproval = async () => {
    if (!isAllBookingsProcessed()) {
      message.warning('Please process all bookings before confirming approval');
      return;
    }

    setProcessing(true);
    try {
      const actions = Object.entries(bookingActions).map(([bookingId, action]) => ({
        bookingId,
        action: action.action,
        newBarberId: action.newBarberId,
        rejectionReason: action.rejectionReason,
        rejectionNote: action.rejectionNote
      }));

      await axios.put(`/api/barber-absences/${absence._id}/process-approval`, {
        bookingActions: actions
      });

      message.success('Absence approved and bookings processed successfully!');
      onSuccess();
      onCancel();
    } catch (error) {
      console.error('Error processing absence approval:', error);
      message.error(error.response?.data?.message || 'Failed to process absence approval');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      confirmed: 'blue',
      completed: 'green',
      cancelled: 'red',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  const renderBookingCard = (booking) => {
    const action = bookingActions[booking._id];
    const availableBarbersForBooking = availableBarbers[booking._id] || [];
    const isLoadingBarbersForBooking = loadingBarbers[booking._id];

    return (
      <Card
        key={booking._id}
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <CalendarOutlined />
            <Text strong>{dayjs(booking.bookingDate).format('DD/MM/YYYY HH:mm')}</Text>
            <Tag color={getStatusColor(booking.status)}>{booking.status.toUpperCase()}</Tag>
          </Space>
        }
        extra={
          <Space>
            {!action?.action && (
              <>
                <Button
                  size="small"
                  icon={<UserSwitchOutlined />}
                  onClick={() => {
                    handleBookingAction(booking._id, 'reassign');
                    loadAvailableBarbers(booking);
                  }}
                >
                  Reassign
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleBookingAction(booking._id, 'reject')}
                >
                  Reject
                </Button>
              </>
            )}
            {action?.action && (
              <Button
                size="small"
                onClick={() => handleBookingAction(booking._id, null)}
              >
                Reset
              </Button>
            )}
          </Space>
        }
      >
        <Row gutter={16}>
          <Col span={12}>
            <Descriptions size="small" column={1}>
              <Descriptions.Item label="Customer">
                {booking.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="Service">
                {booking.serviceName} ({booking.serviceDuration} mins)
              </Descriptions.Item>
              <Descriptions.Item label="Price">
                {booking.servicePrice?.toLocaleString()} VND
              </Descriptions.Item>
            </Descriptions>
          </Col>
          <Col span={12}>
            {action?.action === 'reassign' && (
              <div>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Select New Barber:
                </Text>
                {isLoadingBarbersForBooking ? (
                  <Spin size="small" />
                ) : (
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Choose a barber"
                    value={action.newBarberId}
                    onChange={(value) => handleBarberSelect(booking._id, value)}
                  >
                    {availableBarbersForBooking.map(barber => (
                      <Option key={barber._id} value={barber._id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Avatar
                              src={barber.profileImageUrl}
                              icon={<UserOutlined />}
                              size="small"
                            />
                            <span>{barber.userId?.name || barber.name}</span>
                          </Space>
                          <Space>
                            <Rate
                              disabled
                              defaultValue={barber.averageRating || 0}
                              style={{ fontSize: '12px' }}
                            />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              ({barber.totalBookings || 0})
                            </Text>
                          </Space>
                        </div>
                      </Option>
                    ))}
                  </Select>
                )}
                {action.newBarberId && (
                  <Tag color="success" style={{ marginTop: 8 }}>
                    <CheckCircleOutlined /> Barber selected
                  </Tag>
                )}
              </div>
            )}
            {action?.action === 'reject' && (
              <Alert
                message="Booking will be rejected"
                description={
                  <div>
                    <div>Customer will be notified about the cancellation</div>
                    <div style={{ marginTop: 4, fontSize: '12px' }}>
                      <strong>Reason:</strong> Barber unavailable due to approved absence
                    </div>
                  </div>
                }
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <CheckCircleOutlined />
          <span>Approve Absence Request</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={processing}
          disabled={!isAllBookingsProcessed()}
          onClick={handleConfirmApproval}
        >
          Confirm Approval
        </Button>
      ]}
    >
      {absence && (
        <div>
          {/* Absence Information */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Barber">
                {absence.barberId?.userId?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                {dayjs(absence.startDate).format('DD/MM/YYYY')} - {dayjs(absence.endDate).format('DD/MM/YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                {absence.reason?.replace('_', ' ')}
              </Descriptions.Item>
              <Descriptions.Item label="Duration">
                {dayjs(absence.endDate).diff(dayjs(absence.startDate), 'day') + 1} days
              </Descriptions.Item>
            </Descriptions>
            {absence.description && (
              <div style={{ marginTop: 8 }}>
                <Text strong>Description: </Text>
                <Text>{absence.description}</Text>
              </div>
            )}
          </Card>

          <Divider />

          {/* Affected Bookings */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0 }}>
              Affected Bookings ({affectedBookings.length})
            </Title>
            {affectedBookings.length > 0 && (
              <div style={{ minWidth: 200 }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Progress: {getProcessedCount()}/{affectedBookings.length}
                </Text>
                <Progress
                  percent={Math.round((getProcessedCount() / affectedBookings.length) * 100)}
                  size="small"
                  status={isAllBookingsProcessed() ? 'success' : 'active'}
                />
              </div>
            )}
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : affectedBookings.length === 0 ? (
            <Alert
              message="No affected bookings"
              description="This absence period has no conflicting bookings."
              type="info"
              showIcon
            />
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {affectedBookings.map(renderBookingCard)}
            </div>
          )}

          {affectedBookings.length > 0 && (
            <Alert
              message="Action Required"
              description={`Please reassign or reject all ${affectedBookings.length} affected bookings before confirming the absence approval.`}
              type="warning"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default AbsenceApprovalModal;
