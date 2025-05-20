/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, message } from 'antd';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await getProducts();
      setProducts(response.data);
    } catch (error) {
      message.error('Failed to fetch products');
    }
  };

  const handleAddOrUpdateProduct = async (values) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct._id, values);
        message.success('Product updated successfully');
      } else {
        await createProduct(values);
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
      form.setFieldsValue(product);
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
    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
    { title: 'Category', dataIndex: 'Category', key: 'category' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button onClick={() => showModal(record._id)} className="me-2"><EyeFilled /></Button>
          <Button onClick={() => showModal(record)} className="me-2"><EditOutlined /></Button>
          <Button onClick={() => handleDeleteProduct(record._id)} danger><DeleteOutlined /></Button>
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
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="price" label="Price" rules={[{ required: true }]}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="stock" label="Stock" rules={[{ required: true }]}>
            <InputNumber />
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