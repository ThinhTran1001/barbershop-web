import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Button,
  Modal,
  message,
  Row,
  Col,
  Calendar,
  Badge,
  Empty,
  Tag,
  Divider,
  Descriptions,
  Space
} from 'antd';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import {
  getBarberSchedule
} from '../../services/barberAbsenceApi.js';
import { fetchAllBarbers } from '../../services/barberApi.js';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title, Text } = Typography;

const BarberScheduleManagement = () => {
  const [barbers, setBarbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [calendarData, setCalendarData] = useState(null);

  // Enhanced calendar states (like barber calendar)
  const [barberBookings, setBarberBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState([]);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);

  // Load initial data
  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      const response = await fetchAllBarbers();
      setBarbers(response.barbers || response);
    } catch (error) {
      message.error('Failed to load barbers');
    }
  };











  // Load barber bookings for enhanced calendar view
  const loadBarberBookings = async (barber) => {
    try {
      // Try with barberId first, then userId if that fails
      let response;
      try {
        response = await axios.get(`/api/barbers/${barber._id}/bookings`, {
          withCredentials: true
        });
      } catch (firstError) {
        console.log('Trying with userId instead of barberId');
        response = await axios.get(`/api/barbers/${barber.userId?._id || barber.userId}/bookings`, {
          withCredentials: true
        });
      }

      console.log('Loaded barber bookings:', response.data);
      setBarberBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error loading barber bookings:', error);
      setBarberBookings([]);
    }
  };

  const showBarberCalendar = async (barber) => {
    setSelectedBarber(barber);
    const currentDate = dayjs();
    console.log('Fetching calendar for barber:', barber._id, 'Date:', currentDate.format('YYYY-MM-DD'));
    try {
      // Load both calendar data and bookings
      await Promise.all([
        getBarberSchedule(barber._id, currentDate.month() + 1, currentDate.year()).then(response => {
          setCalendarData(response);
        }),
        loadBarberBookings(barber)
      ]);
      setCalendarModalVisible(true);
    } catch (error) {
      console.error('Error loading barber calendar:', error);
      message.error('Failed to load barber calendar');
    }
  };

  const getListData = (value) => {
    const dateStr = value.format('YYYY-MM-DD');
    const dayBookings = barberBookings.filter(booking =>
      dayjs(booking.bookingDate).format('YYYY-MM-DD') === dateStr
    );

    const listData = [];

    // Add booking information with status colors
    // Note: cancelled and rejected bookings are filtered out by backend
    dayBookings.forEach(booking => {
      const statusColor = {
        'pending': 'orange',
        'confirmed': 'blue',
        'completed': 'green',
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
            <Tag
              color={
                item.booking?.status === 'pending' ? 'orange' :
                item.booking?.status === 'confirmed' ? 'blue' :
                item.booking?.status === 'completed' ? 'green' :
                item.booking?.status === 'no_show' ? 'volcano' : 'default'
              }
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                lineHeight: '1.2',
                margin: 0,
                cursor: item.booking ? 'pointer' : 'default',
                fontWeight: '500'
              }}
            >
              {item.content}
            </Tag>
          </li>
        ))}
        {listData.length > 3 && (
          <li>
            <Tag
              color="default"
              style={{ fontSize: '8px', padding: '1px 4px', margin: 0 }}
            >
              +{listData.length - 3} more
            </Tag>
          </li>
        )}
      </ul>
    );
  };

  // Handle calendar date selection
  const onCalendarSelect = (value) => {
    setSelectedDate(value);
    const dateStr = value.format('YYYY-MM-DD');
    const dayBookings = barberBookings.filter(booking =>
      dayjs(booking.bookingDate).format('YYYY-MM-DD') === dateStr
    );
    setSelectedDateBookings(dayBookings);
    setBookingModalVisible(true);
  };



  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Barber Schedule Management</Title>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Barber Calendars">
            <Row gutter={[16, 16]}>
              {barbers.map(barber => (
                <Col xs={24} sm={12} md={8} lg={6} key={barber._id}>
                  <Card
                    size="small"
                    title={barber.userId?.name}
                    extra={
                      <Button
                        size="small"
                        icon={<CalendarOutlined />}
                        onClick={() => showBarberCalendar(barber)}
                      >
                        View
                      </Button>
                    }
                  >
                    <div style={{ fontSize: '12px' }}>
                      <div>Rating: {barber.averageRating || 0}/5</div>
                      <div>Bookings: {barber.totalBookings || 0}</div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>





      {/* Barber Calendar Modal */}
      <Modal
        title={`${selectedBarber?.userId?.name} - Calendar`}
        open={calendarModalVisible}
        onCancel={() => {
          setCalendarModalVisible(false);
          setSelectedBarber(null);
          setCalendarData(null);
        }}
        footer={null}
        width={800}
      >
        {calendarData && (
          <div>
            <Calendar
              cellRender={dateCellRender}
              onSelect={onCalendarSelect}
              headerRender={({ value, onChange }) => (
                <div style={{ padding: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {value.format('MMMM YYYY')}
                  </Typography.Title>
                  <Space>
                    <Button
                      icon={<CalendarOutlined />}
                      onClick={() => {
                        const newDate = value.clone().subtract(1, 'month');
                        onChange(newDate);
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      type="primary"
                      onClick={() => {
                        const today = dayjs();
                        onChange(today);
                      }}
                    >
                      Today
                    </Button>
                    <Button
                      icon={<CalendarOutlined />}
                      onClick={() => {
                        const newDate = value.clone().add(1, 'month');
                        onChange(newDate);
                      }}
                    >
                      Next
                    </Button>
                  </Space>
                </div>
              )}
            />
            
            <Divider />
            
            <Descriptions title="Summary" bordered size="small">
              <Descriptions.Item label="Total Absences">
                {calendarData.absences?.length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Working Days">
                {calendarData.calendar?.filter(day => !day.isAbsent).length || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Total Bookings">
                {calendarData.calendar?.reduce((sum, day) => sum + day.bookingsCount, 0) || 0}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      {/* Booking Details Modal for Selected Date */}
      <Modal
        title={
          selectedDate ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined />
              <span>Bookings for {selectedDate.format('DD/MM/YYYY')}</span>
              {selectedBarber && (
                <Tag color="blue">{selectedBarber.userId?.name}</Tag>
              )}
            </div>
          ) : 'Booking Details'
        }
        open={bookingModalVisible}
        onCancel={() => {
          setBookingModalVisible(false);
          setSelectedDate(null);
          setSelectedDateBookings([]);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setBookingModalVisible(false);
            setSelectedDate(null);
            setSelectedDateBookings([]);
            }}
          >
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedDateBookings.length > 0 ? (
          <div>
            <Typography.Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
              Found {selectedDateBookings.length} booking(s) for this date
            </Typography.Text>

            {selectedDateBookings.map((booking, index) => (
              <Card key={booking._id || index} size="small" style={{ marginBottom: 12 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div>
                      <Typography.Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                        {booking.customerId?.name || booking.customerName || 'Unknown Customer'}
                      </Typography.Text>
                      <Tag
                        color={
                          booking.status === 'confirmed' ? 'green' :
                          booking.status === 'pending' ? 'orange' :
                          booking.status === 'completed' ? 'blue' :
                          booking.status === 'no_show' ? 'volcano' :
                          booking.status === 'cancelled' ? 'red' : 'default'
                        }
                        style={{ marginLeft: 8 }}
                      >
                        {
                          booking.status === 'pending' ? 'CHỜ XÁC NHẬN' :
                          booking.status === 'confirmed' ? 'ĐÃ XÁC NHẬN' :
                          booking.status === 'completed' ? 'HOÀN THÀNH' :
                          booking.status === 'no_show' ? 'VẮNG MẶT' :
                          booking.status === 'cancelled' ? 'ĐÃ HỦY' :
                          booking.status?.toUpperCase()
                        }
                      </Tag>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary">
                        <ClockCircleOutlined style={{ marginRight: 4 }} />
                        {dayjs(booking.bookingDate).format('HH:mm')}
                      </Typography.Text>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Typography.Text type="secondary">
                        Service: {booking.serviceId?.name || 'Unknown Service'}
                      </Typography.Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ textAlign: 'right' }}>
                      <div>
                        <Typography.Text strong>
                          {booking.serviceId?.price?.toLocaleString()}đ
                        </Typography.Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Text type="secondary">
                          Duration: {booking.serviceId?.durationMinutes || booking.durationMinutes}min
                        </Typography.Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Typography.Text type="secondary">
                          {booking.customerId?.phone || booking.customerPhone}
                        </Typography.Text>
                      </div>
                    </div>
                  </Col>
                </Row>

                {booking.note && (
                  <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                    <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                      <InfoCircleOutlined style={{ marginRight: 4 }} />
                      Note: {booking.note}
                    </Typography.Text>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <Empty
            description={
              selectedDate ?
                `No bookings found for ${selectedDate.format('DD/MM/YYYY')}` :
                'No bookings found'
            }
          />
        )}
      </Modal>
    </div>
  );
};

export default BarberScheduleManagement;

