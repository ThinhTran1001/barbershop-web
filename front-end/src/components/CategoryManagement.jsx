import React, { useState, useEffect } from 'react';
import { Table, Button, Modal as AntModal, Form, Input, message, Select } from 'antd';
import { DeleteFilled, InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { getCategories, createCategory, updateCategory, deleteCategory, getProducts } from '../services/api';

const { Option } = Select;

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isActiveFilter, setIsActiveFilter] = useState(undefined);
  const [sortName, setSortName] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [sortName]);

  const fetchInitialData = async () => {
    try {
      const response = await getCategories();
      let fetchedCategories = response.data;
      console.log('Fetched categories:', fetchedCategories);
      if (sortName) {
        fetchedCategories.sort((a, b) => sortName === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      }
      setAllCategories(fetchedCategories);
      applyFilters(fetchedCategories);
    } catch (error) {
      message.error('Failed to fetch categories: ' + error.message);
    }
  };

  const applyFilters = (data) => {
    let filtered = [...data];
    if (isActiveFilter !== undefined) {
      filtered = filtered.filter(category => category.isActive === isActiveFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(category => category.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setCategories(filtered);
  };

  useEffect(() => {
    applyFilters(allCategories);
  }, [searchTerm, isActiveFilter, allCategories]);

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
      fetchInitialData();
    } catch (error) {
      message.error('Failed to save category: ' + error.message);
    }
  };

  const handleDeleteCategory = async (id) => {
    console.log('handleDeleteCategory called with ID:', id);
    // Thay AntModal.confirm bằng window.confirm
    const confirmed = window.confirm('Are you sure you want to deactivate this category?');
    if (confirmed) {
      try {
        const products = await getProducts();
        const relatedProducts = products.data.filter(p => p.categoryId?.includes(id));
        const hasActiveProduct = relatedProducts.some(p => p.stock > 0 && p.isActive === true);

        if (hasActiveProduct) {
          message.error('Cannot delete category. There are active products with stock > 0 associated with this category.');
          return;
        }

        await deleteCategory(id);
        message.success('Category deactivated successfully');
        fetchInitialData();
      } catch (error) {
        message.error('Failed to deactivate category: ' + error.message);
      }
    } else {
      console.log('Delete action canceled');
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
    {
      title: () => (
        <span>
          Name{' '}
          {sortName ? (sortName === 'asc' ? <SortAscendingOutlined onClick={() => setSortName('desc')} /> : <SortDescendingOutlined onClick={() => setSortName('asc')} />) : <SortAscendingOutlined onClick={() => setSortName('asc')} />}
        </span>
      ),
      dataIndex: 'name',
      key: 'name',
    },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <span style={{ color: isActive ? 'green' : 'red' }}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
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
        <Select
          placeholder="Filter by active status"
          value={isActiveFilter}
          onChange={(value) => setIsActiveFilter(value)}
          allowClear
          style={{ width: 150, marginRight: 10 }}
        >
          <Option value={true}>Active</Option>
          <Option value={false}>Inactive</Option>
        </Select>
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
      <AntModal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={isModalVisible} // Thay visible thành open
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
      </AntModal>
    </div>
  );
};

export default CategoryManagement;