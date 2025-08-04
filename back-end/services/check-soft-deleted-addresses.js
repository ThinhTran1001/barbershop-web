const mongoose = require('mongoose');
const Address = require('../models/address.model');
require('dotenv').config();

const checkSoftDeletedAddresses = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Tìm tất cả địa chỉ đã soft delete
    const softDeletedAddresses = await Address.find({ isDeleted: true });
    
    console.log(`Found ${softDeletedAddresses.length} soft deleted addresses:`);
    
    softDeletedAddresses.forEach((address, index) => {
      console.log(`${index + 1}. ID: ${address._id}`);
      console.log(`   User: ${address.userId}`);
      console.log(`   Name: ${address.recipientName}`);
      console.log(`   Phone: ${address.phone}`);
      console.log(`   Address: ${address.street}, ${address.ward}, ${address.district}, ${address.province}`);
      console.log(`   Deleted at: ${address.deletedAt}`);
      console.log('---');
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error checking soft deleted addresses:', error);
    process.exit(1);
  }
};

// Run the check
checkSoftDeletedAddresses(); 