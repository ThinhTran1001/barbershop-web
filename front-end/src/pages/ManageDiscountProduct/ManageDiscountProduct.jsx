import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { message, Spin, Alert, Form } from 'antd';
import dayjs from 'dayjs';
import DiscountTable from '../../components/DiscountTable';
import DiscountStats from '../../components/DiscountStats';
import DiscountSearch from '../../components/DiscountSearch';
import DiscountModal from '../../components/DiscountModal';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import { getDiscounts, updateDiscount, getProducts, createDiscount, deleteDiscount } from '../../services/api';
import './ManageDiscountProduct.css';

const DiscountManagement = () => {
  const [discounts, setDiscounts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [deletingDiscount, setDeletingDiscount] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form] = Form.useForm();
  const [addForm] = Form.useForm();

  const fetchDiscounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getDiscounts();
      const discountsWithProducts = data.map(discount => {
        const product = typeof discount.productId === 'object' ? discount.productId : null;
        return {
          ...discount,
          productName: product?.name || 'N/A',
          productPrice: product?.price || 0,
          isExpired: new Date(discount.discountEndDate) < new Date(),
        };
      });
      setDiscounts(discountsWithProducts);
    } catch (error) {
      message.error('Lỗi khi tải danh sách giảm giá!');
      console.error('Fetch discounts error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableProducts = useCallback(async () => {
    try {
      const { data } = await getProducts();
      setAvailableProducts(data.filter(product => product.isActive !== false));
    } catch (error) {
      message.error('Lỗi khi tải danh sách sản phẩm!');
      console.error('Fetch products error:', error);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
    fetchAvailableProducts();
  }, [fetchDiscounts, fetchAvailableProducts]);

  const handleSearch = useCallback((value) => {
    setSearchText(value);
  }, []);

  const handleStatusFilter = useCallback((value) => {
    setStatusFilter(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchText('');
    setStatusFilter('all');
  }, []);

  const filteredDiscounts = useMemo(() => {
    let filtered = discounts;
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(discount => 
        discount.productName.toLowerCase().includes(searchLower) ||
        discount.discount.toString().includes(searchLower)
      );
    }
    if (statusFilter !== 'all') {
      filtered = filtered.filter(discount => {
        switch (statusFilter) {
          case 'active':
            return discount.isActive && !discount.isExpired;
          case 'inactive':
            return !discount.isActive;
          case 'expired':
            return discount.isExpired;
          case 'expiring':
            { const daysLeft = dayjs(discount.discountEndDate).diff(dayjs(), 'day');
            return discount.isActive && !discount.isExpired && daysLeft <= 7; }
          default:
            return true;
        }
      });
    }
    return filtered;
  }, [discounts, searchText, statusFilter]);

  const validateDiscount = useCallback((discount, productId, isAdd = false) => {
    const numDiscount = Number(discount);
    if (isNaN(numDiscount) || numDiscount <= 0) {
      throw new Error('Giảm giá phải là số dương lớn hơn 0!');
    }
    let comparePrice;
    if (isAdd) {
      const selectedProduct = availableProducts.find(p => p._id === productId);
      comparePrice = selectedProduct?.price;
    } else {
      comparePrice = editingDiscount?.productPrice;
    }
    if (comparePrice && numDiscount >= comparePrice) {
      throw new Error('Giảm giá không thể lớn hơn hoặc bằng giá gốc!');
    }
  }, [availableProducts, editingDiscount]);

  const handleDeleteDiscount = useCallback((discount) => {
    setDeletingDiscount(discount);
    setDeleteModalVisible(true);
  }, []);

  const confirmDeleteDiscount = useCallback(async () => {
    if (!deletingDiscount) return;
    setSubmitting(true);
    try {
      await deleteDiscount(deletingDiscount._id);
      message.success('Xóa giảm giá thành công!');
      setDeleteModalVisible(false);
      setDeletingDiscount(null);
      await fetchDiscounts();
    } catch (error) {
      message.error('Không thể xóa giảm giá. Vui lòng thử lại!');
      console.error('Delete discount error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [deletingDiscount, fetchDiscounts]);

  const handleEditDiscount = useCallback((discount) => {
    setEditingDiscount(discount);
    form.setFieldsValue({
      discount: discount.discount,
      discountEndDate: dayjs(discount.discountEndDate),
      isActive: discount.isActive,
    });
    setEditModalVisible(true);
  }, [form]);

  const handleAddDiscount = useCallback(async (values) => {
    setSubmitting(true);
    try {
      const selectedProduct = availableProducts.find(p => p._id === values.productId);
      if (!selectedProduct) {
        throw new Error('Không tìm thấy sản phẩm được chọn!');
      }
      validateDiscount(values.discount, values.productId, true);
      const discountData = {
        productId: values.productId,
        discount: Number(values.discount),
        discountEndDate: values.discountEndDate.toDate(),
        isActive: values.isActive !== false,
      };
      await createDiscount(discountData);
      message.success('Thêm giảm giá thành công!');
      setAddModalVisible(false);
      addForm.resetFields();
      await fetchDiscounts();
    } catch (error) {
      message.error(error.message || 'Không thể thêm giảm giá. Vui lòng thử lại!');
      console.error('Add discount error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [availableProducts, validateDiscount, addForm, fetchDiscounts]);

  const handleUpdateDiscount = useCallback(async (values) => {
    if (!editingDiscount) return;
    setSubmitting(true);
    try {
      validateDiscount(values.discount, editingDiscount.productId._id);
      await updateDiscount(editingDiscount._id, {
        discount: Number(values.discount),
        discountEndDate: values.discountEndDate.toDate(),
        isActive: values.isActive,
      });
      message.success('Cập nhật giảm giá thành công!');
      setEditModalVisible(false);
      form.resetFields();
      setEditingDiscount(null);
      await fetchDiscounts();
    } catch (error) {
      message.error(error.message || 'Không thể cập nhật giảm giá. Vui lòng thử lại!');
      console.error('Update discount error:', error);
    } finally {
      setSubmitting(false);
    }
  }, [editingDiscount, validateDiscount, form, fetchDiscounts]);

  const handleModalOk = useCallback(async (isAdd) => {
    try {
      const formInstance = isAdd ? addForm : form;
      const values = await formInstance.validateFields();
      if (isAdd) {
        await handleAddDiscount(values);
      } else {
        await handleUpdateDiscount(values);
      }
    } catch (error) {
      console.error('Modal validation error:', error);
    }
  }, [addForm, form, handleAddDiscount, handleUpdateDiscount]);

  const statistics = useMemo(() => {
    const activeDiscounts = discounts.filter(d => d.isActive && !d.isExpired);
    const expiredDiscounts = discounts.filter(d => d.isExpired);
    const expiringDiscounts = discounts.filter(d => {
      const daysLeft = dayjs(d.discountEndDate).diff(dayjs(), 'day');
      return d.isActive && !d.isExpired && daysLeft <= 7;
    });
    return {
      total: discounts.length,
      active: activeDiscounts.length,
      expired: expiredDiscounts.length,
      expiring: expiringDiscounts.length,
      filtered: filteredDiscounts.length,
    };
  }, [discounts, filteredDiscounts]);

  const productsWithoutDiscount = useMemo(() => {
    return availableProducts.filter(
      product => !discounts.some(d => d.productId?._id === product._id && d.isActive)
    );
  }, [availableProducts, discounts]);

  const getDiscountStatus = useCallback((discount) => {
    if (!discount.isActive) return { color: 'default', text: 'Không hoạt động' };
    if (discount.isExpired) return { color: 'red', text: 'Đã hết hạn' };
    const daysLeft = dayjs(discount.discountEndDate).diff(dayjs(), 'day');
    if (daysLeft <= 7) return { color: 'orange', text: 'Sắp hết hạn' };
    return { color: 'green', text: 'Đang hoạt động' };
  }, []);

  return (
    <div className="mdp-discount-product-container">
      {statistics.expired > 0 && (
        <Alert
          message={`Có ${statistics.expired} giảm giá đã hết hạn`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      {statistics.expiring > 0 && (
        <Alert
          message={`Có ${statistics.expiring} giảm giá sắp hết hạn trong 7 ngày tới`}
          type="info"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      <DiscountStats statistics={statistics} />
      <DiscountSearch
        searchText={searchText}
        statusFilter={statusFilter}
        handleSearch={handleSearch}
        handleStatusFilter={handleStatusFilter}
        handleClearFilters={handleClearFilters}
        fetchDiscounts={fetchDiscounts}
        loading={loading}
        setAddModalVisible={setAddModalVisible}
        productsWithoutDiscount={productsWithoutDiscount}
        statistics={statistics}
      />
      <div className="mdp-discount-table-section">
        {loading ? (
          <div className="mdp-discount-loading">
            <Spin size="large" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <DiscountTable
            discounts={filteredDiscounts}
            loading={loading}
            getDiscountStatus={getDiscountStatus}
            handleEditDiscount={handleEditDiscount}
            handleDeleteDiscount={handleDeleteDiscount}
          />
        )}
      </div>
      <DiscountModal
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          form.resetFields();
          setEditingDiscount(null);
        }}
        onOk={() => handleModalOk(false)}
        form={form}
        title="Chỉnh sửa giảm giá"
        okText="Lưu"
        submitting={submitting}
        editingDiscount={editingDiscount}
        availableProducts={productsWithoutDiscount}
        isAdd={false}
      />
      <DiscountModal
        visible={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        onOk={() => handleModalOk(true)}
        form={addForm}
        title="Thêm giảm giá mới"
        okText="Thêm"
        submitting={submitting}
        editingDiscount={null}
        availableProducts={productsWithoutDiscount}
        isAdd={true}
      />
      <DeleteConfirmModal
        visible={deleteModalVisible}
        onOk={confirmDeleteDiscount}
        onCancel={() => {
          setDeleteModalVisible(false);
          setDeletingDiscount(null);
        }}
        submitting={submitting}
        deletingDiscount={deletingDiscount}
      />
    </div>
  );
};

export default DiscountManagement;