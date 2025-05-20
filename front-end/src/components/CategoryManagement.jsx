/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to fetch categories');
    }
  };

  const handleAddOrUpdateCategory = async (values) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, values);
        message.success('Category updated successfully');
      } else {
        await createCategory(values);
        message.success('Category created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      message.error('Failed to save category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteCategory(id);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Failed to delete category');
    }
  };

  const showModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      form.setFieldsValue(category);
    } else {
      setEditingCategory(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button onClick={() => showModal(record)} className="me-2"><EditOutlined /></Button>
          <Button onClick={() => handleDeleteCategory(record._id)} danger><DeleteOutlined /></Button>
        </>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3">
        <Button type="primary" onClick={() => showModal()}>Add Category</Button>
      </div>
      <Table dataSource={categories} columns={columns} rowKey="_id" />
      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateCategory} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryManagement;