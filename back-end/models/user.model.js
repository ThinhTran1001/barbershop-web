const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  },
  passwordHash: { type: String, required: true },
  phone: {
    type: String,
    match: /^[0-9]{10}$/,
    default: null
  },
  role: {
    type: String,
    enum: ['customer', 'barber', 'admin'],
    default: 'customer',
  },
  avatarUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default : 'active'
  },
  isVerified : {
    type : Boolean,
    default : false
  }
}, { timestamps: true });

// userSchema.pre('save', async function (next) {
//   if (!this.isModified('passwordHash')) return next();

//   try {
//     const salt = await bcrypt.genSalt(10);
//     this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
//     next();
//   } catch (error) {
//     next(error);
//   }
// });

module.exports = mongoose.model('User', userSchema);
