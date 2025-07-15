import React, { useEffect, useState } from 'react';
import {
  Table,
  Typography,
  Spin,
  message,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Space,
  Modal,
  Input,
  Rate,
  Descriptions,
  Divider
} from 'antd';
import {
  getMyBookings,
  updateBookingStatus,
  cancelBooking
} from '../../services/serviceApi.js';
import {
  getBookingFeedback,
  canReviewBooking
} from '../../services/bookingFeedbackApi.js';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // Modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Load bookings with filters
  const loadBookings = async (newFilters = filters) => {
    setLoading(true);
    try {
      const response = await getMyBookings(newFilters);
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
    } catch (error) {
      message.error('Không thể tải danh sách đặt lịch!');
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    loadBookings(newFilters);
  };

  // Handle pagination change
  const handleTableChange = (pagination) => {
    const newFilters = {
      ...filters,
      page: pagination.current,
      limit: pagination.pageSize
    };
    setFilters(newFilters);
    loadBookings(newFilters);
  };

  // Handle date range change
  const handleDateRangeChange = (dates) => {
    const newFilters = {
      ...filters,
      startDate: dates && dates[0] ? dates[0].format('YYYY-MM-DD') : '',
      endDate: dates && dates[1] ? dates[1].format('YYYY-MM-DD') : '',
      page: 1
    };
    setFilters(newFilters);
    loadBookings(newFilters);
  };

  // Handle booking cancellation
  const handleCancelBooking = async () => {
    if (!selectedBooking || !cancelReason.trim()) {
      message.error('Vui lòng nhập lý do hủy');
      return;
    }

    setActionLoading(true);
    try {
      await cancelBooking(selectedBooking._id, cancelReason);
      message.success('Hủy lịch hẹn thành công');
      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedBooking(null);
      loadBookings();
    } catch (error) {
      message.error(error.response?.data?.message || 'Không thể hủy lịch hẹn');
    } finally {
      setActionLoading(false);
    }
  };

  // Get status color
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

  // Get status text
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

  // Check if booking can be cancelled
  const canCancelBooking = (booking) => {
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      return false;
    }

    const bookingTime = dayjs(booking.bookingDate);
    const now = dayjs();
    const hoursDifference = bookingTime.diff(now, 'hour');

    return hoursDifference >= 2; // Can cancel if more than 2 hours before appointment
  };

  // Check if booking can be reviewed
  const canReviewBooking = (booking) => {
    return booking.status === 'completed';
  };

  // Handle feedback navigation
  const handleFeedback = (booking) => {
    navigate(`/feedback/${booking._id}`);
  };

  const columns = [
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
      title: 'Thợ cắt tóc',
      dataIndex: 'barberId',
      key: 'barber',
      render: (barber, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            <UserOutlined /> {barber?.userId?.name || 'Tự động chọn'}
          </div>
          {barber?.averageRating && (
            <div style={{ fontSize: '12px' }}>
              <Rate disabled defaultValue={barber.averageRating} style={{ fontSize: 12 }} />
            </div>
          )}
          {record.autoAssignedBarber && (
            <Tag size="small" color="blue">Tự động</Tag>
          )}
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
            <ClockCircleOutlined /> {dayjs(date).format('HH:mm')}
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
            onClick={() => {
              setSelectedBooking(record);
              setDetailModalVisible(true);
            }}
          >
            Chi tiết
          </Button>
          {canCancelBooking(record) && (
            <Button
              size="small"
              danger
              onClick={() => {
                setSelectedBooking(record);
                setCancelModalVisible(true);
              }}
            >
              Hủy lịch
            </Button>
          )}
          {canReviewBooking(record) && (
            <Button
              size="small"
              type="primary"
              icon={<StarOutlined />}
              onClick={() => handleFeedback(record)}
            >
              Đánh giá
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
      <Title level={2}>Lịch sử đặt lịch của tôi</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
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

          <Col xs={24} sm={12} md={10}>
            <label>Khoảng thời gian:</label>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              format="DD/MM/YYYY"
            />
          </Col>

          <Col xs={24} md={8} style={{ display: 'flex', alignItems: 'end' }}>
            <Button
              onClick={() => {
                setFilters({
                  status: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 10
                });
                loadBookings({
                  status: '',
                  startDate: '',
                  endDate: '',
                  page: 1,
                  limit: 10
                });
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

      {/* Cancel Booking Modal */}
      <Modal
        title="Hủy lịch hẹn"
        visible={cancelModalVisible}
        onCancel={() => {
          setCancelModalVisible(false);
          setCancelReason('');
          setSelectedBooking(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setCancelModalVisible(false);
              setCancelReason('');
              setSelectedBooking(null);
            }}
          >
            Đóng
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={actionLoading}
            onClick={handleCancelBooking}
          >
            Xác nhận hủy
          </Button>
        ]}
      >
        {selectedBooking && (
          <div>
            <p><strong>Dịch vụ:</strong> {selectedBooking.serviceId?.name}</p>
            <p><strong>Thời gian:</strong> {dayjs(selectedBooking.bookingDate).format('DD/MM/YYYY HH:mm')}</p>
            <p><strong>Thợ cắt:</strong> {selectedBooking.barberId?.userId?.name || 'Tự động chọn'}</p>

            <Divider />

            <div style={{ marginBottom: 16 }}>
              <label>Lý do hủy lịch:</label>
              <TextArea
                rows={3}
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Vui lòng nhập lý do hủy lịch..."
                maxLength={200}
              />
            </div>

            <div style={{ fontSize: '12px', color: '#666' }}>
              * Lưu ý: Chỉ có thể hủy lịch trước 2 tiếng so với giờ hẹn
            </div>
          </div>
        )}
      </Modal>

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
        width={600}
      >
        {selectedBooking && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Mã đặt lịch">
              {selectedBooking._id}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {selectedBooking.serviceId?.name}
                </div>
                <div>Giá: {selectedBooking.serviceId?.price?.toLocaleString()} đ</div>
                <div>Thời gian: {selectedBooking.serviceId?.durationMinutes || selectedBooking.durationMinutes} phút</div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Thợ cắt tóc">
              <div>
                <div style={{ fontWeight: 'bold' }}>
                  {selectedBooking.barberId?.userId?.name || 'Tự động chọn'}
                </div>
                {selectedBooking.barberId?.averageRating && (
                  <div>
                    Đánh giá: <Rate disabled defaultValue={selectedBooking.barberId.averageRating} style={{ fontSize: 14 }} />
                  </div>
                )}
                {selectedBooking.autoAssignedBarber && (
                  <Tag color="blue">Được chọn tự động</Tag>
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
            <Descriptions.Item label="Thông tin liên hệ">
              <div>
                <div>Tên: {selectedBooking.customerName}</div>
                <div>Email: {selectedBooking.customerEmail}</div>
                <div>Điện thoại: {selectedBooking.customerPhone}</div>
              </div>
            </Descriptions.Item>
            {selectedBooking.note && (
              <Descriptions.Item label="Ghi chú">
                {selectedBooking.note}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Ngày tạo">
              {dayjs(selectedBooking.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
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

export default MyBookingsPage;

