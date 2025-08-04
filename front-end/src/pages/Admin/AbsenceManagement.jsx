import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Table,
  Button,
  Modal,
  Select,
  message,
  Space,
  Tag,
  Row,
  Col,
  Descriptions
} from 'antd';
import { toast } from 'react-toastify';
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserSwitchOutlined
} from '@ant-design/icons';
import {
  getAllAbsences,
  updateAbsenceApproval
} from '../../services/barberAbsenceApi.js';
import AbsenceStatusBadge from '../../components/absence/AbsenceStatusBadge';
import AbsenceApprovalModal from '../../components/absence/AbsenceApprovalModal';
import { fetchAllBarbers } from '../../services/barberApi.js';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const AbsenceManagement = () => {
  const [barbers, setBarbers] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [absenceToApprove, setAbsenceToApprove] = useState(null);
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
      setBarbers(response.barbers || []);
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
    if (isApproved) {
      // For approval, show the modal to handle affected bookings
      const absence = absences.find(a => a._id === absenceId);
      setAbsenceToApprove(absence);
      setApprovalModalVisible(true);
      return;
    }

    // For rejection, proceed with original logic
    const loadingToastId = toast.loading(
      '❌ Rejecting absence request...',
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
      await updateAbsenceApproval(absenceId, false);

      toast.update(loadingToastId, {
        render: `❌ Absence request rejected.\n📅 Barber schedule remains unchanged.\n✅ No further action required.`,
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
      toast.update(loadingToastId, {
        render: `❌ Failed to reject absence request.\n🔍 Please check the details and try again.\n📞 Contact support if the issue persists.`,
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

  // Handle successful approval from modal
  const handleApprovalSuccess = () => {
    loadAbsences();
    setAbsenceToApprove(null);
  };

  const showAbsenceDetail = (absence) => {
    setSelectedAbsence(absence);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Barber',
      dataIndex: ['barberId', 'userId', 'name'],
      key: 'barber',
      render: (name) => name || 'Unknown'
    },
    {
      title: 'Date Range',
      key: 'dateRange',
      render: (_, record) => (
        <div>
          <div>{dayjs(record.startDate).format('MMM DD, YYYY')}</div>
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
      render: (reason) => reason ? reason.replace('_', ' ').toUpperCase() : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'isApproved',
      key: 'status',
      render: (isApproved) => <AbsenceStatusBadge isApproved={isApproved} />
    },
    {
      title: 'Submitted',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('MMM DD, YYYY')
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
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Absence Management</Title>

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
              <Option value="rejected">Rejected</Option>
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

      {/* Absence Records Table */}
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

      {/* Absence Approval Modal */}
      <AbsenceApprovalModal
        visible={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setAbsenceToApprove(null);
        }}
        onSuccess={handleApprovalSuccess}
        absence={absenceToApprove}
      />
    </div>
  );
};

export default AbsenceManagement;
