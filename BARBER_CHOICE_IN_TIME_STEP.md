# Barber Choice in Time Step Feature

## Overview

This feature enhances the booking flow by allowing customers to choose between auto-assignment and manual barber selection directly in the time slot selection step, rather than in a separate step.

## New Booking Flow

### Previous Flow:
1. Select Service
2. Select Time Slot
3. Select Barber (separate step)
4. Enter Customer Info
5. Confirm Booking

### New Flow:
1. Select Service
2. **Select Time Slot** (enhanced with barber choice)
   - Select Date
   - **[NEW] Choose Barber checkbox**
   - **[NEW] Barber Selection (if checkbox checked)**
   - Select Time Slot
3. ~~Select Barber~~ (skipped if already chosen)
4. Enter Customer Info
5. Confirm Booking

## Components

### 1. BarberChoiceToggle
**Location:** `front-end/src/components/BarberChoiceToggle.jsx`

**Purpose:** Displays a checkbox allowing users to choose between auto-assignment and manual barber selection.

**Props:**
- `chooseBarberManually` (boolean): Current selection mode
- `onChoiceChange` (function): Callback when mode changes
- `disabled` (boolean): Whether the toggle is disabled

**Features:**
- Visual feedback with different background colors
- Clear explanations for each mode
- Smooth transitions and animations

### 2. BarberSelectionInTimeStep
**Location:** `front-end/src/components/BarberSelectionInTimeStep.jsx`

**Purpose:** Shows available barbers for the selected date when manual selection is enabled.

**Props:**
- `selectedDate` (dayjs object): The selected date
- `service` (object): Selected service information
- `selectedBarber` (object): Currently selected barber
- `onBarberSelect` (function): Callback when barber is selected
- `disabled` (boolean): Whether selection is disabled

**Features:**
- Loads barbers available for the selected date
- Shows barber details (name, rating, experience, specialties)
- Visual selection feedback
- Responsive grid layout

### 3. Enhanced TimeSlotSelectionStep
**Location:** `front-end/src/components/TimeSlotSelectionStep.jsx`

**Enhancements:**
- Integrates BarberChoiceToggle and BarberSelectionInTimeStep
- Handles two modes of slot loading:
  - **Auto-assignment mode**: Shows all available slots across all barbers
  - **Manual selection mode**: Shows slots only for the selected barber
- Improved slot button states (disabled when barber not selected in manual mode)
- Enhanced visual feedback and instructions

## User Experience

### Auto-Assignment Mode (Default)
1. User selects a date
2. System shows all available time slots across all barbers
3. User selects a time slot
4. System automatically assigns the best available barber
5. Flow proceeds to customer information step

### Manual Selection Mode
1. User selects a date
2. User checks "Choose Barber" checkbox
3. System shows available barbers for the selected date
4. User selects a barber
5. System shows time slots only for the selected barber
6. User selects a time slot
7. Flow proceeds to customer information step (skipping barber selection)

## Technical Implementation

### State Management
The TimeSlotSelectionStep now manages additional state:
- `chooseBarberManually`: Boolean indicating the selection mode
- `selectedBarberInStep`: The barber selected within the time step

### API Calls
- **Auto-assignment mode**: Uses `fetchAllAvailableSlots()` to get slots across all barbers
- **Manual selection mode**: Uses `fetchAvailableSlots(barberId, date)` to get slots for specific barber

### Flow Control
The SinglePageBooking component now intelligently skips the barber selection step when:
- Barber was already selected in the time step (manual mode)
- Auto-assignment is enabled

### Enhanced Time Slot Object
The time slot object now includes additional information:
```javascript
{
  date: "2024-01-15",
  time: "10:00",
  dateTime: "2024-01-15 10:00",
  label: "15/01/2024 at 10:00",
  availableBarberCount: 3,
  service: { id, name, duration },
  barber: { id, name } || null,
  isAutoAssign: boolean,
  chooseBarberManually: boolean,
  selectedBarberInStep: object || null
}
```

## Styling and UX

### CSS Classes
- `.barber-choice-toggle`: Main container for the choice toggle
- `.auto-mode` / `.manual-mode`: Different styles for each mode
- `.barber-selection-in-time-step`: Container for barber selection
- `.slot-button`: Enhanced slot button styling
- `.fade-in` / `.slide-in`: Animation classes

### Visual Feedback
- **Disabled slots**: Grayed out and non-clickable when barber not selected in manual mode
- **Mode indicators**: Different background colors for auto vs manual mode
- **Loading states**: Smooth transitions when switching between modes
- **Hover effects**: Enhanced button interactions

## Benefits

1. **Streamlined Flow**: Reduces the number of steps for users who want to choose a specific barber
2. **Flexibility**: Maintains both auto-assignment and manual selection options
3. **Better UX**: Immediate feedback on available slots based on barber choice
4. **Reduced Confusion**: Clear visual indicators for each mode
5. **Mobile Friendly**: Responsive design works well on all devices

## Testing

### Unit Tests
- BarberChoiceToggle component functionality
- Mode switching behavior
- Prop validation and callbacks

### Integration Tests
- Full booking flow with both modes
- API integration for slot loading
- State management across components

### User Acceptance Tests
- Auto-assignment flow completion
- Manual barber selection flow completion
- Mode switching during booking process
- Error handling and edge cases
