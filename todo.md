# Barbershop Single-Page Booking Flow - Implementation TODO

## Project Overview
Transform the current multi-step booking process into a unified single-page experience with progressive disclosure of booking steps.

**Current Flow:** ServiceListPage → BarberSelectionPage → TimeSlotPickerPage → BookingInfoPage  
**New Flow:** Single page with progressive steps (Service → Time → Barber → Customer Info → Confirm)

---

## 🎯 Main Tasks

### [x] 1. Backend API Modifications *(2025-01-02)*
~~Update backend controllers to support single-page booking flow requirements~~

#### [x] 1.1 Create customer-accessible endpoint for available barbers by time slot *(2025-01-02)*
- [x] ~~Modify `/api/barbers/available` endpoint to be accessible by customers (currently admin-only)~~ *(2025-01-02)*
- [x] ~~Ensure proper filtering of barbers by specific date/time availability~~ *(2025-01-02)*
- [x] ~~Update route permissions in `back-end/routes/barber.route.js`~~ *(2025-01-02)*
- [x] ~~Test endpoint with customer authentication~~ *(2025-01-02)*

#### [x] 1.2 Add random barber assignment API endpoint *(2025-01-02)*
- [x] ~~Create new endpoint `/api/barbers/auto-assign-for-slot`~~ *(2025-01-02)*
- [x] ~~Implement logic to automatically select best available barber for given time slot~~ *(2025-01-02)*
- [x] ~~Consider factors: rating, availability, workload distribution~~ *(2025-01-02)*
- [x] ~~Add endpoint to barber routes~~ *(2025-01-02)*

#### [x] 1.3 Update booking controller for single-page flow *(2025-01-02)*
- [x] ~~Modify booking creation logic in `back-end/controllers/booking.controller.js`~~ *(2025-01-02)*
- [x] ~~Ensure compatibility with new single-page data structure~~ *(2025-01-02)*
- [x] ~~Maintain existing validation and conflict checking~~ *(2025-01-02)*
- [x] ~~Test booking creation with new flow~~ *(2025-01-02)*

---

### [x] 2. Frontend Component Development *(2025-01-02)*
~~Create new single-page booking component with progressive steps~~

#### [x] 2.1 Create SinglePageBooking component *(2025-01-02)*
- [x] ~~Create `front-end/src/pages/ServiceBooking/SinglePageBooking.jsx`~~ *(2025-01-02)*
- [x] ~~Set up basic component structure with step management~~ *(2025-01-02)*
- [x] ~~Implement state management for all booking data~~ *(2025-01-02)*
- [x] ~~Add progress indicator component~~ *(2025-01-02)*

#### [x] 2.2 Implement service selection step *(2025-01-02)*
- [x] ~~Integrate service selection from existing `ServiceListPage.jsx`~~ *(2025-01-02)*
- [x] ~~Reuse service filtering and display logic~~ *(2025-01-02)*
- [x] ~~Add service selection validation~~ *(2025-01-02)*
- [x] ~~Handle service change and reset subsequent steps~~ *(2025-01-02)*

#### [x] 2.3 Implement time slot selection step *(2025-01-02)*
- [x] ~~Integrate existing `TimeSlotPicker` component~~ *(2025-01-02)*
- [x] ~~Modify to work without navigation (no redirect)~~ *(2025-01-02)*
- [x] ~~Ensure proper date/time validation~~ *(2025-01-02)*
- [x] ~~Handle time slot change and reset barber selection~~ *(2025-01-02)*

#### [x] 2.4 Implement barber selection step *(2025-01-02)*
- [x] ~~Create barber selection interface for specific time slots~~ *(2025-01-02)*
- [x] ~~Fetch and display available barbers for selected time~~ *(2025-01-02)*
- [x] ~~Add "Random Barber" option with clear indication~~ *(2025-01-02)*
- [x] ~~Show barber profiles, ratings, and availability status~~ *(2025-01-02)*
- [x] ~~Handle barber selection and auto-assignment~~ *(2025-01-02)*

#### [x] 2.5 Implement customer information step *(2025-01-02)*
- [x] ~~Integrate existing `BookingInfoForm` logic~~ *(2025-01-02)*
- [x] ~~Adapt form for single-page context~~ *(2025-01-02)*
- [x] ~~Maintain existing validation rules~~ *(2025-01-02)*
- [x] ~~Add booking summary display~~ *(2025-01-02)*

#### [x] 2.6 Add step navigation and progress indicators *(2025-01-02)*
- [x] ~~Implement step-by-step navigation controls~~ *(2025-01-02)*
- [x] ~~Add progress bar/stepper component~~ *(2025-01-02)*
- [x] ~~Enable going back to previous steps~~ *(2025-01-02)*
- [x] ~~Add validation before step progression~~ *(2025-01-02)*
- [x] ~~Implement responsive design for mobile~~ *(2025-01-02)*

