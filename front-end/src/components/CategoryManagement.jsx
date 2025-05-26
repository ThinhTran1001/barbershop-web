import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Modal as AntModal } from 'antd';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { DeleteFilled, InfoCircleFilled } from '@ant-design/icons';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await getCategories();
      setAllCategories(response.data);
      setCategories(response.data);
    } catch (error) {
      message.error('Failed to fetch categories: ' + error.message);
    }
  };

  const filterCategories = () => {
    let filtered = [...allCategories];
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setCategories(filtered);
  };

  useEffect(() => {
    filterCategories();
  }, [searchTerm]);

  const handleAddOrUpdateCategory = async (values) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, values);
        message.success('Category updated successfully');
      } else {
        console.log('Creating category with data:', values);
        await createCategory(values);
        message.success('Category created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingCategory(null);
      fetchInitialData();
    } catch (error) {
      console.error('Error in handleAddOrUpdateCategory:', error.response?.data || error.message);
      message.error('Failed to save category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCategory = async (id) => {
    console.log('handleDeleteCategory called with ID:', id); // Debug ngay đầu hàm
    AntModal.confirm({
      title: 'Are you sure you want to delete this category?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          console.log('Attempting to delete category with ID:', id); // Debug
          const response = await deleteCategory(id);
          console.log('Delete response:', response); // Debug
          message.success('Category deleted successfully');
          fetchInitialData();
        } catch (error) {
          console.error('Error deleting category:', error.response?.data || error.message);
          message.error('Failed to delete category: ' + (error.response?.data?.message || error.message));
        }
      },
      onCancel: () => {
        console.log('Delete action canceled'); // Debug
      },
    });
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
          <Button onClick={() => showModal(record)} className="me-2"><InfoCircleFilled /></Button>
          <Button onClick={() => handleDeleteCategory(record._id)} danger><DeleteFilled /></Button>
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
        <Button type="primary" onClick={() => showModal()}>Add Category</Button>
      </div>
      <Table
        dataSource={categories}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: allCategories.length,
          onChange: (page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          },
          showSizeChanger: true,
        }}
      />
      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateCategory} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the category name!' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input />
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