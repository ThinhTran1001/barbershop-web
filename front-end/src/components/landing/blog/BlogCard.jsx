import React from 'react';
import { Row, Col, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

const BlogCard = ({ image, title, shortDesc, date, category }) => {
  return (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col xs={24} md={8}>
        <img
          src={image}
          alt={title}
          style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 4 }}
        />
      </Col>
      <Col xs={24} md={16}>
        <Title level={4} style={{ marginBottom: 8 }}>{title}</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          {date} — {category}
        </Text>
        <Paragraph ellipsis={{ rows: 3 }}>{shortDesc}</Paragraph>
      </Col>
    </Row>
  );
};

export default BlogCard;