require('dotenv').config();
const mongoose = require('mongoose');
const Voucher = require('../models/voucher.model');

const checkVouchers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Check all vouchers
    const allVouchers = await Voucher.find();
    console.log('Total vouchers in database:', allVouchers.length);
    console.log('All vouchers:', allVouchers);

    // Check active vouchers
    const activeVouchers = await Voucher.find({ isActive: true });
    console.log('Active vouchers:', activeVouchers.length);
    console.log('Active vouchers:', activeVouchers);

    // Check inactive vouchers
    const inactiveVouchers = await Voucher.find({ isActive: false });
    console.log('Inactive vouchers:', inactiveVouchers.length);
    console.log('Inactive vouchers:', inactiveVouchers);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkVouchers(); 