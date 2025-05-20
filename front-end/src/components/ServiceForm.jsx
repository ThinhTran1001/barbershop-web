import React from "react";
import { Form, Input, Select } from "antd";

const serviceTemplates = [
  { name: "Cắt tóc", price: 100000, description: "Cắt tóc theo yêu cầu", steps: "Tư vấn, Gội đầu, Cắt tạo kiểu, Sấy tóc", durationMinutes: 30, suggestedFor: ["tóc mỏng", "tóc dài"] },
  { name: "Gội đầu", price: 50000, description: "Gội đầu thư giãn", steps: "Gội nước, Thoa dầu gội, Massage da đầu, Xả sạch", durationMinutes: 20, suggestedFor: ["mọi loại tóc"] },
  { name: "Nhuộm tóc", price: 300000, description: "Nhuộm màu tóc theo ý muốn", steps: "Tư vấn màu, Thử thuốc, Nhuộm, Gội, Sấy", durationMinutes: 60, suggestedFor: ["tóc mỏng", "tóc dài"] },
];

const ServiceForm = ({ form, editing }) => {
  return (
    <>
      <Form.Item
        name="name"
        label="Tên dịch vụ"
        rules={[{ required: true, message: "Vui lòng nhập tên dịch vụ" }]}
      >
        <Select
          placeholder="Chọn dịch vụ"
          disabled={!!editing}
          onChange={(value) => {
            const selected = serviceTemplates.find((item) => item.name === value);
            if (selected) {
              form.setFieldsValue({
                name: selected.name,
                price: selected.price,
                description: selected.description,
                steps: selected.steps,
                durationMinutes: selected.durationMinutes,
                suggestedFor: selected.suggestedFor,
              });
            }
          }}
          allowClear
        >
          {serviceTemplates.map((item) => (
            <Select.Option key={item.name} value={item.name}>
              {item.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="price"
        label="Giá (VND)"
        rules={[
          { required: true, message: "Vui lòng nhập giá" },
          { type: "number", min: 0, message: "Giá phải là số không âm" },
        ]}
      >
        <Input type="number" placeholder="Nhập giá dịch vụ" />
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
        <Input type="number" placeholder="Nhập thời gian (phút)" />
      </Form.Item>

      <Form.Item
        name="suggestedFor"
        label="Phù hợp với"
        rules={[{ required: true, message: "Vui lòng nhập thông tin phù hợp" }]}
      >
        <Select mode="tags" style={{ width: "100%" }} placeholder="Nhập hoặc chọn đối tượng phù hợp" />
      </Form.Item>
    </>
  );
};

export default ServiceForm;
