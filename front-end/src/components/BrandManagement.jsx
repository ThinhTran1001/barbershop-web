/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message } from 'antd';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../services/api';

const BrandManagement = () => {
  const [brands, setBrands] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingBrand, setEditingBrand] = useState(null);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await getBrands();
      setBrands(response.data);
    } catch (error) {
      message.error('Failed to fetch brands');
    }
  };

  const handleAddOrUpdateBrand = async (values) => {
    try {
      if (editingBrand) {
        await updateBrand(editingBrand._id, values);
        message.success('Brand updated successfully');
      } else {
        await createBrand(values);
        message.success('Brand created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      setEditingBrand(null);
      fetchBrands();
    } catch (error) {
      message.error('Failed to save brand');
    }
  };

  const handleDeleteBrand = async (id) => {
    try {
      await deleteBrand(id);
      message.success('Brand deleted successfully');
      fetchBrands();
    } catch (error) {
      message.error('Failed to delete brand');
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
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Logo URL', dataIndex: 'logoUrl', key: 'logoUrl' },
    {
      title: 'Actions',
      key: 'actions',
      render: (text, record) => (
        <>
          <Button onClick={() => showModal(record)} className="me-2"><EditOutlined /></Button>
          <Button onClick={() => handleDeleteBrand(record._id)} danger><DeleteOutlined /></Button>
        </>
      ),
    },
  ];

  return (
    <div className="container mt-4">
      <div className="mb-3">
        <Button type="primary" onClick={() => showModal()}>Add Brand</Button>
      </div>
      <Table dataSource={brands} columns={columns} rowKey="_id" />
      <Modal
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
        visible={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleAddOrUpdateBrand} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="logoUrl" label="Logo URL">
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