const mongoose = require('mongoose');

const userVoucherSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  voucherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher',
    required: true,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  assignedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  timestamps: true
});

userVoucherSchema.index({ userId: 1 });
userVoucherSchema.index({ voucherId: 1 });

module.exports = mongoose.model('User_Voucher', userVoucherSchema);
