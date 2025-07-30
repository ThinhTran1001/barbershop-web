import React from "react";
import { Form, Input, InputNumber, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const ServiceForm = () => {
  return (
    <>
      <Form.Item
        name="name"
        label="Tên Dịch Vụ"
        rules={[
          { required: true, message: "Vui lòng nhập tên dịch vụ" },
          {
            validator: (_, value) =>
              value && value.trim() !== ""
                ? Promise.resolve()
                : Promise.reject(
                    "Tên dịch vụ không được để trống hoặc chỉ chứa khoảng trắng!"
                  ),
          },
        ]}
      >
        <Input placeholder="Nhập tên dịch vụ" />
      </Form.Item>

      <Form.Item
        name="price"
        label="Giá (VND)"
        rules={[
          { required: true, message: "Vui lòng nhập giá" },
          {
            type: "number",
            min: 1,
            message: "Giá phải là số dương",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Nhập giá dịch vụ"
          min={1}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
        />
      </Form.Item>

      <Form.Item
        name="description"
        label="Mô Tả"
        rules={[
          { required: true, message: "Vui lòng nhập mô tả" },
          {
            validator: (_, value) =>
              value && value.trim() !== ""
                ? Promise.resolve()
                : Promise.reject(
                    "Mô tả không được để trống hoặc chỉ chứa khoảng trắng!"
                  ),
          },
        ]}
      >
        <Input.TextArea rows={3} placeholder="Nhập mô tả dịch vụ" />
      </Form.Item>

      <Form.Item
        name="steps"
        label="Các Bước Thực Hiện"
        rules={[
          { required: true, message: "Vui lòng nhập các bước" },
          {
            validator: (_, value) =>
              Array.isArray(value) &&
              value.length > 0 &&
              value.some((s) => s.trim() !== "")
                ? Promise.resolve()
                : Promise.reject("Vui lòng nhập ít nhất 1 bước hợp lệ!"),
          },
        ]}
        getValueFromEvent={(e) =>
          e.target.value.split("\n").map((s) => s.trim()).filter((s) => s)
        }
      >
        <Input.TextArea
          rows={4}
          placeholder={`Nhập mỗi bước trên một dòng\nVí dụ:\nGội đầu\nCạo hai bên\nTỉa tóc\nSấy tạo kiểu`}
        />
      </Form.Item>

      <Form.Item
        name="durationMinutes"
        label="Thời Gian (phút)"
        rules={[
          { required: true, message: "Vui lòng nhập thời gian" },
          {
            type: "number",
            min: 1,
            message: "Thời gian phải là số dương",
          },
        ]}
      >
        <InputNumber
          style={{ width: "100%" }}
          placeholder="Nhập thời gian thực hiện (phút)"
          min={1}
        />
      </Form.Item>

      <Form.Item
        name="suggestedFor"
        label="Phù Hợp Với"
        rules={[
          { required: true, message: "Vui lòng nhập thông tin phù hợp" },
          {
            validator: (_, value) => {
              if (Array.isArray(value)) {
                return value.length > 0 &&
                  value.some((v) => typeof v === "string" && v.trim() !== "")
                  ? Promise.resolve()
                  : Promise.reject("Trường này không được để trống!");
              }
              if (typeof value === "string") {
                return value && value.trim() !== ""
                  ? Promise.resolve()
                  : Promise.reject(
                      "Trường này không được để trống hoặc chỉ chứa khoảng trắng!"
                    );
              }
              return Promise.reject("Trường này không được để trống!");
            },
          },
        ]}
      >
        <Input placeholder="Ví dụ: Tóc ngắn, Tóc dày" />
      </Form.Item>

      <Form.Item
        name="images"
        label="Hình Ảnh Dịch Vụ"
        valuePropName="fileList"
        getValueFromEvent={(e) => {
          if (Array.isArray(e)) {
            return e;
          }
          return e?.fileList?.map((file) => ({
            ...file,
            url: file.response?.url || file.url,
          })) || [];
        }}
      >
       <Upload
  name="file"
  listType="picture"
  multiple
  action="/api/upload"
  onChange={({ file, fileList }) => {
    if (file.status === "done") {
      // Gán URL trả về từ Cloudinary
      file.url = file.response?.url;
    }
    return fileList;
  }}
>
  <Button icon={<UploadOutlined />}>Tải Lên Hình Ảnh</Button>
</Upload>
      </Form.Item>
    </>
  );
};

export default ServiceForm;