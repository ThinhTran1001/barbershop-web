import React from 'react';
import { Table, Space, Tag, Avatar, Rate, Image, Tooltip, Button } from 'antd';
import {
  UserOutlined, FileTextOutlined, EyeOutlined, DeleteOutlined,
  CheckOutlined, CloseOutlined
} from '@ant-design/icons';

const FeedbackBarberTable = ({
  feedbacks,
  loading,
  pagination,
  handleTableChange,
  handleViewDetail,
  handleDelete
}) => {
  const columns = [
    {
      title: 'Customer',
      dataIndex: 'reviewer',
      key: 'reviewer',
      render: (reviewer, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
            {(reviewer || record.customerId?.name || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <span style={{ fontWeight: 500 }}>
            {reviewer || record.customerId?.name || record.customerId?._id || 'Unknown'}
          </span>
        </Space>
      ),
      width: 150,
    },
    {
      title: 'Barber',
      dataIndex: 'barberId',
      key: 'barberId',
      render: (barber) => (
        <span style={{ fontWeight: 500 }}>
          {barber?.userId?.name || barber?.name || barber?.email || barber?._id || 'Unknown Barber'}
        </span>
      ),
      width: 160,
    },
    {
      title: 'Booking',
      dataIndex: 'bookingId',
      key: 'bookingId',
      render: (booking) => (
        <Space>
          <FileTextOutlined style={{ color: '#666' }} />
          <span>{booking?.name || booking?.title || booking?.customerName || booking?._id || 'Unknown Booking'}</span>
        </Space>
      ),
      width: 120,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <Rate disabled allowHalf value={rating || 0} />
        </Space>
      ),
      width: 180,
      sorter: (a, b) => (a.rating || 0) - (b.rating || 0),
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      render: (text) => (
        <Tooltip title={text || 'No comment'}>
          <div style={{
            maxWidth: 250,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {text || 'No comment'}
          </div>
        </Tooltip>
      ),
      width: 250,
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: (images, record) => {
        const imageSrc = images?.[0] || 'https://via.placeholder.com/50x50?text=No+Img';
        const showSpecialBadge = record.rating === 4.8;

        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Image
              width={50}
              height={50}
              src={imageSrc}
              style={{ borderRadius: 6, objectFit: 'cover' }}
              preview={{ src: imageSrc }}
            />
            {showSpecialBadge && (
              <div style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: '#ff4d4f',
                color: 'white',
                borderRadius: '50%',
                width: 22,
                height: 22,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 'bold',
                boxShadow: '0 0 2px rgba(0,0,0,0.3)'
              }}>
                4.8
              </div>
            )}
            {!showSpecialBadge && images?.length > 1 && (
              <div style={{
                position: 'absolute',
                top: -6,
                right: -6,
                backgroundColor: '#ff4d4f',
                color: 'white',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 'bold'
              }}>
                {images.length}
              </div>
            )}
          </div>
        );
      },
      width: 80,
    },
    {
      title: 'Status',
      dataIndex: 'isDeleted',
      key: 'isDeleted',
      render: (isDeleted, record) => (
        <Tag
          color={isDeleted ? 'error' : 'success'}
          icon={isDeleted ? <CloseOutlined /> : <CheckOutlined />}
        >
          {isDeleted ? 'Deleted' : 'Active'}
        </Tag>
      ),
      width: 110,
      filters: [
        { text: 'Active', value: false },
        { text: 'Deleted', value: true },
      ],
      onFilter: (value, record) => record.isDeleted === value,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
      width: 100,
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>

          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  return (
    <Table
      rowKey="_id"
      columns={columns}
      dataSource={feedbacks || []}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        pageSizeOptions: ['5', '10', '20', '50'],
        showTotal: (total) => `Total ${total} records`
      }}
      onChange={handleTableChange}
      scroll={{ x: 1200 }}
      size="middle"
    />
  );
};

export default FeedbackBarberTable;
