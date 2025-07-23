import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Tag,
  Space,
  Select,
  DatePicker,
  Input,
  Modal,
  Descriptions,
  message,
  Row,
  Col,
  Statistic,
  Avatar,
  Rate
} from 'antd';
import {
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { getBarberBookings } from '../../services/barberApi.js';
import { updateBookingStatus } from '../../services/serviceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUserIdFromToken } from '../../utils/tokenUtils.js';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const BarberBookingManagement = () => {
  const { user, getUserId } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    customerName: '',
    page: 1,
    limit: 20
  });
  
  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0
  });

  // Get barber ID from user context
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const currentUserId = user?.id ||
                         getUserId() ||
                         getUserIdFromToken();
    if (currentUserId) {
      setUserId(currentUserId);
      loadBookings(currentUserId);
    } else {
      message.error('Barber ID not found. Please contact administrator.');
    }
  }, [user, getUserId]);

  const loadBookings = async (userId, newFilters = filters) => {
    setLoading(true);
    try {
      const response = await getBarberBookings(userId, newFilters);
      const data = response.bookings || response;
      const paginationData = response.pagination;
      
      setBookings(Array.isArray(data) ? data : []);
      
      if (paginationData) {
        setPagination({
          current: paginationData.page,
          pageSize: paginationData.limit,
          total: paginationData.total
        });
      }

      // Calculate statistics
      calculateStats(data);
      
    } catch (error) {
      message.error('Failed to load bookings');
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const stats = {
      total: bookingsData.length,
      pending: bookingsData.filter(b => b.status === 'pending').length,
      confirmed: bookingsData.filter(b => b.status === 'confirmed').length,
      completed: bookingsData.filter(b => b.status === 'completed').length,
      cancelled: bookingsData.filter(b => b.status === 'cancelled').length,
      noShow: bookingsData.filter(b => b.status === 'no_show').length
    };
    setStats(stats);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    if (userId) {
      loadBookings(userId, newFilters);
    }
  };

  const handleTableChange = (pagination) => {
    const newFilters = { 
      ...filters, 
      page: pagination.current, 
      limit: pagination.pageSize 
    };
    setFilters(newFilters);
    if (userId) {
      loadBookings(userId, newFilters);
    }
  };

  const handleDateRangeChange = (dates) => {
    const newFilters = {
      ...filters,
      startDate: dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '',
      endDate: dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '',
      page: 1
    };
    setFilters(newFilters);
    if (userId) {
      loadBookings(userId, newFilters);
    }
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(true);
    try {
      await updateBookingStatus(bookingId, newStatus);
      message.success(`Booking status updated to ${newStatus}`);
      
      // Reload bookings
      if (userId) {
        loadBookings(userId);
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

  const columns = [
    {
      title: 'Khách hàng',
      key: 'customer',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            <UserOutlined /> {record.customerName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customerEmail}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customerPhone}
          </div>
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceId',
      key: 'service',
      render: (service, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {service?.name || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {service?.price?.toLocaleString()} đ - {service?.durationMinutes || record.durationMinutes} phút
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      render: (date) => (
        <div>
          <div>
            <CalendarOutlined /> {dayjs(date).format('DD/MM/YYYY')}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: true
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: 'Chờ xác nhận', value: 'pending' },
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
        { text: 'Không đến', value: 'no_show' }
      ]
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBooking(record);
              setDetailModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
          {record.status === 'pending' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleBookingStatusUpdate(record._id, 'confirmed')}
              loading={actionLoading}
            >
              Xác nhận
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleBookingStatusUpdate(record._id, 'completed')}
              loading={actionLoading}
            >
              Hoàn thành
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Button
              size="small"
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => handleBookingStatusUpdate(record._id, 'no_show')}
              loading={actionLoading}
            >
              Không đến
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2}>Quản lý lịch hẹn</Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Tổng số"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Chờ xác nhận"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Đã xác nhận"
              value={stats.confirmed}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Đã hủy"
              value={stats.cancelled}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card>
            <Statistic
              title="Không đến"
              value={stats.noShow}
              valueStyle={{ color: '#ff7875' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <label>Tìm kiếm khách hàng:</label>
            <Input
              placeholder="Tên khách hàng..."
              value={filters.customerName}
              onChange={e => handleFilterChange('customerName', e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <label>Trạng thái:</label>
            <Select
              placeholder="Tất cả trạng thái"
              value={filters.status || undefined}
              onChange={value => handleFilterChange('status', value)}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="pending">Chờ xác nhận</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="completed">Hoàn thành</Option>
              <Option value="cancelled">Đã hủy</Option>
              <Option value="no_show">Không đến</Option>
            </Select>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <label>Khoảng thời gian:</label>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
            />
          </Col>
          
          <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'end' }}>
            <Button 
              onClick={() => {
                setFilters({
                  status: '',
                  startDate: '',
                  endDate: '',
                  customerName: '',
                  page: 1,
                  limit: 20
                });
                if (barberId) {
                  loadBookings(barberId, {
                    status: '',
                    startDate: '',
                    endDate: '',
                    customerName: '',
                    page: 1,
                    limit: 20
                  });
                }
              }}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={bookings}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} của ${total} lịch hẹn`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Booking Detail Modal */}
      <Modal
        title="Chi tiết lịch hẹn"
        visible={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedBooking(null);
        }}
        footer={[
          <Button 
            key="close" 
            onClick={() => {
              setDetailModalVisible(false);
              setSelectedBooking(null);
            }}
          >
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedBooking && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã đặt lịch">
              {selectedBooking._id}
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                  {selectedBooking.customerName}
                </div>
                <div>Email: {selectedBooking.customerEmail}</div>
                <div>Điện thoại: {selectedBooking.customerPhone}</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {selectedBooking.serviceId?.name}
                </div>
                <div>Giá: {selectedBooking.serviceId?.price?.toLocaleString()} đ</div>
                <div>Thời gian: {selectedBooking.serviceId?.durationMinutes || selectedBooking.durationMinutes} phút</div>
                {selectedBooking.serviceId?.description && (
                  <div>Mô tả: {selectedBooking.serviceId.description}</div>
                )}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian hẹn">
              {dayjs(selectedBooking.bookingDate).format('dddd, DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={getStatusColor(selectedBooking.status)}>
                {getStatusText(selectedBooking.status)}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.note && (
              <Descriptions.Item label="Ghi chú">
                {selectedBooking.note}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedBooking.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            {selectedBooking.autoAssignedBarber && (
              <Descriptions.Item label="Chế độ">
                <Tag color="blue">Được chọn tự động</Tag>
              </Descriptions.Item>
            )}
            {selectedBooking.notificationMethods?.length > 0 && (
              <Descriptions.Item label="Phương thức thông báo">
                {selectedBooking.notificationMethods.map(method => (
                  <Tag key={method}>{method}</Tag>
                ))}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BarberBookingManagement;
