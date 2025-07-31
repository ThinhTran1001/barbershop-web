# Voucher Duplication Issue - Fix Documentation

## 🔍 Problem Description

**Issue**: Every time a user logs in with Google OAuth or verifies their email with OTP, a new `VOUCHER10%` voucher was being created, resulting in duplicate vouchers for the same user.

**Root Cause**: The voucher creation logic in both `googleOauthHandler` and `verifyOtp` functions was creating new vouchers without checking if the user already had an existing, valid voucher.

## 📍 Affected Functions

### 1. `googleOauthHandler` (back-end/controllers/auth.controller.js:325-340)
- **Problem**: Created a new voucher every time a user logged in with Google
- **Impact**: Users would get multiple vouchers with each login

### 2. `verifyOtp` (back-end/controllers/auth.controller.js:48-60)  
- **Problem**: Created a new voucher every time a user verified their email
- **Impact**: Users would get multiple vouchers with each email verification

## ✅ Solution Implemented

### 1. Added Duplicate Prevention Logic

Both functions now include a check to prevent duplicate voucher creation:

```javascript
// Kiểm tra xem user đã có voucher VOUCHER10% chưa
const existingVoucher = await User_Voucher.findOne({
    userId: user._id,
    isUsed: false
}).populate('voucherId');

// Chỉ tạo voucher mới nếu user chưa có voucher nào hoặc voucher đã hết hạn
if (!existingVoucher || 
    !existingVoucher.voucherId || 
    existingVoucher.voucherId.endDate < new Date() ||
    existingVoucher.isUsed) {
    
    // Create new voucher logic here...
}
```

### 2. Conditions for New Voucher Creation

A new voucher will only be created if:
- User has no existing vouchers
- User's existing voucher is null/invalid
- User's existing voucher has expired
- User's existing voucher has already been used

### 3. Cleanup Script

Created `back-end/cleanup-duplicate-vouchers.js` to clean up any existing duplicate vouchers that were created before the fix.

## 🧪 Testing the Fix

### Test Cases:

1. **First-time Google login**: Should create one voucher
2. **Subsequent Google logins**: Should NOT create additional vouchers
3. **First-time email verification**: Should create one voucher  
4. **Subsequent email verifications**: Should NOT create additional vouchers
5. **User with expired voucher**: Should create a new voucher
6. **User with used voucher**: Should create a new voucher

### How to Test:

1. **Clean existing duplicates** (optional):
   ```bash
   cd back-end
   node cleanup-duplicate-vouchers.js
   ```

2. **Test Google OAuth login**:
   - Login with Google account
   - Check user's vouchers (should have 1)
   - Logout and login again
   - Check user's vouchers (should still have 1)

3. **Test email registration**:
   - Register new account with email
   - Verify email with OTP
   - Check user's vouchers (should have 1)
   - Try to verify email again
   - Check user's vouchers (should still have 1)

## 📊 Database Impact

### Before Fix:
- Multiple `VOUCHER10%` vouchers per user
- Unnecessary database bloat
- Potential confusion for users

### After Fix:
- Maximum 1 active `VOUCHER10%` voucher per user
- Clean database structure
- Clear voucher management

## 🔧 Files Modified

1. **back-end/controllers/auth.controller.js**
   - `verifyOtp` function (lines 48-75)
   - `googleOauthHandler` function (lines 325-370)

2. **back-end/cleanup-duplicate-vouchers.js** (new file)
   - Script to clean up existing duplicates

## 🚀 Deployment Notes

1. **Backend**: Deploy the updated `auth.controller.js`
2. **Database**: Run the cleanup script if needed
3. **Testing**: Verify the fix works with both Google OAuth and email registration

## 📝 Additional Notes

- The fix maintains backward compatibility
- Existing voucher functionality remains unchanged
- The `assignVoucherToUser` function already had proper duplicate prevention
- Voucher expiration and usage tracking continue to work as expected

## 🎯 Expected Behavior After Fix

- **New users**: Get exactly 1 `VOUCHER10%` voucher upon first login/verification
- **Existing users**: Keep their existing vouchers, no new duplicates created
- **Voucher expiration**: Users can get new vouchers when old ones expire
- **Voucher usage**: Users can get new vouchers after using their current one