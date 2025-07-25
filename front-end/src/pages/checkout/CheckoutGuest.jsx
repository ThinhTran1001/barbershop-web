// src/pages/checkout/CheckoutGuest.jsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Form,
  Input,
  Card,
  Divider,
  notification,
  Empty,
  Select
} from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createOrderGuest } from '../../services/api';   // ✅ dùng chung API
import '../../css/checkout/checkout.css';

const { TextArea } = Input;
const { Option } = Select;

export default function CheckoutGuest() {
  const { cart, clearCart } = useCart();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [addressDetail, setAddressDetail] = useState("");

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetch(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`)
        .then(res => res.json())
        .then(data => setDistricts(data.districts || []));
    } else {
      setDistricts([]);
      setWards([]);
    }
    setSelectedDistrict(null);
    setSelectedWard(null);
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`)
        .then(res => res.json())
        .then(data => setWards(data.wards || []));
    } else {
      setWards([]);
    }
    setSelectedWard(null);
  }, [selectedDistrict]);

  /* ------------------ Lấy danh sách sản phẩm cần thanh toán ------------------ */
  const buyNowItems = location.state?.products;
  const itemsToCheckout = buyNowItems?.length ? buyNowItems : cart.items;

  /* ------------------ Helper ------------------ */
  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const getTotal = () =>
    itemsToCheckout.reduce((sum, item) => {
      const raw = item.price ?? item.product?.price ?? 0;
      const disc = item.discount ?? item.product?.discount ?? 0;
      const price = disc ? raw * (1 - disc / 100) : raw;
      return sum + price * item.quantity;
    }, 0);

  /* ------------------ Submit ------------------ */
  const handleSubmit = async (values) => {
  if (!itemsToCheckout.length) {
    notification.warning({
      message: 'Giỏ hàng trống',
      description: 'Vui lòng thêm sản phẩm trước khi thanh toán',
      placement: 'topRight'
    });
    return;
  }

  if (!selectedProvince || !selectedDistrict || !selectedWard || !addressDetail) {
    notification.warning({
      message: 'Thiếu thông tin địa chỉ',
      description: 'Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện, Phường/Xã và nhập địa chỉ chi tiết!',
      placement: 'topRight'
    });
    return;
  }

  setLoading(true);
  try {
    const orderItems = itemsToCheckout.map((i) => ({
      productId: i.productId || i.id || i._id || i.product?._id,
      quantity: i.quantity
    }));

    const fullAddress = `${addressDetail}, ${selectedWard?.name}, ${selectedDistrict?.name}, ${selectedProvince?.name}`;

    const orderData = {
      customerName: values.name,
      customerEmail: values.email,
      customerPhone: values.phone,
      shippingAddress: fullAddress,
      paymentMethod: values.paymentMethod,
      items: orderItems
    };

    const res = await createOrderGuest(orderData);

    // ✅ Nếu là bank transfer => redirect sang PayOS
    if (values.paymentMethod === 'bank' && res.data?.redirectUrl) {
      // Lưu đơn tạm (guest không có userId nên không cần truyền userId)
      localStorage.setItem("pendingOrder", JSON.stringify(res.data.orderDraft || {}));

      window.location.href = res.data.redirectUrl;
      return; // dừng không thực hiện success ở dưới
    }

    // Nếu thanh toán COD (cash)
    if (!buyNowItems?.length) clearCart();
    setOrderSuccess(true);

    notification.success({
      message: 'Đặt hàng thành công!',
      description: 'Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.',
      placement: 'topRight'
    });
  } catch (err) {
    notification.error({
      message: 'Lỗi đặt hàng',
      description: err.response?.data?.message || 'Vui lòng thử lại sau!',
      placement: 'topRight'
    });
  } finally {
    setLoading(false);
  }
};


  /* ------------------ UI khi thành công ------------------ */
  if (orderSuccess) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Đặt hàng thành công!"
        >
          <Button type="primary" onClick={() => navigate('/')}>
            Về trang chủ
          </Button>
        </Empty>
      </div>
    );
  }

  /* ------------------ UI khi không có sản phẩm ------------------ */
  if (!itemsToCheckout.length) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
          description="Không có sản phẩm để thanh toán"
        >
          <Button type="primary" onClick={() => navigate('/products')}>
            Tiếp tục mua sắm
          </Button>
        </Empty>
      </div>
    );
  }

  /* ------------------ Giao diện chính ------------------ */
  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Thanh toán</h1>
      </div>

      <div className="checkout-content">
        {/* FORM THÔNG TIN KHÁCH */}
        <div className="checkout-form-section">
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ tên!' },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Họ tên không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: 'Vui lòng nhập số điện thoại!' },
                  { pattern: /^[0-9]{10}$/, message: 'Số điện thoại phải đủ 10 chữ số' },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Số điện thoại không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Email không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              <Form.Item
                name="province"
                label="Tỉnh/Thành phố"
                rules={[{ required: true, message: 'Chọn tỉnh/thành phố!' }]}
              >
                <Select
                  placeholder="Chọn tỉnh/thành phố"
                  onChange={code => {
                    const province = provinces.find(p => p.code === code);
                    setSelectedProvince(province);
                  }}
                  value={selectedProvince?.code}
                  showSearch
                  optionFilterProp="children"
                >
                  {provinces.map(p => <Option key={p.code} value={p.code}>{p.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item
                name="district"
                label="Quận/Huyện"
                rules={[{ required: true, message: 'Chọn quận/huyện!' }]}
              >
                <Select
                  placeholder="Chọn quận/huyện"
                  onChange={code => {
                    const district = districts.find(d => d.code === code);
                    setSelectedDistrict(district);
                  }}
                  value={selectedDistrict?.code}
                  disabled={!selectedProvince}
                  showSearch
                  optionFilterProp="children"
                >
                  {districts.map(d => <Option key={d.code} value={d.code}>{d.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item
                name="ward"
                label="Phường/Xã"
                rules={[{ required: true, message: 'Chọn phường/xã!' }]}
              >
                <Select
                  placeholder="Chọn phường/xã"
                  onChange={code => {
                    const ward = wards.find(w => w.code === code);
                    setSelectedWard(ward);
                  }}
                  value={selectedWard?.code}
                  disabled={!selectedDistrict}
                  showSearch
                  optionFilterProp="children"
                >
                  {wards.map(w => <Option key={w.code} value={w.code}>{w.name}</Option>)}
                </Select>
              </Form.Item>
              <Form.Item
                name="addressDetail"
                label="Địa chỉ chi tiết"
                rules={[
                  { required: true, message: 'Nhập địa chỉ chi tiết!' },
                  { validator: (_, value) => value && value.trim() !== '' ? Promise.resolve() : Promise.reject('Địa chỉ không được để trống hoặc chỉ chứa khoảng trắng!') }
                ]}
              >
                <Input
                  placeholder="Số nhà, tên đường..."
                  value={addressDetail}
                  onChange={e => setAddressDetail(e.target.value)}
                />
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Vui lòng chọn phương thức!' }]}
              >
                <Select placeholder="Chọn phương thức">
                  <Option value="cash">Thanh toán khi nhận hàng</Option>
                  <Option value="bank">Chuyển khoản ngân hàng</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  block
                >
                  Đặt hàng ngay
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* TÓM TẮT ĐƠN HÀNG */}
        <div className="checkout-summary-section">
          <Card title="Đơn hàng của bạn" className="checkout-card">
            <div className="checkout-products-list">
              <div className="checkout-products-header">
                <div>Ảnh</div>
                <div>Tên sản phẩm</div>
                <div>Số lượng</div>
                <div>Giá</div>
              </div>

              {itemsToCheckout.map((item, idx) => (
                <div key={idx} className="checkout-product-row">
                  <div className="checkout-product-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="checkout-product-name">{item.name}</div>
                  <div className="checkout-product-quantity">x{item.quantity}</div>
                  <div className="checkout-product-price">
                    {item.discount > 0 ? (
                      <>
                        <span className="original-price">{formatPrice(item.price)}</span>
                        <span className="discounted-price">
                          {formatPrice(item.price * (1 - item.discount / 100))}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">{formatPrice(item.price)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(getTotal())}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <strong>Tổng cộng:</strong>
                <strong>{formatPrice(getTotal())}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
