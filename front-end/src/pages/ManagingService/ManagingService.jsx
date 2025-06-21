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
  notification,
  Tag,
  Tooltip,
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import {
  getAllServices,
  createService,
  updateService,
} from "../../services/api";
import ServiceForm from "../../components/ServiceForm";
import "./ManagingService.css";

const { Option } = Select;

const ManagingService = () => {
  const [services, setServices] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form] = Form.useForm();
  const [viewingService, setViewingService] = useState(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filterSuggested, setFilterSuggested] = useState([]);
  const [priceFilter, setPriceFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

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

  const showViewModal = (record) => {
    setViewingService(record);
    setIsViewModalVisible(true);
  };

  const handleViewCancel = () => {
    setIsViewModalVisible(false);
    setViewingService(null);
  };

  const handleDelete = async (id, currentStatus) => {
    if (!currentStatus) {
      notification.info({
        message: "Info",
        description: "This service is already inactive.",
        placement: "topRight",
      });
      return;
    }

    try {
      await updateService(id, { isActive: false });
      notification.success({
        message: "Success",
        description: "Service has been deactivated.",
        placement: "topRight",
      });
      fetchServices();
    } catch {
      notification.error({
        message: "Error",
        description: "Failed to deactivate service.",
        placement: "topRight",
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();

      const isDuplicate = services.some(
        (service) =>
          service.name.trim().toLowerCase() ===
            values.name.trim().toLowerCase() &&
          (!editingService || service._id !== editingService._id)
      );

      if (isDuplicate) {
        notification.error({
          message: "Error",
          description:
            "Service name already exists, please choose another name.",
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
    .filter(
      (item) =>
        filterSuggested.length === 0 ||
        (item.suggestedFor || []).some((v) => filterSuggested.includes(v))
    )
    .filter((item) => {
      if (priceFilter === "low") return item.price < 100000;
      if (priceFilter === "medium")
        return item.price >= 100000 && item.price <= 300000;
      if (priceFilter === "high") return item.price > 300000;
      return true;
    })
    .filter((item) => {
      if (statusFilter === "active") return item.isActive === true;
      if (statusFilter === "inactive") return item.isActive === false;
      return true;
    });

  const columns = [
    {
      title: "Service Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      sorter: (a, b) => a.price - b.price,
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
      title: "Status",
      dataIndex: "isActive",
      key: "status",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
      sorter: (a, b) => a.isActive - b.isActive,
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              disabled={!record.isActive}
            />
          </Tooltip>
          <Tooltip title="Delete (Deactivate)">
            <Popconfirm
              title="Are you sure you want to deactivate this service?"
              onConfirm={() => handleDelete(record._id, record.isActive)}
              okText="Delete"
              cancelText="Cancel"
              disabled={!record.isActive}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                disabled={!record.isActive}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const allSuggestedFor = [
    ...new Set(services.flatMap((s) => s.suggestedFor || [])),
  ];

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
          <Select
            placeholder="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="active">Active</Option>
            <Option value="inactive">Inactive</Option>
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
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredServices.length,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['5', '10', '20', '50', '100'],
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
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

      <Modal
        title="View Service Details"
        open={isViewModalVisible}
        onCancel={handleViewCancel}
        footer={null}
      >
        {viewingService && (
          <div>
            <p><strong>Service Name:</strong> {viewingService.name}</p>
            <p><strong>Price:</strong> {viewingService.price} VND</p>
            <p><strong>Description:</strong> {viewingService.description}</p>
            <p><strong>Steps:</strong> {viewingService.steps}</p>
            <p><strong>Duration (minutes):</strong> {viewingService.durationMinutes}</p>
            <p><strong>Suggested For:</strong> {(viewingService.suggestedFor || []).join(", ")}</p>
            <p><strong>Status:</strong> {viewingService.isActive ? "Active" : "Inactive"}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManagingService;