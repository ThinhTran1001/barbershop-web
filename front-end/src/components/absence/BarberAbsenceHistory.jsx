import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Select,
  DatePicker,
  Space,
  message,
  Empty,
  Descriptions,
  Modal,
  Row,
  Col
} from 'antd';
import {
  EyeOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AbsenceStatusBadge from './AbsenceStatusBadge';
import { getMyAbsenceRequests } from '../../services/barberAbsenceApi';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const BarberAbsenceHistory = () => {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    status: '',
    dateRange: null
  });
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    loadAbsenceHistory();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadAbsenceHistory = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        limit: pagination.pageSize
      };

      if (filters.status) {
        params.status = filters.status;
      }

      if (filters.dateRange && filters.dateRange.length === 2) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      }

      const response = await getMyAbsenceRequests(params);
      setAbsences(response.absences || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0
      }));
    } catch (error) {
      message.error('Failed to load absence history');
      console.error('Error loading absence history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const handleTableChange = (paginationInfo) => {
    setPagination(prev => ({
      ...prev,
      current: paginationInfo.current,
      pageSize: paginationInfo.pageSize
    }));
  };

  const showAbsenceDetail = (absence) => {
    setSelectedAbsence(absence);
    setDetailModalVisible(true);
  };

  const getReasonText = (reason) => {
    const reasonMap = {
      sick_leave: 'Sick Leave',
      vacation: 'Vacation',
      emergency: 'Emergency',
      training: 'Training',
      personal: 'Personal',
      other: 'Other'
    };
    return reasonMap[reason] || reason;
  };

  const columns = [
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            {dayjs(record.startDate).format('MMM DD, YYYY')}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            to {dayjs(record.endDate).format('MMM DD, YYYY')}
          </div>
        </div>
      )
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        const days = dayjs(record.endDate).diff(dayjs(record.startDate), 'day') + 1;
        return `${days} day${days > 1 ? 's' : ''}`;
      }
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => getReasonText(reason)
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <AbsenceStatusBadge isApproved={record.isApproved} />
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Approved By',
      key: 'approvedBy',
      render: (_, record) => (
        record.approvedBy ? (
          <div>
            <UserOutlined style={{ marginRight: 4 }} />
            {record.approvedBy.name}
          </div>
        ) : (
          <span style={{ color: '#999' }}>-</span>
        )
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <EyeOutlined
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => showAbsenceDetail(record)}
            title="View Details"
          />
        </Space>
      )
    }
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          My Absence History
        </Title>
      </div>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
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
        <Col xs={24} sm={12}>
          <RangePicker
            style={{ width: '100%' }}
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            placeholder={['Start Date', 'End Date']}
          />
        </Col>
      </Row>

      {/* Table */}
      <Table
        columns={columns}
        dataSource={absences}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} requests`
        }}
        onChange={handleTableChange}
        locale={{
          emptyText: (
            <Empty
              description="No absence requests found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )
        }}
      />

      {/* Detail Modal */}
      <Modal
        title="Absence Request Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedAbsence && (
          <Descriptions column={1} bordered>
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
              {getReasonText(selectedAbsence.reason)}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              {selectedAbsence.description || 'No description provided'}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {dayjs(selectedAbsence.createdAt).format('MMMM DD, YYYY [at] HH:mm')}
            </Descriptions.Item>
            {selectedAbsence.approvedBy && (
              <Descriptions.Item label="Approved By">
                {selectedAbsence.approvedBy.name} ({selectedAbsence.approvedBy.email})
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
    </Card>
  );
};

export default BarberAbsenceHistory;
