import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  Form,
  Input,
  Card,
  Divider,
  notification,
  Empty,
  Select,
} from "antd";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useUserCart } from "../../context/UserCartContext";
import {
  createOrder,
  getVoucherByUser,
  getProfile,
} from "../../services/api";
import "../../css/checkout/checkout.css";
import { useAuth } from "../../context/AuthContext";

const { TextArea } = Input;
const { Option } = Select;

const Checkout = () => {
  /* --------------------------- App Contexts & Hooks --------------------------- */
  const { cart, clearCart } = useUserCart();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  /* --------------------------------- States --------------------------------- */
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [selectedVoucher, setSelectedVoucher] = useState(null);

  /* ----------------------------- Derived values ------------------------------ */
  const buyNowItems = location.state?.products;
  const itemsToCheckout = buyNowItems?.length ? buyNowItems : cart.items;

  const subtotal = useMemo(
    () =>
      itemsToCheckout.reduce((sum, item) => {
        const raw = item.price || item.product?.price || 0;
        const discount = item.discount || item.product?.discount || 0;
        const price = discount > 0 ? raw * (1 - discount / 100) : raw;
        return sum + price * item.quantity;
      }, 0),
    [itemsToCheckout]
  );

  const voucherDiscount = useMemo(() => {
    if (!selectedVoucher) return 0;
    
    // Kiểm tra điều kiện áp dụng voucher
    if (selectedVoucher.minOrderAmount && subtotal < selectedVoucher.minOrderAmount) {
      return 0;
    }
    
    // Kiểm tra giới hạn sử dụng
    if (selectedVoucher.usageLimit && selectedVoucher.usedCount >= selectedVoucher.usageLimit) {
      return 0;
    }
    
    // Tính giảm giá
    const discount = selectedVoucher.type === "percent"
      ? (subtotal * selectedVoucher.value) / 100
      : selectedVoucher.value;
    
    // Đảm bảo không giảm quá subtotal
    return Math.min(discount, subtotal);
  }, [selectedVoucher, subtotal]);

  const grandTotal = Math.max(0, subtotal - voucherDiscount);

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const handleSubmit = async (values) => {
    if (itemsToCheckout.length === 0) {
      notification.warning({
        message: "Giỏ hàng trống",
        description: "Vui lòng thêm sản phẩm trước khi thanh toán",
        placement: "topRight",
      });
      return;
    }
  
    setLoading(true);
  
    try {
      // Tính toán lại để đảm bảo chính xác
      const originalSubtotal = itemsToCheckout.reduce((sum, item) => {
        const rawPrice = item.price || item.product?.price || 0;
        return sum + rawPrice * item.quantity;
      }, 0);

      const discountedSubtotal = itemsToCheckout.reduce((sum, item) => {
        const rawPrice = item.price || item.product?.price || 0;
        const discount = item.discount || item.product?.discount || 0;
        const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;
        return sum + finalPrice * item.quantity;
      }, 0);

      // Tính voucher discount dựa trên giá sau khi giảm sản phẩm
      let finalVoucherDiscount = 0;
      if (selectedVoucher) {
        if (selectedVoucher.minOrderAmount && discountedSubtotal < selectedVoucher.minOrderAmount) {
          notification.warning({
            message: "Voucher không hợp lệ",
            description: `Đơn hàng tối thiểu phải ${formatPrice(selectedVoucher.minOrderAmount)} để sử dụng voucher này`,
            placement: "topRight",
          });
          setLoading(false);
          return;
        }
        
        if (selectedVoucher.usageLimit && selectedVoucher.usedCount >= selectedVoucher.usageLimit) {
          notification.warning({
            message: "Voucher đã hết lượt sử dụng",
            description: "Voucher này đã được sử dụng hết số lượt cho phép",
            placement: "topRight",
          });
          setLoading(false);
          return;
        }

        finalVoucherDiscount = selectedVoucher.type === "percent"
          ? (discountedSubtotal * selectedVoucher.value) / 100
          : selectedVoucher.value;
        
        finalVoucherDiscount = Math.min(finalVoucherDiscount, discountedSubtotal);
      }

      const finalTotal = Math.max(0, discountedSubtotal - finalVoucherDiscount);

      const orderItems = itemsToCheckout.map((item) => {
        const rawPrice = item.price || item.product?.price || 0;
        const discount = item.discount || item.product?.discount || 0;
        const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;
  
        return {
          productId: item.productId || item.id || item._id || item.product?._id,
          quantity: item.quantity,
          price: finalPrice, // Giá sau khi giảm sản phẩm
          originalPrice: rawPrice, // Giá gốc để backend có thể tính toán
        };
      });
  
      const orderData = {
        customerName: values.name,
        customerEmail: values.email,
        customerPhone: values.phone,
        shippingAddress: values.address,
        paymentMethod: values.paymentMethod,
        items: orderItems,
        voucherId: selectedVoucher ? selectedVoucher._id || selectedVoucher.id : undefined,
        originalSubtotal, // Tổng giá gốc
        discountedSubtotal, // Tổng giá sau giảm sản phẩm
        voucherDiscount: finalVoucherDiscount, // Số tiền giảm từ voucher
        totalAmount: finalTotal, // Tổng cuối cùng
      };
  
      await createOrder(orderData);
  
      // Xóa giỏ hàng khi đặt hàng thành công (nếu không phải mua ngay)
      if (!buyNowItems?.length) clearCart();
  
      setOrderSuccess(true);
      notification.success({
        message: "Đặt hàng thành công!",
        description: "Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.",
        placement: "topRight",
      });
    } catch (error) {
      console.error(error);
      notification.error({
        message: "Lỗi đặt hàng",
        description: error.response?.data?.message || "Vui lòng thử lại sau!",
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------- Fetch user/vc ------------------------------ */
  useEffect(() => {
    const initData = async () => {
      if (!user) return;

      /* ---- Điền sẵn thông tin ---- */
      const ui = { name: user.name || "", email: user.email || "", phone: user.phone || "" };
      if (!ui.name || !ui.phone) {
        try {
          const profileRes = await getProfile();
          const p = profileRes.data?.data || profileRes.data;
          ui.name = p.name || ui.name;
          ui.email = p.email || ui.email;
          ui.phone = p.phone || ui.phone;
        } catch (e) {
          console.error("Err profile", e);
        }
      }
      form.setFieldsValue(ui);

      /* ---- Lấy voucher ---- */
      try {
        const res = await getVoucherByUser();
        setVouchers(res.data?.data || []);
      } catch (e) {
        console.error("Err vouchers", e);
        setVouchers([]);
      }
    };

    initData();
  }, [user, form]);

  /* ------------------------------ Empty / Success --------------------------- */
  if (orderSuccess) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description="Đặt hàng thành công!"
        >
          <Button type="primary" onClick={() => navigate("/")}>Về trang chủ</Button>
        </Empty>
      </div>
    );
  }

  if (!itemsToCheckout.length) {
    return (
      <div className="checkout-empty">
        <Empty
          image={<ShoppingCartOutlined style={{ fontSize: 64, color: "#d9d9d9" }} />}
          description="Không có sản phẩm để thanh toán"
        >
          <Button type="primary" onClick={() => navigate("/products")}>Tiếp tục mua sắm</Button>
        </Empty>
      </div>
    );
  }

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="checkout-container">
      {/* --------------------------- HEADER --------------------------- */}
      <div className="checkout-header">
        <h1>Thanh toán (Khách)</h1>
      </div>

      <div className="checkout-content">
        {/* ================= FORM ================= */}
        <div className="checkout-form-section">
          <Card title="Thông tin giao hàng" className="checkout-card">
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              {/* Họ tên */}
              <Form.Item
                name="name"
                label="Họ và tên"
                rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              {/* Điện thoại */}
              <Form.Item
                name="phone"
                label="Số điện thoại"
                rules={[
                  { required: true, message: "Vui lòng nhập số điện thoại!" },
                  { pattern: /^[0-9]{10}$/, message: "Số điện thoại phải đủ 10 chữ số" },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              {/* Email */}
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Vui lòng nhập email!" },
                  { type: "email", message: "Email không hợp lệ!" },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>

              {/* Địa chỉ */}
              <Form.Item
                name="address"
                label="Địa chỉ giao hàng"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
              >
                <TextArea placeholder="Nhập địa chỉ chi tiết" rows={3} />
              </Form.Item>

              {/* Voucher */}
              <Form.Item name="voucher" label="Mã giảm giá (Voucher)">
                <Select
                  placeholder="Chọn voucher nếu có"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  onChange={(code) => {
                    const found = vouchers.find((v) => v.code === code) || null;
                    setSelectedVoucher(found);
                    
                    // Thông báo nếu voucher không hợp lệ
                    if (found) {
                      if (found.minOrderAmount && subtotal < found.minOrderAmount) {
                        notification.warning({
                          message: "Voucher không hợp lệ",
                          description: `Đơn hàng tối thiểu phải ${formatPrice(found.minOrderAmount)} để sử dụng voucher này`,
                          placement: "topRight",
                        });
                      } else if (found.usageLimit && found.usedCount >= found.usageLimit) {
                        notification.warning({
                          message: "Voucher đã hết lượt sử dụng",
                          description: "Voucher này đã được sử dụng hết số lượt cho phép",
                          placement: "topRight",
                        });
                      }
                    }
                  }}
                >
                  {vouchers.length === 0 ? (
                    <Option value="__none__" disabled>
                      Không có voucher khả dụng
                    </Option>
                  ) : (
                    vouchers.map((v) => {
                      const isValid = (!v.minOrderAmount || subtotal >= v.minOrderAmount) && 
                                     (!v.usageLimit || !v.usedCount || v.usedCount < v.usageLimit);
                      return (
                        <Option key={v._id || v.id} value={v.code} disabled={!isValid}>
                          {v.code} - {v.type === "percent" ? `${v.value}%` : `${v.value.toLocaleString("vi-VN")} VND`}
                          {!isValid && " (Không khả dụng)"}
                        </Option>
                      );
                    })
                  )}
                </Select>
              </Form.Item>

              {/* Payment */}
              <Form.Item
                name="paymentMethod"
                label="Phương thức thanh toán"
                rules={[{ required: true, message: "Vui lòng chọn phương thức!" }]}
              >
                <Select placeholder="Chọn phương thức">
                  <Option value="cash">Thanh toán khi nhận hàng</Option>
                  <Option value="bank">Chuyển khoản ngân hàng</Option>
                  <Option value="momo">Ví MoMo</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" size="large" loading={loading} block>
                  Đặt hàng ngay
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="checkout-summary-section">
          <Card title="Đơn hàng của bạn" className="checkout-card">
            {/* Danh sách sản phẩm */}
            <div className="checkout-products-list">
              <div className="checkout-products-header">
                <div>Ảnh</div>
                <div>Tên sản phẩm</div>
                <div>Số lượng</div>
                <div>Giá</div>
              </div>

              {itemsToCheckout.map((item, idx) => {
                const rawPrice = item.price || item.product?.price || 0;
                const discount = item.discount || item.product?.discount || 0;
                const finalPrice = discount > 0 ? rawPrice * (1 - discount / 100) : rawPrice;
                return (
                  <div key={idx} className="checkout-product-row">
                    <div className="checkout-product-image">
                      <img src={item.image || item.product?.image} alt={item.name || item.product?.name} />
                    </div>
                    <div className="checkout-product-name">{item.name || item.product?.name}</div>
                    <div className="checkout-product-quantity">x{item.quantity}</div>
                    <div className="checkout-product-price">
                      {discount > 0 ? (
                        <>
                          <span className="original-price">{formatPrice(rawPrice)}</span>
                          <span className="discounted-price">{formatPrice(finalPrice)}</span>
                        </>
                      ) : (
                        <span className="current-price">{formatPrice(rawPrice)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Divider />

            <div className="order-summary">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              {selectedVoucher && voucherDiscount > 0 && (
                <div className="summary-row">
                  <span>Voucher ({selectedVoucher.code}):</span>
                  <span>-{formatPrice(voucherDiscount)}</span>
                </div>
              )}
              
              {selectedVoucher && voucherDiscount === 0 && (
                <div className="summary-row">
                  <span>Voucher ({selectedVoucher.code}):</span>
                  <span style={{ color: '#ff4d4f' }}>Không áp dụng được</span>
                </div>
              )}

              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>Miễn phí</span>
              </div>

              <div className="summary-row total">
                <strong>Tổng cộng:</strong>
                <strong>{formatPrice(grandTotal)}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
