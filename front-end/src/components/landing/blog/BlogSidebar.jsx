import React, { useState } from 'react';
import { Typography, List, Divider, Menu, Card } from 'antd';

const { Title } = Typography;

const BlogSidebar = ({ onCategorySelect }) => {
  const [selectedKey, setSelectedKey] = useState(null);

  const popular = ['Kiểu tóc Side Part đẹp', 'Cách vuốt tóc đúng cách', 'Dưỡng da cho nam'];

  const categoryMap = {
    '1': 'Tóc đẹp mỗi ngày',
    '2': 'Da đẹp mỗi ngày',
  };

  const handleMenuClick = ({ key }) => {
    if (key === selectedKey) {
      setSelectedKey(null);
      onCategorySelect(null);
    } else {
      setSelectedKey(key);
      onCategorySelect(categoryMap[key]);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: 24 }}>
        <Title level={5}>Chuyên mục</Title>
        <Menu
          mode="vertical"
          selectedKeys={selectedKey ? [selectedKey] : []}
          onClick={handleMenuClick}
          items={[
            { key: '1', label: 'Tóc đẹp mỗi ngày' },
            { key: '2', label: 'Da đẹp mỗi ngày' },
          ]}
        />
      </Card>

      <Card>
        <Title level={5}>Bài viết được xem nhiều</Title>
        <Divider />
        <List
          size="small"
          dataSource={popular}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
      </Card>
    </>
  );
};

export default BlogSidebar;
