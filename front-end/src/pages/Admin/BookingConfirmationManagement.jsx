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
  Checkbox,
  Popconfirm,
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
  CheckOutlined,
  ReloadOutlined,
  StopOutlined
} from '@ant-design/icons';
import BookingRejectionModal from '../../components/BookingRejectionModal.jsx';
import { rejectBooking } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import dayjs from 'dayjs';
import axios from 'axios';
import {
  canConfirmBooking,
  getStatusText,
  getStatusColor,
  getDisabledActionMessage,
  isBookingFinal
} from '../../utils/bookingValidation';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const BookingConfirmationManagement = () => {
  const { user } = useAuth();
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
  const [selectedBookingForRejection, setSelectedBookingForRejection] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    barberId: '',
    serviceId: '',
    startDate: '',
    endDate: '',
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
    totalPending: 0,
    todayPending: 0,
    weekPending: 0
  });

  // Load pending bookings
  const loadPendingBookings = async (newFilters = filters) => {
    setLoading(true);
    try {
      const params = {
        page: newFilters.page,
        limit: newFilters.limit,
        ...(newFilters.barberId && { barberId: newFilters.barberId }),
        ...(newFilters.serviceId && { serviceId: newFilters.serviceId }),
        ...(newFilters.startDate && { startDate: newFilters.startDate }),
        ...(newFilters.endDate && { endDate: newFilters.endDate })
      };

      const response = await axios.get('/api/bookings/pending/list', { params });
      const { bookings, pagination: paginationData } = response.data;
      
      setPendingBookings(bookings || []);
      
      if (paginationData) {
        setPagination({
          current: paginationData.page,
          pageSize: paginationData.limit,
          total: paginationData.total
        });
      }

      // Calculate statistics
      calculateStats(bookings || []);
      
    } catch (error) {
      message.error('Failed to load pending bookings');
      console.error('Error loading pending bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const today = dayjs().startOf('day');
    const weekStart = dayjs().startOf('week');
    
    const stats = {
      totalPending: bookingsData.length,
      todayPending: bookingsData.filter(b => 
        dayjs(b.bookingDate).isSame(today, 'day')
      ).length,
      weekPending: bookingsData.filter(b => 
        dayjs(b.bookingDate).isAfter(weekStart)
      ).length
    };
    setStats(stats);
  };

  // Confirm single booking
  const handleConfirmBooking = async (bookingId) => {
    setActionLoading(true);

    // Find the booking to get details for toast
    const booking = pendingBookings.find(b => b._id === bookingId);

    // Show loading toast
    const loadingToastId = toast.loading(
      `✅ Confirming booking for ${booking?.customerName || 'customer'}...`,
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
      const response = await axios.put(`/api/bookings/${bookingId}/confirm`);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `🎉 Booking confirmed successfully!\n👤 Customer: ${booking?.customerName || 'Unknown'}\n📅 Service: ${booking?.serviceId?.name || 'Unknown'}\n🕐 Date: ${booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'Unknown'}`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Remove confirmed booking from the list
      setPendingBookings(prev => prev.filter(b => b._id !== bookingId));

      // Update statistics
      const updatedBookings = pendingBookings.filter(b => b._id !== bookingId);
      calculateStats(updatedBookings);

    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to confirm booking\n${error.response?.data?.message || 'Please try again'}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Error confirming booking:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk confirm bookings
  const handleBulkConfirm = async () => {
    if (selectedRowKeys.length === 0) {
      toast.warn('⚠️ Please select bookings to confirm', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      return;
    }

    setActionLoading(true);

    // Show loading toast
    const loadingToastId = toast.loading(
      `✅ Confirming ${selectedRowKeys.length} booking(s)...`,
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
      const response = await axios.post('/api/bookings/bulk-confirm', {
        bookingIds: selectedRowKeys
      });

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `🎉 ${response.data.confirmedCount || selectedRowKeys.length} booking(s) confirmed successfully!\n📋 Total processed: ${response.data.totalProcessed || selectedRowKeys.length}\n✅ Customers will be notified automatically.`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Remove confirmed bookings from the list
      setPendingBookings(prev =>
        prev.filter(b => !selectedRowKeys.includes(b._id))
      );

      // Clear selection
      setSelectedRowKeys([]);

      // Update statistics
      const updatedBookings = pendingBookings.filter(b => !selectedRowKeys.includes(b._id));
      calculateStats(updatedBookings);

    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to confirm bookings\n${error.response?.data?.message || 'Please try again'}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Error bulk confirming bookings:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle booking rejection
  const handleRejectBooking = (booking) => {
    setSelectedBookingForRejection(booking);
    setRejectionModalVisible(true);
  };

  // Confirm booking rejection
  const handleRejectConfirm = async (rejectionData) => {
    try {
      await rejectBooking(selectedBookingForRejection._id, rejectionData);

      // Remove rejected booking from the list
      setPendingBookings(prev =>
        prev.filter(b => b._id !== selectedBookingForRejection._id)
      );

      // Update statistics
      const updatedBookings = pendingBookings.filter(b => b._id !== selectedBookingForRejection._id);
      calculateStats(updatedBookings);

    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  // Handle table change (pagination, sorting, filtering)
  const handleTableChange = (paginationInfo, filters, sorter) => {
    const newFilters = {
      ...filters,
      page: paginationInfo.current,
      limit: paginationInfo.pageSize
    };
    setFilters(newFilters);
    loadPendingBookings(newFilters);
  };

  // Note: Using utility functions from bookingValidation.js for status helpers

  // Load data on component mount
  useEffect(() => {
    if (user?.role === 'admin') {
      loadPendingBookings();
    }
  }, [user]);

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <Alert
        message="Access Denied"
        description="Only administrators can access booking confirmation management."
        type="error"
        showIcon
      />
    );
  }

  // Table columns
  const columns = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerId',
      key: 'customer',
      render: (customer) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            <UserOutlined /> {customer?.name || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {customer?.email}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {customer?.phone}
          </div>
        </div>
      )
    },
    {
      title: 'Thợ cắt tóc',
      dataIndex: 'barberId',
      key: 'barber',
      render: (barber) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {barber?.userId?.name || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {barber?.userId?.email}
          </div>
        </div>
      )
    },
    {
      title: 'Dịch vụ',
      dataIndex: 'serviceId',
      key: 'service',
      render: (service) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{service?.name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {service?.price?.toLocaleString()}đ - {service?.durationMinutes}min
          </div>
        </div>
      )
    },
    {
      title: 'Thời gian đặt',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <div>
          <div>{dayjs(date).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {dayjs(date).format('HH:mm')}
          </div>
        </div>
      ),
      sorter: true
    },
    {
      title: 'Thời gian hẹn',
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
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => {
        const confirmationValidation = canConfirmBooking(record);

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

            {/* Enhanced confirmation button with validation */}
            {confirmationValidation.canConfirm ? (
              <Popconfirm
                title="Xác nhận booking này?"
                description="Sau khi xác nhận, booking sẽ hiển thị cho thợ cắt tóc."
                onConfirm={() => handleConfirmBooking(record._id)}
                okText="Xác nhận"
                cancelText="Hủy"
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={actionLoading}
                >
                  Xác nhận
                </Button>
              </Popconfirm>
            ) : (
              <Button
                size="small"
                type="primary"
                icon={<CheckCircleOutlined />}
                disabled
                title={confirmationValidation.reason}
              >
                Xác nhận
              </Button>
            )}

            {/* Rejection button - only for pending and confirmed bookings */}
            {['pending', 'confirmed'].includes(record.status) && (
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleRejectBooking(record)}
                loading={actionLoading}
                title="Từ chối lịch hẹn"
              >
                Từ chối
              </Button>
            )}

            {/* Show status message for non-confirmable bookings */}
            {!confirmationValidation.canConfirm && isBookingFinal(record) && (
              <span style={{ fontSize: '12px', color: '#999', marginLeft: '8px' }}>
                {getDisabledActionMessage(record, 'confirm')}
              </span>
            )}
          </Space>
        );
      }
    }
  ];

  // Row selection config with enhanced validation
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    getCheckboxProps: (record) => {
      const confirmationValidation = canConfirmBooking(record);
      return {
        disabled: !confirmationValidation.canConfirm,
        title: confirmationValidation.reason
      };
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2}>Quản lý xác nhận booking</Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={8}>
          <Card>
            <Statistic
              title="Tổng chờ xác nhận"
              value={stats.totalPending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8}>
          <Card>
            <Statistic
              title="Hôm nay"
              value={stats.todayPending}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={8}>
          <Card>
            <Statistic
              title="Tuần này"
              value={stats.weekPending}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Action Bar */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleBulkConfirm}
                loading={actionLoading}
                disabled={selectedRowKeys.length === 0}
              >
                Xác nhận đã chọn ({selectedRowKeys.length})
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => loadPendingBookings()}
                loading={loading}
              >
                Làm mới
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Pending Bookings Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={pendingBookings}
          rowKey="_id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} booking chờ xác nhận`
          }}
          onChange={handleTableChange}
        />
      </Card>

      {/* Booking Detail Modal */}
      <Modal
        title="Chi tiết booking"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>,
          selectedBooking && (() => {
            const confirmationValidation = canConfirmBooking(selectedBooking);

            if (confirmationValidation.canConfirm) {
              return (
                <Popconfirm
                  key="confirm"
                  title="Xác nhận booking này?"
                  description="Sau khi xác nhận, booking sẽ hiển thị cho thợ cắt tóc."
                  onConfirm={() => {
                    handleConfirmBooking(selectedBooking._id);
                    setDetailModalVisible(false);
                  }}
                  okText="Xác nhận"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={actionLoading}
                  >
                    Xác nhận booking
                  </Button>
                </Popconfirm>
              );
            } else {
              return (
                <Button
                  key="confirm"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  disabled
                  title={confirmationValidation.reason}
                >
                  Xác nhận booking
                </Button>
              );
            }
          })()
        ]}
        width={800}
      >
        {selectedBooking && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Mã booking" span={2}>
              {selectedBooking._id}
            </Descriptions.Item>
            <Descriptions.Item label="Khách hàng">
              {selectedBooking.customerId?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {selectedBooking.customerId?.email}
            </Descriptions.Item>
            <Descriptions.Item label="Số điện thoại">
              {selectedBooking.customerId?.phone || selectedBooking.customerPhone}
            </Descriptions.Item>
            <Descriptions.Item label="Thợ cắt tóc">
              {selectedBooking.barberId?.userId?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Dịch vụ">
              {selectedBooking.serviceId?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Giá">
              {selectedBooking.serviceId?.price?.toLocaleString()}đ
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian đặt">
              {dayjs(selectedBooking.createdAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian hẹn">
              {dayjs(selectedBooking.bookingDate).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Thời lượng">
              {selectedBooking.durationMinutes} phút
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái" span={2}>
              <Tag color={getStatusColor(selectedBooking.status)}>
                {getStatusText(selectedBooking.status)}
              </Tag>
            </Descriptions.Item>
            {selectedBooking.note && (
              <Descriptions.Item label="Ghi chú" span={2}>
                {selectedBooking.note}
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Booking Rejection Modal */}
      <BookingRejectionModal
        visible={rejectionModalVisible}
        onCancel={() => {
          setRejectionModalVisible(false);
          setSelectedBookingForRejection(null);
        }}
        onConfirm={handleRejectConfirm}
        booking={selectedBookingForRejection}
        loading={actionLoading}
      />
    </div>
  );
};

export default BookingConfirmationManagement;
