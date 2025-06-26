# User Cart Components - Barbershop Web

## Tổng quan

Đã tạo các component cart riêng biệt cho user đã đăng nhập với UI đẹp và đầy đủ tính năng.

## Các Component đã tạo

### 1. **UserCart.jsx** - Trang cart chính cho user đã đăng nhập
- **File**: `src/components/cart/UserCart.jsx`
- **CSS**: `src/css/cart/user-cart.css`
- **Tính năng**:
  - Header với thông tin user và avatar
  - Danh sách sản phẩm với layout responsive
  - Tóm tắt đơn hàng với tính toán chi tiết
  - Thông tin bảo mật và chính sách
  - Hỗ trợ discount và hiển thị giá gốc/giá khuyến mãi

### 2. **UserCartMini.jsx** - Mini cart popup cho user đã đăng nhập
- **File**: `src/components/cart/UserCartMini.jsx`
- **CSS**: `src/css/cart/user-cart-mini.css`
- **Tính năng**:
  - Header nhỏ gọn với thông tin user
  - Danh sách 3 sản phẩm đầu tiên
  - Tổng tiền và nút checkout
  - Thông tin bảo mật ngắn gọn

## Cách sử dụng

### Import components
```javascript
import UserCart from '../components/cart/UserCart';
import UserCartMini from '../components/cart/UserCartMini';
```

### Sử dụng trong route
```javascript
// Trong route.jsx hoặc component khác
{ path: "/user-cart", element: <UserCart /> }
```

### Sử dụng trong header
```javascript
// Trong header component
import UserCartMini from '../components/cart/UserCartMini';

// Hiển thị khi user đã đăng nhập
{user && <UserCartMini />}
```

## Tính năng chính

### UserCart.jsx
- ✅ **Header thông tin user**: Avatar, tên, số sản phẩm trong giỏ
- ✅ **Layout responsive**: 2 cột trên desktop, 1 cột trên mobile
- ✅ **Danh sách sản phẩm**: Hình ảnh, tên, giá, số lượng, tổng
- ✅ **Tính toán chi tiết**: Tạm tính, tiết kiệm, phí vận chuyển, tổng cộng
- ✅ **Hỗ trợ discount**: Hiển thị giá gốc, giá khuyến mãi, % giảm
- ✅ **Thông tin bảo mật**: SSL, miễn phí vận chuyển, đổi trả
- ✅ **Empty state**: Khi giỏ hàng trống
- ✅ **Animations**: Hover effects, transitions

### UserCartMini.jsx
- ✅ **Header nhỏ gọn**: Avatar, tên user, badge số sản phẩm
- ✅ **Danh sách 3 sản phẩm**: Hình ảnh, tên, giá, số lượng
- ✅ **Tổng tiền**: Hiển thị tổng cộng
- ✅ **Actions**: Nút xem giỏ hàng và thanh toán
- ✅ **Thông tin bảo mật**: Ngắn gọn
- ✅ **Scrollable**: Khi có nhiều sản phẩm
- ✅ **Responsive**: Tự động điều chỉnh kích thước

## Styling

### UserCart.css
- **Layout**: Grid system với Row/Col
- **Cards**: Border radius, shadows, hover effects
- **Colors**: Gradient header, consistent color scheme
- **Typography**: Hierarchy rõ ràng với Title/Text
- **Responsive**: Breakpoints cho tablet và mobile
- **Animations**: Smooth transitions và hover effects

### UserCartMini.css
- **Fixed width**: 320px (280px trên mobile)
- **Max height**: 500px với scroll
- **Compact design**: Tối ưu cho popup
- **Smooth animations**: Slide in effect
- **Custom scrollbar**: Styled webkit scrollbar

## Props và Dependencies

### Required Dependencies
```javascript
// Context
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

// Ant Design
import { Card, Row, Col, Typography, Space, Badge, Avatar, Tag } from 'antd';

// Icons
import { ShoppingCartOutlined, UserOutlined, GiftOutlined } from '@ant-design/icons';

// Router
import { useNavigate } from 'react-router-dom';
```

### Context Requirements
- **CartContext**: Cung cấp cart state và actions
- **AuthContext**: Cung cấp user information

## Responsive Design

### Desktop (≥992px)
- 2 cột layout: Danh sách sản phẩm (16) + Tóm tắt (8)
- Full-size images và typography
- Sticky order summary

### Tablet (768px - 991px)
- 1 cột layout
- Medium-size images
- Adjusted spacing

### Mobile (≤767px)
- 1 cột layout
- Small images
- Stacked elements
- Touch-friendly buttons

## Accessibility

- ✅ **Semantic HTML**: Proper heading hierarchy
- ✅ **ARIA labels**: Icons có text alternatives
- ✅ **Keyboard navigation**: Tab order hợp lý
- ✅ **Color contrast**: Đủ độ tương phản
- ✅ **Focus indicators**: Visible focus states

## Performance

- ✅ **Lazy loading**: Images với error handling
- ✅ **Optimized renders**: React.memo cho components
- ✅ **Efficient calculations**: Memoized price calculations
- ✅ **Smooth animations**: CSS transitions thay vì JS

## Browser Support

- ✅ **Modern browsers**: Chrome, Firefox, Safari, Edge
- ✅ **CSS Grid**: Fallback cho older browsers
- ✅ **Flexbox**: Widely supported
- ✅ **CSS Custom Properties**: With fallbacks

## Customization

### Colors
```css
/* Primary colors */
--primary-color: #1890ff;
--success-color: #52c41a;
--warning-color: #faad14;
--error-color: #f5222d;

/* Gradients */
--header-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Sizes
```css
/* Container sizes */
--cart-max-width: 1200px;
--mini-cart-width: 320px;
--mini-cart-mobile-width: 280px;
```

## Troubleshooting

### Common Issues
1. **Images không load**: Check image URLs và error handling
2. **Layout broken**: Verify CSS imports và responsive breakpoints
3. **Context errors**: Ensure CartProvider và AuthProvider are wrapped
4. **Performance issues**: Check for unnecessary re-renders

### Debug Tips
- Use React DevTools để inspect component hierarchy
- Check browser console cho errors
- Verify context values với console.log
- Test responsive design với browser dev tools 