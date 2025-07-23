import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Calendar,
  Badge,
  Modal,
  List,
  Tag,
  Button,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Space,
  Avatar,
  Descriptions,
  message,
  Spin
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { getBarberBookings } from '../../services/barberApi.js';
import { getBarberCalendar } from '../../services/barberAbsenceApi.js';
import { updateBookingStatus } from '../../services/serviceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUserIdFromToken } from '../../utils/tokenUtils.js';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;

const BarberCalendarPage = () => {
  const { user, getUserId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    pendingBookings: 0
  });

  // Get barber ID from user context (assuming barber profile is linked to user)
  const [barberId, setBarberId] = useState(null);

  useEffect(() => {
    // Get barber ID from multiple sources
    const storedBarberId = localStorage.getItem('barberId') ||
                          user?.barberId ||
                          user?.id ||
                          getUserId() ||
                          getUserIdFromToken();

    if (storedBarberId) {
      setBarberId(storedBarberId);
      loadCalendarData(storedBarberId);
      loadBookings(storedBarberId);
    } else {
      message.error('Barber ID not found. Please contact administrator.');
      setLoading(false);
    }
  }, [user, getUserId]);

  const loadCalendarData = async (userId) => {
    try {
      const currentDate = dayjs();
      const calendarResponse = await getBarberCalendar(
        userId,
        currentDate.month() + 1,
        currentDate.year()
      );
      setCalendarData(calendarResponse);
    } catch (error) {
      console.error('Error loading calendar data:', error);
      message.error('Failed to load calendar data');
    }
  };

  const loadBookings = async (userId) => {
    setLoading(true);
    try {
      // Load bookings for current month
      const startDate = dayjs().startOf('month').format('YYYY-MM-DD');
      const endDate = dayjs().endOf('month').format('YYYY-MM-DD');
      
      const response = await getBarberBookings(userId, {
        startDate,
        endDate,
        limit: 100
      });
      
      const bookingsData = response.bookings || response;
      setBookings(bookingsData);
      
      // Calculate statistics
      calculateStats(bookingsData);
      
    } catch (error) {
      console.error('Error loading bookings:', error);
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const today = dayjs().format('YYYY-MM-DD');
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
    const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD');
    const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
    const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');

    const todayBookings = bookingsData.filter(booking => 
      dayjs(booking.bookingDate).format('YYYY-MM-DD') === today
    ).length;

    const weekBookings = bookingsData.filter(booking => {
      const bookingDate = dayjs(booking.bookingDate).format('YYYY-MM-DD');
      return bookingDate >= weekStart && bookingDate <= weekEnd;
    }).length;

    const monthBookings = bookingsData.filter(booking => {
      const bookingDate = dayjs(booking.bookingDate).format('YYYY-MM-DD');
      return bookingDate >= monthStart && bookingDate <= monthEnd;
    }).length;

    const pendingBookings = bookingsData.filter(booking => 
      booking.status === 'pending'
    ).length;

    setStats({
      todayBookings,
      weekBookings,
      monthBookings,
      pendingBookings
    });
  };

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayBookings = bookings.filter(booking => 
      dayjs(booking.bookingDate).format('YYYY-MM-DD') === dateStr
    );

    const listData = [];

    // Add booking information
    dayBookings.forEach(booking => {
      const statusColor = {
        'pending': 'orange',
        'confirmed': 'blue',
        'completed': 'green',
        'cancelled': 'red',
        'no_show': 'volcano'
      }[booking.status] || 'default';

      listData.push({
        type: statusColor,
        content: `${dayjs(booking.bookingDate).format('HH:mm')} - ${booking.serviceId?.name || 'Service'}`,
        booking: booking
      });
    });

    // Add absence information if available
    if (calendarData) {
      const dayData = calendarData.calendar.find(day => day.date === dateStr);
      if (dayData?.isAbsent) {
        listData.push({
          type: 'error',
          content: `Absent: ${dayData.absenceReason}`,
          isAbsence: true
        });
      }
    }

    return listData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.slice(0, 3).map((item, index) => (
          <li key={index} style={{ marginBottom: 2 }}>
            <Badge 
              status={item.type} 
              text={
                <span style={{ 
                  fontSize: '10px', 
                  cursor: item.booking ? 'pointer' : 'default',
                  textDecoration: item.booking ? 'underline' : 'none'
                }}>
                  {item.content}
                </span>
              }
            />
          </li>
        ))}
        {listData.length > 3 && (
          <li>
            <Badge 
              status="default" 
              text={<span style={{ fontSize: '10px' }}>+{listData.length - 3} more</span>}
            />
          </li>
        )}
      </ul>
    );
  };

  const onSelect = (value) => {
    setSelectedDate(value);
    const dateStr = value.format('YYYY-MM-DD');
    const dayBookings = bookings.filter(booking => 
      dayjs(booking.bookingDate).format('YYYY-MM-DD') === dateStr
    );
    setSelectedDateBookings(dayBookings);
    setModalVisible(true);
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(true);
    try {
      await updateBookingStatus(bookingId, newStatus);
      message.success(`Booking status updated to ${newStatus}`);
      
      // Reload bookings
      if (barberId) {
        loadBookings(barberId);
      }
      
      // Update the selected date bookings
      const updatedBookings = selectedDateBookings.map(booking => 
        booking._id === bookingId ? { ...booking, status: newStatus } : booking
      );
      setSelectedDateBookings(updatedBookings);
      
    } catch (error) {
      message.error('Failed to update booking status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'orange',
      'confirmed': 'blue',
      'completed': 'green',
      'cancelled': 'red',
      'no_show': 'volcano'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'completed': 'Hoàn thành',
      'cancelled': 'Đã hủy',
      'no_show': 'Không đến'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2}>
        <CalendarOutlined /> Lịch làm việc của tôi
      </Title>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={stats.todayBookings}
              prefix={<CalendarOutlined />}
              suffix="lịch hẹn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tuần này"
              value={stats.weekBookings}
              prefix={<ClockCircleOutlined />}
              suffix="lịch hẹn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tháng này"
              value={stats.monthBookings}
              prefix={<CheckCircleOutlined />}
              suffix="lịch hẹn"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ xác nhận"
              value={stats.pendingBookings}
              prefix={<ExclamationCircleOutlined />}
              suffix="lịch hẹn"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar */}
      <Card title="Lịch làm việc" style={{ marginBottom: 24 }}>
        <Calendar
          cellRender={dateCellRender}
          onSelect={onSelect}
          headerRender={({ value, type, onChange, onTypeChange }) => (
            <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                {value.format('MMMM YYYY')}
              </Title>
              <Space>
                <Button 
                  onClick={() => onChange(value.clone().subtract(1, 'month'))}
                >
                  Tháng trước
                </Button>
                <Button 
                  onClick={() => onChange(dayjs())}
                >
                  Hôm nay
                </Button>
                <Button 
                  onClick={() => onChange(value.clone().add(1, 'month'))}
                >
                  Tháng sau
                </Button>
              </Space>
            </div>
          )}
        />
      </Card>

      {/* Today's Schedule */}
      <Card title={`Lịch hẹn hôm nay - ${dayjs().format('DD/MM/YYYY')}`}>
        <List
          dataSource={bookings.filter(booking => 
            dayjs(booking.bookingDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
          )}
          renderItem={(booking) => (
            <List.Item
              actions={[
                booking.status === 'pending' && (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleBookingStatusUpdate(booking._id, 'confirmed')}
                    loading={actionLoading}
                  >
                    Xác nhận
                  </Button>
                ),
                booking.status === 'confirmed' && (
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleBookingStatusUpdate(booking._id, 'completed')}
                    loading={actionLoading}
                  >
                    Hoàn thành
                  </Button>
                ),
                (booking.status === 'pending' || booking.status === 'confirmed') && (
                  <Button
                    size="small"
                    danger
                    onClick={() => handleBookingStatusUpdate(booking._id, 'no_show')}
                    loading={actionLoading}
                  >
                    Không đến
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <div>
                    <span style={{ fontWeight: 'bold' }}>
                      {dayjs(booking.bookingDate).format('HH:mm')} - {booking.customerName}
                    </span>
                    <Tag color={getStatusColor(booking.status)} style={{ marginLeft: 8 }}>
                      {getStatusText(booking.status)}
                    </Tag>
                  </div>
                }
                description={
                  <div>
                    <div><strong>Dịch vụ:</strong> {booking.serviceId?.name}</div>
                    <div><strong>Thời gian:</strong> {booking.serviceId?.durationMinutes || booking.durationMinutes} phút</div>
                    <div><strong>Giá:</strong> {booking.serviceId?.price?.toLocaleString()} đ</div>
                    {booking.note && <div><strong>Ghi chú:</strong> {booking.note}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Không có lịch hẹn nào hôm nay' }}
        />
      </Card>

      {/* Selected Date Modal */}
      <Modal
        title={`Lịch hẹn ngày ${selectedDate.format('DD/MM/YYYY')}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <List
          dataSource={selectedDateBookings}
          renderItem={(booking) => (
            <List.Item
              actions={[
                booking.status === 'pending' && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleBookingStatusUpdate(booking._id, 'confirmed')}
                    loading={actionLoading}
                  >
                    Xác nhận
                  </Button>
                ),
                booking.status === 'confirmed' && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleBookingStatusUpdate(booking._id, 'completed')}
                    loading={actionLoading}
                  >
                    Hoàn thành
                  </Button>
                ),
                (booking.status === 'pending' || booking.status === 'confirmed') && (
                  <Button
                    size="small"
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleBookingStatusUpdate(booking._id, 'no_show')}
                    loading={actionLoading}
                  >
                    Không đến
                  </Button>
                )
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <div>
                    <span style={{ fontWeight: 'bold' }}>
                      {dayjs(booking.bookingDate).format('HH:mm')} - {booking.customerName}
                    </span>
                    <Tag color={getStatusColor(booking.status)} style={{ marginLeft: 8 }}>
                      {getStatusText(booking.status)}
                    </Tag>
                  </div>
                }
                description={
                  <Descriptions size="small" column={1}>
                    <Descriptions.Item label="Dịch vụ">
                      {booking.serviceId?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thời gian">
                      {booking.serviceId?.durationMinutes || booking.durationMinutes} phút
                    </Descriptions.Item>
                    <Descriptions.Item label="Giá">
                      {booking.serviceId?.price?.toLocaleString()} đ
                    </Descriptions.Item>
                    <Descriptions.Item label="Liên hệ">
                      {booking.customerEmail} | {booking.customerPhone}
                    </Descriptions.Item>
                    {booking.note && (
                      <Descriptions.Item label="Ghi chú">
                        {booking.note}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                }
              />
            </List.Item>
          )}
          locale={{ emptyText: 'Không có lịch hẹn nào trong ngày này' }}
        />
      </Modal>
    </div>
  );
};

export default BarberCalendarPage;
