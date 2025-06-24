// src/components/BrandManagement.jsx

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Table,
  Button,
  Modal as AntModal,
  Form,
  Input,
  Select,
  Switch
} from 'antd';
import {
  DeleteFilled,
  InfoCircleFilled,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getProducts
} from '../services/api';

const { Option } = Select;

const BrandManagement = () => {
  // data & filters
  const [allBrands, setAllBrands] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState(undefined);
  const [sortName, setSortName] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // form modal
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form] = Form.useForm();

  // delete confirm modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // toast
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  // load
  useEffect(() => {
    loadBrands();
  }, [sortName]);

  const loadBrands = async () => {
    try {
      const res = await getBrands();
      let list = res.data;
      if (sortName) {
        list.sort((a, b) =>
          sortName === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
      }
      setAllBrands(list);
      applyFilters(list);
    } catch {
      showToast('danger', 'Failed to fetch brands');
    }
  };

  const applyFilters = list => {
    let filtered = [...list];
    if (isActiveFilter !== undefined) {
      filtered = filtered.filter(b => b.isActive === isActiveFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setBrands(filtered);
  };

  useEffect(() => {
    applyFilters(allBrands);
  }, [searchTerm, isActiveFilter, allBrands]);

  // save
  const handleSave = async values => {
    try {
      const payload = {
        ...values,
        isActive: values.isActive !== undefined ? values.isActive : true
      };
      if (editingBrand) {
        await updateBrand(editingBrand._id, payload);
        showToast('success', 'Brand updated');
      } else {
        await createBrand(payload);
        showToast('success', 'Brand created');
      }
      setIsFormModalVisible(false);
      form.resetFields();
      setEditingBrand(null);
      loadBrands();
    } catch {
      showToast('danger', 'Save failed');
    }
  };

  // ask delete
  const askDelete = id => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  // confirm delete
  const handleDeleteConfirm = async () => {
    try {
      const prodRes = await getProducts();
      const hasActive = prodRes.data.some(
        p => p.details?.brandId === deleteTargetId && p.stock > 0 && p.isActive
      );
      if (hasActive) {
        showToast('danger', 'Cannot deactivate: active products exist');
      } else {
        await deleteBrand(deleteTargetId);
        showToast('success', 'Brand deactivated');
        loadBrands();
      }
    } catch {
      showToast('danger', 'Deactivation failed');
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  // open form
  const openForm = brand => {
    if (brand) {
      setEditingBrand(brand);
      form.setFieldsValue(brand);
    } else {
      setEditingBrand(null);
      form.resetFields();
      form.setFieldsValue({ isActive: true });
    }
    setIsFormModalVisible(true);
  };

  // table columns
  const columns = [
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
      key: 'name'
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'active',
      render: v => <span style={{ color: v ? 'green' : 'red' }}>{v ? 'Active' : 'Inactive'}</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, rec) => (
        <>
          <Button className="me-2" onClick={() => openForm(rec)}>
            <InfoCircleFilled />
          </Button>
          <Button danger onClick={() => askDelete(rec._id)}>
            <DeleteFilled />
          </Button>
        </>
      )
    }
  ];

  return (
    <div className="container mt-4">
      {/* Toast */}
      <div style={{ position: 'fixed', top: '4rem', right: '1rem', zIndex: 1060 }}>
        {toast.show && (
          <div className={`toast text-bg-${toast.variant} show`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                onClick={() => setToast(t => ({ ...t, show: false }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filters & Add */}
      <div className="mb-3">
        <Input
          placeholder="Search by name"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: 200, marginRight: 10 }}
        />
        <Select
          placeholder="Filter active"
          value={isActiveFilter}
          onChange={setIsActiveFilter}
          allowClear
          style={{ width: 150, marginRight: 10 }}
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Inactive</Option>
        </Select>
        <Button type="primary" onClick={() => openForm(null)}>
          Add Brand
        </Button>
      </div>

      {/* Table */}
      <Table
        dataSource={brands}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize,
          total: allBrands.length,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          pageSizeOptions: ['5','10','20','50','100']
        }}
      />

      {/* Form Modal */}
      <AntModal
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
        open={isFormModalVisible}
        onCancel={() => setIsFormModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please input the brand name!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </AntModal>

      {/* Delete Confirm Modal */}
      <div
        className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`}
        tabIndex="-1"
        style={showDeleteModal ? { backgroundColor: 'rgba(0,0,0,0.5)' } : {}}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Deactivate</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDeleteModal(false)}
              />
            </div>
            <div className="modal-body">
              Are you sure you want to deactivate this brand?
            </div>
            <div className="modal-footer">
              <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button danger onClick={handleDeleteConfirm}>
                Deactivate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandManagement;
