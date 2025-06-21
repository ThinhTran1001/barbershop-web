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
  console.log('FeedbackBarberTable received feedbacks:', feedbacks); // Log dữ liệu đầu vào

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'reviewer',
      key: 'reviewer',
      render: (reviewer, record) => {
        console.log('Rendering customer for record:', record); // Log từng record
        return (
          <Space>
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }}>
              {(reviewer || record.customerId?.name || record.customerId?._id || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <span style={{ fontWeight: 500 }}>
              {reviewer || record.customerId?.name || record.customerId?._id || 'Unknown'}
            </span>
          </Space>
        );
      },
      width: 150,
    },
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
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
      key: 'barberId',
      render: (barber) => (
        <span>{barber?.name || barber?._id || 'Unknown'}</span>
      ),
      width: 150,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Space>
          <Rate disabled value={rating || 0} />
          <span style={{ fontWeight: 'bold', marginLeft: 8 }}>{rating || 'N/A'}</span>
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
            maxWidth: 300, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {text || 'No comment'}
          </div>
        </Tooltip>
      ),
      width: 300,
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
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
      key: 'isApproved',
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
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
      width: 140,
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
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
      scroll={{ x: 1300 }}
    />
  );
};

export default FeedbackBarberTable;