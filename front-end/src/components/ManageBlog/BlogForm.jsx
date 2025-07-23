import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Upload, Tag, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const BlogForm = ({ initialValues = {}, onSubmit, authors = [], categories = [], tags = [], loading }) => {
  const [form] = Form.useForm();

  // Lọc chỉ lấy user có role là admin
  const adminAuthors = authors.filter(a => a.role === 'admin');

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const handleFinish = (values) => {
    // Xử lý ảnh nếu là file upload
    if (values.image && values.image.file && values.image.file.response) {
      values.image = values.image.file.response.url;
    } else if (values.image && values.image.fileList && values.image.fileList[0]?.response) {
      values.image = values.image.fileList[0].response.url;
    } else if (typeof values.image === 'object') {
      values.image = undefined;
    }
    // Đảm bảo categories luôn là mảng string
    if (values.categories && !Array.isArray(values.categories)) {
      values.categories = [values.categories];
    }
    onSubmit(values);
  };

  // Lấy danh sách tên chuyên mục duy nhất
  const categoryOptions = Array.from(new Set(categories.map(c => c.name)));

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Enter title' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="image" label="Cover Image">
        <Upload
          name="file"
          listType="picture"
          maxCount={1}
          action="/api/upload"
        >
          <Button icon={<UploadOutlined />}>Upload Image</Button>
        </Upload>
      </Form.Item>
      <Form.Item name="categories" label="Category">
        <Select mode="tags" placeholder="Enter or select category">
          {categoryOptions.map((cat) => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="tags" label="Tags">
        <Select mode="tags" placeholder="Enter or select tag">
          {tags.map((tag) => (
            <Option key={tag} value={tag}>{tag}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="shortDesc" label="Short Description">
        <Input.TextArea rows={2} maxLength={300} showCount />
      </Form.Item>
      <Form.Item name="status" label="Status" initialValue="active">
        <Select>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Form.Item>
      <Form.Item name="content" label="Content" rules={[{ required: true, message: 'Enter content' }]}> 
        <Input.TextArea rows={8} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Save
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BlogForm;