---

### [x] 3. Routing and Navigation Updates *(2025-01-02)*
~~Update routing configuration and navigation to support new booking flow~~

#### [x] 3.1 Add new route for single-page booking *(2025-01-02)*
- [x] ~~Add `/book-service` route in `front-end/src/route.jsx`~~ *(2025-01-02)*
- [x] ~~Configure route with proper authentication if needed~~ *(2025-01-02)*
- [x] ~~Test route accessibility~~ *(2025-01-02)*

#### [x] 3.2 Update navigation links *(2025-01-02)*
- [x] ~~Update service booking entry points to use new route~~ *(2025-01-02)*
- [x] ~~Modify `ServiceBooking.jsx` to link to new flow~~ *(2025-01-02)*
- [x] ~~Update any "Book Now" buttons throughout the app~~ *(2025-01-02)*
- [x] ~~Update navigation menus if applicable~~ *(2025-01-02)*

#### [x] 3.3 Maintain backward compatibility *(2025-01-02)*
- [x] ~~Keep existing routes functional for bookmarks/external links~~ *(2025-01-02)*
- [x] ~~Add redirects from old routes to new single-page flow~~ *(2025-01-02)*
- [x] ~~Test all existing booking-related URLs~~ *(2025-01-02)*

---

### [x] 4. Integration and Testing *(2025-01-02)*
~~Integrate new booking flow and test all functionality~~

#### [x] 4.1 Test complete booking flow *(2025-01-02)*
- [x] ~~Test service selection to booking confirmation~~ *(2025-01-02)*
- [x] ~~Verify all steps work correctly in sequence~~ *(2025-01-02)*
- [x] ~~Test step navigation (forward and backward)~~ *(2025-01-02)*
- [x] ~~Verify booking creation and database storage~~ *(2025-01-02)*

#### [x] 4.2 Test barber availability logic *(2025-01-02)*
- [x] ~~Test barber availability for specific time slots~~ *(2025-01-02)*
- [x] ~~Verify random assignment functionality~~ *(2025-01-02)*
- [x] ~~Test edge cases (no available barbers)~~ *(2025-01-02)*
- [x] ~~Verify availability updates in real-time~~ *(2025-01-02)*

#### [x] 4.3 Test edge cases and error handling *(2025-01-02)*
- [x] ~~Test booking conflicts and double-booking prevention~~ *(2025-01-02)*
- [x] ~~Test network errors and API failures~~ *(2025-01-02)*
- [x] ~~Test invalid data submissions~~ *(2025-01-02)*
- [x] ~~Test browser refresh and data persistence~~ *(2025-01-02)*

#### [x] 4.4 Performance and UX testing *(2025-01-02)*
- [x] ~~Test loading times for each step~~ *(2025-01-02)*
- [x] ~~Test mobile responsiveness~~ *(2025-01-02)*
- [x] ~~Gather user feedback on new flow~~ *(2025-01-02)*
- [x] ~~Optimize performance bottlenecks~~ *(2025-01-02)*

#### [x] 4.5 Fix Time Slot Selection Logic *(2025-01-02)*
- [x] ~~Reverse time slot selection logic for new flow~~ *(2025-01-02)*
- [x] ~~Create API endpoint for all available time slots~~ *(2025-01-02)*
- [x] ~~Update TimeSlotSelectionStep to work without barber dependency~~ *(2025-01-02)*
- [x] ~~Ensure BarberSelectionStep filters by selected time slot~~ *(2025-01-02)*

---

## 🔧 Technical Implementation Notes

### API Endpoints to Create/Modify:
- `GET /api/barbers/available?date=YYYY-MM-DD&timeSlot=HH:MM` (make customer-accessible)
- `POST /api/barbers/auto-assign-for-slot` (new endpoint)
- Existing booking creation endpoint (ensure compatibility)

### Key Components:
- `SinglePageBooking.jsx` (main component)
- `BookingStepIndicator.jsx` (progress indicator)
- Modified `TimeSlotPicker.jsx` (no navigation)
- `BarberSelectionStep.jsx` (new component)

### State Management:
```javascript
const [bookingData, setBookingData] = useState({
  service: null,
  timeSlot: null,
  barber: null, // or 'random'
  customerInfo: null,
  currentStep: 1
});
```

---

## 📋 Completion Checklist

When a task is completed, mark it with `[x]` and add completion date:

**Example:**
- [x] ~~Create todo.md file~~ *(2025-01-02)*

---

## 🚀 Getting Started

1. Start with Backend API modifications (Section 1)
2. Create basic SinglePageBooking component structure
3. Implement each step progressively
4. Add routing and navigation
5. Comprehensive testing

---

*Last Updated: 2025-01-02*
*Total Tasks: 25+ individual items*
