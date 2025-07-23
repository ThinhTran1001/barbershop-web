import React, { useEffect, useState } from 'react';
import { Card, Select, Divider } from 'antd';
import { getCategories, getAllBlogs } from '../../../services/api';

const { Option } = Select;

const BlogSidebarFilter = ({ onCategorySelect, onTagsSelect }) => {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState();
  const [selectedTags, setSelectedTags] = useState([]);

  useEffect(() => {
    // Lấy categories từ API
    getCategories().then(res => setCategories(res.data || []));
    // Lấy tags từ tất cả blogs
    getAllBlogs({ limit: 1000 }).then(res => {
      const allTags = (res.data?.data || []).flatMap(blog => blog.tags || []);
      setTags(Array.from(new Set(allTags)));
    });
  }, []);

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    onCategorySelect && onCategorySelect(value);
  };

  const handleTagsChange = (value) => {
    setSelectedTags(value);
    onTagsSelect && onTagsSelect(value);
  };

  return (
    <Card title="Lọc bài viết" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Chuyên mục</div>
        <Select
          allowClear
          placeholder="Chọn chuyên mục"
          style={{ width: '100%' }}
          value={selectedCategory}
          onChange={handleCategoryChange}
        >
          {categories.map(cat => (
            <Option key={cat._id || cat.name} value={cat.name}>{cat.name}</Option>
          ))}
        </Select>
      </div>
      <Divider style={{ margin: '16px 0' }} />
      <div>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Tags</div>
        <Select
          mode="multiple"
          allowClear
          placeholder="Chọn tags"
          style={{ width: '100%' }}
          value={selectedTags}
          onChange={handleTagsChange}
        >
          {tags.map(tag => (
            <Option key={tag} value={tag}>{tag}</Option>
          ))}
        </Select>
      </div>
    </Card>
  );
};

export default BlogSidebarFilter; 