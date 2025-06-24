import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Button, 
  Form, 
  Input, 
  Select, 
  Card, 
  Divider, 
  notification,
  Spin,
  Empty
} from 'antd';
import { 
  ShoppingCartOutlined, 
  UserOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  CreditCardOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../context/AuthContext';
import { useCartLoggedIn } from '../../context/CartLoggedInContext';
import '../../css/checkout/checkout.css';
import { getAllVoucherByUser, createOrder } from '../../services/api';


const { Option } = Select;
const { TextArea } = Input;

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCartLoggedIn();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const [voucherList, setVoucherList] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  // Tính tổng tiền đơn hàng
  const calculateBaseTotal = (items) => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.product.price);
      const discountedPrice = item.product.discount > 0
        ? price - (price * item.product.discount / 100)
        : price;
      return sum + (discountedPrice * item.quantity);
    }, 0);
  };

  // Tính giảm giá từ voucher
  const calculateDiscount = (baseTotal, voucher) => {
    if (!voucher) return 0;
    return voucher.type === 'percent'
      ? (baseTotal * voucher.value) / 100
      : voucher.value;
  };

  // Format tiền
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  // Khi mount
  useEffect(() => {
    let items = [];

    if (location.state?.products) {
      items = location.state.products;
    } else if (cart.items.length > 0) {
      items = cart.items.map(item => ({
        productId: item.productId._id,
        quantity: item.quantity,
        product: item.productId
      }));
    } else {
      notification.warning({
        message: 'Giỏ hàng trống',
        description: 'Vui lòng thêm sản phẩm trước khi thanh toán',
        placement: 'topRight',
      });
      navigate('/products');
      return;
    }

    setCheckoutItems(items);
    const baseTotal = calculateBaseTotal(items);
    setTotalAmount(baseTotal);
    setFinalAmount(baseTotal); // default ban đầu chưa có giảm giá

    if (user) {
      form.setFieldsValue({
        fullName: user.name || '',
        phone: user.phone || '',
      });
      fetchVouchers();
    }
  }, [location.state, cart, user, form, navigate]);

  const fetchVouchers = async () => {
    try {
      const res = await getAllVoucherByUser();
      const vouchers = res.data.data || [];
      setVoucherList(vouchers);
    } catch (err) {
      console.error("Lỗi lấy voucher:", err);
      setVoucherList([]);
    }
  };

  const handleVoucherChange = (voucherId) => {
    const found = voucherList.find(v => v._id === voucherId);
    setSelectedVoucher(found || null);

    const base = calculateBaseTotal(checkoutItems);
    const discount = calculateDiscount(base, found);
    const final = Math.max(0, base - discount);
    setTotalAmount(base);
    setDiscountAmount(discount);
    setFinalAmount(final);
  };

  const handleSubmit = async (values) => {
    if (!user) {
      notification.error({
        message: 'Vui lòng đăng nhập',
        description: 'Bạn cần đăng nhập để thanh toán',
        placement: 'topRight',
      });
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shippingAddress: values.address,
        voucherId: selectedVoucher?._id || undefined,
        paymentMethod: values.paymentMethod,
        items: checkoutItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      const res = await createOrder(orderData);
      await clearCart();

      notification.success({
        message: 'Đặt hàng thành công!',
        description: 'Cảm ơn bạn đã mua hàng.',
        placement: 'topRight',
      });
    } catch (error) {
      console.error(error);
      notification.error({
        message: 'Lỗi đặt hàng',
        description: error.response?.data?.message || 'Thử lại sau!',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkoutItems.length === 0) {
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

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
          className="back-button"
        >
          Quay lại
        </Button>
        <h1>Thanh toán</h1>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-section">
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="address"
                label="Địa chỉ giao hàng"
                rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
              >
                <TextArea placeholder="Nhập địa chỉ chi tiết" rows={3} />
              </Form.Item>

              <Form.Item label="Chọn voucher">
                <Select
                  placeholder="Chọn voucher"
                  onChange={handleVoucherChange}
                  allowClear
                  size="large"
                >
                  {voucherList.map(v => (
                    <Option key={v._id} value={v._id}>
                      {v.code} - {v.name} - Giảm {v.type === 'percent' ? `${v.value}%` : formatPrice(v.value)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: 'Chọn phương thức thanh toán!' }]}
              >
                <Select placeholder="Chọn phương thức" size="large">
                  <Option value="cash">Thanh toán khi nhận hàng</Option>
                  <Option value="bank">Chuyển khoản ngân hàng</Option>
                  <Option value="momo">Ví MoMo</Option>
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

        <div className="checkout-summary-section">
          <Card title="Đơn hàng của bạn" className="checkout-card">
            <div className="checkout-products-list">
              <div className="checkout-products-header">
                <div>Ảnh</div>
                <div>Tên sản phẩm</div>
                <div>Số lượng</div>
                <div>Giá</div>
              </div>
              {checkoutItems.map((item, index) => (
                <div key={index} className="checkout-product-row">
                  <div className="checkout-product-image">
                    <img src={item.product.image} alt={item.product.name} />
                  </div>
                  <div className="checkout-product-name">{item.product.name}</div>
                  <div className="checkout-product-quantity">x{item.quantity}</div>
                  <div className="checkout-product-price">
                    {item.product.discount > 0 ? (
                      <>
                        <span className="original-price">{formatPrice(item.product.price)}</span>
                        <span className="discounted-price">
                          {formatPrice(item.product.price * (1 - item.product.discount / 100))}
                        </span>
                      </>
                    ) : (
                      <span className="current-price">{formatPrice(item.product.price)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            {/* Tổng kết */}
            <div className="order-summary">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Giảm giá:</span>
                <span>- {formatPrice(discountAmount)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>
              <div className="summary-row total">
                <strong>Tổng cộng:</strong>
                <strong>{formatPrice(finalAmount)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
