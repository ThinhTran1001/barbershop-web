import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  List,
  Avatar,
  Tag,
  Button,
  Progress,
  Timeline,
  Space,
  message,
  Spin,
  Alert
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  TrophyOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined
} from '@ant-design/icons';
import { getBarberBookings } from '../../services/barberApi.js';
import { updateBookingStatus } from '../../services/serviceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const BarberDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [todayBookings, setTodayBookings] = useState([]);
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    todayTotal: 0,
    todayCompleted: 0,
    todayRevenue: 0,
    weeklyBookings: 0,
    monthlyBookings: 0,
    averageRating: 0,
    totalCustomers: 0,
    pendingBookings: 0
  });

  // Get barber ID from user context
  const [barberId, setBarberId] = useState(null);

  useEffect(() => {
    const storedBarberId = localStorage.getItem('barberId') || user?.barberId;
    if (storedBarberId) {
      setBarberId(storedBarberId);
      loadDashboardData(storedBarberId);
    } else {
      message.error('Barber ID not found. Please contact administrator.');
      setLoading(false);
    }
  }, [user]);

  const loadDashboardData = async (barberId) => {
    setLoading(true);
    try {
      // Load today's bookings
      const today = dayjs().format('YYYY-MM-DD');
      const todayResponse = await getBarberBookings(barberId, {
        startDate: today,
        endDate: today,
        limit: 50
      });
      
      const todayData = todayResponse.bookings || todayResponse;
      setTodayBookings(todayData);

      // Load upcoming bookings (next 7 days)
      const nextWeek = dayjs().add(7, 'days').format('YYYY-MM-DD');
      const upcomingResponse = await getBarberBookings(barberId, {
        startDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        endDate: nextWeek,
        limit: 20
      });
      
      const upcomingData = upcomingResponse.bookings || upcomingResponse;
      setUpcomingBookings(upcomingData);

      // Load recent completed bookings
      const lastWeek = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
      const recentResponse = await getBarberBookings(barberId, {
        startDate: lastWeek,
        endDate: dayjs().subtract(1, 'day').format('YYYY-MM-DD'),
        status: 'completed',
        limit: 10
      });
      
      const recentData = recentResponse.bookings || recentResponse;
      setRecentBookings(recentData);

      // Load monthly data for statistics
      const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
      const monthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
      const monthlyResponse = await getBarberBookings(barberId, {
        startDate: monthStart,
        endDate: monthEnd,
        limit: 200
      });
      
      const monthlyData = monthlyResponse.bookings || monthlyResponse;
      calculateStats(todayData, monthlyData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (todayData, monthlyData) => {
    // Today's stats
    const todayTotal = todayData.length;
    const todayCompleted = todayData.filter(b => b.status === 'completed').length;
    const todayRevenue = todayData
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.serviceId?.price || 0), 0);

    // Weekly stats
    const weekStart = dayjs().startOf('week');
    const weeklyBookings = monthlyData.filter(b => 
      dayjs(b.bookingDate).isAfter(weekStart)
    ).length;

    // Monthly stats
    const monthlyBookings = monthlyData.length;
    const pendingBookings = monthlyData.filter(b => b.status === 'pending').length;

    // Customer stats (unique customers this month)
    const uniqueCustomers = new Set(monthlyData.map(b => b.customerId)).size;

    // Rating calculation (mock for now - would come from feedback system)
    const averageRating = 4.5; // This should come from actual feedback data

    setStats({
      todayTotal,
      todayCompleted,
      todayRevenue,
      weeklyBookings,
      monthlyBookings,
      averageRating,
      totalCustomers: uniqueCustomers,
      pendingBookings
    });
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(true);
    try {
      await updateBookingStatus(bookingId, newStatus);
      message.success(`Booking status updated to ${newStatus}`);
      
      // Reload dashboard data
      if (barberId) {
        loadDashboardData(barberId);
      }
      
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

  const todayCompletionRate = stats.todayTotal > 0 ? (stats.todayCompleted / stats.todayTotal) * 100 : 0;

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>Dashboard - Thợ cắt tóc</Title>
        <Text type="secondary">Chào mừng trở lại! Đây là tổng quan về lịch làm việc của bạn.</Text>
      </div>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={stats.todayCompleted}
              suffix={`/ ${stats.todayTotal}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <Progress 
              percent={todayCompletionRate} 
              size="small" 
              status={todayCompletionRate === 100 ? 'success' : 'active'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={stats.todayRevenue}
              prefix={<DollarOutlined />}
              suffix="đ"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đánh giá trung bình"
              value={stats.averageRating}
              prefix={<StarOutlined />}
              suffix="/ 5"
              precision={1}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ xác nhận"
              value={stats.pendingBookings}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Today's Schedule */}
        <Col xs={24} lg={12}>
          <Card 
            title={`Lịch hẹn hôm nay (${dayjs().format('DD/MM/YYYY')})`}
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/barber/calendar')}
              >
                Xem lịch đầy đủ
              </Button>
            }
          >
            {todayBookings.length === 0 ? (
              <Alert
                message="Không có lịch hẹn nào hôm nay"
                description="Bạn có thể nghỉ ngơi hoặc chuẩn bị cho những ngày tiếp theo."
                type="info"
                showIcon
              />
            ) : (
              <List
                dataSource={todayBookings.slice(0, 5)}
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
                          <div>{booking.serviceId?.name}</div>
                          <Text type="secondary">
                            {booking.serviceId?.durationMinutes || booking.durationMinutes} phút - {booking.serviceId?.price?.toLocaleString()} đ
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Upcoming Bookings */}
        <Col xs={24} lg={12}>
          <Card title="Lịch hẹn sắp tới">
            {upcomingBookings.length === 0 ? (
              <Alert
                message="Không có lịch hẹn sắp tới"
                description="Hãy kiểm tra lại sau hoặc liên hệ với quản lý để biết thêm thông tin."
                type="info"
                showIcon
              />
            ) : (
              <Timeline>
                {upcomingBookings.slice(0, 5).map((booking) => (
                  <Timeline.Item
                    key={booking._id}
                    color={getStatusColor(booking.status)}
                    dot={<ClockCircleOutlined />}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {dayjs(booking.bookingDate).format('DD/MM HH:mm')} - {booking.customerName}
                      </div>
                      <div>{booking.serviceId?.name}</div>
                      <Tag color={getStatusColor(booking.status)} size="small">
                        {getStatusText(booking.status)}
                      </Tag>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </Card>
        </Col>
      </Row>

      {/* Performance Overview */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Thống kê tháng này">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Tổng lịch hẹn"
                  value={stats.monthlyBookings}
                  prefix={<CalendarOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Khách hàng"
                  value={stats.totalCustomers}
                  prefix={<UserOutlined />}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Tuần này"
                  value={stats.weeklyBookings}
                  prefix={<RiseOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Hoàn thành"
                  value={stats.monthlyBookings - stats.pendingBookings}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Hoạt động gần đây">
            <List
              dataSource={recentBookings.slice(0, 5)}
              renderItem={(booking) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div>
                        {booking.customerName} - {booking.serviceId?.name}
                        <Tag color="green" style={{ marginLeft: 8 }}>
                          Hoàn thành
                        </Tag>
                      </div>
                    }
                    description={
                      <Text type="secondary">
                        {dayjs(booking.bookingDate).format('DD/MM/YYYY HH:mm')} - {booking.serviceId?.price?.toLocaleString()} đ
                      </Text>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: 'Chưa có hoạt động nào gần đây' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Thao tác nhanh" style={{ marginTop: 16 }}>
        <Space wrap>
          <Button 
            type="primary" 
            icon={<CalendarOutlined />}
            onClick={() => navigate('/barber/calendar')}
          >
            Xem lịch làm việc
          </Button>
          <Button 
            icon={<UserOutlined />}
            onClick={() => navigate('/barber/customers')}
          >
            Quản lý khách hàng
          </Button>
          <Button 
            icon={<StarOutlined />}
            onClick={() => navigate('/barber/feedback')}
          >
            Xem đánh giá
          </Button>
          <Button 
            icon={<TrophyOutlined />}
            onClick={() => navigate('/barber/performance')}
          >
            Báo cáo hiệu suất
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default BarberDashboard;
