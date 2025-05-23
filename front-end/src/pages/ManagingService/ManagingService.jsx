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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchServices = async () => {
    try {
      const res = await getAllServices();
      setServices(res.data);
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi tải dịch vụ",
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
        message: "Thành công",
        description: "Xóa dịch vụ thành công",
        placement: "topRight",
      });
      fetchServices();
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi xóa dịch vụ",
        placement: "topRight",
      });
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
  
      // Kiểm tra trùng tên dịch vụ
      const isDuplicate = services.some(
        (service) =>
          service.name.trim().toLowerCase() === values.name.trim().toLowerCase() &&
          (!editingService || service._id !== editingService._id)
      );
  
      if (isDuplicate) {
        notification.error({
          message: "Lỗi",
          description: "Tên dịch vụ đã tồn tại, vui lòng chọn tên khác.",
          placement: "topRight",
        });
        return; // không tiếp tục lưu
      }
  
      if (editingService) {
        await updateService(editingService._id, values);
        notification.success({
          message: "Thành công",
          description: "Cập nhật dịch vụ thành công",
          placement: "topRight",
        });
      } else {
        await createService(values);
        notification.success({
          message: "Thành công",
          description: "Thêm dịch vụ thành công",
          placement: "topRight",
        });
      }
      fetchServices();
      handleCancel();
    } catch {
      notification.error({
        message: "Lỗi",
        description: "Lỗi khi lưu dịch vụ",
        placement: "topRight",
      });
    }
  };
  
  // Lọc dữ liệu
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

  // Trích danh sách gợi ý từ dịch vụ có sẵn
  const allSuggestedFor = [...new Set(services.flatMap((s) => s.suggestedFor || []))];

  return (
    <div className="managing-service-container">
      <div className="header">
        <h2>Quản lý dịch vụ</h2>
      </div>

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
              <Option key={tag} value={tag}>
                {tag}
              </Option>
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
        </div>

        <Button type="primary" onClick={() => showModal()}>
          Thêm dịch vụ
        </Button>
      </div>

      <Table
        rowKey="_id"
        dataSource={filteredServices}
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
