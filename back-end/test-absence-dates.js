/**
 * Test script to verify absence date handling
 */

// Test date parsing logic
function testDateParsing() {
  console.log('🧪 Testing Date Parsing Logic');
  console.log('==============================');

  // Test cases
  const testCases = [
    {
      name: 'YYYY-MM-DD format',
      startDate: '2025-08-07',
      endDate: '2025-08-08'
    },
    {
      name: 'ISO string format (old)',
      startDate: '2025-08-06T17:00:00.000Z',
      endDate: '2025-08-07T17:00:00.000Z'
    }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
    console.log('Input:', testCase);

    try {
      // Simulate backend parsing logic
      let start, end;

      if (testCase.startDate.includes('T')) {
        // ISO string format - parse directly
        start = new Date(testCase.startDate);
        start.setHours(0, 0, 0, 0);
      } else {
        // YYYY-MM-DD format - parse as local date
        start = new Date(testCase.startDate + 'T00:00:00');
      }

      if (testCase.endDate.includes('T')) {
        end = new Date(testCase.endDate);
        end.setHours(23, 59, 59, 999);
      } else {
        end = new Date(testCase.endDate + 'T23:59:59');
      }

      console.log('Parsed Results:');
      console.log('  Start:', start.toISOString(), '(Local:', start.toLocaleDateString(), ')');
      console.log('  End:', end.toISOString(), '(Local:', end.toLocaleDateString(), ')');
      console.log('  Valid:', !isNaN(start.getTime()) && !isNaN(end.getTime()));

      // Generate date range
      const dates = [];
      const currentDate = new Date(start);
      const endDate = new Date(end);

      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log('  Generated dates:', dates);

    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  });
}

// Test isBarberAbsent logic
function testAbsenceLogic() {
  console.log('\n🧪 Testing isBarberAbsent Logic');
  console.log('================================');

  // Mock absence data
  const mockAbsence = {
    startDate: '2025-08-07',
    endDate: '2025-08-08',
    isApproved: true
  };

  const testDates = [
    '2025-08-06',
    '2025-08-07',
    '2025-08-08',
    '2025-08-09'
  ];

  console.log('Mock absence:', mockAbsence);

  testDates.forEach(dateStr => {
    const testDate = new Date(dateStr + 'T10:00:00');
    const checkDateStr = testDate.toISOString().split('T')[0];

    // Simulate isBarberAbsent logic
    const startDateStr = mockAbsence.startDate;
    const endDateStr = mockAbsence.endDate;
    const isInRange = checkDateStr >= startDateStr && checkDateStr <= endDateStr;

    console.log(`📅 ${dateStr}:`, {
      checkDateStr,
      startDateStr,
      endDateStr,
      isInRange,
      result: isInRange && mockAbsence.isApproved ? 'ABSENT' : 'AVAILABLE'
    });
  });
}

// Run tests
console.log('🚀 Starting Absence Date Tests');
console.log('===============================');

testDateParsing();
testAbsenceLogic();

console.log('\n✅ Tests completed!');
console.log('\n📝 Expected Results:');
console.log('- YYYY-MM-DD format should parse correctly');
console.log('- Date range 2025-08-07 to 2025-08-08 should generate ["2025-08-07", "2025-08-08"]');
console.log('- isBarberAbsent should return true for 2025-08-07 and 2025-08-08, false for others');
