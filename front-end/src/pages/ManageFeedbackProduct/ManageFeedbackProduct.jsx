import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Space,
  Tag,
  Image,
  message,
  Spin,
  Popconfirm,
  Input,
  Select,
  Modal,
  Rate,
  Typography,
  Badge,
  Tooltip,
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  DatePicker
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  StarOutlined,
  UserOutlined,
  ShoppingOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  getAllFeedbacks,
  approveFeedback as approveFeedbackApi,
  deleteFeedback as deleteFeedbackApi
} from "../../services/api";
import "./ManageFeedbackProduct.css";

const { Search } = Input;
const { Option } = Select;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const ManageFeedbackProduct = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [filteredFeedbacks, setFilteredFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState([]);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [feedbacks, searchValue, statusFilter, dateRange]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await getAllFeedbacks();
      setFeedbacks(res.data);
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      message.error("Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...feedbacks];

    if (searchValue) {
      filtered = filtered.filter(item =>
        item.comment?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.userId?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.productId?.name?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item =>
        statusFilter === 'approved' ? item.isApproved : !item.isApproved
      );
    }

    if (dateRange.length === 2) {
      const [start, end] = dateRange;
      filtered = filtered.filter(item => {
        const created = dayjs(item.createdAt);
        return created.isAfter(start.startOf('day')) && created.isBefore(end.endOf('day'));
      });
    }

    setFilteredFeedbacks(filtered);
  };

  const approveFeedback = async (id) => {
    try {
      await approveFeedbackApi(id);
      message.success("Feedback approved successfully");
      fetchFeedbacks();
    } catch {
      message.error("Failed to approve feedback");
    }
  };

  const deleteFeedback = async (id) => {
    try {
      await deleteFeedbackApi(id);
      message.success("Feedback deleted successfully");
      fetchFeedbacks();
    } catch {
      message.error("Failed to delete feedback");
    }
  };

  const handleViewFeedback = (record) => {
    setSelectedFeedback(record);
    setViewModalVisible(true);
  };

  const stats = {
    total: feedbacks.length,
    approved: feedbacks.filter(f => f.isApproved).length,
    pending: feedbacks.filter(f => !f.isApproved).length
  };

  const columns = [
    {
      title: "Reviewer",
      dataIndex: ["userId", "name"],
      key: "user",
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text>{text || "Anonymous"}</Text>
        </Space>
      ),
      width: 180,
    },
    {
      title: "Product",
      dataIndex: ["productId", "name"],
      key: "product",
      render: (text) => (
        <Space>
          <ShoppingOutlined />
          <Tooltip title={text}>
            <Text ellipsis className="product-name">
              {text || "Unknown Product"}
            </Text>
          </Tooltip>
        </Space>
      ),
      width: 200,
    },
    {
      title: "Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating) => (
        <Space>
          <Rate disabled defaultValue={rating} />
          <Text strong>{rating}</Text>
        </Space>
      ),
      sorter: (a, b) => a.rating - b.rating,
      width: 160,
    },
    {
      title: "Comment",
      dataIndex: "comment",
      key: "comment",
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis>{text || "No comment"}</Text>
        </Tooltip>
      ),
      width: 250,
    },
    {
      title: "Image",
      dataIndex: "images",
      key: "images",
      render: (images) =>
        images?.length > 0 ? (
          <Badge count={images.length} size="small" offset={[-5, 5]}>
            <Image
              width={50}
              height={50}
              src={images[0]}
              alt="feedback"
            />
          </Badge>
        ) : (
          <Text type="secondary">No image</Text>
        ),
      width: 100,
    },
    {
      title: "Status",
      dataIndex: "isApproved",
      key: "isApproved",
      render: (approved) =>
        approved ? (
          <Tag color="success" icon={<CheckOutlined />}>Approved</Tag>
        ) : (
          <Tag color="warning" icon={<CloseOutlined />}>Pending</Tag>
        ),
      filters: [
        { text: "Approved", value: true },
        { text: "Pending", value: false }
      ],
      onFilter: (value, record) => record.isApproved === value,
      width: 130,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: "descend",
      width: 130,
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewFeedback(record)}
              size="small"
            />
          </Tooltip>
          {!record.isApproved && (
            <Tooltip title="Approve">
              <Button
                type="text"
                icon={<CheckOutlined />}
                onClick={() => approveFeedback(record._id)}
                size="small"
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Are you sure to delete this feedback?"
            onConfirm={() => deleteFeedback(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 120,
      fixed: 'right',
    },
  ];

  return (
    <div className="manage-feedback-container">
      {/* Statistics */}
      <Row gutter={16} className="stats-row">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Feedbacks"
              value={stats.total}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Approved"
              value={stats.approved}
              prefix={<CheckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<CloseOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filter & Table */}
      <Card>
        <Row justify="space-between" align="middle" className="header-row">
          <Col>
            <Space size="middle">
              <Search
                placeholder="Search..."
                allowClear
                className="search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                prefix={<SearchOutlined />}
              />
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="filter-select"
              >
                <Option value="all">All</Option>
                <Option value="approved">Approved</Option>
                <Option value="pending">Pending</Option>
              </Select>
              <RangePicker
                onChange={(dates) => setDateRange(dates || [])}
                format="DD/MM/YYYY"
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchFeedbacks}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>

        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
            <div className="loading-text">Loading data...</div>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <Empty
            description="No feedback data"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredFeedbacks}
            rowKey={(record) => record._id}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} feedbacks`
            }}
            bordered
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>

      {/* Feedback Detail Modal */}
      <Modal
        title="Feedback Details"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedFeedback && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Reviewer:</Text>
                <div>{selectedFeedback.userId?.name || 'Anonymous'}</div>
              </Col>
              <Col span={12}>
                <Text strong>Product:</Text>
                <div>{selectedFeedback.productId?.name || 'N/A'}</div>
              </Col>
            </Row>

            <div className="modal-section">
              <Text strong>Rating:</Text>
              <div>
                <Rate disabled value={selectedFeedback.rating} />
                <Text strong>{selectedFeedback.rating}/5</Text>
              </div>
            </div>

            <div className="modal-section">
              <Text strong>Comment:</Text>
              <div>{selectedFeedback.comment || 'No comment'}</div>
            </div>

            {selectedFeedback.images?.length > 0 && (
              <div className="modal-section">
                <Text strong>Images:</Text>
                <Image.PreviewGroup>
                  {selectedFeedback.images.map((url, idx) => (
                    <Image
                      key={idx}
                      width={100}
                      height={100}
                      src={url}
                      style={{ marginRight: 8 }}
                    />
                  ))}
                </Image.PreviewGroup>
              </div>
            )}

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text strong>Status:</Text>
                <div>
                  {selectedFeedback.isApproved ? (
                    <Tag color="success" icon={<CheckOutlined />}>Approved</Tag>
                  ) : (
                    <Tag color="warning" icon={<CloseOutlined />}>Pending</Tag>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <Text strong>Created At:</Text>
                <div>{new Date(selectedFeedback.createdAt).toLocaleString()}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageFeedbackProduct;
