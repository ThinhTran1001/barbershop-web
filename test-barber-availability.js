/**
 * Barber Availability API Test Script
 * 
 * This script tests the new barber availability endpoints to ensure they work correctly
 * for the single-page booking flow.
 */

const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/api';
const TEST_CONFIG = {
  // Test data - adjust these based on your database
  testDate: '2025-01-10', // Future date for testing
  testTimeSlot: '10:00',
  testServiceId: null, // Will be populated from API
  testBarberId: null   // Will be populated from API
};

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(testName, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${testName}`);
  if (message) console.log(`   ${message}`);
  
  testResults.tests.push({ testName, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Helper function to make API requests with error handling
async function apiRequest(method, url, data = null) {
  try {
    const config = { method, url };
    if (data) config.data = data;
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test 1: Get available barbers for customers
async function testAvailableBarbersEndpoint() {
  console.log('\n🧪 Testing Available Barbers Endpoint...');
  
  // Test with valid parameters
  const result = await apiRequest(
    'GET', 
    `${API_BASE}/barbers/available-for-customers?date=${TEST_CONFIG.testDate}&timeSlot=${TEST_CONFIG.testTimeSlot}`
  );
  
  if (result.success) {
    logTest('Available barbers endpoint responds', true, `Found ${result.data.availableBarbers?.length || 0} barbers`);
    
    // Validate response structure
    const hasCorrectStructure = result.data.hasOwnProperty('availableBarbers') && 
                               result.data.hasOwnProperty('success') &&
                               Array.isArray(result.data.availableBarbers);
    
    logTest('Response has correct structure', hasCorrectStructure);
    
    // Test barber data structure
    if (result.data.availableBarbers && result.data.availableBarbers.length > 0) {
      const barber = result.data.availableBarbers[0];
      const hasBarberFields = barber.hasOwnProperty('_id') && 
                             barber.hasOwnProperty('name') &&
                             barber.hasOwnProperty('averageRating');
      
      logTest('Barber objects have required fields', hasBarberFields);
      TEST_CONFIG.testBarberId = barber._id;
    }
  } else {
    logTest('Available barbers endpoint responds', false, result.error);
  }
  
  // Test with invalid date format
  const invalidDateResult = await apiRequest(
    'GET', 
    `${API_BASE}/barbers/available-for-customers?date=invalid-date&timeSlot=${TEST_CONFIG.testTimeSlot}`
  );
  
  logTest('Rejects invalid date format', !invalidDateResult.success && invalidDateResult.status === 400);
  
  // Test with invalid time format
  const invalidTimeResult = await apiRequest(
    'GET', 
    `${API_BASE}/barbers/available-for-customers?date=${TEST_CONFIG.testDate}&timeSlot=25:00`
  );
  
  logTest('Rejects invalid time format', !invalidTimeResult.success && invalidTimeResult.status === 400);
  
  // Test with missing parameters
  const missingParamsResult = await apiRequest('GET', `${API_BASE}/barbers/available-for-customers`);
  
  logTest('Rejects missing parameters', !missingParamsResult.success && missingParamsResult.status === 400);
}

// Test 2: Auto-assignment endpoint
async function testAutoAssignmentEndpoint() {
  console.log('\n🧪 Testing Auto-Assignment Endpoint...');
  
  // Test with valid parameters
  const result = await apiRequest('POST', `${API_BASE}/barbers/auto-assign-for-slot`, {
    date: TEST_CONFIG.testDate,
    timeSlot: TEST_CONFIG.testTimeSlot,
    serviceId: TEST_CONFIG.testServiceId
  });
  
  if (result.success) {
    logTest('Auto-assignment endpoint responds', true, `Assigned: ${result.data.assignedBarber?.name || 'Unknown'}`);
    
    // Validate response structure
    const hasCorrectStructure = result.data.hasOwnProperty('assignedBarber') && 
                               result.data.hasOwnProperty('success') &&
                               result.data.hasOwnProperty('assignmentDetails');
    
    logTest('Auto-assignment response has correct structure', hasCorrectStructure);
    
    // Validate assigned barber data
    if (result.data.assignedBarber) {
      const barber = result.data.assignedBarber;
      const hasBarberFields = barber.hasOwnProperty('_id') && 
                             barber.hasOwnProperty('name') &&
                             barber.hasOwnProperty('averageRating');
      
      logTest('Assigned barber has required fields', hasBarberFields);
    }
  } else {
    logTest('Auto-assignment endpoint responds', false, result.error);
  }
  
  // Test with invalid parameters
  const invalidResult = await apiRequest('POST', `${API_BASE}/barbers/auto-assign-for-slot`, {
    date: 'invalid-date',
    timeSlot: TEST_CONFIG.testTimeSlot
  });
  
  logTest('Auto-assignment rejects invalid data', !invalidResult.success && invalidResult.status === 400);
}

// Test 3: Service endpoints (needed for booking flow)
async function testServiceEndpoints() {
  console.log('\n🧪 Testing Service Endpoints...');
  
  // Test get all services
  const servicesResult = await apiRequest('GET', `${API_BASE}/services`);
  
  if (servicesResult.success) {
    logTest('Services endpoint responds', true, `Found ${servicesResult.data.services?.length || 0} services`);
    
    if (servicesResult.data.services && servicesResult.data.services.length > 0) {
      TEST_CONFIG.testServiceId = servicesResult.data.services[0]._id;
      logTest('Service ID obtained for testing', true, TEST_CONFIG.testServiceId);
    }
  } else {
    logTest('Services endpoint responds', false, servicesResult.error);
  }
  
  // Test service categories
  const categoriesResult = await apiRequest('GET', `${API_BASE}/services/categories`);
  logTest('Service categories endpoint responds', categoriesResult.success);
  
  // Test hair types
  const hairTypesResult = await apiRequest('GET', `${API_BASE}/services/hair-types`);
  logTest('Hair types endpoint responds', hairTypesResult.success);
  
  // Test style compatibility
  const styleResult = await apiRequest('GET', `${API_BASE}/services/style-compatibility`);
  logTest('Style compatibility endpoint responds', styleResult.success);
  
  // Test service suggestions
  const suggestionsResult = await apiRequest('GET', `${API_BASE}/services/suggestions?limit=5`);
  logTest('Service suggestions endpoint responds', suggestionsResult.success);
}

// Test 4: Single-page booking endpoint
async function testSinglePageBookingEndpoint() {
  console.log('\n🧪 Testing Single-Page Booking Endpoint...');
  
  if (!TEST_CONFIG.testServiceId) {
    logTest('Single-page booking test skipped', false, 'No service ID available');
    return;
  }
  
  // Test booking creation (this would require authentication in real scenario)
  const bookingData = {
    serviceId: TEST_CONFIG.testServiceId,
    barberId: TEST_CONFIG.testBarberId, // null for auto-assignment
    bookingDate: new Date(`${TEST_CONFIG.testDate}T${TEST_CONFIG.testTimeSlot}:00`).toISOString(),
    timeSlot: TEST_CONFIG.testTimeSlot,
    date: TEST_CONFIG.testDate,
    durationMinutes: 30,
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '1234567890',
    autoAssignBarber: !TEST_CONFIG.testBarberId
  };
  
  const result = await apiRequest('POST', `${API_BASE}/bookings/single-page`, bookingData);
  
  // This will likely fail due to authentication, but we can check if the endpoint exists
  if (result.status === 401 || result.status === 403) {
    logTest('Single-page booking endpoint exists', true, 'Authentication required (expected)');
  } else if (result.success) {
    logTest('Single-page booking endpoint works', true, 'Booking created successfully');
  } else {
    logTest('Single-page booking endpoint accessible', false, result.error);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Barber Availability API Tests...\n');
  console.log(`Test Configuration:`);
  console.log(`- API Base: ${API_BASE}`);
  console.log(`- Test Date: ${TEST_CONFIG.testDate}`);
  console.log(`- Test Time: ${TEST_CONFIG.testTimeSlot}`);
  
  try {
    // Run tests in sequence
    await testServiceEndpoints();
    await testAvailableBarbersEndpoint();
    await testAutoAssignmentEndpoint();
    await testSinglePageBookingEndpoint();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n❌ Failed Tests:');
      testResults.tests
        .filter(test => !test.passed)
        .forEach(test => console.log(`   - ${test.testName}: ${test.message}`));
    }
    
    console.log('\n✨ Testing completed!');
    
  } catch (error) {
    console.error('❌ Test runner error:', error.message);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests, testResults };
