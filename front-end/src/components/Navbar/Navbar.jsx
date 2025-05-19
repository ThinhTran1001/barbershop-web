import React, { useState } from 'react';
import { Menu } from 'antd';
import './Navbar.css';

const Navbar = () => {
  const [current, setCurrent] = useState('trang-chu');

  const handleClick = (e) => {
    setCurrent(e.key);
  };

  return (
    <Menu
      onClick={handleClick}
      selectedKeys={[current]}
      mode="horizontal"
      className="custom-antd-menu"
      items={[
        {
          key: 'trang-chu',
          label: 'TRANG CHỦ',
        },
        {
          key: 'gioi-thieu',
          label: 'GIỚI THIỆU',
        },
        {
          key: 'dich-vu',
          label: 'DỊCH VỤ & BẢNG GIÁ',
        },
        {
          key: 'san-pham',
          label: 'SẢN PHẨM',
        },
        {
          key: 'tin-tuc',
          label: 'TIN TỨC',
        },
        {
          key: 'lien-he',
          label: 'LIÊN HỆ',
        },
      ]}
    />
  );
};

export default Navbar;