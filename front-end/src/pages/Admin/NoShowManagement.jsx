import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Tag,
  Space,
  Input,
  Modal,
  Form,
  Select,
  DatePicker,
  Statistic,
  Row,
  Col,
  Popconfirm,
  Alert,
  Descriptions
} from 'antd';
import {
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext.jsx';
import ToastService from '../../services/toastService.jsx';
import dayjs from 'dayjs';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const NoShowManagement = () => {
  const { user } = useAuth();
  const [noShows, setNoShows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [blockedCustomers, setBlockedCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [excuseModalVisible, setExcuseModalVisible] = useState(false);
  const [selectedNoShow, setSelectedNoShow] = useState(null);
  const [form] = Form.useForm();
  const [resetForm] = Form.useForm();

  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    customerId: null,
    barberId: null,
    isExcused: null,
    reason: null,
    dateRange: null
  });

  useEffect(() => {
    loadNoShows();
    loadStatistics();
  }, [filters]);

  const loadNoShows = async () => {
    setLoading(true);
    try {
      const params = { ...filters };
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }
      delete params.dateRange;

      const response = await axios.get('/api/no-shows', { params });
      setNoShows(response.data.noShows);
    } catch (error) {
      console.error('Error loading no-shows:', error);
      ToastService.showNetworkError('loading no-show records');
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const params = {};
      if (filters.dateRange) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await axios.get('/api/no-shows/statistics', { params });
      setStatistics(response.data.statistics);
      setBlockedCustomers(response.data.blockedCustomers);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const handleExcuseNoShow = async (values) => {
    try {
      await axios.put(`/api/no-shows/${selectedNoShow._id}/excuse`, {
        reason: values.reason
      });

      ToastService.showValidationSuccess('No-show excused successfully');
      setExcuseModalVisible(false);
      form.resetFields();
      loadNoShows();
      loadStatistics();
    } catch (error) {
      console.error('Error excusing no-show:', error);
      ToastService.showNetworkError('excusing no-show');
    }
  };

  const handleResetCustomerNoShows = async (values) => {
    try {
      await axios.put(`/api/no-shows/customers/${selectedCustomer.customerId}/reset`, {
        reason: values.reason
      });

      ToastService.showValidationSuccess(
        `Reset ${selectedCustomer.noShowCount} no-shows for ${selectedCustomer.customerName}`
      );
      setResetModalVisible(false);
      resetForm.resetFields();
      loadNoShows();
      loadStatistics();
    } catch (error) {
      console.error('Error resetting customer no-shows:', error);
      ToastService.showNetworkError('resetting customer no-shows');
    }
  };

  const getStatusColor = (isExcused) => {
    return isExcused ? 'green' : 'red';
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case 'customer_cancelled': return 'orange';
      case 'no_show': return 'red';
      case 'late_cancellation': return 'volcano';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Customer',
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
        </div>
      )
    },
    {
      title: 'Booking Date',
      dataIndex: 'originalBookingDate',
      key: 'bookingDate',
      render: (date) => (
        <div>
          <CalendarOutlined /> {dayjs(date).format('DD/MM/YYYY HH:mm')}
        </div>
      ),
      sorter: true
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => (
        <Tag color={getReasonColor(reason)}>
          {reason.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'isExcused',
      key: 'status',
      render: (isExcused) => (
        <Tag color={getStatusColor(isExcused)}>
          {isExcused ? 'EXCUSED' : 'ACTIVE'}
        </Tag>
      )
    },
    {
      title: 'Cancelled Date',
      dataIndex: 'cancelledDate',
      key: 'cancelledDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {!record.isExcused && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setSelectedNoShow(record);
                setExcuseModalVisible(true);
              }}
            >
              Excuse
            </Button>
          )}
        </Space>
      )
    }
  ];

  const blockedCustomersColumns = [
    {
      title: 'Customer',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (name, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customerEmail}
          </div>
        </div>
      )
    },
    {
      title: 'No-Show Count',
      dataIndex: 'noShowCount',
      key: 'noShowCount',
      render: (count) => (
        <Tag color="red" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          {count} no-shows
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Popconfirm
          title="Reset customer's no-show count?"
          description="This will excuse all their no-shows and allow them to book again."
          onConfirm={() => {
            setSelectedCustomer(record);
            setResetModalVisible(true);
          }}
          okText="Reset"
          cancelText="Cancel"
        >
          <Button
            size="small"
            type="primary"
            danger
            icon={<ReloadOutlined />}
          >
            Reset Count
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={2}>No-Show Management</Title>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Total No-Shows"
              value={statistics.totalNoShows || 0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Excused"
              value={statistics.excusedNoShows || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Blocked Customers"
              value={blockedCustomers.length}
              valueStyle={{ color: '#fa541c' }}
              prefix={<CloseCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={6}>
          <Card>
            <Statistic
              title="Late Cancellations"
              value={statistics.lateCancellations || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Blocked Customers Alert */}
      {blockedCustomers.length > 0 && (
        <Alert
          message={`${blockedCustomers.length} customers are currently blocked from booking`}
          description="These customers have 3 or more no-shows and cannot make new bookings."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by reason"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, reason: value, page: 1 })}
            >
              <Option value="customer_cancelled">Customer Cancelled</Option>
              <Option value="no_show">No Show</Option>
              <Option value="late_cancellation">Late Cancellation</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => setFilters({ ...filters, isExcused: value, page: 1 })}
            >
              <Option value="false">Active</Option>
              <Option value="true">Excused</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates, page: 1 })}
            />
          </Col>
        </Row>
      </Card>

      {/* No-Shows Table */}
      <Card title="No-Show Records">
        <Table
          columns={columns}
          dataSource={noShows}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: filters.page,
            pageSize: filters.limit,
            onChange: (page) => setFilters({ ...filters, page })
          }}
        />
      </Card>

      {/* Blocked Customers Table */}
      {blockedCustomers.length > 0 && (
        <Card title="Blocked Customers" style={{ marginTop: 16 }}>
          <Table
            columns={blockedCustomersColumns}
            dataSource={blockedCustomers}
            rowKey="customerId"
            pagination={false}
          />
        </Card>
      )}

      {/* Excuse No-Show Modal */}
      <Modal
        title="Excuse No-Show"
        open={excuseModalVisible}
        onCancel={() => {
          setExcuseModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} onFinish={handleExcuseNoShow} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason for excusing"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea rows={4} placeholder="Explain why this no-show should be excused..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Excuse No-Show
              </Button>
              <Button onClick={() => setExcuseModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Reset Customer Modal */}
      <Modal
        title={`Reset No-Shows for ${selectedCustomer?.customerName}`}
        open={resetModalVisible}
        onCancel={() => {
          setResetModalVisible(false);
          resetForm.resetFields();
        }}
        footer={null}
      >
        <Alert
          message="This will excuse all no-shows for this customer"
          description={`Customer currently has ${selectedCustomer?.noShowCount} no-shows. After reset, they will be able to book again.`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form form={resetForm} onFinish={handleResetCustomerNoShows} layout="vertical">
          <Form.Item
            name="reason"
            label="Reason for reset"
            rules={[{ required: true, message: 'Please provide a reason' }]}
          >
            <TextArea rows={4} placeholder="Explain why this customer's no-shows should be reset..." />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" danger htmlType="submit">
                Reset No-Shows
              </Button>
              <Button onClick={() => setResetModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NoShowManagement;
