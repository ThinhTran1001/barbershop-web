const mongoose = require('mongoose');
const dayjs = require('dayjs')

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['percent', 'fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  usageLimit: {
    type: Number,
    required: true
  },
  usedCount: {
    type: Number,
    default: 0
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  totalOrderAmount: {
    type: Number,
    default: 0
  },
  startDate: {
    type: Date,
    set : (value) =>{
      if(typeof value === 'string'){
        const parsed = dayjs(value, 'DD/MM/YYYY', true);
        if(parsed.isValid()){
          return parsed.toDate();
        }
      }
      return value;
    },
    required: true
  },
  endDate: {
    type: Date,
     set : (value) =>{
      if(typeof value === 'string'){
        const parsed = dayjs(value, 'DD/MM/YYYY', true);
        if(parsed.isValid()){
          return parsed.toDate();
        }
      }
      return value;
    },
    required: true
  },
  isActive: {
    type: Boolean,
    required: true
  }
});


module.exports = mongoose.model('Voucher', voucherSchema);
