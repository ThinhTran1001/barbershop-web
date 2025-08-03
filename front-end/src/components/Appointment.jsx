import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Input,
  Button,
  Avatar,
  Progress,
  Divider,
  Alert,
  Spin,
  Tooltip
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  TrophyOutlined,
  StarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/plots';
import dayjs from 'dayjs';
import { getAllBookings, getBookingStats, getAllBarber, getAllServices } from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

const AdminBookingDashboard = () => {
  const [loading, setLoading] = useState(false);

  // Helper function to ensure array
  const ensureArray = (data) => Array.isArray(data) ? data : [];
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      todayBookings: 0,
      completedBookings: 0,
      pendingBookings: 0,
      cancelledBookings: 0,
      todayRevenue: 0,
      weekRevenue: 0,
      monthRevenue: 0,
      totalCustomers: 0,
      activeBarbers: 0,
      inactiveBarbers: 0
    },
    todayBookings: [],
    revenueChart: [],
    bookingChart: [],
    statusChart: [],
    barberPerformance: [],
    topCustomers: [],
    topBarbers: []
  });

  // Filters
  const [filters, setFilters] = useState({
    dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
    barber: null,
    service: null,
    status: null,
    searchText: ''
  });

  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [filterLoading, setFilterLoading] = useState(false);

  // Apply filters to all bookings
  const applyFilters = useCallback(() => {
    let filtered = [...allBookings];

    // Filter by date range
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = filters.dateRange[0].startOf('day');
      const endDate = filters.dateRange[1].endOf('day');
      filtered = filtered.filter(booking => {
        const bookingDate = dayjs(booking.bookingDate);
        return bookingDate.isAfter(startDate) && bookingDate.isBefore(endDate);
      });
    }

    // Filter by barber
    if (filters.barber) {
      filtered = filtered.filter(booking =>
        booking.barberId?._id === filters.barber ||
        booking.barberId?.userId?._id === filters.barber
      );
    }

    // Filter by service
    if (filters.service) {
      filtered = filtered.filter(booking => booking.serviceId?._id === filters.service);
    }

    // Filter by status
    if (filters.status) {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(booking =>
        (booking.customerId?.name || booking.customerInfo?.customerName || '').toLowerCase().includes(searchLower) ||
        (booking.customerId?.phone || booking.customerInfo?.customerPhone || '').toLowerCase().includes(searchLower) ||
        (booking.customerId?.email || booking.customerInfo?.customerEmail || '').toLowerCase().includes(searchLower) ||
        (booking.serviceId?.name || '').toLowerCase().includes(searchLower) ||
        (booking.barberId?.userId?.name || booking.barberId?.name || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredBookings(filtered);
  }, [allBookings, filters]);

  useEffect(() => {
    loadDashboardData();
    loadBarbers();
    loadServices();
    loadAllBookings();
  }, []);

  // Auto-apply filters when allBookings or filters change
  useEffect(() => {
    if (allBookings.length > 0) {
      applyFilters();
    }
  }, [allBookings, filters, applyFilters]);

  // Load all bookings for filtering
  const loadAllBookings = async () => {
    setFilterLoading(true);
    try {
      const response = await getAllBookings({});
      const bookingsData = response.data?.bookings || response.data || [];
      setAllBookings(ensureArray(bookingsData));
      setFilteredBookings(ensureArray(bookingsData));
    } catch (error) {
      console.error('Error loading all bookings:', error);
      setAllBookings([]);
      setFilteredBookings([]);
    } finally {
      setFilterLoading(false);
    }
  };

  const loadBarbers = async () => {
    try {
      const response = await getAllBarber();
      const barbersData = response.data || [];
      setBarbers(Array.isArray(barbersData) ? barbersData : []);
    } catch (error) {
      console.error('Error loading barbers:', error);
      setBarbers([]);
    }
  };

  const loadServices = async () => {
    try {
      const response = await getAllServices();
      const servicesData = response.data || [];
      setServices(Array.isArray(servicesData) ? servicesData : []);
    } catch (error) {
      console.error('Error loading services:', error);
      setServices([]);
    }
  };

  // Helper functions for data processing
  const generateRevenueChart = (bookings) => {
    const currentMonth = dayjs();
    const daysInMonth = currentMonth.daysInMonth();
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = currentMonth.startOf('month').add(i, 'days');
      const dayBookings = bookings.filter(b =>
        dayjs(b.bookingDate).format('YYYY-MM-DD') === date.format('YYYY-MM-DD') &&
        b.status === 'completed'
      );
      const revenue = dayBookings.reduce((sum, b) => sum + (b.serviceId?.price || 0), 0);
      return {
        date: date.format('DD/MM'),
        revenue: revenue
      };
    });
    return monthDays;
  };

  const generateBookingChart = (bookings) => {
    const currentWeek = dayjs();
    const startOfWeek = currentWeek.startOf('week'); // Bắt đầu từ Chủ nhật
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = startOfWeek.add(i, 'days');
      const dayBookings = bookings.filter(b =>
        dayjs(b.bookingDate).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
      );
      return {
        date: date.format('DD/MM'),
        day: date.format('ddd'), // Thêm tên ngày (Mon, Tue, ...)
        bookings: dayBookings.length,
        completed: dayBookings.filter(b => b.status === 'completed').length,
        pending: dayBookings.filter(b => b.status === 'pending').length,
        cancelled: dayBookings.filter(b => ['cancelled', 'no_show'].includes(b.status)).length
      };
    });
    return weekDays;
  };

  const generateStatusChart = (bookings) => {
    const statusCount = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0
    };

    bookings.forEach(booking => {
      if (Object.prototype.hasOwnProperty.call(statusCount, booking.status)) {
        statusCount[booking.status]++;
      }
    });

    const statusLabels = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy',
      no_show: 'Vắng mặt'
    };

    return Object.entries(statusCount)
      .filter(([_, count]) => count > 0)
      .map(([status, count]) => ({
        type: statusLabels[status] || status,
        value: count
      }));
  };

  const processBarberPerformance = (bookings) => {
    const barberStats = {};
    bookings.forEach(booking => {
      const barberId = booking.barberId?._id || booking.barberId?.userId?._id;
      const barberName = booking.barberId?.userId?.name || booking.barberId?.name || 'Auto-assigned';

      if (!barberStats[barberId]) {
        barberStats[barberId] = {
          name: barberName,
          totalBookings: 0,
          completedBookings: 0,
          revenue: 0,
          rating: 0
        };
      }

      barberStats[barberId].totalBookings++;
      if (booking.status === 'completed') {
        barberStats[barberId].completedBookings++;
        barberStats[barberId].revenue += booking.serviceId?.price || 0;
      }
    });

    return Object.values(barberStats)
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 5);
  };

  const processTopCustomers = (bookings) => {
    const customerStats = {};
    bookings.forEach(booking => {
      const customerId = booking.customerId?._id;
      const customerName = booking.customerId?.name || booking.customerInfo?.customerName || 'N/A';

      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          name: customerName,
          totalBookings: 0,
          totalSpent: 0,
          lastBooking: booking.bookingDate
        };
      }

      customerStats[customerId].totalBookings++;
      if (booking.status === 'completed') {
        customerStats[customerId].totalSpent += booking.serviceId?.price || 0;
      }

      if (dayjs(booking.bookingDate).isAfter(dayjs(customerStats[customerId].lastBooking))) {
        customerStats[customerId].lastBooking = booking.bookingDate;
      }
    });

    return Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  };

  const processTopBarbers = (bookings) => {
    const barberStats = {};
    bookings.forEach(booking => {
      const barberId = booking.barberId?._id || booking.barberId?.userId?._id;
      const barberName = booking.barberId?.userId?.name || booking.barberId?.name || 'Auto-assigned';

      if (!barberStats[barberId]) {
        barberStats[barberId] = {
          name: barberName,
          totalBookings: 0,
          rating: 4.5, // Mock rating
          completionRate: 0
        };
      }

      barberStats[barberId].totalBookings++;
      if (booking.status === 'completed') {
        barberStats[barberId].completionRate++;
      }
    });

    return Object.values(barberStats)
      .map(barber => ({
        ...barber,
        completionRate: barber.totalBookings > 0 ?
          Math.round((barber.completionRate / barber.totalBookings) * 100) : 0
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings)
      .slice(0, 5);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load bookings for today and stats
      const today = dayjs().format('YYYY-MM-DD');
      const [bookingsRes, statsRes] = await Promise.all([
        getAllBookings({
          startDate: dayjs().startOf('day').toISOString(),
          endDate: dayjs().endOf('day').toISOString()
        }),
        getBookingStats()
      ]);

      const allBookings = bookingsRes.data?.bookings || bookingsRes.data || [];
      const todayBookings = allBookings.filter(booking =>
        dayjs(booking.bookingDate).format('YYYY-MM-DD') === today
      );

      // Calculate KPIs
      const kpis = {
        todayBookings: todayBookings.length,
        completedBookings: todayBookings.filter(b => b.status === 'completed').length,
        pendingBookings: todayBookings.filter(b => b.status === 'pending').length,
        cancelledBookings: todayBookings.filter(b => ['cancelled', 'no_show'].includes(b.status)).length,
        todayRevenue: todayBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.serviceId?.price || 0), 0),
        weekRevenue: statsRes.data?.weekRevenue || 0,
        monthRevenue: statsRes.data?.monthRevenue || 0,
        totalCustomers: statsRes.data?.totalCustomers || 0,
        activeBarbers: ensureArray(barbers).filter(b => b.isActive !== false).length,
        inactiveBarbers: ensureArray(barbers).filter(b => b.isActive === false).length
      };

      // Process today's bookings for table
      const processedTodayBookings = todayBookings.map(booking => ({
        key: booking._id,
        customer: booking.customerId?.name || booking.customerInfo?.customerName || 'N/A',
        service: booking.serviceId?.name || 'N/A',
        barber: booking.barberId?.userId?.name || booking.barberId?.name || 'Auto-assigned',
        time: dayjs(booking.bookingDate).format('HH:mm'),
        status: booking.status,
        price: booking.serviceId?.price || 0,
        phone: booking.customerId?.phone || booking.customerInfo?.customerPhone || 'N/A'
      }));

      setDashboardData({
        kpis,
        todayBookings: processedTodayBookings,
        revenueChart: generateRevenueChart(allBookings),
        bookingChart: generateBookingChart(allBookings),
        statusChart: generateStatusChart(allBookings),
        barberPerformance: processBarberPerformance(allBookings),
        topCustomers: processTopCustomers(allBookings),
        topBarbers: processTopBarbers(allBookings)
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Table columns for all bookings
  const allBookingsColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.customerId?.name || record.customerInfo?.customerName || 'N/A'}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.customerId?.phone || record.customerInfo?.customerPhone || 'N/A'}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service',
      render: (_, record) => record.serviceId?.name || 'N/A'
    },
    {
      title: 'Barber',
      dataIndex: 'barber',
      key: 'barber',
      render: (_, record) => record.barberId?.userId?.name || record.barberId?.name || 'Auto-assigned'
    },
    {
      title: 'Ngày & Giờ',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.bookingDate).unix() - dayjs(b.bookingDate).unix()
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Chờ xác nhận' },
          confirmed: { color: 'blue', text: 'Đã xác nhận' },
          completed: { color: 'green', text: 'Hoàn thành' },
          cancelled: { color: 'red', text: 'Đã hủy' },
          no_show: { color: 'volcano', text: 'Vắng mặt' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (_, record) => `${(record.serviceId?.price || 0).toLocaleString()}đ`
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {/* Handle view details */}}
        >
          Xem
        </Button>
      )
    }
  ];

  // Table columns for today's bookings
  const todayBookingsColumns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} size="small" />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.phone}</Text>
          </div>
        </Space>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'service',
      key: 'service'
    },
    {
      title: 'Barber',
      dataIndex: 'barber',
      key: 'barber'
    },
    {
      title: 'Giờ hẹn',
      dataIndex: 'time',
      key: 'time',
      sorter: (a, b) => a.time.localeCompare(b.time)
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          pending: { color: 'orange', text: 'Chờ xác nhận' },
          confirmed: { color: 'blue', text: 'Đã xác nhận' },
          completed: { color: 'green', text: 'Hoàn thành' },
          cancelled: { color: 'red', text: 'Đã hủy' },
          no_show: { color: 'volcano', text: 'Vắng mặt' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price?.toLocaleString() || 0}đ`
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          size="small"
          onClick={() => {/* Handle view details */}}
        >
          Xem
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        📊 Dashboard Quản lý Đặt lịch
      </Title>

      {/* 1. KPI/Stats Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Booking hôm nay"
              value={dashboardData.kpis.todayBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={dashboardData.kpis.completedBookings}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Chờ: {dashboardData.kpis.pendingBookings} | Hủy: {dashboardData.kpis.cancelledBookings}
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={dashboardData.kpis.todayRevenue}
              prefix={<DollarOutlined />}
              suffix="đ"
              valueStyle={{ color: '#faad14' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Tuần: {dashboardData.kpis.weekRevenue?.toLocaleString()}đ
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Khách hàng"
              value={dashboardData.kpis.totalCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Barber: {dashboardData.kpis.activeBarbers} hoạt động
            </Text>
          </Card>
        </Col>
      </Row>

      {/* 2. Lịch hẹn hôm nay */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title="📅 Lịch hẹn hôm nay"
            extra={
              <Space>
                <Button type="primary" icon={<FilterOutlined />}>
                  Lọc
                </Button>
                <Search
                  placeholder="Tìm kiếm khách hàng..."
                  style={{ width: 200 }}
                  onSearch={(value) => setFilters({...filters, searchText: value})}
                />
              </Space>
            }
          >
            <Table
              columns={todayBookingsColumns}
              dataSource={dashboardData.todayBookings}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `Tổng ${total} lịch hẹn`
              }}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>
      </Row>

      {/* 3. Biểu đồ và thống kê */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="📊 Doanh thu tháng hiện tại">
            <Line
              data={dashboardData.revenueChart}
              xField="date"
              yField="revenue"
              smooth={true}
              color="#1890ff"
              point={{ size: 3 }}
              height={300}
              tooltip={{
                formatter: (datum) => {
                  return { name: 'Doanh thu', value: `${datum.revenue?.toLocaleString()}đ` };
                }
              }}
              yAxis={{
                label: {
                  formatter: (value) => `${(value / 1000).toFixed(0)}K`
                }
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="📈 Booking tuần hiện tại">
            <Column
              data={dashboardData.bookingChart}
              xField="date"
              yField="bookings"
              color="#52c41a"
              height={300}
              tooltip={{
                formatter: (datum) => {
                  return {
                    name: `${datum.day || ''} - Số booking`,
                    value: `${datum.bookings} booking`
                  };
                }
              }}
              columnStyle={{
                radius: [4, 4, 0, 0]
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 3.5. Biểu đồ phân bố trạng thái */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="🥧 Phân bố trạng thái booking">
            <Pie
              data={dashboardData.statusChart}
              angleField="value"
              colorField="type"
              radius={0.8}
              height={300}
              label={{
                type: 'outer',
                content: '{name} ({percentage})'
              }}
              interactions={[{ type: 'element-active' }]}
              legend={{
                position: 'bottom'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="📊 Hiệu suất barber">
            <div style={{ height: 300, padding: 20 }}>
              {ensureArray(dashboardData.barberPerformance).map((barber, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text strong>{barber.name}</Text>
                    <Text>{barber.totalBookings} booking</Text>
                  </div>
                  <Progress
                    percent={Math.min((barber.totalBookings / 50) * 100, 100)}
                    strokeColor="#52c41a"
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 4. Khách hàng và barber nổi bật */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="👑 Khách hàng thân thiết">
            <Space direction="vertical" style={{ width: '100%' }}>
              {ensureArray(dashboardData.topCustomers).map((customer, index) => (
                <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar icon={<UserOutlined />} />
                        <div>
                          <Text strong>{customer.name}</Text>
                          <br />
                          <Text type="secondary">{customer.totalBookings} lần đặt</Text>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Text strong style={{ color: '#52c41a' }}>
                        {customer.totalSpent?.toLocaleString()}đ
                      </Text>
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="🧑‍🎨 Barber xuất sắc">
            <Space direction="vertical" style={{ width: '100%' }}>
              {ensureArray(dashboardData.topBarbers).map((barber, index) => (
                <Card key={index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Space>
                        <Avatar icon={<UserOutlined />} />
                        <div>
                          <Text strong>{barber.name}</Text>
                          <br />
                          <Space>
                            <Text type="secondary">{barber.totalBookings} booking</Text>
                            <Tag color="gold">★ {barber.rating}</Tag>
                          </Space>
                        </div>
                      </Space>
                    </Col>
                    <Col>
                      <Progress
                        type="circle"
                        size={50}
                        percent={barber.completionRate}
                        format={percent => `${percent}%`}
                      />
                    </Col>
                  </Row>
                </Card>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 5. Bộ lọc và tìm kiếm nâng cao */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="🔍 Bộ lọc và tìm kiếm nâng cao">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Tìm kiếm:</Text>
                <Search
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Tìm theo tên, SĐT, email khách hàng..."
                  allowClear
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  onSearch={applyFilters}
                />
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong>Thời gian:</Text>
                <RangePicker
                  style={{ width: '100%', marginTop: 8 }}
                  value={filters.dateRange}
                  onChange={(dates) => setFilters({...filters, dateRange: dates})}
                  format="DD/MM/YYYY"
                />
              </Col>
            </Row>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Barber:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn barber"
                  allowClear
                  value={filters.barber}
                  onChange={(value) => setFilters({...filters, barber: value})}
                >
                  {ensureArray(barbers).map(barber => (
                    <Option key={barber._id} value={barber._id}>
                      {barber.userId?.name || barber.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Dịch vụ:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn dịch vụ"
                  allowClear
                  value={filters.service}
                  onChange={(value) => setFilters({...filters, service: value})}
                >
                  {ensureArray(services).map(service => (
                    <Option key={service._id} value={service._id}>
                      {service.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>Trạng thái:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn trạng thái"
                  allowClear
                  value={filters.status}
                  onChange={(value) => setFilters({...filters, status: value})}
                >
                  <Option value="pending">Chờ xác nhận</Option>
                  <Option value="confirmed">Đã xác nhận</Option>
                  <Option value="completed">Hoàn thành</Option>
                  <Option value="cancelled">Đã hủy</Option>
                  <Option value="no_show">Vắng mặt</Option>
                </Select>
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={applyFilters} loading={filterLoading}>
                    Áp dụng bộ lọc
                  </Button>
                  <Button onClick={() => {
                    setFilters({
                      dateRange: [dayjs().startOf('month'), dayjs().endOf('month')],
                      barber: null,
                      service: null,
                      status: null,
                      searchText: ''
                    });
                    setFilteredBookings(allBookings);
                  }}>
                    Đặt lại
                  </Button>
                  <Text type="secondary">
                    Tìm thấy {filteredBookings.length} kết quả
                  </Text>
                </Space>
              </Col>
            </Row>

            {/* Bảng hiển thị tất cả booking */}
            <Divider />
            <Table
              columns={allBookingsColumns}
              dataSource={filteredBookings}
              loading={filterLoading}
              rowKey="_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} booking`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1200 }}
              size="middle"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminBookingDashboard;