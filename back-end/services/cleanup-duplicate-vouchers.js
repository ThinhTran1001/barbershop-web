const mongoose = require('mongoose');
const Voucher = require('../models/voucher.model');
const User_Voucher = require('../models/user_voucher.model');
require('dotenv').config();

const cleanupDuplicateVouchers = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Find all VOUCHER10% vouchers
    const vouchers = await Voucher.find({ code: 'VOUCHER10%' });
    console.log(`Found ${vouchers.length} VOUCHER10% vouchers`);

    // Group vouchers by user
    const userVoucherGroups = {};
    
    for (const voucher of vouchers) {
      const userVouchers = await User_Voucher.find({ voucherId: voucher._id });
      
      for (const userVoucher of userVouchers) {
        const userId = userVoucher.userId.toString();
        
        if (!userVoucherGroups[userId]) {
          userVoucherGroups[userId] = [];
        }
        
        userVoucherGroups[userId].push({
          userVoucherId: userVoucher._id,
          voucherId: voucher._id,
          isUsed: userVoucher.isUsed,
          createdAt: voucher.createdAt,
          endDate: voucher.endDate
        });
      }
    }

    // Clean up duplicates for each user
    let totalCleaned = 0;
    
    for (const [userId, userVouchers] of Object.entries(userVoucherGroups)) {
      if (userVouchers.length > 1) {
        console.log(`User ${userId} has ${userVouchers.length} vouchers`);
        
        // Sort by creation date (newest first)
        userVouchers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Keep the newest unused voucher, delete the rest
        const toDelete = userVouchers.slice(1);
        
        for (const item of toDelete) {
          // Delete the user-voucher relationship
          await User_Voucher.findByIdAndDelete(item.userVoucherId);
          
          // Check if this voucher is used by other users
          const otherUsers = await User_Voucher.find({ voucherId: item.voucherId });
          
          // If no other users use this voucher, delete the voucher too
          if (otherUsers.length === 0) {
            await Voucher.findByIdAndDelete(item.voucherId);
            console.log(`Deleted voucher ${item.voucherId}`);
          }
          
          totalCleaned++;
        }
      }
    }

    console.log(`Cleanup completed. Removed ${totalCleaned} duplicate voucher assignments.`);
    
    // Final count
    const finalVouchers = await Voucher.find({ code: 'VOUCHER10%' });
    console.log(`Remaining VOUCHER10% vouchers: ${finalVouchers.length}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
};

// Run the cleanup
cleanupDuplicateVouchers();