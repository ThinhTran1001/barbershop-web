import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Select, DatePicker, Spin, Alert } from 'antd';
import { 
  ShoppingCartOutlined, 
  UserOutlined, 
  DollarOutlined, 
  CalendarOutlined,
  BarChartOutlined,
  TrophyOutlined,
  TeamOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Đăng ký các component cần thiết cho Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const { Option } = Select;
const { RangePicker } = DatePicker;

const Statistics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [revenueStats, setRevenueStats] = useState([]);
  const [orderStats, setOrderStats] = useState({});
  const [bookingStats, setBookingStats] = useState({});
  const [userStats, setUserStats] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Fetch dashboard stats
  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/statistics/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setDashboardStats(data.data);
      } else {
        setError('Failed to fetch dashboard statistics');
      }
    } catch (err) {
      setError('Error fetching dashboard statistics');
    }
  };

  // Fetch revenue stats
  const fetchRevenueStats = async () => {
    try {
      const response = await fetch(`/api/statistics/revenue?period=${selectedPeriod}&year=${selectedYear}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setRevenueStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching revenue stats:', err);
    }
  };


  const fetchOrderStats = async () => {
    try {
      const response = await fetch('/api/statistics/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setOrderStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };


  const fetchBookingStats = async () => {
    try {
      const response = await fetch('/api/statistics/bookings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setBookingStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching booking stats:', err);
    }
  };

 
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/statistics/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    }
  };

 
  const fetchTopProducts = async () => {
    try {
      const response = await fetch('/api/statistics/top-products?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        setTopProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching top products:', err);
    }
  };

  useEffect(() => {
    const loadAllStats = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchDashboardStats(),
          fetchRevenueStats(),
          fetchOrderStats(),
          fetchBookingStats(),
          fetchUserStats(),
          fetchTopProducts()
        ]);
      } catch (err) {
        setError('Error loading statistics');
      } finally {
        setLoading(false);
      }
    };

    loadAllStats();
  }, []);

  useEffect(() => {
    fetchRevenueStats();
  }, [selectedPeriod, selectedYear]);

  // Chart data configurations
  const revenueChartData = {
    labels: revenueStats.map(item => {
      if (selectedPeriod === 'month') {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return monthNames[item._id - 1];
      }
      return `Week ${item._id}`;
    }),
    datasets: [
      {
        label: 'Revenue',
        data: revenueStats.map(item => item.revenue),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const orderStatusChartData = {
    labels: orderStats.byStatus?.map(item => item._id) || [],
    datasets: [
      {
        data: orderStats.byStatus?.map(item => item.count) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  const bookingStatusChartData = {
    labels: bookingStats.byStatus?.map(item => item._id) || [],
    datasets: [
      {
        data: bookingStats.byStatus?.map(item => item.count) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
      },
    ],
  };

  // Table columns
  const topProductsColumns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Total Sold',
      dataIndex: 'totalSold',
      key: 'totalSold',
      sorter: (a, b) => a.totalSold - b.totalSold,
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      render: (value) => `$${value.toLocaleString()}`,
      sorter: (a, b) => a.totalRevenue - b.totalRevenue,
    },
  ];

  const bookingBarberColumns = [
    {
      title: 'Barber Name',
      dataIndex: 'barberName',
      key: 'barberName',
    },
    {
      title: 'Total Bookings',
      dataIndex: 'totalBookings',
      key: 'totalBookings',
      sorter: (a, b) => a.totalBookings - b.totalBookings,
    },
    {
      title: 'Completed',
      dataIndex: 'completedBookings',
      key: 'completedBookings',
    },
    {
      title: 'Cancelled',
      dataIndex: 'cancelledBookings',
      key: 'cancelledBookings',
    },
    {
      title: 'No Show',
      dataIndex: 'noShowBookings',
      key: 'noShowBookings',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        style={{ margin: '20px' }}
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Dashboard Statistics</h1>

      {/* Dashboard Overview Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={dashboardStats?.orders?.total || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
            <small>This month: {dashboardStats?.orders?.thisMonth || 0}</small>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={dashboardStats?.revenue?.total || 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => `$${value.toLocaleString()}`}
            />
            <small>This month: ${(dashboardStats?.revenue?.thisMonth || 0).toLocaleString()}</small>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={dashboardStats?.users?.total || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <small>New this month: {dashboardStats?.users?.newThisMonth || 0}</small>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={dashboardStats?.bookings?.total || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
            <small>Completed: {dashboardStats?.bookings?.completed || 0}</small>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="Revenue Trend" extra={
            <div>
              <Select 
                value={selectedPeriod} 
                onChange={setSelectedPeriod}
                style={{ width: 100, marginRight: 8 }}
              >
                <Option value="month">Month</Option>
                <Option value="week">Week</Option>
                <Option value="year">Year</Option>
              </Select>
              <Select 
                value={selectedYear} 
                onChange={setSelectedYear}
                style={{ width: 100 }}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </div>
          }>
            <Line data={revenueChartData} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Order Status Distribution">
            <Doughnut data={orderStatusChartData} />
          </Card>
        </Col>
      </Row>

      {/* Booking and User Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Booking Status Distribution">
            <Pie data={bookingStatusChartData} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Top Products">
            <Table 
              dataSource={topProducts} 
              columns={topProductsColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Tables */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Booking Statistics by Barber">
            <Table 
              dataSource={bookingStats.byBarber || []} 
              columns={bookingBarberColumns}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Additional Statistics">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Active Products"
                  value={dashboardStats?.products?.active || 0}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Active Services"
                  value={dashboardStats?.services?.active || 0}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Total Barbers"
                  value={dashboardStats?.users?.barbers || 0}
                  prefix={<TeamOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Active Vouchers"
                  value={dashboardStats?.vouchers?.active || 0}
                  prefix={<GiftOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Statistics;
