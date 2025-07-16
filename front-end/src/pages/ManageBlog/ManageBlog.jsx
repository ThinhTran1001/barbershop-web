import React, { useState, useEffect } from 'react';
import BlogTable from '../../components/ManageBlog/BlogTable';
import BlogModal from '../../components/ManageBlog/BlogModal';
import BlogFilter from '../../components/ManageBlog/BlogFilter';
import { getAllBlogs, createBlog, updateBlog, deleteBlog, getAllUser, getCategories } from '../../services/api';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Alert from 'react-bootstrap/Alert';
import 'bootstrap/dist/css/bootstrap.min.css';

const PAGE_SIZE = 5;

const ManageBlog = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [filter, setFilter] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);

  // Bootstrap modal/alert state
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', data: null });
  const [alert, setAlert] = useState({ show: false, variant: 'success', message: '' });

  const fetchBlogs = async (page = currentPage, filterObj = filter) => {
    setLoading(true);
    try {
      // Chỉ lấy các trường filter có giá trị
      const cleanFilter = {};
      Object.entries(filterObj).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          !(Array.isArray(value) && value.length === 0)
        ) {
          cleanFilter[key] = value;
        }
      });

      const res = await getAllBlogs({
        ...cleanFilter,
        page,
        limit: PAGE_SIZE,
      });
      setBlogs(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      showAlert('danger', 'Failed to load blog list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchBlogs(1, filter);
    // eslint-disable-next-line
  }, [filter]);

  useEffect(() => {
    fetchBlogs(currentPage, filter);
    // eslint-disable-next-line
  }, [currentPage]);

  // Lấy authors và categories khi mount
  useEffect(() => {
    const fetchAuthorsAndCategories = async () => {
      try {
        const [userRes, catRes] = await Promise.all([
          getAllUser(),
          getCategories()
        ]);
        // Lọc trùng tên admin
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
      }
    };
    fetchAuthorsAndCategories();
  }, []);

  // Lấy tags từ blogs mỗi khi blogs thay đổi
  useEffect(() => {
    const allTags = blogs.flatMap(blog => blog.tags || []);
    setTags(Array.from(new Set(allTags)));
  }, [blogs]);

  const showAlert = (variant, message) => {
    setAlert({ show: true, variant, message });
    setTimeout(() => setAlert({ show: false, variant: 'success', message: '' }), 2500);
  };

  // Thêm/sửa: xác nhận trước khi lưu
  const handleAdd = () => {
    setEditingBlog(null);
    setModalVisible(true);
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setModalVisible(true);
  };

  // Xác nhận xóa bằng Bootstrap Modal
  const handleDelete = (id) => {
    setConfirmModal({ show: true, type: 'delete', data: id });
  };

  // Xác nhận lưu (thêm/sửa) bằng Bootstrap Modal
  const handleModalOk = (values) => {
    setConfirmModal({ show: true, type: editingBlog ? 'edit' : 'add', data: values });
  };

  // Xử lý xác nhận từ modal
  const handleConfirm = async () => {
    if (confirmModal.type === 'delete') {
      try {
        await deleteBlog(confirmModal.data);
        showAlert('success', 'Blog deleted successfully');
        fetchBlogs();
      } catch {
        showAlert('danger', 'Delete blog failed');
      }
    } else if (confirmModal.type === 'add') {
      try {
        await createBlog(confirmModal.data);
        showAlert('success', 'Blog created successfully');
        setModalVisible(false);
        fetchBlogs();
      } catch {
        showAlert('danger', 'Create blog failed');
      }
    } else if (confirmModal.type === 'edit') {
      try {
        await updateBlog(editingBlog._id, confirmModal.data);
        showAlert('success', 'Blog updated successfully');
        setModalVisible(false);
        fetchBlogs();
      } catch {
        showAlert('danger', 'Update blog failed');
      }
    }
    setConfirmModal({ show: false, type: '', data: null });
  };

  const handleCancelConfirm = () => {
    setConfirmModal({ show: false, type: '', data: null });
  };

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
  };

  return (
    <div style={{ padding: 32 }}>
      {alert.show && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          minWidth: 280,
          maxWidth: 400
        }}>
          <Alert variant={alert.variant} style={{ marginBottom: 0 }}>{alert.message}</Alert>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'nowrap' }}>
        <BlogFilter
          onChange={setFilter}
          authors={authors}
          categories={categories}
          tags={tags}
        />
        <Button variant="primary" onClick={handleAdd} style={{ height: 40 }}>
          + Add Blog
        </Button>
      </div>
      <BlogTable
        data={blogs}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        pagination={{
          current: currentPage,
          pageSize: PAGE_SIZE,
          total,
          showTotal: (t) => `Total ${t} blogs`,
        }}
        onChange={handleTableChange}
      />
      <BlogModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleModalOk}
        initialValues={editingBlog}
      />
      {/* Bootstrap Modal xác nhận */}
      <Modal show={confirmModal.show} onHide={handleCancelConfirm} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {confirmModal.type === 'delete' && 'Confirm delete blog'}
            {confirmModal.type === 'add' && 'Confirm add blog'}
            {confirmModal.type === 'edit' && 'Confirm edit blog'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirmModal.type === 'delete' && 'Are you sure you want to delete this blog?'}
          {confirmModal.type === 'add' && 'Are you sure you want to add this blog?'}
          {confirmModal.type === 'edit' && 'Are you sure you want to edit this blog?'}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelConfirm}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ManageBlog;
