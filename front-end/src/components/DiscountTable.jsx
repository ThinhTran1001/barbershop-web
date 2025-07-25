import React, { useMemo } from 'react';
import { Table, Button, Tag, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const DiscountTable = ({ discounts, loading, getDiscountStatus, handleEditDiscount, handleDeleteDiscount, pagination, onChangePagination }) => {
  // Function to format currency in VND
  const formatVND = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = useMemo(() => [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      width: 150,
      align: 'right',
      render: discount => (
        <Tag color="red" style={{ fontSize: '12px', padding: '4px 8px' }}>
          -{discount}%
        </Tag>
      ),
      sorter: (a, b) => a.discount - b.discount,
    },
    {
      title: 'End Date',
      dataIndex: 'discountEndDate',
      key: 'discountEndDate',
      width: 150,
      render: date => {
        const endDate = dayjs(date);
        return (
          <div>
            <div>{endDate.format('DD/MM/YYYY')}</div>
          </div>
        );
      },
      sorter: (a, b) => new Date(a.discountEndDate) - new Date(b.discountEndDate),
    },
    {
      title: 'Status',
      key: 'status',
      width: 130,
      render: (_, record) => {
        const status = getDiscountStatus(record);
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditDiscount(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDeleteDiscount(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ], [getDiscountStatus, handleEditDiscount, handleDeleteDiscount]);

  return (
    <Table
      rowKey="_id"
      dataSource={discounts}
      columns={columns}
      scroll={{ x: 800 }}
      pagination={{
        ...pagination,
        showSizeChanger: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} discounts`,
        pageSizeOptions: ['5', '10', '20', '50'],
      }}
      onChange={(_, __, ___, pagination) => onChangePagination({ current: pagination.current, pageSize: pagination.pageSize })}
      bordered
      loading={loading}
      locale={{ emptyText: 'No discounts found' }}
    />
  );
};

export default DiscountTable;