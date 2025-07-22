// src/components/ProductManagement.jsx

import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {
  Table,
  Button,
  Modal as AntModal,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Spin,
  Switch
} from 'antd';
import {
  DeleteFilled,
  EyeOutlined,
  InfoCircleFilled,
  SortAscendingOutlined,
  SortDescendingOutlined,
  UploadOutlined
} from '@ant-design/icons';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  uploadImage
} from '../services/api';

const { Option } = Select;

const ProductManagement = () => {
  // Data & filters
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [isActiveFilter, setIsActiveFilter] = useState(undefined);
  const [sortName, setSortName] = useState(null);
  const [sortStock, setSortStock] = useState(null);

  // Pagination & loading
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Modals & forms
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [form] = Form.useForm();

  // Toast notification
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
  const showToast = (variant, message) => {
    setToast({ show: true, message, variant });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  };

  // Initial load
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, [sortName, sortStock]);

  const loadProducts = async () => {
    try {
      const { data } = await getProducts();
      let list = data;
      if (sortName) {
        list.sort((a, b) =>
          sortName === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );
      }
      if (sortStock) {
        list.sort((a, b) =>
          sortStock === 'asc' ? a.stock - b.stock : b.stock - a.stock
        );
      }
      setAllProducts(list);
      applyFilters(list);
    } catch {
      showToast('danger', 'Failed to load products');
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await getCategories();
      setCategories(data);
    } catch {
      showToast('danger', 'Failed to load categories');
    }
  };

  const loadBrands = async () => {
    try {
      const { data } = await getBrands();
      setBrands(data);
    } catch {
      showToast('danger', 'Failed to load brands');
    }
  };

  // Filtering
  const applyFilters = list => {
    let filtered = [...list];
    if (isActiveFilter !== undefined) {
      filtered = filtered.filter(p => p.isActive === isActiveFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedBrand) {
      filtered = filtered.filter(p => p.details?.brandId === selectedBrand);
    }
    if (selectedCategory) {
      filtered = filtered.filter(p => p.categoryId?.includes(selectedCategory));
    }
    if (minPrice !== null || maxPrice !== null) {
      filtered = filtered.filter(p => {
        const price = p.price || 0;
        const min = minPrice !== null ? minPrice : -Infinity;
        const max = maxPrice !== null ? maxPrice : Infinity;
        return price >= min && price <= max;
      });
    }
    setProducts(filtered);
  };

  useEffect(() => {
    applyFilters(allProducts);
  }, [searchTerm, selectedBrand, selectedCategory, minPrice, maxPrice, isActiveFilter, allProducts]);

  // Create / Update
  const handleSave = async values => {
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || [],
        details: {
          brandId: values.details?.brandId || null,
          volume: values.details?.volume || '',
          ingredients: values.details?.ingredients || '',
          usage: values.details?.usage || '',
          benefits: values.details?.benefits
            ? values.details.benefits.split(',').map(i => i.trim())
            : []
        },
        isActive: values.isActive !== undefined ? values.isActive : true
      };
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        showToast('success', 'Product updated');
      } else {
        await createProduct(payload);
        showToast('success', 'Product created');
      }
      setIsFormModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
      loadProducts();
    } catch {
      showToast('danger', 'Save failed');
    }
  };

  // Delete flow
  const askDelete = id => {
    setDeleteTargetId(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteProduct(deleteTargetId);
      showToast('success', 'Product deactivated');
      loadProducts();
    } catch {
      showToast('danger', 'Deactivation failed');
    } finally {
      setShowDeleteModal(false);
      setDeleteTargetId(null);
    }
  };

  // Image upload
  const handleImageUpload = async ({ file, onSuccess, onError }) => {
    setUploadingImage(true);
    try {
      const res = await uploadImage(file);
      form.setFieldsValue({ image: res.data.url });
      onSuccess(null, file);
      showToast('success', 'Image uploaded');
    } catch {
      onError();
      showToast('danger', 'Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Open modals
  const openForm = product => {
    loadBrands();
    loadCategories();
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue({
        ...product,
        isActive: product.isActive,
        categoryId: product.categoryId || [],
        details: {
          brandId: product.details?.brandId || null,
          volume: product.details?.volume || '',
          ingredients: product.details?.ingredients || '',
          usage: product.details?.usage || '',
          benefits: product.details?.benefits?.join(',') || ''
        }
      });
    } else {
      setEditingProduct(null);
      form.resetFields();
      // default new form to active
      form.setFieldsValue({ isActive: true });
    }
    setIsFormModalVisible(true);
  };
  const openView = product => {
    setViewingProduct(product);
    setIsViewModalVisible(true);
  };

  // Table columns
  const columns = [
    { title: 'ID', key: 'idx', render: (_, __, i) => (currentPage - 1) * pageSize + i + 1 },
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
    { title: 'Price', dataIndex: 'price', key: 'price', render: v => `${v.toFixed(2)} VNĐ` },
    {
      title: 'Brand',
      key: 'brand',
      render: rec => brands.find(b => b._id === rec.details?.brandId)?.name || 'N/A'
    },
    {
      title: 'Category',
      key: 'category',
      render: rec =>
        (rec.categoryId || [])
          .map(id => categories.find(c => c._id === id)?.name)
          .filter(n => n)
          .join(', ') || 'N/A'
    },
    {
      title: () => (
        <span>
          Stock{' '}
          {sortStock ? (
            sortStock === 'asc' ? (
              <SortAscendingOutlined onClick={() => setSortStock('desc')} />
            ) : (
              <SortDescendingOutlined onClick={() => setSortStock('asc')} />
            )
          ) : (
            <SortAscendingOutlined onClick={() => setSortStock('asc')} />
          )}
        </span>
      ),
      dataIndex: 'stock',
      key: 'stock'
    },
    { title: 'Rating', dataIndex: 'rating', key: 'rating' },
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
          <Button className="me-2" onClick={() => openView(rec)}>
            <EyeOutlined />
          </Button>
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
      <div
        className="position-fixed"
        style={{ top: '4rem', right: '1rem', zIndex: 1060 }}
      >
        {toast.show && (
          <div className={`toast align-items-center text-bg-${toast.variant} border-0 show`}>
            <div className="d-flex">
              <div className="toast-body">{toast.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                aria-label="Close"
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
          placeholder="Filter by brand"
          value={selectedBrand}
          onChange={setSelectedBrand}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {brands.map(b => (
            <Option key={b._id} value={b._id}>{b.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by category"
          value={selectedCategory}
          onChange={setSelectedCategory}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {categories.map(c => (
            <Option key={c._id} value={c._id}>{c.name}</Option>
          ))}
        </Select>
        <InputNumber
          placeholder="Min Price"
          value={minPrice}
          onChange={setMinPrice}
          style={{ width: 100, marginRight: 10 }}
          min={0}
        />
        <InputNumber
          placeholder="Max Price"
          value={maxPrice}
          onChange={setMaxPrice}
          style={{ width: 100, marginRight: 10 }}
          min={0}
        />
        <Select
          placeholder="By active"
          value={isActiveFilter}
          onChange={setIsActiveFilter}
          allowClear
          style={{ width: 150, marginRight: 10 }}
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Inactive</Option>
        </Select>
        <Button type="primary" onClick={() => openForm(null)}>
          Add Product
        </Button>
      </div>

      {/* Products table */}
      <Table
        dataSource={products}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize,
          total: allProducts.length,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
          showSizeChanger: true,
          pageSizeOptions: ['5','10','20','50','100']
        }}
      />

      {/* Add/Edit Modal */}
      <AntModal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={isFormModalVisible}
        onCancel={() => setIsFormModalVisible(false)}
        footer={null}
        centered
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Enter product name' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: 'Enter price' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Ảnh sản phẩm">
            <Upload
              name="file"
              accept="image/*"
              customRequest={handleImageUpload}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />} disabled={uploadingImage}>
                {uploadingImage ? <Spin /> : 'Chọn & Upload ảnh'}
              </Button>
            </Upload>
            {form.getFieldValue('image') && (
              <div style={{ marginTop: 10 }}>
                <img
                  src={form.getFieldValue('image')}
                  alt="preview"
                  style={{ width: 120, borderRadius: 4 }}
                />
              </div>
            )}
            <Form.Item name="image" noStyle>
              <Input type="hidden" />
            </Form.Item>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item
            name={['details','brandId']}
            label="Brand"
            rules={[{ required: true, message: 'Select brand' }]}
          >
            <Select placeholder="Select brand" allowClear>
              {brands.map(b => (
                <Option key={b._id} value={b._id}>{b.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name={['details','volume']} label="Volume">
            <Input />
          </Form.Item>
          <Form.Item name={['details','ingredients']} label="Ingredients">
            <Input />
          </Form.Item>
          <Form.Item name={['details','usage']} label="Usage">
            <Input />
          </Form.Item>
          <Form.Item name={['details','benefits']} label="Benefits (comma-separated)">
            <Input />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Stock"
            rules={[{ required: true, message: 'Enter stock' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="categoryId"
            label="Category"
            rules={[{ required: true, message: 'Select categories' }]}
          >
            <Select mode="multiple" placeholder="Select categories" allowClear>
              {categories.map(c => (
                <Option key={c._id} value={c._id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="Active"
              unCheckedChildren="Inactive"
              disabled={!editingProduct}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Save
            </Button>
          </Form.Item>
        </Form>
      </AntModal>

      {/* View Modal */}
      <AntModal
        title="Product Details"
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={800}
        centered
      >
        {viewingProduct && (
          <div className="d-flex gap-3">
            <div style={{ flex: 1, maxWidth: 300 }}>
              {viewingProduct.image ? (
                <img
                  src={viewingProduct.image}
                  alt={viewingProduct.name}
                  className="img-fluid rounded"
                />
              ) : (
                <div
                  className="bg-light d-flex align-items-center justify-content-center rounded"
                  style={{ height: 200 }}
                >
                  No Image
                </div>
              )}
            </div>
            <div style={{ flex: 2 }}>
              <p><strong>Name:</strong> {viewingProduct.name}</p>
              <p><strong>Price:</strong> {viewingProduct.price?.toFixed(2)} VNĐ</p>
              <p><strong>Brand:</strong> {brands.find(b => b._id === viewingProduct.details?.brandId)?.name || 'N/A'}</p>
              <p><strong>Categories:</strong> {(viewingProduct.categoryId || []).map(id => categories.find(c => c._id === id)?.name).filter(n => n).join(', ') || 'N/A'}</p>
              <p><strong>Rating:</strong> {viewingProduct.rating || 'N/A'}</p>
              <p><strong>Stock:</strong> {viewingProduct.stock || 'N/A'}</p>
              <p><strong>Volume:</strong> {viewingProduct.details?.volume || 'N/A'}</p>
              <p><strong>Ingredients:</strong> {viewingProduct.details?.ingredients || 'N/A'}</p>
              <p><strong>Usage:</strong> {viewingProduct.details?.usage || 'N/A'}</p>
              <p><strong>Benefits:</strong> {(viewingProduct.details?.benefits || []).join(', ') || 'N/A'}</p>
              <p><strong>Description:</strong> {viewingProduct.description || 'N/A'}</p>
            </div>
          </div>
        )}
      </AntModal>

      {/* Delete Confirmation Modal */}
      <div
        className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`}
        tabIndex="-1"
        style={showDeleteModal ? { backgroundColor: 'rgba(0,0,0,0.5)' } : {}}
        role="dialog"
      >
        <div className="modal-dialog modal-dialog-centered" role="document">
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
              Are you sure you want to deactivate this product?
            </div>
            <div className="modal-footer">
              <Button onClick={() => setShowDeleteModal(false)}>Cancel</Button>
              <Button danger onClick={handleDeleteConfirm}>Deactivate</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
