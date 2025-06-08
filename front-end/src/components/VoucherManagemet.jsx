import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select, DatePicker, Tag } from 'antd';
import { getAllVoucher, createVoucher, updateVoucher } from '../services/api';
import { InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const VoucherManagement = () => {
    const TYPE_OPTIONS = [
        {value : 'percent', label : 'Percent'},
        {value : 'fixed', label : 'Fixed'},
    ]

    const [vouchers, setVouchers] = useState([]);
    const [allVouchers, setAllVouchers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [editingVoucher, setEditingVoucher] = useState(null); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [typeFilter, setTypeFilter] = useState(''); 
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);
    const [sortName, setSortName] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        filterVouchers()
    }, [searchTerm, typeFilter, sortName]);

    const fetchInitialData = async() => {
        try {
            const response = await getAllVoucher();
            console.log('Voucher data after fetch:', response.data);
            setAllVouchers(response.data);
            setVouchers(response.data);
        } catch (error) {
            message.error('Failed to load voucher list: ' + error.message);
        }
    }; 

    const filterVouchers = () => { 
        let filtered = [...allVouchers];
        
        if (searchTerm) {
            filtered = filtered.filter((voucher) =>
                voucher.code?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (typeFilter) {
            filtered = filtered.filter((voucher) => voucher.type === typeFilter);
        }
        
        if (sortName) {
            filtered.sort((a, b) =>
                sortName === 'asc'
                    ? a.code?.localeCompare(b.code || '')
                    : b.code?.localeCompare(a.code || '')
            );
        }
        setVouchers(filtered);
    };

    const handleAddOrUpdateVoucher = async (values) => {
        try {
            const voucherData = {
                ...values,
                startDate: values.startDate ? dayjs(values.startDate).toISOString() : null,
                endDate: values.endDate ? dayjs(values.endDate).toISOString() : null,
            };
            
            console.log('Payload sent:', voucherData);

            const response = editingVoucher 
                ? await updateVoucher(editingVoucher._id, voucherData) 
                : await createVoucher(voucherData);

            console.log('Response:', response.data);

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
            const formattedVoucher = {
                ...voucher,
                startDate: voucher.startDate ? dayjs(voucher.startDate).format('YYYY-MM-DD') : '',
                endDate: voucher.endDate ? dayjs(voucher.endDate).format('YYYY-MM-DD') : '',
            };
            form.setFieldsValue(formattedVoucher);
        } else {
            setEditingVoucher(null);
            form.resetFields();
            form.setFieldsValue({ 
                usedCount: 0,
                type: 'percent'
            });
        }
        setIsModalVisible(true);
    };

    // Cải thiện hàm formatDate với error handling
    const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
            return dayjs(date).format('DD/MM/YYYY');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid Date';
        }
    };

    // Hàm check date status để tô màu
    const getDateStatus = (startDate, endDate) => {
        const now = dayjs();
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        
        if (now.isBefore(start)) {
            return 'upcoming'; 
        } else if (now.isAfter(end)) {
            return 'expired'; 
        } else {
            return 'active'; 
        }
    };
    
    const columns = [
        {
            title: () => (
                <span>
                    Code{' '}
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
        { 
            title: 'Type', 
            dataIndex: 'type', 
            key: 'type', 
            render: (type) => (
                <Tag color={type === 'percent' ? 'blue' : 'green'}>
                    {type?.toUpperCase() || 'N/A'}
                </Tag>
            )
        },
        {
            title: 'Value',
            dataIndex: 'value',
            key: 'value',
            render: (value, record) => {
                if (!value) return 'N/A';
                return record.type === 'percent' ? `${value}%` : `$${value}`;
            },
        },
        {
            title: 'Usage Limit',
            dataIndex: 'usageLimit',
            key: 'usageLimit',
            render: (usageLimit) => usageLimit || 'N/A',
        },
        {
            title: 'Used Count',
            dataIndex: 'usedCount',
            key: 'usedCount',
            render: (usedCount) => usedCount || 0,
        },
        {
            title: 'Min Order Amount',
            dataIndex: 'minOrderAmount',
            key: 'minOrderAmount',
            render: (amount) => amount ? `$${amount}` : 'N/A',
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date, record) => {
                const status = getDateStatus(record.startDate, record.endDate);
                return (
                    <Tag color={status === 'upcoming' ? 'orange' : status === 'active' ? 'green' : 'default'}>
                        {formatDate(date)}
                    </Tag>
                );
            },
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date, record) => {
                const status = getDateStatus(record.startDate, record.endDate);
                return (
                    <Tag color={status === 'expired' ? 'red' : status === 'active' ? 'green' : 'default'}>
                        {formatDate(date)}
                    </Tag>
                );
            },
        },
        {
            title: 'Status',
            key: 'status',
            render: (_, record) => {
                const status = getDateStatus(record.startDate, record.endDate);
                const statusConfig = {
                    upcoming: { color: 'orange', text: 'Upcoming' },
                    active: { color: 'green', text: 'Active' },
                    expired: { color: 'red', text: 'Expired' }
                };
                return (
                    <Tag color={statusConfig[status].color}>
                        {statusConfig[status].text}
                    </Tag>
                );
            },
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
            <div className="mb-3 d-flex align-items-center" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search by code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Filter by type"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    style={{ width: 150 }}
                    allowClear
                >
                    {TYPE_OPTIONS.map((option) => (
                        <Option key={option.value} value={option.value}>
                            {option.label}
                        </Option>
                    ))}
                </Select>
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
                width={600}
            >
                <Form form={form} onFinish={handleAddOrUpdateVoucher} layout="vertical">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="code"
                            label="Code"
                            rules={[{ required: true, message: 'Please enter the code of voucher!' }]}
                        >
                            <Input disabled={!!editingVoucher} placeholder="Enter voucher code" />
                        </Form.Item>
                        <Form.Item
                            name="type"
                            label="Type"
                            rules={[{ required: true, message: 'Please choose type of voucher' }]}
                        >
                            <Select placeholder="Select voucher type">
                                {TYPE_OPTIONS.map((option) => (
                                    <Option key={option.value} value={option.value}>
                                        {option.label}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="value"
                            label="Value"
                            rules={[{required : true, message: 'Please enter value' }]}
                        >
                            <Input type='number' placeholder="Enter value" min={0} />
                        </Form.Item>
                        <Form.Item
                            name="usageLimit"
                            label="Usage Limit"
                            rules={[{ required: true, message: 'Please enter usage limit' }]}
                        >
                            <Input type='number' placeholder="Enter usage limit" min={1} />
                        </Form.Item>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="usedCount"
                            label="Used Count"
                        >
                            <Input 
                                type='number' 
                                disabled={!editingVoucher} 
                                placeholder={editingVoucher ? "Used count" : "0"} 
                            />
                        </Form.Item>
                        <Form.Item
                            name="minOrderAmount"
                            label="Min Order Amount"
                            rules={[{ required: true, message: 'Please enter min order amount' }]}
                        >
                            <Input type='number' placeholder="Enter min order amount" min={0} />
                        </Form.Item>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item
                            name="startDate"
                            label="Start Date"
                            rules={[{ required: true, message: 'Please choose start date' }]}
                        >
                            <Input type='date' />
                        </Form.Item>
                        <Form.Item
                            name="endDate"
                            label="End Date"
                            rules={[
                                { required: true, message: 'Please choose end date' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startDate = getFieldValue('startDate');
                                        if (!value || !startDate) {
                                            return Promise.resolve();
                                        }
                                        if (dayjs(value).isBefore(dayjs(startDate))) {
                                            return Promise.reject(new Error('End date must be after start date'));
                                        }
                                        return Promise.resolve();
                                    },
                                }),
                            ]}
                        >
                            <Input type='date' />
                        </Form.Item>
                    </div>
                    
                    <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
                        <Button onClick={() => setIsModalVisible(false)} style={{ marginRight: '8px' }}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit">
                            {editingVoucher ? 'Update' : 'Create'} Voucher
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default VoucherManagement;