# Absence Approval Modal with Booking Management

## 📋 Overview

Enhanced absence approval process that allows admins to handle affected bookings before approving barber absence requests. The modal provides a comprehensive interface to reassign or reject conflicting bookings.

## 🎯 Features

### **1. Affected Bookings Display**
- Shows all bookings for the barber during absence period
- Excludes already rejected/cancelled bookings
- Displays booking details: customer, service, date/time, status

### **2. Booking Actions**
- **Reassign**: Assign booking to another available barber
- **Reject**: Cancel the booking with notification to customer

### **3. Available Barber Selection**
- Loads barbers available for specific date/time/service
- Shows barber rating, experience, and total bookings
- Real-time availability checking

### **4. Progress Tracking**
- Visual progress bar showing processed bookings
- Prevents approval until all bookings are handled
- Clear status indicators

## 🔧 Technical Implementation

### **Backend APIs**

#### **Get Affected Bookings**
```
GET /api/barber-absences/:absenceId/affected-bookings
```

**Response:**
```javascript
{
  success: true,
  absence: {
    _id: "absence_id",
    barberId: "barber_id",
    barberName: "Ngô Minh Nhật",
    startDate: "2025-08-10",
    endDate: "2025-08-15",
    reason: "vacation",
    description: "Family vacation"
  },
  affectedBookings: [
    {
      _id: "booking_id",
      customerId: "customer_id",
      customerName: "John Doe",
      serviceId: "service_id",
      serviceName: "Hair Styling",
      bookingDate: "2025-08-12T10:00:00.000Z",
      status: "confirmed"
    }
  ]
}
```

#### **Process Absence Approval**
```
PUT /api/barber-absences/:absenceId/process-approval
```

**Request Body:**
```javascript
{
  bookingActions: [
    {
      bookingId: "booking_id_1",
      action: "reassign",
      newBarberId: "new_barber_id"
    },
    {
      bookingId: "booking_id_2", 
      action: "reject"
    }
  ]
}
```

**Response:**
```javascript
{
  success: true,
  message: "Absence approved and bookings processed successfully",
  absence: { ... },
  bookingResults: [
    {
      bookingId: "booking_id_1",
      success: true,
      action: "reassigned",
      newBarberId: "new_barber_id"
    },
    {
      bookingId: "booking_id_2",
      success: true,
      action: "rejected"
    }
  ],
  processedCount: 2,
  failedCount: 0
}
```

### **Frontend Components**

#### **AbsenceApprovalModal.jsx**
- Main modal component
- Handles booking actions and barber selection
- Integrates with existing barber availability API
- Progress tracking and validation

#### **Integration with AbsenceManagement.jsx**
- Modified approve button to show modal instead of direct API call
- Maintains existing rejection flow
- Added success callback handling

## 🎯 User Flow

### **1. Admin clicks "Approve" on absence request**
```
1. Modal opens showing absence details
2. Loads affected bookings automatically
3. Displays each booking with action buttons
```

### **2. For each affected booking, admin can:**
```
REASSIGN:
├── Click "Reassign" button
├── System loads available barbers for that slot
├── Admin selects new barber from dropdown
└── Booking marked as "ready for reassignment"

REJECT:
├── Click "Reject" button
├── Booking marked as "ready for rejection"
└── Customer will be notified of cancellation
```

### **3. Progress tracking:**
```
- Progress bar shows X/Y bookings processed
- "Confirm Approval" button disabled until all processed
- Visual indicators for each booking status
```

### **4. Final approval:**
```
1. Admin clicks "Confirm Approval"
2. System processes all booking actions:
   - Reassigns bookings to new barbers
   - Updates schedules for old/new barbers
   - Rejects specified bookings
   - Frees up schedule slots
3. Approves the absence request
4. Updates barber schedule for absence period
5. Shows success message and closes modal
```

## 🎨 UI Components

### **Booking Card Layout**
```
┌─────────────────────────────────────────────────────┐
│ 📅 12/08/2025 10:00 [CONFIRMED]    [Reassign][Reject]│
├─────────────────────────────────────────────────────┤
│ Customer: John Doe              │ Select New Barber: │
│ Service: Hair Styling (30 mins) │ [Dropdown with     │
│ Price: 150,000 VND              │  available barbers]│
│                                 │ ✅ Barber selected │
└─────────────────────────────────────────────────────┘
```

### **Progress Section**
```
Affected Bookings (3)                    Progress: 2/3
                                         ████████░░ 80%
```

### **Modal Footer**
```
[Cancel]                    [Confirm Approval] (disabled until 100%)
```

## 🔄 Business Logic

### **Booking Reassignment Process**
1. **Validation**: Check new barber availability
2. **Schedule Update**: 
   - Free slots for original barber
   - Mark slots for new barber
3. **Booking Update**:
   - Update barberId
   - Add reassignment metadata
   - Maintain booking history

### **Booking Rejection Process**
1. **Status Update**: Set status to 'rejected'
2. **Schedule Cleanup**: Free up time slots
3. **Notification**: Customer notification (handled by existing system)
4. **Audit Trail**: Record rejection reason and admin

### **Absence Approval Process**
1. **Process Bookings**: Handle all reassignments/rejections
2. **Update Schedules**: Mark barber as unavailable for absence period
3. **Approval Record**: Update absence with approval details
4. **Notification**: Barber notification (handled by existing system)

## 🚀 Benefits

### **✅ Comprehensive Workflow**
- Single interface to handle all aspects of absence approval
- No orphaned bookings or schedule conflicts
- Clear audit trail of all actions

### **✅ User Experience**
- Visual progress tracking
- Intuitive booking management
- Prevents incomplete approvals

### **✅ Data Integrity**
- Atomic operations for booking updates
- Schedule consistency maintained
- Proper error handling and rollback

### **✅ Flexibility**
- Mix of reassignments and rejections
- Real-time barber availability
- Easy to modify actions before final approval

## 🔧 Future Enhancements

1. **Bulk Actions**: Select multiple bookings for same action
2. **Auto-Suggest**: Recommend best barbers for reassignment
3. **Customer Notification Preview**: Show notification content before sending
4. **Conflict Resolution**: Handle scheduling conflicts automatically
5. **Approval Templates**: Save common approval patterns
