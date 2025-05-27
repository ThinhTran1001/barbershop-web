
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select } from 'antd';
import { getAllUser, updateUser, createUser } from '../services/api';
import { InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';

const { Option } = Select;

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'suspended', label: 'Suspended' },
];
const ROLE_OPTIONS = [
  { value: 'barber', label: 'Barber' },
  { value: 'admin', label: 'Admin' },
  { value: 'customer', label: 'Customer' },
];
const VERIFIED_OPTIONS = [
  { value: true, label: 'Verified' },
  { value: false, label: 'Not Verified' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [roleFilter, setRoleFilter] = useState(undefined);
  const [verifiedFilter, setVerifiedFilter] = useState(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [sortName, setSortName] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, statusFilter, roleFilter, verifiedFilter, sortName]);

  const fetchInitialData = async () => {
    try {
      const response = await getAllUser();
      console.log('User data after fetch:', response.data);
      setAllUsers(response.data);
      setUsers(response.data);
    } catch (error) {
      message.error('Failed to load user list: ' + error.message);
    }
  };

  const filterUsers = () => {
    let filtered = [...allUsers];
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== undefined) {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }
    if (roleFilter !== undefined) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }
    if (verifiedFilter !== undefined) {
      filtered = filtered.filter((user) => user.isVerified === verifiedFilter);
    }
    if (sortName) {
      filtered.sort((a, b) =>
        sortName === 'asc'
          ? a.name?.localeCompare(b.name || '')
          : b.name?.localeCompare(a.name || '')
      );
    }
    setUsers(filtered);
  };

  const handleAddOrUpdateUser = async (values) => {
    try {
      const userData = editingUser
        ? { status: values.status, isVerified: values.isVerified }
        : {
            ...values,
            role: 'barber',
            phone: values.phone || null,
            avatarUrl: values.avatarUrl || null,
            status: values.status,
            isVerified: values.isVerified || true,
          };

      console.log('Payload sent:', userData);

      const response = editingUser
        ? await updateUser(editingUser._id, userData)
        : await createUser(userData);

      console.log('Response from updateUser:', response.data);

      if ([200, 201, 204].includes(response.status)) {
        message.success(`${editingUser ? 'Updated' : 'Added'} user successfully`);
        fetchInitialData();
        setIsModalVisible(false);
        form.resetFields();
        setEditingUser(null);
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Error details:', error.response?.data || error.message);
      message.error(`Failed to ${editingUser ? 'update' : 'add'} user: ${errorMessage}`);
    }
  };

  const showModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue({
        ...user,
        passwordHash: '***********************************************',
      });
    } else {
      setEditingUser(null);
      form.resetFields();
      form.setFieldsValue({ status: 'active', isVerified: true });
    }
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      render: (avatarUrl) =>
        avatarUrl ? (
          <img src={avatarUrl} alt="avatar" style={{ width: 50, height: 50 }} />
        ) : (
          'N/A'
        ),
    },
    {
      title: () => (
        <span>
          Name{' '}
          {sortName ? (
            sortName === 'asc' ? (
              <SortAscendingOutlined onClick={() => setSortName('desc')} />
            ) : (
              <SortDescendingOutlined onClick={() => setSortName('asc')} />
            )
          ) : (
            <SortAscendingOutlined onClick={() => setSortName('asc')} />
          )}
        </span>
      ),
      dataIndex: 'name',
      key: 'name',
      render: (name) => name || 'N/A',
    },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (email) => email || 'N/A' },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => role || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color =
          status === 'active'
            ? 'green'
            : status === 'suspended'
            ? 'orange'
            : status === 'banned'
            ? 'red'
            : 'black';
        return <span style={{ color }}>{status || 'N/A'}</span>;
      },
    },
    {
      title: 'Verified',
      dataIndex: 'isVerified',
      key: 'isVerified',
      render: (isVerified) => (
        <span style={{ color: isVerified ? 'green' : 'red' }}>
          {isVerified ? 'Verified' : 'Not Verified'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button onClick={() => showModal(record)} className="me-2">
          <InfoCircleFilled />
        </Button>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3 d-flex align-items-center">
        <Input
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200, marginRight: 10 }}
        />
        <Select
          placeholder="Filter by Status"
          value={statusFilter}
          onChange={(value) => setStatusFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {STATUS_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Role"
          value={roleFilter}
          onChange={(value) => setRoleFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {ROLE_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by Verified"
          value={verifiedFilter}
          onChange={(value) => setVerifiedFilter(value)}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {VERIFIED_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
        <Button type="primary" onClick={() => showModal()}>
          Add User
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: users.length,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
        }}
      />

      <Modal
        title={editingUser ? 'Edit User' : 'Add New User'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateUser} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter the name!' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Please enter a valid email!' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[{ pattern: /^[0-9]{10}$/, message: 'Phone number must be 10 digits!' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="passwordHash"
            label="Password"
            rules={[{ required: !editingUser, message: 'Please enter the password!' }]}
          >
            <Input.Password disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="avatarUrl"
            label="Avatar URL"
            rules={[{ type: 'url', message: 'Please enter a valid URL!' }]}
          >
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select a status!' }]}
          >
            <Select>
              {STATUS_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="isVerified"
            label="Verified"
            rules={[{ required: true, message: 'Please select verification status!' }]}
          >
            <Select>
              {VERIFIED_OPTIONS.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;