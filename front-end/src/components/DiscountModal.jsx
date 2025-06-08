import React from 'react';
import { Modal, Form, Input, DatePicker, Switch, Space, Select } from 'antd';
import dayjs from 'dayjs';
import '../pages/ManageDiscountProduct/ManageDiscountProduct.css'
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
  isAdd 
}) => {
  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={onOk}
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
      {availableProducts.map(product => (
        <Option key={product._id} value={product._id}>
          {product.name} - ${product.price?.toFixed(2)}
        </Option>
      ))}
    </Select>
  </Form.Item>
) : editingDiscount && (
  <div className="product-info">
    <Space direction="vertical" size="small">
      <div><strong>Product:</strong> {editingDiscount.productName}</div>
      <div><strong>Original Price:</strong> ${editingDiscount.productPrice?.toFixed(2)}</div>
      <div><strong>Current Discount:</strong> ${editingDiscount.discount}</div>
    </Space>
  </div>
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
                  return Promise.reject(new Error('Discount must be a positive number greater than 0!'));
                }
                const comparePrice = isAdd 
                  ? availableProducts.find(p => p._id === form.getFieldValue('productId'))?.price
                  : editingDiscount?.productPrice;
                if (comparePrice && numDiscount >= comparePrice) {
                  return Promise.reject(new Error('Discount cannot be greater than or equal to the original price!'));
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
                if (value && value.isBefore(dayjs(), 'day')) {
                  return Promise.reject(new Error('End date must be after today!'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            placeholder="Select end date"
            disabledDate={current => current && current < dayjs().endOf('day')}
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
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Paused" 
            defaultChecked={isAdd}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DiscountModal;