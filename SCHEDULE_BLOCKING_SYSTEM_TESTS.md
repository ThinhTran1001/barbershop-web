# Schedule Blocking System Tests

## Overview
This document outlines comprehensive tests for the new schedule blocking system that properly marks time slots as "blocked" when bookings are created and handles variable service durations.

## System Architecture

### Key Components
1. **BarberSchedule Model**: Stores actual slot availability with `isBooked` and `bookingId` fields
2. **Booking Controller**: Creates bookings and updates schedule atomically
3. **Schedule Sync Utility**: Maintains consistency between bookings and schedules
4. **Enhanced API**: Returns schedule-based availability

## Test Scenarios

### 1. Basic Booking Creation and Schedule Update

#### Test 1.1: 30-Minute Service Booking
**Setup:**
- Barber has default schedule: 9:00, 9:30, 10:00, 10:30...
- All slots initially available (`isBooked: false`)

**Action:**
- Customer books 30-minute Hair Cut at 9:00

**Expected Results:**
- ✅ Booking record created successfully
- ✅ Schedule slot 9:00 marked as `isBooked: true`
- ✅ Schedule slot 9:00 has `bookingId` set to booking ID
- ✅ Other slots remain available
- ✅ API `/available-slots` no longer returns 9:00

#### Test 1.2: 90-Minute Service Booking
**Setup:**
- Barber has clean schedule

**Action:**
- Customer books 90-minute Full Grooming at 9:00

**Expected Results:**
- ✅ Booking record created successfully
- ✅ Schedule slots 9:00, 9:30, 10:00 marked as `isBooked: true`
- ✅ All three slots have same `bookingId`
- ✅ API `/available-slots` excludes 9:00, 9:30, 10:00
- ✅ Next available slot is 10:30

### 2. Atomic Transaction Testing

#### Test 2.1: Booking Creation Failure
**Setup:**
- Simulate database error during booking save

**Action:**
- Attempt to create booking

**Expected Results:**
- ✅ Booking creation fails
- ✅ Schedule slots remain unchanged (rollback)
- ✅ No orphaned schedule updates

#### Test 2.2: Schedule Update Failure
**Setup:**
- Simulate error during schedule slot marking

**Action:**
- Attempt to create booking

**Expected Results:**
- ✅ Entire transaction rolls back
- ✅ No booking record created
- ✅ Schedule remains unchanged
- ✅ Clear error message returned

### 3. Booking Cancellation and Schedule Cleanup

#### Test 3.1: Cancel 30-Minute Booking
**Setup:**
- Existing 30-minute booking at 9:00
- Schedule slot 9:00 marked as booked

**Action:**
- Customer cancels booking

**Expected Results:**
- ✅ Booking status changed to 'cancelled'
- ✅ Schedule slot 9:00 marked as `isBooked: false`
- ✅ Schedule slot 9:00 `bookingId` cleared
- ✅ API `/available-slots` includes 9:00 again

#### Test 3.2: Cancel 90-Minute Booking
**Setup:**
- Existing 90-minute booking at 9:00
- Schedule slots 9:00, 9:30, 10:00 marked as booked

**Action:**
- Customer cancels booking

**Expected Results:**
- ✅ Booking status changed to 'cancelled'
- ✅ All three schedule slots marked as `isBooked: false`
- ✅ All three slots have `bookingId` cleared
- ✅ API `/available-slots` includes all three slots

### 4. Conflict Prevention

#### Test 4.1: Double Booking Prevention
**Setup:**
- Existing 30-minute booking at 9:00
- Schedule slot 9:00 marked as booked

**Action:**
- Another customer tries to book 30-minute service at 9:00

**Expected Results:**
- ✅ Booking creation fails with conflict error
- ✅ No new booking record created
- ✅ Schedule remains unchanged
- ✅ Clear error message about slot being unavailable

#### Test 4.2: Overlapping Service Prevention
**Setup:**
- Existing 90-minute booking at 9:00 (blocks 9:00, 9:30, 10:00)

**Action:**
- Customer tries to book 30-minute service at 9:30

**Expected Results:**
- ✅ Booking creation fails
- ✅ Error indicates slot is already booked
- ✅ Schedule remains unchanged

### 5. Schedule Consistency and Sync

#### Test 5.1: Schedule Sync Utility
**Setup:**
- Manually create inconsistency (booking exists but schedule not updated)

