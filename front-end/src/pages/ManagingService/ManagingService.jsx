import React, { useState, useEffect } from "react";
import { Table, Button, Form, Space, Input, Select, Tag, Tooltip } from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { getAllServices, createService, updateService } from "../../services/api";
import ServiceForm from "../../components/ServiceForm";
import "bootstrap/dist/css/bootstrap.min.css";
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteServiceId, setDeleteServiceId] = useState(null);
  const [modalAction, setModalAction] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await getAllServices();
      // Sửa lại để lấy đúng mảng services từ response
      setServices(Array.isArray(res.data.services) ? res.data.services : []);
    } catch {
      setSuccessMessage("Failed to load services!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setServices([]); // Nếu lỗi, cũng set về array rỗng
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

  const handleDelete = (id, currentStatus) => {
    if (!currentStatus) {
      setSuccessMessage("This service is already inactive!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      return;
    }
    setDeleteServiceId(id);
    setShowDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      await updateService(deleteServiceId, { isActive: false });
      setShowDeleteConfirmModal(false);
      setSuccessMessage("Service deactivated successfully!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      fetchServices();
    } catch {
      setShowDeleteConfirmModal(false);
      setSuccessMessage("Failed to deactivate service!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
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
        setSuccessMessage("Service name already exists!");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        return;
      }
      setModalAction(editingService ? "edit" : "add");
      setShowConfirmModal(true);
    } catch {
      setSuccessMessage("Please complete all required fields!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const confirmSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingService) {
        await updateService(editingService._id, values);
        setSuccessMessage("Service edited successfully!");
      } else {
        await createService(values);
        setSuccessMessage("Service added successfully!");
      }
      setShowConfirmModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      fetchServices();
      handleCancel();
    } catch {
      setShowConfirmModal(false);
      setSuccessMessage("Failed to save service!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const filteredServices = Array.isArray(services)
    ? services
        .filter((item) => item.name.toLowerCase().includes(searchText.toLowerCase()))
        .filter(
          (item) =>
            filterSuggested.length === 0 ||
            (item.suggestedFor || []).some((v) => filterSuggested.includes(v))
        )
        .filter((item) => {
          if (priceFilter === "low") return item.price < 100000;
          if (priceFilter === "medium") return item.price >= 100000 && item.price <= 300000;
          if (priceFilter === "high") return item.price > 300000;
          return true;
        })
        .filter((item) => {
          if (statusFilter === "active") return item.isActive === true;
          if (statusFilter === "inactive") return item.isActive === false;
          return true;
        })
    : [];

  const columns = [
    { title: "Service Name", dataIndex: "name", key: "name" },
    { title: "Price", dataIndex: "price", key: "price", render: (text) => `${text} VND` },
    { title: "Description", dataIndex: "description", key: "description" },
    {
      title: "Steps",
      dataIndex: "steps",
      key: "steps",
      render: (steps) => Array.isArray(steps) ? steps.join(", ") : steps || "N/A",
    },
    { title: "Duration (minutes)", dataIndex: "durationMinutes", key: "durationMinutes" },
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
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>
      ),
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
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record._id, record.isActive)}
              disabled={!record.isActive}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const allSuggestedFor = [...new Set(services.flatMap((s) => s.suggestedFor || []))];

  return (
    <div className="managing-service-container">
      {/* Search & Filter */}
      <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
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
              <Option key={tag} value={tag}>{tag}</Option>
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
        <Button type="primary" onClick={() => showModal()}>Add Service</Button>
      </div>

      {/* Table */}
      <Table
        rowKey="_id"
        dataSource={filteredServices}
        columns={columns}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: filteredServices.length,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
      />

      {/* Modal Form */}
      <div className={`modal fade ${isModalVisible ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: isModalVisible ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingService ? "Edit Service" : "Add Service"}</h5>
              <button type="button" className="btn-close" onClick={handleCancel}></button>
            </div>
            <div className="modal-body">
              <Form form={form} layout="vertical">
                <ServiceForm />
              </Form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <div className={`modal fade ${isViewModalVisible ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: isViewModalVisible ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">View Service Details</h5>
              <button type="button" className="btn-close" onClick={handleViewCancel}></button>
            </div>
            <div className="modal-body">
              {viewingService && (
                <div>
                  <p><strong>Service Name:</strong> {viewingService.name}</p>
                  <p><strong>Price:</strong> {viewingService.price} VND</p>
                  <p><strong>Description:</strong> {viewingService.description}</p>
                  <p><strong>Steps:</strong> {(viewingService.steps || []).join(", ")}</p>
                  <p><strong>Duration (minutes):</strong> {viewingService.durationMinutes}</p>
                  <p><strong>Suggested For:</strong> {(viewingService.suggestedFor || []).join(", ")}</p>
                  <p><strong>Status:</strong> {viewingService.isActive ? "Active" : "Inactive"}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleViewCancel}>Close</button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <div className={`modal fade ${showConfirmModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showConfirmModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm {modalAction === "edit" ? "Edit" : "Add"} Service</h5>
              <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to {modalAction === "edit" ? "edit" : "add"} this service?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={confirmSave}>Confirm</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className={`modal fade ${showDeleteConfirmModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showDeleteConfirmModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Deactivation</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteConfirmModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to deactivate this service?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirmModal(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Deactivate</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <div className={`toast ${showSuccessToast ? "show" : ""}`} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header">
            <strong className="me-auto">Notification</strong>
            <button type="button" className="btn-close" onClick={() => setShowSuccessToast(false)}></button>
          </div>
          <div className="toast-body">{successMessage}</div>
        </div>
      </div>
    </div>
  );
};

export default ManagingService;
