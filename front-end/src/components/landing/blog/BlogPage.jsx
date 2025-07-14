import React, { useState } from 'react';
import { Row, Col, Breadcrumb, Typography, Select, Space } from 'antd';
import { Link } from 'react-router-dom';
import BlogList from './BlogList';
import BlogSidebar from './BlogSidebar';

const { Title } = Typography;
const { Option } = Select;

const BlogPage = () => {
  const [sortOption, setSortOption] = useState('default');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div style={{ padding: 24 }}>
      <Breadcrumb style={{ margin: '90px 0 50px 30px', fontSize: '14px' }}>
        <Breadcrumb.Item>
          <Link to="/">
            <Space style={{ color: 'blue' }}>
              <span>Trang chủ</span>
            </Space>
          </Link>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <Link to="/news">
            <Space>
              <span>Blogs</span>
            </Space>
          </Link>
        </Breadcrumb.Item>
      </Breadcrumb>

      <Title level={2} style={{ marginBottom: 16 }}>BLOGS</Title>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={5}>BÀI VIẾT MỚI NHẤT</Title>
        </Col>
        <Col>
          <Select
            defaultValue="default"
            style={{ width: 180 }}
            onChange={handleSortChange}
          >
            <Option value="default">Mặc định</Option>
            <Option value="date">Mới nhất</Option>
            <Option value="views">Xem nhiều</Option>
          </Select>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <BlogList sort={sortOption} category={selectedCategory} />
        </Col>
        <Col xs={24} lg={8}>
          <BlogSidebar onCategorySelect={handleCategorySelect} />
        </Col>
      </Row>
    </div>
  );
};

export default BlogPage;
