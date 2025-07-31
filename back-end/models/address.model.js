const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  province: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  ward: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index để tối ưu query
addressSchema.index({ userId: 1, isDefault: 1 });
addressSchema.index({ userId: 1, isActive: 1 });
// Index để kiểm tra duplicate
addressSchema.index({ 
  userId: 1, 
  recipientName: 1, 
  phone: 1, 
  province: 1, 
  district: 1, 
  ward: 1, 
  street: 1 
});

// Middleware để đảm bảo chỉ có 1 địa chỉ mặc định per user
addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    // Set tất cả địa chỉ khác của user này thành false
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Static method để kiểm tra và khôi phục địa chỉ đã soft delete
addressSchema.statics.findOrRestore = async function(addressData) {
  const { userId, recipientName, phone, province, district, ward, street } = addressData;
  
  // Tìm địa chỉ đã soft delete có thông tin giống hệt
  const existingAddress = await this.findOne({
    userId,
    recipientName,
    phone,
    province,
    district,
    ward,
    street,
    isActive: false
  });

  if (existingAddress) {
    // Khôi phục địa chỉ đã soft delete
    existingAddress.isActive = true;
    await existingAddress.save();
    return existingAddress;
  }

  return null;
};

module.exports = mongoose.model('Address', addressSchema); 