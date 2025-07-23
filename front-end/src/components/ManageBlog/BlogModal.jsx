import React, { useEffect, useState } from 'react';
import { Modal, Spin } from 'antd';
import BlogForm from './BlogForm';
import { getAllUser, getCategories } from '../../services/api';

const BlogModal = ({ visible, onOk, onCancel, initialValues, tags }) => {
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const fetchAuthorsAndCategories = async () => {
      setLoading(true);
      try {
        const [userRes, catRes] = await Promise.all([
          getAllUser(),
          getCategories()
        ]);
        // Lọc trùng theo tên, chỉ giữ mỗi tên 1 lần
        const admins = userRes.data?.filter(u => u.role === 'admin') || [];
        const uniqueAdmins = [];
        const seenNames = new Set();
        for (const user of admins) {
          if (!seenNames.has(user.name)) {
            uniqueAdmins.push(user);
            seenNames.add(user.name);
          }
        }
        setAuthors(uniqueAdmins);
        setCategories(catRes.data || []);
      } catch {
        setAuthors([]);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAuthorsAndCategories();
  }, [visible]);

  return (
    <Modal
      open={visible}
      title={initialValues ? 'Edit Blog' : 'Add Blog'}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      {loading ? <Spin /> : (
        <BlogForm
          initialValues={initialValues}
          onSubmit={onOk}
          categories={categories}
          tags={tags}
          loading={loading}
        />
      )}
    </Modal>
  );
};

export default BlogModal;
