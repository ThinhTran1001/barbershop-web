/**
 * Test script for booking status management endpoints
 * Run with: node test-booking-status.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test configuration
const TEST_CONFIG = {
  adminToken: 'your-admin-jwt-token-here',
  barberToken: 'your-barber-jwt-token-here',
  testBookingId: 'your-test-booking-id-here'
};

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
};

// Test admin booking rejection
const testAdminRejection = async () => {
  console.log('\n🔴 Testing Admin Booking Rejection...');
  
  const rejectionData = {
    reason: 'barber_unavailable',
    note: 'Test rejection - barber is sick'
  };

  const result = await makeRequest(
    'PUT',
    `/bookings/${TEST_CONFIG.testBookingId}/reject`,
    rejectionData,
    TEST_CONFIG.adminToken
  );

  if (result.success) {
    console.log('✅ Admin rejection successful:', result.data.message);
    console.log('📋 Booking details:', {
      id: result.data.booking.id,
      status: result.data.booking.status,
      rejectionReason: result.data.booking.rejectionReason,
      customer: result.data.booking.customer.name
    });
  } else {
    console.log('❌ Admin rejection failed:', result.error);
    console.log('📊 Status code:', result.status);
  }
};

// Test barber no-show marking
const testBarberNoShow = async () => {
  console.log('\n👤 Testing Barber No-Show Marking...');
  
  const noShowData = {
    note: 'Customer did not show up and did not call'
  };

  const result = await makeRequest(
    'PUT',
    `/bookings/${TEST_CONFIG.testBookingId}/no-show`,
    noShowData,
    TEST_CONFIG.barberToken
  );

  if (result.success) {
    console.log('✅ No-show marking successful:', result.data.message);
    console.log('📋 Booking details:', {
      id: result.data.booking.id,
      status: result.data.booking.status,
      noShowNote: result.data.booking.noShowNote,
      customer: result.data.booking.customer.name
    });
  } else {
    console.log('❌ No-show marking failed:', result.error);
    console.log('📊 Status code:', result.status);
  }
};

// Test unauthorized access
const testUnauthorizedAccess = async () => {
  console.log('\n🚫 Testing Unauthorized Access...');
  
  // Test rejection without admin token
  const rejectionResult = await makeRequest(
    'PUT',
    `/bookings/${TEST_CONFIG.testBookingId}/reject`,
    { reason: 'other', note: 'Unauthorized test' },
    TEST_CONFIG.barberToken // Using barber token instead of admin
  );

  if (!rejectionResult.success && rejectionResult.status === 403) {
    console.log('✅ Unauthorized rejection properly blocked');
  } else {
    console.log('❌ Unauthorized rejection was not blocked properly');
  }

  // Test no-show without proper token
  const noShowResult = await makeRequest(
    'PUT',
    `/bookings/${TEST_CONFIG.testBookingId}/no-show`,
    { note: 'Unauthorized test' }
    // No token provided
  );

  if (!noShowResult.success && [401, 403].includes(noShowResult.status)) {
    console.log('✅ Unauthorized no-show properly blocked');
  } else {
    console.log('❌ Unauthorized no-show was not blocked properly');
  }
};

// Test invalid data
const testInvalidData = async () => {
  console.log('\n❌ Testing Invalid Data Handling...');
  
  // Test rejection with invalid reason
  const invalidRejectionResult = await makeRequest(
    'PUT',
    `/bookings/${TEST_CONFIG.testBookingId}/reject`,
    { reason: 'invalid_reason', note: 'Test invalid reason' },
    TEST_CONFIG.adminToken
  );

  if (!invalidRejectionResult.success && invalidRejectionResult.status === 400) {
    console.log('✅ Invalid rejection reason properly rejected');
  } else {
    console.log('❌ Invalid rejection reason was not handled properly');
  }

  // Test with non-existent booking ID
  const nonExistentResult = await makeRequest(
    'PUT',
    '/bookings/507f1f77bcf86cd799439011/reject', // Valid ObjectId format but non-existent
    { reason: 'other', note: 'Test non-existent booking' },
    TEST_CONFIG.adminToken
  );

  if (!nonExistentResult.success && nonExistentResult.status === 404) {
    console.log('✅ Non-existent booking properly handled');
  } else {
    console.log('❌ Non-existent booking was not handled properly');
  }
};

// Test time-based validation (for no-show)
const testTimeValidation = async () => {
  console.log('\n⏰ Testing Time-Based Validation...');
  
  // This test assumes the booking is in the future
  // In a real scenario, you'd create a future booking for testing
  const futureNoShowResult = await makeRequest(
    'PUT',
    `/bookings/${TEST_CONFIG.testBookingId}/no-show`,
    { note: 'Test future booking no-show' },
    TEST_CONFIG.barberToken
  );

  if (!futureNoShowResult.success && futureNoShowResult.status === 400) {
    console.log('✅ Future booking no-show properly blocked');
    console.log('📝 Message:', futureNoShowResult.error.message);
  } else {
    console.log('❌ Future booking no-show was not blocked properly');
  }
};

// Main test runner
const runTests = async () => {
  console.log('🧪 Starting Booking Status Management Tests...');
  console.log('=' .repeat(50));

  // Validate test configuration
  if (!TEST_CONFIG.adminToken || !TEST_CONFIG.barberToken || !TEST_CONFIG.testBookingId) {
    console.log('❌ Please update TEST_CONFIG with valid tokens and booking ID');
    console.log('📝 Required:');
    console.log('   - adminToken: JWT token for admin user');
    console.log('   - barberToken: JWT token for barber user');
    console.log('   - testBookingId: Valid booking ID for testing');
    return;
  }

  try {
    // Run all tests
    await testUnauthorizedAccess();
    await testInvalidData();
    await testTimeValidation();
    
    // These tests modify data, so run them last
    // await testAdminRejection();
    // await testBarberNoShow();
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎉 Test suite completed!');
    console.log('📝 Note: Data-modifying tests are commented out to prevent accidental changes');
    console.log('💡 Uncomment testAdminRejection() and testBarberNoShow() to test actual functionality');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
};

// Additional utility functions for manual testing
const createTestBooking = async () => {
  console.log('\n📝 Creating test booking...');
  
  const bookingData = {
    customerId: 'your-customer-id-here',
    barberId: 'your-barber-id-here',
    serviceId: 'your-service-id-here',
    bookingDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    durationMinutes: 60,
    note: 'Test booking for status management'
  };

  const result = await makeRequest('POST', '/bookings', bookingData, TEST_CONFIG.adminToken);
  
  if (result.success) {
    console.log('✅ Test booking created:', result.data._id);
    console.log('💡 Update TEST_CONFIG.testBookingId with this ID');
  } else {
    console.log('❌ Failed to create test booking:', result.error);
  }
};

// Export functions for manual use
module.exports = {
  runTests,
  testAdminRejection,
  testBarberNoShow,
  testUnauthorizedAccess,
  testInvalidData,
  testTimeValidation,
  createTestBooking,
  makeRequest
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
