import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Switch, Space, Select, InputNumber, notification } from 'antd';
import { Modal as BootstrapModal, Button } from 'react-bootstrap';
import dayjs from 'dayjs';
import 'bootstrap/dist/css/bootstrap.min.css';

const { Option } = Select;

const DiscountModal = ({
  visible,
  onCancel,
  onOk,
  form,
  title,
  okText,
  submitting,
  editingDiscount,
  availableProducts,
  isAdd,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleOk = () => {
    form
      .validateFields()
      .then(() => {
        setShowConfirmModal(true);
      })
      .catch((errorInfo) => {
        console.log('Validation failed:', errorInfo);
      });
  };

  const handleConfirm = async () => {
    try {
      setShowConfirmModal(false);
      await onOk();
      setToastMessage(isAdd ? 'Discount added successfully!' : 'Discount updated successfully!');
      setShowToast(true);
    } catch (error) {
      console.error('Error during onOk():', error);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <>
      {/* Form Modal */}
      <Modal
        title={title}
        open={visible}
        onCancel={onCancel}
        onOk={handleOk}
        okText={okText}
        cancelText="Cancel"
        confirmLoading={submitting}
        maskClosable={false}
        centered
        width={600}
      >
        <Form form={form} layout="vertical">
          {isAdd ? (
            <Form.Item
              label="Select Product"
              name="productId"
              rules={[{ required: true, message: 'Please select a product!' }]}
            >
              <Select
                showSearch
                placeholder="Select a product to add discount"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent="No products available"
              >
                {availableProducts.map((product) => (
                  <Option key={product._id} value={product._id}>
                    {product.name} - {product.price?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            editingDiscount && (
              <div className="product-info">
                <Space direction="vertical" size="small">
                  <div>
                    <strong>Product:</strong> {editingDiscount.productName}
                  </div>
                  <div>
                    <strong>Original Price:</strong> {editingDiscount.productPrice?.toLocaleString('vi-VN')} VNĐ
                  </div>
                  <div>
                    <strong>Current Discount:</strong> {editingDiscount.discount?.toLocaleString('vi-VN')} VNĐ
                  </div>
                </Space>
              </div>
            )
          )}

          <Form.Item
            label="Discount (%)"
            name="discount"
            rules={[
              { required: true, message: 'Please enter a discount percentage!' },
              { type: 'number', min: 1, max: 100, message: 'Only values from 1% to 100% are allowed!' }
            ]}
          >
            <InputNumber
              min={1}
              max={100}
              style={{ width: '100%' }}
              placeholder="Enter discount percentage (1-100)"
              addonAfter="%"
              onKeyPress={(e) => {
                // Chỉ cho phép nhập số từ 0-9
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                  e.preventDefault();
                }
              }}
            />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="discountEndDate"
            rules={[{ required: true, message: 'Please select an end date!' }]}
          >
            <DatePicker
              showTime
              style={{ width: '100%' }}
              placeholder="Select end date"
              // Cho phép chọn cả ngày hôm nay
              disabledDate={current => false}
              // Nếu muốn chỉ cho chọn từ hôm nay trở đi:
              // disabledDate={current => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            label="Status"
            name="isActive"
            valuePropName="checked"
            initialValue={isAdd ? true : undefined}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Paused" defaultChecked={isAdd} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Confirm Modal */}
      <BootstrapModal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
        animation
      >
        <BootstrapModal.Header closeButton>
          <BootstrapModal.Title>Confirm Action</BootstrapModal.Title>
        </BootstrapModal.Header>
        <BootstrapModal.Body>
          Are you sure you want to {isAdd ? 'add' : 'update'} this discount?
        </BootstrapModal.Body>
        <BootstrapModal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Confirm'}
          </Button>
        </BootstrapModal.Footer>
      </BootstrapModal>

      {/* Toast Notification */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="position-fixed top-0 end-0 p-3"
        style={{ zIndex: 1060 }}
      >
        <div
          className={`toast show bg-success text-white ${showToast ? '' : 'd-none'}`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header bg-success text-white">
            <strong className="me-auto">Success</strong>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setShowToast(false)}
            ></button>
          </div>
          <div className="toast-body">{toastMessage}</div>
        </div>
      </div>
    </>
  );
};

export default DiscountModal;
