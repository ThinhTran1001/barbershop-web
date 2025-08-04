/**
 * Test script to verify auto-assign logic fix
 * This script simulates the scenarios to ensure fair distribution
 */

// Mock data representing different scenarios
const scenarios = [
  {
    name: "All barbers have 0 monthly bookings",
    barbers: [
      { _id: "1", name: "Ngô Minh Nhật", monthlyBookings: 0, availabilityScore: 0.85 },
      { _id: "2", name: "Phạm Thành Đạt", monthlyBookings: 0, availabilityScore: 0.90 },
      { _id: "3", name: "Trần Văn C", monthlyBookings:0, availabilityScore: 0.80 }
    ]
  },
  {
    name: "Different monthly bookings",
    barbers: [
      { _id: "1", name: "Ngô Minh Nhật", monthlyBookings: 8, availabilityScore: 0.85 },
      { _id: "2", name: "Phạm Thành Đạt", monthlyBookings: 12, availabilityScore: 0.90 },
      { _id: "3", name: "Trần Văn C", monthlyBookings: 5, availabilityScore: 0.80 }
    ]
  },
  {
    name: "Equal monthly bookings (> 0)",
    barbers: [
      { _id: "1", name: "Ngô Minh Nhật", monthlyBookings: 10, availabilityScore: 0.85 },
      { _id: "2", name: "Phạm Thành Đạt", monthlyBookings: 10, availabilityScore: 0.90 },
      { _id: "3", name: "Trần Văn C", monthlyBookings: 10, availabilityScore: 0.80 }
    ]
  }
];

function simulateAutoAssign(eligibleBarbers, currentHour = new Date().getHours()) {
  console.log('\n📊 Simulating Auto-Assign Logic');
  console.log('================================');
  
  // Display barber data
  console.log('\n📋 Eligible Barbers:');
  eligibleBarbers.forEach((barber, index) => {
    console.log(`${index + 1}. ${barber.name}:`);
    console.log(`   - Monthly Bookings: ${barber.monthlyBookings}`);
    console.log(`   - Availability Score: ${barber.availabilityScore}`);
  });

  // Check monthly booking distribution
  const monthlyBookingCounts = eligibleBarbers.map(b => b.monthlyBookings);
  const minMonthlyBookings = Math.min(...monthlyBookingCounts);
  const maxMonthlyBookings = Math.max(...monthlyBookingCounts);
  const hasEqualMonthlyBookings = minMonthlyBookings === maxMonthlyBookings;

  console.log(`\n📈 Analysis:`);
  console.log(`   - Min Monthly Bookings: ${minMonthlyBookings}`);
  console.log(`   - Max Monthly Bookings: ${maxMonthlyBookings}`);
  console.log(`   - Equal Distribution: ${hasEqualMonthlyBookings ? 'YES' : 'NO'}`);

  let selectedBarber;

  if (hasEqualMonthlyBookings) {
    if (minMonthlyBookings === 0) {
      // All barbers have 0 bookings -> use round-robin
      console.log('\n🔄 Using Round-Robin (all have 0 bookings)');
      const sortedBarbers = [...eligibleBarbers].sort((a, b) => a._id.localeCompare(b._id));
      const selectedIndex = currentHour % sortedBarbers.length;
      selectedBarber = sortedBarbers[selectedIndex];
      console.log(`✅ Selected by round-robin (hour ${currentHour} % ${sortedBarbers.length}): ${selectedBarber.name}`);
    } else {
      // All barbers have equal monthly bookings (> 0) -> use scoring
      console.log(`\n📊 Using Scoring Algorithm (equal bookings: ${minMonthlyBookings})`);
      const sortedBarbers = [...eligibleBarbers].sort((a, b) => b.availabilityScore - a.availabilityScore);
      selectedBarber = sortedBarbers[0];
      console.log(`✅ Selected by scoring: ${selectedBarber.name} (score: ${selectedBarber.availabilityScore})`);
    }
  } else {
    // Different monthly bookings -> prioritize fewer bookings
    console.log('\n🎯 Using Monthly Booking Priority');
    const barbersWithMinBookings = eligibleBarbers.filter(b => b.monthlyBookings === minMonthlyBookings);
    
    console.log(`📋 Barbers with minimum bookings (${minMonthlyBookings}):`);
    barbersWithMinBookings.forEach(barber => {
      console.log(`   - ${barber.name}`);
    });

    if (barbersWithMinBookings.length === 1) {
      selectedBarber = barbersWithMinBookings[0];
      console.log(`✅ Selected (only one with min bookings): ${selectedBarber.name}`);
    } else {
      const sortedMinBarbers = barbersWithMinBookings.sort((a, b) => b.availabilityScore - a.availabilityScore);
      selectedBarber = sortedMinBarbers[0];
      console.log(`✅ Selected by scoring among min booking barbers: ${selectedBarber.name}`);
    }
  }

  return selectedBarber;
}

// Test all scenarios
console.log('🧪 AUTO-ASSIGN LOGIC FIX TEST');
console.log('==============================');

scenarios.forEach((scenario, index) => {
  console.log(`\n📋 SCENARIO ${index + 1}: ${scenario.name}`);
  console.log('='.repeat(50));
  
  // Test multiple times for round-robin scenario
  if (scenario.name.includes("0 monthly bookings")) {
    console.log('\n🔄 Testing Round-Robin Distribution (simulating different hours):');
    for (let hour = 0; hour < 6; hour++) {
      console.log(`\n⏰ Hour ${hour}:`);
      const selected = simulateAutoAssign(scenario.barbers, hour);
      console.log(`   → Selected: ${selected.name}`);
    }
  } else {
    simulateAutoAssign(scenario.barbers);
  }
});

console.log('\n✅ All test scenarios completed!');
console.log('\n📝 Expected Results:');
console.log('- Scenario 1: Should rotate between barbers based on hour');
console.log('- Scenario 2: Should always select Trần Văn C (fewest bookings: 5)');
console.log('- Scenario 3: Should always select Phạm Thành Đạt (highest score: 0.90)');
