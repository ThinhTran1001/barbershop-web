import React, { useState, useEffect } from 'react';
import BlogTable from '../../components/ManageBlog/BlogTable';
import BlogModal from '../../components/ManageBlog/BlogModal';
import BlogFilter from '../../components/ManageBlog/BlogFilter';
import { getAllBlogs, createBlog, updateBlog, deleteBlog, getAllUser, getCategories, createCategory } from '../../services/api';
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
      console.log('Filter object:', cleanFilter);
      const res = await getAllBlogs({
        ...cleanFilter,
        page,
        limit: PAGE_SIZE,
      });
      let blogs = res.data?.data || [];
      console.log('Fetched blogs:', blogs);
      // Đảm bảo filter.tags hoặc filter.tag là mảng
      let filterTags = cleanFilter.tags || cleanFilter.tag;
      if (typeof filterTags === 'string') filterTags = [filterTags];
      if (filterTags && filterTags.length > 0) {
        const filterTagsLower = filterTags.map(t => t.toLowerCase());
        blogs = blogs.filter(blog =>
          Array.isArray(blog.tags) && blog.tags.some(tag => filterTagsLower.includes((tag || '').toLowerCase()))
        );
        console.log('Filtered blogs:', blogs);
      }
      // Lọc theo ngày nếu có
      if (cleanFilter.startDate || cleanFilter.endDate) {
        const start = cleanFilter.startDate ? new Date(cleanFilter.startDate) : null;
        const end = cleanFilter.endDate ? new Date(cleanFilter.endDate) : null;
        blogs = blogs.filter(blog => {
          const blogDate = blog.date ? new Date(blog.date) : (blog.createdAt ? new Date(blog.createdAt) : null);
          if (!blogDate) return false;
          if (start && blogDate < start) return false;
          if (end && blogDate > end) return false;
          return true;
        });
        console.log('Filtered by date:', blogs);
      }
      setBlogs(blogs);
      setTotal(res.data?.total || blogs.length);
    } catch {
      showAlert('danger', 'Failed to load blog list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    // Chuyển đổi dateRange thành startDate, endDate
    let filterObj = { ...filter };
    if (filterObj.dateRange && Array.isArray(filterObj.dateRange) && filterObj.dateRange.length === 2) {
      filterObj.startDate = filterObj.dateRange[0]?.startOf('day').toISOString();
      filterObj.endDate = filterObj.dateRange[1]?.endOf('day').toISOString();
    }
    fetchBlogs(1, filterObj);
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
    } else if (confirmModal.type === 'add' || confirmModal.type === 'edit') {
      try {
        // Tạo category mới nếu cần
        const blogData = { ...confirmModal.data };
        if (Array.isArray(blogData.categories)) {
          const existingNames = categories.map(c => c.name.toLowerCase());
          for (const cat of blogData.categories) {
            if (!existingNames.includes(cat.toLowerCase())) {
              await createCategory({ name: cat });
            }
          }
        }
        if (confirmModal.type === 'add') {
          await createBlog(blogData);
          showAlert('success', 'Blog created successfully');
        } else {
          await updateBlog(editingBlog._id, blogData);
          showAlert('success', 'Blog updated successfully');
        }
        setModalVisible(false);
        fetchBlogs();
        // Fetch lại categories sau khi thêm/sửa blog
        const catRes = await getCategories();
        setCategories(catRes.data || []);
      } catch {
        showAlert('danger', confirmModal.type === 'add' ? 'Create blog failed' : 'Update blog failed');
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
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        initialValues={editingBlog}
        tags={tags}
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
