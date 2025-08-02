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
  Spin,
  Tooltip,
  Alert
} from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/toast-custom.css';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  LeftOutlined,
  RightOutlined
} from '@ant-design/icons';
import { getBarberBookings } from '../../services/barberApi.js';
import { getBarberCalendar } from '../../services/barberAbsenceApi.js';
import { updateBookingStatus, markBookingNoShow } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getUserIdFromToken } from '../../utils/tokenUtils.js';
import NoShowConfirmationModal from '../../components/NoShowConfirmationModal.jsx';
import dayjs from 'dayjs';

const { Title } = Typography;

const BarberCalendarPage = () => {
  const { user, getUserId } = useAuth();
  const [loading, setLoading] = useState(true);

  // Configure toast settings
  useEffect(() => {
    // Toast configuration is handled by ToastContainer props
  }, []);
  const [bookings, setBookings] = useState([]);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [noShowModalVisible, setNoShowModalVisible] = useState(false);
  const [selectedBookingForNoShow, setSelectedBookingForNoShow] = useState(null);
  
  // Statistics (barbers only see confirmed bookings)
  const [stats, setStats] = useState({
    todayBookings: 0,
    weekBookings: 0,
    monthBookings: 0,
    confirmedBookings: 0
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

      // Welcome toast
      toast.success('🎉 Chào mừng! Lịch làm việc đã được tải thành công.', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } else {
      toast.error('❌ Lỗi xác thực: Không tìm thấy thông tin thợ cắt tóc. Vui lòng liên hệ quản trị viên.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
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

      // Success toast for calendar data
      toast.success('✅ Dữ liệu lịch làm việc đã được cập nhật', {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error('Error loading calendar data:', error);
      toast.error('❌ Lỗi tải dữ liệu: Không thể tải dữ liệu lịch làm việc. Vui lòng thử lại sau.', {
        position: "top-right",
        autoClose: 4000,
      });
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

      // Success notification with booking count
      const bookingCount = bookingsData.length;
      const todayBookings = bookingsData.filter(booking =>
        dayjs(booking.bookingDate).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD')
      ).length;

      // Different toasts based on today's bookings
      if (todayBookings === 0) {
        toast.info(`ℹ️ Hôm nay không có lịch hẹn. Bạn có thể nghỉ ngơi hoặc chuẩn bị cho những ngày tiếp theo. Tháng này có ${bookingCount} lịch hẹn.`, {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        toast.success(`📅 Lịch làm việc đã sẵn sàng! Hôm nay: ${todayBookings} lịch hẹn | Tháng này: ${bookingCount} lịch hẹn`, {
          position: "top-right",
          autoClose: 4000,
        });
      }

    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('❌ Lỗi tải lịch hẹn: Không thể tải danh sách lịch hẹn. Vui lòng kiểm tra kết nối mạng và thử lại.', {
        position: "top-right",
        autoClose: 4000,
      });
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

    const confirmedBookings = bookingsData.filter(booking =>
      booking.status === 'confirmed'
    ).length;

    setStats({
      todayBookings,
      weekBookings,
      monthBookings,
      confirmedBookings
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

    // Notification for selected date
    const formattedDate = value.format('DD/MM/YYYY');
    const bookingCount = dayBookings.length;

    if (bookingCount > 0) {
      toast.info(`📅 Ngày ${formattedDate}: ${bookingCount} lịch hẹn`, {
        position: "top-right",
        autoClose: 2000,
      });
    } else {
      toast.info(`📅 Ngày ${formattedDate}: Không có lịch hẹn`, {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  const handleBookingStatusUpdate = async (bookingId, newStatus) => {
    setActionLoading(true);

    // Find the booking being updated for better notification
    const booking = bookings.find(b => b._id === bookingId);
    const customerName = booking?.customerName || 'Khách hàng';
    const serviceName = booking?.serviceId?.name || 'Dịch vụ';
    const bookingTime = booking ? dayjs(booking.bookingDate).format('HH:mm DD/MM/YYYY') : '';

    try {
      await updateBookingStatus(bookingId, newStatus);

      // Enhanced success notification based on status
      const statusMessages = {
        'completed': {
          message: 'Hoàn thành dịch vụ',
          description: `Đã hoàn thành dịch vụ "${serviceName}" cho ${customerName} lúc ${bookingTime}`,
          icon: '✅'
        },
        'no_show': {
          message: 'Đánh dấu không đến',
          description: `Đã đánh dấu ${customerName} không đến cho lịch hẹn "${serviceName}" lúc ${bookingTime}`,
          icon: '❌'
        },
        'cancelled': {
          message: 'Hủy lịch hẹn',
          description: `Đã hủy lịch hẹn "${serviceName}" cho ${customerName} lúc ${bookingTime}`,
          icon: '🚫'
        }
      };

      const statusInfo = statusMessages[newStatus] || {
        message: 'Cập nhật trạng thái',
        description: `Đã cập nhật trạng thái lịch hẹn thành "${getStatusText(newStatus)}"`,
        icon: 'ℹ️'
      };

      toast.success(`${statusInfo.icon} ${statusInfo.message}: ${statusInfo.description}`, {
        position: "top-right",
        autoClose: 4000,
      });

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
      console.error('Error updating booking status:', error);

      // Enhanced error toast
      toast.error(`❌ Lỗi cập nhật trạng thái: Không thể cập nhật trạng thái cho lịch hẹn của ${customerName}. ${error.response?.data?.message || 'Vui lòng thử lại sau.'}`, {
        position: "top-right",
        autoClose: 5000,
      });
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

  // Time-based validation for no-show marking
  const canMarkNoShow = (booking) => {
    const now = dayjs();
    const bookingStart = dayjs(booking.bookingDate);

    // Only allow no-show marking during or after booking time
    return now.isAfter(bookingStart) || now.isSame(bookingStart, 'minute');
  };

  // Handle no-show with confirmation modal
  const handleNoShowClick = (booking) => {
    // Check time-based validation
    if (!canMarkNoShow(booking)) {
      const bookingStart = dayjs(booking.bookingDate);
      const minutesUntilStart = bookingStart.diff(dayjs(), 'minute');

      toast.warning(`⏰ Chỉ có thể đánh dấu không đến từ thời gian bắt đầu lịch hẹn. Còn ${minutesUntilStart} phút nữa.`, {
        position: "top-right",
        autoClose: 4000,
      });
      return;
    }

    setSelectedBookingForNoShow(booking);
    setNoShowModalVisible(true);
  };

  // Handle no-show confirmation
  const handleNoShowConfirm = async (data) => {
    try {
      await markBookingNoShow(selectedBookingForNoShow._id, data);

      // Reload bookings to reflect changes
      if (barberId) {
        loadBookings(barberId);
      }

      // Update the selected date bookings
      const updatedBookings = selectedDateBookings.map(booking =>
        booking._id === selectedBookingForNoShow._id
          ? { ...booking, status: 'no_show' }
          : booking
      );
      setSelectedDateBookings(updatedBookings);

    } catch (error) {
      throw error; // Let the modal handle the error display
    }
  };

  // Refresh function
  const handleRefresh = async () => {
    if (!barberId) return;

    setRefreshLoading(true);
    try {
      await Promise.all([
        loadCalendarData(barberId),
        loadBookings(barberId)
      ]);

      toast.success('🔄 Làm mới thành công: Dữ liệu lịch làm việc đã được cập nhật mới nhất', {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      toast.error('❌ Lỗi làm mới: Không thể làm mới dữ liệu. Vui lòng thử lại.', {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setRefreshLoading(false);
    }
  };

  // Month navigation with toasts
  const handleMonthChange = async (newDate) => {
    const monthName = newDate.format('MMMM YYYY');

    // Show loading toast
    const loadingToastId = toast.loading(`⏳ Đang tải dữ liệu tháng ${monthName}...`);

    // Reload data for new month if needed
    if (barberId && userId) {
      try {
        // Load both bookings and calendar data (including absences) for the new month
        await Promise.all([
          loadBookings(barberId),
          loadCalendarData(userId)
        ]);
        toast.update(loadingToastId, {
          render: `✅ Đã chuyển đến tháng ${monthName}`,
          type: "success",
          isLoading: false,
          autoClose: 2000,
        });
      } catch (error) {
        toast.update(loadingToastId, {
          render: `❌ Lỗi tải dữ liệu tháng ${monthName}`,
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
      }
    } else {
      toast.dismiss(loadingToastId);
    }
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
              title="Đã xác nhận"
              value={stats.confirmedBookings}
              prefix={<CheckCircleOutlined />}
              suffix="lịch hẹn"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Calendar */}
      <Card title="Lịch làm việc" style={{ marginBottom: 24 }}>
        <Calendar
          cellRender={dateCellRender}
          onSelect={onSelect}
          headerRender={({ value, onChange }) => (
            <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Title level={4} style={{ margin: 0 }}>
                {value.format('MMMM YYYY')}
              </Title>
              <Space>
                <Button
                  icon={<LeftOutlined />}
                  onClick={() => {
                    const newDate = value.clone().subtract(1, 'month');
                    onChange(newDate);
                    handleMonthChange(newDate);
                  }}
                >
                  Tháng trước
                </Button>
                <Button
                  type="primary"
                  onClick={() => {
                    const today = dayjs();
                    onChange(today);
                    handleMonthChange(today);
                  }}
                >
                  Hôm nay
                </Button>
                <Button
                  icon={<RightOutlined />}
                  onClick={() => {
                    const newDate = value.clone().add(1, 'month');
                    onChange(newDate);
                    handleMonthChange(newDate);
                  }}
                >
                  Tháng sau
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  loading={refreshLoading}
                  onClick={handleRefresh}
                  title="Làm mới dữ liệu"
                >
                  Làm mới
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
                // Barbers can no longer confirm pending bookings - only admins can
                booking.status === 'confirmed' && (() => {
                  const bookingDate = dayjs(booking.bookingDate);
                  const today = dayjs();
                  const isToday = bookingDate.isSame(today, 'day');
                  const isPast = bookingDate.isBefore(today, 'day');

                  if (isToday) {
                    // Booking hôm nay - có thể hoàn thành hoặc không đến
                    return [
                      <Button
                        key="complete"
                        size="small"
                        type="primary"
                        onClick={() => handleBookingStatusUpdate(booking._id, 'completed')}
                        loading={actionLoading}
                        style={{ marginRight: 8 }}
                      >
                        Hoàn thành
                      </Button>,
                      <Button
                        key="no-show"
                        size="small"
                        type="default"
                        danger
                        onClick={() => handleNoShowClick(booking)}
                        loading={actionLoading}
                      >
                        Không đến
                      </Button>
                    ];
                  } else if (isPast) {
                    // Booking ngày trước - chỉ có thể đánh dấu không đến
                    return (
                      <Button
                        size="small"
                        type="default"
                        danger
                        onClick={() => handleNoShowClick(booking)}
                        loading={actionLoading}
                      >
                        Không đến
                      </Button>
                    );
                  } else {
                    // Booking tương lai - không có action
                    return null;
                  }
                })()
              ].flat().filter(Boolean)}
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
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Lịch hẹn ngày {selectedDate.format('DD/MM/YYYY')}</span>
            <Space>
              <Tag color="blue">{selectedDateBookings.length} lịch hẹn</Tag>
              <Button
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => {
                  if (barberId) {
                    loadBookings(barberId);
                    toast.success('🔄 Đã làm mới danh sách lịch hẹn', {
                      position: "top-right",
                      autoClose: 2000,
                    });
                  }
                }}
              >
                Làm mới
              </Button>
            </Space>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          toast.info('ℹ️ Đã đóng chi tiết lịch hẹn', {
            position: "top-right",
            autoClose: 2000,
          });
        }}
        footer={null}
        width={800}
      >
        <List
          dataSource={selectedDateBookings}
          renderItem={(booking) => (
            <List.Item
              actions={[
                // Barbers can no longer confirm pending bookings - only admins can
                booking.status === 'confirmed' && (() => {
                  const bookingDate = dayjs(booking.bookingDate);
                  const today = dayjs();
                  const isToday = bookingDate.isSame(today, 'day');
                  const isPast = bookingDate.isBefore(today, 'day');

                  if (isToday) {
                    // Booking hôm nay - có thể hoàn thành hoặc không đến
                    return [
                      <Button
                        key="complete"
                        size="small"
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleBookingStatusUpdate(booking._id, 'completed')}
                        loading={actionLoading}
                        style={{ marginRight: 8 }}
                      >
                        Hoàn thành
                      </Button>,
                      <Button
                        key="no-show"
                        size="small"
                        type="default"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleNoShowClick(booking)}
                        loading={actionLoading}
                      >
                        Không đến
                      </Button>
                    ];
                  } else if (isPast) {
                    // Booking ngày trước - chỉ có thể đánh dấu không đến
                    return (
                      <Button
                        size="small"
                        type="default"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => handleNoShowClick(booking)}
                        loading={actionLoading}
                      >
                        Không đến
                      </Button>
                    );
                  } else {
                    // Booking tương lai - không có action
                    return (
                      <Button size="small" disabled>
                        Chờ xử lý
                      </Button>
                    );
                  }
                })()
              ].flat().filter(Boolean)}
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

      {/* No Show Confirmation Modal */}
      <NoShowConfirmationModal
        visible={noShowModalVisible}
        onCancel={() => {
          setNoShowModalVisible(false);
          setSelectedBookingForNoShow(null);
        }}
        onConfirm={handleNoShowConfirm}
        booking={selectedBookingForNoShow}
        loading={actionLoading}
      />

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        limit={3}
      />
    </div>
  );
};

export default BarberCalendarPage;
