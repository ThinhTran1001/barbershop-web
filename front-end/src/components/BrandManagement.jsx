import React, { useState, useEffect } from 'react';
import { Table, Button, Modal as AntModal, Form, Input, message, Select } from 'antd';
import { DeleteFilled, InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import { getBrands, createBrand, updateBrand, deleteBrand, getProducts } from '../services/api';

const { Option } = Select;

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingBrand, setEditingBrand] = useState(null);
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
      const response = await getBrands();
      let fetchedBrands = response.data;
      console.log('Fetched brands:', fetchedBrands);
      if (sortName) {
        fetchedBrands.sort((a, b) => sortName === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
      }
      setAllBrands(fetchedBrands);
      applyFilters(fetchedBrands);
    } catch (error) {
      message.error('Failed to fetch brands: ' + error.message);
    }
  };

  const applyFilters = (data) => {
    let filtered = [...data];
    if (isActiveFilter !== undefined) {
      filtered = filtered.filter(brand => brand.isActive === isActiveFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(brand => brand.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setBrands(filtered);
  };

  useEffect(() => {
    applyFilters(allBrands);
  }, [searchTerm, isActiveFilter, allBrands]);

  const handleAddOrUpdateBrand = async (values) => {
    try {
      if (editingBrand) {
        await updateBrand(editingBrand._id, values);
        message.success('Brand updated successfully');
      } else {
        console.log('Creating brand with data:', values);
        await createBrand(values);
        message.success('Brand created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingBrand(null);
      fetchInitialData();
    } catch (error) {
      message.error('Failed to save brand: ' + error.message);
    }
  };

  const handleDeleteBrand = async (id) => {
    console.log('handleDeleteBrand called with ID:', id);
    // Thay AntModal.confirm bằng window.confirm
    const confirmed = window.confirm('Are you sure you want to deactivate this brand?');
    if (confirmed) {
      try {
        const products = await getProducts();
        const relatedProducts = products.data.filter(p => p.details?.brandId === id);
        const hasActiveProduct = relatedProducts.some(p => p.stock > 0 && p.isActive === true);

        if (hasActiveProduct) {
          message.error('Cannot delete brand. There are active products with stock > 0 associated with this brand.');
          return;
        }

        await deleteBrand(id);
        message.success('Brand deactivated successfully');
        fetchInitialData();
      } catch (error) {
        message.error('Failed to deactivate brand: ' + error.message);
      }
    } else {
      console.log('Delete action canceled');
    }
  };

  const showModal = (brand = null) => {
    if (brand) {
      setEditingBrand(brand);
      form.setFieldsValue(brand);
    } else {
      setEditingBrand(null);
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
          <Button onClick={() => handleDeleteBrand(record._id)} danger><DeleteFilled /></Button>
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
        <Button type="primary" onClick={() => showModal()}>Add Brand</Button>
      </div>
      <Table
        dataSource={brands}
        columns={columns}
        rowKey="_id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: allBrands.length,
          onChange: (page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          },
          showSizeChanger: true,
        }}
      />
      <AntModal
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
        open={isModalVisible} // Thay visible thành open
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateBrand} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Please input the brand name!' }]}>
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

export default BrandManagement;