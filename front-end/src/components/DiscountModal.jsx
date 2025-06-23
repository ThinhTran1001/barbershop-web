import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Switch, Space, Select } from 'antd';
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
                    {product.name} - ${product.price?.toFixed(2)}
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
                    <strong>Original Price:</strong> ${editingDiscount.productPrice?.toFixed(2)}
                  </div>
                  <div>
                    <strong>Current Discount:</strong> ${editingDiscount.discount}
                  </div>
                </Space>
              </div>
            )
          )}

          <Form.Item
            label="Discount ($)"
            name="discount"
            rules={[
              { required: true, message: 'Please enter the discount amount!' },
              {
                validator: (_, value) => {
                  const numDiscount = Number(value);
                  if (isNaN(numDiscount) || numDiscount <= 0) {
                    return Promise.reject(new Error('Discount must be greater than 0!'));
                  }
                  const comparePrice = isAdd
                    ? availableProducts.find(p => p._id === form.getFieldValue('productId'))?.price
                    : editingDiscount?.productPrice;
                  if (comparePrice && numDiscount >= comparePrice) {
                    return Promise.reject(
                      new Error('Discount must be less than the original price!')
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input
              type="number"
              min={0.01}
              step="0.01"
              placeholder="Enter discount amount"
              addonBefore="$"
            />
          </Form.Item>

          <Form.Item
            label="End Date"
            name="discountEndDate"
            rules={[
              { required: true, message: 'Please select an end date!' },
              {
                validator: (_, value) => {
                  if (value && value.isBefore(dayjs(), 'minute')) {
                    return Promise.reject(new Error('End date must be in the future!'));
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="Select end date"
              disabledDate={(current) => current && current < dayjs().endOf('day')}
              showTime={{ format: 'HH:mm' }}
              format="DD/MM/YYYY HH:mm"
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