**Action:**
- Run `syncBarberScheduleForDate(barberId, date)`

**Expected Results:**
- ✅ Schedule updated to match existing bookings
- ✅ All active bookings have corresponding blocked slots
- ✅ No orphaned blocked slots
- ✅ Sync report shows corrected inconsistencies

#### Test 5.2: Schedule Validation
**Setup:**
- Various schedule states (consistent and inconsistent)

**Action:**
- Run `validateScheduleConsistency(barberId, date)`

**Expected Results:**
- ✅ Identifies orphaned blocked slots
- ✅ Identifies missing blocked slots for active bookings
- ✅ Returns detailed validation report
- ✅ Suggests corrective actions

### 6. API Integration Tests

#### Test 6.1: Available Slots API
**Setup:**
- Barber with mixed booked/available slots

**Action:**
- Call `/api/barber-schedule/available-slots`

**Expected Results:**
- ✅ Returns only genuinely available slots
- ✅ Excludes slots marked as `isBooked: true`
- ✅ Excludes slots marked as `isBlocked: true`
- ✅ Considers service duration for filtering

#### Test 6.2: Validation API
**Setup:**
- Various slot availability states

**Action:**
- Call `/api/barber-schedule/validate-availability`

**Expected Results:**
- ✅ Accurately reports slot availability
- ✅ Considers both schedule status and duration conflicts
- ✅ Returns detailed conflict information

### 7. Edge Cases and Error Handling

#### Test 7.1: Non-existent Schedule
**Setup:**
- No schedule exists for barber on specific date

**Action:**
- Create booking for that date

**Expected Results:**
- ✅ Default schedule created automatically
- ✅ Booking created successfully
- ✅ Appropriate slots marked as booked

#### Test 7.2: Service Duration Edge Cases
**Setup:**
- Services with unusual durations (45min, 75min, 120min)

**Action:**
- Create bookings with various durations

**Expected Results:**
- ✅ Correct number of slots blocked
- ✅ Proper slot calculation for non-standard durations
- ✅ No off-by-one errors in slot marking

## Performance Tests

### Test P.1: Concurrent Booking Attempts
**Setup:**
- Multiple users attempting to book same/overlapping slots simultaneously

**Expected Results:**
- ✅ Only one booking succeeds
- ✅ Database transactions prevent race conditions
- ✅ Clear error messages for failed attempts

### Test P.2: Large Schedule Operations
**Setup:**
- Barber with many bookings and complex schedule

**Expected Results:**
- ✅ Schedule operations complete within acceptable time
- ✅ Memory usage remains reasonable
- ✅ Database queries are optimized

## API Testing Commands

```bash
# Test available slots (should exclude booked slots)
GET /api/barber-schedule/available-slots?barberId=123&date=2024-07-24&durationMinutes=90

# Test slot validation
POST /api/barber-schedule/validate-availability
{
  "barberId": "123",
  "bookingDate": "2024-07-24T09:00:00.000Z",
  "durationMinutes": 90
}

# Admin: Sync schedule with bookings
POST /api/barber-schedule/sync-schedule
{
  "barberId": "123",
  "date": "2024-07-24"
}

# Admin: Validate schedule consistency
GET /api/barber-schedule/validate-consistency?barberId=123&date=2024-07-24
```

## Success Criteria

### ✅ Functional Requirements
- [ ] Bookings properly mark schedule slots as blocked
- [ ] Variable durations block correct number of consecutive slots
- [ ] Atomic operations ensure data consistency
- [ ] Cancellations properly free up schedule slots
- [ ] API returns accurate availability based on schedule

### ✅ Non-Functional Requirements
- [ ] System handles concurrent booking attempts safely
- [ ] Performance remains acceptable with large schedules
- [ ] Error messages are clear and actionable
- [ ] Admin tools provide effective schedule management

### ✅ Data Integrity
- [ ] No orphaned blocked slots without corresponding bookings
- [ ] No active bookings without corresponding blocked slots
- [ ] Schedule sync utility can fix inconsistencies
- [ ] Validation tools can detect problems

## Monitoring and Maintenance

1. **Regular Consistency Checks**: Run validation utility daily
2. **Performance Monitoring**: Track booking creation times
3. **Error Logging**: Monitor schedule update failures
4. **Data Cleanup**: Periodic sync operations for data integrity
