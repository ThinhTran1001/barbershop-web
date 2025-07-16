import React, { useState } from 'react';
import { Row, Col, Breadcrumb, Typography, Select, Space } from 'antd';
import { Link } from 'react-router-dom';
import BlogList from './BlogList';
import BlogSidebarFilter from './BlogSidebarFilter';


const { Title } = Typography;
const { Option } = Select;

const BlogPage = () => {
  const [sortOption, setSortOption] = useState('default');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  const handleSortChange = (value) => {
    setSortOption(value);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleTagsSelect = (tags) => {
    setSelectedTags(tags);
  };

  return (
    <div style={{ padding: '0 24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginTop: 100, marginBottom: 32 }}>
        <Breadcrumb style={{ fontSize: 15 }}>
          <Breadcrumb.Item>
            <Link to="/">
              <span style={{ color: "blue" }}>Trang chủ</span>
            </Link>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/news">
              <span>Blogs</span>
            </Link>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={5} style={{ margin: 0, color: '#b08d57', fontWeight: 700 }}>BÀI VIẾT MỚI NHẤT</Title>
        </Col>
      </Row>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={16}>
          <BlogList sort={sortOption} category={selectedCategory} tags={selectedTags} />
        </Col>
        <Col xs={24} lg={8}>
          <BlogSidebarFilter
            onCategorySelect={handleCategorySelect}
            onTagsSelect={handleTagsSelect}
          />
        </Col>
      </Row>
    </div>
  );
};

export default BlogPage;
