import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Upload, Tag, Space } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';

const { Option } = Select;

const BlogForm = ({ initialValues = {}, onSubmit, authors = [], categories = [], loading }) => {
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
      <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="image" label="Ảnh đại diện">
        <Upload
          name="file"
          listType="picture"
          maxCount={1}
          action="/api/upload"
        >
          <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
        </Upload>
      </Form.Item>
      <Form.Item name="categories" label="Chuyên mục">
        <Select mode="tags" placeholder="Nhập hoặc chọn chuyên mục">
          {categoryOptions.map((cat) => (
            <Option key={cat} value={cat}>{cat}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="tags" label="Tags">
        <Select mode="tags" placeholder="Nhập hoặc chọn tag">
        </Select>
      </Form.Item>
      <Form.Item name="shortDesc" label="Mô tả ngắn">
        <Input.TextArea rows={2} maxLength={300} showCount />
      </Form.Item>
      <Form.Item name="status" label="Trạng thái" initialValue="active">
        <Select>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Form.Item>
      <Form.Item name="author" label="Tác giả" rules={[{ required: true, message: 'Chọn tác giả' }]}> 
        <Select placeholder="Chọn tác giả">
          {adminAuthors.map((a) => (
            <Option key={a._id} value={a._id}>{a.name}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item name="content" label="Nội dung" rules={[{ required: true, message: 'Nhập nội dung' }]}> 
        <Input.TextArea rows={8} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Lưu
        </Button>
      </Form.Item>
    </Form>
  );
};

export default BlogForm;
