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
  Row,
  Col,
  Statistic,
  Avatar,
  Rate,
  Tooltip,
  Alert
} from 'antd';
import { toast } from 'react-toastify';
import {
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { getBarberBookings } from '../../services/barberApi.js';
import { updateBookingStatus } from '../../services/serviceApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUserIdFromToken } from '../../utils/tokenUtils.js';
import dayjs from 'dayjs';
import {
  canUpdateBookingStatus,
  getStatusText,
  getStatusColor,
  getDisabledActionMessage,
  isBookingFinal,
  BOOKING_STATUS
} from '../../utils/bookingValidation';

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

  // Statistics (barbers only see confirmed and completed bookings)
  const [stats, setStats] = useState({
    total: 0,
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

    // Show loading toast
    const loadingToastId = toast.loading(
      `${newStatus === 'completed' ? '✅ Marking booking as completed' : '❌ Marking booking as no-show'}...`,
      {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
      }
    );

    try {
      await updateBookingStatus(bookingId, newStatus);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: newStatus === 'completed'
          ? `🎉 Booking marked as completed!\n✅ Service has been successfully finished.\n💰 Payment can now be processed.`
          : `📝 Booking marked as no-show.\n⚠️ Customer did not arrive for their appointment.\n📊 No-show record has been created.`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Reload bookings
      if (userId) {
        loadBookings(userId);
      }

    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to update booking status\n${error.response?.data?.message || 'Please try again'}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Note: Using utility functions from bookingValidation.js for status helpers

  // Helper function to get available actions for a booking
  const getBookingActions = (booking) => {
    if (booking.status !== 'confirmed') return null;

    const bookingDate = dayjs(booking.bookingDate);
    const today = dayjs();
    const isToday = bookingDate.isSame(today, 'day');
    const isPast = bookingDate.isBefore(today, 'day');
    const isFuture = bookingDate.isAfter(today, 'day');

    if (isToday) {
      return 'can_complete'; // Có thể hoàn thành
    } else if (isPast) {
      return 'can_mark_no_show'; // Có thể đánh dấu không đến
    } else if (isFuture) {
      return 'future_booking'; // Booking tương lai - chờ đến ngày
    }

    return null;
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
      render: (date, record) => {
        const bookingDate = dayjs(date);
        const today = dayjs();
        const isToday = bookingDate.isSame(today, 'day');
        const isPast = bookingDate.isBefore(today, 'day');
        const isFuture = bookingDate.isAfter(today, 'day');

        let dateColor = '#666';
        let dateLabel = '';

        if (isToday) {
          dateColor = '#1890ff';
          dateLabel = ' (Hôm nay)';
        } else if (isPast) {
          dateColor = '#ff4d4f';
          dateLabel = ' (Quá hạn)';
        } else if (isFuture) {
          dateColor = '#52c41a';
          dateLabel = ' (Sắp tới)';
        }

        return (
          <div>
            <div style={{ color: dateColor, fontWeight: isToday ? 'bold' : 'normal' }}>
              <CalendarOutlined /> {bookingDate.format('DD/MM/YYYY')}{dateLabel}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {bookingDate.format('HH:mm')}
            </div>
          </div>
        );
      },
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
        { text: 'Đã xác nhận', value: 'confirmed' },
        { text: 'Hoàn thành', value: 'completed' },
        { text: 'Đã hủy', value: 'cancelled' },
        { text: 'Không đến', value: 'no_show' }
      ]
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        // Check if booking is in a final state
        if (isBookingFinal(record)) {
          return (
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
              <span style={{ fontSize: '12px', color: '#999' }}>
                {getDisabledActionMessage(record, 'update')}
              </span>
            </Space>
          );
        }

        return (
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
            {/* Enhanced validation for status updates */}
            {record.status === 'confirmed' && (() => {
              const bookingDate = dayjs(record.bookingDate);
              const today = dayjs();
              const isToday = bookingDate.isSame(today, 'day');
              const isPast = bookingDate.isBefore(today, 'day');

              // Validate each potential status update
              const completeValidation = canUpdateBookingStatus(record, BOOKING_STATUS.COMPLETED, 'barber');
              const noShowValidation = canUpdateBookingStatus(record, BOOKING_STATUS.NO_SHOW, 'barber');

              if (isToday) {
                // Booking hôm nay - có thể hoàn thành hoặc không đến
                return [
                  <Tooltip key="complete" title={completeValidation.canUpdate ? "Đánh dấu booking hôm nay là hoàn thành" : completeValidation.reason}>
                    <Button
                      size="small"
                      type="primary"
                      icon={<CheckCircleOutlined />}
                      onClick={() => handleBookingStatusUpdate(record._id, 'completed')}
                      loading={actionLoading}
                      style={{ marginRight: 8 }}
                      disabled={!completeValidation.canUpdate}
                    >
                      Hoàn thành
                    </Button>
                  </Tooltip>,
                  <Tooltip key="no-show" title={noShowValidation.canUpdate ? "Đánh dấu booking hôm nay là không đến" : noShowValidation.reason}>
                    <Button
                      size="small"
                      type="default"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleBookingStatusUpdate(record._id, 'no_show')}
                      loading={actionLoading}
                      disabled={!noShowValidation.canUpdate}
                    >
                      Không đến
                    </Button>
                  </Tooltip>
                ];
              } else if (isPast) {
                // Booking ngày trước - chỉ có thể đánh dấu không đến
                return (
                  <Tooltip title={noShowValidation.canUpdate ? "Đánh dấu booking quá hạn là không đến" : noShowValidation.reason}>
                    <Button
                      size="small"
                      type="default"
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => handleBookingStatusUpdate(record._id, 'no_show')}
                      loading={actionLoading}
                      disabled={!noShowValidation.canUpdate}
                    >
                      Không đến
                    </Button>
                  </Tooltip>
                );
              } else {
                // Booking tương lai - không có action
                return (
                  <Tooltip title="Chờ đến ngày để xử lý booking">
                    <Button size="small" disabled>
                      Chờ xử lý
                    </Button>
                  </Tooltip>
                );
              }
            })()}
          </Space>
        );
      }
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2}>Quản lý lịch hẹn</Title>

      {/* Thông báo quy tắc */}
      <Alert
        message="Quy tắc xử lý booking"
        description={
          <div>
            <div>• <strong>Booking hôm nay:</strong> Có thể đánh dấu "Hoàn thành" hoặc "Không đến"</div>
            <div>• <strong>Booking quá hạn:</strong> Chỉ có thể đánh dấu "Không đến"</div>
            <div>• <strong>Booking tương lai:</strong> Chờ đến ngày để xử lý</div>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
      />

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
        {/* Removed pending bookings statistic - barbers can only see confirmed bookings */}
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
              <div>
                <Tag color={getStatusColor(selectedBooking.status)}>
                  {getStatusText(selectedBooking.status)}
                </Tag>
                {isBookingFinal(selectedBooking) && (
                  <div style={{ marginTop: 8, fontSize: '12px', color: '#999' }}>
                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                    {getDisabledActionMessage(selectedBooking, 'update')}
                  </div>
                )}
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
