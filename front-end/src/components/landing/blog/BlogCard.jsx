import React from 'react';
import { Typography, Button } from 'antd';
import { UserOutlined, CalendarOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const BlogCard = ({ image, title, shortDesc, date, category, author }) => {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        marginBottom: 32,
        border: '1px solid #f0f0f0',
        transition: 'box-shadow 0.2s',
        cursor: 'pointer',
        minHeight: 340,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {image && (
        <img
          src={image}
          alt={title}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
        />
      )}
      <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Title level={4} style={{ marginBottom: 10, color: '#b08d57', fontWeight: 700, fontSize: 22, lineHeight: 1.2 }}>{title}</Title>
        <div style={{ fontSize: 13, color: '#888', marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span><CalendarOutlined /> {date}</span>
          {author && <span><UserOutlined /> {author.name || 'admin'}</span>}
          {category && <span>{category}</span>}
        </div>
        <Paragraph ellipsis={{ rows: 3 }} style={{ marginBottom: 18, color: '#444', flex: 1 }}>{shortDesc}</Paragraph>
        <Button size="small" style={{ background: '#b08d57', color: '#fff', border: 'none', fontWeight: 600, letterSpacing: 1, borderRadius: 4, width: 80 }}>
          + MORE
        </Button>
      </div>
    </div>
  );
};

export default BlogCard;