import React from "react";
import { Form, Input, InputNumber, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const ServiceForm = () => {
  return (
    <>
      <Form.Item
        name="name"
        label="Service Name"
        rules={[{ required: true, message: "Please enter the service name" }, { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Tên dịch vụ không được để trống hoặc chỉ chứa khoảng trắng!') }]}
      >
        <Input placeholder="Enter service name" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price (VND)"
        rules={[
          { required: true, message: "Please enter the price" },
          {
            type: "number",
            min: 1,
            message: "Price must be a positive number",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter service price"
          min={1}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Description"
        rules={[{ required: true, message: "Please enter the description" }, { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Mô tả không được để trống hoặc chỉ chứa khoảng trắng!') }]}
      >
        <Input.TextArea rows={3} placeholder="Enter service description" />
      </Form.Item>

      <Form.Item
        name="steps"
        label="Procedure Steps"
        rules={[{ required: true, message: "Please enter the steps" }, { validator: (_, value) => Array.isArray(value) && value.length > 0 && value.some(s => s.trim() !== '') ? Promise.resolve() : Promise.reject('Vui lòng nhập ít nhất 1 bước hợp lệ!') }]}
        getValueFromEvent={(e) => e.target.value.split("\n").map(s => s.trim()).filter(s => s)}
      >
        <Input.TextArea
          rows={4}
          placeholder={`Enter each step on a new line\nExample:\nGội đầu\nCạo hai bên\nTỉa tóc\nSấy tạo kiểu`}
        />
      </Form.Item>

      <Form.Item
        name="durationMinutes"
        label="Duration (minutes)"
        rules={[
          { required: true, message: "Please enter the duration" },
          {
            type: "number",
            min: 1,
            message: "Duration must be a positive number",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Enter duration in minutes"
          min={1}
        />
      </Form.Item>

      <Form.Item
        name="suggestedFor"
        label="Suitable For"
        rules={[
          { required: true, message: "Please enter suitability info" },
          { validator: (_, value) => {
              if (Array.isArray(value)) {
                return value.length > 0 && value.some(v => typeof v === 'string' && v.trim() !== '')
                  ? Promise.resolve()
                  : Promise.reject('Trường này không được để trống!');
              }
              if (typeof value === 'string') {
                return value && value.trim() !== ''
                  ? Promise.resolve()
                  : Promise.reject('Trường này không được để trống hoặc chỉ chứa khoảng trắng!');
              }
              return Promise.reject('Trường này không được để trống!');
            }
          }
        ]}
      >
        <Input placeholder="Example: Tóc ngắn, Tóc dày" />
      </Form.Item>

      <Form.Item
        name="images"
        label="Service Images"
        getValueFromEvent={(e) => {
          if (Array.isArray(e)) {
            return e;
          }
          return e?.fileList || [];
        }}
        valuePropName="fileList"
      >
        <Upload
          name="file"
          listType="picture"
          multiple
          action="/api/upload"
          beforeUpload={() => false} // Ngăn chặn upload tự động, chỉ hiển thị file đã chọn
        >
          <Button icon={<UploadOutlined />}>Upload Images</Button>
        </Upload>
      </Form.Item>
    </>
  );
};

export default ServiceForm;