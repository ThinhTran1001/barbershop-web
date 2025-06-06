import React from 'react';
import { Table, Space, Tag, Image, Tooltip, Button, Spin, Empty, Typography, Badge, Rate, Popconfirm } from 'antd';
import {
  UserOutlined, ShoppingOutlined, EyeOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const FeedbackProductTable = ({ filteredFeedbacks, loading, handleViewFeedback, approveFeedback, deleteFeedback }) => {
  const columns = [
    {
      title: 'Reviewer',
      dataIndex: ['userId', 'name'],
      key: 'user',
      render: (text) => (
        <Space>
          <UserOutlined />
          <Text>{text || 'Anonymous'}</Text>
        </Space>
      ),
      width: 180,
    },
    {
      title: 'Product',
      dataIndex: ['productId', 'name'],
      key: 'product',
      render: (text) => (
        <Space>
          <ShoppingOutlined />
          <Tooltip title={text}>
            <Text ellipsis className="product-name">
              {text || 'Unknown Product'}
            </Text>
          </Tooltip>
        </Space>
      ),
      width: 200,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
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
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (text) => (
        <Tooltip title={text}>
          <Text ellipsis>{text || 'No comment'}</Text>
        </Tooltip>
      ),
      width: 250,
    },
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
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
      title: 'Status',
      dataIndex: 'isApproved',
      key: 'isApproved',
      render: (approved) =>
        approved ? (
          <Tag color="success" icon={<CheckOutlined />}>Approved</Tag>
        ) : (
          <Tag color="warning" icon={<CloseOutlined />}>Pending</Tag>
        ),
      filters: [
        { text: 'Approved', value: true },
        { text: 'Pending', value: false }
      ],
      onFilter: (value, record) => record.isApproved === value,
      width: 130,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      defaultSortOrder: 'descend',
      width: 130,
    },
    {
      title: 'Actions',
      key: 'action',
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
    <>
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
    </>
  );
};

export default FeedbackProductTable;