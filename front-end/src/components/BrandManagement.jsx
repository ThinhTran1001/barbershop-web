import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Modal as AntModal } from 'antd';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../services/api';
import { DeleteFilled, InfoCircleFilled } from '@ant-design/icons';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingBrand, setEditingBrand] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await getBrands();
      setAllBrands(response.data);
      setBrands(response.data);
    } catch (error) {
      message.error('Failed to fetch brands: ' + error.message);
    }
  };

  const filterBrands = () => {
    let filtered = [...allBrands];
    if (searchTerm) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setBrands(filtered);
  };

  useEffect(() => {
    filterBrands();
  }, [searchTerm]);

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
      console.error('Error in handleAddOrUpdateBrand:', error.response?.data || error.message);
      message.error('Failed to save brand: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteBrand = async (id) => {
    console.log('handleDeleteBrand called with ID:', id); // Debug ngay đầu hàm
    AntModal.confirm({
      title: 'Are you sure you want to delete this brand?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          console.log('Attempting to delete brand with ID:', id); // Debug
          const response = await deleteBrand(id);
          console.log('Delete response:', response); // Debug
          message.success('Brand deleted successfully');
          fetchInitialData();
        } catch (error) {
          console.error('Error deleting brand:', error.response?.data || error.message);
          message.error('Failed to delete brand: ' + (error.response?.data?.message || error.message));
        }
      },
      onCancel: () => {
        console.log('Delete action canceled'); // Debug
      },
    });
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
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
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
      <Modal
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
        visible={isModalVisible}
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
      </Modal>
    </div>
  );
};

export default BrandManagement;