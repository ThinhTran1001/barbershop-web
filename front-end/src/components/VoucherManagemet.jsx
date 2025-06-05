import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select } from 'antd';
import { getAllVoucher, createVoucher, updateVoucher } from '../services/api';
import { InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
const VoucherManagement = () =>{

    const TYPE_OPTIONS = [
        {value : 'percent', label : 'Percent'},
        {value : 'fixed', label : 'Fixed'},
    ]

    const [vouchers, setVouchers] = useState([]);
    const [allVouchers, setAllVouchers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingVoucher, setEditingVoucher] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [sortName, setSortName] = useState(null);



    useEffect(() =>{
        fetchInitialData();
    },[]);

    useEffect(() =>{
        filterUsers()
    },[searchTerm,sortName]);

    const fetchInitialData = async() =>{
        try {
            const response = await getAllVoucher();
            console.log('Voucher data after fetch:', response.data);
            setAllVouchers(response.data);
            setVouchers(response.data);
        } catch (error) {
            message.error('Failed to load voucher list: ' + error.message);
        }
    }; 

    const filterUsers = () => {
    let filtered = [...allVouchers];
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // if (statusFilter !== undefined) {
    //   filtered = filtered.filter((user) => user.status === statusFilter);
    // }
    // if (roleFilter !== undefined) {
    //   filtered = filtered.filter((user) => user.role === roleFilter);
    // }
    // if (verifiedFilter !== undefined) {
    //   filtered = filtered.filter((user) => user.isVerified === verifiedFilter);
    // }
    if (sortName) {
      filtered.sort((a, b) =>
        sortName === 'asc'
          ? a.name?.localeCompare(b.name || '')
          : b.name?.localeCompare(a.name || '')
      );
    }
    setVouchers(filtered);
  };

    const handleAddOrUpdateVoucher = async (values) =>{
        try {
            const voucherData = editingVoucher
            ? {...values}
            : {...values}
            
            console.log('Payload sent:', voucherData);

            const response = editingVoucher 
            ? await updateVoucher(editingVoucher._id, voucherData) 
            : await createVoucher(voucherData);

            console.log('Response from updateVoucher:', response.data);

        if ([200, 201, 204].includes(response.status)) {
               message.success(`${editingVoucher ? 'Updated' : 'Added'} voucher successfully`);
               fetchInitialData();
               setIsModalVisible(false);
               form.resetFields();
               setEditingVoucher(null);
             } else {
               throw new Error(`Unexpected response status: ${response.status}`);
             }
           } catch (error) {
             const errorMessage = error.response?.data?.message || error.message;
             console.error('Error details:', error.response?.data || error.message);
             message.error(`Failed to ${editingVoucher ? 'update' : 'add'} voucher: ${errorMessage}`);
           }
    }

    const showModal = (voucher = null) => {
        if (voucher) {
          setEditingVoucher(voucher);
          form.setFieldsValue({
            ...voucher,
          });
        } else {
          setEditingVoucher(null);
          form.resetFields();
          form.setFieldsValue({ status: 'active', isVerified: true });
        }
        setIsModalVisible(true);
      };

      const formatDate = (date) =>dayjs(date).format('DD/MM/YYYY');
    
      const columns = [
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
          dataIndex: 'code',
          key: 'code',
          render: (code) => code || 'N/A',
        },
        { title: 'Type', dataIndex: 'type', key: 'type', render: (type) => type || 'N/A' },
        {
          title: 'Value',
          dataIndex: 'value',
          key: 'value',
          render: (value) => value || 'N/A',
        },
        {
          title: 'UsageLimit',
          dataIndex: 'usageLimit',
          key: 'usageLimit',
          render: (usageLimit) => usageLimit || 'N/A',
        },
        {
          title: 'UsedCount',
          dataIndex: 'usedCount',
          key: 'usedCount',    
        },
        {
          title: 'MinOrderAmount',
          dataIndex: 'minOrderAmount',
          key: 'minOrderAmount',
        },
        {
          title: 'MinOrderAmount',
          dataIndex: 'minOrderAmount',
          key: 'minOrderAmount',
        },
        {
          title: 'StartDate',
          dataIndex: 'startDate',
          key: 'startDate',
          render : (date) => formatDate(date),
        },
        {
          title: 'EndDate',
          dataIndex: 'endDate',
          key: 'endDate',
          render : (date) => formatDate(date),

        },
        {
          title: 'Actions',
          key: 'actions',
          render: (_, record) => (
            <Button onClick={() => showModal(record)} className="me-2">
              <InfoCircleFilled />
            </Button>
          ),
        },
      ];
    
      return (
        <div className="container mt-4">
          <div className="mb-3 d-flex align-items-center">
            <Input
              placeholder="Search by name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 200, marginRight: 10 }}
            />
            <Button type="primary" onClick={() => showModal()}>
              Add Voucher
            </Button>
          </div>
    
          <Table
            dataSource={vouchers}
            columns={columns}
            rowKey="_id"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: vouchers.length,
              onChange: (page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              },
              showSizeChanger: true,
            }}
          />
    
          <Modal
            title={editingVoucher ? 'Edit Voucher' : 'Add New Voucher'}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
          >
            <Form form={form} onFinish={handleAddOrUpdateVoucher} layout="vertical">
              <Form.Item
                name="code"
                label="Code"
                rules={[{ required: true, message: 'Please enter the code of voucher!' }]}
              >
                <Input disabled={!!editingVoucher} />
              </Form.Item>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, type: 'type', message: 'Please chosse type of voucher' }]}
              >
                 <Select>
                  {TYPE_OPTIONS.map((option) => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item
                name="value"
                label="Value"
                rules={[{required : true, message: 'Please choose number of value' }]}
              >
                <Input type='Number'/>
              </Form.Item>
              <Form.Item
                name="usageLimit"
                label="UsageLimit"
                rules={[{ required: true, message: 'Please choose usageLimit' }]}
              >
                <Input type='Number'/>
              </Form.Item>
              <Form.Item
                name="usedCount"
                label="UsedCount"
              >
                <Input disabled={!!editingVoucher} />
              </Form.Item>
              <Form.Item
                name="minOrderAmount"
                label="MinOrderAmount"
                rules={[{ required: true, message: 'Please choose min amount' }]}
              >
                <Input type='Number'/>
              </Form.Item>
              <Form.Item
                name="startDate"
                label="StartDate"
                rules={[{ required: true, message: 'Please choose start date of voucher' }]}
              >
                <Input type='date'/>
              </Form.Item>
              <Form.Item
                name="endDate"
                label="EndDate"
                rules={[{ required: true, message: 'Please choose end date of voucher' }]}
              >
                <Input type='date'/>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      );
}

export default VoucherManagement;