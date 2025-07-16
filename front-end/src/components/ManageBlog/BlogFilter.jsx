import React, { useState } from 'react';
import { Row, Col, Input, Select, DatePicker } from 'antd';
const { Option } = Select;
const { RangePicker } = DatePicker;

const inputStyle = { height: 40, fontSize: 15 };

const BlogFilter = ({ onChange, authors = [], categories = [], tags = [] }) => {
  const [status, setStatus] = useState();
  const [category, setCategory] = useState();
  const [author, setAuthor] = useState();
  const [tag, setTag] = useState([]);
  const [dateRange, setDateRange] = useState();
  const [search, setSearch] = useState('');

  // Gọi onChange mỗi khi filter thay đổi
  const triggerChange = (changed = {}) => {
    onChange({
      status,
      category,
      author,
      tag,
      dateRange,
      search,
      ...changed
    });
  };

  return (
    <Row gutter={8} wrap={false} style={{ flexWrap: 'nowrap', alignItems: 'center', marginBottom: 0 }}>
      <Col flex="none">
        <Select
          allowClear
          placeholder="Trạng thái"
          style={{ width: 120, ...inputStyle }}
          value={status}
          onChange={v => { setStatus(v); triggerChange({ status: v }); }}
          size="large"
        >
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
      </Col>
      <Col flex="none">
        <Select
          allowClear
          placeholder="Chuyên mục"
          style={{ width: 140, ...inputStyle }}
          value={category}
          onChange={v => { setCategory(v); triggerChange({ category: v }); }}
          size="large"
        >
          {categories.map(cat => (
            <Option key={cat._id || cat.name} value={cat.name}>{cat.name}</Option>
          ))}
        </Select>
      </Col>
      <Col flex="none">
        <Select
          allowClear
          placeholder="Tác giả"
          style={{ width: 140, ...inputStyle }}
          value={author}
          onChange={v => { setAuthor(v); triggerChange({ author: v }); }}
          size="large"
        >
          {authors.map(a => (
            <Option key={a._id} value={a.name}>{a.name}</Option>
          ))}
        </Select>
      </Col>
      <Col flex="none">
        <Select
          mode="tags"
          allowClear
          placeholder="Tags"
          style={{ width: 160, ...inputStyle }}
          value={tag}
          onChange={v => { setTag(v); triggerChange({ tag: v }); }}
          size="large"
        >
          {tags.map(t => (
            <Option key={t} value={t}>{t}</Option>
          ))}
        </Select>
      </Col>
      <Col flex="none">
        <RangePicker
          style={{ width: 220, ...inputStyle }}
          value={dateRange}
          onChange={v => { setDateRange(v); triggerChange({ dateRange: v }); }}
          size="large"
          format="DD/MM/YYYY"
        />
      </Col>
      <Col flex="none">
        <Input.Search
          placeholder="Tìm tiêu đề..."
          style={{ width: 200, ...inputStyle }}
          value={search}
          onChange={e => { setSearch(e.target.value); triggerChange({ search: e.target.value }); }}
          size="large"
        />
      </Col>
    </Row>
  );
};

export default BlogFilter;
