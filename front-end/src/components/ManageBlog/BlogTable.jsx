import React from 'react';
import { Table, Button, Tag, Space, Popconfirm } from 'antd';

const BlogTable = ({ data, loading, onEdit, onDelete, pagination, onChange }) => {
  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      render: (img) => img ? <img src={img} alt="blog" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 4 }} /> : null,
      width: 80,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => <b>{text}</b>,
    },
    {
      title: 'Category',
      dataIndex: 'categories',
      key: 'categories',
      render: (cats) => cats?.map((cat) => <Tag key={cat} color="blue">{cat}</Tag>),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'active') return <Tag color="green">Active</Tag>;
        if (status === 'inactive') return <Tag color="volcano">Inactive</Tag>;
        return '';
      },
      width: 100,
    },
    {
      title: 'Published Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : '',
      width: 120,
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags) => tags?.map((tag) => <Tag key={tag} color="gold">{tag}</Tag>),
      width: 160,
    },
    {
      title: 'Actions',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => onDelete(record._id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      rowKey="_id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      bordered
      onChange={onChange}
    />
  );
};

export default BlogTable;
