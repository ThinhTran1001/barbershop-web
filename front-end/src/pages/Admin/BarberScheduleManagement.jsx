import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Space,
  Tag,
  Row,
  Col,
  Calendar,
  Badge,
  Descriptions,
  Divider,
  Empty,
  Avatar,
  Rate,
  Tooltip,
  Radio,
  Spin,
  Alert,
  Collapse,
  Popconfirm
} from 'antd';
import { toast } from 'react-toastify';
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  PhoneOutlined,
  ClockCircleOutlined,
  StarOutlined,
  SearchOutlined,
  UserOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import {
  getAllAbsences,
  updateAbsenceApproval,
  deleteAbsence,
  getBarberSchedule,
  getAvailableBarbers,
  reassignAffectedBookings
} from '../../services/barberAbsenceApi.js';
import AbsenceStatusBadge from '../../components/absence/AbsenceStatusBadge';
import { fetchAllBarbers } from '../../services/barberApi.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Panel } = Collapse;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const BarberScheduleManagement = () => {
  const [barbers, setBarbers] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [selectedAbsenceForAssignment, setSelectedAbsenceForAssignment] = useState(null);
  const [availableBarbers, setAvailableBarbers] = useState([]);
  const [bookingAssignments, setBookingAssignments] = useState({});
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [barberSearchTerm, setBarberSearchTerm] = useState('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('');
  const [loadingBarberAvailability, setLoadingBarberAvailability] = useState(false);
  const [detailedBookings, setDetailedBookings] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [filters, setFilters] = useState({
    barberId: '',
    status: '',
    reason: ''
  });

  // Load initial data
  useEffect(() => {
    loadBarbers();
    loadAbsences();
  }, [filters]);

  const loadBarbers = async () => {
    try {
      const response = await fetchAllBarbers();
      setBarbers(response.barbers || response);
    } catch (error) {
      message.error('Failed to load barbers');
    }
  };

  const loadAbsences = async () => {
    setLoading(true);
    try {
      const filterParams = {};
      if (filters.barberId) filterParams.barberId = filters.barberId;
      if (filters.status === 'pending') filterParams.isApproved = 'null';
      if (filters.status === 'approved') filterParams.isApproved = 'true';
      if (filters.status === 'rejected') filterParams.isApproved = 'false';
      if (filters.reason) filterParams.reason = filters.reason;

      const response = await getAllAbsences(filterParams);
      setAbsences(response.absences || response);
    } catch (error) {
      message.error('Failed to load absences');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApprovalChange = async (absenceId, isApproved) => {
    // Show loading toast
    const loadingToastId = toast.loading(
      `${isApproved ? '✅ Approving' : '❌ Rejecting'} absence request...`,
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
      await updateAbsenceApproval(absenceId, isApproved);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: isApproved
          ? `✅ Absence request approved successfully!\n📅 Barber schedule has been updated automatically.\n🔄 Affected bookings can now be reassigned.`
          : `❌ Absence request rejected.\n📅 Barber schedule remains unchanged.\n✅ No further action required.`,
        type: "success",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      loadAbsences();
    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to ${isApproved ? 'approve' : 'reject'} absence request\n${error.message || 'Please try again'}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const showAbsenceDetail = (absence) => {
    setSelectedAbsence(absence);
    setDetailModalVisible(true);
  };

  const showAssignmentModal = async (absence) => {
    setSelectedAbsenceForAssignment(absence);
    setAssignmentModalVisible(true);
    setLoadingBarberAvailability(true);

    // Initialize booking assignments state
    const initialAssignments = {};
    if (absence.affectedBookings) {
      absence.affectedBookings.forEach(booking => {
        initialAssignments[booking.bookingId] = null;
      });
    }
    setBookingAssignments(initialAssignments);

    // Load detailed booking information
    await loadDetailedBookings(absence);

    // Load available barbers for each affected booking
    await loadAvailableBarbers(absence);

    setLoadingBarberAvailability(false);
  };

  const loadDetailedBookings = async (absence) => {
    try {
      // The booking data now comes populated from the API
      const enhancedBookings = absence.affectedBookings?.map(booking => {
        // Extract time from originalDate
        const bookingDate = new Date(booking.originalDate);
        const timeSlot = bookingDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        // Calculate estimated end time based on service duration
        const estimatedEndTime = booking.serviceDuration
          ? new Date(bookingDate.getTime() + booking.serviceDuration * 60000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })
          : 'Unknown';

        return {
          ...booking,
          bookingId: booking.bookingId || `BK${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
          customerName: booking.customerName || 'Unknown Customer',
          serviceName: booking.serviceName || 'Unknown Service',
          originalDate: booking.originalDate || new Date(),
          timeSlot: timeSlot,
          duration: booking.serviceDuration || 60,
          status: booking.status || 'confirmed',
          customerPhone: booking.customerPhone || null,
          specialRequests: booking.specialRequests || null,
          createdAt: booking.createdAt || new Date(),
          estimatedEndTime: estimatedEndTime
        };
      }) || [];

      setDetailedBookings(enhancedBookings);
    } catch (error) {
      message.error('Failed to load booking details');
      console.error('Error loading booking details:', error);
      setDetailedBookings([]); // Set empty array on error
    }
  };

  const loadAvailableBarbers = async (absence) => {
    try {
      // Load all barbers with enhanced information
      const response = await fetchAllBarbers();
      const allBarbers = response.barbers || response;

      // Filter out the absent barber and enhance with additional info
      const availableBarbers = allBarbers
        .filter(barber => barber._id !== absence.barberId._id)
        .map(barber => ({
          ...barber,
          // Simulate additional data that would come from the API
          profileImageUrl: barber.profileImageUrl || null,
          workingHours: barber.preferredWorkingHours || { start: '09:00', end: '18:00' },
          completedBookings: Math.floor(Math.random() * 500) + 50,
          isAvailableForSlot: Math.random() > 0.2, // 80% chance of availability
          conflictReason: Math.random() > 0.8 ? 'Already booked at this time' : null
        }));

      setAvailableBarbers(availableBarbers);
    } catch (error) {
      message.error('Failed to load available barbers');
      console.error('Error loading available barbers:', error);
    }
  };

  const handleAssignmentChange = (bookingId, newBarberId) => {
    setBookingAssignments(prev => ({
      ...prev,
      [bookingId]: newBarberId
    }));
  };

  const getFilteredBarbers = () => {
    return availableBarbers.filter(barber => {
      const barberName = barber.userId?.name || '';
      const barberSpecialties = barber.specialties || [];

      const matchesSearch = !barberSearchTerm ||
        barberName.toLowerCase().includes(barberSearchTerm.toLowerCase()) ||
        barberSpecialties.some(specialty =>
          specialty && specialty.toLowerCase().includes(barberSearchTerm.toLowerCase())
        );

      const matchesSpecialty = !selectedSpecialtyFilter ||
        barberSpecialties.includes(selectedSpecialtyFilter);

      return matchesSearch && matchesSpecialty;
    });
  };

  const getAssignmentSummary = () => {
    const assignments = Object.entries(bookingAssignments)
      .filter(([_, barberId]) => barberId !== null)
      .map(([bookingId, barberId]) => {
        const booking = detailedBookings.find(b => b.bookingId === bookingId);
        const barber = availableBarbers.find(b => b._id === barberId);
        return { booking, barber };
      })
      .filter(({ booking, barber }) => booking && barber); // Filter out any undefined entries

    return assignments;
  };

  const handleShowConfirmation = () => {
    const validAssignments = Object.entries(bookingAssignments)
      .filter(([_, barberId]) => barberId !== null);

    if (validAssignments.length === 0) {
      message.warning('Please select at least one barber assignment');
      return;
    }

    setShowConfirmation(true);
  };

  const handleSaveAssignments = async () => {
    setAssignmentLoading(true);

    // Filter out assignments where no barber was selected
    const validAssignments = Object.entries(bookingAssignments)
      .filter(([_, barberId]) => barberId !== null)
      .map(([bookingId, barberId]) => ({
        bookingId,
        newBarberId: barberId
      }));

    // Show loading toast
    const loadingToastId = toast.loading(
      `👥 Reassigning ${validAssignments.length} booking(s) to new barbers...`,
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
      const response = await reassignAffectedBookings(selectedAbsenceForAssignment._id, validAssignments);

      // Update loading toast to success
      toast.update(loadingToastId, {
        render: `🎉 Successfully reassigned ${response.successCount || validAssignments.length} booking(s)!\n👥 Customers will be notified of the barber change.\n📅 New schedules have been updated automatically.`,
        type: "success",
        isLoading: false,
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Show additional info if there were any errors
      if (response.errorCount > 0) {
        toast.warn(
          `⚠️ ${response.errorCount} booking(s) could not be reassigned.\nPlease check the affected bookings and try again.`,
          {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          }
        );
      }

      setAssignmentModalVisible(false);
      setShowConfirmation(false);
      setSelectedAbsenceForAssignment(null);
      setBookingAssignments({});
      setBarberSearchTerm('');
      setSelectedSpecialtyFilter('');
      loadAbsences(); // Refresh the table

    } catch (error) {
      // Update loading toast to error
      toast.update(loadingToastId, {
        render: `❌ Failed to reassign bookings\n${error.message || 'Please try again'}`,
        type: "error",
        isLoading: false,
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleDeleteAbsence = async (absenceId) => {
    Modal.confirm({
      title: 'Delete Absence',
      content: 'Are you sure you want to delete this absence record?',
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          await deleteAbsence(absenceId);
          message.success('Absence deleted successfully');
          loadAbsences();
        } catch (error) {
          message.error(error.response?.data?.message || 'Failed to delete absence');
        }
      }
    });
  };

  const showBarberCalendar = async (barber) => {
    setSelectedBarber(barber);
    const currentDate = dayjs();
    console.log('Fetching calendar for barber:', barber._id, 'Date:', currentDate.format('YYYY-MM-DD'));
    try {
      const calendarResponse = await getBarberSchedule(
        barber._id,
        currentDate.month() + 1,
        currentDate.year()
      );
      setCalendarData(calendarResponse);
      setCalendarModalVisible(true);
    } catch (error) {
      message.error('Failed to load barber calendar');
    }
  };

  const getListData = (value) => {
    if (!calendarData) return [];
    
    const dateStr = value.format('YYYY-MM-DD');
    const dayData = calendarData.calendar.find(day => day.date === dateStr);
    
    if (!dayData) return [];
    
    const listData = [];
    
    if (dayData.isAbsent) {
      listData.push({
        type: 'error',
        content: `Absent: ${dayData.absenceReason}`
      });
    }
    
    if (dayData.bookingsCount > 0) {
      listData.push({
        type: 'success',
        content: `${dayData.bookingsCount} bookings`
      });
    }
    
    return listData;
  };

  const dateCellRender = (value) => {
    const listData = getListData(value);
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {listData.map((item, index) => (
          <li key={index}>
            <Badge 
              status={item.type} 
              text={item.content}
              style={{ fontSize: '10px' }}
            />
          </li>
        ))}
      </ul>
    );
  };

  const columns = [
    {
      title: 'Barber',
      dataIndex: 'barberId',
      key: 'barber',
      render: (barber) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>
            {barber?.userId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {barber?.specialties?.join(', ')}
          </div>
        </div>
      )
    },
    {
      title: 'Period',
      key: 'period',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startDate).format('DD/MM/YYYY')}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            to {dayjs(record.endDate).format('DD/MM/YYYY')}
          </div>
        </div>
      )
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => (
        <Tag color="blue">{reason.replace('_', ' ')}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isApproved',
      key: 'status',
      render: (isApproved) => (
        <AbsenceStatusBadge isApproved={isApproved} />
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Approved', value: 'approved' },
        { text: 'Rejected', value: 'rejected' }
      ],
      onFilter: (value, record) => {
        if (value === 'pending') return record.isApproved === null || record.isApproved === undefined;
        if (value === 'approved') return record.isApproved === true;
        if (value === 'rejected') return record.isApproved === false;
        return true;
      }
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Affected Bookings',
      dataIndex: 'affectedBookings',
      key: 'affectedBookings',
      render: (bookings) => (
        <span>{bookings?.length || 0} bookings</span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showAbsenceDetail(record)}
          >
            Details
          </Button>
          {record.isApproved === null || record.isApproved === undefined ? (
            <>
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleApprovalChange(record._id, true)}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleApprovalChange(record._id, false)}
              >
                Reject
              </Button>
            </>
          ) : null}
          {record.isApproved && (
            <>
              <Button
                size="small"
                icon={<CloseOutlined />}
                onClick={() => handleApprovalChange(record._id, false)}
              >
                Revoke
              </Button>
              {record.affectedBookings && record.affectedBookings.length > 0 && (
                <Button
                  size="small"
                  type="default"
                  icon={<UserSwitchOutlined />}
                  onClick={() => showAssignmentModal(record)}
                >
                  Assign Barber
                </Button>
              )}
            </>
          )}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAbsence(record._id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Absence Request Management</Title>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by barber"
              style={{ width: '100%' }}
              value={filters.barberId}
              onChange={(value) => handleFilterChange('barberId', value)}
              allowClear
            >
              {barbers.map(barber => (
                <Option key={barber._id} value={barber._id}>
                  {barber.userId?.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by status"
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              allowClear
            >
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="Filter by reason"
              style={{ width: '100%' }}
              value={filters.reason}
              onChange={(value) => handleFilterChange('reason', value)}
              allowClear
            >
              <Option value="sick_leave">Sick Leave</Option>
              <Option value="vacation">Vacation</Option>
              <Option value="emergency">Emergency</Option>
              <Option value="training">Training</Option>
              <Option value="personal">Personal</Option>
              <Option value="other">Other</Option>
            </Select>
          </Col>
        </Row>
      </Card>

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

      <Card title="Absence Records">
        <Table
          columns={columns}
          dataSource={absences}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true
          }}
        />
      </Card>

      {/* Absence Detail Modal */}
      <Modal
        title="Absence Request Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAbsence(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          selectedAbsence && (selectedAbsence.isApproved === null || selectedAbsence.isApproved === undefined) && (
            <Space key="actions">
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => {
                  handleApprovalChange(selectedAbsence._id, true);
                  setDetailModalVisible(false);
                }}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={() => {
                  handleApprovalChange(selectedAbsence._id, false);
                  setDetailModalVisible(false);
                }}
              >
                Reject
              </Button>
            </Space>
          )
        ]}
        width={600}
      >
        {selectedAbsence && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Barber">
              {selectedAbsence.barberId?.userId?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <AbsenceStatusBadge isApproved={selectedAbsence.isApproved} />
            </Descriptions.Item>
            <Descriptions.Item label="Date Range">
              {dayjs(selectedAbsence.startDate).format('MMMM DD, YYYY')} - {' '}
              {dayjs(selectedAbsence.endDate).format('MMMM DD, YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {dayjs(selectedAbsence.endDate).diff(dayjs(selectedAbsence.startDate), 'day') + 1} days
            </Descriptions.Item>
            <Descriptions.Item label="Reason">
              {selectedAbsence.reason.replace('_', ' ')}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedAbsence.description || 'No description provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {dayjs(selectedAbsence.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
            </Descriptions.Item>
            {selectedAbsence.approvedBy && (
              <Descriptions.Item label="Approved By">
                {selectedAbsence.approvedBy.name}
              </Descriptions.Item>
            )}
            {selectedAbsence.affectedBookings && selectedAbsence.affectedBookings.length > 0 && (
              <Descriptions.Item label="Affected Bookings">
                {selectedAbsence.affectedBookings.length} booking(s) affected
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>

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
              dateCellRender={dateCellRender}
              headerRender={({ value, type, onChange, onTypeChange }) => (
                <div style={{ padding: 8 }}>
                  <Typography.Title level={4}>
                    {value.format('MMMM YYYY')}
                  </Typography.Title>
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

      {/* Enhanced Barber Assignment Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserSwitchOutlined />
            <span>Assign Barbers to Affected Bookings</span>
          </div>
        }
        open={assignmentModalVisible}
        onCancel={() => {
          setAssignmentModalVisible(false);
          setSelectedAbsenceForAssignment(null);
          setBookingAssignments({});
          setBarberSearchTerm('');
          setSelectedSpecialtyFilter('');
          setShowConfirmation(false);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setAssignmentModalVisible(false);
              setSelectedAbsenceForAssignment(null);
              setBookingAssignments({});
              setBarberSearchTerm('');
              setSelectedSpecialtyFilter('');
              setShowConfirmation(false);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="preview"
            onClick={handleShowConfirmation}
            disabled={Object.values(bookingAssignments).every(value => value === null)}
          >
            Preview Assignments
          </Button>,
          <Button
            key="save"
            type="primary"
            loading={assignmentLoading}
            onClick={handleSaveAssignments}
            disabled={Object.values(bookingAssignments).every(value => value === null)}
          >
            Save Assignments
          </Button>
        ]}
        width={1200}
        style={{ top: 20 }}
      >
        {selectedAbsenceForAssignment && (
          <Spin spinning={loadingBarberAvailability}>
            <div>
              {/* Absence Information Header */}
              <Card style={{ marginBottom: 16, background: '#f8f9fa' }}>
                <Row gutter={24}>
                  <Col span={12}>
                    <div>
                      <Text strong style={{ color: '#1890ff' }}>Absence Period:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>
                        {dayjs(selectedAbsenceForAssignment.startDate).format('MMMM DD, YYYY')} - {' '}
                        {dayjs(selectedAbsenceForAssignment.endDate).format('MMMM DD, YYYY')}
                      </Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div>
                      <Text strong style={{ color: '#1890ff' }}>Absent Barber:</Text>
                      <br />
                      <Text style={{ fontSize: '16px' }}>
                        {selectedAbsenceForAssignment.barberId?.userId?.name}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>

              {detailedBookings && detailedBookings.length > 0 ? (
                <Row gutter={24}>
                  {/* Left Column - Affected Bookings */}
                  <Col span={14}>
                    <Card
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CalendarOutlined />
                          <span>Affected Bookings ({detailedBookings.length})</span>
                        </div>
                      }
                      style={{ height: '600px', overflow: 'hidden' }}
                    >
                      <div style={{ height: '520px', overflowY: 'auto', paddingRight: 8 }}>
                        {detailedBookings.map((booking, index) => (
                          <Card
                            key={booking.bookingId || index}
                            size="small"
                            style={{
                              marginBottom: 16,
                              border: bookingAssignments[booking.bookingId] ? '2px solid #52c41a' : '1px solid #d9d9d9'
                            }}
                          >
                            {/* Booking Header */}
                            <div style={{ marginBottom: 12 }}>
                              <Row justify="space-between" align="middle">
                                <Col>
                                  <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                                    {booking.customerName}
                                  </Text>
                                  <Tag
                                    color={booking.status === 'confirmed' ? 'green' : 'orange'}
                                    style={{ marginLeft: 8 }}
                                  >
                                    {booking.status?.toUpperCase()}
                                  </Tag>
                                </Col>
                                <Col>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    ID: {booking.bookingId}
                                  </Text>
                                </Col>
                              </Row>
                            </div>

                            {/* Booking Details */}
                            <Row gutter={[16, 8]}>
                              <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                    Date & Time
                                  </Text>
                                  <br />
                                  <Text strong>
                                    {dayjs(booking.originalDate).format('MMM DD, YYYY')}
                                  </Text>
                                  <br />
                                  <Text>{booking.timeSlot} - {booking.estimatedEndTime}</Text>
                                </div>
                              </Col>
                              <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                    Service & Duration
                                  </Text>
                                  <br />
                                  <Text strong>{booking.serviceName}</Text>
                                  <br />
                                  <Text>{booking.duration} minutes</Text>
                                </div>
                              </Col>
                              {booking.customerPhone && (
                                <Col span={12}>
                                  <div style={{ marginBottom: 8 }}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>
                                      <PhoneOutlined style={{ marginRight: 4 }} />
                                      Contact
                                    </Text>
                                    <br />
                                    <Text>{booking.customerPhone}</Text>
                                  </div>
                                </Col>
                              )}
                              <Col span={12}>
                                <div style={{ marginBottom: 8 }}>
                                  <Text type="secondary" style={{ fontSize: '12px' }}>
                                    <InfoCircleOutlined style={{ marginRight: 4 }} />
                                    Created
                                  </Text>
                                  <br />
                                  <Text>{dayjs(booking.createdAt).format('MMM DD, YYYY')}</Text>
                                </div>
                              </Col>
                            </Row>

                            {booking.specialRequests && (
                              <div style={{ marginTop: 8, padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  <InfoCircleOutlined style={{ marginRight: 4 }} />
                                  Special Requests:
                                </Text>
                                <br />
                                <Text style={{ fontSize: '13px' }}>{booking.specialRequests}</Text>
                              </div>
                            )}

                            {/* Assignment Status */}
                            <Divider style={{ margin: '12px 0' }} />
                            <div>
                              {bookingAssignments[booking.bookingId] ? (
                                <Alert
                                  message="Barber Assigned"
                                  description={
                                    availableBarbers.find(b => b._id === bookingAssignments[booking.bookingId])?.userId?.name
                                  }
                                  type="success"
                                  showIcon
                                  style={{ marginBottom: 8 }}
                                />
                              ) : (
                                <Alert
                                  message="Awaiting Barber Assignment"
                                  type="warning"
                                  showIcon
                                  style={{ marginBottom: 8 }}
                                />
                              )}
                            </div>
                          </Card>
                        ))}
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
                      style={{ height: '600px', overflow: 'hidden' }}
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
                            <Option key={specialty} value={specialty}>{specialty}</Option>
                          ))}
                        </Select>
                      </div>

                      <div style={{ height: '480px', overflowY: 'auto', paddingRight: 8 }}>
                        <Radio.Group
                          style={{ width: '100%' }}
                          onChange={(e) => {
                            // Handle selection for the first unassigned booking
                            const firstUnassigned = detailedBookings.find(
                              booking => !bookingAssignments[booking.bookingId]
                            );
                            if (firstUnassigned) {
                              handleAssignmentChange(firstUnassigned.bookingId, e.target.value);
                            }
                          }}
                        >
                          {getFilteredBarbers().map(barber => (
                            <Card
                              key={barber._id}
                              size="small"
                              style={{
                                marginBottom: 12,
                                cursor: 'pointer',
                                border: Object.values(bookingAssignments).includes(barber._id)
                                  ? '2px solid #52c41a' : '1px solid #d9d9d9'
                              }}
                              hoverable
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
                                      <Text strong style={{ fontSize: '14px' }}>
                                        {barber.userId?.name}
                                      </Text>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Rate
                                          disabled
                                          defaultValue={barber.averageRating || 4.5}
                                          style={{ fontSize: '12px' }}
                                        />
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                          ({barber.completedBookings})
                                        </Text>
                                      </div>
                                    </div>

                                    <div style={{ marginTop: 4 }}>
                                      <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {barber.specialties && barber.specialties.length > 0
                                          ? barber.specialties.slice(0, 2).join(', ') + (barber.specialties.length > 2 ? '...' : '')
                                          : 'No specialties listed'
                                        }
                                      </Text>
                                    </div>

                                    <div style={{ marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
                                      <Text type="secondary" style={{ fontSize: '11px' }}>
                                        <ClockCircleOutlined style={{ marginRight: 2 }} />
                                        {barber.workingHours?.start} - {barber.workingHours?.end}
                                      </Text>

                                      {barber.isAvailableForSlot ? (
                                        <Tag color="green" style={{ fontSize: '10px', margin: 0 }}>
                                          <CheckCircleOutlined style={{ marginRight: 2 }} />
                                          Available
                                        </Tag>
                                      ) : (
                                        <Tooltip title={barber.conflictReason}>
                                          <Tag color="orange" style={{ fontSize: '10px', margin: 0 }}>
                                            <WarningOutlined style={{ marginRight: 2 }} />
                                            Conflict
                                          </Tag>
                                        </Tooltip>
                                      )}
                                    </div>

                                    {/* Assignment buttons for each booking */}
                                    <div style={{ marginTop: 8 }}>
                                      <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginBottom: 4 }}>
                                        Assign to booking:
                                      </Text>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                        {detailedBookings.map(booking => (
                                          <Button
                                            key={booking.bookingId}
                                            size="small"
                                            type={bookingAssignments[booking.bookingId] === barber._id ? 'primary' : 'default'}
                                            onClick={() => {
                                              if (bookingAssignments[booking.bookingId] === barber._id) {
                                                handleAssignmentChange(booking.bookingId, null);
                                              } else {
                                                handleAssignmentChange(booking.bookingId, barber._id);
                                              }
                                            }}
                                            style={{ fontSize: '10px', height: '20px', padding: '0 6px' }}
                                          >
                                            {booking.customerName ? booking.customerName.split(' ')[0] : 'Unknown'}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </Col>
                              </Row>
                            </Card>
                          ))}
                        </Radio.Group>
                      </div>
                    </Card>
                  </Col>
                </Row>
              ) : (
                <Empty description="No affected bookings found" />
              )}
            </div>
          </Spin>
        )}
      </Modal>

      {/* Assignment Confirmation Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>Confirm Barber Assignments</span>
          </div>
        }
        open={showConfirmation}
        onCancel={() => setShowConfirmation(false)}
        footer={[
          <Button key="back" onClick={() => setShowConfirmation(false)}>
            Back to Edit
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={assignmentLoading}
            onClick={handleSaveAssignments}
          >
            Confirm Assignments
          </Button>
        ]}
        width={600}
      >
        <div>
          <Alert
            message="Please review the following assignments before confirming"
            type="info"
            style={{ marginBottom: 16 }}
            showIcon
          />

          {getAssignmentSummary().map(({ booking, barber }, index) => (
            <Card key={index} size="small" style={{ marginBottom: 12 }}>
              <Row justify="space-between" align="middle">
                <Col span={10}>
                  <div>
                    <Text strong>{booking?.customerName || 'Unknown Customer'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {booking?.serviceName || 'Unknown Service'}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {booking?.originalDate ? dayjs(booking.originalDate).format('MMM DD, YYYY') : 'Unknown Date'} at {booking?.timeSlot || 'Unknown Time'}
                    </Text>
                  </div>
                </Col>
                <Col span={4} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', color: '#1890ff' }}>→</div>
                </Col>
                <Col span={10}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <Avatar
                        src={barber?.profileImageUrl}
                        icon={<UserOutlined />}
                        size={24}
                      />
                      <div>
                        <Text strong>{barber?.userId?.name}</Text>
                        <br />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Rate
                            disabled
                            defaultValue={barber?.averageRating || 4.5}
                            style={{ fontSize: '10px' }}
                          />
                          <Text type="secondary" style={{ fontSize: '10px' }}>
                            ({barber?.completedBookings})
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          ))}

          {getAssignmentSummary().length === 0 && (
            <Empty description="No assignments to confirm" />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default BarberScheduleManagement;
