import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Input, Space, Popconfirm, message, Select } from "antd";
import axios from "axios";
import "./ManagingService.css";

const API_URL = "http://localhost:3000/api/services";

const serviceTemplates = [
  { name: "Cắt tóc", price: 100000, description: "Cắt tóc theo yêu cầu", steps: "Tư vấn, Gội đầu, Cắt tạo kiểu, Sấy tóc", durationMinutes: 30, suggestedFor: ["tóc mỏng", "tóc dài"] },
  { name: "Gội đầu", price: 50000, description: "Gội đầu thư giãn", steps: "Gội nước, Thoa dầu gội, Massage da đầu, Xả sạch", durationMinutes: 20, suggestedFor: ["mọi loại tóc"] },
  { name: "Nhuộm tóc", price: 300000, description: "Nhuộm màu tóc theo ý muốn", steps: "Tư vấn màu, Thử thuốc, Nhuộm, Gội, Sấy", durationMinutes: 60, suggestedFor: ["tóc mỏng", "tóc dài"] },
];

const ManagingService = () => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await axios.get(API_URL);
      setServices(res.data);
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error("Lỗi khi tải dịch vụ");
    }
  };

  const showModal = (record = null) => {
    setEditingService(record);
    form.setFieldsValue(record || { name: "", price: "", description: "", steps: "", durationMinutes: "", suggestedFor: [] });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingService(null);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      message.success("Xóa dịch vụ thành công");
      fetchServices();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error("Lỗi khi xóa dịch vụ");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        await axios.put(`${API_URL}/${editingService._id}`, values);
        message.success("Cập nhật dịch vụ thành công");
      } else {
        await axios.post(API_URL, values);
        message.success("Thêm dịch vụ thành công");
      }
      fetchServices();
      handleCancel();
    // eslint-disable-next-line no-unused-vars
    } catch (err) {
      message.error("Lỗi khi lưu dịch vụ");
    }
  };

  const columns = [
    { title: "Tên dịch vụ", dataIndex: "name", key: "name" },
    { title: "Giá", dataIndex: "price", key: "price", render: (text) => `${text} VND` },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    { title: "Các bước", dataIndex: "steps", key: "steps" },
    { title: "Thời gian (phút)", dataIndex: "durationMinutes", key: "durationMinutes" },
    { title: "Phù hợp với", dataIndex: "suggestedFor", key: "suggestedFor", render: (arr) => arr?.join(", ") },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showModal(record)}>Sửa</Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="managing-service-container">
      <div className="header">
        <h2>Quản lý dịch vụ</h2>
        <Button type="primary" onClick={() => showModal()}>Thêm dịch vụ</Button>
      </div>

      <Table rowKey="_id" dataSource={services} columns={columns} pagination={{ pageSize: 5 }} />

      <Modal
        title={editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
        <Form.Item
    name="name"
    label="Tên dịch vụ"
    rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
    initialValue="" // Đặt giá trị mặc định là rỗng để placeholder hiển thị
  >
    <Select
      placeholder="Chọn dịch vụ"
      disabled={!!editingService}
      onChange={(value) => {
        const selected = serviceTemplates.find((item) => item.name === value);
        if (selected) {
          form.setFieldsValue({
            name: selected.name,
            price: selected.price,
            description: selected.description,
            steps: selected.steps,
            durationMinutes: selected.durationMinutes,
            suggestedFor: selected.suggestedFor || [],
          });
        }
      }}
      allowClear
    >
      {serviceTemplates.map((item) => (
        <Select.Option key={item.name} value={item.name}>{item.name}</Select.Option>
      ))}
      {/* Thêm tùy chọn mặc định nếu cần */}
      <Select.Option value="" disabled>
        Chọn dịch vụ
      </Select.Option>
    </Select>
  </Form.Item>

          <Form.Item
            name="price"
            label="Giá (VND)"
            rules={[{ required: true, message: "Vui lòng nhập giá" }, { type: "number", min: 0, message: "Giá phải là số không âm" }]}
          >
            <Input type="number" placeholder="Nhập giá dịch vụ" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea placeholder="Nhập mô tả dịch vụ" rows={3} />
          </Form.Item>

          <Form.Item
            name="steps"
            label="Các bước thực hiện"
            rules={[{ required: true, message: "Vui lòng nhập các bước" }]}
          >
            <Input.TextArea placeholder="Nhập các bước thực hiện" rows={3} />
          </Form.Item>

          <Form.Item
            name="durationMinutes"
            label="Thời gian (phút)"
            rules={[{ required: true, message: "Vui lòng nhập thời gian" }, { type: "number", min: 1, message: "Thời gian phải là số dương" }]}
          >
            <Input type="number" placeholder="Nhập thời gian (phút)" />
          </Form.Item>

          <Form.Item
            name="suggestedFor"
            label="Phù hợp với"
            rules={[{ required: true, message: "Vui lòng nhập thông tin phù hợp" }]}
          >
            <Select mode="tags"  style={{ width: "100%" }} placeholder="Nhập hoặc chọn đối tượng phù hợp" options={[{ value: "tóc ngắn" }, { value: "tóc mỏng" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ManagingService;