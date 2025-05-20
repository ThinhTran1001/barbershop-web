/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories, getBrands } from '../services/api';

const { Option } = Select;

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to fetch categories');
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await getBrands();
      setBrands(response.data);
    } catch (error) {
      message.error('Failed to fetch brands');
    }
  };

  const handleAddOrUpdateProduct = async (values) => {
    try {
      // Chuyển categoryIds thành mảng ObjectId (nếu cần xử lý ở backend)
      const payload = {
        ...values,
        categoryId: values.categoryId ? values.categoryId.split(',').map(id => id.trim()) : [],
        details: {
          brandId: values.details?.brandId || null,
          volume: values.details?.volume || '',
          ingredients: values.details?.ingredients || '',
          usage: values.details?.usage || '',
          benefits: values.details?.benefits || []
        }
      };
      if (editingProduct) {
        await updateProduct(editingProduct._id, payload);
        message.success('Product updated successfully');
      } else {
        await createProduct(payload);
        message.success('Product created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      message.error('Failed to save product');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await deleteProduct(id);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const showModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      form.setFieldsValue({
        ...product,
        categoryId: product.categoryId ? product.categoryId.join(',') : '',
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

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    { title: 'Stock', dataIndex: 'stock', key: 'stock' },
    { title: 'Rating', dataIndex: 'rating', key: 'rating' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button onClick={() => showModal(record)} className="me-2">Edit</Button>
          <Button onClick={() => handleDeleteProduct(record._id)} danger>Delete</Button>
        </>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3">
        <Button type="primary" onClick={() => showModal()}>Add Product</Button>
      </div>
      <Table dataSource={products} columns={columns} rowKey="_id" />
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateProduct} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="image" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name={['details', 'brandId']} label="Brand">
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
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
            <InputNumber type='number' min={1}/>
          </Form.Item>
          <Form.Item name="categoryId" label="Category IDs" rules={[{ required: true }]}>
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
    </div>
  );
};

export default ProductManagement;