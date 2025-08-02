# Barbershop Booking System - Frontend Documentation

## Table of Contents
1. [Booking Flow Documentation](#booking-flow-documentation)
2. [Absence Flow Documentation](#absence-flow-documentation)
3. [No-Show Flow Documentation](#no-show-flow-documentation)
4. [Technical Implementation](#technical-implementation)
5. [User Roles & Permissions](#user-roles--permissions)
6. [API Integration](#api-integration)

---

## 1. Booking Flow Documentation

### 1.1 Customer Booking Creation Process

#### **Step 1: Service Selection**
**Component:** `ServiceSelectionPage.jsx`
**Location:** `front-end/src/pages/ServiceBooking/`

```javascript
// Service selection with rich UI cards
<Card style={{ 
  border: selectedService?._id === service._id ? '2px solid #1890ff' : '1px solid #f0f0f0',
  backgroundColor: selectedService?._id === service._id ? '#f6ffed' : 'white'
}}>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div>
      <div style={{ fontWeight: 'bold' }}>{service.name}</div>
      <div style={{ color: '#666' }}>{service.description}</div>
      <div style={{ color: '#999' }}>Duration: {service.durationMinutes} minutes</div>
    </div>
    <div style={{ fontWeight: 'bold', color: '#1890ff' }}>
      {service.price?.toLocaleString()} VND
    </div>
  </div>
</Card>
```

**User Journey:**
1. Customer browses available services
2. Service cards display name, description, duration, and price
3. Customer clicks to select service
4. Toast notification confirms selection: `📋 Service selected: {serviceName}`
5. System validates service availability
6. Customer proceeds to barber selection

**Validation Rules:**
- Service must be active and available
- Price information must be current
- Duration must be valid (15-180 minutes)

#### **Step 2: Barber Selection**
**Component:** `BarberSelectionPage.jsx`

```javascript
// Enhanced barber selection with avatars and specialties
<Card>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <Avatar src={barber.userId?.avatar}>
      {barber.userId?.name?.charAt(0)?.toUpperCase()}
    </Avatar>
    <div>
      <div style={{ fontWeight: 'bold' }}>{barber.userId?.name}</div>
      <div style={{ color: '#666' }}>
        Specialties: {barber.specialties?.join(', ')}
      </div>
      <div style={{ color: '#999' }}>
        Experience: {barber.experienceYears} years ⭐ {barber.rating?.toFixed(1)}
      </div>
    </div>
  </div>
</Card>
```

**User Journey:**
1. Customer views available barbers for selected service
2. Auto-assign option prominently displayed as recommended
3. Individual barber cards show photo, name, specialties, experience, rating
4. Customer selects barber or chooses auto-assign
5. Toast notification: `👤 Barber selected: {barberName}` or `🤖 Auto-assign enabled`
6. System checks barber availability for selected date range

#### **Step 3: Time Slot Selection**
**Component:** `TimeSlotPicker.jsx`

```javascript
// Modern time slot picker with date validation
const disabledDate = (current) => {
  const isPastDate = current && current < dayjs().startOf('day');
  if (isPastDate) {
    toast.warn('📅 Past dates cannot be selected for booking', {
      position: "top-right",
      autoClose: 3000,
      toastId: 'past-date-warning',
    });
  }
  return isPastDate;
};
```

**User Journey:**
1. Customer selects date using DatePicker (past dates disabled)
2. System loads available time slots for selected date/barber/service
3. Time slots displayed as interactive cards with availability status
4. Customer clicks desired time slot
5. Confirmation modal shows booking summary
6. Toast notifications guide the process:
   - `📅 Date selected: {date}`
   - `✅ Found {count} available time slots`
   - `🎉 Time slot selected successfully!`

**Time Slot States:**
- **Available** (Blue): `<Tag color="blue">Available</Tag>`
- **Selected** (Green): `<Tag color="success" icon={<CheckCircleOutlined />}>Selected</Tag>`
- **Validating** (Processing): `<Tag color="processing"><Spin size="small" />Validating</Tag>`

#### **Step 4: Booking Information & Confirmation**
**Component:** `BookingInfoPage.jsx`

```javascript
// Progressive loading with toast updates
const loadingToastId = toast.loading('🔄 Creating your booking...', {
  position: "top-right",
  autoClose: false,
});

// Success with detailed information
toast.update(loadingToastId, {
  render: `🎉 Booking confirmed successfully!\n📅 ${service.name} with ${barber?.userId?.name}\n🕐 ${timeSlot.date} at ${timeSlot.time}`,
  type: "success",
  isLoading: false,
  autoClose: 5000,
});
```

**User Journey:**
1. Customer enters contact information and special requests
2. Booking summary displays all selected details
3. Real-time validation prevents conflicts
4. Customer confirms booking
5. Progressive toast notifications show creation progress
6. Success confirmation with booking details
7. Customer receives booking ID and confirmation

**Validation During Creation:**
- Time slot availability re-checked
- Customer double-booking prevention
- Barber absence period validation
- Service compatibility verification

### 1.2 Booking Edit/Modification Functionality

#### **Enhanced Edit Modal**
**Component:** `MyBookingsPage.jsx` - Edit Modal

```javascript
// Booking edit eligibility check
const canEditBooking = (booking) => {
  if (!['pending', 'confirmed'].includes(booking.status)) {
    return { canEdit: false, reason: `Cannot edit ${booking.status} bookings` };
  }
  
  const bookingTime = dayjs(booking.bookingDate);
  const hoursDifference = bookingTime.diff(dayjs(), 'hour');
  
  if (hoursDifference < 24) {
    return { canEdit: false, reason: 'Cannot edit bookings within 24 hours' };
  }
  
  return { canEdit: true, reason: null };
};
```

**Edit Process:**
1. **Eligibility Check**: Only pending/confirmed bookings >24 hours away
2. **Service Modification**: Rich service selection with price comparison
3. **Barber Reassignment**: Enhanced barber selection with specialties
4. **Time Slot Update**: Integrated TimeSlotPicker for new time selection
5. **Comparison View**: Side-by-side current vs new booking details

**Service Comparison Display:**
```javascript
<Row gutter={16}>
  <Col span={12}>
    <Card title="Current Service" style={{ backgroundColor: '#fff2e8' }}>
      <div><strong>Name:</strong> {currentService.name}</div>
      <div><strong>Price:</strong> {currentService.price} VND</div>
    </Card>
  </Col>
  <Col span={12}>
    <Card title="New Service" style={{ backgroundColor: '#f6ffed' }}>
      <div><strong>Name:</strong> {newService.name}</div>
      <div><strong>Price:</strong> {newService.price} VND</div>
      <Tag color={priceDiff > 0 ? 'red' : 'green'}>
        {priceDiff > 0 ? '+' : ''}{priceDiff} VND
      </Tag>
    </Card>
  </Col>
</Row>
```

### 1.3 Booking Cancellation Process

#### **Cancellation with Policy Enforcement**
```javascript
// Enhanced cancellation with detailed feedback
const handleCancelBooking = async () => {
  const loadingToastId = toast.loading(
    `❌ Cancelling booking for ${selectedBooking.serviceId?.name}...`
  );
  
  try {
    await cancelBooking(selectedBooking._id, cancelReason);
    
    toast.update(loadingToastId, {
      render: `✅ Booking cancelled successfully!\n💰 Refund will be processed according to our cancellation policy.`,
      type: "success",
      autoClose: 5000,
    });
  } catch (error) {
    toast.update(loadingToastId, {
      render: `❌ Failed to cancel booking\n${error.message}`,
      type: "error",
      autoClose: 5000,
    });
  }
};
```

**Cancellation Rules:**
- **>48 hours**: Full refund
- **24-48 hours**: 50% refund
- **<24 hours**: No refund
- **No-show**: No refund + penalty

### 1.4 Admin Booking Confirmation Workflow

#### **Bulk Confirmation Interface**
**Component:** `BookingConfirmationManagement.jsx`

```javascript
// Bulk confirmation with progress tracking
const handleBulkConfirm = async () => {
  const loadingToastId = toast.loading(
    `✅ Confirming ${selectedRowKeys.length} booking(s)...`
  );
  
  const response = await axios.post('/api/bookings/bulk-confirm', {
    bookingIds: selectedRowKeys
  });
  
  toast.update(loadingToastId, {
    render: `🎉 ${response.data.confirmedCount} booking(s) confirmed!\n✅ Customers will be notified automatically.`,
    type: "success",
    autoClose: 5000,
  });
};
```

**Admin Features:**
- Pending bookings dashboard
- Bulk confirmation actions
- Individual booking review
- Customer notification automation
- Booking statistics and analytics

---

## 2. Absence Flow Documentation

### 2.1 Barber Absence Request Submission

#### **Absence Request Form**
**Component:** `BarberAbsenceRequest.jsx`

```javascript
// Enhanced absence request with affected bookings preview
const handleSubmit = async (values) => {
  const loadingToastId = toast.loading('📝 Submitting your absence request...');
  
  try {
    const response = await createBarberAbsence({
      startDate: values.dateRange[0].toISOString(),
      endDate: values.dateRange[1].toISOString(),
      reason: values.reason,
      description: values.description
    });
    
    toast.update(loadingToastId, {
      render: `🎉 Absence request submitted!\n📅 Period: ${startDate} - ${endDate}\n⏳ Status: Awaiting admin approval`,
      type: "success",
      autoClose: 5000,
    });
    
    if (response.affectedBookingsCount > 0) {
      toast.warn(
        `⚠️ ${response.affectedBookingsCount} existing booking(s) may be affected.\nThese bookings will need to be reassigned upon approval.`,
        { autoClose: 7000 }
      );
    }
  } catch (error) {
    toast.update(loadingToastId, {
      render: `❌ Failed to submit absence request\n${error.message}`,
      type: "error",
      autoClose: 5000,
    });
  }
};
```

**Submission Process:**
1. Barber selects absence date range
2. Chooses reason (sick leave, vacation, emergency, etc.)
3. Adds optional description
4. System identifies affected bookings
5. Preview shows impact on existing bookings
6. Submission with progress feedback
7. Automatic notification to admin

### 2.2 Admin Absence Approval Workflow

#### **Approval Interface with Impact Assessment**
**Component:** `BarberScheduleManagement.jsx`

```javascript
// Approval with comprehensive feedback
const handleApprovalChange = async (absenceId, isApproved) => {
  const loadingToastId = toast.loading(
    `${isApproved ? '✅ Approving' : '❌ Rejecting'} absence request...`
  );
  
  try {
    await updateAbsenceApproval(absenceId, isApproved);
    
    toast.update(loadingToastId, {
      render: isApproved 
        ? `✅ Absence approved!\n📅 Schedule updated automatically.\n🔄 Affected bookings can now be reassigned.`
        : `❌ Absence rejected.\n📅 Schedule remains unchanged.\n✅ No further action required.`,
      type: "success",
      autoClose: 5000,
    });
  } catch (error) {
    toast.update(loadingToastId, {
      render: `❌ Failed to ${isApproved ? 'approve' : 'reject'} request\n${error.message}`,
      type: "error",
      autoClose: 5000,
    });
  }
};
```

**Approval Features:**
- Absence request dashboard
- Impact assessment for each request
- Affected bookings preview
- One-click approval/rejection
- Automatic schedule synchronization
- Barber and customer notifications

### 2.3 Enhanced Barber Reassignment Modal

#### **Intelligent Barber Assignment**
```javascript
// Advanced barber assignment with specialty matching
const getFilteredBarbers = () => {
  return availableBarbers.filter(barber => {
    const barberName = barber.userId?.name || '';
    const barberSpecialties = barber.specialties || [];
    
    const matchesSearch = !barberSearchTerm || 
      barberName.toLowerCase().includes(barberSearchTerm.toLowerCase()) ||
      barberSpecialties.some(specialty => 
        specialty && specialty.toLowerCase().includes(barberSearchTerm.toLowerCase())
      );
    
    const matchesSpecialty = !selectedSpecialtyFilter || 
      barberSpecialties.includes(selectedSpecialtyFilter);
    
    return matchesSearch && matchesSpecialty;
  });
};
```

**Assignment Features:**
- **Smart Filtering**: By name, specialty, availability
- **Specialty Matching**: Automatic compatibility checking
- **Availability Verification**: Real-time schedule checking
- **Bulk Assignment**: Multiple bookings at once
- **Conflict Prevention**: Automatic overlap detection
- **Customer Notification**: Automatic change notifications

### 2.4 Schedule Synchronization

#### **Automatic Slot Blocking**
```javascript
// Schedule synchronization with absence periods
const syncAbsenceWithSchedule = async (barberId, startDate, endDate) => {
  try {
    // Block all slots during absence period
    await BarberSchedule.markPeriodAsOff(barberId, startDate, endDate, {
      reason: 'absence',
      isApproved: true
    });
    
    // Update affected bookings status
    await Booking.updateMany(
      {
        barberId,
        bookingDate: { $gte: startDate, $lte: endDate },
        status: { $in: ['pending', 'confirmed'] }
      },
      { status: 'needs_reassignment' }
    );
    
    console.log(`Schedule synchronized for barber ${barberId}`);
  } catch (error) {
    console.error('Schedule sync failed:', error);
  }
};
```

---

## 3. No-Show Flow Documentation

### 3.1 Barber No-Show Marking

#### **No-Show Interface**
**Component:** `BarberBookingManagement.jsx`

```javascript
// Enhanced no-show marking with detailed feedback
const handleBookingStatusUpdate = async (bookingId, newStatus) => {
  const loadingToastId = toast.loading(
    `${newStatus === 'completed' ? '✅ Marking as completed' : '❌ Marking as no-show'}...`
  );
  
  try {
    await updateBookingStatus(bookingId, newStatus);
    
    toast.update(loadingToastId, {
      render: newStatus === 'completed' 
        ? `🎉 Booking completed!\n✅ Service finished successfully.\n💰 Payment can be processed.`
        : `📝 Marked as no-show.\n⚠️ Customer penalty applied.\n📊 No-show record created.`,
      type: "success",
      autoClose: 5000,
    });
  } catch (error) {
    toast.update(loadingToastId, {
      render: `❌ Failed to update status\n${error.message}`,
      type: "error",
      autoClose: 5000,
    });
  }
};
```

**No-Show Process:**
1. Barber waits for customer (15-minute grace period)
2. Marks booking as no-show if customer doesn't arrive
3. System automatically applies penalty
4. Customer notification sent
5. Schedule slot becomes available
6. No-show count incremented

### 3.2 Three-Strike Policy Implementation

#### **Automatic Booking Restriction**
```javascript
// No-show tracking and restriction logic
const checkNoShowEligibility = async (customerId) => {
  const noShowCount = await Booking.countDocuments({
    customerId,
    status: 'no_show',
    createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
  });
  
  if (noShowCount >= 3) {
    return {
      canBook: false,
      reason: 'Customer has exceeded no-show limit (3 strikes)',
      restrictionUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }
  
  return { canBook: true };
};
```

**Policy Features:**
- **Strike Tracking**: Automatic no-show counting
- **Temporary Restriction**: 7-day booking suspension after 3 strikes
- **Grace Period**: 15-minute wait time before marking no-show
- **Admin Override**: Manual penalty removal capability
- **Notification System**: Customer warnings at 2 strikes

### 3.3 No-Show Analytics and Reporting

#### **Admin Dashboard Metrics**
```javascript
// No-show analytics component
const NoShowAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalNoShows: 0,
    noShowRate: 0,
    topOffenders: [],
    monthlyTrend: []
  });
  
  return (
    <Card title="No-Show Analytics">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic title="Total No-Shows" value={analytics.totalNoShows} />
        </Col>
        <Col span={6}>
          <Statistic 
            title="No-Show Rate" 
            value={analytics.noShowRate} 
            suffix="%" 
          />
        </Col>
        <Col span={12}>
          <div>Top Offenders: {analytics.topOffenders.length}</div>
        </Col>
      </Row>
    </Card>
  );
};
```

---

## 4. Technical Implementation

### 4.1 Toast Notification System

#### **Centralized Toast Configuration**
```javascript
// Toast notification patterns
const ToastPatterns = {
  loading: (message) => toast.loading(message, {
    position: "top-right",
    autoClose: false,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover: true,
    draggable: true,
  }),
  
  success: (message) => toast.success(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  }),
  
  error: (message) => toast.error(message, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  }),
  
  progressive: (loadingId, successMessage, type = "success") => 
    toast.update(loadingId, {
      render: successMessage,
      type: type,
      isLoading: false,
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
};
```

### 4.2 Timezone Handling

#### **Consistent Date/Time Processing**
```javascript
// Proper timezone handling for booking dates
const createBookingDateTime = (date, time) => {
  const [year, month, day] = date.split('-');
  const [hour, minute] = time.split(':');
  
  // Create local time (not UTC)
  const bookingDateTime = new Date(
    parseInt(year), 
    parseInt(month) - 1, // Month is 0-indexed
    parseInt(day), 
    parseInt(hour), 
    parseInt(minute)
  );
  
  return bookingDateTime.toISOString();
};

// Display formatting
const formatBookingTime = (isoString) => {
  return dayjs(isoString).format('DD/MM/YYYY HH:mm');
};
```

### 4.3 Validation Rules Engine

#### **Business Logic Validation**
```javascript
// Comprehensive booking validation
const BookingValidation = {
  canBook: (customer, booking) => {
    // Check no-show eligibility
    if (customer.noShowCount >= 3) {
      return { valid: false, reason: 'Customer suspended due to no-shows' };
    }
    
    // Check time constraints
    const bookingTime = dayjs(booking.bookingDate);
    const now = dayjs();
    
    if (bookingTime.isBefore(now)) {
      return { valid: false, reason: 'Cannot book past dates' };
    }
    
    if (bookingTime.diff(now, 'hour') < 2) {
      return { valid: false, reason: 'Minimum 2 hours advance booking required' };
    }
    
    return { valid: true };
  },
  
  canEdit: (booking) => {
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return { valid: false, reason: `Cannot edit ${booking.status} bookings` };
    }
    
    const hoursDiff = dayjs(booking.bookingDate).diff(dayjs(), 'hour');
    if (hoursDiff < 24) {
      return { valid: false, reason: 'Cannot edit within 24 hours' };
    }
    
    return { valid: true };
  },
  
  canCancel: (booking) => {
    if (['completed', 'cancelled', 'no_show'].includes(booking.status)) {
      return { valid: false, reason: `Cannot cancel ${booking.status} bookings` };
    }
    
    return { valid: true };
  }
};
```

---

## 5. User Roles & Permissions

### 5.1 Role-Based Access Control

| Action | Customer | Barber | Admin |
|--------|----------|--------|-------|
| Create Booking | ✅ | ❌ | ✅ |
| Edit Own Booking | ✅ | ❌ | ✅ |
| Cancel Own Booking | ✅ | ❌ | ✅ |
| Mark No-Show | ❌ | ✅ | ✅ |
| Mark Completed | ❌ | ✅ | ✅ |
| Submit Absence | ❌ | ✅ | ❌ |
| Approve Absence | ❌ | ❌ | ✅ |
| Reassign Bookings | ❌ | ❌ | ✅ |
| View All Bookings | ❌ | Own Only | ✅ |
| Override No-Show | ❌ | ❌ | ✅ |

### 5.2 Permission Validation

```javascript
// Role-based component rendering
const BookingActions = ({ booking, userRole }) => {
  return (
    <Space>
      {userRole === 'customer' && canEdit(booking) && (
        <Button icon={<EditOutlined />} onClick={() => editBooking(booking)}>
          Edit
        </Button>
      )}
      
      {userRole === 'barber' && booking.barberId === currentUser.barberId && (
        <>
          <Button onClick={() => markCompleted(booking)}>Complete</Button>
          <Button danger onClick={() => markNoShow(booking)}>No-Show</Button>
        </>
      )}
      
      {userRole === 'admin' && (
        <>
          <Button type="primary" onClick={() => confirmBooking(booking)}>
            Confirm
          </Button>
          <Button onClick={() => reassignBooking(booking)}>Reassign</Button>
        </>
      )}
    </Space>
  );
};
```

---

## 6. API Integration

### 6.1 Booking API Endpoints

```javascript
// Booking API service
export const BookingAPI = {
  // Create new booking
  create: (bookingData) => 
    axios.post('/api/bookings', bookingData, { withCredentials: true }),
  
  // Update existing booking
  update: (bookingId, updateData) => 
    axios.put(`/api/bookings/${bookingId}`, updateData, { withCredentials: true }),
  
  // Cancel booking
  cancel: (bookingId, reason) => 
    axios.put(`/api/bookings/${bookingId}/cancel`, { reason }, { withCredentials: true }),
  
  // Get customer bookings
  getMyBookings: (filters) => 
    axios.get('/api/bookings/my-bookings', { params: filters, withCredentials: true }),
  
  // Update booking status (barber/admin)
  updateStatus: (bookingId, status, reason) => 
    axios.put(`/api/bookings/${bookingId}/status`, { status, reason }, { withCredentials: true }),
  
  // Bulk confirm bookings (admin)
  bulkConfirm: (bookingIds) => 
    axios.post('/api/bookings/bulk-confirm', { bookingIds }, { withCredentials: true })
};
```

### 6.2 Absence API Endpoints

```javascript
// Absence API service
export const AbsenceAPI = {
  // Submit absence request
  create: (absenceData) => 
    axios.post('/api/barber-absences', absenceData, { withCredentials: true }),
  
  // Get all absences (admin)
  getAll: (filters) => 
    axios.get('/api/barber-absences', { params: filters, withCredentials: true }),
  
  // Approve/reject absence
  updateApproval: (absenceId, isApproved) => 
    axios.put(`/api/barber-absences/${absenceId}/approval`, { isApproved }, { withCredentials: true }),
  
  // Reassign affected bookings
  reassignBookings: (absenceId, assignments) => 
    axios.post(`/api/barber-absences/${absenceId}/reassign`, { assignments }, { withCredentials: true })
};
```

### 6.3 Schedule API Endpoints

```javascript
// Schedule API service
export const ScheduleAPI = {
  // Get available time slots
  getAvailableSlots: (barberId, date, options) => 
    axios.get('/api/barber-schedule/available-slots', { 
      params: { barberId, date, ...options } 
    }),
  
  // Validate time slot availability
  validateSlot: (validationData) => 
    axios.post('/api/barber-schedule/validate-availability', validationData),
  
  // Check if barber is off
  checkBarberOff: (barberId, date) => 
    axios.get('/api/barber-schedule/is-off', { params: { barberId, date } })
};
```

---

## 7. Mobile Responsiveness

### 7.1 Responsive Design Patterns

```javascript
// Mobile-optimized layouts
const ResponsiveBookingCard = () => (
  <Card>
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <div>Service Information</div>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <div>Barber Information</div>
      </Col>
      <Col xs={24} sm={24} md={8}>
        <div>Booking Actions</div>
      </Col>
    </Row>
  </Card>
);

// Touch-friendly time slot picker
const MobileTimeSlots = () => (
  <Row gutter={[8, 8]}>
    {slots.map(slot => (
      <Col xs={12} sm={8} md={6} key={slot}>
        <Card 
          hoverable
          style={{ 
            minHeight: '80px',
            cursor: 'pointer',
            textAlign: 'center'
          }}
          onClick={() => selectSlot(slot)}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {slot}
          </div>
        </Card>
      </Col>
    ))}
  </Row>
);
```

### 7.2 Mobile-Specific Features

- **Touch-friendly buttons**: Minimum 44px touch targets
- **Swipe gestures**: For navigating between booking steps
- **Pull-to-refresh**: For updating booking lists
- **Offline support**: Basic functionality when offline
- **Push notifications**: Booking reminders and updates

---

## 8. Error Handling & Edge Cases

### 8.1 Network Error Handling

```javascript
// Comprehensive error handling
const handleAPIError = (error, operation) => {
  if (!error.response) {
    // Network error
    toast.error(`🌐 Network Error!\nUnable to ${operation}. Please check your connection.`);
  } else if (error.response.status === 409) {
    // Conflict error
    toast.error(`⚠️ Booking Conflict!\n${error.response.data.message}`);
  } else if (error.response.status === 403) {
    // Permission error
    toast.error(`🔒 Access Denied!\nYou don't have permission to ${operation}.`);
  } else {
    // Generic error
    toast.error(`❌ Failed to ${operation}\n${error.response.data.message || 'Please try again.'}`);
  }
};
```

### 8.2 Edge Case Scenarios

1. **Concurrent Booking Attempts**: Real-time validation prevents double-booking
2. **Barber Sudden Absence**: Emergency absence workflow with immediate notifications
3. **System Downtime**: Graceful degradation with offline capabilities
4. **Payment Failures**: Booking held for 15 minutes pending payment retry
5. **Time Zone Changes**: Automatic adjustment for daylight saving time
6. **Browser Refresh**: State persistence using localStorage
7. **Session Expiry**: Automatic re-authentication with booking preservation

---

This comprehensive documentation covers all major user flows, technical implementations, and edge cases for the barbershop booking system frontend. Each section includes practical code examples, user journey descriptions, and implementation details for developers and stakeholders.
