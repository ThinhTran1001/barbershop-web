import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Space,
  Popconfirm,
  Input,
  Select,
  App,
} from "antd";
import {
  getAllServices,
  createService,
  updateService,
  removeService,
} from "../../services/api";
import ServiceForm from "../../components/ServiceForm";
import "./ManagingService.css";

const { Option } = Select;

const ManagingService = () => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const { notification } = App.useApp();

  const [searchText, setSearchText] = useState("");
  const [filterSuggested, setFilterSuggested] = useState([]);
  const [priceFilter, setPriceFilter] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await getAllServices();
      setServices(res.data);
    } catch {
      notification.error({
        message: "Error",
        description: "Failed to load services",
        placement: "topRight",
      });
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
      notification.success({
        message: "Success",
        description: "Service deleted successfully",
        placement: "topRight",
      });
      fetchServices();
    } catch {
      notification.error({
        message: "Error",
        description: "Failed to delete service",
        placement: "topRight",
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const isDuplicate = services.some(
        (service) =>
          service.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
          (!editingService || service._id !== editingService._id)
      );

      if (isDuplicate) {
        notification.error({
          message: "Error",
          description: "Service name already exists, please choose another name.",
          placement: "topRight",
        });
        return;
      }

      if (editingService) {
        await updateService(editingService._id, values);
        notification.success({
          message: "Success",
          description: "Service updated successfully",
          placement: "topRight",
        });
      } else {
        await createService(values);
        notification.success({
          message: "Success",
          description: "Service added successfully",
          placement: "topRight",
        });
      }
      fetchServices();
      handleCancel();
    } catch {
      notification.error({
        message: "Error",
        description: "Failed to save service",
        placement: "topRight",
      });
    }
  };

  const filteredServices = services
    .filter((item) =>
      item.name.toLowerCase().includes(searchText.toLowerCase())
    )
    .filter((item) =>
      filterSuggested.length === 0 ||
      (item.suggestedFor || []).some((v) => filterSuggested.includes(v))
    )
    .filter((item) => {
      if (priceFilter === "low") return item.price < 100000;
      if (priceFilter === "medium")
        return item.price >= 100000 && item.price <= 300000;
      if (priceFilter === "high") return item.price > 300000;
      return true;
    });

  const columns = [
    { title: "Service Name", dataIndex: "name", key: "name" },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (text) => `${text} VND`,
    },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Steps", dataIndex: "steps", key: "steps" },
    {
      title: "Duration (minutes)",
      dataIndex: "durationMinutes",
      key: "durationMinutes",
    },
    {
      title: "Suggested For",
      dataIndex: "suggestedFor",
      key: "suggestedFor",
      render: (arr) => arr?.join(", "),
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => showModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this service?"
            onConfirm={() => handleDelete(record._id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button type="link" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const allSuggestedFor = [...new Set(services.flatMap((s) => s.suggestedFor || []))];

  return (
    <div className="managing-service-container">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", flex: 1 }}>
          <Input
            placeholder="Search by name"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200, minWidth: 150 }}
          />
          <Select
            mode="multiple"
            placeholder="Filter by target audience"
            value={filterSuggested}
            onChange={setFilterSuggested}
            style={{ minWidth: 200 }}
            allowClear
          >
            {allSuggestedFor.map((tag) => (
              <Option key={tag} value={tag}>
                {tag}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by price"
            value={priceFilter}
            onChange={setPriceFilter}
            style={{ width: 180 }}
            allowClear
          >
            <Option value="low">Under 100,000 VND</Option>
            <Option value="medium">100,000 – 300,000 VND</Option>
            <Option value="high">Over 300,000 VND</Option>
          </Select>
        </div>

        <Button type="primary" onClick={() => showModal()}>
          Add Service
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={filteredServices}
        columns={columns}
        pagination={{ pageSize: 5 }}
      />

      <Modal
        title={editingService ? "Edit Service" : "Add Service"}
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleSave}
        okText="Save"
        cancelText="Cancel"
      >
        <Form form={form} layout="vertical">
          <ServiceForm form={form} editing={editingService} />
        </Form>
      </Modal>
    </div>
  );
};

export default ManagingService;
