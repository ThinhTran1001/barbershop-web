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
  toggleApproval,
  handleDelete
}) => {
  const columns = [
    {
      title: 'Customer',
      dataIndex: 'customerId',
      render: (customer) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
            {(customer?._id || customer || 'U').toString().charAt(0).toUpperCase()}
          </Avatar>
          <span style={{ fontWeight: 500 }}>
            {customer?._id || customer || 'Unknown'}
          </span>
        </Space>
      ),
      width: 150,
    },
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      render: (booking) => (
        <Space>
          <FileTextOutlined style={{ color: '#666' }} />
          <span>{booking?._id || booking || 'N/A'}</span>
        </Space>
      ),
      width: 140,
    },
    {
      title: 'Barber',
      dataIndex: 'barberId',
      render: (barber) => (
        <span>{barber?.name || barber?._id || barber || 'Unknown'}</span>
      ),
      width: 150,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      render: (rating) => (
        <Space>
          <Rate disabled defaultValue={rating} />
          <span style={{ fontWeight: 'bold', marginLeft: 8 }}>{rating}</span>
        </Space>
      ),
      width: 180,
      sorter: (a, b) => a.rating - b.rating
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      render: (text) => (
        <Tooltip title={text}>
          <div style={{
            maxWidth: 300, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {text}
          </div>
        </Tooltip>
      ),
      width: 300,
    },
    {
      title: 'Images',
      dataIndex: 'images',
      render: (images) => (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {images?.length ? (
            <>
              <Image
                width={60}
                height={60}
                src={images[0]}
                style={{ borderRadius: 8, objectFit: 'cover' }}
                preview={{ src: images[0] }}
              />
              {images.length > 1 && (
                <div style={{
                  position: 'absolute', top: -8, right: -8, backgroundColor: '#ff4d4f',
                  color: 'white', borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 'bold'
                }}>
                  {images.length}
                </div>
              )}
            </>
          ) : (
            <div style={{
              width: 60, height: 60, backgroundColor: '#f5f5f5', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999'
            }}>
              No Image
            </div>
          )}
        </div>
      ),
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'isApproved',
      render: (isApproved) => (
        <Tag color={isApproved ? 'success' : 'warning'} icon={isApproved ? <CheckOutlined /> : <CloseOutlined />}>
          {isApproved ? 'Approved' : 'Pending'}
        </Tag>
      ),
      width: 120,
      filters: [
        { text: 'Approved', value: true },
        { text: 'Pending', value: false },
      ],
      onFilter: (value, record) => record.isApproved === value,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('en-GB'),
      width: 140,
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)} />
          </Tooltip>
          <Tooltip title={record.isApproved ? 'Unapprove' : 'Approve'}>
            <Button
              type="text"
              icon={record.isApproved ? <CloseOutlined /> : <CheckOutlined />}
              onClick={() => toggleApproval(record)}
              style={{ color: record.isApproved ? '#ff4d4f' : '#52c41a' }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" icon={<DeleteOutlined />} danger onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      ),
      width: 140,
      fixed: 'right'
    }
  ];

  return (
    <Table
      rowKey="_id"
      columns={columns}
      dataSource={feedbacks}
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
    />
  );
};

export default FeedbackBarberTable;
