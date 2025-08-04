# Auto-Assign with Monthly Booking Distribution

## 📋 Overview

Updated auto-assignment logic to prioritize fair distribution of bookings among barbers based on their monthly booking counts.

## 🎯 New Logic

### **Primary Rule: Monthly Booking Distribution**
1. **Equal Monthly Bookings** → Use original scoring algorithm
2. **Different Monthly Bookings** → Prioritize barbers with fewer bookings

### **Secondary Rule: Original Scoring (when needed)**
- Applied when monthly bookings are equal
- Applied among barbers with same minimum monthly bookings

## 🔄 Algorithm Flow

```
1. Get all eligible barbers (available, auto-assign eligible, etc.)
2. Calculate monthly bookings for each barber (excluding cancelled/rejected)
3. Check if all barbers have equal monthly bookings:

   IF EQUAL:
   ├── Use original weighted scoring algorithm
   ├── Sort by score (rating 40%, workload 30%, experience 20%, total bookings 10%)
   └── Select highest scored barber

   IF DIFFERENT:
   ├── Find minimum monthly booking count
   ├── Filter barbers with minimum count
   ├── IF only 1 barber → Select that barber
   └── IF multiple barbers → Use scoring algorithm among them
```

## 📊 Monthly Booking Calculation

```javascript
const monthlyBookings = await Booking.countDocuments({
  barberId: barber._id,
  bookingDate: {
    $gte: currentMonthStart,  // First day of current month
    $lte: currentMonthEnd     // Last day of current month
  },
  status: { $nin: ['cancelled', 'rejected'] }  // Exclude cancelled/rejected
});
```

## 🎯 Example Scenarios

### **Scenario 1: Different Monthly Bookings**
```
Barbers:
- Ngô Minh Nhật: 8 bookings this month, Rating 4.8
- Phạm Thành Đạt: 12 bookings this month, Rating 4.9
- Trần Văn C: 8 bookings this month, Rating 4.7

Result: Choose between Nhật and C (both have 8 bookings)
→ Use scoring algorithm between them
→ Nhật wins (higher rating: 4.8 vs 4.7)
```

### **Scenario 2: Equal Monthly Bookings**
```
Barbers:
- Ngô Minh Nhật: 10 bookings this month, Rating 4.8
- Phạm Thành Đạt: 10 bookings this month, Rating 4.9
- Trần Văn C: 10 bookings this month, Rating 4.7

Result: Use original scoring algorithm
→ Đạt wins (highest rating: 4.9)
```

### **Scenario 3: Single Minimum**
```
Barbers:
- Ngô Minh Nhật: 5 bookings this month, Rating 4.8
- Phạm Thành Đạt: 12 bookings this month, Rating 4.9
- Trần Văn C: 10 bookings this month, Rating 4.7

Result: Nhật wins (only one with minimum 5 bookings)
```

## 🔧 Implementation Details

### **Files Modified:**
1. `back-end/controllers/barber.controller.js` - `autoAssignBarberForSlot` function
2. `back-end/controllers/booking.controller.js` - Auto-assign logic in booking creation

### **Key Changes:**
- Added monthly booking calculation
- Added equal/different monthly booking detection
- Added conditional logic flow
- Enhanced response with monthly booking info

### **API Response Enhancement:**
```javascript
{
  success: true,
  assignedBarber: { ... },
  assignmentDetails: {
    date: "2025-08-04",
    timeSlot: "16:00",
    monthlyBookings: 8,
    hasEqualMonthlyBookings: false,
    reason: "Auto-assigned based on monthly booking distribution (8 bookings this month)"
  }
}
```

## 🎯 Business Benefits

### **✅ Fair Distribution:**
- Ensures even workload distribution among barbers
- Prevents some barbers from being overloaded while others are underutilized

### **✅ Quality Maintenance:**
- Still considers rating and experience when monthly bookings are equal
- Maintains service quality standards

### **✅ Transparency:**
- Clear reasoning in API response
- Detailed logging for debugging

### **✅ Flexibility:**
- Falls back to original algorithm when appropriate
- Handles edge cases gracefully

## 🧪 Testing

Run the test script to verify logic:
```bash
node back-end/test-auto-assign-logic.js
```

Test scenarios:
1. Different monthly bookings
2. Equal monthly bookings  
3. Single barber with minimum bookings

## 📈 Monitoring

### **Logs to Watch:**
- `📊 All barbers have equal monthly bookings, using original scoring algorithm`
- `📊 Different monthly bookings detected, prioritizing barbers with fewer bookings`

### **Metrics to Track:**
- Monthly booking distribution variance
- Customer satisfaction scores
- Barber utilization rates

## 🔄 Future Enhancements

1. **Weekly Distribution**: Consider weekly patterns within the month
2. **Service Type Balancing**: Balance different service types per barber
3. **Peak Hour Distribution**: Special logic for busy time slots
4. **Customer Preference Learning**: Factor in customer-barber match history
