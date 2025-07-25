import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, message, Select, DatePicker, Tag, Switch, Descriptions, Space } from 'antd';
import { getAllVoucher, createVoucher, updateVoucher, deleteVoucher } from '../services/api';
import { InfoCircleFilled, SortAscendingOutlined, SortDescendingOutlined, EyeOutlined, EditOutlined, DeleteFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Option } = Select;

const VoucherManagement = () => {
    const TYPE_OPTIONS = [
        {value : 'percent', label : 'Percent'},
        {value : 'fixed', label : 'Fixed'},
    ]

    const [vouchers, setVouchers] = useState([]);
    const [allVouchers, setAllVouchers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [viewingVoucher, setViewingVoucher] = useState(null);
    const [form] = Form.useForm();
    const [editingVoucher, setEditingVoucher] = useState(null); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [typeFilter, setTypeFilter] = useState(null); 
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [isActiveFilter, setIsActiveFilter] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 5,
        totalVouchers: 0,
    });
    const [sortName, setSortName] = useState(null);
    const [sortAmount, setSortAmount] = useState(null);
    const [sortUsageLimit, setSortUsageLimit] = useState(null);
    const [sortUsedCount, setSortUsedCount] = useState(null);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });
    const showToast = (variant, message) => {
        setToast({ show: true, message, variant });
        setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
    };

    useEffect(() => {
        fetchInitialData();
    }, [startDate, endDate, isActiveFilter, sortAmount, sortUsageLimit, sortUsedCount, pagination.currentPage, pagination.pageSize]);

    useEffect(() => {
        filterVouchers()
    }, [searchTerm, typeFilter, sortName, allVouchers]);

    const fetchInitialData = async() => {
        try {
            const params = {
                page: pagination.currentPage,
                limit: pagination.pageSize,
            };
            if (startDate) params.startDate = startDate.toISOString();
            if (endDate) params.endDate = endDate.toISOString();
            if (isActiveFilter !== null) params.isActive = isActiveFilter;
            if (sortAmount) params.sortByAmount = sortAmount;
            if (sortUsageLimit) params.sortByUsageLimit = sortUsageLimit;
            if (sortUsedCount) params.sortByUsedCount = sortUsedCount;

            const response = await getAllVoucher(params);
            console.log('Voucher data after fetch:', response.data);
            setAllVouchers(response.data.data);
            setPagination(prev => ({ ...prev, totalVouchers: response.data.totalVouchers }));
            // setVouchers(response.data); // This is handled by filterVouchers
        } catch (error) {
            showToast('danger', 'Failed to load voucher list: ' + error.message);
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
                isActive: values.isActive !== undefined ? values.isActive : true
            };
            // Nếu type là percent thì giữ maxDiscountAmount, nếu không thì bỏ trường này
            if (voucherData.type !== 'percent') {
                delete voucherData.maxDiscountAmount;
            } else {
                // Nếu không nhập thì truyền 0
                if (voucherData.maxDiscountAmount === undefined || voucherData.maxDiscountAmount === null || voucherData.maxDiscountAmount === '') {
                    voucherData.maxDiscountAmount = 0;
                }
            }
            
            console.log('Payload sent:', voucherData);

            const response = editingVoucher 
                ? await updateVoucher(editingVoucher._id, voucherData) 
                : await createVoucher(voucherData);

            console.log('Response:', response.data);

            if ([200, 201, 204].includes(response.status)) {
                if (!editingVoucher) {
                    showToast('success', 'Voucher create successfully!');
                } else {
                    showToast('success', 'Updated voucher successfully');
                }
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
            showToast('danger', `Failed to ${editingVoucher ? 'update' : 'add'} voucher: ${errorMessage}`);
        }
    }

    const handleDeleteVoucher = async (voucherId) => {
        if (window.confirm('Are you sure you want to delete this voucher?')) {
            try {
              await deleteVoucher(voucherId);
              showToast('success', 'Voucher deleted successfully');
              fetchInitialData();
            } catch (error) {
              showToast('danger', 'Failed to delete voucher: ' + error.message);
            }
        }
    };

    const showModal = (voucher = null) => {
        if (voucher) {
            setEditingVoucher(voucher);
            const formattedVoucher = {
                ...voucher,
                startDate: voucher.startDate ? dayjs(voucher.startDate).format('YYYY-MM-DD') : '',
                endDate: voucher.endDate ? dayjs(voucher.endDate).format('YYYY-MM-DD') : '',
                maxDiscountAmount: voucher.maxDiscountAmount ?? 0,
            };
            form.setFieldsValue(formattedVoucher);
        } else {
            setEditingVoucher(null);
            form.resetFields();
            form.setFieldsValue({ 
                usedCount: 0,
                type: 'percent',
                isActive: true,
                maxDiscountAmount: 0,
                minOrderAmount: 0
            });
        }
        setIsModalVisible(true);
    };

    const showViewModal = (voucher) => {
        setViewingVoucher(voucher);
        setIsViewModalVisible(true);
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
                if (value == null) return 'N/A';
                return record.type === 'percent' ? `${value}%` : `${value.toLocaleString('vi-VN')} VND`;
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
            render: (amount) => amount?.toLocaleString('vi-VN') + ' VND',
        },
        {
            title: 'Start Date',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => formatDate(date),
        },
        {
            title: 'End Date',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date, record) => {
                const status = getDateStatus(record.startDate, record.endDate)
                return (
                    <Tag color={status === 'expired' ? 'red' : status === 'active' ? 'green' : 'default'}>
                        {formatDate(date)}
                    </Tag>
                );
            },
        },
        {
            title: 'Is Active',
            dataIndex: 'isActive',
            key: 'isActive',
            render: (isActive) => (
                <Tag color={isActive ? 'green' : 'red'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Max Discount Amount',
            dataIndex: 'maxDiscountAmount',
            key: 'maxDiscountAmount',
            render: (amount, record) =>
                record.type === 'percent' && amount > 0
                    ? amount.toLocaleString('vi-VN') + ' VND'
                    : '-',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button onClick={() => showViewModal(record)} icon={<EyeOutlined />} />
                    <Button onClick={() => showModal(record)} icon={<InfoCircleFilled />} />
                    {/* <Button onClick={() => handleDeleteVoucher(record._id)} icon={<DeleteFilled />} danger /> */}
                </Space>
            ),
        },
    ];
    
    return (
        <div className="container mt-4">
            {/* Toast */}
            <div className="position-fixed" style={{ top: '4rem', right: '1rem', zIndex: 1060 }}>
                {toast.show && (
                    <div className={`toast align-items-center text-bg-${toast.variant} border-0 show`}>
                        <div className="d-flex">
                            <div className="toast-body">{toast.message}</div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" aria-label="Close" onClick={() => setToast(t => ({ ...t, show: false }))} />
                        </div>
                    </div>
                )}
            </div>
            <div className="mb-3 d-flex align-items-center" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search by code"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="Type"
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
                <Select
                    placeholder="Filter by Active"
                    value={isActiveFilter}
                    onChange={setIsActiveFilter}
                    allowClear
                    style={{ width: 150 }}
                >
                    <Option value={true}>Active</Option>
                    <Option value={false}>Inactive</Option>
                </Select>
                <DatePicker 
                    placeholder="Start Date" 
                    onChange={date => setStartDate(date)} 
                />
                <DatePicker 
                    placeholder="End Date" 
                    onChange={date => setEndDate(date)} 
                />
                <Select
                    placeholder="Sort by Amount"
                    value={sortAmount}
                    onChange={setSortAmount}
                    allowClear
                    style={{ width: 180 }}
                >
                    <Option value="asc">Amount (Low to High)</Option>
                    <Option value="desc">Amount (High to Low)</Option>
                </Select>
                <Select
                    placeholder="Sort by Usage Limit"
                    value={sortUsageLimit}
                    onChange={setSortUsageLimit}
                    allowClear
                    style={{ width: 180 }}
                >
                    <Option value="asc">Limit (Low to High)</Option>
                    <Option value="desc">Limit (High to Low)</Option>
                </Select>
                <Select
                    placeholder="Sort by Used Count"
                    value={sortUsedCount}
                    onChange={setSortUsedCount}
                    allowClear
                    style={{ width: 180 }}
                >
                    <Option value="asc">Used (Low to High)</Option>
                    <Option value="desc">Used (High to Low)</Option>
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
                    current: pagination.currentPage,
                    pageSize: pagination.pageSize,
                    total: pagination.totalVouchers,
                    onChange: (page, pageSize) => {
                        setPagination(prev => ({ ...prev, currentPage: page, pageSize: pageSize }));
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
                            label={<span><span style={{ color: 'red' }}>*</span> Code</span>}
                            rules={[
                                { validator: (_, value) => {
                                    if (!value || value.trim() === '') {
                                        return Promise.reject('Code không được để trống hoặc chỉ chứa khoảng trắng!');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
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
                            label={<span><span style={{ color: 'red' }}>*</span> Value</span>}
                            rules={[
                                { validator: (_, value) => {
                                    const type = form.getFieldValue('type');
                                    if (!value || value.trim() === '') {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    if (isNaN(value) || Number(value) < 0) {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    if (type === 'percent' && Number(value) > 100) {
                                        return Promise.reject('Phần trăm giảm giá không được vượt quá 100!');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
                        >
                            <Input placeholder="Enter value" />
                        </Form.Item>
                        <Form.Item
                            name="usageLimit"
                            label={<span><span style={{ color: 'red' }}>*</span> Usage Limit</span>}
                            rules={[
                                { validator: (_, value) => {
                                    if (!value || value.trim() === '') {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    if (isNaN(value) || Number(value) < 1) {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
                        >
                            <Input placeholder="Enter usage limit" />
                        </Form.Item>
                    </div>
                    
                    {/* Max Discount Amount chỉ hiện khi type là percent */}
                    {form.getFieldValue('type') === 'percent' && (
                        <Form.Item
                            name="maxDiscountAmount"
                            label="Max Discount Amount (for percent type)"
                            rules={[
                                { validator: (_, value) => {
                                    if (value === undefined || value === null || value === '') {
                                        return Promise.resolve(); // Không required
                                    }
                                    if (typeof value === 'string' && value.trim() === '') {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    if (isNaN(value) || Number(value) < 0) {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
                        >
                            <Input placeholder="Enter max discount amount (VND)" />
                        </Form.Item>
                    )}
                    
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
                            rules={[
                                { validator: (_, value) => {
                                    // Nếu không nhập gì hoặc để trống thì cho phép (sẽ dùng default 0)
                                    if (value === undefined || value === null || String(value).trim() === '') {
                                        return Promise.resolve();
                                    }
                                    // Nếu nhập toàn dấu cách thì báo lỗi
                                    if (typeof value === 'string' && value.trim() === '') {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    // Kiểm tra có phải số không và không âm
                                    if (isNaN(value) || Number(value) < 0) {
                                        return Promise.reject('Vui lòng nhập số hợp lệ!');
                                    }
                                    return Promise.resolve();
                                }}
                            ]}
                        >
                            <Input placeholder="Enter min order amount" />
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
                    
                    {/* Thêm field isActive với Switch component */}
                    <Form.Item
                        name="isActive"
                        label="Is Active"
                        valuePropName="checked" // Quan trọng: để Switch hoạt động với Form
                        rules={[{ required: true, message: 'Please set active status' }]}
                    >
                        <Switch 
                            checkedChildren="Active" 
                            unCheckedChildren="Inactive"
                        />
                    </Form.Item>
                    
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

            <Modal
                title="Voucher Details"
                open={isViewModalVisible}
                onCancel={() => setIsViewModalVisible(false)}
                footer={[
                    <Button key="back" onClick={() => setIsViewModalVisible(false)}>
                        Close
                    </Button>,
                ]}
                width={600}
            >
                {viewingVoucher && (
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Code">{viewingVoucher.code}</Descriptions.Item>
                        <Descriptions.Item label="Type">
                            <Tag color={viewingVoucher.type === 'percent' ? 'blue' : 'green'}>
                                {viewingVoucher.type?.toUpperCase()}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Value">
                            {viewingVoucher.type === 'percent' ? `${viewingVoucher.value}%` : `${viewingVoucher.value?.toLocaleString('vi-VN')} VND`}
                        </Descriptions.Item>
                        {/* Max Discount Amount chỉ hiện khi type là percent */}
                        {viewingVoucher.type === 'percent' && (
                            <Descriptions.Item label="Max Discount Amount">
                                {viewingVoucher.maxDiscountAmount > 0
                                    ? viewingVoucher.maxDiscountAmount.toLocaleString('vi-VN') + ' VND'
                                    : '-'}
                            </Descriptions.Item>
                        )}
                        <Descriptions.Item label="Min Order Amount">
                            {`${(viewingVoucher.minOrderAmount || 0).toLocaleString('vi-VN')} VND`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Usage Limit">{viewingVoucher.usageLimit || 'Unlimited'}</Descriptions.Item>
                        <Descriptions.Item label="Used Count">{viewingVoucher.usedCount}</Descriptions.Item>
                        <Descriptions.Item label="Start Date">{formatDate(viewingVoucher.startDate)}</Descriptions.Item>
                        <Descriptions.Item label="End Date">{formatDate(viewingVoucher.endDate)}</Descriptions.Item>
                        <Descriptions.Item label="Is Active">
                            <Tag color={viewingVoucher.isActive ? 'green' : 'red'}>
                                {viewingVoucher.isActive ? 'Active' : 'Inactive'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Created At">{dayjs(viewingVoucher.createdAt).format('DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Updated At">{dayjs(viewingVoucher.updatedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
}

export default VoucherManagement;