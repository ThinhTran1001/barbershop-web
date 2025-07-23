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
  Divider
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import {
  createBarberAbsence,
  getAllAbsences,
  updateAbsenceApproval,
  deleteAbsence,
  getBarberSchedule
} from '../../services/barberAbsenceApi.js';
import { fetchAllBarbers } from '../../services/barberApi.js';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const BarberScheduleManagement = () => {
  const [barbers, setBarbers] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [calendarData, setCalendarData] = useState(null);
  const [form] = Form.useForm();

  // Load initial data
  useEffect(() => {
    loadBarbers();
    loadAbsences();
  }, []);

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
      const response = await getAllAbsences();
      setAbsences(response.absences || response);
    } catch (error) {
      message.error('Failed to load absences');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAbsence = async (values) => {
    try {
      const absenceData = {
        barberId: values.barberId,
        startDate: values.dateRange[0].toISOString(),
        endDate: values.dateRange[1].toISOString(),
        reason: values.reason,
        description: values.description
      };

      await createBarberAbsence(absenceData);
      message.success('Barber absence created successfully');
      setModalVisible(false);
      form.resetFields();
      loadAbsences();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create absence');
    }
  };

  const handleApprovalChange = async (absenceId, isApproved) => {
    try {
      await updateAbsenceApproval(absenceId, isApproved);
      message.success(`Absence ${isApproved ? 'approved' : 'rejected'} successfully`);
      loadAbsences();
    } catch (error) {
      message.error('Failed to update approval status');
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
        <Tag color={isApproved ? 'green' : 'orange'}>
          {isApproved ? 'Approved' : 'Pending'}
        </Tag>
      )
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
          {!record.isApproved && (
            <Button
              size="small"
              type="primary"
              onClick={() => handleApprovalChange(record._id, true)}
            >
              Approve
            </Button>
          )}
          {record.isApproved && (
            <Button
              size="small"
              onClick={() => handleApprovalChange(record._id, false)}
            >
              Revoke
            </Button>
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
      <Title level={2}>Barber Schedule Management</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card
            title="Barber Calendars"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setModalVisible(true)}
              >
                Add Absence
              </Button>
            }
          >
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

      {/* Create Absence Modal */}
      <Modal
        title="Create Barber Absence"
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAbsence}
        >
          <Form.Item
            name="barberId"
            label="Barber"
            rules={[{ required: true, message: 'Please select a barber' }]}
          >
            <Select placeholder="Select barber">
              {barbers.map(barber => (
                <Option key={barber._id} value={barber._id}>
                  {barber.userId?.name} - {barber.specialties?.join(', ')}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Absence Period"
            rules={[{ required: true, message: 'Please select date range' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select placeholder="Select reason">
              <Option value="sick_leave">Sick Leave</Option>
              <Option value="vacation">Vacation</Option>
              <Option value="emergency">Emergency</Option>
              <Option value="training">Training</Option>
              <Option value="personal">Personal</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Additional details..." />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Absence
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Barber Calendar Modal */}
      <Modal
        title={`${selectedBarber?.userId?.name} - Calendar`}
        visible={calendarModalVisible}
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
    </div>
  );
};

export default BarberScheduleManagement;
