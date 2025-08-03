# Voucher Duplication Fix - Summary

## 🔍 Vấn đề đã được phát hiện và sửa

### Vấn đề ban đầu:
- Hệ thống tạo voucher VOUCHER10% mỗi lần user đăng nhập hoặc verify email
- Dẫn đến việc tạo nhiều voucher trùng lặp cho cùng một user
- Logic kiểm tra không chính xác, chỉ kiểm tra `isUsed: false` mà không kiểm tra loại voucher

### Nguyên nhân:
1. **Trong `verifyOtp`**: Tạo voucher mỗi lần verify email (user có thể verify nhiều lần)
2. **Trong `googleOauthHandler`**: Tạo voucher mỗi lần đăng nhập Google (user có thể đăng nhập nhiều lần)
3. **Logic kiểm tra sai**: Chỉ kiểm tra `isUsed: false` mà không kiểm tra xem user đã có voucher VOUCHER10% chưa

## ✅ Giải pháp đã thực hiện

### 1. Sửa logic trong `verifyOtp` (dòng 48-75):
```javascript
// TRƯỚC:
const existingVoucher = await User_Voucher.findOne({
    userId: user._id,
    isUsed: false
}).populate('voucherId');

// SAU:
const existingVoucher = await User_Voucher.findOne({
    userId: user._id
}).populate({
    path: 'voucherId',
    match: { code: 'VOUCHER10%' }
});

// Chỉ tạo voucher mới nếu user chưa từng có voucher VOUCHER10% nào
if (!existingVoucher || !existingVoucher.voucherId) {
    // Tạo voucher mới
}
```

### 2. Sửa logic trong `googleOauthHandler` (dòng 340-370):
```javascript
// TRƯỚC:
const existingVoucher = await User_Voucher.findOne({
    userId: user._id,
    isUsed: false
}).populate('voucherId');

// SAU:
const existingVoucher = await User_Voucher.findOne({
    userId: user._id
}).populate({
    path: 'voucherId',
    match: { code: 'VOUCHER10%' }
});

// Chỉ tạo voucher mới nếu user chưa từng có voucher VOUCHER10% nào
if (!existingVoucher || !existingVoucher.voucherId) {
    // Tạo voucher mới
}
```

### 3. Thay đổi chính:
- **Bỏ điều kiện `isUsed: false`**: Vì muốn kiểm tra xem user đã từng có voucher VOUCHER10% chưa, không quan trọng đã sử dụng hay chưa
- **Thêm `match: { code: 'VOUCHER10%' }`**: Chỉ tìm voucher có code VOUCHER10%
- **Đơn giản hóa điều kiện**: Chỉ tạo voucher mới nếu user chưa từng có voucher VOUCHER10% nào

## 🎯 Kết quả mong đợi

### Trước khi sửa:
- User đăng nhập lần 1: Tạo voucher ✅
- User đăng nhập lần 2: Tạo voucher ❌ (trùng lặp)
- User đăng nhập lần 3: Tạo voucher ❌ (trùng lặp)

### Sau khi sửa:
- User đăng nhập lần 1: Tạo voucher ✅
- User đăng nhập lần 2: Không tạo voucher ✅
- User đăng nhập lần 3: Không tạo voucher ✅

## 📊 Kiểm tra hiện tại

Đã chạy script `cleanup-duplicate-vouchers.js` và `check-vouchers.js` và kết quả:
- **Tổng voucher VOUCHER10%**: 1
- **Trạng thái voucher**: Đã hết hạn và đã sử dụng (isActive: false, usedCount: 1)
- **User có voucher trùng lặp**: 0
- **Voucher đã dọn dẹp**: 0

## 🧪 Cách test

### Test case 1: User mới đăng ký bằng email
1. Đăng ký tài khoản mới với email
2. Verify email với OTP
3. Kiểm tra: User có 1 voucher VOUCHER10%
4. Verify email lại
5. Kiểm tra: User vẫn chỉ có 1 voucher VOUCHER10%

### Test case 2: User mới đăng nhập bằng Google
1. Đăng nhập bằng Google với tài khoản mới
2. Kiểm tra: User có 1 voucher VOUCHER10%
3. Đăng xuất và đăng nhập lại
4. Kiểm tra: User vẫn chỉ có 1 voucher VOUCHER10%

### Test case 3: User cũ đăng nhập
1. User đã có voucher VOUCHER10% đăng nhập
2. Kiểm tra: Không tạo voucher mới

## 📝 Files đã thay đổi

1. **`back-end/controllers/auth.controller.js`**
   - Sửa logic trong `verifyOtp` function
   - Sửa logic trong `googleOauthHandler` function

2. **`back-end/services/cleanup-duplicate-vouchers.js`** (có sẵn)
   - Script kiểm tra và dọn dẹp voucher trùng lặp
3. **`back-end/services/check-vouchers.js`** (có sẵn)
   - Script kiểm tra tổng quan tất cả voucher trong database

## 🚀 Deployment

1. Deploy code đã sửa
2. Chạy script cleanup nếu cần: `node services/cleanup-duplicate-vouchers.js`
3. Kiểm tra voucher: `node services/check-vouchers.js`
4. Test các trường hợp đăng nhập/đăng ký

## ✅ Kết luận

Vấn đề voucher trùng lặp đã được sửa hoàn toàn. Hệ thống giờ đây chỉ tạo voucher VOUCHER10% cho user mới (lần đầu tiên đăng ký/đăng nhập) và không tạo thêm voucher cho những lần đăng nhập sau. 