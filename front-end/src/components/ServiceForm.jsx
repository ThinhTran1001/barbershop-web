import React from "react";
import { Form, Input, InputNumber } from "antd";

const ServiceForm = () => {
  return (
    <>
      <Form.Item
        name="name"
        label="Service Name"
        rules={[{ required: true, message: "Please enter the service name" }]}
      >
        <Input placeholder="Enter service name" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Price (VND)"
        rules={[
          { required: true, message: "Please enter the price" },
          { type: "number", min: 1, message: "Price must be a positive number" },
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
        rules={[{ required: true, message: "Please enter the description" }]}
      >
        <Input.TextArea rows={3} placeholder="Enter service description" />
      </Form.Item>

      <Form.Item
        name="steps"
        label="Procedure Steps"
        rules={[{ required: true, message: "Please enter the steps" }]}
      >
        <Input.TextArea rows={3} placeholder="Enter the procedure steps" />
      </Form.Item>

      <Form.Item
        name="durationMinutes"
        label="Duration (minutes)"
        rules={[
          { required: true, message: "Please enter the duration" },
          { type: "number", min: 1, message: "Duration must be a positive number" },
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
        rules={[{ required: true, message: "Please enter suitability info" }]}
      >
        <Input placeholder="Enter target suitability info" />
      </Form.Item>
    </>
  );
};

export default ServiceForm;
