/**
 * Test script for new auto-assign logic
 * Tests the monthly booking distribution logic
 */

const mongoose = require('mongoose');
const Barber = require('./models/barber.model');
const Booking = require('./models/booking.model');

// Mock data for testing
const mockBarbers = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Ngô Minh Nhật',
    averageRating: 4.8,
    experienceYears: 5,
    totalBookings: 150,
    monthlyBookings: 8  // Fewer bookings this month
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Phạm Thành Đạt',
    averageRating: 4.9,
    experienceYears: 7,
    totalBookings: 200,
    monthlyBookings: 12  // More bookings this month
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Trần Văn C',
    averageRating: 4.7,
    experienceYears: 3,
    totalBookings: 100,
    monthlyBookings: 8  // Same as Nhật
  }
];

// Test function to simulate auto-assign logic
function testAutoAssignLogic(eligibleBarbers) {
  console.log('\n🧪 Testing Auto-Assign Logic');
  console.log('================================');
  
  // Display barber data
  console.log('\n📊 Eligible Barbers:');
  eligibleBarbers.forEach((barber, index) => {
    console.log(`${index + 1}. ${barber.name}:`);
    console.log(`   - Rating: ${barber.averageRating}/5`);
    console.log(`   - Experience: ${barber.experienceYears} years`);
    console.log(`   - Monthly Bookings: ${barber.monthlyBookings}`);
    console.log(`   - Total Bookings: ${barber.totalBookings}`);
  });

  // Check monthly booking distribution
  const monthlyBookingCounts = eligibleBarbers.map(b => b.monthlyBookings);
  const minMonthlyBookings = Math.min(...monthlyBookingCounts);
  const maxMonthlyBookings = Math.max(...monthlyBookingCounts);
  const hasEqualMonthlyBookings = minMonthlyBookings === maxMonthlyBookings;

  console.log(`\n📈 Monthly Booking Analysis:`);
  console.log(`   - Min Monthly Bookings: ${minMonthlyBookings}`);
  console.log(`   - Max Monthly Bookings: ${maxMonthlyBookings}`);
  console.log(`   - Equal Distribution: ${hasEqualMonthlyBookings ? 'YES' : 'NO'}`);

  let selectedBarber;

  if (hasEqualMonthlyBookings) {
    console.log('\n✅ Using Original Scoring Algorithm (Equal Monthly Bookings)');
    
    // Calculate scores for each barber
    const barbersWithScores = eligibleBarbers.map(barber => {
      const ratingScore = barber.averageRating / 5;
      const experienceScore = Math.min(barber.experienceYears / 10, 1);
      const totalBookingsScore = Math.max(0, 1 - (barber.totalBookings / 1000));
      const workloadScore = 0.8; // Assume good workload for testing
      
      const finalScore = (ratingScore * 0.4) + (workloadScore * 0.3) + 
                        (experienceScore * 0.2) + (totalBookingsScore * 0.1);
      
      return { ...barber, score: finalScore };
    });

    barbersWithScores.sort((a, b) => b.score - a.score);
    selectedBarber = barbersWithScores[0];

    console.log('\n📊 Scoring Results:');
    barbersWithScores.forEach((barber, index) => {
      console.log(`${index + 1}. ${barber.name}: Score ${barber.score.toFixed(3)}`);
    });

  } else {
    console.log('\n🎯 Using Monthly Booking Priority (Different Monthly Bookings)');
    
    // Filter barbers with minimum monthly bookings
    const barbersWithMinBookings = eligibleBarbers.filter(b => b.monthlyBookings === minMonthlyBookings);
    
    console.log(`\n📋 Barbers with minimum bookings (${minMonthlyBookings}):`);
    barbersWithMinBookings.forEach(barber => {
      console.log(`   - ${barber.name}`);
    });

    if (barbersWithMinBookings.length === 1) {
      selectedBarber = barbersWithMinBookings[0];
      console.log('\n✅ Single barber with minimum bookings selected');
    } else {
      console.log('\n⚖️ Multiple barbers with minimum bookings, using scoring among them');
      
      // Calculate scores only for barbers with minimum bookings
      const barbersWithScores = barbersWithMinBookings.map(barber => {
        const ratingScore = barber.averageRating / 5;
        const experienceScore = Math.min(barber.experienceYears / 10, 1);
        const totalBookingsScore = Math.max(0, 1 - (barber.totalBookings / 1000));
        const workloadScore = 0.8;
        
        const finalScore = (ratingScore * 0.4) + (workloadScore * 0.3) + 
                          (experienceScore * 0.2) + (totalBookingsScore * 0.1);
        
        return { ...barber, score: finalScore };
      });

      barbersWithScores.sort((a, b) => b.score - a.score);
      selectedBarber = barbersWithScores[0];

      console.log('\n📊 Scoring Results (among minimum booking barbers):');
      barbersWithScores.forEach((barber, index) => {
        console.log(`${index + 1}. ${barber.name}: Score ${barber.score.toFixed(3)}`);
      });
    }
  }

  console.log(`\n🎉 SELECTED BARBER: ${selectedBarber.name}`);
  console.log(`   - Reason: ${hasEqualMonthlyBookings ? 
    'Best score with equal monthly distribution' : 
    `Fewer monthly bookings (${selectedBarber.monthlyBookings})`}`);
  
  return selectedBarber;
}

// Test scenarios
console.log('🧪 AUTO-ASSIGN LOGIC TEST SUITE');
console.log('=================================');

// Scenario 1: Different monthly bookings
console.log('\n📋 SCENARIO 1: Different Monthly Bookings');
testAutoAssignLogic(mockBarbers);

// Scenario 2: Equal monthly bookings
console.log('\n📋 SCENARIO 2: Equal Monthly Bookings');
const equalBookingBarbers = mockBarbers.map(barber => ({
  ...barber,
  monthlyBookings: 10  // All have same monthly bookings
}));
testAutoAssignLogic(equalBookingBarbers);

// Scenario 3: Single barber with minimum bookings
console.log('\n📋 SCENARIO 3: Single Barber with Minimum Bookings');
const singleMinBarbers = [
  { ...mockBarbers[0], monthlyBookings: 5 },  // Minimum
  { ...mockBarbers[1], monthlyBookings: 12 }, // Higher
  { ...mockBarbers[2], monthlyBookings: 10 }  // Higher
];
testAutoAssignLogic(singleMinBarbers);

console.log('\n✅ All test scenarios completed!');
