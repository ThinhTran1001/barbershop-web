import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Modal as AntModal } from 'antd';
import { DeleteFilled, EyeOutlined, InfoCircleFilled } from '@ant-design/icons';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getBrands } from '../services/api';

const { Option } = Select;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [form] = Form.useForm();
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    fetchInitialData();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await getProducts();
      setAllProducts(response.data);
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products: ' + error.message);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      console.log('Fetched categories:', response.data);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error.response?.data || error.message);
      message.error('Failed to fetch categories: ' + error.message);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await getBrands();
      console.log('Fetched brands:', response.data);
      setBrands(response.data);
    } catch (error) {
      console.error('Error fetching brands:', error.response?.data || error.message);
      message.error('Failed to fetch brands: ' + error.message);
    }
  };

  const filterProducts = () => {
    let filtered = [...allProducts];

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedBrand) {
      filtered = filtered.filter(product =>
        product.details?.brandId === selectedBrand
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.categoryId?.includes(selectedCategory)
      );
    }
    if (minPrice !== null || maxPrice !== null) {
      filtered = filtered.filter(product => {
        const price = product.price || 0;
        const min = minPrice !== null ? minPrice : -Infinity;
        const max = maxPrice !== null ? maxPrice : Infinity;
        return price >= min && price <= max;
      });
    }

    setProducts(filtered);
  };

  useEffect(() => {
    filterProducts();
  }, [searchTerm, selectedBrand, selectedCategory, minPrice, maxPrice]);

  const handleAddOrUpdateProduct = async (values) => {
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || [],
        details: {
          brandId: values.details?.brandId || null,
          volume: values.details?.volume || '',
          ingredients: values.details?.ingredients || '',
          usage: values.details?.usage || '',
          benefits: values.details?.benefits ? values.details.benefits.split(',').map(item => item.trim()) : []
        }
      };
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        message.success('Product updated successfully');
      } else {
        console.log('Creating product with data:', payload);
        await createProduct(payload);
        message.success('Product created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
      fetchInitialData();
    } catch (error) {
      console.error('Error in handleAddOrUpdateProduct:', error.response?.data || error.message);
      message.error('Failed to save product: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    console.log('handleDeleteProduct called with ID:', id); // Debug ngay đầu hàm
    AntModal.confirm({
      title: 'Are you sure you want to delete this product?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          console.log('Attempting to delete product with ID:', id); // Debug
          const response = await deleteProduct(id);
          console.log('Delete response:', response); // Debug
          message.success('Product deleted successfully');
          fetchInitialData();
        } catch (error) {
          console.error('Error deleting product:', error.response?.data || error.message);
          message.error('Failed to delete product: ' + (error.response?.data?.message || error.message));
        }
      },
      onCancel: () => {
        console.log('Delete action canceled'); // Debug
      },
    });
  };

  const showModal = (product = null) => {
    fetchBrands();
    fetchCategories();
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue({
        ...product,
        categoryId: product.categoryId || [],
        details: {
          brandId: product.details?.brandId || null,
          volume: product.details?.volume || '',
          ingredients: product.details?.ingredients || '',
          usage: product.details?.usage || '',
          benefits: product.details?.benefits ? product.details.benefits.join(',') : ''
        }
      });
    } else {
      setEditingProduct(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const showViewModal = (product) => {
    setViewingProduct(product);
    setIsViewModalVisible(true);
  };

  const columns = [
    {
      title: 'ID',
      key: 'index',
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
    },
    {
      title: 'Brand',
      key: 'brand',
      render: (record) => {
        const brand = brands.find(b => b._id === record.details?.brandId);
        return brand ? brand.name : 'N/A';
      },
    },
    {
      title: 'Category',
      key: 'category',
      render: (record) => {
        const categoryNames = record.categoryId
          .map(catId => categories.find(c => c._id === catId)?.name)
          .filter(name => name)
          .join(', ');
        return categoryNames || 'N/A';
      },
    },
    { title: 'Rating', dataIndex: 'rating', key: 'rating' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button className="me-2" onClick={() => showViewModal(record)}><EyeOutlined/></Button>
          <Button onClick={() => showModal(record)} className="me-2"><InfoCircleFilled /></Button>
          <Button onClick={() => handleDeleteProduct(record._id)} danger><DeleteFilled /></Button>
        </>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3">
        <Input
          placeholder="Search by name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: 200, marginRight: 10 }}
        />
        <Select
          placeholder="Filter by brand"
          value={selectedBrand}
          onChange={setSelectedBrand}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {brands.map(brand => (
            <Option key={brand._id} value={brand._id}>{brand.name}</Option>
          ))}
        </Select>
        <Select
          placeholder="Filter by category"
          value={selectedCategory}
          onChange={setSelectedCategory}
          allowClear
          style={{ width: 200, marginRight: 10 }}
        >
          {categories.map(category => (
            <Option key={category._id} value={category._id}>{category.name}</Option>
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
        <Button type="primary" onClick={() => showModal()}>Add Product</Button>
      </div>
      <Table
        dataSource={products}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: allProducts.length,
          onChange: (page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          },
          showSizeChanger: true,
        }}
      />
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateProduct} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the product name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true, message: 'Please input the price!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="image" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name={['details', 'brandId']} label="Brand" rules={[{ required: true, message: 'Please input the brand!' }]}>
            <Select placeholder="Select a brand" allowClear>
              {brands.map(brand => (
                <Option key={brand._id} value={brand._id}>{brand.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name={['details', 'volume']} label="Volume">
            <Input />
          </Form.Item>
          <Form.Item name={['details', 'ingredients']} label="Ingredients">
            <Input />
          </Form.Item>
          <Form.Item name={['details', 'usage']} label="Usage">
            <Input />
          </Form.Item>
          <Form.Item name={['details', 'benefits']} label="Benefits">
            <Input />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true, message: 'Please input the stock!' }]}>
            <InputNumber min={0} />
          </Form.Item>
          <Form.Item name="categoryId" label="Category" rules={[{ required: true, message: 'Please select at least one category!' }]}>
            <Select mode="multiple" placeholder="Select categories" allowClear>
              {categories.map(category => (
                <Option key={category._id} value={category._id}>{category.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Product Details"
        visible={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={null}
        width={800}
      >
        {viewingProduct && (
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: '1', maxWidth: '300px' }}>
              {viewingProduct.image ? (
                <img
                  src={viewingProduct.image}
                  alt={viewingProduct.name}
                  style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '8px' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '200px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f0f0f0',
                    borderRadius: '8px',
                  }}
                >
                  No Image Available
                </div>
              )}
            </div>
            <div style={{ flex: '2' }}>
              <p><strong>Name:</strong> {viewingProduct.name}</p>
              <p><strong>Price:</strong> ${viewingProduct.price?.toFixed(2)}</p>
              <p>
                <strong>Brand:</strong>{' '}
                {brands.find(b => b._id === viewingProduct.details?.brandId)?.name || 'N/A'}
              </p>
              <p>
                <strong>Categories:</strong>{' '}
                {viewingProduct.categoryId
                  ?.map(catId => categories.find(c => c._id === catId)?.name)
                  .filter(name => name)
                  .join(', ') || 'N/A'}
              </p>
              <p><strong>Rating:</strong> {viewingProduct.rating || 'N/A'}</p>
              <p><strong>Stock:</strong> {viewingProduct.stock || 'N/A'}</p>
              <p><strong>Volume:</strong> {viewingProduct.details?.volume || 'N/A'}</p>
              <p><strong>Ingredients:</strong> {viewingProduct.details?.ingredients || 'N/A'}</p>
              <p><strong>Usage:</strong> {viewingProduct.details?.usage || 'N/A'}</p>
              <p>
                <strong>Benefits:</strong>{' '}
                {viewingProduct.details?.benefits?.join(', ') || 'N/A'}
              </p>
              <p><strong>Description:</strong> {viewingProduct.description || 'N/A'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductManagement;