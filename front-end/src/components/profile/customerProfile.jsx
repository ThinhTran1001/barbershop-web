import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getProfile, updateProfile } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Spin, Button, Input, Modal, Form } from 'antd';
import { toast, ToastContainer, Zoom } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../css/profile/customerprofile.css';

import defaultAvatar from '../../assets/images/nguyen.jpg';

const imageMap = {
  '/assets/images/nguyen.jpg': defaultAvatar,
};

const getImage = (imagePath) => {
  if (!imagePath) return '';
  if (imageMap[imagePath]) return imageMap[imagePath];
  if (imagePath.startsWith('/assets')) return imagePath.substring(1);
  if (imagePath.startsWith('http')) return imagePath;
  return '';
};

const CustomerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editField, setEditField] = useState(null);
  const [fieldValue, setFieldValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // State cho modal đổi mật khẩu
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.warn('Vui lòng đăng nhập để xem thông tin cá nhân.');
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      const data = res.data;
      setProfile(data.data || data.user);
    } catch (err) {
      console.error('Lỗi khi gọi getProfile:', err);
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError(err?.response?.data?.message || 'Lỗi kết nối server!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (field, currentValue) => {
    setEditField(field);
    setFieldValue(currentValue || '');
  };

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append(editField, fieldValue);
      await updateProfile(formData);
      toast.success('Cập nhật thành công');
      setProfile(prev => ({ ...prev, [editField]: fieldValue }));
      setEditField(null);
    } catch (err) {
      console.error(err);
      toast.error('Cập nhật thất bại');
    }
  };

  const handleCancel = () => {
    setEditField(null);
    setFieldValue('');
  };

  // Xử lý đổi mật khẩu
  const handleChangePassword = async () => {
    try {
      setPasswordLoading(true);
      const values = await passwordForm.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        toast.error('Mật khẩu mới và xác nhận không khớp');
        setPasswordLoading(false);
        return;
      }
      // Gửi password mới qua API
      await updateProfile({ password: values.newPassword });
      toast.success('Đổi mật khẩu thành công');
      setShowPasswordModal(false);
      passwordForm.resetFields();
    } catch (err) {
      if (err.errorFields) return; // Lỗi validate form
      toast.error('Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderAvatar = () => {
    const src = getImage(profile?.avatarUrl || profile?.profileImage);
    return (
      <img src={src} alt="avatar" className="customer-profile__avatar" />
    );
  };

  const renderField = (label, value, key) => {
    const isEditing = editField === key;
    const isEmpty = !value;

    return (
      <div className="customer-profile__field" key={key}>
        <span className="customer-profile__field-label"><b>{label}:</b></span>
        <span className="customer-profile__field-value">
          {isEditing ? (
            <>
              <Input
                size="small"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                style={{ width: 180, marginRight: 8 }}
              />
              <Button size="small" type="primary" onClick={handleSave}>Lưu</Button>
              <Button size="small" onClick={handleCancel} style={{ marginLeft: 4 }}>Huỷ</Button>
            </>
          ) : (
            <>
              {value || <span className="customer-profile__field-value--empty">Chưa cập nhật</span>}
              {(isEmpty || (key !== 'email' && key !== 'role' && key !== 'status')) && (
                <Button
                  type="link"
                  size="small"
                  className="customer-profile__edit-button"
                  onClick={() => handleEditClick(key, value)}
                >
                  Chỉnh sửa
                </Button>
              )}
            </>
          )}
        </span>
      </div>
    );
  };

  const renderPasswordField = () => (
    <div className="customer-profile__field" key="password">
      <span className="customer-profile__field-label"><b>Mật khẩu:</b></span>
      <span className="customer-profile__field-value">
        <Input.Password value={"********"} disabled style={{ width: 180, fontWeight: 'bold' }} />
        <Button size="small" type="link" onClick={() => setShowPasswordModal(true)} style={{ marginLeft: 8 }}>
          Đổi mật khẩu
        </Button>
      </span>
    </div>
  );

  if (authLoading || loading) return <Spin tip="Đang tải thông tin..." />;
  if (error) {
    return (
      <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>
        <p>{error}</p>
        <Button onClick={() => navigate('/login')} type="primary">Đăng nhập lại</Button>
      </div>
    );
  }

  if (!profile) return null;

  const { name, email, phone, address, role, status } = profile;

  return (
    <div className="customer-profile">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss={false}
        draggable={false}
        pauseOnHover={false} transition={Zoom}  style={{ marginTop: '80px' }} />
      <h2 className="customer-profile__title">Thông tin cá nhân</h2>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {renderAvatar()}
      </div>
      <div className="customer-profile__info">
        {renderField('Họ tên', name, 'name')}
        {renderField('Email', email, 'email')}
        {renderField('Số điện thoại', phone, 'phone')}
        {renderPasswordField()}
        {renderField('Vai trò', role || 'customer', 'role')}
        {renderField('Trạng thái', status === 'active' ? 'Đang hoạt động' : 'Chưa kích hoạt', 'status')}
      </div>
      {/* Modal đổi mật khẩu */}
      <Modal
        open={showPasswordModal}
        title="Đổi mật khẩu"
        onCancel={() => { setShowPasswordModal(false); passwordForm.resetFields(); }}
        onOk={handleChangePassword}
        confirmLoading={passwordLoading}
        okText="Đổi mật khẩu"
        cancelText="Huỷ"
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="Mật khẩu cũ"
            name="oldPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu mới' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomerProfile;
