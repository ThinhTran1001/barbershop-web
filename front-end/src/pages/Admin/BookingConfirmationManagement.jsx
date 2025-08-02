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
  Alert,
  Radio,
  Divider,
  Tooltip,
  Rate
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
  StopOutlined,
  UserSwitchOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined
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

  // Assign barber modal states
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [bookingToAssign, setBookingToAssign] = useState(null);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [selectedBarberId, setSelectedBarberId] = useState(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [barberSearchTerm, setBarberSearchTerm] = useState('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('');

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

  // Handle assign barber
  const handleAssignBarber = async (booking) => {
    setBookingToAssign(booking);
    setAssignModalVisible(true);

    // Load available barbers for this booking
    try {
      const bookingDate = new Date(booking.bookingDate);
      const dateStr = bookingDate.toISOString().split('T')[0];
      const timeSlot = bookingDate.toTimeString().substring(0, 5);

      const response = await axios.get('/api/barbers/available-for-customers', {
        params: {
          date: dateStr,
          timeSlot: timeSlot,
          serviceId: booking.serviceId._id
        }
      });

      setAvailableBarbers(response.data.availableBarbers || []);
    } catch (error) {
      console.error('Error loading available barbers:', error);
      toast.error('Failed to load available barbers');
      setAvailableBarbers([]);
    }
  };

  // Filter barbers based on search term and specialty
  const getFilteredBarbers = () => {
    return availableBarbers.filter(barber => {
      const matchesSearch = !barberSearchTerm ||
        barber.userId?.name?.toLowerCase().includes(barberSearchTerm.toLowerCase()) ||
        barber.specialties?.some(specialty =>
          specialty.toLowerCase().includes(barberSearchTerm.toLowerCase())
        );

      const matchesSpecialty = !selectedSpecialtyFilter ||
        barber.specialties?.includes(selectedSpecialtyFilter);

      return matchesSearch && matchesSpecialty;
    });
  };

  const handleSaveAssignment = async () => {
    if (!selectedBarberId || !bookingToAssign) {
      toast.error('Please select a barber');
      return;
    }

    setAssignLoading(true);
    try {
      // Use the new booking assign API
      const response = await axios.put(`/api/bookings/${bookingToAssign._id}/assign-barber`, {
        newBarberId: selectedBarberId
      });

      toast.success('Barber assigned successfully!');

      // Close modal and refresh data
      setAssignModalVisible(false);
      setBookingToAssign(null);
      setSelectedBarberId(null);
      setAvailableBarbers([]);
      setBarberSearchTerm('');
      setSelectedSpecialtyFilter('');

      // Refresh bookings list
      loadPendingBookings();
    } catch (error) {
      console.error('Error assigning barber:', error);
      toast.error(error.response?.data?.message || 'Failed to assign barber');
    } finally {
      setAssignLoading(false);
    }
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

            {/* Assign Barber button - for pending and confirmed bookings */}
            {['pending', 'confirmed'].includes(record.status) && (
              <Button
                size="small"
                icon={<UserSwitchOutlined />}
                onClick={() => handleAssignBarber(record)}
                loading={actionLoading}
                title="Assign barber cho booking này"
              >
                Assign Barber
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
          selectedBooking && ['pending', 'confirmed'].includes(selectedBooking.status) && (
            <Button
              key="assign"
              icon={<UserSwitchOutlined />}
              onClick={() => {
                handleAssignBarber(selectedBooking);
                setDetailModalVisible(false);
              }}
            >
              Assign Barber
            </Button>
          ),
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

      {/* Assign Barber Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserSwitchOutlined />
            <span>Assign Barber to Booking</span>
          </div>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setBookingToAssign(null);
          setSelectedBarberId(null);
          setAvailableBarbers([]);
          setBarberSearchTerm('');
          setSelectedSpecialtyFilter('');
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setAssignModalVisible(false);
              setBookingToAssign(null);
              setSelectedBarberId(null);
              setAvailableBarbers([]);
              setBarberSearchTerm('');
              setSelectedSpecialtyFilter('');
            }}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={assignLoading}
            onClick={handleSaveAssignment}
            disabled={!selectedBarberId}
          >
            Assign Barber
          </Button>
        ]}
        width={1000}
      >
        {bookingToAssign && (
          <div>
            {/* Booking Summary */}
            <Card size="small" style={{ marginBottom: 16, background: '#f0f2f5' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div>
                    <Typography.Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                      {bookingToAssign.customerId?.name || bookingToAssign.customerName}
                    </Typography.Text>
                    <Tag color={bookingToAssign.status === 'confirmed' ? 'green' : 'orange'} style={{ marginLeft: 8 }}>
                      {bookingToAssign.status?.toUpperCase()}
                    </Tag>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Typography.Text type="secondary">
                      {bookingToAssign.serviceId?.name} • {dayjs(bookingToAssign.bookingDate).format('DD/MM/YYYY HH:mm')}
                    </Typography.Text>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ textAlign: 'right' }}>
                    <Typography.Text strong>Current Barber:</Typography.Text>
                    <br />
                    <Typography.Text>
                      {bookingToAssign.barberId?.userId?.name || 'Auto-assigned'}
                    </Typography.Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Row gutter={24}>
              {/* Left Column - Booking Details */}
              <Col span={14}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <CalendarOutlined />
                      <span>Booking Details</span>
                    </div>
                  }
                  style={{ height: '500px', overflow: 'hidden' }}
                >
                  <div style={{ height: '420px', overflowY: 'auto', paddingRight: 8 }}>
                    <Card
                      size="small"
                      style={{
                        marginBottom: 16,
                        border: selectedBarberId ? '2px solid #52c41a' : '1px solid #d9d9d9'
                      }}
                    >
                      {/* Booking Header */}
                      <div style={{ marginBottom: 12 }}>
                        <Row justify="space-between" align="middle">
                          <Col>
                            <Typography.Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                              {bookingToAssign.customerId?.name || bookingToAssign.customerName}
                            </Typography.Text>
                            <Tag
                              color={bookingToAssign.status === 'confirmed' ? 'green' : 'orange'}
                              style={{ marginLeft: 8 }}
                            >
                              {bookingToAssign.status?.toUpperCase()}
                            </Tag>
                          </Col>
                          <Col>
                            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                              ID: {bookingToAssign._id}
                            </Typography.Text>
                          </Col>
                        </Row>
                      </div>

                      {/* Booking Details */}
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text strong style={{ fontSize: '13px' }}>Service:</Typography.Text>
                            <br />
                            <Typography.Text style={{ fontSize: '14px' }}>
                              {bookingToAssign.serviceId?.name}
                            </Typography.Text>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text strong style={{ fontSize: '13px' }}>Price:</Typography.Text>
                            <br />
                            <Typography.Text style={{ fontSize: '14px', color: '#52c41a' }}>
                              {bookingToAssign.serviceId?.price?.toLocaleString()}đ
                            </Typography.Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text strong style={{ fontSize: '13px' }}>Date & Time:</Typography.Text>
                            <br />
                            <Typography.Text style={{ fontSize: '14px' }}>
                              {dayjs(bookingToAssign.bookingDate).format('DD/MM/YYYY HH:mm')}
                            </Typography.Text>
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <Typography.Text strong style={{ fontSize: '13px' }}>Duration:</Typography.Text>
                            <br />
                            <Typography.Text style={{ fontSize: '14px' }}>
                              {bookingToAssign.durationMinutes || bookingToAssign.serviceId?.durationMinutes} minutes
                            </Typography.Text>
                          </div>
                        </Col>
                      </Row>

                      {bookingToAssign.note && (
                        <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                            <InfoCircleOutlined style={{ marginRight: 4 }} />
                            Note:
                          </Typography.Text>
                          <br />
                          <Typography.Text style={{ fontSize: '13px' }}>{bookingToAssign.note}</Typography.Text>
                        </div>
                      )}

                      {/* Assignment Status */}
                      <Divider style={{ margin: '12px 0' }} />
                      <div>
                        {selectedBarberId ? (
                          <Alert
                            message="New Barber Selected"
                            description={
                              availableBarbers.find(b => b._id === selectedBarberId)?.userId?.name
                            }
                            type="success"
                            showIcon
                            style={{ marginBottom: 8 }}
                          />
                        ) : (
                          <Alert
                            message="Select a Barber"
                            description="Choose a barber from the available list on the right"
                            type="warning"
                            showIcon
                            style={{ marginBottom: 8 }}
                          />
                        )}
                      </div>
                    </Card>
                  </div>
                </Card>
              </Col>

              {/* Right Column - Available Barbers */}
              <Col span={10}>
                <Card
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserOutlined />
                      <span>Available Barbers</span>
                    </div>
                  }
                  extra={
                    <Tooltip title="Search by name or specialty">
                      <Input
                        placeholder="Search barbers..."
                        prefix={<SearchOutlined />}
                        value={barberSearchTerm}
                        onChange={(e) => setBarberSearchTerm(e.target.value)}
                        style={{ width: 200 }}
                        size="small"
                      />
                    </Tooltip>
                  }
                  style={{ height: '500px', overflow: 'hidden' }}
                >
                  {/* Specialty Filter */}
                  <div style={{ marginBottom: 16 }}>
                    <Select
                      placeholder="Filter by specialty"
                      style={{ width: '100%' }}
                      value={selectedSpecialtyFilter}
                      onChange={setSelectedSpecialtyFilter}
                      allowClear
                    >
                      {[...new Set(availableBarbers.flatMap(b => b.specialties || []).filter(Boolean))].map(specialty => (
                        <Select.Option key={specialty} value={specialty}>{specialty}</Select.Option>
                      ))}
                    </Select>
                  </div>

                  <div style={{ height: '380px', overflowY: 'auto', paddingRight: 8 }}>
                    {availableBarbers.length > 0 ? (
                      getFilteredBarbers().map(barber => (
                        <Card
                          key={barber._id}
                          size="small"
                          style={{
                            marginBottom: 12,
                            cursor: 'pointer',
                            border: selectedBarberId === barber._id ? '2px solid #52c41a' : '1px solid #d9d9d9'
                          }}
                          hoverable
                          onClick={() => setSelectedBarberId(barber._id)}
                        >
                          <Row align="middle" gutter={12}>
                            <Col span={4}>
                              <Avatar
                                src={barber.profileImageUrl}
                                icon={<UserOutlined />}
                                size={40}
                              />
                            </Col>
                            <Col span={20}>
                              <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography.Text strong style={{ fontSize: '14px' }}>
                                    {barber.userId?.name || barber.name}
                                  </Typography.Text>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <Rate
                                      disabled
                                      defaultValue={barber.averageRating || 4.5}
                                      style={{ fontSize: '12px' }}
                                    />
                                    <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
                                      ({barber.completedBookings || 0})
                                    </Typography.Text>
                                  </div>
                                </div>

                                <div style={{ marginTop: 4 }}>
                                  <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                                    {barber.specialties && barber.specialties.length > 0
                                      ? barber.specialties.slice(0, 2).join(', ') + (barber.specialties.length > 2 ? '...' : '')
                                      : 'No specialties listed'
                                    }
                                  </Typography.Text>
                                </div>

                                <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography.Text type="secondary" style={{ fontSize: '11px' }}>
                                    <ClockCircleOutlined style={{ marginRight: 2 }} />
                                    {barber.workingHours?.start || '09:00'} - {barber.workingHours?.end || '18:00'}
                                  </Typography.Text>

                                  {barber.isAvailableForSlot !== false ? (
                                    <Tag color="green" style={{ fontSize: '10px', margin: 0 }}>
                                      <CheckCircleOutlined style={{ marginRight: 2 }} />
                                      Available
                                    </Tag>
                                  ) : (
                                    <Tooltip title={barber.conflictReason || 'Time conflict'}>
                                      <Tag color="orange" style={{ fontSize: '10px', margin: 0 }}>
                                        <WarningOutlined style={{ marginRight: 2 }} />
                                        Conflict
                                      </Tag>
                                    </Tooltip>
                                  )}
                                </div>

                                {/* Selection indicator */}
                                {selectedBarberId === barber._id && (
                                  <div style={{ marginTop: 8 }}>
                                    <Tag color="success" style={{ fontSize: '10px' }}>
                                      <CheckCircleOutlined style={{ marginRight: 2 }} />
                                      Selected for assignment
                                    </Tag>
                                  </div>
                                )}
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      ))
                    ) : (
                      <Alert
                        message="No available barbers"
                        description="No barbers are available for this time slot."
                        type="warning"
                        showIcon
                      />
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingConfirmationManagement;
