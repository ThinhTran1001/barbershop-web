import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select } from 'antd';
import { getAllUser, updateUser , createUser } from '../services/api';
import { InfoCircleFilled } from '@ant-design/icons';

const { Option } = Select;
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
  { value: 'suspended', label: 'Suspended' },
];

const BarberManagement = () => {
  const [barbers, setBarbers] = useState([]);
  const [allBarbers, setAllBarbers] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingBarber, setEditingBarber] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    filterBarbers();
  }, [searchTerm, statusFilter]);

  const fetchInitialData = async () => {
    try {
      const response = await getAllUser();
      console.log('Dữ liệu barber sau cập nhật:', response.data);
      setAllBarbers(response.data);
      setBarbers(response.data);
    } catch (error) {
      message.error('Không thể tải danh sách barber: ' + error.message);
    }
  };

  const filterBarbers = () => {
    let filtered = [...allBarbers];
    if (searchTerm) {
      filtered = filtered.filter((barber) =>
        barber.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter) {
      filtered = filtered.filter((barber) => barber.status === statusFilter);
    }
    setBarbers(filtered);
  };

  const handleAddOrUpdateBarber = async (values) => {
    try {
      const barberData = editingBarber
        ? { status: values.status }
        : {
            ...values,
            role: 'barber',
            phone: values.phone || null,
            avatarUrl: values.avatarUrl || null,
            status: values.status,
          };

      console.log('Payload gửi đi:', barberData);

      const response = editingBarber
        ? await updateUser(editingBarber._id, barberData)
        : await createUser(barberData);

      console.log('Phản hồi từ updateBarber:', response.data);

      if ([200, 201, 204].includes(response.status)) {
        message.success(`${editingBarber ? 'Cập nhật' : 'Thêm'} barber thành công`);
        fetchInitialData();
        setIsModalVisible(false);
        form.resetFields();
        setEditingBarber(null);
      } else {
        throw new Error(`Mã phản hồi không mong đợi: ${response.status}`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      console.error('Chi tiết lỗi:', error.response?.data || error.message);
      message.error(`Không thể ${editingBarber ? 'cập nhật' : 'thêm'} barber: ${errorMessage}`);
    }
  };

  const showModal = (barber = null) => {
    if (barber) {
      setEditingBarber(barber);
      form.setFieldsValue({ ...barber, passwordHash: "***********************************************" });
    } else {
      setEditingBarber(null);
      form.resetFields();
      form.setFieldsValue({ status: 'active' });
    }
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatarUrl',
      key: 'avatarUrl',
      render: (avatarUrl) =>
        avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: 50, height: 50 }} /> : 'N/A',
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color =
          status === 'active' ? 'green' : status === 'suspended' ? 'orange' : status === 'banned' ? 'red' : 'black';
        return <span style={{ color }}>{status}</span>;
      },
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
        {/* <Button type="primary" onClick={() => showModal()}>
          Add Barber
        </Button> */}
      </div>

      <Table
        dataSource={barbers}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: barbers.length,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
        }}
      />

      <Modal
        title={editingBarber ? 'Chỉnh sửa Barber' : 'Thêm Barber mới'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateBarber} layout="vertical">
          <Form.Item
            name="name"
            label="Tên"
            rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}
          >
            <Input disabled={!!editingBarber} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ!' }]}
          >
            <Input disabled={!!editingBarber} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải có 10 chữ số' }]}
          >
            <Input disabled={!!editingBarber} />
          </Form.Item>
          <Form.Item
            name="passwordHash"
            label="Mật khẩu"
            rules={[{ required: !editingBarber, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
             disabled={!!editingBarber} 
            />
          </Form.Item>
          <Form.Item
            name="avatarUrl"
            label="URL Avatar"
            rules={[{ type: 'url', message: 'Vui lòng nhập URL hợp lệ' }]}
          >
            <Input disabled={!!editingBarber} />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select>
              {STATUS_OPTIONS.map((option) => (
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

export default BarberManagement;