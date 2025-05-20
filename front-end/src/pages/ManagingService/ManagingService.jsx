import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Space, Popconfirm, message } from "antd";
import {
  getAllServices,
  createService,
  updateService,
  removeService,
} from "../../services/api";
import ServiceForm from "../../components/ServiceForm";
import "./ManagingService.css";

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
      const res = await getAllServices();
      setServices(res.data);
    } catch {
      message.error("Lỗi khi tải dịch vụ");
    }
  };

  const showModal = (record = null) => {
    setEditingService(record);
    form.setFieldsValue(record || {});
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingService(null);
    form.resetFields();
  };

  const handleDelete = async (id) => {
    try {
      await removeService(id);
      message.success("Xóa dịch vụ thành công");
      fetchServices();
    } catch {
      message.error("Lỗi khi xóa dịch vụ");
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        await updateService(editingService._id, values);
        message.success("Cập nhật dịch vụ thành công");
      } else {
        await createService(values);
        message.success("Thêm dịch vụ thành công");
      }
      fetchServices();
      handleCancel();
    } catch {
      message.error("Lỗi khi lưu dịch vụ");
    }
  };

  const columns = [
    { title: "Tên dịch vụ", dataIndex: "name", key: "name" },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      render: (text) => `${text} VND`,
    },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    { title: "Các bước", dataIndex: "steps", key: "steps" },
    {
      title: "Thời gian (phút)",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
    },
    {
      title: "Phù hợp với",
      dataIndex: "suggestedFor",
      key: "suggestedFor",
      render: (arr) => arr?.join(", "),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showModal(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc muốn xóa dịch vụ này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button type="link" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="managing-service-container">
      <div className="header">
        <h2>Quản lý dịch vụ</h2>
        <Button type="primary" onClick={() => showModal()}>
          Thêm dịch vụ
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={services}
        columns={columns}
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSave}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <ServiceForm form={form} editing={editingService} />
        </Form>
      </Modal>
    </div>
  );
};

export default ManagingService;
