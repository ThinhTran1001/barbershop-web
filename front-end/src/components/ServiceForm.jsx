import React from "react";
import { Form, Input, InputNumber } from "antd";

const ServiceForm = () => {
  return (
    <>
      <Form.Item
        name="name"
        label="Tên dịch vụ"
        rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
      >
        <Input placeholder="Nhập tên dịch vụ" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Giá (VND)"
        rules={[
          { required: true, message: "Vui lòng nhập giá" },
          { type: "number", min: 1, message: "Giá phải là số dương" },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Nhập giá dịch vụ"
          min={1}
          formatter={(value) =>
            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
          }
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô tả"
        rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
      >
        <Input.TextArea rows={3} placeholder="Nhập mô tả dịch vụ" />
      </Form.Item>

      <Form.Item
        name="steps"
        label="Các bước thực hiện"
        rules={[{ required: true, message: "Vui lòng nhập các bước" }]}
      >
        <Input.TextArea rows={3} placeholder="Nhập các bước thực hiện" />
      </Form.Item>

      <Form.Item
        name="durationMinutes"
        label="Thời gian (phút)"
        rules={[
          { required: true, message: "Vui lòng nhập thời gian" },
          { type: "number", min: 1, message: "Thời gian phải là số dương" },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Nhập thời gian (phút)"
          min={1}
        />
      </Form.Item>

      <Form.Item
        name="suggestedFor"
        label="Phù hợp với loại tóc"
        rules={[
          { required: true, message: "Vui lòng nhập thông tin phù hợp" },
        ]}
      >
        <Input placeholder="Nhập thông tin phù hợp" />
      </Form.Item>
    </>
  );
};

export default ServiceForm;
