// MyBookingsPage.jsx
import React, { useEffect, useState } from 'react';
import {
  Table,
  Typography,
  Spin,
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
  Divider,
  Form,
  Alert,
  Tooltip,
  Avatar
} from 'antd';
import { toast } from 'react-toastify';
import {
  getMyBookings,
  updateBookingStatus,
  cancelBooking,
  updateBooking,
  getServices,
  getBarbers
} from '../../services/serviceApi.js';
import {
  getFeedbackBookingByBookingId,
  createFeedbackBooking
} from '../../services/api';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  EyeOutlined,
  SaveOutlined,
  CloseOutlined
} from '@ant-design/icons';
import TimeSlotPicker from '../../components/TimeSlotPicker';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  canCancelBooking,
  getStatusText,
  getStatusColor,
  getDisabledActionMessage,
  isBookingFinal
} from '../../utils/bookingValidation';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackStatuses, setFeedbackStatuses] = useState({});

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

  // Edit booking states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [barbersLoading, setBarbersLoading] = useState(false);

  // Load bookings with filters
  const loadBookings = async (newFilters = filters) => {
    setLoading(true);
    try {
      const response = await getMyBookings(newFilters);
      const data = response.bookings || response;
      const paginationData = response.pagination;

      setBookings(Array.isArray(data) ? data : []);

      // Fetch feedback status for each booking
      const statuses = {};
      for (const booking of data) {
        try {
          const feedbackResponse = await getFeedbackBookingByBookingId(booking._id);
          statuses[booking._id] = feedbackResponse.data.status;
        } catch (feedbackError) {
          statuses[booking._id] = null; // Chưa có feedback hoặc lỗi
        }
      }
      setFeedbackStatuses(statuses);

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
      toast.error('⚠️ Please enter a cancellation reason', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setActionLoading(true);

    // Show loading toast
    const loadingToastId = toast.loading(
      `❌ Cancelling booking for ${selectedBooking.serviceId?.name || 'service'}...`,
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
      await cancelBooking(selectedBooking._id, cancelReason);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `✅ Booking cancelled successfully!\n📅 Service: ${selectedBooking.serviceId?.name || 'Unknown'}\n💰 Refund will be processed according to our cancellation policy.`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      setCancelModalVisible(false);
      setCancelReason('');
      setSelectedBooking(null);
      loadBookings();
    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to cancel booking\n${error.response?.data?.message || 'Please try again'}`,
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

  // Check if booking can be cancelled (enhanced with validation utilities)
  const canCancelBookingWithTimeCheck = (booking) => {
    // First check basic cancellation validation
    const basicValidation = canCancelBooking(booking);
    if (!basicValidation.canCancel) {
      return { canCancel: false, reason: basicValidation.reason };
    }

    // Then check time restrictions
    const bookingTime = dayjs(booking.bookingDate);
    const now = dayjs();
    const hoursDifference = bookingTime.diff(now, 'hour');

    if (hoursDifference < 2) {
      return {
        canCancel: false,
        reason: 'Cannot cancel booking less than 2 hours before appointment time'
      };
    }

    return { canCancel: true, reason: null };
  };

  // Check if booking can be edited
  const canEditBooking = (booking) => {
    // Only allow editing of pending or confirmed bookings
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return {
        canEdit: false,
        reason: `Cannot edit ${booking.status} bookings`
      };
    }

    // Check if booking is in the past
    const bookingTime = dayjs(booking.bookingDate);
    const now = dayjs();

    if (bookingTime.isBefore(now)) {
      return {
        canEdit: false,
        reason: 'Cannot edit past bookings'
      };
    }

    // Check if booking is within 24 hours
    const hoursDifference = bookingTime.diff(now, 'hour');
    if (hoursDifference < 24) {
      return {
        canEdit: false,
        reason: 'Cannot edit bookings within 24 hours of appointment time'
      };
    }

    return { canEdit: true, reason: null };
  };

  // Load services for edit modal
  const loadServices = async () => {
    setServicesLoading(true);
    try {
      const response = await getServices();
      setServices(response.services || response);
    } catch (error) {
      toast.error('Failed to load services', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setServicesLoading(false);
    }
  };

  // Load barbers for edit modal
  const loadBarbers = async () => {
    setBarbersLoading(true);
    try {
      const response = await getBarbers();
      setBarbers(response.barbers || response);
    } catch (error) {
      toast.error('Failed to load barbers', {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setBarbersLoading(false);
    }
  };

  // Handle edit booking button click
  const handleEditBooking = async (booking) => {
    setSelectedBooking(booking);

    // Show loading toast while loading data
    const loadingToastId = toast.loading('📋 Loading services and barbers...', {
      position: "top-right",
      autoClose: false,
    });

    try {
      // Load services and barbers
      await Promise.all([loadServices(), loadBarbers()]);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: '✅ Ready to edit booking!',
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });

      // Set initial form values after data is loaded
      setTimeout(() => {
        const service = services.find(s => s._id === booking.serviceId?._id) || booking.serviceId;
        const barber = barbers.find(b => b._id === booking.barberId?._id) || booking.barberId;

        setSelectedService(service);
        setSelectedBarber(barber);
        setSelectedTimeSlot(null);

        editForm.setFieldsValue({
          serviceId: booking.serviceId?._id,
          barberId: booking.barberId?._id || 'auto',
          note: booking.note || ''
        });

        setEditModalVisible(true);
      }, 100); // Small delay to ensure state is updated

    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: '❌ Failed to load booking data',
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    }
  };

  // Handle service change in edit form
  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    setSelectedService(service);
    setSelectedTimeSlot(null); // Reset time slot when service changes

    // Show feedback toast
    toast.info(`📋 Service changed to: ${service?.name}`, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: true,
    });
  };

  // Handle barber change in edit form
  const handleBarberChange = (barberId) => {
    if (barberId === 'auto') {
      setSelectedBarber(null);
      toast.info('👤 Barber set to auto-assign', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    } else {
      const barber = barbers.find(b => b._id === barberId);
      setSelectedBarber(barber);
      toast.info(`👤 Barber changed to: ${barber?.userId?.name}`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
      });
    }
    setSelectedTimeSlot(null); // Reset time slot when barber changes
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (timeSlotData) => {
    setSelectedTimeSlot(timeSlotData);
  };

  // Handle booking update
  const handleUpdateBooking = async () => {
    if (!selectedTimeSlot) {
      toast.warn('⚠️ Please select a new time slot', {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setEditLoading(true);

    // Show loading toast
    const loadingToastId = toast.loading(
      `📝 Updating your booking...`,
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
      const formValues = await editForm.validateFields();

      // Construct booking date properly without forcing UTC
      const [year, month, day] = selectedTimeSlot.date.split('-');
      const [hour, minute] = selectedTimeSlot.time.split(':');
      const bookingDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1, // Month is 0-indexed
        parseInt(day),
        parseInt(hour),
        parseInt(minute)
      );

      const updateData = {
        serviceId: formValues.serviceId,
        barberId: formValues.barberId === 'auto' ? null : formValues.barberId,
        bookingDate: bookingDateTime.toISOString(),
        note: formValues.note || '',
        durationMinutes: selectedService?.durationMinutes || 30
      };

      await updateBooking(selectedBooking._id, updateData);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `🎉 Booking updated successfully!\n📅 Service: ${selectedService?.name || 'Unknown'}\n👤 Barber: ${selectedBarber?.userId?.name || 'Auto-assigned'}\n🕐 New time: ${selectedTimeSlot.date} at ${selectedTimeSlot.time}`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Close modal and refresh bookings
      setEditModalVisible(false);
      setSelectedBooking(null);
      setSelectedService(null);
      setSelectedBarber(null);
      setSelectedTimeSlot(null);
      editForm.resetFields();
      loadBookings();

    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to update booking\n${error.response?.data?.message || 'Please try again'}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setEditLoading(false);
    }
  };

  // Check if booking can be reviewed
  const canReviewBooking = (booking) => {
    return booking.status === 'completed' && !feedbackStatuses[booking._id];
  };

  // Handle feedback navigation (giống OrderDetail)
  const handleFeedback = async (booking) => {
    try {
      const existing = await getFeedbackBookingByBookingId(booking._id);
      if (existing?.data) {
        navigate(`/feedback/${booking._id}`);
        return;
      }
    } catch (err) {
      if (err.response?.status === 404) {
        try {
          await createFeedbackBooking({ bookingId: booking._id, userId: booking.customerId });
          navigate(`/feedback/${booking._id}`);
          return;
        } catch (createError) {
          console.error('Lỗi tạo mới feedback:', createError);
          message.error('Không thể tạo feedback mới.');
          return;
        }
      } else {
        console.error('Lỗi kiểm tra feedback:', err);
        message.error('Không thể kiểm tra trạng thái feedback.');
      }
    }
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
      render: (_, record) => {
        const cancelValidation = canCancelBookingWithTimeCheck(record);
        const editValidation = canEditBooking(record);

        return (
          <Space direction="vertical" size="small">
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

              {/* Edit button with validation */}
              {editValidation.canEdit ? (
                <Button
                  size="small"
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => handleEditBooking(record)}
                >
                  Sửa
                </Button>
              ) : (
                <Tooltip title={editValidation.reason}>
                  <Button
                    size="small"
                    type="primary"
                    icon={<EditOutlined />}
                    disabled
                  >
                    Sửa
                  </Button>
                </Tooltip>
              )}

              {/* Enhanced cancel button with validation */}
              {cancelValidation.canCancel ? (
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
              ) : (
                <Tooltip title={cancelValidation.reason}>
                  <Button
                    size="small"
                    danger
                    disabled
                  >
                    Hủy lịch
                  </Button>
                </Tooltip>
              )}

              {canReviewBooking(record) && (
                <Button
                  size="small"
                  type="default"
                  icon={<StarOutlined />}
                  onClick={() => handleFeedback(record)}
                >
                  Đánh giá
                </Button>
              )}
            </Space>

            {/* Show status message for non-editable/non-cancellable bookings */}
            {(!editValidation.canEdit || !cancelValidation.canCancel) && isBookingFinal(record) && (
              <div style={{ fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
                {getDisabledActionMessage(record, 'modify')}
              </div>
            )}
          </Space>
        );
      }
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
        open={cancelModalVisible}
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
        open={detailModalVisible}
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
            {canReviewBooking(selectedBooking) && (
              <Descriptions.Item label="Đánh giá">
                <Button
                  type="primary"
                  icon={<StarOutlined />}
                  onClick={() => handleFeedback(selectedBooking)}
                >
                  Đánh giá barber
                </Button>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

      {/* Edit Booking Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <EditOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Edit Booking
          </div>
        }
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setSelectedBooking(null);
          setSelectedService(null);
          setSelectedBarber(null);
          setSelectedTimeSlot(null);
          editForm.resetFields();
        }}
        width={800}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setEditModalVisible(false);
              setSelectedBooking(null);
              setSelectedService(null);
              setSelectedBarber(null);
              setSelectedTimeSlot(null);
              editForm.resetFields();
            }}
          >
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<SaveOutlined />}
            loading={editLoading}
            onClick={handleUpdateBooking}
            disabled={!selectedTimeSlot}
          >
            Update Booking
          </Button>
        ]}
      >
        {selectedBooking && (
          <div>
            {/* Current booking info */}
            <Alert
              message="Current Booking Details"
              description={
                <div>
                  <div><strong>Service:</strong> {selectedBooking.serviceId?.name}</div>
                  <div><strong>Barber:</strong> {selectedBooking.barberId?.userId?.name || 'Auto-assigned'}</div>
                  <div><strong>Date & Time:</strong> {dayjs(selectedBooking.bookingDate).format('DD/MM/YYYY HH:mm')}</div>
                  <div><strong>Duration:</strong> {selectedBooking.durationMinutes || 30} minutes</div>
                </div>
              }
              type="info"
              style={{ marginBottom: 24 }}
            />

            <Form
              form={editForm}
              layout="vertical"
              onValuesChange={(changedValues) => {
                if (changedValues.serviceId) {
                  handleServiceChange(changedValues.serviceId);
                }
                if (changedValues.barberId !== undefined) {
                  handleBarberChange(changedValues.barberId);
                }
              }}
            >
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Service</span>
                        {selectedService && (
                          <Tag color="blue" style={{ margin: 0 }}>
                            {selectedService.durationMinutes} min
                          </Tag>
                        )}
                      </div>
                    }
                    name="serviceId"
                    rules={[{ required: true, message: 'Please select a service' }]}
                  >
                    <Select
                      placeholder={servicesLoading ? "Loading services..." : "Choose a service..."}
                      loading={servicesLoading}
                      onChange={handleServiceChange}
                      size="large"
                      showSearch
                      filterOption={(input, option) =>
                        option.children.props.children[0].props.children.toLowerCase().includes(input.toLowerCase())
                      }
                      notFoundContent={servicesLoading ? <Spin size="small" /> : "No services available"}
                      popupMatchSelectWidth={false}
                      style={{ width: '100%' }}
                    >
                      {services.length === 0 && !servicesLoading ? (
                        <Option disabled value="no-services">
                          <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                            <div>No services available</div>
                            <div style={{ fontSize: '12px' }}>Please contact support</div>
                          </div>
                        </Option>
                      ) : (
                        services.map(service => (
                        <Option key={service._id} value={service._id}>
                          <Card
                            size="small"
                            style={{
                              margin: '4px 0',
                              border: selectedService?._id === service._id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                              backgroundColor: selectedService?._id === service._id ? '#f6ffed' : 'white'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                  {service.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                                  {service.description || 'Professional service'}
                                </div>
                                <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                                  Duration: {service.durationMinutes} minutes
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 'bold', color: '#1890ff', fontSize: '16px' }}>
                                  {service.price?.toLocaleString()} VND
                                </div>
                                {selectedService?._id === service._id && (
                                  <Tag color="success" size="small" style={{ marginTop: 4 }}>
                                    Selected
                                  </Tag>
                                )}
                              </div>
                            </div>
                          </Card>
                        </Option>
                        ))
                      )}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    label={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Barber</span>
                        {selectedBarber && (
                          <Tag color="green" style={{ margin: 0 }}>
                            Specialist
                          </Tag>
                        )}
                      </div>
                    }
                    name="barberId"
                    rules={[{ required: true, message: 'Please select a barber' }]}
                  >
                    <Select
                      placeholder={barbersLoading ? "Loading barbers..." : "Choose a barber..."}
                      loading={barbersLoading}
                      onChange={handleBarberChange}
                      size="large"
                      showSearch
                      filterOption={(input, option) => {
                        try {
                          return option.children.props.children.props.children[0].props.children.toLowerCase().includes(input.toLowerCase());
                        } catch {
                          return true; // Fallback for auto-assign option
                        }
                      }}
                      notFoundContent={barbersLoading ? <Spin size="small" /> : "No barbers available"}
                      popupMatchSelectWidth={false}
                      style={{ width: '100%' }}
                    >
                      <Option value="auto">
                        <Card
                          size="small"
                          style={{
                            margin: '4px 0',
                            border: !selectedBarber ? '2px solid #52c41a' : '1px solid #f0f0f0',
                            backgroundColor: !selectedBarber ? '#f6ffed' : 'white'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar
                              style={{ backgroundColor: '#52c41a' }}
                              icon={<UserOutlined />}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                Auto-assign Best Barber
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                                System will automatically assign the most suitable available barber
                              </div>
                              <div style={{ fontSize: '11px', color: '#52c41a', marginTop: 2 }}>
                                ✓ Recommended for optimal scheduling
                              </div>
                            </div>
                            {!selectedBarber && (
                              <Tag color="success" size="small">
                                Selected
                              </Tag>
                            )}
                          </div>
                        </Card>
                      </Option>
                      {barbers.map(barber => (
                        <Option key={barber._id} value={barber._id}>
                          <Card
                            size="small"
                            style={{
                              margin: '4px 0',
                              border: selectedBarber?._id === barber._id ? '2px solid #1890ff' : '1px solid #f0f0f0',
                              backgroundColor: selectedBarber?._id === barber._id ? '#f6ffed' : 'white'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <Avatar
                                style={{ backgroundColor: '#1890ff' }}
                                src={barber.userId?.avatar}
                              >
                                {barber.userId?.name?.charAt(0)?.toUpperCase()}
                              </Avatar>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                                  {barber.userId?.name}
                                </div>
                                <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
                                  {barber.specialties?.length > 0
                                    ? `Specialties: ${barber.specialties.slice(0, 2).join(', ')}${barber.specialties.length > 2 ? '...' : ''}`
                                    : 'General services'
                                  }
                                </div>
                                <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                                  Experience: {barber.experienceYears || 'N/A'} years
                                  {barber.rating && (
                                    <span style={{ marginLeft: 8 }}>
                                      ⭐ {barber.rating.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {selectedBarber?._id === barber._id && (
                                <Tag color="success" size="small">
                                  Selected
                                </Tag>
                              )}
                            </div>
                          </Card>
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Service Comparison */}
              {selectedService && (
                <div style={{ marginBottom: 16 }}>
                  <Alert
                    message="Service Selection Summary"
                    description={
                      <Row gutter={16}>
                        <Col span={12}>
                          <Card size="small" title="Current Service" style={{ backgroundColor: '#fff2e8' }}>
                            <div><strong>Name:</strong> {selectedBooking.serviceId?.name}</div>
                            <div><strong>Duration:</strong> {selectedBooking.durationMinutes || 30} minutes</div>
                            <div><strong>Price:</strong> {selectedBooking.serviceId?.price?.toLocaleString() || 'N/A'} VND</div>
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" title="New Service" style={{ backgroundColor: '#f6ffed' }}>
                            <div><strong>Name:</strong> {selectedService.name}</div>
                            <div><strong>Duration:</strong> {selectedService.durationMinutes} minutes</div>
                            <div><strong>Price:</strong> {selectedService.price?.toLocaleString()} VND</div>
                            {selectedService.price !== selectedBooking.serviceId?.price && (
                              <div style={{ marginTop: 8 }}>
                                <Tag color={selectedService.price > selectedBooking.serviceId?.price ? 'red' : 'green'}>
                                  {selectedService.price > selectedBooking.serviceId?.price ? '+' : ''}
                                  {(selectedService.price - (selectedBooking.serviceId?.price || 0)).toLocaleString()} VND
                                </Tag>
                              </div>
                            )}
                          </Card>
                        </Col>
                      </Row>
                    }
                    type="info"
                    showIcon
                  />
                </div>
              )}

              {/* Barber Comparison */}
              {(selectedBarber || editForm.getFieldValue('barberId') === 'auto') && (
                <div style={{ marginBottom: 16 }}>
                  <Alert
                    message="Barber Selection Summary"
                    description={
                      <Row gutter={16}>
                        <Col span={12}>
                          <Card size="small" title="Current Barber" style={{ backgroundColor: '#fff2e8' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Avatar size="small" style={{ backgroundColor: '#faad14' }}>
                                {selectedBooking.barberId?.userId?.name?.charAt(0)?.toUpperCase() || 'A'}
                              </Avatar>
                              <div>
                                <div><strong>{selectedBooking.barberId?.userId?.name || 'Auto-assigned'}</strong></div>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                  {selectedBooking.barberId?.specialties?.join(', ') || 'General services'}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </Col>
                        <Col span={12}>
                          <Card size="small" title="New Barber" style={{ backgroundColor: '#f6ffed' }}>
                            {editForm.getFieldValue('barberId') === 'auto' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar size="small" style={{ backgroundColor: '#52c41a' }} icon={<UserOutlined />} />
                                <div>
                                  <div><strong>Auto-assign</strong></div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    Best available barber
                                  </div>
                                </div>
                              </div>
                            ) : selectedBarber ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                                  {selectedBarber.userId?.name?.charAt(0)?.toUpperCase()}
                                </Avatar>
                                <div>
                                  <div><strong>{selectedBarber.userId?.name}</strong></div>
                                  <div style={{ fontSize: '12px', color: '#666' }}>
                                    {selectedBarber.specialties?.join(', ') || 'General services'}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: '#999' }}>No barber selected</div>
                            )}
                          </Card>
                        </Col>
                      </Row>
                    }
                    type="success"
                    showIcon
                  />
                </div>
              )}

              <Form.Item
                label="Special Requests / Notes"
                name="note"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Any special requests or notes for the barber..."
                />
              </Form.Item>
            </Form>

            {/* Time Slot Selection */}
            {selectedService && (selectedBarber || editForm.getFieldValue('barberId') === 'auto') && (
              <div style={{ marginTop: 24 }}>
                <Divider>Select New Time Slot</Divider>
                <TimeSlotPicker
                  barberId={selectedBarber?._id || null}
                  serviceId={selectedService._id}
                  durationMinutes={selectedService.durationMinutes}
                  onSelect={handleTimeSlotSelect}
                />

                {selectedTimeSlot && (
                  <Alert
                    message="New Time Slot Selected"
                    description={`${selectedTimeSlot.label} (${selectedService.durationMinutes} minutes)`}
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyBookingsPage;