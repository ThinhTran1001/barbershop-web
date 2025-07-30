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
      let servicesArray = [];

      if (res.data && res.data.services) {
        servicesArray = res.data.services;
      } else if (Array.isArray(res.data)) {
        servicesArray = res.data;
      }

      const normalizedServices = servicesArray.map((s) => {
        let imgs = [];
        if (Array.isArray(s.images)) imgs = imgs.concat(s.images);
        if (Array.isArray(s.imageUrls)) imgs = imgs.concat(s.imageUrls);
        if (typeof s.imageUrl === "string") imgs.push(s.imageUrl);
        imgs = imgs.filter((url) => url && url.trim().length > 0);
        imgs = Array.from(new Set(imgs));
        return { ...s, images: imgs };
      });

      setServices(normalizedServices);
    } catch (error) {
      setSuccessMessage("Tải dịch vụ thất bại!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setServices([]);
    }
  };

  const showModal = (record = null) => {
    setEditingService(record);

    if (record && Array.isArray(record.images)) {
      const validImages = record.images.filter(
        (url) =>
          typeof url === "string" &&
          url.trim() &&
          !url.startsWith("blob:") &&
          !url.includes("undefined") &&
          !url.match(/\/$/) &&
          !url.match(/^data:/) &&
          !url.endsWith(".svg")
      );

      const formData = {
        ...record,
        suggestedFor: Array.isArray(record.suggestedFor)
          ? record.suggestedFor.join(", ")
          : record.suggestedFor,
        images: validImages.map((url, idx) => ({
          uid: String(-1 - idx),
          url,
          status: "done",
        })),
      };

      form.setFieldsValue(formData);
    } else {
      form.setFieldsValue(record || {});
    }

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
      setSuccessMessage("Dịch vụ này đã bị vô hiệu hóa!");
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
      setSuccessMessage("Dịch vụ đã được vô hiệu hóa thành công!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      fetchServices();
    } catch {
      setShowDeleteConfirmModal(false);
      setSuccessMessage("Vô hiệu hóa dịch vụ thất bại!");
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
        setSuccessMessage("Tên dịch vụ đã tồn tại!");
        setShowSuccessToast(true);
        setTimeout(() => setShowSuccessToast(false), 3000);
        return;
      }
      setModalAction(editingService ? "edit" : "add");
      setShowConfirmModal(true);
    } catch {
      setSuccessMessage("Vui lòng điền đầy đủ các trường bắt buộc!");
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
    }
  };

  const confirmSave = async () => {
    try {
      const values = await form.validateFields();
      let images = [];
      if (values.images && Array.isArray(values.images)) {
        images = values.images
          .map((img) => img.response?.url || img.url)
          .filter(Boolean);
      }
      const serviceData = { ...values, images };
      delete serviceData.image;
      delete serviceData.images;
      serviceData.images = images;

      if (editingService) {
        await updateService(editingService._id, serviceData);
      } else {
        await createService(serviceData);
      }

      setSuccessMessage(
        editingService ? "Sửa dịch vụ thành công!" : "Thêm dịch vụ thành công!"
      );
      setShowConfirmModal(false);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      fetchServices();
      handleCancel();
    } catch (error) {
      setShowConfirmModal(false);
      setSuccessMessage("Lưu dịch vụ thất bại!");
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
    {
      title: "Hình Ảnh",
      dataIndex: "images",
      key: "images",
      width: 80,
      render: (images, record) => {
        const validImages = (images || []).filter(url => typeof url === 'string' && url.trim());
        if (validImages.length === 0) return null;
        return (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={validImages[0]}
              alt={record.name}
              style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #d9d9d9' }}
            />
            <span style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#f5222d',
              color: '#fff',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: 12,
              fontWeight: 600,
              border: '2px solid #fff'
            }}>
              {validImages.length}
            </span>
          </div>
        );
      }
    },
    { title: "Tên Dịch Vụ", dataIndex: "name", key: "name" },
    { title: "Giá", dataIndex: "price", key: "price", render: (text) => `${text} VND` },
    { title: "Mô Tả", dataIndex: "description", key: "description" },
    {
      title: "Các Bước",
      dataIndex: "steps",
      key: "steps",
      render: (steps) => Array.isArray(steps) ? steps.join(", ") : steps || "N/A",
    },
    { title: "Thời Gian (phút)", dataIndex: "durationMinutes", key: "durationMinutes" },
    {
      title: "Phù Hợp Với",
      dataIndex: "suggestedFor",
      key: "suggestedFor",
      render: (arr) => arr?.join(", "),
    },
    {
      title: "Trạng Thái",
      dataIndex: "isActive",
      key: "status",
      render: (isActive) => (
        <Tag color={isActive ? "green" : "red"}>{isActive ? "Hoạt động" : "Không hoạt động"}</Tag>
      ),
    },
    {
      title: "Hành Động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showViewModal(record)}
            />
          </Tooltip>
          <Tooltip title="Sửa">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              disabled={!record.isActive}
            />
          </Tooltip>
          <Tooltip title="Xóa (Vô hiệu hóa)">
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
      <div style={{ marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", flex: 1 }}>
          <Input
            placeholder="Tìm kiếm theo tên"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200, minWidth: 150 }}
          />
          <Select
            mode="multiple"
            placeholder="Lọc theo đối tượng"
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
            placeholder="Lọc theo giá"
            value={priceFilter}
            onChange={setPriceFilter}
            style={{ width: 180 }}
            allowClear
          >
            <Option value="low">Dưới 100,000 VND</Option>
            <Option value="medium">100,000 – 300,000 VND</Option>
            <Option value="high">Trên 300,000 VND</Option>
          </Select>
          <Select
            placeholder="Lọc theo trạng thái"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="active">Hoạt động</Option>
            <Option value="inactive">Không hoạt động</Option>
          </Select>
        </div>
        <Button type="primary" onClick={() => showModal()}>Thêm Dịch Vụ</Button>
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
          pageSizeOptions: ["5", "10", "20", "50", "100"],
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
      />

      <div className={`modal fade ${isModalVisible ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: isModalVisible ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{editingService ? "Sửa Dịch Vụ" : "Thêm Dịch Vụ"}</h5>
              <button type="button" className="btn-close" onClick={handleCancel}></button>
            </div>
            <div className="modal-body">
              <Form form={form} layout="vertical">
                <ServiceForm />
              </Form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={handleSave}>Lưu</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${isViewModalVisible ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: isViewModalVisible ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xem Chi Tiết Dịch Vụ</h5>
              <button type="button" className="btn-close" onClick={handleViewCancel}></button>
            </div>
            <div className="modal-body">
              {viewingService && (
                <div>
                  {(viewingService.images && viewingService.images.length > 0) && (
                    <div style={{ marginBottom: 16, textAlign: 'center', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                      {viewingService.images
                        .filter(url => typeof url === 'string' && url.trim() && !url.startsWith('blob:') && !url.includes('undefined'))
                        .map((url, idx) => (
                          <img
                            key={idx}
                            src={url}
                            alt={viewingService.name}
                            style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #d9d9d9' }}
                          />
                        ))}
                    </div>
                  )}
                  <p><strong>Tên Dịch Vụ:</strong> {viewingService.name}</p>
                  <p><strong>Giá:</strong> {viewingService.price} VND</p>
                  <p><strong>Mô Tả:</strong> {viewingService.description}</p>
                  <p><strong>Các Bước:</strong> {(viewingService.steps || []).join(", ")}</p>
                  <p><strong>Thời Gian (phút):</strong> {viewingService.durationMinutes}</p>
                  <p><strong>Phù Hợp Với:</strong> {(viewingService.suggestedFor || []).join(", ")}</p>
                  <p><strong>Trạng Thái:</strong> {viewingService.isActive ? "Hoạt động" : "Không hoạt động"}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleViewCancel}>Đóng</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${showConfirmModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showConfirmModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xác Nhận {modalAction === "edit" ? "Sửa" : "Thêm"} Dịch Vụ</h5>
              <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn {modalAction === "edit" ? "sửa" : "thêm"} dịch vụ này?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmModal(false)}>Hủy</button>
              <button type="button" className="btn btn-primary" onClick={confirmSave}>Xác Nhận</button>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal fade ${showDeleteConfirmModal ? "show d-block" : ""}`} tabIndex="-1" style={{ backgroundColor: showDeleteConfirmModal ? "rgba(0,0,0,0.5)" : "transparent" }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xác Nhận Vô Hiệu Hóa</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteConfirmModal(false)}></button>
            </div>
            <div className="modal-body">
              <p>Bạn có chắc muốn vô hiệu hóa dịch vụ này?</p>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteConfirmModal(false)}>Hủy</button>
              <button type="button" className="btn btn-danger" onClick={confirmDelete}>Vô Hiệu Hóa</button>
            </div>
          </div>
        </div>
      </div>

      <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        <div className={`toast ${showSuccessToast ? "show" : ""}`} role="alert" aria-live="assertive" aria-atomic="true">
          <div className="toast-header">
            <strong className="me-auto">Thông Báo</strong>
            <button type="button" className="btn-close" onClick={() => setShowSuccessToast(false)}></button>
          </div>
          <div className="toast-body">{successMessage}</div>
        </div>
      </div>
    </div>
  );
};

export default ManagingService;