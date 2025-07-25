# Time Slot Validation Tests for Variable Service Durations

## Overview
This document outlines test scenarios to verify that the time slot validation system correctly handles services with different durations and prevents overlapping bookings.

## Test Scenarios

### Scenario 1: 30-Minute Service (Standard)
**Setup:**
- Barber schedule: 9:00, 9:30, 10:00, 10:30, 11:00, 11:30...
- Service: Hair Cut (30 minutes)

**Test Case 1.1: Normal Booking**
- Customer books Hair Cut at 9:00
- Expected: Only 9:00 slot is blocked
- Available slots after booking: 9:30, 10:00, 10:30, 11:00...

**Test Case 1.2: Adjacent Booking**
- Existing booking: Hair Cut at 9:00 (30 min)
- Customer tries to book Hair Cut at 9:30
- Expected: Should succeed, no conflict

### Scenario 2: 45-Minute Service
**Setup:**
- Service: Beard Trim + Styling (45 minutes)

**Test Case 2.1: 45-Minute Booking**
- Customer books 45-min service at 9:00
- Expected: Blocks 9:00 and 9:30 slots (service ends at 9:45)
- Available slots after booking: 10:00, 10:30, 11:00...

**Test Case 2.2: Conflict Detection**
- Existing booking: 45-min service at 9:00 (ends at 9:45)
- Customer tries to book 30-min service at 9:30
- Expected: Should fail - conflict detected

### Scenario 3: 90-Minute Service (Long Duration)
**Setup:**
- Service: Full Grooming Package (90 minutes)

**Test Case 3.1: 90-Minute Booking**
- Customer books 90-min service at 9:00
- Expected: Blocks 9:00, 9:30, 10:00 slots (service ends at 10:30)
- Available slots after booking: 10:30, 11:00, 11:30...

**Test Case 3.2: Multiple Conflict Detection**
- Existing booking: 90-min service at 9:00 (ends at 10:30)
- Customer tries to book 30-min service at 9:30
- Expected: Should fail - conflict detected
- Customer tries to book 30-min service at 10:00
- Expected: Should fail - conflict detected
- Customer tries to book 30-min service at 10:30
- Expected: Should succeed - no conflict

### Scenario 4: Complex Overlapping Cases
**Test Case 4.1: Partial Overlap**
- Existing booking: 60-min service at 9:00 (ends at 10:00)
- Customer tries to book 60-min service at 9:30 (would end at 10:30)
- Expected: Should fail - services overlap from 9:30 to 10:00

**Test Case 4.2: End-to-End Booking**
- Existing booking: 30-min service at 9:00 (ends at 9:30)
- Customer tries to book 30-min service at 9:30 (ends at 10:00)
- Expected: Should succeed - no overlap

**Test Case 4.3: Surrounding Conflict**
- Existing bookings: 30-min at 9:00, 30-min at 10:00
- Customer tries to book 90-min service at 9:30 (would end at 11:00)
- Expected: Should fail - conflicts with 10:00 booking

## API Testing

### Test Available Slots API
```bash
# Test 30-minute service
GET /api/barber-schedule/available-slots?barberId=123&date=2024-07-24&durationMinutes=30

# Test 90-minute service
GET /api/barber-schedule/available-slots?barberId=123&date=2024-07-24&durationMinutes=90
```

### Test Validation API
```bash
# Test slot validation for 90-minute service
POST /api/barber-schedule/validate-availability
{
  "barberId": "123",
  "bookingDate": "2024-07-24T09:00:00.000Z",
  "durationMinutes": 90
}
```

## Expected Behaviors

### Frontend (TimeSlotPicker)
1. **Duration Display**: Shows service duration and number of slots it will block
2. **Slot Display**: For long services, shows start time and end time
3. **Filtered Slots**: Only shows slots where the entire service duration fits
4. **Visual Feedback**: Clear indication of time range for each slot

### Backend (API Responses)
1. **Accurate Filtering**: Available slots consider full service duration
2. **Conflict Detection**: Precise overlap detection between time ranges
3. **Error Messages**: Clear explanation of conflicts with duration details
4. **Atomic Operations**: Database transactions prevent race conditions

## Validation Checklist

### ✅ Basic Functionality
- [ ] 30-minute services work as before
- [ ] 45-minute services block appropriate slots
- [ ] 90-minute services block multiple consecutive slots
- [ ] Available slots API filters correctly based on duration

### ✅ Conflict Prevention
- [ ] Cannot book overlapping services
- [ ] Partial overlaps are detected and prevented
- [ ] End-to-end bookings (no gap) are allowed
- [ ] Complex multi-booking scenarios work correctly

### ✅ User Experience
- [ ] Clear duration information displayed
- [ ] Time ranges shown for long services
- [ ] Helpful error messages for conflicts
- [ ] Validation happens before booking submission

### ✅ Edge Cases
- [ ] Services longer than 2 hours
- [ ] Back-to-back different duration services
- [ ] Multiple customers booking simultaneously
- [ ] Services that span lunch breaks or end-of-day

## Performance Considerations
- Slot filtering algorithm is O(n*m) where n=available slots, m=existing bookings
- For typical daily schedules (16 slots, <20 bookings), performance is acceptable
- Database queries are optimized with proper indexing on barberId and bookingDate

## Future Enhancements
1. **Smart Suggestions**: Recommend alternative times when conflicts occur
2. **Buffer Time**: Optional buffer between services
3. **Break Handling**: Respect barber lunch breaks and rest periods
4. **Recurring Bookings**: Handle weekly/monthly recurring appointments
