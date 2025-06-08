import React, { useMemo } from 'react';
import { Table, Button, Tag, Space, Tooltip } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const DiscountTable = ({ discounts, loading, getDiscountStatus, handleEditDiscount, handleDeleteDiscount }) => {
  const columns = useMemo(() => [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      width: 250,
      render: (name, record) => (
        <div>
          <div>{name}</div>
          {record.isExpired && (
            <Tag color="red" style={{ marginTop: 4 }}>
              Expired
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      width: 120,
      align: 'right',
      render: discount => <Tag color="red">-${discount}</Tag>,
      sorter: (a, b) => a.discount - b.discount,
    },
    {
      title: 'End Date',
      dataIndex: 'discountEndDate',
      key: 'discountEndDate',
      width: 150,
      render: date => {
        const endDate = dayjs(date);
        const daysLeft = endDate.diff(dayjs(), 'day');
        const isExpiringSoon = daysLeft <= 7 && daysLeft > 0;

        return (
          <div>
            <div>{endDate.format('DD/MM/YYYY')}</div>
            {isExpiringSoon && (
              <Tag color="orange">
                {daysLeft} days left
              </Tag>
            )}
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
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => 
          `${range[0]}-${range[1]} of ${total} discounts`,
        pageSizeOptions: ['5', '10', '20', '50'],
      }}
      bordered
      loading={loading}
      locale={{ emptyText: 'No discounts found' }}
    />
  );
};

export default DiscountTable;