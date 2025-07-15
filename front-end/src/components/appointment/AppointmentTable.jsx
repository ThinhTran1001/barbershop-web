import React, { useEffect, useState } from 'react';
import { Table, Spin } from 'antd';
import { getAllBookings } from '../../services/api';

const AppointmentTable = ({ search, status, barberId, serviceId, currentPage, pageSize, onPageChange, onPageSizeChange, columns }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAllBookings({ search, status, barberId, serviceId })
      .then(res => setData(res.data?.data || res.data || []))
      .finally(() => setLoading(false));
  }, [search, status, barberId, serviceId]);

  if (loading) return <div className="text-center my-5"><Spin size="large" /></div>;

  return (
    <Table
      dataSource={data.slice((currentPage-1)*pageSize, currentPage*pageSize)}
      columns={columns}
      rowKey="_id"
      pagination={{
        current: currentPage,
        pageSize,
        total: data.length,
        onChange: (page, size) => {
          onPageChange(page);
          onPageSizeChange(size);
        },
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
      }}
      scroll={{ x: 900 }}
      loading={loading}
    />
  );
};

export default AppointmentTable; 