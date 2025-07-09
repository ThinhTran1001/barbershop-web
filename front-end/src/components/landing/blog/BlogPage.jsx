import React, { useState } from 'react';
import { Row, Col, Breadcrumb, Typography, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import BlogList from './BlogList';
import BlogSidebar from './BlogSidebar';

const { Title } = Typography;
const { Option } = Select;

const BlogPage = () => {
  const navigate = useNavigate();
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
      <div className="berger-about__breadcrumb mb-4">
        <Breadcrumb>
          <Breadcrumb.Item>
            <span
              className="berger-contact__breadcrumb-link"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer", color: "#1677ff" }}
            >
              Trang chủ
            </span>
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <span
              className="berger-contact__breadcrumb-link"
              onClick={() => navigate("/news")}
              style={{ color: "black", cursor: "pointer" }}
            >
              Blog
            </span>
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Title level={2} style={{ marginBottom: 16 }}>BLOGS</Title>

      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col><Title level={5}>BÀI VIẾT MỚI NHẤT</Title></Col>
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
