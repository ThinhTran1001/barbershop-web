import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, message, Tag, Space, Descriptions, Input } from 'antd';
import { EyeOutlined, InfoCircleFilled, DeleteFilled } from '@ant-design/icons';
import { getAllUserVouchers, createUserVoucher, updateUserVoucher, deleteUserVoucher, getAllUser, getAllVoucher } from '../services/api';
import dayjs from 'dayjs';

const { Option } = Select;

const UserVoucherManagement = () => {
    const [userVouchers, setUserVouchers] = useState([]);
    const [users, setUsers] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [deletingUserVoucher, setDeletingUserVoucher] = useState(null);
    const [viewingUserVoucher, setViewingUserVoucher] = useState(null);
    const [editingUserVoucher, setEditingUserVoucher] = useState(null);
    const [form] = Form.useForm();
    
    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(null);
    const [sortBy, setSortBy] = useState('assignedAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
    });
    const [loading, setLoading] = useState(false);

    const fetchUserVouchers = async (page = 1, pageSize = 10) => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: pageSize,
            };

            // Add search parameter
            if (searchTerm) {
                params.search = searchTerm;
            }

            // Add status filter
            if (statusFilter !== null) {
                params.status = statusFilter;
            }

            // Add sort parameters
            if (sortBy) {
                params.sortBy = sortBy;
                params.sortOrder = sortOrder;
            }

            const response = await getAllUserVouchers(params);
            setUserVouchers(response.data.data);
            
            // Update pagination
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    current: response.data.pagination.currentPage,
                    pageSize: response.data.pagination.pageSize,
                    total: response.data.pagination.total,
                }));
            }
        } catch (error) {
            message.error('Failed to load user vouchers: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsersAndVouchers = async () => {
        try {
            const usersResponse = await getAllUser();
            setUsers(usersResponse.data);

            const vouchersResponse = await getAllVoucher({ limit: 1000 }); // Lấy tất cả voucher
            setVouchers(vouchersResponse.data.data);
        } catch (error) {
            message.error('Failed to load users or vouchers: ' + error.message);
        }
    };

    // Lọc voucher khả dụng (chưa được sử dụng hết, còn hiệu lực và chưa được gán hết)
    const getAvailableVouchers = () => {
        const now = new Date();
        
        // Đếm số lần mỗi voucher đã được gán cho tất cả user
        const voucherAssignmentCount = {};
        userVouchers.forEach(uv => {
            const voucherId = uv.voucherId._id || uv.voucherId;
            voucherAssignmentCount[voucherId] = (voucherAssignmentCount[voucherId] || 0) + 1;
        });
        
        return vouchers.filter(voucher => {
            // Kiểm tra voucher có active không
            if (!voucher.isActive) return false;
            
            // Kiểm tra thời gian hiệu lực
            if (voucher.startDate && new Date(voucher.startDate) > now) return false;
            if (voucher.endDate && new Date(voucher.endDate) < now) return false;
            
            // Kiểm tra số lần sử dụng
            if (voucher.usedCount >= voucher.usageLimit) return false;
            
            // Kiểm tra số lần đã được gán cho tất cả user
            const assignedCount = voucherAssignmentCount[voucher._id] || 0;
            if (assignedCount >= voucher.usageLimit) return false;
            
            return true;
        });
    };

    useEffect(() => {
        fetchUserVouchers(pagination.current, pagination.pageSize);
        fetchUsersAndVouchers();
    }, []);

    // Watch for search term changes
    useEffect(() => {
        fetchUserVouchers(1, pagination.pageSize);
    }, [searchTerm]);

    // Watch for status filter changes
    useEffect(() => {
        fetchUserVouchers(1, pagination.pageSize);
    }, [statusFilter]);

    // Handle search with auto-fill
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // Handle status filter
    const handleStatusFilter = (value) => {
        setStatusFilter(value);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // Handle sort from table header
    const handleSort = (field) => {
        const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortOrder(newSortOrder);
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchUserVouchers(1, pagination.pageSize);
    };

    // Handle sort change from dropdown
    const handleDateSortChange = (value) => {
        if (value) {
            const [field, order] = value.split('-');
            setSortBy(field);
            setSortOrder(order);
        } else {
            // Reset to default sort when cleared
            setSortBy('assignedAt');
            setSortOrder('desc');
        }
        setPagination(prev => ({ ...prev, current: 1 }));
        fetchUserVouchers(1, pagination.pageSize);
    };

    // Get current sort value for dropdown
    const getCurrentSortValue = () => {
        // Only show value if sorting by date
        if (sortBy === 'assignedAt') {
            return `${sortBy}-${sortOrder}`;
        }
        return null;
    };

    // Handle pagination change
    const handleTableChange = (paginationInfo) => {
        fetchUserVouchers(paginationInfo.current, paginationInfo.pageSize);
    };

    const handleAddOrUpdate = async (values) => {
        try {
            console.log('Submitting values:', values);
            
            const apiCall = editingUserVoucher
                ? updateUserVoucher(editingUserVoucher._id, values)
                : createUserVoucher(values);
            
            const response = await apiCall;
            console.log('API response:', response);
            
            message.success(`User voucher ${editingUserVoucher ? 'updated' : 'assigned'} successfully`);
            
            // Reset form
            form.resetFields();
            setEditingUserVoucher(null);
            
            // Close modal
            setIsModalVisible(false);
            
            // Reload data
            await fetchUserVouchers(1, pagination.pageSize);
            
        } catch (error) {
            console.error('Error in handleAddOrUpdate:', error);
            message.error('Operation failed: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteUserVoucher(id);
            message.success('User voucher deleted successfully');
            fetchUserVouchers(pagination.current, pagination.pageSize);
            setIsDeleteModalVisible(false);
            setDeletingUserVoucher(null);
        } catch (error) {
            message.error('Failed to delete: ' + error.message);
        }
    };

    const showDeleteModal = (record) => {
        setDeletingUserVoucher(record);
        setIsDeleteModalVisible(true);
    };

    const showModal = (record = null) => {
        setEditingUserVoucher(record);
        form.setFieldsValue(record ? {
            userId: record.userId._id,
            voucherId: record.voucherId._id,
            isUsed: record.isUsed,
        } : { isUsed: false });
        setIsModalVisible(true);
    };

    const showViewModal = (record) => {
        setViewingUserVoucher(record);
        setIsViewModalVisible(true);
    };

    const columns = [
        {
            title: 'User',
            dataIndex: 'userId',
            key: 'user',
            render: (user) => user?.name || 'N/A',
            sorter: true,
            sortOrder: sortBy === 'user' ? sortOrder : null,
            onHeaderCell: () => ({
                onClick: () => handleSort('user'),
            }),
        },
        {
            title: 'Voucher Code',
            dataIndex: 'voucherId',
            key: 'voucher',
            render: (voucher) => voucher?.code || 'N/A',
            sorter: true,
            sortOrder: sortBy === 'voucher' ? sortOrder : null,
            onHeaderCell: () => ({
                onClick: () => handleSort('voucher'),
            }),
        },
        {
            title: 'Status',
            dataIndex: 'isUsed',
            key: 'isUsed',
            render: (isUsed) => <Tag color={isUsed ? 'red' : 'green'}>{isUsed ? 'Used' : 'Available'}</Tag>,
        },
        {
            title: 'Assigned At',
            dataIndex: 'assignedAt',
            key: 'assignedAt',
            render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button icon={<EyeOutlined />} onClick={() => showViewModal(record)} />
                    <Button icon={<InfoCircleFilled />} onClick={() => showModal(record)} />
                                         <Button icon={<DeleteFilled />} danger onClick={() => showDeleteModal(record)} />
                </Space>
            ),
        },
    ];

    return (
        <div className="container mt-4">
            <div className="mb-3 d-flex align-items-center" style={{ gap: '10px', flexWrap: 'wrap' }}>
                <Input
                    placeholder="Search by name, code, or user..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{ width: 300 }}
                />
                <Select
                    placeholder="Filter by status"
                    allowClear
                    style={{ width: 150 }}
                    value={statusFilter}
                    onChange={handleStatusFilter}
                >
                    <Option value="false">Available</Option>
                    <Option value="true">Used</Option>
                </Select>
                <Select
                    placeholder="Sort by date"
                    style={{ width: 200 }}
                    value={getCurrentSortValue()}
                    onChange={handleDateSortChange}
                    allowClear
                >
                    <Option value="assignedAt-desc">Assigned Date (Newest)</Option>
                    <Option value="assignedAt-asc">Assigned Date (Oldest)</Option>
                </Select>
                <Button type="primary" onClick={() => showModal()}>
                    Assign Voucher to User
                </Button>
            </div>

            <Table 
                dataSource={userVouchers} 
                columns={columns} 
                rowKey="_id" 
                pagination={pagination}
                onChange={handleTableChange}
                loading={loading}
                scroll={{ x: 800 }}
            />

            <Modal
                title={editingUserVoucher ? 'Edit User Voucher' : 'Assign New Voucher'}
                open={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                onOk={() => form.submit()}
            >
                <Form form={form} layout="vertical" onFinish={handleAddOrUpdate}>
                    <Form.Item name="userId" label="User" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Select a user" optionFilterProp="children">
                            {users.map(user => <Option key={user._id} value={user._id}>{user.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="voucherId" label="Voucher" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Select a voucher" optionFilterProp="children">
                            {getAvailableVouchers().map(voucher => {
                                // Đếm số lần voucher này đã được gán
                                const assignedCount = userVouchers.filter(uv => 
                                    (uv.voucherId._id || uv.voucherId) === voucher._id
                                ).length;
                                
                                return (
                                    <Option key={voucher._id} value={voucher._id}>
                                        {voucher.code} - {voucher.type === 'percent' ? `${voucher.value}%` : `${voucher.value?.toLocaleString('vi-VN')}đ`} 
                                        (Đã gán: {assignedCount}/{voucher.usageLimit})
                                    </Option>
                                );
                            })}
                        </Select>
                    </Form.Item>
                    <Form.Item name="isUsed" label="Status" valuePropName="checked">
                        <Select>
                            <Option value={false}>Available</Option>
                            <Option value={true}>Used</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

                         {viewingUserVoucher && (
                 <Modal
                     title="User Voucher Details"
                     open={isViewModalVisible}
                     onCancel={() => setIsViewModalVisible(false)}
                     footer={<Button onClick={() => setIsViewModalVisible(false)}>Close</Button>}
                 >
                     <Descriptions bordered column={1}>
                         <Descriptions.Item label="User">{viewingUserVoucher.userId?.name}</Descriptions.Item>
                         <Descriptions.Item label="Email">{viewingUserVoucher.userId?.email}</Descriptions.Item>
                         <Descriptions.Item label="Voucher Code">{viewingUserVoucher.voucherId?.code}</Descriptions.Item>
                         <Descriptions.Item label="Status">
                             <Tag color={viewingUserVoucher.isUsed ? 'red' : 'green'}>{viewingUserVoucher.isUsed ? 'Used' : 'Available'}</Tag>
                         </Descriptions.Item>
                         <Descriptions.Item label="Assigned At">{dayjs(viewingUserVoucher.assignedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
                     </Descriptions>
                 </Modal>
             )}

             {/* Delete Confirmation Modal */}
             <div className={`modal fade ${isDeleteModalVisible ? 'show' : ''}`} 
                  style={{display: isDeleteModalVisible ? 'block' : 'none'}} 
                  tabIndex="-1">
                 <div className="modal-dialog modal-dialog-centered">
                     <div className="modal-content">
                         <div className="modal-header">
                             <h5 className="modal-title">Xác nhận xóa voucher</h5>
                             <button type="button" className="btn-close" onClick={() => setIsDeleteModalVisible(false)}></button>
                         </div>
                         <div className="modal-body">
                             <p>Bạn có muốn xóa voucher "{deletingUserVoucher?.voucherId?.code}" khỏi người dùng "{deletingUserVoucher?.userId?.name}" không?</p>
                         </div>
                         <div className="modal-footer">
                             <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalVisible(false)}>
                                 Hủy
                             </button>
                             <button 
                                 type="button" 
                                 className="btn btn-danger" 
                                 onClick={() => handleDelete(deletingUserVoucher?._id)}
                             >
                                 Đồng ý
                             </button>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Modal Backdrop */}
             {(isModalVisible || isViewModalVisible || isDeleteModalVisible) && (
                 <div className="modal-backdrop fade show"></div>
             )}
         </div>
     );
};

export default UserVoucherManagement; 