const mongoose = require('mongoose');
const Address = require('../models/address.model');
require('dotenv').config();

const cleanupDeletedAddresses = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Chạy cleanup job
    const deletedCount = await Address.cleanupDeletedAddresses();
    
    console.log(`Cleanup completed. Permanently deleted ${deletedCount} addresses older than 30 days.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup
cleanupDeletedAddresses(); 